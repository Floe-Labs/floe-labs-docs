# Glossary

Key terms for using Floe.

## APR
Annual Percentage Rate — the yearly interest rate on a loan. 5% APR means you pay/earn 5% per year.

## Collateral
The ETH (WETH) you deposit to secure a loan. If you can't repay, this gets liquidated.

## Intent
A signed message stating your lending or borrowing terms. Gets matched with a compatible counterparty.

## Lender
Someone who provides USDC to earn interest.

## Borrower
Someone who deposits collateral to borrow USDC.

## LTV (Loan-to-Value)
How much you've borrowed vs your collateral value:
```
LTV = Loan Amount / Collateral Value × 100%
```
Higher LTV = higher risk of liquidation.

## Liquidation
When your LTV exceeds the maximum allowed, anyone can repay your loan and take your collateral (plus a 5% bonus).

## Liquidation LTV
The LTV threshold where you can be liquidated. Set by the lender (typically 75-80%).

## Matcher
A bot that finds compatible lend and borrow intents and creates loans. Earns a small commission.

## Oracle
Price feed that tells the protocol the current ETH/USD price. Floe uses Chainlink and Pyth.

## Circuit Breaker
Safety mechanism that pauses the protocol if prices are stale or invalid.

## Lendr
Floe's AI assistant. Chat with it for help creating intents or understanding your loans.

## Market
A loan/collateral token pair. Currently: USDC (loan) / WETH (collateral).
