---
icon: hand-wave
---

# Floe — FinOps for voice AI builders

**One key. Every voice primitive. Every model.** Your agent's entire bill — LLM, voice, telephony, data — on one key. Every voice-agent call spends across 5–10 vendors in real time. Floe pays all of them per call through a single key, enforces per-agent and per-task budgets, and puts the whole bill on one ledger.

No crypto, no wallets to manage. Works with **Pipecat, Vapi, Retell, ElevenLabs, LiveKit, Bland, LangChain, CrewAI, OpenAI, Claude, and any framework that speaks HTTP.**

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

Works with **Pipecat, Vapi, Retell, ElevenLabs, LiveKit, Bland, LangChain, CrewAI, OpenAI, Claude, and any framework that speaks HTTP.** Every one follows the same payment flow — create an agent, get an API key, call the proxy.

{% tabs %}
{% tab title="Voice frameworks" %}
Vapi, Retell, Pipecat, LiveKit, Bland, ElevenLabs — drop Floe in as the payment layer for your existing pipeline. Route each leg (telephony, STT, LLM, TTS) through Floe so it lands on one key and one budget.

→ [Add Floe to your existing pipeline](docs/getting-started/integrate-existing-pipeline.md) · real agents in the [Floe Cookbook](https://github.com/Floe-Labs/floe-cookbook)
{% endtab %}

{% tab title="REST / any language" %}
```bash
curl -H "Authorization: Bearer $FLOE_API_KEY" \
  https://credit-api.floelabs.xyz/v1/agents/balance
```
→ [REST API guide](docs/frameworks/http.md)
{% endtab %}

{% tab title="Claude / MCP" %}
Add to your MCP config:
```json
{ "mcpServers": { "floe": { "command": "npx", "args": ["-y", "@floelabs/mcp-server", "--stdio"] } } }
```
→ [Full guide](docs/frameworks/claude-mcp.md) · [MCP Server docs](docs/developers/mcp-server.md)
{% endtab %}

{% tab title="LangChain" %}
```python
from floe_agentkit_actions import FloeAgentToolkit
tools = FloeAgentToolkit(api_key="floe_...").get_tools()
```
→ [Full guide](docs/frameworks/langchain.md)
{% endtab %}

{% tab title="OpenAI Agents SDK" %}
```python
from floe_agentkit_actions import FloeAgent
agent = FloeAgent(api_key="floe_...")
```
→ [Full guide](docs/frameworks/openai.md)
{% endtab %}
{% endtabs %}

Also supported: [CrewAI](docs/frameworks/crewai.md) · [Vercel AI SDK](docs/frameworks/vercel-ai.md) · [Coinbase AgentKit](docs/frameworks/agentkit.md) ([TypeScript](docs/developers/agentkit-typescript.md) · [Python](docs/developers/agentkit-python.md)). See real agents in the [Floe Cookbook](https://github.com/Floe-Labs/floe-cookbook) and [Eve](https://github.com/Floe-Labs/eve-floe), Floe's reference voice agent.

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
