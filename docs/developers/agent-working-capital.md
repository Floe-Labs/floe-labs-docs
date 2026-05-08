---
icon: vault
---

# Agent Working Capital

Floe provides AI agents with instant credit lines — deposit USDC, borrow up to 95%, spend on anything, repay when ready.

## How It Works

An agent deposits USDC as collateral and borrows USDC at a fixed rate and term. With **instant borrow**, the agent makes a single call — Floe finds the best available lender and executes the match automatically. Working capital transfers directly to the agent's wallet, and the USDC deposit is held by the protocol until repayment.

> **Have ETH or BTC?** Floe also supports WETH and cbBTC collateral — same API, just a different `marketId`.

```
┌──────────────────────────────────────────────────┐
│  Agent ($10,000 USDC deposit)                    │
└──────────────┬───────────────────────────────────┘
               │ instant_borrow("get me $9,500 USDC working capital")
               ▼
┌──────────────────────────────────────────────────┐
│  Floe Credit API / AgentKit                      │
│  - Queries available lend offers                 │
│  - Selects best rate automatically               │
│  - Handles approval + register + match           │
└──────────────┬───────────────────────────────────┘
               │ 2-3 transactions (behind one call)
               ▼
┌──────────────────────────────────────────────────┐
│  Credit Line Active                              │
│  - $9,500 USDC transferred to agent wallet       │
│  - Fixed rate, fixed term, no surprises          │
│  - $10,000 USDC deposit held by protocol         │
│  - Repay → deposit auto-returns                  │
└──────────────────────────────────────────────────┘
```

## Why USDC/USDC?

Traditional DeFi lending requires volatile crypto collateral (ETH, BTC) and caps LTV at 30-70%. Floe's same-token market changes the math:

| | Volatile collateral (ETH/USDC) | Stablecoin collateral (USDC/USDC) |
|---|---|---|
| Max LTV | 70% | **95%** |
| Liquidation risk | Price drops trigger liquidation | **None from price movements** |
| Collateral management | Must monitor 24/7 | **Set and forget** |
| Token swaps needed | Yes (need ETH/BTC) | **No — just USDC** |

The protocol's oracle returns a fixed 1:1 ratio for same-token pairs (hardcoded, not fed by Chainlink). There is no price feed to go stale and no circuit breaker to trip.

## Integration Options

| Option | Best For | Dependency |
|--------|----------|------------|
| [Credit REST API](credit-api.md) | Python agents, Rust, any language | HTTP only |
| [AgentKit Actions](#agentkit-actions) | Coinbase AgentKit agents | `floe-agent` npm package |
| [Developer Dashboard](developer-dashboard.md) | Visual setup + monitoring | Browser |

## Credit Facility Actions

### Instant Actions

| Action | Description |
|--------|-------------|
| `instant_borrow` | Single action: "get me $X USDC now." Auto-selects the best lender, handles approval + register + match behind one call. |
| `repay_and_reborrow` | Repay an existing loan and instantly borrow again. If reborrow fails (no liquidity), repayment still succeeds. |
| `check_credit_status` | Balance, accrued interest, time to expiry, and early repayment terms in one call. |

### Manual Actions

| Action | Description |
|--------|-------------|
| `request_credit` | Query the offer book for available lend offers. Browse and pick manually. |
| `manual_match_credit` | Match with a specific lend offer — two transactions (register + match). |
| `repay_credit` | Repay a loan in full, with slippage protection. |
| `renew_credit_line` | Repay an expiring loan and match with a specific new lend offer. |

### Example Flow

```
Agent: instant_borrow — "I need $9,500 USDC, up to 8% APR, 30 days, $10K USDC deposit"
  → Finds best lender at 6.5% APR
  → Approves collateral, registers intent, matches — all in one call
  → Returns: loanId, rate, duration, collateral locked

Agent: check_credit_status — "How's my credit line?"
  → 95% LTV, no liquidation risk, 22 days remaining
  → Early repay fee: $1.80 (min interest clause)
  → Total if repaid now: $9,512.30

Agent: repay_and_reborrow — "Repay and get a fresh credit line"
  → Repays old loan, deposit returns
  → Instantly borrows again at best available rate
  → Returns: old repay receipt + new loan details
```

## AgentKit Integration

For agents using Coinbase AgentKit:

```typescript
import { floeActionProvider } from "floe-agent";

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [floeActionProvider()],
});
```

All credit facility actions are available alongside the other 36 Floe actions.

## Routing Working Capital

All borrow actions accept an optional `onBehalfOf` address. When set, borrowed USDC is sent to that address instead of your wallet. This enables:

- **Credit facilitators** — borrow on behalf of a custodial payment wallet
- **Multi-wallet setups** — deposit in one wallet, working capital in another
- **Smart contract recipients** — route funds directly to a DeFi position

```typescript
await agentkit.invoke("instant_borrow", {
  borrowAmount: "9500000000",
  collateralAmount: "10000000000",
  maxInterestRateBps: "800",
  duration: "2592000",
  onBehalfOf: "0x...payment_wallet",  // USDC goes here
});
```

If omitted, USDC goes to your own wallet.

## Key Design Decisions

**Same-token markets.** USDC/USDC loans have no price-volatility risk. The protocol hardcodes a 1:1 oracle ratio and allows up to 99.5% LTV (vs. 90% for volatile pairs). The LTV gap between origination and liquidation is reduced to 0.5% (vs. 8% for volatile pairs), because the only path to liquidation is unpaid interest accrual — not price movements.

**Instant borrow.** One call to get capital. Floe queries available lend offers, picks the best rate, and executes the 2-transaction flow (register borrow intent + match) behind a single function call. If the selected lender is stale, it auto-retries with the next best offer.

**No auto-rollover.** Loans have a discrete lifecycle: borrow, repay, (optionally) borrow again. `repay_and_reborrow` makes cycling seamless but keeps each loan explicit.

**Fixed rate, fixed term.** Unlike pool-based protocols where rates change every block, Floe locks the rate at match time. Agents can budget for exact borrowing costs.

**Early repayment terms.** Lenders can set a minimum interest clause (e.g., 50% of full-term interest). `check_credit_status` shows the exact cost if repaid early, so agents can make informed decisions.

**Framework agnostic.** The [Credit REST API](credit-api.md) works with any language and any wallet — EOA or smart contract (ERC-1271). Python agents, Rust agents, Safe multisigs, and AA wallets all work natively.

## Supported Markets

| Market | Deposit (Collateral) | Borrow (Working Capital) | Max LTV | Status |
|--------|---------------------|--------------------------|---------|--------|
| **USDC/USDC** | USDC | USDC | **95%** | **Live** |
| WETH/USDC | WETH | USDC | 70% | Live |
| cbBTC/USDC | cbBTC | USDC | 70% | Live |

**USDC/USDC** uses a hardcoded 1:1 oracle (no Chainlink dependency, no circuit breaker impact). WETH and cbBTC markets use Chainlink primary + Pyth fallback with circuit breaker protection.
