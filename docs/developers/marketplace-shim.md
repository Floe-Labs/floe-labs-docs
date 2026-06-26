---
icon: store
---

# Marketplace Shim

The **marketplace shim** lets Floe list vendors that don't speak x402 natively — like [Deepgram](../x402-directory/voice.md#deepgram-speech-to-text) and [HydraDB](../x402-directory/database.md) — and have agents consume them exactly like every other storefront vendor. It re-exposes those vendors as plain Floe endpoints under one host:

```
Host:  https://marketplace.floelabs.xyz
```

You never call that host directly. You call it **through Floe's proxy**, just like any x402 API in the [vendor marketplace](../x402-directory/README.md). The shim handles talking to the upstream vendor and reports the cost back to Floe so it can be billed from your credit line.

## Why it exists

Most vendors in the directory expose their own x402 endpoint — they return a `402 PAYMENT-REQUIRED`, and the [facilitator](x402-facilitator.md) settles USDC on Base. Some valuable vendors don't have an x402 surface at all. Rather than make agents integrate each one with bespoke auth and billing, Floe runs a thin shim that:

- Re-exposes each non-x402 vendor as a stable Floe route (e.g. `POST /v1/stt/deepgram`, `POST /v1/db/hydradb/query`).
- Holds the upstream vendor credentials so you don't need a vendor account or key.
- **Meters every request** and reports the cost to Floe, which debits your credit line — the same prepaid balance you use for x402 APIs.

The result: shim-backed vendors are consumed **uniformly** with everything else. Same Floe key, same proxy call, same credit line.

## How you call it

Wrap the marketplace route in the standard proxy envelope — a Floe key plus an inner `{ url, method, headers, body }` whose `url` is the marketplace route:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/<vendor-route>", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "<json string>"}'
```

There's nothing shim-specific in the call. If you can call an x402 vendor through `/v1/proxy/fetch`, you can call a shim-backed vendor — only the inner `url` changes.

## Billing

Shim-backed vendors bill the **same way** as the rest of the marketplace: one Floe key, one credit line, paid through the proxy. The difference is where the price comes from.

| | x402 vendor | Marketplace shim vendor |
|---|---|---|
| Price source | Vendor's `402 PAYMENT-REQUIRED` response | The shim meters the request itself |
| Settlement | Facilitator signs USDC on Base | Floe debits your credit line at the metered cost |
| Pricing model | Per the vendor | Metered (Deepgram: per audio-minute) or flat per-op (HydraDB) |
| Your key | Floe key | Floe key |

You're charged the exact metered amount per request, deducted from the same prepaid balance governed by your [spend controls](spend-controls.md).

## Per-payer tenant isolation (HydraDB)

For stateful vendors like HydraDB, the shim enforces **hard isolation between payers**. It derives a `tenant_id` from your Floe identity and **forces it on every upstream request** — you never set it, and you can't read or write another payer's data. Two agents calling the same HydraDB routes see entirely separate datasets.

Inside your own tenant you still control namespacing: every HydraDB route accepts an optional `subTenantId`, and the tenant-management routes (`tenant/create`, `tenant/status`, `tenant/delete`) operate within the boundary the shim already enforces. See the [Database & Memory](../x402-directory/database.md) directory page for the full route list, request shapes, and prices.

## Available shim vendors

| Vendor | Routes | Directory page |
|---|---|---|
| Deepgram | `POST /v1/stt/deepgram` | [Voice](../x402-directory/voice.md#deepgram-speech-to-text) |
| HydraDB | `POST /v1/db/hydradb/{query,ingest,status,list,delete,tenant/create,tenant/status,tenant/delete}` | [Database & Memory](../x402-directory/database.md) |
