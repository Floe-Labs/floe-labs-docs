---
icon: cpu
---

# Compute

LLM inference and embeddings — payable with Floe credit on Base.

Two ways to buy compute through the spend layer:

- **Floe Metered LLM (native)** — one OpenAI-compatible endpoint that fronts **any** OpenAI or Anthropic model. No model lock. Billed at-cost per token to your credit line, capped server-side. *(Below.)*
- **x402 compute vendors** — third-party providers (e.g. Venice AI) reached through the x402 proxy. *(Further down.)*

---

## Floe Metered LLM (native) — no model lock

**Chat:** `POST https://credit-api.floelabs.xyz/v1/llm/chat/completions` · OpenAI-compatible
**Embeddings:** `POST https://credit-api.floelabs.xyz/v1/llm/embeddings`
**Price:** at-cost per token (+5% buffer) · debited from your Floe agent balance · capped server-side

Call **any** model OpenAI or Anthropic ships — pass the model id in the request body. There is **no model allowlist and no model lock**: if a provider sells it and Floe can price it, the proxy serves it. The featured models below are just current favorites, not a fixed menu.

Two headers do the work:

| Header | Value | Purpose |
|--------|-------|---------|
| `Authorization` | `Bearer floe_<agent key>` | Authenticates the agent and bills its Floe balance |
| `X-Floe-Provider-Key` | `<your OpenAI/Anthropic key>` | Pass-through key used to call upstream — never stored |

This BYOK proxy prices from Floe's maintained LiteLLM cost map — there's **no model allowlist**; pass any model your provider serves. (The **keyless** gateway's catalog is separate — see [Keyless Inference](../developers/keyless-inference.md) or `GET /v1/models`.) The exact USDC charge for each call is returned in the `X-Floe-Cost-USDC` response header.

> This `/v1/llm` surface is the **BYOK metered proxy** — you bring a provider key; Floe prices the call from its LiteLLM cost map and accepts the model id **with or without** a `provider/` prefix (`gpt-5.5` or `openai/gpt-5.5` — the prefix is stripped). The keyless gateway at `/v1/chat/completions` is different: no provider key, and it resolves an **exact** catalog id — the fully-qualified `provider/model` (a bare `gpt-5.5` is rejected). See [Keyless Inference](../developers/keyless-inference.md).

### Drop-in OpenAI client

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://credit-api.floelabs.xyz/v1/llm",
    api_key="floe_<agent key>",                         # -> Authorization: Bearer ...
    default_headers={"X-Floe-Provider-Key": "sk-..."},  # your OpenAI/Anthropic key
)

resp = client.chat.completions.create(
    model="claude-sonnet-4-6",   # any OpenAI/Anthropic model — no lock
    messages=[{"role": "user", "content": "Hello from Floe"}],
)
```

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/llm/chat/completions \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "X-Floe-Provider-Key: $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.5","messages":[{"role":"user","content":"Hello from Floe"}]}'
```

### When the ceiling is hit

The ceiling is checked **before** any upstream request runs, so spend stops at the cap and a refused call costs nothing. Which ceiling applies depends on how the agent is funded:

| Funding mode | Ceiling | `402` response body |
|---|---|---|
| **Pay-as-you-go** (default) | The agent's **spendable balance** — deposits and welcome credit, minus settled and in-flight spend and any held task budgets | `{"error":"budget_exhausted","scope":"wallet","remaining_raw":"0"}` |
| **Credit line** (opt-in) | Remaining credit-line headroom (credit limit − drawn) | `{"error":"budget_exhausted","scope":"credit_line","remaining_raw":"0"}` |
| Either, with a session cap | Whichever binds first | `{"error":"budget_exhausted","scope":"session","remaining_raw":"0"}` |

On a pay-as-you-go agent, a borrow limit staged for a later credit-line upgrade (`--credit-limit` on the CLI, `borrowLimitRaw` on the API) is **not** a spend allowance — only funded balance is spendable. Top up the agent, or [open a credit line](../developers/credit-api.md#post-v1developeragentsagentidopen-credit-line), to raise the ceiling.

---

## x402 compute vendors

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Venice AI | Chat Completions, Responses, Embeddings | metered / tokens | Verified |
| Sarvam AI | Chat Completions (Indic LLM) | metered / tokens | Verified |

Venice chat, responses, and embeddings are served through Floe's **drop-in OpenAI-compatible surface** — point any OpenAI SDK at `https://credit-api.floelabs.xyz/v1/venice` with your Floe agent key. No Venice key, no request envelope. See the full guide below: [**Venice models**](#venice-models).

Sarvam AI chat is served on Floe's **OpenAI-compatible gateway** — call `POST /v1/chat/completions` with the model `sarvam/<id>` and your Floe agent key. No Sarvam key. Its proprietary voice, translation, transliteration, language-ID, and document models run through the marketplace shim (see [Voice](voice.md)). See the full guide below: [**Sarvam AI — Chat Completions**](#sarvam-ai-chat-completions).

---

## Sarvam AI — Chat Completions

**Endpoint:** `POST https://credit-api.floelabs.xyz/v1/chat/completions` · model `sarvam/<id>`
**Price:** metered per token · billed from your Floe balance

> Indic-language chat (Sarvam 105B / 30B) across 22+ Indian languages — India's sovereign-AI stack. OpenAI-compatible; set `stream: false`. Prices are Sarvam's INR list converted at ~₹83/$ plus a 5% Floe margin.

See [Sarvam AI](../developers/sarvam.md) for the full model list and per-token pricing.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/chat/completions \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sarvam/sarvam-105b","messages":[{"role":"user","content":"नमस्ते! भारत की राजधानी क्या है?"}]}'
```

---

## Venice models

Venice exposes its full chat and embedding catalog through Floe's metered Venice routes (separate chat, responses, and embeddings endpoints, below) — from fast open-source to frontier, including private TEE-attested (E2EE) and uncensored options. Pass the model id straight through; there's no allowlist. The sections below cover [how to call them](#venice-ai-chat-completions) and [how to pick by capability](#pick-a-model); the full catalog with per-token pricing is served from the live endpoint below.

Discover it live (capabilities, context windows, pricing) from Venice's public, no-key endpoint:

```bash
curl "https://api.venice.ai/api/v1/models?type=text"        # chat / reasoning models
curl "https://api.venice.ai/api/v1/models?type=embedding"   # embedding models
```

> Capabilities shown below: **reasoning · vision · code · audio in · video in · E2EE · X search**. Most models additionally support tool/function calling, structured output, and web search. Prices are USD per 1M tokens, track Venice's catalog (refreshed ~weekly), and may change — you're billed the exact metered amount in `X-Floe-Cost-USDC`.

The full current catalog — every chat and embedding model with per-token pricing — is served from the live, no-key endpoint above and mirrored on the marketplace card [`/vendors/venice-compute`](https://dev-dashboard.floelabs.xyz/vendors/venice-compute), the canonical Venice model reference. Pass any listed id as the `model` field.

---

## Venice AI — Chat Completions

**Endpoint:** `POST https://credit-api.floelabs.xyz/v1/venice/chat/completions`
**Price:** metered per token · billed from your Floe balance

> OpenAI-compatible chat across text & reasoning models, with tool use. Set `stream: false`.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/venice/chat/completions \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"kimi-k2-5","messages":[{"role":"user","content":"Hello from x402"}]}'
```

## Venice AI — Responses

**Endpoint:** `POST https://credit-api.floelabs.xyz/v1/venice/responses`
**Price:** metered per token · billed from your Floe balance

> Venice's Responses API — structured output and tool calls with built-in state.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/venice/responses \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"kimi-k2-5","input":"Explain x402 in one sentence."}'
```

## Venice AI — Embeddings

**Endpoint:** `POST https://credit-api.floelabs.xyz/v1/venice/embeddings`
**Price:** metered per token · billed from your Floe balance

> Vector embeddings for retrieval, clustering, and semantic search.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/venice/embeddings \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"text-embedding-bge-m3","input":"x402 makes agents pay per call"}'
```

### Pick a model

The curated Venice chat models — with model ids, latency tier, context window, and tool-calling support — live on the marketplace at [`/vendors/venice-compute`](https://dev-dashboard.floelabs.xyz/vendors/venice-compute). That card is the canonical model reference; pass any listed id as the `model` field. For a voice agent, start at the fast end (e.g. a small instruct model) and reach for a frontier reasoning model only when reasoning matters more than turn speed.

---

## Voice agents: Vapi + Venice through Floe

A voice agent has two cost centers: the **model's tokens** (its brain) and the **paid tool calls** it makes (search, transcription, your own APIs). Route both through the Floe proxy and a **single credit line meters and caps both** — one ceiling, no separate Venice key or USDC to manage.

The reference implementation is **`vapi-floe-poc`**. It works like this:

1. Point your Vapi assistant's LLM at a **`custom-llm`** provider whose URL is a tiny shim you host.
2. The shim forwards Vapi's OpenAI-shaped chat request to Venice's chat endpoint **through the Floe proxy** (`POST /v1/proxy/fetch` → `api.venice.ai/api/v1/chat/completions`).
3. The agent's tools already call paid APIs through the **same** proxy with the **same** Floe key.

Because every request — model and tools — debits the same Floe credit line, your session cap is a unified ceiling. When it's exhausted, the next call is refused with `402` before any upstream spend.

**The shim** (the "compute" plane) forwards one request:

```typescript
// Vapi POSTs an OpenAI chat request here; we pay Venice through Floe.
const veniceBody = JSON.stringify({ model, stream: false, messages, tools });

const res = await fetch("https://credit-api.floelabs.xyz/v1/proxy/fetch", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.FLOE_API_KEY}`,  // same key as tools
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://api.venice.ai/api/v1/chat/completions",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: veniceBody,  // Venice request, serialized to a string
  }),
});

const completion = await res.json();
const costUsdc = res.headers.get("X-Floe-Payment-Amount");  // per-call cost
```

**The Vapi assistant** points its model at that shim:

```typescript
model: {
  provider: "custom-llm",
  url: `${SERVER_URL}/llm`,   // your shim — forwards to Venice via Floe
  model: "llama-3.2-3b",      // any id from /vendors/venice-compute
}
```

Pick the `model` id from the marketplace card at [`/vendors/venice-compute`](https://dev-dashboard.floelabs.xyz/vendors/venice-compute) — for voice, a small low-latency model with tool calling keeps turns snappy. Venice's raw x402 settlement (Sign-In-With-X, balance, top-up, payment headers) is entirely Floe's job; the shim only needs a Floe API key.
