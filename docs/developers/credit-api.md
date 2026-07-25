---
icon: webhook
---

# Credit REST API

The Credit API is the HTTP surface for Floe's **spend layer**. Agents of any language or framework can use it to fund payments, make paid x402 API calls, and reason about their own spend headroom.

> **This page covers the live spend layer:** Developer Endpoints, Developer Agents, Agent Endpoints (balance, transactions), Agent Awareness Endpoints (credit-remaining, loan-state, spend-limit, credit-thresholds, x402/estimate), and the x402 Proxy Endpoints. `open-credit-line` is **managed plumbing** the facilitator uses to fund your payments. The live way to fund an agent is the [walletless Floe-managed balance](../getting-started/quickstart.md).

> **See also:** [API Keys](api-keys.md) | [Webhooks](webhooks.md) | [Developer Dashboard](developer-dashboard.md)

**Base URL:** `https://credit-api.floelabs.xyz`

## Token Decimals

All amounts in the API are in **raw token base units** (smallest unit for each token). Using the wrong decimal precision is the most common integration bug.

| Token | Decimals | 1.0 human-readable = raw | Example |
|-------|----------|--------------------------|---------|
| USDC  | 6        | `1000000`                | 5,000 USDC = `"5000000000"` |
| USDT  | 6        | `1000000`                | 100 USDT = `"100000000"` |

---

## Public Endpoints

### GET /v1/health

```bash
curl "https://credit-api.floelabs.xyz/v1/health"
```

```json
{ "status": "ok", "timestamp": "2025-03-30T12:00:00.000Z" }
```

---

## Authentication

All endpoints below require authentication. The endpoints above are public.

Two distinct contexts call this API, and they use different credentials. Pick the row that matches what you're doing:

| Context | Endpoints | Accepted credentials |
|---|---|---|
| **Developer / management** — humans and tooling that provision and manage agents, mint keys, open credit lines, review history | `POST /v1/developer/agents`, `/keys`, `/open-credit-line`, list / rotate / revoke / close | Any one of: a `floe_live_*` developer key, a wallet-signature header set (`X-Wallet-Address` + `X-Signature` + `X-Timestamp`), or a dashboard session cookie — pick whichever fits your stack |
| **Agent runtime** — the agent process itself, calling out for paid data | `/proxy/fetch`, `/proxy/check`, `/x402/estimate`, `/agents/balance`, `/agents/transactions`, `/agents/close`, credit-threshold / spend-limit endpoints | The agent's `floe_*` runtime key, sent as `Authorization: Bearer floe_…` |

The two key prefixes are not interchangeable: a `floe_live_*` developer key sent to `/proxy/fetch` will 401, and a `floe_*` agent key sent to a management endpoint will 401. See [API Keys](api-keys.md) for the canonical table and the rationale.

### API Key Authentication

API keys use the `Authorization: Bearer` header. Generate developer keys through the [Developer Dashboard](developer-dashboard.md) at `dev-dashboard.floelabs.xyz` or via the developer endpoints below; agent keys are minted by `POST /v1/developer/agents/:id/keys`.

```bash
# Developer key — management endpoints
curl "https://credit-api.floelabs.xyz/v1/developer/agents" \
  -H "Authorization: Bearer floe_live_abc123..."

# Agent key — runtime endpoints
curl -X POST "https://credit-api.floelabs.xyz/v1/proxy/fetch" \
  -H "Authorization: Bearer floe_xyz789..." \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://api.example.com/data", "method": "GET" }'
```

Keys are scoped to the wallet that created them. All actions performed with an API key are attributed to the owning wallet. See [API Keys](api-keys.md) for key management, rotation, and security best practices.

### Wallet Signature Authentication (EIP-191)

For the **developer / management** endpoints above, you can also authenticate with an **EIP-191 / EIP-1271 signed message** instead of a `floe_live_*` key. This is the same credential class — the agentkit SDKs use the signature path so users don't have to obtain a developer key first — and it lets any wallet authenticate without an explicit registration step. It does **not** unlock the agent runtime endpoints; those still require an agent's `floe_*` key.

### How It Works

1. Sign the message `Floe Credit API\nTimestamp: <unix_seconds>` with your wallet
2. Include three headers in your request:

| Header | Value |
|--------|-------|
| `X-Wallet-Address` | Your wallet address (`0x...`) |
| `X-Signature` | The signed message (`0x...`, 65 bytes) |
| `X-Timestamp` | Unix timestamp used in the message |

The timestamp must be within 5 minutes of the server time.

### Python

```python
from eth_account import Account
from eth_account.messages import encode_defunct
import requests, time

private_key = "0x..."
account = Account.from_key(private_key)
timestamp = str(int(time.time()))
message = f"Floe Credit API\nTimestamp: {timestamp}"
signed = account.sign_message(encode_defunct(text=message))

headers = {
    "X-Wallet-Address": account.address,
    "X-Signature": "0x" + signed.signature.hex(),
    "X-Timestamp": timestamp,
    "Content-Type": "application/json"
}

# Now use `headers` with any authenticated endpoint
response = requests.get(
    "https://credit-api.floelabs.xyz/v1/developer/agents",
    headers=headers,
)
```

### TypeScript

```typescript
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0x...");
const timestamp = Math.floor(Date.now() / 1000).toString();
const message = `Floe Credit API\nTimestamp: ${timestamp}`;
const signature = await account.signMessage({ message });

const headers = {
  "X-Wallet-Address": account.address,
  "X-Signature": signature,
  "X-Timestamp": timestamp,
  "Content-Type": "application/json",
};

// Now use `headers` with any authenticated endpoint
const response = await fetch(
  "https://credit-api.floelabs.xyz/v1/developer/agents",
  { method: "GET", headers }
);
```

### Smart Contract Wallets (ERC-1271)

Giza agents, Olas agents, and Safe multisigs authenticate the same way. The API detects smart contract wallets automatically and calls `isValidSignature()` on your wallet contract to verify the signature.

---

## Developer Endpoints

These endpoints let you manage API keys, webhooks, and your developer profile programmatically. You can also manage these through the [Developer Dashboard](developer-dashboard.md).

All developer endpoints require authentication (wallet signature or API key).

### POST /v1/developer/keys

Create a new API key.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/keys" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400" \
  -d '{ "name": "production-bot" }'
```

**Response:**

```json
{
  "keyId": "key_abc123",
  "key": "floe_live_abc123...",
  "name": "production-bot",
  "createdAt": "2026-04-07T12:00:00.000Z"
}
```

> **Important:** The full key is only returned once at creation time. Store it securely.

### GET /v1/developer/keys

List all API keys for your wallet.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/keys" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400"
```

**Response:**

```json
{
  "keys": [
    {
      "keyId": "key_abc123",
      "name": "production-bot",
      "prefix": "floe_live_abc1...",
      "lastUsedAt": "2026-04-07T11:30:00.000Z",
      "createdAt": "2026-04-01T08:00:00.000Z"
    }
  ]
}
```

### DELETE /v1/developer/keys/:keyId

Revoke an API key. Takes effect immediately.

```bash
curl -X DELETE "https://credit-api.floelabs.xyz/v1/developer/keys/key_abc123" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400"
```

### POST /v1/developer/webhooks

Register a webhook endpoint. See [Webhooks](webhooks.md) for event types and payload format.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400" \
  -d '{
    "url": "https://your-server.com/webhooks/floe",
    "events": ["health_warning", "liquidated", "repaid", "expiry_warning"]
  }'
```

**Response:**

```json
{
  "webhookId": "wh_abc123",
  "url": "https://your-server.com/webhooks/floe",
  "events": ["health_warning", "liquidated", "repaid", "expiry_warning"],
  "secret": "whsec_...",
  "createdAt": "2026-04-07T12:00:00.000Z"
}
```

### GET /v1/developer/webhooks

List all registered webhooks.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhooks" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400"
```

### GET /v1/developer/profile

Get your developer profile, including wallet address, registration date, and usage stats.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/profile" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400"
```

---

## Developer Agents

One developer account can own multiple agents (up to 5). Each agent has its own managed Privy wallet, its own credit line, and its own `floe_*` API key. These endpoints provision and manage agents and their keys.

All `/v1/developer/agents*` endpoints accept any of three credentials interchangeably — pick whichever fits your client:

- **Dashboard session cookie** — set by `/v1/developer/auth/verify` after wallet sign-in. Used by the web dashboard.
- **Developer key** — `Authorization: Bearer floe_live_<base62>`. Convenient for backend services.
- **Wallet signature** — `X-Wallet-Address` + `X-Signature` + `X-Timestamp` headers, signing the message `"Floe Credit API\nTimestamp: <unix>"`. Used by the agentkit SDKs (no developer key needed).

### POST /v1/developer/agents

Provision a new managed agent. Floe creates a Privy wallet for the agent, delegates the facilitator on-chain server-side, and returns the agent record. Mint an API key in a second call (see below).

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/agents" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "alpha",
    "borrowLimitRaw": "10000000000",
    "maxRateBps": 1500,
    "expirySeconds": 7776000
  }'
```

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Unique-per-developer label. 1–64 chars, alphanumeric / space / `_` / `-`. |
| `borrowLimitRaw` | string | Yes | Credit ceiling in raw USDC (6 decimals). `"10000000000"` = $10K. |
| `maxRateBps` | number | Yes | Maximum interest rate in bps, 1–10000. |
| `expirySeconds` | number | Yes | Delegation lifetime in seconds, 60–31536000. |

**Response (201):**

```json
{
  "agentId": 42,
  "status": "active",
  "privyWalletAddress": "0xPrivyWallet...",
  "delegationTxHash": "0xabc..."
}
```

Returns `409 limit_exceeded` if the developer is already at the 5-agent cap, `409 name_conflict` for a duplicate name, or `503 agent_creation_unavailable` if Privy or the delegation service is not configured.

### GET /v1/developer/agents

List the developer's agents.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/agents" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{
  "agents": [
    {
      "id": 42,
      "name": "alpha",
      "status": "active",
      "mode": "managed",
      "agentWalletAddress": "0x...",
      "privyWalletAddress": "0x...",
      "creditLimit": "10000000000",
      "maxRateBps": 1500,
      "delegationActive": true,
      "operatorExpiry": "1717180800",
      "createdAt": "2026-05-13T12:00:00.000Z"
    }
  ]
}
```

### GET /v1/developer/agents/:agentId

Per-agent detail with credit utilization and recent activity.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/agents/42" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{
  "agent": {
    "id": 42,
    "name": "alpha",
    "status": "active",
    "mode": "managed",
    "agentWalletAddress": "0x...",
    "privyWalletAddress": "0x...",
    "creditLimit": "10000000000",
    "maxRateBps": 1500,
    "delegationActive": true,
    "operatorExpiry": "1717180800",
    "sessionSpendLimitRaw": null,
    "createdAt": "2026-05-13T12:00:00.000Z"
  },
  "creditUsed": "3200000000",
  "recentTransactionCount24h": 17,
  "sessionSpend": { "limitRaw": null, "startedAtUnix": null }
}
```

> The `keyPrefix` field on list/mint responses is returned with three literal trailing dots (e.g. `"keyPrefix": "a1b2c3d4..."`). The dots are part of the value, not a truncation in this documentation.

Returns `404` if the agent does not exist OR belongs to another developer (cross-tenant probes can't distinguish the two).

### POST /v1/developer/agents/:agentId/close

Wind down an agent — repay all facility loans, sweep residual USDC. Requires `WinddownService` to be configured; otherwise returns `503` when active loans exist.

### POST /v1/developer/agents/:agentId/keys

Mint an API key for an agent. **The full key is shown once** in the response; only its prefix is persisted server-side.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/agents/42/keys" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "label": "production", "permissions": "read_write" }'
```

**Response (201):**

```json
{
  "key": "floe_a1b2c3d4...",
  "id": 7,
  "keyPrefix": "a1b2c3d4...",
  "label": "production",
  "permissions": "read_write",
  "createdAt": "2026-05-13T12:00:00.000Z"
}
```

Returns `409 limit_exceeded` if the agent already has an active key — revoke or rotate it first.

### GET /v1/developer/agents/:agentId/keys

List keys for an agent (prefixes only; the full key is never returned after creation).

### DELETE /v1/developer/agents/:agentId/keys/:keyId

Revoke a specific key. Requests using the revoked key fail with `401` immediately.

### POST /v1/developer/agents/:agentId/keys/:keyId/rotate

Atomically revoke `keyId` and mint a new key for the same agent. Response shape is identical to `POST /keys`. Use this to rotate an active key without a window where neither key works.

### POST /v1/developer/agents/:agentId/open-credit-line

Open the agent's USDC/USDC credit line. Provisioning (`POST /v1/developer/agents`) creates a Privy wallet and delegates the facilitator on-chain, but **does not** open a credit line — the agent has `creditLimit` but `creditIn = 0` until you call this endpoint with a USDC deposit.

The agent's Privy wallet must already hold at least `depositRaw` USDC. Fund it via the dashboard's Coinbase on-ramp (credit card / bank transfer) or by transferring USDC on-chain.

Floe server-signs the borrow intent **from the agent's Privy wallet** — no on-chain transaction is sent from the developer's local wallet. The borrow intent is posted asynchronously; the existing reconciler advances the row to `pending_match` once the receipt confirms, and the solver matches it against an open lend offer. Spendable credit (`creditIn`) becomes non-zero once status flips to `active` (usually a few seconds).

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/agents/42/open-credit-line" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "depositRaw": "10000000000",
    "maxLtvBps": 9500
  }'
```

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `depositRaw` | string | Yes | USDC deposit amount, raw 6-decimal units. `"10000000000"` = $10K. The Privy wallet's USDC balance must be ≥ this value. |
| `maxLtvBps` | number | No | LTV cap in bps (1–9500). Default `9500` (95%, the USDC/USDC market cap). Borrow amount = `depositRaw * maxLtvBps / 10000`. |
| `maxRateBps` | number | No | Maximum interest rate the agent will accept (1–10000 bps). Defaults to the agent's `maxRateBps` from provisioning. |

**Response (201):**

```json
{
  "loanId": "pending:f8e3...",
  "borrowIntentHash": null,
  "approveTxHash": "0xabc...",
  "registerTxHash": "0xdef...",
  "principalRaw": "9500000000",
  "collateralAmountRaw": "10000000000",
  "rateBps": 1500,
  "status": "pending_on_chain"
}
```

- `borrowIntentHash` is `null` on initial return — the reconciler fills it in after parsing `LogBorrowerOfferPosted` from the receipt.
- `approveTxHash` is `null` if the Privy wallet's existing allowance to the matcher was already ≥ `depositRaw` (no approve tx needed).

**Error codes:**

| Status | `error` | Cause |
|---|---|---|
| 400 | `insufficient_privy_balance` | Privy wallet holds less USDC than `depositRaw`. Fund it first. |
| 400 | `agent_not_managed` | Caller passed a legacy (`mode='legacy'`) agentId. |
| 400 | `invalid_deposit` / `invalid_max_ltv` / `invalid_max_rate` | Input bounds violated. |
| 404 | `not_found` | Agent doesn't exist or belongs to another developer. |
| 409 | `agent_not_active` | Agent status is not `active`, or `delegationActive=false`. |
| 409 | `delegation_expired` | `operatorExpiry` is in the past. Re-provision before opening. |
| 409 | `existing_active_credit_line` | A non-terminal `facility_loans` row already exists for this agent. Wait for it to settle or fail. |
| 502 | `privy_send_failed` | Privy's server-side signer returned `success=false`. Inspect `detail`. |
| 502 | `rpc_read_failed` / `market_not_created` | RPC or matcher state issue. |
| 503 | `service_unavailable` | `ManagedCreditLineService` not initialized (Privy not configured). |

> The endpoint accepts an optional `Idempotency-Key` header (Stripe-style). With it, repeated calls within the idempotency window return the same row instead of double-borrowing.

---

## Agent Endpoints

These endpoints are called by an agent (using its `floe_*` key) to manage itself.

### GET /v1/agents/balance

Check your agent's credit balance, active loans, and delegation status.

```bash
curl "https://credit-api.floelabs.xyz/v1/agents/balance" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"
```

**Response:**

```json
{
  "balance": "4000000000",
  "spendableRaw": "4000000000",
  "creditAvailableRaw": "6000000000",
  "walletUsdcRaw": "150000000",
  "pendingSettlementsRaw": "0",
  "heldUnspentRaw": "0",
  "creditLimit": "10000000000",
  "creditUsed": "4000000000",
  "creditAvailable": "6000000000",
  "privyWalletAddress": "0x…",
  "activeLoans": [{ "loanId": "42", "borrowAmount": "5000000000", "status": "active" }],
  "delegationActive": true,
  "operatorExpiry": 1779473412
}
```

> **Every USDC amount field is a raw 6-decimal string — divide by 1,000,000 for dollars.** `"4000000000"` is **4,000 USDC**, *not* $4 billion. (Non-amount fields aren't USDC — e.g. `operatorExpiry` is a Unix timestamp.) This is the single most common integration bug; see [Token Decimals](#token-decimals).

**Field guide** — `spendableRaw` and `creditAvailableRaw` are two *different* numbers and confusing them is a common bug:

| Field | Units | What it means |
| --- | --- | --- |
| `spendableRaw` | raw USDC | USDC the agent can pay with **right now** (= drawn facility credit − in-flight payments − held budgets). This is what the x402 proxy gates on. |
| `creditAvailableRaw` | raw USDC | Operator-delegation **headroom** — how much *more* the agent could borrow from its credit line. Non-zero here does **not** mean spendable: an agent with a $100 delegation but no facility loan opened yet has `spendableRaw: 0`. |
| `creditLimit` | raw USDC | The on-chain operator-delegation ceiling (the most the agent can ever borrow). |
| `creditUsed` | raw USDC | Drawn-and-spent against the limit (= `creditLimit − creditAvailableRaw`). |
| `walletUsdcRaw` | raw USDC | The Privy custodial wallet's on-chain USDC balance; `null` if the facilitator couldn't read it. |
| `pendingSettlementsRaw` | raw USDC | Sum of in-flight payments awaiting reconciliation. Drains as reservations move to terminal state; see [`/v1/agents/reservations/:nonce`](#get-v1agentsreservationsnonce). |
| `heldUnspentRaw` | raw USDC | Pre-borrow holds fenced for specific tasks — already subtracted from `spendableRaw`, surfaced separately so the math reconciles. |

`activeLoans[].borrowAmount` is also raw USDC. `balance` and `creditAvailable` are legacy raw-USDC aliases of `spendableRaw` and `creditAvailableRaw` — prefer the explicit `*Raw` names. `creditLimit` and `creditUsed` have no `*Raw` suffix but are raw USDC all the same.

### GET /v1/agents/reservations/{nonce}

Look up a single reservation by its nonce — typically the nonce returned in the `reservation.nonce` field of a `502 upstream_paid_request_failed_ambiguous` response from the proxy. Used by the SDK's `awaitSettlement` / `await_settlement` helpers to poll until a `pending_settlement` reaches a terminal state.

```bash
curl "https://credit-api.floelabs.xyz/v1/agents/reservations/$NONCE" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"
```

**Response (200):**

```json
{
  "nonce": "…",
  "state": "settled",
  "terminal": true,
  "paymentAmountRaw": "10000",
  "txHash": "0x…",
  "validBefore": 1779473412,
  "reservedAt": "2026-05-22T18:10:11.575Z",
  "sentAt": "2026-05-22T18:10:12.014Z",
  "settledAt": "2026-05-22T18:10:14.802Z"
}
```

`state` is one of `reserved | sent | pending_settlement | settled | expired_unsettled | payment_rejected`. `terminal` is `true` for the last three. Returns `404` if the nonce doesn't exist or isn't owned by the caller (no cross-tenant enumeration).

### GET /v1/agents/transactions

Paginated history of x402 payments made through the proxy.

```bash
curl "https://credit-api.floelabs.xyz/v1/agents/transactions?limit=20&cursor=41" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"
```

---

## Agent Awareness Endpoints

These five primitives let an agent reason about its own credit before committing capital. They answer the three rational-agent questions:

1. **Do I have enough credit to make this call?** → `GET /v1/agents/credit-remaining`
2. **Is this call worth its cost?** → `POST /v1/x402/estimate`
3. **Where am I in the loan lifecycle?** → `GET /v1/agents/loan-state`

Plus operator controls (`/spend-limit`) and event subscriptions (`/credit-thresholds`) for long-running agents that want webhook-based alerts.

### GET /v1/agents/credit-remaining

Decision-grade headroom view. Use BEFORE every paid call to gate against the agent's available USDC.

```bash
curl "https://credit-api.floelabs.xyz/v1/agents/credit-remaining" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"
```

**Response:**

```json
{
  "available": "6800000000",
  "creditIn": "10000000000",
  "creditOut": "3200000000",
  "creditLimit": "10000000000",
  "headroomToAutoBorrow": "6800000000",
  "utilizationBps": 3200,
  "sessionSpendLimit": "5000000",
  "sessionSpent": "1200000",
  "sessionSpendRemaining": "3800000",
  "asOf": "2026-05-04T12:00:00.000Z"
}
```

| Field | Type | Description |
|---|---|---|
| `available` | string | Current spendable USDC, raw 6-decimal units (`creditIn − creditOut`) |
| `creditIn` | string | Total active facility-loan principal currently funded for this agent |
| `creditOut` | string | Sum of pending + successful x402 spend (deduped against active reservations) |
| `creditLimit` | string | On-chain operator borrow limit (set at /register) |
| `headroomToAutoBorrow` | string | `creditLimit - creditOut` — the most you can spend before the facility loan is fully drawn |
| `utilizationBps` | number | `creditOut / creditLimit` in bps (10000 = 100%) |
| `sessionSpendLimit` | string \| null | Operator-set session cap (see `PUT /v1/agents/spend-limit`) |
| `sessionSpent` | string | USDC spent in the current session window (zero when no cap is set) |
| `sessionSpendRemaining` | string \| null | Cap minus spend in the current session window |
| `asOf` | string | ISO-8601 timestamp the snapshot was computed |

| Status | Meaning |
|---|---|
| 200 | OK |
| 401 | Invalid API key |
| 404 | `no_credit_limit` — agent has no credit line yet. Provision via `POST /v1/developer/agents`. |

### GET /v1/agents/loan-state

Coarse state-machine view. Useful for gating actions that only make sense in specific states.

```bash
curl "https://credit-api.floelabs.xyz/v1/agents/loan-state" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"
```

**Response:**

```json
{
  "state": "borrowing",
  "reason": "facility_loan_pending_match",
  "details": {
    "source": "facility",
    "status": "pending_match",
    "available": "0",
    "creditLimit": "10000000000"
  }
}
```

State values (precedence: borrowing > repaying > at_limit > idle):

| State | Meaning |
|---|---|
| `idle` | No active borrow attempt or pending repay |
| `borrowing` | Facility or instant-borrow attempt in pre-active state |
| `repaying` | Active loan with a pending `repay_tx_hash` |
| `at_limit` | `available === 0` AND `creditOut >= creditLimit` |

### GET / PUT / DELETE /v1/agents/spend-limit

Operator-defined soft cap, enforced off-chain in the proxy paid-request flow. Distinct from the on-chain `creditLimit` — lets an agent self-bound to a session budget.

`PUT` resets the session window — anything spent before this call no longer counts.

```bash
# Set a $5 session cap
curl -X PUT "https://credit-api.floelabs.xyz/v1/agents/spend-limit" \
  -H "Authorization: Bearer floe_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limitRaw": "5000000"}'

# Get current state
curl "https://credit-api.floelabs.xyz/v1/agents/spend-limit" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"

# Remove the cap
curl -X DELETE "https://credit-api.floelabs.xyz/v1/agents/spend-limit" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"
```

`PUT` request body:

| Field | Type | Description |
|---|---|---|
| `limitRaw` | string | Cap in raw USDC units (6 decimals). Must be positive. |

`GET` response:

```json
{
  "active": true,
  "limitRaw": "5000000",
  "sessionSpentRaw": "1200000",
  "sessionRemainingRaw": "3800000"
}
```

When the cap is hit, `POST /v1/proxy/fetch` returns:

```json
{
  "error": "spend_limit_exceeded",
  "spent": "5000000",
  "limit": "5000000",
  "required": "1000000"
}
```

### GET / POST /v1/agents/credit-thresholds, DELETE /v1/agents/credit-thresholds/:id

Webhook subscriptions that fire when the agent's `utilizationBps` crosses a threshold. Three event names are emitted via the existing developer webhook stack:

- `credit.warning` — utilization crossed `thresholdBps` from below (threshold < 9500 bps)
- `credit.at_limit` — same, but emitted when threshold ≥ 9500 bps so urgent vs informational can be routed separately
- `credit.recovered` — utilization dropped back below threshold

Hysteresis guarantees exactly-once delivery per edge crossing — an agent oscillating around the boundary won't be spammed. Cap of **20 thresholds per agent**.

```bash
# Register a threshold at 80% utilization
curl -X POST "https://credit-api.floelabs.xyz/v1/agents/credit-thresholds" \
  -H "Authorization: Bearer floe_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"thresholdBps": 8000}'

# List
curl "https://credit-api.floelabs.xyz/v1/agents/credit-thresholds" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"

# Delete by id
curl -X DELETE "https://credit-api.floelabs.xyz/v1/agents/credit-thresholds/42" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"
```

`POST` request body:

| Field | Type | Required | Description |
|---|---|---|---|
| `thresholdBps` | number | Yes | 1–10000. ≥ 9500 emits `credit.at_limit` instead of `credit.warning`. |
| `webhookId` | number | No | Pin to a specific webhook owned by the calling developer. Omit for fanout to all matching webhooks. |

Webhook payload:

```json
{
  "event": "credit.warning",
  "agentId": "0x...",
  "thresholdBps": 8000,
  "utilizationBps": 8123,
  "creditLimit": "10000000000",
  "creditOut": "8123000000",
  "available": "1877000000",
  "firedAt": "2026-05-04T12:00:00.000Z"
}
```

Subscribe a webhook to credit events using the `events` array on `POST /v1/developer/webhooks`. The `credit.*` and `*` wildcards are supported.

| Status | Meaning |
|---|---|
| 200 | Idempotent: duplicate `(agentId, thresholdBps)` returns the existing row |
| 201 | Created |
| 404 | `webhook_not_found_or_not_owned` — pinned `webhookId` doesn't belong to caller |
| 409 | `subscription_limit_reached` — 20 per agent |

> **Polling alternative for serverless agents:** ephemeral runners that can't receive webhooks should poll `GET /v1/agents/credit-remaining` and compare `utilizationBps` locally. No threshold subscription needed.

### POST /v1/x402/estimate

Preflight an x402-protected URL and return its USDC cost without paying. The response also reflects against the calling agent's `available` and `sessionSpendRemaining` so the agent can decide gating in **one round-trip** — the unique value vs the agent doing its own preflight.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/x402/estimate" \
  -H "Authorization: Bearer floe_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.example.com/paid-data", "method": "GET"}'
```

**Response (URL is x402-protected):**

```json
{
  "url": "https://api.example.com/paid-data",
  "method": "GET",
  "x402": true,
  "priceRaw": "5000",
  "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "network": "base",
  "payTo": "0x...",
  "scheme": "exact",
  "cached": false,
  "fetchedAt": "2026-05-04T12:00:00.000Z",
  "reflection": {
    "available": "6800000000",
    "headroomToAutoBorrow": "6800000000",
    "sessionSpendRemaining": "3800000",
    "willExceedAvailable": false,
    "willExceedHeadroom": false,
    "willExceedSpendLimit": false
  }
}
```

When the URL is not x402-protected, the response is:

```json
{
  "url": "https://api.example.com/paid-data",
  "method": "GET",
  "x402": false,
  "fetchedAt": "2026-05-04T12:00:00.000Z"
}
```

**Decision pattern:**

```text
estimate_x402_cost(url)
  → if reflection.willExceedAvailable || reflection.willExceedSpendLimit: skip
  → else: proxy/fetch(url)
```

Results are cached in-memory for ~30s, keyed by `(method, url, ssrfPolicy)`. SSRF policies do NOT leak across tenants — the cache key includes a fingerprint of `(domainAllowlist, allowLocalhost)`.

| Status | Meaning |
|---|---|
| 200 | OK (whether or not URL is x402-protected) |
| 400 | `blocked_destination` (SSRF guard rejected: private IP / IMDS / disallowed scheme) |
| 401 | Invalid API key |
| 429 | Rate limit exceeded (`scope: sliding_window` or `token_bucket`) |
| 502 | `preflight_failed` — DNS / TCP / TLS / timeout reaching target |

### POST /v1/agents/close

Initiate wind-down. Repays all active loans, transfers remaining USDC to your wallet, and closes the account.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/agents/close" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"
```

**Response:**

```json
{
  "status": "completed",
  "loansRepaid": 2,
  "loansRemaining": 0,
  "usdcTransferred": "1500000000"
}
```

---

## x402 Proxy Endpoints

These endpoints power the x402 payment proxy. Use them to check if a URL requires payment and to make paid API calls using your agent's credit balance.

### GET /v1/proxy/check

Check if a URL requires x402 payment. **Public -- no auth required.**

```bash
curl "https://credit-api.floelabs.xyz/v1/proxy/check?url=https://api.example.com/data"
```

**Response:**

```json
{
  "requiresPayment": true,
  "price": "750000",
  "currency": "USDC",
  "network": "base"
}
```

### POST /v1/proxy/fetch

Proxy a request to a target URL. If the target returns HTTP 402, the facilitator pays automatically from your credit balance and retries the request.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/proxy/fetch" \
  -H "Authorization: Bearer floe_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/data",
    "method": "GET",
    "headers": { "Accept": "application/json" }
  }'
```

| Status | Meaning |
|--------|---------|
| 200 | Success -- response from target |
| 400 | Invalid request or blocked URL |
| 401 | Invalid API key |
| 402 | Insufficient credit balance |
| 403 | Account frozen or closed |
| 429 | Rate limit exceeded |
| 502 | Target URL unreachable |
