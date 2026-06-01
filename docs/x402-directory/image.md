---
icon: image
---

# Image

Image generation APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Venice AI | Image Generation | metered / image | Verified |

---

## Venice AI — Image Generation

**Endpoint:** `POST https://api.venice.ai/api/v1/image/generate`
**Price:** metered per image · Base mainnet · x402

> Text-to-image across photorealistic, stylized, and uncensored models.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/image/generate", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"venice-sd35\",\"prompt\":\"a neon-lit cyberpunk city at night, cinematic\",\"width\":1024,\"height\":1024}"}'
```
