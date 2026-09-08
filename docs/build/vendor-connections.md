---
icon: plug
---

# Vendor connections

Hand Floe **read-only** billing access to a vendor, and it reconciles your legs
against that vendor's **own** cost records — so a BYOK call that Floe only charged
its service fee for still lands on your ledger at what the vendor actually billed
you. A vendor connection is the credential that makes [Vendor actuals](vendor-actuals.md)
real: without one, the vendor bills you off-ledger; with one, Floe reconciles each
leg against the vendor's record and stamps it with the precision that record
supports.

> **Read-only, and separate from the keys that route traffic.** A billing
> credential reads your vendor invoice — it never writes to your vendor account,
> never rotates your keys, and is not the key that serves your calls. Floe seals it
> at rest; no read path ever returns the secret, only a mask.

## Plan gate

Vendor connections are an **Agency** capability (`vendor_connections`), and
installing one requires an **admin** role. Reconciling your legs against a
vendor's own records is the Agency half — because it's the credential that makes
[Vendor actuals](vendor-actuals.md) real. Reading the resulting ledger is not
gated the same way: per-leg and by-call cost, plus findings, are **free**
(`ledger_read`); the per-client / per-campaign **rollups** are **Pro**
(`attribution_reports`). See [Plans & entitlements](../reference/plans.md).

## Setting one up

You connect a vendor from the **connect flow in the [dashboard](https://dev-dashboard.floelabs.xyz)**.
It lists the vendors Floe can reconcile, walks you through the exact **read-only**
scope each one needs, and verifies the credential live before anything trusts it.
Once connected, that vendor's costs flow onto your ledger automatically. Where a
vendor publishes no cost API, you upload its invoice instead and Floe reconciles
against that.

Connections are managed — enable/disable, re-key, remove — from the same place.
Removal is non-destructive: the costs already reconciled onto your ledger stay
(they were real); only future pulls stop.

> **USD only — you're told at connect time, not at close.** Floe prices and
> reconciles in USD and [never converts currencies](vendor-actuals.md#no-fx-ever).
> If you tell Floe the connection bills in a non-USD currency, the connect flow
> warns you then and there — so a non-USD vendor is a documented limit you accept
> up front, not a surprise `currency_unsupported` finding weeks later. The records
> still capture (with their ISO code); they just land unpriced.

## Twilio: import the call history instead of uploading an invoice

On a connected **Twilio** account you don't have to wait for an invoice to get
per-client cost. One call bridges the account's **whole billed call history**
into the cost-audit lane — the same lane an uploaded export lands in — and
re-runs attribution, so every call shows up under the client it served:

```http
POST /v1/developer/vendor-connections/:id/import-calls
```

Each Twilio call becomes one line keyed on its `CallSid`, carrying the
**client-side number** (the number that placed an outbound call, the number that
was called on an inbound one — never the end customer's) and the **billing
subaccount SID**. Those are the identifiers you map to a customer, exactly as
you would for an uploaded export. The lines land in your **default** audit
workspace, so the mappings you already keep there apply with no workspace
switch.

It is **Twilio-only** (`import_unsupported` for any other vendor — no other
vendor publishes a per-call price to bridge), requires the **admin** role, and
refuses a **disabled** connection (`connection_disabled`) rather than pulling
past a switch you turned off. The credential is only read, never rewritten: a
vendor that can't be reached returns `502 import_unavailable`, and an import
that runs past 120s is stopped with `504 import_timeout` — in both cases the
connection is left exactly as it was, and you can retry.

> **Re-run it as often as you like.** The import is idempotent per call: a call
> Twilio hadn't priced yet is **updated in place** when its final price lands,
> never duplicated. Lines you corrected or excluded by hand are left untouched,
> and a document you have already footed is refused outright — an import never
> rewrites evidence behind an `invoiced` stamp.

> **An unbilled call has no cost, not a zero cost.** A call Twilio has not
> priced yet (`price: null`), or one billed in a non-USD unit, lands with a
> **blank** cost and is flagged for review — the same rule as everywhere else in
> [Vendor actuals](vendor-actuals.md). It never counts as $0 against a client.

> **Very long histories come back marked.** The walk follows Twilio's paging up
> to a fixed page cap (500 pages of 1,000 calls). If it stops there with history
> still to follow, the response sets `truncated` and returns a warning: what
> landed is a **lower bound**, not the whole account. Re-running starts again
> from the most recent calls — it does not resume where the last one stopped.

## Related

- [Vendor actuals — reconcile to the vendor's records](vendor-actuals.md) — what these connections feed, leg by leg, with a status per claim.
- [Coverage Score](coverage-score.md) — how much of your spend Floe can act on, a different question from what it cost.
- [Plans & entitlements](../reference/plans.md) — where `vendor_connections` sits.
