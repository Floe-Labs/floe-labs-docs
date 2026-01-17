# Client SDK

The Floe SDK provides a TypeScript/JavaScript interface for interacting with the Floe protocol.

## Installation

```bash
npm install @floe/sdk ethers
# or
yarn add @floe/sdk ethers
# or
pnpm add @floe/sdk ethers
```

## Quick Start

### Initialize the SDK

```typescript
import { ModularLendingSDK } from '@floe/sdk';
import { ethers } from 'ethers';

// Configuration for Base Mainnet
const config = {
  rpcUrl: 'https://mainnet.base.org',
  lendingIntentMatcher: '0x17946cD3e180f82e632805e5549EC913330Bb175',
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',     // USDC
  collateralToken: '0x4200000000000000000000000000000000000006', // WETH
};

// For read-only operations (no signer needed)
const sdk = new ModularLendingSDK(config);

// For transactions (with signer)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const sdkWithSigner = new ModularLendingSDK(config, signer);
```

## Read Operations

```typescript
// Get market information
const marketId = await sdk.lending.getMarketId(
  config.loanToken,
  config.collateralToken
);
const market = await sdk.lending.getMarket(marketId);
console.log('Market:', market);

// Get token prices
const ethPrice = await sdk.lending.getPrice(config.collateralToken);
console.log('ETH Price:', ethers.formatUnits(ethPrice, 8)); // Oracle uses 8 decimals

// Check loan health
const loan = await sdk.lending.getLoan(loanId);
console.log('Loan principal:', ethers.formatUnits(loan.principal, 6));

// Check if loan is liquidatable
const isLiquidatable = await sdk.lending.isLoanLiquidatable(loanId);

// Calculate total debt (principal + interest)
const totalDebt = await sdk.lending.calculateTotalDebt(loanId);
```

## Create a Borrow Intent

```typescript
import { parseUnits } from 'ethers';

// Approve collateral first (WETH)
const collateralAmount = parseUnits('1', 18); // 1 ETH
await sdk.collateralToken.approve(config.lendingIntentMatcher, collateralAmount);

// Create borrow intent
const tx = await sdk.lending.registerBorrowIntent({
  borrowAmount: parseUnits('2000', 6),      // 2000 USDC (6 decimals)
  collateralAmount: collateralAmount,        // 1 ETH
  maxInterestRateBps: 800,                   // 8% max APR
  minLtvBps: 6000,                           // 60% LTV
  matcherCommissionBps: 50,                  // 0.5% matcher fee
  duration: 30 * 24 * 60 * 60,               // 30 days in seconds
  expiry: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days to match
  marketId: marketId,
});

const receipt = await tx.wait();
console.log('Borrow intent created:', receipt.hash);
```

## Create a Lend Intent

```typescript
// Approve loan token first (USDC)
const lendAmount = parseUnits('5000', 6); // 5000 USDC
await sdk.loanToken.approve(config.lendingIntentMatcher, lendAmount);

// Create lend intent
const tx = await sdk.lending.registerLendIntent({
  amount: lendAmount,
  minFillAmount: parseUnits('1000', 6),      // Min 1000 USDC per match
  minInterestRateBps: 500,                   // 5% min APR
  maxLtvBps: 7500,                           // 75% max LTV
  duration: 60 * 24 * 60 * 60,               // 60 days max
  expiry: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60, // 14 days to match
  allowPartialFill: true,
  marketId: marketId,
});

const receipt = await tx.wait();
console.log('Lend intent created:', receipt.hash);
```

## Match Intents

```typescript
// Match a specific lend intent with a borrow intent
const tx = await sdk.lending.matchLoanIntents(
  lendIntentHash,    // bytes32
  borrowIntentHash,  // bytes32
  fillAmount         // Amount to fill (in loan token units)
);
await tx.wait();
```

## Loan Management

### Repay a Loan

```typescript
// Approve USDC for repayment
const repayAmount = parseUnits('2050', 6); // Principal + interest
await sdk.loanToken.approve(config.lendingIntentMatcher, repayAmount);

// Repay loan
const maxRepayment = parseUnits('2100', 6); // Slippage buffer
const tx = await sdk.lending.repayLoan(loanId, maxRepayment);
await tx.wait();
```

### Add Collateral

```typescript
// Approve additional collateral
const additionalCollateral = parseUnits('0.5', 18); // 0.5 ETH
await sdk.collateralToken.approve(config.lendingIntentMatcher, additionalCollateral);

// Add collateral to existing loan
const tx = await sdk.lending.addCollateral(loanId, additionalCollateral);
await tx.wait();
```

### Withdraw Collateral

```typescript
// Withdraw excess collateral (must maintain healthy LTV)
const withdrawAmount = parseUnits('0.2', 18); // 0.2 ETH
const tx = await sdk.lending.withdrawCollateral(loanId, withdrawAmount);
await tx.wait();
```

### Liquidate a Loan

```typescript
// Check if loan is liquidatable
const isLiquidatable = await sdk.lending.isLoanLiquidatable(loanId);

if (isLiquidatable) {
  // Approve loan token to pay off debt
  const debt = await sdk.lending.calculateTotalDebt(loanId);
  await sdk.loanToken.approve(config.lendingIntentMatcher, debt);

  // Liquidate
  const tx = await sdk.lending.liquidateLoan(loanId);
  await tx.wait();
}
```

## Token Operations

```typescript
// Get token balances
const usdcBalance = await sdk.loanToken.balanceOf(userAddress);
const wethBalance = await sdk.collateralToken.balanceOf(userAddress);

// Check allowances
const usdcAllowance = await sdk.loanToken.allowance(
  userAddress,
  config.lendingIntentMatcher
);

// Get token info
const symbol = await sdk.loanToken.symbol();      // "USDC"
const decimals = await sdk.loanToken.decimals();  // 6
```

## Event Listening

```typescript
// Listen for new loans
sdk.lending.contract.on('LogIntentsMatched', (loanId, lendHash, borrowHash, event) => {
  console.log('New loan created:', loanId);
});

// Listen for repayments
sdk.lending.contract.on('LogLoanRepayment', (loanId, amount, event) => {
  console.log('Loan repaid:', loanId, ethers.formatUnits(amount, 6));
});

// Listen for liquidations
sdk.lending.contract.on('LogLoanLiquidated', (loanId, liquidator, event) => {
  console.log('Loan liquidated:', loanId);
});
```

## Error Handling

```typescript
try {
  const tx = await sdk.lending.repayLoan(loanId, maxRepayment);
  await tx.wait();
} catch (error) {
  if (error.message.includes('LoanNotFound')) {
    console.error('Loan does not exist');
  } else if (error.message.includes('InsufficientAllowance')) {
    console.error('Need to approve more tokens');
  } else if (error.message.includes('CircuitBreakerActive')) {
    console.error('Protocol is paused due to oracle issues');
  } else {
    console.error('Transaction failed:', error);
  }
}
```

## TypeScript Types

```typescript
import type {
  SDKConfig,
  LendIntent,
  BorrowIntent,
  Loan,
  Market,
} from '@floe/sdk';

// SDK Configuration
interface SDKConfig {
  rpcUrl: string;
  lendingIntentMatcher: string;
  loanToken: string;
  collateralToken: string;
}

// Use types for type safety
const loan: Loan = await sdk.lending.getLoan(loanId);
```

## Full Example: Borrow Flow

```typescript
import { ModularLendingSDK } from '@floe/sdk';
import { ethers, parseUnits } from 'ethers';

async function borrowUSDC() {
  // Setup
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  const config = {
    rpcUrl: 'https://mainnet.base.org',
    lendingIntentMatcher: '0x17946cD3e180f82e632805e5549EC913330Bb175',
    loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    collateralToken: '0x4200000000000000000000000000000000000006',
  };

  const sdk = new ModularLendingSDK(config, signer);

  // Check balances
  const wethBalance = await sdk.collateralToken.balanceOf(userAddress);
  console.log('WETH Balance:', ethers.formatUnits(wethBalance, 18));

  // Prepare amounts
  const borrowAmount = parseUnits('1000', 6);    // 1000 USDC
  const collateralAmount = parseUnits('0.5', 18); // 0.5 ETH

  // Get market ID
  const marketId = await sdk.lending.getMarketId(
    config.loanToken,
    config.collateralToken
  );

  // Approve collateral
  console.log('Approving collateral...');
  const approveTx = await sdk.collateralToken.approve(
    config.lendingIntentMatcher,
    collateralAmount
  );
  await approveTx.wait();

  // Create borrow intent
  console.log('Creating borrow intent...');
  const borrowTx = await sdk.lending.registerBorrowIntent({
    borrowAmount,
    collateralAmount,
    maxInterestRateBps: 700,  // 7% max
    minLtvBps: 5000,          // 50% LTV
    matcherCommissionBps: 30, // 0.3% matcher fee
    duration: 30 * 24 * 60 * 60,
    expiry: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    marketId,
  });

  const receipt = await borrowTx.wait();
  console.log('Borrow intent created!');
  console.log('Transaction:', receipt.hash);
}

borrowUSDC().catch(console.error);
```

## Next Steps

- [Networks & Contract Addresses](../../developers/networks.md)
- [REST/Graph API](api.md)
- [Matcher Operator Guide](matcher-operators.md)
