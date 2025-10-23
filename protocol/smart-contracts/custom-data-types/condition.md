# Condition

## Condition

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/ILendingIntentMatcher.sol)

A condition that must be met for an intent to be executed.

```solidity
struct Condition {
address target;
bytes callData;
bool applyToAllPartialFills;
}
```

**Properties**

| Name                     | Type      | Description                                                             |
| ------------------------ | --------- | ----------------------------------------------------------------------- |
| `target`                 | `address` | The address of the contract to call for the condition check.            |
| `callData`               | `bytes`   | The calldata to be sent to the target contract for the condition check. |
| `applyToAllPartialFills` | `bool`    |                                                                         |
