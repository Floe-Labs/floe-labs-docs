---
icon: microphone-lines
---

# Govern your Vapi voice legs with Floe (experimental)

The [Vapi quickstart](vapi.md) governs the **LLM leg** pre-call and reconciles the rest post-call. This page goes one step further: route Vapi's **STT and TTS legs** through Floe too, so the transcriber and voice legs are **metered and gated pre-call on the agent's balance** — not just reconciled after the fact.

Floe implements Vapi's **custom-transcriber** (STT) and **custom-voice** (TTS) server contracts. Vapi streams audio to Floe, Floe fronts the underlying provider on a vaulted key, meters the leg on the agent's Floe balance, and returns the result. The provider keys never touch your assistant.

{% hint style="warning" %}
**Experimental — off by default.** These media-path providers sit behind the server flag `ORCHESTRATOR_VOICE_ENABLED` and stay **off** until a published media-path latency benchmark clears the bar. Routing STT/TTS through Floe adds latency on the media path — see [Honest latency framing](#honest-latency-framing) below. Treat this as a preview, not GA. If the flag is off for your account, the two URLs below return an error and you should keep STT/TTS native on Vapi (governed post-call via [Reconcile Mode](vapi.md#step-2-connect-the-end-of-call-webhook-3-min)).
{% endhint %}

**Prerequisites**

- Everything in the [Vapi quickstart](vapi.md) (agent key + a Vapi assistant you can edit).
- `ORCHESTRATOR_VOICE_ENABLED` on for your account (experimental access).

---

## What it does

Two server endpoints, one on each media leg:

| Leg | Endpoint | What Floe does |
|---|---|---|
| **STT** (transcriber) | `wss://credit-api.floelabs.xyz/v1/orchestrator/transcriber` | Vapi streams **stereo PCM** (channel 0 = customer, channel 1 = assistant). Floe fronts **Deepgram multichannel** on a vaulted key and returns transcripts. Metered per **audio-second**. |
| **TTS** (voice) | `https://credit-api.floelabs.xyz/v1/orchestrator/voice` | Vapi posts the text to speak. Floe fronts **ElevenLabs** on a vaulted key and returns **raw PCM at the requested sample rate**. Metered per **character**. |

Both legs are **pre-call gated**: before the leg runs, Floe checks the agent's balance against the metered cost. If the agent is over budget, the leg **errors instead of running** — you never buy STT/TTS you can't afford. This is stricter than Reconcile Mode (which learns the cost only at call-end); here the transcriber and voice legs are governed on the same pre-call footing as the LLM leg.

---

## Setup

### 1. Bearer credential

Both providers authenticate with the agent's `floe_…` key as a **Bearer credential** — the same key you use for the LLM leg.

In **Vapi**, create a credential holding your `floe_` agent key and attach it to both the custom-transcriber and custom-voice providers. Vapi sends it as `Authorization: Bearer floe_…` on the transcriber WebSocket handshake and on every voice request.

Get a key from the [dashboard](https://dev-dashboard.floelabs.xyz) or `POST /v1/developer/agents/:agentId/keys`.

### 2. Assistant config

Point the transcriber and voice providers at the two Floe URLs:

```json
{
  "transcriber": {
    "provider": "custom-transcriber",
    "server": {
      "url": "wss://credit-api.floelabs.xyz/v1/orchestrator/transcriber"
    }
  },
  "voice": {
    "provider": "custom-voice",
    "server": {
      "url": "https://credit-api.floelabs.xyz/v1/orchestrator/voice"
    }
  }
}
```

- **`transcriber.server.url`** — the `wss://` transcriber endpoint. Vapi opens the socket and streams stereo PCM; Floe returns transcripts multichannel.
- **`voice.server.url`** — the `https://` voice endpoint. Vapi posts the text and the requested sample rate; Floe returns raw PCM at that rate.
- **Auth** — attach the `floe_` Bearer credential to **both** providers (Step 1).

**Verify** → make a test call. The STT and TTS legs now show up on the [ledger](../build/unified-ledger.md) as **pre-call metered rows** attributed to the agent — audio-seconds for the transcriber, characters for the voice — alongside the LLM leg from the [quickstart](vapi.md).

---

## Metering & pre-call gating

- **STT** is metered per **audio-second** of streamed audio.
- **TTS** is metered per **character** of synthesized text.
- Each leg is checked against the agent's Floe balance **before it runs**. Over budget → the leg **errors** (it does not run, and no provider cost is incurred). Combined with a `suspend_agent` [spend policy](../developers/spend-controls.md), a breach on any leg can trip the between-call circuit breaker just like the LLM leg.

This raises the agent's [coverage score](../build/coverage-score.md): with STT and TTS on Floe rails, those legs move from **post-call reconciled** to **pre-call enforceable**. The remaining dark leg on a Vapi call is telephony — move it onto [Floe Phone](../developers/floe-phone.md) to close the gap. Full path: [Graduate to 100% coverage](../build/migrate-to-full-coverage.md).

---

## Honest latency framing

Routing STT/TTS through Floe inserts Floe on the **media path** — audio flows Vapi → Floe → provider and back on every leg. That adds latency versus Vapi calling Deepgram/ElevenLabs directly. This is real, it is measured, and it is why the surface is **flag-gated**: `ORCHESTRATOR_VOICE_ENABLED` stays off until a media-path latency benchmark clears the bar.

We are **not** quoting a latency number here. The benchmark is published separately (coming) — see [Latency & overhead](../build/latency-overhead.md). Until then, treat these providers as a preview for testing the metering/gating behavior, not a production media path.

{% hint style="info" %}
**The honest boundary.** With these providers on, Floe enforces on the **LLM, STT, and TTS legs**; only telephony stays post-call reconciled. Enforcement timing differs by leg: the LLM turn and each TTS utterance are gated **before** they run (over budget → that unit errors, nothing is bought). The STT transcriber is a long-lived stream, so it's gated at the start **and re-checked on a ~60-second checkpoint** — if the balance runs out mid-stream, Floe closes the transcriber leg at that checkpoint. It doesn't reach into an LLM or TTS unit already in flight, and it never silently drops audio: a leg either runs, errors before it starts, or is cleanly closed at a checkpoint.
{% endhint %}

---

## Not available on Retell or Bland

This is a **Vapi-only** capability — by Retell's and Bland's design, not a Floe gap:

- **Retell** — its voice (`voice_id`) and transcriber (`custom_stt_config.provider`) are **built-in providers only**. There is no custom server URL to point at Floe, so STT/TTS can't be routed through Floe on Retell.
- **Bland** — a closed, self-hosted stack with **no custom voice/transcriber hook** at all.

On both platforms you govern voice spend the same way the base quickstarts describe:

- **The model leg** — pre-call, via custom-LLM (**Retell only**, using the [retell-custom-llm recipe](https://github.com/Floe-Labs/floe-cookbook/tree/main/retell-custom-llm)). Bland has no self-serve custom LLM.
- **Everything else** — post-call, via **Reconcile Mode** (end-of-call webhooks). See [Retell](retell.md) and [Bland](bland.md).

Full per-platform detail: [Govern Vapi / Retell / Bland / Pipecat / LiveKit](../build/voice-orchestrators.md).
