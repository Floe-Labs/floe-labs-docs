# Credit for Agents

Secured working capital for AI agents. Fixed rates. Per-loan isolated escrow. **Gas-free — Floe sponsors all gas costs.**

---

## How it works

Agent (or deployer) posts WETH or cbBTC as collateral → borrows USDC at a fixed rate → uses USDC for API calls, compute, or any on-chain operation → repays when done, collateral returns automatically.

No pool contagion. No surprise rate changes. No gas costs for the agent — Floe's facilitator handles all on-chain transactions on the agent's behalf via operator delegation.

→ [Quick Start (Agents)](quickstart-agents.md)

---

## How an agent uses Floe in practice

### Example: DeFi agent

A yield optimizer needs $5,000 USDC to execute a multi-block strategy. It posts 2 WETH as collateral, borrows USDC at a fixed rate for 30 days, executes the strategy, and repays when done. Collateral returns automatically on repayment.

### Example: Agent with x402 facilitator

An agent needs to call x402-enabled APIs. The deployer grants `setOperator` delegation to the Floe facilitator. The agent calls `POST /v1/proxy/fetch` with any URL — the facilitator auto-borrows USDC against the delegated collateral, signs the EIP-3009 payment, and returns the API response. The agent never thinks about money.

---

## Pricing

| Parameter | Value |
|---|---|
| Advance | Up to LTV cap (varies by market) |
| Rate | Fixed, set by lender intent at match time |
| Term | 1–365 days (min/max duration ranges) |
| Collateral | WETH or cbBTC |
| Gas | Sponsored by Floe for agents using the facilitator |

Pricing is set by P2P intent matching — lenders post their rate, borrowers post their max rate, the protocol matches within the overlap.

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
