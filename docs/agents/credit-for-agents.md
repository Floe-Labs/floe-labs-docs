# Credit for Agents

Financial independence is the precursor to agent autonomy. Long-running agents can't do anything meaningful without their own fundable balance sheet. Floe gives them one.

**3,000+ secured working capital lines issued. Zero defaults or losses.** Fixed rates. No price-volatility risk. Gas-free — Floe sponsors all transaction costs.

---

## How it works

Your agent deposits USDC and borrows up to 95% back as working capital. Same token in, same token out — no crypto trading, no price risk. When the agent repays, the deposit returns automatically.

For agents that already hold ETH or BTC: Floe also supports WETH and cbBTC collateral for USDC loans.

> **Don't have USDC?** Fund your agent with a bank account or card directly from the [Floe dashboard](https://dev-dashboard.floelabs.xyz) — no crypto exchange needed. See [Bank Account → First API Call](fiat-to-x402.md).

→ [Quick Start (Agents)](quickstart-agents.md)

---

## Two ways to use Floe

### Example: Working capital line

An agent needs $9,500 to call paid APIs. It deposits $10,000 USDC, borrows $9,500 (95% LTV), spends it, and repays when done. Deposit returns automatically. No price monitoring. No liquidation risk.

### Example: x402 facilitator (zero-touch)

An agent calls x402-enabled APIs. The deployer grants `setOperator` delegation to the Floe facilitator once. The agent calls `POST /v1/proxy/fetch` with any URL — the facilitator auto-borrows USDC against the delegated collateral, signs the EIP-3009 payment, and returns the API response. The agent never thinks about money.

### Example: DeFi agent

A yield optimizer needs $5,000 USDC. It posts 2 WETH as collateral, borrows USDC at a fixed rate for 30 days, executes the strategy, and repays. Collateral returns on repayment.

---

## What it costs

| Parameter | Value |
|---|---|
| Advance | Up to 95% of USDC deposit (USDC/USDC market) |
| Rate | Fixed — set at match time, never changes |
| Term | 1–365 days |
| Collateral | USDC (primary), WETH, or cbBTC |
| Gas | $0 — Floe sponsors all gas for agents using the facilitator |
| Funding | Buy USDC from the [dashboard](../developers/developer-dashboard.md) via Coinbase (credit card or bank transfer) |

---

## Why USDC collateral?

Most DeFi lending requires volatile crypto as collateral (ETH, BTC). That means managing liquidation risk, monitoring prices, and over-collateralizing significantly.

Floe's USDC/USDC market eliminates all of that:

- **No liquidation risk from price movements** — collateral and loan are the same asset
- **95% LTV** — deposit $10K, get $9.5K (vs. 30-70% on volatile collateral)
- **No token swaps needed** — if you have USDC, you're ready
- **Fiat on-ramp built in** — buy USDC from the [dashboard](../developers/developer-dashboard.md) with a credit card or bank transfer

---

## Building credit history

Every loan your agent takes and repays builds on-chain credit history. This history will unlock:

- **Higher LTV** (up to 150% for qualified agents — underwritten by receivables)
- **Lower rates** from lenders who can verify repayment track record
- **Larger credit lines** as the agent proves reliability

---

## What Floe will not do

- **Custody your agent's funds.** Collateral is held by audited smart contracts, not by Floe.
- **Liquidate without cause.** For USDC/USDC loans, the only path to liquidation is unpaid interest — no price-driven liquidations.
- **Change your rate mid-term.** Fixed rate, fixed term, always.

---

## Next

- **Get started:** [Agent Quickstart](../developers/agent-quickstart.md) — working capital in 5 minutes
- **Integrate:** [AgentKit Integration](../developers/agentkit.md) — 36 actions across TypeScript + Python
- **x402 proxy:** [x402 Credit Facilitator](../developers/x402-facilitator.md) — zero-touch API payments
- **Dashboard:** [Developer Dashboard](../developers/developer-dashboard.md) — manage agents via web UI
