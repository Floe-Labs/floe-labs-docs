---
icon: microphone
---

# Voice Stack

Speech-to-text (STT), text-to-speech (TTS), telephony, and realtime (WebRTC) APIs — payable with Floe credit on Base. The voice stack is split into four categories:

* **[STT](#stt-speech-to-text)** — OpenAI (Whisper/Transcribe), Deepgram, AssemblyAI, Sarvam (Saaras), Venice, dTelecom
* **[TTS](#tts-text-to-speech)** — OpenAI (TTS-1), ElevenLabs, Cartesia, Google Cloud TTS, Sarvam (Bulbul), Venice
* **[Telephony](#telephony)** — Floe Phone (US numbers + live voice for agents)
* **[WebRTC](#webrtc)** — OpenAI (GPT Realtime), Google Gemini Live, LiveKit (coming soon)

| Service | Category | Endpoints | Price | Status |
|---------|----------|-----------|-------|--------|
| OpenAI | STT / TTS / WebRTC | Whisper/Transcribe, TTS-1, GPT Realtime | metered | Verified |
| Deepgram | STT | Speech-to-Text | metered / audio-minute | Verified |
| AssemblyAI | STT | Speech-to-Text | metered / audio-second | Verified |
| Sarvam AI | STT / TTS | Saaras STT, Bulbul TTS | metered / char, audio-second | Verified |
| Venice AI | STT / TTS | Transcription, Text to Speech | metered | Verified |
| dTelecom | STT | STT Session | $0.006 / min | Verified |
| ElevenLabs | TTS | Text-to-Speech | metered / character | Verified |
| Cartesia | TTS | Text-to-Speech | metered / character | Verified |
| Google Cloud TTS | TTS | Text-to-Speech | metered / character | Verified |
| Google Gemini Live | WebRTC | Realtime | metered / turn | Verified |
| Floe Phone | Telephony | Numbers, live voice calls | $1.21/mo + per-call usage | Live |
| LiveKit | WebRTC | — | — | Coming soon |

> **Sarvam AI, Deepgram, ElevenLabs, Cartesia, Google Cloud TTS, and AssemblyAI** run through the **[Floe marketplace shim](../developers/marketplace-shim.md)** (`marketplace.floelabs.xyz`) — Floe holds the vendor key, meters the call, and bills your Floe balance. Reach them via `POST /v1/proxy/fetch` with only your Floe key (keyless).
>
> **Floe Phone** is first-party telephony: buy a US number bound to your agent and run live voice calls — carrier minutes, STT, TTS, and (in hosted mode) the LLM leg all itemized on the agent's Floe balance. See **[Floe Phone — Numbers & Voice for Agents](../developers/floe-phone.md)**.

---

## STT (Speech-to-Text)

Transcribe audio to text. OpenAI (`whisper-1`, `gpt-4o-transcribe`) is served on the [Floe Inference](../developers/keyless-inference.md) OpenAI-compatible gateway. Deepgram, AssemblyAI, and Sarvam run through the [marketplace shim](../developers/marketplace-shim.md); Venice and dTelecom are first-party x402 endpoints reached directly through the Floe proxy.

### Venice AI — Transcription

**Endpoint:** `POST https://api.venice.ai/api/v1/audio/transcriptions`
**Price:** metered per minute · Base mainnet · x402 v2

> Transcribe speech to text with Whisper-class models.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/audio/transcriptions", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"whisper-large-v3\",\"file\":\"<base64-encoded-audio>\"}"}'
```

### Sarvam AI — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/sarvam` (via the Floe marketplace shim)
**Price:** metered per audio second · Base mainnet · x402 v2

> Saaras speech-to-text for Indian languages (`saaras:v3`, `saarika:v2.5`). Pass an `audioUrl`; Floe probes the true duration server-side and returns the transcript in `result.text`. ~₹30/hr ≈ $0.36/hr. For speech-in → English-out, use `/v1/stt-translate/sarvam` (`saaras:v2.5`).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/sarvam", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"saaras:v3\",\"audioUrl\":\"https://dpgr.am/spacewalk.wav\",\"language_code\":\"hi-IN\"}"}'
```

### Deepgram — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/deepgram` (via the Floe marketplace shim)
**Price:** metered per audio minute · Base mainnet · x402 v2

> Transcribe audio to text. Pass an `audioUrl`; Floe probes the true duration server-side and bills whole minutes. Optional Deepgram `options` (model, language, …) pass through.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/deepgram", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\",\"options\":{\"model\":\"nova-3\"}}"}'
```

### AssemblyAI — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/assemblyai` (via the Floe marketplace shim)
**Price:** metered per audio second · Base mainnet · x402 v2

> Transcribe audio with AssemblyAI (Universal-3). Pass an `audioUrl`; Floe meters the true duration server-side and returns the transcript in `result.text`. Best for short clips — long audio may exceed the poll timeout.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/assemblyai", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\",\"options\":{\"speech_model\":\"universal-3-pro\"}}"}'
```

### OpenAI — Transcription

**Endpoint:** `POST https://credit-api.floelabs.xyz/v1/audio/transcriptions` (Floe Inference gateway)
**Price:** metered per audio second · Base mainnet

> Whisper-class transcription via the keyless OpenAI-compatible gateway (`whisper-1`, `gpt-4o-transcribe`). No OpenAI key — billed to your Floe balance. See [Floe Inference](../developers/keyless-inference.md).

### dTelecom — Speech-to-Text

**Endpoint:** `POST https://x402.dtelecom.org/v1/stt/session`
**Price:** $0.006 USDC per minute (per-second billing) · Base mainnet · x402 v2

> Start a real-time speech-to-text session over dTelecom's decentralized infrastructure. This is a **two-step, session-based** flow, not a single audio-file call: first **purchase credits** via `POST https://x402.dtelecom.org/v1/credits/purchase` (paid with x402), then open a session with the request below. The session request requires `duration_minutes` (number); `language` is optional (defaults to `en`). dTelecom is a first-party x402 vendor — you reach it directly through the Floe proxy, not the marketplace shim, so pass only your Floe key: the proxy handles the x402 payment and wallet auth.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.dtelecom.org/v1/stt/session", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"duration_minutes\":5,\"language\":\"en\"}"}'
```

---

## TTS (Text-to-Speech)

Synthesize speech from text. OpenAI (`tts-1`) is served on the [Floe Inference](../developers/keyless-inference.md) OpenAI-compatible gateway. ElevenLabs, Cartesia, Google Cloud TTS, and Sarvam run through the [marketplace shim](../developers/marketplace-shim.md) (audio returns base64-encoded in `result.audioBase64`); Venice is a first-party x402 endpoint reached directly through the Floe proxy.

### Venice AI — Text to Speech

**Endpoint:** `POST https://api.venice.ai/api/v1/audio/speech`
**Price:** metered per character · Base mainnet · x402 v2

> Generate natural speech audio from text across multiple voices.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/audio/speech", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"tts-kokoro\",\"input\":\"Payment settled.\",\"voice\":\"af_sky\"}"}'
```

### Sarvam AI — Text to Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/sarvam` (via the Floe marketplace shim)
**Price:** metered per input character · Base mainnet · x402 v2

> Bulbul text-to-speech across 22+ Indian languages (`bulbul:v2`, `bulbul:v3`). Audio returns base64-encoded in `result.audioBase64`. Pass a `target_language_code` (e.g. `hi-IN`). ~₹30/10k chars ≈ $0.36/10k (Sarvam's INR list at ~₹83/$, before Floe's 5% margin).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/sarvam", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"bulbul:v2\",\"text\":\"भुगतान हो गया।\",\"target_language_code\":\"hi-IN\"}"}'
```

### ElevenLabs — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/elevenlabs` (via the Floe marketplace shim)
**Price:** metered per input character · Base mainnet · x402 v2

> Synthesize speech from text. Audio is returned base64-encoded in `result.audioBase64`. Optional `voice` and `model` fields.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/elevenlabs", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"JBFqnCBsd6RMkjVDRZzb\",\"model\":\"eleven_turbo_v2_5\"}"}'
```

### Cartesia — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/cartesia` (via the Floe marketplace shim)
**Price:** metered per input character · Base mainnet · x402 v2

> Low-latency speech synthesis (Sonic). Audio is returned base64-encoded in `result.audioBase64`. Optional `voice` and `model` fields.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/cartesia", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"a0e99841-438c-4a64-b679-ae501e7d6091\",\"model\":\"sonic-2\"}"}'
```

### Google Cloud — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/google` (via the Floe marketplace shim)
**Price:** metered per input character · Base mainnet · x402 v2

> Synthesize speech with Google Cloud TTS (Chirp 3 HD voices). Audio is returned base64-encoded in `result.audioBase64`. Optional `voice` (voice name, e.g. `en-US-Chirp3-HD-Aoede`).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/google", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"en-US-Chirp3-HD-Aoede\"}"}'
```

### OpenAI — Text to Speech

**Endpoint:** `POST https://credit-api.floelabs.xyz/v1/audio/speech` (Floe Inference gateway)
**Price:** metered per character · Base mainnet

> OpenAI `tts-1` (and `tts-1-hd`) via the keyless OpenAI-compatible gateway. No OpenAI key — billed to your Floe balance. See [Floe Inference](../developers/keyless-inference.md).

---

## Telephony

Phone numbers and live voice calls for agents.

### Floe Phone — Numbers & Voice for Agents

**Endpoints:** `POST /v1/developer/agents/{agentId}/numbers` (buy + bind) · `POST /v1/calls` (outbound)
**Price:** $1.21/mo per US number · transport $0.0089/min inbound, $0.0147/min outbound · STT ~$0.0045/min · TTS per character · hosted-mode LLM per token — each leg itemized

> First-party telephony: buy a US local number bound 1:1 to your agent, and run live inbound/outbound voice calls — carrier minutes, transcription, speech synthesis, and (in hosted mode) model tokens all metered as separate line items on the agent's Floe balance, under its existing spend caps. Full endpoint reference, voice modes (hosted vs webhook), and examples: **[Floe Phone — Numbers & Voice for Agents](../developers/floe-phone.md)**.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents/42/numbers \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"areaCode": "415"}'
```

---

## WebRTC

Realtime speech-to-speech over WebSocket / WebRTC, metered per completed turn.

### OpenAI — GPT Realtime

**Endpoint:** `wss://credit-api.floelabs.xyz/v1/realtime?model=openai/gpt-realtime` (Floe Inference gateway)
**Price:** metered per completed turn · Base mainnet

> OpenAI `gpt-realtime` speech-to-speech over the keyless realtime WebSocket. No OpenAI key — billed to your Floe balance. See [Floe Inference](../developers/keyless-inference.md#realtime-voice).

### Google Gemini Live

**Endpoint:** `wss://credit-api.floelabs.xyz/v1/realtime?model=google/gemini-live` (Floe Inference gateway)
**Price:** metered per completed turn · Base mainnet

> Google `gemini-live` realtime speech-to-speech over the keyless realtime WebSocket. No Google key — billed to your Floe balance. See [Floe Inference](../developers/keyless-inference.md#realtime-voice).

### LiveKit — Coming soon

Realtime agent infrastructure (WebRTC transport, agent framework), payable with Floe credit. Not yet live — check the [changelog](../changelog.md) for availability.
