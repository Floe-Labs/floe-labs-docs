---
icon: hand-holding-circle-dollar
---

# How to Borrow

Borrow USDT or USDC using collateral eg cbBTC or WETH as collateral on Floe.

## Overview

Borrowing on Floe works through **intents**:

1. You can either manually MATCH an existing intent in the Borrow Page or CREATE a borrow intent with your desired terms
2. Solvers match you with compatible lenders
3. You receive USDC or USDT, your collateral eg cbBTC or WETH is held as collateral
4. Repay principal + interest to get your collateral back

## Before You Start

**You'll need:**

* ETH on Base (for collateral + gas)
* Wallet connected to Base Mainnet

**Understand:**

* Your collateral eg cbBTC or WETH is locked until you repay
* If collateral price drops significantly, you may be liquidated
* Interest accrues daily until repayment

## Step-by-Step Guide

### 1. Go to Borrow Page

Navigate to [app.floelabs.xyz](https://app.floelabs.xyz) and click **Borrow**.

### 2. Review Available Offers

The marketplace shows lender offers with:

* **Amount Available**: USDC you can borrow
* **Interest Rate**: APR you'll pay
* **Max LTV**: Liquidation threshold
* **Duration**: Maximum loan length

### 3. Choose a Preset (Recommended)

Floe offers **preset templates** to help you get started with well-calibrated parameters:

| Preset           | Collateral Ratio | Max Rate | Duration | Risk Level                   |
| ---------------- | ---------------- | -------- | -------- | ---------------------------- |
| **Conservative** | Higher           | Lower    | Shorter  | Lower risk, more collateral  |
| **Balanced**     | Moderate         | Moderate | Moderate | Good trade-off               |
| **Aggressive**   | Lower            | Higher   | Longer   | Less collateral, higher cost |
| **Custom**       | You set          | You set  | You set  | Full control                 |

Select a preset to auto-populate all fields, then adjust individual parameters if needed. The form starts in **Custom** mode by default.

### 4. Set Your Borrow Intent Parameters

Click **"Create Borrow Intent"** and enter:

| Field                         | Description                                               | Example    |
| ----------------------------- | --------------------------------------------------------- | ---------- |
| Borrow Amount                 | USDC or USDT you need                                     | 5,000 USDC |
| Collateral                    | WETH or cbBTC to deposit                                  | 2.0 WETH   |
| Max Interest Rate             | Highest APR you'll accept                                 | 8%         |
| Duration                      | Loan length (1W, 1M, 3M, 6M, or 1Y)                       | 1M         |
| Matcher Commission (optional) | Fee to incentivize solvers to match you with best intents | 0.3%       |
| Expiry                        | How long intent stays active                              | 7 days     |

#### Market-Aware Token Selection

Token dropdowns are filtered by available markets. For example, selecting **USDC** as your borrow asset automatically filters the collateral dropdown to show only tokens with active USDC markets (WETH, cbBTC). This prevents incompatible token combinations.

#### Duration Buckets

Select from predefined duration options: **1 Week, 1 Month, 3 Months, 6 Months, or 1 Year** (7, 30, 90, 180, 365 days). These standard durations improve matching compatibility since lenders also pick from the same set.

### 5. Review Risk Preview

Before submitting, the **Risk Preview** panel shows a real-time assessment:

* **LTV Risk Level** — Safe, Moderate, High, or Critical badge based on your collateral ratio
* **Collateral Ratio Indicator** — Visual gauge showing how your LTV compares to the liquidation threshold
* **Liquidation Price Drop** — How much collateral price must fall before liquidation (e.g., "35% drop to liquidation")
* **Estimated Total Repayment** — Principal + estimated interest at your max rate and duration
* **Warnings** — Alerts for aggressive settings (e.g., thin liquidation buffer, high LTV)

This updates live as you adjust any parameter, so you can experiment with different collateral amounts and rates to find your comfort zone.

### 6. Understand Your Terms

Before submitting, review:

```
Your Intent:
├── Borrowing: 5,000 USDC
├── Collateral: 2.0 WETH (~$7,000 at $3,500/ETH)
├── Your LTV: 71%
├── Max Rate: 8% APR
├── Duration: 1 Month
└── Matcher Fee: 0.3% ($15)
```

### 7. Approve and Submit

1. Click **"Approve WETH"** (first time only)
2. Confirm in your wallet
3. Click **"Create Intent"**
4. **Review the Confirmation Modal** — a summary of all parameters, risk level, estimated repayment, liquidation buffer, and any warnings appears before the transaction fires
5. Click **"Confirm"** to sign the transaction

<figure><img src="../../.gitbook/assets/Screenshot 2026-01-17 at 15.29.23.png" alt="" width="288"><figcaption></figcaption></figure>

<figure><img src="../../.gitbook/assets/Screenshot 2026-01-17 at 15.30.49.png" alt=""><figcaption></figcaption></figure>

### 8. Wait for Match

Your intent is now live. Solvers will match you when they find a compatible lender. This typically happens within minutes.

Check status in **My Intents**.

### 9. Loan Active

Once matched:

* You receive USDC or USDT (minus matcher fee)
* Your collateral (WETH or cbBTC) is locked
* Interest starts accruing
* View your loan in **Loans** page — each loan card shows an **LTV donut gauge**, **hero stats** (current LTV, liquidation threshold, time remaining), and a **health-state border** (green/yellow/orange/red)

## Understanding LTV

**Loan-to-Value (LTV)** = Loan Amount ÷ Collateral Value

```
Example:
- Loan: $5,000 USDC
- Collateral: 2 ETH × $3,500 = $7,000
- LTV: $5,000 ÷ $7,000 = 71%
```

### The 8% Gap Rule

Floe requires at least 8% gap between your borrow LTV and liquidation LTV:

* If lender's max LTV is 80%, your borrow LTV must be ≤ 72%
* This ensures you have buffer from day one

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

<figure><img src="../../.gitbook/assets/Screenshot 2026-01-17 at 15.31.50.png" alt=""><figcaption></figcaption></figure>

### Steps to Repay

1. Go to **Loans** page
2. Find your active loan
3. Click **"Repay"**
4. Approve USDC or USDT if needed
5. Confirm transaction
6. Your collateral is returned

<figure><img src="../../.gitbook/assets/Screenshot 2026-01-17 at 15.31.31.png" alt=""><figcaption></figcaption></figure>

### Early Repayment

You can repay anytime — no prepayment penalty under the default **Flexible** term. You only pay interest for time used.

> **Note:** Lenders may set term protection options in the future (penalty-based or no-prepayment terms). Currently, all loans use Flexible repayment terms. Check your loan details for the applicable early repayment terms.

## Managing Your Position

### Add Collateral

If collateral price drops, protect yourself:

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

* A liquidator pays your debt
* They receive your collateral + 5% bonus
* You lose your collateral but owe nothing more

### Prevention

* Maintain 20%+ buffer below liquidation LTV
* Add collateral when markets are volatile
* Set price alerts for ETH
* Repay before due date

## Cost Breakdown

| Fee                         | Amount                                       | Paid To |
| --------------------------- | -------------------------------------------- | ------- |
| Interest                    | Negotiated APR                               | Lender  |
| Matcher Commission optional | 0.1-5% of loan depending on borrower setting | Solver  |
| Gas                         | \~$0.10-0.30                                 | Network |

**Example total cost for $5,000 loan at 6% for 30 days:**

* Interest: $24.66
* Matcher fee (0.3%): $15
* Gas: \~$0.20
* **Total: \~$40**

## Tips for Borrowers

1. **Start with a preset**: Use Conservative or Balanced to get safe defaults
2. **Check the risk preview**: Watch the liquidation price drop % — aim for 25%+ buffer
3. **Start conservative**: Borrow less than max, keep loan LTV low
4. **Watch the market**: Monitor collateral price using the LTV donut gauge on your loan card
5. **Set reminders**: Don't forget your due date
6. **Use Lendr**: Ask the AI for help managing your loan
7. **Keep USDC ready**: Have repayment funds available

## Troubleshooting

### Intent not matching?

* Your max rate may be too low
* Increase matcher commission
* Check market activity

### Transaction failed?

* Check ETH balance for gas
* Ensure WETH is approved
* Verify you're on Base Mainnet

### Can't add collateral?

* Check WETH approval
* Verify you have enough ETH

## Next Steps

* [Understanding Risk & Liquidation](risk-liquidations.md)
* [How to Lend](lend.md)
* [Using Lendr AI](lendr-ai.md)
