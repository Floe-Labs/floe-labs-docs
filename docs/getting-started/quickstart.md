---
icon: rocket
---

# Quickstart (5 minutes)

Wire the full Floe loop end-to-end: register an agent, fund the wallet, borrow against collateral, pay an x402 API, and repay. The same script runs in TypeScript or Python.

> Prefer to clone and run? Use [`floe-examples/financial-os-loop`](https://github.com/Floe-Labs/floe-examples/tree/main/financial-os-loop) — it's the canonical version of this guide.

---

## 1. Get an API key

1. Go to [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz)
2. Connect your wallet
3. Create an API key (`floe_live_...`)

## 2. Install the SDK

{% tabs %}
{% tab title="TypeScript" %}
```bash
npm install floe-agent @coinbase/agentkit viem
```
{% endtab %}
{% tab title="Python" %}
```bash
pip install floe-agentkit-actions coinbase-agentkit
```
{% endtab %}
{% endtabs %}

## 3. Run the loop

{% tabs %}
{% tab title="TypeScript" %}
```typescript
import { AgentKit, ViemWalletProvider } from "@coinbase/agentkit";
import { floeActionProvider } from "floe-agent";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const walletClient = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
  chain: base,
  transport: http(process.env.BASE_RPC_URL),
});
const walletProvider = new ViemWalletProvider(walletClient);

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [floeActionProvider({ facilitatorApiKey: process.env.FLOE_API_KEY })],
});

// 1. Borrow against on-chain collateral
const loan = await agentkit.run("instant_borrow", {
  borrowAmount: "5000000",      // 5 USDC
  collateralAmount: "6000000",  // 6 USDC
  maxInterestRateBps: "1200",
  duration: "604800",
});

// 2. Pay any x402 API through the Floe facilitator
await agentkit.run("x402_fetch", {
  url: "https://api.example.com/premium",
  method: "GET",
});

// 3. Repay — collateral auto-returns in the same tx
await agentkit.run("repay_loan", { loanId: loan.loanId });

// 4. Register a credit-utilization webhook for the next loan
await agentkit.run("register_credit_threshold", {
  utilizationBps: "8000",
  webhookUrl: "https://example.com/floe-webhook",
});
```
{% endtab %}
{% tab title="Python" %}
```python
from coinbase_agentkit import AgentKit, AgentKitConfig
from coinbase_agentkit.wallet_providers import EvmWalletProvider
from floe_agentkit_actions import floe_action_provider
import os

wallet_provider = EvmWalletProvider.from_private_key(
    private_key=os.environ["PRIVATE_KEY"],
    rpc_url=os.environ["BASE_RPC_URL"],
    network_id="base-mainnet",
)
provider = floe_action_provider(facilitator_api_key=os.environ["FLOE_API_KEY"])
agentkit = AgentKit(AgentKitConfig(
    wallet_provider=wallet_provider,
    action_providers=[provider],
))

# 1. Borrow against on-chain collateral
loan = provider.instant_borrow(wallet_provider, {
    "borrow_amount": "5000000",
    "collateral_amount": "6000000",
    "max_interest_rate_bps": "1200",
    "duration": "604800",
})

# 2. Pay any x402 API through the Floe facilitator
provider.x402_fetch(wallet_provider, {
    "url": "https://api.example.com/premium",
    "method": "GET",
})

# 3. Repay — collateral auto-returns in the same tx
provider.repay_loan(wallet_provider, {"loan_id": loan["loan_id"]})

# 4. Register a credit-utilization webhook for the next loan
provider.register_credit_threshold(wallet_provider, {
    "utilization_bps": "8000",
    "webhook_url": "https://example.com/floe-webhook",
})
```
{% endtab %}
{% endtabs %}

## 4. Don't have USDC yet?

Fund your agent's wallet with fiat directly from the [Floe dashboard](https://dev-dashboard.floelabs.xyz) — credit card, bank transfer, Apple Pay, or Google Pay via Coinbase. See [Fiat on/off-ramp](../components/onramp.md).

## 5. What's next

- Pick a framework: [AgentKit](../frameworks/agentkit.md), [LangChain](../frameworks/langchain.md), [CrewAI](../frameworks/crewai.md), [Claude/MCP](../frameworks/claude-mcp.md), [HTTP](../frameworks/http.md)
- Explore the components in depth: [Wallet](../components/wallet.md), [Secured credit](../components/secured-credit.md), [x402](../components/x402.md)
- Reference: [Credit REST API](../developers/credit-api.md), [MCP Server](../developers/mcp-server.md), [Webhooks](../developers/webhooks.md)
