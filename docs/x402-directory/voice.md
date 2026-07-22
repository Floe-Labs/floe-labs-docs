---
icon: microphone
---

# Voice Stack

Speech-to-text (STT), text-to-speech (TTS), telephony, and realtime (WebRTC) APIs — payable with Floe credit on Base. The voice stack is split into four categories:

* **[STT](#stt-speech-to-text)** — OpenAI (Whisper/Transcribe), Deepgram, AssemblyAI, ElevenLabs (Scribe v2), Cartesia (Ink-Whisper), Speechmatics, Azure, xAI, Sarvam (Saaras), Venice, dTelecom
* **[TTS](#tts-text-to-speech)** — OpenAI (TTS-1), ElevenLabs, Cartesia, Deepgram (Aura-2), Hume, Rime, Inworld, MiniMax, Azure, Amazon Polly, xAI, Google Cloud TTS, Sarvam (Bulbul), Venice
* **[Telephony](#telephony)** — Floe Phone (US numbers + live voice for agents)
* **[WebRTC](#webrtc)** — OpenAI (GPT Realtime), Google Gemini Live, xAI Grok Voice, Amazon Nova 2 Sonic (coming soon), LiveKit (coming soon)

| Service | Category | Endpoints | Price | Status |
|---------|----------|-----------|-------|--------|
| OpenAI | STT / TTS / WebRTC | Whisper/Transcribe, TTS-1, GPT Realtime | metered | Verified |
| Deepgram | STT / TTS | Speech-to-Text, Aura-2 TTS | metered / audio-minute, char | Verified |
| AssemblyAI | STT | Speech-to-Text | metered / audio-second | Verified |
| Sarvam AI | STT / TTS | Saaras STT, Bulbul TTS | metered / char, audio-second | Verified |
| Venice AI | STT / TTS | Transcription, Text to Speech | metered | Verified |
| dTelecom | STT | STT Session | $0.006 / min | Verified |
| ElevenLabs | TTS / STT | Text-to-Speech, Scribe v2 STT | metered / character, audio-second | Verified |
| Cartesia | TTS / STT | Sonic-3 TTS, Ink-Whisper STT | metered / character, audio-second | Verified |
| Google Cloud TTS | TTS | Text-to-Speech | metered / character | Verified |
| Google Gemini Live | WebRTC | Realtime | metered / turn | Verified |
| xAI Grok Voice | WebRTC | Realtime voice agent | metered / minute | Verified |
| Amazon Nova 2 Sonic | WebRTC | Bidirectional realtime | — | Coming soon |
| Hume AI | TTS | Octave 2 | metered / character | Verified |
| Rime | TTS | coda | metered / character | Verified |
| Inworld AI | TTS | TTS-2 | metered / character | Verified |
| MiniMax | TTS | speech-2.8 | metered / character | Verified |
| Azure AI Speech | TTS / STT | Neural TTS, fast transcription | metered / character, audio-second | Verified |
| Amazon Polly | TTS | Neural / generative | metered / character | Verified |
| xAI | TTS / STT | Grok voice APIs | metered / character, audio-second | Verified |
| Speechmatics | STT | melia-1 | metered / audio-second | Verified |
| Floe Phone | Telephony | Numbers, live voice calls | $2/mo + per-call usage | Live |
| LiveKit | WebRTC | — | — | Coming soon |

> **Sarvam AI, Deepgram, ElevenLabs, Cartesia, Google Cloud TTS, AssemblyAI, Hume AI, Rime, Inworld AI, MiniMax, Azure AI Speech, Amazon Polly, xAI, and Speechmatics** run through the **[Floe marketplace shim](../developers/marketplace-shim.md)** (`marketplace.floelabs.xyz`) — Floe holds the vendor key, meters the call, and bills your Floe balance. Reach them via `POST /v1/proxy/fetch` with only your Floe key (keyless). All shim prices below are the vendor's list rate, before Floe's 5% margin.
>
> **Floe Phone** is first-party telephony: buy a US number bound to your agent and run live voice calls — carrier minutes, STT, TTS, and (in hosted mode) the LLM leg all itemized on the agent's Floe balance. See **[Floe Phone — Numbers & Voice for Agents](../developers/floe-phone.md)**.

---

Some vendors price and charge calls themselves (no Floe-held key) — see [Direct voice services](#direct-voice-services) below.

## STT (Speech-to-Text)

### Venice AI — Transcription

**Endpoint:** `POST https://api.venice.ai/api/v1/audio/transcriptions`
**Price:** metered per minute

> Transcribe speech to text with Whisper-class models.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/audio/transcriptions", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"whisper-large-v3\",\"file\":\"<base64-encoded-audio>\"}"}'
```

### Sarvam AI — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/sarvam` (via the Floe marketplace shim)
**Price:** metered per audio second

> Saaras speech-to-text for Indian languages (`saaras:v3`, `saarika:v2.5`). Pass an `audioUrl`; Floe probes the true duration server-side and returns the transcript in `result.text`. ~₹30/hr ≈ $0.36/hr. For speech-in → English-out, use `/v1/stt-translate/sarvam` (`saaras:v2.5`).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/sarvam", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"saaras:v3\",\"audioUrl\":\"https://dpgr.am/spacewalk.wav\",\"language_code\":\"hi-IN\"}"}'
```

### Deepgram — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/deepgram` (via the Floe marketplace shim)
**Price:** metered per audio minute

> Transcribe audio to text. Pass an `audioUrl`; Floe probes the true duration server-side and bills whole minutes. Optional Deepgram `options` (model, language, …) pass through.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/deepgram", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\",\"options\":{\"model\":\"nova-3\"}}"}'
```

### AssemblyAI — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/assemblyai` (via the Floe marketplace shim)
**Price:** metered per audio second

> Transcribe audio with AssemblyAI (Universal-3.5). Pass an `audioUrl`; Floe meters the true duration server-side and returns the transcript in `result.text`. Best for short clips — long audio may exceed the poll timeout.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/assemblyai", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\",\"options\":{\"speech_models\":[\"universal-3-5-pro\"]}}"}'
```

### OpenAI — Transcription

**Endpoint:** `POST https://credit-api.floelabs.xyz/v1/audio/transcriptions` (Floe Inference gateway)
**Price:** metered per audio second · Base mainnet

> Whisper-class transcription via the keyless OpenAI-compatible gateway (`whisper-1`, `gpt-4o-transcribe`). No OpenAI key — billed to your Floe balance. See [Floe Inference](../developers/keyless-inference.md).

### ElevenLabs — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/elevenlabs` (via the Floe marketplace shim)
**Price:** metered per audio second

> Transcribe audio with Scribe v2. Pass an `audioUrl`; Floe meters the true duration server-side and returns the transcript in `result.text`. $0.22/hr (ElevenLabs list, before Floe's 5% margin).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/elevenlabs", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\"}"}'
```

### Cartesia — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/cartesia` (via the Floe marketplace shim)
**Price:** metered per audio second

> Transcribe audio with Ink-Whisper. Pass an `audioUrl`; Floe meters the true duration server-side and returns the transcript in `result.text`. ~$0.135/hr (Cartesia list, before Floe's 5% margin).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/cartesia", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\"}"}'
```

### Azure AI Speech — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/azure` (via the Floe marketplace shim)
**Price:** metered per audio second

> Azure fast transcription. Pass an `audioUrl`; Floe meters the true duration server-side and returns the transcript in `result.text`. $0.36/hr (Azure list, before Floe's 5% margin).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/azure", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\"}"}'
```

### xAI — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/xai` (via the Floe marketplace shim)
**Price:** metered per audio second

> Transcribe audio with xAI STT. Pass an `audioUrl` (files up to 500 MB); Floe meters the true duration server-side and returns the transcript in `result.text`. $0.10/hr (xAI list, before Floe's 5% margin).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/xai", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\"}"}'
```

### Speechmatics — Speech-to-Text

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/speechmatics` (via the Floe marketplace shim)
**Price:** metered per audio second

> Transcribe audio with Speechmatics (`melia-1`). Pass an `audioUrl`; Floe meters the true duration server-side and returns the transcript in `result.text`. $0.24/hr (Speechmatics list, before Floe's 5% margin).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/speechmatics", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"audioUrl\":\"https://dpgr.am/spacewalk.wav\"}"}'
```

---

### dTelecom — Speech-to-Text

**Endpoint:** `POST https://x402.dtelecom.org/v1/stt/session`
**Price:** $0.006 USDC per minute (per-second billing)

> Start a real-time speech-to-text session over dTelecom's decentralized infrastructure. This is a **two-step, session-based** flow, not a single audio-file call: first **purchase credits** via `POST https://x402.dtelecom.org/v1/credits/purchase` (charged to your Floe balance), then open a session with the request below. The session request requires `duration_minutes` (number); `language` is optional (defaults to `en`). dTelecom is a direct vendor — you reach it through the Floe proxy, not the marketplace shim, so pass only your Floe key: the proxy handles payment and wallet auth.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.dtelecom.org/v1/stt/session", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"duration_minutes\":5,\"language\":\"en\"}"}'
```

---

## TTS (Text-to-Speech)

### Venice AI — Text to Speech

**Endpoint:** `POST https://api.venice.ai/api/v1/audio/speech`
**Price:** metered per character

> Generate natural speech audio from text across multiple voices.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/audio/speech", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"tts-kokoro\",\"input\":\"Payment settled.\",\"voice\":\"af_sky\"}"}'
```

### Sarvam AI — Text to Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/sarvam` (via the Floe marketplace shim)
**Price:** metered per input character

> Bulbul text-to-speech across 22+ Indian languages (`bulbul:v2`, `bulbul:v3`). Audio returns base64-encoded in `result.audioBase64`. Pass a `target_language_code` (e.g. `hi-IN`). ~₹30/10k chars ≈ $0.36/10k (Sarvam's INR list at ~₹83/$, before Floe's 5% margin).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/sarvam", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"bulbul:v2\",\"text\":\"भुगतान हो गया।\",\"target_language_code\":\"hi-IN\"}"}'
```

### ElevenLabs — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/elevenlabs` (via the Floe marketplace shim)
**Price:** metered per input character

> Synthesize speech from text. Default model is `eleven_flash_v2_5` at $0.05/1K chars (ElevenLabs list, before Floe's 5% margin); the Eleven v3 tier is available at $0.10/1K. Audio is returned base64-encoded in `result.audioBase64`. Optional `voice` and `model` fields.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/elevenlabs", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"JBFqnCBsd6RMkjVDRZzb\",\"model\":\"eleven_flash_v2_5\"}"}'
```

### Cartesia — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/cartesia` (via the Floe marketplace shim)
**Price:** metered per input character

> Low-latency speech synthesis (default model `sonic-3`). Audio is returned base64-encoded in `result.audioBase64`. Optional `voice` and `model` fields.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/cartesia", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"a0e99841-438c-4a64-b679-ae501e7d6091\",\"model\":\"sonic-3\"}"}'
```

### Deepgram — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/deepgram` (via the Floe marketplace shim)
**Price:** metered per input character

> Aura-2 speech synthesis (default `aura-2-thalia-en`). $0.030/1K chars (Deepgram list, before Floe's 5% margin). Up to 2,000 characters per request. Audio returns base64-encoded in `result.audioBase64`.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/deepgram", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"model\":\"aura-2-thalia-en\"}"}'
```

### Google Cloud — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/google` (via the Floe marketplace shim)
**Price:** metered per input character

> Synthesize speech with Google Cloud TTS (Chirp 3 HD voices). Audio is returned base64-encoded in `result.audioBase64`. Optional `voice` (voice name, e.g. `en-US-Chirp3-HD-Aoede`).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/google", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"en-US-Chirp3-HD-Aoede\"}"}'
```

### Hume AI — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/hume` (via the Floe marketplace shim)
**Price:** metered per input character

> Expressive speech synthesis with Octave 2. ~$0.15/1K chars (Hume list, before Floe's 5% margin). Audio is returned base64-encoded in `result.audioBase64`.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/hume", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\"}"}'
```

### Rime — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/rime` (via the Floe marketplace shim)
**Price:** metered per input character

> Speech synthesis with Rime's `coda` model. $0.05/1K chars (Rime list, before Floe's 5% margin). Up to 3,000 characters per request. Audio is returned base64-encoded in `result.audioBase64`.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/rime", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"model\":\"coda\"}"}'
```

### Inworld AI — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/inworld` (via the Floe marketplace shim)
**Price:** metered per input character

> Speech synthesis with `inworld-tts-2`. $25/1M chars (Inworld list, before Floe's 5% margin). Up to 2,000 characters per request. Audio is returned base64-encoded in `result.audioBase64`.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/inworld", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"model\":\"inworld-tts-2\"}"}'
```

### MiniMax — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/minimax` (via the Floe marketplace shim)
**Price:** metered per input character

> Speech synthesis with `speech-2.8-turbo` (default) at $60/1M chars, or the HD tier at $100/1M (MiniMax list, before Floe's 5% margin). Audio is returned base64-encoded in `result.audioBase64`.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/minimax", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"model\":\"speech-2.8-turbo\"}"}'
```

### Azure AI Speech — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/azure` (via the Floe marketplace shim)
**Price:** metered per input character

> Azure neural voices (default `en-US-JennyNeural`). $15/1M chars (Azure list, before Floe's 5% margin); output is capped at 10 minutes of audio. Audio is returned base64-encoded in `result.audioBase64`.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/azure", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"en-US-JennyNeural\"}"}'
```

### Amazon Polly — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/polly` (via the Floe marketplace shim)
**Price:** metered per input character

> Amazon Polly speech synthesis. Default `neural` engine at $16/1M chars; `standard` ($4/1M) and `generative` ($30/1M) engines available (AWS list, before Floe's 5% margin). Audio is returned base64-encoded in `result.audioBase64`.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/polly", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"Joanna\",\"engine\":\"neural\"}"}'
```

### xAI — Text-to-Speech

**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/xai` (via the Floe marketplace shim)
**Price:** metered per input character

> xAI speech synthesis — pick a voice with `voice` (e.g. `eve`). $15/1M chars (xAI list, before Floe's 5% margin). Up to 15,000 characters per request. Audio is returned base64-encoded in `result.audioBase64`.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/xai", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\",\"voice\":\"eve\"}"}'
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
**Price:** $2/mo flat per US number · transport $0.0089/min inbound, $0.0147/min outbound · STT ~$0.0045/min · TTS per character · hosted-mode LLM per token — each leg itemized

> First-party telephony: buy a US local number bound 1:1 to your agent, and run live inbound/outbound voice calls — carrier minutes, transcription, speech synthesis, and (in hosted mode) model tokens all metered as separate line items on the agent's Floe balance, under its existing spend caps. Full endpoint reference, voice modes (hosted vs webhook), and examples: **[Floe Phone — Numbers & Voice for Agents](../developers/floe-phone.md)**.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents/42/numbers \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"areaCode": "415"}'
```

---

## WebRTC

Realtime speech-to-speech over WebSocket / WebRTC. Metering varies by provider — per completed turn (OpenAI, Gemini Live), per minute of session time (xAI Grok Voice), or per audio token (Nova 2 Sonic); each entry below states its meter.

### OpenAI — GPT Realtime

**Endpoint:** `wss://credit-api.floelabs.xyz/v1/realtime?model=openai/gpt-realtime` (Floe Inference gateway)
**Price:** metered per completed turn · Base mainnet

> OpenAI `gpt-realtime` speech-to-speech over the keyless realtime WebSocket. No OpenAI key — billed to your Floe balance. See [Floe Inference](../developers/keyless-inference.md#realtime-voice).

### Google Gemini Live

**Endpoint:** `wss://credit-api.floelabs.xyz/v1/realtime?model=google/gemini-live` (Floe Inference gateway)
**Price:** metered per completed turn · Base mainnet

> Google `gemini-live` realtime speech-to-speech over the keyless realtime WebSocket. No Google key — billed to your Floe balance. See [Floe Inference](../developers/keyless-inference.md#realtime-voice).

### xAI Grok Voice

**Endpoint:** `wss://credit-api.floelabs.xyz/v1/realtime?model=xai/grok-voice` (Floe Inference gateway)
**Price:** metered per minute of session time · Base mainnet

> xAI's realtime voice agent (`grok-voice-latest`) over the keyless realtime WebSocket — OpenAI-Realtime-compatible events, billed on session time. No xAI key — billed to your Floe balance. See [Floe Inference](../developers/keyless-inference.md#realtime-voice).

### Amazon Nova 2 Sonic — Coming soon

Bidirectional realtime voice on the keyless gateway (`amazon/nova-2-sonic`), billed per audio token. The catalog row is live in preview; serving starts once the gateway's AWS credentials land — see [Floe Inference](../developers/keyless-inference.md#realtime-voice).

### LiveKit — Coming soon

Realtime agent infrastructure (WebRTC transport, agent framework), payable with Floe credit. Not yet live — check the [changelog](../changelog.md) for availability.

## Direct voice services

These vendors price and charge calls themselves — Floe doesn't hold a key or meter the call. Most bill **per call**: the proxy settles the vendor's exact charge from your Floe balance via `/v1/proxy/fetch`. **dTelecom is prepaid**: you buy a credit balance first (one proxy call), then STT/TTS/WebRTC sessions debit those credits — don't expect a per-call settlement on each session.

| Service | Endpoints | Price | Chains | Status |
|---------|-----------|-------|--------|--------|
| dTelecom | STT / TTS / WebRTC / agent sessions | credits (min $0.10) | Base, Solana, Tempo | Verified |
| ForgeMesh Voice | Text-to-Speech (OpenAI-compatible) | $0.001 / call | Base | Verified |
| GEDX402 | TTS, ASR, voice sessions | $0.005–$1.49 / call | Base | Verified |
| x402engine | OpenAI & ElevenLabs TTS, transcription | $0.01–$0.10 / call | Base, Solana, MegaETH | Verified |
| Spraay | Text-to-Speech, Speech-to-Text | $0.02–$0.03 / call | Base, Solana | Verified |
| Agent402 | TTS, HD TTS, transcription | $0.03–$0.10 / call | Base, Solana + 3 more | Verified |
| Xona Agent | Text-to-Speech (Grok) | $0.01 / call | Base | Verified |
| cnvrt.ing | Transcription | $0.025 / call | Base | Preview (legacy protocol) |

### dTelecom — Voice sessions

**Endpoint:** `POST https://x402.dtelecom.org/v1/credits/purchase` (then per-session endpoints)
**Price:** prepaid credits, minimum $0.10 purchase · Base, Solana, Tempo

> Full voice stack on a credits model: buy credits once, then open sessions against the balance — `/v1/stt/session` at $0.006/min (99+ languages), `/v1/tts/session` at $0.008/1K chars, `/v1/webrtc/token` at $0.001/participant-min, and managed `/v1/agent-session` at ~$0.015/min.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.dtelecom.org/v1/credits/purchase", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"amountUsd\":\"0.10\"}"}'
```

### ForgeMesh Voice — Text-to-Speech

**Endpoint:** `POST https://voice.forgemesh.io/v1/audio/speech`
**Price:** $0.001 per call

> OpenAI-compatible `/v1/audio/speech` at a flat $0.001 per call — the cheapest live pay-per-call TTS.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://voice.forgemesh.io/v1/audio/speech", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"input\":\"Payment settled.\",\"voice\":\"alloy\"}"}'
```

### GEDX402 — TTS & ASR

**Endpoint:** `POST https://media.gedx402.com/v1/tts/melotts` (and sibling routes)
**Price:** $0.005–$1.49 per call

> Voice media suite: `/v1/tts/melotts` ($0.005) and `/v1/tts/aura-2-en` ($0.0395) for TTS; `/v1/asr/whisper-large-v3-turbo` ($0.006) and `/v1/asr/nova-3` ($0.0085) for transcription; `/v1/voice/sessions` ($1.49) for full voice sessions.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://media.gedx402.com/v1/tts/melotts", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\"}"}'
```

### x402engine — Voice gateway

**Endpoint:** `POST https://x402-gateway-production.up.railway.app/api/tts/openai` (and sibling routes)
**Price:** $0.01–$0.10 per call · Base, Solana, MegaETH

> One host fronting several voice backends: `/api/tts/openai` ($0.01), `/api/tts/elevenlabs` ($0.02), and `/api/transcribe` ($0.10, Nova-3).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402-gateway-production.up.railway.app/api/tts/openai", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\"}"}'
```

### Spraay — Text-to-Speech & Speech-to-Text

**Endpoint:** `POST https://gateway.spraay.app/api/v1/compute/text-to-speech` (STT at `/api/v1/compute/speech-to-text`)
**Price:** TTS $0.03 · STT $0.02 per call · Base, Solana

> XTTS-v2 text-to-speech ($0.03) and Whisper speech-to-text ($0.02).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://gateway.spraay.app/api/v1/compute/text-to-speech", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\"}"}'
```

### Agent402 — TTS & transcription

**Endpoint:** `POST https://agent402.tools/api/tts` (and sibling routes)
**Price:** $0.03–$0.10 per call · Base, Solana, Polygon, Arbitrum, Stellar

> Agent voice tools: `/api/tts` ($0.05), `/api/tts-hd` ($0.10), and `/api/transcribe` ($0.03).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://agent402.tools/api/tts", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\"}"}'
```

### Xona Agent — Text-to-Speech

**Endpoint:** `POST https://api.xona-agent.com/base-main/audio/x-text-to-speech`
**Price:** $0.01 per call

> Grok-powered text-to-speech at a flat price per call.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.xona-agent.com/base-main/audio/x-text-to-speech", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"text\":\"Payment settled.\"}"}'
```

### cnvrt.ing — Transcription

**Endpoint:** `POST https://cnvrt.ing/api/transcribe`
**Price:** $0.025 per call · legacy payment-protocol version

> Whisper transcription of any media URL. Note: this service runs an older payment-protocol version — confirm the Floe proxy settles it before wiring it into a pipeline.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://cnvrt.ing/api/transcribe", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"url\":\"https://dpgr.am/spacewalk.wav\"}"}'
```
