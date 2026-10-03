---
icon: tags
---

# Cost attribution & quarantine

Routes for placing cost on an initiative, a department, a team and a P&L line, and for working with untagged spend. All routes take a developer credential (`floe_live_…` key or dashboard session).

## Maps

| `kind` | `key` | `value` |
|---|---|---|
| `api_key_team` | An API key | A team |
| `email_domain_department` | A full email address or a bare domain | A department |
| `department_pnl_line` | A department | `cogs`, `rnd`, `sm`, `ga` |
| `api_key_initiative` | A Floe API key | `init_…` |
| `agent_initiative` | An agent | `init_…` |
| `project_initiative` | A project | `init_…` |

When more than one map matches, the key map wins, then the agent map, then the project map. Unmatched spend goes to **Unassigned**.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/dimension-maps \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"kind": "department_pnl_line", "key": "Support", "value": "cogs"}'
```

| Route | Role | Notes |
|---|---|---|
| `GET /v1/developer/dimension-maps` | Any member | Current mappings |
| `POST /v1/developer/dimension-maps` | Owner or admin | Body `{ kind, key, value, effective_from? }`. The response includes `pastEntries`. `409 backdated_edit` for a backdated change to an existing key. |
| `POST /v1/developer/dimension-maps/import` | Owner or admin | CSV of one kind, columns by header name |
| `GET /v1/developer/dimension-maps/unmapped` | Any member | `?kind=api_key_team` or `department_pnl_line`, `&period=` |
| `GET /v1/developer/ledger/remap/preview` | Any member | What a remap would move |
| `POST /v1/developer/ledger/remap` | Owner or admin | Body `{ kind?, key?, from? }` |

In the dashboard, maps are under **Ledger → Reconcile → Maps**.

## Required dimensions

```bash
curl -X PUT https://credit-api.floelabs.xyz/v1/developer/attribution/settings \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"requiredDimensions": ["initiative", "department", "team"]}'
```

`GET` / `PUT /v1/developer/attribution/settings` takes the following fields. `PUT` needs the owner or admin role.

* `requiredDimensions`: a non-empty subset of `initiative`, `department`, `team`.
* `nearestTaskWindows`: source to minutes, 1–1440.
* `unmappedKeyAlertFloorMicro`: integer micro-dollar text.

Spend missing any required dimension is **untagged**.

## Quarantine

`GET /v1/developer/attribution/quarantine?period=2026-08` returns `{ quarantine: { period, scope, requiredDimensions, items, byTeam, totals, proposals, coverage, canRemapPast } }`:

* Each item in `items` has `status`: `quarantined`, `partially_allocated` or `allocated`.
* `coverage` is returned to owners and admins only. It includes `grade`, `gradeMix` and `attributionMix`.

Money is integer micro-dollar text plus a display string. In the dashboard, this is **Ledger → Reconcile → Quarantine**.

Owners and admins see the whole account. A **team owner** sees their team's rows and decides proposals into their team. Anyone else gets `403`.

| Route | Role |
|---|---|
| `GET` / `POST` / `DELETE /v1/developer/attribution/team-owners` | Owner or admin. `POST` body `{ team, accountMemberId }`. |

## Proposals

| Route | Who | Body |
|---|---|---|
| `POST /v1/developer/attribution/inference` | Signed-in owner or admin | `{ "period": "YYYY-MM" }`. Returns proposals for an open month. |
| `GET /v1/developer/attribution/rules/{ruleId}` | Owner, admin, or the team owner | |
| `POST /v1/developer/attribution/rules/{ruleId}/accept` | Signed-in owner, admin, or the team owner | `{ "reason"? }` |
| `POST /v1/developer/attribution/rules/{ruleId}/reject` | Signed-in owner, admin, or the team owner | `{ "reason"? }` |
| `GET /v1/developer/attribution/rules/precision` | Any member | |

An API key gets `403 person_required` on the routes marked "signed-in". A locked month gets `409 period_locked`. `409 proposal_stale` means the key was mapped in the meantime.

## Unmapped-key alerts

| Route | Who | Body |
|---|---|---|
| `GET /v1/developer/attribution/unmapped-keys` | Owner, admin, or the team owner | `?includeDismissed=true` |
| `POST /v1/developer/attribution/unmapped-keys/dismiss` | Signed-in admin, or the team owner | `{ connection, apiKeyRef, reason }` |

Webhook event: [`unmapped_api_key_spend`](../developers/webhooks.md#unmapped_api_key_spend).

## Allocation at close

| Route | Who | Body |
|---|---|---|
| `POST /v1/developer/attribution/allocation/preview` | Owner or admin | `{ "period": "YYYY-MM" }`. Writes nothing (`dryRun: true`). |
| `POST /v1/developer/attribution/allocation/run` | Owner or admin | `{ "period": "YYYY-MM" }`. Writes the allocation entries for the period. |

The response lists `unallocatable` spend. A locked month gets `409 period_locked`. Locking a month also runs the allocation (see [Period close & restatements](period-close.md)).

## Attribution confidence

`exact`, `inferred`, `allocated`, `apportioned`, `apportioned_imputed`, `unattributed`. Totals report it as `attributionMix` (which also has `not_stated`).

## Related

* [REST API → Initiative Ledger endpoints](../developers/credit-api.md#initiative-ledger-endpoints): the API contract for these routes
* [The Initiative Ledger](overview.md)
* [Period close & restatements](period-close.md)
* [Cost per client, campaign & task](../build/attribution.md): tagging calls at the source
