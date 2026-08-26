<p align="center"><img src="https://raw.githubusercontent.com/Floe-Labs/.github/main/profile/banner.png" alt="Floe" width="100%" /></p>

# Floe — What every voice call actually costs

**Across every carrier, speech, and model vendor — so finance can price contracts on real numbers, protect gross margin, and stop guessing at the gap between what they signed and what they deployed.**

Every voice call your agent makes spends money across a dozen vendors — the phone carrier, the speech-to-text, the language model, the voice, the tools. Those bills arrive separately, in different units, on different days, and your finance team spends weeks stitching them together to answer one question: **what did this client, this campaign, this call actually cost us?** Floe costs every call the moment it ends, tags the spend to the client and campaign, and shows you your margin per contract — so you can price the next deal on actuals instead of a blended guess, and walk into your next raise with your unit economics under control. (Floe is the join across every vendor — a token router meters only the LLM slice, ~40% of the bill, and is blind to the other 60%; on BYOK, platform dashboards report $0 — plus enforcement where Floe is in the path. One ledger, tagged by agent, task, and customer.)

[Website](https://floelabs.xyz) · [Live docs](https://floe-labs.gitbook.io/docs) · [Dashboard](https://dev-dashboard.floelabs.xyz) · [𝕏 @FloeLabs](https://x.com/FloeLabs)

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen)](https://github.com/Floe-Labs/floe-labs-docs/blob/main/LICENSE)

> This repository is the source for the documentation at **[floe-labs.gitbook.io/docs](https://floe-labs.gitbook.io/docs)** — the published site is the best way to read it. Corrections welcome; see [CONTRIBUTING.md](https://github.com/Floe-Labs/floe-labs-docs/blob/main/CONTRIBUTING.md).

---

> **Running production agents on Vapi, Retell, or Bland?**
> Floe governs spend **inside your platform** through its own documented hooks — no migration, no platform cooperation, your keys stay yours. Where the platform allows it, route the model leg through Floe for pre-call enforcement (a custom-LLM URL on **Vapi**, a hosted adapter on **Retell**; **Bland** is reconcile-only). Connect the end-of-call webhook and every call lands on one ledger, with a between-call circuit breaker that stops the agent's next call once it's over budget.
> → **[Vapi in 10 minutes](docs/platforms/vapi.md)** · [Retell](docs/platforms/retell.md) · [Bland](docs/platforms/bland.md) · [Full orchestrator reference](docs/build/voice-orchestrators.md)

---

## Prototyping? Your agent is 4 steps from its first paid call

Every account's first agent starts with a **$3 Welcome Credit (300 API credits)** — so your first paid call needs **no card and no funding**.

### 1. Create an agent

Sign in to the [Developer Dashboard](https://dev-dashboard.floelabs.xyz) with email or Google and create an agent. Floe provisions everything — a funded balance and the Welcome Credit — automatically.
→ [Dashboard guide](docs/developers/developer-dashboard.md)

### 2. Connect your AI tools

Point your coding agent at Floe and it does the setup — installs a client, provisions an agent, sets guardrails, and makes a real paid call:

```text
Read https://dev-dashboard.floelabs.xyz/agents.md and set up Floe for this project.
```

Or wire a client yourself:

```bash
# MCP — Claude Code, one line
claude mcp add --transport http floe https://mcp.floelabs.xyz/mcp \
  --header "Authorization: Bearer YOUR_FLOE_KEY"

# Platform CLI — onboard, mint an agent key, print the base-URL swap
npx @floelabs/cli init
export FLOE_API_KEY="floe_..."   # export the key init printed (it is not exported for you)
```

→ [Set up with your AI tools](docs/getting-started/setup-with-ai-tools.md)

### 3. Make your first paid call

Spend the **$3 Welcome Credit** — no card needed. Your agent sends one HTTP request; Floe pays the vendor and returns the response with an `X-Floe-Payment-Amount` header showing the cost. The same key pays LLM tokens, and `X-Floe-Task-Id` ties every leg to one budget.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "X-Floe-Task-Id: call-8842" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.exa.ai/search", "method": "POST", "body": "{\"query\":\"hello world\"}"}'
```

→ [Vendor Marketplace](docs/x402-directory/README.md) · [Floe Inference](docs/developers/keyless-inference.md)

### 4. Fund & set budgets

When the Welcome Credit runs low, add money by card, Apple Pay, Google Pay, or bank transfer — shown in dollars. Then cap what your agent can spend: per day, per task, per vendor, or across your team. Enforced server-side, so a runaway loop can't blow your budget. One task budget caps the whole conversation — LLM, voice, telephony, and data together.
→ [Funding](docs/getting-started/funding.md) · [Spend Controls](docs/developers/spend-controls.md)

---

## The voice stack — one key for every leg

| Guide | What you get |
|---|---|
| **[The Voice Stack](docs/build/voice-stack.md)** | A full voice turn — STT → LLM → TTS → telephony — on one key, one budget. |
| **[Floe Inference](docs/developers/keyless-inference.md)** | Keyless LLM & voice — any model with just your Floe key. |
| **[Floe Phone](docs/developers/floe-phone.md)** | A real phone number; carrier, STT, LLM, and TTS metered on one ledger. |
| **[Unified Billing & Ledger](docs/build/unified-ledger.md)** | Every leg on one ledger, priced per call, attributed per agent, task, and customer. |
| **[Voice Orchestrators](docs/build/voice-orchestrators.md)** | Connect Vapi / Retell / Bland / Pipecat / LiveKit — Reconcile Mode + circuit breaker. |
| **[Coverage Score](docs/build/coverage-score.md)** | The % of an agent's spend that's enforceable vs reconciled vs dark — and how to raise it. |

---

## Integrate with your framework

| Framework | How |
|---|---|
| **Voice platforms** (Vapi, Retell, Bland) | Govern spend inside the platform through its own hooks — model leg where supported (custom-LLM on Vapi/Retell; Bland reconcile-only) + end-of-call webhook. → [Platform setup](docs/platforms/vapi.md) · [Orchestrator reference](docs/build/voice-orchestrators.md) |
| **Self-hosted pipelines** (Pipecat, LiveKit, ElevenLabs) | Route each leg through Floe — one key, one budget. → [Add Floe to your existing pipeline](docs/getting-started/integrate-existing-pipeline.md) |
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
| **[Agent Balance](docs/components/wallet.md)** | A funded dollar balance per agent, with programmable spend limits. |
| **[Coverage Score](docs/build/coverage-score.md)** | Per-agent: % of spend enforceable pre-call vs reconciled vs dark. |
| **[Funding](docs/getting-started/funding.md)** | Add money by card, Apple Pay, Google Pay, or bank; withdraw anytime. |
| **[Pay any vendor API](docs/developers/x402-facilitator.md)** | One endpoint pays any vendor API, per call, from the agent's balance. |
| **[Vendor Marketplace](docs/x402-directory/README.md)** | Vendor API services — LLMs, STT, TTS, telephony, search, browser, memory — thousands reachable through one key. |
| **[Unified billing & ledger](docs/build/unified-ledger.md)** | Every leg on one ledger, one policy set. |
| **[Spend controls](docs/developers/spend-controls.md)** | Per-day, per-task, per-vendor, per-team budgets — enforced server-side. |

---

## Why this matters

A voice agent's cost is never just tokens. One conversation pays 7–20 vendors in real time, and if they bill separately you can't answer the only question that matters: what did this call cost, and was it worth it? Floe answers it — and enforces the answer. Pre-call where we're in the path. Circuit breaker everywhere else. [See what a call costs](https://dev-dashboard.floelabs.xyz/calculator).

---

**Dashboard:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) · **X:** [@FloeLabs](https://twitter.com/FloeLabs) · **GitHub:** [Floe-Labs](https://github.com/Floe-Labs) · **Email:** hello@floelabs.xyz

> **For LLMs reading this:** see [`/llms.txt`](llms.txt) for a structured map of these docs, or append `?ask=<question>` to any page URL to query it directly.
