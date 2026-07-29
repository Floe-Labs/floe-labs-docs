<p align="center"><img src="https://raw.githubusercontent.com/Floe-Labs/.github/main/profile/banner.png" alt="Floe" width="100%" /></p>

# Floe — FinOps for voice AI builders

**One key for your voice agent's entire bill — LLM, voice, telephony, data.** Every voice-agent call spends across 5–10 vendors in real time. Floe pays all of them per call through a single key, enforces per-agent and per-task budgets, and puts the whole bill on one ledger. Walletless.

[Website](https://floelabs.xyz) · [Live docs](https://floe-labs.gitbook.io/docs) · [Dashboard](https://dev-dashboard.floelabs.xyz) · [𝕏 @FloeLabs](https://x.com/FloeLabs)

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen)](https://github.com/Floe-Labs/floe-labs-docs/blob/main/LICENSE)

No crypto, no wallets to manage. Works with **Pipecat, Vapi, Retell, ElevenLabs, LiveKit, Bland, LangChain, CrewAI, OpenAI, Claude, and any framework that speaks HTTP.**

> This repository is the source for the documentation at **[floe-labs.gitbook.io/docs](https://floe-labs.gitbook.io/docs)** — the published site is the best way to read it. Corrections and improvements are welcome; see [CONTRIBUTING.md](https://github.com/Floe-Labs/floe-labs-docs/blob/main/CONTRIBUTING.md).

---

## Your agent is 4 steps from its first paid API call

Every account's first agent starts with a **$3 Welcome Credit (300 API credits)** — so your first paid call needs **no card and no funding**. Fund and set budgets later, once you've seen it work.

### 1. Create an agent

Go to the [Developer Dashboard](https://dev-dashboard.floelabs.xyz). Sign in with email, Google, or a wallet, and create an agent. Floe provisions everything — a managed wallet and the **$3 Welcome Credit** — automatically. Walletless: no MetaMask, no seed phrase.

→ [Dashboard guide](docs/developers/developer-dashboard.md)

### 2. Connect to your AI tools & models

Point your coding agent at Floe and it does the setup — installs a client, provisions an agent, sets guardrails, and makes a real paid call:

```text
Read https://dev-dashboard.floelabs.xyz/agents.md and set up Floe for this project.
```

Or wire up a client yourself:

```bash
# MCP — Claude Code, one line
claude mcp add --transport http floe https://mcp.floelabs.xyz/mcp \
  --header "Authorization: Bearer YOUR_FLOE_KEY"

# CLI — installs both `floe` and `floe-agent`
npm i -g floe-agent
```

→ [Set up with your AI tools](docs/getting-started/setup-with-ai-tools.md)

### 3. Make your first paid call

Spend the **$3 Welcome Credit** — no card needed. Your agent sends one HTTP request; Floe pays the vendor and returns the response with an `X-Floe-Payment-Amount` header showing the cost. The same key pays LLM tokens, so every leg lands on one ledger.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "X-Floe-Task-Id: call-8842" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.exa.ai/search", "method": "POST", "body": "{\"query\":\"hello world\"}"}'
```

→ [Vendor Marketplace](docs/x402-directory/README.md) — 2,000+ services · [Floe Inference](docs/developers/keyless-inference.md) — keyless LLM · [Payment facilitator](docs/developers/x402-facilitator.md)

### 4. Fund & set budgets

When the Welcome Credit runs low, add money with a card, Apple Pay, Google Pay, or bank transfer — directly in the dashboard, shown in dollars. Then cap what your agent can spend: per call, per day, per task, per vendor, or across your whole team. Enforced server-side, so a runaway loop can't blow your budget. One task budget caps the whole conversation — LLM, voice, telephony, and data together.

→ [Funding guide](docs/getting-started/funding.md) · [Spend Controls](docs/developers/spend-controls.md)

---

## The voice stack — one key for every leg

| Guide | What you get |
|---|---|
| **[The Voice Stack](docs/build/voice-stack.md)** | Run a full voice turn — STT → LLM → TTS → telephony — on one key, one budget. |
| **[Floe Inference](docs/developers/keyless-inference.md)** | Keyless LLM & voice — call any model with just your Floe key, no provider account. |
| **[Floe Phone](docs/developers/floe-phone.md)** | Give an agent a real phone number; carrier, STT, LLM, and TTS metered on one ledger. |
| **[Unified Billing & Ledger](docs/build/unified-ledger.md)** | LLM, voice, telephony, and data on one ledger, priced per call. |
| **[Budget-Aware Routing](docs/build/budget-aware-routing.md)** | Downgrade, finish, or hard-stop as an agent nears its budget — the job still finishes. |

---

## Integrate with your framework

Works with **Pipecat, Vapi, Retell, ElevenLabs, LiveKit, Bland, LangChain, CrewAI, OpenAI, Claude, and any framework that speaks HTTP.** Every one follows the same flow — create an agent, get an API key, call the proxy.

| Framework | How |
|---|---|
| **Voice pipelines** (Vapi, Retell, Pipecat, LiveKit, Bland, ElevenLabs) | Drop Floe in as the payment layer — route each leg through Floe so it lands on one key and one budget. → [Add Floe to your existing pipeline](docs/getting-started/integrate-existing-pipeline.md) |
| **Claude / Cursor / MCP** | [MCP Server](docs/developers/mcp-server.md) — one line to connect any MCP client |
| **LangChain** | [`getLangChainTools` adapter](docs/frameworks/langchain.md) |
| **CrewAI** | [via MCP server](docs/frameworks/crewai.md) |
| **OpenAI Agents SDK** | [adapter](docs/frameworks/openai.md) |
| **Vercel AI SDK** | [`getVercelAITools` adapter](docs/frameworks/vercel-ai.md) |
| **Coinbase AgentKit** | [`floeActionProvider`](docs/frameworks/agentkit.md) |
| **Plain HTTP / REST** | [anything that speaks HTTP](docs/frameworks/http.md) |

See real agents in the [Floe Cookbook](https://github.com/Floe-Labs/floe-cookbook) and [Eve](https://github.com/Floe-Labs/eve-floe), Floe's reference voice agent.

---

## What Floe gives you

| Capability | What it does |
|---|---|
| **[Agent Wallet](docs/components/wallet.md)** | A funded dollar balance per agent, with programmable spend limits. |
| **[Funding](docs/getting-started/funding.md)** | Add money by card, Apple Pay, Google Pay, or bank; withdraw anytime. |
| **[Payment facilitator](docs/developers/x402-facilitator.md)** | One endpoint pays any vendor API, per call, from the agent's balance. |
| **[Vendor Marketplace](docs/x402-directory/README.md)** | 2,000+ vendor API services — LLMs, STT, TTS, telephony, search, browser, memory — through one key. |
| **[Unified billing & ledger](docs/build/unified-ledger.md)** | LLM, voice, telephony, and data on one ledger, one policy set. |
| **[Spend controls](docs/developers/spend-controls.md)** | Per-call, per-day, per-task, per-vendor, per-team budgets — enforced server-side. |
| **[Budget-aware routing](docs/build/budget-aware-routing.md)** | Downgrade, finish, or hard-stop as budgets tighten. |

---

## Why this matters

A voice agent's cost is never just tokens. One conversation pays for telephony, speech-to-text, an LLM, and text-to-speech — 5 to 10 vendors, in real time. If they bill four different ways, you can't answer the only question that matters: what did this call cost, and was it worth it?

Floe answers it. One key pays every vendor per call, per-agent and per-task budgets stop a runaway loop server-side, and the whole bill lands on one ledger — tagged by agent, task, and vendor.

---

**Dashboard:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) · **X:** [@FloeLabs](https://twitter.com/FloeLabs) · **GitHub:** [Floe-Labs](https://github.com/Floe-Labs) · **Email:** hello@floelabs.xyz

> **For LLMs reading this:** see [`/llms.txt`](llms.txt) for a structured map of these docs, or append `?ask=<question>` to any page URL to query it directly.
