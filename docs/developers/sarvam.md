# Sarvam AI — sovereign Indic inference

Run inference against **Sarvam AI** — India's "sovereign AI" stack for **22+ Indian languages**. Chat with the **Sarvam 105B / 30B** Indic LLMs and reach Sarvam's proprietary **voice, translation, transliteration, language-ID, and document-digitization** models — all paid **per call** from your Floe credit line. Floe meters every call and bills the exact cost.

Sarvam is served on two planes, both keyless for you — **Floe holds the Sarvam subscription key**, so you never create a Sarvam account or manage a key:

- **Chat** runs on Floe's **OpenAI-compatible gateway** — point any OpenAI SDK at Floe and pass the model as `sarvam/<id>`.
- **Voice & language** (TTS, STT, translate, transliterate, language-ID, docs) run through the **[Floe marketplace shim](marketplace-shim.md)**, reached with a single `POST /v1/proxy/fetch`.

```
Chat base URL:   https://credit-api.floelabs.xyz/v1        (OpenAI-compatible; model "sarvam/<id>")
Voice/Language:  https://marketplace.floelabs.xyz/v1/<route>/sarvam   (via POST /v1/proxy/fetch)
Auth:            Authorization: Bearer <your floe agent key>   (prefix floe_…)
```

> Use an **agent key** (`floe_…`), not a publishable key (`floe_live_…`). Mint one in the [Developer Dashboard](developer-dashboard.md) or via `POST /v1/developer/agents/:agentId/keys`.

## How it works

Floe authenticates to Sarvam with a **Floe-held api-subscription-key** and forwards your request. On every call Floe:

1. Checks your agent's [spend controls](spend-controls.md) (credit-line ceiling + session limit) before forwarding.
2. Authenticates to Sarvam server-side and forwards your request.
3. Meters the response — per token (chat), per character (TTS / translate / transliterate / language-ID), per audio second (STT / speech-translate), or per page (docs) — and debits your credit line at the metered cost.

You're billed the **metered cost of each call** — Sarvam's INR list price converted at ~₹83/$ plus a small (5%) Floe service margin — never a pool top-up. The exact charge is returned on every response:

| Header | Meaning |
|---|---|
| `X-Floe-Cost-USDC` | This call's cost in raw USDC (6 decimals) |
| `X-Floe-Payment-Amount` | Same cost as a decimal USDC string |
| `X-Floe-Payment` | `sarvam` (metered) or `passthrough` (upstream error, not charged) |

## Supported endpoints

| Capability | Route | Metering | Reached via |
|---|---|---|---|
| Chat (Indic LLM) | `POST /v1/chat/completions` · model `sarvam/<id>` | per token | Gateway (OpenAI SDK) |
| Text-to-Speech (Bulbul) | `POST /v1/tts/sarvam` | per character | `/v1/proxy/fetch` |
| Speech-to-Text (Saaras) | `POST /v1/stt/sarvam` | per audio second | `/v1/proxy/fetch` |
| Speech-to-Text-Translate | `POST /v1/stt-translate/sarvam` | per audio second | `/v1/proxy/fetch` |
| Translation (Mayura) | `POST /v1/translate/sarvam` | per character | `/v1/proxy/fetch` |
| Transliteration | `POST /v1/transliterate/sarvam` | per character | `/v1/proxy/fetch` |
| Language ID | `POST /v1/lid/sarvam` | per character | `/v1/proxy/fetch` |
| Document digitization (Sarvam Vision) | `POST /v1/doc/sarvam` | per page | `/v1/proxy/fetch` |

> The voice/language routes above are **marketplace-shim** paths on `marketplace.floelabs.xyz` — call them by passing the full `https://marketplace.floelabs.xyz/v1/<route>/sarvam` URL to `POST /v1/proxy/fetch`. Document digitization is **async** and in **preview**.

> **Streaming is not supported on metered chat** — set `stream: false` (the default). Per-call metering needs the terminal usage block that a streamed response doesn't deliver.

## Models

Pass the chat model in the `model` field with a `sarvam/` prefix (`sarvam/sarvam-105b`). For the voice/language routes, pick the model with the request body's `model` field (e.g. `bulbul:v2`, `saaras:v3`, `mayura:v1`).

### Chat models

Prices are USD per 1M tokens — Sarvam's INR list converted at ~₹83/$ plus a 5% Floe margin. You're billed the exact metered amount in `X-Floe-Cost-USDC`.

| Model | id | Context | Input $/1M | Output $/1M |
|---|---|---|---|---|
| Sarvam 105B | `sarvam/sarvam-105b` | 128K | $0.048 | $0.193 |
| Sarvam 30B | `sarvam/sarvam-30b` | 64K | $0.030 | $0.121 |

### Voice & language models

Prices are Sarvam's INR list converted at ~₹83/$ plus a 5% Floe margin, and may change; you're billed the exact metered amount.

| Model | id | Task | Route | Price |
|---|---|---|---|---|
| Bulbul v2 | `bulbul:v2` | Text-to-Speech | `/v1/tts/sarvam` | ~₹30 / 10k chars ≈ $0.36 / 10k |
| Bulbul v3 | `bulbul:v3` | Text-to-Speech | `/v1/tts/sarvam` | ~₹30 / 10k chars ≈ $0.36 / 10k |
| Saaras v3 | `saaras:v3` | Speech-to-Text | `/v1/stt/sarvam` | ~₹30 / hr ≈ $0.36 / hr |
| Saarika v2.5 | `saarika:v2.5` | Speech-to-Text | `/v1/stt/sarvam` | ~₹30 / hr ≈ $0.36 / hr |
| Saaras v2.5 | `saaras:v2.5` | Speech-to-Text-Translate | `/v1/stt-translate/sarvam` | ~₹30 / hr ≈ $0.36 / hr |
| Mayura v1 | `mayura:v1` | Translation | `/v1/translate/sarvam` | ~₹20 / 10k chars ≈ $0.24 / 10k |
| Sarvam-Translate v1 | `sarvam-translate:v1` | Translation | `/v1/translate/sarvam` | ~₹20 / 10k chars ≈ $0.24 / 10k |
| — | (transliteration) | Transliteration | `/v1/transliterate/sarvam` | per character |
| Text-LID | `text-lid` | Language ID | `/v1/lid/sarvam` | ~₹3.5 / 10k chars |
| Sarvam Vision | (doc digitization) | OCR → html/md/json | `/v1/doc/sarvam` | ~₹0.5 / page (async, preview) |

### Pick by capability

- **Indic chat, highest quality** — `sarvam/sarvam-105b` (128K context, flagship Indic reasoning + chat).
- **Indic chat, low latency** — `sarvam/sarvam-30b` (64K context, fast turns for voice/agent loops).
- **Speech in → text out** — `saaras:v3` / `saarika:v2.5` via `/v1/stt/sarvam`.
- **Speech in → English/other text out** — `saaras:v2.5` via `/v1/stt-translate/sarvam`.
- **Text → natural Indic speech** — `bulbul:v2` / `bulbul:v3` via `/v1/tts/sarvam`.
- **Cross-language text** — `mayura:v1` / `sarvam-translate:v1` via `/v1/translate/sarvam`; script conversion via `/v1/transliterate/sarvam`.
- **Detect the language of a string** — `text-lid` via `/v1/lid/sarvam`.
- **Digitize a scanned document (OCR → structured html/md/json)** — Sarvam Vision via `/v1/doc/sarvam` (async, preview).

> **Languages** — Sarvam covers 22+ Indian languages (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, and more). Pass language hints (e.g. `target_language_code: "hi-IN"`) on the voice/translate routes as Sarvam documents.

## Chat completions

Chat runs on Floe's OpenAI-compatible gateway — pass the model as `sarvam/<id>`.

{% tabs %}
{% tab title="cURL" %}
```bash
curl -X POST https://credit-api.floelabs.xyz/v1/chat/completions \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sarvam/sarvam-105b",
    "messages": [{ "role": "user", "content": "नमस्ते! भारत की राजधानी क्या है?" }]
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
  model: "sarvam/sarvam-105b",
  messages: [{ role: "user", content: "नमस्ते! भारत की राजधानी क्या है?" }],
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
    model="sarvam/sarvam-105b",
    messages=[{"role": "user", "content": "नमस्ते! भारत की राजधानी क्या है?"}],
)
print(res.choices[0].message.content)
```
{% endtab %}
{% endtabs %}

## Text-to-Speech (Bulbul)

Reach the shim route through `POST /v1/proxy/fetch`. Floe meters per input character and returns the exact cost in `X-Floe-Cost-USDC`.

{% tabs %}
{% tab title="cURL" %}
```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/tts/sarvam", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"bulbul:v2\",\"text\":\"भुगतान हो गया।\",\"target_language_code\":\"hi-IN\"}"}'
```
{% endtab %}

{% tab title="TypeScript" %}
```ts
const res = await fetch("https://credit-api.floelabs.xyz/v1/proxy/fetch", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.FLOE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://marketplace.floelabs.xyz/v1/tts/sarvam",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "bulbul:v2",
      text: "भुगतान हो गया।",
      target_language_code: "hi-IN",
    }),
  }),
});
const out = await res.json();               // audio in out.result.audioBase64
console.log(res.headers.get("X-Floe-Cost-USDC"));
```
{% endtab %}

{% tab title="Python" %}
```python
import os, json, requests

res = requests.post(
    "https://credit-api.floelabs.xyz/v1/proxy/fetch",
    headers={
        "Authorization": f"Bearer {os.environ['FLOE_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "url": "https://marketplace.floelabs.xyz/v1/tts/sarvam",
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(
            {"model": "bulbul:v2", "text": "भुगतान हो गया।", "target_language_code": "hi-IN"}
        ),
    },
)
out = res.json()                            # audio in out["result"]["audioBase64"]
print(res.headers.get("X-Floe-Cost-USDC"))
```
{% endtab %}
{% endtabs %}

## Speech-to-Text (Saaras)

Pass an `audioUrl`; Floe probes the true duration server-side and bills per audio second. The transcript comes back in `result.text`.

{% tabs %}
{% tab title="cURL" %}
```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/stt/sarvam", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"saaras:v3\",\"audioUrl\":\"https://dpgr.am/spacewalk.wav\",\"language_code\":\"hi-IN\"}"}'
```
{% endtab %}

{% tab title="TypeScript" %}
```ts
const res = await fetch("https://credit-api.floelabs.xyz/v1/proxy/fetch", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.FLOE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://marketplace.floelabs.xyz/v1/stt/sarvam",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "saaras:v3",
      audioUrl: "https://dpgr.am/spacewalk.wav",
      language_code: "hi-IN",
    }),
  }),
});
const out = await res.json();               // transcript in out.result.text
console.log(res.headers.get("X-Floe-Cost-USDC"));
```
{% endtab %}

{% tab title="Python" %}
```python
import os, json, requests

res = requests.post(
    "https://credit-api.floelabs.xyz/v1/proxy/fetch",
    headers={
        "Authorization": f"Bearer {os.environ['FLOE_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "url": "https://marketplace.floelabs.xyz/v1/stt/sarvam",
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(
            {"model": "saaras:v3", "audioUrl": "https://dpgr.am/spacewalk.wav", "language_code": "hi-IN"}
        ),
    },
)
out = res.json()                            # transcript in out["result"]["text"]
print(res.headers.get("X-Floe-Cost-USDC"))
```
{% endtab %}
{% endtabs %}

## Translation (Mayura)

Metered per input character. Pass `source_language_code` / `target_language_code` as Sarvam documents.

{% tabs %}
{% tab title="cURL" %}
```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/v1/translate/sarvam", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"mayura:v1\",\"input\":\"Payment settled.\",\"source_language_code\":\"en-IN\",\"target_language_code\":\"hi-IN\"}"}'
```
{% endtab %}

{% tab title="TypeScript" %}
```ts
const res = await fetch("https://credit-api.floelabs.xyz/v1/proxy/fetch", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.FLOE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://marketplace.floelabs.xyz/v1/translate/sarvam",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mayura:v1",
      input: "Payment settled.",
      source_language_code: "en-IN",
      target_language_code: "hi-IN",
    }),
  }),
});
const out = await res.json();               // translation in out.result
console.log(res.headers.get("X-Floe-Cost-USDC"));
```
{% endtab %}

{% tab title="Python" %}
```python
import os, json, requests

res = requests.post(
    "https://credit-api.floelabs.xyz/v1/proxy/fetch",
    headers={
        "Authorization": f"Bearer {os.environ['FLOE_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "url": "https://marketplace.floelabs.xyz/v1/translate/sarvam",
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(
            {
                "model": "mayura:v1",
                "input": "Payment settled.",
                "source_language_code": "en-IN",
                "target_language_code": "hi-IN",
            }
        ),
    },
)
out = res.json()                            # translation in out["result"]
print(res.headers.get("X-Floe-Cost-USDC"))
```
{% endtab %}
{% endtabs %}

## Errors

Successful calls return Sarvam's response verbatim (voice/language responses are wrapped in `result` by the shim). Upstream Sarvam errors are passed through **unchanged and not charged** (`X-Floe-Payment: passthrough`). Floe-originated refusals use these bodies:

| HTTP | `error` | When |
|---|---|---|
| `400` | `Invalid JSON body` | Request body wasn't valid JSON |
| `400` | `streaming_not_supported` | `stream: true` was set on a metered chat call |
| `401` | `wrong_credential_type` | A publishable key (`floe_live_…`) was used instead of an agent key |
| `402` | `budget_exhausted` | Credit-line or session spend ceiling reached (`scope`: `credit_line` \| `session`) |
| `402` | `reimbursement_required` | Outstanding spend couldn't be collected from the agent wallet — fund it to resume |
| `402` | `reimbursement_capacity_exceeded` | This call plus outstanding spend would exceed what the agent wallet can reimburse |
| `503` | `vendor_unavailable` | The Sarvam shim isn't configured on this deployment |

See the full [Error Codes](../reference/error-codes.md) reference for the rest of the Floe API.
