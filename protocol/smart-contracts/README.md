# Smart Contracts

Technical reference for Floe's smart contract architecture.

## Contract Overview

Floe uses a modular, upgradeable architecture built on Foundry/Solidity 0.8.30.

### Core Contracts

| Contract | Description |
|----------|-------------|
| [LendingIntentMatcher](lending-intent-matcher.md) | Main entry point for all protocol operations |
| [LendingLogicsManager](lending-logics-manager.md) | Delegated logic for complex operations |
| [Getters](getters.md) | View functions for reading state |
| [Setters](setters.md) | Governor-only configuration functions |
| [Storage](storage.md) | State variable layout |
| [HookExecutor](hookexecutor.md) | Sandboxed hook execution |

### Data Types

| Type | Description |
|------|-------------|
| [LendIntent](custom-data-types/lendintent.md) | Lender's offer structure |
| [BorrowIntent](custom-data-types/borrowintent.md) | Borrower's request structure |
| [Loan](custom-data-types/loan.md) | Active loan state |
| [Market](custom-data-types/market.md) | Market configuration |
| [Hook](custom-data-types/hook.md) | Hook attachment data |
| [Condition](custom-data-types/condition.md) | Oracle conditions |
| [PauseStatuses](custom-data-types/pausestatuses.md) | Pause state flags |

### Interfaces

| Interface | Description |
|-----------|-------------|
| [ILendingIntentMatcher](interfaces/ilendingintentmatcher.md) | Main contract interface |
| [IGetters](interfaces/igetters.md) | View function interface |
| [ISetters](interfaces/isetters.md) | Configuration interface |
| [IStorage](interfaces/istorage.md) | Storage interface |
| [IPriceOracle](interfaces/ipriceoracle.md) | Oracle interface |
| [IHookExecutor](interfaces/ihookexecutor.md) | Hook execution interface |
| [IFlashloanReceiver](interfaces/iflashloanreceiver.md) | Flash loan callback |
| [IConditionValidator](interfaces/iconditionvalidator.md) | Condition validation |

## Deployment Addresses

### Base Mainnet (Chain ID: 8453)

```
LendingIntentMatcher: 0x17946cD3e180f82e632805e5549EC913330Bb175
USDC:                 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
WETH:                 0x4200000000000000000000000000000000000006
```

## Source Code

All contracts are open source: [GitHub Repository](https://github.com/Floe-Labs/modular-lending)

