---
icon: hand-wave
---

# Floe — Credit and payments for AI agent developers

**No crypto required.** x402 credit lines, fiat funding, programmable spend controls. Works with AgentKit, LangChain, CrewAI, ElizaOS, OpenAI, Claude, and any framework that speaks HTTP.

1. **Sign up with email + a funding source.** Card, Apple Pay, Google Pay, or bank transfer. Floe provisions your wallets in the background — no MetaMask, no seed phrase, no gas token.
2. **Floe issues an x402 credit line to your agent's wallet.** Set spending controls — per-call cap, daily limit, allowed destinations.
3. **Your agent pays vendors per-call; you get real-time visibility.** Every call is a typed receipt: target URL, amount, status, time. Reconcile, alert, or revoke from the dashboard.

---

## The Floe Stack

Everything your agent needs to earn, spend, and build credit. Six components. One SDK.

| # | Component | What it does | Status |
|---|---|---|---|
| 01 | **[Agent Wallet](docs/components/wallet.md)** | Non-custodial smart-contract wallet with ERC-8004 identity, programmable spend limits, allowed-destination permissions enforced on-chain. | `GA` |
| 02 | **[Fiat on/off-ramp](docs/components/onramp.md)** | USDC in via cards, bank, Apple Pay, Google Pay. Local payouts in 100+ countries. | Onramp `GA` · Offramp `Preview` |
| 03 | **[Secured working capital](docs/components/secured-credit.md)** | Instant credit against on-chain collateral. One API call to borrow. 3,000+ lines · zero defaults. | `GA` |
| 04 | **[Unsecured working capital](docs/components/unsecured-credit.md)** | Credit underwritten against agent receivables and chain-of-thought signals. | `Preview` |
| 05 | **[x402 payment facilitator](docs/components/x402.md)** | One proxy endpoint to pay any of 13,000+ x402 APIs. ~50ms signing. | `GA` |
| 06 | **[Credit & trust bureau](docs/components/credit-bureau.md)** | Every repayment writes to a portable ERC-8004 record. | Reader `Beta` · Writer `Preview` |

---

## Get started

| If you are... | Start here |
|---|---|
| New to Floe | [5-minute Quickstart](docs/getting-started/quickstart.md) — wires the full loop |
| Building with Coinbase AgentKit | [AgentKit guide](docs/frameworks/agentkit.md) |
| Building with LangChain | [LangChain guide](docs/frameworks/langchain.md) |
| Building with CrewAI | [CrewAI guide](docs/frameworks/crewai.md) |
| Using Claude Desktop / Claude Code / Cursor | [Claude / MCP guide](docs/frameworks/claude-mcp.md) |
| Calling Floe directly over HTTP | [REST API guide](docs/frameworks/http.md) |
| New to crypto — just want my agent to work | [Bank Account → First API Call](docs/agents/fiat-to-x402.md) |
| A human earning yield or borrowing | [Quick Start (Humans)](docs/getting-started/quick-start.md) |

**Dashboard:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz)
**Network:** Base (Coinbase's L2 — fast, cheap, built for payments)

---

## How it works — the full financial loop

```
1. Setup     register your agent (ERC-8004 identity, programmable wallet)
2. Fund      USDC in via cards, bank, Apple Pay, Google Pay, or on-chain
3. Borrow    one API call to instant_borrow — fixed rate, fixed term, isolated
4. Spend     x402_fetch any of 13,000+ APIs through the Floe facilitator
5. Repay     repay_loan — collateral auto-returns in the same tx
6. Trust     every repayment writes to your agent's on-chain credit record
```

See [Quickstart](docs/getting-started/quickstart.md) for the runnable version.

---

## Why this matters

Financial independence is the precursor to agent autonomy. Long-running agents can't do anything meaningful without their own fundable balance sheet.

Every economy in history has run on credit. Credit needs trust as collateral. Agents don't have FICO — but they have something better: deterministic cashflows and chain-of-thought.

- **100M+** machine payments via x402 since May 2025
- **100K+** agents with onchain identity — less than 1% of the agent population
- **3,000+** secured working capital lines issued through Floe
- **Zero** defaults or losses

Floe is the **Financial OS** for that economy — the wallet, the rails, the working-capital lender, the x402 facilitator, and the credit bureau, in one SDK.

---

## What's underneath

- **Intent-based matching.** No pools. Each loan is isolated with its own rate and term.
- **Dual-oracle pricing.** Chainlink primary, Pyth fallback, with circuit breakers.
- **Operator delegation.** Agents grant a scoped on-chain permission. The facilitator handles all borrowing, repayment, and rollover — zero transactions for the agent.
- **Same-token markets.** USDC/USDC loans have no price-volatility risk — the protocol enforces a fixed 1:1 ratio, enabling up to 99.5% LTV.
- **Fiat on-ramp.** Fund your agent's wallet via Coinbase directly from the dashboard — no crypto bridges needed.
- **Portable credit.** Every repayment writes to an ERC-8004 record other protocols can read.

[Architecture](docs/protocol/architecture.md) | [Security](docs/protocol/security.md) | [Contract Addresses](developers/networks.md)

---

## Maturity legend

Throughout the docs you'll see component and framework badges:

- `GA` — production, supported, on the pricing page
- `Beta` — usable, API may change, gated by feature flag
- `Preview` — design-partner / waitlist
- `Roadmap` — committed, no code yet

---

## Stay in the loop

- **Dashboard:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz)
- **X / Twitter:** [@FloeLabs](https://twitter.com/FloeLabs)
- **GitHub:** [Floe-Labs](https://github.com/Floe-Labs)
- **Email:** hello@floelabs.xyz

---

> **For LLMs reading this:** see [`/llms.txt`](llms.txt) for a structured map of these docs, or append `?ask=<question>` to any page URL to query it directly.
