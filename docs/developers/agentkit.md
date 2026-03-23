---
icon: robot
---

# AgentKit Integration

Build AI agents that can lend, borrow, match intents, execute flash loans, and manage loans on Floe — using [Coinbase AgentKit](https://docs.cdp.coinbase.com/agent-kit/).

## What is AgentKit?

AgentKit is Coinbase's open-source framework that gives AI agents on-chain capabilities. `@floe/agentkit-actions` is a custom ActionProvider that exposes 23 Floe protocol actions, making Floe a first-class verb alongside "transfer" and "swap" in any AgentKit agent.

Works with any AI framework: Vercel AI SDK, LangChain, OpenAI Agents SDK, or as an MCP server for Claude Desktop and Cursor.

## Installation

```bash
npm install @floe/agentkit-actions @coinbase/agentkit viem zod
```

## Quick Start

```typescript
import { AgentKit } from "@coinbase/agentkit";
import { floeActionProvider } from "@floe/agentkit-actions";

const agentkit = await AgentKit.from({
  walletProvider: myWalletProvider,
  actionProviders: [floeActionProvider()], // defaults to Base Mainnet
});
```

## Actions (23 total)

### Read Actions (8)

| Action | Description |
|--------|-------------|
| `get_markets` | Get info about Floe lending markets (rates, LTV bounds, pause status) |
| `get_loan` | Get detailed loan information (participants, health, time remaining) |
| `get_my_loans` | Get all loans for the connected wallet |
| `check_loan_health` | Check loan health — current LTV vs liquidation threshold |
| `get_price` | Get oracle price for a collateral/loan token pair |
| `get_accrued_interest` | Get interest accrued on a loan |
| `get_liquidation_quote` | Get profit/loss breakdown for liquidating an unhealthy loan |
| `get_intent_book` | Look up an on-chain lend or borrow intent by hash |

### Write Actions (7)

| Action | Description |
|--------|-------------|
| `post_lend_intent` | Post a fixed-rate lending offer (auto-approves token) |
| `post_borrow_intent` | Post a borrow request with collateral (auto-approves collateral) |
| `match_intents` | Match a lend + borrow intent to create a loan |
| `repay_loan` | Repay a loan fully or partially (with slippage protection) |
| `add_collateral` | Add collateral to improve loan health |
| `withdraw_collateral` | Withdraw excess collateral |
| `liquidate_loan` | Liquidate an unhealthy loan |

### Flash Loan Actions (5)

| Action | Description |
|--------|-------------|
| `get_flash_loan_fee` | Get the protocol's flash loan fee (in bps) |
| `estimate_flash_arb_profit` | Simulate a multi-leg arb route via Aerodrome |
| `flash_loan` | Execute a raw flash loan (receiver must be a contract) |
| `flash_arb` | Execute a flash arb via a deployed FlashArbReceiver |
| `get_flash_arb_balance` | Check accumulated profit in a FlashArbReceiver |

### Deploy / Verify Actions (3)

| Action | Description |
|--------|-------------|
| `deploy_flash_arb_receiver` | Deploy a new FlashArbReceiver with pre-flight checks |
| `check_flash_arb_readiness` | Check environment readiness (fee, liquidity, oracle, router) |
| `verify_flash_arb_receiver` | Verify a receiver's owner and immutable config |

## Framework Integrations

### Vercel AI SDK

```typescript
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const tools = await getVercelAITools(agentkit);

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools,
  maxSteps: 10,
  prompt: "Check the health of loan #42",
});
```

### LangChain

```typescript
import { getLangChainTools } from "@coinbase/agentkit-langchain";

const tools = await getLangChainTools(agentkit);
```

### MCP Server (Claude Desktop / Cursor)

Expose all 23 Floe actions as MCP tools:

```bash
npm install @coinbase/agentkit-model-context-protocol @modelcontextprotocol/sdk
```

```typescript
import { getMcpTools } from "@coinbase/agentkit-model-context-protocol";

const mcpTools = await getMcpTools(agentkit);
```

This lets any MCP-compatible client (Claude Desktop, Cursor, etc.) use Floe actions as tools.

## CLI: `floe-agent`

Interactive agent for testing all 23 actions without writing framework code:

```bash
cd agentkit-actions
npm run build
npx tsx src/cli/bin.ts
```

The CLI prompts for wallet provider (Private Key or CDP), AI provider (OpenAI, Anthropic, or Ollama), and RPC URL. Configuration is saved to `.floe-agent.json` for reuse.

### Example Session

```
You: Check flash arb readiness
  -> Shows fee, WETH liquidity, circuit breaker, SwapRouter status

You: Deploy a FlashArbReceiver for me
  -> Pre-flight checks, deploys contract, stores address in session

You: Execute a flash arb: borrow 0.01 WETH, swap WETH -> USDC tick spacing 100, then USDC -> WETH tick spacing 100, min profit 0
  -> Submits the flash arb transaction
```

## Wallet Providers

| Provider | Use Case | Setup |
|----------|----------|-------|
| `CdpV2WalletProvider` | **Production** (recommended) | CDP API credentials |
| `CdpSmartWalletProvider` | **Gasless on Base** | CDP Smart Wallet API |
| `ViemWalletProvider` | **Development** | `PRIVATE_KEY` env var |

## Source Code

GitHub: [Floe-Labs/agentkit-actions](https://github.com/Floe-Labs/agentkit-actions)
