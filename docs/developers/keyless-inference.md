# Floe Inference — keyless pay-as-you-go LLM & voice

Call **LLMs, embeddings, and voice models** through one OpenAI-compatible endpoint and pay **per call** from your Floe balance — no provider account, no provider key, no wallet. Point any OpenAI SDK at Floe with your Floe agent key and use a model id like `openai/gpt-4o`; Floe routes the call to the cheapest available source, meters the exact usage, and debits your balance.

```
Base URL:  https://credit-api.floelabs.xyz/v1
Auth:      Authorization: Bearer <your floe agent key>   (prefix floe_…)
```

> Use an **agent key** (`floe_…`), not a publishable key (`floe_live_…`). Mint one in the [Developer Dashboard](developer-dashboard.md) or via `POST /v1/developer/agents/:agentId/keys`.

Floe Inference spans **many** providers behind a single catalog and a single bill — OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral, Cohere, z.ai (GLM), Moonshot (Kimi), Perplexity, Qwen, xAI (Grok), plus open-weight self-hosts, keyless x402 routers, **Venice** (open-source & uncensored models), and **Sarvam** (sovereign Indic models across 22+ Indian languages). You never hold an account or key with any of them — Floe fronts the upstream relationship from a pooled wallet and bills you the metered cost per call.

## How it works

Every request is priced, gated, forwarded, and metered:

1. **Gate** — your agent's balance is the hard ceiling. Floe checks it (and any [spend controls](spend-controls.md)) before forwarding. No balance, no call.
2. **Route** — Floe picks the cheapest source that can serve the model, across its rails (see below), and forwards an OpenAI-compatible request.
3. **Meter** — the response's usage block (tokens, characters, or audio seconds) is priced from the model's rate card **plus a small Floe margin** (5% default). You're billed the metered cost, never a provider minimum.
4. **Fall back** — on an upstream 5xx / 429 / network error, Floe transparently retries the next source; deterministic 4xx errors pass through unchanged.

The exact charge is returned on every response:

| Header | Meaning |
|---|---|
| `X-Floe-Cost-USDC` | This call's cost in raw USDC (6 decimals) |
| `X-Floe-Payment-Amount` | Same cost as a decimal USDC string |
| `X-Floe-Payment` | `gateway` (metered) · `byok` (your key, fee only) · `passthrough` (upstream error, not charged) |
| `X-Floe-Model` | The resolved model id |
| `X-Floe-Rail` | Which rail served the call (see below) |
| `X-Floe-Attempts` | Present when a fallback occurred (number of sources tried) |
| `X-Floe-RateLimit-Advisory` | Normalized upstream rate-limit headroom (when enabled) — see below |

## Rate-Limit Advisory (cross-provider backpressure)

When enabled by the operator, gateway responses carry an `X-Floe-RateLimit-Advisory` header: the serving provider's own rate-limit headers (OpenAI `x-ratelimit-*`, Anthropic `anthropic-ratelimit-*`, generic `Retry-After`), normalized into **one shape** — so an agent nearing OpenAI RPM or Anthropic TPM reads a single `near_limit` / headroom signal regardless of provider, and can back off *before* hitting the 429 wall.

```jsonc
{
  "near_limit": true,          // present only when the operator set a threshold
  "provider": "openai",        // upstream that served (or refused) the call
  "shared": true,              // true = pooled Floe key: headroom is shared
                               // across ALL agents on this rail, not your own
                               // quota. false = your BYOK key.
  "tightest": {                // the cap with the least headroom
    "kind": "tokens",          // requests | tokens | input_tokens | output_tokens
    "remaining": 15000,
    "limit": 200000,
    "used_bps": 9250,          // 0..10000 of the cap consumed; null if limit unknown
    "resets_at": "2026-07-15T12:00:01.000Z"
  },
  "retry_after_seconds": 30    // present on 429-style backpressure (e.g. Gemini)
}
```

Notes:

- **Passive signal only** — Floe already retries the next source on a 429; this header just lets you smooth your own request rate proactively.
- Sent on successful responses, on error passthroughs, and on an all-sources-unavailable `502` (where a `retry_after_seconds` from the last 429 tells you when to try again).
- Some providers expose less: Gemini's OpenAI-compatible surface only sends `Retry-After` on a 429 — in that case `tightest` is absent and `retry_after_seconds` carries the signal. Nothing is ever fabricated.
- Off by default (`RATELIMIT_ADVISORY_ENABLED`); responses are byte-identical when disabled. The optional `RATELIMIT_ADVISORY_NEAR_LIMIT_BPS` threshold drives `near_limit`.
- Only calls routed through this gateway carry the signal — own-key calls made directly to a provider never touch Floe and can't be observed.

## Rails

A model can be served by one or more **rails**. Floe picks the cheapest available; you don't choose:

| Rail | What it is | You're billed |
|---|---|---|
| `direct-account` | Floe's account with a closed provider (OpenAI, Google, …) | metered cost + margin |
| `self-host` | Open-weight model on a serverless host (Together, DeepInfra, …) | metered cost + margin |
| `venice` | Venice via Floe's pooled wallet | metered cost + margin |
| `x402-router` | Keyless pay-per-call router (no account anywhere) | router receipt + margin |
| `byok` | **Your** provider key — sent per request or stored (encrypted) | Floe fee only |
| `free` | Promotional / zero-rated models | nothing |

**BYOK — bring your own provider key.** You pay the upstream vendor with your own
key; on this gateway's `byok` rail Floe adds only a small **fixed per-call service
fee** (never the token cost — you paid that) and marks the call `X-Floe-Payment:
byok`. There are two ways to supply the key:

- **Per request (ephemeral)** — send it in the `X-Floe-Provider-Key` header. It is
  used for that one call and **never persisted or logged**. A request header always
  wins — it overrides a stored key for that call.
- **Stored (once)** — save the key and every gateway call for that provider routes
  BYOK automatically, no header needed. Stored keys are **AES-256-GCM encrypted at
  rest**, scoped per developer + provider, and writable by **admins** only. Manage
  them from any surface:
  - **Dashboard** → *Keys → Provider keys* (add, relabel, disable, remove)
  - **CLI** — `floe providers list` · `floe providers set <provider>` (pipe the key
    so it never lands in shell history: `printf '%s' "$KEY" | floe providers set openai`)
  - **API** — `GET/PUT/PATCH/DELETE /v1/developer/provider-keys/{provider}`
    (`GET /v1/developer/provider-keys` lists your keys and the `supportedProviders`)

A key record never includes key material — only a masked prefix, label, and enabled
state. (The collection response additionally lists `supportedProviders`.)

## Endpoints

All are drop-in OpenAI-compatible:

| Surface | Path | OpenAI SDK method |
|---|---|---|
| Chat Completions | `POST /v1/chat/completions` | `chat.completions.create` |
| Embeddings | `POST /v1/embeddings` | `embeddings.create` |
| Text-to-Speech | `POST /v1/audio/speech` | `audio.speech.create` |
| Transcription (batch) | `POST /v1/audio/transcriptions` | `audio.transcriptions.create` |
| Transcription (streaming) | `WS /v1/audio/transcriptions/stream?model=…` | — (Floe extension) |
| Realtime voice | `WS /v1/realtime?model=…` | Realtime API |
| List models | `GET /v1/models` | `models.list` |
| Cost estimate | `POST /v1/estimate` | — (Floe extension) |

## Models

Every id on this keyless gateway is fully qualified as `provider/model` — copy them exactly as written; on `POST /v1/chat/completions` (and the other `/v1/*` gateway surfaces) a bare name (e.g. `gpt-4o` without the `openai/` prefix) is **rejected**. **The live catalog is `GET /v1/models`** (no provider key needed — call it with your Floe agent key) — always resolve ids there at runtime; **for the full, current set see `GET /v1/models` for the live list** rather than a hard-coded count. The tables below enumerate what's live today.

> **Two endpoints, two id rules — don't confuse them.** The keyless gateway (`POST /v1/chat/completions`, `/v1/embeddings`, `/v1/audio/*`) resolves an **exact catalog id** — the **fully-qualified** `provider/model` used throughout this page (a bare `gpt-4o` is rejected). The legacy, flag-gated **BYOK metered proxy** `POST /v1/llm/chat/completions` is a *different* endpoint: it takes **your own** `X-Floe-Provider-Key`, prices the call from Floe's maintained LiteLLM cost map (no catalog allowlist), and accepts the model id **with or without** a `provider/` prefix — `gpt-4o` or `openai/gpt-4o` both work, since Floe strips the prefix before pricing. Prefer the keyless gateway for new work; the BYOK proxy is documented in [Unified Ledger](../build/unified-ledger.md).

### Text / reasoning

| Provider | Models |
|---|---|
| OpenAI | `openai/gpt-4o` · `openai/gpt-4o-mini` · `openai/gpt-5.5` · `openai/gpt-5.4` · `openai/gpt-5.4-mini` · `openai/gpt-5.4-nano` · `openai/gpt-5.3-codex` · `openai/gpt-5.6-luna` · `openai/gpt-5.6-sol` · `openai/gpt-5.6-terra` · `openai/gpt-oss-120b` · `openai/gpt-oss-20b` |
| Anthropic | `anthropic/claude-sonnet-5` · `anthropic/claude-sonnet-4-6` · `anthropic/claude-haiku-4-5` · `anthropic/claude-opus-4-8` · `anthropic/claude-opus-4-7` · `anthropic/claude-opus-4-6` · `anthropic/claude-fable-5` |
| Google | `google/gemini-3.5-flash` · `google/gemini-3.1-pro-preview` · `google/gemini-3.1-flash-lite` · `google/gemini-2.5-pro` · `google/gemini-2.5-flash` · `google/gemma-4-31b` · `google/gemma-3-27b` · `google/gemma-3-12b` |
| Meta | `meta/llama-3.3-70b` · `meta/llama-4-maverick` · `meta/llama-4-scout` · `meta/llama-3.1-8b` |
| DeepSeek | `deepseek/deepseek-v4-pro` · `deepseek/deepseek-v4-flash` · `deepseek/deepseek-v3.2` · `deepseek/deepseek-v3.1-terminus` · `deepseek/deepseek-v3.1` · `deepseek/deepseek-v3` · `deepseek/deepseek-r1-0528` |
| Qwen | `qwen/qwen3.6-35b-a3b` · `qwen/qwen3.5-397b` · `qwen/qwen3.5-9b` · `qwen/qwen3-coder-480b` · `qwen/qwen3-next-80b` · `qwen/qwen3-235b-a22b-thinking` · `qwen/qwen3-235b-a22b-instruct` · `qwen/qwen3-32b` · `qwen/qwen-2.5-72b` |
| Mistral | `mistral/mistral-large` · `mistral/mistral-medium` · `mistral/mistral-small` · `mistral/mistral-small-3.2-24b` · `mistral/mistral-nemo` · `mistral/magistral-medium` · `mistral/codestral` |
| Moonshot (Kimi) | `moonshot/kimi-k3` · `moonshot/kimi-k2.7-code` · `moonshot/kimi-k2.6` · `moonshot/kimi-k2.5` · `moonshot/moonshot-v1-8k` |
| z.ai (GLM) | `zai/glm-5.3` · `zai/glm-5.2` · `zai/glm-4.7-flash` · `zai/glm-4.6` · `zai/glm-4.5-air` |
| xAI | `xai/grok-4.5` · `xai/grok-4.3` · `xai/grok-build-0.1` |
| Cohere | `cohere/command-a` · `cohere/command-r` · `cohere/command-r7b` |
| Perplexity (web-search) | `perplexity/sonar-reasoning-pro` · `perplexity/sonar-pro` · `perplexity/sonar` |
| Venice (uncensored) | `venice/llama-3.3-70b` · `venice/qwen3-235b` |
| Sarvam (Indic, 22+ languages) | `sarvam/sarvam-105b` · `sarvam/sarvam-30b` |
| NVIDIA | `nvidia/nemotron-3-ultra` |
| MiniMax | `minimax/minimax-m3` |
| Microsoft | `microsoft/phi-4` |

### Embeddings

`openai/text-embedding-3-large` · `openai/text-embedding-3-small` · `baai/bge-m3` · `intfloat/multilingual-e5-large` · `qwen/qwen3-embedding-8b`

### Text-to-Speech

`openai/tts-1` · `openai/tts-1-hd` · `openai/gpt-4o-mini-tts` · `google/gemini-3.1-flash-tts` · `google/gemini-2.5-flash-tts` · `cartesia/sonic-3` · `resemble/chatterbox-multilingual` · `resemble/chatterbox-turbo` · `xiaomi/mimo-v2.5-tts` · `xiaomi/mimo-v2.5-tts-voiceclone` · `xiaomi/mimo-v2.5-tts-voicedesign` · `canopy/orpheus-3b` · `canopy/orpheus-v1-english` · `kokoro/kokoro-82m` · `inworld/realtime-tts-2` · `boson/higgs-audio-v2.5` · `sesame/csm-1b` · `qwen/qwen3-tts`

> `elevenlabs/eleven-turbo-v2-5` is in the catalog for pricing/attribution but is served only by the orchestrator's custom-voice surface (`POST /v1/orchestrator/voice`), **not** the OpenAI-compatible `/v1/audio/speech` above — so it's omitted from this list. ElevenLabs TTS is reachable through the [Vendor Marketplace](../x402-directory/voice.md) (a marketplace-shim route) and the orchestrator's custom-voice surface — neither is the OpenAI-compatible `/v1/audio/speech`.

### Speech-to-Text

**Batch** (`POST /v1/audio/transcriptions`): `openai/whisper-1` · `openai/whisper-large-v3` · `openai/whisper-large-v3-turbo` · `openai/gpt-4o-transcribe` · `openai/gpt-4o-mini-transcribe` · `mistral/voxtral-small` · `mistral/voxtral-mini-transcribe` · `nvidia/parakeet-tdt-0.6b-v3` · `nvidia/nemotron-3.5-asr`

**Streaming** (`WS /v1/audio/transcriptions/stream`): `deepgram/nova-3`

> STT on Floe has **two surfaces**: **batch** (`POST /v1/audio/transcriptions` — file in, transcript out) and **live streaming** (`WS /v1/audio/transcriptions/stream` — PCM frames in, `interim`/`final` transcript events out, the feed a LiveKit/Pipecat STT plugin consumes). Every id above — batch and streaming alike — resolves via `GET /v1/models`. See [Streaming transcription (live STT)](#streaming-transcription-live-stt) below. The separate `/v1/realtime` WebSocket is **speech-to-speech**, not a streaming-STT source.

### Realtime voice models

`openai/gpt-realtime` · `openai/gpt-realtime-2.1` · `openai/gpt-realtime-2.1-mini` · `openai/gpt-realtime-translate` · `openai/gpt-realtime-whisper` · `google/gemini-live` · `google/gemini-live-3.1` · `xai/grok-voice` · `amazon/nova-2-sonic`

> **The live catalog is `GET /v1/models`** (no provider key needed — call it with your Floe agent key); it grows over time, so resolve ids there rather than pinning this list. Venice and Sarvam are reachable here as **first-class inference providers** in the gateway (the ids above) — the same vendors also expose x402 endpoints — Venice [image](../x402-directory/image.md) and [TTS](../x402-directory/voice.md), Sarvam [voice and language](../x402-directory/voice.md) — reached via `/v1/proxy/fetch`. Third-party **voice** vendors with proprietary APIs (ElevenLabs, Cartesia, Deepgram, Google Cloud TTS, AssemblyAI, Hume, Rime, …) also live in the [Vendor Marketplace](../x402-directory/voice.md), reached via `/v1/proxy/fetch`.

## Chat completions

{% tabs %}
{% tab title="cURL" %}
```bash
curl -X POST https://credit-api.floelabs.xyz/v1/chat/completions \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o",
    "messages": [{ "role": "user", "content": "Hello from Floe" }]
  }'
```
{% endtab %}

{% tab title="TypeScript" %}
```ts
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://credit-api.floelabs.xyz/v1",
  apiKey: process.env.FLOE_KEY, // your Floe agent key
});

const res = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Hello from Floe" }],
});
console.log(res.choices[0].message.content);
```
{% endtab %}

{% tab title="Python" %}
```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://credit-api.floelabs.xyz/v1",
    api_key=os.environ["FLOE_KEY"],  # your Floe agent key
)

res = client.chat.completions.create(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "Hello from Floe"}],
)
print(res.choices[0].message.content)
```
{% endtab %}
{% endtabs %}

## Estimate before you spend

`POST /v1/estimate` prices a usage vector **without** making the call or touching your balance — use it to gate expensive work. Provide only the units the model bills: text (`input_tokens`/`output_tokens`, plus `cached_input_tokens`), TTS (`characters`), STT (`audio_seconds`), or realtime voice (`audio_input_tokens`/`audio_output_tokens`).

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/estimate \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "model": "openai/gpt-4o", "input_tokens": 1200, "output_tokens": 400 }'
```

```json
{
  "model": "openai/gpt-4o",
  "rail": "direct-account",
  "provider": "openai",
  "margin_bps": 500,
  "usage": { "text_input_token": 1200, "text_output_token": 400 },
  "upstream_cost_usdc": "0.007000",
  "cost_usdc": "0.007350",
  "cost_raw": "7350"
}
```

Agents can call the same estimate through the [MCP tool](mcp-server.md) `estimate_inference_cost` or the AgentKit action `estimate_inference_cost`, and browse the catalog with `list_models` / `list_inference_models`.

## Voice

The gateway serves **TTS and STT from multiple providers** on the same OpenAI-compatible endpoints — OpenAI, DeepInfra, Together, Groq, and Mistral, plus Google Gemini TTS in preview. **Text-to-speech** meters per character of input (Gemini TTS per audio output token); **transcription** meters per audio second. As everywhere on this gateway, you're billed the upstream rate **plus a small Floe margin** (5% default); prices below are upstream list.

| Provider | TTS | STT |
|---|---|---|
| OpenAI | `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts` (preview) | `whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe` |
| DeepInfra | Kokoro ($0.62/1M chars), Chatterbox, Orpheus, Qwen3-TTS | Whisper large-v3-turbo ($0.0002/min), Voxtral |
| Together | Kokoro, Orpheus, Cartesia `sonic-3` | Whisper large-v3, Parakeet ($0.0015/min) |
| Groq | Orpheus TTS | `whisper-large-v3-turbo` ($0.04/hr — cheapest batch STT) |
| Mistral | — | Voxtral transcribe ($0.003/min) |
| Google | Gemini 2.5 / 3.1 Flash TTS (preview) | — |

Open-weight models available on more than one host (Kokoro, Orpheus, Whisper) are a single catalog id — Floe routes to the cheapest available source.

{% tabs %}
{% tab title="TTS (TypeScript)" %}
```ts
const audio = await client.audio.speech.create({
  model: "openai/tts-1",
  voice: "alloy",
  input: "Payments for agents, without the wallet.",
});
```
{% endtab %}

{% tab title="STT (Python)" %}
```python
with open("call.wav", "rb") as f:
    tr = client.audio.transcriptions.create(model="openai/whisper-1", file=f)
print(tr.text)
```
{% endtab %}
{% endtabs %}

> **Third-party voice vendors** (ElevenLabs, Cartesia, Google Cloud for TTS; Deepgram, AssemblyAI for STT) are **not** on this OpenAI-compatible surface — they run through the [Vendor Marketplace](../x402-directory/voice.md) via `POST /v1/proxy/fetch`, which still bills your Floe balance keyless. See the [x402 Voice directory](../x402-directory/voice.md).

> **`audio.transcriptions.create` here is batch** — you send a file, you get one transcript back. For a **live** transcript stream (the `interim`/`final` feed a LiveKit/Pipecat STT plugin consumes), use the streaming surface below.

### Streaming transcription (live STT)

Open a WebSocket to:

```
wss://credit-api.floelabs.xyz/v1/audio/transcriptions/stream?model=deepgram/nova-3&encoding=linear16&sample_rate=16000&language=en
```

Authenticate with the **`Authorization: Bearer <floe key>`** header — **keyless**, Floe fronts the Deepgram key. Browser clients that can't set headers on a WebSocket handshake pass the key via the **`floe-stt` subprotocol** instead: open the socket with two WebSocket subprotocols — `floe-stt` and your key, in either order (JS: `new WebSocket(url, ['floe-stt', '<floe key>'])`). The query string is **not** accepted — keys there leak into proxy, load-balancer, and access logs. Query params:

| Param | Values | Notes |
|---|---|---|
| `model` | e.g. `deepgram/nova-3` | fully-qualified `provider/model` |
| `encoding` | `linear16` · `mulaw` · `alaw` | raw PCM frame encoding |
| `sample_rate` | `8000`–`48000` | rejected outside this range |
| `language` | e.g. `en` | optional |

**Client → server:** raw **PCM binary frames** in the declared `encoding`/`sample_rate`.

**Server → client:** JSON transcript events, and an error event on budget exhaustion or failure (the socket then closes):

```jsonc
{ "type": "transcript", "text": "book me for friday", "is_final": true, "speech_final": true }
{ "type": "error", "code": "insufficient_balance" }
```

Map these to your STT plugin's event types: `is_final: false` is an **interim** hypothesis, `is_final: true` is a **final** transcript, and `speech_final: true` marks the end of an utterance (endpointing). Every event is a `type: "transcript"` object — there is no separate `interim`/`final` event name on the wire; the boolean carries the finality.

Metered per **audio-second** on your Floe balance; because your balance is the ceiling, the session is cut off mid-stream the instant a charge would exhaust it. This is the standalone streaming-STT feed a LiveKit or Pipecat STT plugin can consume — see [The Voice Stack — live voice with your own stack](../build/voice-stack.md#live-voice-with-your-own-stack-livekit-pipecat).

### Realtime voice

Open a WebSocket to `wss://credit-api.floelabs.xyz/v1/realtime?model=openai/gpt-realtime-2.1`, authenticating with `Authorization: Bearer <floe key>` or `?api_key=`. Floe relays events verbatim in both directions and meters **each completed turn** from the provider's usage block — per token for conversational models, per minute for duration-billed ones. Because your balance is the ceiling, the session is cut off the instant a turn would exhaust it.

Available realtime models: `openai/gpt-realtime-2.1` and `openai/gpt-realtime-2.1-mini` (plus the original `openai/gpt-realtime`), the duration-billed `openai/gpt-realtime-whisper` (realtime transcription within the OpenAI Realtime session) and `openai/gpt-realtime-translate` (live translation), `google/gemini-live-3.1` (plus the earlier `google/gemini-live`, Gemini Live 2.5 Flash), and `xai/grok-voice` ($0.05/min upstream). **`amazon/nova-2-sonic` is beta** — it's in the catalog but requires the dedicated Bedrock bridge (SigV4 credentials) to serve; treat it as not-yet-general until the bridge is provisioned on your deployment.

> This WebSocket is **speech-to-speech** — audio in, audio (or, for the transcription/translation variants, text) out over one OpenAI-Realtime connection. It is **not** a general streaming-STT feed you can plug into a LiveKit or Pipecat STT service expecting `interim`/`final` transcript events. For that, use the keyless [streaming transcription](#streaming-transcription-live-stt) endpoint above.

## Errors

Successful calls return the provider's response verbatim. Upstream errors pass through **unchanged and not charged** (`X-Floe-Payment: passthrough`). Floe-originated refusals use OpenAI-shaped error bodies:

| HTTP | When |
|---|---|
| `400` | Invalid JSON body, or a modality mismatch (e.g. a text model on `/audio/speech`) |
| `401` | A publishable key (`floe_live_…`) was used instead of an agent key |
| `402` | Balance / spend ceiling reached (`budget_exhausted`) |
| `404` | Unknown or disabled model id |
| `422` | No source can price the requested usage (`no_priceable_source`, from `/estimate`) |
| `429` | Per-agent rate limit exceeded. Keyless calls default to 300 requests/min (they ride Floe's pooled upstream quota); BYOK calls — your own provider key, per-request or stored — default to 3,000 requests/min. A BYOK call whose key fails upstream and falls back onto a pooled rail re-qualifies under the keyless window (`rate_limited` with `retry_after_seconds` in the body). Limits can be raised per account on request. |
| `503` | Floe Inference isn't enabled on this deployment, or no source is available for the model |

See the full [Error Codes](../reference/error-codes.md) reference for the rest of the Floe API.
