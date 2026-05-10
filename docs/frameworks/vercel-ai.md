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
  prompt: "Borrow 5 USDC for a week and then call my paid API.",
});
```

## Example

[`floe-examples/agentkit-ts-chatbot`](https://github.com/Floe-Labs/floe-examples/tree/main/agentkit-ts-chatbot).
