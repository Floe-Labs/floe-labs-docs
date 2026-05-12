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
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
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
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
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
**Endpoint:** `POST https://api.hyperbrowser.ai/v1/browse`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Pay-per-use browser automation for agents.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.hyperbrowser.ai/v1/browse", "method": "POST"}'
```

