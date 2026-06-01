---
icon: microphone
---

# Voice

Text-to-speech, transcription, and voice APIs — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Venice AI | Text to Speech, Transcription | metered | Verified |
| Twilio | — | — | Coming soon |
| Deepgram | — | — | Coming soon |

---

## Venice AI — Text to Speech

**Endpoint:** `POST https://api.venice.ai/api/v1/audio/speech`
**Price:** metered per character · Base mainnet · x402

> Generate natural speech audio from text across multiple voices.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/audio/speech", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"tts-kokoro\",\"input\":\"Payment settled.\",\"voice\":\"af_sky\"}"}'
```

## Venice AI — Transcription

**Endpoint:** `POST https://api.venice.ai/api/v1/audio/transcriptions`
**Price:** metered per minute · Base mainnet · x402

> Transcribe speech to text with Whisper-class models.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/audio/transcriptions", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"whisper-large-v3\",\"file\":\"<base64-encoded-audio>\"}"}'
```
