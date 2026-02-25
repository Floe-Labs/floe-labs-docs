---
icon: sitemap
---

# Architecture

A deep dive into Floe's technical architecture and design decisions.

## Overview

Floe is an **intent-based peer-to-peer lending protocol** built on Base. Rather than using liquidity pools, Floe matches individual lender and borrower intents directly.

## Design Philosophy

### Why Intent-Based?

Traditional DeFi lending uses **liquidity pools** (Aave, Compound):

* Lenders deposit into a pool
* Borrowers borrow from the pool
* Rates are algorithmic (utilization-based)

Floe uses **direct matching**:

* Lenders specify exact terms they want
* Borrowers specify exact terms they want
* Solvers match compatible intents
* No liquidity fragmentation

**Benefits**:

* Capital efficiency: No idle liquidity
* Custom terms: Any rate, duration, LTV
* Price discovery: Market-driven rates
* Transparency: Know your counterparty

### Why P2P?

In Floe, each loan is between exactly one lender and one borrower:

```
Traditional Pool:
[Lender1] ─┐
[Lender2] ─┼─► [Pool] ─► [Borrower1]
[Lender3] ─┘            [Borrower2]

Floe P2P:
[Lender1] ───────────► [Borrower1]
[Lender2] ───────────► [Borrower2]
```

**Benefits**:

* No bad debt socialization
* Discrete risk per position
* Full transparency on counterparty

## Smart Contract Architecture



### Why Delegatecall Pattern?

The main contract delegates complex logic to a separate contract:

```solidity
// In LendingIntentMatcher
function matchLoanIntents(...) external {
    _delegateToLogics(abi.encodeCall(
        LendingLogicsInternal.matchLoanIntents,
        (...)
    ));
}
```

**Benefits**:

* Contract size management (stay under 24KB limit)
* Logic can be upgraded independently
* Gas optimization for frequently called functions



## Intent Lifecycle

```
┌───────────────┐
│    Created    │ User submits intent on-chain
└───────┬───────┘
        │
        ▼
┌───────────────┐
│     Open      │ Intent active, awaiting match
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
┌──────┐  ┌──────┐
│Filled│  │Cancel│ User cancels OR expires
└──────┘  └──────┘
```

###

## Loan Lifecycle

```
┌───────────────┐
│    Created    │ Intents matched
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    Active     │ Loan running, interest accruing
└───────┬───────┘
        │
   ┌────┴────┬───────────┐
   │         │           │
   ▼         ▼           ▼
┌──────┐  ┌──────┐  ┌──────────┐
│Repaid│  │Overdue│ │Liquidated│
└──────┘  └───┬───┘ └──────────┘
              │
              ▼
         ┌──────────┐
         │Liquidated│
         └──────────┘
```

### Loan Operations

| Operation            | Description                          |
| -------------------- | ------------------------------------ |
| `repayLoan`          | Borrower repays principal + interest |
| `addCollateral`      | Borrower deposits more ETH           |
| `withdrawCollateral` | Borrower withdraws excess ETH        |
| `liquidateLoan`      | Anyone liquidates unhealthy loan     |



## Security Model

### Access Control

```solidity
// Only borrower can repay their loan
modifier onlyBorrower(uint256 loanId) {
    require(loans[loanId].borrower == msg.sender);
    _;
}

// Anyone can liquidate unhealthy loans
function liquidateLoan(uint256 loanId) external {
    require(isLiquidatable(loanId));
    ...
}
```





## Upgradeability

### UUPS Pattern

```solidity
contract LendingIntentMatcherUpgradeable is
    UUPSUpgradeable,
    OwnableUpgradeable
{
    function _authorizeUpgrade(address newImpl)
        internal
        override
        onlyOwner
    {}
}
```

**Why UUPS?**

* Smaller proxy contract (cheaper deployment)
* Upgrade logic in implementation
* Owner-controlled upgrades

### Upgrade Safety

* Storage layout preserved across upgrades
* New variables added at end of storage
* Existing functionality maintained

##

## Next Steps

* [Intent Matching](02-intent-matching.md)
* [Oracle System](03-oracle-system.md)
* [Fee Structure](04-fee-structure.md)
* [Security Model](05-security-model.md)
