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
| Kurier | Horizen Labs | $0.10 | POST | Verified |
| SocioLogic | SocioLogic | $0.001 | GET | Verified |

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
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** No

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
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Pay-per-crawl for AI agents accessing web content.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.cloudflare.com/crawl", "method": "POST"}'
```

## Kurier

**Provider:** [Horizen Labs](https://kurier.dev)
**Endpoint:** `POST https://api.kurier.dev/v1/proof`
**Price:** $0.10 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Pay-as-you-go ZK proof submission and verification.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.kurier.dev/v1/proof", "method": "POST"}'
```

## SocioLogic

**Provider:** [SocioLogic](https://sociologic.xyz)
**Endpoint:** `GET https://api.sociologic.xyz/v1/rng`
**Price:** $0.001 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Verifiable random number generation API.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.sociologic.xyz/v1/rng", "method": "GET"}'
```

