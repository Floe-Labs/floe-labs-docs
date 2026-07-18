# Agent Awareness

Floe is the spend layer: one key pays every vendor per call, governed by server-side spend controls. A rational agent answers two questions before every paid action:

1. **Do I have enough balance to make this call?**
2. **Is this call worth its cost, and will it fit under my spend limit?**

Without first-class primitives for these, agents either over-spend (no gating) or under-act (refuse to spend out of caution). Floe ships primitives that answer both in one round-trip — surfaced as actions in the SDKs and MCP tools.

> **Scope.** `estimate_x402_cost` and these checks govern x402 payments made through the Floe proxy. They do **not** account for raw LLM token bills you pay with your own provider key — only x402 payments (and LLM tokens routed through Floe's LLM proxy) flow through this accounting.

## The primitives

| API | Question it answers |
|---|---|
| `GET /v1/agents/balance` | What is my spendable balance? |
| `GET / PUT / DELETE /v1/agents/spend-limit` | Operator-defined session ceiling |
| `POST /v1/x402/estimate` | What does this call cost? Will it fit my budget? |

## Decision-loop pattern

The canonical workflow before every paid call:

```text
┌──────────────────────────────────────────────────────────────┐
│  1. estimate_x402_cost(url)                                  │
│     → { priceRaw, reflection: { willExceedAvailable, ... } } │
│                                                              │
│  2. if reflection.willExceedAvailable                        │
│        || reflection.willExceedSpendLimit:                   │
│       → SKIP (or queue for later, or alert operator)         │
│                                                              │
│  3. else: proxy/fetch(url)                                   │
└──────────────────────────────────────────────────────────────┘
```

The `estimate_x402_cost` response includes a **reflection** block that tells you, without making any side-effecting call, whether the payment would exceed:

- Your `available` balance
- Your `sessionSpendRemaining` (your operator-set cap)

That collapses the checks into one round-trip — the unique value vs the agent doing its own preflight.

## Bounding spend with `set_spend_limit`

For per-session ceilings (e.g., "this agent gets $10/day"), use `set_spend_limit`. The cap is enforced inside the proxy paid-request flow: a request that would exceed it returns HTTP 402 with `error: spend_limit_exceeded` instead of being charged.

```typescript
// TS AgentKit
await provider.setSpendLimit(walletProvider, { limitRaw: "10000000" }); // $10
```

```python
# Python AgentKit
provider.set_spend_limit(wallet_provider, {"limit_raw": "10000000"})
```

```bash
# REST
curl -X PUT https://credit-api.floelabs.xyz/v1/agents/spend-limit \
  -H "Authorization: Bearer floe_..." \
  -H "Content-Type: application/json" \
  -d '{"limitRaw": "10000000"}'
```

`PUT` resets the session window — anything spent before this call no longer counts. `GET` returns `{active, limitRaw, sessionSpentRaw, sessionRemainingRaw}`. `DELETE` removes the cap.

## Reading balance from serverless agents

Lambdas, Cloud Run jobs, and other ephemeral runners can poll the balance and compare locally before spending:

```typescript
const view = await provider.getWalletBalance(walletProvider, {});
// parse out available / sessionSpendRemaining, decide
```

`get_wallet_balance` is cheap and idempotent. Don't poll faster than once per second.

## Where the primitives live

- **REST API**: `GET /v1/agents/balance` for balance, `/v1/agents/spend-limit` for the session cap
- **MCP server**: [mcp-server.md → Agent Awareness Tools](mcp-server.md#agent-awareness-tools) — `get_wallet_balance`, `get_spend_limit` (snake_case)
- **TypeScript SDK**: `floe-agent` v0.3.0+, on `X402ActionProvider`
- **Python SDK**: `floe-agentkit-actions` v0.3.0+, on `X402ActionProvider`

Each surface exposes the same balance and spend-limit semantics, but the names differ per surface — the AgentKit x402 balance action is `x402_get_balance`, the MCP tool is `get_wallet_balance`, and the REST route is `GET /v1/agents/balance`. Pick the wrapper that matches your runtime.

> **Caveat.** A local balance read (`get_wallet_balance`) is an advisory snapshot and can race with in-flight settlements. The authoritative preflight is `estimate_x402_cost` plus the proxy's server-side spend checks, which decide at pay time.
