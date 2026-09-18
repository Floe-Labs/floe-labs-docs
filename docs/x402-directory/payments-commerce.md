---
icon: credit-card
---

# Payments & Commerce

Gift cards, merchant payments, fiat rails. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| AEON | AEON | $0.10 | POST | Verified |
| Bitrefill | Bitrefill | $1.00 | POST | Verified |
| ForgeMesh x402 Ads | ForgeMesh Labs | $0.005 | GET | unverified |
| Laso Finance | Laso | $0.50 | POST | Verified |
| Stripe Machine Payments | Stripe | $0.10 | POST | Preview |
| tip.md | tip.md | $0.01 | POST | Verified |
| x402 Swag storefront API | x402 Swag | $0.05 | GET | unverified |

---

## AEON

**Provider:** [AEON](https://aeon.xyz)
**Endpoint:** `POST https://api.aeon.xyz/v1/settle`
**Price:** $0.10 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Real-world merchant settlement in SEA, LATAM, Africa.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.aeon.xyz/v1/settle", "method": "POST"}'
```

## Bitrefill

**Provider:** [Bitrefill](https://www.bitrefill.com)
**Endpoint:** `POST https://api.bitrefill.com/v1/x402/purchase`
**Price:** $1.00 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Gift cards, eSIMs, and mobile top-ups via x402.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.bitrefill.com/v1/x402/purchase", "method": "POST"}'
```

## ForgeMesh x402 Ads

**Provider:** [ForgeMesh Labs](https://ads.forgemesh.io)
**Endpoint:** `GET https://ads.forgemesh.io/api/network/stats`
**Price:** $0.005 USDC per call · Base mainnet
**Floe compatible:** Yes

> Network-wide intent stats

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ads.forgemesh.io/api/network/stats", "method": "GET"}'
```

## Laso Finance

**Provider:** [Laso](https://laso.finance)
**Endpoint:** `POST https://api.laso.finance/v1/pay`
**Price:** $0.50 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Prepaid cards, Venmo/PayPal payments on Base USDC.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.laso.finance/v1/pay", "method": "POST"}'
```

## Stripe Machine Payments

**Provider:** [Stripe](https://stripe.com)
**Endpoint:** `POST https://machine.stripe.com/payments/x402`
**Price:** $0.10 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Preview — verify compatibility before production use

> Machine-to-machine payments via x402 on Base USDC.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://machine.stripe.com/payments/x402", "method": "POST"}'
```

## tip.md

**Provider:** [tip.md](https://tip.md)
**Endpoint:** `POST https://api.tip.md/v1/tip`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Micropayment tipping for content creators.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.tip.md/v1/tip", "method": "POST"}'
```

## x402 Swag storefront API

**Provider:** [x402 Swag](https://x402swag.com)
**Endpoint:** `GET https://x402swag.com/api/agent/catalog`
**Price:** $0.05 USDC per call · Base mainnet
**Floe compatible:** Yes

> Pay-per-call merch catalog: buy a t-shirt, mug, or sticker with USDC in one x402 call

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402swag.com/api/agent/catalog", "method": "GET"}'
```

