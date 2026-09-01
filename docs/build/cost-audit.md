---
icon: file-contract
---

# Cost audit — invoices in, margin per client out

The fastest way to find out whether your $2/min contract actually costs you $1.80 is not to route a single call through Floe. **Cost audit** takes the invoices and usage exports you already download from Twilio, Deepgram, ElevenLabs, OpenAI, Vapi and the rest, attributes their lines to your end-clients, and gives you cost, minutes, cost-per-minute and margin per client.

Nothing in your call path changes. **No vendor credentials, either** — this surface has no credential field anywhere. A Twilio auth token or an AWS key isn't read-only, and asking for one at minute zero is a bigger trust ask than routing traffic. Live [vendor connections](vendor-connections.md) are the upgrade *after* you've seen the number.

It's free: the whole audit surface rides the Free `ledger_read` entitlement.

## 1. Upload the invoices

```http
POST /v1/developer/audit/documents
```

```json
{
  "vendor": "twilio",
  "filename": "twilio-2026-08.csv",
  "contentType": "text/csv",
  "body": "…the file, inline…",
  "periodStart": "2026-08-01T00:00:00Z",
  "periodEnd": "2026-09-01T00:00:00Z"
}
```

- The body is sent **inline** — `text/csv`, `text/plain`, or `application/json`, up to **256 KiB**. An audit account never needs object storage to exist. If your export is bigger, upload the vendor's monthly summary rather than a per-request log.
- Uploads are idempotent on content hash: re-posting the same file returns `200` with `duplicate: true` instead of double-counting it.
- The response carries the parse result — `parserKey`, `parseStatus`, `lineCount`, `needsReviewCount`, `warnings` — plus an `attribution` summary of what the upload changed.

`GET /v1/developer/audit/documents` lists what you've uploaded.

## 2. Map identifiers to clients

Your vendors' exports already carry client identity; they just don't know your client names. The mapping table is the join.

```http
PUT /v1/developer/audit/mappings
{
  "mappings": [
    { "vendor": "twilio",  "identifierKind": "subaccount",   "identifier": "AC1234…", "customerId": "acme-corp" },
    { "vendor": "twilio",  "identifierKind": "phone_number", "identifier": "+14155550123", "customerId": "globex" },
    { "vendor": "vapi",    "identifierKind": "assistant",    "identifier": "asst_9f2c", "customerId": "acme-corp" },
    { "vendor": "openai",  "identifierKind": "project",      "identifier": "proj_renewals", "customerId": "acme-corp" }
  ]
}
```

Four identifier kinds — `subaccount`, `phone_number`, `project`, `assistant` — up to 200 mappings per call. `GET` lists them; `DELETE /v1/developer/audit/mappings/:id` removes one. Every mutation re-runs the attribution pass, so the report is always a pure read of current mappings.

Kinds are gated by vendor category: a phone number or subaccount only means a *client* on a telephony vendor's export, an assistant only on an orchestrator's. When one line's identifiers point at different clients, specificity decides — **phone number → assistant → subaccount → project** — because the narrower identifier is the stronger claim about that line. Floe never guesses beyond that rule.

> **`from` / caller-ID columns are deliberately not mappable.** On the dominant voice-agency shape the outbound caller ID is the *agency's* shared number, so mapping it would attribute every client's outbound lines to one client.

## 3. Read the report

```http
GET /v1/developer/audit/report
```

Per client: `lines`, `costRaw`, `minutesMicro`, `costPerMinuteRaw`, a per-category breakdown (`telephony` · `stt` · `tts` · `llm` · `orchestrator` · `fees_credits` · `other`), and — when that client has a [rate card](rate-cards.md) — `contractedPerMinuteRaw`, `revenueEstimateRaw` and `marginRaw`. `worstContracts` names the three lowest-margin clients whose margin was estimable at all.

Revenue is an **estimate from the rate card and says so**: components that can't be derived from invoices (per-request pricing) are named in `revenueNote` rather than silently priced at zero.

Every figure is labelled by its coverage:

```json
"coverage": {
  "knownCostRaw": "412300000",
  "attributedCostRaw": "338090000",
  "attributionBps": 8200,
  "byReason": {
    "no_mapping_for_identifier": { "lines": 1840, "costRaw": "61200000" },
    "no_identifier_on_line":     { "lines": 96,   "costRaw": "13010000" }
  },
  "nonUsdLines": 0,
  "needsReviewLines": 12,
  "excludedLines": 4
}
```

"82% attributed, and here's the other 18% and why" is the credibility, not the apology. `no_mapping_for_identifier` is the actionable half — `unmappedIdentifiers` lists exactly those values, biggest dollars first, each one directly pasteable into step 2.

Two rules inherited from the rest of the ledger hold here too: **non-USD lines are never FX-converted** — they're counted in `nonUsdLines`, and any client carrying one gets a `null` cost-per-minute, revenue and margin rather than a converted figure. And a missing number is blank, never a zero.

Accounts over **100,000 invoice lines** get a `413 audit_too_large` on the report rather than a slow half-answer — upload monthly summary exports instead of per-request logs. An upload or mapping write that trips the cap still succeeds; it returns `attributionError: "audit_too_large"` so a successful write never reads as failed.

## In the dashboard

**Cost audit** in the sidebar (`/audit`) walks the same three steps — Vendors → Clients → Report. It's a self-contained path: nothing wallet- or agent-shaped appears while you're in it, so a finance-shaped visitor meets only invoices and clients.

## When to graduate

The audit lane labels invoice lines and sums them. It never stamps money onto a leg, and it isn't the reconcile lane:

| You want | Go to |
|---|---|
| Cost per client from invoices, no traffic, no credentials | This page |
| The vendor's own billing records pulled automatically, leg by leg | [Vendor connections](vendor-connections.md) + [vendor actuals](vendor-actuals.md) (Agency) |
| Per-call cost across every vendor, live | [The live cost ledger](unified-ledger.md) and [Calls](interactions.md) |
| A statement you can send a client | [Client invoicing](invoicing.md) (Agency) |

## Related

- [Vendor actuals](vendor-actuals.md) — the same honesty rules, applied to reconciled legs.
- [Rate cards & the margin engine](rate-cards.md) — where the contracted rate behind the margin estimate comes from.
- [Plans & entitlements](../reference/plans.md) — what's free, and what the upgrades buy.
