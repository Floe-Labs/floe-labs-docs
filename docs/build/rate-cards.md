---
icon: chart-line
---

# Rate cards & the margin engine

You know what every client's calls **cost** — that's the [ledger](unified-ledger.md) and [vendor actuals](vendor-actuals.md). A rate card is the other half: what you **bill** that client. Put the two together and Floe shows your **margin per contract** — real revenue minus real cost, per client, per call. That is how you price the next deal on actuals instead of a blended guess that quietly eats a point of gross margin every time a client's mix shifts toward the expensive vendors.

The same arithmetic runs everywhere — the margin you preview before signing, the margin on the transactions report, and the margin on the eventual invoice all come from **one shared rating function**. A preview can never disagree with the statement it previews.

## What a rate card is

A rate card is a **per-client price**, expressed as one or more rules. Floe supports four pricing models, and you can combine them (a retainer plus overage, say):

| Model | Rule | Bills the client |
|---|---|---|
| **Cost-plus** | `cost_plus`, `marginBps` | The call's cost basis × (1 + margin). `2000` bps = cost + 20%. |
| **Per request** | `per_unit`, `unit: request`, `ratePerUnitRaw`, `includedUnits?` | A flat rate per metered request, after any included allotment. |
| **Per minute** | `per_unit`, `unit: audio_minute`, `ratePerUnitRaw`, `includedUnits?` | A rate per audio minute — `ceil(total audio seconds / 60)`, the voice-agency staple. |
| **Retainer** | `fixed`, `amountRaw` | A flat amount for the period, independent of usage. |

All money values are **raw 6-decimal USDC integers** (`1000000` = $1.00), the same unit the ledger uses.

Cost-plus over vendor actuals is the sharpest margin tool: a `cost_plus` rule can name a `vendorCostBasis` so the cost it marks up is the vendor's **reconciled** bill, not a call-time estimate — "rebill Deepgram + 15%" prices off what Deepgram actually charged.

## Price the next deal — preview before you sign

This is the flow the whole feature exists for. Before you commit a price, rate a client's **real recent usage** under one or more candidate cards and read the margin each would have produced:

```http
POST /v1/developer/rate-cards/preview
```

```json
{
  "customerId": "acme-corp",
  "days": 30,
  "candidates": [
    { "label": "cost + 20%", "rules": [{ "kind": "cost_plus", "marginBps": 2000 }] },
    { "label": "$0.12 / min", "rules": [{ "kind": "per_unit", "unit": "audio_minute", "label": "voice", "ratePerUnitRaw": "120000" }] }
  ]
}
```

Floe rates the client's last 30 days of actual usage under **each** candidate and returns, per option, `revenueRaw`, `costRaw`, and `marginRaw` (`revenueRaw − costRaw` — negative means you'd lose money):

```json
{
  "customerId": "acme-corp",
  "windowDays": 30,
  "usageSource": "ledger",
  "options": [
    { "label": "cost + 20%", "revenueRaw": "115344000", "costRaw": "96120000", "marginRaw": "19224000" },
    { "label": "$0.12 / min", "revenueRaw": "104400000", "costRaw": "96120000", "marginRaw": "8280000" }
  ]
}
```

Now the deal is priced on this client's real vendor mix. Cost-plus holds your margin as the mix shifts; the flat per-minute rate is simpler to sell but you carry the mix risk — the preview makes that tradeoff a number instead of a hunch.

**No history yet** (a brand-new client)? Pass `assumedUsage` — modeled requests, audio seconds, cost, and optionally reconciled vendor cost — and Floe rates that instead, so "what if I switch this client to cost-plus over actuals?" is answerable before a single call runs. The response marks `usageSource: "assumed"`.

Preview requires the **Agency** feature `rate_cards`.

## Set and activate a card

Once you've priced it, write the card. Rate cards are **append-only and versioned per client** — there is no edit or delete. "Changing" a price is appending the next version:

```http
POST /v1/developer/rate-cards
```

```json
{
  "customerId": "acme-corp",
  "rules": [{ "kind": "cost_plus", "marginBps": 2000 }],
  "status": "active",
  "note": "signed 2026-08"
}
```

- `status: "active"` (the default) prices this client from now on. `status: "draft"` parks the version so you can preview it, then flip it live:

  ```http
  POST /v1/developer/rate-cards/:id/activate
  ```

- **Active versions are immutable, and their start dates only move forward.** Floe refuses a back-dated active version (`effective_from_regression`), because re-rating history under a new price is exactly what append-only exists to prevent — an invoice you already issued must stay reproducible byte-for-byte.
- **"Current" is the version whose start date is effective now** — not the highest version number. A version dated to activate next Monday displays exactly as it will rate.

Read a client's full version history any time with `GET /v1/developer/rate-cards?customerId=acme-corp`. Reads stay open even without the Agency feature, so a downgraded account keeps seeing what it already priced (grandfathered read-only); only the pricing **writes** need `rate_cards`.

## Signed vs deployed — margin per contract

The reason to price on actuals is that **what you signed and what you deployed drift apart.** You quote a client a per-minute rate against an assumed vendor mix; three weeks in, the agent is routing more calls to a pricier LLM and your gross margin has quietly compressed. Floe surfaces the gap two ways:

- **The clients list** — `GET /v1/developer/customers?days=30` — every end-client seen in the ledger with its current card status (current version, any open draft) and window spend. One screen for "who's priced, who's still on a blended guess."
- **The per-transaction margin report** — `GET /v1/developer/customers/:customerId/transactions?from=…&to=…` — every metered leg for one client with its cost, its revenue under the card version effective *at that leg's timestamp*, and its per-row margin. A `summary` block rates the whole range under all rules — the number that matches the eventual invoice. Rows a per-row figure can't honestly express (a fixed retainer, a per-minute component, an unresolved vendor leg) are flagged `perRowComplete: false` rather than shown understated.

Both are **Pro** reads (`attribution_reports`). Read them side by side with the card you signed and the drift is a dollar figure, not a surprise at invoice time.

## Plan gate

> **Rate cards and the margin engine are an Agency capability.**
>
> Every pricing **write** — creating or activating a card, running a preview, managing projects — requires the **Agency** feature `rate_cards`. The per-client cost and margin **reads** (`/customers`, `/customers/:id/transactions`) require the Pro feature `attribution_reports`. Reading existing cards stays open on every plan, so a downgrade never breaks pricing that is already running; there is also a per-plan cap on the number of *billed* clients, enforced only when you price a client that has never been priced or invoiced before (`plan_limit_exceeded`).

## Related

- [Cost per client, campaign & task](attribution.md) — tag the spend these cards price.
- [The live cost ledger](unified-ledger.md) · [Vendor actuals](vendor-actuals.md) — the cost side of every margin figure.
- [Client invoicing — billing periods & statements](invoicing.md) — turn a priced period into a statement you can send.
