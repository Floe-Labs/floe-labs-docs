---
icon: wrench
---

# Agent Tooling

MCP servers, workflows, and agent orchestration. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| Arch AI Tools | Arch AI | $0.01 | POST | Verified |
| Fluora | Fluora | $0.01 | POST | Verified |
| Heurist Mesh | Heurist | $0.01 | POST | Verified |
| MCPay | MCPay | $0.001 | POST | Verified |

---

## Arch AI Tools

**Provider:** [Arch AI](https://arch.ai)
**Endpoint:** `POST https://api.arch.ai/v1/tools`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Multi-tool MCP server with 53+ tools and x402.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.arch.ai/v1/tools", "method": "POST"}'
```

## Fluora

**Provider:** [Fluora](https://fluora.xyz)
**Endpoint:** `POST https://api.fluora.xyz/v1/workflow`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Agent workflow orchestration with x402 billing.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.fluora.xyz/v1/workflow", "method": "POST"}'
```

## Heurist Mesh

**Provider:** [Heurist](https://heurist.ai)
**Endpoint:** `POST https://api.heurist.ai/v1/mesh`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Composable crypto skills with MCP + x402.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.heurist.ai/v1/mesh", "method": "POST"}'
```

## MCPay

**Provider:** [MCPay](https://mcpay.xyz)
**Endpoint:** `POST https://api.mcpay.xyz/v1/pay`
**Price:** $0.001 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Payment layer for MCP tool servers.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.mcpay.xyz/v1/pay", "method": "POST"}'
```

