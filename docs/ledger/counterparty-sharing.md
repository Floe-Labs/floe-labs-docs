---
icon: handshake
---

# Counterparty sharing

Counterparty sharing lets an AI vendor and a buyer's finance team work from the same business-case inputs. Each input has a named owner, only the owner can change it, and every change is journaled.

This page is for the vendor that shares a case and for the buyer's finance team that reviews it.

## Cases

A **case** is one version of an initiative's model, shared with one counterparty: for example a first draft, a CFO-reviewed version and a renewal. An initiative can have many cases. A case's `status` is `draft`, `shared`, `locked` or `closed`.

Vendor-side calls use a developer credential (`floe_live_…` key or dashboard session):

```bash
INITIATIVE_ID="init_…"   # from GET /v1/developer/initiatives
CASE_ID="case_…"         # `case.publicId` from the create response

# Create a draft case on an initiative (member role or above)
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/initiatives/${INITIATIVE_ID}/cases" \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Inside sales pilot", "counterpartyName": "Buyer Co"}'

# Invite the buyer's people by email
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

* **Buyer roles.** A `buyer_finance` member can edit the inputs they own, propose changes, and approve values. A `buyer_viewer` can only read.
* **The link** (`csh_…`, returned with its `path`, `/case/csh_…`) is **shown once** and can't be retrieved again. It lasts 90 days unless you set `expiresInDays` (up to 365). A case has only one live link at a time. Revoking it (`…/share/revoke`) makes it stop working for everyone, and issuing a new one ends every session opened from the old one.
* **The link alone grants nothing.** The buyer must also sign in with an email address that was invited to the case.
* Inviting buyers and issuing or revoking the link needs the admin role, or the person who owns the case on the vendor side. Removing one buyer leaves the link and the other buyers working.

## What the buyer sees

The buyer opens the link on the Floe dashboard (`https://dev-dashboard.floelabs.xyz/case/csh_…`) and signs in there with their invited email. This opens an 8-hour **case session**. It doesn't create a Floe account or give access to the vendor's console. If the link is revoked or expired, or the buyer's membership is removed, every call returns `404 case_not_found`, the same as an unknown link.

### How the case session works

Buyer sign-in is **browser-only**. Opening a session needs an access token from Floe's email sign-in on the case page, and there is no API key for a buyer. The exchange the case page makes is documented here so you know what crosses the wire:

* **Sign-in:** `POST /v1/case/session`, with `Content-Type: application/json`, `Authorization: Bearer <access token from the email sign-in>` and the body `{ "token": "csh_…" }`. A Floe key in the `Authorization` header is refused (`401 invalid_privy_token`). Sign-in attempts are rate-limited per IP address (`429`).
* **Response:** `200` with `{ "case": { "publicId", "name", "counterpartyName", "status" }, "member": { "email", "role" } }`. It also sets the `floe_case_session` cookie: HttpOnly, Secure, `SameSite=Lax`, `Path=/v1/case`, expiring after 8 hours.
* **Every other `/v1/case` call** carries that cookie plus an `X-Floe-Case-Link` header holding the SHA-256 hex digest of the `csh_` token. A missing header, or one for a different link, gets `409 case_session_mismatch`. The `csh_` token itself is never sent as a bearer credential, and the session is never valid on any other Floe route.

In the case, the buyer sees every assumption, who owns it, whether they may edit it, and the value for each scenario. The buyer-side routes all sit under `/v1/case` and need the case session:

| Route | What it does |
|---|---|
| `GET /v1/case` | The case and every assumption, with its owner and its value for each scenario |
| `GET /v1/case/journal` | Every value change, ownership change, approval and refused write on this case |
| `PUT /v1/case/assumptions/{key}/value` | Set the value of an assumption you own (`buyer_finance`) |
| `POST /v1/case/assumptions/{key}/proposals` | Propose a value for an assumption you don't own |
| `GET /v1/case/proposals` | The proposals on this case that the buyer can see |
| `POST /v1/case/proposals/{id}/accept` · `/reject` · `/withdraw` | Decide proposals on your assumptions, or withdraw your own |
| `POST /v1/case/assumptions/{key}/approve` | Approve the vendor's value for a scenario |
| `POST /v1/case/logout` | End the session |

**Ownership is shown to the buyer as an organization.** Every vendor-side owner, whether that's the vendor account or a named vendor employee, shows as the vendor organization: the vendor account's display name, or `vendor` if it has none. A buyer from a different case on the same initiative shows as "another counterparty member". **Changes are shown by person.** The journal and each value's "set by" name the person who made the change by their email address, vendor employees included. A vendor employee with no email on file shows as `vendor`.

## The assumptions register

An **assumption** is a named input to the business case, such as a monthly volume, a rate or a price. It has a `key`, a `name`, a `unit` and an owner. Its values are ledger entries, one per scenario, written as integer text in that unit.

```bash
# Declare a value (vendor side; the buyer uses PUT /v1/case/assumptions/{key}/value)
curl -X PUT "https://credit-api.floelabs.xyz/v1/developer/initiatives/${INITIATIVE_ID}/assumptions/tasks_per_month/value" \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "40000",
    "scenario": "conservative",
    "citation": { "ref": "Ticketing system export, Q3" },
    "asOf": "2026-09-30",
    "period": "2026-09",
    "reason": "Q3 volume from the ticketing system"
  }'
```

* **Scenarios.** A value is set for `conservative`, `expected` or `vendor_claim`. `all` sets one value for both conservative and expected. It never covers `vendor_claim`.
* **The citation sets the grade.** A value with a named source (`citation.ref`) is grade C at best. A value with no source, a benchmark (`citation.benchmark: true`), a vendor's assertion (`citation.kind: "vendor_claim"`), or any value in the `vendor_claim` scenario is grade D. A vendor's own platform export is a named source and is graded like one.
* **Never an edit.** A new value is a new entry. Changing a value needs a `reason`. In a locked period, the change is written as a restatement into the next open period.
* **Case values and defaults.** A case uses its own values where they are set, and the initiative's defaults otherwise.

`GET /v1/developer/initiatives/{id}/assumptions` lists every assumption with its owner and values. Add `?case=<caseId>` to see what one case uses. `…/assumptions/journal` lists every revision and ownership change.

## Who may change what

Every assumption has one owner:

| Owner | Who it is |
|---|---|
| `dev:<account>` | The vendor account as a whole |
| `member:<id>` | A named person on the vendor's team |
| `case_member:<id>` | A `buyer_finance` member of a case on this initiative |

| Action | Who may do it |
|---|---|
| Create a case | Vendor: member role or above |
| Invite or remove buyers, issue or revoke the link | Vendor: admin, or the case's vendor-side owner |
| Reassign a case's vendor-side owner | Vendor: admin |
| Write an assumption value | The assumption's owner only. Anyone else gets `403 not_assumption_owner`. |
| Hand an assumption to a new owner (`PUT …/assumptions/{key}/owner`) | Vendor: member role or above. A buyer can't claim one. Taking one back from a buyer needs a `reason`. |
| Propose a value | Anyone who can see an assumption but can't write it (on the buyer side, `buyer_finance`) |
| Accept or reject a proposal | Whoever could write the value |
| Approve a vendor-written value | `buyer_finance` |
| Read the case and its journal | `buyer_finance` and `buyer_viewer` |

**What a refused write shows.** The `403 not_assumption_owner` body's `owner` field (`kind`, `label`) says who owns the assumption:

* **A buyer** sees a vendor-side owner only as the vendor organization, never a person or an id. The response also includes `proposeUrl` when the buyer can propose a value instead.
* **A vendor** sees the owning person's email address (or wallet if no email is on file) and, for a named team member, their member id.

Refused writes appear in the case journal.

### Proposals

If you can see an assumption but can't edit it, you can **propose** a value instead. The proposal includes the value, scenario, citation and a reason. The assumption doesn't change until its owner accepts. Each person can have one open proposal per assumption and scenario.

* **Accepting** writes the value as a new revision, graded by the citation.
* **When a buyer accepts a vendor's proposal** without adding a citation of their own, the value is recorded as the vendor's claim: grade D. The exception is when the vendor cited its own platform export and the buyer confirms it (`confirmExport: true`). The value is then graded by that source (C).
* **Rejecting** needs a `decisionReason`, which the proposer sees.
* If the value changed after the proposal was opened, accepting it returns `409 value_changed` and the proposal stays open.

### Buyer approval

A value the vendor wrote shows `buyerUnapproved: true` until a `buyer_finance` member approves that exact entry:

```text
POST /v1/case/assumptions/{key}/approve   {"scenario": "conservative", "entryId": "<the entryId GET /v1/case returned>"}
```

An approval applies to one specific entry. If the vendor writes a new value, the flag comes back. If the value changed since the buyer loaded it, the answer is `409 value_changed` and nothing is approved. If the member who approved is later removed from the case, their approval stops counting.

## Related

* [REST API → Initiative Ledger endpoints](../developers/credit-api.md#initiative-ledger-endpoints): the API contract for these routes
* [The Initiative Ledger](overview.md): entries, grades and initiatives
* [Period close & restatements](period-close.md): how a change to a locked period is restated
