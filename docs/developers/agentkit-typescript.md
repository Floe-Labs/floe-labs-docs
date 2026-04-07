---
icon: js
---

# TypeScript SDK

The `@floe/agentkit-actions` package provides Coinbase AgentKit ActionProviders with **36 total actions** (30 in `FloeActionProvider` + 6 in `X402ActionProvider`) for Node.js / TypeScript environments.

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
import { floeActionProvider } from "@floe/agentkit-actions";

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

Expose all 36 Floe actions as MCP tools:

```bash
npm install @coinbase/agentkit-model-context-protocol @modelcontextprotocol/sdk
```

```typescript
import { AgentKit } from "@coinbase/agentkit";
import { getMcpTools } from "@coinbase/agentkit-model-context-protocol";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { floeActionProvider } from "@floe/agentkit-actions";

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
        "PRIVATE_KEY": "0x...",
        "BASE_RPC_URL": "https://mainnet.base.org"
      }
    }
  }
}
```

### OpenAI Agents SDK

Use the `create-onchain-agent` scaffold:

```bash
npx create-onchain-agent@latest
# Select "OpenAI Agents SDK" as framework
```

Then register `floeActionProvider()` alongside the built-in action providers.

## CLI: `floe-agent`

Interactive conversational agent for testing all 36 actions without writing any framework code.

### Run directly

```bash
cd agentkit-actions
npm run build
npx tsx src/cli/bin.ts
```

### Or install globally

```bash
npm run build
npm link
floe-agent
```

### Setup flow

The CLI prompts for:

1. **Wallet provider** — Private Key (direct) or CDP Wallet (MPC managed)
2. **AI provider** — OpenAI (GPT-4o), Anthropic (Claude), or Ollama (local)
3. **RPC URL** — Custom Base Mainnet RPC (recommended for reliability)

Configuration is saved to `.floe-agent.json` and reused on subsequent runs. API keys are never cached.

### CLI Commands

| Command | Description |
|---------|-------------|
| `help` | Show available commands |
| `wallet` | Display current wallet address |
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
import { FloeActionProvider } from "@floe/agentkit-actions";

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
npm link @floe/agentkit-actions
```

### 2. `file:` protocol

In your consumer's `package.json`:

```json
{
  "dependencies": {
    "@floe/agentkit-actions": "file:../agentkit-actions"
  }
}
```

### 3. `npm pack` (simulates real publish)

```bash
npm run build && npm pack
# In consumer:
npm install ../agentkit-actions/floe-agentkit-actions-0.1.0.tgz
```

## Source Code

GitHub: [Floe-Labs/agentkit-actions](https://github.com/Floe-Labs/agentkit-actions)
