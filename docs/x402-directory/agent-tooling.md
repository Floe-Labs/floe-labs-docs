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
| Latinum | Latinum | $0.005 | POST | Verified |
| Locus | Locus | $0.005 | GET | Verified |
| MCPay | MCPay | $0.001 | POST | Verified |
| Obol | Obol | $5.00 | POST | Verified |

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
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
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
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Composable crypto skills with MCP + x402.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.heurist.ai/v1/mesh", "method": "POST"}'
```

## Latinum

**Provider:** [Latinum](https://latinum.xyz)
**Endpoint:** `POST https://api.latinum.xyz/v1/orchestrate`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Agent-to-agent payment orchestration.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.latinum.xyz/v1/orchestrate", "method": "POST"}'
```

## Locus

**Provider:** [Locus](https://locus.xyz)
**Endpoint:** `GET https://api.locus.xyz/v1/geo`
**Price:** $0.005 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Geospatial data and location intelligence for agents.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.locus.xyz/v1/geo", "method": "GET"}'
```

## MCPay

**Provider:** [MCPay](https://mcpay.xyz)
**Endpoint:** `POST https://api.mcpay.xyz/v1/pay`
**Price:** $0.001 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Payment layer for MCP tool servers.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.mcpay.xyz/v1/pay", "method": "POST"}'
```

## Obol

**Provider:** [Obol](https://obol.dev)
**Endpoint:** `POST https://api.obol.dev/v1/codegen`
**Price:** $5.00 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> AI code generation that opens GitHub PRs.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.obol.dev/v1/codegen", "method": "POST"}'
```

