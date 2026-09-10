---
icon: receipt
---

# Vendor actuals

Your [Coverage Score](coverage-score.md) tells you how much of your spend Floe can *act on*. **Vendor actuals** tells you what that spend actually **cost you at the vendor** — reconciled against the vendor's own billing records, leg by leg.

The distinction matters most on **BYOK**. When a call runs on your own vendor key, Floe settles only its service fee; the vendor bills you directly, so your true cost was never in Floe's settled ledger. Floe used to record a rate-card *estimate* of it. **It no longer does.** Every such leg now carries the vendor's own request id, a connector pulls the vendor's billing record, and a reconcile pass stamps the leg with what that record supports — or with the honest admission that no record exists yet.

## A cost is a claim

Every leg carries a **status**, and the status is the whole point: it says exactly how much precision the number behind it has earned.

| Status | What it means | What it is **not** |
|---|---|---|
| `exact` | Reconciled to the vendor's own **per-request** billing record. | — |
| `period-rate` | Priced at the vendor's own **realized rate for that period**, taken from their cost and usage APIs and applied to the leg's vendor-reported units. | Not `exact`. Not per-request precision. |
| `invoiced` | **Footed to the vendor's invoice.** The status it held before the foot is retained. | — |
| `pending` | The vendor **hasn't published this cost yet**. | Not an error. Not a zero. |
| `manual` | **No vendor API publishes this** — upload the invoice. | Not a zero. |

Two rules follow, and both are enforced in the API rather than left to a renderer:

- **A `pending` or `manual` leg has no cost.** The surface shows its units. `costRaw` is `null` — never `0`, because a zero in a column headed "cost" is a claim, and a blank is the truth.
- **`exact` and `period-rate` are never added together.** They are different claims, so they come back as separate subtotals and get different colours in the dashboard. A `period-rate` figure is a real derivation — the vendor's own bucket cost ÷ the vendor's own bucket units, with both source records and the realized rate stored as provenance — but describing it as "exact" would overstate it.

Those two rules operate on different things, which is worth stating plainly. The **subtotals** are per claim and stay apart: an `exact` figure and a `period-rate` figure are never merged into one number labelled `exact`. The **row total** is a different object — it is the sum of every leg that has a price, and a row shows one **only when every leg in it is `exact`, `period-rate` or `invoiced` and USD-denominated**. So a row mixing `exact` and `period-rate` legs does get a total; what it never gets is a total that hides which claim each dollar came from. Any row with a `pending`, `manual`, or non-USD (`currency_unsupported`) leg returns `"partial — lower bound"` — `totalRaw` is `null`, never `0`, and `totalBlockedBy` names why (e.g. `non_usd` for a non-USD leg, so a client never reads the missing price as zero). There is no code path that renders a misleading single figure.

## When the cost arrives

Some vendors publish a leg's cost at call-end; others only on a next-day batch. So a leg from a call you placed a minute ago is *supposed* to be `pending` — that is the system working correctly, not an error or a capture failure.

## Coverage reads low on voice-heavy accounts

A voice-heavy account shows a lower share of priced legs than an LLM-heavy one. That is a property of what the vendors publish, not a gap in your setup. Where it matters, close it through the invoice lane — upload the vendor's invoice and foot it.

## How much of the bill reconciled

A vendor's own bill can total more than the legs Floe captured for it. That difference — the vendor-stated dollars no captured leg carried — is booked as an **uncaptured residual** per vendor and period, and the **vendor** and **customer** rollups carry it on every row, next to a dollar coverage:

| Field | What it is |
|---|---|
| `residualRaw` | The vendor-stated dollars no captured leg carried, raw 6-dp USD. **Signed** — a vendor credit is negative. |
| `coverageBps` | Reconciled dollars ÷ known vendor spend (`reconciled + residual`), in basis points — what share of this vendor's spend reconciled to actuals. |

A row whose whole bill reconciled reads `residualRaw: "0"` and `coverageBps: 10000`. `coverageBps` is `null` when there is nothing to take a ratio of — no known spend in the row, or a non-USD leg in it, since dividing by a figure that was never converted to USD is the same invented-rate problem as [FX](#no-fx-ever).

This is a **dollar** coverage over your vendors' bills. It is not the [Coverage Score](coverage-score.md), which answers a different question — how much of your spend Floe can act on.

Both fields are **absent — not zero** — when a filter is applied that the residual can't honour: `customer`, `agent`, `campaign`, `task`, attribution state, or status. Uncaptured spend is by definition spend Floe never captured, so it carries none of those tags; narrowing the reconciled figure without narrowing the residual would report a coverage percentage over a mismatched scope, so the surface omits it instead. A `vendor` filter is honoured and keeps both fields. The `campaign`, `agent` and `time` dimensions and the by-call read never carry the two fields at all — a residual is booked per vendor and period, so only the vendor and customer keys line up with one.

In the dashboard, the rollups tab at `/actuals` shows the two as **Residual** and **Coverage** columns on the vendor and customer views, with `—` wherever the API omits or nulls them.

## Untagged rollup rows name their vendor

In the `campaign` and `agent` rollups, legs carrying no such tag bucket as **`(unattributed):<vendor>`** — one row per vendor — rather than folding every vendor's untagged spend into a single opaque lump. That makes the row a work list: it says *which* vendor's charges still lack attribution. (The `customer` rollup's untagged bucket is plain `(unattributed)`.) See [Cost per client, campaign & task](attribution.md) for how to get the tags on in the first place.

## Whose cost it is

Every agency-facing read filters on `cost_owner = 'developer'` — **legs your account pays for**.

A Twilio minute or marketplace call carried on *Floe's* account is **Floe's** COGS, and your cost for that same minute is already exact in the settled Floe ledger. Counting the vendor actual too would bill it twice. So Floe-carried legs are **omitted entirely** — not shown at zero, which would be a different kind of lie. Every response says so out loud in `costOwnerNote`.

## No FX, ever

A non-USD or credit-denominated vendor record is **structurally unpriceable** here. There is no FX source in Floe, and an invented rate inside an audit ledger is worse than a blank. Those legs render `—` plus the vendor's verbatim cost string in their provenance, and are excluded from every subtotal. They also open a `currency_unsupported` finding so the omission is visible rather than silent.

## Where to access it

Reconciling to a vendor's **own** records is an **Agency** capability — it's the [vendor connection](vendor-connections.md) that does it. (Reading the ledger those costs land on — per-leg and by-call — is free; the per-client rollups are Pro. See [Plans & entitlements](../reference/plans.md).) Floe pulls each vendor's billing records with a **read-only credential you supply** — separate from any key that routes traffic; Floe never writes to your vendor account and never rotates your keys. Connect one in the dashboard under **Keys → Vendor billing connections**, or from the `floe actuals` CLI; some vendors (e.g. Twilio) require you to set your billing timezone when connecting. Where no vendor API publishes a cost, upload the vendor's invoice and foot it to reconcile it.

Read your reconciled costs — legs, by-call, and rollups, each with a provenance drawer — in the dashboard at `/actuals`, over the `floe actuals` CLI, or through the `actuals` MCP capability group (read tools only; invoice upload and footing stay human-in-the-loop). The engine records everything it couldn't reconcile as a *finding* with a reason — review and resolve them in the dashboard.

`floe actuals` is about **your** vendors' bills. Not to be confused with `floe vendors`, which probes the health of Floe's own marketplace vendors.

## Related

- [Coverage Score](coverage-score.md) — how much of your spend Floe can enforce, which is a different question from what it cost.
- [Unified Billing & Ledger](unified-ledger.md) — the settled Floe ledger these vendor costs sit beside.
- [Ledger sync](ledger-sync.md) — pushing off-path spend into the ledger in the first place.
