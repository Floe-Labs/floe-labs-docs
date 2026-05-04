---
icon: webhook
---

# Credit REST API

The Credit API lets any agent — regardless of language or framework — access Floe's instant credit facilities via HTTP. It returns unsigned transaction calldata that agents sign and submit with their own wallet.

> **See also:** [API Keys](api-keys.md) | [Webhooks](webhooks.md) | [Developer Dashboard](developer-dashboard.md)

**Base URL:** `https://credit-api.floelabs.xyz`

## Token Decimals

All amounts in the API are in **raw token base units** (smallest unit for each token). Using the wrong decimal precision is the most common integration bug.

| Token | Decimals | 1.0 human-readable = raw | Example |
|-------|----------|--------------------------|---------|
| USDC  | 6        | `1000000`                | 5,000 USDC = `"5000000000"` |
| USDT  | 6        | `1000000`                | 100 USDT = `"100000000"` |
| WETH  | 18       | `1000000000000000000`    | 2 WETH = `"2000000000000000000"` |
| cbBTC | 8        | `100000000`              | 0.5 cbBTC = `"50000000"` |

## Try It Now

See live lender offers on Base — no auth required:

```bash
# WETH/USDC market
curl "https://credit-api.floelabs.xyz/v1/credit/offers?marketId=0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930"

# Or browse all markets at once
curl "https://credit-api.floelabs.xyz/v1/credit/offers"
```

---

## Markets

Market IDs are `keccak256(abi.encode(loanToken, collateralToken))`. Use `GET /v1/markets` to discover all available market IDs.

| Market | marketId | Collateral | Loan Token |
|--------|----------|------------|------------|
| WETH/USDC | `0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930` | WETH (18 dec) | USDC (6 dec) |
| cbBTC/USDC | `0xbd0fb0e71705bfb3cc5c5552d9276e6617761b37353bd9e1b37bb65c3af2d7f7` | cbBTC (8 dec) | USDC (6 dec) |

**Token addresses (Base mainnet):**

| Token | Address | Decimals |
|-------|---------|----------|
| WETH | `0x4200000000000000000000000000000000000006` | 18 |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 8 |

You can also discover markets programmatically via `GET /v1/markets`.

---

## Public Endpoints

### GET /v1/markets

List all active lending markets. **Public — no auth required.**

```bash
curl "https://credit-api.floelabs.xyz/v1/markets"
```

**Response:**

```json
{
  "markets": [
    {
      "marketId": "0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930",
      "loanToken": {
        "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "symbol": "USDC",
        "decimals": 6
      },
      "collateralToken": {
        "address": "0x4200000000000000000000000000000000000006",
        "symbol": "WETH",
        "decimals": 18
      },
      "isActive": true,
      "offerCount": 12
    }
  ]
}
```

### GET /v1/credit/offers

Query available lend intents. **Public — no auth required.**

```bash
# All markets
curl "https://credit-api.floelabs.xyz/v1/credit/offers"

# Specific market
curl "https://credit-api.floelabs.xyz/v1/credit/offers?marketId=0xfe9265..."
```

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `marketId` | bytes32 | No | Filter by market. Omit to see offers across all markets. |
| `minAmount` | string | No | Minimum remaining amount (raw units) |
| `maxRateBps` | string | No | Maximum interest rate in basis points |
| `maxResults` | string | No | Max offers to return (default: 50) |

**Response:**

```json
{
  "offers": [
    {
      "offerHash": "0xabc...",
      "lender": "0x123...",
      "remainingAmount": "5000000000",
      "minInterestRateBps": "800",
      "maxLtvBps": "8500",
      "minDuration": "86400",
      "maxDuration": "2592000",
      "expiry": "1711900800",
      "gracePeriod": "86400",
      "minInterestBps": "5000",
      "marketId": "0xfe9265..."
    }
  ]
}
```

### GET /v1/markets/:marketId/cost-of-capital

Snapshot of the borrowing rate available in a market right now. **Public — no auth required.**

Without `borrowAmount`, returns the rate floor + total available liquidity ("what's the cheapest quote anyone is offering?"). With `borrowAmount`, walks the offer ladder to compute the actual weighted rate the caller would pay ("what would I actually pay if I borrowed N right now?").

```bash
# Quote-only — best rate + total liquidity
curl "https://credit-api.floelabs.xyz/v1/markets/0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930/cost-of-capital"

# Implied rate for a specific size (1,000 USDC = 1_000_000_000 raw, 30-day duration)
curl "https://credit-api.floelabs.xyz/v1/markets/0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930/cost-of-capital?borrowAmount=1000000000&duration=2592000"
```

| Query Param    | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `borrowAmount` | string | No       | Raw token units. If omitted, response is quote-only (no implied rate). |
| `duration`     | string | No       | Loan duration in seconds. When set, only offers whose `[minDuration, maxDuration]` covers this value count. |

**Response (quote-only):**

```json
{
  "marketId": "0xfe9265...",
  "bestRateBps": "800",
  "impliedRateBps": null,
  "availableLiquidity": "12500000000",
  "offerCount": 4,
  "fetchedAt": 1711814400
}
```

**Response (with `borrowAmount`, fillable):**

```json
{
  "marketId": "0xfe9265...",
  "bestRateBps": "800",
  "impliedRateBps": "920",
  "impliedFillBreakdown": [
    { "offerHash": "0xabc...", "rate": "800", "amount": "400000000" },
    { "offerHash": "0xdef...", "rate": "1000", "amount": "600000000" }
  ],
  "availableLiquidity": "12500000000",
  "offerCount": 4,
  "fetchedAt": 1711814400
}
```

| Field                  | Type             | Description |
|------------------------|------------------|-------------|
| `bestRateBps`          | string \| null   | Lowest viable rate among offers. `null` when no offers exist (distinct from a real 0 bps quote). |
| `impliedRateBps`       | string \| null   | Weighted-average rate at which `borrowAmount` would fill. `null` when omitted OR when liquidity is insufficient. |
| `impliedFillBreakdown` | array (optional) | Per-offer slices that compose the fill. Only present when `impliedRateBps` is non-null. |
| `availableLiquidity`   | string           | Sum of `remainingAmount` across viable offers (after duration filter). |
| `offerCount`           | number           | Count of viable offers. |
| `fetchedAt`            | number           | Unix seconds when the snapshot was assembled. |

> **Insufficient-liquidity case:** if `borrowAmount > availableLiquidity`, the response sets `impliedRateBps: null` and omits `impliedFillBreakdown`. `bestRateBps` and `availableLiquidity` still reflect what's there — use both to decide whether to wait or downsize the borrow.

> **Why bigint as string?** Rates and amounts are returned as decimal strings to avoid JSON-number precision loss past 2^53. Parse with `BigInt(...)` in TypeScript or `int(...)` in Python.

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

The API supports two authentication methods: **wallet signatures** (EIP-191) and **API keys**.

### API Key Authentication

If you prefer not to sign every request, you can authenticate with a developer API key. Generate keys through the [Developer Dashboard](developer-dashboard.md) at `dev-dashboard.floelabs.xyz` or via the developer endpoints below.

API keys use the `Authorization: Bearer` header:

```bash
curl "https://credit-api.floelabs.xyz/v1/credit/status/42" \
  -H "Authorization: Bearer floe_live_abc123..."
```

Keys are scoped to the wallet that created them. All actions performed with an API key are attributed to the owning wallet. See [API Keys](api-keys.md) for key management, rotation, and security best practices.

### Wallet Signature Authentication (EIP-191)

The API also supports **EIP-191 / EIP-1271 signed message** authentication. No API keys, no registration. Any wallet can authenticate.

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
response = requests.post(
    "https://credit-api.floelabs.xyz/v1/credit/instant-borrow",
    headers=headers,
    json={ "marketId": "0xfe9265...", "borrowAmount": "5000000000", ... }
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
  "https://credit-api.floelabs.xyz/v1/credit/instant-borrow",
  { method: "POST", headers, body: JSON.stringify({ ... }) }
);
```

### Smart Contract Wallets (ERC-1271)

Giza agents, Olas agents, and Safe multisigs authenticate the same way. The API detects smart contract wallets automatically and calls `isValidSignature()` on your wallet contract to verify the signature.

---

## Authenticated Endpoints

### POST /v1/credit/instant-borrow

Build unsigned transactions for an instant borrow. The API selects the best available lender automatically and persists an attempt record so a partial flow (TX1 confirmed but TX2 not yet broadcast) is always recoverable.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/credit/instant-borrow" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400" \
  -H "Idempotency-Key: 7f9a4e21-9c3a-4f2b-bc1d-2a8c1f5b8e3d" \
  -d '{
    "marketId": "0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930",
    "borrowAmount": "5000000000",
    "collateralAmount": "2000000000000000000",
    "maxInterestRateBps": "1200",
    "duration": "2592000",
    "maxLtvBps": "7500"
  }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `marketId` | bytes32 | Yes | Market ID (see [Markets](#markets) above) |
| `borrowAmount` | string | Yes | Amount to borrow (raw units) |
| `collateralAmount` | string | Yes | Collateral to post (raw units) |
| `maxInterestRateBps` | string | Yes | Max acceptable rate (bps). 1200 = 12% APR |
| `duration` | string | Yes | Loan duration in seconds. 2592000 = 30 days |
| `minLtvBps` | string | No | Min LTV (default: 8000 = 80%) |
| `maxLtvBps` | string | No | Max initial LTV (bps). Rejects if oracle-computed LTV exceeds this. 7500 = 75% |

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `Idempotency-Key` | No | Stripe-style opaque string (≤255 chars). Same key from the same wallet within 24h returns the cached attempt instead of starting a new one. Recommended (UUID v4). Without it the call is non-idempotent — a network retry can register a second on-chain intent and double-spend gas. |

**Response:**

```json
{
  "attemptId": "pending:7f9a4e21-9c3a-4f2b-bc1d-2a8c1f5b8e3d",
  "status": "pending_funding",
  "reused": false,
  "transactions": [
    {
      "to": "0x833589fCD...",
      "data": "0x095ea7b3...",
      "value": "0x0",
      "chainId": 8453,
      "description": "Approve collateral"
    },
    {
      "to": "0x17946cD3e...",
      "data": "0x...",
      "value": "0x0",
      "chainId": 8453,
      "description": "Register borrow intent"
    },
    {
      "to": "0x17946cD3e...",
      "data": "0x...",
      "value": "0x0",
      "chainId": 8453,
      "description": "Match loan intents"
    }
  ],
  "selectedOffer": {
    "offerHash": "0xabc...",
    "minInterestRateBps": "800",
    "remainingAmount": "10000000000"
  }
}
```

| Response field | Description |
|---------------|-------------|
| `attemptId` | Synthetic placeholder ID for the attempt (`pending:<uuid>`). Pass this to `/v1/tx/broadcast` and the recovery endpoints below. The `attemptId` stays the same for the lifetime of the row — even after the loan goes active. The canonical on-chain `loanId` becomes available via `GET /v1/credit/borrow-attempts/:attemptId` (in the response's separate `loanId` field). |
| `status` | Lifecycle state. `pending_funding` for a fresh attempt; later transitions to `pending_on_chain`, `pending_match`, `matching`, `active`, or one of the terminal states. See the lifecycle diagram below. |
| `reused` | `true` when an idempotent retry returned the cached attempt. When `true`, `transactions` is `[]` and `selectedOffer` is **omitted** — the original lender struct isn't persisted, so the API doesn't surface stale fields. Call `GET /v1/credit/borrow-attempts/:attemptId` for canonical state, or `POST .../resume` to retry the match phase. |
| `selectedOffer` | The lender offer matched at attempt creation. Present on fresh attempts only; omitted when `reused: true` (see above). |

#### Broadcasting with attempt tracking

When you broadcast each signed transaction, pass the `attempt_id` and `phase` so the API can drive the attempt state machine forward:

```bash
# After signing TX2 (registerBorrowIntent)
curl -X POST "https://credit-api.floelabs.xyz/v1/tx/broadcast" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400" \
  -d '{
    "signed_transaction_hex": "0x02f8...",
    "attempt_id": "pending:7f9a4e21-9c3a-4f2b-bc1d-2a8c1f5b8e3d",
    "phase": "register"
  }'

# After signing TX3 (matchLoanIntents)
curl -X POST "https://credit-api.floelabs.xyz/v1/tx/broadcast" \
  -d '{ "signed_transaction_hex": "0x02f8...", "attempt_id": "pending:...", "phase": "match" }' \
  ...
```

Both fields are optional and must be provided together. When provided, the broadcast endpoint persists the txHash on the borrow-attempt row **before** awaiting `waitForTransactionReceipt`. This closes the receipt-wait timeout gap — if the receipt doesn't arrive within 60s, the row already has the hash and the reconciler can finish reconciliation on its next tick. Without `attempt_id`, the broadcast endpoint behaves exactly as before; the attempt row stays in `pending_funding` until the reconciler's expiry sweep terminates it.

#### Recovery endpoints

The borrow-attempt state machine is recoverable in two failure scenarios:

**Scenario A — Client crash between TX1 and TX2.** The register tx confirmed and the row is in `pending_match`, but the client process died (or lost the response) before broadcasting the match tx.

> **Persistence requirement:** crash recovery only works if the client durably stored at least one of (`attemptId`, `Idempotency-Key`) before crashing. With the `attemptId` you can hit the recovery endpoints below directly. With the `Idempotency-Key` you can re-POST `/v1/credit/instant-borrow` and the API returns the cached attempt (`reused: true`) — read `attemptId` from that response and proceed to the recovery endpoints. If neither was persisted, the on-chain intent will simply expire on its own (5–10 min) and you'll need a fresh borrow.

**Scenario B — Broadcast endpoint receipt timeout.** The client called `/v1/tx/broadcast` with `attempt_id`+`phase`, but `waitForTransactionReceipt` hit the 60s cap and threw. The tx is live on-chain (it was sent before the wait), the row already has `register_tx_hash` (or `match_tx_hash`) thanks to the pre-receipt persist, and the reconciler's `runOnce` will fetch the receipt and resolve the row on its next tick (default poll interval 30s) — **no client action required**.

For Scenario A, three explicit endpoints let the client drive the recovery:

All three recovery endpoints share two common error codes:

| Status | `code` | When |
|---|---|---|
| 404 | `attempt_not_found` | The attempt ID doesn't exist, or the row exists but isn't an `instant_borrow` attempt (404 instead of 403 to avoid leaking the existence of unrelated rows) |
| 403 | `forbidden` | The authenticated wallet is not the original initiator of the attempt |

**`GET /v1/credit/borrow-attempts/:attemptId`** — current state, all tx hashes, real `loanId` once active. The `attemptId` here is the `pending:<uuid>` placeholder you received from `/v1/credit/instant-borrow` — it stays the same for the life of the row, even after the loan goes active (the on-chain `loanId` is surfaced in the response's `loanId` field, separate from `attemptId`).

**`POST /v1/credit/borrow-attempts/:attemptId/resume`** — returns a fresh `matchLoanIntents` unsigned tx using the same registered borrow intent. Re-validates the lend offer on-chain; on conflict, returns 409 with one of:

| `code` | Meaning | Recommended next step |
|---|---|---|
| `not_resumable` | Status is not `pending_match` (e.g. already `active`, `abandoned`, `expired`) | Call `GET /borrow-attempts/:id` for current state |
| `lend_intent_revoked` | The originally-selected lender slot was zeroed | Call `/abandon` |
| `lend_intent_expired` | Lend offer expired since attempt creation | Call `/abandon` |
| `lend_intent_insufficient` | Lender's remaining capacity is now below the borrow amount | Call `/abandon` |
| `missing_borrow_struct` (500) | Defensive — should never fire | Surface to support |
| `missing_lend_intent_hash` (500) | Defensive — should never fire | Surface to support |

**`POST /v1/credit/borrow-attempts/:attemptId/abandon`** — immediately marks the attempt `abandoned` and returns up to 2 unsigned txs:

1. `revokeBorrowIntentByHash(borrowIntentHash)` — required. Removes the dangling intent on-chain.
2. `approve(collateralToken, matcher, 0)` — optional (`optional: true`), only included when a non-zero allowance exists. Recommended to sign and broadcast for full hygiene.

Returns 409 with `code: not_abandonable` if the attempt is already in a terminal state.

The on-chain intent expires automatically 5–10 minutes after registration, so revoking is for cleanliness; the loan can never be matched after expiry regardless.

#### Lifecycle

The API drives a borrow-attempt state machine for every `/v1/credit/instant-borrow` call. When you broadcast each signed transaction with `attempt_id` + `phase`, the API persists the txHash *before* awaiting the receipt — so a 60s receipt-wait timeout never drops state on the floor.

```
POST /v1/credit/instant-borrow
            │
            ▼
    pending_funding
            │
            │ POST /v1/tx/broadcast (phase=register, pre-receipt persist)
            ▼
   pending_on_chain
            │
            │ register receipt: success
            ▼
    pending_match  ◄────── POST /v1/credit/borrow-attempts/:id/resume
            │
            │ POST /v1/tx/broadcast (phase=match, pre-receipt persist)
            ▼
        matching
            │
            │ match receipt: success
            ▼
         active
```

Terminal branches (fired from any non-terminal status):

| Trigger | Resulting status |
|---|---|
| `POST /v1/credit/borrow-attempts/:id/abandon` | `abandoned` |
| `POST /v1/tx/broadcast` (register tx reverts) | `funding_failed` |
| `POST /v1/tx/broadcast` (match tx reverts) | `match_failed` |
| Borrow intent expired past `expiry + 60s buffer` (reconciler sweep) | `expired` |

**Terminal states for the borrow-attempt state machine** (no further transitions *within this flow*): `active`, `repaid`, `rolled_over`, `funding_failed`, `match_failed`, `abandoned`, `expired`.

> **Note on `active` vs. the loan lifecycle.** `active` is terminal for the *borrow-attempt* flow — once you reach it, the recovery endpoints stop driving the row. But the underlying on-chain loan continues its own lifecycle: it will eventually transition to `repaid` (when the borrower repays) or `rolled_over` (when the loan is renewed), both of which are tracked separately in the same row. For loan-level state, query `GET /v1/credit/status/:loanId` (using the on-chain `loanId` returned in `GET /borrow-attempts/:attemptId`) — that's the canonical surface for repayment terms, health factor, and accrued interest.

### GET /v1/credit/status/:loanId

Get loan status including health metrics and early repayment terms.

```bash
curl "https://credit-api.floelabs.xyz/v1/credit/status/42" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400"
```

**Response:**

```json
{
  "loanId": "42",
  "principal": "5000000000",
  "accruedInterest": "32000000",
  "totalDebt": "5032000000",
  "collateralAmount": "2000000000000000000",
  "currentLtvBps": "6200",
  "liquidationLtvBps": "8500",
  "bufferBps": "2300",
  "isHealthy": true,
  "isOverdue": false,
  "isInGracePeriod": false,
  "earlyRepaymentTerms": {
    "gracePeriod": "86400",
    "minInterestBps": "5000",
    "fullTermInterest": "65753424",
    "earlyRepaymentPenalty": "896712",
    "totalRepaymentIfRepaidNow": "5032896712"
  }
}
```

### GET /v1/positions/:wallet

Portfolio view for an address: every active borrower loan + a summary (total debt, weighted-average rate, worst health factor, next maturity).

```bash
curl "https://credit-api.floelabs.xyz/v1/positions/0xYourWallet" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400"
```

| Query Param      | Type    | Required | Description |
|------------------|---------|----------|-------------|
| `live`           | boolean | No       | When `true`, fetches each loan's status from the chain (slower, fully live). Default `false` — derives from the indexer with live-computed accrued interest but origination LTV. |
| `includePending` | boolean | No       | When `true`, includes the borrower's open borrow intents that haven't matched yet. Default `false`. |
| `limit`          | number  | No       | Max active loans to return. Default 200, max 500. |
| `skip`           | number  | No       | Pagination offset. Default 0. |
| `pendingLimit`   | number  | No       | Max pending intents (when `includePending=true`). Default 50, max 200. |

**Response (indexer mode, default):**

```json
{
  "account": "0xYourWallet",
  "positions": [
    {
      "loanId": "42",
      "principal": "5000000000",
      "accruedInterest": "32000000",
      "totalDebt": "5032000000",
      "collateralAmount": "2000000000000000000",
      "currentLtvBps": "6200",
      "liquidationLtvBps": "8500",
      "bufferBps": "2300",
      "isHealthy": true,
      "isOverdue": false,
      "isInGracePeriod": false,
      "interestRateBps": "920",
      "loanToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "collateralToken": "0x4200000000000000000000000000000000000006",
      "earlyRepaymentTerms": {
        "gracePeriod": "86400",
        "minInterestBps": "5000",
        "fullTermInterest": "65753424",
        "earlyRepaymentPenalty": "896712",
        "totalRepaymentIfRepaidNow": "5032896712"
      }
    }
  ],
  "summary": {
    "activeLoanCount": 1,
    "totalPrincipal": "5000000000",
    "totalDebt": "5032000000",
    "totalCollateralLocked": "2000000000000000000",
    "weightedAvgInterestRateBps": "920",
    "worstHealthFactor": null,
    "nextMaturityAt": "1714406400",
    "perCollateralToken": {
      "0x4200000000000000000000000000000000000006": "2000000000000000000"
    }
  },
  "source": "indexer",
  "ltvStale": true,
  "indexerBlockNumber": "12345678",
  "fetchedAt": 1711814400
}
```

**Response (live mode, `?live=true`):**

```json
{
  "account": "0xYourWallet",
  "positions": [ "..." ],
  "summary": {
    "activeLoanCount": 1,
    "weightedAvgInterestRateBps": "920",
    "worstHealthFactor": 1.371,
    "...": "..."
  },
  "source": "chain",
  "ltvStale": false,
  "indexerBlockNumber": null,
  "fetchedAt": 1711814400
}
```

| Field                                | Type                  | Description |
|--------------------------------------|-----------------------|-------------|
| `positions[].accruedInterest`        | string                | Computed live from the clock — accurate even in indexer mode. |
| `positions[].currentLtvBps`          | string                | Origination LTV in indexer mode (does NOT reflect price movement). Live oracle LTV when `live=true`. |
| `positions[].bufferBps`              | string                | Headroom before liquidation: `liquidationLtvBps - currentLtvBps` (clamped to 0). >0 = safe; 0 = at threshold. |
| `summary.worstHealthFactor`          | number \| null        | `liquidationLtv / currentLtv`; >1 = safe, <1 = liquidatable. **Always `null` in indexer mode** because origination LTV would lie about price-driven risk. Set `live=true` to compute. |
| `summary.weightedAvgInterestRateBps` | string \| null        | Principal-weighted average. `null` for empty portfolio. |
| `summary.nextMaturityAt`             | string \| null        | Earliest `startTime + duration` across active loans (Unix seconds). |
| `summary.perCollateralToken`         | object                | Map of collateral-token address → total collateral locked (raw units), summed across this wallet's active loans. Useful for "how much WETH am I posting protocol-wide?" questions without iterating positions client-side. |
| `source`                             | `"indexer" \| "chain"`| Where the position data came from. |
| `ltvStale`                           | boolean               | `true` in indexer mode. Accrued interest is unaffected (always live); only LTV-derived fields reflect last-event values. |
| `indexerBlockNumber`                 | string \| null        | Best-effort indexer head block (when the GraphQL endpoint exposes `chain_metadata`). `null` in live mode. |
| `pendingBorrowIntents`               | array (optional)      | Only present when `includePending=true`. Empty array if no open intents. |

> **When to use `live=true`:** any time you need an accurate health factor or LTV utilization. Indexer mode is faster and fine for "what do I owe" displays, but the LTV won't move with price. The route runs each loan's status query in parallel with bounded concurrency to keep RPC load sane.

> **Pagination:** `summary.activeLoanCount` is the wallet's *total* loan count and stays constant across pages — don't gate pagination on it. Instead, paginate as long as `positions.length === limit`, advancing `skip` by `limit` each round, and stop when you receive fewer than `limit` results.

> **Auth scope (today):** any authenticated caller can query any wallet's positions. Borrower addresses and loan IDs are public on-chain data. The signed request still uses your own wallet — only the `:wallet` path param identifies whose portfolio you're querying.

> **503 Service Unavailable:** returned when the API instance was started without an Envio indexer endpoint configured. `getPositions` cannot run without indexer access (chain-only fallback would be too slow). Call the operations team or retry against another instance.

### POST /v1/credit/repay

Build unsigned transactions to repay a loan in full.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/credit/repay" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400" \
  -d '{ "loanId": "42" }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loanId` | string | Yes | Loan ID to repay |
| `slippageBps` | string | No | Slippage tolerance (default: 500 = 5%) |

### POST /v1/credit/repay-and-reborrow

Repay an existing loan and instantly borrow again in one operation.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/credit/repay-and-reborrow" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400" \
  -d '{ "loanId": "42" }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loanId` | string | Yes | Existing loan to repay |
| `newBorrowAmount` | string | No | New borrow amount (default: same as existing) |
| `newCollateralAmount` | string | No | New collateral (default: same as existing) |
| `maxInterestRateBps` | string | No | Max rate for new loan (default: existing rate) |
| `duration` | string | No | New duration in seconds (default: same) |

**Response** includes `repayTransactions` and `reborrowTransactions` arrays. If no liquidity is available for the reborrow, `reborrowTransactions` will be empty but `repayTransactions` are still valid.

---

## Submitting Transactions

The API returns unsigned transaction calldata. Your agent signs and submits each transaction in order on Base (chain ID 8453).

### Python (web3.py)

```python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://mainnet.base.org"))
account = w3.eth.account.from_key("0x...")

# transactions = response from instant-borrow endpoint
for tx_data in transactions:
    tx = {
        "to": tx_data["to"],
        "data": tx_data["data"],
        "value": int(tx_data["value"], 16),
        "chainId": tx_data["chainId"],
        "gas": w3.eth.estimate_gas({
            "to": tx_data["to"],
            "data": tx_data["data"],
            "value": int(tx_data["value"], 16),
            "from": account.address,
        }),
        "nonce": w3.eth.get_transaction_count(account.address),
        "maxFeePerGas": w3.eth.gas_price * 2,
        "maxPriorityFeePerGas": w3.eth.gas_price,
    }
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    assert receipt.status == 1, f"Transaction failed: {tx_hash.hex()}"
    print(f"  {tx_data['description']}: {tx_hash.hex()}")
```

### TypeScript (viem)

```typescript
import { createWalletClient, http, createPublicClient } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0x...");
const publicClient = createPublicClient({ chain: base, transport: http() });
const walletClient = createWalletClient({ account, chain: base, transport: http() });

// transactions = response from instant-borrow endpoint
for (const txData of transactions) {
  const hash = await walletClient.sendTransaction({
    to: txData.to as `0x${string}`,
    data: txData.data as `0x${string}`,
    value: BigInt(txData.value),
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`Failed: ${hash}`);
  console.log(`  ${txData.description}: ${hash}`);
}
```

**Important:** Submit transactions in order. Each must confirm before sending the next. The approval transaction may be omitted if the allowance is already sufficient.

All amounts are in raw token units (e.g., `"5000000000"` = 5,000 USDC with 6 decimals).

---

## Error Handling

| Status | Error | Meaning | What to Do |
|--------|-------|---------|------------|
| 400 | Invalid request | Missing/invalid fields | Check request body against the schema above |
| 400 | InitialLtvExceededError | Oracle-computed initial LTV exceeds `maxLtvBps` | Increase collateral, decrease borrow amount, or raise `maxLtvBps` |
| 401 | Unauthorized | Missing or invalid auth headers | Verify signature, check timestamp freshness (< 5 min) |
| 404 | NoLiquidityError | No matching lend intents for these parameters | See [Diagnosing NoLiquidityError](#diagnosing-noliquidityerror) — the response carries `primaryReason` and a parameter-specific `suggestion` |
| 404 | LoanNotFoundError | Loan doesn't exist or is already repaid | Verify loanId, check if already repaid |
| 500 | Internal error | Server-side failure | Retry after a few seconds |

### Diagnosing NoLiquidityError

A 404 `NoLiquidityError` does **not** always mean the order book is empty. Most often it means your request parameters don't match any open offer — usually the LTV gap rule (`borrower.minLtvBps + 800 ≤ lender.maxLtvBps`), but it can also be rate, duration, amount, or `minFillAmount`. The response body tells you which.

```json
{
  "error": "NoLiquidityError",
  "message": "No matching lend intents for 100000000000 in market 0xfe9265...",
  "primaryReason": "LTV_GAP_TOO_SMALL",
  "suggestion": "Your minLtvBps (8000) needs a lender with maxLtvBps ≥ 8800. Best available is 8500. Lower minLtvBps to ≤ 7700, or wait for a lender at maxLtvBps ≥ 8800.",
  "rejectionsByCode": { "LTV_GAP_TOO_SMALL": 12 },
  "closestOffers": [
    {
      "rate": "500",
      "available": "990000000000",
      "maxLtvBps": "8500",
      "minDuration": "86400",
      "maxDuration": "31536000",
      "minFillAmount": "0"
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `primaryReason` | The dominant rule that rejected the most offers. Use this to drive your retry logic. |
| `suggestion` | Human-readable, parameter-specific guidance. Safe to surface to end users / agent logs. |
| `rejectionsByCode` | Histogram of rejection codes across the order book. Useful when several rules are failing at once. |
| `closestOffers` | Up to 3 cheapest offers by rate (excluding cancelled), with all fields you need to self-diagnose. All bigints are decimal strings. |

#### `primaryReason` values

| Code | What it means | How to fix |
|---|---|---|
| `LTV_GAP_TOO_SMALL` | Your `minLtvBps + 800` exceeds every available lender's `maxLtvBps` | Lower `minLtvBps`, or wait for higher-LTV liquidity |
| `LIQUIDATION_LTV_TOO_LOW` | Your `maxLtvBps` is too close to the lender's liquidation threshold (also needs an 800 bps gap) | Lower `maxLtvBps`, or find a lender with a higher liquidation threshold |
| `RATE_TOO_HIGH` | Cheapest open offer is above your `maxInterestRateBps` | Raise `maxInterestRateBps` to ≥ the offer's `rate`, or wait for cheaper offers |
| `AMOUNT_TOO_LARGE` | No single offer has enough `available` to fill your `borrowAmount` | Reduce `borrowAmount`, or wait for deeper liquidity |
| `BELOW_MIN_FILL` | Your `borrowAmount` is below every lender's `minFillAmount` | Increase `borrowAmount`, or find a lender with a lower floor |
| `DURATION_TOO_LONG` | Your `duration` exceeds every offer's `maxDuration` | Reduce `duration`, or find a longer-duration lender |
| `DURATION_TOO_SHORT` | Your `duration` is below every offer's `minDuration` | Increase `duration`, or find a shorter-duration lender |
| `EXPIRED` | All open offers have expired | Wait for fresh lender intents |
| `NOT_YET_VALID` | All open offers activate later (`validFromTimestamp` in the future) | Retry after the offers' `validFromTimestamp` |
| `NO_OFFERS` | The order book is empty, or every candidate intent was stale on re-validation | Post a borrow intent to wait for matching, or retry shortly (indexer may be behind chain state) |

#### Worked example — the LTV gap rule

The protocol enforces `borrower.minLtvBps + 800 ≤ lender.maxLtvBps` (8 % buffer between origination and liquidation LTV — see [Order book matching](../protocol/orderbook-matching.md#5-ltv-gap)). A request that *looks* compatible on rate alone can still be rejected:

- Borrower posts: `borrowAmount = 100,000 USDC`, `maxInterestRateBps = 500`, **`minLtvBps = 8000`**
- Order book shows: `990,000,000 USDC available at 500 bps`, **`maxLtvBps = 8500`**
- Result: 404 `LTV_GAP_TOO_SMALL` — `8000 + 800 = 8800 > 8500`

Fix: lower `minLtvBps` to ≤ `7700`, or wait for a lender at `maxLtvBps ≥ 8800`.

### Transaction Failures

If a transaction in the sequence fails:

- **Approval failed:** No on-chain state changed. Safe to retry the entire sequence.
- **Register borrow intent failed:** Your approval is still valid. Retry from the register step.
- **Match failed:** Your borrow intent is registered on-chain. Call the API again — it will detect the existing intent and return only the match transaction.

### Retry Strategy

For transient failures (network timeouts, 500s), retry with exponential backoff:

```python
import time

def retry_with_backoff(fn, max_retries=3):
    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # 1s, 2s, 4s
```

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

## Agent Endpoints

These endpoints manage the lifecycle of x402 credit-backed agents. All require authentication.

### POST /v1/agents/pre-register

Create a custodial payment wallet for your agent. This is the first step before granting on-chain delegation.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/agents/pre-register" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400" \
  -d '{
    "collateralToken": "0x4200000000000000000000000000000000000006",
    "borrowLimit": "10000000000",
    "maxRateBps": "1500"
  }'
```

**Response:**

```json
{
  "paymentWalletAddress": "0xCustodialWallet...",
  "facilitatorAddress": "0x58EDdE022FFDAD3Fb0Fb0E7D51eb05AaF66a31f1",
  "status": "pending_delegation"
}
```

### POST /v1/agents/register

Complete registration after granting on-chain delegation. The facilitator verifies your delegation transaction and activates your account.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/agents/register" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400" \
  -d '{ "delegationTxHash": "0xabc..." }'
```

**Response:**

```json
{
  "status": "active",
  "apiKey": "floe_YOUR_API_KEY",
  "creditLimit": "10000000000",
  "paymentWalletAddress": "0xCustodialWallet..."
}
```

### GET /v1/agents/balance

Check your agent's credit balance, active loans, and delegation status.

```bash
curl "https://credit-api.floelabs.xyz/v1/agents/balance" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"
```

**Response:**

```json
{
  "creditLimit": "10000000000",
  "creditUsed": "3200000000",
  "creditAvailable": "6800000000",
  "activeLoans": [{ "loanId": "42", "principalRaw": "5000000000" }],
  "delegationActive": true
}
```

### GET /v1/agents/transactions

Paginated history of x402 payments made through the proxy.

```bash
curl "https://credit-api.floelabs.xyz/v1/agents/transactions?limit=20&cursor=41" \
  -H "Authorization: Bearer floe_YOUR_API_KEY"
```

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
