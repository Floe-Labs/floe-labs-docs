# Using LendrBotot AI

Lendrbot is Floe's AI assistant that lets you interact with the protocol using natural language in-app on on X @Lendrbot [https://x.com/LendrBot](https://x.com/LendrBot).

## What is LendrBot?

LendrBot is an AI agent that understands DeFi lending and can:

* Create borrow and lend intents
* Query your loans and positions
* Explain market conditions
* Help you understand the protocol
* Execute actions on your behalf

## Where to Access LendrBot

### In-App Chat or on X.com&#x20;

1. Open [app.floelabs.xyz](https://app.floelabs.xyz)
2. Click the **chat icon** in the corner
3. Start typing your request
4. On X.com, either DM or @LendrBot with requests.

## Example Commands

### Borrowing

**Simple borrow request:**

```
"I want to borrow 5000 USDC"
```

Lendr will ask follow-up questions about collateral, rate, and duration.

**Detailed borrow request:**

```
"Borrow $10,000 USDC against 3 ETH at max 7% interest for 30 days"
```

Lendr will create the intent with your exact specifications.

**Check borrowing options:**

```
"What's the best rate I can get to borrow 5000 USDC right now?"
```

Lendr will scan available lend offers and show you options.

### Lending

**Simple lend request:**

```
"I want to lend 10,000 USDC"
```

Lendr will guide you through setting your terms.

**Detailed lend request:**

```
"Create a lend offer for 20,000 USDC at minimum 5% APR, max 75% LTV, for up to 60 days"
```

**Check lending opportunities:**

```
"Show me borrowers looking for USDC loans"
```

### Managing Positions

**Check your loans:**

```
"Show me my active loans"
"What's my current LTV?"
"Am I at risk of liquidation?"
```

**Take action:**

```
"Repay my loan"
"Add 0.5 ETH collateral to my loan"
"Cancel my pending lend intent"
```

### Market Information

**Get market data:**

```
"What's the current ETH price?"
"What are typical lending rates right now?"
"How much liquidity is available for borrowing?"
```

**Understand the protocol:**

```
"How does liquidation work?"
"What's the minimum collateral ratio?"
"Explain the fee structure"
```

## Tips for Using LendrBot

### Be Specific When Possible

The more details you provide, the faster Lendr can help.

❌ "I want a loan" ✅ "I want to borrow 5000 USDC using 2 ETH as collateral for 30 days"

### Ask for Clarification

If you're unsure about something, just ask:

* "What does LTV mean?"
* "Is 70% LTV safe?"
* "What happens if ETH price drops?"

### Confirm Before Executing

Lendr will always show you a summary before executing any transaction:

```
Lendr: "I'll create a borrow intent for:
- Amount: 5,000 USDC
- Collateral: 2 ETH
- Max Rate: 7% APR
- Duration: 30 days

Shall I proceed?"
```

### Use Natural Language

You don't need to use specific commands. Just describe what you want in plain English:

* "Help me earn interest on my USDC"
* "I need to borrow some stablecoins"
* "Check if my loan is healthy"

## What Lendr Can't Do

* **Access your private keys**: Lendr can only request signatures through your wallet
* **Execute without approval**: Every transaction requires your wallet signature
* **Give financial advice**: Lendr provides information, not investment recommendations
* **Guarantee rates**: Market conditions change; rates shown are current but may change

## Conversation Examples

### Example 1: First-Time Borrower

```
You: "I'm new here. I have some ETH and want to borrow USDC."

Lendr: "Welcome! I can help you borrow USDC using your ETH as collateral.
A few questions:
1. How much USDC do you need?
2. How long do you need it for?

Currently, lending rates range from 5-8% APR."

You: "I need about $5,000 for 2 weeks"

Lendr: "Got it. With current ETH price at $3,500, you'd need approximately
2.2 ETH as collateral to maintain a safe 65% LTV.

I found 3 lenders offering rates between 5.5-6.5% for your amount and duration.

Would you like me to:
A) Show you the available offers to match manually
B) Create a borrow intent at 6.5% max rate and let solvers find you a match"

You: "Let's do option B"

Lendr: "Creating borrow intent:
- Borrow: 5,000 USDC
- Collateral: 2.2 ETH
- Max Rate: 6.5% APR
- Duration: 14 days
- Estimated interest: ~$12.47

Please confirm in your wallet to proceed."
```

### Example 2: Checking Loan Health

```
You: "Is my loan safe?"

Lendr: "Let me check your active loans...

You have 1 active loan:
- Borrowed: 5,000 USDC
- Collateral: 2.5 ETH ($8,750 at current price)
- Current LTV: 57.1%
- Liquidation LTV: 80%
- Liquidation Price: $2,500/ETH

✅ Your position is healthy with a 23% buffer before liquidation.

ETH would need to drop 28.5% from current price to trigger liquidation."

You: "What if ETH drops to $3,000?"

Lendr: "At $3,000/ETH:
- Collateral value: $7,500
- LTV: 66.7%

Still safe, but buffer reduces to 13.3%. Consider adding collateral
if you're concerned about further drops."
```

## Privacy & Security

* **No data storage**: Lendr doesn't store your conversation history
* **Wallet signatures**: All actions require your explicit approval
* **Read-only queries**: Checking balances and positions doesn't require signatures
* **On-chain transparency**: All transactions are visible on the blockchain

## Troubleshooting

### Lendr isn't responding

* Refresh the page
* Check your internet connection
* Try clearing browser cache

### Lendr doesn't understand my request

* Try rephrasing with more specific details
* Break complex requests into smaller steps
* Use simpler language

### Transaction failed after Lendr created it

* Check you have enough ETH for gas
* Verify you're on Base Mainnet
* Ensure token approvals are in place

## Feedback

Help us improve Lendr:

* Use the thumbs up/down buttons on responses
