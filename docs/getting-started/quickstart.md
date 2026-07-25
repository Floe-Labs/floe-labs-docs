---
icon: rocket
---

# Quickstart (5 minutes)

Create an agent, give it a Floe-managed balance, then let it pay for any x402 API — every call governed by spend controls you set. That's the whole product: **a budget, not a balance.** No wallets to install, no keys to manage, no tokens to buy, no gas to pay.

> **$3 Welcome Credit.** Roughly 300 calls at a typical ~$0.01/call — the cheapest vendors (like $0.001 Exa Contents) stretch it into the thousands. Your first agent can start paying for APIs today, no card required. [Get started →](https://dev-dashboard.floelabs.xyz)
>
> **Want your coding agent to do this instead?** Paste one prompt into Claude Code, Cursor, or Codex and it installs a client, provisions the agent, sets the guardrails, and makes the first paid call — see [Set up with your AI tools](setup-with-ai-tools.md) and the [Agent Quickstart](../agents/quickstart-agents.md).

---

## 1. Create an agent

Go to [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz), sign in with email, and click **New agent**. Copy the API key (starts with `floe_…`) — it's shown once.

That's it. No "connect wallet" step. We provision everything your agent needs in the background.

## 2. Fund it

In the dashboard, click **Fund Wallet** on the agent and pay with **card, Apple Pay, Google Pay, or bank transfer**. Funds arrive within seconds.

Suggested first amount: **$10**. That's enough to test the loop and call a few hundred x402 APIs at typical $0.001–$0.05 prices.

## 3. Set a spend control (optional but recommended)

Cap what the agent can spend — per call, per day, per vendor, or across your whole team — before it makes its first call. Enforced server-side, so a runaway loop can't blow your budget. See [Spend Controls](../developers/spend-controls.md). (Scope note: Floe caps x402 payments made through the proxy, not LLM token bills you pay with your own provider key — see that page.)

## 4. Call any API

Install the SDK and call `fetch`. If the API is x402-gated, payment happens automatically; if it's free, the request passes through. Either way, your agent's balance updates.

{% tabs %}
{% tab title="Python" %}
```bash
pip install floe-agentkit-actions
```

```python
import os
from floe_agentkit_actions import FloeAgent

agent = FloeAgent(api_key=os.environ["FLOE_API_KEY"])

# Pay for an API. The price (if any) is debited from your balance.
result = agent.fetch("https://api.example.com/premium")
print(result.body)
print(f"Spent ${result.cost:.4f} on this call.")

# Check what you have left.
print(f"Balance: ${agent.balance():.2f}")
```
{% endtab %}
{% tab title="TypeScript" %}
```bash
npm install floe-agent
```

```typescript
import { FloeAgent } from "floe-agent";

const agent = new FloeAgent({ apiKey: process.env.FLOE_API_KEY! });

// Pay for an API. The price (if any) is debited from your balance.
const result = await agent.fetch("https://api.example.com/premium");
console.log(result.body);
console.log(`Spent $${result.cost.toFixed(4)} on this call.`);

// Check what you have left.
console.log(`Balance: $${(await agent.balance()).toFixed(2)}`);
```
{% endtab %}
{% endtabs %}

That's the entire happy path. No `instant_borrow`, no `marketId`, no LTV, no signing, no `viem`, no `web3.py`, no `PRIVATE_KEY`, no RPC URL, no gas token.

## 5. Topping up automatically

Production agents shouldn't sleep on a low balance. Two options:

- **Webhook**: in the dashboard, set a low-balance threshold (e.g., "alert when below $5"). Floe POSTs to your webhook URL so you can top up programmatically or page a human.
- **Auto-recharge**: connect a card and set "auto-recharge $50 when balance falls below $10". Floe handles the rest.

Both are in the dashboard under your agent's settings.

## 6. What's next

- [How my agent gets paid](../agents/credit-for-agents.md) — the same mechanics in reverse: receive x402 payments from other agents
- [Frameworks](../frameworks/agentkit.md) — drop FloeAgent into LangChain, CrewAI, Claude Desktop / MCP, OpenAI Agents SDK
- [The Voice Stack](../build/voice-stack.md) — run a full voice turn — STT, LLM, TTS, telephony — on one key, one budget

---

That's it — you funded an agent and made a paid API call, all in dollars.
