---
icon: file-contract
---

# Contracts — what you signed

A [rate card](rate-cards.md) is what is **currently rating** a client's usage. A contract is what you **signed**: the term, the volume the client committed to, and the rate-card version that was on the table when they said yes. Keeping the two apart is the point — *signed vs deployed* is only a real number when the two sides come from two different records.

The contract book answers three questions a rate card cannot: **what term are we in**, **how much of the commitment has this client actually used**, and **which terms have run out with nothing signed to replace them**.

> **Plan gate.** Reading the book needs the **Pro** feature `attribution_reports` (any role). Signing and cancelling need the **Agency** feature `rate_cards` and an **owner/admin** role. Reads stay open after a downgrade, so an account never loses sight of what it already signed.

## One term in force, a full history behind it

A contract is a half-open window `[termStart, termEnd)` for one client. **A renewal is a new contract, never an edit** — rewriting a term in place would silently move every margin figure ever computed under it, including closed [billing periods](invoicing.md) and invoices already issued.

Floe enforces that as **non-overlapping terms**, not as a "one active row" rule:

- A renewal that starts at the exact instant the previous term ends does **not** overlap it — the window is half-open.
- A cancelled term occupies nothing, so cancelling frees its whole period for a re-sign.
- Anything else returns `409 overlapping_term`, naming the term that clashes.

Two fields describe where a contract stands, and they are deliberately different things:

| Field | Values | What it is |
|---|---|---|
| `status` | `active` · `cancelled` | The stored human act. **Never** `expired`. |
| `state` | `scheduled` · `active` · `expired` · `cancelled` | What the contract *is* right now — `status` combined with the clock, derived on every read. |

Expiry is derived rather than stored, so no background job can stop running and leave a finished term looking live.

## Sign a term

```http
POST /v1/developer/contracts
```

```json
{
  "customerId": "acme-corp",
  "termStart": "2026-10-01T00:00:00Z",
  "termEnd": "2027-10-01T00:00:00Z",
  "committedVolume": "10000",
  "committedUnit": "task",
  "signedRateCardVersion": 4,
  "renewalDate": "2027-09-01T00:00:00Z",
  "note": "12-month renewal, signed 2026-09"
}
```

| Field | Notes |
|---|---|
| `customerId` | Required. Lowercased server-side, like every other ledger dimension. |
| `termStart` / `termEnd` | Required ISO timestamps. `termEnd` must be strictly after `termStart` (`400 invalid_term`). |
| `committedVolume` / `committedUnit` | Given **together or not at all** — a volume without a unit has no meaning, a unit without a volume commits to nothing. Volume is integer **text**; for `usd` it is raw 6-decimal USDC. |
| `signedRateCardVersion` | Pins the as-signed card **by version**, not as a scalar rate. Rate cards are append-only, so the reference reproduces the signed pricing exactly and forever — rule structure included. |
| `renewalDate` | Advisory only. Nothing lapses off this date; `termEnd` governs. |
| `note` | Up to 200 characters. |

Returns `201` with the contract. Other failures: `403` (not admin, or the plan lacks `rate_cards`), `409 overlapping_term`, and `409 billed_clients_cap` when the plan's billed-client limit is already reached.

### Commitment units

`audio_minute` · `request` · `task` · `voice_call` · `usd`. The list also ships on every book response as `commitmentUnits`, so a client never hard-codes a second copy.

A commitment is counted **independently of what the rate card meters**. A client can commit to 10,000 `task` while their card bills per `audio_minute`, and that is still measurable: the ledger carries all of these quantities regardless of which one the card charges for.

## Read the book

```http
GET /v1/developer/contracts?customerId=acme-corp&limit=50
```

```json
{
  "contracts": [
    {
      "id": 118,
      "customerId": "acme-corp",
      "termStart": "2026-10-01T00:00:00Z",
      "termEnd": "2027-10-01T00:00:00Z",
      "status": "active",
      "state": "active",
      "committedVolume": "10000",
      "committedUnit": "task",
      "signedRateCardVersion": 4,
      "renewalDate": "2027-09-01T00:00:00Z",
      "consumed": { "quantity": "812", "unit": "task", "isLowerBound": true },
      "note": "12-month renewal, signed 2026-09",
      "createdAt": "2026-09-18T11:04:22Z"
    }
  ],
  "needsRenewalCount": 2,
  "nextCursor": null,
  "commitmentUnits": ["audio_minute", "request", "task", "voice_call", "usd"]
}
```

- **Newest term first**, paged by an opaque keyset `cursor` on `(termStart, id)` — a contract signed mid-page can't shift rows across page boundaries. `limit` is 1–200 (default 50) and is **refused**, not clamped, outside that range (`400 invalid_limit`); a cursor this endpoint didn't issue returns `400 invalid_cursor`.
- `customerId` narrows to one client. Omit it for the whole book — and remember that one page is not the book: follow `nextCursor` before concluding a client has no contract.
- **`needsRenewalCount` is account-wide, not page-wide.** It counts terms that have run out with no successor signed. Terms lapse rather than auto-renew precisely so this number is visible.
- `GET /v1/developer/contracts/{id}` returns one contract. A contract belonging to another account answers `404`, never `403`.

### Consumption — `consumed`

`consumed` says how much of the commitment has been used, **counted in the contract's own unit**, and appears on the list endpoint only.

- **The window is the term, clipped at now.** A running term is measured to date, not against its full-term commitment — otherwise every live contract would look behind.
- **`isLowerBound: true` means the number is a floor.** It is set when metered requests in the window carried no `X-Floe-Task-Id` — the same condition that blocks a period close with [`uncounted_usage`](rate-cards.md#per-task-pricing). Render it as **"at least 812 of 10,000 tasks"**, never a bare "812 of 10,000": presenting a floor as exact is how a client gets told they are behind a commitment they have already met.
- `consumed` is `null` when the contract carries no commitment. Show a dash, never a computed substitute.

## End a term early

```http
POST /v1/developer/contracts/{id}/cancel
```

Cancelling is the **one mutation a contract accepts** — terms themselves are never edited; that is what signing the next one is for. A cancelled term occupies nothing, so the client can be re-signed across that whole period (otherwise a mistyped term would poison the window permanently). Cancelling twice returns `404` rather than restamping a decision already made.

## Margin for the whole book in one request

The signed side is only half of *signed vs deployed*. For the deployed side across every client at once:

```http
GET /v1/developer/customers/margins?days=30
```

See [Rate cards & the margin engine](rate-cards.md#signed-vs-deployed-margin-per-contract) for the response and its `rated` flag.

## Related

- [Rate cards & the margin engine](rate-cards.md) — the deployed side: what is rating this client's usage right now.
- [Client invoicing — billing periods & statements](invoicing.md) — turn a priced term into a statement you can send.
- [Cost per client, campaign & task](attribution.md) — the tags every commitment is counted from.
