---
icon: server
---

# Infrastructure & Gateways

Cloud infrastructure and gateway APIs. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| AWS x402 Reference | AWS | $0.01 | GET | Preview |
| Cloudflare Pay-per-Crawl | Cloudflare | $0.01 | POST | Preview |
| Kurier | Horizen Labs | $0.10 | POST | Verified |
| Obol Blockchain Data — Base Network Status | Obol Blockchain Data | $0.001 | GET | Verified |
| SocioLogic | SocioLogic | $0.001 | GET | Verified |

---

## AWS x402 Reference

**Provider:** [AWS](https://aws.amazon.com)
**Endpoint:** `GET https://docs.aws.amazon.com/x402`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Preview — verify compatibility before production use

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
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Preview — verify compatibility before production use

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
**Price:** $0.10 USDC per call · Base mainnet
**Floe compatible:** Yes

> Pay-as-you-go ZK proof submission and verification.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.kurier.dev/v1/proof", "method": "POST"}'
```

## Obol Blockchain Data — Base Network Status

**Provider:** [Obol Blockchain Data](https://obol.danieldutoit.net)
**Endpoint:** `GET https://obol.danieldutoit.net/v1/base/network-status`
**Price:** $0.001 USDC per call · Base mainnet
**Floe compatible:** Yes

> Current Base chain ID, block number, and block timestamp from two independently operated RPC providers.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://obol.danieldutoit.net/v1/base/network-status", "method": "GET"}'
```

Returns `200` `application/json`:

```json
{"network":"eip155:8453","chain":{"id":8453,"name":"Base"},"observed_block":51132758,"observed_block_hash":"0x3c3ef53d548d15b1da11be5c5eb3e1435fd8e37e9f08a058d134cd1ee5cb7a91","observed_at":"2026-09-10T15:41:03.000Z","provider_consistency":{"agreement":true,"provider_count":2,"providers":["base-public.nodies.app","mainnet.base.org"]}}
```

## SocioLogic

**Provider:** [SocioLogic](https://sociologic.xyz)
**Endpoint:** `GET https://api.sociologic.xyz/v1/rng`
**Price:** $0.001 USDC per call · Base mainnet
**Floe compatible:** Yes

> Verifiable random number generation API.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.sociologic.xyz/v1/rng", "method": "GET"}'
```

