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

Your OpenAI agent now has access to all 43 Floe MCP tools.

## Roadmap

The native adapter will:

- Provide a one-line `import { getOpenAIAgentTools } from "floe-agent"`
- Auto-bind the same 54 actions as the AgentKit provider
- Stream agent-awareness state alongside tool calls

Email [hello@floelabs.xyz](mailto:hello@floelabs.xyz) for early access.
