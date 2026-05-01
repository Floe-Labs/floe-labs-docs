/**
 * Floe Credit API — Cost of Capital quote (FLO-530).
 *
 * Walks an agent through a pre-borrow rate decision against the public
 * GET /v1/markets/:marketId/cost-of-capital endpoint:
 *
 *   1. Quote-only call    — discover the rate floor + total liquidity.
 *   2. Implied-rate quote — what would I actually pay to borrow N right now?
 *   3. Insufficient-liquidity branch — interpret `impliedRateBps: null`.
 *   4. Decide              — accept the rate (call instant-borrow, see
 *                            borrow.ts) or reject and wait.
 *
 * Public endpoint — no signing required.
 *
 * Usage:
 *   npx tsx cost-of-capital.ts
 */

const API_BASE = process.env.FLOE_API_BASE ?? "https://credit-api.floelabs.xyz";
const WETH_USDC_MARKET =
  "0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930";

// What the agent wants. USDC has 6 decimals so 1_000_000_000 raw == 1,000 USDC.
const TARGET_BORROW_USDC_RAW = 1_000_000_000n; // 1,000 USDC
const DURATION_SECONDS = 2_592_000n; // 30 days

// Agent's rate ceiling. Reject any quote at or above this rate.
const MAX_ACCEPTABLE_RATE_BPS = 1500n; // 15% APR

interface CostOfCapitalResponse {
  marketId: string;
  bestRateBps: string | null;
  impliedRateBps: string | null;
  impliedFillBreakdown?: { offerHash: string; rate: string; amount: string }[];
  availableLiquidity: string;
  offerCount: number;
  fetchedAt: number;
}

async function fetchCostOfCapital(
  marketId: string,
  opts: { borrowAmount?: bigint; duration?: bigint } = {},
): Promise<CostOfCapitalResponse> {
  const url = new URL(`${API_BASE}/v1/markets/${marketId}/cost-of-capital`);
  if (opts.borrowAmount !== undefined) {
    url.searchParams.set("borrowAmount", opts.borrowAmount.toString());
  }
  if (opts.duration !== undefined) {
    url.searchParams.set("duration", opts.duration.toString());
  }
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
  }
  return (await resp.json()) as CostOfCapitalResponse;
}

function fmtRate(bps: string | null): string {
  if (bps === null) return "—";
  return `${(Number(bps) / 100).toFixed(2)}%`;
}

function fmtUsdc(raw: string | bigint): string {
  const n = typeof raw === "string" ? BigInt(raw) : raw;
  // 6 decimals — keep two of them for display.
  return `${(Number(n) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`;
}

// NOTE: this script targets the WETH/USDC market, where the loan token
// (USDC) has 6 decimals. Multi-market tools must derive the loan-token
// decimals from /v1/markets metadata before formatting amounts; copying
// the bare 1e6 divisor above into a BTC- or ETH-denominated market would
// silently mis-scale every printed amount.

async function main(): Promise<void> {
  // ── Step 1: quote-only ───────────────────────────────────────────
  console.log("Step 1: Quote-only — discover the market floor");
  console.log("-".repeat(60));
  const quote = await fetchCostOfCapital(WETH_USDC_MARKET);
  console.log(`Best rate available: ${fmtRate(quote.bestRateBps)}`);
  console.log(`Total liquidity:     ${fmtUsdc(quote.availableLiquidity)}`);
  console.log(`Open offers:         ${quote.offerCount}`);
  console.log();

  if (quote.bestRateBps === null) {
    console.log("No offers in this market right now. Wait or try a different market.");
    return;
  }

  if (BigInt(quote.availableLiquidity) < TARGET_BORROW_USDC_RAW) {
    console.log(
      "Market has insufficient liquidity for the target size. " +
        "Wait for new lender intents to be posted.",
    );
    return;
  }

  // ── Step 2: implied rate at the target borrow size ───────────────
  console.log(`Step 2: Implied rate to borrow ${fmtUsdc(TARGET_BORROW_USDC_RAW)}`);
  console.log("-".repeat(60));
  const fill = await fetchCostOfCapital(WETH_USDC_MARKET, {
    borrowAmount: TARGET_BORROW_USDC_RAW,
    duration: DURATION_SECONDS,
  });
  console.log(`Best rate:    ${fmtRate(fill.bestRateBps)}`);
  console.log(`Implied rate: ${fmtRate(fill.impliedRateBps)}`);

  if (fill.impliedFillBreakdown && fill.impliedFillBreakdown.length > 0) {
    console.log("Fill plan:");
    for (const fillSlice of fill.impliedFillBreakdown) {
      console.log(
        `  - ${fmtUsdc(fillSlice.amount).padStart(15)} @ ${fmtRate(fillSlice.rate)}  (${fillSlice.offerHash})`,
      );
    }
  }
  console.log();

  // ── Step 3: interpret a null implied rate ─────────────────────────
  if (fill.impliedRateBps === null) {
    // impliedRateBps is null when liquidity is insufficient OR when
    // borrowAmount was omitted. Step 2 always passes borrowAmount, so
    // null here unambiguously means liquidity shortfall.
    const shortfall = TARGET_BORROW_USDC_RAW - BigInt(fill.availableLiquidity);
    console.log(
      `Liquidity shortfall: need ${fmtUsdc(shortfall)} more.\n` +
        "Either wait for new lender intents or downsize the borrow.",
    );
    return;
  }

  // ── Step 4: rate-acceptance decision ──────────────────────────────
  console.log("Step 4: Decision");
  console.log("-".repeat(60));
  const implied = BigInt(fill.impliedRateBps);
  if (implied >= MAX_ACCEPTABLE_RATE_BPS) {
    console.log(
      `REJECT — implied rate ${fmtRate(fill.impliedRateBps)} ` +
        `>= ceiling ${fmtRate(MAX_ACCEPTABLE_RATE_BPS.toString())}.`,
    );
    return;
  }

  console.log(
    `ACCEPT — implied rate ${fmtRate(fill.impliedRateBps)} ` +
      `is below the ${fmtRate(MAX_ACCEPTABLE_RATE_BPS.toString())} ceiling.\n` +
      "Proceed to instant-borrow (see examples/borrow.ts for the full flow).",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
