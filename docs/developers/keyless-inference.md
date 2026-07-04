# Floe Inference — keyless pay-as-you-go LLM & voice

Call **LLMs, embeddings, and voice models** through one OpenAI-compatible endpoint and pay **per call** from your Floe balance — no provider account, no provider key, no wallet. Point any OpenAI SDK at Floe with your Floe agent key and use a model id like `openai/gpt-4o`; Floe routes the call to the cheapest available source, meters the exact usage, and debits your balance.

```
Base URL:  https://credit-api.floelabs.xyz/v1
Auth:      Authorization: Bearer <your floe agent key>   (prefix floe_…)
```

> Use an **agent key** (`floe_…`), not a publishable key (`floe_live_…`). Mint one in the [Developer Dashboard](developer-dashboard.md) or via `POST /v1/developer/agents/:agentId/keys`.

This is the **keyless** counterpart to [Venice](venice.md): where Venice fronts one provider from a pooled wallet, Floe Inference spans **many** providers (OpenAI, Google, Anthropic-compatible, open-weight hosts, keyless x402 routers, and Venice) behind a single catalog and a single bill.

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

## Rails

A model can be served by one or more **rails**. Floe picks the cheapest available; you don't choose:

| Rail | What it is | You're billed |
|---|---|---|
| `direct-account` | Floe's account with a closed provider (OpenAI, Google, …) | metered cost + margin |
| `self-host` | Open-weight model on a serverless host (Together, DeepInfra, …) | metered cost + margin |
| `venice` | Venice via Floe's pooled wallet | metered cost + margin |
| `x402-router` | Keyless pay-per-call router (no account anywhere) | router receipt + margin |
| `byok` | **Your** provider key, passed per request | Floe fee only |
| `free` | Promotional / zero-rated models | nothing |

**BYOK** — send your own upstream key in `X-Floe-Provider-Key` and Floe forwards with it, charging only a routing fee (`X-Floe-Payment: byok`). Keys are read per request, never stored or logged.

## Endpoints

All are drop-in OpenAI-compatible:

| Surface | Path | OpenAI SDK method |
|---|---|---|
| Chat Completions | `POST /v1/chat/completions` | `chat.completions.create` |
| Embeddings | `POST /v1/embeddings` | `embeddings.create` |
| Text-to-Speech | `POST /v1/audio/speech` | `audio.speech.create` |
| Transcription | `POST /v1/audio/transcriptions` | `audio.transcriptions.create` |
| Realtime voice | `WS /v1/realtime?model=…` | Realtime API |
| List models | `GET /v1/models` | `models.list` |
| Cost estimate | `POST /v1/estimate` | — (Floe extension) |

## Models

Browse the live catalog — ids, modality, and context windows — from `GET /v1/models`. Each id is `provider/model` (e.g. `openai/gpt-4o`, `google/gemini-2.5-pro`, `venice/llama-3.3-70b`).

| Model | Modality | Notes |
|---|---|---|
| `openai/gpt-4o` · `openai/gpt-4o-mini` | text | OpenAI, direct-account |
| `anthropic/claude-sonnet-5` · `anthropic/claude-haiku-4-5` | text | Anthropic |
| `google/gemini-2.5-flash` · `google/gemini-2.5-pro` | text | Google |
| `xai/grok-4.3` · `xai/grok-3-mini` · `xai/grok-build-0.1` | text | xAI |
| `mistral/mistral-large` · `mistral/mistral-medium` · `mistral/mistral-small` | text | Mistral |
| `cohere/command-a` · `cohere/command-r` · `cohere/command-r7b` | text | Cohere |
| `deepseek/deepseek-v4-pro` · `deepseek/deepseek-v4-flash` | text | DeepSeek |
| `zai/glm-5.2` · `zai/glm-4.6` · `zai/glm-4.5-air` | text | Z.AI / Zhipu (GLM) |
| `moonshot/kimi-k2.6` · `moonshot/kimi-k2.7-code` | text | Moonshot (Kimi) |
| `perplexity/sonar-pro` · `perplexity/sonar` | text | Perplexity (web-search) |
| `qwen/qwen3-235b-a22b-instruct` · `deepseek/deepseek-r1-0528` · `meta/llama-4-maverick` · `google/gemma-3-27b` · `moonshot/kimi-k2.5` · `mistral/mistral-nemo` · `microsoft/phi-4` … | text | open-weight, self-host (DeepInfra/Together) |
| `venice/llama-3.3-70b` · `venice/qwen3-235b` | text | open-weight via Venice |
| `openai/text-embedding-3-small` | embedding | |
| `openai/tts-1` · `openai/tts-1-hd` | tts | metered per character |
| `openai/whisper-1` · `openai/gpt-4o-transcribe` · `openai/gpt-4o-mini-transcribe` | stt | metered per audio second |
| `openai/gpt-realtime` · `google/gemini-live` | realtime | metered per token, per turn |

> The catalog is representative and grows over time — always resolve ids from `GET /v1/models` at runtime rather than hard-coding a fixed list. Third-party **voice** vendors (ElevenLabs, Cartesia, Deepgram, Google Cloud TTS, AssemblyAI) live in the [Vendor Marketplace](../x402-directory/voice.md), reached via `/v1/proxy/fetch`.

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

This gateway serves **OpenAI-native** voice models (`openai/tts-1`, `openai/whisper-1`): **text-to-speech** meters per character of input; **transcription** meters per audio second.

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

### Realtime voice

Open a WebSocket to `wss://credit-api.floelabs.xyz/v1/realtime?model=openai/gpt-realtime` (or `google/gemini-live`), authenticating with `Authorization: Bearer <floe key>` or `?api_key=`. Floe relays events verbatim in both directions and meters **each completed turn** from the provider's usage block. Because your balance is the ceiling, the session is cut off the instant a turn would exhaust it.

## Errors

Successful calls return the provider's response verbatim. Upstream errors pass through **unchanged and not charged** (`X-Floe-Payment: passthrough`). Floe-originated refusals use OpenAI-shaped error bodies:

| HTTP | When |
|---|---|
| `400` | Invalid JSON body, or a modality mismatch (e.g. a text model on `/audio/speech`) |
| `401` | A publishable key (`floe_live_…`) was used instead of an agent key |
| `402` | Balance / spend ceiling reached (`budget_exhausted`) |
| `404` | Unknown or disabled model id |
| `422` | No source can price the requested usage (`no_priceable_source`, from `/estimate`) |
| `429` | Per-agent rate limit exceeded |
| `503` | Floe Inference isn't enabled on this deployment, or no source is available for the model |

See the full [Error Codes](../reference/error-codes.md) reference for the rest of the Floe API.
