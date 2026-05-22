---
icon: credit-card
---

# Payments & Commerce

Gift cards, merchant payments, fiat rails. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| AEON | AEON | $0.10 | POST | Verified |
| Bitrefill | Bitrefill | $1.00 | POST | Verified |
| Laso Finance | Laso | $0.50 | POST | Verified |
| Stripe Machine Payments | Stripe | $0.10 | POST | Preview |
| tip.md | tip.md | $0.01 | POST | Verified |

---

## AEON

**Provider:** [AEON](https://aeon.xyz)
**Endpoint:** `POST https://api.aeon.xyz/v1/settle`
**Price:** $0.10 USDC per call (dynamic) · Base mainnet · x402 v2
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
**Price:** $1.00 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Gift cards, eSIMs, and mobile top-ups via x402.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.bitrefill.com/v1/x402/purchase", "method": "POST"}'
```

## Laso Finance

**Provider:** [Laso](https://laso.finance)
**Endpoint:** `POST https://api.laso.finance/v1/pay`
**Price:** $0.50 USDC per call (dynamic) · Base mainnet · x402 v2
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
**Price:** $0.10 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

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
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Micropayment tipping for content creators.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.tip.md/v1/tip", "method": "POST"}'
```

