---
icon: globe
---

# Plain HTTP / REST `GA`

Not using a framework? Call the Floe Credit REST API directly. Any HTTP client works.

## Authenticate

Two key planes share one header:

```text
Authorization: Bearer floe_live_...   # developer key — lifecycle: /v1/developer/*
Authorization: Bearer floe_...        # agent key — payments: /v1/proxy/fetch, /v1/x402/*
```

Get both at [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz). The payment call below takes the **agent** key — a `floe_live_` developer key is rejected with `wrong_credential_type`.

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

> **Scope.** This governs every paid call Floe settles — x402 payments through the proxy **and** LLM tokens routed through Floe's keyless gateway at `/v1/chat/completions` (or the legacy BYOK metered proxy `/v1/llm/chat/completions`), all on one ledger and one set of caps. A call you send straight to a provider with your own key, bypassing Floe, is the one thing a policy can't see. See [Spend Controls](../developers/spend-controls.md).

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

The Credit API serves its own machine-readable OpenAPI 3.0.3 spec at [`https://credit-api.floelabs.xyz/.well-known/openapi.yaml`](https://credit-api.floelabs.xyz/.well-known/openapi.yaml) — fetch it to generate a client, or point a code agent at it. It is also linked from the API Reference section of this site.

```bash
curl https://credit-api.floelabs.xyz/.well-known/openapi.yaml
```
