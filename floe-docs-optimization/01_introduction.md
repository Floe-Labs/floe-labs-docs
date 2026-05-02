# Floe — Onchain Credit for AI Agents & Institutions

**The credit layer behind every payment rail.** Floe is an onchain credit protocol and bureau, built for AI agents and backed by institutions.

Coinbase built the rails. Stripe built the checkout. Floe builds the credit layer — because credit is a protocol problem, not a product feature.

---

## What Floe does

Floe turns deterministic onchain cashflows (x402 receipts, ACP revenue, signed receivables) into working capital — without pre-funding, without pools, and with smart-contract-enforced repayment.

Three credit tiers on one protocol:

| Tier | Status | Who it's for |
|---|---|---|
| **1. Secured agent credit** | LIVE on Base mainnet | Agents & users borrowing against ETH or BTC |
| **2. Receivables-backed working capital** | Q3 2026 | Merchants & SMBs financing invoices and signed pipeline |
| **3. Uncollateralized agent credit** | Q3 2026 | Agents with reputation built on Floe (CoT + repayment history) |

→ See [The Three Credit Tiers](./agents/three-credit-tiers.md) for how each works.

---

## Get started

| If you are… | Start here |
|---|---|
| A human earning yield or borrowing | [Quick Start (Humans)](./getting-started/quick-start.md) |
| An agent operator (Vapi, Retell, Browserbase, etc.) | [Quick Start (Agents)](./getting-started/quick-start-agents.md) |
| A developer building on the protocol | [AgentKit Integration](./developers/agentkit/) · [MCP Server](./developers/mcp-server.md) |
| An institution evaluating the asset class | [Institutions Overview](./institutions/overview.md) |
| A merchant looking to finance receivables | [Receivables Financing](./receivables/overview.md) |

**App:** [app.floelabs.xyz](https://app.floelabs.xyz)
**Network:** Base Mainnet
**Loan tokens:** USDC, USDT
**Collateral:** WETH, cbBTC (more coming)

---

## Why this matters

Every economy runs on credit. The agentic economy doesn't have any.

- **100M+** x402 machine payments since May 2025
- **106K** agents with onchain identity (ERC-8004)
- **$0** in agent credit outstanding

That's the gap Floe closes. Agents have balance sheets. They have deterministic cashflows, verifiable task histories, and chain-of-thought signals that are richer than any FICO score. We underwrite them.

→ Read [Why Floe, Why Now](./why-floe.md).

---

## What's underneath

- **Intent-based matching.** No pools. Each loan is an isolated escrow with its own rate, term, and collateral.
- **Permissionless solvers.** Anyone can run a matcher bot.
- **Dual-oracle pricing.** Chainlink primary, Pyth fallback, with circuit breakers.
- **Onchain credit bureau.** Repayment history, counterparty quality, CoT execution scores — persistent and portable across the agent economy.

→ [Architecture](./protocol/architecture.md) · [Security](./protocol/security.md) · [Contract Addresses](./reference/networks.md)

---

## Stay in the loop

- **App:** [app.floelabs.xyz](https://app.floelabs.xyz)
- **X / Twitter:** [@FloeLabs](https://twitter.com/FloeLabs)
- **GitHub:** [Floe-Labs](https://github.com/Floe-Labs)
- **In-app chat:** LendrBot (humans) · MCP server (agents)
- **Email:** hello@floelabs.xyz

---

> **For LLMs reading this:** see [`/llms.txt`](./llms.txt) for a structured map of these docs, or append `?ask=<question>` to any page URL to query it directly.
