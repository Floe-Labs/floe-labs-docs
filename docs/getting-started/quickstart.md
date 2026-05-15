---
icon: rocket
---

# Quickstart (5 minutes)

Wire the full Floe loop end-to-end: sign up, fund with a card, register an agent, borrow working capital, pay an x402 API. No private keys, no seed phrases, no chain IDs, no gas — for you *or* the agent. The same script runs in TypeScript or Python.

> **What you do not need:** MetaMask, Coinbase Wallet, a seed phrase, ETH for gas, an RPC URL, a chain ID, or a hex private key in your `.env`. Floe provisions a non-custodial wallet for you when you sign up, and a separate non-custodial wallet for each agent when you register one. Both are Privy-backed; you control them, but you don't manage keys.

> Prefer to clone and run? Use [`floe-examples/financial-os-loop`](https://github.com/Floe-Labs/floe-examples/tree/main/financial-os-loop) — it's the canonical version of this guide.

---

## 1. Sign up and fund — your developer wallet is provisioned for you

1. Go to [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) and sign in with email or social. Floe provisions a **non-custodial wallet for you** under the hood — you own it, but you never see a private key.
2. Click **Buy USDC** and pay with card, Apple Pay, Google Pay, or bank transfer. USDC lands in your developer wallet on Base within seconds. No bridge, no exchange account, no gas token.

Minimum to get going: **$10**. Full details in [Funding the agent](funding.md).

## 2. Register an agent and open its credit line — one CLI command each

This provisions a **second** non-custodial wallet (owned by your agent), mints a runtime API key, and opens a USDC/USDC credit line so the agent has spendable capital from the first call. All on-chain operations happen server-side from your Privy wallets — you don't sign anything by hand.

{% tabs %}
{% tab title="TypeScript" %}
```bash
npm install -g floe-agent
floe-agent register --name my-agent --borrow-limit 10000
floe-agent open-credit-line --name my-agent --deposit 10
```
{% endtab %}
{% tab title="Python" %}
```bash
pip install floe-agentkit-actions
floe-agent register --name my-agent --borrow-limit 10000
floe-agent open-credit-line --name my-agent --deposit 10
```
{% endtab %}
{% endtabs %}

The `register` command prints a key starting with `floe_…` — save it as `FLOE_AGENT_API_KEY`. The `open-credit-line` command deposits 10 USDC from the agent's wallet and borrows ~9.5 USDC against it as working capital at the conservative 95% LTV default. From here on, the `floe_…` key is the *only* credential your agent needs at runtime.

**Network:** the CLI defaults to **Base Mainnet** (production). Pass `--network base-sepolia` only if you want a testnet sandbox. See [Networks](../../developers/networks.md#which-network-should-i-use).

> Prefer a UI? Both steps are also available in the dashboard. Pick **Create agent**, then **Open credit line** — same outcome, same wallet provisioning.

## 3. Install the runtime SDK

{% tabs %}
{% tab title="TypeScript" %}
```bash
npm install floe-agent
```
{% endtab %}
{% tab title="Python" %}
```bash
pip install floe-agentkit-actions
```
{% endtab %}
{% endtabs %}

## 4. Pay any x402 API

This is the whole agent runtime. No wallet client, no RPC URL, no `PRIVATE_KEY` anywhere — the runtime key authenticates everything.

{% tabs %}
{% tab title="TypeScript" %}
```typescript
import { FloeAgent } from "floe-agent";

const agent = new FloeAgent({ apiKey: process.env.FLOE_AGENT_API_KEY! });

// Pay any x402-gated API. EIP-3009 signing, settlement, retries — all server-side.
const result = await agent.x402Fetch({
  url: "https://api.example.com/premium",
  method: "GET",
});

console.log(`Paid ${result.costRaw ?? "0"} (raw USDC) — got ${result.status}`);
console.log(result.body);

// Check what you have left.
const balance = await agent.getBalance();
console.log(`Available: ${balance.creditAvailableRaw} / ${balance.creditLimitRaw}`);
```
{% endtab %}
{% tab title="Python" %}
```python
import os
from floe_agentkit_actions import FloeAgent

agent = FloeAgent(api_key=os.environ["FLOE_AGENT_API_KEY"])

# Pay any x402-gated API. EIP-3009 signing, settlement, retries — all server-side.
result = agent.x402_fetch(url="https://api.example.com/premium", method="GET")

print(f"Paid {result.cost_raw or '0'} (raw USDC) — got {result.status}")
print(result.body)

# Check what you have left.
balance = agent.get_balance()
print(f"Available: {balance.credit_available_raw} / {balance.credit_limit_raw}")
```
{% endtab %}
{% endtabs %}

That's the whole agent. The facilitator auto-rolls the credit line before it expires; you don't have to repay manually. When you're done with the agent, `floe-agent close --name my-agent` repays everything and returns the residual USDC to your developer wallet.

### What was abstracted

- **Two wallets, both provisioned for you.** Your developer wallet (where fiat USDC lands) and the agent's wallet (which holds the working-capital deposit and pays merchants) are both non-custodial Privy wallets — you own them, but you never manage keys.
- **The credit line.** Opening, matching against a lender, rolling over before expiry, and final repayment all happen server-side from the agent's wallet. The runtime code never imports `viem`, `web3.py`, or anything chain-aware.
- **x402 signing.** `x402_fetch` constructs the EIP-3009 payment authorization, attaches the `X-PAYMENT` header, negotiates protocol version (v1 / v2), and handles settlement reconciliation — all server-side.
- **Gas.** The facilitator pays gas. Agents only spend USDC.

### Tuning the LTV (optional)

The default LTV for USDC/USDC is conservative — it leaves a 5% buffer for interest accrual before liquidation. If your agent repays on a short cadence (e.g., per-task, intraday) you can push it higher when you open the credit line and reduce capital lock-up:

```bash
floe-agent open-credit-line --name my-agent --deposit 100 --max-ltv 9900
```

The 99% ceiling is **only safe for short-duration credit lines.** At 12% APR you have roughly 30 days before accrued interest pushes you past the liquidation threshold. Liquidation here is rate-of-interest, not price. Default to 95% unless you have automation that closes / rolls the line on a tight cadence.

## 5. What's next

- Pick a framework: [AgentKit](../frameworks/agentkit.md), [LangChain](../frameworks/langchain.md), [CrewAI](../frameworks/crewai.md), [Claude/MCP](../frameworks/claude-mcp.md), [HTTP](../frameworks/http.md)
- Explore the components in depth: [Wallet](../components/wallet.md), [Secured credit](../components/secured-credit.md), [x402](../components/x402.md)
- Reference: [Credit REST API](../developers/credit-api.md), [MCP Server](../developers/mcp-server.md), [Webhooks](../developers/webhooks.md)
- Running your own keys (HSM/KMS, existing wallet stack)? See [Self-custody (advanced)](../developers/self-custody.md).
