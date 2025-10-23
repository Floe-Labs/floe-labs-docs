# HookExecutor

## HookExecutor

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/hook-executor/HookExecutor.sol)

**Inherits:** IHookExecutor

A contract for executing user-specified hooks. It ensures that user-specified calls are not executed from a privileged context, and that reverts do not prevent lender and borrower matching from executing.

### State Variables

#### lendingIntentMatcher

The address of the LendingIntentMatcher contract.

```solidity
address public immutable lendingIntentMatcher
```

#### gasForCallExactCheck

Gas amount reserved for the exact EXTCODESIZE call and additional overhead required by the `CallWithExactGas` library to safely execute calls.

This value should be carefully calibrated based on EVM gas costs to prevent unexpected failures when making external calls with precise gas. It can be updated by the LendingIntentMatcher contract if needed.

```solidity
uint32 public gasForCallExactCheck = 5_000
```

### Functions

#### constructor

```solidity
constructor(address lendingIntentMatcher_) ;
```

**Parameters**

| Name                    | Type      | Description                                       |
| ----------------------- | --------- | ------------------------------------------------- |
| `lendingIntentMatcher_` | `address` | The address of the LendingIntentMatcher contract. |

#### onlyLendingIntentMatcher

Modifier that ensures that the `msg.sender` is the LendingIntentMatcher contract.

```solidity
modifier onlyLendingIntentMatcher() ;
```

#### execute

Executes the user specified hooks. Called only by the LendingIntentMatcher contract. Each hook is executed with the specified gas limit, and failure does not revert the entire transaction. Each hook is only executed before the specified expiry timestamp.

```solidity
function execute(Hook[] calldata hooks) external onlyLendingIntentMatcher;
```

**Parameters**

| Name    | Type     | Description           |
| ------- | -------- | --------------------- |
| `hooks` | `Hook[]` | The hooks to execute. |

#### setGasForCallExactCheck

Updates the gas reserved for the exact EXTCODESIZE call and related checks used internally when executing hooks.

Only callable by the LendingIntentMatcher contract.

```solidity
function setGasForCallExactCheck(uint32 gasForCallExactCheck_) external onlyLendingIntentMatcher;
```

**Parameters**

| Name                    | Type     | Description                                                                                                                                                                           |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gasForCallExactCheck_` | `uint32` | The new gas amount to reserve for the exact call check. Should be calibrated according to current gas costs of the EXTCODESIZE opcode and overhead from the CallWithExactGas library. |

### Events

#### HookExecuted

Emitted after each hook is executed.

```solidity
event HookExecuted(address indexed target, bool success);
```

#### HookExecutionFailed

Emitted when execution of a hook fails and failure is not allowed.

```solidity
event HookExecutionFailed(address indexed target, bool success);
```

#### GasForCallExactCheckSet

Emitted when the gasForCallExactCheck is set / updated.

```solidity
event GasForCallExactCheckSet(uint32 gasForCallExactCheck);
```

### Errors

#### NotLendingIntentMatcher

Error indicating that the contract was not called from the LendingIntentMatcher contract.

```solidity
error NotLendingIntentMatcher();
```

#### HookExecutionFailedError

```solidity
error HookExecutionFailedError(address target);
```
