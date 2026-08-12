---
icon: terminal
---

# Floe CLI

`npm i` to a metered Floe call wired into your code — and every dashboard job scriptable from the same bin. `@floelabs/cli` is the **full platform CLI**: setup, agents, keys, budgets, policies, billing, funds, phone, and metered calls, at parity with the [Developer Dashboard](developer-dashboard.md).

```bash
npx @floelabs/cli init
```

`floe init` authenticates with your developer key, creates (or selects) an agent, mints its runtime key into your OS keychain, and ends with the only thing that matters — the base-URL swap for your existing OpenAI-compatible client, key already filled in:

```python
from openai import OpenAI
client = OpenAI(base_url="https://credit-api.floelabs.xyz/v1", api_key="floe_…")
```

That snippet is exactly what `init` prints — key filled in for a quick local start. For anything checked into source control, read the key from the environment instead: `api_key=os.environ["FLOE_AGENT_KEY"]`.

Every response carries `X-Floe-Cost-USDC`. One key meters chat, embeddings, speech, and transcription across the models in the Floe catalog and the [vendor marketplace](../x402-directory/README.md) — one bill, in USDC.

> **See also:** [Set up with your AI tools](../getting-started/setup-with-ai-tools.md) | [MCP Server](mcp-server.md) | [API Keys](api-keys.md)

**npm:** `@floelabs/cli` (v0.2.0) · **bin:** `floe` · **GitHub:** [Floe-Labs/floe-cli](https://github.com/Floe-Labs/floe-cli)

> **Two bins, one platform.** `@floelabs/cli` (bin `floe`) is the Floe platform CLI — the whole surface, from onboarding to policies to payments, documented on this page. The **`floe-agent`** bin, shipped by the `floe-agent` SDK package, is the **AgentKit-companion CLI** for the agent-runtime SDK: its command tree and the interactive REPL live at [TypeScript SDK → CLI](agentkit-typescript.md#cli-floe-agent). Use `floe` unless you are working inside the AgentKit SDK workflow.

---

## Install

```bash
npx @floelabs/cli init    # run the onboarding once, straight from npm
npm i -g @floelabs/cli    # or keep the `floe` bin around
```

## Conventions

- **`--json` for structured-output commands** — raw JSON on stdout, except streaming, binary-output, and CSV export modes (`chat --stream` rejects `--json`; `speak` and `billing export` write audio/CSV to `--out`). USDC amounts in `--json` are raw 6-decimal integer strings where the API returns them that way.
- **`--yes` on destructive and money-moving verbs** — skips the confirmation prompt (`agents close`, `keys revoke`, `funds withdraw`, `credit open`, `phone buy`, …). Without a TTY, prompts are never shown: missing confirmation exits `2` instead of hanging.
- **`--api-url <url>`** overrides the API base (default `https://credit-api.floelabs.xyz`), as does `FLOE_API_URL`.
- **Exit codes:** `0` ok · `1` error · `2` usage · `4` auth · `5` payment/budget.
- **Keys print exactly once**, at mint or rotate. The keychain stores only your developer key and each agent's active runtime key — extra keys from `keys create` / `devkeys create|rotate` are shown once and never stored (see [Keychain](#two-keys-handled-for-you)).

## Commands at a glance

| Group | Commands |
|---|---|
| [Get started](#get-started) | `init` · `status` · `use` · `test` |
| [Metered calls](#metered-calls) | `chat` · `embed` · `speak` · `transcribe` · `pay` |
| [Agents & limits](#agents-limits) | `agents` · `keys` · `devkeys` · `budget` · `policy` · `allowlist` · `credit` |
| [Observability & billing](#observability-billing) | `activity` · `usage` · `ledger` · `billing` · `account` · `team` |
| [Money](#money) | `funds` · `cashout` |
| [Platform](#platform) | `webhooks` · `models` · `estimate` · `providers` · `phone` · `actions` · `orchestrators` · `vendors` |

`floe help <command>` prints any command's exact usage and flags.

---

## Get started

### `floe init`

Full setup in one command: authenticate with your developer key (`floe_live_…`), create or select an agent, mint its runtime key into the OS keychain, and print the base-URL swap snippet. Re-runs are safe: the configured agent and stored key are reused.

| Flag | Does |
|---|---|
| `--key <floe_live_…>` | Developer key (skips the prompt) |
| `--agent <name>` | Select an existing active agent by name |
| `--name <name>` | Name for a newly created agent (default `"my-agent"`) |
| `--new-key` | Mint a fresh agent key instead of reusing the stored one |
| `--open` | Open the dashboard in your browser |

```bash
npx @floelabs/cli init                       # interactive: paste the key, name the agent
floe init --agent support-bot --new-key      # re-point this machine at an existing agent
```

`--key` is for non-interactive use and lands in shell history and CI logs — prefer the interactive paste or the `FLOE_API_KEY` env var. If the agent is already at its five-active-key cap, minting fails with `409 limit_exceeded` — `floe keys rotate` replaces a key atomically, or `floe keys revoke` frees a slot.

### `floe status`

Am I set up? Shows account identity, the active agent and key, balances, and budgets. Exits `4` when no developer key is configured — the one-line probe for scripts and coding agents.

```bash
floe status --json
```

### `floe use`

Switch the active agent by name or id. Each agent's key is stored in its own keychain slot, so switching never re-mints an existing key; the first switch to an agent mints one (agents cap at 5 keys).

```bash
floe use research-bot
```

### `floe test`

Make one real metered call through the gateway with this machine's agent key and print the per-leg cost from the `X-Floe-Cost-USDC` response header. `--voice` proves the whole STT → LLM → TTS turn: three legs, one key, one bill.

| Flag | Does |
|---|---|
| `--voice` | Run the STT → LLM → TTS three-leg voice pipeline |
| `--model <id>` | Chat model override |
| `--stt-model <id>` | Transcription model override (`--voice`) |
| `--tts-model <id>` | Speech model override (`--voice`) |
| `--tts-voice <name>` | Speech voice (default `"alloy"`) |

```bash
floe test
floe test --voice --json
```

Exits `5` when the call is declined for balance or budget reasons.

---

## Metered calls

Every paid command here spends real (fractions of) cents with this machine's agent key and prints the settled cost from `X-Floe-Cost-USDC` — `pay --check` is a free pre-flight that never charges, and free vendor routes settle at $0. A `402` decline (balance, budget, policy, allowlist) exits `5`.

### `floe chat`

Send one prompt through the metered gateway and print the reply plus the per-call cost. Use `-` as the prompt to read it from stdin (pipes).

| Flag | Does |
|---|---|
| `--model <id>` | Model id (default: a cheap chat model from `/v1/models`) |
| `--system <text>` | System prompt |
| `--max-tokens <n>` | Cap the completion length |
| `--stream` | Stream tokens as they arrive (SSE; cannot combine with `--json` — a streamed call's cost lands in the ledger) |

```bash
floe chat "Summarize RFC 9110 in three bullets" --model openai/gpt-4o-mini --json
cat notes.md | floe chat - --system "Extract the action items as a list"
```

### `floe embed`

Embed one text through the metered gateway and print the model, dimensions, and per-call cost. Human output elides the vector; `--json` passes it through in full.

| Flag | Does |
|---|---|
| `--model <id>` | Embedding model id (default: a cheap embedding model from `/v1/models`) |

```bash
floe embed "intent-based P2P lending" --json | jq '.data[0].embedding | length'
```

### `floe speak`

Synthesize speech through the metered gateway, write the audio to `--out`, and print the bytes written plus the per-call cost. `--out -` streams the audio to stdout (refused on a terminal).

| Flag | Does |
|---|---|
| `--out <file>` | Output file for the audio (**required**; `"-"` for stdout) |
| `--model <id>` | TTS model id (default: a TTS model from `/v1/models`) |
| `--voice <name>` | Voice name (default `"alloy"`) |

```bash
floe speak "Your build finished" --out done.mp3
floe speak "Hello" --out - --model openai/tts-1 | ffplay -autoexit -nodisp -
```

### `floe transcribe`

Transcribe a local audio file through the metered gateway and print the transcript plus the per-call cost. The content type is inferred from the file extension (wav, mp3, m4a, flac, ogg, webm, …).

| Flag | Does |
|---|---|
| `--model <id>` | Transcription model id (default: an STT model from `/v1/models`) |

```bash
floe transcribe call-recording.wav --json | jq -r .text
```

### `floe pay`

Call any x402 vendor through the metered proxy: Floe fronts the payment when the vendor answers `402`, relays the response, and prints the upstream status, body, and all-in cost. Free URLs pass through at $0.

| Flag | Does |
|---|---|
| `--check` | Pre-flight only: report whether the URL requires x402 payment and its price (unauthenticated, free) |
| `--method <verb>` | HTTP method: GET, POST, PUT, PATCH, DELETE, HEAD (default GET, or POST when `--data` is given) |
| `--data <json\|@file\|->` | Request body: inline string, `@file`, or `"-"` (stdin) |
| `--header "K: V"` | Header forwarded to the vendor (repeatable) |
| `--task <id>` | Attribute spend to a task (`X-Floe-Task-Id`) |
| `--action <id>` | Attribute spend to an action (`X-Floe-Action-Id`) |
| `--idempotency-key <k>` | Safe-retry key — a replay returns the cached response instead of paying twice |

```bash
floe pay https://api.exa.ai/contents --check                 # what would this cost?
floe pay https://api.exa.ai/contents \
  --data '{"urls":["https://example.com"],"text":true}' \
  --task nightly-crawl --json
```

After a timeout or unknown outcome, rerun with the **same** `--idempotency-key` — the replay returns the cached response instead of paying again. One exception: on `502 upstream_paid_request_failed_ambiguous` the payment already went out — reuse the key only to inspect the recorded result, wait for settlement to go terminal, then start any new attempt with a fresh key.

---

## Agents & limits

### `floe agents`

Manage your agent fleet. `<agent>` is a name or id; `●` marks this machine's agent.

| Subcommand | Does |
|---|---|
| `list` | All agents; `--rollup` adds balance, 30d spend, phone, keys |
| `get [agent]` | Agent detail (default: this machine's agent); `--usage` folds in gateway usage and reputation |
| `create <name>` | Create a pay-as-you-go agent; `--credit-limit <usd>` sets the on-chain borrow ceiling for a later credit line |
| `pause <agent>` | Kill-switch: every next call is refused (no confirmation) |
| `resume <agent>` | Re-enable a paused agent |
| `close <agent>` | **DESTRUCTIVE:** repays loans, sweeps funds, closes for good (`--yes` to skip the prompt) |
| `lock` | Show the self-service lock (tighten-only mode); `--on` / `--off` set it, `--agent` targets another agent |

```bash
floe agents --rollup
floe agents create scraper --credit-limit 100 --json
floe agents pause scraper        # instant kill-switch, resume when ready
```

### `floe keys`

Manage agent runtime keys (`floe_…`). Default agent: the one this machine uses.

| Subcommand | Does |
|---|---|
| `list` | Every key on the agent; `●` marks the key this machine uses |
| `create` | Mint an additional key — shown once, never stored here; does **not** change which key this machine uses. `--budget <usd>` caps its spend; `--window <dur>` sets the rolling period (e.g. `24h`, `7d`; default `30d`). `--label <label>`, `--agent <name\|id>` |
| `revoke <keyId>` | Revoke a key permanently — asks for confirmation (`--yes` to skip). `--agent <name\|id>` |
| `rotate [keyId]` | Replace a key atomically — the old key is revoked server-side. Defaults to this machine's key; the new key is stored locally |

```bash
floe keys create --label ci --budget 5 --window 24h --json   # a $5/day key for CI
floe keys rotate                                             # replace this machine's key
```

### `floe devkeys`

Manage developer keys (`floe_live_…`) — the account-level keys the CLI and dashboard sign in with.

| Subcommand | Does |
|---|---|
| `list` | Every non-revoked developer key (prefix only) |
| `create` | Mint a new key — shown once, never stored by the CLI. `--read-only` mints a read-scoped key (default: `read_write`); `--label <label>` |
| `revoke <keyId>` | Revoke a key permanently (`--yes` to skip the prompt). Revoking the key this machine uses strands it until `floe init` is re-run with another key |
| `rotate <keyId>` | Atomic revoke + mint. The new key is shown once and **not** stored — if this machine was using the old key, run `floe init --key <new key>` |

```bash
floe devkeys create --label staging --read-only --json
floe devkeys rotate key_abc123
```

### `floe budget`

Cap agent spend at the scopes the API enforces. The shortcut for the common cases; `floe policy` is the full surface.

| Subcommand | Does |
|---|---|
| `show` | Current caps (default subcommand) |
| `set <usd>` | Total session spend limit for the agent |
| `set <usd> --per day` | Rolling 24h budget on this machine's key |
| `set <usd> --per task --task <id>` | One-shot cap for calls tagged `X-Floe-Task-Id: <id>` |
| `clear [--per day]` | Remove a cap |
| `reserve --task <id> --amount <usd> [--ttl <dur>] [--agent <ref>]` | Pre-authorize a task: an expiring hold (default TTL 1h, max 24h) capping that task's spend |

```bash
floe budget set 25                    # session cap
floe budget set 5 --per day           # rolling 24h cap on this key
floe budget reserve --task crawl-42 --amount 2 --ttl 4h --json
```

> There is no `--per call`: the API has no per-call primitive.

### `floe policy`

Server-side spend caps enforced on every paid call. Policies target the active agent, `--agent <name|id>`, or the whole account with `--team`.

| Subcommand | Does |
|---|---|
| `list` | Active policies (`--include-revoked` adds history). `--team` also shows the account-wide cap and the defaults new agents inherit |
| `create` | `--kind task` caps one task id (`--match <task-id>`) · `--kind api` caps a host or suffix (`--match api.host.com` \| `.host.com`) · `--kind vendor` caps a payee wallet (`--match 0x…`) · `--kind session` is the account-wide cap (`--team` only, no `--match`). `--limit <usd>` required; `--window` is a rolling duration (`24h`, `7d`) or `once` for a single-shot budget (default 24h rolling); `--action suspend_agent` makes a breach suspend the whole agent instead of declining one call; `--label <text>` |
| `update <policyId>` | Change `--limit`, `--window` (rolling period), `--action`, or `--label` |
| `revoke <policyId>` | Deactivate a policy permanently (asks for confirmation) |
| `reset <policyId>` | Restart an agent policy's window now (agent-scoped only) |
| `chain` | Every live limit constraining the agent, ending in spendable balance |
| `test` | Dry-run a hypothetical call: `--host <h> --amount <usd>` (plus `--recipient <0x…>`, `--task <id>`, `--key <keyId>`) → ALLOW or DECLINE plus the deciding rule. Nothing is reserved or paid |

```bash
floe policy create --kind api --match .openai.com --limit 10 --window 24h --label "OpenAI daily"
floe policy test --host api.exa.ai --amount 0.05 --json      # would this call pass?
floe policy chain                                            # what actually constrains this agent?
```

### `floe allowlist`

Restrict which merchants an agent can pay. Entries are spend-capped policy rows; the **mode** picks which dimensions the proxy enforces: `off` (any vendor — caps on entries still apply) · `host` (only allowlisted request hosts) · `vendor` (only allowlisted payee wallets — the 402's recipient) · `both`.

| Subcommand | Does |
|---|---|
| `show` | Mode + entries for the agent |
| `set off\|host\|vendor\|both` | Switch the mode |
| `add` | Allowlist a host (`--host api.openai.com` exact, `--host .openai.com` suffix) or a payee wallet (`--payee 0x…`), capped at `--limit <usd>` per `--window` (default 24h rolling); `--label <text>` |
| `remove <entryId>` | Delete an entry by id (asks for confirmation) |

```bash
floe allowlist add --host api.exa.ai --limit 5
floe allowlist set host          # from now on, only allowlisted hosts
```

> Enforcement **fails closed**: turning a dimension on with zero entries declines every call on it — the CLI warns loudly when that happens.

### `floe credit`

Inspect and open the optional USDC credit line that backs an agent's spend.

| Subcommand | Does |
|---|---|
| `bounds` | Protocol bounds (LTV/rate), wallet + spendable balances, and any in-flight or active credit-line loan for the agent |
| `open` | Deposit USDC collateral and open a same-token credit line — money-moving, asks for confirmation (`--yes` to skip). `--deposit <usd>` required; `--max-ltv <bps>` (1–9500), `--max-rate <bps>` (1–10000) |

Both take `--agent <agent>` (default: this machine's agent).

```bash
floe credit bounds --json
floe credit open --deposit 50 --max-rate 1200 --yes
```

---

## Observability & billing

### `floe activity`

The unified account activity feed, newest first: x402 calls, onramp purchases/sweeps, wallet transfers, and credit-facility loan events.

| Flag | Does |
|---|---|
| `--agent <ref>` | Narrow to one agent by name or id (default: all agents) |
| `--type <csv>` | Narrow to event types, comma-separated: `x402_call`, `onramp_purchase`, `onramp_sweep`, `transfer_deposit`, `transfer_withdrawal`, `transfer_external`, `facility_loan_match`, `facility_loan_repay`, `facility_loan_rollover`, `facility_loan_failed` |
| `--since <iso>` / `--until <iso>` | ISO 8601 time bounds |
| `--key <keyId>` | Narrow to x402 calls made with one agent API key (numeric id — see `floe keys --json`); implies `x402_call` only |
| `--limit <n>` | Events per page, 1–100 (default 50) |
| `--cursor <cursor>` | Resume from a previous page's `nextCursor` |
| `--expand` | Per-event detail payloads (kv blocks; full JSON with `--json`) |

```bash
floe activity --type x402_call --since 2026-08-01 --json
```

`--json` emits `{ events, nextCursor, hasMore }` exactly as the API returns them; `amountRaw` stays a raw 6-decimal USDC string.

### `floe usage`

Usage analytics for the account. The default series mirrors `PolicyService.getSpend` — governance-accurate: the chart and budget enforcement can never disagree.

| Subcommand | Does |
|---|---|
| *(default)* | Daily spend series with per-vendor rollup and totals. `--agent <ref>` (default: all agents), `--days <n>` (1–90, default 30) |
| `summary` | Headline KPIs over the window: calls, error rate, latency percentiles, policies tripped, metered spend, top vendors. `--window 7d\|30d` (default 7d) |
| `coverage` | Governance coverage score for one agent: pre-call enforceable vs orchestrator-reconciled share of known spend. `--agent <ref>` (default: this machine's agent), `--days <n>` |

```bash
floe usage --days 7
floe usage summary --window 30d --json
```

### `floe ledger`

Cross-source spend ledger: one money view across Floe rails (gateway, x402 proxy, Floe Phone) and orchestrator-reconciled spend (Vapi/Retell/Bland), rolled up by the chosen dimension.

| Flag | Does |
|---|---|
| `--group-by <dim>` | `source` (default) \| `customer` \| `campaign` \| `agent`. customer/campaign group by the `X-Floe-Customer-Id` / `X-Floe-Task-Id` tags on calls; untagged spend stays visible as its own bucket |
| `--days <n>` | Window in days, 1–90 (default 30) |
| `--agent <ref>` | Narrow to one agent (default: all agents) |

```bash
floe ledger --group-by agent --days 7 --json
```

### `floe billing`

Cross-agent billing for this developer account (current calendar month, UTC).

| Subcommand | Does |
|---|---|
| `mtd` | Month-to-date bill, broken down by vendor and by agent (default) |
| `invoice [--out <file>]` | Current-period invoice; `--out` writes the full JSON to a file |
| `export [--out <file> \| --out -]` | Per-charge CSV for the month. Default file: `floe-charges-<yyyy-mm>.csv`; `--out -` streams raw CSV to stdout (for piping) |
| `charges [--limit <n>]` | Most recent charge line items across all agents (default 20, max 100) |

```bash
floe billing mtd
floe billing export --out - | head -20
```

### `floe account`

Your developer account (shared with teammates — see `floe team`).

| Subcommand | Does |
|---|---|
| `show` | Identity: name, opaque account id, your role, wallet, agent count |
| `rename <name>` | Set the account display name (owner or admin only, 1–100 chars) |

```bash
floe account rename "Acme Voice Ops"
```

### `floe team`

Teammates share this account: its agents, keys, and billing. Destructive verbs (`revoke-invite`, `remove`) prompt for confirmation; pass `--yes` in scripts.

| Subcommand | Does |
|---|---|
| `members` | Roster with wallet, role, and join date (`●` = you) |
| `invite <email> --role admin\|member\|viewer` | Email a single-use accept link (inviting an admin requires the owner role) |
| `revoke-invite <id>` | Cancel a pending invite before it is accepted |
| `set-role <wallet> <role>` | Change a member's role — owner only |
| `remove <wallet>` | Remove a member. Also revokes every API key they minted. Removing an admin requires the owner role |

```bash
floe team invite dev@acme.com --role member
```

---

## Money

### `floe funds`

Move money between your agents, your Main Wallet, and a card. All transfers are server-signed — the CLI never holds a private key. `withdraw` and `move` confirm before moving money (`--yes` to skip).

| Subcommand | Does |
|---|---|
| `withdraw --amount <usd>` | Agent → your Main Wallet (the welcome credit always stays) |
| `move --from <ref> --to <ref> --amount <usd>` | Agent → another of your agents |
| `list [--limit <n>]` | Transfer history |
| `address` | The agent's USDC deposit address — top it up from any wallet or exchange; inbound USDC becomes spendable automatically |
| `topup [--amount <usd>] [--open]` | Buy USDC with a card via Coinbase: prints a checkout link, then watches your Main Wallet for the funds (Ctrl-C stops watching; `--json` prints the link and doesn't watch) |
| `sessions [--recovery] [--limit <n>]` | Card-purchase history; `--recovery` shows completed purchases whose funds still sit in your Main Wallet |

All agent-scoped subcommands take `--agent <ref>` (default: this machine's active agent).

```bash
floe funds address --json                                # where to send USDC
floe funds move --from scraper --to research --amount 5 --yes
```

### `floe cashout`

Cash agent USDC out to your bank via Coinbase. Leg 1 (agent → Main Wallet) is server-signed and starts immediately; when the order reaches `awaiting_form`, Coinbase collects your bank details through a pay link.

| Subcommand | Does |
|---|---|
| `start --amount <usd> [--agent <ref>] [--open]` | Begin a cashout from an agent's balance (confirms; `--yes` to skip) |
| `list [--limit <n>] [--cursor <c>]` | Order history (paginated — `--cursor` pages older orders) |
| `status <ref> [--open]` | One order's state; re-mints a fresh pay link while `awaiting_form` |
| `cancel <ref>` | Abort an order — only while status is `created` or `awaiting_form`; once the USDC is sent to Coinbase it cannot be stopped |

```bash
floe cashout start --amount 20 --open
floe cashout status co_9f2 --json
```

---

## Platform

### `floe webhooks`

Signed event deliveries to your endpoint (HMAC-SHA256 over `<timestamp>.<body>`, headers `X-Floe-Signature` / `X-Floe-Timestamp` / `X-Floe-Delivery-Id`).

| Subcommand | Does |
|---|---|
| `list` | All webhooks on your developer account (max 10) |
| `create <url> --events <e1,e2,…>` | Register an endpoint — the `whsec_…` signing secret is shown exactly once at creation. `--scope global\|wallet\|agent\|loan --scope-value <v>`, `--description <text>` |
| `events` | The live event catalog — every subscribable event with its category and scope |
| `get <id>` | One webhook + delivery success/failure counts |
| `pause <id>` / `enable <id>` | Toggle deliveries without losing the endpoint config |
| `delete <id>` | Remove the webhook and stop all deliveries |
| `test <id>` | Send a signed test event; exits `1` if the delivery fails |
| `rotate-secret <id>` | Mint a new `whsec_…` (shown once) — the old secret stops verifying immediately |
| `deliveries <id> [--limit <1-100>]` | Recent delivery attempts for one endpoint; `--retry <deliveryId>` re-sends one with a fresh signature (exits `1` on failure) |
| `logs` | Account-wide delivery log across all endpoints, newest first. Filters: `--endpoint <id>`, `--event <name>`, `--agent <0x…>`, `--status pending\|retrying\|success\|failed`, `--from`/`--to <iso>`, `--id <search>` (delivery or correlation id), `--limit <1-100>`, `--cursor` (from the previous page's hint) |

Events: 30 across six categories — `loan.*` (5), agent/key lifecycle (8: `agent.*`, `key.*`, `provider_key.*`, `x402.first_settlement`), `credit.*` (3), `call.*` (6), `phone.number.*` (2), `marketplace.*` (6). `--events` accepts exact names, `*`, or prefix wildcards like `call.*`; run `floe webhooks events` for the authoritative list. Scopes: `global` (default) · `wallet --scope-value 0x…` · `agent --scope-value 0x…` (the agent's wallet address) · `loan --scope-value <loanId>`.

```bash
floe webhooks create https://api.acme.com/hooks/floe --events 'call.*,marketplace.payment.settled'
floe webhooks test 3 && echo "endpoint verified"
floe webhooks logs --status failed --event call.ended --limit 20
```

### `floe models`

List the keyless gateway's model catalog. Model ids are `provider/model`, e.g. `openai/gpt-4o-mini` — use them with `floe estimate` or any OpenAI SDK pointed at the Floe gateway.

| Flag | Does |
|---|---|
| `--modality <m>` | Only models of one modality (`text`, `embedding`, `tts`, `stt`, `realtime`) |
| `--pricing` | Include per-source rate cards (USD per 1M units; developer key required — the plain listing works with either key) |

```bash
floe models --modality tts --pricing
```

### `floe estimate`

Price a usage vector against the gateway catalog — no balance touched, no upstream call made. Works with either the developer key or an agent key. Combine text flags freely; pick the flags that match the model's modality.

| Flag | Does |
|---|---|
| `--model <id>` | Catalog model id (see `floe models`) |
| `--input-tokens N` / `--output-tokens N` | Text prompt / completion tokens |
| `--audio-seconds N` | Audio duration (STT models) |
| `--characters N` | Characters to synthesize (TTS models) |

```bash
floe estimate --model openai/gpt-4o-mini --input-tokens 1200 --output-tokens 400 --json
```

### `floe providers`

Bring-your-own-key (BYOK) vendor keys for the inference gateway. With a key stored, gateway calls for that vendor are paid by **your** vendor account; Floe bills only a service fee. Stored key material is never shown again.

| Subcommand | Does |
|---|---|
| `list` | Stored keys (masked) + the supported provider ids |
| `set <provider> [--label <text>]` | Save or replace the key. Prompted with hidden input; in scripts pipe it on stdin — **never** pass keys as arguments |
| `enable <provider>` | Re-enable a disabled key |
| `disable <provider>` | Stop using the key without deleting it |
| `remove <provider>` | Delete the stored key (asks for confirmation; `--yes` in scripts) |

```bash
printf '%s' "$OPENAI_API_KEY" | floe providers set openai
```

### `floe phone`

Floe Phone: give an agent a real US phone number, metered on the same ledger. Default agent: the one this machine uses (switch with `floe use`). See [Floe Phone](floe-phone.md).

| Subcommand | Does |
|---|---|
| `search [--area-code <c>]` | Preview purchasable US local numbers (free); buy an exact one with `buy --number` |
| `buy [--number <e164> \| --area-code <c>]` | Buy a number and bind it to the agent — the **first month's rental debits the agent balance immediately** (confirms; `--yes` to skip) |
| `list [--all]` | The agent's numbers, history included; `--all` shows every number across your fleet with 7-day calls and month-to-date spend |
| `release <numberId>` | Release a number permanently — **irreversible**; type the number back to confirm (`--yes` to skip) |
| `calls <numberId> [--limit <n>]` | Recent carrier call history (default 50) |
| `usage <numberId> [--days <n>]` | Ledger telephony spend for a number (default 30-day window) |
| `voice [show]` / `voice set` | The number's voice agent: `--mode hosted` (Floe runs the LLM leg) or `--mode webhook` (your backend answers); `--prompt`, `--greeting`, `--voice`, `--model`, `--webhook-url`. Pass `''` to clear a field |
| `test-call <numberId> --to <e164>` | The agent calls you at `--to` — call minutes are metered to the agent balance (confirms; `--yes` to skip) |

```bash
floe phone search --area-code 415
floe phone buy --area-code 415 --yes && floe phone test-call PN123 --to +15551234567 --yes
```

### `floe actions`

Cost-per-action rollups and outcome reporting (the eval view). Tag gateway or x402 proxy calls with an `X-Floe-Action-Id` header (`floe pay --action <id>`); every tagged call's settled cost rolls up under that action id.

| Subcommand | Does |
|---|---|
| `list [--limit <n>]` | Cost per action joined with reported outcomes (`--limit` 1–500, default 100) |
| `report <actionId> --status <status>` | Report (or overwrite) the outcome for one action. `--status success\|failure\|partial\|unknown` (required); `--score` 0–10000 basis points (10000 = perfect); `--note` free text, up to 500 characters |

Floe never judges quality — these fields are yours, verbatim.

```bash
floe actions report checkout-42 --status success --score 9500 --note "converted"
floe actions list --json | jq '.[] | {actionId, costRaw, status}'
```

### `floe orchestrators`

Connect voice orchestrators (Vapi / Retell / Bland) so their call costs land on the Floe ledger and budgets/policies govern them. See [Govern Vapi / Retell / Bland](../build/voice-orchestrators.md).

| Subcommand | Does |
|---|---|
| `list` | The account's connections; full webhook URLs via `--json` |
| `connect --provider <vapi\|retell\|bland> [--agent <name\|id>] [--label <text>]` | Create a connection. Secrets per provider: **vapi** — Floe mints the shared secret, shown **once**, paste it into your Vapi server/webhook credential; **retell** — you supply your Retell API key (hidden prompt; in scripts pipe it on stdin, never as an argument); **bland** — you supply your Bland webhook signing secret (same) |
| `rotate <id>` | Mint a new webhook token (+ secret). The old URLs and secret stop working immediately; retell/bland prompt for the new provider credential |
| `enable <id>` / `disable <id>` | Resume / pause ingesting the connection's webhooks (ledger history survives) |
| `remove <id>` | Delete the connection (asks for confirmation; `--yes` in scripts) |

```bash
floe orchestrators connect --provider vapi --label prod
```

### `floe vendors`

Health of the metered marketplace vendors, proven by real x402 probe calls: per-vendor health, settled probe cost, latency, and response excerpt.

```bash
floe vendors status --json
```

There is no vendor-catalog API — browse the full directory and per-vendor docs at [dev-dashboard.floelabs.xyz/vendors](https://dev-dashboard.floelabs.xyz/vendors).

---

## Two keys, handled for you

Floe has a **developer key** (`floe_live_…`, from the [dashboard](https://dev-dashboard.floelabs.xyz)) for managing the account, and per-agent **runtime keys** (`floe_…`) that the gateway meters. The CLI stores your developer key and each agent's active runtime key in your OS keychain and always sends the right one — you never pick. Extra keys minted with `keys create` / `devkeys create` are printed once and never stored.

The keychain holds **one runtime-key slot per agent**: `floe use <agent>` switches the active agent without re-minting anything, and the first switch to an agent mints its key into a fresh slot (agents cap at 5 active keys). `floe keys rotate` replaces the active slot's key atomically; `floe keys create` mints extra keys for other machines or CI without touching your slots.

On systems without a usable keychain (headless Linux, some containers) the CLI falls back to `~/.config/floe/credentials.json` with `0600` permissions and tells you so.

## Environment overrides

Headless / CI: set the env vars — they always win over the keychain.

| Variable | What it holds |
|---|---|
| `FLOE_API_KEY` | Developer key (`floe_live_…`) |
| `FLOE_AGENT_KEY` | Runtime key (`floe_…`) |
| `FLOE_API_URL` | Credit API base URL override (default `https://credit-api.floelabs.xyz`) |

## Exit codes

`0` ok · `1` error · `2` usage · `4` auth · `5` payment/budget

## Next steps

- [Quickstart](../getting-started/quickstart.md) — create an agent, connect your tools, first paid call
- [Add Floe to your existing pipeline](../getting-started/integrate-existing-pipeline.md) — where the base-URL swap goes
- [Spend Controls](spend-controls.md) — what `budget`, `policy`, and `allowlist` enforce server-side
- [MCP Server](mcp-server.md) — the same platform as MCP tools, for clients that prefer tool calls
- [TypeScript SDK → CLI](agentkit-typescript.md#cli-floe-agent) — the `floe-agent` AgentKit-companion CLI
