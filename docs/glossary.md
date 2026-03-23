# Glossary

Key terms for using Floe.

## APR
Annual Percentage Rate — the yearly interest rate on a loan. 5% APR means you pay/earn 5% per year.

## Collateral
The asset (WETH or cbBTC) you deposit to secure a loan. If you can't repay, this gets liquidated.

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
A loan/collateral token pair. Active markets: USDC/WETH, USDC/cbBTC, USDT/WETH, USDT/cbBTC.

## Partial Fill
When an intent is matched for less than its full amount. If `allowPartialFill` is enabled, a single intent can be matched multiple times by different counterparties until fully filled.

## Bad Debt
When a loan's collateral value falls below the outstanding debt. The lender absorbs the loss in this scenario.

## Underwater Loan
A loan where collateral value is less than the debt owed. Underwater loans must be fully liquidated and result in bad debt for the lender.

## Hook
A smart contract callback executed before or after a lending operation. Hooks enable extensibility for custom logic like automated collateral management.

## Condition
A requirement that must be satisfied for a lending operation to proceed. Conditions are checked on-chain as part of hook execution.

## Flash Loan
A loan that is borrowed and repaid within the same transaction. Flash loans require no collateral but must be repaid atomically.

## Health Factor
A measure of how close a loan is to liquidation. Derived from the ratio of current LTV to liquidation LTV — the higher the buffer, the healthier the position.

## Slippage Protection
The `maxTotalRepayment` parameter that caps how much a liquidator or repayer pays, preventing sandwich attacks or unexpected price movements from increasing costs.

## EIP-712
An Ethereum standard for typed structured data hashing and signing. Floe uses EIP-712 for off-chain intent signatures, providing human-readable signing prompts in wallets.

## ERC-1271
A standard for smart contract signature validation. Allows smart contract wallets (like Safe multisigs) to sign and create intents on Floe.

## ERC-4626
A tokenized vault standard. Floe supports ERC-4626 vault wrappers that allow lending positions to be represented as yield-bearing vault shares.

## UUPS
Universal Upgradeable Proxy Standard — the upgrade pattern used by Floe's smart contracts. Allows the protocol to deploy security patches and new features while preserving existing state.

## Sequencer
The L2 (Base) transaction ordering service. Floe's circuit breaker checks sequencer liveness to prevent operations during L2 downtime.

## Domain Separator
An EIP-712 value that binds signatures to a specific contract on a specific chain, preventing cross-chain and cross-contract replay attacks.

## AgentKit
Coinbase's open-source framework that gives AI agents on-chain capabilities. Floe's `@floe/agentkit-actions` package provides 23 protocol actions as an AgentKit ActionProvider, compatible with Vercel AI SDK, LangChain, and MCP.

## Credit Score
An on-chain creditworthiness score computed by [Cred Protocol](https://cred.xyz) based on DeFi lending/borrowing history. Displayed as a radar chart on the Floe dashboard and as tier badges in the loan book. Informational only — does not gate access.

## Grace Period
A configurable window of time after a loan's expiry date during which the borrower can still repay without being liquidated. Once the grace period ends, the loan becomes eligible for liquidation.

## Minimum Interest
A floor on the total interest earned by a lender on any loan. Ensures that short-duration or small-principal loans are still economically worthwhile.

## Safe (Gnosis Safe)
A multi-signature smart contract wallet. Floe supports Safe natively — Safe wallets are detected automatically, forced to on-chain transaction mode, and shown Safe-aware messaging for co-signer confirmation.

## Flash Arbitrage
A strategy that uses a flash loan to exploit price differences between Floe and external DEXs (like Aerodrome) within a single atomic transaction. Executed via a deployed FlashArbReceiver contract.

## Duration Range
An intent parameter specifying minimum and maximum acceptable loan durations instead of a single fixed value. Increases matching flexibility by allowing the matcher to select any duration within the overlapping range of a lend/borrow pair.
