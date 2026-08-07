---
icon: download
---

# Installation

Pick the surface that matches how your agent runs. All you need after this is a Floe key ([Authentication](authentication.md)).

## SDKs

{% tabs %}
{% tab title="TypeScript" %}
```bash
npm install floe-agent
```
```typescript
import { FloeAgent } from "floe-agent";
const agent = new FloeAgent({ apiKey: process.env.FLOE_API_KEY! });
```
{% endtab %}
{% tab title="Python" %}
```bash
pip install floe-agentkit-actions
```
```python
import os
from floe_agentkit_actions import FloeAgent
agent = FloeAgent(api_key=os.environ["FLOE_API_KEY"])
```
{% endtab %}
{% endtabs %}

## MCP (Claude Code, Cursor, Claude Desktop)

No install — point your MCP client at the hosted server:

```bash
claude mcp add --transport http floe https://mcp.floelabs.xyz/mcp \
  --header "Authorization: Bearer $FLOE_API_KEY"
```

Or run it locally: `FLOE_API_KEY=... npx -y @floelabs/mcp-server --stdio`. See the [MCP Server](../developers/mcp-server.md) guide.

## REST (any language)

Nothing to install — every capability is one HTTP call with a `Bearer` header:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/chat/completions \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o","messages":[{"role":"user","content":"hi"}]}'
```

## CLI

```bash
npm install -g @floelabs/cli   # the `floe` platform CLI
npx @floelabs/cli init         # or just run the onboarding once, straight from npm
```

`@floelabs/cli` (bin `floe`) is the full platform CLI — setup, agents, keys, budgets, policies, billing, funds, phone, and metered calls, at parity with the dashboard. The `floe-agent` SDK package ships its own `floe-agent` bin: the AgentKit-companion CLI for the agent-runtime SDK. See [Floe CLI](../developers/cli.md).

## Next

- [Authentication](authentication.md) — your Floe key
- [Add Floe to your existing pipeline](integrate-existing-pipeline.md) — the one-line LLM swap
- [Quickstart (5 minutes)](quickstart.md)
