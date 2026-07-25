---
icon: tag
---

# Pricing & cost

You pay the vendor's own rate for each call, plus Floe's small fee on the volume that flows through it. No subscription, no minimums, no seat fees. Every call tells you exactly what it cost, and you can price a call **before** you make it.

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

- **LLM / voice models** — `POST /v1/estimate` prices a usage vector (tokens, TTS characters, STT audio-seconds) without touching your balance. See [Floe Inference](../developers/keyless-inference.md#estimate).
- **x402 vendor calls** — `POST /v1/x402/estimate` preflights a URL and returns its USDC cost against your remaining budget in one round-trip.
- **A batch** — `POST /v1/x402/forecast` projects the cost of many planned calls at once, with a per-policy breach check. See [Budget-Aware Routing](../build/budget-aware-routing.md).

## What each vendor costs

Per-model and per-vendor rates live on the vendor pages in the [Vendor Marketplace](../x402-directory/README.md) (Compute, Voice, Image, Search, …). Floe meters at the vendor's rate; the marketplace lists them.

## Next

- [Spend Controls](../developers/spend-controls.md) — cap spend per call / agent / task / vendor
- [Add Floe to your existing pipeline](integrate-existing-pipeline.md)
