/**
 * Floe Credit API — Portfolio inspection (FLO-530).
 *
 * Walks an agent through reading its credit portfolio via
 * GET /v1/positions/:wallet:
 *
 *   1. Indexer-mode read (default) — fast; fine for "what do I owe".
 *                                     `worstHealthFactor` is null because the
 *                                     indexer returns origination LTV which
 *                                     doesn't reflect price movement.
 *   2. Live-mode read    (?live=true) — slower, fully on-chain. Health factor
 *                                       is computed against the live oracle.
 *   3. includePending     — surface borrow intents that haven't matched yet.
 *   4. Pagination         — loop with ?skip= until activeLoanCount < limit.
 *   5. 503 handling       — what to do when the API instance has no indexer.
 *
 * Usage:
 *   npm install viem
 *   PRIVATE_KEY=0x... npx tsx positions.ts
 */

import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

// ── Config ──

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
if (!PRIVATE_KEY) {
  console.error("Set PRIVATE_KEY=0x... environment variable");
  process.exit(1);
}

const API_BASE = process.env.FLOE_API_BASE ?? "https://credit-api.floelabs.xyz";

// Wallet whose portfolio we want to read. Defaults to the signer's own.
// Any authenticated caller can query any wallet's positions today.
const TARGET_WALLET = process.env.TARGET_WALLET as `0x${string}` | undefined;

// Pagination — small for the example so the loop is exercised on
// realistic portfolios. Production callers can use the API's defaults.
const PAGE_LIMIT = 5;

// ── Setup ──

const account = privateKeyToAccount(PRIVATE_KEY);
const targetWallet = TARGET_WALLET ?? account.address;

interface PositionsSummary {
  activeLoanCount: number;
  totalPrincipal: string;
  totalDebt: string;
  totalCollateralLocked: string;
  weightedAvgInterestRateBps: string | null;
  worstHealthFactor: number | null;
  nextMaturityAt: string | null;
  perCollateralToken: Record<string, string>;
}

interface BorrowIntentSummary {
  offerHash: string;
  marketId: string;
  borrowAmount: string;
  collateralAmount: string;
  maxInterestRateBps: string;
  minLtvBps: string;
  expiry: string;
  status: string;
}

interface CreditPositions {
  account: string;
  positions: Array<{
    loanId: string;
    totalDebt: string;
    bufferBps: string;
    [k: string]: unknown;
  }>;
  summary: PositionsSummary;
  pendingBorrowIntents?: BorrowIntentSummary[];
  source: "indexer" | "chain";
  ltvStale: boolean;
  indexerBlockNumber: string | null;
  fetchedAt: number;
}

// ── Auth helper (mirrors examples/borrow.ts) ──

async function signRequest(): Promise<Record<string, string>> {
  // Mirrors the helper in examples/borrow.ts. Keep them in lockstep
  // when the message format changes.
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `Floe Credit API\nTimestamp: ${timestamp}`;
  const signature = await account.signMessage({ message });
  return {
    "X-Wallet-Address": account.address,
    "X-Signature": signature,
    "X-Timestamp": timestamp,
  };
}

interface GetPositionsOpts {
  live?: boolean;
  includePending?: boolean;
  limit?: number;
  skip?: number;
  pendingLimit?: number;
}

async function getPositions(
  wallet: string,
  opts: GetPositionsOpts = {},
): Promise<CreditPositions> {
  const url = new URL(`${API_BASE}/v1/positions/${wallet}`);
  if (opts.live) url.searchParams.set("live", "true");
  if (opts.includePending) url.searchParams.set("includePending", "true");
  if (opts.limit !== undefined) url.searchParams.set("limit", String(opts.limit));
  if (opts.skip !== undefined) url.searchParams.set("skip", String(opts.skip));
  if (opts.pendingLimit !== undefined) {
    url.searchParams.set("pendingLimit", String(opts.pendingLimit));
  }

  const resp = await fetch(url, { headers: await signRequest() });

  if (resp.status === 503) {
    // The API instance was started without an Envio indexer endpoint.
    // getPositions cannot run without it (chain-only fallback would
    // be too slow). Retry against a different instance or surface to
    // the operations team.
    throw new Error(
      `503 — indexer not configured on ${API_BASE}. Try a different API instance.`,
    );
  }
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
  }
  return (await resp.json()) as CreditPositions;
}

function fmtRate(bps: string | null | undefined): string {
  if (bps == null) return "—";
  return `${(Number(bps) / 100).toFixed(2)}%`;
}

function fmtUsdc(raw: string | bigint): string {
  const n = typeof raw === "string" ? BigInt(raw) : raw;
  return `${(Number(n) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`;
}

function fmtHealth(hf: number | null): string {
  if (hf === null) return "n/a (indexer mode)";
  let tag: string;
  if (hf >= 2.0) tag = "safe";
  else if (hf >= 1.2) tag = "ok";
  else if (hf > 1.0) tag = "tight";
  else tag = "LIQUIDATABLE";
  return `${hf.toFixed(3)} (${tag})`;
}

function printSummary(label: string, body: CreditPositions): void {
  const s = body.summary;
  console.log(`--- ${label} ---`);
  console.log(`  source              : ${body.source}`);
  console.log(`  ltvStale            : ${body.ltvStale}`);
  console.log(`  indexerBlockNumber  : ${body.indexerBlockNumber}`);
  console.log(`  active loans        : ${s.activeLoanCount}`);
  console.log(`  total debt          : ${fmtUsdc(s.totalDebt)}`);
  console.log(`  weighted-avg rate   : ${fmtRate(s.weightedAvgInterestRateBps)}`);
  console.log(`  worst health factor : ${fmtHealth(s.worstHealthFactor)}`);
  if (s.nextMaturityAt) {
    console.log(`  next maturity       : ${s.nextMaturityAt} (unix)`);
  }
  console.log();
}

async function main(): Promise<void> {
  console.log(`Signer:  ${account.address}`);
  console.log(`Target:  ${targetWallet}`);
  console.log(`API:     ${API_BASE}`);
  console.log();

  // ── Step 1: indexer-mode read ──────────────────────────────────────
  let body = await getPositions(targetWallet);
  printSummary("Step 1: indexer mode (default)", body);

  // The summary's worstHealthFactor is intentionally null in indexer
  // mode. Calling code that drives liquidation alarms should always
  // use live mode (Step 2).

  // ── Step 2: live-mode read ─────────────────────────────────────────
  body = await getPositions(targetWallet, { live: true });
  printSummary("Step 2: live mode (?live=true)", body);

  // ── Step 3: include pending borrow intents ─────────────────────────
  body = await getPositions(targetWallet, { includePending: true });
  const pending = body.pendingBorrowIntents ?? [];
  console.log(`--- Step 3: pending borrow intents (${pending.length}) ---`);
  for (const intent of pending.slice(0, 5)) {
    console.log(
      `  • ${intent.offerHash}  ` +
        `borrow=${fmtUsdc(intent.borrowAmount)}  ` +
        `max=${fmtRate(intent.maxInterestRateBps)}  ` +
        `expires=${intent.expiry}`,
    );
  }
  if (pending.length > 5) {
    console.log(`  … and ${pending.length - 5} more`);
  }
  console.log();

  // ── Step 4: paginate ───────────────────────────────────────────────
  // Per the API contract, paginate as long as `loans.length === limit`
  // (the page is "full"). Don't gate on summary.activeLoanCount —
  // that's the wallet-wide total and stays constant across pages.
  console.log(`--- Step 4: paginate active loans (page size ${PAGE_LIMIT}) ---`);
  let seen = 0;
  let skip = 0;
  while (true) {
    const page = await getPositions(targetWallet, { limit: PAGE_LIMIT, skip });
    const loans = page.positions;
    for (const loan of loans) {
      seen += 1;
      console.log(
        `  loan #${loan.loanId}: ` +
          `debt=${fmtUsdc(loan.totalDebt)}, ` +
          `buffer=${fmtRate(loan.bufferBps)}`,
      );
    }
    if (loans.length < PAGE_LIMIT) break;
    skip += PAGE_LIMIT;
  }
  console.log(`  total surfaced via pagination: ${seen}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
