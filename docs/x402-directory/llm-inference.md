---
icon: brain
---

# LLM Inference

AI model inference — Claude, GPT, open-source models. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| Agent402 | Agent402 | $0.05 | POST | Verified |
| AiMo Network | AiMo | $0.005 | POST | Verified |
| Amazon Polly TTS | Amazon Web Services | $0.005 | POST | Verified |
| AskClaude | AskClaude | $0.01 | POST | Verified |
| AssemblyAI STT | AssemblyAI | $0.005 | POST | Verified |
| Azure Speech STT | Microsoft Azure | $0.005 | POST | Verified |
| Azure Speech TTS | Microsoft Azure | $0.005 | POST | Verified |
| BlockRun.AI | BlockRun.AI | $0.01 | POST | Verified |
| Cartesia STT | Cartesia | $0.005 | POST | Verified |
| Cartesia TTS | Cartesia | $0.005 | POST | Verified |
| cnvrt.ing | cnvrt.ing | $0.025 | POST | Preview |
| Daydreams Router | Daydreams | $0.01 | POST | Verified |
| Deepgram STT | Deepgram | $0.005 | POST | Verified |
| Deepgram TTS | Deepgram | $0.005 | POST | Verified |
| dTelecom Voice | dTelecom | $0.10 | POST | Verified |
| Ekai Labs | Ekai Labs | $0.01 | POST | Verified |
| ElevenLabs STT | ElevenLabs | $0.005 | POST | Verified |
| ElevenLabs TTS | ElevenLabs | $0.005 | POST | Verified |
| ForgeMesh Voice | ForgeMesh | $0.001 | POST | Verified |
| GEDX402 | GEDX402 | $0.005 | POST | Verified |
| Google Cloud TTS | Google Cloud | $0.005 | POST | Verified |
| Hume TTS | Hume AI | $0.005 | POST | Verified |
| Inworld TTS | Inworld AI | $0.005 | POST | Verified |
| MiniMax TTS | MiniMax | $0.005 | POST | Verified |
| Octomil | Octomil | $0.005 | POST | Verified |
| Rime TTS | Rime | $0.005 | POST | Verified |
| Sarvam AI | Sarvam AI | $0.01 | POST | Verified |
| Speechmatics STT | Speechmatics | $0.005 | POST | Verified |
| Venice | Venice | $0.01 | POST | Verified |
| x402engine | x402engine | $0.01 | POST | Verified |
| xAI STT | xAI | $0.005 | POST | Verified |
| xAI TTS | xAI | $0.005 | POST | Verified |
| Xona Agent | Xona | $0.01 | POST | Verified |

---

## Agent402

**Provider:** [Agent402](https://agent402.tools)
**Endpoint:** `POST https://agent402.tools/api/tts`
**Price:** $0.05 USDC per call (tiered) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Agent voice tools — TTS ($0.05), HD TTS ($0.10), and transcription ($0.03). Multi-chain settlement: Base, Solana, Polygon, Arbitrum, Stellar.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://agent402.tools/api/tts", "method": "POST"}'
```

## AiMo Network

**Provider:** [AiMo](https://aimo.network)
**Endpoint:** `POST https://api.aimo.network/v1/infer`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Permissionless pay-per-inference network.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.aimo.network/v1/infer", "method": "POST"}'
```

## Amazon Polly TTS

**Provider:** [Amazon Web Services](https://aws.amazon.com/polly)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/polly`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Text-to-speech (neural; standard and generative engines available) via Amazon Polly through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/polly", "method": "POST"}'
```

## AskClaude

**Provider:** [AskClaude](https://askclaude.shop)
**Endpoint:** `POST https://askclaude.shop/api/ask`
**Price:** $0.01 USDC per call (tiered) · Base mainnet · x402 v2
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
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Speech-to-text (Universal-3) via AssemblyAI through the Floe marketplace shim. Pass an audioUrl; billed per audio second; transcript in result.text.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/assemblyai", "method": "POST"}'
```

## Azure Speech STT

**Provider:** [Microsoft Azure](https://azure.microsoft.com/products/ai-services/ai-speech)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/azure`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Speech-to-text (fast transcription) via Azure AI Speech through the Floe marketplace shim. Pass an audioUrl; billed per audio second; transcript in result.text.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/azure", "method": "POST"}'
```

## Azure Speech TTS

**Provider:** [Microsoft Azure](https://azure.microsoft.com/products/ai-services/ai-speech)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/azure`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Neural text-to-speech via Azure AI Speech through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/azure", "method": "POST"}'
```

## BlockRun.AI

**Provider:** [BlockRun.AI](https://blockrun.ai)
**Endpoint:** `POST https://api.blockrun.ai/v1/chat`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> ChatGPT, Claude, Google, DeepSeek, xAI — pay-as-you-go on Base.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.blockrun.ai/v1/chat", "method": "POST"}'
```

## Cartesia STT

**Provider:** [Cartesia](https://cartesia.ai)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/cartesia`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Speech-to-text (Ink-Whisper) via Cartesia through the Floe marketplace shim. Pass an audioUrl; billed per audio second; transcript in result.text.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/cartesia", "method": "POST"}'
```

## Cartesia TTS

**Provider:** [Cartesia](https://cartesia.ai)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/cartesia`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Low-latency text-to-speech (Sonic) via Cartesia through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/cartesia", "method": "POST"}'
```

## cnvrt.ing

**Provider:** [cnvrt.ing](https://cnvrt.ing)
**Endpoint:** `POST https://cnvrt.ing/api/transcribe`
**Price:** $0.025 USDC per call · Base mainnet · x402 v1
**Floe compatible:** Yes

> Whisper transcription of any media URL at a flat price per call. Speaks the older x402 v1 protocol — confirm client compatibility before wiring it into a pipeline.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://cnvrt.ing/api/transcribe", "method": "POST"}'
```

## Daydreams Router

**Provider:** [Daydreams](https://daydreams.ai)
**Endpoint:** `POST https://api.daydreams.ai/v1/route`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
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
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Speech-to-text via Deepgram through the Floe marketplace shim. Pass an audioUrl; Floe probes the true duration server-side and bills whole audio minutes.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/deepgram", "method": "POST"}'
```

## Deepgram TTS

**Provider:** [Deepgram](https://deepgram.com)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/deepgram`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Text-to-speech (Aura-2) via Deepgram through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/deepgram", "method": "POST"}'
```

## dTelecom Voice

**Provider:** [dTelecom](https://dtelecom.org)
**Endpoint:** `POST https://x402.dtelecom.org/v1/credits/purchase`
**Price:** $0.10 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Full voice stack on a prepaid-credits model at x402.dtelecom.org — buy credits (min $0.10), then open STT sessions ($0.006/min, 99+ languages), TTS sessions ($0.008/1K chars), WebRTC tokens ($0.001/participant-min), or managed agent sessions (~$0.015/min). Also settles on Solana and Tempo.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.dtelecom.org/v1/credits/purchase", "method": "POST"}'
```

## Ekai Labs

**Provider:** [Ekai Labs](https://ekai.ai)
**Endpoint:** `POST https://api.ekai.ai/v1/infer`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Universal context layer with pay-per-inference.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.ekai.ai/v1/infer", "method": "POST"}'
```

## ElevenLabs STT

**Provider:** [ElevenLabs](https://elevenlabs.io)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/elevenlabs`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Speech-to-text (Scribe v2) via ElevenLabs through the Floe marketplace shim. Pass an audioUrl; billed per audio second; transcript in result.text.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/elevenlabs", "method": "POST"}'
```

## ElevenLabs TTS

**Provider:** [ElevenLabs](https://elevenlabs.io)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/elevenlabs`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Text-to-speech via ElevenLabs through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/elevenlabs", "method": "POST"}'
```

## ForgeMesh Voice

**Provider:** [ForgeMesh](https://forgemesh.io)
**Endpoint:** `POST https://voice.forgemesh.io/v1/audio/speech`
**Price:** $0.001 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> OpenAI-compatible text-to-speech (POST /v1/audio/speech) at a flat price per call — the cheapest live x402 TTS.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://voice.forgemesh.io/v1/audio/speech", "method": "POST"}'
```

## GEDX402

**Provider:** [GEDX402](https://media.gedx402.com)
**Endpoint:** `POST https://media.gedx402.com/v1/tts/melotts`
**Price:** $0.005 USDC per call (tiered) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Voice media suite — TTS (MeloTTS $0.005, Aura-2 $0.0395), ASR (whisper-large-v3-turbo $0.006, Nova-3 $0.0085), and full voice sessions ($1.49) at media.gedx402.com.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://media.gedx402.com/v1/tts/melotts", "method": "POST"}'
```

## Google Cloud TTS

**Provider:** [Google Cloud](https://cloud.google.com/text-to-speech)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/google`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Text-to-speech (Chirp 3 HD) via Google Cloud through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/google", "method": "POST"}'
```

## Hume TTS

**Provider:** [Hume AI](https://hume.ai)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/hume`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Expressive text-to-speech (Octave 2) via Hume AI through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/hume", "method": "POST"}'
```

## Inworld TTS

**Provider:** [Inworld AI](https://inworld.ai)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/inworld`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Text-to-speech (inworld-tts-2) via Inworld AI through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/inworld", "method": "POST"}'
```

## MiniMax TTS

**Provider:** [MiniMax](https://www.minimax.io)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/minimax`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Text-to-speech (speech-2.8-turbo; HD tier available) via MiniMax through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/minimax", "method": "POST"}'
```

## Octomil

**Provider:** [Octomil](https://octomil.com)
**Endpoint:** `POST https://api.octomil.com/v1/infer`
**Price:** $0.005 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> On-device ML inference as x402-gated MCP server.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.octomil.com/v1/infer", "method": "POST"}'
```

## Rime TTS

**Provider:** [Rime](https://rime.ai)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/rime`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Text-to-speech (coda) via Rime through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/rime", "method": "POST"}'
```

## Sarvam AI

**Provider:** [Sarvam AI](https://www.sarvam.ai)
**Endpoint:** `POST https://api.sarvam.ai/v1/chat/completions`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Sovereign India-focused AI — Indic-language chat (Sarvam 105B/30B) across 22+ Indian languages, plus proprietary Bulbul TTS, Saaras STT, Mayura translation, transliteration, language ID, and Sarvam Vision document digitization. Server-side subscription-key auth, held by Floe.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.sarvam.ai/v1/chat/completions", "method": "POST"}'
```

## Speechmatics STT

**Provider:** [Speechmatics](https://speechmatics.com)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/speechmatics`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Speech-to-text (melia-1) via Speechmatics through the Floe marketplace shim. Pass an audioUrl; billed per audio second; transcript in result.text.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/speechmatics", "method": "POST"}'
```

## Venice

**Provider:** [Venice](https://venice.ai)
**Endpoint:** `POST https://api.venice.ai/v1/chat`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> 90+ open-source and frontier AI models (chat + embeddings) — reasoning, vision, code, and private TEE-attested E2EE inference. Uncensored options, zero data retention.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/v1/chat", "method": "POST"}'
```

## x402engine

**Provider:** x402engine
**Endpoint:** `POST https://x402-gateway-production.up.railway.app/api/tts/openai`
**Price:** $0.01 USDC per call (tiered) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Voice gateway — OpenAI TTS ($0.01), ElevenLabs TTS ($0.02), and Nova-3 transcription ($0.10) behind one x402 host. Also settles on Solana and MegaETH.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402-gateway-production.up.railway.app/api/tts/openai", "method": "POST"}'
```

## xAI STT

**Provider:** [xAI](https://x.ai)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/stt/xai`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Speech-to-text via xAI through the Floe marketplace shim. Pass an audioUrl; billed per audio second; transcript in result.text.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/xai", "method": "POST"}'
```

## xAI TTS

**Provider:** [xAI](https://x.ai)
**Endpoint:** `POST https://marketplace.floelabs.xyz/v1/tts/xai`
**Price:** $0.005 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Text-to-speech via xAI through the Floe marketplace shim. Billed per input character; audio returns base64 in result.audioBase64. Pick a voice with voice_id (e.g. eve).

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/xai", "method": "POST"}'
```

## Xona Agent

**Provider:** Xona
**Endpoint:** `POST https://api.xona-agent.com/base-main/audio/x-text-to-speech`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Grok-powered text-to-speech at a flat price per call.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.xona-agent.com/base-main/audio/x-text-to-speech", "method": "POST"}'
```

