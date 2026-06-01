---
icon: file-text
---

# Text

Web scraping and text extraction APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Firecrawl | Scrape | $0.010 / page | Verified |
| Jina Reader | Reader | $0.001 / page | Verified |

---

## Firecrawl

**Endpoint:** `POST https://api.firecrawl.dev/v1/x402/scrape`
**Price:** $0.010 USDC per page · Base mainnet · x402 v2

> Render and extract structured content from any URL.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.firecrawl.dev/v1/x402/scrape", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"url\":\"https://news.ycombinator.com\",\"formats\":[\"markdown\"]}"}'
```

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
