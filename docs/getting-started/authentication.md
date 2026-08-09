---
icon: key
---

# Authentication

Every Floe call takes one header:

```
Authorization: Bearer <your-floe-key>
```

That's it — the same header on the LLM endpoint, the proxy, and the REST API. In MCP it goes in the client config; in the SDKs it's the `apiKey` / `FLOE_API_KEY` env var.

## Two key types — send the right one

Sending the wrong type is the most common onboarding snag: a valid key gets rejected because it's the wrong *kind* for that endpoint.

| Key | Looks like | Use it for |
|---|---|---|
| **Agent key** | `floe_<hex>` | **Runtime.** The key your agent uses to pay for calls (`/v1/chat/completions`, `/v1/proxy/fetch`, agent-awareness). One key = one agent. |
| **Developer key** | `floe_live_<...>` | **Management.** Dashboard/automation: create agents, mint keys, manage webhooks. **Not** what the agent uses to pay. |

Rule of thumb: if the call *spends money or reads an agent's state*, use the **agent** key. If it *manages your account*, use the **developer** key.

## Get a key

- **Dashboard:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) → create an agent → copy the `floe_<hex>` key (shown once).
- **CLI:** `npx @floelabs/cli init` — creates or selects an agent and mints its `floe_…` key straight into your OS keychain (one slot per agent; `floe use <agent>` reuses each agent's stored key and mints one only on its first use). The key is also printed once for your SDK or env — export it yourself (`export FLOE_AGENT_KEY=floe_…`); SDKs don't read the CLI keychain.
- **SDK workflow:** `npx floe-agent register --name my-agent` (also stores the key in your OS keychain).

## Keyless vs. bring-your-own-key

- **Keyless (default):** send only your Floe key; Floe holds the upstream vendor key and bills you per call.
- **BYOK:** add `X-Floe-Provider-Key: <your OpenAI/Anthropic key>` on the BYOK metered proxy `/v1/llm/chat/completions` (model id with or without a `provider/` prefix, e.g. `gpt-4o` or `openai/gpt-4o`) to keep paying the vendor directly — Floe meters and charges a routing fee only.

Full key lifecycle (rotation, rate limits, scopes): [API Keys](../developers/api-keys.md).
