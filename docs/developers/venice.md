# Venice AI — metered model inference

Run inference against **90+ open-source and frontier models** — Claude, GPT, Gemini, Grok, Llama, Qwen, GLM, DeepSeek, Mistral, plus Venice's own private and uncensored models — and pay **per use** — tokens, characters, or audio seconds — from your Floe credit line. Pick a model by **capability and price**; Floe meters every call and bills the exact cost.

Venice is the first model-inference provider in Floe's [vendor marketplace](../x402-directory/README.md). Access is **OpenAI-compatible**: point any OpenAI SDK at Floe with your Floe agent key — no Venice account, no Venice key, no wallet.

```
Base URL:  https://credit-api.floelabs.xyz/v1/venice
Auth:      Authorization: Bearer <your floe agent key>   (prefix floe_…)
```

> Use an **agent key** (`floe_…`), not a publishable key (`floe_live_…`). Mint one in the [Developer Dashboard](developer-dashboard.md) or via `POST /v1/developer/agents/:agentId/keys`.

## How it works

Floe keeps a single prepaid Venice balance funded from a pooled wallet. On every call Floe:

1. Checks your agent's [spend controls](spend-controls.md) (credit-line ceiling + session limit) before forwarding.
2. Authenticates to Venice with the pooled wallet and forwards your request.
3. Meters the response by usage — tokens for text and embeddings, characters for TTS, audio seconds for transcription — and debits your credit line at the metered cost.

You're billed the **metered cost of each call** — usage priced from Venice's live catalog, plus a small Floe service margin and any per-search surcharge (web / X search) — never the pool top-up. The exact charge is returned on every response:

| Header | Meaning |
|---|---|
| `X-Floe-Cost-USDC` | This call's cost in raw USDC (6 decimals) |
| `X-Floe-Payment-Amount` | Same cost as a decimal USDC string |
| `X-Floe-Payment` | `venice` (metered) or `passthrough` (upstream error, not charged) |
| `X-Venice-Balance-USD` | Venice-reported pool balance, when present |

## Supported endpoints

These are served first-class — text and embeddings metered per token, voice per character (TTS) or per audio second (transcription):

| Endpoint | Path | OpenAI SDK method |
|---|---|---|
| Chat Completions | `POST /v1/venice/chat/completions` | `chat.completions.create` |
| Responses | `POST /v1/venice/responses` | `responses.create` |
| Embeddings | `POST /v1/venice/embeddings` | `embeddings.create` |
| Text-to-Speech | `POST /v1/venice/audio/speech` | `audio.speech.create` |
| Transcription | `POST /v1/venice/audio/transcriptions` | `audio.transcriptions.create` |

> **Streaming is not supported** — set `stream: false` (the default). Per-call metering needs the terminal usage block that a streamed response doesn't deliver. A `stream: true` request is refused with `400 streaming_not_supported`.

## Models

Pass any Venice **text**, **embedding**, **TTS**, or **STT** model id straight through in the `model` field — a `venice/` prefix is accepted and stripped (`venice/kimi-k2-5` → `kimi-k2-5`). There's **no allowlist**: any model in Venice's catalog works. (Image and video models run through the [x402 proxy](#image-and-video), not this endpoint.)

**Discover the full live catalog** — capabilities, context windows, and pricing — from Venice's public models endpoint (free, no key required):

```bash
curl "https://api.venice.ai/api/v1/models?type=text"        # chat / reasoning models
curl "https://api.venice.ai/api/v1/models?type=embedding"   # embedding models
```

Each model carries `model_spec.capabilities` (reasoning, vision, function calling, code, web search, E2EE, …) and `model_spec.pricing`, so an agent can select by capability and cost at runtime. A full per-model breakdown lives in the [vendor marketplace → Compute](../x402-directory/compute.md#venice-models).

### Featured models

A representative slice — **not** the full menu and **not** a fixed list. Prices are USD per 1M tokens, track Venice's catalog (refreshed ~weekly), and may change; you're billed the exact metered amount in `X-Floe-Cost-USDC`.

| Model | Capabilities | Context | Input $/1M | Output $/1M |
|---|---|---|---|---|
| `openai-gpt-oss-120b` | reasoning | 128K | $0.07 | $0.30 |
| `venice-uncensored-1-2` | vision · uncensored | 128K | $0.20 | $0.90 |
| `qwen3-vl-235b-a22b` | vision | 256K | $0.25 | $1.50 |
| `qwen3-coder-480b-a35b-instruct-turbo` | code | 256K | $0.35 | $1.50 |
| `kimi-k2-5` | reasoning · vision · code | 256K | $0.56 | $3.50 |
| `llama-3.3-70b` | tools | 128K | $0.70 | $2.80 |
| `zai-org-glm-5-2` | reasoning | 1M | $1.40 | $4.40 |
| `grok-4-20` | reasoning · vision · X search | 2M | $1.42 | $2.83 |
| `deepseek-v4-pro` | reasoning · code | 1M | $1.73 | $3.80 |
| `gemini-3-1-pro-preview` | reasoning · vision · audio · video | 1M | $2.50 | $15.00 |
| `claude-sonnet-4-6` | reasoning · vision · code | 1M | $3.60 | $18.00 |
| `claude-opus-4-8` | reasoning · vision · code | 1M | $6.00 | $30.00 |
| `openai-gpt-55` | reasoning · vision | 1M | $6.25 | $37.50 |

**Embeddings**

| Model | Input $/1M |
|---|---|
| `text-embedding-3-small` | $0.025 |
| `text-embedding-bge-m3` | $0.15 |
| `text-embedding-3-large` | $0.1625 |

### Pick by capability

- **Reasoning & tool use** — `claude-opus-4-8`, `openai-gpt-55`, `deepseek-v4-pro`, `kimi-k2-5`
- **Vision (image input)** — `qwen3-vl-235b-a22b`, `claude-sonnet-4-6`, `gemini-3-1-pro-preview`
- **Coding** — `qwen3-coder-480b-a35b-instruct-turbo`, `kimi-k2-7-code`, `openai-gpt-53-codex`
- **Long context (1M–2M)** — `grok-4-20` (2M), `claude-opus-4-8` (1M), `zai-org-glm-5-2` (1M)
- **Cheapest** — `e2ee-gpt-oss-20b-p` ($0.05/1M), `openai-gpt-oss-120b` ($0.07/1M)
- **Private / E2EE** — `e2ee-glm-5-1`, `e2ee-gpt-oss-120b-p` (run inside a TEE, end-to-end encrypted)
- **Uncensored** — `venice-uncensored-1-2`, `gemma-4-uncensored`
- **X / Twitter search** — `grok-4-20` (built-in X search via `venice_parameters`)

> **Privacy** — all Venice models are zero-retention. `e2ee-*` models additionally run inside a TEE with end-to-end encryption, so Venice never sees your plaintext prompt. Venice's `venice_parameters` (character slug, web search, E2EE) pass through unchanged.

## Chat completions

{% tabs %}
{% tab title="cURL" %}

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/venice/chat/completions \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kimi-k2-5",
    "messages": [{ "role": "user", "content": "Hello from x402" }]
  }'
```

{% endtab %}

{% tab title="TypeScript" %}

```ts
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://credit-api.floelabs.xyz/v1/venice",
  apiKey: process.env.FLOE_KEY, // your Floe agent key
});

const res = await client.chat.completions.create({
  model: "kimi-k2-5",
  messages: [{ role: "user", content: "Hello from x402" }],
});
console.log(res.choices[0].message.content);
```

{% endtab %}

{% tab title="Python" %}

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://credit-api.floelabs.xyz/v1/venice",
    api_key=os.environ["FLOE_KEY"],  # your Floe agent key
)

res = client.chat.completions.create(
    model="kimi-k2-5",
    messages=[{"role": "user", "content": "Hello from x402"}],
)
print(res.choices[0].message.content)
```

{% endtab %}
{% endtabs %}

## Embeddings

{% tabs %}
{% tab title="TypeScript" %}

```ts
const res = await client.embeddings.create({
  model: "text-embedding-bge-m3",
  input: "x402 makes agents pay per call",
});
console.log(res.data[0].embedding.length);
```

{% endtab %}

{% tab title="Python" %}

```python
res = client.embeddings.create(
    model="text-embedding-bge-m3",
    input="x402 makes agents pay per call",
)
print(len(res.data[0].embedding))
```

{% endtab %}
{% endtabs %}

## Voice

Venice's TTS and transcription models are served first-class on the OpenAI-compatible audio endpoints. **Text-to-speech** meters per input character; **transcription** meters per audio second (from the response `duration`). Discover the live voice catalog and prices — free, no key required:

```bash
curl "https://api.venice.ai/api/v1/models?type=tts"   # text-to-speech models
curl "https://api.venice.ai/api/v1/models?type=asr"   # transcription models
```

{% tabs %}
{% tab title="TTS (TypeScript)" %}

```ts
const audio = await client.audio.speech.create({
  model: "tts-kokoro", // cheapest; tts-inworld-1-5-max, tts-orpheus, … also work
  voice: "af_sky",
  input: "Payments for agents, without the wallet.",
});
```

{% endtab %}

{% tab title="STT (Python)" %}

```python
with open("call.wav", "rb") as f:
    tr = client.audio.transcriptions.create(model="openai/whisper-large-v3", file=f)
print(tr.text)
```

{% endtab %}
{% endtabs %}

Representative models (USD, Venice list — you're billed the exact metered amount in `X-Floe-Cost-USDC`): TTS per 1M chars — `tts-kokoro` $3.50 · `tts-inworld-1-5-max` $12.50 · `tts-xai-v1` $18.75 · `tts-orpheus` $62.50 · `tts-elevenlabs-turbo-v2-5` $62.50. STT per second — `stt-xai-v1` $0.0000315 · `nvidia/parakeet-tdt-0.6b-v3`, `openai/whisper-large-v3`, `fal-ai/wizper` $0.0001 · `elevenlabs/scribe-v2` $0.000167.

## Image and video

Venice's image and video endpoints are **not** on the first-class OpenAI surface yet. Call them through Floe's generic [x402 proxy](x402-facilitator.md) — Floe pays Venice's exact x402 charge from your credit line:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: venice-image-001" \
  -d '{
    "url": "https://api.venice.ai/api/v1/image/generate",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "body": "{\"model\":\"venice-sd35\",\"prompt\":\"a neon-lit city at night\",\"width\":1024,\"height\":1024}"
  }'
```

See the x402 directory for ready-made samples: [Compute](../x402-directory/compute.md), [Voice](../x402-directory/voice.md), [Image](../x402-directory/image.md).

## Errors

Successful calls return Venice's response verbatim. Upstream Venice errors are passed through **unchanged and not charged** (`X-Floe-Payment: passthrough`). Floe-originated refusals use these bodies:

| HTTP | `error` | When |
|---|---|---|
| `400` | `streaming_not_supported` | `stream: true` was set |
| `400` | `Invalid JSON body` | Request body wasn't valid JSON |
| `401` | `wrong_credential_type` | A publishable key (`floe_live_…`) was used instead of an agent key |
| `402` | `budget_exhausted` | Credit-line or session spend ceiling reached (`scope`: `credit_line` \| `session`) |
| `402` | `reimbursement_required` | Outstanding Venice spend couldn't be collected from the agent wallet — fund it to resume |
| `402` | `reimbursement_capacity_exceeded` | This call plus outstanding spend would exceed what the agent wallet can reimburse |
| `502` | `venice_pool_unfunded` | Floe's pool couldn't be topped up to serve the call |
| `503` | `venice_unavailable` | The Venice proxy isn't configured on this deployment |

See the full [Error Codes](../reference/error-codes.md) reference for the rest of the Floe API.
