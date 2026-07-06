---
icon: square-bolt
---

# Coinbase AgentKit `GA`

Native integration via `floeActionProvider()` (TypeScript) and `floe_action_provider()` (Python). Both expose the same 54 actions.

## Install

{% tabs %}
{% tab title="TypeScript" %}
```bash
npm install floe-agent @coinbase/agentkit
```
{% endtab %}
{% tab title="Python" %}
```bash
pip install floe-agentkit-actions coinbase-agentkit
```
{% endtab %}
{% endtabs %}

## Use

{% tabs %}
{% tab title="TypeScript" %}
```typescript
import { AgentKit } from "@coinbase/agentkit";
import { floeActionProvider } from "floe-agent";

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [floeActionProvider({ facilitatorApiKey: process.env.FLOE_API_KEY })],
});
```
{% endtab %}
{% tab title="Python" %}
```python
from coinbase_agentkit import AgentKit, AgentKitConfig
from floe_agentkit_actions import floe_action_provider

agentkit = AgentKit(AgentKitConfig(
    wallet_provider=wallet_provider,
    action_providers=[floe_action_provider(facilitator_api_key=FLOE_API_KEY)],
))
```
{% endtab %}
{% endtabs %}

See [TypeScript SDK](../developers/agentkit-typescript.md) or [Python SDK](../developers/agentkit-python.md) for the full action reference.

## Example

The [`x402-client`](https://github.com/Floe-Labs/floe-cookbook/tree/main/x402-client) example wires AgentKit + Floe into an agent that pays an x402 endpoint through the proxy. Browse the [cookbook index](https://github.com/Floe-Labs/floe-cookbook) for more integrations across LangChain, CrewAI, MCP, and OpenAI Agents.
