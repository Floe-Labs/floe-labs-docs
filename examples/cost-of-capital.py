"""
Floe Credit API — Cost of Capital quote (FLO-530).

Walks an agent through a pre-borrow rate decision against the public
GET /v1/markets/:marketId/cost-of-capital endpoint:

  1. Quote-only call    — discover the rate floor + total liquidity.
  2. Implied-rate quote — what would I actually pay to borrow N right now?
  3. Insufficient-liquidity branch — interpret `impliedRateBps: null`.
  4. Decide              — accept the rate (call instant-borrow, see borrow.py)
                           or reject and wait.

Public endpoint — no signing required.

Usage:
  pip install requests
  python cost-of-capital.py
"""

import os
import sys
import requests

API_BASE = os.environ.get("FLOE_API_BASE", "https://credit-api.floelabs.xyz")
WETH_USDC_MARKET = "0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930"

# What the agent wants. USDC has 6 decimals so 1_000_000_000 raw == 1,000 USDC.
TARGET_BORROW_USDC_RAW = "1000000000"   # 1,000 USDC
DURATION_SECONDS = "2592000"            # 30 days

# Agent's rate ceiling. Reject any quote at or above this rate.
MAX_ACCEPTABLE_RATE_BPS = 1500          # 15% APR


def fetch_cost_of_capital(market_id, *, borrow_amount=None, duration=None):
    """GET /v1/markets/:marketId/cost-of-capital with optional query params."""
    params = {}
    if borrow_amount is not None:
        params["borrowAmount"] = borrow_amount
    if duration is not None:
        params["duration"] = duration

    url = f"{API_BASE}/v1/markets/{market_id}/cost-of-capital"
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


def fmt_rate(bps_str_or_none):
    """Format a basis-point rate as 'X.XX%' or '—' for null."""
    if bps_str_or_none is None:
        return "—"
    return f"{int(bps_str_or_none) / 100:.2f}%"


# NOTE: this script targets the WETH/USDC market, where the loan token
# (USDC) has 6 decimals. Multi-market tools must derive the loan-token
# decimals from /v1/markets metadata before formatting amounts; copying
# the bare 1e6 divisor below into a BTC- or ETH-denominated market would
# silently mis-scale every printed amount.


def main():
    # ── Step 1: quote-only ─────────────────────────────────────────────
    print("Step 1: Quote-only — discover the market floor")
    print("-" * 60)
    quote = fetch_cost_of_capital(WETH_USDC_MARKET)
    print(f"Best rate available: {fmt_rate(quote['bestRateBps'])}")
    print(f"Total liquidity:     {int(quote['availableLiquidity']) / 1e6:,.2f} USDC")
    print(f"Open offers:         {quote['offerCount']}")
    print()

    if quote["bestRateBps"] is None:
        print("No offers in this market right now. Wait or try a different market.")
        sys.exit(0)

    if int(quote["availableLiquidity"]) < int(TARGET_BORROW_USDC_RAW):
        print(
            "Market has insufficient liquidity for the target size. "
            "Wait for new lender intents to be posted."
        )
        sys.exit(0)

    # ── Step 2: implied rate at the target borrow size ─────────────────
    print(f"Step 2: Implied rate to borrow {int(TARGET_BORROW_USDC_RAW) / 1e6:,.0f} USDC")
    print("-" * 60)
    fill = fetch_cost_of_capital(
        WETH_USDC_MARKET,
        borrow_amount=TARGET_BORROW_USDC_RAW,
        duration=DURATION_SECONDS,
    )
    print(f"Best rate:    {fmt_rate(fill['bestRateBps'])}")
    print(f"Implied rate: {fmt_rate(fill['impliedRateBps'])}")

    breakdown = fill.get("impliedFillBreakdown") or []
    if breakdown:
        print("Fill plan:")
        for slice_ in breakdown:
            amount_usdc = int(slice_["amount"]) / 1e6
            print(f"  - {amount_usdc:>9,.2f} USDC @ {fmt_rate(slice_['rate'])}  ({slice_['offerHash']})")
    print()

    # ── Step 3: interpret a null implied rate ──────────────────────────
    if fill["impliedRateBps"] is None:
        # impliedRateBps is null when liquidity is insufficient OR when
        # borrowAmount was omitted. Step 2 always passes borrowAmount, so
        # null here unambiguously means liquidity shortfall.
        shortfall = int(TARGET_BORROW_USDC_RAW) - int(fill["availableLiquidity"])
        print(
            f"Liquidity shortfall: need {shortfall / 1e6:,.2f} more USDC.\n"
            "Either wait for new lender intents or downsize the borrow."
        )
        sys.exit(0)

    # ── Step 4: rate-acceptance decision ───────────────────────────────
    print("Step 4: Decision")
    print("-" * 60)
    implied = int(fill["impliedRateBps"])
    if implied >= MAX_ACCEPTABLE_RATE_BPS:
        print(
            f"REJECT — implied rate {fmt_rate(fill['impliedRateBps'])} "
            f">= ceiling {MAX_ACCEPTABLE_RATE_BPS / 100:.2f}%."
        )
        sys.exit(0)

    print(
        f"ACCEPT — implied rate {fmt_rate(fill['impliedRateBps'])} "
        f"is below the {MAX_ACCEPTABLE_RATE_BPS / 100:.2f}% ceiling.\n"
        "Proceed to instant-borrow (see examples/borrow.py for the full flow)."
    )


if __name__ == "__main__":
    main()
