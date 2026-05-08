# Credit for Agents

Secured working capital for AI agents. Fixed rates. Per-loan isolated escrow. **Gas-free — Floe sponsors all gas costs.**

---

## How it works

Your agent deposits USDC and borrows up to 95% back as working capital. Same token in, same token out — no crypto trading, no price risk. When the agent repays, the deposit returns automatically.

For agents that already hold ETH or BTC: Floe also supports WETH and cbBTC collateral for USDC loans.

-> [Quick Start (Agents)](quickstart-agents.md)

---

## How an agent uses Floe in practice

### Example: Working capital line

An agent needs $9,500 to call paid APIs. It deposits $10,000 USDC, borrows $9,500 (95% LTV), spends it, and repays when done. Deposit returns automatically. No price monitoring. No liquidation risk.

### Example: x402 facilitator (zero-touch)

An agent calls x402-enabled APIs. The deployer grants `setOperator` delegation to the Floe facilitator once. The agent calls `POST /v1/proxy/fetch` with any URL — the facilitator auto-borrows USDC against the delegated collateral, signs the EIP-3009 payment, and returns the API response. The agent never thinks about money.

### Example: DeFi agent

A yield optimizer needs $5,000 USDC. It posts 2 WETH as collateral, borrows USDC at a fixed rate for 30 days, executes the strategy, and repays. Collateral returns on repayment.

---

## Pricing

| Parameter | Value |
|---|---|
| Advance | Up to 95% of USDC deposit (USDC/USDC market) |
| Rate | Fixed — set at match time, never changes |
| Term | 1–365 days |
| Collateral | USDC (primary), WETH, or cbBTC |
| Gas | $0 — Floe sponsors all gas for agents using the facilitator |
| Funding | Buy USDC from the [dashboard](../developers/developer-dashboard.md) via Coinbase (credit card or bank transfer) |

---

## Composability

Because Floe is intent-based and per-loan isolated, you can:

- Run dozens of small lines simultaneously without cross-contamination
- Build agent-to-agent credit (one agent lends to another's intent)
- Use Floe as a primitive inside a larger agent framework — it's just another tool

---

## What Floe will not do

- Custody your agent's funds. Floe is non-custodial. Smart contracts hold collateral and route repayments.
- Liquidate without warning. Smart-contract-enforced grace periods give agents time to act.

---

## Next

- **Get started:** [Quick Start (Agents)](quickstart-agents.md) — borrow in 5 minutes
- **Integrate:** [AgentKit Integration](../developers/agentkit.md) — 45 actions across TS + Python
- **x402 proxy:** [x402 Credit Facilitator](../developers/x402-facilitator.md) — zero-tx API payments
