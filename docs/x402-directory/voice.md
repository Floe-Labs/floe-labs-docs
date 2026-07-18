---
icon: microphone
---

# Voice Stack

Speech-to-text (STT), text-to-speech (TTS), telephony, and realtime (WebRTC) APIs — payable with Floe credit on Base. The voice stack is split into four categories:

* **[STT](#stt-speech-to-text)** — OpenAI (Whisper/Transcribe), Deepgram, AssemblyAI, Sarvam (Saaras), Venice, dTelecom
* **[TTS](#tts-text-to-speech)** — OpenAI (TTS-1), ElevenLabs, Cartesia, Google Cloud TTS, Sarvam (Bulbul), Venice
* **[Telephony](#telephony)** — Twilio (coming soon)
* **[WebRTC](#webrtc)** — OpenAI (GPT Realtime), Google Gemini Live, LiveKit (coming soon)

| Service | Category | Endpoints | Price | Status |
|---------|----------|-----------|-------|--------|
| OpenAI | STT / TTS / WebRTC | Whisper/Transcribe, TTS-1, GPT Realtime | metered | Verified |
| Deepgram | STT | Speech-to-Text | metered / audio-minute | Verified |
| AssemblyAI | STT | Speech-to-Text | metered / audio-second | Verified |
| Sarvam AI | STT / TTS | Saaras STT, Bulbul TTS | metered / char, audio-second | Verified |
| Venice AI | STT / TTS | Transcription, Text to Speech | metered | Verified |
| dTelecom | STT | Speech-to-Text | metered | Verified |
| ElevenLabs | TTS | Text-to-Speech | metered / character | Verified |
| Cartesia | TTS | Text-to-Speech | metered / character | Verified |
| Google Cloud TTS | TTS | Text-to-Speech | metered / character | Verified |
| Google Gemini Live | WebRTC | Realtime | metered / turn | Verified |
| Twilio | Telephony | — | — | Coming soon |
| LiveKit | WebRTC | — | — | Coming soon |

> **Sarvam AI, Deepgram, ElevenLabs, Cartesia, Google Cloud TTS, and AssemblyAI** run through the **[Floe marketplace shim](../developers/marketplace-shim.md)** (`marketplace.floelabs.xyz`) — Floe holds the vendor key, meters the call, and bills your Floe balance. Reach them via `POST /v1/proxy/fetch` with only your Floe key (keyless).

---

## STT (Speech-to-Text)

Transcribe audio to text. OpenAI (`whisper-1`, `gpt-4o-transcribe`) is served on the [Floe Inference](../developers/keyless-inference.md) OpenAI-compatible gateway; the vendors below run through the marketplace shim.

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

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/dtelecom` (via the Floe marketplace shim)
**Price:** metered · Base mainnet · x402 v2

> Transcribe audio to text with dTelecom. Pass an `audioUrl`; Floe meters usage server-side and returns the transcript.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/dtelecom", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\"}"}'
```

---

## TTS (Text-to-Speech)

Synthesize speech from text. OpenAI (`tts-1`) is served on the [Floe Inference](../developers/keyless-inference.md) OpenAI-compatible gateway; the vendors below run through the marketplace shim (audio returns base64-encoded in `result.audioBase64`).

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

Programmable voice and phone-number APIs.

### Twilio — Coming soon

Programmable voice, SMS, and phone numbers, payable with Floe credit. Not yet live — check the [changelog](../changelog.md) for availability.

---

## WebRTC

Realtime speech-to-speech over WebSocket / WebRTC, metered per completed turn.

### OpenAI — GPT Realtime

**Endpoint:** `wss://credit-api.floelabs.xyz/v1/realtime` (Floe Inference gateway)
**Price:** metered per completed turn · Base mainnet

> OpenAI `gpt-realtime` speech-to-speech over the keyless realtime WebSocket. No OpenAI key — billed to your Floe balance. See [Floe Inference](../developers/keyless-inference.md#realtime).

### Google Gemini Live

**Endpoint:** `wss://credit-api.floelabs.xyz/v1/realtime` (Floe Inference gateway, model `gemini-live`)
**Price:** metered per completed turn · Base mainnet

> Google `gemini-live` realtime speech-to-speech over the keyless realtime WebSocket. No Google key — billed to your Floe balance. See [Floe Inference](../developers/keyless-inference.md#realtime).

### LiveKit — Coming soon

Realtime agent infrastructure (WebRTC transport, agent framework), payable with Floe credit. Not yet live — check the [changelog](../changelog.md) for availability.
