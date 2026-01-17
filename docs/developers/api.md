# REST/Graph API

Access Floe data through our GraphQL API powered by Envio HyperIndex.

## Overview

Floe indexes all on-chain events to provide fast, queryable data access:
- Intent listings and status
- Loan history and current state
- Market statistics
- Circuit breaker status

## GraphQL Endpoint

**Mainnet**: `https://api.floelabs.xyz/v1/graphql`

For local development, the indexer runs at `http://localhost:8090/v1/graphql`.

## Authentication

The API is currently open for read access. Write operations require signed transactions on-chain.

## Queries

### Get Active Intents

```graphql
query ActiveLendIntents($marketId: String!) {
  LendIntent(
    where: {
      marketId: { _eq: $marketId },
      isActive: { _eq: true }
    }
    order_by: { createdAt: desc }
    limit: 50
  ) {
    id
    lender
    amount
    minInterestRateBps
    maxLtvBps
    duration
    expiry
    createdAt
  }
}
```

### Get Active Borrow Intents

```graphql
query ActiveBorrowIntents($marketId: String!) {
  BorrowIntent(
    where: {
      marketId: { _eq: $marketId },
      isActive: { _eq: true }
    }
    order_by: { createdAt: desc }
    limit: 50
  ) {
    id
    borrower
    amount
    collateralAmount
    maxInterestRateBps
    minLtvBps
    duration
    expiry
    createdAt
  }
}
```

### Get Loan by ID

```graphql
query GetLoan($loanId: Int!) {
  Loan(where: { loanId: { _eq: $loanId } }) {
    loanId
    lender
    borrower
    marketId
    principal
    collateral
    interestRateBps
    originationLtvBps
    liquidationLtvBps
    startTime
    duration
    isActive
    createdAt
  }
}
```

### Get User's Loans

```graphql
query UserLoans($address: String!) {
  Loan(
    where: {
      _or: [
        { lender: { _eq: $address } },
        { borrower: { _eq: $address } }
      ]
    }
    order_by: { createdAt: desc }
  ) {
    loanId
    lender
    borrower
    principal
    collateral
    interestRateBps
    isActive
    startTime
    duration
  }
}
```

### Get Market Statistics

```graphql
query MarketStats($marketId: String!) {
  MarketStats(where: { marketId: { _eq: $marketId } }) {
    totalLoansCreated
    totalVolumeUsd
    activeLoans
    averageInterestRate
    averageLtv
  }
}
```

### Check Circuit Breaker Status

```graphql
query CircuitBreakerStatus {
  CircuitBreakerState {
    isActive
    reason
    activatedAt
    lastPriceUpdate
    chainlinkPrice
    pythPrice
  }
}
```

## Subscriptions

Real-time updates via GraphQL subscriptions:

```graphql
subscription NewLoans($marketId: String!) {
  Loan(
    where: { marketId: { _eq: $marketId } }
    order_by: { createdAt: desc }
    limit: 1
  ) {
    loanId
    lender
    borrower
    principal
    createdAt
  }
}
```

## Entity Schema

### LendIntent

| Field | Type | Description |
|-------|------|-------------|
| id | String | Intent hash |
| lender | String | Lender address |
| marketId | String | Market identifier |
| amount | BigInt | Loan amount |
| minInterestRateBps | Int | Minimum rate (bps) |
| maxLtvBps | Int | Max LTV (bps) |
| duration | Int | Max duration (seconds) |
| expiry | Int | Expiry timestamp |
| isActive | Boolean | Still matchable |
| createdAt | Timestamp | Creation time |

### BorrowIntent

| Field | Type | Description |
|-------|------|-------------|
| id | String | Intent hash |
| borrower | String | Borrower address |
| marketId | String | Market identifier |
| amount | BigInt | Borrow amount |
| collateralAmount | BigInt | Collateral posted |
| maxInterestRateBps | Int | Max acceptable rate |
| minLtvBps | Int | Target LTV |
| duration | Int | Desired duration |
| expiry | Int | Expiry timestamp |
| isActive | Boolean | Still matchable |
| createdAt | Timestamp | Creation time |

### Loan

| Field | Type | Description |
|-------|------|-------------|
| loanId | Int | Unique loan ID |
| lender | String | Lender address |
| borrower | String | Borrower address |
| marketId | String | Market identifier |
| principal | BigInt | Loan principal |
| collateral | BigInt | Collateral amount |
| interestRateBps | Int | Interest rate |
| originationLtvBps | Int | Starting LTV |
| liquidationLtvBps | Int | Liquidation threshold |
| startTime | Int | Loan start timestamp |
| duration | Int | Loan duration |
| isActive | Boolean | Loan still open |

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Invalid query syntax |
| 404 | Entity not found |
| 500 | Internal server error |

## Rate Limits

| Tier | Requests/min |
|------|--------------|
| Public | 100 |
| Authenticated | 1000 |

## SDK Integration

The SDK wraps these queries for convenience:

```typescript
import { ModularLendingSDK } from '@floe/sdk';

const sdk = new ModularLendingSDK(config);

// Get active intents
const lendIntents = await sdk.indexer.getActiveLendIntents(marketId);
const borrowIntents = await sdk.indexer.getActiveBorrowIntents(marketId);

// Get user's loans
const loans = await sdk.indexer.getUserLoans(address);

// Subscribe to new loans
sdk.indexer.subscribeToLoans(marketId, (loan) => {
  console.log('New loan:', loan);
});
```

## Local Development

Run the indexer locally:

```bash
cd indexer
pnpm install
pnpm codegen && pnpm build
cd generated && docker compose up -d && cd ..
pnpm start
```

Access Hasura console at `http://localhost:8090`.
