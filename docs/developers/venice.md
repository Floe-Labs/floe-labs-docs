# Venice AI (OpenAI-compatible)

Floe gives you a **drop-in OpenAI base URL** for [Venice AI](https://venice.ai) inference. Point any OpenAI SDK at Floe with your Floe agent key — no Venice account, no Venice key, no wallet. Floe funds Venice from your credit line and meters each call.

```
Base URL:  https://credit-api.floelabs.xyz/v1/venice
Auth:      Authorization: Bearer <your floe agent key>   (prefix floe_…)
```

> Use an **agent key** (`floe_…`), not a publishable key (`floe_live_…`). Mint one in the [Developer Dashboard](developer-dashboard.md) or via `POST /v1/developer/agents/:agentId/keys`.

## How it works

Floe keeps a single prepaid Venice balance funded from a pooled wallet. On every call Floe:

1. Checks your agent's [spend controls](spend-controls.md) (credit-line ceiling + session limit) before forwarding.
2. Authenticates to Venice with the pooled wallet and forwards your request.
3. Meters the response by token usage and debits your credit line at the metered cost.

You are billed the **token cost of your call** — not the pool top-up. The cost is returned on every response:

| Header | Meaning |
|---|---|
| `X-Floe-Cost-USDC` | This call's cost in raw USDC (6 decimals) |
| `X-Floe-Payment-Amount` | Same cost as a decimal USDC string |
| `X-Floe-Payment` | `venice` (metered) or `passthrough` (upstream error, not charged) |
| `X-Venice-Balance-USD` | Venice-reported pool balance, when present |

## Supported endpoints

These are served first-class and metered per token:

| Endpoint | Path | OpenAI SDK method |
|---|---|---|
| Chat Completions | `POST /v1/venice/chat/completions` | `chat.completions.create` |
| Responses | `POST /v1/venice/responses` | `responses.create` |
| Embeddings | `POST /v1/venice/embeddings` | `embeddings.create` |

Models are passed straight through — use `kimi-k2-5`, `llama-3.3-70b`, `text-embedding-bge-m3`, etc. A `venice/` prefix is accepted and stripped. Venice's `venice_parameters` (character slug, web search, E2EE) pass through unchanged.

> **Streaming is not supported** — set `stream: false` (the default). Per-call metering needs the terminal usage block that a streamed response doesn't deliver. A `stream: true` request is refused with `400 streaming_not_supported`.

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

## Image, voice, and video

Venice's image, text-to-speech, transcription, and video endpoints are **not** on the first-class OpenAI surface yet. Call them through Floe's generic [x402 proxy](x402-facilitator.md) — Floe pays Venice's exact x402 charge from your credit line:

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
