---
icon: robot
---

# Set up with your AI tools

Floe is built so your coding agent does the setup. Paste one prompt into Claude Code, Cursor, or Codex and it installs the MCP server or the CLI, provisions an agent, sets guardrails, and makes a real paid call.

> **You do two things.** Sign in and mint a developer key; fund the balance when the welcome credit runs out. Your agent does everything else — see the [Agent Quickstart](../agents/quickstart-agents.md).

---

## 1. Copy the prompt

```text
Read https://dev-dashboard.floelabs.xyz/agents.md and set up Floe for this project.
```

That URL is an executable runbook written for agents: it triages what you already have, installs the right client, states the key-handling rules, provisions an agent, and ends with a settled $0.001 payment receipt. Pointing at the URL instead of pasting instructions means your agent always reads the current version.

**Or open your tool with the prompt pre-filled:**

- Claude Code — `claude-cli://open?q=Read%20https%3A%2F%2Fdev-dashboard.floelabs.xyz%2Fagents.md%20and%20set%20up%20Floe%20for%20this%20project.`
- Codex — `codex://new?prompt=Read%20https%3A%2F%2Fdev-dashboard.floelabs.xyz%2Fagents.md%20and%20set%20up%20Floe%20for%20this%20project.`
- Cursor — `cursor://anysphere.cursor-deeplink/prompt?text=Read%20https%3A%2F%2Fdev-dashboard.floelabs.xyz%2Fagents.md%20and%20set%20up%20Floe%20for%20this%20project.`

The same button lives on the [dashboard home page](https://dev-dashboard.floelabs.xyz) under **Set up with your AI tools**.

---

## 2. Get your key

Mint a developer key (`floe_live_…`) at [dev-dashboard.floelabs.xyz/keys](https://dev-dashboard.floelabs.xyz/keys) and put it in your environment:

```bash
export FLOE_API_KEY=floe_live_...
```

> **Never paste a key into a chat window.** Environment variables and secret managers only — `agents.md` tells your agent to refuse if it is asked to do otherwise. See [API Keys](../developers/api-keys.md).

---

## 3. Connect a client

{% tabs %}
{% tab title="MCP" %}
Universal installer — detects your MCP clients and writes the config:

```bash
npx -y add-mcp https://mcp.floelabs.xyz/mcp
```

Claude Code, one line:

```bash
claude mcp add --transport http floe https://mcp.floelabs.xyz/mcp \
  --header "Authorization: Bearer YOUR_FLOE_KEY"
```

Any client that takes JSON (Cursor `.cursor/mcp.json`, VS Code, Claude Code):

```json
{
  "mcpServers": {
    "floe": {
      "type": "http",
      "url": "https://mcp.floelabs.xyz/mcp",
      "headers": { "Authorization": "Bearer YOUR_FLOE_KEY" }
    }
  }
}
```

Local stdio instead of the hosted endpoint (key stays in `env`, never in the URL):

```json
{
  "mcpServers": {
    "floe": {
      "command": "npx",
      "args": ["-y", "@floelabs/mcp-server", "--stdio"],
      "env": { "FLOE_API_KEY": "floe_YOUR_AGENT_KEY" }
    }
  }
}
```

One-click install links — the config carries the endpoint URL only, never a key:

- Cursor — `cursor://anysphere.cursor-deeplink/mcp/install?name=floe&config=eyJ1cmwiOiJodHRwczovL21jcC5mbG9lbGFicy54eXovbWNwIn0`
- VS Code — [`https://vscode.dev/redirect/mcp/install?name=floe&config=…`](https://vscode.dev/redirect/mcp/install?name=floe&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.floelabs.xyz%2Fmcp%22%7D)

65 tools, full reference: [MCP Server](../developers/mcp-server.md).
{% endtab %}
{% tab title="CLI" %}
```bash
npm i -g floe-agent      # installs BOTH bins: `floe` and `floe-agent`
floe status --json       # auth + capabilities + balance in one call
```

```bash
floe agents create --name research-bot     # → agentId
floe agents keys create 12 --budget 5      # → floe_... runtime key (shown once)
floe pay https://api.exa.ai/contents --method POST \
  --body '{"urls":["https://example.com"],"text":true}'
```

`--json` on every command; exit codes `0` ok, `1` error, `2` usage, `4` auth required, `5` payment required. Full reference: [Floe CLI](../developers/cli.md).
{% endtab %}
{% tab title="SDK" %}
Both SDKs take the **agent** key (`floe_…`), not the `floe_live_…` developer key: a developer key passes the client's prefix check but the proxy rejects it with `wrong_credential_type`. Mint the agent key with `floe agents keys create <id>` and read it from `FLOE_AGENT_KEY`.

TypeScript:

```bash
npm install floe-agent
```

```typescript
import { FloeAgent } from "floe-agent";

const agent = new FloeAgent({ apiKey: process.env.FLOE_AGENT_KEY! });

const res = await agent.fetch({
  url: "https://api.exa.ai/contents",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ urls: ["https://example.com"], text: true }),
});
console.log(res.body, res.cost);
```

Python:

```bash
pip install floe-agentkit-actions
```

```python
import json, os
from floe_agentkit_actions import FloeAgent

agent = FloeAgent(api_key=os.environ["FLOE_AGENT_KEY"])

result = agent.fetch(
    url="https://api.exa.ai/contents",
    method="POST",
    headers={"Content-Type": "application/json"},
    body=json.dumps({"urls": ["https://example.com"], "text": True}),
)
print(result.body, result.cost)
```
{% endtab %}
{% tab title="REST" %}
No install. Every endpoint takes `Authorization: Bearer <key>` — the developer key for `/v1/developer/*`, the agent key for payments:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.exa.ai/contents", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"urls\":[\"https://example.com\"],\"text\":true}"}'
```

Machine-readable spec: [`/.well-known/openapi.yaml`](https://credit-api.floelabs.xyz/.well-known/openapi.yaml). See [Plain HTTP / REST](../frameworks/http.md).
{% endtab %}
{% endtabs %}

---

## 4. Prove it works

Ask your agent to make its first paid call, or run it yourself:

```bash
floe pay https://api.exa.ai/contents --method POST \
  --body '{"urls":["https://example.com"],"text":true}'
```

That is **$0.001** against the **$3 welcome credit** your first agent starts with — no card required. The response carries the settled receipt in `X-Floe-Cost-USDC`.

---

## What your agent can do from here

| Job | MCP tool | CLI |
|---|---|---|
| Create an agent | `create_agent` | `floe agents create --name <n>` |
| Mint a runtime key | `create_agent_key` | `floe agents keys create <id> --budget <usd>` |
| Cap spend | `set_spend_limit` | `floe limit set <usd> --agent <id>` |
| Price a call first | `estimate_x402_cost` | `floe estimate <url>` |
| Pay a vendor | `x402_pay` | `floe pay <url>` |
| Watch the money | `get_usage_summary` | `floe usage` |
| Hand funding to a human | `get_funding_instructions` | `floe fund <id>` |

## Next steps

- [Agent Quickstart](../agents/quickstart-agents.md) — the full human-does-two-things walkthrough
- [MCP Server](../developers/mcp-server.md) — all 65 tools with input schemas
- [Floe CLI](../developers/cli.md) — every command, flag, and exit code
- [Spend Controls](../developers/spend-controls.md) — the guardrails to set before you let it run
