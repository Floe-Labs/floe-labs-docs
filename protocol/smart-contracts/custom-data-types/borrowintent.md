# BorrowIntent

## BorrowIntent

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/ILendingIntentMatcher.sol)

A user-specified intent to borrow funds in a market.

```solidity
struct BorrowIntent {
address borrower;
address onBehalfOf;
uint256 borrowAmount;
uint256 collateralAmount;
uint256 minFillAmount;
uint256 maxInterestRateBps;
uint256 minLtvBps;
uint256 duration;
bool allowPartialFill;
uint256 validFromTimestamp;
uint256 matcherCommissionBps;
uint256 expiry;
bytes32 marketId;
bytes32 salt;
Condition[] conditions;
Hook[] preHooks;
Hook[] postHooks;
}
```

**Properties**

| Name                   | Type          | Description                                                                     |
| ---------------------- | ------------- | ------------------------------------------------------------------------------- |
| `borrower`             | `address`     | The address of the borrower.                                                    |
| `onBehalfOf`           | `address`     | The address on whose behalf the borrowing is performed.                         |
| `borrowAmount`         | `uint256`     | The amount the borrower wishes to borrow.                                       |
| `collateralAmount`     | `uint256`     | The amount of collateral to be locked for the loan.                             |
| `minFillAmount`        | `uint256`     | The minimum amount that must be filled by a lender for this intent to be valid. |
| `maxInterestRateBps`   | `uint256`     | The maximum acceptable interest rate (in basis points).                         |
| `minLtvBps`            | `uint256`     | The minimum loan-to-value ratio for the actual loan (LTV) (in basis points).    |
| `duration`             | `uint256`     | The duration of the loan in seconds.                                            |
| `allowPartialFill`     | `bool`        | Whether the intent can be partially filled by multiple lenders.                 |
| `validFromTimestamp`   | `uint256`     | The timestamp from which the intent becomes valid.                              |
| `matcherCommissionBps` | `uint256`     | The commission (in basis points) paid to the matcher for matching this intent.  |
| `expiry`               | `uint256`     | The timestamp after which the intent is no longer valid.                        |
| `marketId`             | `bytes32`     | The identifier of the market this intent applies to.                            |
| `salt`                 | `bytes32`     | A unique value to ensure intent uniqueness and prevent replay.                  |
| `conditions`           | `Condition[]` | Array of conditions that must be met for the intent to be executed.             |
| `preHooks`             | `Hook[]`      | Array of hooks to be executed before the intent is matched.                     |
| `postHooks`            | `Hook[]`      | Array of hooks to be executed after the intent is matched.                      |
