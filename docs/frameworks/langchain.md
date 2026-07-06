---
icon: link
---

# LangChain `GA`

Floe exposes every action as a LangChain tool through the AgentKit adapter (TypeScript) or directly (Python).

## TypeScript

```bash
npm install floe-agent @coinbase/agentkit @coinbase/agentkit-langchain
```

```typescript
import { AgentKit } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { floeActionProvider } from "floe-agent";

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [floeActionProvider({ facilitatorApiKey: process.env.FLOE_API_KEY })],
});
const tools = await getLangChainTools(agentkit);
```

## Python

```bash
pip install "floe-agentkit-actions[langchain]"
```

```python
from floe_agentkit_actions.integrations.langchain import get_floe_langchain_tools

tools = get_floe_langchain_tools(wallet_provider)
```

## Example

See [`floe-cookbook/langchain-agent`](https://github.com/Floe-Labs/floe-cookbook/tree/main/langchain-agent) for a complete LangChain agent that funds a balance, pays an x402 endpoint through the proxy, and checks its remaining spend.

> **Scope.** Floe's spend controls cap x402 payments made through the proxy, not raw LLM token bills paid with your own provider key (those are only governed if routed through Floe's LLM proxy at `/v1/llm/chat/completions`, which is feature-flagged). See [Spend Controls](../developers/spend-controls.md).
