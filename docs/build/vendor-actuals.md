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

Those two rules operate on different things, which is worth stating plainly. The **subtotals** are per claim and stay apart: an `exact` figure and a `period-rate` figure are never merged into one number labelled `exact`. The **row total** is a different object — it is the sum of every leg that has a price, and a row shows one **only when every leg in it is `exact`, `period-rate` or `invoiced` and USD-denominated**. So a row mixing `exact` and `period-rate` legs does get a total; what it never gets is a total that hides which claim each dollar came from. Any row with a `pending` or `manual` leg returns `"partial — lower bound"` and the reasons why. There is no code path that renders a misleading single figure.

## When the cost actually arrives

This is the part worth knowing before you look at a fresh window and conclude something is broken.

| Leg | When Floe can cost it |
|---|---|
| **ElevenLabs** | The **moment the call ends**. |
| Telephony (Twilio, Telnyx) and Deepgram | Within **~10 minutes**. |
| Every LLM leg, and every cloud leg (Bedrock, GCP, Azure) | **Next day** — those vendors publish on a daily batch. |

So a call you placed a minute ago is *supposed* to have `pending` legs.

{% hint style="info" %}
**`pending` is the steady state for a recent Twilio call.** Twilio populates `Call.price` asynchronously after the call completes — it is simply not there at hangup. A `pending` telephony leg on a call from the last few minutes is the system working correctly, not a capture failure. If it is still `pending` well past the vendor's SLA, that opens an `unmatched_leg` [finding](#findings) — which is how you tell the two apart.
{% endhint %}

## Coverage reads low on voice-heavy accounts at launch

Worth saying plainly rather than letting you discover it from a dashboard.

`period-rate` requires **vendor-reported units** — the vendor has to tell Floe how many units it billed, so the realized rate has something honest to multiply. Several of the biggest line items in a voice bill are **Floe-measured** instead: Floe counts them itself, before or during the call.

- **TTS** — code points counted before the request
- **Streaming STT** — audio duration measured on the wire
- **Duration-billed realtime** — wall-clock checkpoints
- **Telephony transport** — minutes metered by Floe

Floe's measurement is good enough to *bill* and to *enforce budgets against*. It is not the vendor's own statement of units, so pricing it at the vendor's bucket rate would be inventing an allocation. Those legs are therefore **structurally barred from `period-rate`** — no connector, no key, and no amount of waiting changes it — and their dollars are booked to a **named residual** on the vendor's bucket instead of being spread across legs.

The practical consequence: **a voice-heavy account will show a lower share of priced legs than an LLM-heavy one, and that is a property of what the vendors publish, not a gap in your setup.** The fix where one exists is the invoice lane — upload the vendor's invoice and [foot](#invoices-and-footing) it, which moves those dollars to `invoiced`.

## Whose cost it is

Every agency-facing read filters on `cost_owner = 'developer'` — **legs your account pays for**.

A Twilio minute or marketplace call carried on *Floe's* account is **Floe's** COGS, and your cost for that same minute is already exact in the settled Floe ledger. Counting the vendor actual too would bill it twice. So Floe-carried legs are **omitted entirely** — not shown at zero, which would be a different kind of lie. Every response says so out loud in `costOwnerNote`.

## No FX, ever

A non-USD or credit-denominated vendor record is **structurally unpriceable** here. There is no FX source in Floe, and an invented rate inside an audit ledger is worse than a blank. Those legs render `—` plus the vendor's verbatim cost string in their provenance, and are excluded from every subtotal. They also open a `currency_unsupported` finding so the omission is visible rather than silent.

## Connecting a vendor

Floe pulls each vendor's billing records with a **read-only credential you supply** — separate from any BYOK key that routes traffic. Floe never writes to your vendor account and never rotates your keys.

Connect one in the dashboard under **Keys → Vendor billing connections**, or from the CLI:

```bash
# Interactive: prompts per field, secrets hidden. Never pass a credential as an argument.
floe actuals connect --vendor twilio --name main --kind basic_auth \
  --billing-tz America/Los_Angeles

# In scripts: pipe a JSON object on stdin.
printf '%s' "$TWILIO_JSON" | floe actuals connect \
  --vendor twilio --name main --kind basic_auth --billing-tz America/Los_Angeles

floe actuals verify 4       # prove the credential still reads
floe actuals connections    # masked list + the connector catalog
```

Stored credentials are sealed and **never returned by any read** — every read shows a per-kind mask in which identifiers (region, project id, account SID) are verbatim and secrets are elided.

Three things decide what you will actually get, and it is worth checking them before you judge the numbers:

- **`bestStatus` is a ceiling.** It is the best status a leg served by that connection can *ever* reach. A connector whose `bestStatus` is `period-rate` will never produce `exact`, however long you wait.
- **`--billing-tz` is required where the vendor cuts buckets in local time.** Twilio cuts daily usage records in your account's timezone and exposes it through no API, so Floe has to ask. An unchecked UTC assumption there is a permanent, silent ~4%/day gap.
- **Some things cannot be backfilled.** Several vendors only expose billing detail from the moment a setting is switched on — connect first, and the history before that stays `manual`.

{% hint style="info" %}
**Per-vendor setup runbooks** — the exact scopes to grant, the console steps to get there, and the day-one items that cannot be backfilled — are maintained per vendor and linked from each connector in the dashboard's connect flow. Follow the runbook for your vendor rather than guessing at scopes: a credential that verifies can still be missing a scope a nightly pull needs.
{% endhint %}

## Invoices and footing

Where no API publishes a cost, the invoice is the record. Upload it, review the parsed lines, then **foot** it — which reconciles the invoice total against what the ledger already holds and stamps the touched legs `invoiced`.

```bash
floe actuals invoices upload --vendor twilio --file ./july.csv
floe actuals invoices foot 11 --dry-run   # runs the identical computation and rolls it back
floe actuals invoices foot 11             # irreversible — asks you to confirm
```

Footing is an **irreversible finance action**: run `--dry-run` first, always. It is deliberately **not exposed over MCP** — an agent should not be able to seal a vendor invoice. Any residue the foot cannot explain above `max(0.5%, $1)` opens an `invoice_foot_variance` finding rather than being quietly absorbed.

A non-USD invoice foots into **units only**, and every leg it touches terminates as `manual`.

## Findings

Findings are the engine's own record of **everything it could not reconcile** — the named reasons a total is a lower bound instead of a total. Read them before you trust a coverage number.

| Finding | What it usually means |
|---|---|
| `unmatched_actual` | A vendor record with no matching leg — usually broken tag injection. |
| `unmatched_leg` | A leg is past its vendor's SLA with no record. This is what separates "normally pending" from "actually missing". |
| `units_mismatch` | Your leg's units and the vendor's disagree. |
| `over_coverage` | Legs claim more units than the vendor's bucket holds — blocks the whole key. |
| `unknown_line_item` | An unmapped line item — blocks `period-rate` for its parent key. |
| `bucket_reopened` | A closed vendor bucket changed after closure. The stamps it priced are re-derived. |
| `platform_zero_cost` | An orchestrator reported a call with no cost lines — usually a BYOK leg the platform never paid for. |
| `connector_stale` | No successful pull inside the connection's freshness SLA. |
| `invoice_foot_variance` | Unexplained residue on a foot. |
| `currency_unsupported` | A non-USD record. No FX, ever. |

Resolving a finding is a **human** judgment — the API refuses the machine's own `auto_cleared` verdict precisely so that "acknowledged" and "wont_fix" stay something a person decided.

```bash
floe actuals findings                                   # open findings, newest first
floe actuals findings resolve 3 --resolution acknowledged
```

## Where to see it

| Surface | How |
|---|---|
| **Dashboard** | `/actuals` — legs, by-call, and rollups, with a provenance drawer on every row |
| **CLI** | `floe actuals legs · calls · rollups · findings · connections · invoices` |
| **MCP** | The `actuals` capability group — six read tools. Upload and foot are not exposed |
| **API** | [Vendor Actuals API](../developers/vendor-actuals-api.md) |

`floe actuals` is about **your** vendors' bills. Not to be confused with `floe vendors`, which probes the health of Floe's own marketplace vendors.

## Related

- [Vendor Actuals API](../developers/vendor-actuals-api.md) — endpoints, filters, and response shapes.
- [Coverage Score](coverage-score.md) — how much of your spend Floe can enforce, which is a different question from what it cost.
- [Unified Billing & Ledger](unified-ledger.md) — the settled Floe ledger these vendor costs sit beside.
- [Ledger sync](ledger-sync.md) — pushing off-path spend into the ledger in the first place.
