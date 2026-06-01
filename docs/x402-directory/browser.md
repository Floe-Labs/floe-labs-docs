---
icon: globe
---

# Browser

Cloud browser automation and headless rendering — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Hyperbrowser | Fetch, Search | $0.001–$0.01 / call | Verified |
| Browserbase | Browser Session | $0.01–$0.12 / session | Verified |
| Anchor Browser | Browser Session | $0.50 / session | Verified |

---

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

## Browserbase — Browser Session

**Endpoint:** `POST https://x402.browserbase.com/v1/sessions`
**Price:** $0.01–$0.12 USDC per session (5–60 min) · Base mainnet · x402 v2

> Launch a cloud browser session for scraping, testing, or automation. Priced by duration.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.browserbase.com/v1/sessions", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"projectId\":\"<your-project-id>\"}"}'
```

---

## Anchor Browser — Browser Session

**Endpoint:** `POST https://api.anchorbrowser.io/v1/sessions`
**Price:** $0.50 USDC per session · Base mainnet · x402 v2

> Browser automation session with built-in proxy and anti-detection capabilities.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.anchorbrowser.io/v1/sessions", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{}"}'
```
