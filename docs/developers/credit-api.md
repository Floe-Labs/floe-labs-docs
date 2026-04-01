---
icon: webhook
---

# Credit REST API

The Credit API lets any agent — regardless of language or framework — access Floe's instant credit facilities via HTTP. It returns unsigned transaction calldata that agents sign and submit with their own wallet.

**Base URL:** `https://credit-api.floelabs.xyz`

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

Build unsigned transactions for an instant borrow. The API selects the best available lender automatically.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/credit/instant-borrow" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: 0xYourWallet" \
  -H "X-Signature: 0xYourSig" \
  -H "X-Timestamp: 1711814400" \
  -d '{
    "marketId": "0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930",
    "borrowAmount": "5000000000",
    "collateralAmount": "2000000000000000000",
    "maxInterestRateBps": "1200",
    "duration": "2592000",
    "minLtvBps": "8000",
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
| 404 | NoLiquidityError | No matching lend intents available | Try a smaller amount, higher max rate, or different market |
| 404 | LoanNotFoundError | Loan doesn't exist or is already repaid | Verify loanId, check if already repaid |
| 500 | Internal error | Server-side failure | Retry after a few seconds |

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
