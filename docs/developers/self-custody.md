---
icon: key-skeleton
---

# Self-custody (advanced)

> **Most agent developers should not be on this page.** Floe's default flow uses a managed wallet provisioned per agent and a `floe_…` runtime API key — you don't manage a private key, you don't pay gas, and you don't need to know that this page exists. See [Quickstart](../getting-started/quickstart.md).

This page is for the small set of teams who need to:

- Hold the agent's signing key in their own infrastructure (HSM, KMS, MPC).
- Run a non-Privy custody stack (Fireblocks, Safe, in-house).
- Integrate Floe into an existing wallet provider that already signs on the user's behalf.

If none of those apply, the rest of this page will only add complexity.

---

## What changes

| | Managed (default) | Self-custody |
| --- | --- | --- |
| Wallet | Privy, provisioned by Floe per agent | Yours — supply a wallet provider |
| Auth | `Authorization: Bearer floe_…` | `Authorization: Bearer floe_…` **plus** sign every facilitator setup tx yourself |
| `setOperator` delegation | Floe submits it server-side from the agent's Privy wallet | You submit it from your wallet to the facilitator EOA — see [x402 Credit Facilitator](x402-facilitator.md) |
| Gas | Floe pays | You pay |
| Funding | Card / Apple Pay via dashboard | You move USDC to your own wallet by whatever means you already use |
| Failure modes | Centralized on Floe's infra | Distributed — you own key custody, gas funding, and `setOperator` lifecycle |

The runtime API (`x402_fetch`, `instant_borrow`, `repay_loan`, the credit-awareness endpoints) is identical in both modes. The difference is only in who holds the signing key.

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
  actionProviders: [floeActionProvider({ apiKey: process.env.FLOE_AGENT_API_KEY })],
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
provider = floe_action_provider(api_key=os.environ["FLOE_AGENT_API_KEY"])
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

- **Managed → self-custody**: close the managed agent (`floe-agent close --name <name>`) and re-register from your own wallet using the AgentKit action `grant_credit_delegation`. USDC is returned to your developer wallet before close.
- **Self-custody → managed**: revoke the operator permission from your wallet, then run `floe-agent register --name <name>`. The new managed Privy wallet starts empty — fund it via the dashboard.

---

## When this is the wrong path

If you're tempted to self-custody because of a specific worry, check first whether it applies to managed wallets:

- "I want to control the keys" → managed Privy wallets are non-custodial from Floe's perspective (Privy holds shard custody, not Floe), and the on-chain `OperatorPermission` is revocable and rate-capped.
- "I want to use Sepolia / a local devnet" → self-custody is the right answer here; the managed flow is mainnet-only.
- "I'm building a non-x402 product" → most of Floe still works in the managed flow (lending, intents, repayment). Only consider self-custody if you specifically need to hold your own collateral signing key.
