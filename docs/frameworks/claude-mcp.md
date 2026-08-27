---
icon: message-bot
---

# Claude Desktop / Claude Code / Cursor (MCP) `GA`

Zero-install: point your MCP client at the hosted Floe endpoint.

## Configure

One line, any client:

```bash
npx -y add-mcp https://mcp.floelabs.xyz/mcp
```

**Claude Code:**

```bash
claude mcp add --transport http floe https://mcp.floelabs.xyz/mcp \
  --header "Authorization: Bearer YOUR_FLOE_KEY"
```

**Claude Desktop / Cursor:** add to `claude_desktop_config.json` or `.cursor/mcp.json`:

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

> **Which key?** Both formats work, and they unlock different tools. A **developer key** (`floe_live_…`) drives the lifecycle tools — create agents, mint and rotate keys, set budgets, read balances and usage, register webhooks. An **agent key** (`floe_…`) drives the runtime tools — `x402_pay`, cost estimates against real credit, spend limits, allowlist. Run one server entry per key if you want both. With **no key at all**, `get_markets`, `check_x402_url`, and `search_floe_docs` still work. See [API Keys](../developers/api-keys.md).

## What you get

All 80 Floe MCP tools — agent lifecycle, key minting, spend controls, cost preflight, **x402 payment execution**, funding instructions, usage analytics, webhooks, and docs search. See the [MCP Server reference](../developers/mcp-server.md) for the full tool catalog.

Narrow the set with scope params — `?read_only=true` or `?features=spend,pricing,payments` on the endpoint URL.

## Local install (optional)

```bash
FLOE_API_KEY=floe_YOUR_AGENT_KEY npx -y @floelabs/mcp-server --stdio
```

Use this if you want the client to spawn the server locally (handy for development / debugging). **`--stdio` matters:** without it the server starts an HTTP listener instead of speaking MCP on stdout.

## Example

See [`floe-cookbook/mcp-demo`](https://github.com/Floe-Labs/floe-cookbook/tree/main/mcp-demo) for a zero-code Claude Desktop config.
