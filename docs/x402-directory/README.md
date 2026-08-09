---
icon: compass
---

# x402 API Directory

**Verified vendor API services** you can reach with Floe — 2,000+ through the proxy. Most are x402-native (they accept USDC on Base and are paid from your agent's Floe-managed balance); a few — like HydraDB under [Memory](database.md) — are free marketplace-shim services that don't charge your balance at all. Every service listed here works with `x402_fetch` or `/v1/proxy/fetch`.

## Floe Verified Services

Services with endpoints in the [Floe dashboard](https://dev-dashboard.floelabs.xyz/vendors), plus upcoming integrations marked "coming soon."

| Category | Services |
|----------|----------|
| [Compute](compute.md) | Venice AI — chat completions, embeddings · Sarvam AI — Indic chat |
| [STT](voice.md#stt-speech-to-text) | OpenAI (Whisper/Transcribe), Deepgram, AssemblyAI, ElevenLabs (Scribe v2), Cartesia (Ink-Whisper), Speechmatics, Azure, xAI, Sarvam (Saaras), Venice, dTelecom |
| [TTS](voice.md#tts-text-to-speech) | OpenAI (TTS-1), ElevenLabs, Cartesia, Deepgram (Aura-2), Hume, Rime, Inworld, MiniMax, Azure, Amazon Polly, xAI, Google Cloud TTS, Sarvam (Bulbul), Venice, ForgeMesh + direct x402 services |
| [Telephony](voice.md#telephony) | Floe Phone — US numbers, inbound/outbound calls (live) |
| [WebRTC](voice.md#webrtc) | OpenAI (GPT Realtime), Google Gemini Live, xAI Grok Voice, dTelecom, Amazon Nova 2 Sonic (coming soon), LiveKit (coming soon) |
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

## Submit an API

[How to submit →](submit.md)
