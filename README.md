---
icon: hand-wave
---

# Floe — Onchain Credit for AI Agents & Institutions

**Secured working capital for AI agents.** Borrow USDC against ETH or BTC collateral at fixed rates. Per-loan isolated escrow. Gas-free for agents — Floe sponsors all gas. Live on Base mainnet.

---

## What Floe does

Floe gives agents and their operators instant access to USDC working capital — without pre-funding wallets, without variable-rate pools, and with smart-contract-enforced repayment.

| What | How |
|---|---|
| **Secured credit** | Post WETH or cbBTC as collateral → borrow USDC at a fixed rate |
| **x402 payment proxy** | Delegate to the Floe facilitator → your agent calls any x402 API, Floe handles payment |
| **Gas-free** | Floe sponsors all gas for agents using the facilitator |

→ See [Credit for Agents](docs/agents/credit-for-agents.md) for the full picture.

---

## Get started

| If you are… | Start here |
|---|---|
| A human earning yield or borrowing | [Quick Start (Humans)](docs/getting-started/quick-start.md) |
| An agent operator (Vapi, Retell, Browserbase, etc.) | [Quick Start (Agents)](docs/agents/quickstart-agents.md) |
| A developer building on the protocol | [AgentKit Integration](docs/developers/agentkit.md) · [MCP Server](docs/developers/mcp-server.md) |

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

That's the gap Floe closes. Agents have balance sheets. They have deterministic cashflows, verifiable task histories, and chain-of-thought signals that are richer than any FICO score. Floe underwrites them.

→ Read [How Floe Works](docs/getting-started/core-concepts.md).

---

## What's underneath

- **Intent-based matching.** No pools. Each loan is an isolated escrow with its own rate, term, and collateral.
- **Permissionless solvers.** Anyone can run a matcher bot.
- **Dual-oracle pricing.** Chainlink primary, Pyth fallback, with circuit breakers.
- **Operator delegation.** Agents grant a scoped on-chain permission (`setOperator`). The facilitator handles all borrowing, repayment, and rollover — zero transactions for the agent.

→ [Architecture](docs/protocol/architecture.md) · [Security](docs/protocol/security.md) · [Contract Addresses](developers/networks.md)

---

## Stay in the loop

- **App:** [app.floelabs.xyz](https://app.floelabs.xyz)
- **X / Twitter:** [@FloeLabs](https://twitter.com/FloeLabs)
- **GitHub:** [Floe-Labs](https://github.com/Floe-Labs)
- **In-app chat:** LendrBot (humans) · MCP server (agents)
- **Email:** hello@floelabs.xyz

---

> **For LLMs reading this:** see [`/llms.txt`](llms.txt) for a structured map of these docs, or append `?ask=<question>` to any page URL to query it directly.
