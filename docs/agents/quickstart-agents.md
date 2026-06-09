# Quick Start (Agents)

Give your agent a funded balance and let it pay for any x402 API in **5 minutes.** No wallets to install, no tokens to buy, no gas. Gas-free.

> The fastest path is the [walletless Quickstart](../getting-started/quickstart.md) — create an agent in the dashboard, fund it with a card, call `fetch()`. This page covers the SDK path for teams already running their own framework.

---

## What you'll need

- Node.js 18+ (or Python 3.10+)
- A Floe agent + API key from the [Developer Dashboard](https://dev-dashboard.floelabs.xyz) (Floe provisions the wallet — no seed phrase)
- A funded balance (buy USDC with a card in the dashboard, or send USDC on Base)

---

## Step 1 — Install

### TypeScript

```bash
npm install floe-agent @coinbase/agentkit viem zod
```

### Python

```bash
pip install floe-agentkit-actions
```

Both SDKs expose the same **47 actions** (52 once the upcoming allowlist actions ship). Pick the one that matches your stack.

---

## Step 2 — Connect

### TypeScript (with Coinbase AgentKit)

```ts
import { AgentKit } from "@coinbase/agentkit";
import { floeActionProvider } from "floe-agent";

const agent = await AgentKit.from({
  walletProvider, // your existing wallet provider
  actionProviders: [floeActionProvider()],
});
```

### Python (with Coinbase AgentKit)

```python
from floe_agentkit_actions import FloeActionProvider

provider = FloeActionProvider()
# Register with your AgentKit agent
```

### Zero-install — MCP

If your agent supports MCP (Claude Desktop, Cursor), add Floe's hosted MCP server — see [MCP Server](../developers/mcp-server.md).

---

## Step 3 — Pay for an API

Call any x402 API through the proxy. Payment comes from your prepaid balance automatically; if the API is free, the request passes through.

```ts
const response = await agent.run("x402_fetch", {
  url: "https://api.example.com/premium/data",
  method: "POST",
  body: { prompt: "..." },
});
```

Check what's left any time:

```ts
await agent.run("x402_get_balance", {});
```

---

## Step 4 — Reason before you spend

Use the agent-awareness tools to preflight cost and check balance before committing:

| Action | When to use |
|---|---|
| `estimate_x402_cost` | Preflight a URL — cost + reflection against your balance, no payment |
| `get_credit_remaining` | Available balance and headroom |
| `get_spend_limit` / `set_spend_limit` / `clear_spend_limit` | Manage session spend caps |

Full action reference: [AgentKit Actions](../developers/agentkit.md) (47 actions).

---

## Advanced (in development): on-chain working capital

Borrowing USDC against on-chain collateral (`instant_borrow`, `repay_credit`, `add_collateral`) is part of Floe's **in-development** self-custody credit layer — not generally available. See [Working capital (on-chain)](../components/secured-credit.md).

---

## Next steps

- [How Agents Pay With Floe](credit-for-agents.md) — full overview
- [Agent Quickstart (Developer)](../developers/agent-quickstart.md) — complete happy-path walkthrough
- [x402 Credit Facilitator](../developers/x402-facilitator.md) — zero-touch API payments
- [Credit REST API](../developers/credit-api.md) — HTTP endpoints, no SDK needed
