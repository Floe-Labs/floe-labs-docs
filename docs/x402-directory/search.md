---
icon: search
---

# Search

Web search APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Exa | Search, Contents | $0.007 / search, $0.001 / page | Verified |
| Tavily Search | Search | $0.004 / search | Verified |

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

---

## Tavily Search

**Endpoint:** `POST https://api.tavily.com/search`
**Price:** $0.004 USDC per search · Base mainnet · x402

> Real-time web search results tuned for LLMs.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.tavily.com/search", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"query\":\"latest x402 protocol updates\",\"max_results\":3}"}'
```
