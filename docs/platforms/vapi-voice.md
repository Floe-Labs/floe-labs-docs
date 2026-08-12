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

Both legs are gated **before** the money moves — but the timing differs because one is a request and one is a stream:

- **TTS** is **pre-call gated per utterance**: each voice request checks the balance first, and an over-budget request **errors instead of synthesizing** — nothing is bought.
- **STT** is a long-lived stream, so it's gated **at the start** and **re-checked at ~60-second checkpoints**. If the balance runs out mid-stream, Floe **closes the leg at the next checkpoint** — so the audio already processed up to that cutoff *is* billed (a small, bounded partial interval), but nothing runs past it.

Either way this is stricter than Reconcile Mode (which learns the cost only at call-end): the transcriber and voice legs are governed as they happen, not a session later.

---

## Setup

### 1. Bearer credential

Both providers authenticate with the agent's `floe_…` key as a **Bearer credential** — the same key you use for the LLM leg.

In **Vapi**, create a credential holding your `floe_` agent key and attach it to both the custom-transcriber and custom-voice providers. Vapi sends it as `Authorization: Bearer floe_…` on the transcriber WebSocket handshake and on every voice request.

Get a key from the [dashboard](https://dev-dashboard.floelabs.xyz) or `POST /v1/developer/agents/:agentId/keys`.

{% hint style="warning" %}
**Use a `read_write` key, and keep the blast radius tight.** The voice and transcriber legs are `POST`s that *spend* (they buy Deepgram/ElevenLabs), so the key must be **`read_write`** — a read-only key is rejected on every voice request. Since this key lives inside Vapi's config, bound what a leak can cost: a leaked key is limited by this agent's **wallet balance** and [spend policies](../developers/spend-controls.md) (e.g. a `suspend_agent` cap) — keep those tight, and **rotate** the key to revoke. (A per-key budget caps the model/proxy legs today; it does **not** yet gate the voice media legs — until then, the wallet balance + spend policy are the bound on voice.) Match the credential to the leg: a spending leg gets a `read_write` key; the read-only Bland admission check (see below) gets only a capability token.
{% endhint %}

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

- **STT** is metered per **audio-second** of streamed audio, settled at each ~60-second checkpoint and once more on close.
- **TTS** is metered per **character** of synthesized text, settled per request.
- **TTS** is gated **before each request** — over budget → the request errors and no provider cost is incurred. **STT** is gated at the start and re-checked at each checkpoint; if the balance is exhausted it's cut at the next checkpoint, so only the bounded interval already streamed is billed (never a full call's worth). Combined with a `suspend_agent` [spend policy](../developers/spend-controls.md), a breach on any leg can trip the between-call circuit breaker just like the LLM leg.

This raises the agent's [coverage score](../build/coverage-score.md): with STT and TTS on Floe rails, those legs move from **post-call reconciled** to **pre-call enforceable**. The remaining dark leg on a Vapi call is telephony — move it onto [Floe Phone](../developers/floe-phone.md) to close the gap. Full path: [Graduate to 100% coverage](../build/migrate-to-full-coverage.md).

---

## Honest latency framing

Routing STT/TTS through Floe inserts Floe on the **media path** — audio flows Vapi → Floe → provider and back on every leg. That adds latency versus Vapi calling Deepgram/ElevenLabs directly. This is real, it is measured, and it is why the surface is **flag-gated**: `ORCHESTRATOR_VOICE_ENABLED` stays off until a media-path latency benchmark clears the bar.

We are **not** quoting a latency number here. The benchmark is published separately (coming) — see [Latency & overhead](../build/latency-overhead.md). Until then, treat these providers as a preview for testing the metering/gating behavior, not a production media path.

{% hint style="info" %}
**The honest boundary.** With these providers on, Floe enforces on the **LLM, STT, and TTS legs**; only telephony stays post-call reconciled. Enforcement timing differs by leg: the LLM turn and each TTS utterance are gated **before** they run (over budget → that unit errors, nothing is bought). The STT transcriber is a long-lived stream, so it's gated at the start **and re-checked on a ~60-second checkpoint** — if the balance runs out mid-stream, Floe closes the transcriber leg at that checkpoint. It doesn't reach into an LLM or TTS unit already in flight, and it never silently drops audio: a leg either runs, errors before it starts, or is cleanly closed at a checkpoint.
{% endhint %}

---

## Retell and Bland — a different mechanism

Putting Floe **in the STT/TTS media path** is Vapi-only, because only Vapi exposes custom voice/transcriber server URLs. On Retell and Bland the media legs stay native — but the call is still **governed on Floe**, using each platform's own hooks. This is a different mechanism, not a dead end.

### Retell — governed three ways (all live)

Retell's voice (`voice_id`) and transcriber (`custom_stt_config.provider`) are built-in providers only, so STT/TTS stay native. Everything else routes through Floe:

- **Model leg — pre-call.** Route Retell's custom LLM through Floe (the biggest, most variable cost), using the [retell-custom-llm recipe](https://github.com/Floe-Labs/floe-cookbook/tree/main/retell-custom-llm).
- **Admission — pre-call.** Retell's `call_inbound` webhook lets Floe **reject an over-budget call before it connects** (`{"call_inbound":{"reject":true}}`). Wired automatically when you connect Retell in [Voice orchestrators](../build/voice-orchestrators.md).
- **Reconcile — post-call.** The end-of-call cost lands on the ledger. See [Retell](retell.md).

### Bland — reconcile + a Pathway admission gate

Bland runs a closed self-hosted stack with no custom voice/transcriber hook, so STT/TTS stay native. Govern the call two ways:

- **Reconcile — post-call.** Bland's end-of-call cost lands on the ledger; a breach can suspend the agent for the next call. See [Bland](bland.md).
- **Admission — at call start.** Bland has no native pre-call hook, but its **Pathway Webhook node** does the job: make the first step of your Pathway a Webhook node that calls Floe's admission endpoint, and route to an **End Call** node when the agent is over budget (Bland branches on the response status). This gives Bland real pre-call enforcement, not just after-the-fact accounting.

Full per-platform detail: [Govern Vapi / Retell / Bland / Pipecat / LiveKit](../build/voice-orchestrators.md).
