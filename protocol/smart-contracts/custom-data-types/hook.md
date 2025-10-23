# Hook

## Hook

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/ILendingIntentMatcher.sol)

A user-specified hook to be executed before or after an intent.

```solidity
struct Hook {
address target;
bytes callData;
uint256 gasLimit;
uint256 expiry;
bool allowFailure;
bool applyToAllPartialFills;
}
```

**Properties**

| Name                     | Type      | Description                                                            |
| ------------------------ | --------- | ---------------------------------------------------------------------- |
| `target`                 | `address` | The address of the contract to call for the hook.                      |
| `callData`               | `bytes`   | The calldata to be sent to the target contract for the hook execution. |
| `gasLimit`               | `uint256` | The maximum gas allowed for the hook execution.                        |
| `expiry`                 | `uint256` | The timestamp after which the hook is no longer valid.                 |
| `allowFailure`           | `bool`    | Whether to allow the transaction to continue if the hook fails.        |
| `applyToAllPartialFills` | `bool`    |                                                                        |
