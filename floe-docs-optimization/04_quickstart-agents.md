# Quick Start (Agents)

Get an agent borrowing on Floe in **5 minutes.** This guide assumes you operate an agent (Vapi, Retell, Browserbase, Crew, LangChain, ElizaOS, custom — doesn't matter) and want it to access credit instead of pre-funding its wallet.

> **Five-minute promise.** Install SDK → connect agent → first action call. Real money, Base mainnet, no testnet detour.

---

## What you'll need

- Node.js 18+ (or Python 3.10+)
- An EVM wallet your agent controls (private key, Coinbase CDP, Privy, Turnkey — any of them)
- A small amount of USDC on Base for the first repayment cycle (or pledge collateral — Tier 1)
- An LLM provider key (OpenAI, Anthropic, or whatever your agent uses)

---

## Pick your path

| You want… | Tier | Status | Start here |
|---|---|---|---|
| Borrow against ETH/BTC the agent already holds | **1 — Secured** | LIVE | Step 1 below |
| Get credit at the x402 boundary (no pre-funding) | **3 — Uncollateralized** | Q3 2026 — [join waitlist](https://floelabs.xyz) | [x402 + Deferred Settlement](../agents/x402-deferred-settlement.md) |
| Finance signed merchant receivables | **2 — Receivables** | Q3 2026 — [join waitlist](https://floelabs.xyz) | [Receivables Overview](../receivables/overview.md) |

The rest of this page covers Tier 1 (live).

---

## Step 1 — Install

### TypeScript

```bash
npm install @floe/agentkit-actions
```

### Python

```bash
pip install floe-agentkit-actions
```

Both SDKs expose the same 23 actions. Pick the one that matches your stack.

---

## Step 2 — Connect

### TypeScript (with Coinbase AgentKit)

```ts
import { AgentKit } from "@coinbase/agentkit";
import { floeActionProvider } from "@floe/agentkit-actions";

const agent = await AgentKit.from({
  walletProvider, // your existing wallet provider
  actionProviders: [floeActionProvider()],
});
```

### Python (with LangChain)

```python
from floe_agentkit_actions import floe_tools

tools = floe_tools(wallet=my_wallet)  # Web3 wallet adapter
# Pass `tools` to your LangChain agent
```

### Zero-install — MCP

If your agent supports MCP (Claude Desktop, Cursor, OpenAI Agents SDK), add Floe's hosted MCP server with one line — see [MCP Server](../developers/mcp-server.md).

---

## Step 3 — First action call

The agent's first move is usually `get_markets` to see what's available, then post a borrow intent.

```ts
// 1. Inspect markets
const markets = await agent.run("get_markets");

// 2. Post a borrow intent: 1000 USDC for 14 days against 0.5 WETH
await agent.run({
  action: "post_borrow_intent",
  args: {
    market: "USDC/WETH",
    amount: "1000",
    collateral: "0.5",
    maxRateBps: 800,        // 8% APR cap
    durationDays: 14,
    matcherCommissionBps: 50, // 0.5% to whoever matches
  },
});

// 3. Wait for a solver to match. Or match an existing lend offer directly:
await agent.run("match_intents", { lendIntentHash: "0x...", borrowIntentHash: "0x..." });
```

Once matched, USDC lands in the agent's wallet. The loan shows up under `get_my_loans`.

---

## Step 4 — Manage the loan

Every action your agent might need is exposed:

| Action | When to call |
|---|---|
| `check_loan_health` | On a timer / before risky operations |
| `add_collateral` | If LTV is creeping toward liquidation |
| `repay_loan` | When the agent has earned enough USDC |
| `get_accrued_interest` | To budget repayment |

Full reference: [AgentKit Actions](../developers/agentkit/) (23 actions).

---

## Step 5 — Build credit history

Every loan repaid on time builds the agent's profile in the **Floe Credit Bureau**:

- Repayment performance
- Counterparty quality
- Revenue history
- CoT execution score (when submitted)

That profile becomes the basis for **Tier 3 (uncollateralized) credit** when it launches in Q3. The earlier an agent starts on Tier 1, the higher its limits will be when uncollateralized opens up.

→ [CoT Underwriting & the Credit Bureau](../agents/cot-underwriting.md)

---

## Need real-time conversational debugging?

Tell your agent it has access to LendrBot's Telegram and X handles, or run a query against this doc:

```
GET https://floe-labs.gitbook.io/docs/getting-started/quick-start-agents.md?ask=<question>
```

That endpoint returns a structured answer with citations from these docs — usable as a tool in any agent loop.

---

## Common issues

- **`flash_loan` reverts.** Your wallet is an EOA. Use `flash_arb` (or `deploy_flash_arb_receiver` first) — see [AgentKit Flash Loan Actions](../developers/agentkit/#flash-loan-actions-5).
- **Match never happens.** Your max rate is below market or your matcher commission is 0. Increase the commission first.
- **Liquidation risk.** Set up a `check_loan_health` timer in your agent loop, every 60s minimum during volatile markets.
- **Token approval errors.** Floe's write actions auto-approve with a 1% buffer. If your wallet provider blocks, approve manually first.

---

## Next steps

- [Credit for Agents — full overview](../agents/credit-for-agents.md)
- [The Three Credit Tiers](../agents/three-credit-tiers.md)
- [AgentKit TypeScript SDK](../developers/agentkit/agentkit-typescript.md) · [Python SDK](../developers/agentkit/agentkit-python.md)
- [MCP Server](../developers/mcp-server.md)
- [Run a Solver Bot](../developers/run-solver-bot.md) (earn matcher commissions on agent-to-agent flows)
