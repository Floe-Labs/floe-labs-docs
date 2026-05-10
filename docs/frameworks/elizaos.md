---
icon: hat-wizard
---

# ElizaOS `Preview`

A native ElizaOS plugin for Floe is on the roadmap. Until it ships, ElizaOS agents can use the Floe MCP server.

## Today (MCP fallback)

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

ElizaOS picks up the 36 Floe MCP tools automatically.

## Roadmap

A `@elizaos/plugin-floe` package will provide:

- Wallet bootstrap inside the ElizaOS character config
- One-call borrow / x402 / repay actions wired into character behaviors
- Built-in spend-limit + credit-threshold middleware

[Join the waitlist](https://floelabs.xyz/elizaos) for early access.
