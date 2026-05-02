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

Three credit tiers, one protocol, zero mid-task liquidations once you've built history.

### Tier 1 — Secured (LIVE)

Agent posts WETH or cbBTC as collateral. Borrows USDC. Smart-contract-enforced repayment. Per-loan isolated escrow — no pool contagion, no surprise rate changes.

→ [Quick Start (Agents)](../getting-started/quick-start-agents.md)

### Tier 2 — Receivables-backed (Q3 2026)

Pledge a lien on signed pipeline / invoices. Get advanced 80–90% upfront. Repayment sweeps automatically from inbound USDC as customers pay.

→ [Receivables Overview](../receivables/overview.md)

### Tier 3 — Uncollateralized agent credit (Q3 2026)

The credit card behind the payment rail. When your agent hits HTTP 402 with an empty wallet, **Floe extends credit and settles with the resource server in USDC** — the agent accumulates debt against its credit profile (CoT score + repayment history + revenue history).

→ [x402 + Deferred Settlement](./x402-deferred-settlement.md)

---

## How an agent uses Floe in practice

### Voice agent example

A voice agent sells per-minute calls to enterprise customers. Customers settle NET-60 via invoice. The agent needs USDC *now* to pay for compute (OpenAI, ElevenLabs, hosting).

1. Agent pledges a lien on its signed pipeline + last 90 days of revenue.
2. Floe verifies counterparties (enterprise creditworthiness) and history.
3. Floe advances 85% of the receivable balance.
4. As customers pay invoices into the agent's wallet, Floe sweeps a configured % until the advance is repaid.
5. Repayment performance updates the agent's bureau profile — next advance is bigger and cheaper.

### Browser agent example

A scraping agent bills $0.50 per browser-hour. It hits a paywalled API and gets HTTP 402 mid-task. With Tier 3 (Q3):

1. Floe Facilitator sees the 402.
2. Pays the resource server in USDC on the agent's behalf.
3. Records debt against the agent's profile.
4. Sweeps repayment from the agent's next inbound x402 receipts.

The agent never stopped. The customer paid for an hour of work, not 22 minutes of work and a 38-minute outage.

---

## What goes into the credit decision

Floe's policy engine takes:

| Signal | Weight |
|---|---|
| Onchain revenue history (x402 + ACP) | High |
| Repayment performance on past Floe loans | High |
| Counterparty quality (who's paying you) | High |
| CoT execution score (LLM judges + Floe risk engine) | Medium-High |
| Task completion histories | Medium |
| Onchain identity (ERC-8004) | Required for Tier 3 |

Outputs:

- **Limit** — how much credit
- **Advance %** — how much of inbound to sweep
- **Rate** — APR
- **Term** — duration
- **Feasibility** — whether the planned task is creditable at all

The same policy engine drives all three tiers — it just gets *more* of the agent's profile to work with as history accumulates.

---

## Pricing snapshot

| Tier | Typical advance | Typical APR | Typical term |
|---|---|---|---|
| 1 — Secured | Up to LTV cap (varies by market) | Set by lend intent | 1–90 days |
| 2 — Receivables | 80–90% of pledged | Equivalent to 25–35% IRR for lenders | Days to months |
| 3 — Uncollateralized | $5 to $5,000+ depending on profile | 8–25% APR | Hours to weeks |

Pricing is dynamic — set by intent matching (Tier 1) or Floe's underwriting engine (Tiers 2/3).

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
- Liquidate Tier 3 borrowers without warning. Sweep mechanics give the agent a chance to repay from inbound revenue before any escalation.

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

→ [Distribution Strategy details](../developers/agentkit/)

---

## Next

- **Action:** [Quick Start (Agents)](../getting-started/quick-start-agents.md) — borrow on Tier 1 in 5 minutes
- **Depth:** [The Three Credit Tiers](./three-credit-tiers.md)
- **Tier 3 specifics:** [x402 + Deferred Settlement](./x402-deferred-settlement.md)
- **Underwriting:** [CoT Underwriting & the Credit Bureau](./cot-underwriting.md)
- **Pricing:** [Limits & Pricing](./pricing-limits.md)
