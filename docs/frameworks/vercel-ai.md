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

> **Scope.** In this example the `gpt-4o` model tokens are billed by OpenAI against **your own** `@ai-sdk/openai` key — Floe does not see or cap them. Floe's spend controls cap the x402 payments your agent makes through the proxy. To bring LLM token spend under a Floe ceiling, route models through Floe's LLM proxy (`/v1/llm/chat/completions`, feature-flagged). See [Spend Controls](../developers/spend-controls.md).

## Example

[`floe-examples/agentkit-ts-chatbot`](https://github.com/Floe-Labs/floe-examples/tree/main/agentkit-ts-chatbot).
