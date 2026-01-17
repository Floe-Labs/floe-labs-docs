# Developers

Build on Floe. Integrate lending into your dApp, run a solver bot, or build custom hooks.

## Integration Guides

- [Client SDK](../docs/developers/sdk.md) - TypeScript SDK for contract interactions
- [REST/Graph API](../docs/developers/api.md) - Query intents and loans via GraphQL
- [Networks & Contracts](networks.md) - Deployment addresses and configuration

## Run Infrastructure

- [Matcher Operator Guide](../docs/developers/matcher-operators.md) - Run a solver bot and earn fees
- [Liquidation Bot Guide](../docs/developers/liquidation-bot.md) - Monitor and liquidate unhealthy loans

## Extend the Protocol

- [Hooks Developer Guide](../docs/developers/hooks-dev.md) - Build custom loan logic
- [MCP/Agent Integration](../docs/developers/agents-mcp.md) - Connect AI agents to Floe

## Quick Start

```typescript
import { ModularLendingSDK } from '@floe/sdk';

const sdk = new ModularLendingSDK({
  rpcUrl: 'https://mainnet.base.org',
  lendingIntentMatcher: '0x17946cD3e180f82e632805e5549EC913330Bb175',
});

// Get all active loans
const loans = await sdk.lending.getActiveLoans();
```

## Resources

- [GitHub](https://github.com/Floe-Labs)
- [NPM Package](https://www.npmjs.com/package/@floe/sdk)
- [Discord](https://discord.gg/floe)

