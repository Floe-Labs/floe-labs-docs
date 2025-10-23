# LendIntent

## LendIntent

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/ILendingIntentMatcher.sol)

A user-specified intent to lend funds in a market.

```solidity
struct LendIntent {
address lender;
address onBehalfOf;
uint256 amount;
uint256 minFillAmount;
uint256 filledAmount;
uint256 minInterestRateBps;
uint256 maxLtvBps;
uint256 duration;
bool allowPartialFill;
uint256 validFromTimestamp;
uint256 expiry;
bytes32 marketId;
bytes32 salt;
Condition[] conditions;
Hook[] preHooks;
Hook[] postHooks;
}
```

**Properties**

| Name                 | Type          | Description                                                                                            |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `lender`             | `address`     | The address of the lender.                                                                             |
| `onBehalfOf`         | `address`     | The address on whose behalf the lending is performed and will receive the repaid funds + interest.     |
| `amount`             | `uint256`     | The total amount the lender is willing to lend.                                                        |
| `minFillAmount`      | `uint256`     | The minimum amount that must be filled by a borrower for this intent to be valid.                      |
| `filledAmount`       | `uint256`     | The amount already filled by borrowers (for partial fills).                                            |
| `minInterestRateBps` | `uint256`     | The minimum acceptable interest rate (in basis points).                                                |
| `maxLtvBps`          | `uint256`     | The maximum acceptable loan-to-value ratio for liquidation (LLTV - Liquidation LTV) (in basis points). |
| `duration`           | `uint256`     | The duration of the loan in seconds.                                                                   |
| `allowPartialFill`   | `bool`        | Whether the intent can be partially filled by multiple borrowers.                                      |
| `validFromTimestamp` | `uint256`     | The timestamp from which the intent becomes valid.                                                     |
| `expiry`             | `uint256`     | The timestamp after which the intent is no longer valid.                                               |
| `marketId`           | `bytes32`     | The identifier of the market this intent applies to.                                                   |
| `salt`               | `bytes32`     | A unique value to ensure intent uniqueness and prevent replay.                                         |
| `conditions`         | `Condition[]` | Array of conditions that must be met for the intent to be executed.                                    |
| `preHooks`           | `Hook[]`      | Array of hooks to be executed before the intent is matched.                                            |
| `postHooks`          | `Hook[]`      | Array of hooks to be executed after the intent is matched.                                             |
