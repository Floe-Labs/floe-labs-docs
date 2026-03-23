# Core Concepts

Understanding the key concepts that power the Floe protocol.

## Intents

An **intent** is a signed message expressing what you want to achieve, not how to achieve it.

### Lend Intent

A lender's offer to provide capital:

* **Amount**: How much USDT or USDC to lend / earn on.
* **Min Interest Rate**: Minimum APR you'll accept
* **Max LTV**: Maximum loan-to-value ratio (liquidation threshold)
* **Duration**: Maximum loan duration
* **Expiry**: When the offer expires if not matched

### Borrow Intent

A borrower's request for a loan:

* **Amount**: How much USDC to borrow
* **Collateral**: eg WETH to put up as security
* **Max Interest Rate**: Maximum APR you'll pay
* **Min LTV**: Your target loan-to-value ratio
* **Duration**: How long you want the loan

### Intent Matching

2 options. A. Manually match existing intents. B. Auto matching in which two intents match when:

1. Same market (USDC/WETH)
2. Rate compatible (borrower max ≥ lender min)
3. LTV gap ≥ 8% (borrower's LTV + 8% ≤ lender's max LTV)
4. Duration compatible (borrower ≤ lender)
5. Both intents not expired

## Matchers (Solvers)

**Matchers** are off-chain bots that:

1. Monitor for open intents
2. Find compatible pairs
3. Submit match transactions on-chain
4. Earn commission for successful matches

Floe's matching is permissionless. Anyone can run a matcher. See developers page.

## Isolated Loans

Each loan is **isolated** with its own:

* Principal amount
* Collateral escrow
* Interest rate
* Liquidation threshold
* Duration

Unlike pool-based protocols, **bad debt doesn't spread** between loans, markets or across the protocol.

## Loan-to-Value (LTV)

LTV measures how much you've borrowed relative to your collateral value:

```
LTV = (Loan Value / Collateral Value) × 100%
```

### LTV Zones

| Zone        | Range                                 | Status            |
| ----------- | ------------------------------------- | ----------------- |
| Safe        | Loan LTV Below Liquidation LTV        | Healthy           |
| Buffer      | Loan LTV Within 8% of liquidation LTV | Caution           |
| Danger      | Loan LTV Within 3% of liquidation     | High risk         |
| Liquidation | Loan LTV At or above max LTV          | Can be liquidated |

### Key Parameters

| Parameter         | Value | Description                                          |
| ----------------- | ----- | ---------------------------------------------------- |
| Min LTV Gap       | 8%    | Required gap between origination and liquidation LTV |
| Withdrawal Buffer | 3%    | Cannot withdraw collateral within 3% of liquidation  |
| Liquidation Bonus | 5%    | Incentive for liquidators                            |

## Oracles

Floe uses a **dual-oracle system**:

1. **Chainlink** (Primary): Industry-standard decentralized price feeds
2. **Pyth** (Fallback): High-frequency price updates

### Circuit Breaker

The protocol automatically pauses if:

* Price is stale (>1 hour old)
* Price deviates >15%
* L2 sequencer is down
* Price returns zero

## Grace Period

When a loan reaches its expiry, a **grace period** gives the borrower additional time to repay before the loan becomes eligible for liquidation. The grace period is a protocol-level parameter set by governance.

During the grace period:

* The loan is overdue but **not yet liquidatable**
* Interest continues to accrue
* The borrower can still repay in full

Once the grace period expires, the loan becomes eligible for liquidation.

## Minimum Interest

Every loan enforces a **minimum interest** amount — a floor on the total interest a lender receives, regardless of how short the loan duration or how small the principal. This prevents dust loans or extremely short-term loans from being economically meaningless for lenders.

## Duration Ranges

Intents now support **min and max duration** instead of a single fixed value. A lender can offer "30 to 90 days" and a borrower can request "14 to 60 days" — the matcher selects a compatible duration within the overlap.

This improves matching rates by expanding the set of compatible intent pairs.

## Credit Scores

Floe integrates with [Cred Protocol](https://cred.xyz) to display **on-chain credit scores**. Scores reflect your track record of repaying loans, maintaining healthy collateral, and avoiding liquidations across DeFi.

Credit scores are **informational only** — they don't gate access to any features. They appear as a radar chart on your dashboard and as tier badges (Excellent / Good / Fair / New) in the loan book. See [Credit Scores](../user/credit-scores.md) for details.

## Safe / Multisig Support

Floe works natively inside **Safe{Wallet}** (formerly Gnosis Safe). When connected via a Safe, the app:

* Forces on-chain transaction mode (no off-chain signatures)
* Shows Safe-aware messaging ("Transaction Proposed" instead of "Success")
* Guides co-signers to confirm in the Safe app

## Lendr AI

**Lendr** is an AI assistant that helps you:

* Create intents in natural language
* Monitor loan health
* Get market information
* Understand protocol features

Example: "Borrow 5000 USDC for 30 days at max 6% APR"

## Markets

A **market** defines a loan/collateral token pair. Floe currently has **4 active markets**:

| Market | Loan Token | Collateral Token |
| ------ | ---------- | ---------------- |
| USDC/WETH | USDC | WETH |
| USDC/cbBTC | USDC | cbBTC |
| USDT/WETH | USDT | WETH |
| USDT/cbBTC | USDT | cbBTC |

Markets are created by governance and have their own:

* Default interest rate
* Default LTV
* Protocol fee
* Liquidation incentive

## Summary

| Concept        | Description                                       |
| -------------- | ------------------------------------------------- |
| Intent         | Signed message expressing desired outcome         |
| Matcher        | Bot that matches compatible intents               |
| Isolated Loan  | Per-match escrow with own terms                   |
| LTV            | Loan value ÷ collateral value                     |
| Oracle         | Price feed (Chainlink + Pyth)                     |
| Grace Period   | Buffer time after expiry before liquidation        |
| Min Interest   | Floor interest amount per loan                     |
| Duration Range | Min/max duration for flexible matching             |
| Credit Score   | On-chain creditworthiness via Cred Protocol        |
| Lendr          | AI assistant for the protocol                      |
