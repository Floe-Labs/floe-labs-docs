# MCP Server

Use Floe's hosted MCP server to expose all 23 protocol actions to any [Model Context Protocol](https://modelcontextprotocol.io)-compatible client — Claude Desktop, Cursor, OpenAI Agents SDK, and others.

> **One line to connect.** Zero install. Production-ready.

---

## Why MCP

MCP is the open standard for connecting LLM clients to tools and data. If your agent runtime supports MCP — most do today — Floe shows up as a first-class tool surface alongside everything else the agent can call.

Floe's MCP server exposes the same actions as the AgentKit SDKs:

- Read actions (markets, loans, prices, intents, health)
- Write actions (post intents, match, repay, add/withdraw collateral, liquidate)
- Flash loan actions (raw, arb, deploy, verify)
- 23 actions total

---

## Add Floe to your MCP-compatible client

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "floe": {
      "url": "https://mcp.floelabs.xyz/sse"
    }
  }
}
```

Restart Claude Desktop. Floe actions are now available.

### Cursor

Project `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "floe": {
      "url": "https://mcp.floelabs.xyz/sse"
    }
  }
}
```

### Glama / GitHub MCP Registry

Floe is published on:

- [Glama MCP catalog](https://glama.ai/mcp/servers)
- [GitHub MCP Registry](https://github.com/modelcontextprotocol/servers)

97M+ downloads/month across the registry surface area.

### OpenAI Agents SDK

```python
from openai.agents import Agent
from openai.agents.tools import MCPTool

agent = Agent(
    tools=[
        MCPTool(url="https://mcp.floelabs.xyz/sse", name="floe"),
    ],
)
```

---

## Wallet provisioning

The MCP server itself is stateless. Your agent's wallet is supplied via:

1. **Direct private key** in environment variables (development only)
2. **Coinbase CDP** wallet provider (recommended)
3. **Privy / Turnkey / Dynamic** server-side wallets
4. **AgentKit-compatible** wallet provider passed through

The MCP server does not custody funds. It only signs the actions the agent invokes against the wallet you provide.

---

## Example session (Claude Desktop)

```
You:    What markets does Floe have?
Claude: [calls floe.get_markets]
        Floe has 4 markets on Base mainnet:
        - USDC/WETH, USDC/cbBTC, USDT/WETH, USDT/cbBTC.

You:    Borrow 1000 USDC against 0.5 WETH for 14 days, max 8% APR.
Claude: [calls floe.post_borrow_intent with the args above]
        Borrow intent posted. Hash: 0xabc...
        Waiting for solver to match.
```

---

## Action coverage

The MCP server is 1:1 with the AgentKit SDKs. Full reference: [AgentKit Integration](./agentkit/).

| Category | Count |
|---|---|
| Read | 8 |
| Write | 7 |
| Flash loan | 5 |
| Deploy / verify | 3 |
| **Total** | **23** |

---

## Authentication & rate limits

- **Public read** actions (markets, prices, intents): no auth, soft rate limit
- **Write** actions: signed by your wallet — the wallet is the auth boundary
- **Burst limits:** ~10 RPS per IP for unauthenticated reads. Higher limits available — contact us.

---

## Production checklist

Before going live with MCP-driven Floe agents:

- [ ] Wallet uses a server-side wallet provider (not raw env-var keys)
- [ ] `check_loan_health` is on a timer (≤60s during volatile periods)
- [ ] Slippage bounds set on `repay_loan` / `liquidate_loan` (default 5%)
- [ ] Spend limits enforced at the wallet provider layer (EIP-7702 / ERC-7579)
- [ ] Logging on every write action — chain hash + decoded args
- [ ] Alerts configured for:
  - Match success / failure
  - LTV crossing buffer / danger thresholds
  - Repayment failures

---

## Related

- [AgentKit Integration](./agentkit/) — same actions via SDK
- [Quick Start (Agents)](../getting-started/quick-start-agents.md)
- [Credit REST API](./credit-api.md) — for non-MCP integrations
