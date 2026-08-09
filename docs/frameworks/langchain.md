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

> **Scope.** Floe's spend controls cap every paid call it settles — x402 payments through the proxy **and** LLM tokens routed through Floe's keyless gateway at `/v1/chat/completions` (or the legacy BYOK metered proxy `/v1/llm/chat/completions`), on one ledger and one set of caps. A call sent straight to a provider with your own key, bypassing Floe, is the one thing a policy can't see. See [Spend Controls](../developers/spend-controls.md).
