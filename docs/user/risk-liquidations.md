# Risk & Liquidation

Understanding risk is essential for using Floe safely. This guide explains how liquidation works and how to protect your positions.

## How Liquidation Works

### What Triggers Liquidation?

A loan becomes liquidatable when **either** condition is met:

1. **LTV Breach**: Current LTV exceeds the liquidation threshold
2. **Overdue**: Loan duration has expired and borrower hasn't repaid

### The Liquidation Formula

```
Current LTV = (Principal × 10,000) ÷ Collateral Value (in USDC)

Liquidatable if:
  Current LTV > Liquidation LTV (from lender's maxLtvBps)
  OR
  Current Time > Loan Start Time + Duration
```

### Example

```
Loan Details:
- Principal: 5,000 USDC
- Collateral: 2.5 ETH
- Liquidation LTV: 80%

At ETH = $4,000:
- Collateral Value = $10,000
- Current LTV = 5,000 / 10,000 = 50% ✅ Safe

At ETH = $3,200:
- Collateral Value = $8,000
- Current LTV = 5,000 / 8,000 = 62.5% ✅ Safe

At ETH = $2,600:
- Collateral Value = $6,500
- Current LTV = 5,000 / 6,500 = 77% ⚠️ Getting risky

At ETH = $2,400:
- Collateral Value = $6,000
- Current LTV = 5,000 / 6,000 = 83% 🔴 LIQUIDATABLE
```

## Liquidation Process

### Step 1: Detection
- Liquidation bots continuously monitor loan health
- When a loan becomes liquidatable, bots compete to liquidate it

### Step 2: Execution
The liquidator calls `liquidateLoan()`:
- Pays off the borrower's debt (principal + accrued interest)
- Receives the collateral + liquidation bonus

### Step 3: Settlement

**Solvent Liquidation** (collateral > debt):
- Lender receives full repayment
- Liquidator receives collateral + 5% bonus
- Borrower loses collateral but debt is cleared

**Underwater Liquidation** (collateral < debt):
- Lender receives all collateral
- Bad debt is realized
- Borrower loses everything

## Protection Mechanisms

### For Borrowers

#### 1. Buffer Your LTV
Don't borrow at maximum LTV. Leave room for price drops.

| Risk Level | Recommended LTV | Buffer |
|------------|-----------------|--------|
| Conservative | 40-50% | 30-40% buffer |
| Moderate | 50-60% | 20-30% buffer |
| Aggressive | 60-70% | 10-20% buffer |

#### 2. Add Collateral Proactively
If ETH price drops:
1. Go to your loan in the **Loans** page
2. Click **"Add Collateral"**
3. Deposit more ETH to lower your LTV

#### 3. Set Price Alerts
Use external tools to monitor ETH price and get notified when approaching your liquidation price.

#### 4. Repay Early
If you're worried about market conditions, repay your loan early. There's no prepayment penalty.

### For Lenders

#### 1. Set Appropriate Max LTV
- Lower Max LTV = more collateral buffer = safer
- Too low = fewer borrowers will match
- Recommended: 75-80%

#### 2. Prefer Shorter Durations
Shorter loans = less time for prices to move against you.

#### 3. Diversify
Don't put all your capital in one loan. Spread across multiple borrowers.

## LTV Gap Requirement

Floe enforces a minimum 8% gap between:
- **Origination LTV**: The LTV when the loan is created
- **Liquidation LTV**: The threshold where liquidation is allowed

This ensures borrowers have buffer room from day one.

```
Example:
- Lender sets Max LTV (Liquidation): 80%
- Borrower's origination LTV must be ≤ 72%
- Minimum 8% buffer at loan creation
```

## Oracle System

Floe uses a robust dual-oracle system:

### Primary: Chainlink
- Industry-standard price feeds
- High reliability and uptime

### Fallback: Pyth Network
- Activates if Chainlink fails
- Provides redundancy

### Circuit Breaker
Protects against oracle manipulation:

| Trigger | Action |
|---------|--------|
| Price deviation > 15% | Operations paused |
| Stale price (> 1 hour) | Operations paused |
| L2 sequencer down | Operations paused |
| Invalid price (0) | Operations paused |

When the circuit breaker is active:
- New matches blocked
- Repayments blocked
- Liquidations blocked
- Collateral operations blocked

## Liquidation Economics

### For Liquidators
- Receive 5% bonus on collateral
- Must have capital to pay off debt
- Compete with other liquidators (first to execute wins)

### For Borrowers
- Lose all collateral
- Debt is cleared
- No further obligation

### For Lenders
- Receive full repayment (if solvent)
- Receive collateral (if underwater)

## Bad Debt Scenarios

In extreme cases where collateral value falls below debt:

```
Example:
- Principal: 5,000 USDC
- Interest owed: 100 USDC
- Total debt: 5,100 USDC
- Collateral: 2 ETH at $2,000 = $4,000

Liquidation outcome:
- Lender receives: 2 ETH ($4,000 value)
- Bad debt: 5,100 - 4,000 = $1,100
- Loss absorbed by lender
```

This is why overcollateralization and appropriate LTV limits are crucial.

## Monitoring Tools

### In-App Dashboard
- View current LTV in real-time
- See liquidation price
- One-click add collateral

### Loan Health Indicators
| Status | Meaning |
|--------|---------|
| 🟢 Healthy | LTV well below liquidation |
| 🟡 At Risk | LTV approaching liquidation |
| 🔴 Danger | LTV very close to liquidation |

## Best Practices Summary

### Borrowers
1. ✅ Maintain 20%+ buffer below liquidation LTV
2. ✅ Monitor prices during volatile markets
3. ✅ Add collateral proactively, not reactively
4. ✅ Repay before maturity to avoid overdue liquidation
5. ❌ Don't max out your borrowing capacity

### Lenders
1. ✅ Set Max LTV based on your risk tolerance
2. ✅ Diversify across multiple loans
3. ✅ Prefer shorter durations in volatile markets
4. ✅ Understand that overcollateralization protects but doesn't eliminate risk
5. ❌ Don't lend more than you can afford to lose

## FAQ

**Q: Can I be partially liquidated?**
A: No, liquidation is all-or-nothing. The entire loan is liquidated.

**Q: What if no liquidator executes my liquidation?**
A: Liquidation bots are incentivized by the 5% bonus. In practice, liquidatable loans are processed quickly.

**Q: Can I stop a liquidation once it starts?**
A: No. Once the transaction is submitted, it cannot be stopped. Add collateral *before* reaching liquidation.

**Q: What happens to excess collateral after liquidation?**
A: The liquidator receives all collateral. There's no return of excess to the borrower.
