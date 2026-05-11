---
icon: compass
---

# x402 API Directory

**60 x402 APIs** you can call with Floe credit. Every endpoint listed here accepts USDC on Base and works with `x402_fetch` or `/v1/proxy/fetch`.

| Category | APIs | Highlights |
|----------|------|------------|
| [Web Search & Scraping](web-search.md) | 8 | Apify, Bloomfilter, Exa... |
| [Social & News](social-news.md) | 5 | Gloria AI, Neynar, Otto AI... |
| [Crypto Data & Analytics](crypto-data.md) | 12 | AdEx, CoinGecko, DappLooker... |
| [Risk & Security](risk-security.md) | 4 | Augur, QuantumShield, Rug Munch... |
| [LLM Inference](llm-inference.md) | 7 | AiMo, AskClaude, BlockRun.AI... |
| [Media Generation](media-generation.md) | 5 | Genbase, Imference, Kodo... |
| [Browser & Compute](browser-compute.md) | 3 | Agent Camo, Browserbase, Hyperbrowser... |
| [Storage](storage.md) | 3 | 402104, Pinata, zkStash... |
| [Identity & Reputation](identity-reputation.md) | 2 | OOBE, Trusta.AI... |
| [Payments & Commerce](payments-commerce.md) | 4 | AEON, Bitrefill, Laso... |
| [Infrastructure & Gateways](infra-gateway.md) | 3 | Alchemy, AWS, Cloudflare... |
| [Agent Tooling](agent-tooling.md) | 4 | Arch AI, Fluora, Heurist... |

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
