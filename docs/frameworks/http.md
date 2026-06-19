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

## Pay an x402 API (the live path)

Proxy any URL through the Floe facilitator. Floe funds the payment from your agent's Floe-managed balance, signs, settles, and verifies — you get the target API's response.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer floe_..." \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/premium",
    "method": "POST",
    "body": {"prompt": "..."}
  }'
```

> **Scope.** This governs x402 payments through the proxy, not raw LLM token bills you pay with your own provider key (those are only metered if routed through Floe's LLM proxy at `/v1/llm/chat/completions`, which is feature-flagged). See [Spend Controls](../developers/spend-controls.md).

## Example: borrow `Roadmap`

> **Roadmap — not generally available.** Borrowing as a developer-facing product is not live. The request below is illustrative of the planned API. To fund an agent today, use the x402 proxy above with a [Floe-managed balance](../getting-started/quickstart.md).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/credit/instant-borrow \
  -H "Authorization: Bearer floe_..." \
  -H "Content-Type: application/json" \
  -d '{
    "borrow_amount": "5000000",
    "collateral_amount": "6000000",
    "max_interest_rate_bps": "1200",
    "duration": "604800"
  }'
```

The response includes one or more **unsigned transactions** — sign locally and broadcast. See the [Credit REST API](../developers/credit-api.md) for the full surface.

## OpenAPI

A machine-readable OpenAPI spec for the Credit REST API is in `/api/openapi.yaml` (rendered in this site's API Reference section).
