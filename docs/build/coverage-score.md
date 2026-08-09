---
icon: gauge
---

# Coverage Score

Every agent in your [dashboard](https://dev-dashboard.floelabs.xyz) carries a **Coverage Score**: the percentage of that agent's known spend Floe can act on, split three ways.

| Bucket | Meaning | Example |
|---|---|---|
| **Enforceable pre-call** | The leg runs through Floe's path, so an over-budget request is denied *before* money moves. | Model calls via the custom-LLM slot; STT/TTS on Floe keys; Floe Phone minutes. |
| **Reconciled** | The cost reaches the ledger at call-end via Reconcile Mode; the circuit breaker acts on the *next* admission. | A Vapi call's cost ingested from the end-of-call webhook. |
| **Dark** | Spend Floe never sees. It counts against nothing and appears nowhere. | A vendor billed on its own account, with no webhook and no Floe key. |

**Coverage = (enforceable + reconciled) ÷ total known spend.** Dark spend is the known-unknown: legs you've told Floe exist but that never report. Spend on vendors Floe has never heard of can't be counted at all — the score is honest about what it can't see.

## Why no platform can compute this

Vapi sees Vapi spend. Retell sees Retell's. On BYOK, platforms report provider costs as $0 because that spend sits on your own vendor bills. The Coverage Score spans **every** execution path an agent uses — which is only computable from a neutral ledger outside all of them.

## How to raise it

The score tells you which leg to move. In order of typical impact:

1. **Connect the end-of-call webhook** ([setup](../developers/webhooks.md#connect-your-orchestrator-reconcile-mode)) — moves in-call platform legs from *dark* to *reconciled* in one paste.
2. **Point the custom-LLM slot at Floe** ([Vapi](../platforms/vapi.md) · [Retell](../platforms/retell.md) · [Bland](../platforms/bland.md)) — moves the model leg (~40% of a cascade bill, ~60%+ realtime) from *reconciled* to *enforceable*.
3. **Move telephony to [Floe Phone](../developers/floe-phone.md)** — enforceable minutes on the same ledger.
4. **STT/TTS via Floe** *(early access — request at [hello@floelabs.xyz](mailto:hello@floelabs.xyz))*.

## Reading the tile

- **"No coverage score yet"** — no webhook connected; Floe only sees spend you route through it. Connect the webhook and the score computes from the next call.
- **"Coverage: 100%"** on a keyless agent — every dollar is gateway-routed and enforceable pre-call. This is the ceiling, not an error.
- **"Computing"** — the first metered calls haven't landed yet.

## API

```
GET /v1/developer/agents/:agentId/coverage?days=30
```

Returns the three-way split (as basis points), per-source attribution, and the window total. Requires a developer key (`floe_live_…`).

## The honest boundary

Floe never intervenes mid-call — a dropped call is a worse failure than an expensive one. Enforcement is **admission control**: pre-call where Floe is in the path; at the next admission point everywhere else (the next inbound call on Vapi/Retell; the next Floe-keyed action on Bland, which exposes no pre-call hook; the cooperative pre-call check on self-hosted stacks). The score exists so that boundary is **visible instead of implied**.

> Pre-call where we're in the path. Circuit breaker everywhere else.
