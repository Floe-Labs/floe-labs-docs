---
icon: js
---

# TypeScript SDK

The `floe-agent` package provides Coinbase AgentKit ActionProviders with **47 total actions** (30 in `FloeActionProvider` + 17 in `X402ActionProvider` — delegation, x402 payment, and agent-awareness) for Node.js / TypeScript environments. The next release adds 5 merchant-allowlist actions (52 total).

> **Naming convention:** All action names and parameters in the TypeScript SDK use **camelCase** (e.g., `borrowAmount`, `maxInterestRateBps`). The Python SDK uses **snake_case** for the same fields. Code examples are not interchangeable between SDKs without adjusting case.

> **Live vs roadmap actions.** The live spend-layer actions are the x402 payment, agent-awareness, and spend-control actions. The credit-facility actions (`instantBorrow`, `repayAndReborrow`, `requestCredit`, `manualMatchCredit`, `checkCreditStatus`, `repayCredit`, `renewCreditLine`) belong to the **roadmap** on-chain credit product (self-custody) and are not the live way to fund an agent — see [Quickstart](../getting-started/quickstart.md).

## Installation

```bash
npm install floe-agent @coinbase/agentkit viem zod
```

## Quick Start

```typescript
import { AgentKit } from "@coinbase/agentkit";
import { floeActionProvider } from "floe-agent";

const agentkit = await AgentKit.from({
  walletProvider: myWalletProvider,
  actionProviders: [
    floeActionProvider(), // defaults to Base Mainnet
  ],
});
```

## Framework Integrations

### Vercel AI SDK

```typescript
import { AgentKit } from "@coinbase/agentkit";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { floeActionProvider } from "floe-agent";

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [floeActionProvider()],
});

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
// Pass tools to a LangChain agent
```

### MCP Server (Claude Desktop / Cursor)

Expose the Floe MCP tools (36 today) in Claude Desktop / Cursor:

```bash
npm install @coinbase/agentkit-model-context-protocol @modelcontextprotocol/sdk
```

```typescript
import { AgentKit } from "@coinbase/agentkit";
import { getMcpTools } from "@coinbase/agentkit-model-context-protocol";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { floeActionProvider } from "floe-agent";

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [floeActionProvider()],
});

const mcpTools = await getMcpTools(agentkit);
const server = new McpServer({ name: "floe-lending", version: "1.0.0" });

const transport = new StdioServerTransport();
await server.connect(transport);
```

Configure in Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "floe-lending": {
      "command": "node",
      "args": ["path/to/floe-mcp-server.js"],
      "env": {
        "PRIVATE_KEY": "${PRIVATE_KEY}",
        "BASE_RPC_URL": "https://mainnet.base.org"
      }
    }
  }
}
```

> **Security:** Never hardcode private keys in config files. Use environment variable references (`${PRIVATE_KEY}`) and set the actual key in your shell environment. Never commit keys to version control.

### OpenAI Agents SDK

Use the `create-onchain-agent` scaffold:

```bash
npx create-onchain-agent@latest
# Select "OpenAI Agents SDK" as framework
```

Then register `floeActionProvider()` alongside the built-in action providers.

## CLI: `floe-agent`

Interactive conversational agent + per-agent registration tooling. The `run` subcommand drives all 47 actions (30 Floe + 17 x402) through an LLM; the other subcommands manage Floe agents and their API keys.

### Install

```bash
npm install -g floe-agent     # or: npm run build && npm link
```

### Subcommands

| Command | Purpose |
|---|---|
| `floe-agent run [--agent <name>]` | Interactive REPL. Default when no subcommand is given. Uses `--agent`, then `activeAgent`, then a single registered agent. |
| `floe-agent register --name <name>` | Provision a new Floe agent (server-managed Privy wallet + on-chain delegation) and mint a `floe_*` key. The key is stored in your OS keychain and printed once. Optional: `--borrow-limit <usdc>`, `--max-rate-bps <n>`, `--expiry-days <n>`, `--facilitator-url <url>`. |
| `floe-agent agents` | List registered agents and whether each has its API key in the keychain. |
| `floe-agent use <name>` | Set the active agent (persisted in `.floe-agent.json`). |
| `floe-agent rotate <name>` | Atomically rotate the agent's API key — old key revoked + new key minted in one transaction. New key replaces the keychain entry. |
| `floe-agent revoke <name>` | Revoke the agent's API key server-side and remove the local keychain entry. |
| `floe-agent open-credit-line --name <name> --deposit <usdc>` | Open the USDC/USDC credit line for a previously-registered agent. Floe server-signs the borrow intent from the agent's Privy wallet (which must already hold the USDC deposit). Flags: `--max-ltv-bps <bps>` (1–9500, default 9500), `--max-rate-bps <bps>`. Required AFTER `register` before paid `/proxy/fetch` calls can succeed. |

### Setup flow (for `run`)

The REPL prompts for:

1. **Wallet provider** — Private Key (direct) or CDP Wallet (MPC managed)
2. **AI provider** — OpenAI (GPT-4o), Anthropic (Claude), or Ollama (local)
3. **RPC URL** — Custom Base Mainnet RPC (recommended for reliability)

Configuration is saved to `.floe-agent.json` (wallet type + AI provider + agent registry, **not secrets**). API keys live in the OS keychain (macOS Keychain / Windows Credential Manager / Linux Secret Service) or, when no keyring backend is available, in `FLOE_AGENT_KEY_<UPPER_NAME>` environment variables.

### Multi-agent registry

One developer can register multiple agents (up to 5 per developer). Each gets its own scoped key. Typical flow:

```bash
floe-agent register --name research --borrow-limit 5000
floe-agent register --name trading --borrow-limit 25000
floe-agent agents          # list both
floe-agent use trading     # mark trading as active
floe-agent run             # REPL connects as trading agent
floe-agent run --agent research  # override per session
```

### In-REPL commands

| Command | Description |
|---------|-------------|
| `help` | Show available commands |
| `wallet` | Display current wallet address |
| `agents` | Show registered agents and the active one |
| `config` | Show current configuration |
| `save` | Save current config to `.floe-agent.json` |
| `clear` | Clear conversation history |
| `exit` | Exit the CLI |

### Example Session

```
You: Check flash arb readiness
  -> Shows fee, WETH liquidity, circuit breaker, SwapRouter status

You: Deploy a FlashArbReceiver for me
  -> Pre-flight checks, deploys contract, stores address in session

You: Verify my FlashArbReceiver
  -> Validates owner/LENDING_PROTOCOL/SWAP_ROUTER (no address needed)

You: Execute a flash arb: borrow 0.01 WETH, swap WETH -> USDC tick spacing 100,
     then USDC -> WETH tick spacing 100, min profit 0
  -> Submits the flash arb transaction
```

## Wallet Providers

| Provider | Use Case | Key Management |
|----------|----------|----------------|
| `CdpV2WalletProvider` | **Production** (recommended) | MPC server wallet via CDP API |
| `CdpSmartWalletProvider` | **Gasless on Base** | Smart contract wallet, gas sponsorship |
| `ViemWalletProvider` | **Development** | Raw private key in memory |
| `PrivyWalletProvider` | **Embedded wallets** | Privy delegated/embedded wallets |

> **Note:** Coinbase's [Agentic Wallet](https://docs.cdp.coinbase.com/agentic-wallet/docs/welcome) (CLI/MPC-based, send/trade only) is a different product and is NOT compatible with AgentKit ActionProviders. Floe actions require a full WalletProvider that can sign arbitrary contract calls.

## Configuration

```typescript
floeActionProvider({
  // Base Mainnet (default)
  lendingIntentMatcherAddress: "0x17946cD3e180f82e632805e5549EC913330Bb175",
  lendingViewsAddress: "0x9101027166bE205105a9E0c68d6F14f21f6c5003",

  // Pre-configured market IDs for get_markets without arguments
  knownMarketIds: ["0x..."],
});
```

## Session State

When you deploy via `deploy_flash_arb_receiver`, the contract address is stored on the provider instance. Subsequent calls to `flash_arb`, `get_flash_arb_balance`, and `verify_flash_arb_receiver` auto-use it — no need to pass the address again. Override anytime by passing `receiverAddress` explicitly.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Wallet private key (0x...) |
| `CDP_API_KEY_NAME` | Coinbase CDP API key name |
| `CDP_API_KEY_PRIVATE_KEY` | Coinbase CDP API private key |
| `OPENAI_API_KEY` | OpenAI API key (for CLI) |
| `ANTHROPIC_API_KEY` | Anthropic API key (for CLI) |
| `BASE_RPC_URL` | Custom Base Mainnet RPC URL |

## Examples

### Chatbot (Vercel AI SDK + CdpWalletProvider)

Full conversational agent on Base Mainnet with production MPC-managed keys:

```bash
cd examples
cp .env.example .env  # fill in CDP_API_KEY_NAME, CDP_API_KEY_PRIVATE_KEY, OPENAI_API_KEY
npx tsx chatbot.ts
```

### Standalone (No AI Framework)

Call actions programmatically — useful for development and scripting:

```bash
cd examples
cp .env.example .env  # fill in PRIVATE_KEY
npx tsx standalone.ts
```

```typescript
import { FloeActionProvider } from "floe-agent";

const floe = new FloeActionProvider();
const result = await floe.getMyLoans(walletProvider, {});
console.log(result);
```

## Local Development

Three ways to test without publishing to npm:

### 1. `npm link` (live symlink)

```bash
# In agentkit-actions/
npm run build && npm link

# In your consumer project
npm link floe-agent
```

### 2. `file:` protocol

In your consumer's `package.json`:

```json
{
  "dependencies": {
    "floe-agent": "file:../agentkit-actions"
  }
}
```

### 3. `npm pack` (simulates real publish)

```bash
npm run build && npm pack
# In consumer — substitute the actual tarball name printed by `npm pack`
# (it tracks the package.json `version` field; today that's 0.4.0):
npm install ../agentkit-actions/floe-agent-0.4.0.tgz
```

## Agent Awareness Actions (v0.3.0+)

The `X402ActionProvider` now includes 9 actions that let an agent reason about its own credit before committing capital. Configure `facilitatorApiKey` to enable them:

```typescript
import { x402ActionProvider } from "floe-agent";

const x402 = x402ActionProvider({
  facilitatorUrl: "https://credit-api.floelabs.xyz/v1",
  facilitatorApiKey: process.env.FLOE_AGENT_API_KEY,  // floe_*
});
```

Tool names (the values passed to `@CreateAction({ name: ... })`, exposed to the LLM/MCP client as `snake_case` per Coinbase AgentKit convention — distinct from the camelCase TypeScript class methods that implement them): `get_credit_remaining`, `get_loan_state`, `get_spend_limit`, `set_spend_limit`, `clear_spend_limit`, `list_credit_thresholds`, `register_credit_threshold`, `delete_credit_threshold`, `estimate_x402_cost`. The corresponding class methods are `getCreditRemaining`, `getLoanState`, etc. See [Agent Awareness](agent-awareness.md) for the decision-loop pattern.

## Source Code

GitHub: [Floe-Labs/agentkit-actions](https://github.com/Floe-Labs/agentkit-actions)
