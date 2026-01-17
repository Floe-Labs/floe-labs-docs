# Hooks Developer Guide

Build custom loan logic with Floe's programmable hooks system.

## Overview

Hooks allow you to extend loan behavior at key lifecycle points. This guide covers:
- Setting up your development environment
- Implementing the hook interface
- Testing and gas optimization
- Submitting for allowlist review

## Prerequisites

- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash`)
- Familiarity with Solidity 0.8+
- Understanding of Floe's [loan lifecycle](../protocol/settlement.md)

## Project Setup

```bash
# Clone the hooks template
git clone https://github.com/Floe-Labs/hook-template
cd hook-template

# Install dependencies
forge install

# Build
forge build
```

## Hook Interface

Implement `ILoanHook` to create a hook:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILoanHook {
    /// @notice Called when a loan is created
    /// @param loanId The unique loan identifier
    /// @param data Initialization data from intent
    function onCreate(uint256 loanId, bytes calldata data) external;

    /// @notice Called when collateral is added
    /// @param loanId The loan identifier
    /// @param additionalCollateral Amount added
    function onTopUp(uint256 loanId, uint256 additionalCollateral) external;

    /// @notice Called before liquidation
    /// @param loanId The loan identifier
    /// @return action Custom liquidation behavior
    function onBeforeLiquidate(uint256 loanId)
        external returns (bytes memory action);

    /// @notice Called after repayment
    /// @param loanId The loan identifier
    /// @param repaidAmount Amount repaid
    function onAfterRepay(uint256 loanId, uint256 repaidAmount) external;

    /// @notice Called when collateral is withdrawn
    /// @param loanId The loan identifier
    /// @param withdrawAmount Amount withdrawn
    function onWithdraw(uint256 loanId, uint256 withdrawAmount) external;
}
```

## Example: Whitelist Hook

Only allow loans with whitelisted counterparties:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ILoanHook} from "./interfaces/ILoanHook.sol";

contract WhitelistHook is ILoanHook {
    // loanId => address => isAllowed
    mapping(uint256 => mapping(address => bool)) public whitelist;

    event WhitelistSet(uint256 indexed loanId, address[] addresses);

    function onCreate(uint256 loanId, bytes calldata data) external override {
        address[] memory allowed = abi.decode(data, (address[]));

        for (uint256 i = 0; i < allowed.length; i++) {
            whitelist[loanId][allowed[i]] = true;
        }

        emit WhitelistSet(loanId, allowed);
    }

    function isWhitelisted(uint256 loanId, address account)
        external view returns (bool)
    {
        return whitelist[loanId][account];
    }

    // Other functions can be no-ops if not needed
    function onTopUp(uint256, uint256) external override {}
    function onBeforeLiquidate(uint256) external override returns (bytes memory) {
        return "";
    }
    function onAfterRepay(uint256, uint256) external override {}
    function onWithdraw(uint256, uint256) external override {}
}
```

## Example: Auto-Notify Hook

Send notifications on loan events:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ILoanHook} from "./interfaces/ILoanHook.sol";

contract NotifyHook is ILoanHook {
    event LoanCreated(uint256 indexed loanId, bytes data);
    event CollateralAdded(uint256 indexed loanId, uint256 amount);
    event LiquidationAttempt(uint256 indexed loanId);
    event RepaymentMade(uint256 indexed loanId, uint256 amount);

    function onCreate(uint256 loanId, bytes calldata data) external override {
        emit LoanCreated(loanId, data);
    }

    function onTopUp(uint256 loanId, uint256 amount) external override {
        emit CollateralAdded(loanId, amount);
    }

    function onBeforeLiquidate(uint256 loanId)
        external override returns (bytes memory)
    {
        emit LiquidationAttempt(loanId);
        return "";
    }

    function onAfterRepay(uint256 loanId, uint256 amount) external override {
        emit RepaymentMade(loanId, amount);
    }

    function onWithdraw(uint256, uint256) external override {}
}
```

## Testing

### Unit Tests

```solidity
// test/WhitelistHook.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {WhitelistHook} from "../src/WhitelistHook.sol";

contract WhitelistHookTest is Test {
    WhitelistHook hook;

    function setUp() public {
        hook = new WhitelistHook();
    }

    function test_onCreate_setsWhitelist() public {
        address[] memory allowed = new address[](2);
        allowed[0] = address(0x1);
        allowed[1] = address(0x2);

        bytes memory data = abi.encode(allowed);
        hook.onCreate(1, data);

        assertTrue(hook.isWhitelisted(1, address(0x1)));
        assertTrue(hook.isWhitelisted(1, address(0x2)));
        assertFalse(hook.isWhitelisted(1, address(0x3)));
    }

    function test_onCreate_emitsEvent() public {
        address[] memory allowed = new address[](1);
        allowed[0] = address(0x1);

        bytes memory data = abi.encode(allowed);

        vm.expectEmit(true, false, false, true);
        emit WhitelistHook.WhitelistSet(1, allowed);

        hook.onCreate(1, data);
    }
}
```

### Invariant Tests

```solidity
// test/invariants/WhitelistHookInvariant.t.sol
contract WhitelistHookInvariant is Test {
    WhitelistHook hook;

    function setUp() public {
        hook = new WhitelistHook();
    }

    function invariant_whitelistIsImmutableAfterCreation() public {
        // Whitelist cannot be modified after onCreate
        // This invariant should hold for security
    }
}
```

### Gas Analysis

```bash
# Run gas report
forge test --gas-report

# Target gas limits:
# - onCreate: < 100,000 gas
# - onTopUp: < 50,000 gas
# - onBeforeLiquidate: < 100,000 gas
# - onAfterRepay: < 50,000 gas
# - onWithdraw: < 50,000 gas
```

## Security Checklist

Before submitting for review:

- [ ] No external calls to untrusted contracts
- [ ] No reentrancy vulnerabilities
- [ ] Gas usage within limits
- [ ] No unbounded loops
- [ ] State changes are minimal
- [ ] Events emitted for all significant actions
- [ ] Comprehensive test coverage (>90%)
- [ ] Fuzz tests for edge cases
- [ ] Invariant tests for security properties

## Submission Process

1. **Prepare Repository**
   - Open source on GitHub
   - Include README with hook description
   - Document all functions and events

2. **Testing Requirements**
   - Unit tests with >90% coverage
   - Fuzz tests for input validation
   - Invariant tests for security
   - Gas benchmarks

3. **Submit PR**
   - Fork `Floe-Labs/hook-registry`
   - Add hook to registry
   - Include audit report (if applicable)

4. **Review Process**
   - Technical review by Floe team
   - Security audit (for complex hooks)
   - Governance vote for allowlisting

## Best Practices

### Do

- Keep hooks simple and focused
- Use events for off-chain indexing
- Document all behavior
- Handle edge cases gracefully
- Return empty bytes if no action needed

### Don't

- Make external calls
- Store excessive state
- Use unbounded loops
- Assume gas availability
- Modify loan state directly

## Gas Optimization Tips

```solidity
// Pack storage variables
struct HookState {
    uint128 value1;
    uint128 value2;  // Packed in same slot
}

// Use calldata for read-only arrays
function onCreate(uint256 loanId, bytes calldata data) external {
    // calldata is cheaper than memory
}

// Avoid redundant storage reads
function onAfterRepay(uint256 loanId, uint256 amount) external {
    // Cache storage in memory if reading multiple times
}
```

## Support

- [Discord #hooks-dev](https://discord.gg/floe)
- [GitHub Discussions](https://github.com/Floe-Labs/modular-lending/discussions)
- Email: dev@floelabs.xyz
