---
icon: js
---

# TypeScript SDK

The `floe-agent` package provides Coinbase AgentKit ActionProviders with **54 total actions** (30 in `FloeActionProvider` + 24 in `X402ActionProvider` — delegation, x402 payment, agent-awareness, merchant-allowlist, and Floe Inference) for Node.js / TypeScript environments.

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

Wrap this provider's actions (30 with `floeActionProvider()` alone, 54 with `x402ActionProvider()` too) as MCP tools in Claude Desktop / Cursor. For the hosted server and its 80 tools — including agent lifecycle, key minting, and `x402_pay` — use [MCP Server](mcp-server.md) instead; it needs no wallet provider.

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

The package's CLI is the **`floe-agent`** bin: the SDK's command tree — agent lifecycle, keys, policies, limits, payments, observability — plus the interactive REPL whose `run` subcommand drives all 54 actions (30 Floe + 24 x402) through an LLM.

> The `floe` bin name belongs to the standalone platform CLI, [`@floelabs/cli`](https://github.com/Floe-Labs/floe-cli) (`npx @floelabs/cli init`) — the full platform surface (setup, agents, keys, budgets, policies, billing, funds, phone, vendor actuals, metered calls; 33 commands), documented at [Floe CLI](cli.md). This package's CLI is invoked as `floe-agent` — the AgentKit-companion CLI for the agent-runtime SDK; since v0.6.1 it ships **only** that bin, and the commands below are otherwise unchanged. The interactive lending REPL (`floe-agent run`, the historical default) is lazy-loaded — management commands never pay its startup cost under `npx`.

### Install

```bash
npm install -g floe-agent     # installs the `floe-agent` bin
                              # or: npm run build && npm link
```

### Conventions

Written for scripts and agents first, humans second.

- **`--json` on every command.** Prints the raw API JSON to stdout — no spinner, no color, nothing else on stdout.
- **Exit codes:** `0` ok · `1` error · `2` usage · `4` auth required · `5` payment required (402). Usage is validated *before* credentials, so a malformed command exits `2` whether or not a key is set.
- **Never prompts when it is not a TTY.** Missing input exits `2` with usage instead of blocking; destructive prompts are skipped under `--json` or a non-interactive shell.
- **`NO_COLOR` respected.**
- **`User-Agent: floe-cli/<version>`** on every request to the Credit API.
- **Keys are printed exactly once**, at mint or rotate time, and stored in the OS keychain. The CLI never echoes a key it did not just mint.
- **`floe-agent pay` always sends an `Idempotency-Key`** (auto-generated UUID unless you pass one). The auto-generated UUID protects retries within a single invocation only — a rerun mints a fresh UUID. To rerun safely after a timeout or unknown outcome, pass the same `--idempotency-key` again.

### Authentication

| Variable | What it holds |
|---|---|
| `FLOE_API_KEY` | Management credential — a `floe_live_…` developer key or a `floe_…` agent key |
| `FLOE_AGENT_KEY` | Optional `floe_…` agent-key override used by the payment commands |
| `FLOE_API_URL` | Credit API base URL (default `https://credit-api.floelabs.xyz`) |
| `PRIVATE_KEY` | Wallet key — EIP-191 signature-auth fallback, plus the legacy wallet flows and the REPL |

Two credential planes resolve independently:

**Management commands** (`status`, `agents`, `keys`, `policy`, `limit`, `allowlist`, `balance`, `fund`, `usage`, `activity`, `webhooks`) resolve in order:

1. `FLOE_API_KEY`
2. the key stored by `floe-agent auth set-key` (OS keychain)
3. EIP-191 wallet-signature headers when `PRIVATE_KEY` is set

**Payment commands** (`pay`, `estimate`, `forecast`) resolve in order:

1. `FLOE_AGENT_KEY`
2. the active agent's key from the OS keychain
3. `FLOE_API_KEY` when it is a `floe_` agent key

None of the above → exit `4` with a pointer to the dashboard.

```bash
floe-agent auth status --json          # which credential each plane would use
floe-agent auth set-key floe_live_...  # store the developer key in the OS keychain
```

> **Keychain storage.** Agent keys are kept in the OS credential store (macOS Keychain, Windows Credential Manager, Linux Secret Service) under `<agentName>@<facilitatorUrl>`; the developer key is stored under `@developer`. On headless machines without a session keyring the CLI falls back to environment variables — `FLOE_AGENT_KEY_<NAME>__<HOST>` (or the legacy `FLOE_AGENT_KEY_<NAME>`) — and prints a one-time warning that the secret is not persisted.

### Platform commands

#### Setup & status

| Command | What it does |
|---|---|
| `floe-agent status [--json]` | One-shot probe: verifies the credential, reads `GET /v1/capabilities`, and prints a balance snapshot. Falls back to the agent plane when only a runtime key is present. |
| `floe-agent auth status \| set-key [key] [--json]` | Report or store the developer key. Non-TTY `set-key` requires the key as an argument. |
| `floe-agent mcp install [--json]` | Runs `npx -y add-mcp https://mcp.floelabs.xyz/mcp`; on failure prints the manual MCP JSON config and the `claude mcp add` one-liner. Configs carry the URL only, never a key. |
| `floe-agent skills install [--json]` | Installs the `floe-budget` skill to `./.claude/skills/floe-budget/SKILL.md` and `~/.agents/skills/floe-budget/SKILL.md`. Idempotent. |

#### Agents & runtime keys (developer key)

| Command | What it does |
|---|---|
| `floe-agent agents create --name <name> [--borrow-limit <usd>] [--max-rate-bps <n>] [--expiry-days <n>] [--json]` | `POST /v1/developer/agents` — provisions the managed wallet and the on-chain delegation; the account's first agent also receives the **$3 welcome credit**. Prints the agent id and deposit address. Omit `--borrow-limit` for the pay-as-you-go default. |
| `floe-agent agents list [--json]` | Every agent on the account, from the API. |
| `floe-agent agents get\|pause\|resume\|close <agentId> [--json]` | Agent detail, the per-agent kill-switch, and permanent close. |
| `floe-agent agents [--json]` | Bare `agents` lists the **local** registry from `.floe-agent.json` (back-compat) — use `floe-agent agents list` for the server view. |
| `floe-agent agents keys create <agentId\|name> [--budget <usd>] [--window-seconds <s>] [--label <l>] [--json]` | Mints a `floe_…` runtime key. Plaintext is shown once and stored in the keychain. `--budget` sets a fail-closed rolling per-key cap. |
| `floe-agent agents keys rotate <agentId\|name> [--key-id <id>] [--label <l>] [--json]` | Atomic revoke + mint. The replacement key is shown once. |
| `floe-agent agents keys revoke <agentId\|name> [--key-id <id>] [--json]` | Revokes a runtime key immediately. |
| `floe-agent keys create\|list\|rotate\|revoke [keyId] [--label <l>] [--permissions read\|read_write] [--json]` | Developer (`floe_live_…`) keys on `/v1/developer/keys`. |
| `floe-agent fund <agentId> [--json]` | The funding handoff: prints the dashboard link where the human adds money by card, Apple Pay, Google Pay, or bank transfer, plus the machine-readable settlement contract (deposit address, chain `8453`, `USDC`) for programmatic treasuries. The agent hands this to a human; it never moves money itself. |

#### Guardrails

| Command | What it does |
|---|---|
| `floe-agent limit get\|set\|clear [<usd>] [--agent <id>] [--json]` | Session spend cap. `--agent` takes a **numeric** agent id and is required when using developer credentials. |
| `floe-agent policy list [--agent <id>\|--team] [--include-revoked] [--json]` | Spend policies for one agent or the team. `--include-revoked` also returns retired rows. |
| `floe-agent policy set --kind <task\|api\|vendor\|session> --match <key> (--limit <usd> \| --limit-raw <raw>) [--match-kind <k>] [--window-kind once\|rolling] [--window-seconds <s>] [--label <l>] [--action block\|suspend_agent] [--agent <id>\|--team] [--json]` | Create a policy. `kind=session` is team-scope only — the per-agent equivalent is `floe-agent limit set`. |
| `floe-agent policy delete <policyId> [--agent <id>\|--team] [--json]` | Remove a policy. |
| `floe-agent policy reset <policyId> [--agent <id>] [--json]` | Reset a policy's accrued window. Not available on team policies — delete and re-create instead. |
| `floe-agent allowlist mode [off\|host\|vendor\|both] [--agent <id>] [--json]` | Read or set merchant-allowlist enforcement. |
| `floe-agent allowlist add <host\|payee> [--kind api\|vendor] (--limit <usd> \| --limit-raw <raw>) [--match-kind host_exact\|host_suffix\|recipient] [--agent <id>] [--json]` | Add an allowed-and-capped entry. Allowlist entries are always capped. |
| `floe-agent allowlist remove <policyId> [--agent <id>] [--json]` · `floe-agent allowlist list [--agent <id>] [--json]` | Remove or list entries. |

Semantics for every cap and window live in [Spend Controls](spend-controls.md).

#### Spending (agent key)

| Command | What it does |
|---|---|
| `floe-agent estimate <url> [--method <M>] [--json]` | `POST /v1/x402/estimate` — price one call and reflect it against available credit. Nothing is spent. |
| `floe-agent forecast <url> [<url>…] [--count <n per url>] [--task-id <id>] [--json]` | `POST /v1/x402/forecast` — batch cost projection + policy preflight for a plan of up to 50 calls. |
| `floe-agent pay <url> [--method <M>] [--body <raw>] [--header "K: V"]… [--task-id <id>] [--idempotency-key <k>] [--json]` | `POST /v1/proxy/fetch` — Floe pays the vendor and returns its response plus the `X-Floe-*` metering headers. Exit `5` on `402`. `--header` repeats. |
| `floe-agent balance [--json]` | Developer rollup with a developer key; the agent's own balance with a runtime key. |

#### Observability

| Command | What it does |
|---|---|
| `floe-agent models [--json]` | The Floe Inference model catalog (`GET /v1/models`). |
| `floe-agent usage [--json]` | Spend/usage analytics summary for the account. |
| `floe-agent activity [--limit <n>] [--json]` | Unified activity feed — proxy calls, transfers, onramps, loan events. |
| `floe-agent webhooks create --url <https-url> --events <e1,e2> [--scope global\|wallet\|loan --scope-value <v>] [--description <d>] [--json]` | Register a webhook. The signing secret is returned once. |
| `floe-agent webhooks list [--json]` · `floe-agent webhooks test\|rotate-secret\|deliveries <webhookId> [--json]` | List, send a signed test delivery, rotate the secret, inspect deliveries. |

Event catalog and signature verification: [Webhooks](webhooks.md).

### A full bootstrap, headless

```bash
export FLOE_API_KEY=floe_live_...

floe-agent status --json                                    # exit 4 if the key is bad
AGENT_ID=$(floe-agent agents create --name research-bot --json | jq -r .agentId)
AGENT_KEY=$(floe-agent agents keys create "$AGENT_ID" --budget 5 --json | jq -r .key)

floe-agent limit set 5 --agent "$AGENT_ID"                  # session cap
floe-agent policy set --kind api --match api.exa.ai --limit 2 \
  --window-kind rolling --window-seconds 86400 --agent "$AGENT_ID"

export FLOE_AGENT_KEY="$AGENT_KEY"
floe-agent estimate https://api.exa.ai/contents --method POST --json
floe-agent pay https://api.exa.ai/contents --method POST \
  --body '{"urls":["https://example.com"],"text":true}' --json
```

Exit `5` from that last command means a `402` — inspect the JSON error before reacting. `insufficient_balance` means the balance is exhausted: run `floe-agent fund "$AGENT_ID"` and hand the output to a human. `spend_limit_exceeded` or `policy_exceeded` means the caps set above tripped — a guardrail doing its job, which calls for a human or policy decision, not funding.

### Agent-workflow subcommands

| Command | Purpose |
|---|---|
| `floe-agent run [--agent <name>]` | Interactive REPL. Default when no subcommand is given. Uses `--agent`, then `activeAgent`, then a single registered agent. |
| `floe-agent register --name <name>` | Provision a new Floe agent (server-managed Privy wallet + on-chain delegation) and mint a `floe_*` key. The key is stored in your OS keychain and printed once. Optional: `--borrow-limit <usdc>`, `--max-rate-bps <n>`, `--expiry-days <n>`, `--facilitator-url <url>`. |
| `floe-agent agents` | List registered agents and whether each has its API key in the keychain. |
| `floe-agent use <name>` | Set the active agent (persisted in `.floe-agent.json`). |
| `floe-agent rotate <name>` | Atomically rotate the agent's API key — old key revoked + new key minted in one transaction. New key replaces the keychain entry. |
| `floe-agent revoke <name>` | Revoke the agent's API key server-side and remove the local keychain entry. |
| `floe-agent open-credit-line --name <name> --deposit <usdc>` | Open the USDC/USDC credit line for a previously-registered agent. Floe server-signs the borrow intent from the agent's Privy wallet (which must already hold the USDC deposit). Flags: `--max-ltv-bps <bps>` (1–9500, default 9500), `--max-rate-bps <bps>`. Optional — only for agents on credit-line funding. Pay-as-you-go agents (the default) pay through `/proxy/fetch` from their funded balance without opening a credit line. |

> **`register` is not the same command as `agents create`.** `floe-agent agents create` is a thin headless API call (developer key, no local wallet or wallet signature, no local state) that provisions the agent only — mint its key separately with `floe-agent agents keys create`. `floe-agent register` is the original wallet-signature flow: it registers the agent, mints the first key, and records it in `.floe-agent.json` so `use`/`rotate`/`revoke` can find it by name. Both remain supported; agents should prefer `agents create` + `agents keys create`.
>
> **Alias routing on `rotate` / `revoke`.** Top-level `floe-agent rotate <name>` and `floe-agent revoke <name>` take the developer-key path when headless credentials resolve, and fall back to the interactive wallet flow otherwise. Interactive `revoke` still asks for confirmation; the explicit `floe-agent agents keys revoke` never prompts. For an agent tracked in the local registry, both honor that record's persisted facilitator URL — `FLOE_API_URL` overrides it.

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
# (it tracks the package.json `version` field; today that's 0.6.2):
npm install ../agentkit-actions/floe-agent-0.6.2.tgz
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
