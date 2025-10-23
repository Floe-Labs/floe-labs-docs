# IConditionValidator

## IConditionValidator

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/IConditionValidator.sol)

### Functions

#### validateCondition

Validates a condition for a given intent.

```solidity
function validateCondition(bytes calldata data) external view returns (bool);
```

**Returns**

| Name     | Type   | Description                                            |
| -------- | ------ | ------------------------------------------------------ |
| `<none>` | `bool` | success True if the condition is met, false otherwise. |
