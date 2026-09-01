---
icon: file-invoice-dollar
---

# Client invoicing — billing periods & statements

You already know [what every call cost](unified-ledger.md), [reconciled to the vendor's own records](vendor-actuals.md), and [tagged by client and campaign](attribution.md). Invoicing is the last leg: it turns that ledger into a **bill you can send**. Open a billing period per client, let the [rate card](rate-cards.md) rate the usage in it, freeze it into an immutable statement, and hand the client a number they can pay — priced from what their calls actually cost, not from a guess.

The statement is the artifact. Everything on this page produces one, keeps it reproducible, and never lets a dollar of usage slip out of a bill or get billed twice.

> **Plan gate.** Every write here needs the **Agency** plan (`client_invoicing`). The reads stay open, so an account that downgrades can still see and export the statements it already issued. The `statement.csv` / `margin.csv` exports ride the **Pro** `exports` capability. To collect on a statement, see [Stripe Connect](stripe-connect.md).

## The shape of a bill

A **billing period** is a window `[periodStart, periodEnd)` for one client. It moves through a small set of states, and each transition is one-way:

| Status | Meaning | How it got here |
|---|---|---|
| `open` | Accepting usage and manual adjustments. Nothing is rated yet. | Created by you. |
| `closed` | Rated, snapshotted, **frozen**. The statement exists and never changes. | `close` after the window has ended. |
| `issued` | The statement was handed to the client — as a CSV, a carried credit, or a Stripe invoice. | `issue`, `carry-credit`, or an [invoice push](stripe-connect.md). |
| `paid` / `void` / `uncollectible` | Collection outcome. | Written only by the Stripe webhook sync. |

The rule underneath all of it: **a closed statement is immutable**. There is no path that edits, re-rates, or deletes a closed period's rows. A late-arriving cost carries a later timestamp and therefore lands in the *next* period by construction — never a retroactive rewrite of one a client has already seen.

## Open a period

```http
POST /v1/developer/billing-periods
```

```json
{
  "customerId": "acme-co",
  "periodStart": "2026-08-01T00:00:00Z",
  "periodEnd": "2026-09-01T00:00:00Z",
  "timezone": "America/New_York"
}
```

- `periodStart` / `periodEnd` are ISO-8601 with an offset; `periodStart` must be before `periodEnd`, and the window is at most **92 days**.
- `timezone` defaults to `UTC` and is what statement dates render in.
- One period per `(client, periodStart)` — a second create with the same start returns `409 period_exists`.
- A client that is new to billing counts against your plan's **billed-clients cap** (Agency: **30**). The cap is shared with [rate cards](rate-cards.md) and enforced atomically, so a concurrent create can't slip past the last slot.

List a client's periods (newest first) with `GET /v1/developer/billing-periods?customerId=acme-co`, and read one — period plus its line items — with `GET /v1/developer/billing-periods/:id`.

### Give the client a contact

Stripe delivers invoices by email, so a client needs a name and address before you can invoice it:

```http
PATCH /v1/developer/customers/acme-co
{ "name": "Acme Co", "email": "ap@acme.co" }
```

The customer entity is created lazily the first time anyone names it, so this is safe to call before the client's first period.

## Add a manual line item

While a period is **open**, add adjustments — a one-off setup fee, a goodwill credit, a discount:

```http
POST /v1/developer/billing-periods/:id/line-items
{ "label": "Onboarding credit", "amountRaw": "-25000000", "note": "First-month goodwill" }
```

- `amountRaw` is a **raw 6-decimal USDC integer** — `25000000` is $25.00, and a **credit is negative** (`-25000000`). This is the same unit the whole ledger uses; no floats.
- Manual items can only be added while the period is open. Once it closes, the statement is frozen — an adjustment to a closed period becomes a new line in the *next* open one, never an edit.
- You can add a manual line but not a `true_up`: late vendor actuals are written only by the reconcile job, and disagreement with one is expressed as an *offsetting credit*, not an edit. That is what keeps a re-close byte-identical.

## Preview before you close

A close is one-way, so look at it first:

```http
GET /v1/developer/billing-periods/:id/preview
```

Preview runs **exactly** the computation `close` runs — the same segmentation, the same rating, the same allocation — and writes nothing. It returns the lines the statement would carry (`rated`, `allocated`, and the `carried` ones already on the period), the totals they'd produce, and a `gates` block:

| Gate field | What it tells you |
|---|---|
| `periodEnded` | Whether the window is over — a close before that is refused. |
| `refusal` | The `409` the close *would* return (`unrated_usage`, `legacy_estimate_basis`), stated as a field. Preview reports; close refuses. |
| `vendorActuals` / `vendorActualsWouldBlock` | The unresolved-leg gate below, and whether it would need an override. |
| `allocationConflict` | Two active allocation rules claiming the same adjustment kind. |
| `unattributed` | Legs in this window that still belong to nobody, and their cost so far — the checklist. Assign them with [`POST /actuals/legs/:id/attribution`](attribution.md#fix-what-capture-missed) before you lock. |

Preview is for **open** periods only; a closed statement is immutable, and the equivalent view for one is `variance` below.

## Close the period

Closing is where usage becomes money. It runs **after the window has ended** — closing early would freeze a partial statement, and because closed statements are immutable, the rest of the window's usage could never be billed.

```http
POST /v1/developer/billing-periods/:id/close
```

The close does five things in one transaction:

1. **Segments** the window at every [rate-card](rate-cards.md) version change inside it, so a mid-period price change rates each slice under exactly one version.
2. **Rates** each segment's usage — fixed retainers prorated by the segment's share of the window, so a retainer is charged once, never twice.
3. **Refuses** (`409 unrated_usage`) any segment that has usage but no effective rate-card version. Unrated spend must never silently invoice at $0.
4. **Snapshots** every rated line with its card version and segment bounds, plus the sub-cent remainder, so `Σ line cents + Σ remainders` reconstructs the revenue exactly.
5. **Freezes** the period with a compare-and-set on `status='open'` — a concurrent close loses the race and rolls back. Re-closing a closed period returns the same statement unchanged (idempotent).

Any [allocated lines](#spread-account-level-cost-across-clients) are computed in the same pass and land in the same totals as the rated and carried ones, so every source that becomes a Stripe line is inside `revenue_raw` and `total_cents`.

### Close-time gates

If your rate card **rebills vendor cost** (a `cost_plus` rule), the close also checks that the vendor actuals behind those legs are real before it invoices them:

| `409` | Why | Way forward |
|---|---|---|
| `unrated_usage` | Usage in a segment with no effective card version. | Set pricing (or a back-stop version) for that window, then close. |
| `legacy_estimate_basis` | The card still carries a retired estimate flag that would rate vendor cost as $0. | Append a card version naming an explicit basis. **Not** overridable. |
| `vendor_actuals_pending` | A vendor leg has no confirmed figure yet (a `manual` leg, or a `pending` one past its SLA). | Resolve the leg — see [vendor actuals](vendor-actuals.md) — or close with an **owner override** naming a reason. |
| `allocation_rules_conflict` | Two **active** allocation rules claim the same adjustment kind, so the same fee would be billed twice. | Deactivate one of them (below), then close. |

The override on `vendor_actuals_pending` is owner-only, reasoned, and loud: it invoices a client for a vendor cost nobody has confirmed, so it fires an ops alert and a `vendor_actuals.close_gate_overridden` webhook. Pass it in the close body:

```json
{ "actualsGateOverrideReason": "Client month-end is hard; Twilio batch is 6h late and within tolerance." }
```

## Spread account-level cost across clients

Some real dollars belong to no single leg: committed spend, a monthly minimum, a volume-tier residual, a platform fee. They sit at account scope as period adjustments, invisible on every client's bill. A **named allocation rule** claims one or more adjustment kinds and says how they spread:

```http
POST /v1/developer/allocation-rules
{
  "label": "Twilio monthly minimum",
  "method": "by_units",
  "adjustmentKinds": ["fee"],
  "vendor": "twilio"
}
```

| Method | Weight |
|---|---|
| `by_usage` | Each client's request count in the adjustment's window. |
| `by_units` | Each client's audio seconds in the window. |
| `fixed` | Explicit `fixedShares` — `{ customerId, bps }`, each client named at most once, summing to **at most** 10000 bps. The remainder deliberately stays with you: clients can never be billed more than the cost. |

`fixedShares` is required exactly when `method` is `fixed`, and every id in it must be a client that already exists (`400 unknown_customer`) — a typo would silently eat a share of every fee. Shares are apportioned by largest remainder over the clients sorted deterministically, so every client's close computes the identical split whenever it runs and the shares of one adjustment sum exactly to it. Revenue-weighted allocation deliberately doesn't exist: it would depend on close order.

At close, each claimed adjustment becomes an `allocated` line on the client's statement carrying `allocationMethod` and `allocationRuleId`, so the statement prints the method behind the number. Allocated lines are **pass-through, not pricing** — the amount equals the cost share, margin-neutral by construction. Marking up shared cost is a [rate card](rate-cards.md) concern.

`GET /v1/developer/allocation-rules` is open to any role (a downgraded account can still see what its past statements meant); create, `PATCH` (relabel / deactivate) and `DELETE` need `admin` + Agency. Deleting or editing a rule never rewrites history — an issued statement's allocated line carries its own method and label forever.

> **Known limit.** An adjustment that lands *after* a client's period closed is not re-allocated into that immutable statement, so that client's share of it is never billed. The carry lane covers late **vendor-cost** deltas; late account-level adjustments don't have one yet.

## Variance — what the vendor billed after you closed

A closed statement is frozen, but the vendor's records keep arriving. Variance is the reconciliation view for one closed period:

```http
GET /v1/developer/billing-periods/:id/variance
```

| Block | What it is |
|---|---|
| `snapshot` | What the close froze — revenue, cost, margin, and the vendor cost applied and carried at that moment. |
| `live` | The **same computation** re-run today. If it now refuses (say the card gained a legacy-basis problem), the refusal is stated rather than papered over with a stale number. |
| `pendingTrueUpRaw` | What the next carry tick would write. Negative means the vendor billed **less** than estimated. Mirrors the carry service's own formula, so this view and the next true-up line can never disagree. |
| `trueUpsWritten` | True-up lines already carried into later periods; each carries `originPeriodId` pointing back at this period. |
| `findings` | The open reconciliation findings behind the numbers, joined through their legs to this client and window — up to 50, with `findingsTruncated` stating when there are more. |

The same client/window filter works directly on findings: `GET /v1/developer/actuals/findings?customerId=acme-co&since=…&until=…`. It reaches the client through the finding's leg — and follows an [attribution correction](attribution.md#fix-what-capture-missed) to the leg's *current* client — so findings with no leg reference drop out; the response says so with `filteredByLeg`.

## Issue the statement

A closed statement is ready to hand over. `issue` marks it delivered:

```http
POST /v1/developer/billing-periods/:id/issue
```

Only a `closed` period can be issued. From here you have three ways to actually get the number in front of the client: download the CSV below, [push it as a Stripe invoice](stripe-connect.md), or carry it forward.

## Carry a credit forward

Stripe won't cleanly bill a zero, negative, or sub-$0.50 invoice — instead of refusing it, it finalizes it, auto-marks it paid, and pushes the remainder into the client's Stripe credit balance *outside* Floe's ledger. So Floe carries it instead. When a statement comes out that way (a month that's all credits, or a true-up that flips it negative), carry it forward:

```http
POST /v1/developer/billing-periods/:id/carry-credit
```

The balance moves into the **next open period** for that client as a `Carried balance` line, and this period issues with a `carried` collection method. Nothing is mutated retroactively — the closed statement keeps its own numbers, and the carry is a new line in a different, still-open period. There must already be an open successor period; if there isn't, create the next month first (`409 no_open_successor`). A statement Stripe *would* take (≥ $0.50) returns `409 carry_not_required` — invoice it normally.

## Two CSVs — and which one you send

Both exports ride the **Pro** `exports` capability and are readable by any role (a downgraded account keeps the history it earned).

```http
GET /v1/developer/billing-periods/:id/statement.csv   # floe-statement-<client>-<date>.csv
GET /v1/developer/billing-periods/:id/margin.csv      # floe-margin-<client>-<date>.csv
```

| File | Columns | Who it's for |
|---|---|---|
| `statement.csv` | label, kind, quantity, unit, **amount** | **The client.** Byte-frozen. It carries revenue only. |
| `margin.csv` | everything above **plus `cost_usd`, `cost_vendor_usd`, `margin_usd`** | **You.** Your cost basis and markup. |

These are deliberately two different files with two different name prefixes, generated by two different code paths that never touch. The failure mode is one mis-click forwarding the wrong file to a client, and a distinct filename (`floe-margin-…` vs `floe-statement-…`) is the control that survives a human in a hurry. The margin file's first line says so out loud: *NOT FOR YOUR CLIENT*. Your cost basis never appears on anything a client can see — not the statement CSV, and never on any Stripe object.

## What's a claim, and what's exact

A statement inherits the honesty of the ledger under it. A retainer line has no cost basis, so its `cost`/`margin` cells are **blank, never zero** — a zero in a cost column is a claim, and a blank is the truth. A `cost_plus` line's margin is real only to the precision its vendor actuals earned; a leg the vendor hasn't priced yet blocks the close rather than inventing a number. The statement never renders a figure it can't stand behind.

## Related

- [Rate cards & the margin engine](rate-cards.md) — how usage becomes the revenue on each line, including `cost_plus` rebilling.
- [Cost per client, campaign & task](attribution.md) — the attribution the statement bills from.
- [Vendor actuals](vendor-actuals.md) — the reconciled vendor cost behind the margin figures and the close gate.
- [Stripe Connect](stripe-connect.md) — collect on a statement through your own Stripe account.
