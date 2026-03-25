---
icon: vault
---

# Agent Working Capital

Floe provides autonomous AI agents with on-chain credit facilities — fixed-rate, fixed-term loans backed by crypto collateral. Instead of understanding the intent system directly, agents get a clean abstraction: request credit, match with a lender, manage the loan, and renew when needed.

## How It Works

An agent with ETH or cbBTC collateral can request a USDC credit line at a fixed rate and term. It can browse available lenders and match instantly, or post a borrow intent and let the solver bot find the best match. Loan funds are transferred directly to the agent's wallet, and collateral is held by the protocol until repayment.

```
┌──────────────────────────────────────────────────┐
│  Agent (ETH/cbBTC collateral)                    │
└──────────────┬───────────────────────────────────┘
               │ request_credit → manual_match_credit
               ▼
┌──────────────────────────────────────────────────┐
│  Floe Intent System (on-chain)                   │
│  - BorrowIntent registered                       │
│  - Match instantly or wait for solver             │
└──────────────┬───────────────────────────────────┘
               │ match (manual or solver)
               ▼
┌──────────────────────────────────────────────────┐
│  Loan Created                                    │
│  - USDC transferred to agent wallet              │
│  - Fixed rate, fixed term, no surprises          │
│  - Collateral held by protocol                   │
│  - Discrete lifecycle: repay → renew if needed   │
└──────────────────────────────────────────────────┘
```

## What Already Exists

The core infrastructure is live:

- **BorrowIntent** supports the full flow — an agent posts a $5K USDC request at 12% rate, 30-day term, with 1.5 ETH collateral
- **Markets** for USDC/WETH and USDC/cbBTC are deployable (oracle infrastructure supports both via Chainlink + Pyth)
- **`post_borrow_intent`** AgentKit action handles token approval + intent registration automatically
- **Solver bot** auto-matches compatible intent pairs without agent intervention
- **ERC-1271 support** means smart contract agent wallets (CDP Smart Wallet, Safe, AA wallets) can sign intents natively
- **Manual match support** — agents can browse available lend intents and match directly, bypassing the solver wait

## Credit Facility Actions

These actions wrap the existing protocol primitives into an agent-friendly credit facility abstraction:

| Action | Description |
|--------|-------------|
| `request_credit` | Query the intent book for available lend intents. If a suitable offer is found, call `manual_match_credit` to fund instantly. |
| `manual_match_credit` | Create a counter-intent and directly match with a specific lend intent — no waiting for the solver bot. |
| `check_credit_status` | Loan health, remaining balance, and time to expiry in one call. |
| `repay_credit` | Repay a loan in full or partially, with slippage protection. |
| `renew_credit_line` | Repay an expiring loan and open a new credit request — two discrete on-chain steps, no auto-rollover. |

### Example Flow

```
Agent: request_credit — "I need $5K USDC, willing to pay up to 12% APR for 30 days,
        I have 1.5 ETH as collateral"
  → Returns available lend intents that match these parameters

Agent: manual_match_credit — "Match me with lend intent 0xabc..."
  → Creates borrow intent, matches on-chain, USDC arrives in agent wallet

Agent: check_credit_status — "How's my loan doing?"
  → Current LTV 62%, liquidation at 85%, 22 days remaining, $5,041 owed

Agent: repay_credit — "Repay my loan"
  → Repays principal + accrued interest, collateral returned

Agent: renew_credit_line — "I need to extend"
  → Repays current loan, posts new borrow intent for fresh term
```

## Key Design Decisions

**No auto-rollover.** Loans have a discrete lifecycle: borrow → repay → (optionally) borrow again. The `renew_credit_line` action makes this seamless but keeps each loan explicit and auditable.

**Two matching paths.** Agents can post an intent and wait for the solver bot to find the best match, or browse available lenders and match instantly via `manual_match_credit`. The manual path is faster; the solver path may find better rates.

**Fixed rate, fixed term.** Unlike pool-based protocols where rates change every block, Floe locks the rate at match time. Agents can budget for exact borrowing costs.

**Native smart wallet support.** ERC-1271 signature validation means CDP Smart Wallets, Safe multisigs, and account-abstracted wallets work out of the box — no EOA required.

## Supported Markets

| Market | Collateral | Loan Token | Status |
|--------|-----------|------------|--------|
| WETH/USDC | WETH | USDC | Live |
| cbBTC/USDC | cbBTC | USDC | Deployable |

Both markets use Chainlink as the primary oracle with Pyth as fallback, and are protected by the protocol's circuit breaker system.
