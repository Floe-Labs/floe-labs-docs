---
icon: lock
---

# Period close & restatements

A ledger period is a month (`2026-08`) or an ISO week (`2026-W35`). It is **open** until you lock it, and after that it never changes. This page covers how a month reaches the point where it can lock (tied to the invoice and checked for completeness), what the lock does, and how a figure is corrected before and after the lock.

## Is the month complete?

Every period read includes `completeness`. For an open period it is computed when you read it (`live: true`). For a locked period it is the record written at lock time, frozen.

```bash
curl https://credit-api.floelabs.xyz/v1/developer/ledger/periods/2026-08 \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

`completeness.complete` is `true` only when `reasons` is empty. The reasons fall into four groups:

| Group | Examples | What it means for the figure |
|---|---|---|
| **Missing dollars** | `unpriced_legs`, `pending_legs`, `payer_unknown`, `gateway_unpriced`, `holds_excluded` | The true cost is at least the figure. `lowerBound` is `true`. |
| **Overstated dollars** | `hold_booked_at_reserve`, `orchestrator_connection_flag` | The figure may count something twice. It is not a lower bound. |
| **Not tied to the invoice** | `invoice_pending`, `tie_out_unexplained` | The gateway's estimates haven't been matched to the vendor's invoice yet (see below). |
| **Noted, not blocking** | `vendor_residuals_missing`, `unallocatable_spend`, `manual_override_conflict` | Recorded with the period, but they don't stop a lock. |

`GET /v1/developer/ledger/periods` lists the periods a close has touched, newest first. A period that isn't listed is open. Any account member can read periods.

## Tying the month to the invoice

Gateway traffic is priced at list rates as it happens. The vendor's invoice reflects what you actually pay. The **true-up** closes that gap for one vendor and one month:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/ledger/true-up \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"vendor": "anthropic", "period": "2026-08"}'
```

* **What it compares.** The vendor's total comes from the invoice on file for the month: grade A when the invoice was read with high confidence, B otherwise. With no invoice, it comes from the vendor's cost report (B). Floe compares that total with the sum of the month's gateway estimates billed by that vendor.
* **How the difference is explained.** The difference is broken down in a fixed order: timing, missing or extra rows, rate, then tax, credit, discount or fee. Anything left over is `unexplained`, so the causes always add up to the difference exactly.
* **Where it is posted.** The whole difference is posted as true-up entries and spread across the gateway's usage by initiative, department, person and model, so per-person and per-initiative figures still add up to the invoice. If the usage month is already locked, the entries go into the next open period.
* **Running it again** writes only what changed. With the same inputs it writes nothing.
* **Tolerance.** If the unexplained part is more than 0.5% of the invoice, the month reads `tie_out_unexplained` until a re-run ties it out, or the account owner accepts it with a reason (`POST /v1/developer/ledger/tie-outs/{id}/override`).

Footing an uploaded invoice runs the true-up automatically. An hourly job also runs the cost-report true-up for every finished month from a connected vendor that doesn't have one yet. `GET /v1/developer/ledger/tie-outs?period=2026-08` shows each vendor's tie-out two ways: by the month the usage happened and by the month the true-up was posted. It also includes a bridge from the ledger's net AI cost to the invoice total.

`GET` / `PUT /v1/developer/ledger/close-settings` sets how many business days you wait for invoices (`invoiceWindowBusinessDays`, default 5) and whether non-recoverable sales tax counts as AI cost (`salesTaxInAiCost`, default `false`).

## Locking a period

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/ledger/periods/2026-08/lock \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

A period can be locked only once it has fully ended (UTC). Locking a month does all of the following in one step:

1. **Brings every priced cost onto the ledger.** Every source row of the month is written as a cost entry, so nothing priced is left off before the month freezes. If a row can't be processed, the lock is refused and the period stays open.
2. **Allocates leftover untagged spend** using the close driver (see [Cost attribution & quarantine](cost-attribution.md#allocation-at-close)).
3. **Records the period's completeness** and a **coverage snapshot**: the share of cost that was tagged, rule-attributed, driver-allocated and quarantined. Read it later with `GET /v1/developer/ledger/periods/2026-08/coverage`.
4. **Marks every entry in the period `locked`.**

Locking a period that is already locked changes nothing and returns `alreadyLocked: true`. Locking needs the owner or admin role.

### When a lock is refused

| `409` error | Why | What to do |
|---|---|---|
| `period_not_ended` | The period hasn't fully ended | Wait |
| `holds_pending` | Charges in the period are still held at their reserve | Lock after they settle |
| `period_incomplete` | Dollars are missing or overstated, or the month isn't tied to the invoice. `completeness` says which. | Fix the cause, or override (below) |
| `driver_allocation_over_threshold` | Close allocation moved more than your threshold (default 2% of the month's cost) | Review the moved dollars, listed in `driverAllocation`, or override |
| `normalizer_failed` / `normalizer_busy` | Some source rows couldn't be priced, or another run is in progress | Fix the listed rows, or retry shortly |

The **account owner** can lock anyway by sending an `overrideReason` (10–500 characters) and the `overrideGates` it covers: `holds_pending`, `incomplete`, `payer_confirmed` or `driver_allocation`. Each gate clears only its own condition. Open periods list the gates they need now in `requiredOverrideGates`. The reason, who gave it and the gates are stored on the period (`lockOverride`).

A charge still held when you override is booked at its reserve as grade-D cost. When it settles, the difference goes into the next open period as a restatement.

You can set the allocation threshold with `PUT /v1/developer/close/allocation-threshold` (`thresholdBps` and an optional absolute `capMicro`; the stricter one applies). Each change is a new version, and the old ones are kept.

## Correcting a figure

How you correct an entry depends on whether its period is open or locked.

| | Open period: **supersede** | Locked period: **restate** |
|---|---|---|
| Route | `POST /v1/developer/ledger/entries/{id}/supersede` | `POST /v1/developer/ledger/entries/{id}/restate` |
| Body | `{ "amount", "reason", "estimate"? }` | `{ "newAmount", "reason", "estimate"? }` (reason required) |
| What is written | A replacement entry in the same period. The old entry is marked superseded. | A new entry in the **next open period** with `restates` = the locked entry and `priorPeriod` = its period. The locked entry stays exactly as it was. |
| Role | Member or above | Owner or admin |
| Wrong period | `409 period_locked`: use restate | `409 period_open`: use supersede |

Both routes work the same way in these respects:

* **A hand-typed correction is grade C at most**, or D if you send `estimate: true`. It is never graded higher than the entry it replaces. A correction reaches grade A only through a footed vendor invoice ([Vendor actuals](../build/vendor-actuals.md)).
* **Cost and value restate as a difference.** The restatement carries new minus old, so period totals add up. A baseline restates as the new value.
* **Each request is safe to repeat.** Sending the same request again returns the recorded correction with `isNew: false`. A different amount for an entry that is already corrected gets `409`.
* **Assumptions can't be corrected here** (`409 assumption_register_only`). They change only through the assumptions register (see [Counterparty sharing](counterparty-sharing.md)), so their citation, grade and journal always apply.

Late data for a locked month never changes that month either. It lands in the next open period with `priorPeriod` set. Reading a locked period returns `restatedSinceLock`: how many later entries stand in for it, and the net amount.

## Related

* [REST API → Initiative Ledger endpoints](../developers/credit-api.md#initiative-ledger-endpoints): the API contract for these routes
* [The Initiative Ledger](overview.md)
* [Cost attribution & quarantine](cost-attribution.md)
* [Vendor actuals](../build/vendor-actuals.md): invoices, footing and per-leg reconciliation
