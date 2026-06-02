---
icon: hand-wave
---

# Floe — Credit and payments for AI agent developers

**No crypto required.** x402 credit lines, fiat funding, programmable spend controls. Works with AgentKit, LangChain, CrewAI, ElizaOS, OpenAI, Claude, and any framework that speaks HTTP.

---

## Your agent is 4 steps from its first paid API call

### 1. Sign up and create an agent wallet

Go to the [Developer Dashboard](https://dev-dashboard.floelabs.xyz). Sign in with email, Google, or any wallet. Create an agent wallet — Floe provisions the keys, no MetaMask or seed phrase.

→ [Dashboard guide](docs/developers/developer-dashboard.md)

### 2. Fund it

Buy USDC with a card, Apple Pay, Google Pay, or bank transfer — directly in the dashboard. Or send USDC on Base from any wallet.

→ [Funding guide](docs/getting-started/funding.md)

### 3. Open a credit line

One click (or one API call). Floe issues a USDC credit line against your deposit — up to 95% LTV, fixed rate, no price risk.

→ [How credit works](docs/agents/credit-for-agents.md)

### 4. Make paid API calls

Call any x402 API through Floe's proxy. Your agent sends one HTTP request; Floe handles the payment, signing, and settlement. The response comes back with an `X-Floe-Payment-Amount` header showing the cost.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.exa.ai/search", "method": "POST", "body": "{\"query\":\"hello world\"}"}'
```

→ [x402 Facilitator docs](docs/developers/x402-facilitator.md) · [Vendor Marketplace](docs/x402-directory/README.md) (27 verified endpoints)

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
| 01 | **[Agent Wallet](docs/components/wallet.md)** | Non-custodial wallet with programmable spend limits and allowed-destination permissions. | `GA` |
| 02 | **[Fiat on/off-ramp](docs/components/onramp.md)** | USDC in via cards, bank, Apple Pay, Google Pay. Local payouts in 100+ countries. | Onramp `GA` · Offramp `Preview` |
| 03 | **[Secured working capital](docs/components/secured-credit.md)** | Instant credit against on-chain collateral. One API call to borrow. 3,000+ lines · zero defaults. | `GA` |
| 04 | **[Unsecured working capital](docs/components/unsecured-credit.md)** | Credit underwritten against agent receivables and chain-of-thought signals. | `Preview` |
| 05 | **[x402 payment facilitator](docs/components/x402.md)** | One proxy endpoint to pay any x402 API. ~50ms signing. | `GA` |
| 06 | **[Credit & trust bureau](docs/components/credit-bureau.md)** | Every repayment writes to a portable on-chain credit record. | Reader `Beta` · Writer `Preview` |

---

## Why this matters

Financial independence is the precursor to agent autonomy. Long-running agents can't do anything meaningful without their own fundable balance sheet.

- **100M+** machine payments via x402 since May 2025
- **3,000+** secured working capital lines issued through Floe
- **Zero** defaults or losses
- **27** verified x402 API endpoints across 7 categories

---

## What's underneath

- **Intent-based matching.** No pools. Each loan is isolated with its own rate and term.
- **Same-token markets.** USDC/USDC loans have no price risk — up to 95% LTV.
- **Operator delegation.** Zero transactions for the agent. Floe handles borrowing, repayment, and rollover.
- **Dual-oracle pricing.** Chainlink primary, Pyth fallback, with circuit breakers.

[Architecture](docs/protocol/architecture.md) | [Security](docs/protocol/security.md) | [Contract Addresses](developers/networks.md)

---

**Dashboard:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) · **X:** [@FloeLabs](https://twitter.com/FloeLabs) · **GitHub:** [Floe-Labs](https://github.com/Floe-Labs) · **Email:** hello@floelabs.xyz

> **For LLMs reading this:** see [`/llms.txt`](llms.txt) for a structured map of these docs, or append `?ask=<question>` to any page URL to query it directly.
