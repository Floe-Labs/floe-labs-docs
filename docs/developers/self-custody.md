---
icon: key-skeleton
---

# Self-custody (advanced)

> **Most agent developers should not be on this page.** Floe's default flow gives you a top-up balance and a `floe_…` API key — your agent calls `fetch()`, money is deducted, you never touch a wallet, key, or token. If that sounds right for you, go to the [Quickstart](../getting-started/quickstart.md) and ignore this page.

This page is for the small set of teams who need to:

- Hold their own collateral signing key in their own infrastructure (HSM, KMS, MPC).
- Run a non-Privy custody stack (Fireblocks, Safe, in-house).
- Integrate Floe into an existing wallet provider that already signs on the user's behalf.
- Operate in a region where the card on-ramp isn't yet supported.

If none of those apply, the rest of this page will only add complexity.

---

## What changes

| | Default flow | Self-custody |
| --- | --- | --- |
| Agent wallet | Custodial Privy, operated by Floe | Yours — supply a wallet provider |
| Developer wallet | Non-custodial Privy (you own; we manage UX) | Yours — bring your own key |
| Auth | `floe_…` API key | API key **plus** sign every facilitator setup transaction yourself |
| `setOperator` delegation | Floe submits it server-side from the agent's wallet | You submit it from your wallet — see [x402 Credit Facilitator](x402-facilitator.md) |
| Gas | Floe pays | You pay |
| Funding | Card / Apple Pay / bank transfer via dashboard | You move USDC to your own wallet by whatever means you already use |
| Failure modes | Floe handles | You handle key custody, gas funding, and `setOperator` lifecycle |

The runtime API (`fetch`, balance, transactions, agent-awareness reads) is identical in both modes. The difference is only in who holds the signing key.

---

## TypeScript: AgentKit + viem

```typescript
import { AgentKit, ViemWalletProvider } from "@coinbase/agentkit";
import { floeActionProvider } from "floe-agent";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// You are responsible for sourcing this key securely — env var, HSM, KMS, etc.
const walletClient = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
  chain: base,
  transport: http(process.env.BASE_RPC_URL ?? "https://mainnet.base.org"),
});
const walletProvider = new ViemWalletProvider(walletClient);

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [
    floeActionProvider({ facilitatorApiKey: process.env.FLOE_AGENT_API_KEY }),
  ],
});
```

You also need to issue the on-chain `setOperator` permission to the facilitator EOA before the first borrow. See [x402 Credit Facilitator → OperatorPermission parameters](x402-facilitator.md#operatorpermission-parameters) for the field layout. The `grant_credit_delegation` action handles the call if you want to script it.

## Python: AgentKit + EVM wallet provider

```python
import os
from coinbase_agentkit import AgentKit, AgentKitConfig
from coinbase_agentkit.wallet_providers import EvmWalletProvider
from floe_agentkit_actions import floe_action_provider

wallet_provider = EvmWalletProvider.from_private_key(
    private_key=os.environ["PRIVATE_KEY"],
    rpc_url=os.environ.get("BASE_RPC_URL", "https://mainnet.base.org"),
    network_id="base-mainnet",
)
provider = floe_action_provider(facilitator_api_key=os.environ["FLOE_AGENT_API_KEY"])
agentkit = AgentKit(AgentKitConfig(
    wallet_provider=wallet_provider,
    action_providers=[provider],
))
```

---

## Gas

A self-custody agent pays its own gas in ETH on Base. Keep a few cents of ETH in the wallet at all times for the operator delegation call and any direct loan operations you submit yourself. The facilitator still pays gas on x402 settlements it performs on your behalf.

---

## Migration paths

- **Managed → self-custody**: close the managed agent from the dashboard's **Close agent** button (or `POST /v1/developer/agents/:agentId/close` — see [Credit API](credit-api.md#post-v1-developer-agents-agentid-close)), then re-register from your own wallet using the AgentKit action `grant_credit_delegation`. USDC is returned to your developer wallet before close.
- **Self-custody → managed**: revoke the operator permission from your wallet, then run `floe-agent register --name <name>`. The new managed Privy wallet starts empty — fund it via the dashboard.

---

## When this is the wrong path

If you're tempted to self-custody because of a specific worry, check first whether it applies to the default flow:

- "I want to own my keys" → Your developer wallet is already non-custodial — Privy holds shard custody, not Floe, and you can export the underlying private key any time. The agent's wallet is custodial because agents are software, not people; the on-chain `OperatorPermission` (revocable, rate-capped) constrains what Floe can do with it on your behalf.
- "I want to use Sepolia / a local devnet" → Self-custody is the right answer here; the default flow is mainnet-only.
- "I'm building a non-x402 product" → Most of Floe still works in the default flow (lending, intents, repayment). Only consider self-custody if you specifically need to hold your own collateral signing key.
- "I'm in a region the card on-ramp doesn't support" → Self-custody lets you bring USDC from wherever you already have it. That's a legitimate reason. Also email [support@floelabs.xyz](mailto:support@floelabs.xyz) — we have manual on-ramp options for several regions.
