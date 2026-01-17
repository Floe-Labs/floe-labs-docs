# Settlement

How loans are created, managed, and closed in Floe.

## Overview

When intents are matched, a **loan** is created with:
- Principal held by lender (no escrow needed)
- Collateral escrowed in the contract
- Fixed terms derived from both intents

## Loan Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Intents   │────▶│    Match    │────▶│    Loan     │
│   Created   │     │   Execute   │     │   Active    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
             ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
             │    Repay    │           │  Liquidate  │           │   Expired   │
             │  (Borrower) │           │   (Anyone)  │           │  (Lender)   │
             └─────────────┘           └─────────────┘           └─────────────┘
```

## Loan Creation

When `matchLoanIntents` is called:

1. **Validation**: Both intents verified (signatures, expiry, compatibility)
2. **Token Transfers**:
   - USDC transferred from lender to borrower (minus commission)
   - Commission transferred to matcher
   - Collateral already deposited stays in contract
3. **Loan Record**: Created with derived parameters
4. **Events**: `LogIntentsMatched` emitted

```solidity
function matchLoanIntents(
    LendIntent calldata lender,
    bytes calldata lenderSig,
    BorrowIntent calldata borrower,
    bytes calldata borrowerSig,
    bytes32 marketId,
    bool isLenderOnChain,
    bool isBorrowerOnChain
) external returns (uint256 loanId);
```

## Token Flows

### On Match

```
Lender's USDC ──┬──▶ Borrower (principal - commission)
                │
                └──▶ Matcher (commission)

Borrower's WETH ───▶ Contract (held as collateral)
```

### On Repay

```
Borrower ──▶ USDC (principal + interest) ──▶ Lender

Contract ──▶ WETH (collateral) ──▶ Borrower
```

### On Liquidation

```
Liquidator ──▶ USDC (repay amount) ──▶ Lender

Contract ──▶ WETH (collateral + bonus) ──▶ Liquidator
```

## Repayment

Borrowers can repay their loan at any time:

```solidity
function repayLoan(uint256 loanId, uint256 repayAmount) external;
```

### Repayment Calculation

```
Total Owed = Principal + Accrued Interest

Interest = Principal × Rate × Time / (365 days × 10000)
```

### Partial Repayment

Loans support partial repayment:
- Proportional principal reduction
- Interest calculated on remaining principal
- Collateral remains locked until full repayment

### Full Repayment

On full repayment:
- All collateral returned to borrower
- Loan marked as closed
- `LogLoanRepayment` event emitted

## Collateral Management

### Add Collateral

Anyone can add collateral to improve loan health:

```solidity
function addCollateral(uint256 loanId, uint256 amount) external;
```

Use cases:
- Borrower topping up to avoid liquidation
- Third party protecting a position

### Withdraw Collateral

Borrower can withdraw excess collateral if loan remains healthy:

```solidity
function withdrawCollateral(uint256 loanId, uint256 amount) external;
```

**Constraints:**
- Only borrower can withdraw
- LTV must remain below (liquidation LTV - 3% buffer)
- Cannot withdraw during circuit breaker

## Liquidation

When LTV exceeds the liquidation threshold, anyone can liquidate:

```solidity
function liquidateLoan(uint256 loanId, uint256 repayAmount) external;
```

### Liquidation Process

1. Verify loan is unhealthy (`isHealthy(loanId) == false`)
2. Liquidator pays debt (partial or full)
3. Liquidator receives proportional collateral + 5% bonus
4. Remaining collateral returned to borrower (if any)

### Liquidation Example

```
Loan: 1000 USDC, 0.5 WETH collateral
ETH Price: $2000
Current LTV: 100% (loan = collateral value)
Liquidation LTV: 80%

Liquidator repays: 1000 USDC
Collateral value: $1000
Bonus (5%): $50
Total to liquidator: $1050 worth of ETH = 0.525 WETH
```

## Flash Loans

The protocol supports flash loans for advanced use cases:

```solidity
function flashLoan(
    address token,
    uint256 amount,
    bytes calldata data
) external;
```

Requirements:
- Implement `IFlashloanReceiver` interface
- Return borrowed amount + fee in same transaction

## Interest Calculation

Interest accrues continuously:

```solidity
function getAccruedInterest(uint256 loanId)
    external view returns (uint256 interest, uint256 timeElapsed);
```

**Formula:**
```
interest = principal × rate × timeElapsed / (365 days × 10000)
```

Where:
- `rate` is in basis points (500 = 5%)
- `timeElapsed` is in seconds

## Loan State

```solidity
struct Loan {
    address lender;
    address borrower;
    bytes32 marketId;
    uint256 principal;
    uint256 collateral;
    uint256 interestRateBps;
    uint256 originationLtvBps;
    uint256 liquidationLtvBps;
    uint256 startTime;
    uint256 duration;
    bool isActive;
}
```

## Events

| Event | Description |
|-------|-------------|
| `LogIntentsMatched` | Loan created from matched intents |
| `LogLoanRepayment` | Principal repaid (partial or full) |
| `LogLoanLiquidated` | Loan liquidated |
| `LogCollateralAdded` | Collateral increased |
| `LogCollateralWithdrawn` | Collateral withdrawn |

## Error Handling

| Error | Cause |
|-------|-------|
| `LoanNotActive` | Trying to interact with closed loan |
| `NotBorrower` | Unauthorized action on loan |
| `LoanStillHealthy` | Trying to liquidate healthy loan |
| `InsufficientCollateral` | Withdrawal would make loan unhealthy |
| `CircuitBreakerActive` | Operations paused |
