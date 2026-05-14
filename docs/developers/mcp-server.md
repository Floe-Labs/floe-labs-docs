---
icon: plug
---

# MCP Server

Connect any AI agent to Floe's lending protocol using the [Model Context Protocol](https://modelcontextprotocol.io). The MCP server gives agents 36 tools for browsing markets, creating intents, managing loans, executing on-chain transactions, and reasoning about credit before paid calls — all through a standard interface that works with Claude, GPT, LangChain, CrewAI, and any MCP-compatible client.

> **See also:** [Credit REST API](credit-api.md) | [AgentKit Integration](agentkit.md) | [API Keys](api-keys.md)

**npm:** `@floelabs/mcp-server`\
**GitHub:** [Floe-Labs/floe-mcp-server](https://github.com/Floe-Labs/floe-mcp-server)\
**Hosted endpoint:** `https://mcp.floelabs.xyz/mcp`

---

## When to Use What

| | MCP Server | Credit REST API | AgentKit |
|---|-----------|-----------------|----------|
| **Best for** | AI agents (Claude, GPT, LangChain) | Any HTTP client, custom bots | Coinbase AgentKit agents |
| **Auth** | `floe_*` agent key | Wallet signature or `floe_live_*` developer key | Agent's own wallet |
| **Signing** | Returns unsigned txs | Returns unsigned txs | Signs automatically |
| **Language** | Any (MCP protocol) | Any (HTTP) | TypeScript / Python |
| **Setup** | 1 line of config | Direct HTTP calls | npm/pip install |

When building AI agents that need to discover and use Floe tools dynamically, choose the **MCP server**. For direct HTTP integration, the **Credit API** is the right fit. If you're building on Coinbase's agent framework, go with **AgentKit**.

---

## Quick Start

### Get an Agent Key

Each MCP session is scoped to **one Floe agent**. Provision an agent and its `floe_*` key in one of three ways:

1. **Dashboard** — visit [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz), connect your wallet, click **Create Agent**, copy the `floe_*` key shown at the end of the wizard (revealed once).
2. **TypeScript CLI** — `npx floe-agent register --name my-agent --borrow-limit 10000`. The key is stored in your OS keychain and printed once.
3. **Python CLI** — `floe-agent register --name my-agent --borrow-limit 10000`. Same behavior as the TypeScript CLI.

A developer can own multiple agents — see [Multiple Agents](#multiple-agents) below to run several MCP sessions side by side. For key management and security best practices, see [API Keys](api-keys.md).

### Option 1: Remote Endpoint (recommended)

Point your MCP client to the hosted endpoint. No installation needed.

**Claude Desktop / Claude Code:**

```json
{
  "mcpServers": {
    "floe": {
      "url": "https://mcp.floelabs.xyz/mcp",
      "headers": {
        "Authorization": "Bearer floe_YOUR_AGENT_KEY"
      }
    }
  }
}
```

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "floe": {
      "url": "https://mcp.floelabs.xyz/mcp",
      "headers": {
        "Authorization": "Bearer floe_YOUR_AGENT_KEY"
      }
    }
  }
}
```

### Option 2: Local via npx

Run the server locally. It proxies requests to the Floe API — no local database or RPC setup needed. You still need to provide your `FLOE_API_KEY`.

```bash
FLOE_API_KEY=floe_YOUR_AGENT_KEY npx @floelabs/mcp-server --stdio
```

**Claude Desktop config for local stdio:**

```json
{
  "mcpServers": {
    "floe": {
      "command": "npx",
      "args": ["@floelabs/mcp-server", "--stdio"],
      "env": {
        "FLOE_API_KEY": "floe_YOUR_AGENT_KEY"
      }
    }
  }
}
```

### Option 3: Programmatic (MCP Client SDK)

For custom agents, use the MCP client SDK directly:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client({ name: "my-defi-agent" });
await client.connect(new StreamableHTTPClientTransport(
  new URL("https://mcp.floelabs.xyz/mcp"),
  { requestInit: { headers: { "Authorization": "Bearer floe_..." } } }
));

const markets = await client.callTool("get_markets", {});
console.log(markets);
```

### Multiple Agents

One Floe developer can own up to five agents. To run several MCP sessions side by side — for example, a research bot and a trading bot with separate credit lines — provision each agent with its own `floe_*` key and configure one MCP entry per agent:

```json
{
  "mcpServers": {
    "floe-research": {
      "url": "https://mcp.floelabs.xyz/mcp",
      "headers": { "Authorization": "Bearer floe_RESEARCH_AGENT_KEY" }
    },
    "floe-trading": {
      "url": "https://mcp.floelabs.xyz/mcp",
      "headers": { "Authorization": "Bearer floe_TRADING_AGENT_KEY" }
    }
  }
}
```

Each session is scoped to one agent — credit lines, spend limits, and webhook subscriptions stay isolated. Spend caps set in one session don't affect the other.

---

## Tools Reference (36)

### Read Tools

| Tool | Description |
|------|-------------|
| `get_markets` | List active lending markets with rates and liquidity |
| `get_market_details` | Detailed market info including oracle prices and stats |
| `get_open_lend_intents` | Browse lend offers available for borrowing against |
| `get_open_borrow_intents` | Browse borrow requests from borrowers seeking lenders |
| `get_intent_details` | Get full details of a specific intent by offer hash |
| `get_loan` | Get loan details by numeric ID |
| `get_user_loans` | Get all loans for a wallet (as borrower and lender) |
| `get_loan_health` | Check loan LTV, health status, liquidation risk, early repayment terms |
| `get_liquidation_quote` | Get liquidation eligibility and details for an unhealthy loan |
| `get_token_price` | Current oracle price for collateral tokens (Chainlink + Pyth) |
| `get_wallet_balance` | Token balances for a wallet (ETH + all protocol tokens) |
| `get_accrued_interest` | Interest accrued on a loan with full credit status |

### Write Tools

All write tools return **unsigned transactions**. The server never holds private keys. See [Transaction Flow](#transaction-flow) below.

| Tool | Description |
|------|-------------|
| `create_lend_intent` | Create a lending offer. Solver matches it with borrowers. |
| `create_borrow_intent` | Create a borrowing request with collateral. Solver matches with lenders. |
| `create_counter_intent` | Accept an existing offer by creating a matching counter-intent. **Primary way to borrow or lend.** |
| `repay_loan` | Repay a loan with automatic approval and slippage protection |
| `add_collateral` | Add collateral to improve loan health |
| `withdraw_collateral` | Withdraw excess collateral (enforces safety buffer) |
| `liquidate_loan` | Liquidate an unhealthy or overdue loan |
| `revoke_intent` | Cancel an active lend or borrow intent |
| `approve_token` | Pre-approve a token for the protocol (usually automatic) |

### Analysis Tools

| Tool | Description |
|------|-------------|
| `check_compatibility` | Check if two intents (lend + borrow) can match |
| `calculate_risk` | Risk metrics: LTV, liquidation price, buffer, price drop tolerance |
| `estimate_interest` | Estimate total interest for given loan terms |

### Utility Tools

| Tool | Description |
|------|-------------|
| `simulate_transaction` | Dry-run an unsigned transaction via `eth_call`. Returns success/revert and gas estimate. |
| `broadcast_transaction` | Submit a signed transaction to Base Mainnet. Returns hash and receipt. |
| `get_transaction_status` | Check confirmation status of a previously submitted transaction |

### Agent Awareness Tools

Lets an agent answer "do I have credit?", "is this call worth it?", and "where am I in the loan lifecycle?" before committing capital. All require an agent API key (`floe_*`); identity comes from the bearer token, so none of these tools take a wallet address.

| Tool | Description |
|------|-------------|
| `get_credit_remaining` | Available USDC, headroom to auto-borrow, utilization in bps, session-cap state |
| `get_loan_state` | Coarse state: `idle` \| `borrowing` \| `at_limit` \| `repaying` |
| `get_spend_limit` | Currently active session spend cap, if any |
| `set_spend_limit` | Set a session-level USDC ceiling (resets the session window) |
| `clear_spend_limit` | Remove the session spend cap |
| `list_credit_thresholds` | List registered credit-utilization webhook triggers |
| `register_credit_threshold` | Register a webhook trigger at a utilization threshold (cap: 20 per agent) |
| `delete_credit_threshold` | Remove a registered threshold |
| `estimate_x402_cost` | Preflight an x402 URL — returns cost + reflection against your credit (no payment) |

> **Decision-loop pattern:** call `estimate_x402_cost` → check `willExceedAvailable` / `willExceedSpendLimit` → conditionally `proxy/fetch`. This is the "answer the 3 rational-agent questions in one round-trip" workflow. See [Agent Awareness](agent-awareness.md) for the full pattern.

---

## Transaction Flow

Write tools return unsigned transactions — your agent signs them locally and submits.

```text
1. Call write tool (e.g., create_counter_intent)
   → { transactions: [...], summary, warnings, expiresAt }

2. (Optional) simulate_transaction → dry-run each tx

3. Sign each transaction with your wallet

4. broadcast_transaction → submit signed hex, get receipt
   — OR broadcast via your own RPC
```

### Response Format

Every write tool returns this structure:

```json
{
  "transactions": [
    {
      "step": 1,
      "description": "Approve WETH collateral for Floe protocol",
      "transaction": {
        "to": "0x4200000000000000000000000000000000000006",
        "data": "0x095ea7b3...",
        "value": "0x0",
        "chainId": 8453
      },
      "required": true,
      "isApproval": true
    },
    {
      "step": 2,
      "description": "Create borrow intent: 1000 USDC at 8.00% max rate",
      "transaction": {
        "to": "0x17946cD3e180f82e632805e5549EC913330Bb175",
        "data": "0xabcdef...",
        "value": "0x0",
        "chainId": 8453
      },
      "required": true,
      "isApproval": false
    }
  ],
  "summary": "Borrow 1000 USDC against WETH collateral at 8% rate",
  "warnings": ["Collateral locked when solver matches"],
  "expiresAt": 1712000600
}
```

> **Tips:**
> - Skip `isApproval: true` steps if you already have sufficient token allowance
> - Check `expiresAt` — re-call the tool if transactions are stale
> - Always `simulate_transaction` before broadcasting to catch reverts early
> - Submit transactions in order — each must confirm before the next

### Signing with TypeScript (viem)

```typescript
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const account = privateKeyToAccount("0x...");
const wallet = createWalletClient({ account, chain: base, transport: http() });

// response = result from a write tool
for (const { transaction: tx } of response.transactions) {
  const hash = await wallet.sendTransaction({
    to: tx.to as `0x${string}`,
    data: tx.data as `0x${string}`,
    value: BigInt(tx.value),
  });
  // Wait for confirmation before next step
}
```

### Signing with Python (web3.py)

```python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://mainnet.base.org"))
account = w3.eth.account.from_key("0x...")

# response = result from a write tool
for tx_data in response["transactions"]:
    tx = {
        "to": tx_data["transaction"]["to"],
        "data": tx_data["transaction"]["data"],
        "value": int(tx_data["transaction"]["value"], 16),
        "chainId": tx_data["transaction"]["chainId"],
        "gas": w3.eth.estimate_gas({
            "to": tx_data["transaction"]["to"],
            "data": tx_data["transaction"]["data"],
            "from": account.address,
        }),
        "nonce": w3.eth.get_transaction_count(account.address),
        "maxFeePerGas": w3.eth.gas_price * 2,
        "maxPriorityFeePerGas": w3.eth.gas_price,
    }
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    assert receipt.status == 1, f"Transaction failed: {tx_hash.hex()}"
```

---

## End-to-End Example

Here's how an AI agent borrows 1,000 USDC on Floe:

```text
Agent: "I want to borrow 1000 USDC on Floe"

Step 1: Browse available offers
→ get_open_lend_intents({ limit: 10 })
→ Returns list of lend offers with rates, amounts, durations

Step 2: Accept the best offer
→ create_counter_intent({
    offer_hash: "0xabc...",     // from step 1
    wallet_address: "0x123..."  // agent's wallet
  })
→ Returns unsigned approval + borrow intent transactions

Step 3: Simulate before signing
→ simulate_transaction({
    from: "0x123...",
    to: "0x17946...",
    data: "0x..."
  })
→ { success: true, gasEstimate: "185000" }

Step 4: Sign and broadcast
→ Agent signs transactions locally
→ broadcast_transaction({ signed_transaction_hex: "0x..." })
→ { transactionHash: "0xdef...", status: "confirmed" }

Step 5: Solver matches automatically
→ The Floe solver detects the compatible intent pair
→ Loan is created on-chain

Step 6: Monitor the loan
→ get_loan_health({ loan_id: "42" })
→ { currentLtvBps: 6500, isHealthy: true, bufferBps: 2000 }
```

---

## Framework Integration

### LangChain / LangGraph

```python
from langchain_mcp_adapters import MultiServerMCPClient

async with MultiServerMCPClient({
    "floe": {
        "url": "https://mcp.floelabs.xyz/mcp",
        "headers": {"Authorization": "Bearer floe_..."}
    }
}) as client:
    tools = client.get_tools()
    agent = create_react_agent(model, tools)
    result = await agent.ainvoke({
        "messages": [{"role": "user", "content": "Borrow 1000 USDC on Floe"}]
    })
```

### CrewAI

```python
from crewai import Agent, Task, Crew
from crewai_tools import MCPServerAdapter

floe = MCPServerAdapter(
    server_url="https://mcp.floelabs.xyz/mcp",
    headers={"Authorization": "Bearer floe_..."}
)

agent = Agent(
    role="DeFi Trader",
    tools=floe.tools,
    llm="gpt-4o",
)
```

### Custom MCP Client (Node.js)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client({ name: "my-agent" });
await client.connect(new StreamableHTTPClientTransport(
  new URL("https://mcp.floelabs.xyz/mcp"),
  { requestInit: { headers: { "Authorization": "Bearer floe_..." } } }
));

// List tools
const { tools } = await client.listTools();
console.log(`${tools.length} tools available`);

// Call a tool
const result = await client.callTool("get_markets", {});
const markets = JSON.parse(result.content[0].text);
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FLOE_API_KEY` | Yes | — | Your `floe_*` agent key. Mint one in the dashboard or via `floe-agent register`. A `floe_live_*` developer key also works but disables agent-awareness tools. |
| `FLOE_API_BASE_URL` | No | `https://credit-api.floelabs.xyz` | API endpoint (only change for self-hosting) |
| `MCP_PORT` | No | `3100` | HTTP server port (non-stdio mode only) |

---

## Architecture

```text
Your Agent → MCP Server → credit-api.floelabs.xyz → Envio Indexer / Base RPC
                ↑                    ↑
         @floelabs/mcp-server   Private backend
          (open source)        (holds secrets)
```

The MCP server is a thin HTTP client (~20 KB). All protocol logic, indexer queries, and RPC calls happen in the private Floe API backend. The npm package contains only tool definitions and `fetch()` calls — no private keys, no tokens, no database.

---

## Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| LendingIntentMatcher | `0x17946cD3e180f82e632805e5549EC913330Bb175` |
| PriceOracle | `0xEA058a06b54dce078567f9aa4dBBE82a100210Cc` |
| LendingViews | `0x9101027166bE205105a9E0c68d6F14f21f6c5003` |

---

## Next Steps

- [Credit REST API](credit-api.md) — direct HTTP integration without MCP
- [AgentKit Integration](agentkit.md) — Coinbase AgentKit with built-in signing
- [Webhooks](webhooks.md) — get notified when loans are matched, repaid, or at risk
- [API Keys](api-keys.md) — key management and security best practices
