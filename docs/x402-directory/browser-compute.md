---
icon: desktop
---

# Browser & Compute

Headless browsers, proxies, and compute. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| Agent Camo | Agent Camo | $0.01 | POST | Verified |
| Browserbase | Browserbase | $0.01 | POST | Verified |
| Hyperbrowser | Hyperbrowser | $0.01 | POST | Verified |

---

## Agent Camo

**Provider:** [Agent Camo](https://agentcamo.com)
**Endpoint:** `POST https://api.agentcamo.com/v1/proxy`
**Price:** $0.01 USDC per call · Base mainnet
**Floe compatible:** Yes

> Residential proxy sessions, geo-targeted.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.agentcamo.com/v1/proxy", "method": "POST"}'
```

## Browserbase

**Provider:** [Browserbase](https://browserbase.com)
**Endpoint:** `POST https://api.browserbase.com/v1/session`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Headless browser sessions monetized via x402.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.browserbase.com/v1/session", "method": "POST"}'
```

## Hyperbrowser

**Provider:** [Hyperbrowser](https://hyperbrowser.ai)
**Endpoint:** `POST https://api.hyperbrowser.ai/x402/web/fetch`
**Price:** $0.01 USDC per call · Base mainnet
**Floe compatible:** Yes

> Pay-per-use browser automation for agents.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.hyperbrowser.ai/x402/web/fetch", "method": "POST", "headers": {"Content-Type":"application/json"}, "body": "{\"url\":\"https://news.ycombinator.com\"}"}'
```

Returns `200` `application/json`:

```json
{"url":"https://news.ycombinator.com","markdown":"# Hacker News…"}
```

