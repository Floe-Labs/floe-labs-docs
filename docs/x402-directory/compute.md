---
icon: cpu
---

# Compute

LLM inference and embeddings — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| Venice AI | Chat Completions, Embeddings | metered / tokens | Verified |

---

## Venice AI — Chat Completions

**Endpoint:** `POST https://api.venice.ai/api/v1/chat/completions`
**Price:** metered per token · Base mainnet · x402

> OpenAI-compatible chat across 100+ text & reasoning models, with tool use and streaming.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/chat/completions", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"venice-uncensored\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello from x402\"}]}"}'
```

## Venice AI — Embeddings

**Endpoint:** `POST https://api.venice.ai/api/v1/embeddings`
**Price:** metered per token · Base mainnet · x402

> Vector embeddings for retrieval, clustering, and semantic search.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/api/v1/embeddings", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"model\":\"text-embedding-bge-m3\",\"input\":\"x402 makes agents pay per call\"}"}'
```
