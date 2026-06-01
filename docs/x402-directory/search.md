---
icon: search
---

# Search

Web search APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Tavily Search | Search | $0.004 / search | Verified |

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
