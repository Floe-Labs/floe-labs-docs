---
icon: lock
---

# Period close & restatements

A ledger period is a month (`2026-08`) or an ISO week (`2026-W35`). It is **open** until you lock it, and after that it never changes. This page covers how to check a period, tie it to the invoice, lock it, and correct a figure before and after the lock.

## Is the month complete?

```bash
curl https://credit-api.floelabs.xyz/v1/developer/ledger/periods/2026-08 \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

Every period read includes `completeness`:

* `complete` is `true` when `reasons` is empty.
* `reasons` lists why the period isn't complete.
* `lowerBound` is `true` when the true cost is at least the figure shown.
* `live` is `true` for an open period, where completeness is computed when you read it. A locked period returns the record frozen at lock time.

| Reason | Meaning |
|---|---|
| `unpriced_legs` | Some vendor charges have no price |
| `pending_legs` | Some vendor charges haven't been published by the vendor yet |
| `payer_unknown` | A platform listed a charge without saying what it cost or who paid |
| `gateway_unpriced` | Gateway-log rows carry usage but no price |
| `holds_excluded` | Charges still held at their reserve are left out |
| `hold_booked_at_reserve` | Held charges were booked at their reserve by an owner override |
| `orchestrator_connection_flag` | A platform charge may be counted twice |
| `orchestrator_own_account_match` | A charge was billed both by the platform and to your own account; confirm or dispute it |
| `invoice_pending` | A vendor's month has no invoice tie-out yet |
| `tie_out_unexplained` | A vendor's tie-out is over tolerance and hasn't been accepted |
| `pre_backfill` | Rows from before the ledger backfill haven't been written yet |
| `vendor_residuals_missing` | Vendor credits, tax and other adjustments aren't on the ledger yet |
| `unallocatable_spend` | Untagged spend that couldn't be allocated |
| `manual_override_conflict` | A manual correction no longer matches its source |
| `locked_before_completeness` | The period was locked before completeness was recorded |
| `completeness_not_computed` | Completeness couldn't be computed |

`GET /v1/developer/ledger/periods` lists the periods a close has touched, newest first. A period that isn't listed is open. Any account member can read periods.

## Tying the month to the invoice

The **true-up** reconciles the gateway's estimates for one vendor and month to what the vendor billed. It itemizes the difference by cause and posts it to the ledger.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/ledger/true-up \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"vendor": "anthropic", "period": "2026-08"}'
```

* `GET /v1/developer/ledger/tie-outs?period=2026-08` returns each vendor's tie-out with its causes, status and grade.
* A tie-out whose unexplained remainder is more than 0.5% of the invoice reads `tie_out_unexplained`. The account owner can accept it with a reason: `POST /v1/developer/ledger/tie-outs/{id}/override` `{ "reason" }`.
* `GET` / `PUT /v1/developer/ledger/close-settings` sets `invoiceWindowBusinessDays` (how long you wait for invoices, default 5) and `salesTaxInAiCost` (default `false`).

## Locking a period

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/ledger/periods/2026-08/lock \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

A period can be locked once it has fully ended (UTC). Locking needs the owner or admin role. Locking a month does four things:

1. It writes every priced cost of the month to the ledger.
2. It allocates leftover untagged spend (see [Cost attribution & quarantine](cost-attribution.md#allocation-at-close)).
3. It snapshots the period's completeness and coverage. Read the coverage snapshot with `GET /v1/developer/ledger/periods/2026-08/coverage`.
4. It marks every entry in the period `locked`.

Locking a period that is already locked changes nothing and returns `alreadyLocked: true`.

### When a lock is refused

| `409` error | What to do |
|---|---|
| `period_not_ended` | Wait until the period has ended |
| `holds_pending` | Lock after the held charges settle, or override |
| `period_incomplete` | Resolve what `completeness` lists, or override |
| `driver_allocation_over_threshold` | Review `driverAllocation`, or override |
| `normalizer_failed` | Fix the rows listed in `failedRefs`, then retry |
| `normalizer_busy` | Retry shortly |
| `override_not_required` | Lock without an override |

**Override (account owner only):**

* `overrideReason`: 10–500 characters.
* `overrideGates`: one or more of `holds_pending`, `incomplete`, `payer_confirmed` or `driver_allocation`. Each gate clears only its own condition.
* `requiredOverrideGates`: listed on every open period, and gives the gates a lock needs now.
* `lockOverride`: set on the locked period, and records the reason, who gave it and the gates.

The allocation threshold is a setting: `GET` / `PUT /v1/developer/close/allocation-threshold`.

## Correcting a figure

How you correct an entry depends on whether its period is open or locked.

| | Open period: **supersede** | Locked period: **restate** |
|---|---|---|
| Route | `POST /v1/developer/ledger/entries/{id}/supersede` | `POST /v1/developer/ledger/entries/{id}/restate` |
| Body | `{ "amount", "reason", "estimate"? }` | `{ "newAmount", "reason", "estimate"? }` (reason required) |
| What is written | A replacement entry in the same period. The old entry is marked superseded. | A new entry in the **next open period**, with `restates` set to the locked entry and `priorPeriod` set to its period. The locked entry stays exactly as it was. |
| Role | Member or above | Owner or admin |
| Wrong period | `409 period_locked`: use restate | `409 period_open`: use supersede |

Both routes work the same way:

* **A hand-typed correction is grade C at most**, or D if you send `estimate: true`. It is never graded higher than the entry it replaces. A correction reaches grade A only through a footed vendor invoice ([Vendor actuals](../build/vendor-actuals.md)).
* **Cost and value restate as a difference** (new minus old). A baseline restates as the new value.
* **Each request is safe to repeat.** Sending the same request again returns the recorded correction with `isNew: false`. Sending a different amount for an entry that is already corrected gets `409`.
* **Assumptions can't be corrected here** (`409 assumption_register_only`). Use the assumptions register instead (see [Counterparty sharing](counterparty-sharing.md)).

Late data for a locked month lands in the next open period with `priorPeriod` set. Reading a locked period returns `restatedSinceLock`: the number of later entries that stand in for it, and their net amount.

## Related

* [REST API → Initiative Ledger endpoints](../developers/credit-api.md#initiative-ledger-endpoints): the API contract for these routes
* [The Initiative Ledger](overview.md)
* [Cost attribution & quarantine](cost-attribution.md)
* [Vendor actuals](../build/vendor-actuals.md): invoices, footing and per-leg reconciliation
