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

ElizaOS picks up the 80 server-exposed Floe MCP tools automatically. A `floe_live_…` developer key unlocks the lifecycle, observability, and webhook tools; runtime tools like `x402_pay` and the spend controls need an agent key (`floe_…`).

## Roadmap

A `@elizaos/plugin-floe` package will provide:

- Wallet bootstrap inside the ElizaOS character config
- One-call borrow / x402 / repay actions wired into character behaviors
- Built-in spend-limit + credit-threshold middleware

Email [hello@floefinance.com](mailto:hello@floefinance.com) for early access.
