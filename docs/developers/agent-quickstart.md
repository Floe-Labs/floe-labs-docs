---
icon: rocket
---

# Agent Working Capital Quickstart

Get USDC working capital into your agent's wallet in under a minute.

For a guided setup experience, use the [Developer Dashboard](developer-dashboard.md) at `dev-dashboard.floelabs.xyz`.

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

**USDC/USDC is the recommended market for most agents.** No price volatility means no liquidation surprises.

See the [Credit REST API](credit-api.md#markets) for marketIds and token addresses.

## Want Automatic API Payments?

If your agent calls x402-enabled APIs, you don't need to manage USDC manually. Delegate your collateral to the x402 facilitator and it handles everything:

`grant_credit_delegation` is the **AgentKit wrapper** — under the hood it pre-registers a Privy wallet, calls `setOperator` on the `LendingIntentMatcher` contract, approves collateral, and finalizes agent registration, all in one action. If you're integrating directly against the REST API, use the `setOperator` snippet in the [Full Happy Path Example](#full-happy-path-example) below.

```typescript
// One-time setup: delegate USDC collateral (AgentKit wrapper)
await agentkit.invoke("grant_credit_delegation", {
  facilitator_url: "https://credit-api.floelabs.xyz",
  facilitator_address: "0x58EDdE022FFDAD3Fb0Fb0E7D51eb05AaF66a31f1", // Base mainnet
  borrow_limit: "10000",                // $10,000 max credit
  max_rate_bps: 1500,                   // cap at 15% APR
  expiry_days: 90,                      // delegation TTL
  collateralToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
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

### 3. Run the agent wizard

On the **Agents** page, walk through: **Create Wallet > Deposit & Delegate > Activate Agent**. Step 1 provisions a payment wallet and returns `privyWalletAddress`.

### 4. Deposit USDC collateral

Send USDC from your wallet to the returned `privyWalletAddress`. This is the collateral backing every future API charge.

> **Coming soon:** Fund with credit card or bank transfer via the dashboard.

### 5. Sign `setOperator` on-chain

The wizard shows the payment wallet address. Grant the facilitator permission to borrow on your behalf:

```ts
import { useWriteContract } from 'wagmi';

const FACILITATOR_EOA = '0x58EDdE022FFDAD3Fb0Fb0E7D51eb05AaF66a31f1';

writeContract({
  address: LENDING_INTENT_MATCHER_ADDRESS,
  abi: lendingIntentMatcherAbi,
  functionName: 'setOperator',
  args: [
    FACILITATOR_EOA,
    {
      borrowLimit: 10_000_000000n,      // $10,000 USDC (6 decimals)
      maxRateBps: 1500n,                // cap at 15% APR
      expiry: BigInt(Math.floor(Date.now() / 1000) + 90 * 24 * 3600),
      onBehalfOfRestriction: privyWalletAddress,
    },
  ],
});
```

This is the **only** on-chain transaction the deployer ever signs. After this, the facilitator manages everything within those bounds.

### 6. Activate the agent

Click **Complete Registration**. The dashboard verifies the on-chain delegation and reveals the agent's runtime API key:

```json
{ "apiKey": "floe_3c9f8e1a2b..." }
```

Copy it now — it won't be shown again. This is `FLOE_API_KEY`.

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
- **[AgentKit Integration](agentkit.md)** — Full action reference (36 actions, TypeScript + Python)
- **[Agent Working Capital](agent-working-capital.md)** — Deep dive into credit design and supported markets
