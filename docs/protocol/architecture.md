---
icon: sitemap
---

# Architecture

A deep dive into Floe's technical architecture and design decisions.

> This is the **on-chain protocol layer** beneath Floe's walletless spend product. You don't need it to fund an agent and pay for x402 APIs — see the [Quickstart](../getting-started/quickstart.md). The on-chain working-capital credit path is **in development**.

## Overview

Underneath the spend product, Floe runs an **intent-based peer-to-peer lending protocol** on Base. Rather than using liquidity pools, it matches individual lender and borrower intents directly.

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



## Loan Terms

### Minimum Loan Duration

The protocol enforces `minDuration > 0`. Typical loans range from 7 days to 12 months. Users and agents set their own min/max duration range on each intent.

The protocol admin sets a configurable maximum duration (default **365 days**, hard ceiling 100 years).

### Grace Period

Lenders set a `gracePeriod` on their intent — the number of seconds after loan duration expires before overdue liquidation can trigger.

* Protocol enforces bounds: **minimum 1 day**, **maximum 30 days** (configurable by admin)
* If the lender sets 0, the protocol default minimum (1 day) applies
* A loan becomes overdue (and liquidatable) only after `duration + gracePeriod` has fully elapsed

### Minimum Interest (Early Repayment)

Lenders can set `minInterestBps` — a minimum interest charge expressed as a percentage of full-term interest:

* **0** = no minimum; borrower can repay anytime and only pays accrued interest
* **10,000 (100%)** = borrower owes full-term interest even if repaying on day 1
* **Example:** 5,000 bps (50%) on a 30-day loan at 12% APR means the borrower always pays at least 50% of the 30-day interest, regardless of when they repay

This is only enforced on **early repayment** (before maturity). It does **not** apply to liquidations.

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


## Next Steps

* [Intent Matching](orderbook-matching.md)
* [Oracles & Circuit Breaker](oracles-conditions.md)
* [Security](security.md)
