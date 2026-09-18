---
icon: globe
---

# Web Search & Scraping

Web search, scraping, and data extraction. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| Apify | Apify | $0.01 | POST | Verified |
| Bloomfilter | Bloomfilter | $0.01 | POST | Verified |
| Exa Contents | Exa | $0.001 | POST | Verified |
| Exa Search | Exa | $0.007 | POST | Verified |
| Firecrawl Search | Firecrawl | $0.01 | POST | Verified |
| Minifetch | Minifetch | $0.001 | POST | Verified |
| Robtex | Robtex | $0.001 | GET | Verified |
| twit.sh | twit.sh | $0.001 | GET | Verified |
| Zyte API | Zyte | $0.01 | POST | Verified |

---

## Apify

**Provider:** [Apify](https://apify.com)
**Endpoint:** `POST https://api.apify.com/v2/x402/run`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Web data platform for scraping, crawling, and automation.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.apify.com/v2/x402/run", "method": "POST"}'
```

## Bloomfilter

**Provider:** [Bloomfilter](https://bloomfilter.io)
**Endpoint:** `POST https://api.bloomfilter.io/v1/domains`
**Price:** $0.01 USDC per call · Base mainnet
**Floe compatible:** Yes

> Domain registration and DNS management with no account.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.bloomfilter.io/v1/domains", "method": "POST"}'
```

## Exa Contents

**Provider:** [Exa](https://exa.ai)
**Endpoint:** `POST https://api.exa.ai/contents`
**Price:** $0.001 USDC per call · Base mainnet
**Floe compatible:** Yes

> Extract clean text, highlights, or summaries from any URL. The cheapest verified endpoint in the directory — the standard first proof-of-life paid call.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.exa.ai/contents", "method": "POST", "headers": {"Content-Type":"application/json"}, "body": "{\"urls\":[\"https://example.com\"],\"text\":true}"}'
```

Returns `200` `application/json`:

```json
{"requestId":"…","results":[{"id":"https://example.com","url":"https://example.com","title":"Example Domain","text":"This domain is for use in illustrative examples…"}]}
```

## Exa Search

**Provider:** [Exa](https://exa.ai)
**Endpoint:** `POST https://api.exa.ai/search`
**Price:** $0.007 USDC per call · Base mainnet
**Floe compatible:** Yes

> AI-native web search API with semantic understanding.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.exa.ai/search", "method": "POST", "headers": {"Content-Type":"application/json"}, "body": "{\"query\":\"latest developments in AI agent frameworks\",\"type\":\"auto\",\"numResults\":5}"}'
```

Returns `200` `application/json`:

```json
{"requestId":"…","results":[{"title":"…","url":"https://…","publishedDate":"2026-07-01","author":"…","score":0.19}]}
```

## Firecrawl Search

**Provider:** [Firecrawl](https://firecrawl.dev)
**Endpoint:** `POST https://api.firecrawl.dev/v2/x402/search`
**Price:** $0.01 USDC per call · Base mainnet
**Floe compatible:** Yes

> Search the web and scrape results to LLM-ready markdown.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.firecrawl.dev/v2/x402/search", "method": "POST", "headers": {"Content-Type":"application/json"}, "body": "{\"query\":\"latest AI agent frameworks\",\"limit\":5}"}'
```

Returns `200` `application/json`:

```json
{"success":true,"data":{"web":[{"title":"…","url":"https://…","description":"…"}]}}
```

## Minifetch

**Provider:** [Minifetch](https://minifetch.dev)
**Endpoint:** `POST https://api.minifetch.dev/fetch`
**Price:** $0.001 USDC per call · Base mainnet
**Floe compatible:** Yes

> Token-efficient page metadata fetches for LLMs.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.minifetch.dev/fetch", "method": "POST"}'
```

## Robtex

**Provider:** [Robtex](https://www.robtex.com)
**Endpoint:** `GET https://api.robtex.com/x402/dns`
**Price:** $0.001 USDC per call · Base mainnet
**Floe compatible:** Yes

> 50+ endpoints: DNS, IP reputation, BGP, passive DNS.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.robtex.com/x402/dns", "method": "GET"}'
```

## twit.sh

**Provider:** [twit.sh](https://twit.sh)
**Endpoint:** `GET https://api.twit.sh/v1/x402/tweets`
**Price:** $0.001 USDC per call · Base mainnet
**Floe compatible:** Yes

> Real-time Twitter/X data. No API keys needed.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.twit.sh/v1/x402/tweets", "method": "GET"}'
```

## Zyte API

**Provider:** [Zyte](https://www.zyte.com)
**Endpoint:** `POST https://api.zyte.com/v1/extract`
**Price:** $0.01 USDC per call · Base mainnet
**Floe compatible:** Yes

> Web scraping with anti-bot unblocking and data extraction.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.zyte.com/v1/extract", "method": "POST"}'
```

