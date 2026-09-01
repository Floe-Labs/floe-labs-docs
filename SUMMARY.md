# Table of contents

* [Floe — what every call actually costs](README.md)

## Start here

* [Set up with your AI tools](docs/getting-started/setup-with-ai-tools.md)
* [Claude Code / Agent Skills](docs/getting-started/claude-code-skill.md)
* [Quickstart (5 minutes)](docs/getting-started/quickstart.md)
* [Installation](docs/getting-started/installation.md)
* [Authentication](docs/getting-started/authentication.md)
* [Add Floe to your existing pipeline](docs/getting-started/integrate-existing-pipeline.md)
* [Funding your agent](docs/getting-started/funding.md)
* [Agent Quickstart](docs/agents/quickstart-agents.md)

## Know your costs

* [The live cost ledger](docs/build/unified-ledger.md)
* [Calls — every leg of one call](docs/build/interactions.md)
* [Cost audit — invoices in, margin out](docs/build/cost-audit.md)
* [Vendor actuals — reconcile to the vendor's records](docs/build/vendor-actuals.md)
* [Vendor connections](docs/build/vendor-connections.md)
* [Coverage Score](docs/build/coverage-score.md)
* [The cost calculator](docs/build/cost-calculator.md)

## Attribution & margin

* [Cost per client, campaign & task](docs/build/attribution.md)
* [Rate cards & the margin engine](docs/build/rate-cards.md)

## Invoicing

* [Client invoicing — billing periods & statements](docs/build/invoicing.md)
* [Stripe Connect — bill through your own Stripe](docs/build/stripe-connect.md)

## Connect your stack

* [The Voice Stack — overview](docs/build/voice-stack.md)
* [Govern Vapi / Retell / Bland / Pipecat / LiveKit](docs/build/voice-orchestrators.md)
* [Ledger sync — BYOK & self-hosted coverage](docs/build/ledger-sync.md)
* [Graduate to 100% coverage](docs/build/migrate-to-full-coverage.md)
* [Floe Phone — numbers & telephony](docs/developers/floe-phone.md)
* [Floe Inference — keyless LLM & voice](docs/developers/keyless-inference.md)
* [Budget-Aware Routing](docs/build/budget-aware-routing.md)
* [Latency & overhead](docs/build/latency-overhead.md)

## Platforms

* [Vapi — 10-minute setup](docs/platforms/vapi.md)
* [Vapi — custom voice & transcriber (experimental)](docs/platforms/vapi-voice.md)
* [Retell](docs/platforms/retell.md)
* [Bland](docs/platforms/bland.md)

## Vendor Marketplace

* [Overview](docs/x402-directory/README.md)
* [Compute](docs/x402-directory/compute.md)
  * [Venice AI](docs/developers/venice.md)
  * [Sarvam AI](docs/developers/sarvam.md)
* [STT — Speech-to-Text](docs/x402-directory/voice.md#stt-speech-to-text)
* [TTS — Text-to-Speech](docs/x402-directory/voice.md#tts-text-to-speech)
* [Telephony](docs/x402-directory/voice.md#telephony)
* [WebRTC](docs/x402-directory/voice.md#webrtc)
* [Image](docs/x402-directory/image.md)
* [Search](docs/x402-directory/search.md)
* [Browser](docs/x402-directory/browser.md)
* [Memory](docs/x402-directory/database.md)
* [Agent Tools](docs/x402-directory/agent-tools-verified.md)
* [Submit an API](docs/x402-directory/submit.md)

## Cookbook

* [Floe Cookbook — example agents](https://github.com/Floe-Labs/floe-cookbook)
* [Eve — reference voice agent](https://github.com/Floe-Labs/eve-floe)

## Frameworks

* [Plain HTTP / REST](docs/frameworks/http.md)
* [LangChain](docs/frameworks/langchain.md)
* [CrewAI](docs/frameworks/crewai.md)
* [OpenAI Agents SDK](docs/frameworks/openai.md)
* [Claude Desktop / Claude Code / Cursor (MCP)](docs/frameworks/claude-mcp.md)
* [Vercel AI SDK](docs/frameworks/vercel-ai.md)
* [Coinbase AgentKit](docs/frameworks/agentkit.md)
  * [TypeScript SDK](docs/developers/agentkit-typescript.md)
  * [Python SDK](docs/developers/agentkit-python.md)

## Developers

* [Developer Dashboard](docs/developers/developer-dashboard.md)
* [Agent Balance](docs/components/wallet.md)
* [Spend Controls](docs/developers/spend-controls.md)
* [Agent Awareness](docs/developers/agent-awareness.md)
* [Floe CLI](docs/developers/cli.md)
* [API Keys](docs/developers/api-keys.md)
* [From Bank Account to First API Call](docs/agents/fiat-to-x402.md)
* [Agent Runtime Contract](docs/developers/agent-runtime-contract.md)
* [Pay any vendor API](docs/developers/x402-facilitator.md)
* [Marketplace Shim](docs/developers/marketplace-shim.md)
* [MCP Server](docs/developers/mcp-server.md)
* [Webhooks](docs/developers/webhooks.md)

## API Reference

* [REST API](docs/developers/credit-api.md)
* [Model pricing — GET /v1/models?include=pricing](docs/developers/models-pricing.md)
* [Ledger Sync API](docs/developers/ledger-sync-api.md)
* [OpenAPI Specification](https://credit-api.floelabs.xyz/.well-known/openapi.yaml)

## Reference

* [Plans & entitlements](docs/reference/plans.md)
* [Pricing & cost](docs/getting-started/pricing.md)
* [Error Codes](docs/reference/error-codes.md)
* [Environment Variables](docs/reference/environment-variables.md)
* [Changelog](docs/changelog.md)
