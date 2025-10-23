# Loan

## Loan

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/ILendingIntentMatcher.sol)

A unique loan position.

```solidity
struct Loan {
bytes32 marketId;
uint256 loanId;
address lender;
address borrower;
address loanToken;
address collateralToken;
uint256 principal;
uint256 interestRateBps;
uint256 ltvBps; // loan-to-value ratio in basis points
uint256 liquidationLtvBps; // liquidation threshold LTV in basis points
uint256 marketFeeBps;
uint256 matcherCommissionBps;
uint256 startTime;
uint256 duration;
uint256 collateralAmount;
bool repaid;
}
```

**Properties**

| Name                   | Type      | Description                                                 |
| ---------------------- | --------- | ----------------------------------------------------------- |
| `marketId`             | `bytes32` | The identifier of the market in which the loan was created. |
| `loanId`               | `uint256` | The unique identifier for this loan.                        |
| `lender`               | `address` | The address of the lender.                                  |
| `borrower`             | `address` | The address of the borrower.                                |
| `loanToken`            | `address` | The address of the token lent.                              |
| `collateralToken`      | `address` | The address of the token used as collateral.                |
| `principal`            | `uint256` | The principal amount of the loan (in loanToken).            |
| `interestRateBps`      | `uint256` | The interest rate for the loan in basis points.             |
| `ltvBps`               | `uint256` | The loan-to-value ratio in basis points at origination.     |
| `liquidationLtvBps`    | `uint256` | The liquidation threshold LTV in basis points.              |
| `marketFeeBps`         | `uint256` | The market fee in basis points.                             |
| `matcherCommissionBps` | `uint256` | The matcher commission in basis points.                     |
| `startTime`            | `uint256` | The timestamp when the loan was originated.                 |
| `duration`             | `uint256` | The duration of the loan in seconds.                        |
| `collateralAmount`     | `uint256` | The amount of collateral locked for the loan.               |
| `repaid`               | `bool`    | Whether the loan has been fully repaid.                     |
