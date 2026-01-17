# Protocol Architecture

A deep dive into Floe's technical architecture and design decisions.

## Overview

Floe is an **intent-based peer-to-peer lending protocol** built on Base. Rather than using liquidity pools, Floe matches individual lender and borrower intents directly.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLOE PROTOCOL ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         USER INTERFACES                              │   │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │   │
│  │   │   Web    │    │  Lendr   │    │    X     │    │   SDK    │     │   │
│  │   │   App    │    │   Bot    │    │ Twitter  │    │          │     │   │
│  │   └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘     │   │
│  └────────┼───────────────┼───────────────┼───────────────┼──────────┘   │
│           │               │               │               │               │
│           └───────────────┴───────────────┴───────────────┘               │
│                                   │                                        │
│  ┌────────────────────────────────▼────────────────────────────────────┐  │
│  │                       SMART CONTRACTS (Base)                         │  │
│  │                                                                      │  │
│  │   ┌─────────────────────────────────────────────────────────────┐   │  │
│  │   │              LendingIntentMatcher (UUPS Proxy)               │   │  │
│  │   │                                                              │   │  │
│  │   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │   │  │
│  │   │  │ Intent Registry │  │  Loan Manager   │  │  Collateral │  │   │  │
│  │   │  │                 │  │                 │  │   Manager   │  │   │  │
│  │   │  └─────────────────┘  └─────────────────┘  └─────────────┘  │   │  │
│  │   │                                                              │   │  │
│  │   │  ┌─────────────────────────────────────────────────────────┐│   │  │
│  │   │  │            LendingLogicsManager (delegatecall)          ││   │  │
│  │   │  │   ┌────────────────────────────────────────────────┐   ││   │  │
│  │   │  │   │           LendingLogicsInternal                │   ││   │  │
│  │   │  │   │  • Intent validation & matching                │   ││   │  │
│  │   │  │   │  • Loan creation & lifecycle                   │   ││   │  │
│  │   │  │   │  • Interest calculation                        │   ││   │  │
│  │   │  │   │  • Liquidation logic                           │   ││   │  │
│  │   │  │   └────────────────────────────────────────────────┘   ││   │  │
│  │   │  └─────────────────────────────────────────────────────────┘│   │  │
│  │   └──────────────────────────────────────────────────────────────┘   │  │
│  │                                │                                     │  │
│  │   ┌────────────────────────────▼────────────────────────────────┐   │  │
│  │   │                     PriceOracle                              │   │  │
│  │   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │   │  │
│  │   │   │  Chainlink  │───▶│    Pyth     │───▶│   Circuit   │     │   │  │
│  │   │   │  (Primary)  │    │ (Fallback)  │    │   Breaker   │     │   │  │
│  │   │   └─────────────┘    └─────────────┘    └─────────────┘     │   │  │
│  │   └──────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   │                                        │
│  ┌────────────────────────────────▼────────────────────────────────────┐  │
│  │                       OFF-CHAIN INFRASTRUCTURE                       │  │
│  │                                                                      │  │
│  │   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │  │
│  │   │  Envio Indexer  │    │   Solver Bot    │    │ Liquidation Bot │ │  │
│  │   │    (GraphQL)    │    │    (Matcher)    │    │   (Monitor)     │ │  │
│  │   └─────────────────┘    └─────────────────┘    └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Design Philosophy

### Why Intent-Based?

Traditional DeFi lending uses **liquidity pools** (Aave, Compound):
- Lenders deposit into a pool
- Borrowers borrow from the pool
- Rates are algorithmic (utilization-based)

Floe uses **direct matching**:
- Lenders specify exact terms they want
- Borrowers specify exact terms they want
- Solvers match compatible intents
- No liquidity fragmentation

**Benefits**:
- Capital efficiency: No idle liquidity
- Custom terms: Any rate, duration, LTV
- Price discovery: Market-driven rates
- Transparency: Know your counterparty

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
- No bad debt socialization
- Discrete risk per position
- Full transparency on counterparty

## Smart Contract Architecture

### Contract Hierarchy

```
LendingIntentMatcherUpgradeable (UUPS Proxy)
├── Intent Registry
│   ├── LendIntent mapping
│   └── BorrowIntent mapping
├── Loan Manager
│   └── Loan mapping
├── Collateral Manager
│   └── Token handling
└── LendingLogicsManager (delegatecall)
    └── LendingLogicsInternal
        ├── Intent validation
        ├── Matching logic
        ├── Interest accrual
        └── Liquidation logic
```

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
- Contract size management (stay under 24KB limit)
- Logic can be upgraded independently
- Gas optimization for frequently called functions

### Storage Layout

```solidity
// Intent storage (keyed by hash)
mapping(bytes32 => LendIntent) public lendIntents;
mapping(bytes32 => BorrowIntent) public borrowIntents;

// Loan storage (keyed by ID)
mapping(uint256 => Loan) public loans;
uint256 public nextLoanId;

// Market configuration
mapping(bytes32 => Market) public markets;
```

## Data Structures

### LendIntent

```solidity
struct LendIntent {
    address lender;
    uint256 amount;              // Total available to lend
    uint256 filledAmount;        // Already matched
    uint256 minFillAmount;       // Minimum per match
    uint256 minInterestRateBps;  // Floor APR (500 = 5%)
    uint256 maxLtvBps;           // Max LTV becomes liquidation threshold
    uint256 duration;            // Max loan duration (seconds)
    bool allowPartialFill;       // Can be filled multiple times
    uint256 expiry;              // Intent validity (timestamp)
    bytes32 marketId;            // Token pair identifier
}
```

### BorrowIntent

```solidity
struct BorrowIntent {
    address borrower;
    uint256 borrowAmount;        // USDC to borrow
    uint256 collateralAmount;    // ETH to deposit
    uint256 maxInterestRateBps;  // Ceiling APR (becomes loan rate)
    uint256 minLtvBps;           // Desired LTV (becomes loan LTV)
    uint256 matcherCommissionBps;// Fee for solver
    uint256 duration;            // Loan duration (seconds)
    uint256 expiry;              // Intent validity (timestamp)
    bytes32 marketId;            // Token pair identifier
}
```

### Loan

```solidity
struct Loan {
    uint256 loanId;
    address lender;
    address borrower;
    uint256 principal;           // Borrowed amount
    uint256 collateralAmount;    // Can change via add/withdraw
    uint256 interestRateBps;     // From borrower.maxInterestRateBps
    uint256 ltvBps;              // From borrower.minLtvBps (origination)
    uint256 liquidationLtvBps;   // From lender.maxLtvBps (threshold)
    uint256 startTime;
    uint256 duration;
    bytes32 marketId;
    bool repaid;
}
```

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

### Intent States

| State | Meaning |
|-------|---------|
| `open` | Available for matching |
| `partial` | Lend intent partially filled |
| `filled` | Fully matched |
| `cancelled` | User cancelled |
| `expired` | Past expiry timestamp |

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

| Operation | Description |
|-----------|-------------|
| `repayLoan` | Borrower repays principal + interest |
| `addCollateral` | Borrower deposits more ETH |
| `withdrawCollateral` | Borrower withdraws excess ETH |
| `liquidateLoan` | Anyone liquidates unhealthy loan |

## Indexer Architecture

Envio HyperIndex provides real-time event indexing:

```
Blockchain Events
       │
       ▼
┌─────────────────┐
│  Event Handlers │
│  ├─ LogLenderOfferPosted
│  ├─ LogBorrowerOfferPosted
│  ├─ LogIntentsMatched
│  ├─ LogLoanRepayment
│  └─ ...
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    PostgreSQL   │
│  ├─ LenderIntent
│  ├─ BorrowerIntent
│  ├─ Loan
│  └─ Aggregates
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Hasura GraphQL │ ◄── Web App
└─────────────────┘     Solver Bot
                        Liquidation Bot
```

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

### Circuit Breaker

Protects against oracle manipulation:

```solidity
function _validatePrice(int256 price) internal view {
    require(price > 0, "Invalid price");
    require(!isStale(price), "Stale price");
    require(!exceedsDeviation(price), "Price deviation");
    require(!sequencerDown(), "L2 sequencer down");
}
```

### Collateral Safety

```
                    ┌─────────────────────────────────┐
                    │         LTV Spectrum            │
                    ├─────────────────────────────────┤
  Safe Zone         │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
  (< origination)   │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
                    ├─────────────────────────────────┤
  Buffer Zone       │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 8% gap enforced
  (8% gap)          │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
                    ├─────────────────────────────────┤
  Liquidation Zone  │███████████████████████████████│
  (> liquidation)   │███████████████████████████████│
                    └─────────────────────────────────┘
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
- Smaller proxy contract (cheaper deployment)
- Upgrade logic in implementation
- Owner-controlled upgrades

### Upgrade Safety

- Storage layout preserved across upgrades
- New variables added at end of storage
- Existing functionality maintained

## Gas Optimization

### Efficient Storage

```solidity
// Pack related data in single slots
struct Loan {
    uint128 principal;      // 16 bytes
    uint128 collateral;     // 16 bytes (same slot)
    uint64 startTime;       // 8 bytes
    uint32 duration;        // 4 bytes
    uint16 interestRateBps; // 2 bytes
    uint16 ltvBps;          // 2 bytes (same slot)
}
```

### Batch Operations

```solidity
// Match multiple intents in one transaction
function batchMatchIntents(
    bytes32[] calldata lendHashes,
    bytes32[] calldata borrowHashes,
    uint256[] calldata fillAmounts
) external;
```

## Next Steps

- [Intent Matching](02-intent-matching.md)
- [Oracle System](03-oracle-system.md)
- [Fee Structure](04-fee-structure.md)
- [Security Model](05-security-model.md)
