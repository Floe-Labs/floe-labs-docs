---
icon: search
---

# Search

Web search APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Exa | Search, Contents | $0.007 / search, $0.001 / page | Verified |
| Parallel AI | Search, Extract, Deep Research | $0.01–$0.30 / call | Verified |
| Tavily Search | Search | $0.01 / search | Verified |

---

## Exa — Search

**Endpoint:** `POST https://api.exa.ai/search`
**Price:** $0.007 USDC per search (instant/auto/fast) · Base mainnet · x402 v2

> AI-powered web search across instant, fast, deep, and deep-reasoning modes. Up to 10 results per call.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.exa.ai/search", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"query\":\"latest developments in AI agent frameworks\",\"type\":\"auto\",\"numResults\":5}"}'
```

## Exa — Contents

**Endpoint:** `POST https://api.exa.ai/contents`
**Price:** $0.001 USDC per page · Base mainnet · x402 v2

> Extract clean text, highlights, or summaries from any URL.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.exa.ai/contents", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"urls\":[\"https://example.com\"],\"text\":true}"}'
```

## Parallel AI — Search

**Endpoint:** `POST https://parallelmpp.dev/api/search`
**Price:** $0.01 USDC per search · Base mainnet · x402 v2

> AI web research — "one-shot" (comprehensive) or "fast" mode with structured results.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://parallelmpp.dev/api/search", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"query\":\"AI agent payments 2026\",\"mode\":\"one-shot\"}"}'
```

## Parallel AI — Extract

**Endpoint:** `POST https://parallelmpp.dev/api/extract`
**Price:** $0.01 USDC per URL · Base mainnet · x402 v2

> Extract structured data from one or more URLs with an optional objective.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://parallelmpp.dev/api/extract", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"urls\":[\"https://example.com\"],\"objective\":\"Extract key facts\"}"}'
```

## Parallel AI — Deep Research Task

**Endpoint:** `POST https://parallelmpp.dev/api/task`
**Price:** $0.30 USDC per task · Base mainnet · x402 v2

> Async deep research — returns a run_id. Poll `GET /api/task/<run_id>` for results (free, no x402).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://parallelmpp.dev/api/task", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"input\":\"HVAC market overview USA\",\"processor\":\"ultra\"}"}'
```

---

## Tavily Search

**Endpoint:** `POST https://x402.tavily.com/search`
**Price:** $0.01 USDC per search (advanced depth) · Base mainnet · x402 v2
**Pricing API:** `GET https://x402.tavily.com/.well-known/pricing`

> Advanced web search with ranked results, snippets, source URLs, and optional generated answers. Always uses advanced search depth.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.tavily.com/search", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"query\":\"latest developments in AI agent frameworks\",\"max_results\":5}"}'
```
