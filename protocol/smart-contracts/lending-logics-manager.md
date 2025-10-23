# Lending Logics Manager

## LendingLogicsManager

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/LendingLogicsManager.sol)

**Inherits:** ILendingLogicsManager, LendingLogicsInternal

Contract containing the core logic functions that are delegated to by the LendingIntentMatcher.

This contract separates heavy logic functions to reduce the main contract size, similar to Morpho's PositionsManager pattern.

Since this contract is used via delegatecall, it operates on the caller's storage.

### Functions

#### constructor

Constructor provides a dummy governor since this contract is only used via delegatecall

The actual governor state will be in the calling contract (LendingIntentMatcher)

```solidity
constructor() Storage(address(1));
```

#### matchLoanIntentsLogic

Implements the match loan intents logic.

```solidity
function matchLoanIntentsLogic(MatchLoanParams calldata params) external returns (uint256 loanId);
```

#### repayLoanLogic

Implements the repay loan logic.

```solidity
function repayLoanLogic(uint256 loanId, uint256 repayAmount) external;
```

#### liquidateLoanLogic

Implements the liquidate loan logic.

```solidity
function liquidateLoanLogic(uint256 loanId, uint256 repayAmount) external;
```

#### addCollateralLogic

Implements the add collateral logic.

```solidity
function addCollateralLogic(uint256 loanId, uint256 amount) external;
```

#### withdrawCollateralLogic

Implements the withdraw collateral logic.

```solidity
function withdrawCollateralLogic(uint256 loanId, uint256 amount) external;
```

#### registerLendIntentLogic

Implements the register lend intent logic.

```solidity
function registerLendIntentLogic(
    LendIntent calldata intent,
    bytes32 domainSeparator,
    bytes32 lenderIntentTypehash,
    bytes32 conditionTypehash,
    bytes32 hookTypehash
) external;
```

#### revokeLendIntentByHashLogic

Implements the revoke lend intent logic.

```solidity
function revokeLendIntentByHashLogic(bytes32 intentHash) external;
```

#### registerBorrowIntentLogic

Implements the register borrow intent logic.

```solidity
function registerBorrowIntentLogic(
    BorrowIntent calldata intent,
    bytes32 domainSeparator,
    bytes32 borrowerIntentTypehash,
    bytes32 conditionTypehash,
    bytes32 hookTypehash
) external;
```

#### revokeBorrowIntentByHashLogic

Implements the revoke borrow intent logic.

```solidity
function revokeBorrowIntentByHashLogic(bytes32 intentHash) external;
```

#### flashLoanLogic

Implements the flash loan logic.

```solidity
function flashLoanLogic(address token, uint256 amount, bytes calldata data) external;
```
