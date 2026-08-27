---
icon: robot
---

# OpenAI Agents SDK `Preview`

A native `floe-agent` adapter for the OpenAI Agents SDK is in development. Until it ships, the supported path is **MCP fallback** — the OpenAI Agents SDK speaks MCP and connects to [`@floelabs/mcp-server`](https://github.com/Floe-Labs/floe-mcp-server) directly.

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

Your OpenAI agent now sees all 80 server-exposed Floe MCP tools. A `floe_live_…` developer key unlocks the lifecycle, observability, and webhook tools; runtime tools like `x402_pay` and the spend controls need an agent key (`floe_…`).

## Roadmap

The native adapter will:

- Provide a one-line `import { getOpenAIAgentTools } from "floe-agent"`
- Auto-bind the same 54 actions as the AgentKit provider
- Stream agent-awareness state alongside tool calls

Email [hello@floefinance.com](mailto:hello@floefinance.com) for early access.
