---
icon: book
---

# The Initiative Ledger

The Initiative Ledger is one record of what your AI work costs and what it is worth. Every record is an **initiative**: an AI product, an internal tool, a vendor purchase or a deal. An initiative holds **entries**. Each entry is one amount for one period, and it records where the amount came from.

The ledger is built for the head of finance who has to defend an AI line item. Every number on it can answer three questions:

* **Where did it come from?** Every entry names its source system and reference.
* **How sure is it?** Every entry carries a confidence grade from A to D.
* **How was it worked out?** A computed entry names the formula that produced it and the entries it used.

Periods lock at month end. After a lock, nothing in that period changes. A late correction is written into the next open period as a **restatement** and keeps a link to the entry it corrects.

## One ledger, two doors

Teams usually start from one side and fill in the other later. Both sides write to the same ledger.

| | Starting from cost | Starting from value |
|---|---|---|
| **Who** | A finance team that needs to know what its AI spend is, and who it belongs to | An AI vendor that has to prove what its product is worth to a buyer's finance team |
| **First entries** | Cost: gateway traffic, your own LLM gateway's logs, and vendor invoices | Assumptions: the named inputs behind the business case, each with a source and a grade |
| **First jobs** | Tie the gateway's estimates to the invoice, move untagged spend out of quarantine, allocate what is left, lock the month | Share the case with the buyer, agree on who owns each input, and journal every change |
| **Read next** | [Cost attribution & quarantine](cost-attribution.md), [Period close & restatements](period-close.md) | [Counterparty sharing](counterparty-sharing.md) |

## Entries

An entry never changes once it is written. If an amount turns out to be wrong, a new entry replaces it (see [Period close & restatements](period-close.md)).

| Field | What it holds |
|---|---|
| `type` | `cost`, `value`, `baseline`, `forecast` or `assumption` |
| `origin` | `ingested` (read from a source system), `computed` (produced by a formula) or `declared` (entered by a person) |
| `period` | A month (`2026-08`) or an ISO week (`2026-W35`) |
| `amount` / `unit` | The amount as integer text in the unit's smallest denomination. For money that is millionths of a dollar. The ledger never stores an amount as a float. |
| `source` | `{system, extract_at, sample_n, ref}`: the system it came from, when it was read, the sample size where one applies, and a reference you can look up |
| `confidenceGrade` | `A`, `B`, `C` or `D` (see below). `isEstimate` is `true` for grade D. |
| `lineage` | `{formula_id, input_entry_ids}` for a computed entry: the versioned formula (`name@version`) and every input it read |
| `dimensions` | The tags that place the amount, such as department, team, P&L line and API key |
| `locked` | `true` once the entry's period is locked |
| `restates` / `priorPeriod` | For a restatement: the locked entry it corrects, and the period the amount belongs to |

## Confidence grades

A grade says how well-evidenced an amount is.

| Grade | Meaning | Examples |
|---|---|---|
| **A** | Reconciled to more than one source | A vendor charge matched to the vendor's invoice |
| **B** | From one system of record. B means the source is authoritative but there is only one; it doesn't mean the number is doubtful. | Floe-settled charges; a vendor cost report with no invoice yet |
| **C** | Provided by a person, with a named source | A hand-entered correction; an assumption value that cites its source |
| **D** | An estimate: a benchmark, a list-price figure, or a value someone asserted without a source | A gateway's own list-price cost; an assumption with no citation |

On totals:

* **A total takes the lowest grade in it.**
* **The mix is shown beside the grade**, for example "A $4,210 · B $812 · D $37".

Pending costs are not counted, and they mark the period incomplete.

## Initiatives

Each initiative has a public id (`init_…`), a name and a status. Cost that can't be placed on an initiative goes to **Unassigned**, so it still counts toward the total.

An initiative's `membershipMode` controls who can change it:

* `account`: any member of your Floe account with the member role or above can.
* `members`: only the initiative's own owners and contributors can.

Create and read initiatives with a developer credential: a `floe_live_…` key or a dashboard session.

```bash
# Create an initiative
curl -X POST https://credit-api.floelabs.xyz/v1/developer/initiatives \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Support assistant"}'

# List them (newest first; ?limit up to 200)
curl https://credit-api.floelabs.xyz/v1/developer/initiatives \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

A create returns `201` with `{ "initiative": { "id", "name", "status", "membershipMode", "createdAt" } }`. If you create the initiative while signed in to the dashboard, you become its owner. If you create it with an API key, the initiative is in `account` mode unless the body names an `ownerMemberId`.

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

The list call takes `initiative` (required), `period`, `type` and `limit` (1–500, default 100). It returns `{ entries, hasMore }`, newest period first, and leaves out entries that a correction has replaced. Pass `period` to also get `periodCompleteness`. It tells you whether the period's figures are complete or a lower bound, and why, so you never read an open month as final.

The single-entry call returns the entry and the `inputs` its lineage names, one level deep. It also returns `supersededBy` / `restatedBy` if a later entry replaced it.

Any member of the account can read entries. An initiative or entry that belongs to another account returns `404`, the same as one that doesn't exist.

## Related

* [REST API → Initiative Ledger endpoints](../developers/credit-api.md#initiative-ledger-endpoints): the API contract for these routes
* [Cost attribution & quarantine](cost-attribution.md)
* [Period close & restatements](period-close.md)
* [Counterparty sharing](counterparty-sharing.md)
* [Vendor actuals](../build/vendor-actuals.md): how vendor charges are reconciled before they reach the ledger
* [API keys](../developers/api-keys.md): developer keys vs agent keys
