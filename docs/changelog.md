---
icon: swap
---

# Changelog

Notable changes and updates to the Floe protocol.

## Version History

### v1.2.0 - Smart Contract Hardening (February 2026)

**Theme**: Security hardening, new notification channels, and ecosystem integrations.

**Smart Contract Fixes**:

* **Pyth fallback for ETH/USD** — Pyth now used as fallback when Chainlink ETH/USD feed is stale
* **Chainlink validation** — Added validation checks to ETH/USD feed
* **MAX\_LTV\_BPS enforcement** — Off-chain intents now validated against MAX\_LTV\_BPS
* **Exact match enforcement** — When both parties disallow partial fill, exact amount matching is enforced
* **Partial fill griefing prevention** — Off-chain partial fill griefing attack vector closed
* **Replay attack prevention** — On-chain to off-chain intent replay attack prevented
* **MulDiv precision** — Repayment calculations now use MulDiv for improved precision
* **maxTotalRepayment validation** — Underwater liquidations validated against maxTotalRepayment
* **Liquidation Callback Executor** — New contract for executing post-liquidation callbacks
* **EVM size limit fix** — `canMatchLoanIntents` moved to LendingViews to stay within contract size limits
* **Mainnet contract upgrade** — All fixes deployed to Base Mainnet

**New Channels**:

* **Telegram Bot** — LendrBot is now available on Telegram for chatting about positions, creating intents, and getting help
* **X/Twitter Notifications** — LendrBot posts intent summaries and post-match alerts on X
* **Farcaster Mini App** — Floe mini app for Farcaster
* **DefiLlama TVL Tracking** — Floe TVL now tracked on DefiLlama via adapter

***

### v1.1.0 - Intent Creation Overhaul (February 2026)

**Theme**: Guided UX, risk transparency, and multi-market expansion.

**New Features**:

* **Preset Templates** — Conservative, Balanced, and Aggressive presets for both lending and borrowing. Each preset auto-populates rate, LTV, duration, and collateral ratio to well-calibrated defaults. Users can also select Custom to set every parameter manually.
* **Risk Preview Panel** — Real-time risk assessment shown alongside the intent form before submission. Displays LTV risk level (Safe / Moderate / High / Critical), estimated yield or total repayment, collateral liquidation drop %, and contextual warnings.
* **Submit Confirmation Modal** — Pre-submit gate that summarizes all intent parameters and risk metrics. Shows warnings for thin liquidation buffers or aggressive settings before the transaction fires.
* **Duration Bucket Selector** — Predefined duration options (1W, 1M, 3M, 6M, 1Y) replace free-text entry, reducing input errors and improving matching compatibility.
* **Term Protection (Lender)** — Lenders can now configure early repayment terms: Flexible (no penalty, active now), Penalty-based, or No Prepayment. Penalty and no-prepayment options are staged for v2 backend support.
* **Redesigned Loan Cards** — LTV donut gauge visualization, hero stats (current LTV, liquidation LTV, time remaining), stacked action buttons, health-state border accent (green/yellow/orange/red), and expandable details with match info and transaction links.
* **Collateral Ratio Indicator** — Visual gauge on the borrow form showing real-time collateral health relative to the liquidation threshold as users adjust parameters.

**Multi-Market Expansion**:

* 4 active markets: USDC/WETH, USDC/cbBTC, USDT/WETH, USDT/cbBTC
* Market-aware token dropdowns — selecting a loan asset filters collateral options to tokens with active markets, and vice versa
* Auto-detection of market from token pair selection

**Form Validation Improvements**:

* Cross-field validation: min fill amount cannot exceed lend amount
* NaN guards on all numeric inputs
* Duration must be a positive number
* Discriminated union type safety for confirmation modal
* Real-time wallet balance validation with inline error messages

**App Updates**:

* Consolidated market derivation logic for smoother token pair selection
* React Hook Form watch subscription pattern for reliable preset detection
* Enhanced schema validation with Zod refinements

***

### v1.0.0 - Mainnet Launch (January 2025)

**Deployment**: Base Mainnet (Chain ID: 8453)

**Core Features**:

* Intent-based P2P lending
* USDC/WETH market
* Dual-oracle price feeds (Chainlink + Pyth)
* Circuit breaker protection
* Solver-based intent matching
* Liquidation system with 5% bonus

**Contracts**:

* LendingIntentMatcher: `0x17946cD3e180f82e632805e5549EC913330Bb175`

**Apps**:

* Web app at app.floelabs.xyz
* Lendr AI assistant integration
* Solver bot for automated matching
* Liquidation bot for loan monitoring

***

## Contract Updates

### LendingIntentMatcher v1.0.0

Initial deployment with:

* Lend/borrow intent registration
* Intent matching with validation
* Loan lifecycle management
* Collateral operations (add/withdraw)
* Liquidation for unhealthy loans
* UUPS upgradeability

***

## Protocol Parameters

### Current Parameters (v1.0.0)

| Parameter              | Value       | Description                                   |
| ---------------------- | ----------- | --------------------------------------------- |
| `minLtvGapBps`         | 800 (8%)    | Min gap between origination & liquidation LTV |
| `withdrawalBufferBps`  | 300 (3%)    | Buffer below liquidation for withdrawals      |
| `stalenessTimeout`     | 3,600 sec   | Oracle staleness threshold                    |
| `maxDeviationBps`      | 1,500 (15%) | Max price deviation before circuit breaker    |
| `sequencerGracePeriod` | 3,600 sec   | Post-recovery wait period                     |
| `liquidationBonus`     | 500 (5%)    | Bonus for liquidators                         |

***

## App Updates

### Web App v1.0.0

* Intent marketplace with filtering
* Loan dashboard
* Collateral management
* Lendr AI chat integration
* Wallet connection (RainbowKit)
* Real-time price updates

### Lendr AI v1.0.0

* Natural language intent creation
* Loan health monitoring
* Market information queries
* Protocol education

***

## SDK Updates

### @floe/sdk v1.0.0

* TypeScript/JavaScript support
* Full contract interaction methods
* TypeChain bindings
* Event listening
* Price utilities

```typescript
import { ModularLendingSDK } from '@floe/sdk';
```

***

## Indexer Updates

### Envio Indexer v1.0.0

* Real-time event indexing
* GraphQL API
* Intent and loan entity tracking
* Aggregated statistics
* Circuit breaker state monitoring

***

## Security Updates

### Audits

_Audit details to be added_

### Bug Bounty

* Program active at security@floelabs.xyz
* Critical: Up to $50,000
* High: Up to $20,000
* Medium: Up to $5,000
* Low: Up to $1,000

***

## Migration Notes

### From Testnet to Mainnet

If you were testing on Base Sepolia:

1. **New addresses**: Use mainnet contract addresses
2. **Real assets**: Use real USDC and WETH
3. **Network switch**: Connect to Base Mainnet (8453)

### SDK Migration

```typescript
// Update config
const config = {
  rpcUrl: 'https://mainnet.base.org',  // Was sepolia
  lendingIntentMatcher: '0x17946cD3e180f82e632805e5549EC913330Bb175',
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  collateralToken: '0x4200000000000000000000000000000000000006',
};
```

***

## Upcoming

### Planned Features

* Term Protection v2 — penalty-based and no-prepayment enforcement on-chain
* AI Portfolio Agent — Claude-powered portfolio management advisor replacing current chatbot
* Mobile-optimized experience
* Advanced matching algorithms and solver strategies
* Protocol governance and fee distribution

***

## Deprecations

### Deprecated in v1.0.0

* Testnet contracts (Base Sepolia) - use mainnet for production
* Legacy SDK versions - update to v1.0.0

***

## Links

* [Contract Addresses](../developers/02-contract-addresses.md)
* [SDK Quick Start](../developers/01-sdk-quick-start.md)
* [GitHub Repository](https://github.com/Floe-Labs/floe-monorepo)
* [Discord Community](https://discord.gg/floe)

***

## Reporting Issues

Found a bug or issue?

1. **Security issues**: security@floelabs.xyz (do not disclose publicly)
2. **General bugs**: GitHub Issues or Discord
3. **Feature requests**: Discord #suggestions

Include:

* Transaction hash (if applicable)
* Steps to reproduce
* Expected vs actual behavior
* Screenshots (if relevant)
