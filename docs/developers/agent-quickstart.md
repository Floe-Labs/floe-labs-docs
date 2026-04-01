---
icon: rocket
---

# Agent Working Capital Quickstart

Get USDC into your agent's wallet in under a minute.

## Get Your Agent Capital in 3 Steps

```typescript
import { floeActionProvider } from "@floe/agentkit-actions";

// 1. Set up Floe actions
const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [floeActionProvider({ rpcUrl: "https://mainnet.base.org" })],
});

// 2. Borrow USDC instantly
const loan = await agentkit.invoke("instant_borrow", {
  borrowAmount: "5000000000",          // $5,000 USDC
  collateralAmount: "2000000000000000000", // 2 ETH
  maxInterestRateBps: "1200",          // up to 12% APR
  duration: "2592000",                 // 30 days
});
// → loan.loanId, loan.rate, loan.collateralLocked

// 3. Check your loan anytime
const status = await agentkit.invoke("check_credit_status", {
  loanId: loan.loanId,
});
// → status.totalDebt, status.currentLtvBps, status.daysRemaining
```

**Not using AgentKit?** Run the complete [Python example](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/borrow.py) or [TypeScript example](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/borrow.ts) — or use the [Credit REST API](credit-api.md) directly.

## What Just Happened

Floe queried all available lenders on Base, selected the best rate for your amount, and executed the match on-chain. USDC transferred directly to your agent's wallet. Your ETH collateral is held by the protocol's smart contract and returns automatically when you repay. Fixed rate, fixed term, no surprises.

## Markets

| Market | Collateral | Loan Token |
|--------|------------|------------|
| WETH/USDC | ETH | USDC |
| cbBTC/USDC | cbBTC | USDC |

See the [Credit REST API](credit-api.md#markets) for marketIds and token addresses.

## Next Steps

- **[Credit REST API](credit-api.md)** — HTTP endpoints for Python, Rust, or any language. Try `GET /v1/credit/offers` right now with no auth required.
- **[AgentKit Integration](agentkit.md)** — Full reference for all 23+ Floe actions including repayment, renewal, and collateral management.
- **[Agent Working Capital](agent-working-capital.md)** — Deep dive into credit facility design, supported markets, and early repayment terms.
- **Talk to us** — [Discord](https://discord.gg/floelabs) or reach out for pilot access.
