---
icon: message-bot
---

# Claude Desktop / Claude Code / Cursor (MCP) `GA`

Zero-install: point your MCP client at the hosted Floe endpoint.

## Configure

**Claude Desktop / Claude Code:** add to `claude_desktop_config.json` (or via the `/mcp` UI):

```json
{
  "mcpServers": {
    "floe": {
      "url": "https://mcp.floelabs.xyz/mcp",
      "headers": {
        "Authorization": "Bearer floe_live_YOUR_API_KEY"
      }
    }
  }
}
```

**Cursor:** add to `.cursor/mcp.json` with the same shape.

## What you get

All 43 Floe MCP tools — wallet, secured working capital, x402 preflight, credit thresholds, transaction utilities. See the [MCP Server reference](../developers/mcp-server.md).

## Local install (optional)

```bash
npx @floelabs/mcp-server
```

Use this if you want to point the client at a locally running server (handy for development / debugging).

## Example

See [`floe-examples/mcp-demo`](https://github.com/Floe-Labs/floe-examples/tree/main/mcp-demo) for a zero-code Claude Desktop config.
