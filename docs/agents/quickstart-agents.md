# Quick Start (Agents)

Get your agent a USDC credit line in **5 minutes.** Deposit USDC, borrow up to 95% instantly, start spending. Gas-free.

---

## What you'll need

- Node.js 18+ (or Python 3.10+)
- An EVM wallet your agent controls (private key, Coinbase CDP, Privy, Turnkey — any signer works)
- USDC on Base (that's it — no ETH needed for gas, Floe sponsors it)

> **Don't have USDC on Base?** Fund via [Coinbase](https://www.coinbase.com), [Bridge](https://bridge.xyz), or any Base bridge. Fiat on-ramp coming soon.

---

## Step 1 — Install

### TypeScript

```bash
npm install floe-agent @coinbase/agentkit viem zod
```

### Python

```bash
pip install floe-agentkit-actions
```

Both SDKs expose the same 36 actions. Pick the one that matches your stack.

---

## Step 2 — Connect

### TypeScript (with Coinbase AgentKit)

```ts
import { AgentKit } from "@coinbase/agentkit";
import { floeActionProvider } from "floe-agent";

const agent = await AgentKit.from({
  walletProvider, // your existing wallet provider
  actionProviders: [floeActionProvider()],
});
```

### Python (with Coinbase AgentKit)

```python
from floe_agentkit_actions import FloeActionProvider

provider = FloeActionProvider()
# Register with your AgentKit agent
```

### Zero-install — MCP

If your agent supports MCP (Claude Desktop, Cursor), add Floe's hosted MCP server — see [MCP Server](../developers/mcp-server.md).

---

## Step 3 — Get working capital

The fastest path is `instant_borrow` — deposits your USDC collateral and borrows against it in one call:

```ts
// Deposit 10,000 USDC as collateral, borrow 9,500 USDC (95% LTV)
const result = await agent.run("instant_borrow", {
  marketId: "USDC/USDC",                // same-token market
  borrowAmount: "9500000000",            // $9,500 USDC (6 decimals)
  collateralAmount: "10000000000",       // $10,000 USDC deposit
  maxInterestRateBps: "800",             // max 8% APR
  duration: "2592000",                   // 30 days
});
// → { loanId, rate, collateralLocked, usdcReceived }
```

USDC lands in your agent's wallet. Done.

> **Have ETH or BTC instead?** Use the WETH/USDC or cbBTC/USDC markets — same `instant_borrow` call, just change the `marketId` and `collateralAmount`.

---

## Step 4 — Manage the credit line

| Action | When to use |
|---|---|
| `check_credit_status` | See balance, accrued interest, time to expiry |
| `repay_credit` | Repay and get your deposit back |
| `repay_and_reborrow` | Roll over into a new loan in one call |
| `add_collateral` | Increase your deposit to extend the credit line |

Full action reference: [AgentKit Actions](../developers/agentkit.md) (36 actions).

---

## Common issues

| Problem | Fix |
|---|---|
| Match never happens | Your max rate is below market. Increase `maxInterestRateBps` or the matcher commission. |
| Token approval errors | Floe's write actions auto-approve with a 1% buffer. If your wallet blocks, approve USDC manually first. |
| Want zero-touch payments | Use the [x402 facilitator](../developers/x402-facilitator.md) — delegate once, then just call `fetch()`. |

---

## Next steps

- [Credit for Agents](credit-for-agents.md) — full overview
- [Agent Quickstart (Developer)](../developers/agent-quickstart.md) — complete happy-path walkthrough
- [x402 Credit Facilitator](../developers/x402-facilitator.md) — zero-touch API payments
- [Credit REST API](../developers/credit-api.md) — HTTP endpoints, no SDK needed
