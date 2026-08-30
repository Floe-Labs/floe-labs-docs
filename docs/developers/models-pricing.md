---
icon: tags
---

# Model pricing — `GET /v1/models?include=pricing`

Discover every model on the Floe gateway and, **opt-in**, its price on each rail —
straight from the API, no rate card to keep in sync. Same catalog the
[cost calculator](../build/cost-calculator.md) and `POST /v1/estimate` price
against.

Send any Floe key (agent or developer).

## `GET /v1/models` — discovery

Without `?include=pricing`, the response is the byte-for-byte **OpenAI-lean**
model list. Many callers hit this only to enumerate ids, and it stays a drop-in
for the OpenAI `models.list` shape:

```bash
curl https://credit-api.floelabs.xyz/v1/models \
  -H "Authorization: Bearer $FLOE_KEY"
```

```json
{
  "object": "list",
  "data": [
    {
      "id": "openai/gpt-4o-mini",
      "object": "model",
      "created": 1719792000,
      "owned_by": "floe",
      "modality": "text",
      "context_window": 128000
    }
  ]
}
```

Model ids are `provider/model` (e.g. `openai/gpt-4o-mini`, `deepgram/nova-3`).
`modality` and `context_window` are Floe additions on top of the required OpenAI
fields; adding `?include=pricing` never changes these base fields — it only
**adds** a `pricing` block.

## `?include=pricing` — per-rail rates

```bash
curl "https://credit-api.floelabs.xyz/v1/models?include=pricing" \
  -H "Authorization: Bearer $FLOE_KEY"
```

```json
{
  "object": "list",
  "data": [
    {
      "id": "openai/gpt-4o-mini",
      "object": "model",
      "created": 1719792000,
      "owned_by": "floe",
      "modality": "text",
      "context_window": 128000,
      "pricing": {
        "unit": "per_1m_tokens",
        "currency": "usdc",
        "funded": {
          "input": "0.157500",
          "output": "0.630000",
          "cached_input": "0.078750"
        },
        "byok": {
          "service_fee_usdc": "0.000200",
          "upstream": "at_vendor_rate"
        }
      }
    }
  ]
}
```

Pricing is **asymmetric by rail**, on purpose:

### Funded (keyless) rail

Floe holds the upstream provider key, so the price is **per model** — the model's
catalog rate card (upstream + Floe margin), computed the exact same way
`POST /v1/estimate` prices a call: the cost-aware cheapest source, with that
source's margin.

| Field | Meaning |
|---|---|
| `unit` | Always `per_1m_tokens` — rates are per 1,000,000 tokens. |
| `currency` | Always `usdc`. |
| `funded.input` | USDC per 1M input tokens. |
| `funded.output` | USDC per 1M output tokens. |
| `funded.cached_input` | USDC per 1M cached-prompt tokens, or `null` if the chosen source seeds no explicit cached rate. |

Non-token models — voice (TTS/STT), embeddings, telephony — return `null` for
every `funded` field rather than a fabricated per-token price. Estimate those by
their real unit (characters, audio-seconds) via
[`POST /v1/estimate`](../build/cost-calculator.md#post-v1estimate).

### BYOK rail

On the `byok` rail the caller brings their own vendor key, so Floe charges a
**flat, model-agnostic per-call service fee** (`service_fee_usdc`) and you pay your
vendor at cost — Floe never sees that upstream rate, so it can't and doesn't price
it (`upstream: "at_vendor_rate"`). The `byok` block is therefore **identical
across every model**.

## Notes

- **The default response is unchanged.** `?include=pricing` is purely additive —
  omit it and you get the same OpenAI-lean list you always did.
- All money is a decimal USDC string at 6 decimals (e.g. `"0.157500"`), so
  sub-cent per-token rates stay exact — no floats.
- Prices reflect the live catalog; Floe's default margin is 5%. The values above
  are illustrative — read the live endpoint for current rates.

## Related

- [The cost calculator](../build/cost-calculator.md) — price a whole call or a usage vector before you run it.
- [Floe Inference — keyless LLM & voice](keyless-inference.md) — the rails these prices belong to, and how routing picks one.
