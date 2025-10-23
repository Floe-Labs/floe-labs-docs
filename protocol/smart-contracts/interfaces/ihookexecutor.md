# IHookExecutor

## IHookExecutor

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/IHookExecutor.sol)

Interface for executing an array of hooks.

### Functions

#### execute

Executes the provided hooks.

```solidity
function execute(Hook[] calldata hooks) external;
```

**Parameters**

| Name    | Type     | Description                           |
| ------- | -------- | ------------------------------------- |
| `hooks` | `Hook[]` | The array of Hook structs to execute. |

#### setGasForCallExactCheck

Sets the gas limit for exact call checks.

```solidity
function setGasForCallExactCheck(uint32 gasForCallExactCheck_) external;
```

**Parameters**

| Name                    | Type     | Description              |
| ----------------------- | -------- | ------------------------ |
| `gasForCallExactCheck_` | `uint32` | The new gas limit value. |

#### gasForCallExactCheck

Returns the current gas limit for exact call checks.

```solidity
function gasForCallExactCheck() external view returns (uint32);
```

**Returns**

| Name     | Type     | Description          |
| -------- | -------- | -------------------- |
| `<none>` | `uint32` | The gas limit value. |
