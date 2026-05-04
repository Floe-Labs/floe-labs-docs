# Agent Awareness

A rational agent answers three questions before every paid action:

1. **Do I have enough credit to make this call?**
2. **Is this call worth its cost?**
3. **If I open a credit line now, can I repay it within the loan term?**

Without first-class primitives for these, agents either over-spend (no gating) or under-act (refuse to spend out of caution). Floe ships **5 REST primitives** that answer all three in one round-trip — surfaced as 9 actions in the SDKs and MCP tools (three of the primitives are CRUD).

## The 5 primitives

| API | Question it answers |
|---|---|
| `GET /v1/agents/credit-remaining` | Do I have credit? |
| `GET /v1/agents/loan-state` | Where am I in the loan lifecycle? |
| `GET / PUT / DELETE /v1/agents/spend-limit` | Operator-defined session ceiling |
| `GET / POST / DELETE /v1/agents/credit-thresholds` | Webhook on utilization crossing |
| `POST /v1/x402/estimate` | What does this call cost? Will it fit my budget? |

Full reference: [Credit REST API → Agent Awareness Endpoints](credit-api.md#agent-awareness-endpoints).

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

- Your `available` USDC (creditIn − creditOut)
- Your `headroomToAutoBorrow` (creditLimit − creditOut)
- Your `sessionSpendRemaining` (your operator-set cap)

That collapses three sequential checks into one round-trip — the unique value vs the agent doing its own preflight.

## Bounding spend with `set_spend_limit`

`creditLimit` is on-chain — set when the operator delegated borrow authority — and persists across sessions. For per-session ceilings (e.g., "this agent gets $10/day"), use `set_spend_limit`. The cap is enforced inside the proxy paid-request flow: a request that would exceed it returns HTTP 402 with `error: spend_limit_exceeded` instead of being charged.

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

## Long-running agents: webhook thresholds

For agents that run for hours or days, polling `get_credit_remaining` is wasteful. Register a `credit_threshold` and the agent's webhook receives `credit.warning` (or `credit.at_limit` at ≥ 95%) when utilization crosses the threshold from below, and `credit.recovered` when it drops back. Hysteresis guarantees exactly-once delivery per edge — no flapping.

```bash
# Subscribe to credit.* events
curl -X POST https://credit-api.floelabs.xyz/v1/developer/webhooks \
  -H "Authorization: Bearer floe_live_..." \
  -d '{"url": "https://your.app/floe", "events": ["credit.*"]}'

# Register a 80% threshold
curl -X POST https://credit-api.floelabs.xyz/v1/agents/credit-thresholds \
  -H "Authorization: Bearer floe_..." \
  -d '{"thresholdBps": 8000}'
```

Webhook payload:

```json
{
  "event": "credit.warning",
  "agentId": "0x...",
  "thresholdBps": 8000,
  "utilizationBps": 8123,
  "creditLimit": "10000000000",
  "creditOut": "8123000000",
  "available": "1877000000",
  "firedAt": "2026-05-04T12:00:00.000Z"
}
```

Cap: 20 thresholds per agent.

## Polling alternative for serverless agents

Lambdas, Cloud Run jobs, and other ephemeral runners can't receive webhooks. Don't register `credit_thresholds` — poll `get_credit_remaining` instead and compare locally:

```typescript
const view = await provider.getCreditRemaining(walletProvider, {});
// parse out utilizationBps, decide
```

`get_credit_remaining` is cheap and idempotent. Don't poll faster than once per second.

## Reading the loan state machine

`get_loan_state` returns one of `idle | borrowing | at_limit | repaying`. Use it to gate actions that only make sense in specific states:

| State | What it means | Safe to spend? |
|---|---|---|
| `idle` | No active borrow attempt or pending repay | Yes |
| `borrowing` | Facility / instant-borrow in progress | Wait — pending capital |
| `repaying` | Active loan with pending repay tx | Wait — capital coming back |
| `at_limit` | available = 0 and creditOut ≥ creditLimit | No — open another line first |

State precedence is `borrowing > repaying > at_limit > idle` — the most operationally significant state wins when multiple apply.

## Where the primitives live

- **REST API**: [credit-api.md → Agent Awareness](credit-api.md#agent-awareness-endpoints)
- **MCP server**: [mcp-server.md → Agent Awareness Tools](mcp-server.md#agent-awareness-tools) — 9 tools, snake_case
- **TypeScript SDK**: `floe-agent` v0.3.0+, on `X402ActionProvider`
- **Python SDK**: `floe-agentkit-actions` v0.3.0+, on `X402ActionProvider`

All four surfaces use identical names and identical semantics. Pick the wrapper that matches your runtime.
