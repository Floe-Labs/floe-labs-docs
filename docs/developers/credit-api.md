---
icon: webhook
---

# Credit REST API

The Credit API lets any agent — regardless of language or framework — access Floe's instant credit facilities via HTTP. It returns unsigned transaction calldata that agents sign and submit with their own wallet.

**Base URL:** `https://credit-api.floelabs.xyz`

## Try It Now

See live lender offers on Base — no auth required:

```bash
curl "https://credit-api.floelabs.xyz/v1/credit/offers?marketId=0x..."
```

---

## Endpoints

### GET /v1/credit/offers

Query available lend intents. **Public — no auth required.**

```bash
curl "https://credit-api.floelabs.xyz/v1/credit/offers?marketId=0x..."
```

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `marketId` | bytes32 | Yes | Market ID (loan token + collateral token pair) |
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
      "minInterestBps": "5000"
    }
  ]
}
```

---

## Authentication

All endpoints below require authentication. The offers endpoint above is public.

The API uses **EIP-191 / EIP-1271 signed message** authentication. No API keys, no registration. Any wallet can authenticate.

### How It Works

1. Sign the message `Floe Credit API\nTimestamp: <unix_seconds>` with your wallet
2. Include three headers in your request:

| Header | Value |
|--------|-------|
| `X-Wallet-Address` | Your wallet address (`0x...`) |
| `X-Signature` | The signed message (`0x...`, 65 bytes) |
| `X-Timestamp` | Unix timestamp used in the message |

The timestamp must be within 5 minutes of the server time.

### Python Example

```python
from eth_account import Account
from eth_account.messages import encode_defunct
import requests
import time

private_key = "0x..."
account = Account.from_key(private_key)
timestamp = str(int(time.time()))
message = f"Floe Credit API\nTimestamp: {timestamp}"
signed = account.sign_message(encode_defunct(text=message))

headers = {
    "X-Wallet-Address": account.address,
    "X-Signature": signed.signature.hex(),
    "X-Timestamp": timestamp,
    "Content-Type": "application/json"
}
```

### Smart Contract Wallets (ERC-1271)

Giza agents, Olas agents, and Safe multisigs authenticate the same way. The API detects smart contract wallets automatically and calls `isValidSignature()` on your wallet contract to verify the signature.

---

## Authenticated Endpoints

### POST /v1/credit/instant-borrow

Build unsigned transactions for an instant borrow. The API selects the best available lender automatically.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/credit/instant-borrow" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400" \
  -d '{
    "marketId": "0x...",
    "borrowAmount": "5000000000",
    "collateralAmount": "2000000000000000000",
    "maxInterestRateBps": "1200",
    "duration": "2592000",
    "minLtvBps": "8000"
  }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `marketId` | bytes32 | Yes | Market ID |
| `borrowAmount` | string | Yes | Amount to borrow (raw units) |
| `collateralAmount` | string | Yes | Collateral to post (raw units) |
| `maxInterestRateBps` | string | Yes | Max acceptable rate (bps) |
| `duration` | string | Yes | Loan duration in seconds |
| `minLtvBps` | string | No | Min LTV (default: 8000 = 80%) |

**Response:**

```json
{
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

Sign and submit each transaction in order. The approval transaction may be omitted if the allowance is already sufficient.

---

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

---

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

---

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

### GET /v1/health

Health check. **Public — no auth required.**

```bash
curl "https://credit-api.floelabs.xyz/v1/health"
```

```json
{ "status": "ok", "timestamp": "2025-03-30T12:00:00.000Z" }
```

---

## Error Responses

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | Invalid request | Missing/invalid fields |
| 401 | Unauthorized | Missing or invalid auth headers |
| 404 | NoLiquidityError | No matching lend intents available |
| 404 | LoanNotFoundError | Loan doesn't exist or is already repaid |
| 500 | Internal error | Server-side failure |

## Transaction Submission

The API returns unsigned transaction calldata. Your agent is responsible for:

1. Signing each transaction with the wallet's private key
2. Submitting transactions to the Base network in order
3. Waiting for each transaction to confirm before submitting the next

All amounts are in raw token units (e.g., `"5000000000"` = 5,000 USDC with 6 decimals).
