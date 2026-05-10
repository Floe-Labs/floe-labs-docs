---
icon: globe
---

# Plain HTTP / REST `GA`

Not using a framework? Call the Floe Credit REST API directly. Any HTTP client works.

## Authenticate

```
Authorization: Bearer floe_live_YOUR_API_KEY
```

Get a key at [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz).

## Example: borrow

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/loans/instant_borrow \
  -H "Authorization: Bearer floe_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "borrow_amount": "5000000",
    "collateral_amount": "6000000",
    "max_interest_rate_bps": "1200",
    "duration": "604800"
  }'
```

The response includes one or more **unsigned transactions** — sign locally and broadcast. See the [Credit REST API](../developers/credit-api.md) for the full surface.

## Pay an x402 API

Proxy any URL through the Floe facilitator:

```bash
curl -X POST https://x402.floelabs.xyz/proxy/fetch \
  -H "Authorization: Bearer floe_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/premium",
    "method": "POST",
    "body": {"prompt": "..."}
  }'
```

Floe signs, settles, and verifies. You get the target API's response.

## OpenAPI

A machine-readable OpenAPI spec for the Credit REST API is in `/api/openapi.yaml` (rendered in this site's API Reference section).
