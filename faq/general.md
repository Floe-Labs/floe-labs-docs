# FAQ

Common questions about using Floe.

## General

### What is Floe?

Floe is the **spend layer for AI agents**. You create an agent in the dashboard (Floe provisions a custodial wallet — no seed phrase), fund it with a card or bank transfer, and the agent pays for any x402 API through one Floe proxy endpoint — governed by programmable spend controls. No crypto experience needed.

### What can my agent do today?

* **Onboard walletless** — no MetaMask, no seed phrase, no gas tokens.
* **Get funded with fiat** — card, bank, Apple Pay, Google Pay → USDC.
* **Pay any x402 API** through `POST /v1/proxy/fetch` from a Floe-managed balance.
* **Stay within budget** — per-call, daily, session, per-vendor, and per-team spend controls, enforced server-side. (These govern x402 payments through the proxy, not raw LLM token bills paid with your own provider key.)
* **Reason about spend** — preflight cost and check balance before each call.

### What blockchain is Floe on?

Floe settles on **Base Mainnet** (Chain ID: 8453), an Ethereum Layer 2. Agents don't have to think about this — Floe handles the chain, signing, and gas.

### What does it cost to pay for APIs?

You pay whatever the API charges (deducted from your balance), plus ~1.5% Coinbase fees on fiat funding. Gas is free — Floe sponsors it.

***

## Advanced — on-chain lending (self-custody)

> The questions below cover Floe's **on-chain protocol layer**, used by teams running their own keys. **Borrowing working-capital credit lines — and any associated rate — is in development and not generally available.** Most agent developers should use the walletless spend product above and can skip this section.

### How is the on-chain protocol different from Aave or Compound?

| Feature      | Floe                | Aave/Compound      |
| ------------ | ------------------- | ------------------ |
| Architecture | P2P intent matching | Liquidity pools    |
| Rates        | Negotiated          | Algorithmic        |
| Counterparty | Single (known)      | Pool (anonymous)   |
| Risk         | Isolated per loan   | Shared across pool |
| Terms        | Custom              | Standardized       |

### What markets exist?

Three active markets:

* **USDC/USDC** (same-token) — collateral and loan are both USDC, max LTV 95%, no price-volatility risk.
* **WETH/USDC** — WETH collateral, USDC loan, max LTV 70%.
* **cbBTC/USDC** — cbBTC collateral, USDC loan, max LTV 70%.

***

## Borrowing

### How do I borrow USDC or USDT?

1. Connect wallet with ETH on Base
2. Create a borrow intent with your terms
3. Wait for a lender match
4. Receive USDC or USDT (minus matcher fee)

### What collateral do I need?

You need WETH (Wrapped ETH) or cbBTC (Coinbase Wrapped BTC), depending on which market you choose. Your collateral must be worth more than your loan amount:

* **Minimum**: Enough to meet your specified LTV
* **Recommended**: Extra buffer for price volatility

### What is LTV?

**Loan-to-Value** ratio = Loan Amount / Collateral Value

Example: $5,000 loan with $10,000 collateral = 50% LTV

### What happens if I don't repay on time?

Your loan becomes **overdue** and can be liquidated. A liquidator will pay off your debt and take your collateral.

### Can I repay early?

Yes. Under the default **Flexible** term protection, there's no prepayment penalty — you only pay interest for the time you actually borrowed. Penalty-based and No Prepayment term options are coming in v2.

### Can I add more collateral?

Yes. Go to your loan in the Loans page and click "Add Collateral" to improve your LTV.

***

## Lending

### How do I earn interest?

1. Create a lend intent with your terms
2. Wait for a borrower match
3. Earn interest over the loan duration
4. Receive principal + interest at repayment

### What rates can I expect?

When this on-chain credit product ships, rates will be market-driven and negotiated per loan — set at match time between lender and borrower. Floe does not publish or guarantee a rate. (This surface is on the roadmap, not generally available.)

### Can my lend intent be partially filled?

Yes, if you enable `allowPartialFill`. Your intent can match multiple borrowers until fully filled.

### What if the borrower doesn't repay?

If the borrower's LTV exceeds the liquidation threshold or the loan becomes overdue:

* Liquidators pay off the debt
* You receive full repayment (from liquidator)
* Borrower loses collateral

In rare underwater cases, you may experience bad debt.

***

## Intents

### What is an intent?

An intent is an on-chain declaration of your desired terms. It's not a loan—it's an offer that can be matched.

### How long do intents last?

You set the `expiry` when creating an intent. Common choices:

* 7 days (typical)
* 14 days (patient)
* 24 hours (urgent)

### Can I cancel my intent?

Yes, as long as it hasn't been fully matched. Cancellation returns your deposited collateral (borrowers) or releases your USDC allowance (lenders).

### Why hasn't my intent been matched?

Possible reasons:

* Your rate expectations don't overlap with available counterparties
* Matcher commission is too low (solvers don't find it profitable)
* Not enough market activity
* Duration or LTV incompatibility

Try adjusting your terms to be more competitive.

***

## Loans

### How is interest calculated?

```
Interest = Principal × (rate / 365) × Days
```

The rate is the negotiated per-loan rate set at match time (this on-chain credit surface is on the roadmap, not generally available).

### Can I extend my loan?

Not directly. You would need to repay and create a new borrow intent.

### Can I transfer my loan to someone else?

No. Loans are non-transferable.

### What is the liquidation bonus?

Liquidators receive a **5% bonus** on collateral value as incentive to liquidate unhealthy loans.

***

## Liquidation

### When can my loan be liquidated?

Your loan can be liquidated when:

1. **LTV exceeds threshold**: Your current LTV goes above the liquidation LTV (lender's maxLTV)
2. **Loan is overdue**: Duration has passed and you haven't repaid

### What is the 8% LTV gap?

Floe requires at least 8% gap between:

* **Origination LTV** (your borrowing level)
* **Liquidation LTV** (when liquidation is allowed)

This ensures borrowers have buffer from day one.

### What happens when I'm liquidated?

1. A liquidator pays your debt (principal + interest)
2. The liquidator receives your collateral
3. You lose all collateral but owe nothing more

### Can I prevent liquidation?

Yes:

* Add collateral before reaching threshold
* Repay the loan early
* Monitor prices during volatile markets

***

## Technical

### What is a solver?

A solver (or matcher) is an automated bot that finds and matches compatible intents. Solvers earn the matcher commission.

### What is the circuit breaker?

The circuit breaker pauses protocol operations when oracle data is unreliable (stale, invalid, or deviating too much). It protects users from liquidations based on bad prices.

### Why did my transaction fail?

Common reasons:

* Intent was already matched (race condition)
* Insufficient token allowance
* Circuit breaker active
* Gas price too low
* Contract paused

Check the [Error Codes](../docs/reference/error-codes.md) reference.

### How do I get ETH for gas?

Bridge ETH to Base using:

* [Base Bridge](https://bridge.base.org)
* [Superbridge](https://superbridge.app)
* Centralized exchange withdrawal to Base

***

## Security

### Is Floe audited?

Floe's smart contracts have been audited by Omniscia (November 2025). See the repository's [security policy](https://github.com/Floe-Labs/floe-labs-docs/blob/main/SECURITY.md) for the report and responsible-disclosure process.

### How are my funds protected?

* All loans are overcollateralized
* Dual-oracle system with fallback
* Circuit breaker prevents bad liquidations
* No pool risk (P2P isolation)
* UUPS upgradeable for security patches

### Can I lose money?

On the USDC/USDC working-capital market (the primary product) there is no price risk — the collateral and loan are the same asset, so a position can only fall behind through interest accrual or going overdue. Keep the line repaid or topped up and you keep your deposit.

***

## Fees

### What fees does Floe charge?

Floe currently charges **no protocol fees**. You only pay:

* Interest (to lenders)
* Matcher commission (to solvers)
* Gas (to the network)

### Why am I paying a matcher fee?

The matcher commission incentivizes solvers to match your intent. Without it, your intent might not get matched.

### Can I avoid the matcher fee?

Yes, if you manually match with a counterparty through the UI. But automated solver matching is faster and more reliable.

***

## Getting Help

### Where can I get support?

* **X/Twitter**: [@FloeLabs](https://twitter.com/FloeLabs)
* **Email**: hello@floelabs.xyz

### How do I report a bug?

1. Check if it's a known issue in Discord
2. Report via Discord or email
3. Include transaction hash if applicable

### How do I request a feature?

Share your ideas in Discord or tag us on X. We love hearing from users.

***

## More Questions

### Can my loan be partially liquidated?

Yes, for **solvent loans** (where collateral value exceeds debt). Liquidators can partially liquidate — repaying a portion of the debt and receiving proportional collateral. This reduces your position size rather than closing it entirely. **Underwater loans** (where collateral value is less than debt) must be fully liquidated.

### What markets are available?

The primary market is **USDC/USDC** — deposit USDC, borrow up to 95% as working capital with no price risk (hardcoded 1:1 oracle). Volatile-collateral markets (**USDC/WETH**, **USDC/cbBTC**) are also available at lower LTV.

### Is Floe tracked on DefiLlama?

Yes. Floe's TVL is tracked on DefiLlama.

***

## Glossary

| Term               | Definition                               |
| ------------------ | ---------------------------------------- |
| **APR**            | Annual Percentage Rate - yearly interest |
| **bps**            | Basis points - 100 bps = 1%              |
| **Intent**         | On-chain offer to lend or borrow         |
| **LTV**            | Loan-to-Value ratio                      |
| **Matcher/Solver** | Bot that matches intents                 |
| **Oracle**         | Price data source (Chainlink/Pyth)       |
| **Principal**      | Original loan amount                     |
| **WETH**           | Wrapped ETH (ERC-20 version of ETH)      |
| **cbBTC**          | Coinbase Wrapped BTC (ERC-20 version of BTC) |
