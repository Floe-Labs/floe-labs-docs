# Agent Quickstart

Floe is built so an AI agent can run its own spending. A human does two things; the agent does everything else.

| Human does (twice, ever) | Agent does (everything else) |
|---|---|
| Sign in at [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) and mint a developer key (`floe_live_…`) | Create agents, mint and rotate runtime keys, set spend limits and policies, read balances and usage, register webhooks |
| Fund the balance when the welcome credit runs out | Estimate cost, pay vendors through the x402 proxy, retry or back off on `402`, hand the human clean funding instructions |

The first agent on an account gets a **$3 welcome credit that is immediately spendable** (once per account, not per agent), so the agent can prove the whole rail works before anyone reaches for a card.

---

## Start: hand the job to your agent

Paste this into Claude Code, Cursor, Codex, or your own agent:

```text
Read https://dev-dashboard.floelabs.xyz/agents.md and set up Floe for this project.
```

`agents.md` is an executable runbook written for agents — scenario triage, install, key-handling rules, provisioning, a real paid call, and the funding handoff. Deep links and per-client configs are on [Set up with your AI tools](../getting-started/setup-with-ai-tools.md).

Everything below is what the agent does, so you can follow along — or do it by hand.

---

## Human step 1 — the developer key

Mint a developer key at [dev-dashboard.floelabs.xyz/keys](https://dev-dashboard.floelabs.xyz/keys) and export it:

```bash
export FLOE_API_KEY=floe_live_...
```

> **Keys never go into chat.** Put the key in the environment or a secret manager and tell the agent it is there. An agent that follows `agents.md` will refuse to send a Floe key to any domain other than `credit-api.floelabs.xyz` or `mcp.floelabs.xyz`. See [API Keys](../developers/api-keys.md).

---

## Agent step 1 — install a client

Pick one. All three hit the same API.

{% tabs %}
{% tab title="MCP" %}
```bash
npx -y add-mcp https://mcp.floelabs.xyz/mcp
```

Claude Code:

```bash
claude mcp add --transport http floe https://mcp.floelabs.xyz/mcp \
  --header "Authorization: Bearer YOUR_FLOE_KEY"
```

Local stdio (key from the environment):

```bash
npx -y @floelabs/mcp-server --stdio
```

65 tools — see [MCP Server](../developers/mcp-server.md).
{% endtab %}
{% tab title="CLI" %}
```bash
npm i -g floe-agent    # installs BOTH bins: `floe` and `floe-agent`
```

`--json` on every command; exit codes `0` ok, `1` error, `2` usage, `4` auth required, `5` payment required. See [Floe CLI](../developers/cli.md).
{% endtab %}
{% tab title="REST" %}
No install — send `Authorization: Bearer $FLOE_API_KEY` to `https://credit-api.floelabs.xyz`. Spec: [`/.well-known/openapi.yaml`](https://credit-api.floelabs.xyz/.well-known/openapi.yaml).
{% endtab %}
{% endtabs %}

---

## Agent step 2 — verify the credential

```bash
floe status --json
```

REST equivalent:

```bash
curl https://credit-api.floelabs.xyz/v1/developer/profile \
  -H "Authorization: Bearer $FLOE_API_KEY"
```

A `401` means the key is missing or wrong — go back to human step 1. To find out which optional surfaces (LLM gateway, Venice proxy, telephony) are live before depending on them, probe the public `GET /v1/capabilities`; a route missing there is configuration, not a bug in your code.

---

## Agent step 3 — provision an agent and its runtime key

```bash
floe agents create --name research-bot   # → agentId (12 in the examples below)
floe agents keys create 12 --budget 5    # → floe_... agent key, shown once
```

REST equivalent:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents \
  -H "Authorization: Bearer $FLOE_API_KEY" -H "Content-Type: application/json" \
  -d '{"name": "research-bot"}'
# → { "agentId": 12, "privyWalletAddress": "0x...", ... }

# budgetRaw is raw 6-decimal USDC: 5000000 = $5
curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents/12/keys \
  -H "Authorization: Bearer $FLOE_API_KEY" -H "Content-Type: application/json" \
  -d '{"label": "runtime", "budgetRaw": "5000000"}'
```

Creating the agent provisions a managed wallet and an on-chain operator delegation in one call; if it is the account's first agent, the $3 welcome credit lands with it. The plaintext agent key is returned exactly once — store it in the environment as `FLOE_AGENT_KEY` (the credential the payment steps below use), never in chat. A `floe_live_` developer key cannot pay — the proxy rejects it with `wrong_credential_type`.

---

## Agent step 4 — set guardrails before spending

```bash
floe limit set 5 --agent 12                          # session spend cap, USD
floe policy set --kind api --match api.exa.ai --limit 2 \
  --window-kind rolling --window-seconds 86400 --agent 12   # rolling daily cap for one vendor
```

REST equivalent (amounts are raw 6-decimal USDC):

```bash
curl -X PUT https://credit-api.floelabs.xyz/v1/developer/agents/12/spend-limit \
  -H "Authorization: Bearer $FLOE_API_KEY" -H "Content-Type: application/json" \
  -d '{"limitRaw": "5000000"}'

curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents/12/policies \
  -H "Authorization: Bearer $FLOE_API_KEY" -H "Content-Type: application/json" \
  -d '{"kind": "api", "matchKey": "api.exa.ai", "matchKind": "host_exact", "limitRaw": "2000000", "windowKind": "rolling", "windowSeconds": 86400}'
```

Caps are enforced server-side, before money moves — a runaway loop cannot spend past them. Full surface: [Spend Controls](../developers/spend-controls.md).

---

## Agent step 5 — price the call, then make it

Preflight first. `estimate` never spends:

```bash
floe estimate https://api.exa.ai/contents --method POST
```

Then pay. The cheapest verified vendor in the directory is **Exa Contents at $0.001/page** — a real call, well inside the welcome credit:

```bash
floe pay https://api.exa.ai/contents --method POST \
  --body '{"urls":["https://example.com"],"text":true}'
```

REST equivalent (agent key — the proxy fetches the vendor URL and settles the x402 charge for you):

```bash
curl -i -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_AGENT_KEY" -H "Content-Type: application/json" \
  -d '{"url": "https://api.exa.ai/contents", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"urls\":[\"https://example.com\"],\"text\":true}"}'
```

A settled call returns `200` with the vendor's payload as the body and the receipt in the headers:

```
HTTP/2 200
X-Floe-Cost-USDC: 1000        ← raw 6-decimal USDC: 1000 = $0.001
```

That header is the proof the whole rail works: your agent just bought something. Other cheap first targets are in the [Search](../x402-directory/search.md) and [Browser](../x402-directory/browser.md) directory pages.

---

## Agent step 6 — hand funding back to the human

Funding is the one step an agent cannot do alone.

```bash
floe fund 12
```

REST equivalent:

```bash
curl https://credit-api.floelabs.xyz/v1/developer/agents/12/funding \
  -H "Authorization: Bearer $FLOE_API_KEY"
# → { "depositAddress": "0x...", "chainId": 8453, "token": "USDC", ... }
```

The agent should say something like:

> "My Floe balance is exhausted. Top me up from the dashboard — Agents → research-bot → **Fund Wallet** — card, Apple Pay, Google Pay, or bank transfer all work."

The dashboard is the preferred path. A raw transfer must be **USDC on Base (chain 8453)** to the deposit address above; other tokens or networks are lost funds. See [Funding your agent](../getting-started/funding.md).

---

## When something goes wrong

| Signal | Meaning | Do this |
|---|---|---|
| `401` / CLI exit `4` | No key, wrong key, or wrong key *type* | Developer key for lifecycle calls, agent key for payment calls |
| `402 insufficient_balance` / CLI exit `5` | The balance is exhausted | Run the funding handoff above; retry only once `available >= required` |
| `402 spend_limit_exceeded` | The session cap blocked it | Wait for the window, or ask the human to raise the cap |
| `402 policy_exceeded` | A specific policy blocked it — the body names `kind` and `matchKey` | Re-plan against a cheaper vendor, or raise that one policy |
| `403 host_not_allowlisted` / `vendor_not_allowlisted` | Merchant allowlist is on and this destination isn't on it | Add the entry (`floe allowlist add`) or use a listed vendor |
| `429` | Rate limited | Back off and retry with the same idempotency key |

The complete error matrix and retry rules are in the [Agent Runtime Contract](../developers/agent-runtime-contract.md) — write your loop against that page, not against status codes alone.

---

## Next steps

- [Set up with your AI tools](../getting-started/setup-with-ai-tools.md) — deep links and per-client MCP configs
- [Floe CLI](../developers/cli.md) — every command, flag, and exit code
- [MCP Server](../developers/mcp-server.md) — all 65 tools with input schemas
- [Agent Awareness](../developers/agent-awareness.md) — the decision-loop primitives an agent calls before spending
- [How Agents Pay With Floe](credit-for-agents.md) — the mechanics underneath
