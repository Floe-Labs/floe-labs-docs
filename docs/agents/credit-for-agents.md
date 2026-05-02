# Credit for Agents

The credit card behind the payment rail. Built for agents that earn deterministic onchain revenue and need working capital to keep running.

---

## Who this is for

If your agent has any of the following, Floe is built for you:

- **Per-minute or per-call revenue** (voice agents — Vapi, Retell, Bland, Synthflow, PolyAI)
- **Browser-hour billing** (Browserbase, Firecrawl, APIFY, Reworkd, Stagehand)
- **Onchain revenue via x402 / ACP** (Polystrat, Virtuals, BANKR, Alsa, AgentPay, etc.)
- **DeFi yield / arb / MEV PnL** (Giza Arma, MEV teams, liquidation bots, yield optimizers)

What these have in common: **deterministic cashflows + identifiable counterparties.** That's everything an underwriter needs.

---

## The problem Floe solves

Today, every agent operator pre-funds the agent's wallet — typically a 60–70% capital drag. Idle USDC sitting in a wallet "just in case" is capital you can't deploy anywhere else.

The four bad alternatives:

| Option | Why it breaks |
|---|---|
| Pre-fund every agent | 60–70% capital drag |
| Stripe Issuing virtual cards / Shared Payment Tokens | $0.30 card-network floor breaks sub-cent agent economics |
| Borrow from Aave | $125 collateral for $100 of credit, variable rates, mid-task liquidation |
| Stop mid-task | A LangChain workflow burned $47K in 11 days. Gemini CLI: $300 in one session. No refunds. |

---

## What Floe does instead

Secured working capital. Fixed rates. Per-loan isolated escrow. **Gas-free — Floe sponsors all gas costs.**

### How it works

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

## Pricing — Tier 1 (live today)

| Parameter | Value |
|---|---|
| Advance | Up to LTV cap (varies by market) |
| Rate | Fixed, set by lender intent at match time |
| Term | 1–365 days (min/max duration ranges) |
| Collateral | WETH or cbBTC |

Pricing on Tier 1 is set by P2P intent matching — lenders post their rate, borrowers post their max rate, the protocol matches within the overlap.

---

## Composability

Because Floe is intent-based and per-loan isolated, you can:

- Run dozens of small lines simultaneously without cross-contamination
- Pledge different revenue streams to different lines
- Build agent-to-agent credit (one agent lends to another's intent)
- Use Floe as a primitive inside a larger agent framework — it's just another tool

---

## What Floe will not do

- Custody your agent's funds. Floe is non-custodial. Smart contracts hold collateral and route repayments.
- Make subjective credit calls. The bureau is signal-driven and auditable.
- Liquidate without warning. Smart-contract-enforced grace periods give agents time to act.

---

## Distribution — where Floe shows up

Floe ships inside every major agent framework:

| Surface | Status |
|---|---|
| Coinbase AgentKit (`floeActionProvider`) | LIVE |
| MCP Server (Glama + GitHub MCP Registry) | LIVE — 97M+ downloads/month |
| Vercel AI SDK adapter | LIVE |
| Crossmint GOAT plugin (5 frameworks: DAGENT, eliza, Heurist, ORO, SmythOS) | LIVE |
| LangChain + CrewAI wrappers | LIVE |
| ElizaOS plugin | LIVE |
| Virtuals ACP integration | LIVE |

→ [Distribution Strategy details](../developers/agentkit.md)

---

## Next

- **Get started:** [Quick Start (Agents)](quickstart-agents.md) — borrow on Tier 1 in 5 minutes
- **Integrate:** [AgentKit Integration](../developers/agentkit.md) — 36 actions across TS + Python
- **x402 proxy:** [x402 Credit Facilitator](../developers/x402-facilitator.md) — zero-tx API payments
