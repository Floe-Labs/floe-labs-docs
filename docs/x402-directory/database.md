---
icon: database
---

# Database & Memory

Vector database and agent-memory APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| HydraDB | Query, Ingest, Status, List, Delete, Tenant management | flat per-op | Verified |

HydraDB is a non-x402 vendor re-exposed as Floe endpoints by the [marketplace shim](../developers/marketplace-shim.md). You call each route through the proxy with your Floe key, and the shim charges a flat per-operation price against your credit line — no HydraDB account or key required.

> **Per-payer isolation.** `tenant_id` is auto-derived and forced per agent by the shim — you never set it, and you can't reach another payer's data (hard isolation). Within your tenant, you control namespacing yourself with the optional `subTenantId` field on every request.

---

## HydraDB — Query

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/db/hydradb/query`
**Price:** $0.002 USDC per query · Base mainnet · billed via the Floe marketplace shim

> Search stored memories and knowledge. Supports keyword/semantic modes and field-scoped queries.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/db/hydradb/query", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"query\":\"What did the user say about pricing?\",\"type\":\"memory\",\"maxResults\":5}"}'
```

Request body: `{ query, type?, queryBy?, mode?, maxResults?, subTenantId? }`

## HydraDB — Ingest

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/db/hydradb/ingest`
**Price:** $0.004 USDC per item · Base mainnet · billed via the Floe marketplace shim

> Store memories or app knowledge. Billed per item ingested.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/db/hydradb/ingest", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"type\":\"memory\",\"memories\":[{\"text\":\"User prefers email over phone.\",\"infer\":true}]}"}'
```

Request body: `{ type: 'memory' | 'knowledge', memories?: [{ text, infer? }], appKnowledge?, subTenantId? }`

## HydraDB — Status

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/db/hydradb/status`
**Price:** $0.0005 USDC per call · Base mainnet · billed via the Floe marketplace shim

> Check the processing status of one or more ingested items by id.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/db/hydradb/status", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"ids\":[\"mem_abc123\",\"mem_def456\"]}"}'
```

Request body: `{ ids: [string], subTenantId? }`

## HydraDB — List

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/db/hydradb/list`
**Price:** $0.001 USDC per call · Base mainnet · billed via the Floe marketplace shim

> List stored items with optional type filter and pagination.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/db/hydradb/list", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"type\":\"memory\",\"limit\":20,\"offset\":0}"}'
```

Request body: `{ type?, subTenantId?, limit?, offset? }`

## HydraDB — Delete

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/db/hydradb/delete`
**Price:** $0.001 USDC per call · Base mainnet · billed via the Floe marketplace shim

> Delete stored items by id.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/db/hydradb/delete", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"ids\":[\"mem_abc123\"],\"type\":\"memory\"}"}'
```

Request body: `{ ids: [string], type?, subTenantId? }`

---

## Tenant management

`tenant_id` is forced per agent by the shim and gives you hard isolation from every other payer. These routes manage **sub-tenants** and metadata inside your own tenant — you control sub-tenant namespacing yourself via `subTenantId` on the data routes above.

### HydraDB — Tenant Create

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/db/hydradb/tenant/create`
**Price:** $0.005 USDC per call · Base mainnet · billed via the Floe marketplace shim

> Create a sub-tenant within your forced tenant, optionally with a metadata schema.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/db/hydradb/tenant/create", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"tenantMetadataSchema\":{\"role\":\"string\"}}"}'
```

Request body: `{ tenantMetadataSchema? }`

### HydraDB — Tenant Status

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/db/hydradb/tenant/status`
**Price:** $0.0005 USDC per call · Base mainnet · billed via the Floe marketplace shim

> Report the status of your tenant.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/db/hydradb/tenant/status", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{}"}'
```

Request body: `{}`

### HydraDB — Tenant Delete

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/db/hydradb/tenant/delete`
**Price:** $0.002 USDC per call · Base mainnet · billed via the Floe marketplace shim

> Delete your tenant and its data. Requires explicit confirmation.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/db/hydradb/tenant/delete", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"confirm\":true}"}'
```

Request body: `{ confirm: true }`
