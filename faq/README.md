# FAQ

Frequently asked questions about Floe. For detailed answers, see [General FAQ](general.md).

## Quick Answers

### How is Floe different from Aave/Compound?
Floe uses direct P2P matches instead of liquidity pools. This means:
- No shared bad debt risk
- Custom terms for each loan
- Better capital efficiency
- AI-assisted lending via Lendr

### How is it different from Morpho?
Floe is intent-first with an open matcher ecosystem. Key differences:
- Solvers compete to match intents
- Deep customization via Hooks
- AI-native features built in
- Per-loan isolation vs optimized pool routing

### Where do fees go?
Protocol fees go to the treasury. In early phases, fees may be subsidized to encourage adoption.

### Can I run a matcher/solver?
Yes! Floe has an open matcher ecosystem:
- Use the SDK and spec to build your solver
- Earn matcher commission on successful matches
- See the [Matcher Operator Guide](../docs/developers/matcher-operators.md)

### What assets are supported?
Currently on Base Mainnet:
- **Loan Token**: USDC
- **Collateral Token**: WETH

Additional markets will be added via governance.

## More Questions

See [General FAQ](general.md) for comprehensive answers about:
- How intents work
- Liquidation mechanics
- Oracle and price feeds
- Fees and commissions
- Security model
