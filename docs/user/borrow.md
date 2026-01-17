# Borrow USDC

Borrow USDC using ETH as collateral on Floe.

## Overview

Borrowing on Floe works through **intents**:
1. You create a borrow intent with your desired terms
2. Solvers match you with compatible lenders
3. You receive USDC, your ETH is held as collateral
4. Repay principal + interest to get your ETH back

## Before You Start

**You'll need:**
- ETH on Base (for collateral + gas)
- Wallet connected to Base Mainnet

**Understand:**
- Your ETH is locked until you repay
- If ETH price drops significantly, you may be liquidated
- Interest accrues daily until repayment

## Step-by-Step Guide

### 1. Go to Borrow Page

Navigate to [app.floelabs.xyz](https://app.floelabs.xyz) and click **Borrow**.

### 2. Review Available Offers

The marketplace shows lender offers with:
- **Amount Available**: USDC you can borrow
- **Interest Rate**: APR you'll pay
- **Max LTV**: Liquidation threshold
- **Duration**: Maximum loan length

### 3. Create Your Borrow Intent

Click **"Create Borrow Intent"** and enter:

| Field | Description | Example |
|-------|-------------|---------|
| Borrow Amount | USDC you need | 5,000 USDC |
| Collateral | ETH to deposit | 2.0 ETH |
| Max Interest Rate | Highest APR you'll accept | 8% |
| Duration | Loan length | 30 days |
| Matcher Commission | Fee for solvers | 0.3% |
| Expiry | How long intent stays active | 7 days |

### 4. Understand Your Terms

Before submitting, review:

```
Your Intent:
├── Borrowing: 5,000 USDC
├── Collateral: 2.0 ETH (~$7,000 at $3,500/ETH)
├── Your LTV: 71%
├── Max Rate: 8% APR
├── Duration: 30 days
└── Matcher Fee: 0.3% ($15)
```

### 5. Approve and Submit

1. Click **"Approve WETH"** (first time only)
2. Confirm in your wallet
3. Click **"Create Intent"**
4. Sign the transaction

### 6. Wait for Match

Your intent is now live. Solvers will match you when they find a compatible lender. This typically happens within minutes.

Check status in **My Intents**.

### 7. Loan Active

Once matched:
- You receive USDC (minus matcher fee)
- Your ETH is locked as collateral
- Interest starts accruing
- View your loan in **Loans** page

## Understanding LTV

**Loan-to-Value (LTV)** = Loan Amount ÷ Collateral Value

```
Example:
- Loan: $5,000 USDC
- Collateral: 2 ETH × $3,500 = $7,000
- LTV: $5,000 ÷ $7,000 = 71%
```

### LTV Zones

| LTV | Status | Action |
|-----|--------|--------|
| < 60% | 🟢 Safe | Comfortable buffer |
| 60-70% | 🟡 Moderate | Monitor regularly |
| 70-80% | 🟠 Risky | Consider adding collateral |
| > 80% | 🔴 Danger | Liquidation imminent |

### The 8% Gap Rule

Floe requires at least 8% gap between your borrow LTV and liquidation LTV:
- If lender's max LTV is 80%, your borrow LTV must be ≤ 72%
- This ensures you have buffer from day one

## Repaying Your Loan

### Calculate Repayment

```
Total = Principal + Interest

Interest = Principal × (APR ÷ 365) × Days

Example:
- Principal: $5,000
- APR: 6%
- Duration: 30 days
- Interest: $5,000 × 0.06 × (30/365) = $24.66
- Total: $5,024.66
```

### Steps to Repay

1. Go to **Loans** page
2. Find your active loan
3. Click **"Repay"**
4. Approve USDC if needed
5. Confirm transaction
6. Your collateral is returned

### Early Repayment

You can repay anytime—no prepayment penalty. You only pay interest for time used.

## Managing Your Position

### Add Collateral

If ETH price drops, protect yourself:
1. Go to loan in **Loans** page
2. Click **"Add Collateral"**
3. Enter ETH amount
4. Confirm transaction

### Withdraw Excess Collateral

If ETH price rises, you can withdraw some:
1. Click **"Withdraw Collateral"**
2. Enter amount (max shown)
3. Must stay below 77% LTV (3% buffer from 80%)

## Liquidation

### What Triggers Liquidation?

Your loan can be liquidated when:
1. **LTV exceeds threshold**: Your LTV goes above the liquidation LTV
2. **Loan is overdue**: Duration has passed without repayment

### What Happens?

- A liquidator pays your debt
- They receive your collateral + 5% bonus
- You lose your collateral but owe nothing more

### Prevention

- Maintain 20%+ buffer below liquidation LTV
- Add collateral when markets are volatile
- Set price alerts for ETH
- Repay before due date

## Cost Breakdown

| Fee | Amount | Paid To |
|-----|--------|---------|
| Interest | Negotiated APR | Lender |
| Matcher Commission | 0.1-0.5% of loan | Solver |
| Gas | ~$0.10-0.30 | Network |

**Example total cost for $5,000 loan at 6% for 30 days:**
- Interest: $24.66
- Matcher fee (0.3%): $15
- Gas: ~$0.20
- **Total: ~$40**

## Tips for Borrowers

1. **Start conservative**: Borrow less than max, keep LTV low
2. **Watch the market**: Monitor ETH price, especially in volatile times
3. **Set reminders**: Don't forget your due date
4. **Use Lendr**: Ask the AI for help managing your loan
5. **Keep USDC ready**: Have repayment funds available

## Troubleshooting

### Intent not matching?
- Your max rate may be too low
- Increase matcher commission
- Check market activity

### Transaction failed?
- Check ETH balance for gas
- Ensure WETH is approved
- Verify you're on Base Mainnet

### Can't add collateral?
- Check WETH approval
- Verify you have enough ETH

## Next Steps

- [Understanding Risk & Liquidation](risk-liquidations.md)
- [Managing Your Loans](manage-loans.md)
- [Using Lendr AI](lendr-ai.md)
