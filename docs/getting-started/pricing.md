---
icon: tag
---

# Pricing & cost

You pay the vendor's own rate for each call, plus Floe's small fee on the volume that flows through it. Every call tells you exactly what it cost, and you can price a call **before** you make it. The **Free** plan covers usage-based spend with no card and no minimums; paid plans add the reporting, fleet controls, and client-invoicing surfaces on top.

> **Estimate first.** Model a voice agent's cost per call or per minute before you build → [Cost calculator](https://dev-dashboard.floelabs.xyz/calculator).

## Plans

| Plan | Price | Tracked spend / month | History | What it adds |
|---|---|---|---|---|
| **Free** | $0 | up to $2,000 | 7 days | Everything on the runtime path: Floe Inference, the x402 proxy, per-agent budgets and policies, the ledger, webhooks |
| **Pro** | $99/mo or $950/yr | up to $10,000 | 12 months | Attribution reports (cost per client / campaign), fleet-wide policies and the `suspend_agent` hard stop, CSV exports, credit-threshold alerts |
| **Agency** | $499/mo or $4,790/yr | up to $50,000 | unlimited | Rate cards, client invoicing through **your own Stripe account** (Stripe Connect), up to 30 billed clients |
| **Enterprise** | Custom | uncapped | unlimited | Everything, no caps — sales-led |

Manage the plan from the dashboard's [Plan card](https://dev-dashboard.floelabs.xyz/billing) — upgrade, downgrade, cancel, or update a payment method. Billing actions need a signed-in dashboard session; an API key can read the plan but cannot open Checkout or the billing portal (`403 session_required`).

**Tracked spend** is what flows through Floe in a UTC calendar month — the same number the ledger reports. Its plan cap is **soft**: crossing 80% or 100% raises a banner and fires the `billing.usage_threshold` [webhook](../developers/webhooks.md), and nothing is blocked. Agent calls are never declined because of a plan.

**History** is a read window, not a wall. On Free, analytics, ledger, activity, and usage reads are clamped to the last 7 days — the response carries `historyFloor` and `historyClamped` so you can tell a clamp from an empty result. Older data is not deleted; upgrading brings it back.

Feature-gated endpoints answer `403 plan_required` with the plan you need, the plan you're on, and an `upgradeUrl` — see [Error Codes](../reference/error-codes.md#plans-and-billing). Policies created on a higher plan keep enforcing after a downgrade.

## Read what a call cost

Every paid response carries two headers:

| Header | What it is |
|---|---|
| `X-Floe-Payment-Amount` | The call's cost as a decimal USDC string (e.g. `0.0125`) — the human-readable number. |
| `X-Floe-Cost-USDC` | The same cost in raw USDC (6-decimal integer string) — use this for exact math. |

{% tabs %}
{% tab title="TypeScript" %}
```typescript
const res = await fetch("https://credit-api.floelabs.xyz/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${FLOE_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: "openai/gpt-4o", messages }),
});
const cost = res.headers.get("X-Floe-Payment-Amount"); // "0.0125"
```
{% endtab %}
{% tab title="Python" %}
```python
import httpx

res = httpx.post(
    "https://credit-api.floelabs.xyz/v1/chat/completions",
    headers={"Authorization": f"Bearer {FLOE_API_KEY}"},
    json={"model": "openai/gpt-4o", "messages": messages},
)
cost = res.headers["X-Floe-Payment-Amount"]  # "0.0125"
```
{% endtab %}
{% endtabs %}

Tag calls with `X-Floe-Task-Id` and every leg of one conversation rolls into a single per-call cost — the basis for cost per call, per agent, per vendor.

## Price a call *before* you make it

Gate expensive work without spending:

- **LLM / voice models** — `POST /v1/estimate` prices a usage vector (tokens, TTS characters, STT audio-seconds) without touching your balance. See [Floe Inference](../developers/keyless-inference.md#estimate-before-you-spend).
- **x402 vendor calls** — `POST /v1/x402/estimate` preflights a URL and returns its USDC cost against your remaining budget in one round-trip.
- **A batch** — `POST /v1/x402/forecast` projects the cost of many planned calls at once, with a per-policy breach check. See [Budget-Aware Routing](../build/budget-aware-routing.md).

## What each vendor costs

Per-model and per-vendor rates live on the vendor pages in the [Vendor Marketplace](../x402-directory/README.md) (Compute, Voice, Image, Search, …). Floe meters at the vendor's rate; the marketplace lists them.

## Next

- [Spend Controls](../developers/spend-controls.md) — cap spend per call / agent / task / vendor
- [Add Floe to your existing pipeline](integrate-existing-pipeline.md)
