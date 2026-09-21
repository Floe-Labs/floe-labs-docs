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

## Whose cost it is

Every agency-facing read filters on `cost_owner = 'developer'` — **legs your account pays for**.

A Twilio minute or marketplace call carried on *Floe's* account is **Floe's** COGS, and your cost for that same minute is already exact in the settled Floe ledger. Counting the vendor actual too would bill it twice. So Floe-carried legs are **omitted entirely** from vendor cost — not shown at zero, which would be a different kind of lie. Every response says so out loud in `costOwnerNote`.

That is a statement about **vendor** cost, not about what the work cost you. You did pay Floe for a keyless call, an x402 tool call or a Floe Phone minute, and that amount is exact on the money row. So the per-task view reports it alongside, never inside, the reconciled vendor figures:

| Field | What it is |
|---|---|
| `exactRaw` / `periodRateRaw` / `totalRaw` | Your **vendor** bill for legs your account pays for. Floe-carried legs are not in here. |
| `floeChargeRaw` | What **Floe charged you** for the legs Floe carried, counted once per charge — one charge can pay for several legs of the same call. |
| `paidRaw` | What the task cost you: the two added. `null` while the vendor half is still partial, because adding a known charge to a partial sum would read as an answer. |

A task whose every leg is Floe-carried — keyless inference in a workflow, a Floe Phone call — therefore appears with its charge instead of being invisible. Its vendor figures stay empty, because none of that spend is a vendor bill of yours.

### The same pair on the rollups

`GET /v1/developer/interactions/rollups?by=customer|campaign|agent|channel|outcome|task_type` reports `floeChargeRaw`, `floeChargeRequests` and `paidRaw` per row, so a per-client or per-campaign row states what that work **cost** — not just its vendor bill. `paidRaw` is the only figure on the row safe to compare against another paid figure. Three rules to read them by:

- **Absent — not null — when the question can't be answered.** Filter the request by vendor, reconciliation status, client or agent and the charge fields are left off the response entirely, rather than reporting unfiltered charges inside a filtered response. A Floe charge is one payment across all of a call's legs, so it cannot be narrowed to just the legs a leg-level filter matched. Test for the key itself (`'floeChargeRaw' in row`) to tell **"Floe carried nothing for this key"** (`floeChargeRaw: null`) from **"not answerable under this filter"** (no field at all). `costOwnerNote` moves with the fields, so the note never advertises a figure the rows don't carry. Filtering by **campaign** or **outcome** — properties of the call, not of a leg — keeps the fields, because those filters are re-applied to the charges too.
- **`paidRaw` is `null` while the row's vendor half is partial**, for the same reason it is on the per-task view: adding a known charge to a lower bound would render it as though it were a total.
- **Unlike the per-task view, a key whose spend is *entirely* Floe-carried still doesn't appear at this grain.** It has no developer-owned leg to group on, so it contributes neither a row nor a charge. What changed is that a key which *does* appear no longer understates itself.

The response also carries `floeChargeUnkeyed` — charges that resolved to no row, reported beside the rows rather than folded into one. It is present exactly when the rows carry charge fields, and is normally `{ "chargeRaw": "0", "requests": 0 }`.

## No FX, ever

A non-USD or credit-denominated vendor record is **structurally unpriceable** here. There is no FX source in Floe, and an invented rate inside an audit ledger is worse than a blank. Those legs render `—` plus the vendor's verbatim cost string in their provenance, and are excluded from every subtotal. They also open a `currency_unsupported` finding so the omission is visible rather than silent.

## Where to access it

Reconciling to a vendor's **own** records is an **Agency** capability — it's the [vendor connection](vendor-connections.md) that does it. (Reading the ledger those costs land on — per-leg and by-call — is free; the per-client rollups are Pro. See [Plans & entitlements](../reference/plans.md).) Floe pulls each vendor's billing records with a **read-only credential you supply** — separate from any key that routes traffic; Floe never writes to your vendor account and never rotates your keys. Connect one in the dashboard under **Keys → Vendor billing connections**, or from the `floe actuals` CLI; some vendors (e.g. Twilio) require you to set your billing timezone when connecting. Where no vendor API publishes a cost, upload the vendor's invoice and foot it to reconcile it.

Read your reconciled costs — legs, by-call, and rollups, each with a provenance drawer — in the dashboard at `/actuals`, over the `floe actuals` CLI, or through the `actuals` MCP capability group (read tools only; invoice upload and footing stay human-in-the-loop). The engine records everything it couldn't reconcile as a *finding* with a reason — review and resolve them in the dashboard.

On a **campaign-tagged** call, the by-call view also measures that call against its campaign's average cost per call, over your whole history window. Where it can't state a percentage it says why instead of showing a dash — this call's own cost is still a lower bound, some calls in the campaign aren't costed yet, or it's the only call in the campaign. Both sides of that comparison are paid cost (`paidRaw`), so a call with keyless, Floe Phone or x402 work in it isn't measured against a vendor-only mean.

`floe actuals` is about **your** vendors' bills. Not to be confused with `floe vendors`, which probes the health of Floe's own marketplace vendors.

## Related

- [Coverage Score](coverage-score.md) — how much of your spend Floe can enforce, which is a different question from what it cost.
- [Unified Billing & Ledger](unified-ledger.md) — the settled Floe ledger these vendor costs sit beside.
- [Ledger sync](ledger-sync.md) — pushing off-path spend into the ledger in the first place.
