# Changelog

Notable changes and updates to the Floe protocol.

## Version History

### v1.0.0 - Mainnet Launch (January 2025)

**Deployment**: Base Mainnet (Chain ID: 8453)

**Core Features**:
- Intent-based P2P lending
- USDC/WETH market
- Dual-oracle price feeds (Chainlink + Pyth)
- Circuit breaker protection
- Solver-based intent matching
- Liquidation system with 5% bonus

**Contracts**:
- LendingIntentMatcher: `0x17946cD3e180f82e632805e5549EC913330Bb175`

**Apps**:
- Web app at app.floelabs.xyz
- Lendr AI assistant integration
- Solver bot for automated matching
- Liquidation bot for loan monitoring

---

## Contract Updates

### LendingIntentMatcher v1.0.0

Initial deployment with:
- Lend/borrow intent registration
- Intent matching with validation
- Loan lifecycle management
- Collateral operations (add/withdraw)
- Liquidation for unhealthy loans
- UUPS upgradeability

---

## Protocol Parameters

### Current Parameters (v1.0.0)

| Parameter | Value | Description |
|-----------|-------|-------------|
| `minLtvGapBps` | 800 (8%) | Min gap between origination & liquidation LTV |
| `withdrawalBufferBps` | 300 (3%) | Buffer below liquidation for withdrawals |
| `stalenessTimeout` | 3,600 sec | Oracle staleness threshold |
| `maxDeviationBps` | 1,500 (15%) | Max price deviation before circuit breaker |
| `sequencerGracePeriod` | 3,600 sec | Post-recovery wait period |
| `liquidationBonus` | 500 (5%) | Bonus for liquidators |

---

## App Updates

### Web App v1.0.0

- Intent marketplace with filtering
- Loan dashboard
- Collateral management
- Lendr AI chat integration
- Wallet connection (RainbowKit)
- Real-time price updates

### Lendr AI v1.0.0

- Natural language intent creation
- Loan health monitoring
- Market information queries
- Protocol education

---

## SDK Updates

### @floe/sdk v1.0.0

- TypeScript/JavaScript support
- Full contract interaction methods
- TypeChain bindings
- Event listening
- Price utilities

```typescript
import { ModularLendingSDK } from '@floe/sdk';
```

---

## Indexer Updates

### Envio Indexer v1.0.0

- Real-time event indexing
- GraphQL API
- Intent and loan entity tracking
- Aggregated statistics
- Circuit breaker state monitoring

---

## Security Updates

### Audits

*Audit details to be added*

### Bug Bounty

- Program active at security@floelabs.xyz
- Critical: Up to $50,000
- High: Up to $20,000
- Medium: Up to $5,000
- Low: Up to $1,000

---

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

---

## Upcoming

### Planned Features

- Additional markets (new token pairs)
- Enhanced Lendr capabilities
- Mobile app
- Advanced matching algorithms
- Protocol governance

### Roadmap

*Detailed roadmap available in documentation*

---

## Deprecations

### Deprecated in v1.0.0

- Testnet contracts (Base Sepolia) - use mainnet for production
- Legacy SDK versions - update to v1.0.0

---

## Links

- [Contract Addresses](../developers/02-contract-addresses.md)
- [SDK Quick Start](../developers/01-sdk-quick-start.md)
- [GitHub Repository](https://github.com/Floe-Labs/floe-monorepo)
- [Discord Community](https://discord.gg/floe)

---

## Reporting Issues

Found a bug or issue?

1. **Security issues**: security@floelabs.xyz (do not disclose publicly)
2. **General bugs**: GitHub Issues or Discord
3. **Feature requests**: Discord #suggestions

Include:
- Transaction hash (if applicable)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if relevant)
