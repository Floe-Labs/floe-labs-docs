---
icon: code
---

# Vendor Actuals API

Read what your **own** vendors charged you, reconciled against their billing records, and manage the read-only billing credentials behind it.

For the concepts — what each status claims, when a cost actually arrives, and why voice-heavy accounts read low — see [Vendor actuals](../build/vendor-actuals.md). This page is the endpoint reference.

**Base URL:** `https://credit-api.floelabs.xyz`

## Authentication

A **developer** credential — a `floe_live_…` key, a dashboard session, or a wallet-signature header set:

```text
Authorization: Bearer floe_live_YOUR_KEY
```

An agent key (`floe_…`) is rejected `403 developer_credential_required`. See [API Keys](api-keys.md).

### Plan gates

| Endpoints | Requires |
|---|---|
| `GET /v1/developer/actuals/legs`, `/calls`, `/rollups`, `/findings` | **Pro** — feature `attribution_reports` |
| `GET /v1/developer/actuals/legs.csv` | **Pro** — also feature `exports` |
| Everything under `/v1/developer/vendor-connections`, and every write under `/v1/developer/actuals` | **Agency** — feature `vendor_connections` |
| `POST`/`PATCH`/`DELETE /v1/developer/vendor-connections*` | Agency **and** an `admin` or `owner` role |

A refusal is `403` with `{ "error": "plan_required", "plan": "<min>", "current": "<yours>", "feature": "…", "upgradeUrl": "…" }`.

Reads ride the existing Pro feature on purpose: a Pro account already pays for cost attribution and should not find its cost column paywalled. Only the credential-holding, money-asserting writes need Agency.

## Reading cost

### `GET /v1/developer/actuals/legs`

One row per captured vendor leg, keyset-paginated.

| Parameter | Type | Notes |
|---|---|---|
| `since` | ISO 8601 | Inclusive. Default: 30 days before `until`. |
| `until` | ISO 8601 | Exclusive — the window is half-open, so a leg on a boundary is counted by exactly one range. Default: now. |
| `vendor` | string | e.g. `twilio`, `openai`, `deepgram`. |
| `customerId` / `agentId` / `campaignId` / `taskId` | string | Attribution filters. |
| `status` | CSV | Any subset of `pending,manual,exact,period-rate,invoiced`. An unrecognised member is a `400`. |
| `limit` | int | 1–500, default 100. |
| `cursor` | string | The previous page's `nextCursor`, passed back verbatim. |

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/actuals/legs?since=2026-08-01T00:00:00Z&customerId=acme" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

```json
{
  "legs": [
    {
      "id": 1,
      "occurredAt": "2026-08-20T10:00:00.000Z",
      "vendor": "openai",
      "legKind": "llm",
      "captureSource": "gateway",
      "vendorRequestId": "req_abc",
      "units": { "input_tokens": "1200", "output_tokens": "420" },
      "unitsProvenance": "vendor_reported",
      "status": "exact",
      "grain": "request",
      "costScope": "leg",
      "costRaw": "6400",
      "currency": "usd",
      "nonUsd": false,
      "attribution": {
        "state": "exact", "agentId": "7", "customerId": "acme",
        "taskId": "call_1", "actionId": null, "campaignId": null
      },
      "provenance": {
        "reason": null,
        "vendorCostNative": "0.0064",
        "vendorCostUnit": "usd",
        "vendorActualId": 88,
        "realizedRate": null,
        "invoiceDocumentId": null,
        "statusBeforeInvoice": null,
        "stampedAt": "2026-08-21T02:14:00.000Z",
        "runId": "rec_2026-08-21T02"
      }
    }
  ],
  "nextCursor": "…",
  "hasMore": false,
  "range": { "since": "2026-08-01T00:00:00.000Z", "until": "2026-08-26T00:00:00.000Z" },
  "costOwner": "developer",
  "costOwnerNote": "Only legs your account pays for are included…",
  "subtotals": { "…": "see below" },
  "historyFloor": null,
  "historyClamped": false
}
```

**`costRaw` is raw 6-decimal USDC, and it is `null` for `pending` and `manual` — always.** It is also `null` for a group-scoped stamp and for anything not USD-denominated. Never read `null` as zero; read it as "not resolved". A non-USD leg carries the vendor's verbatim string in `provenance.vendorCostNative` and is excluded from every subtotal.

`unitsProvenance` is either `vendor_reported` or `floe_measured`. Only `vendor_reported` units can be priced at a vendor's realized rate — see [why voice-heavy accounts read low](../build/vendor-actuals.md#coverage-reads-low-on-voice-heavy-accounts-at-launch).

### The `subtotals` block

Attached to `legs`, `calls` and `rollups`. It comes from a **second aggregate query over the whole range** — never a sum of the page you are holding.

```json
{
  "perStatus": {
    "exact":       { "count": 128, "costRaw": "412300" },
    "period-rate": { "count": 64,  "costRaw": "98700" },
    "invoiced":    { "count": 0,   "costRaw": "0" },
    "pending":     { "count": 12,  "costRaw": "0" },
    "manual":      { "count": 5,   "costRaw": "0" }
  },
  "unsupportedFilters": [],
  "legs": 209, "unstampedLegs": 0, "nonUsdLegs": 0, "groupScopeLegs": 0,
  "totalRaw": null,
  "totalBlockedBy": ["unresolved_legs", "manual_legs"],
  "totalLabel": "partial — lower bound"
}
```

- `perStatus.pending.costRaw` and `perStatus.manual.costRaw` are always `"0"` because those statuses carry no cost. **Render the count, not the figure.**
- **Do not add `exact` and `period-rate`.** They are separate claims and the API keeps them separate for that reason.
- `totalRaw` is non-null **only** when every leg in the range is `exact`/`period-rate`/`invoiced` and USD. Otherwise it is `null`, `totalLabel` is `"partial — lower bound"`, and `totalBlockedBy` names why (`empty_scope`, `non_usd`, `group_scope`, `unresolved_legs`, `manual_legs`, `filtered_scope`).
- `unsupportedFilters` lists filters the page honours but the range aggregate cannot — the rows are narrower than the block above them, and this says so.

Every read also echoes `historyFloor` / `historyClamped` (your plan's history limit: 7 days on Free, 365 on Pro, unlimited on Agency) and `costOwner: "developer"` with `costOwnerNote`.

### `GET /v1/developer/actuals/calls`

The same window grouped **by call**, server-side. Groups are paged; every leg of a selected group is loaded whole, so a group is either fully counted or not on the page at all — a truncating cap would silently drop legs and produce an unlabelled lower bound.

Same filters as `legs` (minus `taskId`, which is the grouping key). Each row:

```json
{
  "callKey": "call_1",
  "legCount": 4,
  "firstOccurredAt": "2026-08-20T10:00:00.000Z",
  "lastOccurredAt": "2026-08-20T10:04:11.000Z",
  "vendors": ["deepgram", "elevenlabs", "openai", "twilio"],
  "agentId": "7", "customerId": "acme", "campaignId": null,
  "composition": { "exact": 2, "periodRate": 1, "invoiced": 0, "pending": 1, "manual": 0, "groupLegs": 0 },
  "exactRaw": "6400",
  "periodRateRaw": "4300",
  "invoicedRaw": "0",
  "invoicedFrom": { "exact": 0, "periodRate": 0 },
  "groupsRaw": "0", "groupCount": 0, "adjustmentsRaw": "0",
  "totalRaw": null,
  "totalBlockedBy": ["unresolved_legs"],
  "totalLabel": "partial — lower bound",
  "nonUsd": false
}
```

`composition` is the honesty line: it tells a reader what the number beside it is made of. Per-row `totalBlockedBy` uses `unresolved_legs`, `manual_legs`, `non_usd`, `unknown_group_cost`, `empty_scope`.

### `GET /v1/developer/actuals/rollups`

`?by=customer|campaign|agent|vendor|time` (default `customer`; `time` buckets by UTC calendar day). Rows carry the same subtotal fields as `calls`, keyed `key` instead of `callKey`.

### `GET /v1/developer/actuals/legs.csv`

The same page set, server-rendered. Requires Pro `exports` on top of `attribution_reports`. Columns:

```csv
occurred_at,vendor,leg_kind,capture_source,vendor_request_id,status,grain,cost_scope,
group_key,cost_raw,currency,non_usd,vendor_cost_native,vendor_cost_unit,units_provenance,
units,attribution_state,agent_id,customer_id,task_id,campaign_id,vendor_actual_id,
revision,status_reason
```

`cost_raw` is **blank**, not `0`, wherever there is no resolution. Over 100,000 rows the endpoint refuses with `413` rather than writing a short file — a truncated CSV opened in a spreadsheet is indistinguishable from a complete one.

## Findings

### `GET /v1/developer/actuals/findings`

| Parameter | Values |
|---|---|
| `state` | `open` (default), `cleared`, `all` |
| `kind` | `unmatched_actual`, `unmatched_leg`, `units_mismatch`, `over_coverage`, `unknown_line_item`, `bucket_reopened`, `platform_zero_cost`, `connector_stale`, `invoice_foot_variance`, `currency_unsupported` |
| `severity` | `info`, `warn`, `error` |
| `limit`, `cursor` | 1–500, default 100 |

Returns `{ findings, nextCursor, hasMore, openCounts }`. Findings are not range-scoped, so there is no `range` block.

### `POST /v1/developer/actuals/findings/:id/resolve`

Body: `{ "resolution": "acknowledged" | "wont_fix" | "fixed" }`.

`auto_cleared` is **rejected** — it is the machine's verdict, and a human claiming it would erase the difference between "the condition went away" and "a person decided to live with it". Resolving is compare-and-set on an open finding: an already-resolved finding returns `404` rather than being silently re-sealed.

## Vendor connections

Read-only billing credentials, one per vendor account. Agency plan; writes additionally need `admin`/`owner`.

### `GET /v1/developer/vendor-connections`

```json
{
  "connections": [
    {
      "id": 4, "vendor": "twilio", "name": "main", "kind": "basic_auth",
      "credentialPublic": { "accountSid": "ACxxxx1234", "authToken": "abcd…wxyz" },
      "credentialUnreadable": false,
      "status": "active", "enabled": true,
      "capabilities": { "calls": "per_request" },
      "bestStatus": "exact",
      "lastSuccessAt": "2026-08-26T09:00:00.000Z",
      "lastErrorAt": null, "lastError": null, "consecutiveFailureCount": 0,
      "freshnessSlaMinutes": 120, "actualsSlaHours": 48,
      "scopesVerifiedAt": "2026-08-26T09:00:00.000Z",
      "billingTimeZone": "America/Los_Angeles",
      "captureSince": null
    }
  ],
  "credentialFields": {
    "api_key": ["apiKey"],
    "basic_auth": ["accountSid", "authToken"],
    "aws_sigv4": ["accessKeyId", "secretAccessKey", "region"],
    "gcp_service_account": ["projectId", "clientEmail", "privateKey"],
    "azure_client_secret": ["tenantId", "clientId", "clientSecret", "subscriptionId"],
    "oauth_client": ["clientId", "clientSecret"]
  },
  "connectors": [
    { "vendor": "twilio", "bestStatus": "exact", "capabilities": ["per_request"],
      "billingTimeZone": "config", "billingTimeZoneDefault": null }
  ]
}
```

**Credential material is never returned.** `credentialPublic` is a per-kind mask derived from the opened credential at write time: identifiers (`region`, `projectId`, `accountSid`) verbatim — recognising *which* of two Twilio subaccounts a row is, is the point of a mask — and secrets elided head/tail, with key material reduced to a length.

`credentialFields` is the form catalog: build your prompts from it rather than hardcoding a field list. `bestStatus` (`exact` | `period-rate` | `manual`) is the **ceiling** a leg served by that connection can ever reach.

### `POST /v1/developer/vendor-connections`

```json
{
  "vendor": "twilio",
  "name": "main",
  "kind": "basic_auth",
  "credential": { "accountSid": "AC…", "authToken": "…" },
  "billingTimeZone": "America/Los_Angeles",
  "freshnessSlaMinutes": 120,
  "actualsSlaHours": 48,
  "captureSince": null
}
```

`name` is unique within `(account, vendor)` — two Twilio subaccounts are two named rows. Only the fields `credentialFields[kind]` declares are sealed; anything else in `credential` is dropped before storage.

Re-keying goes through **`POST`**, not `PATCH`: the upsert re-seals with a fresh IV, re-derives the mask, clears the failure counter, re-arms a disabled row, and resets `status` to `unverified` — because the old scope check said nothing about the new key.

`billingTimeZone` is **required** for any connector whose catalog entry says `"billingTimeZone": "config"`. Those vendors cut daily buckets in the account's own timezone and expose it through no API; an unchecked UTC assumption is a permanent, silent coverage gap.

`PATCH /:id` updates `enabled`, `billingTimeZone`, `freshnessSlaMinutes`, `actualsSlaHours`, `captureSince` — never the credential. `DELETE /:id` is a **soft** delete: already-written actuals are never retracted, because the dollars were real.

### `POST /v1/developer/vendor-connections/:id/verify`

Makes a cheap read call against the vendor now and records the outcome.

```json
{
  "connection": { "…": "as above" },
  "verification": { "ok": true, "reason": null, "detail": "…", "discovered": { "…": "…" } }
}
```

| Failure | Status | Means |
|---|---|---|
| `verification_failed` | `409` | The vendor refused the credential. Connection goes `unauthorized` — **re-key it**. |
| `verification_unavailable` | `502` | The vendor was unreachable. Connection goes `degraded` — the credential is unchanged. |
| `sealed_key_unavailable` | `409` | Sealed under an encryption key this deployment no longer holds. Re-enter the credential. |
| `sealed_credential_integrity` | `409` | The auth tag failed with a matching key — the stored row was modified. Investigate before resealing. |
| `connector_unavailable` | `409` | No billing connector exists for this vendor, so there is nothing to verify. |

Verification is **advisory**. Floe cannot inspect a vendor key's scope without calling the vendor, so a pass proves a read succeeded at that moment — not that the key holds every scope a nightly pull needs.

## Invoices

Agency plan. Use where no vendor API publishes a cost.

| Endpoint | Purpose |
|---|---|
| `POST /v1/developer/actuals/documents` | **Inline lane** — `{ vendor, filename, contentType, body }`. UTF-8, ≤ 256 KiB. Needs no object storage. |
| `POST /v1/developer/actuals/documents/upload-url` | Mint a signed `PUT` for larger files: `{ vendor, filename, contentType, sizeBytes, sha256 }` → `{ document, duplicate, upload }`. |
| `POST /v1/developer/actuals/documents/:id/finalize` | Server re-downloads, recomputes the digest, and parses. |
| `GET /v1/developer/actuals/documents` | The queue. Also returns `objectLaneAvailable`. |
| `GET`/`PATCH /v1/developer/actuals/documents/:id/lines` | Parsed lines; correct them and `confirmReview`. |
| `POST /v1/developer/actuals/documents/:id/foot` | Foot it. `{ "dryRun": true }` runs the identical computation and rolls it back. |

The `sha256` you send to `upload-url` is a **dedupe hint only** — the server recomputes the digest from the bytes it actually read, and a mismatch rejects the upload.

**Footing is irreversible.** It stamps touched legs `invoiced` (retaining `statusBeforeInvoice`) and returns `parsedTotalRaw`, `ledgerTotalRaw`, `varianceRaw`, `unexplainedRaw`, `stampsWritten` and `linesPromoted`. Unexplained residue above `max(0.5%, $1)` opens an `invoice_foot_variance` finding. Run `dryRun` first. A non-USD invoice foots into **units only** and every leg it touches terminates as `manual`.

## Errors

One dialect across the whole surface:

```json
{ "error": "invalid_query", "detail": "status must be a comma-separated subset of: pending, manual, exact, period-rate, invoiced.", "param": "status" }
```

`detail` is the human sentence; `error` is the stable machine code. Zod rejections add `details`. Common codes: `invalid_body`, `invalid_query`, `invalid_json`, `unauthorized`, `developer_credential_required`, `plan_required`, `connection_not_found`, `finding_not_found`, `document_not_found`, `invalid_credential`, `invalid_time_zone`, `unknown_vendor`, `foot_failed`, `export_too_large`.

## Webhooks

Four `vendor_actuals.*` events under the existing `billing` category, including `vendor_actuals.connection.updated` and `vendor_actuals.invoice.footed`. There is deliberately **no per-leg restatement event** — a vendor restatement can touch tens of thousands of legs in one run and would flood subscribers. See [Webhooks](webhooks.md).

## Related

- [Vendor actuals](../build/vendor-actuals.md) — the concepts, the status vocabulary, and the timing.
- [Coverage Score](../build/coverage-score.md) — how much spend Floe can enforce.
- [Floe CLI](cli.md) — `floe actuals`.
- [MCP Server](mcp-server.md) — the `actuals` capability group (reads only).
- [REST API](credit-api.md) — the rest of the developer surface.
