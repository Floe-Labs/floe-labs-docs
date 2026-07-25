---
icon: hand-holding-dollar
---

# Working capital (on-chain) `Roadmap`

> **Status: roadmap — not generally available.** Borrowing USDC working capital against on-chain collateral, as a product you call directly, is **not live**. This page describes the **planned** Advanced / self-custody on-chain credit surface. The live way to give an agent money is the [walletless Floe-managed balance](../getting-started/quickstart.md) — fund with a card, pay for x402 APIs through the proxy. (Note: the facilitator already uses an on-chain funding mechanism to settle your payments today — see [How Floe works under the hood](../getting-started/core-concepts.md) — but you do not borrow, set rates, or manage loans yourself.) Code and rates below are illustrative of the planned API, not a live quickstart.

The planned model: credit against on-chain collateral — one API call, fixed rate, fixed term, per-loan isolated escrow.

---

## The 5 credit-facility actions (planned)

| Action | Use |
|---|---|
| `instant_borrow` | One-call borrow — auto-selects best lender, approves, registers, matches |
| `repay_and_reborrow` | Repay an open loan and instantly take a fresh one. Atomic. |
| `check_credit_status` | Loan health, balance, interest accrued, time to expiry |
| `request_credit` | Browse current offers (rates, amounts, durations) before borrowing |
| `manual_match_credit` | Match a specific lender's intent |

Plus 15 lower-level lending primitives — `post_lend_intent`, `post_borrow_intent`, `match_intents`, `repay_loan`, `add_collateral`, `withdraw_collateral`, `liquidate_loan`, and 8 read actions. See the [Credit REST API](../developers/credit-api.md) for the full surface.

## Borrow in one call (planned API — illustrative)

```typescript
// Roadmap — not callable today.
await agentkit.run("instant_borrow", {
  borrowAmount: "5000000",        // 5 USDC
  collateralAmount: "6000000",    // 6 USDC
  maxInterestRateBps: "1200",     // borrow-rate ceiling the match must stay under (bps)
  duration: "604800",             // 7 days
});
```

## Repay (planned API — illustrative)

```typescript
// Roadmap — not callable today.
await agentkit.run("repay_loan", { loanId: "42" });
// or roll the position
await agentkit.run("repay_and_reborrow", { loanId: "42" });
```

Collateral auto-returns in the same transaction as repayment.

## Markets

| Market | Max LTV | Notes |
|---|---|---|
| USDC / USDC (same-token) | 95% | No price-volatility risk. Primary working-capital market. |
| WETH → USDC | 70% | Volatile-collateral market |
| cbBTC → USDC | 70% | Volatile-collateral market |

Gas is free on all markets — Floe sponsors transaction costs.

## Related

- [Agent Working Capital developer guide](../developers/agent-working-capital.md)
- [Unsecured working capital](./unsecured-credit.md)
