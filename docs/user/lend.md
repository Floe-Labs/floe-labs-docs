# Lend USDC

Earn interest by lending USDC to borrowers on Floe.

## Overview

Lending on Floe works through **intents**:
1. You create a lend intent with your terms
2. Solvers match you with compatible borrowers
3. Borrower deposits collateral, you provide USDC
4. Earn interest until repayment

## Before You Start

**You'll need:**
- USDC on Base
- ETH for gas fees
- Wallet connected to Base Mainnet

**Understand:**
- Your USDC is locked in the loan until repayment
- Borrowers provide ETH collateral (overcollateralized)
- In extreme cases, you may receive collateral instead of USDC

## Step-by-Step Guide

### 1. Go to Earn Page

Navigate to [app.floelabs.xyz](https://app.floelabs.xyz) and click **Earn**.

### 2. Review Borrow Requests

The marketplace shows borrower intents with:
- **Amount Requested**: USDC they want to borrow
- **Collateral**: ETH they're offering
- **Max Rate**: Highest rate they'll pay
- **Duration**: How long they need it
- **Matcher Commission**: What solvers earn

### 3. Create Your Lend Intent

Click **"Create Lend Intent"** and enter:

| Field | Description | Example |
|-------|-------------|---------|
| Amount | Total USDC to lend | 10,000 USDC |
| Min Fill Amount | Minimum per match | 1,000 USDC |
| Min Interest Rate | Lowest APR you'll accept | 5% |
| Max LTV | Liquidation threshold | 80% |
| Duration | Maximum loan length | 60 days |
| Allow Partial Fill | Match multiple borrowers? | Yes |
| Expiry | How long intent stays active | 14 days |

### 4. Understand Your Terms

```
Your Intent:
├── Lending: 10,000 USDC
├── Min per match: 1,000 USDC
├── Min Rate: 5% APR
├── Max LTV: 80% (liquidation threshold)
├── Max Duration: 60 days
└── Partial Fill: Enabled
```

### 5. Approve and Submit

1. Click **"Approve USDC"** (first time only)
2. Confirm in your wallet
3. Click **"Create Intent"**
4. Sign the transaction

### 6. Wait for Match

Your intent is now live. Solvers will match you when they find compatible borrowers.

With partial fill enabled, your intent can match multiple borrowers until fully utilized.

### 7. Loan Active

Once matched:
- Your USDC goes to the borrower
- Borrower's ETH is held as collateral
- Interest accrues in your favor
- View your loans in **Loans** page

## Understanding Returns

### Interest Calculation

```
Interest = Principal × (APR ÷ 365) × Days

Example:
- Principal: $5,000
- APR: 6%
- Duration: 30 days
- Interest: $5,000 × 0.06 × (30/365) = $24.66
- Total Return: $5,024.66
```

### Expected Returns Table

| Amount | APR | 30 Days | 60 Days | 90 Days |
|--------|-----|---------|---------|---------|
| $5,000 | 5% | $20.55 | $41.10 | $61.64 |
| $5,000 | 7% | $28.77 | $57.53 | $86.30 |
| $10,000 | 5% | $41.10 | $82.19 | $123.29 |
| $10,000 | 7% | $57.53 | $115.07 | $172.60 |

## Understanding Collateral

### Max LTV Setting

Your **Max LTV** becomes the **liquidation threshold** for matched loans:
- Higher Max LTV = more matching opportunities, higher risk
- Lower Max LTV = fewer matches, more protection

| Max LTV | Risk Level | Notes |
|---------|------------|-------|
| 70% | Conservative | Larger collateral buffer |
| 75% | Moderate | Good balance |
| 80% | Standard | Common setting |
| 85% | Aggressive | Higher risk |

### The 8% Gap Rule

Borrowers must maintain at least 8% gap:
- Your Max LTV: 80%
- Borrower's starting LTV: ≤72%
- Buffer from day one: 8%+

## Repayment Scenarios

### Normal Repayment (Most Common)

1. Borrower repays before due date
2. You receive principal + interest in USDC
3. Borrower gets their ETH back

### Liquidation (Solvent)

If borrower's LTV exceeds threshold or loan is overdue:
1. Liquidator pays the debt
2. You receive full principal + interest in USDC
3. Liquidator takes borrower's collateral

### Liquidation (Underwater)

In extreme market crashes where collateral < debt:
1. Liquidator pays discounted amount
2. You receive what's available (may be less than owed)
3. This is the "bad debt" scenario

## Managing Your Positions

### View Active Loans

Go to **Loans** to see:
- Loans where you're the lender
- Borrower's current LTV
- Accrued interest
- Due dates

### Monitor Loan Health

| Borrower LTV | Status | Your Risk |
|--------------|--------|-----------|
| < 60% | 🟢 Healthy | Very low |
| 60-70% | 🟡 Moderate | Low |
| 70-80% | 🟠 At Risk | Medium |
| > 80% | 🔴 Liquidatable | Liquidation handles it |

### Cancel Pending Intent

If your intent hasn't been matched:
1. Go to **My Intents**
2. Click **"Cancel"**
3. Your USDC allowance is released

## Risk Management

### Diversification

Don't put all funds in one loan:
- Use **Partial Fill** to spread across multiple borrowers
- Set reasonable **Min Fill Amount** (e.g., $1,000)

### Duration Limits

Shorter durations = less time for markets to move:
- **Conservative**: 14-30 days
- **Moderate**: 30-60 days
- **Long-term**: 60-90 days

### LTV Settings

Balance opportunity vs. safety:
- Lower Max LTV = more collateral protection
- Higher Max LTV = more matching opportunities

## Earnings Example

```
Scenario: Active lender over 1 month

Capital: $20,000 USDC
Strategy: 75% Max LTV, 5.5% min rate, partial fills

Week 1: Matched 3 borrowers ($15,000 total)
Week 2: Remaining $5,000 matched
Average rate achieved: 6.2%

Month-end:
- Interest earned: $20,000 × 6.2% × (30/365) = $101.92
- Gas costs: ~$1.00
- Net earnings: ~$100.92

Annualized: ~6.1% APY
```

## Tips for Lenders

1. **Enable partial fills**: More matching opportunities
2. **Set competitive rates**: Check market for current rates
3. **Diversify**: Spread across multiple loans
4. **Monitor positions**: Check borrower health regularly
5. **Understand liquidation**: Know how you're protected

## Troubleshooting

### Intent not matching?
- Your min rate may be too high
- Check current market rates
- Consider lowering min rate slightly

### Transaction failed?
- Check ETH balance for gas
- Ensure USDC is approved
- Verify you're on Base Mainnet

### Can't cancel intent?
- Intent may be partially filled
- Check if any matches occurred

## Next Steps

- [Understanding Risk & Liquidation](risk-liquidations.md)
- [Using Lendr AI](lendr-ai.md)
