---
icon: brain
---

# LLM Inference

AI model inference — Claude, GPT, open-source models. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| AiMo Network | AiMo | $0.005 | POST | Verified |
| AskClaude | AskClaude | $0.01 | POST | Verified |
| BlockRun.AI | BlockRun.AI | $0.01 | POST | Verified |
| Daydreams Router | Daydreams | $0.01 | POST | Verified |
| dTelecom STT | dTelecom | $0.01 | POST | Verified |
| Ekai Labs | Ekai Labs | $0.01 | POST | Verified |
| Octomil | Octomil | $0.005 | POST | Verified |
| Venice | Venice | $0.01 | POST | Verified |

---

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

## dTelecom STT

**Provider:** [dTelecom](https://dtelecom.org)
**Endpoint:** `POST https://api.dtelecom.org/v1/transcribe`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Real-time speech-to-text in 99+ languages.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.dtelecom.org/v1/transcribe", "method": "POST"}'
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

## Venice

**Provider:** [Venice](https://venice.ai)
**Endpoint:** `POST https://api.venice.ai/v1/chat`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> Open-source AI models, uncensored, no data retention.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.venice.ai/v1/chat", "method": "POST"}'
```

