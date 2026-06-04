# Quick Start

Get started with Floe in 5 minutes.

Floe Demo: [https://www.loom.com/share/54748b0841f94948bfc959ac0ff58080](https://www.loom.com/share/54748b0841f94948bfc959ac0ff58080)

{% embed url="https://www.loom.com/share/54748b0841f94948bfc959ac0ff58080" %}

## What You'll Need

* A wallet (MetaMask, Rainbow, Coinbase Wallet, etc.)
* ETH and WETH or cbBTC on Base (for gas + collateral if borrowing)
* USDC or USDT on Base (if earning / lending)

## Step 1: Connect Your Wallet

1. Go to [app.floelabs.xyz](https://app.floelabs.xyz)
2. Click **"Connect Wallet"**
3. Select your wallet provider
4. Approve the connection
5. Switch to **Base Mainnet** if prompted

## Step 2: Choose Your Role

### Want to Borrow?

Go to the **Borrow** page to either:

* Browse available Borrow offers and Manually Match OR
* Create a borrow intent with your terms to get matched automatically
* Get matched and receive USDC or USDT

**You'll need**: WETH or cbBTC (e.g.) as collateral

### Want to Lend?

Go to the **Earn** page to:

* Browse Earn offers and manually match; OR
* Create a lend offer with your terms to get automatically matched
* Get matched and earn interest

**You'll need**: USDC or USDT to earn / lend

## Step 3: Create an Intent

### For Borrowers

1. Go to My Intents; Click **"Create Borrow Intent"**
2. Enter:
   * **Amount**: How much USDC or USDT you need
   * **Collateral**: How much WETH to deposit
   * **Max Rate**: Highest APR you'll accept
   * **Duration**: How long you need the loan
3. Set **Matcher Commission** (0.1-2% typical)
4. Approve WETH and submit

<figure><img src="../../.gitbook/assets/Screenshot 2026-02-25 at 8.58.46 AM.png" alt=""><figcaption></figcaption></figure>

###

### For Lenders

1. Click **"Create Loan Book"**
2. Enter:
   * **Amount**: How much USDC or USDT to lend and earn on
   * **Min Rate**: Lowest APR you'll accept
   * **Max LTV**: Maximum loan-to-value ratio
   * **Duration**: Maximum loan length
3. Approve USDC and submit

<figure><img src="../../.gitbook/assets/Screenshot 2026-02-25 at 8.59.29 AM.png" alt=""><figcaption></figcaption></figure>

## Step 4: Get Matched

Once your intent is live:

1. **Solver bots** scan for compatible matches
2. When found, they execute the match on-chain
3. **Borrowers**: Receive USDC automatically
4. **Lenders**: Start earning interest immediately

Check the **My Intents** page to monitor status.

## Step 5: Manage Your Position

### Active Loans

Go to **Loans** to:

* View your active positions
* Monitor loan health (LTV)
* Add collateral if needed
* Repay when ready

<figure><img src="../../.gitbook/assets/Screenshot 2026-02-25 at 8.59.46 AM.png" alt=""><figcaption></figcaption></figure>

### Key Actions



| Action         | Who      | How                              |
| -------------- | -------- | -------------------------------- |
| Repay          | Borrower | Click "Repay" on loan card       |
| Add Collateral | Borrower | Click "Add Collateral"           |
| Cancel Intent  | Anyone   | Click "Cancel" on pending intent |

## Quick Tips

### For Faster Matching

* **Borrowers**: Manually match existing offer from Borrow page; or create intent with competitive rates and matcher commission
* **Lenders**: Manually match existing earn offers or create lend intent and set reasonable min rates and allow partial fills

### For Safety

* Start with small amounts
* Maintain 10%+ buffer below liquidation LTV
* Monitor positions during volatile markets

## Need Help?

* **Docs**: You're here!

## Next Steps

* [Credit for Agents](../agents/credit-for-agents.md)
* [Agent Working Capital](../developers/agent-working-capital.md)
* [Core Concepts](core-concepts.md)
