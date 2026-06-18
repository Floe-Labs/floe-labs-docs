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
**Price:** at-cost per token (+5% buffer) · debited from your Floe credit line · capped server-side

Call **any** model OpenAI or Anthropic ships — pass the model id in the request body. There is **no model allowlist and no model lock**: if a provider sells it and Floe can price it, the proxy serves it. The featured models below are just current favorites, not a fixed menu.

Two headers do the work:

| Header | Value | Purpose |
|--------|-------|---------|
| `Authorization` | `Bearer floe_<agent key>` | Authenticates the agent and bills its credit line |
| `X-Floe-Provider-Key` | `<your OpenAI/Anthropic key>` | Pass-through key used to call upstream — never stored |

### Featured models

| Model | Provider | Input ($/1M tokens) | Output ($/1M tokens) |
|---|---|---|---|
| `gpt-5.5` | OpenAI | $5.00 | $30.00 |
| `gpt-5.4-mini` | OpenAI | $0.75 | $4.50 |
| `claude-opus-4-8` | Anthropic | $5.00 | $25.00 |
| `claude-sonnet-4-6` | Anthropic | $3.00 | $15.00 |
| `claude-haiku-4-5` | Anthropic | $1.00 | $5.00 |

Rates track the maintained LiteLLM cost map (refreshed weekly) and may change. The exact USDC charge for each call is returned in the `X-Floe-Cost-USDC` response header.

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

When the credit line (or session cap) is exhausted, the call is refused with `402` **before** any upstream request runs — spend stops at the cap.

---

## x402 compute vendors

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Venice AI | Chat Completions, Responses, Embeddings | metered / tokens | Verified |

Venice chat, responses, and embeddings are served through Floe's **drop-in OpenAI-compatible surface** — point any OpenAI SDK at `https://credit-api.floelabs.xyz/v1/venice` with your Floe agent key. No Venice key, no request envelope. See the full guide: [**Venice AI (OpenAI-compatible)**](../developers/venice.md).

---

## Venice AI — Chat Completions

**Endpoint:** `POST https://credit-api.floelabs.xyz/v1/venice/chat/completions`
**Price:** metered per token · Base mainnet · x402 v2

> OpenAI-compatible chat across text & reasoning models, with tool use. Set `stream: false`.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/venice/chat/completions \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"kimi-k2-5","messages":[{"role":"user","content":"Hello from x402"}]}'
```

## Venice AI — Responses

**Endpoint:** `POST https://credit-api.floelabs.xyz/v1/venice/responses`
**Price:** metered per token · Base mainnet · x402 v2

> Venice's Responses API — structured output and tool calls with built-in state.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/venice/responses \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"kimi-k2-5","input":"Explain x402 in one sentence."}'
```

## Venice AI — Embeddings

**Endpoint:** `POST https://credit-api.floelabs.xyz/v1/venice/embeddings`
**Price:** metered per token · Base mainnet · x402 v2

> Vector embeddings for retrieval, clustering, and semantic search.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/venice/embeddings \
  -H "Authorization: Bearer $FLOE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"text-embedding-bge-m3","input":"x402 makes agents pay per call"}'
```
