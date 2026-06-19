# Table of contents

* [Floe — The spend layer for AI agents](README.md)

## Getting Started

* [Quickstart (5 minutes)](docs/getting-started/quickstart.md)
* [Funding your agent](docs/getting-started/funding.md)

## Components

* [Agent Wallet](docs/components/wallet.md)
* [Fiat on/off-ramp](docs/components/onramp.md)
* [x402 payment facilitator](docs/components/x402.md)
* [Spend Controls](docs/developers/spend-controls.md)
* [Credit & trust bureau](docs/components/credit-bureau.md)

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

## Guides

* [Agent Operators — From Bank Account to First API Call](docs/agents/fiat-to-x402.md)
* [Agent Operators — How Agents Pay With Floe](docs/agents/credit-for-agents.md)

## Developers

* [Developer Dashboard](docs/developers/developer-dashboard.md)
* [API Keys](docs/developers/api-keys.md)
* [Agent Runtime Contract](docs/developers/agent-runtime-contract.md)
* [Spend Controls](docs/developers/spend-controls.md)
* [Agent Awareness](docs/developers/agent-awareness.md)
* [x402 Payment Facilitator](docs/developers/x402-facilitator.md)
* [Venice AI — Model Inference](docs/developers/venice.md)
* [x402 API Directory](docs/x402-directory/README.md)
  * [Compute](docs/x402-directory/compute.md)
  * [Voice](docs/x402-directory/voice.md)
  * [Image](docs/x402-directory/image.md)
  * [Text](docs/x402-directory/text.md)
  * [Search](docs/x402-directory/search.md)
  * [Browser](docs/x402-directory/browser.md)
  * [Agent Tools](docs/x402-directory/agent-tools-verified.md)
  * [Submit an API](docs/x402-directory/submit.md)
* [MCP Server](docs/developers/mcp-server.md)
* [Webhooks](docs/developers/webhooks.md)

## API Reference

* [Credit REST API](docs/developers/credit-api.md)

## Protocol

* [Architecture](docs/protocol/architecture.md)
* [Intent Auto Matching](docs/protocol/orderbook-matching.md)
* [Oracles & Circuit Breaker](docs/protocol/oracles-conditions.md)
* [Security](docs/protocol/security.md)

## Reference

* [Error Codes](docs/reference/error-codes.md)
* [Environment Variables](docs/reference/environment-variables.md)
* [Contract Addresses](developers/networks.md)
* [FAQ](faq/general.md)
* [Glossary](docs/glossary.md)
* [Changelog](docs/changelog.md)

## Advanced / on-chain (self-custody)

> The surfaces below are the on-chain protocol layer for teams running their own keys. Working-capital credit is **in development** — not generally available.

* [How Floe Works Under the Hood](docs/getting-started/core-concepts.md)
* [Working capital (on-chain) — in development](docs/components/secured-credit.md)
* [Unsecured working capital — in development](docs/components/unsecured-credit.md)
* [Agent Working Capital (on-chain)](docs/developers/agent-working-capital.md)
* [Self-custody](docs/developers/self-custody.md)
* [Flash Loans](docs/developers/flash-loans.md)
