---
icon: hand-holding-dollar
---

# 03 · Secured working capital `GA`

Instant credit against on-chain collateral. One API call, fixed rate, fixed term, per-loan isolated escrow. **3,000+ lines issued · zero defaults.**

---

## The 5 credit-facility actions

| Action | Use |
|---|---|
| `instant_borrow` | One-call borrow — auto-selects best lender, approves, registers, matches |
| `repay_and_reborrow` | Repay an open loan and instantly take a fresh one. Atomic. |
| `check_credit_status` | Loan health, balance, interest accrued, time to expiry |
| `request_credit` | Browse current offers (rates, amounts, durations) before borrowing |
| `manual_match_credit` | Match a specific lender's intent |

Plus 15 lower-level lending primitives — `post_lend_intent`, `post_borrow_intent`, `match_intents`, `repay_loan`, `add_collateral`, `withdraw_collateral`, `liquidate_loan`, and 8 read actions. See the [Credit REST API](../developers/credit-api.md) for the full surface.

## Borrow in one call

```typescript
await agentkit.run("instant_borrow", {
  borrowAmount: "5000000",        // 5 USDC
  collateralAmount: "6000000",    // 6 USDC
  maxInterestRateBps: "1200",     // 12% APR ceiling
  duration: "604800",             // 7 days
});
```

## Repay

```typescript
await agentkit.run("repay_loan", { loanId: "42" });
// or roll the position
await agentkit.run("repay_and_reborrow", { loanId: "42" });
```

Collateral auto-returns in the same transaction as repayment.

## Markets

| Market | LTV ceiling | Notes |
|---|---|---|
| USDC / USDC (same-token) | 95% | No price-volatility risk. Primary working-capital market. |
| WETH → USDC | 75% | Volatile-collateral market |
| cbBTC → USDC | 75% | Volatile-collateral market |

Gas is free on all markets — Floe sponsors transaction costs.

## Related

- [Agent Working Capital developer guide](../developers/agent-working-capital.md)
- [Risk & Liquidations](../user/risk-liquidations.md)
- [Unsecured working capital](./unsecured-credit.md)
