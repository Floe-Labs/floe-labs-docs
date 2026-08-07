---
icon: rocket
---

# Quickstart (5 minutes)

Create an agent, connect your tools, and make your first paid API call on the **$3 Welcome Credit** — no card required. Cap spending with server-side controls you set — per task, day, vendor, or team (set them once you've seen it work). That's the whole product: **a budget, not a balance.** No wallets to install, no provider or wallet keys to manage, no tokens to buy, no gas to pay.

> **$3 Welcome Credit (300 API credits).** Roughly 300 calls at a typical ~$0.01/call — the cheapest vendors (like $0.001 Exa Contents) stretch it into the thousands. Your first agent can start paying for APIs today, no card required. The grant is once per account, not per agent. [Get started →](https://dev-dashboard.floelabs.xyz)

---

## 1. Create an agent

Go to [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz), sign in with email, Google, or a wallet, and click **New agent**. Copy the API key (starts with `floe_…`) — it's shown once.

Floe provisions everything your agent needs in the background — a managed wallet and the **$3 Welcome Credit**. No "connect wallet" step, no MetaMask, no seed phrase.

## 2. Connect to your AI tools & models

Point your coding agent at Floe and it does the setup for you — installs a client, provisions an agent, sets guardrails, and makes a real paid call. Paste this into Claude Code, Cursor, or Codex:

```text
Read https://dev-dashboard.floelabs.xyz/agents.md and set up Floe for this project.
```

`agents.md` is an executable runbook written for agents: it triages what you already have, installs the right client, states the key-handling rules, provisions an agent, and ends with a settled paid call.

Prefer to wire it up yourself? Pick one client:

{% tabs %}
{% tab title="Skill" %}
Install the Floe agent skill so Claude Code / Cursor knows the whole workflow — onboard, migrate, cap spend, show the receipt:

```bash
npx skills add floe-labs/agent-skills
```

Full guide: [Claude Code / Agent Skills](claude-code-skill.md).
{% endtab %}
{% tab title="MCP" %}
Claude Code, one line:

```bash
claude mcp add --transport http floe https://mcp.floelabs.xyz/mcp \
  --header "Authorization: Bearer YOUR_FLOE_KEY"
```

Any client that takes JSON (Cursor `.cursor/mcp.json`, VS Code):

```json
{
  "mcpServers": {
    "floe": {
      "type": "http",
      "url": "https://mcp.floelabs.xyz/mcp",
      "headers": { "Authorization": "Bearer YOUR_FLOE_KEY" }
    }
  }
}
```

Full reference: [MCP Server](../developers/mcp-server.md). Deep links and per-client configs: [Set up with your AI tools](setup-with-ai-tools.md).
{% endtab %}
{% tab title="CLI" %}
```bash
npx @floelabs/cli init   # onboard: create or select an agent, mint its key, get the base-URL swap
npm i -g @floelabs/cli   # keeps the `floe` bin around for the commands below
floe status --json       # am I set up? balance, budgets, active agent + key
```

And everything else lives on the same bin — `floe chat "hi"` for a metered LLM call, `floe budget set 5 --per day` to cap spend, `floe activity` to watch the money. Full reference: [Floe CLI](../developers/cli.md).
{% endtab %}
{% tab title="SDK" %}
```bash
pip install floe-agentkit-actions      # Python
npm install floe-agent                 # TypeScript
```

The SDK takes an **agent** key (`floe_…`), not a `floe_live_…` developer key. See [Set up with your AI tools](setup-with-ai-tools.md).
{% endtab %}
{% endtabs %}

## 3. Make your first paid call

Spend the **$3 Welcome Credit** — no card needed. Install the SDK and call `fetch`. If the API is x402-gated, payment happens automatically; if it's free, the request passes through. Either way, your agent's balance updates.

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
{% tab title="CLI" %}

```bash
floe test                # one real metered call — the key is already in your keychain from `floe init`
```

That's a fraction of a cent against the **$3 Welcome Credit** — the settled cost prints from the `X-Floe-Cost-USDC` receipt header. `floe test --voice` runs a full STT → LLM → TTS turn: three legs, one key, one bill.
{% endtab %}
{% endtabs %}

That's the entire happy path. No `instant_borrow`, no `marketId`, no LTV, no signing, no `viem`, no `web3.py`, no `PRIVATE_KEY`, no RPC URL, no gas token.

## 4. Fund & set budgets (later)

You don't need any of this to make your first call — the Welcome Credit covers it. Come back once you've seen the loop work.

- **Fund it.** When the Welcome Credit runs low, click **Fund Wallet** on the agent and pay with **card, Apple Pay, Google Pay, or bank transfer**. Funds arrive within seconds. Suggested first amount: **$10**. See [Funding your agent](funding.md).
- **Set a spend control.** Cap what the agent can spend — per call, per day, per vendor, or across your whole team. Enforced server-side, so a runaway loop can't blow your budget. See [Spend Controls](../developers/spend-controls.md). (Scope note: Floe caps x402 payments made through the proxy, not LLM token bills you pay with your own provider key.)

## What's next

- [Set up with your AI tools](setup-with-ai-tools.md) — deep links and per-client MCP configs
- [Add Floe to your existing pipeline](integrate-existing-pipeline.md) — drop Floe into Vapi, Retell, Pipecat, LiveKit, and more
- [The Voice Stack](../build/voice-stack.md) — run a full voice turn — STT, LLM, TTS, telephony — on one key, one budget
- [Floe CLI](../developers/cli.md) — every command, flag, and exit code

---

That's it — you made a paid API call on the Welcome Credit, all in dollars.
