---
icon: zap
---

# x402 Credit Facilitator

Pay for any x402-enabled API with Floe credit. No pre-funding, no wallet management — delegate your collateral and the facilitator handles everything.

**Works with 13,000+ existing x402 APIs** on Base — no per-service integration needed.

## How It Works

```
Agent has ETH/cbBTC collateral
    │
    ├── 1. Grant delegation to facilitator (one-time)
    │      → Facilitator borrows USDC against your collateral
    │      → Borrowed USDC funds a custodial payment wallet
    │
    ├── 2. Call x402 APIs through the facilitator
    │      → Facilitator auto-pays from your credit balance
    │      → You get the API response
    │
    └── 3. When done, revoke delegation
           → Facilitator repays loans, collateral returns to you
```

You keep your collateral. The facilitator borrows against it and manages the entire payment lifecycle — borrowing, paying APIs, rolling over loans before they expire, and returning everything when you're done.

## Quick Start

### With AgentKit (recommended)

```typescript
import { x402ActionProvider } from "@floe/agentkit-actions";

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [
    x402ActionProvider({ facilitatorUrl: "https://x402.floelabs.xyz" }),
  ],
});

// One action: creates wallet, sets delegation, approves collateral, registers
const result = await agentkit.invoke("grant_credit_delegation", {
  facilitatorAddress: "0x...",  // provided by the facilitator
  facilitatorUrl: "https://x402.floelabs.xyz",
  borrowLimit: "10000",         // $10K max credit
  maxRateBps: "1500",           // 15% max interest rate
  expiryDays: "90",             // 90-day delegation
  collateralToken: "0x4200000000000000000000000000000000000006", // WETH
});
// → result.apiKey, result.creditLimit, result.privyWalletAddress

// Now fetch any x402 API
const data = await agentkit.invoke("x402_fetch", {
  url: "https://api.example.com/premium-data",
});
```

### With curl

```bash
# Step 1: Register (get your API key — contact Floe team for pilot access)
# Step 2: Start making calls
curl -X POST https://x402.floelabs.xyz/proxy/fetch \
  -H "Authorization: Bearer floe_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://api.example.com/data", "method": "GET" }'
```

### With Python

```python
from floe_agentkit_actions import x402_action_provider, X402Config

provider = x402_action_provider(X402Config(
    facilitator_url="https://x402.floelabs.xyz",
))
# Register with AgentKit — 6 x402 actions available
```

Or use the REST API directly:

```python
import requests

API_KEY = "floe_YOUR_API_KEY"
BASE = "https://x402.floelabs.xyz"
headers = { "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json" }

# Make a paid API call
resp = requests.post(f"{BASE}/proxy/fetch", headers=headers, json={
    "url": "https://api.example.com/data",
    "method": "GET",
})
print(resp.json())  # Response from the target API
```

## Registration

Registration is a two-step process:

1. **Pre-register** — creates your custodial payment wallet
2. **Grant delegation on-chain** — approves the facilitator to borrow on your behalf
3. **Complete registration** — facilitator verifies delegation, activates your account

With AgentKit, `grant_credit_delegation` handles all three steps behind one action.

## AgentKit Actions

| Action | Type | Description |
|--------|------|-------------|
| `grant_credit_delegation` | Setup | One-time: creates wallet, sets operator delegation, approves collateral, registers |
| `revoke_credit_delegation` | Teardown | Revokes delegation — triggers wind-down (loans repaid, collateral returned) |
| `check_credit_delegation` | Read | Check delegation status: borrowed vs limit, rate cap, expiry |
| `x402_fetch` | Proxy | Fetch any URL — auto-pays if 402, passthrough if free |
| `x402_get_balance` | Read | Credit status: limit, used, available, active loans |
| `x402_get_transactions` | Read | Payment history with pagination |

## REST API Reference

**Base URL:** `https://x402.floelabs.xyz`

### Public (No Auth)

#### GET /proxy/check

Check if a URL requires x402 payment.

```bash
curl "https://x402.floelabs.xyz/proxy/check?url=https://api.example.com/data"
```

### Authenticated (Bearer token)

#### POST /proxy/fetch

Proxy a request. Handles x402 payments automatically.

```json
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": { "Accept": "application/json" },
  "body": "optional"
}
```

| Status | Meaning |
|--------|---------|
| 200 | Success — response from target |
| 400 | Invalid request or blocked URL |
| 401 | Invalid API key |
| 402 | Insufficient credit |
| 403 | Account frozen or closed |
| 429 | Rate limit exceeded |
| 502 | Target unreachable |

#### GET /agents/balance

```json
{
  "creditLimit": "10000000000",
  "creditUsed": "3200000000",
  "creditAvailable": "6800000000",
  "activeLoans": [{ "loanId": "42", "principalRaw": "5000000000" }],
  "delegationActive": true
}
```

#### GET /agents/transactions

Paginated payment history.

```json
{
  "transactions": [
    {
      "targetUrl": "https://api.example.com/data",
      "method": "GET",
      "paymentAmountRaw": "750000",
      "status": "success",
      "x402TxHash": "0x...",
      "createdAt": "2026-04-05T..."
    }
  ],
  "nextCursor": 41,
  "hasMore": true
}
```

#### POST /agents/close

Initiate wind-down. Repays all loans, transfers remaining USDC to your wallet, closes account.

```json
{
  "status": "completed",
  "loansRepaid": 2,
  "loansRemaining": 0,
  "usdcTransferred": "1500000000"
}
```

## Credit Model

Your credit is backed by on-chain collateral (ETH or cbBTC) via Floe's lending protocol. The facilitator:

- **Borrows USDC** against your collateral when your payment wallet runs low
- **Monitors collateral health** and freezes spending before you're at risk
- **Rolls over loans** before they expire so your credit stays active
- **Repays everything** when you revoke delegation or close your account

You never manage loans directly. The facilitator handles the entire lifecycle.

### Delegation Parameters

When granting delegation, you set:

| Parameter | Description |
|-----------|-------------|
| `borrowLimit` | Maximum USDC the facilitator can borrow on your behalf |
| `maxRateBps` | Interest rate cap (basis points, e.g. 1500 = 15%) |
| `expiry` | When the delegation expires |
| `collateralToken` | Which token to use as collateral (WETH or cbBTC) |

These are enforced on-chain — the facilitator cannot exceed your limits.

### What Happens If Collateral Drops

The facilitator monitors your collateral-to-debt ratio. If it drops too low, new spending is paused until the price recovers or you add collateral. Active loans are unaffected — they continue to maturity and can be rolled over.

If you want to stop entirely, call `revoke_credit_delegation` or `POST /agents/close`. The facilitator repays loans, your collateral returns, and remaining USDC is transferred to your wallet.
