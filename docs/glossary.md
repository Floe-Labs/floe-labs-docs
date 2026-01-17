# Glossary

Key terms and definitions for the Floe protocol.

## A

### APR (Annual Percentage Rate)
The yearly interest rate charged on a loan. In Floe, rates are expressed in **basis points** (bps), where 100 bps = 1%. A loan at 500 bps = 5% APR.

## B

### Basis Points (bps)
A unit of measurement equal to 1/100th of a percent. Used throughout Floe for precision:
- 100 bps = 1%
- 500 bps = 5%
- 8000 bps = 80%

### Borrower
A user who posts collateral to receive a loan. Creates a **Borrow Intent** specifying desired terms.

## C

### Circuit Breaker
An automatic safety mechanism that pauses protocol operations when:
- Oracle prices are stale (>1 hour)
- Price deviation exceeds 15%
- L2 sequencer is down
- Price returns zero or invalid

### Collateral
The asset (WETH) deposited by borrowers to secure their loans. Held in the smart contract until loan repayment or liquidation.

### Condition
An optional oracle-based requirement attached to an intent. For example, "only match if ETH price is below $3000."

## D

### Duration
The maximum length of a loan, specified in seconds. Common durations:
- 30 days = 2,592,000 seconds
- 90 days = 7,776,000 seconds

## E

### EIP-712
A standard for typed structured data hashing and signing. Floe uses EIP-712 for intent signatures, providing human-readable signing prompts.

### EOA (Externally Owned Account)
A standard Ethereum wallet controlled by a private key, as opposed to a smart contract wallet.

### ERC-1271
A standard for smart contract signature validation. Allows DAOs, multisigs, and smart wallets to sign Floe intents.

### Expiry
The timestamp after which an intent can no longer be matched. Expired intents are invalid.

## F

### Fill Amount
The portion of a lend intent that is matched in a single loan. For partial fills, multiple loans can be created from one lend intent.

### Flash Loan
A loan that must be borrowed and repaid within the same transaction. Used for arbitrage and liquidations.

## G

### Governor
The address with permission to:
- Create markets
- Adjust protocol parameters
- Pause/unpause operations
- Upgrade contracts

## H

### Health Factor
A measure of loan safety. Calculated as:
```
Health Factor = Liquidation LTV / Current LTV
```
- Above 1.0 = Healthy
- At or below 1.0 = Liquidatable

### Hook
An optional module that customizes loan behavior at key lifecycle points (creation, repayment, liquidation, etc.).

## I

### Intent
A signed message expressing a user's desired lending or borrowing terms. Intents are matched by solvers to create loans.

### Isolated Loan
A loan with its own collateral escrow and terms, independent of other loans. Unlike pool-based protocols, bad debt doesn't spread.

## L

### Lender
A user who provides USDC to earn interest. Creates a **Lend Intent** specifying minimum acceptable terms.

### Lendr
Floe's AI assistant that helps users interact with the protocol using natural language.

### Liquidation
The process of repaying an unhealthy loan using a third party (liquidator). The liquidator receives the collateral plus a 5% bonus.

### Liquidation LTV
The LTV threshold at which a loan becomes liquidatable. Set by the lender's intent.

### Loan Token
The asset being lent and borrowed. Currently USDC (6 decimals) on Base Mainnet.

### LTV (Loan-to-Value)
The ratio of loan value to collateral value:
```
LTV = (Loan Value / Collateral Value) × 100%
```

### LTV Gap
The required difference between origination LTV and liquidation LTV. Floe requires a minimum 8% gap.

## M

### Market
A trading pair defined by loan token and collateral token. The USDC/WETH market is currently active on Base Mainnet.

### Matcher (Solver)
An off-chain bot that finds compatible intents and submits match transactions. Earns commission for successful matches.

### Matcher Commission
A fee paid by the borrower to the matcher for facilitating the loan. Specified in the borrow intent.

### Multisig
A smart contract wallet requiring multiple signatures to execute transactions. Supported via ERC-1271.

## N

### Nonce
A unique number included in each intent to prevent replay attacks and double-matching.

## O

### Oracle
A service providing off-chain data (like prices) on-chain. Floe uses:
- **Chainlink** (primary)
- **Pyth Network** (fallback)

### Origination LTV
The LTV at loan creation, derived from the borrower's intent. Must be at least 8% below liquidation LTV.

## P

### Partial Fill
A feature allowing a lend intent to be matched multiple times until fully utilized.

### Principal
The amount of loan token (USDC) borrowed, excluding interest.

## R

### Repayment
The borrower pays back principal plus accrued interest to close the loan and reclaim collateral.

## S

### Staleness Timeout
The maximum age (1 hour) for oracle prices. Stale prices trigger the circuit breaker.

### Sequencer
The L2 component that orders transactions. Floe monitors sequencer health and pauses during outages.

## T

### Timelock
A governance mechanism requiring a delay before executing changes. Used for protocol upgrades.

## U

### UUPS (Universal Upgradeable Proxy Standard)
The upgrade pattern used by Floe contracts. Allows bug fixes and improvements while preserving state.

## W

### Withdrawal Buffer
A 3% safety margin below liquidation LTV. Borrowers cannot withdraw collateral that would bring LTV within this buffer.
