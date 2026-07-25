---
icon: terminal
---

# Floe CLI

Everything the dashboard can do, from a terminal, with one API key — designed so a coding agent can drive it headlessly.

```bash
npm i -g floe-agent      # installs BOTH bins: `floe` and `floe-agent`
floe status --json       # auth + capabilities + balances in one call
```

One package, two command names: `floe` is the platform CLI, `floe-agent` is the historical alias for the same binary. Every existing `floe-agent` command keeps working.

> **See also:** [Set up with your AI tools](../getting-started/setup-with-ai-tools.md) | [MCP Server](mcp-server.md) | [API Keys](api-keys.md)

**npm:** `floe-agent` (v0.6.0) · **GitHub:** [Floe-Labs/agentkit-actions](https://github.com/Floe-Labs/agentkit-actions)

---

## Conventions

Written for scripts and agents first, humans second.

- **`--json` on every command.** Prints the raw API JSON to stdout — no spinner, no color, nothing else on stdout.
- **Exit codes:** `0` ok · `1` error · `2` usage · `4` auth required · `5` payment required (402). Usage is validated *before* credentials, so a malformed command exits `2` whether or not a key is set.
- **Never prompts when it is not a TTY.** Missing input exits `2` with usage instead of blocking; destructive prompts are skipped under `--json` or a non-interactive shell.
- **`NO_COLOR` respected.**
- **`User-Agent: floe-cli/<version>`** on every request to the Credit API.
- **Keys are printed exactly once**, at mint or rotate time, and stored in the OS keychain. The CLI never echoes a key it did not just mint.
- **`floe pay` always sends an `Idempotency-Key`** (auto-generated UUID unless you pass one), so a retried command can never double-pay.

---

## Authentication

| Variable | What it holds |
|---|---|
| `FLOE_API_KEY` | Management credential — a `floe_live_…` developer key or a `floe_…` agent key |
| `FLOE_AGENT_KEY` | Optional `floe_…` agent-key override used by the payment commands |
| `FLOE_API_URL` | Credit API base URL (default `https://credit-api.floelabs.xyz`) |
| `PRIVATE_KEY` | Wallet key — EIP-191 signature-auth fallback, plus the legacy wallet flows and the REPL |

Two credential planes resolve independently:

**Management commands** (`status`, `agents`, `keys`, `policy`, `limit`, `allowlist`, `balance`, `fund`, `usage`, `activity`, `webhooks`) resolve in order:

1. `FLOE_API_KEY`
2. the key stored by `floe auth set-key` (OS keychain)
3. EIP-191 wallet-signature headers when `PRIVATE_KEY` is set

**Payment commands** (`pay`, `estimate`, `forecast`) resolve in order:

1. `FLOE_AGENT_KEY`
2. the active agent's key from the OS keychain
3. `FLOE_API_KEY` when it is a `floe_` agent key

None of the above → exit `4` with a pointer to the dashboard.

```bash
floe auth status --json          # which credential each plane would use
floe auth set-key floe_live_...  # store the developer key in the OS keychain
```

> **Keychain storage.** Agent keys are kept in the OS credential store (macOS Keychain, Windows Credential Manager, Linux Secret Service) under `<agentName>@<facilitatorUrl>`; the developer key is stored under `@developer`. On headless machines without a session keyring the CLI falls back to environment variables — `FLOE_AGENT_KEY_<NAME>__<HOST>` (or the legacy `FLOE_AGENT_KEY_<NAME>`) — and prints a one-time warning that the secret is not persisted.

---

## Command reference

### Setup & status

| Command | What it does |
|---|---|
| `floe status [--json]` | One-shot probe: verifies the credential, reads `GET /v1/capabilities`, and prints a balance snapshot. Falls back to the agent plane when only a runtime key is present. |
| `floe auth status \| set-key [key] [--json]` | Report or store the developer key. Non-TTY `set-key` requires the key as an argument. |
| `floe mcp install [--json]` | Runs `npx -y add-mcp https://mcp.floelabs.xyz/mcp`; on failure prints the manual MCP JSON config and the `claude mcp add` one-liner. Configs carry the URL only, never a key. |
| `floe skills install [--json]` | Installs the `floe-budget` skill to `./.claude/skills/floe-budget/SKILL.md` and `~/.agents/skills/floe-budget/SKILL.md`. Idempotent. |

### Agents & runtime keys (developer key)

| Command | What it does |
|---|---|
| `floe agents create --name <name> [--borrow-limit <usd>] [--max-rate-bps <n>] [--expiry-days <n>] [--json]` | `POST /v1/developer/agents` — provisions the managed wallet and the on-chain delegation; the account's first agent also receives the **$3 welcome credit**. Prints the agent id and deposit address. Omit `--borrow-limit` for the pay-as-you-go default. |
| `floe agents list [--json]` | Every agent on the account, from the API. |
| `floe agents get\|pause\|resume\|close <agentId> [--json]` | Agent detail, the per-agent kill-switch, and permanent close. |
| `floe agents [--json]` | Bare `agents` lists the **local** registry from `.floe-agent.json` (back-compat) — use `floe agents list` for the server view. |
| `floe agents keys create <agentId\|name> [--budget <usd>] [--window-seconds <s>] [--label <l>] [--json]` | Mints a `floe_…` runtime key. Plaintext is shown once and stored in the keychain. `--budget` sets a fail-closed rolling per-key cap. |
| `floe agents keys rotate <agentId\|name> [--key-id <id>] [--label <l>] [--json]` | Atomic revoke + mint. The replacement key is shown once. |
| `floe agents keys revoke <agentId\|name> [--key-id <id>] [--json]` | Revokes a runtime key immediately. |
| `floe keys create\|list\|rotate\|revoke [keyId] [--label <l>] [--permissions read\|read_write] [--json]` | Developer (`floe_live_…`) keys on `/v1/developer/keys`. |
| `floe fund <agentId> [--json]` | Prints machine-readable funding instructions — deposit address, chain `8453`, `USDC` — plus the dashboard link. The agent hands this to a human; it never moves money itself. |

### Guardrails

| Command | What it does |
|---|---|
| `floe limit get\|set\|clear [<usd>] [--agent <id>] [--json]` | Session spend cap. `--agent` takes a **numeric** agent id and is required when using developer credentials. |
| `floe policy list [--agent <id>\|--team] [--include-revoked] [--json]` | Spend policies for one agent or the team. `--include-revoked` also returns retired rows. |
| `floe policy set --kind <task\|api\|vendor\|session> --match <key> (--limit <usd> \| --limit-raw <raw>) [--match-kind <k>] [--window-kind once\|rolling] [--window-seconds <s>] [--label <l>] [--action block\|suspend_agent] [--agent <id>\|--team] [--json]` | Create a policy. `kind=session` is team-scope only — the per-agent equivalent is `floe limit set`. |
| `floe policy delete <policyId> [--agent <id>\|--team] [--json]` | Remove a policy. |
| `floe policy reset <policyId> [--agent <id>] [--json]` | Reset a policy's accrued window. Not available on team policies — delete and re-create instead. |
| `floe allowlist mode [off\|host\|vendor\|both] [--agent <id>] [--json]` | Read or set merchant-allowlist enforcement. |
| `floe allowlist add <host\|payee> [--kind api\|vendor] (--limit <usd> \| --limit-raw <raw>) [--match-kind host_exact\|host_suffix\|recipient] [--agent <id>] [--json]` | Add an allowed-and-capped entry. Allowlist entries are always capped. |
| `floe allowlist remove <policyId> [--agent <id>] [--json]` · `floe allowlist list [--agent <id>] [--json]` | Remove or list entries. |

Semantics for every cap and window live in [Spend Controls](spend-controls.md).

### Spending (agent key)

| Command | What it does |
|---|---|
| `floe estimate <url> [--method <M>] [--json]` | `POST /v1/x402/estimate` — price one call and reflect it against available credit. Nothing is spent. |
| `floe forecast <url> [<url>…] [--count <n per url>] [--task-id <id>] [--json]` | `POST /v1/x402/forecast` — batch cost projection + policy preflight for a plan of up to 50 calls. |
| `floe pay <url> [--method <M>] [--body <raw>] [--header "K: V"]… [--task-id <id>] [--idempotency-key <k>] [--json]` | `POST /v1/proxy/fetch` — Floe pays the vendor and returns its response plus the `X-Floe-*` metering headers. Exit `5` on `402`. `--header` repeats. |
| `floe balance [--json]` | Developer rollup with a developer key; the agent's own balance with a runtime key. |

### Observability

| Command | What it does |
|---|---|
| `floe models [--json]` | The Floe Inference model catalog (`GET /v1/models`). |
| `floe usage [--json]` | Spend/usage analytics summary for the account. |
| `floe activity [--limit <n>] [--json]` | Unified activity feed — proxy calls, transfers, onramps, loan events. |
| `floe webhooks create --url <https-url> --events <e1,e2> [--scope global\|wallet\|loan --scope-value <v>] [--description <d>] [--json]` | Register a webhook. The signing secret is returned once. |
| `floe webhooks list [--json]` · `floe webhooks test\|rotate-secret\|deliveries <webhookId> [--json]` | List, send a signed test delivery, rotate the secret, inspect deliveries. |

Event catalog and signature verification: [Webhooks](webhooks.md).

### Legacy wallet flows

These predate the platform commands and are unchanged. They use the wallet-signature path (`PRIVATE_KEY`) and the local `.floe-agent.json` registry.

| Command | What it does |
|---|---|
| `floe run` | Interactive lending REPL — the historical default command. Needs a wallet and an LLM key (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`). Lazy-loaded, so management commands never pay its startup cost. |
| `floe register --name <name> [--borrow-limit <usd>] [--max-rate-bps <n>] [--expiry-days <n>] [--label <l>] [--facilitator-url <url>]` | Wallet-signature agent registration **plus** a first key mint, written to the local registry. |
| `floe use <name>` | Set the active agent for keychain lookups. |
| `floe rotate\|revoke <name>` | Key rotation aliases (see the note below). |
| `floe open-credit-line --name <name> [--deposit <usd>] [--max-ltv-bps <n>] [--max-rate-bps <n>]` | Open the USDC/USDC credit line for a funded agent. |

> **`register` is not the same command as `agents create`.** `floe agents create` is a thin headless API call (developer key, no wallet, no local state) that provisions the agent only — mint its key separately with `floe agents keys create`. `floe register` is the original wallet-signature flow: it registers the agent, mints the first key, and records it in `.floe-agent.json` so `use`/`rotate`/`revoke` can find it by name. Both remain supported; agents should prefer `agents create` + `agents keys create`.
>
> **Alias routing on `rotate` / `revoke`.** Top-level `floe rotate <name>` and `floe revoke <name>` take the developer-key path when headless credentials resolve, and fall back to the interactive wallet flow otherwise. Interactive `revoke` still asks for confirmation; the explicit `floe agents keys revoke` never prompts. For an agent tracked in the local registry, both honor that record's persisted facilitator URL — `FLOE_API_URL` overrides it.

---

## A full bootstrap, headless

```bash
export FLOE_API_KEY=floe_live_...

floe status --json                                    # exit 4 if the key is bad
AGENT_ID=$(floe agents create --name research-bot --json | jq -r .agentId)
AGENT_KEY=$(floe agents keys create "$AGENT_ID" --budget 5 --json | jq -r .key)

floe limit set 5 --agent "$AGENT_ID"                  # session cap
floe policy set --kind api --match api.exa.ai --limit 2 \
  --window-kind rolling --window-seconds 86400 --agent "$AGENT_ID"

export FLOE_AGENT_KEY="$AGENT_KEY"
floe estimate https://api.exa.ai/contents --method POST --json
floe pay https://api.exa.ai/contents --method POST \
  --body '{"urls":["https://example.com"],"text":true}' --json
```

Exit `5` from that last command means the balance is exhausted — run `floe fund "$AGENT_ID"` and hand the output to a human.

## Next steps

- [Agent Quickstart](../agents/quickstart-agents.md) — the same flow with REST equivalents
- [MCP Server](mcp-server.md) — the same surface as MCP tools, for clients that prefer tool calls
- [Agent Runtime Contract](agent-runtime-contract.md) — error matrix and retry rules
- [TypeScript SDK](agentkit-typescript.md) — the same package's `FloeAgent` client and AgentKit actions
