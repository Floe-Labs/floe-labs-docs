# PauseStatuses

## PauseStatuses

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/ILendingIntentMatcher.sol)

Pause statuses for various market actions.

```solidity
struct PauseStatuses {
bool isAddCollateralPaused;
bool isBorrowPaused;
bool isWithdrawCollateralPaused;
bool isRepayPaused;
bool isLiquidatePaused;
}
```

**Properties**

| Name                         | Type   | Description                               |
| ---------------------------- | ------ | ----------------------------------------- |
| `isAddCollateralPaused`      | `bool` | Whether adding collateral is paused.      |
| `isBorrowPaused`             | `bool` | Whether borrowing is paused.              |
| `isWithdrawCollateralPaused` | `bool` | Whether withdrawing collateral is paused. |
| `isRepayPaused`              | `bool` | Whether loan repayment is paused.         |
| `isLiquidatePaused`          | `bool` | Whether loan liquidation is paused.       |
