---
icon: handshake
---

# Counterparty sharing

Routes for sharing an initiative's business case with a buyer's finance team as a **case**, and for the assumptions both sides work from. A case's `status` is `draft`, `shared`, `locked` or `closed`.

## Vendor side

Vendor-side routes take a developer credential (`floe_live_…` key or dashboard session).

```bash
INITIATIVE_ID="init_…"   # from GET /v1/developer/initiatives
CASE_ID="case_…"         # `case.publicId` from the create response

# Create a draft case
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/initiatives/${INITIATIVE_ID}/cases" \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Inside sales pilot", "counterpartyName": "Buyer Co"}'

# Invite a buyer
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/initiatives/${INITIATIVE_ID}/cases/${CASE_ID}/members" \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "controller@buyer.example", "role": "buyer_finance"}'

# Issue the case link
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/initiatives/${INITIATIVE_ID}/cases/${CASE_ID}/share" \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"expiresInDays": 90}'
```

Paths below are relative to `/v1/developer/initiatives/{id}`.

| Route | Role | Body / returns |
|---|---|---|
| `GET /cases` | Any member | Every case on the initiative |
| `POST /cases` | Member or above | `{ name, counterpartyName, ownerMemberId? }` → `201 { case }` |
| `GET /cases/{caseId}` | Any member | `{ case }` |
| `PATCH /cases/{caseId}` | Admin | `{ ownerMemberId }` |
| `POST /cases/{caseId}/members` | Admin, or the case's vendor-side owner | `{ email, role }`, role `buyer_finance` or `buyer_viewer` |
| `DELETE /cases/{caseId}/members/{memberId}` | Admin, or the case's vendor-side owner | |
| `POST /cases/{caseId}/share` | Admin, or the case's vendor-side owner | `{ expiresInDays? }` (1–365, default 90) → `201 { token, path, expiresAt }`. `409 share_already_issued` while a link is live. |
| `POST /cases/{caseId}/share/revoke` | Admin, or the case's vendor-side owner | |
| `GET /assumptions` | Any member | `?case=` |
| `POST /assumptions` | Member or above | `{ key, name, unit, description?, owner? }` |
| `GET /assumptions/journal` | Any member | |
| `PUT /assumptions/{key}/value` | The assumption's owner | `{ value, scenario, citation, asOf, period, reason?, caseRef? }` |
| `PUT /assumptions/{key}/owner` | Member or above | `{ owner, reason? }`. `reason` is required when taking a key back from a buyer. |
| `POST /assumptions/{key}/proposals` | A person who can read but not write the key | `{ value, scenario, citation, asOf, period, reason, caseRef? }` |
| `GET /proposals` | Viewer or above | `?status`, `?key`, `?case`, `?limit`, `?cursor` |
| `POST /proposals/{proposalId}/accept` | Whoever could write the value | `{ citation?, overrideReason? }` |
| `POST /proposals/{proposalId}/reject` | Whoever could write the value | `{ decisionReason }` |
| `POST /proposals/{proposalId}/withdraw` | The proposer | |

Field values:

* `scenario`: `conservative`, `expected`, `vendor_claim` or `all`.
* `citation`: `{ ref?, benchmark?, kind? }`, where `kind` is `vendor_claim` or `vendor_platform_export`.
* `owner`: `dev:<account>`, `member:<id>` or `case_member:<id>`.
* Values: integer text in the assumption's `unit`.

## Buyer side

The buyer opens the link on the Floe dashboard (`https://dev-dashboard.floelabs.xyz/case/csh_…`) and signs in there with their invited email. No Floe account is created.

### How the case session works

Buyer sign-in is **browser-only**. Opening a session needs an access token from Floe's email sign-in on the case page; buyers have no API key.

* **Sign-in:** `POST /v1/case/session`, with `Content-Type: application/json`, `Authorization: Bearer <access token from the email sign-in>` and the body `{ "token": "csh_…" }`. A Floe key in the `Authorization` header is refused (`401 invalid_privy_token`). Sign-in attempts are rate-limited per IP address (`429`).
* **Response:** `200` with `{ "case": { "publicId", "name", "counterpartyName", "status" }, "member": { "email", "role" } }`. It also sets the `floe_case_session` cookie: HttpOnly, Secure, `SameSite=Lax`, `Path=/v1/case`, expiring after 8 hours.
* **Every other `/v1/case` call** carries that cookie plus an `X-Floe-Case-Link` header holding the SHA-256 hex digest of the `csh_` token. A missing header, or one for a different link, gets `409 case_session_mismatch`. The `csh_` token itself is never sent as a bearer credential, and the session is not valid on any other Floe route.

| Route | Role | Body |
|---|---|---|
| `GET /v1/case` | Any buyer | |
| `GET /v1/case/journal` | Any buyer | |
| `PUT /v1/case/assumptions/{key}/value` | `buyer_finance`, owner of the key | `{ value, scenario, citation, asOf, period, reason? }` |
| `POST /v1/case/assumptions/{key}/proposals` | `buyer_finance` | `{ value, scenario, citation, asOf, period, reason }` |
| `GET /v1/case/proposals` | Any buyer | `?limit`, `?cursor` |
| `POST /v1/case/proposals/{proposalId}/accept` | `buyer_finance`, owner of the key | `{ citation?, confirmExport? }` |
| `POST /v1/case/proposals/{proposalId}/reject` | `buyer_finance`, owner of the key | `{ decisionReason }` |
| `POST /v1/case/proposals/{proposalId}/withdraw` | The proposer | |
| `POST /v1/case/assumptions/{key}/approve` | `buyer_finance` | `{ scenario, entryId }` |
| `POST /v1/case/logout` | Any buyer | |

What buyer responses contain:

* **Owners** of vendor-side assumptions are shown as the vendor organization (`kind: "vendor"`, `label`: the vendor account's display name, or `vendor`).
* **`setBy` and journal entries** carry the author's email address, vendor employees included.

## Errors

| Code | When |
|---|---|
| `403 not_assumption_owner` | Writing a key you don't own. `owner` (`kind`, `label`) names the owner. On buyer routes it also includes `proposeUrl` when proposing is allowed. |
| `403` | A `buyer_viewer` attempting a write |
| `404 case_not_found` | Unknown, revoked or expired link, or no active membership |
| `409 case_session_mismatch` | `X-Floe-Case-Link` missing or for another link |
| `409 value_changed` | The value changed since it was loaded (accept, approve) |
| `409 no_change` | The value, citation and `asOf` already stand |
| `409 proposal_exists` | You already have an open proposal for this key and scenario |
| `409 can_write_directly` | Proposing on a key you can write |
| `409 case_baseline_locked` | Vendor write to a locked case's value |

## Related

* [REST API → Initiative Ledger endpoints](../developers/credit-api.md#initiative-ledger-endpoints): the API contract for these routes
* [The Initiative Ledger](overview.md): entries, grades and initiatives
* [Period close & restatements](period-close.md)
