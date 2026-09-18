---
icon: wrench
---

# Agent Tooling

MCP servers, workflows, and agent orchestration. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| Arch AI Tools | Arch AI | $0.01 | POST | Verified |
| Flight Fare Intelligence | ForgeMesh Labs | $0.001 | GET | unverified |
| Fluora | Fluora | $0.01 | POST | Verified |
| ForgeMesh Library | ForgeMesh Labs | $0.003 | POST | unverified |
| Latinum | Latinum | $0.005 | POST | Verified |
| Layoff & Workforce Disruption Tracker | ForgeMesh Labs | $0.01 | GET | unverified |
| Locus | Locus | $0.005 | GET | Verified |
| MCPay | MCPay | $0.001 | POST | Verified |
| Obol | Obol | $5.00 | POST | Verified |
| SEO Authority API | ForgeMesh Labs | $0.01 | GET | unverified |
| Travel Planning & Trip Intelligence | ForgeMesh Labs | $0.01 | GET | unverified |
| x402 Utility APIs for AI Agents — ForgeMesh Utility Grid | ForgeMesh Labs | $0.001 | POST | unverified |

---

## Arch AI Tools

**Provider:** [Arch AI](https://arch.ai)
**Endpoint:** `POST https://api.arch.ai/v1/tools`
**Price:** $0.01 USDC per call · Base mainnet
**Floe compatible:** Yes

> Multi-tool MCP server with 53+ tools and x402.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.arch.ai/v1/tools", "method": "POST"}'
```

## Flight Fare Intelligence

**Provider:** [ForgeMesh Labs](https://travel.forgemesh.io)
**Endpoint:** `GET https://travel.forgemesh.io/api/fare-pulse`
**Price:** $0.001 USDC per call · Base mainnet
**Floe compatible:** Yes

> Fare Pulse — cheapest live fares from JFK ($0.001)

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://travel.forgemesh.io/api/fare-pulse", "method": "GET"}'
```

## Fluora

**Provider:** [Fluora](https://fluora.xyz)
**Endpoint:** `POST https://api.fluora.xyz/v1/workflow`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Agent workflow orchestration with x402 billing.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.fluora.xyz/v1/workflow", "method": "POST"}'
```

## ForgeMesh Library

**Provider:** [ForgeMesh Labs](https://library.forgemesh.io)
**Endpoint:** `POST https://library.forgemesh.io/adventure`
**Price:** $0.003 USDC per call · Base mainnet
**Floe compatible:** Yes

> Curated shelf of public-domain adventure fiction, ranked by historical popularity. Returns title, author, year, book_id, and drill-down routes for full-text retrieval. No license, no API key required.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://library.forgemesh.io/adventure", "method": "POST"}'
```

## Latinum

**Provider:** [Latinum](https://latinum.xyz)
**Endpoint:** `POST https://api.latinum.xyz/v1/orchestrate`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Agent-to-agent payment orchestration.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.latinum.xyz/v1/orchestrate", "method": "POST"}'
```

## Layoff & Workforce Disruption Tracker

**Provider:** [ForgeMesh Labs](https://disruption.forgemesh.io)
**Endpoint:** `GET https://disruption.forgemesh.io/companies/names`
**Price:** $0.01 USDC per call · Base mainnet
**Floe compatible:** Yes

> Returns matching company names with IDs plus links to their profile and intelligence endpoints — use it to resolve a search into specific companies before paying for deeper data

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://disruption.forgemesh.io/companies/names", "method": "GET"}'
```

## Locus

**Provider:** [Locus](https://locus.xyz)
**Endpoint:** `GET https://api.locus.xyz/v1/geo`
**Price:** $0.005 USDC per call · Base mainnet
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
**Price:** $0.001 USDC per call (dynamic) · Base mainnet
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
**Price:** $5.00 USDC per call · Base mainnet
**Floe compatible:** Yes

> AI code generation that opens GitHub PRs.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.obol.dev/v1/codegen", "method": "POST"}'
```

## SEO Authority API

**Provider:** [ForgeMesh Labs](https://seo.forgemesh.io)
**Endpoint:** `GET https://seo.forgemesh.io/v1/domain-authority`
**Price:** $0.01 USDC per call · Base mainnet
**Floe compatible:** Yes

> Measure one domain's open-web authority

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://seo.forgemesh.io/v1/domain-authority", "method": "GET"}'
```

## Travel Planning & Trip Intelligence

**Provider:** [ForgeMesh Labs](https://travel-agent.forgemesh.io)
**Endpoint:** `GET https://travel-agent.forgemesh.io/api/transit-providers`
**Price:** $0.01 USDC per call · Base mainnet
**Floe compatible:** Yes

> Live paid mobility options finder

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://travel-agent.forgemesh.io/api/transit-providers", "method": "GET"}'
```

## x402 Utility APIs for AI Agents — ForgeMesh Utility Grid

**Provider:** [ForgeMesh Labs](https://x402.forgemesh.io)
**Endpoint:** `POST https://x402.forgemesh.io/agent-fortune`
**Price:** $0.001 USDC per call · Base mainnet
**Floe compatible:** Yes

> Agent fortune API: a fortune cookie written specifically for AI agents ('A cached response is worth two upstream calls')

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.forgemesh.io/agent-fortune", "method": "POST"}'
```

