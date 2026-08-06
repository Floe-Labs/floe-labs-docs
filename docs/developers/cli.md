---
icon: terminal
---

# Floe CLI

`npm i` to a metered Floe call wired into your code — with zero dashboard round-trips after the first key.

```bash
npx @floelabs/cli init
```

`floe init` authenticates with your developer key, creates (or selects) an agent, mints its runtime key into your OS keychain, and ends with the only thing that matters — the base-URL swap for your existing OpenAI-compatible client, key already filled in:

```python
from openai import OpenAI
client = OpenAI(base_url="https://credit-api.floelabs.xyz/v1", api_key="floe_…")
```

Every response carries `X-Floe-Cost-USDC`. One key meters chat, embeddings, speech, and transcription across 15+ vendors — one bill, in USDC.

> **See also:** [Set up with your AI tools](../getting-started/setup-with-ai-tools.md) | [MCP Server](mcp-server.md) | [API Keys](api-keys.md)

**npm:** `@floelabs/cli` (v0.1.0) · **bin:** `floe` · **GitHub:** [Floe-Labs/floe-cli](https://github.com/Floe-Labs/floe-cli)

> **Looking for `agents`, `policy`, `limit`, `pay`, `fund`, `estimate`, …?** The agent lifecycle and payment commands ship in the **`floe-agent`** bin from the `floe-agent` SDK package — run them as `floe-agent <command>`. See [TypeScript SDK → CLI](agentkit-typescript.md#cli-floe-agent) for that command tree; this page covers the platform CLI's five verbs only.

---

## Install

```bash
npx @floelabs/cli init    # run the onboarding once, straight from npm
npm i -g @floelabs/cli    # or keep the `floe` bin around
```

## Commands

| Command | What it does |
|---|---|
| `floe init` | Full setup in one command: paste your dashboard developer key (`floe_live_…`), create or select an agent, mint its runtime key into the keychain, and print the base-URL-swap snippet. Flags: `--key <floe_live_…>`, `--agent <name>`, `--name <name>`, `--new-key`, `--open`. |
| `floe status` | Am I set up? Balance, budgets, active agent + key. |
| `floe test` | Make one real metered call and print its cost from `X-Floe-Cost-USDC`. `--voice` runs STT → LLM → TTS: three legs, one key, one bill. Override models with `--model`, `--stt-model`, `--tts-model`, `--tts-voice`. |
| `floe budget set <usd>` | Cap total spend before you let an agent loose. `--per day` caps this key per rolling 24 h; `--per task --task <id>` caps one task. Bare `floe budget` shows the current caps; `floe budget clear` removes them. |
| `floe keys` | List this agent's keys; `floe keys rotate` replaces yours atomically. |

Every command takes `--json` (raw JSON on stdout, for CI and coding agents) and `--api-url <url>`.

## Two keys, handled for you

Floe has a **developer key** (`floe_live_…`, from the [dashboard](https://dev-dashboard.floelabs.xyz)) for managing agents, and per-agent **runtime keys** (`floe_…`) that the gateway meters. The CLI stores both in your OS keychain and always sends the right one — you never pick. On systems without a usable keychain (headless Linux, some containers) it falls back to `~/.config/floe/credentials.json` with `0600` permissions and tells you so.

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
- [TypeScript SDK → CLI](agentkit-typescript.md#cli-floe-agent) — agent lifecycle, policies, and payments from the shell (`floe-agent`)
- [MCP Server](mcp-server.md) — the same platform as MCP tools, for clients that prefer tool calls
