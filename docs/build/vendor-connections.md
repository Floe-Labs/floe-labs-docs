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

### Twilio: prefer a revocable API Key

A Twilio connection reads the same billing records either way — what differs is
what it costs you to take Floe's access away:

| Credential | Fields | Revoking it |
|---|---|---|
| Account Auth Token (`basic_auth`) | `accountSid`, `authToken` | Rotating the account-wide Auth Token — which breaks everything else that uses it |
| API Key (`twilio_api_key`) | `apiKeySid`, `apiKeySecret`, `accountSid` | Delete that key in the Twilio Console; nothing else on the account is touched |

Prefer the API Key. Floe authenticates as the key (`SK…`), never as the account,
so revoking it drops this connection alone. The `accountSid` field is still the
account being read, so paste the Account SID (`AC…`) there and the API Key SID
(`SK…`) in `apiKeySid` — swap the two and the connect flow rejects the credential
on the spot rather than storing something that can't read. Only `apiKeySecret` is
sealed; both SIDs stay legible in the mask, because telling two subaccount
connections apart is the point of the mask.

> **USD only — you're told at connect time, not at close.** Floe prices and
> reconciles in USD and [never converts currencies](vendor-actuals.md#no-fx-ever).
> If you tell Floe the connection bills in a non-USD currency, the connect flow
> warns you then and there — so a non-USD vendor is a documented limit you accept
> up front, not a surprise `currency_unsupported` finding weeks later. The records
> still capture (with their ISO code); they just land unpriced.

## Related

- [Vendor actuals — reconcile to the vendor's records](vendor-actuals.md) — what these connections feed, leg by leg, with a status per claim.
- [Coverage Score](coverage-score.md) — how much of your spend Floe can act on, a different question from what it cost.
- [Plans & entitlements](../reference/plans.md) — where `vendor_connections` sits.
