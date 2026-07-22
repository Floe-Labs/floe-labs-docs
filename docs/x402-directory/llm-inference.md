---
icon: brain
---

# LLM Inference

AI model inference — Claude, GPT, open-source models. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| AiMo Network | AiMo | $0.005 | POST | Verified |
| AskClaude | AskClaude | $0.01 | POST | Verified |
| AssemblyAI STT | AssemblyAI | $0.005 | POST | Verified |
| BlockRun.AI | BlockRun.AI | $0.01 | POST | Verified |
| Cartesia TTS | Cartesia | $0.005 | POST | Verified |
| Daydreams Router | Daydreams | $0.01 | POST | Verified |
| Deepgram STT | Deepgram | $0.005 | POST | Verified |
| Ekai Labs | Ekai Labs | $0.01 | POST | Verified |
| ElevenLabs TTS | ElevenLabs | $0.005 | POST | Verified |
| Google Cloud TTS | Google Cloud | $0.005 | POST | Verified |
| Octomil | Octomil | $0.005 | POST | Verified |
| Sarvam AI | Sarvam AI | $0.01 | POST | Verified |
| Venice | Venice | $0.01 | POST | Verified |

---

## AiMo Network

**Provider:** [AiMo](https://aimo.network)
**Endpoint:** `POST https://api.aimo.network/v1/infer`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Permissionless pay-per-inference network.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.aimo.network/v1/infer", "method": "POST"}'
```

## AskClaude

**Provider:** [AskClaude](https://askclaude.shop)
**Endpoint:** `POST https://askclaude.shop/api/ask`
**Price:** $0.01 USDC per call (tiered) · Base mainnet
**Floe compatible:** Yes

> Claude Haiku $0.01, Sonnet $0.03, Opus $0.10 per question. Streaming.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://askclaude.shop/api/ask", "method": "POST"}'
```

## AssemblyAI STT

**Provider:** [AssemblyAI](https://assemblyai.com)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/assemblyai`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Speech-to-text (Universal-3) via AssemblyAI through the Floe marketplace shim. Pass an audioUrl; billed per audio second; transcript in result.text.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/assemblyai", "method": "POST"}'
```

## BlockRun.AI

**Provider:** [BlockRun.AI](https://blockrun.ai)
**Endpoint:** `POST https://api.blockrun.ai/v1/chat`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> ChatGPT, Claude, Google, DeepSeek, xAI — pay-as-you-go on Base.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.blockrun.ai/v1/chat", "method": "POST"}'
```

## Cartesia TTS

**Provider:** [Cartesia](https://cartesia.ai)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/cartesia`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Low-latency text-to-speech (Sonic) via Cartesia through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/cartesia", "method": "POST"}'
```

## Daydreams Router

**Provider:** [Daydreams](https://daydreams.ai)
**Endpoint:** `POST https://api.daydreams.ai/v1/route`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> x402-enabled LLM inference routing across all major providers.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.daydreams.ai/v1/route", "method": "POST"}'
```

## Deepgram STT

**Provider:** [Deepgram](https://deepgram.com)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/deepgram`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Speech-to-text via Deepgram through the Floe marketplace shim. Pass an audioUrl; Floe probes the true duration server-side and bills whole audio minutes.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/deepgram", "method": "POST"}'
```

## Ekai Labs

**Provider:** [Ekai Labs](https://ekai.ai)
**Endpoint:** `POST https://api.ekai.ai/v1/infer`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Universal context layer with pay-per-inference.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.ekai.ai/v1/infer", "method": "POST"}'
```

## ElevenLabs TTS

**Provider:** [ElevenLabs](https://elevenlabs.io)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/elevenlabs`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Text-to-speech via ElevenLabs through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/elevenlabs", "method": "POST"}'
```

## Google Cloud TTS

**Provider:** [Google Cloud](https://cloud.google.com/text-to-speech)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/google`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Text-to-speech (Chirp 3 HD) via Google Cloud through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/google", "method": "POST"}'
```

## Octomil

**Provider:** [Octomil](https://octomil.com)
**Endpoint:** `POST https://api.octomil.com/v1/infer`
**Price:** $0.005 USDC per call · Base mainnet
**Floe compatible:** Yes

> On-device ML inference as x402-gated MCP server.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.octomil.com/v1/infer", "method": "POST"}'
```

## Sarvam AI

**Provider:** [Sarvam AI](https://www.sarvam.ai)
**Endpoint:** `POST https://api.sarvam.ai/v1/chat/completions`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Sovereign India-focused AI — Indic-language chat (Sarvam 105B/30B) across 22+ Indian languages, plus proprietary Bulbul TTS, Saaras STT, Mayura translation, transliteration, language ID, and Sarvam Vision document digitization. Server-side subscription-key auth, held by Floe.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.sarvam.ai/v1/chat/completions", "method": "POST"}'
```

## Venice

**Provider:** [Venice](https://venice.ai)
**Endpoint:** `POST https://api.venice.ai/v1/chat`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> 90+ open-source and frontier AI models (chat + embeddings) — reasoning, vision, code, and private TEE-attested E2EE inference. Uncensored options, zero data retention.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/v1/chat", "method": "POST"}'
```

