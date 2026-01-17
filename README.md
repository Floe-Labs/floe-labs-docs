# Introduction

Floe is an **intent-based P2P lending protocol** on **Base Mainnet**. Users create intents specifying their lending or borrowing terms, solvers match compatible pairs, and loans are settled on-chain as isolated contracts.

## Live on Base Mainnet

**App**: [app.floelabs.xyz](https://app.floelabs.xyz)

**Contract**: [`0x17946cD3e180f82e632805e5549EC913330Bb175`](https://basescan.org/address/0x17946cD3e180f82e632805e5549EC913330Bb175)

## Why Floe?

* **Efficiency**: No idle pool capital → tighter spreads, better rates
* **Flexibility**: Custom rates, terms, durations — you set the terms
* **Safety**: Per-loan isolation, overcollateralized, oracle-protected
* **AI-Powered**: Lendr AI assistant for natural language interactions

## How It Works

```
1. Create Intent → Sign your lending or borrowing terms
2. Get Matched  → Solvers find compatible counterparties
3. Loan Settles → Collateral locked, funds transferred
4. Manage       → Repay, add collateral, or let Lendr help
```

## Quick Links

**New Users**
- [Quick Start](docs/getting-started/quick-start.md) — Get started in 5 minutes
- [Borrow USDC](docs/user/borrow.md) — Borrow against your ETH
- [Lend USDC](docs/user/lend.md) — Earn interest on your stablecoins
- [Using Lendr AI](docs/user/lendr-ai.md) — Chat with our AI assistant

**Developers**
- [Client SDK](docs/developers/sdk.md) — TypeScript/JavaScript SDK
- [Networks & Contracts](developers/networks.md) — Contract addresses
- [Matcher Operator Guide](docs/developers/matcher-operators.md) — Run a solver bot

**Protocol**
- [Architecture](docs/protocol/architecture.md) — How Floe works
- [Risk & Liquidation](docs/user/risk-liquidations.md) — Understanding risks

## Current Market

| Asset | Role | Address |
|-------|------|---------|
| USDC | Loan Token | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| WETH | Collateral | `0x4200000000000000000000000000000000000006` |

## Get Help

- **In-App**: Chat with Lendr AI (bottom-right corner)
- **Discord**: [Join our community](https://discord.gg/floe)
- **Twitter**: [@FloeLabs](https://twitter.com/FloeLabs)
