# Lending Intent Matcher

## LendingIntentMatcher

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/LendingIntentMatcher.sol)

**Inherits:** ILendingIntentMatcher, Setters, Getters

Entry point smart contract for the entire protocol.

Minimalist, intent-based lending system that matches lenders and borrowers peer-to-peer without pools or centralized intermediaries.

Implements on-chain and off-chain intent registration, signature-based matching, and loan lifecycle management.

### Functions

#### constructor

```solidity
constructor(address _governor, address _priceOracle, address _feeRecipient, address _logicsManager)
    Storage(_governor);
```

#### createMarket

Creates a new lending market with specified parameters.

```solidity
function createMarket(
    address loanToken,
    address collateralToken,
    uint256 interestRateBps,
    uint256 ltvBps,
    uint256 marketFeeBps,
    uint256 liquidationIncentiveBps
) external onlyGovernor returns (bytes32 marketId);
```

**Parameters**

| Name                      | Type      | Description                                         |
| ------------------------- | --------- | --------------------------------------------------- |
| `loanToken`               | `address` | The token being lent.                               |
| `collateralToken`         | `address` | The token used as collateral.                       |
| `interestRateBps`         | `uint256` | Minimum interest rate in basis points.              |
| `ltvBps`                  | `uint256` | Loan-to-value ratio in basis points (1% = 100 BPS). |
| `marketFeeBps`            | `uint256` | Protocol fee charged on interest in basis points.   |
| `liquidationIncentiveBps` | `uint256` | Bonus for liquidators in basis points.              |

#### matchLoanIntents

Matches a lender's intent with a borrower's intent, creating a loan if conditions are met.

```solidity
function matchLoanIntents(
    LendIntent calldata lender,
    bytes calldata lenderSig,
    BorrowIntent calldata borrower,
    bytes calldata borrowerSig,
    bytes32 marketId,
    bool isLenderOnChain,
    bool isBorrowerOnChain
) external nonReentrant onlyWhenBorrowNotPaused(marketId) returns (uint256 loanId);
```

#### registerLendIntent

Registers a lender's intent to lend on-chain.

```solidity
function registerLendIntent(LendIntent calldata intent) external onlyWhenBorrowNotPaused(intent.marketId);
```

**Parameters**

| Name     | Type         | Description                                   |
| -------- | ------------ | --------------------------------------------- |
| `intent` | `LendIntent` | Struct containing the lender's offer details. |

#### revokeLendIntentByHash

Revokes an on-chain lender intent.

```solidity
function revokeLendIntentByHash(bytes32 intentHash) external;
```

**Parameters**

| Name         | Type      | Description                                            |
| ------------ | --------- | ------------------------------------------------------ |
| `intentHash` | `bytes32` | representing the lender's previously registered offer. |

#### registerBorrowIntent

Registers a borrower's intent to borrow on-chain.

```solidity
function registerBorrowIntent(BorrowIntent calldata intent) external onlyWhenBorrowNotPaused(intent.marketId);
```

**Parameters**

| Name     | Type           | Description                                       |
| -------- | -------------- | ------------------------------------------------- |
| `intent` | `BorrowIntent` | Struct containing the borrower's request details. |

#### revokeBorrowIntentByHash

Revokes an on-chain borrower intent.

```solidity
function revokeBorrowIntentByHash(bytes32 intentHash) external;
```

**Parameters**

| Name         | Type      | Description                                                |
| ------------ | --------- | ---------------------------------------------------------- |
| `intentHash` | `bytes32` | representing the borrower's previously registered request. |

#### repayLoan

Allows a borrower to repay part or all of a loan.

```solidity
function repayLoan(uint256 loanId, uint256 repayAmount)
    external
    nonReentrant
    onlyWhenRepayNotPaused(loans[loanId].marketId);
```

**Parameters**

| Name          | Type      | Description                                                            |
| ------------- | --------- | ---------------------------------------------------------------------- |
| `loanId`      | `uint256` | The ID of the loan being repaid.                                       |
| `repayAmount` | `uint256` | The principal amount to repay (interest is calculated proportionally). |

#### liquidateLoan

Allows a third party to liquidate a loan that is unhealthy.

```solidity
function liquidateLoan(uint256 loanId, uint256 repayAmount)
    external
    nonReentrant
    onlyWhenLiquidateNotPaused(loans[loanId].marketId);
```

**Parameters**

| Name          | Type      | Description                                                            |
| ------------- | --------- | ---------------------------------------------------------------------- |
| `loanId`      | `uint256` | The ID of the loan to liquidate.                                       |
| `repayAmount` | `uint256` | Amount of principal to repay (proportional collateral will be seized). |

#### addCollateral

Adds additional collateral to an active loan.

Caller does not have to be the original borrower. Emits a LogCollateralAdded event.

```solidity
function addCollateral(uint256 loanId, uint256 amount)
    external
    nonReentrant
    onlyWhenAddCollateralNotPaused(loans[loanId].marketId);
```

**Parameters**

| Name     | Type      | Description                                                     |
| -------- | --------- | --------------------------------------------------------------- |
| `loanId` | `uint256` | The ID of the loan to which collateral will be added.           |
| `amount` | `uint256` | The amount of collateral tokens to add. Must be greater than 0. |

#### withdrawCollateral

Withdraws a portion of collateral from an active loan if it remains healthy.

Caller must be the original borrower. Collateral can only be withdrawn if the loan remains healthy after withdrawal. Emits a LogCollateralWithdrawn event.

```solidity
function withdrawCollateral(uint256 loanId, uint256 amount)
    external
    nonReentrant
    onlyWhenWithdrawCollateralNotPaused(loans[loanId].marketId);
```

**Parameters**

| Name     | Type      | Description                                                          |
| -------- | --------- | -------------------------------------------------------------------- |
| `loanId` | `uint256` | The ID of the loan from which to withdraw collateral.                |
| `amount` | `uint256` | The amount of collateral tokens to withdraw. Must be greater than 0. |

#### flashLoan

Executes a flash loan, allowing the borrower to borrow tokens temporarily.

```solidity
function flashLoan(address token, uint256 amount, bytes calldata data) external;
```

#### isHealthy

Checks if a loan is in a healthy state based on LTV and expiration.

```solidity
function isHealthy(uint256 loanId) public view returns (bool);
```

**Parameters**

| Name     | Type      | Description         |
| -------- | --------- | ------------------- |
| `loanId` | `uint256` | The ID of the loan. |

**Returns**

| Name     | Type   | Description                                                 |
| -------- | ------ | ----------------------------------------------------------- |
| `<none>` | `bool` | True if the loan is healthy, false if it can be liquidated. |

#### canMatchLoanIntents

Determines whether two intents are compatible and matchable.

```solidity
function canMatchLoanIntents(LendIntent calldata lender, BorrowIntent calldata borrower, bytes32 marketId)
    external
    view
    returns (bool canMatch);
```

**Parameters**

| Name       | Type           | Description      |
| ---------- | -------------- | ---------------- |
| `lender`   | `LendIntent`   | Lender intent.   |
| `borrower` | `BorrowIntent` | Borrower intent. |
| `marketId` | `bytes32`      | Market context.  |

**Returns**

| Name       | Type   | Description                                          |
| ---------- | ------ | ---------------------------------------------------- |
| `canMatch` | `bool` | True if the intents can be matched, false otherwise. |

#### validateIntents

Validates lender and borrower intents, ensuring signatures, expiry, and compatibility.

Checks for intent expiration, verifies off-chain signatures or on-chain postings, and ensures intent hashes are unused.

```solidity
function validateIntents(
    LendIntent calldata lender,
    bytes calldata lenderSig,
    BorrowIntent calldata borrower,
    bytes calldata borrowerSig,
    bytes32 marketId,
    bool isLenderOnChain,
    bool isBorrowerOnChain
)
    external
    view
    onlyNonZeroAddress(lender.lender)
    onlyNonZeroAddress(borrower.borrower)
    returns (bytes32 lendIntentHash, bytes32 borrowIntentHash);
```

**Parameters**

| Name                | Type           | Description                                     |
| ------------------- | -------------- | ----------------------------------------------- |
| `lender`            | `LendIntent`   | The lender's intent struct.                     |
| `lenderSig`         | `bytes`        | The signature of the lender's intent.           |
| `borrower`          | `BorrowIntent` | The borrower's intent struct.                   |
| `borrowerSig`       | `bytes`        | The signature of the borrower's intent.         |
| `marketId`          | `bytes32`      | The market identifier for matching intents.     |
| `isLenderOnChain`   | `bool`         | True if the lender intent is posted on-chain.   |
| `isBorrowerOnChain` | `bool`         | True if the borrower intent is posted on-chain. |

**Returns**

| Name               | Type      | Description                    |
| ------------------ | --------- | ------------------------------ |
| `lendIntentHash`   | `bytes32` | Hash of the lender's intent.   |
| `borrowIntentHash` | `bytes32` | Hash of the borrower's intent. |

#### hashLenderIntent

Public function to hash a lender intent using the contract's EIP-712 implementation.

Exposes the internal IntentLib.hashLender function for off-chain use.

```solidity
function hashLenderIntent(LendIntent calldata lenderIntent) external view returns (bytes32);
```

**Parameters**

| Name           | Type         | Description                       |
| -------------- | ------------ | --------------------------------- |
| `lenderIntent` | `LendIntent` | The lender intent struct to hash. |

**Returns**

| Name     | Type      | Description                                      |
| -------- | --------- | ------------------------------------------------ |
| `<none>` | `bytes32` | The EIP-712 compliant hash of the lender intent. |

#### hashBorrowerIntent

Public function to hash a borrower intent using the contract's EIP-712 implementation.

Exposes the internal IntentLib.hashBorrower function for off-chain use.

```solidity
function hashBorrowerIntent(BorrowIntent calldata borrowerIntent) external view returns (bytes32);
```

**Parameters**

| Name             | Type           | Description                         |
| ---------------- | -------------- | ----------------------------------- |
| `borrowerIntent` | `BorrowIntent` | The borrower intent struct to hash. |

**Returns**

| Name     | Type      | Description                                        |
| -------- | --------- | -------------------------------------------------- |
| `<none>` | `bytes32` | The EIP-712 compliant hash of the borrower intent. |

### Events

#### LogFlashLoan

Events emitted via functionDelegateCall

```solidity
event LogFlashLoan(address indexed receiver, address indexed token, uint256 amount, uint256 fee);
```

#### LogCollateralAdded

```solidity
event LogCollateralAdded(uint256 indexed loanId, uint256 collateralAmount);
```

#### LogCollateralWithdrawn

```solidity
event LogCollateralWithdrawn(uint256 indexed loanId, uint256 collateralAmount);
```

#### LogIntentsMatched

```solidity
event LogIntentsMatched(
    address indexed lender, address indexed borrower, address indexed matcher, bytes32 marketId, uint256 loanId
);
```

#### LogLoanRepayment

```solidity
event LogLoanRepayment(uint256 indexed loanId, uint256 principalPaid, uint256 principalOutstanding);
```

#### LogLoanLiquidated

```solidity
event LogLoanLiquidated(
    uint256 indexed loanId,
    uint256 principalPaid,
    uint256 principalOutstanding,
    uint256 collateralToSeize,
    uint256 collateralRemaining
);
```

#### LogLenderOfferPosted

```solidity
event LogLenderOfferPosted(address indexed lender, bytes32 indexed marketId, bytes32 offerHash);
```

#### LogBorrowerOfferPosted

```solidity
event LogBorrowerOfferPosted(address indexed borrower, bytes32 indexed marketId, bytes32 offerHash);
```

#### LogIntentRevoked

```solidity
event LogIntentRevoked(address indexed user, bytes32 indexed marketId, bytes32 indexed offerHash, string role);
```
