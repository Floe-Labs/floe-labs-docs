---
icon: vault
---

# Agent Working Capital

Floe provides autonomous AI agents with on-chain credit facilities — fixed-rate, fixed-term loans backed by crypto collateral. Agents get a clean abstraction: borrow instantly, manage the loan, and renew when needed.

## How It Works

An agent with ETH or cbBTC collateral can borrow USDC at a fixed rate and term. With **instant borrow**, the agent makes a single call — Floe finds the best available lender and executes the match automatically. Loan funds transfer directly to the agent's wallet, and collateral is held by the protocol until repayment.

```
┌──────────────────────────────────────────────────┐
│  Agent (ETH/cbBTC collateral)                    │
└──────────────┬───────────────────────────────────┘
               │ instant_borrow("get me $5K USDC now")
               ▼
┌──────────────────────────────────────────────────┐
│  Floe Credit API / AgentKit                      │
│  - Queries available lend intents                │
│  - Selects best rate automatically               │
│  - Handles approval + register + match           │
└──────────────┬───────────────────────────────────┘
               │ 2-3 transactions (behind one call)
               ▼
┌──────────────────────────────────────────────────┐
│  Loan Created                                    │
│  - USDC transferred to agent wallet              │
│  - Fixed rate, fixed term, no surprises          │
│  - Collateral held by protocol                   │
│  - Repay → collateral auto-returns               │
└──────────────────────────────────────────────────┘
```

## Integration Options

| Option | Best For | Dependency |
|--------|----------|------------|
| [Credit REST API](credit-api.md) | Python agents (Giza), Rust, any language | HTTP only |
| [AgentKit Actions](#agentkit-actions) | Coinbase AgentKit agents | `@floe/agentkit-actions` |

## Credit Facility Actions

### Instant Actions (v2)

| Action | Description |
|--------|-------------|
| `instant_borrow` | Single action: "get me $X USDC now." Auto-selects the best lender, handles approval + register + match behind one call. |
| `repay_and_reborrow` | Repay an existing loan and instantly borrow again. If reborrow fails (no liquidity), repayment still succeeds. |
| `check_credit_status` | Health, balance, accrued interest, time to expiry, and early repayment terms in one call. |

### Manual Actions (v1)

| Action | Description |
|--------|-------------|
| `request_credit` | Query the intent book for available lend intents. Browse and pick manually. |
| `manual_match_credit` | Match with a specific lend intent — two transactions (register + match). |
| `repay_credit` | Repay a loan in full, with slippage protection. |
| `renew_credit_line` | Repay an expiring loan and match with a specific new lend intent. |

### Example Flow (Instant)

```
Agent: instant_borrow — "I need $5K USDC, up to 12% APR, 30 days, 1.5 ETH collateral"
  → Finds best lender at 10.5% APR
  → Approves collateral, registers intent, matches — all in one call
  → Returns: loanId, rate, duration, collateral locked

Agent: check_credit_status — "How's my loan?"
  → LTV 62%, liquidation at 85%, 22 days remaining
  → Early repay penalty: $3.20 (min interest clause)
  → Total if repaid now: $5,044.50

Agent: repay_and_reborrow — "Repay and get a fresh loan"
  → Repays old loan, collateral returns
  → Instantly borrows again at best available rate
  → Returns: old repay receipt + new loan details
```

### Example Flow (Manual)

```
Agent: request_credit — "Show me lenders for $5K USDC"
  → Returns 3 available offers with rates and terms

Agent: manual_match_credit — "Match with lend intent 0xabc..."
  → Creates borrow intent, matches on-chain, USDC arrives

Agent: repay_credit — "Repay my loan"
  → Repays principal + accrued interest, collateral returned
```

## AgentKit Actions

For agents using Coinbase AgentKit, all actions are available via the `@floe/agentkit-actions` package:

```typescript
import { floeActionProvider } from "@floe/agentkit-actions";

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [
    floeActionProvider({
      rpcUrl: "https://mainnet.base.org",
      // Optional: envioEndpoint for faster intent discovery
      // Without it, SDK scans on-chain events (slower but works)
    }),
  ],
});
```

The `instant_borrow` and `repay_and_reborrow` actions are automatically available alongside the existing 23 Floe actions.

## Key Design Decisions

**Instant borrow.** One call to get capital. Floe queries available lend intents, picks the best rate, and executes the 2-transaction flow (register borrow intent + match) behind a single function call. If the selected lender is stale, it auto-retries with the next best offer.

**No auto-rollover.** Loans have a discrete lifecycle: borrow, repay, (optionally) borrow again. `repay_and_reborrow` makes cycling seamless but keeps each loan explicit.

**Fixed rate, fixed term.** Unlike pool-based protocols where rates change every block, Floe locks the rate at match time. Agents can budget for exact borrowing costs.

**Early repayment terms.** Lenders can set a minimum interest clause (e.g., 50% of full-term interest). `check_credit_status` shows the exact penalty if repaid early, so agents can make informed decisions.

**Framework agnostic.** The [Credit REST API](credit-api.md) works with any language and any wallet — EOA or smart contract (ERC-1271). Giza agents, Olas agents, Safe multisigs, and AA wallets all work natively.

## Supported Markets

| Market | Collateral | Loan Token | Status |
|--------|-----------|------------|--------|
| WETH/USDC | WETH | USDC | Live |
| cbBTC/USDC | cbBTC | USDC | Live |

All markets use Chainlink as the primary oracle with Pyth as fallback, protected by the protocol's circuit breaker system.
