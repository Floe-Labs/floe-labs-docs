# Market

## Market

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/ILendingIntentMatcher.sol)

A unique market.

```solidity
struct Market {
bytes32 marketId;
address loanToken;
address collateralToken;
uint256 interestRateBps;
uint256 ltvBps;
uint256 liquidationIncentiveBps;
uint256 marketFeeBps;
uint256 totalPrincipalOutstanding;
uint256 totalLoans;
uint256 totalValueLocked;
uint128 lastUpdateAt;
PauseStatuses pauseStatuses;
}
```

**Properties**

| Name                        | Type            | Description                                                     |
| --------------------------- | --------------- | --------------------------------------------------------------- |
| `marketId`                  | `bytes32`       | The unique identifier for the market.                           |
| `loanToken`                 | `address`       | The address of the token to be lent.                            |
| `collateralToken`           | `address`       | The address of the token used as collateral.                    |
| `interestRateBps`           | `uint256`       | Minimum interest rate in basis points.                          |
| `ltvBps`                    | `uint256`       | Minimum loan-to-value ratio in basis points.                    |
| `liquidationIncentiveBps`   | `uint256`       | Liquidation incentive in basis points (e.g., 10500 = 5% bonus). |
| `marketFeeBps`              | `uint256`       | Market fee in basis points.                                     |
| `totalPrincipalOutstanding` | `uint256`       | Total principal of active loans (in loanToken).                 |
| `totalLoans`                | `uint256`       | Total number of loans created in this market.                   |
| `totalValueLocked`          | `uint256`       | Total value of collateral locked, priced in loanToken units.    |
| `lastUpdateAt`              | `uint128`       | Timestamp of the last update to the market.                     |
| `pauseStatuses`             | `PauseStatuses` | Pause statuses for various market actions.                      |
