---
icon: code
---

# Ledger Sync API

`POST /v1/agents/ledger/sync` ingests a `floe-guard` local spend ledger into Floe's [Reconcile Mode](webhooks.md#connect-your-orchestrator-reconcile-mode). Each synced event becomes a **reconciled** row on the agent's ledger — visible on the [Coverage Score](../build/coverage-score.md), attributable in billing, and **moving no balance**.

For the guide, the privacy model, and the client/CLI examples, see [Ledger sync — coverage for BYOK & self-hosted spend](../build/ledger-sync.md).

{% hint style="info" %}
**Rolling out.** This endpoint is being enabled per account. A `404` means it isn't live for you yet — request access at [hello@floefinance.com](mailto:hello@floefinance.com).
{% endhint %}

**Base URL:** `https://credit-api.floelabs.xyz`

## Authentication

An **agent** runtime key with **`read_write`** permission, sent as a bearer token:

```
Authorization: Bearer floe_<hex>
```

This is the agent's `floe_…` key (mint via `POST /v1/developer/agents/:id/keys` with `"permissions": "read_write"`, or the [dashboard](developer-dashboard.md)) — **not** a `floe_live_…` developer key, and **not** a read-only agent key. Both are rejected `401`. See [API Keys](api-keys.md) for the key-type table.

## Request

```
Content-Type: application/x-ndjson
```

The body is newline-delimited JSON: **one `export_log()` event per line**. This is exactly what the `floe-guard` client sends — priced spend events only.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/agents/ledger/sync" \
  -H "Authorization: Bearer floe_YOUR_AGENT_KEY" \
  -H "Content-Type: application/x-ndjson" \
  --data-binary $'{"timestamp":"2026-08-16T14:30:00Z","kind":"llm","model_or_tool":"openai/gpt-4o","prompt_tokens":1200,"completion_tokens":420,"cost_usd":0.0064,"label":"nightly-crawl"}\n{"timestamp":"2026-08-16T14:30:12Z","kind":"tool","model_or_tool":"exa.search","prompt_tokens":null,"completion_tokens":null,"cost_usd":0.01}'
```

### Event fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | string | Yes | When the spend occurred (ISO 8601). |
| `kind` | string | Yes | `"llm"` or `"tool"`. |
| `model_or_tool` | string | Yes | The model id (`openai/gpt-4o`) or tool identifier the cost is attributed to. |
| `prompt_tokens` | number \| null | Yes | Input tokens for `llm` events; `null` for `tool` events. |
| `completion_tokens` | number \| null | Yes | Output tokens for `llm` events; `null` for `tool` events. |
| `cost_usd` | number | Yes | Priced cost of the call, in **USD** (a decimal, e.g. `0.0064`). This is the guard's local USD ledger value echoed verbatim — note it is **not** the raw 6-decimal USDC-units convention used elsewhere in this API. |
| `label` | string | No | The one free-form field you may set — used for attribution. The only caller-supplied identifier the endpoint accepts; there is no field for prompts, content, or user ids. |
| `reserved` | boolean | No | Marks a held-but-not-yet-settled row from the guard's reservation flow. Optional. |

Any line whose shape falls outside this schema is counted in `rejected` (see below) — it does not fail the whole request.

## Response

`200 OK`:

```json
{
  "synced": 128,
  "duplicates": 3,
  "rejected": 1
}
```

| Field | Meaning |
|-------|---------|
| `synced` | Events written as new reconciled ledger rows. |
| `duplicates` | Events already present (idempotent re-sync) — counted, not re-written. |
| `rejected` | Malformed or schema-invalid lines that were skipped. |

**Idempotent.** Re-syncing the same events is safe — repeats land in `duplicates`, never double-counted. Call `sync()` on a timer or at shutdown without bookkeeping.

**Writes a reconciled row. Moves no balance.** Ingest counts against coverage and attribution; it debits nothing and never suspends the agent.

## Limits & errors

| Status | Condition | Notes |
|--------|-----------|-------|
| `400` | Empty or unparseable body | No line could be read. Nothing is written. |
| `401` | Missing / invalid key, developer key, or read-only agent key | Needs a `read_write` agent key. |
| `404` | Endpoint not enabled for this account | Rolling out — see the availability note above. |
| `413` | Body > **1 MiB**, or > **5000 events** in one request | Split the ledger into smaller batches. |
| `429` | Per-agent rate limit exceeded | Back off and retry; `sync()` less frequently. |

Malformed **lines** inside an otherwise-valid body are not an error — they're tallied in the `200` response's `rejected` count. A `400` is reserved for a body that yields **no** usable lines at all.

## Related

- [Ledger sync guide](../build/ledger-sync.md) — problem, privacy model, client & CLI usage.
- [Coverage Score](../build/coverage-score.md) — where synced spend shows up (reconciled bucket).
- [Reconcile Mode](webhooks.md#connect-your-orchestrator-reconcile-mode) — the hosted-orchestrator path to the same ledger.
- [Credit REST API](credit-api.md) — the rest of the agent & developer surface.
