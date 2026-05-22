---
icon: newspaper
---

# Social & News

Social media data, news signals, and content. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| Gloria AI | Gloria AI | $0.005 | GET | Verified |
| Neynar Farcaster | Neynar | $0.001 | GET | Verified |
| Postera | Postera | $0.01 | GET | Verified |

---

## Gloria AI

**Provider:** [Gloria AI](https://gloria.ai)
**Endpoint:** `GET https://api.gloria.ai/v1/signals`
**Price:** $0.005 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Real-time structured news signals for agents.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.gloria.ai/v1/signals", "method": "GET"}'
```

## Neynar Farcaster

**Provider:** [Neynar](https://neynar.com)
**Endpoint:** `GET https://api.neynar.com/v2/farcaster/x402/cast`
**Price:** $0.001 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Farcaster cast data. No API keys, pay-per-call USDC.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.neynar.com/v2/farcaster/x402/cast", "method": "GET"}'
```

## Postera

**Provider:** [Postera](https://postera.ai)
**Endpoint:** `GET https://api.postera.ai/v1/read`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Per-read article paywall for AI agents.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.postera.ai/v1/read", "method": "GET"}'
```

