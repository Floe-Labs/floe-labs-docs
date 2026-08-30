---
icon: credit-card
---

# Stripe Connect — bill through your own Stripe

[Client invoicing](invoicing.md) turns a reconciled billing period into a statement. **Stripe Connect** is how you collect on it. You link your **own** Stripe account once, push a closed statement as a Stripe invoice, and Stripe emails your client with your branding, your terms, and your reminder settings. The money is a **direct charge on your account** — payouts land in your Stripe balance, not Floe's. Floe never holds your clients' funds; it hands Stripe a bill and tracks whether it got paid.

> **Plan gate.** Connect and invoicing are **Agency** capabilities (`stripe_connect` and `client_invoicing`), for up to **30 billed clients**. Linking and disconnecting also require an admin (link) or owner (disconnect) acting in a **human dashboard session** — a leaked API key must not be able to re-point where your invoices get paid.

## Link your Stripe account

Connecting is a standard Stripe OAuth round-trip. Start it from an admin dashboard session:

```http
POST /v1/developer/stripe/connect/start
{ "businessName": "Acme Agency" }   // optional; defaults to your account's display name
→ { "url": "https://connect.stripe.com/oauth/authorize?...", "expiresInSeconds": 900 }
```

Send the user to `url`. They approve on Stripe's consent page, and Stripe returns their browser to Floe's callback:

```http
GET /v1/developer/stripe/connect/callback   # Stripe's OAuth return — handled for you
```

The callback is the one route on this surface with no API-key auth: Stripe sends a top-level browser GET, so it reads and validates your dashboard session cookie itself, then redirects back to `…/customers?stripe=connected` (or `?stripe=error&reason=…`). Floe exchanges the single-use authorization `code` for the account link **server-side** and never surfaces it in the URL it redirects you to, or in any API response body.

A few invariants worth knowing:

- **One Stripe account ↔ one Floe account at a time.** Starting a second link while one is active returns `409 already_connected` — disconnect first. A code that resolves to a Stripe account already linked elsewhere is refused and the grant is undone at Stripe.
- **The `state` is single-use and short-lived** (~15 min). A replayed or expired callback is rejected before it ever reaches Stripe.
- Floe stores only your Stripe **account id** (`acct_…`, not a secret). The deprecated OAuth access/refresh tokens are never kept.

## Check status and set terms

```http
GET /v1/developer/stripe/connect        # any role
```

Returns a `ConnectStatus`: whether you're `connected`, the `stripeAccountId`, `livemode`, and the capability flags Stripe reports — `chargesEnabled`, `payoutsEnabled`, `detailsSubmitted`. **`chargesEnabled` is the one that matters**: until Stripe has finished vetting your account it's `false`, and a push will be refused. It also returns the `redirectUri` you must register in your Stripe Connect OAuth settings.

Set your invoice terms — how long clients have to pay, and a footer for the PDF:

```http
PATCH /v1/developer/stripe/connect
{ "daysUntilDue": 14, "invoiceFooter": "Thanks for your business — Acme Agency" }
```

`daysUntilDue` is 1–90 (default 30); `invoiceFooter` is up to 500 characters, or `null` to clear it.

## Push a statement as an invoice

With a closed (or already-issued) statement and a client that has an email:

```http
POST /v1/developer/billing-periods/:id/invoice
→ { period, invoice: { id, status, hostedUrl, pdfUrl, number, totalCents }, alreadyPushed, warnings }
```

The push is a resumable pipeline — every step is persisted before the next, so a crash resumes instead of double-billing:

1. Ensure a Stripe **Customer** on your connected account.
2. Create a **draft invoice** (`send_invoice`, your `daysUntilDue`, your footer).
3. Add **one invoice item per statement line**.
4. **Verify** Stripe's computed total equals the statement's `totalCents` — if it disagrees, the draft is deleted and the push `409`s rather than send a wrong number.
5. **Finalize** — your own Stripe reminder/dunning settings take over.
6. **Send** — Stripe emails the client with your branding.

Only the statement's revenue crosses to Stripe. **No cost or margin ever appears on a Stripe object** — your markup stays on the [margin CSV](invoicing.md#two-csvs-and-which-one-you-send) and nowhere Stripe can render it.

The push is idempotent: once an invoice is finalized, calling it again returns `alreadyPushed: true` with the same invoice. It's rate-limited to **5 pushes per minute per account**. If your account has phone numbers, `warnings` may include `phone_minutes_estimated` — per-minute telephony legs can be under-counted at push time.

### Why some pushes are refused

Stripe does not refuse a $0, negative, or sub-$0.50 invoice — it finalizes it, auto-marks it paid, and pushes the remainder into the client's Stripe credit balance, outside Floe's ledger. So Floe refuses them first, in this order:

| `409` | Meaning |
|---|---|
| `stripe_not_connected` | No active Stripe link — connect first. |
| `connected_account_restricted` | Your Stripe account can't accept charges yet (`chargesEnabled: false`) — finish its setup in Stripe. |
| `period_not_pushable` | The period isn't `closed`/`issued`, or a draft exists on a previously connected account. |
| `customer_email_required` | The client has no email — `PATCH /customers/:id` first. |
| `empty_statement` | No line items. |
| `nonpositive_total` / `total_below_minimum` | Zero, a credit, or under $0.50 — [carry the credit forward](invoicing.md#carry-a-credit-forward) instead. |

## Collection status keeps itself current

Floe subscribes to your connected account's invoice events. When a client pays, or the invoice is voided or marked uncollectible, the matching billing period's status follows — `issued → paid`, `→ void`, `→ uncollectible` — and Floe emits a developer webhook for the transition (`client_invoice.paid`, `.voided`, `.uncollectible` — see the [webhooks catalog](../developers/webhooks.md) for the full set and their scopes). `paid` records when it was collected. The transitions are rank-guarded, so an out-of-order webhook delivery can never regress a period out of a terminal state, and a Stripe "paid" with a zero amount is flagged as an anomaly rather than trusted blindly.

If you delete a draft invoice from your own Stripe Dashboard, Floe notices and makes the period pushable again.

## Disconnect

```http
DELETE /v1/developer/stripe/connect   # owner + human session
```

Unlinking deauthorizes Floe at Stripe (best-effort) and stops every future invoice for the whole account. Revoking Floe from **your** Stripe Dashboard instead has the same effect — the `account.application.deauthorized` webhook marks the link disconnected on Floe's side too. Already-sent invoices are unaffected; they keep collecting in Stripe.

## Related

- [Client invoicing — billing periods & statements](invoicing.md) — build the statement this pushes.
- [Rate cards & the margin engine](rate-cards.md) — how the statement's revenue is priced.
