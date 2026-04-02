---
icon: zap
---

# x402 Credit Facilitator

Pay for any x402-enabled API with Floe credit. No wallet, no SDK, no signing — one HTTP call.

The facilitator is a proxy: your agent sends a request, we handle the payment. If the API returns 402, we sign the payment from your agent's custodial wallet and retry. Your agent gets the response. You get charged from your credit balance.

**Works with 13,000+ existing x402 APIs** on Base — no per-service integration needed.

## Try It Now

```bash
# 1. Check your balance
curl -H "Authorization: Bearer floe_YOUR_API_KEY" \
  https://x402.floelabs.xyz/agents/balance

# 2. Call any x402 API through the proxy
curl -X POST https://x402.floelabs.xyz/proxy/fetch \
  -H "Authorization: Bearer floe_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://some-x402-api.com/data", "method": "GET" }'
```

If the target API is free, you get the response as-is. If it returns 402, we pay and you get the content. One endpoint for everything.

## Getting Started

### 1. Get an Agent Account

Contact the Floe team for pilot access. You'll receive:
- **Agent ID** — your unique identifier
- **API Key** — `floe_...` prefix, shown once
- **Privy Wallet Address** — your custodial USDC wallet on Base

### 2. Fund Your Account

Transfer USDC to your Privy wallet address on Base, then register the deposit:

```bash
# After sending USDC on-chain
curl -X POST https://x402.floelabs.xyz/agents/deposit \
  -H "Authorization: Bearer floe_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "txHash": "0xYOUR_TX_HASH" }'
```

The facilitator verifies the on-chain transfer and credits your balance.

### 3. Make Paid API Calls

```bash
curl -X POST https://x402.floelabs.xyz/proxy/fetch \
  -H "Authorization: Bearer floe_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/premium-data",
    "method": "GET",
    "headers": { "Accept": "application/json" }
  }'
```

**What happens behind the scenes:**
1. Facilitator makes the request to the target URL
2. If the server returns 200 → response passed through to you (no charge)
3. If the server returns 402 → facilitator checks your balance, signs an EIP-3009 payment, retries with the payment header, debits your ledger, returns the content

### 4. Monitor Your Usage

```bash
# Check balance
curl -H "Authorization: Bearer floe_YOUR_API_KEY" \
  https://x402.floelabs.xyz/agents/balance

# View payment history
curl -H "Authorization: Bearer floe_YOUR_API_KEY" \
  "https://x402.floelabs.xyz/agents/transactions?limit=20"
```

---

## API Reference

**Base URL:** `https://x402.floelabs.xyz`

All endpoints require `Authorization: Bearer <apiKey>` unless noted.

### POST /proxy/fetch

Proxy a request through the facilitator. Handles x402 payments automatically.

```json
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": { "Accept": "application/json" },
  "body": "optional request body"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Target URL |
| `method` | string | No | HTTP method (default: GET) |
| `headers` | object | No | Headers to forward to the target |
| `body` | string | No | Request body (for POST/PUT/PATCH) |

**Responses:**

| Status | Meaning |
|--------|---------|
| 200 | Success — response body from target (may have been paid) |
| 400 | Invalid request or blocked URL |
| 401 | Invalid API key |
| 402 | Insufficient balance (`{ error: "insufficient_balance", available, required }`) |
| 403 | Agent suspended |
| 429 | Rate limit exceeded |
| 502 | Target unreachable or payment header missing |

### POST /agents/deposit

Verify an on-chain USDC transfer to your Privy wallet and credit your balance.

```json
{ "txHash": "0x..." }
```

**Response:**
```json
{ "balance": "5000000000", "deposited": "5000000000", "txHash": "0x..." }
```

### GET /agents/balance

```json
{
  "balance": "4500000000",
  "privyWalletBalance": "5000000000",
  "privyWalletAddress": "0x..."
}
```

- `balance` — your available credit (ledger balance after payments)
- `privyWalletBalance` — on-chain USDC in your Privy wallet
- `privyWalletAddress` — where to send USDC deposits

### GET /agents/transactions

Paginated payment history.

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `limit` | number | 50 | Max entries per page (max 100) |
| `cursor` | number | — | Cursor from previous page's `nextCursor` |

**Response:**
```json
{
  "transactions": [
    {
      "id": 42,
      "entryType": "payment",
      "amountRaw": "500000",
      "balanceAfterRaw": "4500000000",
      "reference": "0xtxhash...",
      "createdAt": "2025-04-01T12:00:00.000Z"
    }
  ],
  "nextCursor": 41,
  "hasMore": true
}
```

---

## How It Works

When your agent calls `POST /proxy/fetch`:

```
Agent → Facilitator → Target API
                         ↓ (402 Payment Required)
         Facilitator checks balance
         Facilitator signs EIP-3009 via Privy
Agent ← Facilitator ← Target API (200 + content)
         Facilitator debits ledger
```

The x402 protocol uses **EIP-3009 transferWithAuthorization** — a gasless USDC transfer signed by the facilitator's Privy wallet. Coinbase's hosted facilitator settles the payment on-chain. Your agent never touches a private key.

### Custodial Architecture

Each agent gets a dedicated Privy wallet (EOA on Base). USDC is segregated per-agent — not pooled. The facilitator signs payments server-side via Privy's authorization context. No private keys in memory.

| Property | Detail |
|----------|--------|
| One wallet per agent | Created via `getOrCreateWallet(agentId, 'custom_auth')` |
| USDC segregated | Each agent's funds in their own EOA |
| Server-side signing | Via Privy API (~100ms latency) |
| On-chain settlement | Coinbase facilitator executes `transferWithAuthorization` |

### Collateral Backing

Your credit facility is backed by on-chain collateral (ETH or cbBTC) via Floe's lending protocol. The facilitator periodically checks that your collateral supports your credit balance. If collateral drops below threshold, your account is flagged.

---

## AgentKit Integration

For agents using Coinbase AgentKit, the `X402ActionProvider` wraps the facilitator API:

```typescript
import { x402ActionProvider } from "@floe/agentkit-actions";

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [
    x402ActionProvider({
      facilitatorUrl: "https://x402.floelabs.xyz",
      agentApiKey: "floe_YOUR_API_KEY",
    }),
  ],
});

// Agent can now use natural language:
// "Fetch the latest data from api.example.com"
// → x402_fetch action handles payment automatically
```

**Available actions:**
- `x402_fetch` — Call any URL through the facilitator proxy
- `x402_get_balance` — Check available credit
- `x402_get_transactions` — View payment history

---

## Python Example

```python
import requests

API_KEY = "floe_YOUR_API_KEY"
BASE = "https://x402.floelabs.xyz"
headers = { "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json" }

# Make a paid API call
resp = requests.post(f"{BASE}/proxy/fetch", headers=headers, json={
    "url": "https://some-x402-api.com/data",
    "method": "GET",
})

print(resp.status_code)  # 200 if successful
print(resp.json())       # Response from the target API
```

---

## Pricing

You pay exactly what the x402 API charges — no markup. The facilitator deducts the `maxAmountRequired` from the 402 header. All amounts are in raw USDC units (6 decimals).

Check your spending with `GET /agents/transactions`.

---

## Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| `insufficient_balance` | Ledger balance too low | Deposit more USDC to your Privy wallet |
| `Agent suspended` | Account suspended by admin | Contact Floe team |
| `Rate limit exceeded` | Too many requests per minute | Slow down or contact us for higher limits |
| `Target URL not allowed` | SSRF protection blocked the URL | Only public HTTPS URLs are allowed |
| `Network mismatch` | x402 server on wrong chain | Facilitator only supports Base mainnet |
| `Payment asset mismatch` | x402 server wants non-USDC payment | Facilitator only supports USDC |
