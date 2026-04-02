---
icon: zap
---

# x402 Credit Facilitator

Pay for any x402-enabled API with Floe credit. No wallet, no SDK, no signing — one HTTP call.

The facilitator is a proxy: your agent sends a request, we handle the payment. If the API returns 402, we sign the payment from your agent's custodial wallet and retry. Your agent gets the response. You get charged from your credit balance.

**Works with 13,000+ existing x402 APIs** on Base — no per-service integration needed.

## Try It Now

```bash
# Check if an API requires x402 payment (no auth needed)
curl "https://x402.floelabs.xyz/proxy/check?url=https://some-x402-api.com/data"

# Call any x402 API through the proxy
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

Send USDC to your Privy wallet address on Base. That's it.

Your balance updates automatically within 30 seconds — no API call needed, no transaction hash to copy. Just send USDC and start making calls.

```bash
# Check your balance anytime
curl -H "Authorization: Bearer floe_YOUR_API_KEY" \
  https://x402.floelabs.xyz/agents/balance
```

### 3. Check What It'll Cost

Before calling a paid API, check the price:

```bash
curl "https://x402.floelabs.xyz/proxy/check?url=https://api.example.com/premium-data"
```

```json
{
  "x402": true,
  "status": 402,
  "payment": {
    "amount": "750000",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "payTo": "0x...",
    "network": "base"
  }
}
```

No auth required. `amount` is in raw USDC units (750000 = $0.75).

### 4. Make Paid API Calls

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

### 5. Monitor Your Usage

```bash
# Check balance
curl -H "Authorization: Bearer floe_YOUR_API_KEY" \
  https://x402.floelabs.xyz/agents/balance

# View payment history (paginated)
curl -H "Authorization: Bearer floe_YOUR_API_KEY" \
  "https://x402.floelabs.xyz/agents/transactions?limit=20"
```

---

## API Reference

**Base URL:** `https://x402.floelabs.xyz`

### Public Endpoints (No Auth)

#### GET /proxy/check

Check if a URL requires x402 payment and how much it costs.

```bash
curl "https://x402.floelabs.xyz/proxy/check?url=https://api.example.com/data"
```

**Free URL response:**
```json
{ "x402": false, "status": 200, "message": "This URL does not require x402 payment" }
```

**Paid URL response:**
```json
{
  "x402": true,
  "status": 402,
  "payment": {
    "amount": "750000",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "payTo": "0x...",
    "network": "base"
  }
}
```

### Authenticated Endpoints

All require `Authorization: Bearer <apiKey>`.

#### POST /proxy/fetch

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
| `method` | string | No | HTTP method (default: GET). Allowed: GET, POST, PUT, PATCH, DELETE, HEAD |
| `headers` | object | No | Headers to forward to the target |
| `body` | string | No | Request body (for POST/PUT/PATCH) |

**Responses:**

| Status | Meaning |
|--------|---------|
| 200 | Success — response body from target (may have been paid) |
| 400 | Invalid request, blocked URL, or disallowed method |
| 401 | Invalid API key |
| 402 | Insufficient balance (`{ error: "insufficient_balance", available, required }`) |
| 403 | Agent suspended |
| 429 | Rate limit exceeded |
| 502 | Target unreachable or payment header missing |

#### GET /agents/balance

```json
{
  "balance": "4500000000",
  "privyWalletBalance": "5000000000",
  "privyWalletAddress": "0x..."
}
```

- `balance` — your available credit (ledger balance after payments)
- `privyWalletBalance` — on-chain USDC in your Privy wallet
- `privyWalletAddress` — where to send USDC to fund your account

#### GET /agents/transactions

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

#### POST /agents/deposit

Manual deposit verification (optional — balances auto-update within 30s).

```json
{ "txHash": "0x..." }
```

Use this if you need the balance credited immediately rather than waiting for auto-detection.

### Admin Endpoints

Admin endpoints require a separate admin API key (`Authorization: Bearer <adminApiKey>`).

#### POST /admin/agents

Register a new agent. Creates a Privy custodial wallet and returns the API key (shown once).

```json
{ "agentId": "my-agent-1" }
```

**Response (201):**
```json
{
  "agentId": "my-agent-1",
  "apiKey": "floe_abc123...",
  "privyWalletAddress": "0x..."
}
```

Save the `apiKey` — it's only shown once. The `privyWalletAddress` is where the agent sends USDC to fund their account.

#### GET /admin/agents

List all agents with current balances.

**Response:**
```json
{
  "agents": [
    {
      "id": "my-agent-1",
      "privyWalletAddress": "0x...",
      "status": "active",
      "balance": "5000000000",
      "createdAt": "2025-04-01T..."
    }
  ]
}
```

#### PATCH /admin/agents/:id

Suspend or reactivate an agent. Suspended agents receive 403 on all proxy requests.

```json
{ "status": "suspended" }
```

**Response:**
```json
{ "id": "my-agent-1", "status": "suspended" }
```

---

## How It Works

```
Agent → Facilitator → Target API
                         ↓ (402 Payment Required)
         Facilitator checks balance
         Facilitator signs EIP-3009 via Privy
Agent ← Facilitator ← Target API (200 + content)
         Facilitator debits ledger
```

The x402 protocol uses **EIP-3009 transferWithAuthorization** — a gasless USDC transfer signed by the facilitator's Privy wallet. Coinbase's hosted facilitator settles the payment on-chain. Your agent never touches a private key.

### Deposits

Send USDC to your Privy wallet address on Base. The facilitator polls wallet balances every 30 seconds and auto-credits your ledger when it detects an increase. No API call, no tx hash — just send and wait.

### Custodial Architecture

Each agent gets a dedicated Privy wallet (EOA on Base). USDC is segregated per-agent — not pooled. The facilitator signs payments server-side via Privy's authorization context. No private keys in memory.

| Property | Detail |
|----------|--------|
| One wallet per agent | Created via `getOrCreateWallet(agentId, 'custom_auth')` |
| USDC segregated | Each agent's funds in their own EOA |
| Server-side signing | Via Privy API (~100ms latency) |
| On-chain settlement | Coinbase facilitator executes `transferWithAuthorization` |
| Auto-deposit | Balance detected every 30s, no manual step |

### Collateral Backing

Your credit facility is backed by on-chain collateral (ETH or cbBTC) via Floe's lending protocol. The facilitator checks both WETH and cbBTC balances across all supported markets, even if you haven't borrowed yet.

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

# Check cost before calling
check = requests.get(f"{BASE}/proxy/check", params={"url": "https://api.example.com/data"})
print(check.json())  # { "x402": true, "payment": { "amount": "750000", ... } }

# Make the paid call
resp = requests.post(f"{BASE}/proxy/fetch", headers=headers, json={
    "url": "https://api.example.com/data",
    "method": "GET",
})
print(resp.json())  # Response from the target API

# Check balance
balance = requests.get(f"{BASE}/agents/balance", headers=headers)
print(balance.json())  # { "balance": "4250000", ... }
```

---

## Pricing

You pay exactly what the x402 API charges — no markup. The facilitator deducts the `maxAmountRequired` from the 402 response header. All amounts are in raw USDC units (6 decimals).

Use `GET /proxy/check` to see the cost before calling. Check your spending with `GET /agents/transactions`.

---

## Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| `insufficient_balance` | Ledger balance too low | Send more USDC to your Privy wallet address |
| `Agent suspended` | Account suspended by admin | Contact Floe team |
| `Rate limit exceeded` | Too many requests per minute | Slow down or contact us for higher limits |
| `Target URL not allowed` | SSRF protection blocked the URL | Only public URLs are allowed in production |
| `Network mismatch` | x402 server on wrong chain | Facilitator only supports Base mainnet |
| `Payment asset mismatch` | x402 server wants non-USDC payment | Facilitator only supports USDC |
| `Response too large` | Upstream response exceeds 10MB | Contact us if you need larger responses |
