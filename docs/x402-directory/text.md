---
icon: file-text
---

# Text

Web scraping and text extraction APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Firecrawl | Search, Scrape | metered | Verified |

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
