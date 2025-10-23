# ILendingIntentMatcher

## ILendingIntentMatcher

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/ILendingIntentMatcher.sol)

Interface for the LendingIntentMatcher contract.

### Functions

#### createMarket

```solidity
function createMarket(
    address loanToken,
    address collateralToken,
    uint256 interestRateBps,
    uint256 ltvBps,
    uint256 marketFeeBps,
    uint256 liquidationIncentiveBps
) external returns (bytes32 marketId);
```

#### matchLoanIntents

```solidity
function matchLoanIntents(
    LendIntent calldata lender,
    bytes calldata lenderSig,
    BorrowIntent calldata borrower,
    bytes calldata borrowerSig,
    bytes32 marketId,
    bool isLenderOnChain,
    bool isBorrowerOnChain
) external returns (uint256 loanId);
```

#### registerLendIntent

```solidity
function registerLendIntent(LendIntent calldata intent) external;
```

#### revokeLendIntentByHash

```solidity
function revokeLendIntentByHash(bytes32 intentHash) external;
```

#### registerBorrowIntent

```solidity
function registerBorrowIntent(BorrowIntent calldata intent) external;
```

#### revokeBorrowIntentByHash

```solidity
function revokeBorrowIntentByHash(bytes32 intentHash) external;
```

#### repayLoan

```solidity
function repayLoan(uint256 loanId, uint256 repayAmount) external;
```

#### liquidateLoan

```solidity
function liquidateLoan(uint256 loanId, uint256 repayAmount) external;
```

#### addCollateral

```solidity
function addCollateral(uint256 loanId, uint256 amount) external;
```

#### withdrawCollateral

```solidity
function withdrawCollateral(uint256 loanId, uint256 amount) external;
```

#### flashLoan

```solidity
function flashLoan(address token, uint256 amount, bytes calldata data) external;
```

#### isHealthy

```solidity
function isHealthy(uint256 loanId) external view returns (bool);
```

#### canMatchLoanIntents

```solidity
function canMatchLoanIntents(LendIntent calldata lender, BorrowIntent calldata borrower, bytes32 marketId)
    external
    view
    returns (bool canMatch);
```

#### validateIntents

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

#### hashLenderIntent

```solidity
function hashLenderIntent(LendIntent calldata lenderIntent) external view returns (bytes32);
```

#### hashBorrowerIntent

```solidity
function hashBorrowerIntent(BorrowIntent calldata borrowerIntent) external view returns (bytes32);
```
