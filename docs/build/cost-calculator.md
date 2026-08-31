---
icon: calculator
---

# The cost calculator

Know what a call will cost **before** you make it. The calculator prices a voice
stack — speech-to-text, LLM, text-to-speech, and telephony — against the same
rate cards the Floe gateway meters real calls against, so the number you see is
the number you'd pay.

Two surfaces share those rate cards:

- **The dashboard calculator** at [dev-dashboard.floelabs.xyz/calculator](https://dev-dashboard.floelabs.xyz/calculator) — public, no login, no key. Model a stack visually.
- **`POST /v1/estimate`** — the API behind the same math. Price an exact usage vector from code, with no balance touched.

## The dashboard calculator

Public and keyless — send anyone the link. Pick one model per leg and the
calculator returns the cost **per minute**, **per call**, and **per month**, with
a breakdown across the four legs of a cascaded pipeline:

| Leg | Metered on |
|---|---|
| **Speech-to-text (STT)** | audio-seconds transcribed |
| **LLM** | input + output tokens |
| **Text-to-speech (TTS)** | characters synthesized |
| **Telephony (Floe Phone)** | inbound / outbound US call minutes + number rental |

Defaults assume a cascaded STT → LLM → TTS pipeline at ~150 spoken words/min with
a ~50% agent talk share. Open **Edit usage assumptions** to tune the token and
character rates per minute, the average call length, and calls per month to match
your own agent. Every price shown is the vendor's own rate — Floe's routing
margin is currently 0%, so there is no markup on top and no other fee.

The estimate is a model of steady-state usage. Actual bills are still metered per
token, audio-second, and character on **every** call — the calculator plans, the
[live cost ledger](unified-ledger.md) records.

## `POST /v1/estimate`

Prices a usage vector exactly, **without making the call or touching your
balance** — use it to gate expensive work at request time. Send it with any Floe key.

Provide only the units the model bills:

| Field | Unit | Applies to |
|---|---|---|
| `input_tokens` / `output_tokens` | text tokens | LLMs |
| `cached_input_tokens` | cached prompt tokens | LLMs with prompt caching |
| `characters` | characters of input | TTS |
| `audio_seconds` | audio-seconds | STT |
| `audio_input_tokens` / `audio_output_tokens` | realtime audio tokens | realtime voice |

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/estimate \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "model": "openai/gpt-4o", "input_tokens": 1200, "output_tokens": 400 }'
```

```json
{
  "model": "openai/gpt-4o",
  "rail": "direct-account",
  "provider": "openai",
  "margin_bps": 500,
  "usage": { "text_input_token": 1200, "text_output_token": 400 },
  "upstream_cost_usdc": "0.007000",
  "cost_usdc": "0.007350",
  "cost_raw": "7350"
}
```

- `upstream_cost_usdc` — the raw upstream cost before Floe's margin.
- `cost_usdc` — what you'd actually be debited (upstream + margin), as a decimal USDC string.
- `cost_raw` — the same figure in atomic USDC (6 decimals), for integer-exact math.
- `rail` / `provider` — which source a real call would route to.

### Keyless-rail pricing only

`/v1/estimate` prices the **keyless rails** — the cheapest source Floe can serve
the model from, at upstream cost plus margin. It mirrors cost-aware routing: it
resolves the model, prices your usage against every source that can serve it, and
returns the **cheapest**.

It does **not** estimate the BYOK rail. Whether a call lands on `byok` depends on
the caller's stored or per-request provider key at request time, and BYOK settles
at a flat per-call service fee instead of a margin over upstream — so it isn't
knowable ahead of the call. See [Model pricing](../developers/models-pricing.md)
for the per-rail pricing fields, and [Floe Inference](../developers/keyless-inference.md#estimate-before-you-spend)
for the rails themselves.

### Errors

| Status | Body `code` | Meaning |
|---|---|---|
| `400` | `invalid_request_error` | Missing or non-string `model`, or an unparseable body. |
| `404` | `unknown_model` | The model doesn't exist or is disabled. |
| `422` | `no_priceable_source` | No source can price the usage vector you gave for that model (e.g. token units against a voice-only model). |

Agents can call the same estimate through the [MCP tool](../developers/mcp-server.md)
`estimate_inference_cost` or the AgentKit action `estimate_inference_cost`.

## Related

- [The live cost ledger](unified-ledger.md) — what your calls actually cost, after the fact.
- [Model pricing — `GET /v1/models?include=pricing`](../developers/models-pricing.md) — per-model, per-rail rates read straight from the API.
- [Pricing & cost](../getting-started/pricing.md) — how Floe prices inference and vendor calls.
