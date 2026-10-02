---
icon: handshake
---

# Counterparty sharing

When an AI vendor makes a business case to a buyer, both sides need to trust the same inputs. Counterparty sharing puts those inputs in one place that both parties can see. Each input has a named owner, only the owner can change it, and every change is journaled with who made it and why.

This page is for the vendor that shares a case and for the buyer's finance team that reviews it.

## Cases

A **case** is one version of an initiative's model, shared with one counterparty: for example a first draft, a CFO-reviewed version and a renewal. An initiative can have many cases. A case's `status` is `draft`, `shared`, `locked` or `closed`.

Vendor-side calls use a developer credential (`floe_live_…` key or dashboard session):

```bash
# Create a draft case on an initiative (member role or above)
curl -X POST https://credit-api.floelabs.xyz/v1/developer/initiatives/init_…/cases \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Inside sales pilot", "counterpartyName": "Buyer Co"}'

# Invite the buyer's people by email
curl -X POST https://credit-api.floelabs.xyz/v1/developer/initiatives/init_…/cases/<caseId>/members \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "controller@buyer.example", "role": "buyer_finance"}'

# Issue the case link
curl -X POST https://credit-api.floelabs.xyz/v1/developer/initiatives/init_…/cases/<caseId>/share \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"expiresInDays": 90}'
```

* **Buyer roles.** A `buyer_finance` member can edit the inputs they own, propose changes, and approve values. A `buyer_viewer` can only read.
* **The link** (`csh_…`, returned with its `path`, `/case/csh_…`) is **shown once**. Floe stores only a hash of it. It lasts 90 days unless you set `expiresInDays` (up to 365). A case has only one live link at a time. Revoking it (`…/share/revoke`) makes it stop working for everyone, and issuing a new one ends every session opened from the old one.
* **The link alone grants nothing.** The buyer must also sign in with an email address that was invited to the case.
* Inviting buyers and issuing or revoking the link needs the admin role, or the person who owns the case on the vendor side. Removing one buyer leaves the link and the other buyers working.

## What the buyer sees

The buyer opens the link and signs in with their invited email. This opens an 8-hour **case session**. It doesn't create a Floe account or give access to the vendor's console. On every request, Floe checks that the link is still live and the email still has an active membership. If either check fails, the answer is the same `404` as an unknown link.

In the case, the buyer sees every assumption, who owns it, whether they may edit it, and the value for each scenario. The buyer-side routes all sit under `/v1/case` and need the case session:

| Route | What it does |
|---|---|
| `GET /v1/case` | The case and every assumption, with its owner and its value for each scenario |
| `GET /v1/case/journal` | Every value change, ownership change, approval and refused write on this case |
| `PUT /v1/case/assumptions/{key}/value` | Set the value of an assumption you own (`buyer_finance`) |
| `POST /v1/case/assumptions/{key}/proposals` | Propose a value for an assumption you don't own |
| `POST /v1/case/proposals/{id}/accept` · `/reject` · `/withdraw` | Decide proposals on your assumptions, or withdraw your own |
| `POST /v1/case/assumptions/{key}/approve` | Approve the vendor's value for a scenario |
| `POST /v1/case/logout` | End the session |

The buyer never sees which vendor employee owns an input. Every vendor-side owner shows as the vendor organization.

## The assumptions register

An **assumption** is a named input to the model, such as a monthly volume, a rate or a price. It has a `key`, a `name`, a `unit` and an owner. Values are integer text in that unit. Its values are ledger entries, one per scenario. Each value records who set it, when, why, and on what evidence.

```bash
# Declare a value (vendor side; the buyer uses PUT /v1/case/assumptions/{key}/value)
curl -X PUT https://credit-api.floelabs.xyz/v1/developer/initiatives/init_…/assumptions/tasks_per_month/value \
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
* **Never an edit.** A new value is a new entry. Changing a value needs a reason. In a locked period, the change is written as a restatement into the next open period.
* **Which value a case uses.** For each scenario, a case uses its own value for that scenario first, then its own `all` value, then the initiative's default value for the scenario, then the default's `all` value.

`GET /v1/developer/initiatives/{id}/assumptions` lists every assumption with its owner and values. Add `?case=<caseId>` to see what one case uses. `…/assumptions/journal` lists every revision and ownership change.

## Who may change what

Every assumption has one owner:

| Owner | Who it is |
|---|---|
| `dev:<account>` | The vendor account as a whole |
| `member:<id>` | A named person on the vendor's team |
| `case_member:<id>` | A `buyer_finance` member of a case on this initiative |

Only the owner writes the value. Anyone else gets `403`, and the error names the owner. That applies to the vendor too: the vendor can't write a value the buyer owns. The vendor assigns ownership (`PUT …/assumptions/{key}/owner`), and the buyer can't claim an assumption. Taking an assumption back from a buyer needs a reason, which both sides see in their journals. Refused writes are logged and appear in the case journal.

### Proposals

If you can see an assumption but can't edit it, you can **propose** a value instead. The proposal includes the value, scenario, citation and a reason. The assumption doesn't change until its owner accepts. Each person can have one open proposal per assumption and scenario.

* **Accepting** writes the value as a new revision, graded by the citation.
* **When a buyer accepts a vendor's proposal** without adding a citation of their own, the value is recorded as the vendor's claim: grade D. There is one exception. If the vendor cited its own platform export and the buyer confirms it (`confirmExport: true`), the value is graded by that source (C). A vendor saying a figure comes from its export is only an assertion until the buyer confirms it.
* **Rejecting** needs a reason, which the proposer sees.
* If the value changed after the proposal was opened, accepting it returns `409 value_changed` and the proposal stays open.

### Buyer approval

A value the vendor wrote shows `buyerUnapproved: true` until a `buyer_finance` member approves that exact entry:

```bash
POST /v1/case/assumptions/{key}/approve   {"scenario": "conservative", "entryId": "<the entryId GET /v1/case returned>"}
```

An approval applies to one specific entry. If the vendor writes a new value, the flag comes back. If the value changed since the buyer loaded it, the answer is `409 value_changed` and nothing is approved. If the member who approved is later removed from the case, their approval stops counting.

## Related

* [The Initiative Ledger](overview.md): entries, grades and initiatives
* [Period close & restatements](period-close.md): how a change to a locked period is restated
