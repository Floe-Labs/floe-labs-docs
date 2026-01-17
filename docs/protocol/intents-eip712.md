# Intents & EIP-712

How Floe uses EIP-712 typed data for secure, human-readable intent signing.

## Overview

Intents are signed using [EIP-712](https://eips.ethereum.org/EIPS/eip-712), which provides:
- Structured, typed data signing
- Human-readable signing prompts in wallets
- Protection against replay attacks
- Cross-chain compatibility

## EIP-712 Domain

```solidity
EIP712Domain {
    string name = "Floe";
    string version = "1";
    uint256 chainId;          // 8453 for Base Mainnet
    address verifyingContract; // LendingIntentMatcher address
}
```

## Intent Types

### LendIntent

```solidity
struct LendIntent {
    address lender;           // Lender's address
    bytes32 marketId;         // Market identifier
    uint256 amount;           // Amount to lend (USDC, 6 decimals)
    uint256 minInterestRateBps; // Minimum interest rate (basis points)
    uint256 maxLtvBps;        // Maximum LTV for liquidation
    uint256 duration;         // Maximum loan duration (seconds)
    uint256 expiry;           // Intent expiry timestamp
    uint256 nonce;            // Unique nonce to prevent replay
    uint256 minFillAmount;    // Minimum amount per match
    bool allowPartialFill;    // Allow multiple partial matches
    uint256 matcherCommissionBps; // Commission for matcher
    Condition[] conditions;   // Optional oracle conditions
    Hook[] hooks;             // Optional hooks
}
```

### BorrowIntent

```solidity
struct BorrowIntent {
    address borrower;         // Borrower's address
    bytes32 marketId;         // Market identifier
    uint256 amount;           // Amount to borrow (USDC)
    uint256 collateralAmount; // Collateral to post (WETH)
    uint256 maxInterestRateBps; // Maximum acceptable rate
    uint256 minLtvBps;        // Target origination LTV
    uint256 duration;         // Desired loan duration
    uint256 expiry;           // Intent expiry timestamp
    uint256 nonce;            // Unique nonce
    uint256 matcherCommissionBps; // Commission for matcher
    Condition[] conditions;   // Optional oracle conditions
    Hook[] hooks;             // Optional hooks
}
```

## Signing Intents

### EOA Signing

Standard wallets use `eth_signTypedData_v4`:

```typescript
const signature = await wallet.signTypedData(
    domain,
    { LendIntent: lendIntentTypes },
    intent
);
```

### ERC-1271 Signing (Smart Contract Wallets)

For DAOs, multisigs, and smart wallets:

```solidity
interface IERC1271 {
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view returns (bytes4 magicValue);
}
```

The contract must return `0x1626ba7e` to indicate a valid signature.

## Example: Borrow Intent

```json
{
    "borrower": "0x1234...5678",
    "marketId": "0xabc...def",
    "amount": "5000000000",
    "collateralAmount": "2500000000000000000",
    "maxInterestRateBps": 600,
    "minLtvBps": 5000,
    "duration": 2592000,
    "expiry": 1738368000,
    "nonce": 1,
    "matcherCommissionBps": 50,
    "conditions": [],
    "hooks": []
}
```

**Interpretation:**
- Borrow 5,000 USDC (`5000000000` with 6 decimals)
- Post 2.5 WETH as collateral
- Maximum 6% APR (`600` basis points)
- Target 50% LTV (`5000` basis points)
- 30-day loan (`2592000` seconds)
- 0.5% matcher commission

## Conditions

Optional oracle-based conditions that must be met for matching:

```solidity
struct Condition {
    address validator;  // Condition validator contract
    bytes data;        // Condition parameters
}
```

Example: Only match if ETH price is below $3000

```json
{
    "validator": "0xPriceConditionValidator",
    "data": "0x..." // Encoded: (feed, operator, value)
}
```

## Nonce Management

Each intent includes a unique nonce to prevent:
- Replay attacks (reusing old signatures)
- Double-spending (matching same intent twice)

The contract tracks used nonces per user.

## Intent Hashing

Intents are hashed on-chain for verification:

```solidity
function hashLenderIntent(LendIntent calldata intent)
    external view returns (bytes32);

function hashBorrowerIntent(BorrowIntent calldata intent)
    external view returns (bytes32);
```

## On-Chain vs Off-Chain Intents

| Mode | Description | Use Case |
|------|-------------|----------|
| Off-chain | Signed but not submitted | Gas-free until matched |
| On-chain | Registered in contract | Visible in orderbook, discoverable |

Both modes use the same signature format.

## Signature Verification

```solidity
function validateIntents(
    LendIntent calldata lender,
    bytes calldata lenderSig,
    BorrowIntent calldata borrower,
    bytes calldata borrowerSig,
    bytes32 marketId,
    bool isLenderOnChain,
    bool isBorrowerOnChain
) external view returns (bytes32 lendIntentHash, bytes32 borrowIntentHash);
```

## Security Considerations

1. **Domain Binding**: Signatures are chain and contract-specific
2. **Expiry**: All intents have mandatory expiration
3. **Nonce**: Prevents replay attacks
4. **ERC-1271**: Supports smart contract wallets safely

## SDK Usage

```typescript
import { ModularLendingSDK } from '@floe/sdk';

const sdk = new ModularLendingSDK(config);

// Create and sign a borrow intent
const signedIntent = await sdk.lending.createBorrowIntent({
    amount: parseUnits('5000', 6),
    collateralAmount: parseEther('2.5'),
    maxInterestRateBps: 600,
    duration: 30 * 24 * 60 * 60,
});
```
