---
icon: server
---

# Infrastructure & Gateways

RPC, CDN, and infrastructure APIs. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| Alchemy | Alchemy | $0.001 | POST | Verified |
| AWS x402 Reference | AWS | $0.01 | GET | Preview |
| Cloudflare Pay-per-Crawl | Cloudflare | $0.01 | POST | Preview |

---

## Alchemy

**Provider:** [Alchemy](https://www.alchemy.com)
**Endpoint:** `POST https://api.alchemy.com/v1/x402/rpc`
**Price:** $0.001 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> RPC and web3 APIs via x402.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.alchemy.com/v1/x402/rpc", "method": "POST"}'
```

## AWS x402 Reference

**Provider:** [AWS](https://aws.amazon.com)
**Endpoint:** `GET https://docs.aws.amazon.com/x402`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Monetize any HTTP app with x402 and CloudFront/Lambda@Edge.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://docs.aws.amazon.com/x402", "method": "GET"}'
```

## Cloudflare Pay-per-Crawl

**Provider:** [Cloudflare](https://www.cloudflare.com)
**Endpoint:** `POST https://x402.cloudflare.com/crawl`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Pay-per-crawl for AI agents accessing web content.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.cloudflare.com/crawl", "method": "POST"}'
```

