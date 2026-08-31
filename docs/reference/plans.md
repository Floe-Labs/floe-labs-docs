---
icon: table-list
---

# Plans & entitlements

Floe's free tier answers the first question every voice-AI team has — **what did this call actually cost?** — with no card and no commitment. The paid tiers are about what you do with that answer: attribute it, protect margin on it, and bill your own clients from it.

These plans price the **finance layer** only. Metering and paying for calls through Floe's rails stays **pay-as-you-go on every tier**, Free included — the monthly price buys the attribution, margin, and invoicing features, not the ability to move money. See [Pricing & cost](../getting-started/pricing.md) for the per-call model.

Every gate below is enforced server-side. Tracked-spend caps are **soft** (a banner + alert, never a hard stop on the agent path); history is a **read clamp**, not a lock-out. Everything else is a hard entitlement.

| | **Free** | **Pro** | **Agency** | **Enterprise** |
|---|---|---|---|---|
| Price | $0 | $99/mo · $950/yr | $499/mo · $4,790/yr | custom |
| Tracked spend / mo (soft) | up to $2,000 | up to $10,000 | up to $50,000 | no cap |
| Ledger history | 7 days | 365 days | unlimited | unlimited |
| Billed end-clients | — | — | up to 30 | unlimited |

## What each plan unlocks

### Free — know what every call costs

The live cost ledger and the honest number behind every leg, with no account friction:

- **Live cost ledger** — per-leg and by-call cost (`ledger_read`). See [The live cost ledger](../build/unified-ledger.md). *(Reconciling those legs to a vendor's own billing records needs an Agency vendor connection — see below.)*
- **Reconciliation findings** (read) — where a number is still an estimate, and why.
- **Coverage Score** — how much of your spend Floe can act on. See [Coverage Score](../build/coverage-score.md).
- **The cost calculator** — price a call before you make it. See [The cost calculator](../build/cost-calculator.md).
- **Metering on every rail** — keyless and BYOK gateway calls land on the ledger.

### Pro — attribute it and watch it

Everything in Free, plus the tools to turn cost into a per-client, per-campaign picture:

- **Attribution reports** (`attribution_reports`) — cost rolled up per **client, campaign, and task**. See [Cost per client, campaign & task](../build/attribution.md).
- **CSV exports** (`exports`) — the usage bill, statements, and margin as CSV.
- **Alerts** (`alerts`) — credit-threshold notifications.
- **Fleet policies** (`fleet_policies`) — developer-scope budgets and suspend-agent hard stops.

### Agency — bill your own clients from the actuals

Everything in Pro, plus the margin engine and invoicing:

- **Rate cards & margin engine** (`rate_cards`) — set what you bill each client, preview margin, and see signed-vs-deployed per contract. See [Rate cards & the margin engine](../build/rate-cards.md).
- **Client invoicing** (`client_invoicing`) — billing periods and statements. See [Client invoicing](../build/invoicing.md).
- **Stripe Connect** (`stripe_connect`) — invoice through your **own** Stripe; payouts land in your account, up to 30 billed clients. See [Stripe Connect](../build/stripe-connect.md).
- **Vendor actuals & connections** (`vendor_connections`) — hand Floe read-only vendor billing access so it reconciles your legs to the vendor's **own** records. **USD only** — Floe prices and reconciles in USD and never converts currencies; a vendor whose billing is non-USD keeps its ISO code and lands unpriced (a `currency_unsupported` finding), by design, not FX support pending. See [Vendor connections](../build/vendor-connections.md) and [Vendor actuals — no FX, ever](../build/vendor-actuals.md#no-fx-ever).

### Enterprise — no caps, sales-led

Everything in Agency with no tracked-spend, history, or client caps, priced at **0.75% of ledgered spend** via a metered plan. [Talk to us](https://floelabs.xyz).

## The entitlements, in one place

| Entitlement | Plan | Unlocks |
|---|---|---|
| `ledger_read` | Free | Per-leg + by-call ledger, findings, coverage score |
| `attribution_reports` | Pro | Cost per client / campaign / task |
| `exports` | Pro | CSV exports (bill, statement, margin) |
| `alerts` | Pro | Credit-threshold alerts |
| `fleet_policies` | Pro | Developer-scope budgets + suspend-agent |
| `rate_cards` | Agency | Rate cards, margin, signed-vs-deployed |
| `client_invoicing` | Agency | Billing periods + statements |
| `stripe_connect` | Agency | Invoice via your own Stripe |
| `vendor_connections` | Agency | Vendor billing reconciliation |

For the per-call cost model (what a call itself costs to run on Floe), see [Pricing & cost](../getting-started/pricing.md).
