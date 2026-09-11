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

### Close-time gates

If your rate card **rebills vendor cost** (a `cost_plus` rule), the close also checks that the vendor actuals behind those legs are real before it invoices them:

| `409` | Why | Way forward |
|---|---|---|
| `unrated_usage` | Usage in a segment with no effective card version. | Set pricing (or a back-stop version) for that window, then close. |
| `legacy_estimate_basis` | The card still carries a retired estimate flag that would rate vendor cost as $0. | Append a card version naming an explicit basis. **Not** overridable. |
| `vendor_actuals_pending` | A vendor leg has no confirmed figure yet (a `manual` leg, or a `pending` one past its SLA). | Resolve the leg — see [vendor actuals](vendor-actuals.md) — or close with an **owner override** naming a reason. |

The override on `vendor_actuals_pending` is owner-only, reasoned, and loud: it invoices a client for a vendor cost nobody has confirmed, so it fires an ops alert and a `vendor_actuals.close_gate_overridden` webhook. Pass it in the close body:

```json
{ "actualsGateOverrideReason": "Client month-end is hard; Twilio batch is 6h late and within tolerance." }
```

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

## The internal close pack

A statement says *what you billed*. The **close pack** says *how you know* — the audit-grade view of the same closed period, for your own books and your accountant. It is a superset of `margin.csv`: the same lines, plus each line's **evidence class**, the ids to drill through to the rows behind it, and a **basis of preparation** block before the first line.

```http
GET /v1/developer/billing-periods/:id/close-pack       # JSON
GET /v1/developer/billing-periods/:id/close-pack.csv   # floe-close-pack-<client>-<date>.csv
```

Only a **closed** period has a pack. An open period has no rated lines and no close instant to reconstruct from, so both routes refuse it with `409 period_not_closed` — close it first. Both are reads, allowed for any role, and a period you don't own is a `404` like every other billing-period read.

The pack is **internal by construction**: there is no disclosure flag to gate it, cost basis and margin are always present, the CSV's first line reads *INTERNAL CLOSE PACK — NOT FOR YOUR CLIENT*, and it gets its own third filename prefix (`floe-close-pack-…`) for exactly the reason the margin file gets its own second one.

Assembling a pack never re-rates and never writes. It reads the frozen lines the close wrote, and reconstructs the vendor evidence **as of the period's `closedAt`** from the append-only reconciliation ledger — so a correction or an invoice footed *after* the close changes today's view of your costs but not this pack. The artifact you hand an auditor stays the one the close produced.

### Basis of preparation

Before any line, the pack states what the numbers were built from:

- **Sources** — the vendor connectors that contributed charges in the window (with leg counts), and the vendor documents overlapping it (with each one's foot status). The document list is capped, and a capped list says it was truncated rather than presenting itself as the complete set.
- **Cost basis by evidence grade** — line count, revenue, cost basis and margin per grade. A line with no cost basis foots as cost `0`, so `revenue − cost basis = margin` holds per grade and in the totals footer: an auditor's cross-foot works.
- **Unallocated** — charges in the window that belong to no client, with their currently-costed dollars as an explicit **lower bound**. The honest size of what no statement claims.
- **Allocation methods** — the named rules that spread account-level cost onto this client.
- **Floe's platform fee** for the period, carried as its own pack line so the net margin is your true P&L on the client. It is a cost to you and is never billed to your client.

### Evidence class

Every line carries the grade of the evidence under its cost. Grades are **derived** from what the line already records — its source, its cost basis, and the reconciliation statuses its rate card's basis admits — so there is no new field to maintain:

| Grade | What backs the line |
|---|---|
| `actual` | An exact per-request figure: an `exact` vendor reconciliation, or Floe's own settled rail cost. |
| `document` | A footed vendor invoice. |
| `stamp` | The vendor's own realized rate for the period (`period-rate`). |
| `usage` | No cost basis at all — a retainer, a per-unit line, or a manual adjustment, priced from the rate card or by a human. |
| `allocation` | Spread onto this client from an account-level pool by a named rule. |
| `true-up` | A late vendor actual carried in from a prior period. |
| `floe-fee` | Floe's own platform fee on the period. |
| `unclassified` | Vendor cost was applied but no admitted reconciliation could be resolved behind it — a data anomaly worth investigating, kept visibly distinct from `stamp` so it never reads as routine. |

When one line is backed by a **mix** of statuses, the grade reports the **weakest** evidence admitted (`period-rate` before `exact` before `invoiced`) — the conservative floor. The full mix rides along per line as an `evidence_breakdown` (`exact:2|period-rate:1`), so nothing is lost by the summary.

### Drill-through

Each line carries the ids that reconstruct it: the rate-card version and segment bounds it was rated under, the originating period and adjustment for a true-up, the allocation rule and method, who created a manual line, and the `vendorActualIds` / `reconciliationIds` / `vendorDocumentIds` behind its vendor cost. Every figure on the pack traces back to a row you can open — see [vendor actuals](vendor-actuals.md).

The CSV renders the basis of preparation as `#` comment lines, one row per line, and a totals footer. Parse it by header name, not by column position.

In the dashboard, a closed period on the **Customers** page shows the basis of preparation inline under **Basis of preparation**, and **Download internal close pack** pulls the CSV.

## What's a claim, and what's exact

A statement inherits the honesty of the ledger under it. A retainer line has no cost basis, so its `cost`/`margin` cells are **blank, never zero** — a zero in a cost column is a claim, and a blank is the truth. A `cost_plus` line's margin is real only to the precision its vendor actuals earned; a leg the vendor hasn't priced yet blocks the close rather than inventing a number. The statement never renders a figure it can't stand behind.

## Related

- [Rate cards & the margin engine](rate-cards.md) — how usage becomes the revenue on each line, including `cost_plus` rebilling.
- [Cost per client, campaign & task](attribution.md) — the attribution the statement bills from.
- [Vendor actuals](vendor-actuals.md) — the reconciled vendor cost behind the margin figures and the close gate.
- [Stripe Connect](stripe-connect.md) — collect on a statement through your own Stripe account.
