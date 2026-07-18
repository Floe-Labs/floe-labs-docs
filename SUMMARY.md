# Table of contents

* [Floe — The spend layer for AI agents](README.md)

## Quickstart

* [Quickstart (5 minutes)](docs/getting-started/quickstart.md)
* [Funding your agent](docs/getting-started/funding.md)

## Core concepts

* [Agent Wallet](docs/components/wallet.md)
* [Spend Controls](docs/developers/spend-controls.md)
* [Agent Awareness](docs/developers/agent-awareness.md)
* [Fiat on/off-ramp](docs/components/onramp.md)
* [x402 payment facilitator](docs/components/x402.md)
* [Vendor Marketplace (x402 Directory)](docs/x402-directory/README.md)
  * [Compute](docs/x402-directory/compute.md)
  * [Voice Stack (STT / TTS / Telephony / WebRTC)](docs/x402-directory/voice.md)
  * [Image](docs/x402-directory/image.md)
  * [Search](docs/x402-directory/search.md)
  * [Browser](docs/x402-directory/browser.md)
  * [Memory](docs/x402-directory/database.md)
  * [Agent Tools](docs/x402-directory/agent-tools-verified.md)
  * [Submit an API](docs/x402-directory/submit.md)

## Guides

* [Agent Operators — From Bank Account to First API Call](docs/agents/fiat-to-x402.md)
* [Agent Operators — How Agents Pay With Floe](docs/agents/credit-for-agents.md)

## Frameworks

* [Coinbase AgentKit](docs/frameworks/agentkit.md)
  * [TypeScript SDK](docs/developers/agentkit-typescript.md)
  * [Python SDK](docs/developers/agentkit-python.md)
* [LangChain](docs/frameworks/langchain.md)
* [Vercel AI SDK](docs/frameworks/vercel-ai.md)
* [CrewAI](docs/frameworks/crewai.md)
* [ElizaOS](docs/frameworks/elizaos.md)
* [OpenAI Agents SDK](docs/frameworks/openai.md)
* [Claude Desktop / Claude Code / Cursor (MCP)](docs/frameworks/claude-mcp.md)
* [Plain HTTP / REST](docs/frameworks/http.md)

## Developers

* [Developer Dashboard](docs/developers/developer-dashboard.md)
* [API Keys](docs/developers/api-keys.md)
* [Agent Runtime Contract](docs/developers/agent-runtime-contract.md)
* [x402 Payment Facilitator](docs/developers/x402-facilitator.md)
* [Marketplace Shim](docs/developers/marketplace-shim.md)
* [Venice AI — Model Inference](docs/developers/venice.md)
* [Sarvam AI — Indic Inference](docs/developers/sarvam.md)
* [Floe Inference — Keyless LLM & Voice](docs/developers/keyless-inference.md)
* [MCP Server](docs/developers/mcp-server.md)
* [Webhooks](docs/developers/webhooks.md)

## API Reference

* [Credit REST API](docs/developers/credit-api.md)

## Advanced / under the hood (managed plumbing)

* [How Floe Works Under the Hood](docs/getting-started/core-concepts.md)
* [Self-custody](docs/developers/self-custody.md)
* [Architecture](docs/protocol/architecture.md)
* [Intent Auto Matching](docs/protocol/orderbook-matching.md)
* [Oracles & Circuit Breaker](docs/protocol/oracles-conditions.md)
* [Security](docs/protocol/security.md)
* [Flash Loans](docs/developers/flash-loans.md)

## Roadmap (not generally available)

* [Working capital (on-chain)](docs/components/secured-credit.md)
* [Unsecured working capital](docs/components/unsecured-credit.md)
* [Agent Working Capital (on-chain)](docs/developers/agent-working-capital.md)
* [Credit & trust bureau](docs/components/credit-bureau.md)

## Reference

* [Error Codes](docs/reference/error-codes.md)
* [Environment Variables](docs/reference/environment-variables.md)
* [Contract Addresses](developers/networks.md)
* [FAQ](faq/general.md)
* [Glossary](docs/glossary.md)
* [Changelog](docs/changelog.md)
