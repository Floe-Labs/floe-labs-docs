/**
 * Floe Agent Awareness — Decision-loop demo.
 *
 * Answers the three rational-agent questions before paying for an API call:
 *   1. Do I have enough credit?
 *   2. Is this call worth its cost?
 *   3. Where am I in the loan lifecycle?
 *
 * Usage:
 *   FLOE_API_KEY=floe_... TARGET_URL=https://some-x402-api.com/data \
 *     npx tsx agent-awareness.ts
 *
 * Mirror of agent-awareness.py — same behavior, same output format.
 */

const API_KEY = process.env.FLOE_API_KEY;
if (!API_KEY) {
  console.error("Set FLOE_API_KEY=floe_... environment variable");
  process.exit(1);
}

const BASE = process.env.FLOE_API_BASE || "https://credit-api.floelabs.xyz";
const TARGET_URL = process.env.TARGET_URL || "https://some-x402-api.com/data";

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// Timeout-bounded fetch — bare fetch() can hang indefinitely on a stalled
// connection or unresponsive upstream, which is exactly what you don't want
// in a decision-loop demo that real callers might copy.
async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 30_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function get(path: string): Promise<any> {
  const r = await fetchWithTimeout(`${BASE}${path}`, { headers });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status} ${await r.text()}`);
  return r.json();
}

async function post(path: string, body: unknown): Promise<any> {
  const r = await fetchWithTimeout(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} → ${r.status} ${await r.text()}`);
  return r.json();
}

async function main(): Promise<void> {
  // Question 3 first — gate everything on loan state
  const state = await get("/v1/agents/loan-state");
  console.log(`\n[loan-state] ${state.state} — ${state.reason}`);
  if (state.state === "at_limit") {
    console.log("Skipping: agent is at_limit. Open another credit line or repay.");
    return;
  }
  if (state.state === "borrowing" || state.state === "repaying") {
    console.log("Skipping: pending capital movement. Try again shortly.");
    return;
  }

  // Question 2 — estimate cost AND reflect against agent state in one call
  const est = await post("/v1/x402/estimate", { url: TARGET_URL, method: "GET" });
  console.log(`\n[estimate] ${est.method} ${est.url}`);
  if (!est.x402) {
    console.log("URL is not x402-protected — call it directly.");
    return;
  }
  console.log(`  price: ${est.priceRaw} raw USDC (${est.network})`);
  console.log(`  cached: ${est.cached}`);

  // Fail-closed: if the API didn't return a reflection block, abort. The
  // reflection is what tells us whether the call would exceed available
  // credit or our session spend-limit; without it we have no decision basis,
  // so don't fall through to the paid call.
  const r = est.reflection;
  if (!r) {
    console.log("  ❌ estimate response missing reflection block — DO NOT CALL");
    return;
  }
  console.log(`  available: ${r.available}`);
  if (r.willExceedAvailable) {
    console.log("  ❌ would exceed available credit — DO NOT CALL");
    return;
  }
  if (r.willExceedSpendLimit) {
    console.log("  ❌ would exceed session spend-limit — DO NOT CALL");
    return;
  }
  if (r.willExceedHeadroom) {
    console.log("  ⚠️  would dip into auto-borrow headroom — proceeding (informational)");
  }

  // Question 1 was answered by the reflection block above. Proceed.
  console.log("\n[proxy/fetch] paying and calling target...");
  const paid = await post("/v1/proxy/fetch", { url: TARGET_URL, method: "GET" });
  console.log("  response:", JSON.stringify(paid).slice(0, 200));

  // After-call sanity check
  const remaining = await get("/v1/agents/credit-remaining");
  console.log(`\n[after] available: ${remaining.available}, utilization: ${remaining.utilizationBps} bps`);
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
