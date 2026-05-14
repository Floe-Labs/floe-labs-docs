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
