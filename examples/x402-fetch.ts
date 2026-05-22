/**
 * Floe x402 Credit Facilitator — Pay for x402 APIs with Floe credit.
 *
 * Usage:
 *   FLOE_API_KEY=floe_... npx tsx x402-fetch.ts
 *
 * This script:
 *   1. Checks your balance
 *   2. Previews the cost of an x402 API call
 *   3. Makes the paid call through the facilitator
 *   4. Shows the response and updated balance
 */

const API_KEY = process.env.FLOE_API_KEY;
if (!API_KEY) {
  console.error("Set FLOE_API_KEY=floe_... environment variable");
  process.exit(1);
}

const BASE = "https://credit-api.floelabs.xyz/v1";
const TARGET_URL = process.env.TARGET_URL || "https://some-x402-api.com/data";

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// ── 1. Check balance ──
//
// `spendableRaw` is what the proxy will let you actually pay with.
// `creditAvailableRaw` is borrowing headroom (NOT spendable on its own —
// the facility loan has to be drawn first). `walletUsdcRaw` is the
// on-chain USDC sitting in the Privy wallet. Reading `creditAvailableRaw`
// and assuming it's spendable is the most common /balance mistake.
console.log("1. Checking balance...");
const balanceResp = await fetch(`${BASE}/agents/balance`, { headers });
const balance = (await balanceResp.json()) as any;
const spendable = balance.spendableRaw ?? balance.balance ?? "0";
const headroom = balance.creditAvailableRaw ?? balance.creditAvailable ?? "0";
const walletUsdc = balance.walletUsdcRaw;
console.log(`   Spendable now:       ${(Number(spendable) / 1e6).toFixed(2)} USDC`);
console.log(`   Borrowing headroom:  ${(Number(headroom) / 1e6).toFixed(2)} USDC`);
if (walletUsdc != null) {
  console.log(`   Wallet USDC (chain): ${(Number(walletUsdc) / 1e6).toFixed(2)} USDC`);
}
console.log();

// ── 2. Check if the target URL requires payment ──
console.log(`2. Checking ${TARGET_URL}...`);
const checkResp = await fetch(`${BASE}/proxy/check?url=${encodeURIComponent(TARGET_URL)}`);
const check = (await checkResp.json()) as any;

if (!check.x402) {
  console.log(`   This URL is free (status ${check.status})`);
} else {
  const amount = Number(check.payment.amount);
  console.log(`   x402 payment required: ${(amount / 1e6).toFixed(4)} USDC`);
  console.log(`   Payment to: ${check.payment.payTo}`);
}
console.log();

// ── 3. Make the call ──
console.log("3. Making the call through the facilitator...");
const resp = await fetch(`${BASE}/proxy/fetch`, {
  method: "POST",
  headers,
  body: JSON.stringify({ url: TARGET_URL, method: "GET" }),
});

if (resp.status === 402) {
  const err = (await resp.json()) as any;
  console.log("   Insufficient balance!");
  console.log(`   Available: ${(Number(err.available) / 1e6).toFixed(2)} USDC`);
  console.log(`   Required:  ${(Number(err.required) / 1e6).toFixed(4)} USDC`);
  console.log(`   Top up at https://dev-dashboard.floelabs.xyz (card / Apple Pay / bank).`);
  process.exit(1);
}

if (resp.status === 502) {
  const rawErr = await resp.text();
  let err: any = {};
  try {
    err = JSON.parse(rawErr);
  } catch {}
  if (err.error === "upstream_paid_request_failed_ambiguous") {
    // DO NOT retry — that may double-charge. Poll the per-reservation
    // endpoint until it resolves to settled / payment_rejected / expired_unsettled.
    const nonce = err.reservation.nonce;
    console.log(`   Ambiguous payment — polling reservation ${nonce}...`);
    for (let i = 0; i < 450; i++) {
      const resv = await fetch(`${BASE}/agents/reservations/${encodeURIComponent(nonce)}`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      if (resv.status === 404) {
        await new Promise(s => setTimeout(s, 2000));
        continue;
      }
      if (!resv.ok) {
        const body = (await resv.text()).slice(0, 200);
        throw new Error(`reservation lookup failed (${resv.status}): ${body}`);
      }
      const r = (await resv.json()) as any;
      if (r.terminal) {
        console.log(`   Reservation ${r.state}${r.txHash ? ` (tx ${r.txHash})` : ""}`);
        process.exit(r.state === "settled" ? 0 : 1);
      }
      await new Promise(s => setTimeout(s, 2000));
    }
    console.error("   Reservation did not settle within 15 minutes.");
    process.exit(1);
  }
  console.error(`   Error (${resp.status}): ${rawErr.slice(0, 200)}`);
  process.exit(1);
}

if (!resp.ok) {
  console.error(`   Error (${resp.status}): ${(await resp.text()).slice(0, 200)}`);
  process.exit(1);
}

const body = await resp.text();
console.log(`   Success! Status: ${resp.status}`);
console.log(`   Response: ${body.slice(0, 500)}\n`);

// ── 4. Check updated balance ──
console.log("4. Updated balance:");
const updatedResp = await fetch(`${BASE}/agents/balance`, { headers });
const updated = (await updatedResp.json()) as any;
const updatedSpendable = updated.spendableRaw ?? updated.balance ?? "0";
console.log(`   Spendable now: ${(Number(updatedSpendable) / 1e6).toFixed(2)} USDC`);
