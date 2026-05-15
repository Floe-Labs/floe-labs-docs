---
icon: rocket
---

# Quickstart (5 minutes)

Wire the full Floe loop end-to-end: register an agent, fund it with a card, deposit working capital, pay an x402 API. No private keys, no chain IDs, no gas. The same script runs in TypeScript or Python.

> Prefer to clone and run? Use [`floe-examples/financial-os-loop`](https://github.com/Floe-Labs/floe-examples/tree/main/financial-os-loop) — it's the canonical version of this guide.

---

## 1. Register an agent and get a runtime key

The CLI provisions a managed wallet for your agent server-side, sets up the on-chain delegation, and prints a runtime API key once.

{% tabs %}
{% tab title="TypeScript" %}
```bash
npx floe-agent register --name my-agent --borrow-limit 10000
```
{% endtab %}
{% tab title="Python" %}
```bash
pip install floe-agentkit-actions
floe-agent register --name my-agent --borrow-limit 10000
```
{% endtab %}
{% endtabs %}

The command prints a key beginning with `floe_…`. Save it as `FLOE_AGENT_API_KEY`. The agent's wallet is custodied by Floe — you never see or manage its private key.

> Want a UI instead? Go to [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz), connect a wallet, and click **Create agent**. The dashboard mints the same `floe_…` key.

**Network:** the CLI defaults to **Base Mainnet** (production). Pass `--network base-sepolia` only if you want a testnet sandbox. See [Networks](../../developers/networks.md#which-network-should-i-use).

## 2. Install the SDK

{% tabs %}
{% tab title="TypeScript" %}
```bash
npm install floe-agent @coinbase/agentkit
```
{% endtab %}
{% tab title="Python" %}
```bash
pip install floe-agentkit-actions coinbase-agentkit
```
{% endtab %}
{% endtabs %}

## 3. Fund the agent

Fund the agent's wallet with a card, Apple Pay, Google Pay, or bank transfer from the [dashboard](https://dev-dashboard.floelabs.xyz). USDC arrives in seconds. No bridge, no gas token, no exchange account needed.

Minimum to get going: **$10**. See [Funding the agent](funding.md) for details and failure recovery.

## 4. Run the loop

The runtime key authenticates every call. There is no wallet client, no RPC URL, no `PRIVATE_KEY` in your `.env`.

{% tabs %}
{% tab title="TypeScript" %}
```typescript
import { FloeAgent } from "floe-agent";

const agent = new FloeAgent({ apiKey: process.env.FLOE_AGENT_API_KEY });

// 1. Open a working-capital credit line.
//    Deposit $6, borrow $5 → 83% LTV (max is 95%, plenty of headroom for interest accrual).
//    With collateral and loan both in USDC there is no price risk.
const loan = await agent.instantBorrow({
  borrowAmount:   "5000000",  // $5 USDC (6 decimals)
  collateralAmount: "6000000", // $6 USDC
  maxInterestRateBps: "1200", // accept up to 12% APR
  duration: "604800",         // 1 week
});

// 2. Pay any x402-gated API. EIP-3009 signing, settlement, retries — all server-side.
const data = await agent.x402Fetch({
  url: "https://api.example.com/premium",
  method: "GET",
});

// 3. Repay — deposit auto-returns in the same transaction.
await agent.repayLoan({ loanId: loan.loanId });
```
{% endtab %}
{% tab title="Python" %}
```python
import os
from floe_agentkit_actions import FloeAgent

agent = FloeAgent(api_key=os.environ["FLOE_AGENT_API_KEY"])

# 1. Open a working-capital credit line.
#    Deposit $6, borrow $5 → 83% LTV (max is 95%, plenty of headroom for interest accrual).
#    With collateral and loan both in USDC there is no price risk.
loan = agent.instant_borrow(
    borrow_amount="5000000",       # $5 USDC (6 decimals)
    collateral_amount="6000000",   # $6 USDC
    max_interest_rate_bps="1200",  # accept up to 12% APR
    duration="604800",             # 1 week
)

# 2. Pay any x402-gated API. EIP-3009 signing, settlement, retries — all server-side.
data = agent.x402_fetch(url="https://api.example.com/premium", method="GET")

# 3. Repay — deposit auto-returns in the same transaction.
agent.repay_loan(loan_id=loan["loan_id"])
```
{% endtab %}
{% endtabs %}

### What was abstracted

- **Market selection.** `instant_borrow` defaults to the USDC/USDC market because collateral and loan token are both USDC. To borrow against WETH or cbBTC, pass `marketId` explicitly — see [Active Markets](../../developers/networks.md#active-markets).
- **Signing.** `x402_fetch` constructs and signs the EIP-3009 payment authorization from the agent's managed wallet. Your code never imports `viem` or handles a private key.
- **Gas.** The facilitator pays gas for on-chain settlement. Agents only spend USDC.

### Tuning the LTV (optional)

The default LTV for USDC/USDC is conservative — it leaves a 5% buffer for interest accrual. If your agent repays on a short cadence (e.g., per-task, intraday) you can push it higher and reduce capital lock-up:

```python
loan = agent.instant_borrow(
    borrow_amount="99000000",      # $99
    collateral_amount="100000000", # $100  → 99% LTV
    max_ltv_bps="9900",            # opt in to aggressive mode
    max_interest_rate_bps="1200",
    duration="86400",              # 1 day — short, by design
)
```

The 99% ceiling is **only safe for short-duration USDC/USDC loans.** At 12% APR you have roughly 30 days before accrued interest pushes you past the liquidation threshold. Liquidation here is rate-of-interest, not price. Default to 95% unless you have automation that guarantees repayment cadence.

## 5. What's next

- Pick a framework: [AgentKit](../frameworks/agentkit.md), [LangChain](../frameworks/langchain.md), [CrewAI](../frameworks/crewai.md), [Claude/MCP](../frameworks/claude-mcp.md), [HTTP](../frameworks/http.md)
- Explore the components in depth: [Wallet](../components/wallet.md), [Secured credit](../components/secured-credit.md), [x402](../components/x402.md)
- Reference: [Credit REST API](../developers/credit-api.md), [MCP Server](../developers/mcp-server.md), [Webhooks](../developers/webhooks.md)
- Running your own keys? See [Self-custody (advanced)](../developers/self-custody.md).
