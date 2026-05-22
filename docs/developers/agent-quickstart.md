---
icon: rocket
---

# Agent Working Capital Quickstart

Give your agent a balance sheet in under a minute.

For a guided setup experience, use the [Developer Dashboard](developer-dashboard.md) at `dev-dashboard.floelabs.xyz`.

> **$2 free credit (~200 API calls).** Your agent can start paying for APIs today — no card required. [Get started →](https://dev-dashboard.floelabs.xyz)

## Check Live Offers First

See what lenders are offering right now — no auth, no setup:

```bash
curl "https://credit-api.floelabs.xyz/v1/credit/offers"
```

## Get Working Capital in 3 Steps

```typescript
import { floeActionProvider } from "floe-agent";

// 1. Set up Floe actions
const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [floeActionProvider({ rpcUrl: "https://mainnet.base.org" })],
});

// 2. Deposit USDC and borrow against it instantly
const loan = await agentkit.invoke("instant_borrow", {
  borrowAmount: "9500000000",            // $9,500 USDC working capital
  collateralAmount: "10000000000",       // $10,000 USDC deposit
  maxInterestRateBps: "800",             // up to 8% APR
  duration: "2592000",                   // 30 days
});
// → loan.loanId, loan.rate, loan.collateralLocked

// 3. Check your credit line anytime
const status = await agentkit.invoke("check_credit_status", {
  loanId: loan.loanId,
});
// → status.totalDebt, status.currentLtvBps, status.daysRemaining
```

**Not using AgentKit?** Run the complete [Python example](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/borrow.py) or [TypeScript example](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/borrow.ts) — or use the [Credit REST API](credit-api.md) directly.

## What Just Happened

Floe queried all available lenders on Base, selected the best rate for your amount, and executed the match on-chain. Your $10,000 USDC deposit is held by the protocol's smart contract as collateral. $9,500 USDC was transferred to your agent's wallet as working capital. When you repay, your full deposit returns automatically.

**No price risk.** Both the collateral and the loan are USDC, so there's no liquidation risk from market movements. The only way to be liquidated is if accrued interest pushes your debt above the liquidation threshold — and with a 95% LTV, that takes a long time.

## Markets

| Market | Deposit (Collateral) | Borrow (Working Capital) | Max LTV |
|--------|---------------------|--------------------------|---------|
| **USDC/USDC** | USDC | USDC | **95%** |
| WETH/USDC | ETH | USDC | 70% |
| cbBTC/USDC | cbBTC | USDC | 70% |

**USDC/USDC is the recommended market for most agents.** No price volatility, no liquidation surprises. See the [Credit REST API](credit-api.md#markets) for marketIds and token addresses.

## Want Automatic API Payments?

If your agent calls x402-enabled APIs, you don't need to manage USDC manually. Delegate your collateral to the x402 facilitator and it handles everything:

`grant_credit_delegation` is the **AgentKit wrapper** — under the hood it calls `POST /v1/developer/agents` (which provisions a managed Privy wallet and submits the on-chain `setOperator` delegation server-side) followed by `POST /v1/developer/agents/:id/keys` to mint the agent's runtime API key. If you're scripting from outside an AgentKit session, prefer the CLI: `floe-agent register --name <name>`.

```typescript
// One-time setup: provision a Floe credit agent.
await agentkit.invoke("grant_credit_delegation", {
  name: "my-agent",                     // unique label per developer
  facilitatorUrl: "https://credit-api.floelabs.xyz",
  borrowLimit: "10000",                 // $10,000 max credit (USDC)
  maxRateBps: "1500",                   // cap at 15% APR
  expiryDays: "90",                     // delegation TTL
});

// Now call any x402 API — payment is automatic
await agentkit.invoke("x402_fetch", { url: "https://api.example.com/data" });
```

See **[x402 Credit Facilitator](x402-facilitator.md)** for the complete reference.

## Full Happy Path Example

End-to-end, from zero to your agent's first paid API call. Everything the deployer does once, and the agent code that runs forever after.

### 1. Developer signs in (SIWE)

Visit [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) and connect a wallet. The dashboard asks for a signature (no passwords, no email — wallet signature is identity) and issues a 7-day JWT.

### 2. Mint a developer API key

From the **Keys** page, create a key:

```json
{
  "id": "key_01J...",
  "key": "floe_live_7a2b9c4d8e...",
  "label": "prod-backend",
  "createdAt": "2026-04-07T12:00:00Z"
}
```

This key is for dashboard and webhook management — it's **not** what the agent uses at runtime.

### 3. Create the agent

On the **Agents** page, click **Create Agent** and fill in a name, borrow limit, max rate, and expiry. Floe provisions a managed Privy wallet for the agent and submits the `setOperator` delegation on-chain from that Privy wallet — **you sign nothing on-chain from your developer wallet.** The wizard shows the new wallet address once provisioning is complete. The API response surfaces this as `privyWalletAddress` (also exposed as `agentWalletAddress` for backward compatibility) — both fields point to the same address, which you'll fund in step 4.

Or skip the dashboard entirely:

```bash
# TypeScript SDK
npx floe-agent register --name my-agent --borrow-limit 10000

# Python SDK
floe-agent register --name my-agent --borrow-limit 10000
```

The CLI signs a wallet auth message (no on-chain tx), calls the same `POST /v1/developer/agents` endpoint, mints the runtime API key, and stores it in your OS keychain.

### 4. Fund the agent wallet

The recommended path is the dashboard's **Fund Wallet** button — pay with card, Apple Pay, Google Pay, or bank transfer. USDC lands in the agent's wallet on Base within seconds. No ETH, no gas tokens, no bridge.

Advanced (only if you already hold USDC on Base): you can also transfer USDC directly from your own wallet to the agent's deposit address shown in the dashboard. Make sure you're on **Base** — sending from any other chain is unrecoverable. Full details: [Funding the agent](../getting-started/funding.md).

**Takeaway:** this USDC is the collateral backing every future `/proxy/fetch` charge. No ETH or gas tokens needed.

### 5. Open the credit line

Provisioning gave the agent a `creditLimit` but no facility loan yet. Open it now so the agent has spendable USDC:

```bash
# CLI
npx floe-agent open-credit-line --name my-agent --deposit 10000
# (or: floe-agent open-credit-line --name my-agent --deposit 10000  for Python)

# REST
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/agents/<agentId>/open-credit-line" \
  -H "Authorization: Bearer floe_live_YOUR_DEV_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "depositRaw": "10000000000" }'
```

Floe server-signs the borrow intent from the agent's Privy wallet (USDC/USDC market, 95% LTV by default). The solver matches it asynchronously and `creditIn` becomes non-zero a few seconds later — at that point your agent's `/proxy/fetch` calls start succeeding.

### 6. Reveal the agent's API key

In the dashboard, click **Reveal API Key** on the agent card. The key is shown **once**:

```json
{ "key": "floe_3c9f8e1a2b...", "id": 7, "keyPrefix": "3c9f8e1a..." }
```

Copy it now — it won't be shown again. This is `FLOE_API_KEY`. If you used the CLI, the key was printed during `register` and is already in your OS keychain.

### 7. Agent code — TypeScript

```ts
const FLOE = 'https://credit-api.floelabs.xyz/v1/proxy/fetch';

async function paidFetch(url: string, body: unknown) {
  const res = await fetch(FLOE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FLOE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });

  if (res.status === 429) {
    const { retry_after_seconds } = await res.json();
    await new Promise(r => setTimeout(r, retry_after_seconds * 1000));
    return paidFetch(url, body);
  }
  if (res.status === 502) {
    const b = await res.json();
    if (b.error === 'upstream_paid_request_failed_ambiguous') {
      throw new Error('ambiguous payment; wait for reconciliation');
    }
  }
  if (!res.ok) throw new Error(`floe ${res.status}`);
  return res.json();
}

const data = await paidFetch('https://api.example.com/premium/analyze', { prompt: 'hi' });
```

### 8. Agent code — Python

```python
import os, time, httpx

FLOE = "https://credit-api.floelabs.xyz/v1/proxy/fetch"

def paid_fetch(url: str, body: dict) -> dict:
    with httpx.Client(timeout=60) as c:
        res = c.post(
            FLOE,
            headers={
                "Authorization": f"Bearer {os.environ['FLOE_API_KEY']}",
                "Content-Type": "application/json",
            },
            json={"url": url, "method": "POST",
                  "headers": {"Content-Type": "application/json"},
                  "body": __import__("json").dumps(body)},
        )
    if res.status_code == 429:
        time.sleep(res.json()["retry_after_seconds"])
        return paid_fetch(url, body)
    if res.status_code == 502:
        b = res.json()
        if b.get("error") == "upstream_paid_request_failed_ambiguous":
            raise RuntimeError("ambiguous payment; wait for reconciliation")
    res.raise_for_status()
    return res.json()

data = paid_fetch("https://api.example.com/premium/analyze", {"prompt": "hi"})
```

One env var, one function, full payment abstraction. See [Agent Runtime Contract](agent-runtime-contract.md) for the complete error matrix.

## Next Steps

- **[Developer Dashboard](developer-dashboard.md)** — Manage agents, keys, and webhooks through a web UI
- **[API Keys](api-keys.md)** — Generate keys for programmatic access
- **[x402 Credit Facilitator](x402-facilitator.md)** — Zero-touch API payments
- **[Credit REST API](credit-api.md)** — HTTP endpoints for any language
- **[AgentKit Integration](agentkit.md)** — Full action reference (45 actions, TypeScript + Python)
- **[Agent Working Capital](agent-working-capital.md)** — Deep dive into credit design and supported markets
