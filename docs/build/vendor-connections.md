---
icon: plug
---

# Vendor connections

Hand Floe **read-only** billing access to a vendor, and it reconciles your legs
against that vendor's **own** cost records. A vendor connection is the credential
that makes [Vendor actuals](vendor-actuals.md) real: without one, a BYOK leg
carries only Floe's service fee and the vendor bills you off-ledger; with one, a
connector pulls the vendor's billing record and a reconcile pass stamps each leg
with the precision that record supports.

> **Read-only, and separate from the keys that route traffic.** A billing
> credential reads your whole vendor invoice — it never writes to your vendor
> account, never rotates your keys, and is not the key that serves your calls.
> Floe seals it at rest; no read path ever returns the secret, only a mask.

## Plan gate

Vendor connections are an **Agency** capability — the whole group, reads
included, is gated on the `vendor_connections` entitlement. That is deliberately
stricter than the [Vendor actuals](vendor-actuals.md) *reads*, which ride Pro's
cost-attribution entitlement: a Pro agency already pays for attribution and
shouldn't find its cost column paywalled. What Agency buys is the
credential-holding, money-asserting half. See [Plans & entitlements](../reference/plans.md).

Within an Agency account, **writes require the `admin` role** — creating,
re-keying, patching, deleting, or verifying a connection. A member can read the
masked list but cannot install a credential.

## Which vendors have connectors

You can only create a connection for a vendor Floe has a billing connector for.
Each connector declares the **best status** a leg it serves can ever reach —
the ceiling in the [Vendor actuals status table](vendor-actuals.md#a-cost-is-a-claim):

| Vendor | Best status | How the cost is sourced |
|---|---|---|
| Twilio | `exact` | Per-call price on the CallSid the ledger holds |
| Telnyx | `exact` | Per-CDR cost on the call leg id |
| Deepgram | `exact` | Per-request USD on `details.usd` |
| OpenAI | `period-rate` | Daily cost by line item ÷ daily usage by model |
| Anthropic | `period-rate` | Daily cost report ÷ daily usage report |
| AWS Bedrock | `period-rate` | Hourly Cost and Usage Report row (cost + units) |
| Google Cloud (Vertex) | `period-rate` | Hourly BigQuery billing-export row (cost + units) |
| Azure | `period-rate` | Daily Cost Management row (cost + units) |
| ElevenLabs | `manual` | Credits, no cost API — invoice lane only |
| Cartesia | `manual` | Credits, no cost API — invoice lane only |
| AssemblyAI · Rime · Sarvam | `manual` | No billing API — invoice lane only |

A `manual`-ceiling vendor is still worth connecting for identity and settings,
but its costs come through the **invoice lane** (upload the vendor's invoice and
foot it), not an API pull. Creating a connection for a vendor with **no**
connector is refused at write time — a credential that can never pull anything is
not an honest thing to store.

## Add a connection

`POST /v1/developer/vendor-connections` (admin). Supply the vendor, an operator
label (`name`, unique within your account per vendor — two Twilio subaccounts are
two rows), the credential `kind`, and the credential fields that kind declares.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/vendor-connections \
  -H "Authorization: Bearer $FLOE_DEV_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "twilio",
    "name": "prod-subaccount",
    "kind": "twilio_api_key",
    "credential": { "...": "..." },
    "billingTimeZone": "America/New_York"
  }'
```

The response is the **masked** connection — identifiers (region, project id,
account SID) are shown verbatim so you can tell which of two subaccounts a row is;
secrets are elided, key material shows only a length. The sealed credential never
leaves the server.

Don't hardcode the form. The list endpoint returns `credentialFields` (which
fields each `kind` needs) and `connectors` (which vendors are connectable, their
best status, and whether they need a billing timezone) — render the form from
those so a billing credential never gets pasted into the wrong shape.

**Timezone.** Some vendors (e.g. Twilio) cut their daily billing buckets in a
local zone that no API exposes, so you must supply `billingTimeZone` as an IANA
zone — the zone the **vendor** bills in, not yours. A bad zone is a permanent
silent coverage gap, so it's rejected at write time rather than degraded to UTC.

Optional tuning: `freshnessSlaMinutes`, `actualsSlaHours`, and `captureSince`
(the point in time to start pulling costs from).

### Re-keying

Rotating a credential goes back through `POST` with the same `(vendor, name)`.
The upsert re-seals the new secret, re-derives the mask, clears any
"unreadable" flag and the failure counter, re-arms a disabled row, and resets
status to **unverified** — the old scope check said nothing about the new key, so
the connection must be verified again before anything trusts it.

## Verify a connection

`POST /v1/developer/vendor-connections/:id/verify` (admin) calls the vendor with
the stored credential and records what happened. This is the only route that opens
the sealed box. Outcomes:

- **`ok`** → status `active`; the response carries any facts the connector
  discovered (project ids, subaccounts, workspaces) — never credential material.
- **`verification_failed`** (409) → the vendor refused the credential. If the
  reason is `unauthorized` / `forbidden_scope`, re-key with a credential that has
  billing read scope; anything else is recorded as `degraded` for ops to look at.
- **`verification_unavailable`** (502) → couldn't reach the vendor. The credential
  is unchanged; retry when the vendor is reachable.
- **`sealed_key_unavailable`** / **`sealed_credential_integrity`** (409) → the
  stored credential can't be decrypted. These are kept distinct on purpose: the
  first means the encryption secret was rotated without resealing (recoverable),
  the second means the stored row was modified (investigate — do not reseal).

A hung billing API can't hold the request open — verify aborts after 15 seconds
and records a degraded pass.

## Manage & remove

- `GET /v1/developer/vendor-connections` — list, each row masked, plus the form catalog.
- `GET /v1/developer/vendor-connections/:id` — one connection, masked.
- `PATCH /v1/developer/vendor-connections/:id` (admin) — enable/disable and the
  non-secret settings (timezone, SLAs, `captureSince`). Credential material is
  **not** accepted here — re-keying is `POST`, so the mask, seal, and verification
  reset always move together. Changing the timezone resets verification.
- `DELETE /v1/developer/vendor-connections/:id` (admin) — a **soft** delete
  (disable + drop the sync lease). There is no hard delete: the actuals and stamps
  the connection already produced stay exactly as written — they're append-only
  and the dollars were real. What stops is the pull; legs it would have resolved
  now stay `pending`.

## Related

- [Vendor actuals — reconcile to the vendor's records](vendor-actuals.md) — what these connections feed, leg by leg, with a status per claim.
- [Coverage Score](coverage-score.md) — how much of your spend Floe can act on, a different question from what it cost.
- [Plans & entitlements](../reference/plans.md) — where `vendor_connections` sits.
