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

Venice chat, responses, and embeddings are served through Floe's **drop-in OpenAI-compatible surface** — point any OpenAI SDK at `https://credit-api.floelabs.xyz/v1/venice` with your Floe agent key. No Venice key, no request envelope. See the full guide: [**Venice AI — Model Inference**](../developers/venice.md).

---

## Venice models

Venice exposes **90+ chat models and 9 embedding models** through the same metered endpoint — from fast open-source to frontier, including private TEE-attested (E2EE) and uncensored options. Pass the model id straight through; there's no allowlist. The [Venice guide](../developers/venice.md#models) covers how to call them and pick by capability — the full current catalog with per-token pricing is below.

Discover it live (capabilities, context windows, pricing) from Venice's public, no-key endpoint:

```bash
curl "https://api.venice.ai/api/v1/models?type=text"        # chat / reasoning models
curl "https://api.venice.ai/api/v1/models?type=embedding"   # embedding models
```

> Capabilities shown below: **reasoning · vision · code · audio in · video in · E2EE · X search**. Most models additionally support tool/function calling, structured output, and web search. Prices are USD per 1M tokens, track Venice's catalog (refreshed ~weekly), and may change — you're billed the exact metered amount in `X-Floe-Cost-USDC`.

### Embedding models

| Model | Input $/1M |
|---|---|
| `text-embedding-bge-en-icl` | $0.0125 |
| `text-embedding-multilingual-e5-large-instruct` | $0.0125 |
| `text-embedding-nemotron-embed-vl-1b-v2` | $0.0125 |
| `text-embedding-qwen3-0-6b` | $0.0125 |
| `text-embedding-qwen3-8b` | $0.0125 |
| `text-embedding-3-small` | $0.025 |
| `text-embedding-bge-m3` | $0.15 |
| `text-embedding-3-large` | $0.1625 |
| `gemini-embedding-2-preview` | $0.25 |

### Chat models

<details>

<summary>Full chat catalog — all 91 models, cheapest first</summary>

| Model | Capabilities | Context | Input $/1M | Output $/1M |
|---|---|---|---|---|
| `e2ee-gpt-oss-20b-p` | reasoning · E2EE | 128K | $0.05 | $0.19 |
| `e2ee-qwen-2-5-7b-p` | E2EE | 32K | $0.05 | $0.13 |
| `openai-gpt-oss-120b` | reasoning | 128K | $0.07 | $0.30 |
| `nvidia-nemotron-3-nano-30b-a3b` | — | 128K | $0.075 | $0.30 |
| `mistral-small-3-2-24b-instruct` | — | 256K | $0.0938 | $0.25 |
| `qwen3-5-9b` | reasoning · vision | 256K | $0.10 | $0.15 |
| `google-gemma-3-27b-it` | vision | 198K | $0.12 | $0.20 |
| `google-gemma-4-31b-it` | reasoning · vision · video in | 256K | $0.12 | $0.36 |
| `zai-org-glm-4.7-flash` | reasoning | 128K | $0.125 | $0.50 |
| `e2ee-gpt-oss-120b-p` | reasoning · E2EE | 128K | $0.13 | $0.65 |
| `e2ee-gemma-4-31b` | reasoning · E2EE | 32K | $0.139 | $0.43 |
| `e2ee-gemma-3-27b-p` | E2EE | 40K | $0.14 | $0.50 |
| `nvidia-nemotron-cascade-2-30b-a3b` | reasoning | 256K | $0.14 | $0.80 |
| `olafangensan-glm-4.7-flash-heretic` | reasoning | 200K | $0.14 | $0.80 |
| `llama-3.2-3b` | — | 128K | $0.15 | $0.60 |
| `qwen3-235b-a22b-instruct-2507` | — | 128K | $0.15 | $0.75 |
| `gemma-4-uncensored` | vision · uncensored | 256K | $0.1625 | $0.50 |
| `google-gemma-4-26b-a4b-it` | reasoning · vision · video in | 256K | $0.1625 | $0.50 |
| `deepseek-v4-flash` | reasoning · code | 1M | $0.17 | $0.35 |
| `xiaomi-mimo-v2-5` | reasoning · vision · code · audio in · video in | 1M | $0.175 | $0.35 |
| `e2ee-qwen3-6-35b-a3b` | reasoning · code · E2EE | 32K | $0.182 | $1.18 |
| `mistral-small-2603` | reasoning · vision · code | 256K | $0.1875 | $0.75 |
| `openai-gpt-4o-mini-2024-07-18` | vision | 128K | $0.1875 | $0.75 |
| `e2ee-gemma-4-26b-a4b-uncensored-p` | E2EE · uncensored | 64K | $0.19 | $0.88 |
| `e2ee-qwen3-30b-a3b-p` | E2EE | 256K | $0.19 | $0.69 |
| `venice-uncensored-1-2` | vision · uncensored | 128K | $0.20 | $0.90 |
| `e2ee-qwen3-vl-30b-a3b-p` | vision · E2EE | 128K | $0.25 | $0.90 |
| `e2ee-venice-uncensored-24b-p` | E2EE · uncensored | 32K | $0.25 | $1.15 |
| `qwen3-vl-235b-a22b` | vision | 256K | $0.25 | $1.50 |
| `minimax-m3` | reasoning · vision · code · video in | 500K | $0.30 | $1.20 |
| `minimax-m3-preview` | reasoning · code | 524K | $0.30 | $1.20 |
| `arcee-trinity-large-thinking` | reasoning · code | 256K | $0.3125 | $1.125 |
| `mercury-2` | reasoning | 128K | $0.3125 | $0.9375 |
| `qwen3-5-35b-a3b` | reasoning · vision · code · video in | 256K | $0.3125 | $1.25 |
| `qwen3-6-27b` | reasoning · vision · code · video in | 256K | $0.325 | $3.25 |
| `deepseek-v3.2` | reasoning | 160K | $0.33 | $0.48 |
| `minimax-m25` | reasoning · code | 198K | $0.34 | $1.19 |
| `qwen3-coder-480b-a35b-instruct-turbo` | code | 256K | $0.35 | $1.50 |
| `qwen3-next-80b` | — | 256K | $0.35 | $1.90 |
| `minimax-m27` | reasoning · code | 198K | $0.375 | $1.50 |
| `e2ee-qwen3-6-35b-a3b-uncensored-p` | E2EE · uncensored | 128K | $0.38 | $1.88 |
| `qwen3-235b-a22b-thinking-2507` | reasoning | 128K | $0.45 | $3.50 |
| `qwen-3-7-plus` | reasoning · vision · code · video in | 1M | $0.50 | $2.00 |
| `venice-uncensored-role-play` | vision · uncensored | 128K | $0.50 | $2.00 |
| `zai-org-glm-4.7` | reasoning | 198K | $0.55 | $2.65 |
| `kimi-k2-5` | reasoning · vision · code | 256K | $0.56 | $3.50 |
| `nvidia-nemotron-3-ultra-550b-a55b` | reasoning | 256K | $0.625 | $3.125 |
| `qwen-3-6-plus` | reasoning · vision · code · video in | 1M | $0.625 | $3.75 |
| `gemini-3-flash-preview` | reasoning · vision · audio in · video in | 256K | $0.70 | $3.75 |
| `llama-3.3-70b` | — | 128K | $0.70 | $2.80 |
| `qwen3-5-397b-a17b` | reasoning · vision · code · video in | 128K | $0.75 | $4.50 |
| `kimi-k2-6` | reasoning · vision · code | 256K | $0.85 | $4.655 |
| `zai-org-glm-4.6` | reasoning | 198K | $0.85 | $2.75 |
| `kimi-k2-7-code` | reasoning · vision · code | 256K | $0.90 | $4.30 |
| `openai-gpt-54-mini` | reasoning · vision | 400K | $0.9375 | $5.625 |
| `aion-labs-aion-2-0` | reasoning | 128K | $1.00 | $2.00 |
| `grok-build-0-1` | reasoning · vision · code | 256K | $1.00 | $2.00 |
| `zai-org-glm-5` | reasoning · code | 198K | $1.00 | $3.20 |
| `e2ee-glm-4-7-p` | reasoning · code · E2EE | 128K | $1.10 | $4.15 |
| `e2ee-glm-5-1` | reasoning · E2EE | 200K | $1.10 | $4.15 |
| `hermes-3-llama-3.1-405b` | — | 128K | $1.10 | $3.00 |
| `z-ai-glm-5-turbo` | reasoning · code | 200K | $1.20 | $4.00 |
| `zai-org-glm-5-2` | reasoning | 1M | $1.40 | $4.40 |
| `grok-4-20` | reasoning · vision · X search | 2M | $1.42 | $2.83 |
| `grok-4-20-multi-agent` | reasoning · vision · X search | 2M | $1.42 | $2.83 |
| `grok-4-3` | reasoning · vision · X search | 1M | $1.42 | $2.83 |
| `z-ai-glm-5v-turbo` | reasoning · vision · code | 200K | $1.50 | $5.00 |
| `gemini-3-5-flash` | reasoning · vision · audio in · video in | 1M | $1.55 | $9.45 |
| `deepseek-v4-pro` | reasoning · code | 1M | $1.73 | $3.796 |
| `e2ee-glm-5-2-p` | reasoning · code · E2EE | 524K | $1.75 | $5.75 |
| `zai-org-glm-5-1` | reasoning | 200K | $1.75 | $5.50 |
| `openai-gpt-52` | reasoning | 256K | $2.19 | $17.50 |
| `openai-gpt-52-codex` | reasoning · vision · code | 256K | $2.19 | $17.50 |
| `openai-gpt-53-codex` | reasoning · vision · code | 400K | $2.19 | $17.50 |
| `gemini-3-1-pro-preview` | reasoning · vision · audio in · video in | 1M | $2.50 | $15.00 |
| `qwen-3-7-max` | reasoning · code | 1M | $2.70 | $8.05 |
| `openai-gpt-4o-2024-11-20` | vision | 128K | $3.125 | $12.50 |
| `openai-gpt-54` | reasoning · vision | 1M | $3.13 | $18.80 |
| `claude-sonnet-4-6` | reasoning · vision · code | 1M | $3.60 | $18.00 |
| `claude-sonnet-4-5` | reasoning · vision · code | 198K | $3.75 | $18.75 |
| `claude-opus-4-5` | reasoning · vision · code | 198K | $6.00 | $30.00 |
| `claude-opus-4-6` | reasoning · vision · code | 1M | $6.00 | $30.00 |
| `claude-opus-4-7` | reasoning · vision · code | 1M | $6.00 | $30.00 |
| `claude-opus-4-8` | reasoning · vision · code | 1M | $6.00 | $30.00 |
| `openai-gpt-55` | reasoning · vision | 1M | $6.25 | $37.50 |
| `claude-fable-5` | reasoning · vision · code | 1M | $12.00 | $60.00 |
| `claude-opus-4-8-fast` | reasoning · vision · code | 1M | $12.00 | $60.00 |
| `claude-opus-4-6-fast` | reasoning · vision · code | 1M | $36.00 | $180.00 |
| `claude-opus-4-7-fast` | reasoning · vision · code | 1M | $36.00 | $180.00 |
| `openai-gpt-54-pro` | reasoning · vision | 1M | $37.50 | $225.00 |
| `openai-gpt-55-pro` | reasoning · vision | 1M | $37.50 | $225.00 |

</details>

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
