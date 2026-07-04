---
icon: microphone
---

# Voice

Text-to-speech, transcription, and voice APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Venice AI | Text to Speech, Transcription | metered | Verified |
| Deepgram | Speech-to-Text | metered / audio-minute | Verified |
| ElevenLabs | Text-to-Speech | metered / character | Verified |
| Cartesia | Text-to-Speech | metered / character | Verified |
| Google Cloud TTS | Text-to-Speech | metered / character | Verified |
| AssemblyAI | Speech-to-Text | metered / audio-second | Verified |
| Twilio | — | — | Coming soon |

> **Deepgram, ElevenLabs, Cartesia, Google Cloud TTS, and AssemblyAI** run through the **[Floe marketplace shim](../developers/marketplace-shim.md)** (`marketplace.floelabs.xyz`) — Floe holds the vendor key, meters the call, and bills your Floe balance. Reach them via `POST /v1/proxy/fetch` with only your Floe key (keyless).

---

## Venice AI — Text to Speech

**Endpoint:** `POST https://api.venice.ai/api/v1/audio/speech`
**Price:** metered per character · Base mainnet · x402 v2

> Generate natural speech audio from text across multiple voices.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/audio/speech", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"tts-kokoro\",\"input\":\"Payment settled.\",\"voice\":\"af_sky\"}"}'
```

## Venice AI — Transcription

**Endpoint:** `POST https://api.venice.ai/api/v1/audio/transcriptions`
**Price:** metered per minute · Base mainnet · x402 v2

> Transcribe speech to text with Whisper-class models.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/audio/transcriptions", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"whisper-large-v3\",\"file\":\"<base64-encoded-audio>\"}"}'
```

## Deepgram — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/deepgram` (via the Floe marketplace shim)
**Price:** metered per audio minute · Base mainnet · x402 v2

> Transcribe audio to text. Pass an `audioUrl`; Floe probes the true duration server-side and bills whole minutes. Optional Deepgram `options` (model, language, …) pass through.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/deepgram", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\",\"options\":{\"model\":\"nova-3\"}}"}'
```

## ElevenLabs — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/elevenlabs` (via the Floe marketplace shim)
**Price:** metered per input character · Base mainnet · x402 v2

> Synthesize speech from text. Audio is returned base64-encoded in `result.audioBase64`. Optional `voice` and `model` fields.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/elevenlabs", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"JBFqnCBsd6RMkjVDRZzb\",\"model\":\"eleven_turbo_v2_5\"}"}'
```

## Cartesia — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/cartesia` (via the Floe marketplace shim)
**Price:** metered per input character · Base mainnet · x402 v2

> Low-latency speech synthesis (Sonic). Audio is returned base64-encoded in `result.audioBase64`. Optional `voice` and `model` fields.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/cartesia", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"a0e99841-438c-4a64-b679-ae501e7d6091\",\"model\":\"sonic-2\"}"}'
```

## Google Cloud — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/google` (via the Floe marketplace shim)
**Price:** metered per input character · Base mainnet · x402 v2

> Synthesize speech with Google Cloud TTS (Chirp 3 HD voices). Audio is returned base64-encoded in `result.audioBase64`. Optional `voice` (voice name, e.g. `en-US-Chirp3-HD-Aoede`).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/google", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"en-US-Chirp3-HD-Aoede\"}"}'
```

## AssemblyAI — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/assemblyai` (via the Floe marketplace shim)
**Price:** metered per audio second · Base mainnet · x402 v2

> Transcribe audio with AssemblyAI (Universal-3). Pass an `audioUrl`; Floe meters the true duration server-side and returns the transcript in `result.text`. Best for short clips — long audio may exceed the poll timeout.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/assemblyai", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\",\"options\":{\"speech_model\":\"universal-3-pro\"}}"}'
```
