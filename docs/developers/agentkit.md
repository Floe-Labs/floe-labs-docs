---
icon: robot
---

# AgentKit Integration

Build AI agents that can lend, borrow, match intents, execute flash loans, and manage loans on Floe — using [Coinbase AgentKit](https://docs.cdp.coinbase.com/agent-kit/).

## What is AgentKit?

AgentKit is Coinbase's open-source framework that gives AI agents on-chain capabilities. Floe provides custom ActionProviders that expose protocol actions, making Floe a first-class verb alongside "transfer" and "swap" in any AgentKit agent.

## Choose Your SDK

| | TypeScript | Python |
|---|-----------|--------|
| **Package** | `@floe/agentkit-actions` | `floe-agentkit-actions` |
| **Install** | `npm install @floe/agentkit-actions` | `pip install floe-agentkit-actions` |
| **Runtime** | Node.js 18+ | Python 3.10+ |
| **Actions exposed** | **36** (30 Floe + 6 X402) | **36** (30 Floe + 6 X402) — full parity as of April 2026 |
| **AI Frameworks** | Vercel AI SDK, LangChain, MCP Server, OpenAI Agents SDK | LangChain, OpenAI Function Calling |
| **CLI** | `floe-agent` (via npx) | `floe-agent` (via pip) |
| **GitHub** | [Floe-Labs/agentkit-actions](https://github.com/Floe-Labs/agentkit-actions) | [Floe-Labs/agentkit-actions-py](https://github.com/Floe-Labs/agentkit-actions-py) |

> **SDK parity note.** As of April 2026, the Python SDK has full parity with TypeScript: 30 Floe actions plus 6 X402 actions (36 total in both). The high-level credit facility actions (`instant_borrow`, `repay_and_reborrow`, `request_credit`, `manual_match_credit`, `check_credit_status`, `repay_credit`, `renew_credit_line`) are now available in both SDKs.

> **Get started:** [TypeScript SDK](agentkit-typescript.md) | [Python SDK](agentkit-python.md)
>
> **Need working capital for your agent?** See [Agent Working Capital](agent-working-capital.md) for credit facility actions that let agents request, match, and manage fixed-rate loans.

## Actions Reference (TypeScript — 36 total)

The full list below reflects the **TypeScript SDK** surface. Where an action is Python-available too, it's marked. See the [Python SDK page](agentkit-python.md) for the Python-only list.

### Read Actions (8)

| Action | Description |
|--------|-------------|
| `get_markets` | Get info about Floe lending markets (rates, LTV bounds, pause status) |
| `get_loan` | Get detailed loan information (participants, health, time remaining) |
| `get_my_loans` | Get all loans for the connected wallet |
| `check_loan_health` | Check loan health — current LTV vs liquidation threshold |
| `get_price` | Get oracle price for a collateral/loan token pair (Chainlink + Pyth) |
| `get_accrued_interest` | Get interest accrued on a loan |
| `get_liquidation_quote` | Get profit/loss breakdown for liquidating an unhealthy loan |
| `get_intent_book` | Look up an on-chain lend or borrow intent by hash |

### Write Actions (7)

| Action | Description |
|--------|-------------|
| `post_lend_intent` | Post a fixed-rate lending offer (auto-approves token) |
| `post_borrow_intent` | Post a borrow request with collateral (auto-approves collateral) |
| `match_intents` | Match a lend + borrow intent to create a loan |
| `repay_loan` | Repay a loan fully or partially (with slippage protection) |
| `add_collateral` | Add collateral to improve loan health |
| `withdraw_collateral` | Withdraw excess collateral (enforces safety buffer) |
| `liquidate_loan` | Liquidate an unhealthy loan |

All write actions auto-approve tokens to the LendingIntentMatcher with a 1% buffer before submitting. Repay and liquidate actions include configurable slippage protection (default 5%).

### Flash Loan Actions (5)

| Action | Description |
|--------|-------------|
| `get_flash_loan_fee` | Get the protocol's flash loan fee (in bps) |
| `estimate_flash_arb_profit` | Simulate a multi-leg arb route via Aerodrome QuoterV2 |
| `flash_loan` | Execute a raw flash loan (receiver must implement `IFlashloanReceiver`) |
| `flash_arb` | Execute a flash arb via a deployed FlashArbReceiver |
| `get_flash_arb_balance` | Check accumulated profit in a FlashArbReceiver |

> **`flash_loan` vs `flash_arb`:** `flash_loan` sends tokens to `msg.sender` and calls `receiveFlashLoan()` — your connected wallet must be a smart contract. EOA wallets will revert. Use `flash_arb` instead, which routes through a pre-deployed FlashArbReceiver contract that handles repayment automatically.

### x402 Credit Actions (6)

| Action | Description |
|--------|-------------|
| `grant_credit_delegation` | One-time setup: delegate collateral to a facilitator for automatic x402 payments |
| `revoke_credit_delegation` | Revoke delegation — triggers wind-down (loans repaid, collateral returned) |
| `check_credit_delegation` | Check delegation status: borrowed vs limit, rate cap, expiry |
| `x402_fetch` | Fetch any URL through the facilitator proxy — auto-pays 402 responses |
| `x402_get_balance` | Check credit status: limit, used, available, active loans |
| `x402_get_transactions` | View payment history with pagination |

> **x402 actions use a separate provider.** Register `x402ActionProvider` alongside `floeActionProvider` to get both lending and payment actions. See [x402 Credit Facilitator](x402-facilitator.md) for setup details.

### Deploy / Verify Actions (3)

| Action | Description |
|--------|-------------|
| `deploy_flash_arb_receiver` | Deploy a new FlashArbReceiver with pre-flight checks |
| `check_flash_arb_readiness` | Check environment readiness (fee, liquidity, oracle, router) |
| `verify_flash_arb_receiver` | Verify a receiver's owner and immutable config |

## Flash Arb Flow

```
1. deploy_flash_arb_receiver  →  Deploys FlashArbReceiver (stores address in session)
2. check_flash_arb_readiness  →  Validates fee, liquidity, circuit breaker, router
3. estimate_flash_arb_profit  →  Simulates arb route via Aerodrome QuoterV2
4. flash_arb                  →  Borrows tokens → swaps via Aerodrome → repays + keeps profit
5. get_flash_arb_balance      →  Check accumulated profit in receiver
```

## Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| LendingIntentMatcher | `0x17946cD3e180f82e632805e5549EC913330Bb175` |
| LendingViews | `0x9101027166bE205105a9E0c68d6F14f21f6c5003` |
| PriceOracle | `0xEA058a06b54dce078567f9aa4dBBE82a100210Cc` |
| Aerodrome SwapRouter | `0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5` |
| Aerodrome QuoterV2 | `0x254cF9E1E6e233aa1AC962CB9B05b2cFeAAe15b0` |
| WETH | `0x4200000000000000000000000000000000000006` |

## How Floe Differs from Aave/Compound

| Feature | Aave/Compound | Floe |
|---------|--------------|------|
| Model | Pool-based, variable rate | Intent-based, fixed rate |
| Rate | Algorithmic, changes per block | Fixed at match time |
| Term | Open-ended | Fixed duration |
| Matching | Automatic (pool) | Solver bots match offers |
| Liquidation | Pool absorbs bad debt | Per-loan, with incentive |
| Flash loans | From pool reserves | From protocol with receiver contract |
