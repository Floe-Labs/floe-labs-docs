---
icon: receipt
---

# Client rebilling

You run voice agents for several end-clients. Floe's ledger already knows what every call cost — telephony, STT, LLM, TTS, tools — so it can apply *your* pricing per client and produce the bill, with the cost side and the revenue side on the same rows.

Three steps: **tag** spend with an end-customer, **price** that customer with a rate card, **close** a billing period into an immutable statement.

**Base URL:** `https://credit-api.floelabs.xyz`

## Authentication

Every endpoint on this page lives under `/v1/developer` and takes a **developer credential** — a `floe_live_…` key, a dashboard session, or a wallet-signature header set. Agent keys (`floe_…`) are rejected.

```
Authorization: Bearer floe_live_YOUR_KEY
```

Writes (creating rate cards and projects, setting defaults, closing periods) additionally require the **admin** or owner role on the account; a member gets `403 Forbidden`. Reads work for any role.

## 1. Tag spend with an end-customer

A `customerId` is your own opaque tag for the client you invoice — `acme-dental`, an id from your CRM, whatever you already use. It is **not** a Floe account or sub-account. It is trimmed, lowercased, and capped at 128 characters wherever it is accepted, so `Acme-Dental` and `acme-dental` can never fork into two ledger keys.

Every metered call resolves one, checked in order:

```
1. X-Floe-Customer-Id header  →  2. the agent's default customer  →  3. the agent's project default  →  untagged (NULL)
```

**The zero-code path is the default.** If you dedicate an agent (or a project) per client, set the default once and 100% of that agent's spend attributes — Floe Inference, the x402 proxy, and Floe Phone calls including inbound — with no change to your agent code. The header is the override for multi-tenant agents that serve several clients from one key.

```bash
# Per call — multi-tenant agent
curl -X POST "https://credit-api.floelabs.xyz/v1/chat/completions" \
  -H "Authorization: Bearer floe_YOUR_AGENT_KEY" \
  -H "X-Floe-Customer-Id: acme-dental" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"hi"}]}'

# Once per agent — everything this agent spends lands on acme-dental
curl -X PATCH "https://credit-api.floelabs.xyz/v1/developer/agents/42" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"defaultCustomerId": "acme-dental"}'
```

`PATCH /v1/developer/agents/:agentId` accepts `defaultCustomerId` and/or `projectId`; send `null` for either to clear it. Both fields decide whose invoice the agent's spend lands on, so the route requires the admin role.

### Projects

A project groups agents under one client engagement and carries its own default customer — the third tier of the chain, used when neither the header nor the agent sets one.

| Endpoint | What it does |
|---|---|
| `GET /v1/developer/projects` | List projects with `agentCount` |
| `POST /v1/developer/projects` | Create — `{ "name": "Acme", "defaultCustomerId": "acme-dental" }` **admin** |
| `PATCH /v1/developer/projects/:id` | Rename and/or set the default customer **admin** |

Project names are unique per account (`409 name_taken`). Attaching an agent to a project you don't own returns `404`.

### Require a tag on every call

Attribution is `optional` by default: untagged calls still run, and their spend shows as untagged. Switch the account to **strict** when an untagged call would be a hole in an invoice:

```bash
curl -X PATCH "https://credit-api.floelabs.xyz/v1/developer/profile" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"customerAttribution": "required"}'
```

Under `required`, a metered call that resolves no customer id is refused **before any spend** with `400 customer_id_required`, on every surface — the gateway (OpenAI-shaped error), `/v1/proxy/fetch`, the streaming-STT / realtime WebSocket handshakes, and outbound phone calls. The body carries a machine-readable `next` block pointing at the remediation:

```json
{
  "error": { "message": "…", "type": "invalid_request_error", "code": "customer_id_required" },
  "next": { "hint": "Send X-Floe-Customer-Id on this call, or set defaultCustomerId on the agent.",
            "method": "PATCH", "path": "/v1/developer/agents/:agentId" }
}
```

One deliberate exemption: an outbound call is checked **before dialing**, but a call already in progress is never dropped for a missing tag — inbound and mid-call legs fall back to the agent and project defaults. Flip strict mode on only once attribution reads 100%: the [coverage endpoint](../build/coverage-score.md#api) returns an `attribution` block (`attributedRaw`, `attributedCalls`, `attributionBps`) over exactly the same rows as the coverage score.

> **Tagging starts when you set it.** Defaults apply to calls made from that point on; spend already on the ledger is not retagged.

## 2. Price each client — rate cards

A rate card is a per-customer list of rules that **add together**. All money is a raw 6-decimal USDC integer *string* — `"500000000"` is $500.00, `"100000"` is $0.10.

| `kind` | Fields | Prices |
|---|---|---|
| `fixed` | `label`, `amountRaw` | A flat amount per billing period — retainer, platform fee. Prorated when a version covers only part of the period. |
| `per_unit` | `unit` (`audio_minute` \| `request`), `ratePerUnitRaw`, `includedUnits?`, `label?` | Rate × usage above an optional included allotment. `audio_minute` is `ceil(seconds / 60)`. |
| `cost_plus` | `marginBps`, `includeByokEstimates?`, `label?` | The metered cost of the client's calls × (1 + margin), floored. **Max one per card.** |

Compose them for the real cases: retainer + overage = `fixed` + `per_unit` with `includedUnits`; hybrid = `fixed` + `cost_plus`; pass-through = `cost_plus` alone. Up to 20 rules per card.

```bash
# $500/mo retainer + $0.10 per voice minute after 4,000 included
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/rate-cards" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "acme-dental",
    "rules": [
      { "kind": "fixed", "label": "Monthly retainer", "amountRaw": "500000000" },
      { "kind": "per_unit", "unit": "audio_minute", "ratePerUnitRaw": "100000", "includedUnits": 4000 }
    ],
    "note": "Q3 pricing"
  }'
```

**Versions are append-only.** There is no `PATCH` or `DELETE` on a card: "editing" is posting the next version, which gets `version: N+1` and its own `effectiveFrom`. Old versions stay immutable and keep rating the usage from their era forever — which is what makes a closed statement reproducible.

* `effectiveFrom` is **monotonic**. A new active version may not start before the latest active version's start; back-dating returns `400 effective_from_regression`. A mid-month price change rates old usage under the old version and new usage under the new one.
* **"Current version" means the version rating usage right now** — the latest active version whose `effectiveFrom` is in the past — not the highest version number. `GET /rate-cards` returns it as `currentVersionId`.
* Post with `"status": "draft"` to park a version without rating anything, then `POST /rate-cards/:id/activate` (optionally with an `effectiveFrom`) to stamp it live. Only a draft can be activated — activating anything else is `409 not_draft`.

| Endpoint | What it does |
|---|---|
| `GET /v1/developer/rate-cards?customerId=` | All versions for one customer, newest first, plus `currentVersionId` |
| `POST /v1/developer/rate-cards` | Append a version — `status` `active` (default) or `draft` **admin** |
| `POST /v1/developer/rate-cards/:id/activate` | Draft → active **admin** |
| `POST /v1/developer/rate-cards/preview` | Rate real usage under up to 6 candidate cards |

### Preview before you commit

`POST /rate-cards/preview` rates the client's **actual** usage over the last `days` (1–90, default 30) under each candidate, using the same arithmetic the period close uses — so a preview can never disagree with the invoice it previews. For a brand-new client with no history, pass `assumedUsage` instead.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/rate-cards/preview" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "acme-dental",
    "days": 30,
    "candidates": [
      { "label": "Cost + 30%", "rules": [{ "kind": "cost_plus", "marginBps": 3000 }] },
      { "label": "Retainer", "rules": [{ "kind": "fixed", "label": "Retainer", "amountRaw": "500000000" }] }
    ]
  }'
```

Each option returns `lineItems`, `revenueRaw`, `costRaw`, and `marginRaw` (negative margin = you are losing money on that client at that price), alongside the `usage` it rated and `usageSource` (`ledger` or `assumed`).

{% hint style="info" %}
**Two limits worth knowing before you pick a model.**

* **`audio_minute` counts gateway minutes** — streaming STT, TTS, and realtime seconds. Floe Phone telephony minutes are metered and billed to you exactly, but they are not yet an input to per-minute *rating*. Price phone-dominated clients with `cost_plus` or `fixed`.
* **BYOK calls carry an estimate.** When a call runs on the client's own vendor key, Floe settles only the service fee, so the upstream vendor cost isn't in the settled ledger — Floe records a rate-card **estimate** of it. A `cost_plus` rule can fold that estimate into the billing basis with `"includeByokEstimates": true`; it is `false` by default, so estimates never enter a bill silently, and the estimate is not reconciled against the vendor's invoice.
{% endhint %}

## 3. See cost, revenue, and margin per client

```http
GET /v1/developer/customers?days=30
```

Every end-customer seen in the ledger over the window (up to 200, highest spend first) with `costRaw`, `requests`, `lastSeenAt`, and a `rateCard` status (`currentVersion`, `draftVersion`). Customers that have a card but no usage in the window are included with zero spend.

```http
GET /v1/developer/customers/:customerId/transactions?from=…&to=…
```

Every metered row for one customer between two ISO timestamps (default: last 30 days; range must be ≤ 90 days), each with its cost, the card version effective **at that row's timestamp**, and — where the pricing model defines one — per-row `revenueRaw` and `marginRaw`:

* `cost_plus` → exact per row.
* `per_unit` with `unit: "request"` → the rate, with the included allotment consumed oldest-first inside the selected range.
* `fixed` and `per_unit` with `unit: "audio_minute"` → aggregate-only; those rows carry `perRowComplete: false` and their contribution appears in the range `summary` instead.

Rows carry a `taskId` — Floe Phone stamps every leg of one phone call with the same value, so grouping by `taskId` rolls the legs of a call up into one cost, one revenue, one margin. The response is capped at 2,000 rows and sets `truncated: true` when it hits the cap; narrow the range to see the rest. The `summary` block rates the whole range under **all** rules, so its totals are complete even where individual rows show no margin.

## 4. Close a billing period into a statement

A billing period is the unit you issue one invoice for. Its lifecycle is `open → closed → issued`.

| Endpoint | What it does |
|---|---|
| `GET /v1/developer/billing-periods?customerId=` | List periods, newest first |
| `POST /v1/developer/billing-periods` | Create an **open** period — `customerId`, `periodStart`, `periodEnd`, optional `timezone` (default `UTC`) **admin** |
| `GET /v1/developer/billing-periods/:id` | The period plus its line items |
| `POST /v1/developer/billing-periods/:id/line-items` | Add a manual one-off charge or credit **admin** |
| `POST /v1/developer/billing-periods/:id/close` | Rate the usage, snapshot the statement, freeze it **admin** |
| `POST /v1/developer/billing-periods/:id/issue` | Closed → issued **admin** |
| `PATCH /v1/developer/customers/:customerId` | Set the client's `name` / `email` for statements **admin** |

A period is at most 92 days, and one period per `(customer, periodStart)` — creating a duplicate is `409 period_exists`.

**While the period is open** you can add manual items: `{"label": "Setup fee", "amountRaw": "150000000", "note": "onboarding"}`. A negative `amountRaw` is a credit. Each records who added it and when. After close, the statement is immutable — a manual item on a closed period is `409 period_not_open`.

**Closing** rates the period and freezes it:

1. The period is split at every rate-card version boundary inside it, so each segment rates under exactly one version — `fixed` rules prorated by the segment's share of the period, so a mid-period price change never double-charges a retainer.
2. Each rated line item is snapshotted with its card version and segment bounds, plus its amount in cents *and* the sub-cent remainder — so the cents on the statement reconcile back to the raw amount exactly.
3. A segment that has usage but **no effective card version** refuses the close with `409 unrated_usage` rather than silently invoicing $0. Set pricing that covers the window, then close again.
4. A period can only close after its window has ended (`409 period_not_ended`) — closing early would freeze a partial statement, and later usage lands in the *next* period by construction.
5. Closing twice is safe: a closed period returns its existing statement unchanged with `alreadyClosed: true`. Change the rate card tomorrow and last month's statement does not move.

Today Floe produces the statement and its line items — the dashboard exports the transactions report and the statement as CSV. Collection runs on your own invoicing stack; Floe never touches your client's money.

> **Your cost basis is yours.** Cost and margin are for you. Anything you hand an end-client should carry the rated prices only.

## Errors

| Status | `error` | When | Fix |
|---|---|---|---|
| 400 | `customer_id_required` | Strict attribution is on and the call resolved no customer id | Send `X-Floe-Customer-Id`, set a default on the agent or its project, or set `customerAttribution` back to `optional` |
| 400 | `effective_from_regression` | A new/activated version would start before the latest active version | Use an `effectiveFrom` at or after the current version's start |
| 403 | `Forbidden` | A write attempted with the `member` role | Perform it as an owner or admin |
| 404 | `not_found` | The card, project, or period doesn't exist — or belongs to another account | Cross-tenant probes can't tell the two apart |
| 409 | `version_conflict` | Two rate-card versions were created concurrently | Retry |
| 409 | `not_draft` | Activating a version that is already active | Active versions are immutable — post a new version instead |
| 409 | `name_taken` | A project with that name already exists | Pick another name |
| 409 | `period_exists` | A period with that `periodStart` already exists for the customer | Reuse it |
| 409 | `period_not_open` | Manual item added to a closed or issued period | Add it to the next period |
| 409 | `period_not_ended` | Close attempted before `periodEnd` | Close after the window ends |
| 409 | `unrated_usage` | Usage in the period has no effective rate-card version | Set pricing covering that window, then close |
| 409 | `close_conflict` | The period was closed concurrently | Re-read it |
| 409 | `not_closed` | Issue attempted on a period that isn't `closed` | Close it first |

## Related

* [Coverage Score](../build/coverage-score.md) — the same rows, with the attribution share
* [Unified Billing & Ledger](../build/unified-ledger.md) — how a call's legs reach the ledger in the first place
* [Floe Phone](floe-phone.md) — per-call `taskId` stamping
* [Error Codes](../reference/error-codes.md)
