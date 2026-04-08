---
icon: rocket
---

# Agent Working Capital Quickstart

Get USDC into your agent's wallet in under a minute.

For a guided setup experience, use the [Developer Dashboard](developer-dashboard.md) at `dev-dashboard.floelabs.xyz` — connect your wallet and follow the 3-step agent wizard.

## Check Live Offers First

See what lenders are offering right now — no auth, no setup:

```bash
curl "https://credit-api.floelabs.xyz/v1/credit/offers"
```

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

## Want Automatic API Payments?

If your agent needs to call x402-enabled APIs, you don't need to manage USDC at all. Delegate your collateral to the x402 facilitator and it handles everything:

```typescript
// One-time setup: delegate collateral
await agentkit.invoke("grant_credit_delegation", {
  facilitatorAddress: "0x...",
  facilitatorUrl: "https://credit-api.floelabs.xyz",
  borrowLimit: "10000",
  collateralToken: "0x4200000000000000000000000000000000000006",
});

// Now call any x402 API — payment is automatic
await agentkit.invoke("x402_fetch", { url: "https://api.example.com/data" });
```

See **[x402 Credit Facilitator](x402-facilitator.md)** for details.

## Next Steps

- **[Developer Dashboard](developer-dashboard.md)** — Manage agents, API keys, and webhooks through a web UI.
- **[API Keys](api-keys.md)** — Generate `floe_live_*` keys for programmatic access without per-request wallet signing.
- **[x402 Credit Facilitator](x402-facilitator.md)** — Pay for any x402 API automatically. Delegate collateral, facilitator handles the rest.
- **[Credit REST API](credit-api.md)** — HTTP endpoints for Python, Rust, or any language.
- **[AgentKit Integration](agentkit.md)** — Full action reference (36 in both TypeScript and Python — full parity as of April 2026).
- **[Agent Working Capital](agent-working-capital.md)** — Deep dive into credit facility design, supported markets, and early repayment terms.
- **Talk to us** — [Discord](https://discord.gg/floelabs) or reach out for pilot access.
