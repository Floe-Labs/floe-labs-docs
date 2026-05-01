/**
 * Floe Credit API — Borrow USDC with ETH collateral on Base.
 *
 * Demonstrates the full FLO-529 production flow:
 *   - Idempotency-Key on POST /v1/credit/instant-borrow (retry-safe)
 *   - attemptId capture from the response
 *   - Signed txs broadcast via /v1/tx/broadcast with attempt_id + phase
 *     (so the API can drive the borrow-attempt state machine and persist
 *     the txHash before the receipt to survive 60s wait timeouts)
 *   - Recovery branch: on match-phase failure, inspect attempt status
 *     via GET /borrow-attempts/:id and either resume or abandon
 *
 * Usage:
 *   npm install viem
 *   PRIVATE_KEY=0x... npx tsx borrow.ts
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
  type TransactionSerializable,
} from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { randomUUID } from "node:crypto";

// ── Config ──

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
if (!PRIVATE_KEY) {
  console.error("Set PRIVATE_KEY=0x... environment variable");
  process.exit(1);
}

const API_BASE = "https://credit-api.floelabs.xyz";
const WETH_USDC_MARKET =
  "0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930";

const BORROW_AMOUNT = "5000000000"; // $5,000 USDC
const COLLATERAL_AMOUNT = "2000000000000000000"; // 2 ETH
const MAX_RATE_BPS = "1200"; // Up to 12% APR
const DURATION = "2592000"; // 30 days

// ── Setup ──

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: base, transport: http() });
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

// ── Types matching the API response shape ──

type UnsignedTx = {
  to: Hex;
  data: Hex;
  value: string;
  chainId: number;
  description: string;
  optional?: boolean;
};

type CreateAttemptResponse = {
  attemptId: string;
  status: string;
  reused: boolean;
  transactions: UnsignedTx[];
  selectedOffer?: { offerHash: string; minInterestRateBps: string };
};

type AttemptStatus = {
  attemptId: string;
  status: string;
  loanId: string | null; // real on-chain loanId once active
  borrowIntentHash: string | null;
  registerTxHash: string | null;
  matchTxHash: string | null;
  lastError: string | null;
};

// ── Helpers ──

/**
 * Sign one of the unsigned transactions returned by the API and broadcast it
 * via /v1/tx/broadcast with attempt_id + phase. The broadcast endpoint
 * persists the txHash on the attempt row BEFORE awaiting the receipt, so a
 * 60s wait timeout no longer drops the hash on the floor.
 */
async function signAndBroadcast(
  tx: UnsignedTx,
  attemptId: string,
  phase: "register" | "match",
  authHeaders: Record<string, string>,
): Promise<{ transactionHash: Hex; status: "confirmed" | "reverted" }> {
  // Build a viem-serializable tx with chain-aware fee fields.
  const nonce = await publicClient.getTransactionCount({ address: account.address });
  const fees = await publicClient.estimateFeesPerGas();
  const gas = await publicClient.estimateGas({
    account: account.address,
    to: tx.to,
    data: tx.data,
    value: BigInt(tx.value),
  });
  const serializable: TransactionSerializable = {
    chainId: tx.chainId,
    to: tx.to,
    data: tx.data,
    value: BigInt(tx.value),
    nonce,
    gas,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    type: "eip1559",
  };
  // signTransaction returns the fully serialized signed tx hex — exactly
  // what /v1/tx/broadcast's signed_transaction_hex expects.
  const signedHex = await account.signTransaction(serializable);

  const resp = await fetch(`${API_BASE}/v1/tx/broadcast`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      signed_transaction_hex: signedHex,
      attempt_id: attemptId,
      phase,
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(
      `broadcast(${phase}) failed: ${resp.status} ${err.error ?? ""} ${err.message ?? ""}`,
    );
  }
  return resp.json() as Promise<{ transactionHash: Hex; status: "confirmed" | "reverted" }>;
}

/**
 * Recovery branch. Called when the match-phase broadcast fails or returns an
 * unexpected status. Inspects the attempt and either resumes (fetches a fresh
 * match tx and retries) or abandons (revokes the on-chain intent).
 *
 * IMPORTANT: never auto-abandon a row in `matching` status. `matching` means
 * the match tx was already submitted on-chain (the broadcast endpoint
 * persisted the txHash before awaiting receipt). The receipt may still be
 * mining — calling /abandon now would race with on-chain confirmation and
 * create row-vs-chain divergence. Poll briefly; if still `matching` after
 * the wait, surface a warning and exit non-zero so the operator can
 * inspect the match tx hash manually.
 *
 * Returns true if the loan ended up active, false if abandoned/terminal/stuck.
 */
async function recoverIfNeeded(
  attemptId: string,
  authHeaders: Record<string, string>,
): Promise<boolean> {
  const status = await pollAttemptUntilSettled(attemptId, authHeaders);
  if (!status) return false;
  console.log(`   recovery: attempt is in status='${status.status}'`);

  if (status.status === "active") {
    console.log(`   recovery: loan already active (loanId=${status.loanId})`);
    return true;
  }

  if (status.status === "matching") {
    // Polling timed out without the receipt resolving the row. The match tx
    // may still confirm on-chain; the operator should check
    // `status.matchTxHash` on a block explorer before doing anything else.
    console.warn(
      `   recovery: stuck in 'matching' (matchTxHash=${status.matchTxHash}). ` +
        `Check the tx on-chain manually — DO NOT call /abandon while the match tx is live.`,
    );
    return false;
  }

  if (status.status !== "pending_match") {
    // Definitively terminal-non-active (funding_failed, match_failed,
    // abandoned, expired) or pre-register (pending_funding,
    // pending_on_chain). Calling /abandon is safe: it idempotently
    // revokes any on-chain intent and resets the allowance.
    return abandon(attemptId, authHeaders);
  }

  // Try resume: ask the API for a fresh match tx using the same registered
  // borrow intent. Returns 409 if the lend offer is no longer matchable —
  // in that case fall through to abandon.
  const resumeResp = await fetch(
    `${API_BASE}/v1/credit/borrow-attempts/${attemptId}/resume`,
    { method: "POST", headers: authHeaders },
  );
  if (!resumeResp.ok) {
    const err = await resumeResp.json().catch(() => ({}));
    console.log(`   recovery: /resume returned ${resumeResp.status} (code=${err.code})`);
    if (err.code === "lend_intent_revoked" || err.code === "lend_intent_expired" || err.code === "lend_intent_insufficient") {
      return abandon(attemptId, authHeaders);
    }
    return false;
  }

  const { transactions } = (await resumeResp.json()) as { transactions: UnsignedTx[] };
  const matchTx = transactions[0];
  console.log(`   recovery: resuming with fresh match tx`);
  const result = await signAndBroadcast(matchTx, attemptId, "match", authHeaders);
  return result.status === "confirmed";
}

/**
 * Fetch /borrow-attempts/:id, polling up to ~30s while status is `matching`
 * to give an in-flight match receipt time to land. Returns the latest
 * status, or undefined on a hard fetch error.
 *
 * Polling is bounded — the server has no obligation to advance from
 * `matching` without help (the match-phase has no reconciler today; the
 * eventual fallback is the expiry sweep). We poll just long enough that
 * a slow Base block doesn't trigger the warning path on a healthy attempt.
 */
async function pollAttemptUntilSettled(
  attemptId: string,
  authHeaders: Record<string, string>,
  maxAttempts = 6,
  delayMs = 5000,
): Promise<AttemptStatus | undefined> {
  for (let i = 0; i < maxAttempts; i++) {
    const resp = await fetch(
      `${API_BASE}/v1/credit/borrow-attempts/${attemptId}`,
      { headers: authHeaders },
    );
    if (!resp.ok) {
      console.error(`   recovery: GET /borrow-attempts/${attemptId} failed (${resp.status})`);
      return undefined;
    }
    const status = (await resp.json()) as AttemptStatus;
    if (status.status !== "matching") return status;
    if (i < maxAttempts - 1) {
      console.log(`   recovery: status='matching' — waiting ${delayMs}ms for receipt...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  // Last fetch already done above on the final iteration if we didn't
  // return early; re-fetch once to return the freshest snapshot.
  const finalResp = await fetch(
    `${API_BASE}/v1/credit/borrow-attempts/${attemptId}`,
    { headers: authHeaders },
  );
  if (!finalResp.ok) return undefined;
  return (await finalResp.json()) as AttemptStatus;
}

/**
 * Walk the abandon flow: get unsigned revoke (+ optional approve(0)) txs from
 * the API and broadcast them. Returns false (loan never went active).
 */
async function abandon(
  attemptId: string,
  authHeaders: Record<string, string>,
): Promise<false> {
  console.log(`   recovery: calling /abandon to clean up`);
  const resp = await fetch(
    `${API_BASE}/v1/credit/borrow-attempts/${attemptId}/abandon`,
    { method: "POST", headers: authHeaders },
  );
  if (!resp.ok) {
    console.error(`   abandon failed: ${resp.status}`);
    return false;
  }
  const { transactions } = (await resp.json()) as { transactions: UnsignedTx[] };
  // Broadcast every tx the API returned, including the one marked
  // `optional: true` (the approve(matcher, 0) reset). Skipping it would
  // leave the matcher's collateral allowance set forever, which is a
  // standing approval an attacker could theoretically exploit if the
  // matcher contract were later compromised. Production hygiene >
  // saving one approval's worth of gas. If your environment really
  // doesn't want to pay for the cleanup, swap this loop for one that
  // checks `tx.optional` and skips with explicit acknowledgement.
  for (const tx of transactions) {
    // For abandon we don't pass attempt_id+phase — the row is already
    // marked abandoned by the API and there's no further state to drive.
    const nonce = await publicClient.getTransactionCount({ address: account.address });
    const fees = await publicClient.estimateFeesPerGas();
    const hash = await walletClient.sendTransaction({
      to: tx.to,
      data: tx.data,
      value: BigInt(tx.value),
      nonce,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    });
    const tag = tx.optional ? `${tx.description} (optional)` : tx.description;
    console.log(`   abandon: ${tag}: ${hash}`);
    await publicClient.waitForTransactionReceipt({ hash });
  }
  return false;
}

// ── Main flow ──

async function main(): Promise<void> {
  console.log(`Wallet:     ${account.address}`);
  console.log(`Borrow:     ${Number(BORROW_AMOUNT) / 1e6} USDC`);
  console.log(`Collateral: ${Number(COLLATERAL_AMOUNT) / 1e18} ETH\n`);

  // Step 1: Authenticate.
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `Floe Credit API\nTimestamp: ${timestamp}`;
  const signature = await account.signMessage({ message });
  const authHeaders: Record<string, string> = {
    "X-Wallet-Address": account.address,
    "X-Signature": signature,
    "X-Timestamp": timestamp,
  };

  // Step 2: Resolve an idempotency key. A network retry of the
  // /instant-borrow call with the same key returns the cached attempt
  // instead of registering a second on-chain intent. UUID v4 is the
  // recommended shape (Stripe-compatible).
  //
  // Crash recovery requires the SAME key across re-runs. We read
  // IDEMPOTENCY_KEY from the env first; only mint a fresh UUID when
  // none is supplied. To recover from a crash, run again with
  // IDEMPOTENCY_KEY=<key from previous run>.
  const idempotencyKey = process.env.IDEMPOTENCY_KEY ?? randomUUID();
  console.log(`Idempotency-Key: ${idempotencyKey}`);
  if (!process.env.IDEMPOTENCY_KEY) {
    console.log(
      "   (newly minted — set IDEMPOTENCY_KEY=" +
        idempotencyKey +
        " to retry/recover this exact attempt later)",
    );
  }
  console.log();

  // Step 3: POST /v1/credit/instant-borrow.
  console.log("1. Building borrow transactions...");
  const borrowResp = await fetch(`${API_BASE}/v1/credit/instant-borrow`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      marketId: WETH_USDC_MARKET,
      borrowAmount: BORROW_AMOUNT,
      collateralAmount: COLLATERAL_AMOUNT,
      maxInterestRateBps: MAX_RATE_BPS,
      duration: DURATION,
      maxLtvBps: "7500",
    }),
  });

  if (borrowResp.status === 404) {
    const err = await borrowResp.json();
    console.log(`   No liquidity: ${err.message}`);
    process.exit(1);
  }
  if (!borrowResp.ok) {
    const err = await borrowResp.json();
    console.error(`   Error: ${err.error} — ${err.message}`);
    process.exit(1);
  }

  const result = (await borrowResp.json()) as CreateAttemptResponse;
  console.log(`   attemptId: ${result.attemptId}`);
  console.log(`   status:    ${result.status}`);
  if (result.reused) {
    console.log("   (reused existing attempt — see GET /borrow-attempts/:id for state)");
    // For a reused attempt the txs are not returned. Drop into the recovery
    // branch which will figure out where to pick up.
    const ok = await recoverIfNeeded(result.attemptId, authHeaders);
    process.exit(ok ? 0 : 1);
  }
  console.log(`   ${result.transactions.length} transactions to submit`);
  if (result.selectedOffer) {
    console.log(
      `   matched at ${Number(result.selectedOffer.minInterestRateBps) / 100}% APR\n`,
    );
  }

  // Step 4: Pull out the txs by description. The API returns:
  //   - optionally an "Approve collateral" tx (only if existing allowance < required)
  //   - "Register borrow intent"
  //   - "Match loan intents"
  const approveTx = result.transactions.find((t) =>
    t.description.toLowerCase().includes("approve"),
  );
  const registerTx = result.transactions.find((t) =>
    t.description.toLowerCase().includes("register"),
  );
  const matchTx = result.transactions.find((t) =>
    t.description.toLowerCase().includes("match"),
  );
  if (!registerTx || !matchTx) {
    console.error("   missing register/match tx in response");
    process.exit(1);
  }

  // Step 5: ERC-20 approve (if needed). No attempt_id — this is a plain
  // ERC-20 call and not part of the borrow_attempt state machine.
  if (approveTx) {
    console.log("\n2. Approving collateral...");
    const hash = await walletClient.sendTransaction({
      to: approveTx.to,
      data: approveTx.data,
      value: BigInt(approveTx.value),
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   approve: ${hash} OK`);
  }

  // Step 6: Register borrow intent. attempt_id+phase=register so the API
  // persists registerTxHash + transitions pending_funding -> pending_on_chain
  // before awaiting the receipt.
  console.log("\n3. Registering borrow intent...");
  const reg = await signAndBroadcast(registerTx, result.attemptId, "register", authHeaders);
  console.log(`   register: ${reg.transactionHash} ${reg.status}`);
  if (reg.status !== "confirmed") {
    console.error("   register reverted; the attempt is now funding_failed.");
    process.exit(1);
  }

  // Step 7: Match. Wrapped in try/catch so any failure routes to the
  // recovery branch, which can resume or abandon as appropriate.
  console.log("\n4. Matching loan intents...");
  try {
    const m = await signAndBroadcast(matchTx, result.attemptId, "match", authHeaders);
    if (m.status !== "confirmed") {
      console.log(`   match reverted: ${m.transactionHash}`);
      const recovered = await recoverIfNeeded(result.attemptId, authHeaders);
      process.exit(recovered ? 0 : 1);
    }
    console.log(`   match: ${m.transactionHash} ${m.status}`);
  } catch (e) {
    console.log(`   match broadcast threw: ${(e as Error).message}`);
    const recovered = await recoverIfNeeded(result.attemptId, authHeaders);
    process.exit(recovered ? 0 : 1);
  }

  // Step 8: Confirm via GET — surfaces the real on-chain loanId.
  console.log("\n5. Confirming...");
  const finalResp = await fetch(
    `${API_BASE}/v1/credit/borrow-attempts/${result.attemptId}`,
    { headers: authHeaders },
  );
  const finalStatus = (await finalResp.json()) as AttemptStatus;
  console.log(`   final status: ${finalStatus.status}`);
  console.log(`   on-chain loanId: ${finalStatus.loanId ?? "(not yet active)"}`);
  console.log("\nDone! USDC is in your wallet.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
