---
icon: triangle
---

# Vercel AI SDK `GA`

Floe actions are bound to the Vercel AI SDK via the AgentKit adapter.

```bash
npm install floe-agent @coinbase/agentkit @coinbase/agentkit-vercel-ai-sdk ai @ai-sdk/openai
```

```typescript
import { AgentKit } from "@coinbase/agentkit";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { floeActionProvider } from "floe-agent";

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [floeActionProvider({ facilitatorApiKey: process.env.FLOE_API_KEY })],
});
const tools = await getVercelAITools(agentkit);

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools,
  maxSteps: 10,
  prompt: "Call my paid x402 API and tell me what it cost.",
});
```

> **Scope.** In this example the `gpt-4o` model tokens are billed by OpenAI against **your own** `@ai-sdk/openai` key — a call that bypasses Floe is the one thing a policy can't see. To bring LLM tokens onto the same ledger and caps as your x402 payments, route the model through Floe: **keyless** via `POST /v1/chat/completions` (fully-qualified ids like `openai/gpt-4o`, no provider key), or **BYOK** via `/v1/llm/chat/completions` with `X-Floe-Provider-Key` (host `credit-api.floelabs.xyz` either way). Then one budget bounds both. See [Floe Inference](../developers/keyless-inference.md) and [Spend Controls](../developers/spend-controls.md).

## Example

The dedicated Vercel-AI-SDK chatbot example has been retired. For a runnable AgentKit client that pays an x402 endpoint through the Floe proxy, see [`floe-cookbook/x402-client`](https://github.com/Floe-Labs/floe-cookbook/tree/main/x402-client), or browse the full [cookbook index](https://github.com/Floe-Labs/floe-cookbook) to pick the example closest to your stack.
