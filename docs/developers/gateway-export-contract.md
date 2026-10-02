---
icon: file-import
---

# Gateway export contract

If your company runs its **own LLM gateway** (a proxy you built, or one Floe has no template for), this page is the file format Floe imports its usage log in. Write your export to this contract, check it with the validator, and import it: every request becomes a cost row on your ledger, attributed to the person, key, client and campaign the row names.

The contract has two forms with the **same field names**:

| Form | Template id | Shape |
|---|---|---|
| NDJSON (the reference) | `floe-canonical-ndjson@3` | One JSON object per line |
| CSV | `floe-canonical-csv@1` | A header row, then one request per row. Every value is text; an empty cell is absent |

Both forms are checked against the same rules and the same [JSON Schema](#json-schema). Using LiteLLM, Portkey, Helicone or OpenRouter? Floe has built-in templates for their exports, and the [validator](#validate-before-you-import) tells you which one matches your file.

> **What the cost column means.** `cost` is the dollar figure **as your gateway computed it, not as the vendor billed it**. Floe grades every gateway row **D** (an estimate), whatever you call the column. The vendor's bill is the money: once the vendor's invoice (or its cost report) for the month is in, Floe trues the gateway's figures up against it and books the difference, so the month's total ties to what the vendor charged. A total built from gateway rows shows its lowest grade (D) next to its grade mix.

## Fields

Required fields must be present on every row. Each field can also be written under a **synonym**, so most gateway logs need no renaming.

| Field | Required | Type | Synonyms | Meaning |
|---|---|---|---|---|
| `id` | Yes, when the file carries ids ([below](#ids)) | text, ≤ 512 | — | The gateway's request id. Floe dedupes on it |
| `occurred_at` | Yes | instant | `timestamp` | When the request happened |
| `model` | Yes | text, ≤ 256 | — | The model as the gateway names it. `provider/model` also names the provider |
| `provider` | When `model` doesn't carry it | text, ≤ 128 | — | Who served the request (stored lowercased) |
| `cost` | Yes | decimal | `estimated_cost` | USD as the gateway computed it, not as billed. Graded D |
| `person` | No | text, ≤ 512 | `user` | Who made the request: an email or an id. Stored only as a pseudonymous person id |
| `api_key` | No | text, ≤ 512 | — | The key's alias or hash. Never the key itself |
| `input_tokens` | No | integer | `prompt_tokens` | Input tokens |
| `output_tokens` | No | integer | `completion_tokens` | Output tokens |
| `task` | No | text, ≤ 256 | — | Attribution |
| `campaign` | No | text, ≤ 256 | — | Attribution |
| `customer` | No | text, ≤ 256 | — | Attribution |
| `billed_by` | No | text, ≤ 128 | — | Who bills this traffic, when it isn't the provider (for example `openrouter`). Defaults to the provider |
| `cache_hit` | No | boolean | — | The gateway answered from its cache: a true $0. Absent means false |

`task`, `campaign` and `customer` are part of a row's attribution only when the connection's grain names them (set when you [create the connection](#import-it)). Prompt and response content is never part of the contract and never stored.

### Types

| Type | Rule | Accepted | Refused |
|---|---|---|---|
| decimal | A **string** of digits with an optional fraction. No sign, no exponent, never a JSON number | `"0.004215"`, `"0"` | `0.004215`, `"-0.01"`, `"4e-3"`, `"$0.01"` |
| instant | ISO 8601 with `T`, seconds, and `Z` or a `±HH:MM` offset, on a real calendar day. Fractional seconds are optional | `"2026-09-30T14:02:11Z"`, `"2026-09-30T07:02:15-07:00"`, `"2026-09-30T14:03:40.250Z"` | `"2026-09-30 14:02:11"`, `"2026-09-30T14:02Z"`, `"2026-02-30T00:00:00Z"`, no offset |
| integer | Digits, as a JSON integer or a string, at most 9223372036854775807 | `1840`, `"1840"` | `-5`, `1.5`, `"1,840"` |
| boolean | JSON `true` / `false`, or the text `true` / `false` in any case | `true`, `"TRUE"` | `1`, `"yes"` |
| text | A string, trimmed | `"acme"` | an object or array |

In both forms a value is **absent** when its key is missing, JSON `null`, or blank text. Text is trimmed before any check. In CSV every cell is text, so `1840` and `true` are read by the rules above.

Why cost is a string: a JSON number goes through floating point in most tools that write and read it, and `0.1 + 0.2` stops being `0.3`. A decimal string reaches the ledger exactly as your gateway wrote it.

### Synonyms

A row may carry a field under its name or a synonym (`user` for `person`, `estimated_cost` for `cost`, `prompt_tokens` for `input_tokens`, `completion_tokens` for `output_tokens`, `timestamp` for `occurred_at`). If a row carries **both** and they disagree, the row is refused with `conflicting_<field>`: Floe never picks one for you. Both with the same value is fine.

### Provider from the model

`provider` may be left out when `model` reads `provider/model`. Floe splits at the **first** `/`: `openai/gpt-4o` becomes provider `openai`, model `gpt-4o`. A row that names its provider keeps its model exactly as written (so `provider: openrouter, model: anthropic/claude-sonnet-4-6` keeps the slash). A row with neither a `provider` nor a `provider/model` is refused with `missing_provider`.

### Ids

A file either **carries ids** or **doesn't**, as a whole:

- **Carries ids:** the CSV has an `id` column, or the NDJSON file's **first** row has an `id` key. Then every row needs one (`missing_id` otherwise). Floe dedupes on it: importing the same file twice inserts nothing the second time.
- **No ids:** Floe derives an id for each row. Without the gateway's own id Floe can't tell a resent file from new traffic, so the import must **declare the time window** the file covers, and importing a window that overlaps one already imported needs `mode=replace`, which supersedes the earlier import. The validator says `ids derived; window required`. A row that does carry an `id` in such a file is refused (`unexpected_id`).

One connection holds one kind: a connection that has imported files with ids refuses a file without, and the reverse (`409 id_mode_mismatch`).

### Unknown fields

Any key or header that isn't a field or a synonym stops the import (`422 unmapped_fields`, with the names listed). Drop the column from your export, or ignore it in the connection's profile.

## JSON Schema

The contract is served as a versioned JSON Schema (draft 2020-12), public and with no key, generated from the same definition the importer reads with:

```bash
curl -s https://credit-api.floelabs.xyz/v1/ext-gateway/contract/3
```

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://credit-api.floelabs.xyz/v1/ext-gateway/contract/3",
  "title": "Floe canonical gateway export, contract v3",
  "type": "object",
  "properties": {
    "cost": {
      "description": "USD as the gateway computed it, not as billed: a decimal string. Graded D.",
      "type": ["string"],
      "pattern": "^[0-9]+(\\.[0-9]+)?$",
      "maxLength": 64
    },
    "…": "one entry per field and per synonym"
  },
  "additionalProperties": false,
  "x-floe-contract-version": 3,
  "x-floe-templates": { "ndjson": "floe-canonical-ndjson@3", "csv": "floe-canonical-csv@1" },
  "x-floe-rules": ["…"]
}
```

One schema covers both forms: an NDJSON line is the object; a CSV row is the object of its header → cell text, with empty cells left out. What a schema can't express (trimming, synonyms that disagree, ids per file, a real calendar day) is written out in `x-floe-rules` and enforced by the importer. An unknown version answers `404 unknown_contract_version` with the list of `versions`.

## Validate before you import

The validator is a **dry run**: it reads your file exactly as an import would and **stores nothing**. Its report holds header names, counts, reason codes and row numbers, and **never a row's contents**, so a report is safe to paste into a ticket even when the file holds email addresses.

A file is **valid** when every header is mapped, no row is refused, skipped or repeated, and Floe's row count equals the export's. That last check matters for the close: your totals can only tie to the vendor's bill if every row made it in.

### From the CLI

```bash
floe gateway validate <file> [--online] [--template <id>] [--connection <slug>]
```

| Flag | Does |
|---|---|
| *(default)* | **Offline.** The file never leaves your machine. The CLI bundles the API's own validator and schema, so it gives the same answer as the API |
| `--online` | Validates against your account (`POST /v1/developer/ext-gateway/validate`, files up to 10 MiB). Needs your developer key |
| `--template <id>` | Read with this template instead of the best match |
| `--connection <slug>` | Read with an existing connection's profile (needs `--online`) |

Offline mode prints two caveats, because two checks need your account:

1. **Ids already imported** on your account aren't checked. A row whose id one of your connections already holds would be skipped by an import into that connection, and counted twice by an import into another one.
2. **People** aren't resolved against your account: the online report says how many distinct people the file names and how many Floe already knows.

Run `--online` once before the first import into a connection to see both. Exit code `1` when the file isn't valid, so the command can gate a script. `--json` prints the report as JSON.

### From the API

```
POST /v1/developer/ext-gateway/validate?template=<id> | ?connection=<slug>
```

The body is the file (`text/csv` or `application/x-ndjson`, up to 10 MiB; larger files: validate offline with the CLI). Send `template` or `connection`, not both; with neither, Floe reads with the best-matching built-in template. It needs the member role or above, with a developer key (`floe_live_…`) or a dashboard session.

The response (`200`, even for a file-level problem such as malformed CSV, which comes back in `fileError`):

| Field | Means |
|---|---|
| `valid` | The file would import in full |
| `profile` | The template or connection profile it was read with, and why (`connection`, `template`, `best_match`) |
| `exportRowCount` / `floeRowCount` / `rowCountMatches` | Rows in the export, rows Floe would import (a repeated id counts once), and whether they're equal |
| `ids` | `present` or `derived` |
| `headers` | `mapped`, `ignored`, `unmapped`, `missingRequired` (when a required field is missing, rows aren't checked and `refusedRows` is `null`) |
| `refusedRows` | Count, count per reason, and the first 100 rows as `{row, reason, field}` (`truncated` when there are more) |
| `skippedRows` | Rows another template drops on purpose (traffic that already went through Floe's own gateway, so it isn't counted twice). Never happens with the canonical contract |
| `duplicateIds.inFile` | Rows repeating an earlier row's id |
| `duplicateIds.alreadyImported` | Rows whose id your account already holds, with a count per connection (online only) |
| `people` | `distinct` people in the file and how many are `known` (online only) |
| `bestTemplate` / `templates` | Every built-in template of the file's format, best first, with the share of your headers it reads (`score`) and what it would be missing |
| `notes` | For example `ids derived; window required`, or `Floe would import 1 of the export's 6 rows` |

Row numbers count data rows from 1: in CSV the header line doesn't count.

Refusal reasons you'll see: `missing_<field>`, `invalid_<field>` (wrong type), `conflicting_<field>` (synonyms disagree), `too_long`, `missing_provider`, `unexpected_id`.

## Worked example

Three requests from September, in both forms. Row 1 names its provider; row 2 takes it from the model and uses three synonyms (`user`, `prompt_tokens`, `completion_tokens`) with token counts as strings and a `-07:00` offset; row 3 is a cache hit at $0.

{% tabs %}
{% tab title="NDJSON" %}
`gateway-2026-09.ndjson`:

```json
{"id":"req_8f2a01","occurred_at":"2026-09-30T14:02:11Z","provider":"anthropic","model":"claude-sonnet-4-6","cost":"0.004215","person":"maya@example.com","api_key":"support-prod","input_tokens":1840,"output_tokens":212,"customer":"acme"}
{"id":"req_8f2a02","occurred_at":"2026-09-30T07:02:15-07:00","model":"openai/gpt-4o","cost":"0.0031","user":"devon@example.com","prompt_tokens":"950","completion_tokens":"118","campaign":"q4-renewals"}
{"id":"req_8f2a03","occurred_at":"2026-09-30T14:03:40.250Z","model":"openai/gpt-4o-mini","cost":"0","cache_hit":true,"person":"maya@example.com"}
```

```bash
floe gateway validate gateway-2026-09.ndjson
```

```
  Mode          offline
  Format        ndjson
  Read with     floe-canonical-ndjson@3 (best match, score 1)
  Rows          export 3 · Floe 3  counts match
  Ids           present
  Headers       15 mapped · 0 ignored · 0 unmapped
  Refused rows  0
! offline: ids already imported on your account are not checked (run with --online)
! offline: people are not resolved against your account (run with --online)
✓ valid: Floe would import every row of this export
```
{% endtab %}

{% tab title="CSV" %}
`gateway-2026-09.csv`, the same three requests:

```csv
id,occurred_at,provider,model,cost,person,api_key,input_tokens,output_tokens,customer,campaign,cache_hit
req_8f2a01,2026-09-30T14:02:11Z,anthropic,claude-sonnet-4-6,0.004215,maya@example.com,support-prod,1840,212,acme,,
req_8f2a02,2026-09-30T07:02:15-07:00,,openai/gpt-4o,0.0031,devon@example.com,,950,118,,q4-renewals,
req_8f2a03,2026-09-30T14:03:40.250Z,,openai/gpt-4o-mini,0,maya@example.com,,,,,,true
```

```bash
floe gateway validate gateway-2026-09.csv
```

```
  Mode          offline
  Format        csv
  Read with     floe-canonical-csv@1 (best match, score 1)
  Rows          export 3 · Floe 3  counts match
  Ids           present
  Headers       12 mapped · 0 ignored · 0 unmapped
  Refused rows  0
! offline: ids already imported on your account are not checked (run with --online)
! offline: people are not resolved against your account (run with --online)
✓ valid: Floe would import every row of this export
```
{% endtab %}
{% endtabs %}

### A file that isn't ready

`broken.ndjson` has a space instead of `T` in row 1, no provider in row 2, cost as a JSON number in row 3, `user` and `person` disagreeing in row 4, an extra `region` key in row 5, and row 6 repeating row 5's id:

```json
{"id":"req_9a01","occurred_at":"2026-09-30 14:02:11","provider":"anthropic","model":"claude-sonnet-4-6","cost":"0.004215"}
{"id":"req_9a02","occurred_at":"2026-09-30T14:02:15Z","model":"gpt-4o","cost":"0.0031"}
{"id":"req_9a03","occurred_at":"2026-09-30T14:03:40Z","provider":"openai","model":"gpt-4o","cost":0.0012}
{"id":"req_9a04","occurred_at":"2026-09-30T14:03:41Z","provider":"openai","model":"gpt-4o","cost":"0.0012","user":"a@example.com","person":"b@example.com"}
{"id":"req_9a05","occurred_at":"2026-09-30T14:03:42Z","provider":"openai","model":"gpt-4o","cost":"0.0009","region":"us-east-1"}
{"id":"req_9a05","occurred_at":"2026-09-30T14:03:42Z","provider":"openai","model":"gpt-4o","cost":"0.0009"}
```

```
  Mode          offline
  Format        ndjson
  Read with     floe-canonical-ndjson@3 (best match, score 0.875)
  Rows          export 6 · Floe 1  counts differ
  Ids           present
  Headers       7 mapped · 0 ignored · 1 unmapped
  Refused rows  4
Unmapped headers: region
Refused rows by reason:
  invalid_occurred_at  1
  missing_provider  1
  invalid_cost  1
  conflicting_person  1
  row 1: invalid_occurred_at (occurred_at)
  row 2: missing_provider (provider)
  row 3: invalid_cost (cost)
  row 4: conflicting_person (user)
Repeated ids in the file: 1 (rows 6)
! Floe would import 1 of the export's 6 rows
! offline: ids already imported on your account are not checked (run with --online)
! offline: people are not resolved against your account (run with --online)
✗ not valid
```

Note what the report leaves out: no email address, no model name, no cost from any row.

### A file without ids

```csv
occurred_at,model,cost,user
2026-09-30T14:02:11Z,openai/gpt-4o,0.0031,devon@example.com
2026-09-30T14:05:00+02:00,anthropic/claude-haiku-4-5,0.0004,maya@example.com
```

This validates (`Ids  derived`) with the note `ids derived; window required`: import it with `window_start` and `window_end`.

### Online, with the API

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/ext-gateway/validate?template=floe-canonical-csv@1" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: text/csv" \
  --data-binary @gateway-2026-09.csv
```

On an account that has imported nothing yet, the response is the offline report (without `mode` and `caveats`) plus the two account checks:

```json
{
  "valid": true,
  "format": "csv",
  "profile": { "template": "floe-canonical-csv@1", "source": "template" },
  "exportRowCount": 3,
  "floeRowCount": 3,
  "rowCountMatches": true,
  "ids": "present",
  "duplicateIds": {
    "inFile": { "count": 0, "rows": [], "truncated": false },
    "alreadyImported": { "count": 0, "rows": [], "truncated": false, "byConnection": {} }
  },
  "people": { "distinct": 2, "known": 0 },
  "notes": [],
  "…": "headers, refusedRows, skippedRows, bestTemplate, templates, fileError"
}
```

## Import it

Imports go into a **connection**: one gateway feed on your account. Create one for your gateway with the contract's template (owner or admin):

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/ext-gateway/connections" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"slug":"our-gateway","gateway":"own","template":"floe-canonical-ndjson@3","grain":["customer","campaign"]}'
```

Use `floe-canonical-csv@1` for the CSV form. Name the template: a `gateway: "own"` connection created without one uses the older `floe-canonical-ndjson@2` contract. `grain` (any of `task`, `campaign`, `customer`) is set once and never changes.

Then post each export file (up to 10 MiB; larger files go through a signed upload):

```bash
# A file with ids
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/ext-gateway/connections/our-gateway/imports" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/x-ndjson" \
  --data-binary @gateway-2026-09.ndjson

# A file without ids: declare the window it covers (half-open)
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/ext-gateway/connections/our-gateway/imports?window_start=2026-09-01T00:00:00Z&window_end=2026-10-01T00:00:00Z" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/x-ndjson" \
  --data-binary @gateway-2026-09-noids.ndjson
```

For a file without ids, the same file with the same window again is a recorded no-op. A different file over an overlapping window is refused (`409 window_overlap`) unless you add `mode=replace`, and a replace must cover every window it overlaps (`409 replace_window_partial` otherwise). `mode=replace` is only for files without ids (`400 replace_needs_idless_profile`); a file with ids dedupes on them instead.

An import is all-or-nothing: an unmapped field, a missing required field or any refused row writes nothing (`422`, with the reasons). That is why the validator exists: run it first, fix the export, then import.

> **See also:** [Floe CLI](cli.md#floe-gateway) · [Vendor actuals](../build/vendor-actuals.md) · [OpenAPI specification](https://credit-api.floelabs.xyz/.well-known/openapi.yaml)
