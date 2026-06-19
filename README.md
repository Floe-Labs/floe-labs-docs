---
icon: hand-wave
---

# Floe — The spend layer for AI agents

**The spend layer for AI agents — a budget, not a balance.** No crypto required: fund an agent with a card, then let it pay for any x402 API through one proxy endpoint — every call governed by programmable spend controls. Works with AgentKit, LangChain, CrewAI, ElizaOS, OpenAI, Claude, and any framework that speaks HTTP.

---

## Your agent is 4 steps from its first paid API call

### 1. Sign up and create an agent wallet

Go to the [Developer Dashboard](https://dev-dashboard.floelabs.xyz). Sign in with email, Google, or any wallet. Create an agent wallet — Floe provisions the keys, no MetaMask or seed phrase.

→ [Dashboard guide](docs/developers/developer-dashboard.md)

### 2. Fund it

Buy USDC with a card, Apple Pay, Google Pay, or bank transfer — directly in the dashboard. Or send USDC on Base from any wallet.

→ [Funding guide](docs/getting-started/funding.md)

### 3. Set spend controls

Cap what your agent can spend — per call, per day, per vendor, or across your whole team. Enforced server-side by Floe, so a runaway loop can't blow your budget. (Scope: Floe governs x402 payments made through the proxy, not raw LLM token bills you pay with your own provider key — see [Spend Controls](docs/developers/spend-controls.md).)

→ [Spend Controls](docs/developers/spend-controls.md)

### 4. Make paid API calls

Call any x402 API through Floe's proxy. Your agent sends one HTTP request; Floe handles the payment, signing, and settlement. The response comes back with an `X-Floe-Payment-Amount` header showing the cost.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.exa.ai/search", "method": "POST", "body": "{\"query\":\"hello world\"}"}'
```

→ [x402 Facilitator docs](docs/developers/x402-facilitator.md) · [Vendor Marketplace](docs/x402-directory/README.md) (2,000+ vendor API services)

---

## Integrate with your framework

All frameworks use the same flow — create an agent wallet, get an API key, call the proxy. The only difference is the import.

{% tabs %}
{% tab title="AgentKit (TypeScript)" %}
```typescript
import { floeActionProvider } from 'floe-agent';
const agentkit = await AgentKit.from({
  walletProvider, actionProviders: [floeActionProvider()],
});
```
→ [Full guide](docs/frameworks/agentkit.md) · [TypeScript SDK](docs/developers/agentkit-typescript.md) · [Python SDK](docs/developers/agentkit-python.md)
{% endtab %}

{% tab title="LangChain" %}
```python
from floe_agentkit_actions import FloeAgentToolkit
tools = FloeAgentToolkit(api_key="floe_...").get_tools()
```
→ [Full guide](docs/frameworks/langchain.md)
{% endtab %}

{% tab title="Claude / MCP" %}
Add to your MCP config:
```json
{ "mcpServers": { "floe": { "command": "npx", "args": ["-y", "@floelabs/mcp-server", "--stdio"] } } }
```
→ [Full guide](docs/frameworks/claude-mcp.md) · [MCP Server docs](docs/developers/mcp-server.md)
{% endtab %}

{% tab title="Vercel AI SDK" %}
```typescript
import { floeTools } from '@floe/ai';
const tools = floeTools({ apiKey: process.env.FLOE_KEY! });
```
→ [Full guide](docs/frameworks/vercel-ai.md)
{% endtab %}

{% tab title="REST / any language" %}
```bash
curl -H "Authorization: Bearer $FLOE_API_KEY" \
  https://credit-api.floelabs.xyz/v1/agents/balance
```
→ [REST API guide](docs/frameworks/http.md) · [Credit API reference](docs/developers/credit-api.md)
{% endtab %}
{% endtabs %}

Also supported: [CrewAI](docs/frameworks/crewai.md) · [ElizaOS](docs/frameworks/elizaos.md) · [OpenAI Agents SDK](docs/frameworks/openai.md)

---

## The Floe Stack

| # | Component | What it does | Status |
|---|---|---|---|
| 01 | **[Agent Wallet](docs/components/wallet.md)** | Custodial-by-default wallet (Floe-provisioned, no seed phrase) with programmable spend limits and allowed-destination permissions. Self-custody optional. | `GA` |
| 02 | **[Fiat on/off-ramp](docs/components/onramp.md)** | USDC in via cards, bank, Apple Pay, Google Pay. Local payouts in 100+ countries. | Onramp `GA` · Offramp `Preview` |
| 03 | **[x402 payment facilitator](docs/components/x402.md)** | One proxy endpoint to pay any x402 API from your agent's Floe-managed balance. | `GA` |
| 04 | **[Spend controls](docs/developers/spend-controls.md)** | Programmable, context-aware budgets — per call, day, session, vendor, agent team. Enforced server-side. | `GA` |
| 05 | **[Credit & trust bureau](docs/components/credit-bureau.md)** | Repayment and spend history as a portable on-chain signal. Programmable credit-utilization thresholds are live; the portable credit profile is in development. | Thresholds `GA` · Profile `In development` |
| 06 | **[Working capital (on-chain)](docs/components/secured-credit.md)** | Borrow USDC against on-chain collateral. Roadmap / self-custody path. | `Roadmap` |
| 07 | **[Unsecured working capital](docs/components/unsecured-credit.md)** | Credit underwritten against agent receivables and cashflow signals. | `Roadmap` |

---

## Why this matters

Agents need to pay for things — APIs, compute, data — without a human in the loop and without touching crypto. Floe is the spend layer that makes that safe:

- **Walletless onboarding** — no seed phrase, no gas, no tokens to buy
- **One proxy endpoint** to pay any of **2,000+** vendor API services reachable via x402
- **Programmable spend controls** — per call, per day, per session, per vendor, per agent team — enforced server-side
- **Spend analytics** and multi-agent key management in the dashboard

---

## Advanced: the on-chain layer

Underneath the walletless product is an on-chain protocol. These surfaces are for teams running their own keys (self-custody); the working-capital credit path is **in development**.

- **Intent-based matching.** No pools. Each loan is isolated with its own rate and term.
- **Same-token markets.** USDC/USDC loans have no price risk — up to 95% LTV.
- **Operator delegation.** Scoped, revocable permission so Floe can act within on-chain bounds.
- **Dual-oracle pricing.** Chainlink primary, Pyth fallback, with circuit breakers.

[Architecture](docs/protocol/architecture.md) | [Security](docs/protocol/security.md) | [Contract Addresses](developers/networks.md)

---

**Dashboard:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) · **X:** [@FloeLabs](https://twitter.com/FloeLabs) · **GitHub:** [Floe-Labs](https://github.com/Floe-Labs) · **Email:** hello@floelabs.xyz

> **For LLMs reading this:** see [`/llms.txt`](llms.txt) for a structured map of these docs, or append `?ask=<question>` to any page URL to query it directly.
