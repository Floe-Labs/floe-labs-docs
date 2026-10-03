---
icon: lock
---

# Period close & restatements

Routes for reading, reconciling, locking and correcting ledger periods. A period key is `YYYY-MM` or `YYYY-Www`. All routes take a developer credential (`floe_live_…` key or dashboard session).

## Periods

```bash
curl https://credit-api.floelabs.xyz/v1/developer/ledger/periods/2026-08 \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

| Route | Role | Returns |
|---|---|---|
| `GET /v1/developer/ledger/periods` | Any member | `{ periods, structuralGaps }`, `?limit` 1–120 |
| `GET /v1/developer/ledger/periods/{key}` | Any member | `{ period, structuralGaps }` |
| `GET /v1/developer/ledger/periods/{key}/coverage` | Any member | `{ snapshot }` for a locked month, or `404 coverage_snapshot_not_found` |

A period has `key`, `cadence` (`month`, `week`), `status` (`open`, `locked`), `lockedAt`, `lockedBy`, `lockOverride`, `completeness`, `requiredOverrideGates` and `restatedSinceLock`.

`completeness` has `complete`, `lowerBound`, `reasons`, `live` and `ruleVersion`. `reasons` values:

`unpriced_legs`, `pending_legs`, `holds_excluded`, `pre_backfill`, `locked_before_completeness`, `payer_unknown`, `gateway_unpriced`, `hold_booked_at_reserve`, `orchestrator_connection_flag`, `vendor_residuals_missing`, `completeness_not_computed`, `manual_override_conflict`, `orchestrator_own_account_match`, `invoice_pending`, `tie_out_unexplained`, `unallocatable_spend`.

## Invoice tie-out

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/ledger/true-up \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"vendor": "anthropic", "period": "2026-08"}'
```

| Route | Role | Body / query |
|---|---|---|
| `POST /v1/developer/ledger/true-up` | Owner or admin | `{ vendor, period }` |
| `GET /v1/developer/ledger/tie-outs` | Any member | `?period=YYYY-MM&vendor=` |
| `POST /v1/developer/ledger/tie-outs/{id}/override` | Owner | `{ reason }` (10–500 characters) |
| `GET /v1/developer/ledger/close-settings` | Any member | |
| `PUT /v1/developer/ledger/close-settings` | Owner or admin | `{ invoiceWindowBusinessDays?, salesTaxInAiCost? }` |

## Locking a period

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/ledger/periods/2026-08/lock \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

`POST /v1/developer/ledger/periods/{key}/lock` needs the owner or admin role. Its body is optional: `{ overrideReason?, overrideGates? }`, and `overrideReason` can be sent only by the owner. It returns `{ period, alreadyLocked, entriesLocked, normalizer, allocation, coverage, holdsOverridden }`.

| `409` error | Cleared by `overrideGates` |
|---|---|
| `period_not_ended` | None |
| `holds_pending` | `holds_pending` |
| `period_incomplete` | `incomplete`. If the period has `orchestrator_own_account_match`, `payer_confirmed` is also needed. |
| `driver_allocation_over_threshold` | `driver_allocation` |
| `normalizer_failed` | None (see `failedRefs`) |
| `normalizer_busy` | None (retry) |
| `override_not_required` | None (lock without an override) |

The override fields:

* `overrideReason`: 10–500 characters.
* `overrideGates`: one or more of `holds_pending`, `incomplete`, `payer_confirmed`, `driver_allocation`.
* `requiredOverrideGates`: listed on an open period.
* `missingOverrideGates`: listed on a `409`.
* `lockOverride`: set on the locked period.

Threshold settings: `GET` / `PUT /v1/developer/close/allocation-threshold` and `GET /v1/developer/close/allocation-threshold/history`, for signed-in owners and admins.

## Correcting a figure

| | Open period | Locked period |
|---|---|---|
| Route | `POST /v1/developer/ledger/entries/{id}/supersede` | `POST /v1/developer/ledger/entries/{id}/restate` |
| Body | `{ "amount", "reason", "estimate"? }` | `{ "newAmount", "reason", "estimate"? }` |
| Role | Member or above | Owner or admin |
| Writes | A replacement entry in the same period (`supersedesEntryId`) | An entry in the next open period (`restates`, `priorPeriod`) |
| Wrong period | `409 period_locked` | `409 period_open` |

Both return `201` with the correction, or `200` with `isNew: false` on a repeat. Other `409` codes: `no_change`, `already_superseded`, `already_restated`, `supersede_conflict`, `entry_superseded`, `assumption_register_only`, `held_entry`, `override_conflict`, `normalizer_failed`.

## Related

* [REST API → Initiative Ledger endpoints](../developers/credit-api.md#initiative-ledger-endpoints): the API contract for these routes
* [The Initiative Ledger](overview.md)
* [Cost attribution & quarantine](cost-attribution.md)
* [Vendor actuals](../build/vendor-actuals.md)
