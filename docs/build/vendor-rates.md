---
icon: tag
---

# Your vendor rates — what you actually pay

Floe ships **public list prices** so a new account can price a call on day one. Almost nobody pays list. Vendor rates let you tell Floe what you *actually* pay — your negotiated Deepgram per-second, your committed-use Twilio per-minute — and every estimate uses your number instead of the published one.

This is the mirror image of a [rate card](rate-cards.md): a rate card is what you **charge** a client, a vendor rate is what you **pay** a vendor. One is revenue, the other COGS, and the difference between them is the margin this product exists to show. They are deliberately never called the same thing.

## An estimate, not an actual

A vendor rate is an **estimate lane**. It never becomes the reconciled cost basis:

- It is never written to the reconciled ledger, never summed into a vendor-cost total, and never used as the basis of a `cost_plus` rate-card rule.
- A [reconciled vendor actual](vendor-actuals.md) — the vendor's own billing record — always supersedes it.
- The gap between your rate and the vendor's record is the **variance**, which is the number worth looking at.

So a rate improves what an estimate says before the vendor publishes anything. It does not claim what a vendor billed.

## What a rate is

One rate is a price for one **vendor + model + leg kind**, in that leg kind's canonical unit. The unit is fixed per leg kind and enforced in the database — a GPU rate declared per hour would be a 3,600× mis-price, so it is simply unstorable:

| Leg kind | Unit |
|---|---|
| `stt` | USD per second |
| `tts` | USD per 1,000 characters |
| `telephony` | USD per minute |
| `avatar` | USD per minute |
| `sms` | USD per segment |
| `ocr` | USD per page |
| `gpu` | USD per GPU-second |

`llm` and `tool` are absent on purpose: token pricing lives in the [gateway model catalog](../developers/models-pricing.md), and a tool call is an opaque per-call price with no unit.

**Rates are decimal strings, never JSON numbers.** `"0.0000416667"` is precisely the scale at which an IEEE double starts drifting, so a rate travels as a string and is stored as an exact integer (`ratePico`, USD × 10¹²). A rate carrying more than **12 decimal places** is refused (`400 invalid_rate`) rather than silently rounded — dropping a digit off a rate is how a bill ends up wrong by a factor nobody can find later. Every read returns both `rate` (the decimal, for display) and `ratePico` (the exact stored value).

## Append-only, like rate cards

Rates are versioned and **append-only**. Changing a price means appending a new version with a later `effectiveFrom`; nothing is ever edited or deleted.

- **The rate in force** is the latest version whose `effectiveFrom` is at or before now — not the highest id. A version dated for next Monday is scheduled, not current.
- **`effectiveFrom` only moves forward** per vendor + model + leg. A back-dated version would retroactively re-price usage that has already been costed, including a closed billing period, so it returns `409 effective_from_regression`. Two versions starting at the same instant return `409 version_exists`.
- **History explains a past figure.** `GET /v1/developer/vendor-rates/history` returns every version for one key, newest first — what a closed period was priced under is the version that was in force at the time.

## Confirmed vs. unconfirmed

A rate **you type** is confirmed by construction. A rate **seeded from a vendor's published price list** is not — it is a list price, and a COGS figure resting on it is a starting point, not a cost. Unconfirmed rates land in a review queue (`unconfirmedCount` on the list response, shown at the top of the dashboard tab).

Confirming is the one mutation an append-only row accepts, and it is one-way: it stamps who accepted the rate and when. Re-confirming is a no-op that answers `alreadyConfirmed: true`, so the audit trail keeps the **first** acceptance. Only confirmed rates are served to [`floe-guard`](#floe-guard-pulls-your-rates).

`sourceUrl` is the public price list a rate came from. A rate with no `sourceUrl` is **unverified** — that is a different claim from a citation, and the dashboard renders it as such.

## The API

All four routes are **Pro** (`vendor_rates`); the two writes also require an **admin** or owner role.

| Endpoint | What it does |
|---|---|
| `GET /v1/developer/vendor-rates` | The rate in force per vendor + model + leg, plus `unconfirmedCount` and the canonical `unitForLegKind` map |
| `POST /v1/developer/vendor-rates` | Append a new version *(admin)* |
| `GET /v1/developer/vendor-rates/history?vendor=&model=&legKind=` | Every version for one key, newest first |
| `POST /v1/developer/vendor-rates/{id}/confirm` | Accept a rate as yours *(admin)* |

```http
POST /v1/developer/vendor-rates
```

```json
{
  "vendor": "deepgram",
  "model": "nova-2",
  "legKind": "stt",
  "rate": "0.0000416667",
  "sourceUrl": "https://deepgram.com/pricing",
  "retrievedAt": "2026-09-01T00:00:00Z",
  "note": "committed-use tier"
}
```

`effectiveFrom` defaults to now, `confirmed` defaults to `true` (the common path is a human entering what they actually pay — pass `false` for a scraped list price so it lands in the review queue). `vendor` and `model` are lowercased. All three of `vendor`, `model` and `legKind` are required on the history read; an unknown leg kind returns `400 unknown_leg_kind` rather than an empty list, which would read identically to "no history".

## floe-guard pulls your rates

[`floe-guard`](https://github.com/Floe-Labs/floe-guard) ships a bundled cost map of public list prices, so a guard with no hosted rates is enforcing a budget against a number its operator never agreed to. With an **agent key** it can pull your own confirmed rates instead:

```http
GET /v1/agents/rates
```

The response is keyed by model, in the same entry shape the open-source package already parses (`mode`, `unit`, `rate`, `provider`, `source_url`, `retrieved_at`, `confirmed`), so a rate round-trips between hosted Floe and the local package without translation. Precedence is stated in the response itself:

> `override > these rates > bundled list price > UnpriceableLegError`

Two fields say what was deliberately **left out** rather than guessed:

- **`conflicts`** — a model that two or more current rates claim (two vendors, or two leg kinds, pricing the same model string). The guard looks a rate up by model alone, so serving one of them would hand it one vendor's price for another vendor's leg with nothing failing. The model is omitted and named instead.
- **`needsConfirmation`** — a model whose version *in force* is still unconfirmed. It is not silently replaced by an older confirmed version, which would enforce against a superseded price.

In both cases the guard falls back to its bundled list price — a figure of known provenance, and one that skews high, so the estimate errs conservative rather than under-stating COGS. A `403 plan_required` behaves the same way: nothing breaks, the guard simply keeps using list prices.

## Plan gate

> **Vendor rates are a Pro capability** (`vendor_rates`), alongside variance — which is exactly estimate-versus-actual. Reads need the entitlement; appending and confirming a rate also need an **admin** or owner role, because declaring what you pay is a billing-policy decision. Rates hold **no vendor credential**: they are the path for an account that has *not* wired a [vendor connection](vendor-connections.md) (Agency), not a paywalled version of one. See [Plans & entitlements](../reference/plans.md).

Manage them in the dashboard at **Vendor charges → Your vendor rates**.

## Related

- [Vendor actuals](vendor-actuals.md) — what the vendor's own records say, which always supersedes a rate.
- [Vendor connections](vendor-connections.md) — the read-only credential that produces those records.
- [Rate cards & the margin engine](rate-cards.md) — the other side: what you charge a client.
- [The cost calculator](cost-calculator.md) — price a call before you make it.
