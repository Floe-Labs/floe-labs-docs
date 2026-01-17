# Hooks (Programmable Loans)

Extend loan behavior with custom logic through the Hooks system.

## Overview

Hooks are optional modules attached to intents that execute at key lifecycle points. They enable:
- Custom collateral management
- Alternative liquidation logic
- Access control and whitelisting
- Dynamic rate adjustments

## Hook Categories

### 1. Collateral Management
- Auto-rebalancing collateral
- Yield-bearing collateral (stETH, etc.)
- Multi-collateral positions

### 2. Liquidation Hooks
- Gradual liquidation
- Dutch auction liquidations
- MEV-protected liquidation

### 3. Credit/Access Hooks
- Whitelist-only lending
- KYC/AML compliance
- Credit scoring integration

### 4. Rate Hooks
- Dynamic interest rates
- Utilization-based rates
- Time-decay rates

## Hook Interface

```solidity
interface ILoanHook {
    /// @notice Called when a loan is created
    function onCreate(
        uint256 loanId,
        bytes calldata data
    ) external;

    /// @notice Called when collateral is added
    function onTopUp(
        uint256 loanId,
        uint256 additionalCollateral
    ) external;

    /// @notice Called before liquidation
    /// @return action Custom liquidation behavior
    function onBeforeLiquidate(
        uint256 loanId
    ) external returns (bytes memory action);

    /// @notice Called after repayment
    function onAfterRepay(
        uint256 loanId,
        uint256 repaidAmount
    ) external;

    /// @notice Called when collateral is withdrawn
    function onWithdraw(
        uint256 loanId,
        uint256 withdrawAmount
    ) external;
}
```

## Hook Structure

```solidity
struct Hook {
    address hookAddress;  // Contract implementing ILoanHook
    bytes data;          // Initialization data
}
```

## Attaching Hooks

Hooks are specified in intents:

```typescript
const borrowIntent = {
    // ... other fields
    hooks: [
        {
            hookAddress: '0xWhitelistHook...',
            data: ethers.utils.defaultAbiCoder.encode(
                ['address[]'],
                [[allowedLender1, allowedLender2]]
            )
        }
    ]
};
```

## Hook Execution

Hooks run in a sandboxed environment via `HookExecutor`:

```solidity
contract HookExecutor {
    function executeHook(
        address hook,
        bytes calldata callData,
        uint256 gasLimit
    ) external returns (bool success, bytes memory result);
}
```

### Gas Limits

Hooks have enforced gas limits to prevent DoS:
- `onCreate`: 100,000 gas
- `onTopUp`: 50,000 gas
- `onBeforeLiquidate`: 100,000 gas
- `onAfterRepay`: 50,000 gas

### Failure Handling

If a hook reverts:
- The transaction continues (hooks are non-blocking)
- An event is emitted for monitoring
- The loan state remains consistent

## Example Hooks

### Whitelist Hook

Only allow specific lenders:

```solidity
contract WhitelistHook is ILoanHook {
    mapping(uint256 => mapping(address => bool)) public allowed;

    function onCreate(uint256 loanId, bytes calldata data) external {
        address[] memory whitelist = abi.decode(data, (address[]));
        for (uint i = 0; i < whitelist.length; i++) {
            allowed[loanId][whitelist[i]] = true;
        }
    }

    // Lender must be whitelisted for match to succeed
}
```

### Auto-Repay Hook

Automatically repay from yield:

```solidity
contract AutoRepayHook is ILoanHook {
    function onAfterRepay(uint256 loanId, uint256 amount) external {
        // Check if collateral has generated yield
        // If so, use yield to pay down principal
    }
}
```

### Gradual Liquidation Hook

Liquidate in tranches:

```solidity
contract GradualLiquidationHook is ILoanHook {
    function onBeforeLiquidate(uint256 loanId)
        external returns (bytes memory)
    {
        // Return encoded action for 10% liquidation
        return abi.encode(LiquidationAction.PARTIAL, 1000); // 10%
    }
}
```

## Safety Model

### Current: Allowlisted Hooks

| Phase | Model |
|-------|-------|
| v1.0 | Allowlist only - audited hooks |
| v1.x | Governance-approved hooks |
| v2.0 | Permissionless with safeguards |

### Allowlist Requirements

To get a hook allowlisted:
1. Open source code
2. Foundry tests with invariants
3. Gas analysis
4. Security audit
5. Governance vote

### Future: Permissionless Hooks

Planned safeguards:
- Economic bonding
- Slashing for misbehavior
- Timelocks on new hooks
- Gas caps and sandboxing

## Hook Registry

```solidity
interface IHookRegistry {
    function isAllowlisted(address hook) external view returns (bool);
    function addHook(address hook) external; // onlyGovernance
    function removeHook(address hook) external; // onlyGovernance
}
```

## Developing Hooks

See the [Hooks Developer Guide](../developers/hooks-dev.md) for:
- Development environment setup
- Testing patterns
- Submission process
- Best practices

## Events

| Event | Description |
|-------|-------------|
| `HookExecuted` | Hook ran successfully |
| `HookFailed` | Hook reverted (loan continues) |
| `HookAdded` | New hook allowlisted |
| `HookRemoved` | Hook removed from allowlist |

## Limitations

1. **Gas Limits**: Hooks must complete within gas caps
2. **No State Reads**: Cannot read loan state during execution (use events)
3. **No External Calls**: Cannot call arbitrary contracts (sandboxed)
4. **No Reentrancy**: Hooks cannot call back into the main contract
