# The Voice Stack

One Floe key pays every leg of a voice conversation — telephony, speech-to-text, LLM, and text-to-speech — and every leg lands in one ledger with one set of budget caps.

## What one conversation costs

A single spoken turn touches four vendors. With Floe, all four bill to the same balance, and one task budget caps the whole turn. Costs below are illustrative.

| Leg | Vendor | Typical cost | Status |
|-----|--------|--------------|--------|
| Telephony | Twilio | ~$0.014 / min | Live |
| Speech-to-Text | Deepgram | ~$0.007 / min | Live |
| Reasoning | LLM (any) | ~$0.020 / turn | Live |
| Text-to-Speech | ElevenLabs | ~$0.007 / turn | Live |
| **Total** | | **~$0.048** | |

## Run a full voice turn

Every leg carries the same `X-Floe-Task-Id: call-8842`, so one task budget covers the whole conversation. Each paid response returns the cost of that leg in `X-Floe-Payment-Amount`.

### 1. Transcribe (Deepgram, via the proxy)

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Floe-Task-Id: call-8842" \
  -d '{"url": "<DEEPGRAM_STT_ENDPOINT>", "method": "POST", "body": "{\"audioUrl\":\"https://example.com/turn.wav\"}"}'
```

### 2. Reason (LLM, OpenAI-compatible)

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/chat/completions \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Floe-Task-Id: call-8842" \
  -d '{"model": "openai/gpt-4o", "messages": [{"role": "user", "content": "Caller asked to reschedule to Friday. Confirm."}]}'
```

Just the Floe key — no OpenAI key. Floe holds the provider credential and bills the tokens to the same balance as the other legs. To keep your own provider key instead, use the BYOK endpoint — see [Add Floe to your existing pipeline](../getting-started/integrate-existing-pipeline.md).

### 3. Speak (ElevenLabs, via the proxy)

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Floe-Task-Id: call-8842" \
  -d '{"url": "<ELEVENLABS_TTS_ENDPOINT>", "method": "POST", "body": "{\"text\":\"You are booked for Friday at 2pm.\"}"}'
```

All three legs share `X-Floe-Task-Id: call-8842`, so a single task budget caps the whole conversation — telephony, STT, LLM, and TTS together. A token router only sees step 2. Floe sees steps 1, 2, and 3 on one bill.

## Live voice vendors

| Service | Endpoints | Status |
|---------|-----------|--------|
| ElevenLabs | Text-to-Speech | Live |
| Deepgram | Speech-to-Text | Live |
| Venice AI | Text-to-Speech, Transcription | Live |
| Cartesia | Text-to-Speech | Live |
| Google Cloud TTS | Text-to-Speech | Live |
| AssemblyAI | Speech-to-Text | Live |
| Twilio | Telephony | Live |

See the [Voice vendor directory](../x402-directory/voice.md) for endpoints, request shapes, and per-vendor pricing.

## Live voice with your own stack (LiveKit / Pipecat)

The turn above is **batch** — each leg is a discrete request/response call. If you're running a **live** conversation with LiveKit or Pipecat, the framework streams audio in and expects an STT plugin that emits `interim`/`final` transcripts as the caller speaks. All three legs run on Floe keyless, on one ledger:

| Leg | On Floe? | How |
|-----|----------|-----|
| **LLM** | Yes — keyless | Point the framework's LLM service `base_url` at `https://credit-api.floelabs.xyz/v1` with your Floe agent key. OpenAI-compatible; metered on Floe. |
| **TTS** | Yes — keyless | Floe's `POST /v1/audio/speech` (OpenAI-compatible), or any vendor via `POST /v1/proxy/fetch`. Metered on Floe. |
| **Live STT** | Yes — keyless | Open a WebSocket to `wss://credit-api.floelabs.xyz/v1/audio/transcriptions/stream?model=deepgram/nova-3&encoding=linear16&sample_rate=16000&language=en` with your Floe agent key. Stream raw PCM frames up; Floe streams `{type:"transcript", text, is_final, speech_final}` events down (`is_final:false` = interim, `true` = final; `speech_final:true` = end of utterance) — the `interim`/`final` feed a LiveKit/Pipecat STT plugin consumes. Metered per audio-second on Floe — Floe fronts the Deepgram key. |

So a live stack is **Floe for the LLM, TTS, and STT legs — keyless, one ledger, one set of budget caps.** See [Floe Inference — streaming transcription](../developers/keyless-inference.md#streaming-transcription-live-stt) for the wire protocol (frame encoding, sample-rate bounds, message shapes).

If you don't need a self-hosted LiveKit/Pipecat pipeline, the keyless **[realtime WebSocket](../developers/keyless-inference.md#realtime-voice)** (`wss://credit-api.floelabs.xyz/v1/realtime?model=<provider/model>`) is a different tool: a **speech-to-speech** model (`openai/gpt-realtime`, `google/gemini-live-3.1`, `xai/grok-voice`) that takes audio in and returns audio out on one connection, metered on Floe. It is **not** a drop-in streaming-STT feed — it won't emit `interim`/`final` transcripts into a LiveKit/Pipecat STT plugin. Reach for it when you want an end-to-end voice model; reach for the streaming-transcription endpoint above when you need the STT leg of a BYO stack.

## One key, one ledger

Because the LLM leg routes through Floe's OpenAI-compatible endpoint, reasoning tokens land on the same ledger and the same budgets as the vendor legs — not a separate provider bill. See [Unified Billing & Ledger](unified-ledger.md) to read the combined statement, and [Spend Controls](../developers/spend-controls.md) to set the task, vendor, and session caps that govern every leg.
