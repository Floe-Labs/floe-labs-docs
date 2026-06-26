---
icon: microphone
---

# Voice

Text-to-speech, transcription, and voice APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Venice AI | Text to Speech, Transcription | metered | Verified |
| Deepgram | Speech to Text | metered per audio-minute | Verified |
| Twilio | — | — | Coming soon |

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

---

## Deepgram — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/deepgram`
**Price:** metered per audio-minute · Base mainnet · billed via the Floe marketplace shim

> Transcribe audio from a URL with Deepgram's speech-to-text models. Deepgram is a non-x402 vendor re-exposed as a Floe endpoint by the [marketplace shim](../developers/marketplace-shim.md) — you call it through the proxy with your Floe key, and the shim meters the call per audio-minute and debits your credit line. No Deepgram account or key required.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/deepgram", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://example.com/call-recording.mp3\"}"}'
```

Pass optional model and language hints under `options`:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/deepgram", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://example.com/call-recording.mp3\",\"options\":{\"model\":\"nova-3\",\"language\":\"en\"}}"}'
```
