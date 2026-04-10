---
icon: clock-rotate-left
---

# Intent Auto Matching

How Floe matches lender and borrower intents to create loans.

## Overview

Intent matching is the core mechanism of Floe. Users create intents specifying their desired terms, and solvers (or users) match compatible pairs.

```
┌───────────────────────────────────────────────────────────────────────┐
│                        MATCHING FLOW                                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌────────────┐                              ┌────────────┐          │
│   │   Lender   │                              │  Borrower  │          │
│   │   Intent   │                              │   Intent   │          │
│   │            │                              │            │          │
│   │ • Amount   │     ┌────────────────┐       │ • Amount   │          │
│   │ • Min Rate │     │    MATCHER     │       │ • Max Rate │          │
│   │ • Max LTV  │────►│   (Solver)     │◄──────│ • Min LTV  │          │
│   │ • Duration │     │                │       │ • Duration │          │
│   │ • Expiry   │     │ Validates:     │       │ • Expiry   │          │
│   └────────────┘     │ • Compatibility│       └────────────┘          │
│                      │ • LTV gap      │                                │
│                      │ • Amounts      │                                │
│                      └───────┬────────┘                                │
│                              │                                         │
│                              ▼                                         │
│                      ┌────────────────┐                                │
│                      │     LOAN       │                                │
│                      │   Created      │                                │
│                      └────────────────┘                                │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

## Compatibility Rules

For two intents to match, ALL conditions must be true:

### 1. Same Market

Both intents must be for the same loan/collateral token pair:

```solidity
require(lendIntent.marketId == borrowIntent.marketId);

// Market ID = keccak256(loanToken, collateralToken)
```

### 2. Time Valid

Both intents must be within their validity period:

```solidity
require(block.timestamp <= lendIntent.expiry);
require(block.timestamp <= borrowIntent.expiry);
```

### 3. Duration Compatible

Borrower's duration must not exceed lender's maximum:

```solidity
require(borrowIntent.duration <= lendIntent.duration);
```

### 4. Rate Compatible

Borrower's max rate must meet lender's minimum:

```solidity
require(borrowIntent.maxInterestRateBps >= lendIntent.minInterestRateBps);
```

The loan uses the borrower's max rate (most favorable to lender).

### 5. LTV Gap

Protocol requires 8% gap between origination LTV and liquidation LTV:

```solidity
// minLtvGapBps = 800 (8%)
require(borrowIntent.minLtvBps + minLtvGapBps <= lendIntent.maxLtvBps);
```

This ensures borrowers have buffer from liquidation at loan creation.

### 6. Amount Available

Lender must have sufficient remaining amount:

```solidity
uint256 remaining = lendIntent.amount - lendIntent.filledAmount;
require(remaining >= fillAmount);
require(fillAmount >= lendIntent.minFillAmount);
```

## Matching Examples

### Compatible Match

```
Lend Intent:
├─ Amount: 10,000 USDC
├─ Min Rate: 5% APR
├─ Max LTV: 80%
├─ Duration: 60 days
└─ Min Fill: 1,000 USDC

Borrow Intent:
├─ Amount: 3,000 USDC
├─ Collateral: 1.5 ETH
├─ Max Rate: 7% APR
├─ Min LTV: 60%
└─ Duration: 30 days

Checks:
✅ Same market (USDC/WETH)
✅ Duration: 30 ≤ 60
✅ Rate: 7% ≥ 5%
✅ LTV gap: 60% + 8% = 68% ≤ 80%
✅ Amount: 3,000 ≥ 1,000 min fill

Result: COMPATIBLE
Loan created at 7% APR, 60% origin LTV, 80% liquidation LTV
```

### Incompatible: Rate Mismatch

```
Lend Intent:
├─ Min Rate: 8% APR
└─ ...

Borrow Intent:
├─ Max Rate: 6% APR
└─ ...

Check: 6% < 8%
❌ Rate incompatible
```

### Incompatible: LTV Gap

```
Lend Intent:
├─ Max LTV: 75%
└─ ...

Borrow Intent:
├─ Min LTV: 70%
└─ ...

Check: 70% + 8% = 78% > 75%
❌ Insufficient LTV gap
```

## Fill Amounts

### Full Fill

Entire borrow amount matched from a single lend intent:

```
Lend: 10,000 USDC available
Borrow: 3,000 USDC requested
Fill: 3,000 USDC

After:
├─ Lend remaining: 7,000 USDC
└─ Borrow: Fully filled (loan created)
```

### Partial Fill (Lend Intent)

Lend intents with `allowPartialFill = true` can be matched multiple times:

```
Lend: 10,000 USDC (partial fill allowed)

Match 1: Borrow 2,000 → Remaining: 8,000
Match 2: Borrow 3,000 → Remaining: 5,000
Match 3: Borrow 5,000 → Remaining: 0 (fully filled)
```

### Minimum Fill Enforcement

```
Lend: 10,000 USDC, minFill = 1,000

Borrow: 500 USDC
❌ Below minimum fill

Borrow: 1,500 USDC
✅ Meets minimum
```

## Loan Parameters Derivation

When a match occurs, loan parameters are derived from both intents:

| Loan Parameter  | Source                                      |
| --------------- | ------------------------------------------- |
| Principal       | Fill amount                                 |
| Collateral      | Borrower's collateral (pro-rata if partial) |
| Interest Rate   | Borrower's maxInterestRateBps               |
| Origination LTV | Borrower's minLtvBps                        |
| Liquidation LTV | Lender's maxLtvBps                          |
| Duration        | Borrower's duration                         |
| Start Time      | Block timestamp                             |

## Matching Process

### Onchain Matching

```solidity
function matchLoanIntents(
    bytes32 lendIntentHash,
    bytes32 borrowIntentHash,
    uint256 fillAmount
) external {
    // 1. Load intents
    LendIntent storage lend = lendIntents[lendIntentHash];
    BorrowIntent storage borrow = borrowIntents[borrowIntentHash];

    // 2. Validate compatibility
    _validateMatch(lend, borrow, fillAmount);

    // 3. Calculate loan parameters
    Loan memory loan = _createLoan(lend, borrow, fillAmount);

    // 4. Transfer tokens
    _transferTokens(lend, borrow, fillAmount);

    // 5. Pay matcher commission
    _payCommission(borrow);

    // 6. Update intent states
    _updateIntents(lend, borrow, fillAmount);

    // 7. Emit events
    emit LogIntentsMatched(loan.loanId, lendIntentHash, borrowIntentHash);
}
```

### Token Flows

```
Before Match:
├─ Lender: USDC in wallet, approved to contract
└─ Borrower: WETH in contract (deposited with intent)

During Match:
┌───────────────────────────────────────────────────┐
│  Lender's USDC                                    │
│       │                                           │
│       ├──► (principal - commission) ──► Borrower  │
│       │                                           │
│       └──► (commission) ──► Matcher (solver)      │
│                                                   │
│  Borrower's WETH stays in contract as collateral  │
└───────────────────────────────────────────────────┘

After Match:
├─ Borrower: Has USDC (minus commission)
├─ Matcher: Has commission in USDC
├─ Contract: Holds borrower's WETH collateral
└─ Lender: Owed principal + interest (claim on repayment)
```

## Solver Mechanics

### How Solvers Work

1. **Monitor**: Query indexer for open intents
2. **Find matches**: Algorithm finds compatible pairs
3. **Prioritize**: Rank by profitability (commission)
4. **Execute**: Call `matchLoanIntents` on-chain
5. **Earn**: Receive matcher commission

###

### Competition

* Multiple solvers compete to match intents
* First to submit valid transaction wins
* Gas price can determine winner in tight races

## Manual Matching

Users can also match intents directly without solvers:

### Via Web App

1. Browse open intents on marketplace
2. Click "Match" on compatible intent
3. Sign transaction
4. Receive loan (as borrower) or earn interest (as lender)

## Intent Cancellation

### Before Match

Users can cancel their pending intents:

```typescript
// Cancel borrow intent
await sdk.lending.cancelBorrowIntent(intentHash);

// Cancel lend intent
await sdk.lending.cancelLendIntent(intentHash);
```

### Effects

* **Borrow cancellation**: Collateral returned to borrower
* **Lend cancellation**: USDC allowance remains (no transfer occurred)

### Cannot Cancel

* After intent is fully filled
* During active loan (must repay instead)





## Edge Cases

### Race Conditions

Multiple matchers may try to match the same intent:

```
Time T0: Intent A posted
Time T1: Solver X finds match
Time T2: Solver Y finds match
Time T3: Solver X submits tx
Time T4: Solver Y submits tx (reverts - already matched)
```

### Partial Fill Race

```
Lend intent: 5,000 USDC remaining

Solver X: Match 3,000 (succeeds)
Solver Y: Match 4,000 (reverts - only 2,000 remaining)
```

### Expiry During Match

```
Time T0: Intent expires at T+10
Time T1: Solver finds match
Time T5: Solver submits tx
Time T12: Tx included (reverts - intent expired)
```

## Best Practices

### For Borrowers

1. Set competitive `maxInterestRateBps` for faster matching
2. Include reasonable `matcherCommissionBps` (0.1-0.5%)
3. Allow sufficient expiry time (7+ days)

### For Lenders

1. Set `allowPartialFill = true` for more matching opportunities
2. Use reasonable `minFillAmount` (don't set too high)
3. Competitive `minInterestRateBps` attracts more borrowers

### For Solvers

1. Monitor gas prices to ensure profitability
2. Consider MEV protection for large matches
3. Use efficient intent indexing

## Next Steps

* [Oracles & Circuit Breaker](oracles-conditions.md)
* [Security](security.md)
* [Run a Solver Bot](../developers/04-run-solver-bot.md)
