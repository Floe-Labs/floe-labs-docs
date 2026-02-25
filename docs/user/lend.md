---
icon: wave
---

# How to Lend

Earn interest by lending USDT or USDC to borrowers on Floe.

## Overview

Lending on Floe works through **intents**:

1. Match existing intents in Earn Offers screen
2. or create a loan book
3. If you create an intent, Solvers match you with compatible borrowers
4. Borrower deposits collateral, you provide USDC or USDT
5. Earn interest until repayment

## Before You Start

**You'll need:**

* USDC or USDT on Base
* ETH for gas fees
* Wallet connected to Base Mainnet

**Understand:**

* Your USDC or USDT is locked in the loan until repayment
* Borrowers provide WETH or cbBTC or another collateral (overcollateralized)
* In extreme cases, you may receive collateral instead of USDC or USDT

## Step-by-Step Guide

### 1. Go to Lender Workspace

Navigate to [app.floelabs.xyz](https://app.floelabs.xyz) and click **Earn**.

### 2. Review Borrow Requests

The marketplace shows borrower intents with:

* **Amount Requested**: USDC they want to borrow
* **Collateral**: ETH they're offering
* **Max Rate**: Highest rate they'll pay
* **Duration**: How long they need it
* **Matcher Commission**: What solvers earn

### 3. Choose a Preset (Recommended)

Floe offers **preset templates** to help you get started with well-calibrated parameters:

| Preset           | Min Rate | Max LTV  | Duration | Risk Level                |
| ---------------- | -------- | -------- | -------- | ------------------------- |
| **Conservative** | Higher   | Lower    | Shorter  | Lower risk, fewer matches |
| **Balanced**     | Moderate | Moderate | Moderate | Good trade-off            |
| **Aggressive**   | Lower    | Higher   | Longer   | More matches, higher risk |
| **Custom**       | You set  | You set  | You set  | Full control              |

Select a preset to auto-populate all fields, then adjust individual parameters if needed. The form starts in **Custom** mode by default.

### 4. Set Your Lend Intent Parameters

Click **"Create Lend Intent"** and enter:

| Field              | Description                                 | Example     |
| ------------------ | ------------------------------------------- | ----------- |
| Amount             | Total USDC or USDT to lend                  | 10,000 USDC |
| Min Fill Amount    | Minimum per match                           | 1,000 USDC  |
| Min Interest Rate  | Lowest APR you'll accept                    | 5%          |
| Max LTV            | Liquidation threshold                       | 80%         |
| Duration           | Maximum loan length (1W, 1M, 3M, 6M, or 1Y) | 3M          |
| Allow Partial Fill | Match multiple borrowers?                   | Yes         |
| Expiry             | How long intent stays active                | 14 days     |

#### Duration Buckets

Instead of typing an arbitrary number of days, select from predefined duration options: **1 Week, 1 Month, 3 Months, 6 Months, or 1 Year** (7, 30, 90, 180, 365 days). These standard durations improve matching compatibility since borrowers also pick from the same set.

### 5. Configure Term Protection

Under **Early Repayment Terms**, choose how borrowers can repay early:

| Option            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| **Flexible**      | Borrower can repay anytime with no penalty (default)     |
| **Penalty**       | Borrower pays a fee for early repayment _(coming in v2)_ |
| **No Prepayment** | Borrower must wait until maturity _(coming in v2)_       |

Currently, **Flexible** is the active option. Penalty and No Prepayment options will be enforced on-chain in a future release.

### 6. Review Risk Preview

Before submitting, the **Risk Preview** panel shows a real-time assessment of your intent:

* **Risk Level Badge** — Safe, Moderate, High, or Critical based on the gap between max LTV and liquidation threshold
* **Estimated Yield** — Projected earnings based on your rate and duration
* **LTV Buffer** — How much room exists between the borrower's starting LTV and your liquidation threshold
* **Warnings** — Contextual alerts if your settings are aggressive (e.g., thin margin between max LTV and liquidation)

This updates live as you adjust any parameter.

### 7. Understand Your Terms

```
Your Intent:
├── Lending: 10,000 USDC
├── Min per match: 1,000 USDC
├── Min Rate: 5% APR
├── Max LTV: 80% (liquidation threshold)
├── Max Duration: 3 Months
├── Partial Fill: Enabled
└── Early Repayment: Flexible
```

### 8. Approve and Submit

1. Click **"Approve"**
2. Confirm in your wallet
3. Click **"Create Intent"**
4. **Review the Confirmation Modal** — a summary of all parameters, risk level, estimated yield, and any warnings appears before the transaction fires
5. Click **"Confirm"** to sign the transaction

### 9. Wait for Match

Your intent is now live. Solvers will match you when they find compatible borrowers.

With partial fill enabled, your intent can match multiple borrowers until fully utilized.

### 10. Loan Active

Once matched:

* Your USDC or USDT goes to the borrower
* Borrower's collateral (cbBTC, WETH) is held as collateral
* Interest accrues in your favor
* View your loans in **Loans** page

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

| Amount  | APR | 30 Days | 60 Days | 90 Days |
| ------- | --- | ------- | ------- | ------- |
| $5,000  | 5%  | $20.55  | $41.10  | $61.64  |
| $5,000  | 7%  | $28.77  | $57.53  | $86.30  |
| $10,000 | 5%  | $41.10  | $82.19  | $123.29 |
| $10,000 | 7%  | $57.53  | $115.07 | $172.60 |

## Understanding Collateral

### Max LTV Setting

Your **Max LTV** becomes the **liquidation threshold** for matched loans:

* Higher Max LTV = more matching opportunities, higher risk
* Lower Max LTV = fewer matches, more protection

| Max LTV | Risk Level   | Notes                    |
| ------- | ------------ | ------------------------ |
| 70%     | Conservative | Larger collateral buffer |
| 75%     | Moderate     | Good balance             |
| 80%     | Standard     | Common setting           |
| 85%     | Aggressive   | Higher risk              |

<figure><img src="../../.gitbook/assets/Screenshot 2026-01-17 at 15.07.25.png" alt=""><figcaption></figcaption></figure>

### The 8% Gap Rule

Borrowers must maintain at least 8% gap between the Loan LTV and the Liquidation LTV:

* Your Max LTV or Liquidation LTV: 80%
* Borrower's starting LTV: ≤72%
* Minimum buffer from day one: 8%+

## Repayment Scenarios

### Normal Repayment (Most Common)

1. Borrower repays before due date
2. You receive principal + interest in USDC or USDT
3. Borrower gets their collateral e.g. cbBTC or WETH back

### Liquidation (Solvent)

If borrower's LTV exceeds liquidation LTV threshold or loan is overdue:

1. Liquidator pays the debt
2. You receive full principal + interest in USDC
3. Liquidator takes borrower's collateral

### Liquidation (Underwater)

In extreme market crashes where collateral value < debt value:

1. Liquidator pays discounted amount
2. You receive what's available (may be less than owed)
3. This is the "bad debt" scenario

## Managing Your Positions

### View Active Loans

Go to **Loans** to see your active positions. Each loan card shows:

* **LTV Donut Gauge** — Visual ring showing current LTV vs. liquidation threshold
* **Hero Stats** — Current LTV %, liquidation LTV %, and time remaining at a glance
* **Health Border** — Color-coded accent (green = safe, yellow = caution, orange = warning, red = critical)
* **Accrued Interest** — Real-time interest earned
* **Expandable Details** — Click to see match info, network, parties, and transaction links

### Cancel Pending Intent

If your intent hasn't been matched:

1. Go to **My Intents**
2. Click **"Cancel"**
3. Your USDC or USDT allowance is released

## Risk Management

### Borrower Diversification&#x20;

Don't put all funds in one loan:

* Use **Partial Fill** to spread across multiple borrowers
* Set **Min Fill Amount** (e.g., $1,000)

### Duration Limits

Shorter durations = less time for markets to move:

* **Conservative**: 14-30 days
* **Moderate**: 30-60 days
* **Long-term**: 60-90 days

### LTV Settings

Balance opportunity vs. safety:

* Lower Max LTV = more collateral protection
* Higher Max LTV = more matching opportunities

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

1. **Start with a preset**: Use Balanced or Conservative to get well-calibrated parameters
2. **Check the risk preview**: Review estimated yield and warnings before submitting
3. **Enable partial fills**: More matching opportunities across multiple borrowers
4. **Set competitive rates**: Check market for current rates
5. **Diversify**: Spread across multiple loans
6. **Monitor positions**: Use the LTV donut gauge on loan cards to track borrower health
7. **Understand liquidation**: Know how you're protected

## Troubleshooting

### Intent not matching?

* Your min rate may be too high
* Check current market rates
* Consider lowering min rate slightly

### Transaction failed?

* Check ETH balance for gas
* Ensure USDC is approved
* Verify you're on Base Mainnet

### Can't cancel intent?

* Intent may be partially filled
* Check if any matches occurred

## Next Steps

* [Understanding Risk & Liquidation](risk-liquidations.md)
* [Using Lendr AI](lendr-ai.md)
