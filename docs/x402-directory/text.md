---
icon: file-text
---

# Text

Web scraping and text extraction APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Firecrawl | Search, Scrape | metered | Verified |
| Hyperbrowser | Fetch, Search | $0.001–$0.01 / call | Verified |
| Jina Reader | Reader | $0.001 / page | Verified |

---

## Firecrawl — Search

**Endpoint:** `POST https://api.firecrawl.dev/v2/x402/search`
**Price:** metered · Base mainnet · x402 v2

> Web, news, and image search with optional sync/async scraping. Up to 10 results per type.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.firecrawl.dev/v2/x402/search", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"query\":\"latest AI agent frameworks\",\"limit\":5}"}'
```

## Firecrawl — Scrape

**Endpoint:** `POST https://api.firecrawl.dev/v1/scrape`
**Price:** $0.010 USDC per page · Base mainnet · x402 v2

> Render and extract structured content from any URL as markdown, HTML, or screenshots.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.firecrawl.dev/v1/scrape", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"url\":\"https://news.ycombinator.com\",\"formats\":[\"markdown\"]}"}'
```

## Hyperbrowser — Fetch

**Endpoint:** `POST https://api.hyperbrowser.ai/x402/web/fetch`
**Price:** $0.001 USDC per page (base) · up to $0.015 with proxy + JSON · Base mainnet · x402 v2

> Render any URL via headless browser and extract content. Optional proxy and JSON output modes.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.hyperbrowser.ai/x402/web/fetch", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"url\":\"https://news.ycombinator.com\"}"}'
```

## Hyperbrowser — Search

**Endpoint:** `POST https://api.hyperbrowser.ai/x402/web/search`
**Price:** $0.005 USDC per query · up to $0.01 with location · Base mainnet · x402 v2

> Web search with optional geo-location filtering and advanced query controls.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.hyperbrowser.ai/x402/web/search", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"query\":\"AI agent infrastructure 2026\"}"}'
```

---

## Jina Reader

**Endpoint:** `GET https://r.jina.ai/https://example.com`
**Price:** $0.001 USDC per page · Base mainnet · x402 v2

> Clean markdown from any web page in one call.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://r.jina.ai/https://example.com", "method": "GET"}'
```
