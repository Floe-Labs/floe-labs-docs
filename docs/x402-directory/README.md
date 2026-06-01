---
icon: compass
---

# x402 API Directory

**Verified x402 APIs** you can call with Floe credit. Every endpoint listed here accepts USDC on Base and works with `x402_fetch` or `/v1/proxy/fetch`.

## Floe Verified Services

Services with endpoints in the [Floe dashboard](https://dev-dashboard.floelabs.xyz/vendors), plus upcoming integrations marked "coming soon."

| Category | Services |
|----------|----------|
| [Compute](compute.md) | Venice AI — chat completions, embeddings |
| [Voice](voice.md) | Venice AI — TTS, transcription · Twilio (coming soon) · Deepgram (coming soon) |
| [Image](image.md) | Venice AI — image generation |
| [Text](text.md) | Firecrawl (search + scrape), Jina Reader |
| [Search](search.md) | Exa, Parallel AI, Tavily Search |

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
