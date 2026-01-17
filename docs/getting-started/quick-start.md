# Quick Start

Get started with Floe in 5 minutes.

## What You'll Need

- A wallet (MetaMask, Rainbow, Coinbase Wallet, etc.)
- ETH on Base (for gas + collateral if borrowing)
- USDC on Base (if lending)

## Step 1: Connect Your Wallet

1. Go to [app.floelabs.xyz](https://app.floelabs.xyz)
2. Click **"Connect Wallet"**
3. Select your wallet provider
4. Approve the connection
5. Switch to **Base Mainnet** if prompted

## Step 2: Choose Your Role

### Want to Borrow?

Go to the **Borrow** page to:
- Browse available lender offers
- Create a borrow intent with your terms
- Get matched and receive USDC

**You'll need**: ETH as collateral

### Want to Lend?

Go to the **Earn** page to:
- Browse borrower requests
- Create a lend offer with your terms
- Get matched and earn interest

**You'll need**: USDC to lend

## Step 3: Create an Intent

### For Borrowers

1. Click **"Create Borrow Intent"**
2. Enter:
   - **Amount**: How much USDC you need
   - **Collateral**: How much ETH to deposit
   - **Max Rate**: Highest APR you'll accept
   - **Duration**: How long you need the loan
3. Set **Matcher Commission** (0.1-0.5% typical)
4. Approve WETH and submit

### For Lenders

1. Click **"Create Lend Intent"**
2. Enter:
   - **Amount**: How much USDC to lend
   - **Min Rate**: Lowest APR you'll accept
   - **Max LTV**: Maximum loan-to-value ratio
   - **Duration**: Maximum loan length
3. Approve USDC and submit

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
- View your active positions
- Monitor loan health (LTV)
- Add collateral if needed
- Repay when ready

### Key Actions

| Action | Who | How |
|--------|-----|-----|
| Repay | Borrower | Click "Repay" on loan card |
| Add Collateral | Borrower | Click "Add Collateral" |
| Cancel Intent | Anyone | Click "Cancel" on pending intent |

## Quick Tips

### For Faster Matching

- **Borrowers**: Offer competitive rates and matcher commission
- **Lenders**: Set reasonable min rates and allow partial fills

### For Safety

- Start with small amounts
- Maintain 20%+ buffer below liquidation LTV
- Monitor positions during volatile markets

## Need Help?

- **Lendr AI**: Click the chat icon for instant help
- **Docs**: You're here!
- **Discord**: [Join our community](https://discord.gg/floe)

## Next Steps

- [Borrow USDC Guide](../user/borrow.md)
- [Lend USDC Guide](../user/lend.md)
- [Understanding Risk](../user/risk-liquidations.md)
- [Using Lendr AI](../user/lendr-ai.md)
