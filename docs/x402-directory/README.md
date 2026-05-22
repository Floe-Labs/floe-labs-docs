---
icon: compass
---

# x402 API Directory

**74 x402 APIs** you can call with Floe credit. Every endpoint listed here accepts USDC on Base and works with `x402_fetch` or `/v1/proxy/fetch`.

| Category | APIs | Highlights |
|----------|------|------------|
| [Web Search & Scraping](web-search.md) | 9 | Apify, Bloomfilter, Exa... |
| [Social & News](social-news.md) | 3 | Gloria AI, Neynar, Postera... |
| [Crypto Data & Analytics](crypto-data.md) | 14 | AdEx, Alchemy, CoinGecko... |
| [Risk & Security](risk-security.md) | 6 | Augur, BlackSwan, Kevros... |
| [LLM Inference](llm-inference.md) | 8 | AiMo, AskClaude, BlockRun.AI... |
| [Media Generation](media-generation.md) | 6 | Freepik, Genbase, Imference... |
| [Browser & Compute](browser-compute.md) | 3 | Agent Camo, Browserbase, Hyperbrowser... |
| [Storage](storage.md) | 3 | 402104, Pinata, zkStash... |
| [Identity & Reputation](identity-reputation.md) | 4 | DJD, OMATrust, OOBE... |
| [Payments & Commerce](payments-commerce.md) | 6 | AEON, Bitrefill, Grove... |
| [Infrastructure & Gateways](infra-gateway.md) | 5 | Alchemy, AWS, Cloudflare... |
| [Agent Tooling](agent-tooling.md) | 7 | Arch AI, Fluora, Heurist... |

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

## Browse the Full Ecosystem

This directory is a curated subset verified to work with Floe credit. The broader x402 ecosystem has **46,000+ indexed endpoints** across multiple registries:

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
