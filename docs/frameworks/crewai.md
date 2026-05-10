---
icon: users
---

# CrewAI `Beta`

CrewAI agents consume the Floe stack via the **MCP server**. A native Python adapter is on the roadmap.

## Setup

1. Get a Floe API key from [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz).
2. Install `langchain-mcp-adapters` (or any MCP client compatible with CrewAI tools).
3. Point at the hosted Floe MCP endpoint:

```python
from langchain_mcp_adapters import MultiServerMCPClient

async with MultiServerMCPClient({
    "floe": {
        "url": "https://mcp.floelabs.xyz/mcp",
        "headers": {"Authorization": "Bearer floe_live_..."}
    }
}) as client:
    tools = client.get_tools()
    # Hand `tools` to your Crew
```

## Example

See [`floe-examples/crewai-demo`](https://github.com/Floe-Labs/floe-examples/tree/main/crewai-demo) for a runnable Market Analyst + Portfolio Manager crew.
