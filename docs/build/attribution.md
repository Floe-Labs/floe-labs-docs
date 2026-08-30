---
icon: tags
---

# Cost per client, campaign & task

Your [ledger](unified-ledger.md) is only as useful as it is tagged. An untagged call is a real dollar you paid that answers no business question: you know it happened, but not *for whom*. Tag every metered call with the client it serves — and, where you run campaigns, the campaign and the individual task — and the same spend that was one flat number becomes **cost per client** and **cost per campaign**. That is the number finance prices contracts against.

Floe never guesses. A missing tag stays missing (it buckets under `untagged`), because a guessed attribution is a silent accounting error and a blank is the truth. So the quality of your per-client cost is exactly the quality of your tagging — this page is how you get it right.

## The three tags

Every metered call can carry three independent tags. Only the first is usually needed; add the others when you run campaigns or want per-call rollups.

| Tag | What it answers | On Floe-carried calls | On reconciled orchestrator calls |
|---|---|---|---|
| **Customer** | Which end-client is this spend for? | `X-Floe-Customer-Id` header | `floe_customer_id` call metadata |
| **Campaign** | Which campaign / engagement? | `X-Floe-Task-Id` header (see note) | `floe_campaign_id` call metadata |
| **Task** | Which call / job? (groups its legs) | `X-Floe-Task-Id` header | `floe_task_id` call metadata |

All tag values are **opaque strings** — Floe never interprets them. They are trimmed, lowercased, and capped at 128 characters. Use whatever id your own system already keys on (a CRM client id, a campaign slug, a call SID).

> **Note on campaign vs task.** On Floe-carried calls the [cost ledger](#roll-it-up) rolls up the **task id** as the "campaign" dimension — one id per call groups that call's legs, and grouping those ids is your campaign view. Reconciled orchestrator ingests carry a *separate* `floe_campaign_id` alongside the task id, because a Vapi/Retell/Bland assistant often maps one campaign to many calls. If you run campaigns on an orchestrator, set both.

### Two ways a call gets tagged

**1. Floe-carried calls** — anything through the gateway (`/v1/chat/completions`, `/v1/audio/*`), the x402 proxy (`/v1/proxy/fetch`), or Floe Phone. Set the tag as a request header:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/chat/completions \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "X-Floe-Customer-Id: acme-corp" \
  -H "X-Floe-Task-Id: call-8f21a" \
  -H "Content-Type: application/json" \
  -d '{ "model": "openai/gpt-4o-mini", "messages": [{ "role": "user", "content": "hi" }] }'
```

Every leg of that call — LLM turn, STT, TTS, tool call — carries `customer_id = acme-corp` and `task_id = call-8f21a` on the money ledger.

**2. Reconciled orchestrator calls** — calls whose media path Vapi / Retell / Bland runs, ingested at call-end through the [end-of-call webhook](../developers/webhooks.md). You can't set a Floe header on a call Floe didn't place, so you stamp the tags as **call metadata** on the assistant instead. Floe reads `floe_customer_id`, `floe_campaign_id`, `floe_task_id`, and `floe_agent_id` from the metadata bag the orchestrator sends. An unparseable or absent tag produces `attribution_state = 'unattributed'` — an actionable finding, not a fallback.

## Resolution order & per-agent defaults

Most agencies bind one end-client to one agent and never touch a header. Floe resolves the effective customer id for every metered call in this order — first hit wins:

1. **`X-Floe-Customer-Id` header** — a multi-tenant agent overrides per call.
2. **The agent's default customer id** — `PATCH /v1/developer/agents/:agentId` with `{ "defaultCustomerId": "acme-corp" }`. One end-client per agent, zero per-call work.
3. **The agent's project default** — set on the project (`PATCH /v1/developer/projects/:id`); a project typically maps to one client engagement.
4. **None** → `untagged` (or a refusal under strict mode, below).

Every source runs through the same normalization, so a stored mixed-case default can never fork one client into two ledger keys.

## Strict mode: refuse unattributed spend

By default attribution is optional — untagged calls still run and simply bucket under `untagged`. Flip your account's customer-attribution mode to **required** and Floe refuses any metered call it can't attribute, **before any upstream spend**:

- HTTP surfaces return `400` with `code: "customer_id_required"` and a `next` block naming the two fixes (send the header, or set a default on the agent).
- WebSocket surfaces (streaming STT, realtime, telephony) refuse at the handshake with the same error.

Strict mode is the guarantee that no dollar reaches your ledger without a client attached to it — turn it on once your defaults and headers are wired, so a mis-configured agent fails loud instead of leaking untagged spend.

## Roll it up

Two read surfaces turn tagged legs into per-client and per-campaign cost. Both are **Pro** (see the plan gate below).

### The cost ledger — one neutral money view

```http
GET /v1/developer/ledger?days=30&groupBy=customer
GET /v1/developer/ledger?days=30&groupBy=campaign
```

Rolls up **all** spend — Floe-carried (gateway, x402 proxy, Floe Phone) *and* orchestrator-reconciled (Vapi/Retell/Bland end-of-call ingests) — by the dimension you ask for. `groupBy=source` and `groupBy=agent` answer "what did I spend"; `groupBy=customer` and `groupBy=campaign` are the attribution view. `days` is 1–90 (default 30).

Each row carries `{ key, tagged, calls, costRaw, reconciledRaw }`. `reconciledRaw` is the portion of that bucket that came from orchestrator reconciliation rather than a Floe-carried leg. **Filter on the `tagged` flag, never on the label** — a real client literally named "untagged" stays a distinct bucket from missing-tag spend. Untagged rows are never dropped: they bucket under `untagged` so the total always reconciles with the underlying rows.

```json
{
  "days": 30,
  "groupBy": "customer",
  "totalRaw": "184230000",
  "rows": [
    { "key": "acme-corp", "tagged": true, "calls": 1204, "costRaw": "96120000", "reconciledRaw": "41000000" },
    { "key": "globex",    "tagged": true, "calls": 803,  "costRaw": "61300000", "reconciledRaw": "0" },
    { "key": "untagged",  "tagged": false, "calls": 44,  "costRaw": "26810000", "reconciledRaw": "26810000" }
  ]
}
```

That last row is the work list: 44 reconciled calls reached your ledger with no client attached. Fix the assistant metadata (or turn on strict mode) and it goes to zero.

### Per client, at the vendor's real cost

The same client and campaign grouping is available over **[vendor actuals](vendor-actuals.md)** — the vendor's own billing number behind each client, reconciled leg by leg — when you need margin against true cost rather than Floe-settled spend.

## Plan gate

> **Capture is free. Rollups are Pro.**
>
> **Tagging every call — the headers, the metadata, the per-agent defaults, and strict mode — is free on every plan and is never throttled.** Attribution must never be the reason a call is refused for a billing reason, so tag liberally from day one.
>
> The **per-client and per-campaign rollups** (`groupBy=customer|campaign` on the ledger, `by=customer|campaign` on actuals rollups, and the `/customers` reads on [rate cards](rate-cards.md)) require the **Pro** feature `attribution_reports`. The `source` and `agent` views stay open on every plan.

## Related

- [The live cost ledger](unified-ledger.md) — the neutral money view these tags roll up.
- [Vendor actuals](vendor-actuals.md) — what each tagged leg actually cost at the vendor.
- [Rate cards & the margin engine](rate-cards.md) — put a price on each tagged client and read your margin.
