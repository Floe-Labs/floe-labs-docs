---
icon: plug
---

# MCP Server

Connect any AI agent to Floe using the [Model Context Protocol](https://modelcontextprotocol.io). The server exposes **65 tools** covering the whole lifecycle: provision agents, mint and rotate their keys, set budgets and policies, price a call, **execute the x402 payment**, and watch what the fleet spent. Works with Claude Code, Claude Desktop, Cursor, Codex, LangChain, CrewAI, and any MCP-compatible client.

> **Payments are in MCP now.** `estimate_x402_cost` (or `x402_forecast` for a whole plan) prices the call; `x402_pay` makes it, settles the vendor from the agent's balance, and returns the vendor's response plus the `X-Floe-*` receipt headers. An agent no longer has to leave MCP to spend.
>
> **See also:** [Set up with your AI tools](../getting-started/setup-with-ai-tools.md) | [Floe CLI](cli.md) | [Credit REST API](credit-api.md) | [API Keys](api-keys.md)

**npm:** `@floelabs/mcp-server` (v0.3.0)\
**GitHub:** [Floe-Labs/floe-mcp-server](https://github.com/Floe-Labs/floe-mcp-server)\
**Hosted endpoint:** `https://mcp.floelabs.xyz/mcp`

---

## When to Use What

| | MCP Server | Floe CLI | Credit REST API | AgentKit |
|---|-----------|----------|-----------------|----------|
| **Best for** | AI agents (Claude Code, Cursor, Codex, LangChain) | Shell-driven agents and CI | Any HTTP client, custom bots | Coinbase AgentKit agents |
| **Auth** | `floe_live_*` developer key, `floe_*` agent key, or none (keyless tools) | Same, from `FLOE_API_KEY` | Wallet signature or either key | Agent's own wallet |
| **Signing** | Returns unsigned txs | Returns unsigned txs | Returns unsigned txs | Signs automatically |
| **Language** | Any (MCP protocol) | Any (subprocess) | Any (HTTP) | TypeScript / Python |
| **Setup** | 1 line of config | `npm i -g @floelabs/cli` | Direct HTTP calls | npm/pip install |

When building AI agents that discover and use Floe tools dynamically, choose the **MCP server**. If your agent already shells out, the [**CLI**](cli.md) speaks `--json` with semantic exit codes — `@floelabs/cli` (bin `floe`) is the full platform CLI, covering setup, agents, keys, budgets, policies, billing, funds, phone, and metered calls; the `floe-agent` bin (`npm i -g floe-agent`) is the AgentKit-companion CLI for the agent-runtime SDK. For direct HTTP integration, the **Credit API** is the right fit. If you're building on Coinbase's agent framework, go with **AgentKit**.

---

## Install

### One-liners

```bash
# Universal installer — detects your MCP clients and writes the config
npx -y add-mcp https://mcp.floelabs.xyz/mcp

# Claude Code
claude mcp add --transport http floe https://mcp.floelabs.xyz/mcp \
  --header "Authorization: Bearer YOUR_FLOE_KEY"

# Codex (reads the key from $FLOE_API_KEY at connect time)
codex mcp add floe --url https://mcp.floelabs.xyz/mcp --bearer-token-env-var FLOE_API_KEY
```

One-click install links — the config carries the endpoint URL **only, never a key**:

- Cursor — `cursor://anysphere.cursor-deeplink/mcp/install?name=floe&config=eyJ1cmwiOiJodHRwczovL21jcC5mbG9lbGFicy54eXovbWNwIn0`
- VS Code — [`https://vscode.dev/redirect/mcp/install?name=floe&config=…`](https://vscode.dev/redirect/mcp/install?name=floe&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.floelabs.xyz%2Fmcp%22%7D)

Add the key afterward in the client's own config or environment.

### Which key?

The server is **dual-key aware**. Every tool declares which credential it needs, and a 401 comes back with a remediation hint naming the right key type.

| Key | Format | Unlocks | Get one |
|---|---|---|---|
| Developer key | `floe_live_…` | Developer-key surface (19 tools — lifecycle 12, observability 4, webhooks 3): create/pause/close agents, mint-rotate-revoke agent keys, key budgets, credit lines, funding instructions, balances, activity, usage, webhooks | [Dashboard → Keys](https://dev-dashboard.floelabs.xyz/keys) |
| Agent key | `floe_…` | Runtime (17 tools): `x402_pay`, cost estimates against real credit, spend limits, credit thresholds, merchant allowlist, reputation | `create_agent_key` tool, `floe init`, or the dashboard |
| Either | — | 26 tools: the 24 keyed lending/protocol tools, plus `list_models` and `estimate_inference_cost` | — |
| None | — | `get_markets`, `check_x402_url`, `search_floe_docs` | — |

Running both key types side by side is normal: give the lifecycle session a developer key and each runtime session its agent key (see [Multiple Agents](#multiple-agents)).

### Keyless tier

The server starts and answers without any key. `get_markets`, `check_x402_url`, and `search_floe_docs` return live data; every other tool returns a structured error instead of failing at boot:

```json
{ "error": "AUTH_REQUIRED", "status": 401,
  "message": "get_credit_remaining was called without an API key. Requires an agent key (floe_...).",
  "next": "Get a developer key at https://dev-dashboard.floelabs.xyz, then mint agent keys with create_agent_key. Keyless sessions can still use get_markets, check_x402_url, and search_floe_docs." }
```

Use it to vet a vendor URL's price (`check_x402_url`) or search these docs before anyone signs up.

### Scope params

Narrow what a session can do straight from the URL — useful for read-only reviewers or for keeping the tool list small in context-constrained clients:

```text
https://mcp.floelabs.xyz/mcp?read_only=true          # 36 non-mutating tools
https://mcp.floelabs.xyz/mcp?features=spend,pricing  # 19 tools — the decision loop only
```

Capability groups: `lending`, `spend`, `pricing`, `lifecycle`, `observability`, `payments`, `webhooks`, `docs`. Both params combine, and an unknown feature name simply matches nothing.

### Option 1: Remote Endpoint (recommended)

Point your MCP client to the hosted endpoint. Clients that speak MCP over HTTP
natively — **Cursor** and **Claude Code** — connect with just the URL and an
`Authorization` header. **Claude Desktop's config file is stdio-only**, so it
reaches the same endpoint through the
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote) bridge (needs Node.js).

**Cursor** (`.cursor/mcp.json`), **VS Code**, or any client that takes JSON:

```json
{
  "mcpServers": {
    "floe": {
      "type": "http",
      "url": "https://mcp.floelabs.xyz/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_FLOE_KEY"
      }
    }
  }
}
```

**Claude Code** (CLI):

```bash
claude mcp add --transport http floe https://mcp.floelabs.xyz/mcp \
  --header "Authorization: Bearer YOUR_FLOE_KEY"
```

**Claude Desktop** (`claude_desktop_config.json`, bridged via `mcp-remote`):

```json
{
  "mcpServers": {
    "floe": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.floelabs.xyz/mcp",
        "--header",
        "Authorization:${AUTH_HEADER}"
      ],
      "env": {
        "AUTH_HEADER": "Bearer YOUR_FLOE_KEY"
      }
    }
  }
}
```

> **Why the bridge?** Claude Desktop only launches local (stdio) MCP servers from
> its config file — it can't dial a remote URL there. `mcp-remote` runs as that
> local process and proxies to the hosted endpoint. The `Authorization` value
> lives in `env` because Claude Desktop mishandles spaces inside a `--header`
> argument. On paid plans you can alternatively add the server via
> **Settings → Connectors**.

### Option 2: Local via npx

Run the server locally. It proxies requests to the Floe API — no local database or RPC setup needed. The key comes from the environment, so it never lands in a config file you might commit; omit it and you get the [keyless tier](#keyless-tier).

```bash
FLOE_API_KEY=floe_YOUR_AGENT_KEY npx -y @floelabs/mcp-server --stdio
```

> **`--stdio` is not optional here.** Without it the server starts an HTTP listener on `:3100` and an MCP client that spawned it waits forever. (From v0.3.0 the server also auto-detects a client spawn — stdin is a pipe — but passing the flag is explicit and always correct. `-y` stops npx's install prompt from hanging the client.)

**Claude Desktop / Cursor config for local stdio:**

```json
{
  "mcpServers": {
    "floe": {
      "command": "npx",
      "args": ["-y", "@floelabs/mcp-server", "--stdio"],
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

One Floe developer can own up to five agents. Each agent-key session is scoped to **one agent**, so run one MCP entry per agent — plus, optionally, one developer-key entry for the lifecycle tools:

```json
{
  "mcpServers": {
    "floe-admin": {
      "type": "http",
      "url": "https://mcp.floelabs.xyz/mcp?features=lifecycle,observability,webhooks",
      "headers": { "Authorization": "Bearer floe_live_YOUR_DEVELOPER_KEY" }
    },
    "floe-research": {
      "type": "http",
      "url": "https://mcp.floelabs.xyz/mcp?features=spend,pricing,payments",
      "headers": { "Authorization": "Bearer floe_RESEARCH_AGENT_KEY" }
    },
    "floe-trading": {
      "type": "http",
      "url": "https://mcp.floelabs.xyz/mcp?features=spend,pricing,payments",
      "headers": { "Authorization": "Bearer floe_TRADING_AGENT_KEY" }
    }
  }
}
```

Each session is scoped to one agent — balances, spend limits, and webhook subscriptions stay isolated. Spend caps set in one session don't affect the other. The scope params keep each session's tool list small, which matters when three servers share one context window.

---

## Tools Reference (65)

Sixty-five tools in eight capability groups. The **Group** name is what you pass to `?features=`; **Key** is the credential the tool needs (see [Which key?](#which-key)).

| Group | Tools | What it's for |
|---|---|---|
| [`lifecycle`](#agent-lifecycle-12) | 12 | Provision agents, mint/rotate/revoke their keys, budget each key, open credit lines |
| [`observability`](#funding-and-observability-4) | 4 | Funding instructions, balances, activity feed, usage rollups |
| [`payments`](#payment-execution-1) | 1 | `x402_pay` — the tool that actually spends |
| [`pricing`](#cost-preflight-5) | 5 | Price a call or a whole plan before spending |
| [`spend`](#spend-governance-and-awareness-14) | 14 | Caps, thresholds, merchant allowlist, reputation |
| [`webhooks`](#webhooks-3) | 3 | Push notifications for account events |
| [`docs`](#docs-1) | 1 | Search these docs from inside MCP |
| [`lending`](#advanced-lending-protocol-25) | 25 | On-chain protocol layer (advanced / self-custody) |

### Agent lifecycle (12)

Developer key (`floe_live_…`). The bootstrap path: an agent with a developer key can stand up its whole fleet without a dashboard visit.

| Tool | Description |
|------|-------------|
| `create_agent` | Provision an agent end-to-end: record → managed wallet → sponsored on-chain delegation → welcome credit on the account's first agent. Returns `agentId` and `privyWalletAddress`, **not** a key |
| `list_agents` | Every agent on the account with status, wallets, and limits |
| `get_agent` | One agent's detail: status, deposit address, credit used, 24h call count, session-spend snapshot |
| `pause_agent` | The per-agent kill-switch — every call with that agent's keys fails auth from its next request |
| `resume_agent` | Un-pause a suspended agent (cannot resurrect closed agents or lifecycle-driven suspensions) |
| `close_agent` | Permanently close: repays outstanding loans, sweeps funds back to the developer, disables keys. Irreversible |
| `create_agent_key` | Mint a `floe_…` runtime key for an agent, optionally with a rolling per-key budget. Plaintext returned **once** |
| `rotate_agent_key` | Atomic revoke + mint; the replacement inherits label/permissions unless overridden |
| `revoke_agent_key` | Revoke a runtime key immediately. Irreversible — prefer rotate if the agent must keep running |
| `set_agent_key_budget` | Set/update the fail-closed rolling budget on one key |
| `open_credit_line` | Upgrade a pay-as-you-go agent to a managed credit line against a deposit already in its wallet |
| `get_credit_line_bounds` | Valid deposit/LTV ranges and current balances. Call before `open_credit_line` |

### Funding and observability (4)

Developer key.

| Tool | Description |
|------|-------------|
| `get_funding_instructions` | The funding handoff: the dashboard link where the human adds money by card, Apple Pay, Google Pay, or bank, plus the machine-readable settlement contract (address, chain `8453`, `USDC`, minimums, warnings). Funding is the one step an agent can't do alone |
| `get_balances` | USDC across the developer wallet, every agent wallet, and API credits |
| `get_activity` | Unified activity feed — proxy calls, onramps, transfers, loan events — newest first, cursor-paginated |
| `get_usage_summary` | Spend/usage rollup: KPIs, daily series, top endpoints over a window |

### Payment execution (1)

Agent key (`floe_…`).

| Tool | Description |
|------|-------------|
| `x402_pay` | Execute a paid x402 call through the Floe proxy. Floe pays the vendor in USDC from the agent's balance (subject to spend limits, key budgets, and allowlist) and returns the vendor's response plus the `X-Floe-*` metering headers. Pass `idempotency_key` so a retry can never double-pay |

### Cost preflight (5)

| Tool | Key | Description |
|------|-----|-------------|
| `estimate_x402_cost` | agent | Price one x402 URL and reflect it against the agent's available credit and session cap — no payment |
| `x402_forecast` | agent | Cost projection **and** policy preflight for a plan of up to 50 calls, in one round-trip |
| `check_x402_url` | none | Public probe: is this URL x402-protected, and what does it cost? Use it to vet a vendor before minting keys |
| `list_models` | any | The [Floe Inference](keyless-inference.md) catalog — model ids, modality, context window |
| `estimate_inference_cost` | any | Price a Floe Inference call for a model + usage vector before spending |

> **Decision loop:** `estimate_x402_cost` (or `x402_forecast` for a plan) → check `willExceedAvailable` / `willExceedSpendLimit` → `x402_pay` → read the receipt from the `X-Floe-*` headers. See [Agent Awareness](agent-awareness.md).
>
> **Scope:** these tools account for x402 payments made through the Floe proxy and calls made through Floe Inference, not raw LLM token bills paid with your own provider key.

### Spend governance and awareness (14)

Agent key. Identity comes from the bearer token, so none of these take a wallet address.

| Tool | Description |
|------|-------------|
| `get_credit_remaining` | Spendable USDC now (`available`), borrowing headroom, utilization bps, session-cap state. Gate on `available` |
| `get_loan_state` | Coarse funding state: `idle` \| `borrowing` \| `at_limit` \| `repaying` |
| `get_spend_limit` | The active session cap, or `{ active: false }` |
| `set_spend_limit` | Set/update the session cap (resets the window — earlier spend stops counting) |
| `clear_spend_limit` | Remove the session cap |
| `list_credit_thresholds` | Registered credit-utilization triggers |
| `register_credit_threshold` | Register a credit-utilization threshold (max 20 per agent) |
| `delete_credit_threshold` | Remove a threshold by id |
| `set_allowlist_mode` | Enforcement mode: `off` (default) \| `host` \| `vendor` \| `both` |
| `get_allowlist_mode` | Read the current mode |
| `add_allowlist_entry` | Add an allowed-**and**-capped destination: `kind="api"` (hostname) or `kind="vendor"` (payee wallet) |
| `remove_allowlist_entry` | Revoke an allowlist entry by policy id |
| `list_allowlist` | The agent's allowlist entries and their caps |
| `get_agent_reputation` | Unified credit reputation: 0-100 score, A-E band, confidence, collateral multiplier. 404 until first computed |

### Webhooks (3)

Developer key.

| Tool | Description |
|------|-------------|
| `create_webhook` | Register an endpoint. Returns the signing secret **once**. Max 10 webhooks |
| `list_webhooks` | Registered webhooks with events, scope, and active flag (secrets are never returned) |
| `test_webhook` | Send a signed test delivery to verify connectivity and signature handling |

Event catalog and signature verification: [Webhooks](webhooks.md).

### Docs (1)

No key required.

| Tool | Description |
|------|-------------|
| `search_floe_docs` | Search the Floe documentation index and return matching pages with titles, URLs, and descriptions, ranked by how many query terms hit |

### Advanced lending protocol (25)

> These are the **on-chain protocol layer** (markets, intents, loans), not the live spend product. Borrowing/lending as a developer-facing product is on the roadmap; these tools exist for teams running their own keys on the self-custody path. All write tools return **unsigned transactions** — the server never holds private keys. See [Transaction Flow](#transaction-flow) below.

**Read:**

| Tool | Description |
|------|-------------|
| `get_markets` | List active lending markets with rates and liquidity (**no key required**) |
| `get_open_lend_intents` | Browse lend offers available for borrowing against |
| `get_open_borrow_intents` | Browse borrow requests from borrowers seeking lenders |
| `get_intent_details` | Full details of a specific intent by offer hash |
| `get_loan` | Loan details by numeric ID |
| `get_user_loans` | All loans for a wallet (as borrower and lender) |
| `get_loan_health` | Loan LTV, health status, liquidation risk, early repayment terms |
| `get_token_price` | Current oracle price for collateral tokens (Chainlink + Pyth) |
| `get_wallet_balance` | Token balances for a wallet |
| `get_accrued_interest` | Interest accrued on a loan with full status |

**Write** (return unsigned transactions):

| Tool | Description |
|------|-------------|
| `create_lend_intent` | Create a lending offer. Solver matches it with borrowers |
| `create_borrow_intent` | Create a borrowing request with collateral. Solver matches with lenders |
| `create_counter_intent` | Accept an existing offer by creating a matching counter-intent |
| `repay_loan` | Repay a loan with automatic approval and slippage protection |
| `add_collateral` | Add collateral to improve loan health |
| `withdraw_collateral` | Withdraw excess collateral (enforces safety buffer) |
| `liquidate_loan` | Liquidate an unhealthy or overdue loan |
| `revoke_intent` | Cancel an active lend or borrow intent |
| `approve_token` | Pre-approve a token for the protocol (usually automatic) |

**Analysis & utility:**

| Tool | Description |
|------|-------------|
| `check_compatibility` | Check if two intents (lend + borrow) can match |
| `calculate_risk` | Risk metrics: LTV, liquidation price, buffer, price-drop tolerance |
| `estimate_interest` | Estimate total interest for given loan terms |
| `simulate_transaction` | Dry-run an unsigned transaction via `eth_call`. Returns success/revert and gas estimate |
| `broadcast_transaction` | Submit a signed transaction to Base Mainnet. Returns hash and receipt |
| `get_transaction_status` | Confirmation status of a previously submitted transaction |

---

## Input schemas

Every argument the lifecycle, funding, payment, webhook, and docs tools accept. Amounts marked *raw USDC* are 6-decimal integer strings (`"5000000"` = $5) sent as strings, never numbers. Agent ids are the numeric ids returned by `create_agent` / `list_agents`, passed as strings.

### Lifecycle

```text
create_agent            name             string   required  1-64 chars, [A-Za-z0-9 _-]
                        borrow_limit_raw string   optional  raw USDC; omit for pay-as-you-go
                        max_rate_bps     integer  default 1500   1-10000
                        expiry_seconds   integer  default 7776000 (90d)  60 … 31536000

list_agents             — no arguments —

get_agent               agent_id         string   required  numeric id
pause_agent             agent_id         string   required
resume_agent            agent_id         string   required
close_agent             agent_id         string   required  irreversible

create_agent_key        agent_id         string   required
                        label            string   optional  ≤100 chars
                        budget_raw       string   optional  raw USDC, positive
                        window_seconds   integer  optional  60 … 31536000 (rolling window)

rotate_agent_key        agent_id         string   required
                        key_id           integer  required  positive
                        label            string   optional  omit to inherit

revoke_agent_key        agent_id         string   required
                        key_id           integer  required

set_agent_key_budget    agent_id         string   required
                        key_id           integer  required
                        budget_raw       string   required  raw USDC, positive (0 is invalid — revoke instead)
                        window_seconds   integer  optional  60 … 31536000

open_credit_line        agent_id         string   required
                        deposit_raw      string   required  raw USDC, positive
                        max_ltv_bps      integer  optional  1 … 9500
                        max_rate_bps     integer  optional  1 … 10000

get_credit_line_bounds  agent_id         string   required
```

### Funding & observability

```text
get_funding_instructions  agent_id  string  required

get_balances              — no arguments —

get_activity              agent_id  string    optional  scope to one agent
                          type      string[]  optional  one or more of: x402_call, onramp_purchase,
                                                        onramp_sweep, transfer_deposit,
                                                        transfer_withdrawal, transfer_external,
                                                        facility_loan_match, facility_loan_repay,
                                                        facility_loan_rollover, facility_loan_failed
                          limit     integer   optional  1-100 (server default 50)
                          since     string    optional  ISO-8601 lower bound
                          until     string    optional  ISO-8601 upper bound
                          cursor    string    optional  from the previous page

get_usage_summary         window    string    optional  24h | 7d | 30d | all  (server default 7d)
                          agent_id  string    optional
```

> Both closed sets are enforced server-side — an unlisted `type` or `window` is a `400`, not a silent fallback.

### Payment & preflight

```text
x402_pay          url              string   required  http/https
                  method           string   optional  GET | POST | PUT | PATCH | DELETE | HEAD | OPTIONS (default GET)
                  headers          object   optional  string→string, forwarded to the vendor
                                                      (payment/framing headers are stripped server-side)
                  body             string   optional  raw body — JSON-encode it yourself
                  idempotency_key  string   optional  1-255 chars; a replay returns the cached
                                                      response instead of paying again

x402_forecast     items            array    required  1-50 planned calls, each:
                    url       string   required  the planned x402 URL
                    method    string   optional  uppercase, 3-7 chars (default GET)
                    count     integer  optional  repeats of this URL (default 1, max 10000)
                    task_id   string   optional  1-128 chars, for task-scoped policy preflight

check_x402_url    url              string   required  http/https  (no key required)
```

### Webhooks

```text
create_webhook    url          string    required  https endpoint, ≤2048 chars
                  events       string[]  required  ≥1 event name, validated server-side. Catalog:
                                                   loan.health_warning, loan.expiry_warning,
                                                   loan.liquidated, loan.repaid, agent.created,
                                                   key.created, key.rotated, x402.first_settlement
                  scope        string    default "global"   global | wallet | loan
                  scope_value  string    conditional  required for wallet (address) and loan (numeric
                                                      id); rejected for global
                  description  string    optional  ≤256 chars

list_webhooks     — no arguments —

test_webhook      webhook_id   integer   required  positive, from list_webhooks
```

### Docs

```text
search_floe_docs  query  string   required  1-200 chars, e.g. "spend limit webhook"
                  limit  integer  default 10   1-25
```

### Error shape

Failures preserve the backend's HTTP status so an agent can tell `401` from `404` from `429`:

```json
{ "error": "insufficient_balance", "status": 402,
  "message": "Credit line exhausted",
  "next": "…remediation, on 401/403 only…" }
```

`error` is the Credit API's own error code, passed through unchanged — the same codes the [Error Codes](../reference/error-codes.md) reference lists.

On `401`/`403` the `next` field names the key type the tool actually wanted. Cross-field mistakes (a `global` webhook with a `scope_value`, a `vendor` allowlist entry whose `match_key` is a hostname) fail locally as `INVALID_ARGUMENT` before any round-trip. Full matrix: [Agent Runtime Contract](agent-runtime-contract.md).

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
| `FLOE_API_KEY` | No | — | A `floe_…` agent key (runtime tools) or a `floe_live_…` developer key (lifecycle tools). Omit it for the [keyless tier](#keyless-tier). **Ignored in HTTP mode** — there, identity is the per-request `Authorization` header. |
| `FLOE_API_BASE_URL` | No | `https://credit-api.floelabs.xyz` | API endpoint (only change for self-hosting) |
| `MCP_PORT` | No | `3100` | HTTP server port (non-stdio mode only) |
| `MCP_HOST` | No | `127.0.0.1` | Bind address (HTTP mode only) |
| `MCP_TRUSTED_ORIGINS` | No | — | Comma-separated extra origins allowed by CORS (HTTP mode only) |

**Flags:** `--stdio` and `--http` select the transport explicitly. With neither, the server speaks stdio when its stdin is a pipe (which is what an MCP client spawning it looks like) and serves HTTP otherwise.

---

## Architecture

```text
Your Agent → MCP Server → credit-api.floelabs.xyz → Envio Indexer / Base RPC
                ↑                    ↑
         @floelabs/mcp-server   Private backend
          (open source)        (holds secrets)
```

The MCP server is a thin HTTP client. All protocol logic, indexer queries, and RPC calls happen in the private Floe API backend. The npm package contains only tool definitions and `fetch()` calls — no private keys, no tokens, no database.

---

## Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| LendingIntentMatcher | `0x17946cD3e180f82e632805e5549EC913330Bb175` |
| PriceOracle | `0xEA058a06b54dce078567f9aa4dBBE82a100210Cc` |
| LendingViews | `0x9101027166bE205105a9E0c68d6F14f21f6c5003` |

---

## Next Steps

- [Set up with your AI tools](../getting-started/setup-with-ai-tools.md) — the copy-prompt, deep links, and per-client configs in one place
- [Quickstart](../getting-started/quickstart.md) — the full bootstrap: provision, govern, pay
- [Floe CLI](cli.md) — the same surface from a shell, with `--json` and semantic exit codes
- [Credit REST API](credit-api.md) — direct HTTP integration without MCP
- [Webhooks](webhooks.md) — get notified when spend, keys, or loans change state
- [API Keys](api-keys.md) — key management and security best practices
