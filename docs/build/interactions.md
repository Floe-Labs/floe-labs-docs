---
icon: phone
---

# Calls — every leg of one call, as one object

A single voice call spends across 7–20 vendors: telephony, STT, one or more LLM turns, TTS, tools. Your [ledger](unified-ledger.md) records each of those as a **leg**. An **interaction** is the call itself — every leg of one conversation bound into one row, with one duration, one client, and one cost.

Floe builds interactions from identifiers **already present in the vendor data** — the task id you send, Twilio's CallSid, the vendor's own per-request id, the orchestrator's call id. There is nothing to instrument: a call assembles even from legs that never touched Floe (a `vendor_pull` leg pulled from the vendor's own billing API lands in the same call as the gateway leg for the same request).

## How a call gets assembled

Each leg contributes join keys under a typed namespace:

| Kind | Where it comes from |
|---|---|
| `floe_task` | Your `X-Floe-Task-Id` header. On [Floe Phone](../developers/floe-phone.md) it defaults to the lowercased CallSid, which bootstraps voice calls with zero code. |
| `callsid` | Twilio's CallSid, verbatim (case matters to Twilio's API). |
| `vendor_request` | The vendor's own per-request id — `resp_…`, `chatcmpl-…`, a Deepgram `request_id`. |
| `orchestrator_call` | The platform call id from a Vapi / Retell / Bland post-call report. |

Binding is **transitive**. A leg carrying both a task id and a CallSid is the bridge that unifies the two identifier spaces; a later leg carrying only one of them still lands in the same call. When a leg's identifiers turn out to span two interactions, that leg *is* the discovery that they were one call all along — the two are merged, oldest id wins, and the losing id keeps resolving (the detail response echoes it as `requestedId`).

Deliberately **not** a join key: a Deepgram `vendor_session_id`, which is per-socket rather than per-call. An id that isn't a call id can never become an edge.

Every call carries a stable, operator-facing id — `int_` plus 16 hex — and that is what appears in URLs and exports. Binding runs continuously in the background, so a call appears shortly after its legs are captured, not at call-end.

> **A leg is bound, unresolved with a reason, or not yet swept — never silently dropped.** A leg with no join-eligible identifier lands in the unattributed bucket under a named reason (`no_join_identifiers`, `identifier_conflict`, `resolver_error`), and the `resolution` block on every list response counts it.

## List your calls

```http
GET /v1/developer/interactions?since=2026-08-01T00:00:00Z&orderBy=cost
```

| Query | Values |
|---|---|
| `since` / `until` | ISO-8601. Defaults to the last 30 days, clamped to your plan's ledger history. |
| `customerId` · `campaignId` · `agentId` | The call's derived attribution (see below). |
| `channel` | `voice` · `chat` · `email` · `video` · `job`. Today the resolver produces `voice` and `job`. |
| `vendor` | Calls **involving** that vendor — the whole call renders, never just its matching legs. |
| `status` | Comma-separated reconciliation statuses; matches calls containing a leg in one of them. |
| `orderBy` | `started` (default) or `cost`. |
| `limit` · `cursor` | 1–500 (default 100); pass `nextCursor` back verbatim. |

Each row is one call:

```json
{
  "interactionId": "int_9f2c41a0d8b37e15",
  "channel": "voice",
  "direction": "inbound",
  "startedAt": "2026-08-14T15:02:11Z",
  "endedAt": "2026-08-14T15:06:48Z",
  "durationMs": 277000,
  "agentId": "support-agent",
  "customerId": "acme-corp",
  "campaignId": "renewals-q3",
  "outcome": "success",
  "legCount": 9,
  "vendors": ["deepgram", "elevenlabs", "openai", "twilio"],
  "byKind": {
    "telephony": { "legs": 1, "costRaw": "18700", "partial": false },
    "stt":       { "legs": 2, "costRaw": "12400", "partial": false },
    "llm":       { "legs": 5, "costRaw": null,    "partial": true },
    "tts":       { "legs": 1, "costRaw": "9800",  "partial": false }
  },
  "totalRaw": null,
  "totalLabel": "partial — lower bound"
}
```

The [vendor actuals](vendor-actuals.md) honesty rules carry over **unchanged**, per call and per kind: a figure appears only when every leg behind it is `exact`, `period-rate` or `invoiced` **and** USD-denominated. Otherwise `costRaw` is `null` with `partial: true`, and the row's total reads `"partial — lower bound"` — never a `0`. Legs Floe carries on its own account are omitted entirely (`costOwnerNote` says so on every response), exactly as on `/actuals`.

Attribution on the row is the call's **derived** client / campaign / agent: it is set when the bound legs agree, and left null when they conflict. Floe never picks a winner — see [Cost per client, campaign & task](attribution.md).

## Where the money actually goes

Margin is rarely killed by the average call; it's killed by the tail that ran fourteen minutes. `orderBy=cost` is that list, and the first page carries the distribution behind it:

```json
"distribution": {
  "calls": 4120,
  "partialCalls": 96,
  "lowerBound": true,
  "p50Raw": "41200",
  "p95Raw": "186500",
  "maxRaw": "1204300"
}
```

Percentiles are computed over each call's **lower-bound** cost — the sum of its currently-costed, leg-scope, USD stamps. Calls with `pending` legs enter at that lower bound rather than being dropped, because dropping the not-yet-costed tail would bias exactly the statistic this exists to show. `lowerBound: true` means read the figures as "at least"; when `partialCalls` is `0` they're exact.

The same basis is the `orderBy=cost` **sort key** — a sort key, not a displayed figure. A call whose most expensive leg is still `pending` can rank lower than it eventually will. That order also keysets over a mutable aggregate, so a call whose stamps change between page fetches can shift across the cursor boundary and appear on two pages or neither. For a stable walk, page with `orderBy=started` (an immutable key) and sort client-side.

## Resolution, stated

Every list and rollup response carries the fraction of legs bound to a call, with a named reason for the rest:

```json
"resolution": {
  "legs": { "total": 38210, "bound": 37980, "unresolved": 214, "unswept": 16 },
  "unresolvedByReason": { "no_join_identifiers": 214 },
  "resolutionBps": 9939
}
```

`unswept` legs are ones the background pass hasn't reached yet — transient by construction. `unresolved` legs are ones it examined and could not place; that's your work list. The figure is leg-count-weighted, not spend-weighted, because spend is only knowable for costed legs.

This is deliberately **not** called coverage: the [Coverage Score](coverage-score.md) answers a different question — how much of your spend Floe can *enforce* — and the two numbers must never be read as the same thing.

## Cost per minute, per client

```http
GET /v1/developer/interactions/rollups?by=customer
```

`by` is `customer`, `campaign`, `agent`, or `channel`. Rows carry the cost roll-up plus the duration behind it, over exactly the calls whose legs the cost side counted:

```json
{
  "key": "acme-corp",
  "interactionCount": 1204,
  "openInteractions": 3,
  "durationMs": 331480000,
  "totalRaw": "96120000",
  "costPerMinuteRaw": "17400",
  "costPerMinuteBlockedBy": []
}
```

`costPerMinuteRaw` is micro-USD per minute, and it is stated **only** when both sides are complete claims. Otherwise it is `null` and `costPerMinuteBlockedBy` names why: `partial_cost` (the cost side is a lower bound), `open_interactions` (a call in the bucket has no end time yet), or `no_duration`. An unknown-duration $/min is unknowable rather than lower-boundable, so it is never labelled "partial".

Filters (`customerId`, `campaignId`, `agentId`, `vendor`, `status`) apply to both sides identically. `channel` is a valid **dimension** but not a filter here — passing it returns `400`, because a filter that silently didn't apply would produce figures that look filtered and aren't.

Rollups need the **Pro** `attribution_reports` entitlement; the list and detail reads are free.

## One call, in full

```http
GET /v1/developer/interactions/int_9f2c41a0d8b37e15
```

Returns the call, its legs in time order, and the identifiers that bound it:

- **`legs[]`** — `vendor`, `legKind`, `occurredAt`, `captureSource`, `attemptOutcome`, `units`, `reconciliationStatus`, `statusReason`, `costRaw`, `currency`, and `matchedVia` (which identifier kind pulled this leg into the call).
- **`links[]`** — every identifier currently bound to the call, with its vendor and kind.
- **`byKind`** and the same subtotal block as the list row.
- **`requestedId`** — non-null when you asked for an id that has since been merged into this one. A saved link never 404s.

A call whose every leg is carried on Floe's own account is absent from these reads entirely, not rendered at zero.

## What this replaces

The older by-call surface (`GET /v1/developer/actuals/calls`) groups on `task_id`. That grain only exists where you instrumented it, and the same header also drives task budget windows. It stays wire-compatible for existing consumers, but **new consumers should read `/interactions`** — it covers calls you never tagged.

## Plan gate

> **The by-call ledger is free.** `GET /interactions` and `GET /interactions/:id` ride the Free `ledger_read` entitlement; `GET /interactions/rollups` rides the Pro `attribution_reports` entitlement, like every other per-client rollup. Your plan's ledger-history window clamps the range (and a call that started before the floor reads as not found). See [Plans & entitlements](../reference/plans.md).

## Related

- [The live cost ledger](unified-ledger.md) — the legs an interaction is assembled from.
- [Vendor actuals](vendor-actuals.md) — the status behind every cost figure here.
- [Cost per client, campaign & task](attribution.md) — how a call gets its client, and how to fix one that didn't.
- [Coverage Score](coverage-score.md) — a different question from resolution.
