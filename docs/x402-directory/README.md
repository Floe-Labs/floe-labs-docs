---
icon: compass
---

# x402 API Directory

**Verified x402 vendor API services** you can pay for with Floe — 2,000+ reachable through the proxy. Every endpoint listed here accepts USDC on Base and works with `x402_fetch` or `/v1/proxy/fetch`, paid from your agent's Floe-managed balance.

## Floe Verified Services

Services with endpoints in the [Floe dashboard](https://dev-dashboard.floelabs.xyz/vendors), plus upcoming integrations marked "coming soon."

| Category | Services |
|----------|----------|
| [Compute](compute.md) | Venice AI — chat completions, embeddings · Sarvam AI — Indic chat |
| [STT](voice.md#stt-speech-to-text) | OpenAI (Whisper/Transcribe), Deepgram, AssemblyAI, Sarvam (Saaras), Venice, dTelecom |
| [TTS](voice.md#tts-text-to-speech) | OpenAI (TTS-1), ElevenLabs, Cartesia, Google Cloud TTS, Sarvam (Bulbul), Venice |
| [Telephony](voice.md#telephony) | Twilio (coming soon) |
| [WebRTC](voice.md#webrtc) | OpenAI (GPT Realtime), Google Gemini Live, LiveKit (coming soon) |
| [Image](image.md) | Venice AI — image generation |
| [Search](search.md) | Exa, Parallel AI, Tavily Search, Firecrawl |
| [Browser](browser.md) | Hyperbrowser, Browserbase, Anchor Browser |
| [Memory](database.md) | HydraDB — vector query, ingest, memory & tenant management |
| [Agent Tools](agent-tools-verified.md) | AgentMail, Pinata Cloud, PostalForm |

## Call Any Listed API

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.firecrawl.dev/v1/x402/search", "method": "POST"}'
```

Or with AgentKit:

```typescript
await agentkit.run("x402_fetch", { url: "https://api.firecrawl.dev/v1/x402/search", method: "POST" });
```

## Broader x402 Ecosystem

The directory above is Floe-verified. The broader x402 ecosystem has **46,000+ indexed endpoints** across multiple registries:

| Directory | What it is | Link |
|-----------|-----------|------|
| **CDP Bazaar** | Coinbase's canonical index — 46,000+ endpoints | [Browse →](https://docs.cdp.coinbase.com/x402/bazaar) |
| **x402scan** | Block-explorer-style analytics: servers, sellers, volume | [Browse →](https://x402scan.com) |
| **x402list.fun** | Searchable directory with category and pricing filters | [Browse →](https://x402list.fun) |
| **x402station** | Performance and reliability monitoring | [Browse →](https://x402station.com) |
| **EntRoute** | Machine-first ranked discovery with semantic search | [Browse →](https://entroute.com) |
| **x402.org Ecosystem** | Foundation-maintained provider and facilitator list | [Browse →](https://x402.org/ecosystem) |

**Any USDC-on-Base x402 endpoint works with Floe credit** — even if it's not listed here. Just pass the URL to `x402_fetch` or `/v1/proxy/fetch`.

## Submit an API

[How to submit →](submit.md)
