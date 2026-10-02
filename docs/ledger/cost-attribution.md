---
icon: tags
---

# Cost attribution & quarantine

Every dollar of AI cost on the [ledger](overview.md) should land on an initiative, a department and a P&L line. Most of it gets there from tags and maps you set up once. The rest goes into **quarantine**. Quarantine is a holding area for untagged spend where you can see what is missing and accept or reject a proposed owner. By the time the month locks, every untagged dollar has either been attributed or allocated, or is listed as one that couldn't be allocated.

This page covers the maps, the quarantine, the inference rules that propose owners, and the close-time allocation of what is left.

## Maps: from a key to a P&L line

A **dimension map** turns something your systems already know into a finance dimension:

| `kind` | Maps | To |
|---|---|---|
| `api_key_team` | An API key | A team |
| `email_domain_department` | A full email address or a bare domain | A department |
| `department_pnl_line` | A department | A P&L line: `cogs`, `rnd`, `sm` or `ga` |
| `api_key_initiative` | A Floe API key | An initiative |
| `agent_initiative` | An agent | An initiative |
| `project_initiative` | A project | An initiative |

A cost entry gets its initiative from the first map that matches: the API key, then the agent, then the project. If none matches, it goes to **Unassigned**.

Maps are versioned and effective-dated, and they are never edited in place. Declaring a new value for a key adds a new version and closes the old one. Two rules keep past months stable:

* **Saving a map moves no cost that is already on the ledger.** Entries keep the mapping that was in effect when they were written. The response's `pastEntries` tells you how much an explicit remap would move. When you want to move it, run the remap (`POST /v1/developer/ledger/remap`): it corrects entries in open periods, and adds restatements to the next open period for locked ones.
* **An edit applies from now.** A key's *first* mapping can be backdated so a first load covers months already ingested. A change to an existing mapping can't be backdated (`409 backdated_edit`).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/dimension-maps \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"kind": "department_pnl_line", "key": "Support", "value": "cogs"}'
```

To load many mappings at once, import a CSV of one kind with `POST /v1/developer/dimension-maps/import`. Columns are matched by header name, not position. An unrecognised header stops the import and is listed in the error. The import is all-or-nothing, and importing the same file again writes nothing.

To find gaps, `GET /v1/developer/dimension-maps/unmapped?kind=api_key_team&period=2026-08` lists the API keys with spend and no team, largest first. With `kind=department_pnl_line` it lists departments with no P&L line. Declaring maps and importing them needs the owner or admin role. In the dashboard, maps are under **Ledger → Reconcile → Maps**.

## What counts as untagged

Spend is **untagged** when it is missing any of your account's **required dimensions**. The default is initiative (where Unassigned counts as missing) and department. You can change the list to any non-empty set of `initiative`, `department` and `team`:

```bash
curl -X PUT https://credit-api.floelabs.xyz/v1/developer/attribution/settings \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"requiredDimensions": ["initiative", "department", "team"]}'
```

## The quarantine

`GET /v1/developer/attribution/quarantine?period=2026-08` shows the month's untagged spend, grouped by team. Each row shows what produced the spend (source, API key, person, model, the vendor that billed it), which dimensions are missing, and any open proposal that would fix it. In the dashboard, this is **Ledger → Reconcile → Quarantine**.

For account owners and admins, the response also includes the **coverage report**: the share of the month's cost that is tagged, rule-attributed, driver-allocated, quarantined, or not stated, in basis points that add up to 100%. The invoice true-up is shown as its own signed line, not as a share. The report also gives the month's cost with its grade and grade mix, overall and per initiative. Money in the response is integer micro-dollar text plus a display string, formatted by the server.

Owners and admins see the whole account. You can make an account member a **team owner** (`POST /v1/developer/attribution/team-owners`). A team owner sees their team's rows, plus untagged rows whose proposal would move dollars into their team, and can decide those proposals. Anyone else gets `403`.

## Inference rules

Floe proposes an owner for untagged spend with three rules, tried in this order:

1. **API key → team.** The people who spent on an unmapped key this month all have their *other* keys mapped to one team. Floe proposes mapping the key to that team.
2. **Email → department.** The other people who spent on this person's keys all belong to one department. Floe proposes mapping the person's email to that department.
3. **Model and time window → nearest tagged task.** For a row the first two rules didn't cover, Floe looks for fully tagged rows from the same source, API key, person and model within the window either side (15 minutes by default, set per source in the settings). If they all agree on the missing dimensions, Floe proposes them.

A rule proposes something only when every piece of evidence agrees. It uses only tags the source supplied, never ones an earlier rule proposed. A person always decides:

```bash
# Run the rules for an open month (a signed-in admin or owner)
POST /v1/developer/attribution/inference   {"period": "2026-08"}

# Accept or reject a proposal (a signed-in person, with an optional reason)
POST /v1/developer/attribution/rules/{ruleId}/accept   {"reason": "…"}
POST /v1/developer/attribution/rules/{ruleId}/reject   {"reason": "…"}
```

* **Accepting a map proposal** adds a map version, effective from the start of the current open month. It applies to that month's quarantined and Unassigned spend for the key, and to everything after. Earlier months move only if you also run the remap.
* **Accepting a nearest-task proposal** corrects those specific rows in the open month.
* **Rejecting** leaves the dollars in quarantine, and the same proposal is not made again.
* **Grades never change** when attribution changes. How sure Floe is of the *owner* is tracked separately from how sure it is of the *amount* (see below).

Running the rules and deciding proposals needs a signed-in person. An API key gets `403 person_required`. `GET /v1/developer/attribution/rules/precision` shows, for each rule, how many of its proposals were accepted.

### Unmapped-key alerts

When an API key from your own LLM gateway's logs has no team or initiative mapping, Floe alerts once its spend reaches a floor. The default floor is $5, and you set it with `unmappedKeyAlertFloorMicro` in the settings. `GET /v1/developer/attribution/unmapped-keys` lists these keys with their spend, the dates they were first and last seen, and any open proposal. A personal or sandbox key can be dismissed with a reason (`POST /v1/developer/attribution/unmapped-keys/dismiss`). Dismissing it stops the alerts, but its spend stays Unassigned and is allocated at close.

## Allocation at close

Whatever is still untagged when the month closes is spread by a declared driver: **each slice's share of the attributed spend on the same bill**. Floe uses the narrowest slice it can. It keeps the initiative, department and team where it knows them, and widens only when that slice has no attributed spend (dropping team, then department, then initiative, then using the whole bill). It fills in only the missing dimensions. Headcount is never used as a driver.

```bash
# What allocation would write (nothing is written)
POST /v1/developer/attribution/allocation/preview   {"period": "2026-08"}

# Write it
POST /v1/developer/attribution/allocation/run       {"period": "2026-08"}
```

Each move is written as a pair of entries, −x from the source and +x to the target, so the month's total never changes. Both entries keep the source's grade and record the driver and weights. Running it again on an unchanged month writes nothing. Locking a month runs the allocation automatically (see [Period close & restatements](period-close.md)).

Dollars with no attributed spend anywhere on their bill can't be allocated. They stay in quarantine, are listed under `unallocatable`, and don't block the lock. Allocated dollars also stay listed in the quarantine with their status (`quarantined`, `partially_allocated` or `allocated`), so you can still see that they were moved.

## Two kinds of confidence

A cost entry carries two separate measures, and neither affects the other:

* **The grade (A–D)** says how sure the *amount* is. See [confidence grades](overview.md#confidence-grades).
* **Attribution confidence** says how sure the *owner* is:

| Value | Meaning |
|---|---|
| `exact` | The source named the owner |
| `inferred` | A rule proposed the owner and a person accepted it |
| `allocated` | Moved at close by the declared driver |
| `apportioned` | Part of an invoice true-up, spread by the gateway's estimated costs |
| `apportioned_imputed` | Part of an invoice true-up, spread by estimated weights that were themselves priced from Floe's catalog |
| `unattributed` | A true-up remainder with nothing to spread it by, parked in Unassigned until close allocates it |

Graded totals include an `attributionMix` beside the `gradeMix`, so a figure shows how much of it is exact and how much was inferred or allocated.

## Related

* [The Initiative Ledger](overview.md)
* [Period close & restatements](period-close.md)
* [Cost per client, campaign & task](../build/attribution.md): tagging calls at the source
* [Vendor actuals](../build/vendor-actuals.md)
