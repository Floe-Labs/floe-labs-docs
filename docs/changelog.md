---
icon: swap
---

# Changelog

Notable changes and updates to the Floe protocol.

## Version History

### v1.4.0 — Unified Developer Platform + Upgrade #12 (April 2026)

**Theme**: The operator pattern — agents grant a scoped on-chain permission and the facilitator handles everything else. This is the foundation for the x402 credit facilitator: agents never sign intents, never manage loans, never touch EIP-3009. Shipped alongside a unified developer platform (dashboard + API keys + webhooks) consolidating x402-facilitator into the Credit API.

**Unified Developer Platform**:

* **Developer Dashboard** (`dev-dashboard.floelabs.xyz`) — web UI for managing API keys, webhooks, and agents. Sign in with your EVM wallet (SIWE).
* **API Keys** — programmatic access via `floe_live_*` developer keys (no per-request wallet signing). Max 5 active keys per developer.
* **Webhooks** — push notifications for loan events (`loan.health_warning`, `loan.expiry_warning`, `loan.liquidated`, `loan.repaid`) with HMAC-signed payloads, at-least-once delivery, and manual retry.
* **Unified API** — the x402 facilitator was merged into the Credit API at `credit-api.floelabs.xyz`. All endpoints under one base URL, dual auth (`floe_live_*` developer keys + `floe_*` agent keys).
* **Agent Management** — 3-step setup wizard in dashboard (Create Wallet → Deposit & Delegate → Activate), balance/transaction monitoring, graceful winddown.
* **Background Services** — automated credit health monitoring (1 min), delegation expiry detection (5 min), reservation reconciliation (15 s).

**Smart contract upgrade (UUPS #12)**:

* **`setOperator(operator, OperatorPermission)`** — agents grant a scoped, revocable permission. The `OperatorPermission` struct includes `borrowLimit`, `maxRateBps`, `expiry`, and `onBehalfOfRestriction` (which binds borrowed USDC routing to a specific recipient address).
* **`revokeOperator(operator)`** — immediate revocation. Existing loans remain callable for repay/rollover to prevent agent-side griefing.
* **`getOperatorPermission(agent, operator)`** — view the current permission state including running `borrowed` counter.
* **Match-time re-validation** — the matcher re-checks `approved`, `expiry`, `maxRateBps`, `borrowLimit`, and `onBehalfOfRestriction` at every borrow match, so the facilitator provably cannot exceed the agent's constraints.
* **`onBehalfOf` threaded through `BorrowIntent`/`LendIntent` structs** — operator-initiated intents route USDC to the specified address (not the operator).
* Contracts deployed on Base mainnet: matcher proxy remains `0x17946cD3e180f82e632805e5549EC913330Bb175`; new impl at `0x88E52dEfE974fBfD8C542bB727318D76cd3CE1C8`, new LogicsManager at `0x6b6f7D0741E723beAA4777829B34d19849ED00dB`, new LendingCalcLib at `0x51CA3010E1962E0746de14c99B439ACC7557503f`.

**x402 Credit Facilitator (RC-10)**:

* **Agent-facing HTTP proxy** — agents receive an API key after granting operator delegation, then call `POST /v1/proxy/fetch` with any x402 URL. The facilitator auto-borrows USDC on demand, signs EIP-3009 payment authorizations, and returns the API response.
* **Auto-borrow service** — monitors agent credit balance and borrows against delegated collateral when below threshold. Respects `OperatorPermission` constraints on every match.
* **Credit health monitoring** — tracks collateral-to-debt ratios and freezes spending before liquidation risk. Automatically unfreezes when ratios recover.
* **Wind-down flow** — `POST /v1/agents/close` or `revokeOperator` triggers full repayment + collateral return + remaining USDC transfer.
* **Two-step registration** — `POST /v1/agents/pre-register` creates the custodial Privy wallet; developer calls `setOperator` on-chain; `POST /v1/agents/register` verifies and issues the agent API key.

**SSRF hardening (RC-11)**:

* **IP pinning via undici** — outbound proxy fetches resolve the hostname once, validate against RFC1918 / link-local / IMDS / IPv6 ULA / IPv4-mapped IPv6 ranges, and pin the TCP connect to the validated public IP. No TOCTOU window for DNS rebinding attacks.
* **Hardcoded cloud metadata denylist** — `169.254.169.254` and `fd00:ec2::254` explicitly rejected at the DNS layer.
* **`maxRedirections: 0`** — facilitator never follows 30x redirects (classic SSRF bypass path).
* **Typed `CircuitBreakerActiveError`** — replaces fragile error-message string matching with structured 503 responses.

***

### v1.3.0 - AgentKit, Flash Loans & Safe Support (March 2026)

**Theme**: AI agent integration, flash loan infrastructure, multisig support, and smart contract parameter updates.

**AgentKit Integration**:

* **@floe/agentkit-actions** — 23 AI agent actions for Floe via [Coinbase AgentKit](https://docs.cdp.coinbase.com/agent-kit/). Supports Vercel AI SDK, LangChain, OpenAI Agents SDK, and MCP server for Claude Desktop/Cursor.
* **floe-agent CLI** — Interactive terminal agent for testing all 23 actions without framework code
* **Flash Loan Actions** — `flash_loan`, `flash_arb`, `estimate_flash_arb_profit`, `get_flash_loan_fee`, `get_flash_arb_balance`
* **Deploy Actions** — `deploy_flash_arb_receiver`, `check_flash_arb_readiness`, `verify_flash_arb_receiver`

**Flash Loans**:

* **Flash Loan Support** — Uncollateralized loans borrowed and repaid within a single transaction via `flashLoan()` on LendingIntentMatcher
* **FlashArbReceiver** — Deployable contract for executing flash arbitrage through Aerodrome DEX on Base
* **Pre-Flight Checks** — Automated verification of fee readability, WETH liquidity, circuit breaker status, and SwapRouter availability before deployment

**Credit Scores**:

* **Cred Protocol Integration** — On-chain credit scores displayed on the dashboard as a radar chart and as tier badges (Excellent/Good/Fair/New) in the loan book
* **Shareable Score Cards** — Generate and share credit score card images on X/Twitter and other platforms

**Safe / Multisig Support**:

* **Safe App Manifest** — Floe loads natively inside the Safe{Wallet} App Store
* **safeWallet Connector** — Automatic detection via RainbowKit; Safe wallets bypass WalletConnect
* **On-Chain Mode** — Safe wallets are forced to on-chain transaction mode (no EIP-712 signing)
* **Safe-Aware Messaging** — Submission modals show "Transaction Proposed" with instructions for co-signer confirmation

**Smart Contract Updates**:

* **Grace Period** — Configurable grace period after loan expiry before liquidation is allowed
* **Minimum Interest** — Floor interest amount ensuring lenders receive a minimum return on short-duration or small loans
* **Duration Ranges** — Intents now specify min/max duration instead of a single value, improving matching flexibility
* **Oracle Hardening** — Additional staleness and deviation checks on Chainlink + Pyth feeds

**UX Improvements**:

* **Design System Overhaul** — FLOE-001 through FLOE-012 design tokens, consistent spacing, typography, and color system
* **Loan Book Wizard** — Step-by-step guided flow for creating and matching intents
* **X-Bot Notifications** — LendrBot posts intent summaries and post-match alerts on X/Twitter

***

### v1.2.0 - Smart Contract Hardening (February 2026)

**Theme**: Security hardening, new notification channels, and ecosystem integrations.

**Smart Contract Fixes**

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
* AI Portfolio Agent — autonomous portfolio management via AgentKit
* Mobile-optimized experience
* Advanced matching algorithms and solver strategies
* Protocol governance and fee distribution
* Multi-chain expansion beyond Base

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
