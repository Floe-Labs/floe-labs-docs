# Quick Start (Agents)

Get an agent borrowing on Floe in **5 minutes.** Post WETH or cbBTC as collateral, borrow USDC at a fixed rate. Gas-free for agents using the x402 facilitator.

---

## What you'll need

- Node.js 18+ (or Python 3.10+)
- An EVM wallet your agent controls (private key, Coinbase CDP, Privy, Turnkey — any of them)
- WETH or cbBTC on Base for collateral

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

## Step 3 — Borrow

The fastest path is `instant_borrow` — it auto-selects the best available lender and matches in one call:

```ts
// Borrow 1,000 USDC against 0.5 WETH, max 8% APR, 14 days
const result = await agent.run("instant_borrow", {
  marketId: "USDC/WETH",
  borrowAmount: "1000000000",       // 1,000 USDC (6 decimals)
  collateralAmount: "500000000000000000", // 0.5 WETH (18 decimals)
  maxInterestRateBps: "800",        // 8% APR cap
  duration: "1209600",              // 14 days in seconds
});
// → { loanId, rate, collateralLocked, usdcReceived }
```

Or browse available offers first with `request_credit`, then match a specific one with `manual_match_credit`.

Once matched, USDC lands in the agent's wallet. The loan shows up under `get_my_loans`.

---

## Step 4 — Manage the loan

| Action | When to call |
|---|---|
| `check_loan_health` | On a timer / before risky operations |
| `check_credit_status` | See accrued interest, time to expiry, early repay costs |
| `add_collateral` | If LTV is creeping toward liquidation |
| `repay_credit` | When the agent has earned enough USDC |
| `repay_and_reborrow` | Rollover into a new loan in one call |

Full reference: [AgentKit Actions](../developers/agentkit.md) (36 actions).

---

## Common issues

- **Match never happens.** Your max rate is below market or your matcher commission is 0. Increase the commission first.
- **Liquidation risk.** Set up a `check_loan_health` timer in your agent loop, every 60s minimum during volatile markets.
- **Token approval errors.** Floe's write actions auto-approve with a 1% buffer. If your wallet provider blocks, approve manually first.
- **`flash_loan` reverts.** Your wallet is an EOA. Use `flash_arb` (or `deploy_flash_arb_receiver` first) — see [Flash Loans](../developers/flash-loans.md).

---

## Next steps

- [Credit for Agents](credit-for-agents.md) — full overview
- [AgentKit TypeScript SDK](../developers/agentkit-typescript.md) · [Python SDK](../developers/agentkit-python.md)
- [x402 Credit Facilitator](../developers/x402-facilitator.md) — zero-tx API payments
- [MCP Server](../developers/mcp-server.md)
