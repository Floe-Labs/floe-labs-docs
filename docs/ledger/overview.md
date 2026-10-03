---
icon: book
---

# The Initiative Ledger

The Initiative Ledger is one record of what your AI work costs and what it is worth. Every record is an **initiative**: an AI product, an internal tool, a vendor purchase or a deal. An initiative holds **entries**, one amount per period, each with its source, a confidence grade and, when computed, its formula and inputs.

## One ledger, two doors

| | Starting from cost | Starting from value |
|---|---|---|
| **Who** | A finance team accounting for its AI spend | An AI vendor sharing a business case with a buyer's finance team |
| **Read next** | [Cost attribution & quarantine](cost-attribution.md), [Period close & restatements](period-close.md) | [Counterparty sharing](counterparty-sharing.md) |

## Methodology

Every entry carries a confidence grade:

* **A**: reconciled to more than one source.
* **B**: from one system of record.
* **C**: entered by a person, with a named source.
* **D**: an estimate.

A total takes the lowest grade in it and shows its grade mix. Pending costs are not counted, and they mark the period incomplete. A locked period never changes. Corrections are journaled, and a correction never carries a higher grade than the entry it replaces.

## Entries

| Field | Values |
|---|---|
| `id` | Entry id |
| `initiativeId` | `init_…` |
| `type` | `cost`, `value`, `baseline`, `forecast`, `assumption` |
| `origin` | `ingested`, `computed`, `declared` |
| `period` | `YYYY-MM` or `YYYY-Www` |
| `metric` | The metric name |
| `amount` / `unit` | Integer text in the unit's smallest denomination (money: millionths of a dollar) |
| `source` | `{system, extract_at, sample_n, ref}` |
| `confidenceGrade` | `A`, `B`, `C`, `D` |
| `isEstimate` | `true` for grade D |
| `lineage` | `{formula_id, input_entry_ids}` for a computed entry |
| `dimensions` | For example department, team, P&L line, API key |
| `locked` | `true` once the period is locked |
| `superseded` / `supersededAt` / `supersedesEntryId` | Open-period corrections |
| `restates` / `priorPeriod` / `restatement` | Locked-period corrections |
| `reason`, `createdBy`, `createdAt` | Who wrote it, when, and why |

## Initiatives

| Field | Values |
|---|---|
| `id` | `init_…` |
| `name` | 1–200 characters |
| `status` | `draft`, `active`, `closed` |
| `membershipMode` | `account` (any account member with the member role or above may write), `members` (only the initiative's owners and contributors) |
| `createdAt` | Timestamp |

Spend that matches no initiative goes to **Unassigned**.

```bash
# Create an initiative (member role or above)
curl -X POST https://credit-api.floelabs.xyz/v1/developer/initiatives \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Support assistant"}'

# List them (newest first; ?limit 1–200)
curl https://credit-api.floelabs.xyz/v1/developer/initiatives \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

`POST` returns `201 { "initiative": { … } }`. The body also accepts `ownerMemberId`, for API-key calls only. Errors: `400 invalid_request`, `422 not_account_member` / `member_is_viewer`. `GET /v1/developer/initiatives/{id}` returns one initiative, or `404 initiative_not_found`.

## Reading entries

```bash
INITIATIVE_ID="init_…"   # from GET /v1/developer/initiatives
ENTRY_ID="…"             # an entry's `id` from the list below

# An initiative's current entries for one month
curl "https://credit-api.floelabs.xyz/v1/developer/ledger/entries?initiative=${INITIATIVE_ID}&period=2026-08" \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"

# One entry, with the entries its lineage names
curl "https://credit-api.floelabs.xyz/v1/developer/ledger/entries/${ENTRY_ID}" \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

| Route | Parameters | Returns |
|---|---|---|
| `GET /v1/developer/ledger/entries` | `initiative` (required), `period`, `type`, `limit` (1–500, default 100) | `{ entries, hasMore, periodCompleteness? }` (`periodCompleteness` when `period` is sent) |
| `GET /v1/developer/ledger/entries/{id}` | | `{ entry, inputs, unresolvedInputIds, supersededBy, restatedBy, periodCompleteness }` |

Any account member may read. Errors: `400 invalid_request`, `404 initiative_not_found` / `entry_not_found`. Another account's initiative or entry is `404`.

## Related

* [REST API → Initiative Ledger endpoints](../developers/credit-api.md#initiative-ledger-endpoints): the API contract for these routes
* [Cost attribution & quarantine](cost-attribution.md)
* [Period close & restatements](period-close.md)
* [Counterparty sharing](counterparty-sharing.md)
* [API keys](../developers/api-keys.md): developer keys vs agent keys
