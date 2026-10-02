---
icon: shield-check
---

# Vendor key scopes & the read-only export

Floe only **reads** your vendor billing data. But the key a vendor issues for that
read can carry more power than reading: for some vendors, the only key that reaches
cost data can also manage the whole account. This page lists, for every vendor
connector, how much power its key carries, the narrowest key the vendor offers, the
vendor doc pages that was read from, and the day it was checked. Where the only key
is an admin key, it describes the read-only way in: the vendor console's own cost
export.

The same data is served by the API on the connector catalog
(`GET /v1/developer/vendor-connections` returns `connectors[].credentialScope`), and the
dashboard shows it in the connect form and in the **Which key each vendor needs**
list on **Vendor actuals**. When a vendor changes its key model, the catalog changes
first; this page follows.

## The four scopes

| Scope | What it means |
|---|---|
| `read_only` | The vendor offers a key limited to the billing data Floe reads. |
| `admin` | The only key that reaches the cost data can also administer your vendor account. |
| `unverified` | The vendor's docs don't say which permission these reads need. Floe does not guess: treat the key as account-wide. |
| `none` | Floe collects no key. Costs arrive through the invoice you upload. |

An `admin` vendor that has a read-only way in names it in `readOnlyAlternative`.
Today that is `console_export` for OpenAI and Anthropic.

## Per vendor

Checked against each vendor's docs on **2026-10-02**.

| Vendor | Scope | Minimum key | Read-only alternative |
|---|---|---|---|
| Twilio | `read_only` | Restricted API key (`twilio_api_key`) with `/twilio/billing/usage/read`, `/twilio/voice/calls/list` and `/twilio/voice/calls/read`. | - |
| AWS Bedrock (CUR) | `read_only` | IAM access key whose policy allows only `s3:GetObject` and `s3:ListBucket` on the CUR bucket prefix. | - |
| Google Cloud | `read_only` | Service account with `roles/bigquery.dataViewer` on the billing export dataset and `roles/bigquery.jobUser` on the project that runs the query (OAuth scope `bigquery.readonly`). | - |
| Azure | `read_only` | App registration (client secret) granted **Cost Management Reader** on the billing scope. | - |
| OpenAI | `admin` | Organization Admin API key (`sk-admin-...`). Creating one takes a name and an optional expiry, no permission scope; the key's owner is always an organization owner. | Console cost export |
| Anthropic | `admin` | Admin API key (`sk-ant-admin...`), an `org:admin` OAuth token, or a personal or service-account key not scoped to a workspace. Only members with the admin role can provision an Admin API key; workspace keys are refused. | Console cost export |
| Deepgram | `unverified` | A project key created with explicit scopes; `usage:read` and `project:read` are the read scopes Deepgram lists. | - |
| Telnyx | `unverified` | A Bearer API key from Mission Control; no key scopes are documented. | - |
| ElevenLabs | `unverified` | An API key limited to read permissions such as `user_read` and `speech_history_read`. | - |
| Cartesia | `unverified` | An API key; no key scopes are documented. | - |
| AssemblyAI, Rime, Sarvam | `none` | No billing API: no key is collected. | - |

What each vendor's docs did, or did not, say:

- **Twilio.** An Account SID with its Auth Token carries full account access; use a restricted key instead. Sources: [Restricted API keys](https://www.twilio.com/docs/iam/api-keys/restricted-api-keys), [Usage Records permissions (PDF)](https://docs-resources.prod.twilio.com/documents/Twilio_Restricted_API_Keys_Permissions_-_Usage_Records_Permissions.pdf), [Voice permissions (PDF)](https://docs-resources.prod.twilio.com/documents/Twilio_Restricted_API_Keys_Permissions_-_Voice_Permissions.pdf).
- **AWS Bedrock.** Sources: [GetObject](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html), [CUR in S3](https://docs.aws.amazon.com/cur/latest/userguide/cur-s3.html).
- **Google Cloud.** `bigquery.jobUser` also lets the account run jobs and create Dataform repositories in that project; it grants no write on the export dataset. Source: [BigQuery access control](https://docs.cloud.google.com/bigquery/docs/access-control).
- **Azure.** Cost Management Reader holds read actions (`Microsoft.Consumption/*/read`, `Microsoft.CostManagement/*/read`) plus `Microsoft.Support/*`. Sources: [Management and governance roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/management-and-governance), [Assign access to Cost Management data](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/assign-access-acm-data).
- **OpenAI.** The Costs and Usage endpoints are Admin API endpoints; there is no read-only admin key. Sources: [Create admin API key](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/admin_api_keys/methods/create), [Costs](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/costs).
- **Anthropic.** The same Admin API key also manages members, workspaces and API keys. The Admin API is not available to individual accounts, and the usage and cost reports are not available on Claude Platform on AWS. Sources: [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api), [Admin API](https://platform.claude.com/docs/en/manage-claude/admin-api).
- **Deepgram.** Deepgram documents the read scopes but not which scope `GET /v1/projects`, `/requests` and `/usage` require, so whether a read-only key is enough is unconfirmed. A default member key also holds `usage:write` and `keys:write`. Sources: [Working with roles](https://developers.deepgram.com/guides/deep-dives/working-with-roles), [Create a key](https://developers.deepgram.com/reference/manage/keys/create), [List requests](https://developers.deepgram.com/reference/manage/requests/list).
- **Telnyx.** The authentication docs describe no permission scopes for API keys. We could not confirm a read-only key exists, so treat the key as account-wide. Sources: [Authentication](https://developers.telnyx.com/docs/development/api-fundamentals/authentication), [auth.md](https://developers.telnyx.com/auth.md).
- **ElevenLabs.** Keys take a permission list (`user_read`, `speech_history_read`, ... or all), but the `/v1/user/subscription` and `/v1/history` pages do not name the permission they require. Sources: [Create API key](https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/create), [Get subscription](https://elevenlabs.io/docs/api-reference/user/subscription/get), [List history](https://elevenlabs.io/docs/api-reference/history/list).
- **Cartesia.** The public docs describe API keys and short-lived access tokens with `tts`/`stt` grants only. The `/usage` endpoint the connector calls is not in the public reference, so its key requirement is unconfirmed. Sources: [llms.txt](https://docs.cartesia.ai/llms.txt), [Authenticate your client applications](https://docs.cartesia.ai/get-started/authenticate-your-client-applications).
- **AssemblyAI, Rime, Sarvam.** No billing API. Their costs reach the ledger through the invoice you upload; the units shown come from Floe's own metering.

### Payroll connectors

Both are read-only (`GET /v1/developer/payroll/connections` returns them as `credentialScopes`):

| Provider | Scope | Minimum grant |
|---|---|---|
| Gusto | `read_only` | OAuth grant to Floe's app with the read scopes `employees:read payrolls:read pay_schedules:read jobs:read companies:read`. Gusto assigns an app its scopes at review and enforces them in production; you approve the grant. Source: [Gusto scopes](https://docs.gusto.com/app-integrations/docs/scopes). |
| Rippling | `read_only` | API token (Tools > Developer > API Tokens) scoped to read companies, workers and payroll runs. A token's access is the intersection of its owner's permission profile and its scopes; only `workers.read` was confirmed by name. Sources: [llms.txt](https://developer.rippling.com/llms.txt), [API tokens](https://developer.rippling.com/documentation/rest-api/essentials/api-tokens). |

### LLM gateways

LiteLLM, Portkey, Helicone and OpenRouter usage reaches Floe as an **export file you upload**. Floe pulls no gateway API today, so no gateway key is collected. If gateway API pulls ship, their scopes will be listed here.

## The read-only path: the console cost export

For OpenAI and Anthropic, the cost API needs an admin key. If your security team won't
issue one, upload the vendor console's monthly cost export instead. It reaches the same
period-rate outcome, with one condition, explained under [Grain](#grain).

### In the dashboard

1. **Vendor actuals > Billing connections > Connect a vendor bill**, choose OpenAI or
   Anthropic. Right under the admin-key field: *"Your security team can't issue an
   admin key? Upload the console's cost export instead."* Choose **Use the console
   export**; the same form switches to the export. Files for later months go through
   **Console cost exports**, on the same tab.
2. **Create the source.** The form shows the template's default header for each Floe
   field. **The defaults are unverified**: Floe built them from the vendor's cost API
   field names, not from a real console file. Check each one against your own export,
   blank out what your file doesn't have, and list any other headers Floe should not
   read (a header that looks like money or identity needs a reason).
3. **Confirm once.** Tick *I checked these headers against my own file*. That is the one
   confirmation for this profile version, recorded with who confirmed and when. It must
   be a signed-in owner or admin; a developer key can't confirm.
4. **Upload a month.** One file is one vendor-month. It is accepted once the month has
   ended (UTC) and the vendor's restatement window has passed: 6 hours for OpenAI and
   Anthropic.

### Header drift stops the import

A file imports only when its header set equals the confirmed version's exactly (column
order is free). Any difference is refused with `422 header_drift`, listing the
`missing` and `unexpected` headers, and nothing is written. Confirm a new profile
version for the new file; the dashboard opens that form with the unexpected headers
prefilled.

### Grade

| Profile `costSource` | What it is | Grade |
|---|---|---|
| `vendor_reported` | The file's own cost column. | **B** |
| `imputed` | Tokens only (Anthropic), priced from Floe's model catalog. | **D**, an estimate |

An imputed (D) file is stored but is **never a true-up authority or a period-rate
input**: the response says `trueUpAuthority: false` and `note: "imputed from catalog -
not a true-up authority"`, and the month stays `invoice_pending` until a
vendor-reported export, a billing connection or an invoice arrives. A console export is
never `invoiced`: that status belongs to the invoice document.

### Grain

- **Token class on every row** (OpenAI's line item, Anthropic's token type): rows are
  keyed exactly as the connector keys them, so the month's true-up per gateway row is
  identical to an API month's.
- **No token class** (daily per model): accepted at its own grain and labelled
  **"blended per model"**: one period rate per model for the month. The
  identical-to-the-API result does **not** hold for a blended file.
- **One grain per vendor per month.** A month booked at another grain by another
  export source is refused (`409 grain_conflict`); a month booked by another source is
  refused (`409 month_booked_by_other_source`); a file mixing both grains is refused
  (`422 mixed_grain`).

### The API wins

If a billing connection covers the same days, its API figures are booked and the
export's rows for those days become a **tie-out check** (`tieOutOnly: true`), whichever
arrives first. Connect the vendor mid-month after uploading an export, and the
connector's figures supersede the export's through the ordinary true-up re-run: an open
month is superseded; a locked month is restated in the next open period. The tie-out
compares the export's total to the connector's over the same days: within +/-0.5% it is
`tied`; beyond that it is `unexplained` and opens a `vendor_export_tie_out_unexplained`
finding under **Needs review**. It never moves a dollar.

### Other refusals

| Code | Meaning |
|---|---|
| `422 rows_rejected` | Rows were refused; `reasons` counts them. Nothing imported. |
| `422 month_not_closed` | The month hasn't ended plus the restatement window yet. |
| `422 currency_unsupported` | Only USD is booked. The file is kept and the refusal recorded. |
| `422 malformed_csv` / `empty_file` | The file isn't readable CSV, or has no header row. |
| `409 window_overlap` | This source already has an import covering the month: send `mode=replace` to replace it. |
| `409 replace_window_partial` | A replace must cover every import it overlaps. |
| `413 too_large` | A file is at most 256 KiB. |

### From the API

Profiles are created and confirmed by a signed-in owner or admin in the dashboard.
Uploading a month can also be done with a developer key (`floe_live_...`, admin role):

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/vendor-exports/openai-console/imports?month=2026-09" \
  -H "Authorization: Bearer $FLOE_DEVELOPER_KEY" \
  -H "Content-Type: text/csv" \
  --data-binary @openai-costs-2026-09.csv
```

Expected response (abridged):

```json
{
  "duplicate": false,
  "import": { "id": "...", "status": "imported", "profileVersion": 1, "rowCount": 412 },
  "costSource": "vendor_reported",
  "grade": "B",
  "gradeReason": "vendor_reported",
  "catalogVersion": null,
  "trueUpAuthority": true,
  "note": null,
  "grain": "token_class",
  "label": null,
  "buckets": [ { "recordKind": "cost_bucket", "day": "2026-09-01", "costUsd": "41.25", "tieOutOnly": false } ],
  "tieOuts": []
}
```

Uploading the same file again returns `"duplicate": true` and changes nothing.
`GET /v1/developer/vendor-exports` lists your sources and the templates;
`GET /v1/developer/vendor-exports/{slug}/imports` lists a source's current imports.

## Related

- [Vendor connections](vendor-connections.md): connecting a vendor's billing API.
- [Vendor actuals](vendor-actuals.md): the statuses a reconciled leg can reach.
