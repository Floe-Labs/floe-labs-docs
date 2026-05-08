---
icon: hand-wave
---

# Floe — Working Capital for AI Agents

**Get a USDC credit line in one API call.** Deposit USDC, borrow up to 95% instantly, pay only for what you use. No crypto complexity. Live on Base.

---

## What Floe does

Floe gives AI agents and developers instant access to working capital. Deposit USDC, get a credit line, spend it on APIs, compute, or anything your agent needs. Repay when you're ready — your deposit returns automatically.

| What | How |
|---|---|
| **Secured credit line** | Deposit USDC, borrow up to 95% at a fixed rate |
| **x402 payment proxy** | Your agent calls any paid API — Floe handles payment automatically |
| **Gas-free** | Floe sponsors all blockchain transaction costs |
| **Fund with fiat** | Buy USDC directly from the dashboard via Coinbase (credit card or bank transfer) |

> **Already have ETH or BTC?** Floe also supports WETH and cbBTC as collateral for USDC loans — [see all markets](developers/networks.md).

---

## Get started

| If you are... | Start here |
|---|---|
| A developer building an AI agent | [Agent Quickstart](docs/developers/agent-quickstart.md) — working capital in 5 minutes |
| An agent operator (Vapi, Retell, Browserbase, etc.) | [Quick Start (Agents)](docs/agents/quickstart-agents.md) |
| A human earning yield or borrowing | [Quick Start (Humans)](docs/getting-started/quick-start.md) |
| Exploring the API | [Credit REST API](docs/developers/credit-api.md) — no SDK needed |

**Dashboard:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz)
**Network:** Base (Coinbase's L2 — fast, cheap, built for payments)

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

- **Same-token markets.** USDC/USDC loans have no price-volatility risk — the protocol enforces a fixed 1:1 ratio, enabling 95% LTV.
- **Fiat on-ramp.** Fund your agent's wallet via Coinbase directly from the dashboard — no crypto bridges needed.

[Architecture](docs/protocol/architecture.md) | [Security](docs/protocol/security.md) | [Contract Addresses](developers/networks.md)

---

## Stay in the loop

- **Dashboard:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz)
- **X / Twitter:** [@FloeLabs](https://twitter.com/FloeLabs)
- **GitHub:** [Floe-Labs](https://github.com/Floe-Labs)
- **In-app chat:** LendrBot (humans) · MCP server (agents)
- **Email:** hello@floelabs.xyz

---

> **For LLMs reading this:** see [`/llms.txt`](llms.txt) for a structured map of these docs, or append `?ask=<question>` to any page URL to query it directly.
