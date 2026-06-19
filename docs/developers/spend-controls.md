---
icon: shield-check
---

# Spend Controls

Programmable budgets for your agent wallets. Cap spending per vendor, per task, per API, or across your whole team — with optional time windows.

> **Scope: what these controls govern.** Spend controls cap **x402 payments made through the Floe proxy** (`POST /v1/proxy/fetch`). They do **not** cap raw OpenAI/Anthropic LLM token bills you pay with your own provider key — those calls never touch Floe, so no Floe policy can see or stop them. LLM token spend is governed only if you route it through **Floe's LLM proxy** (`/v1/llm/chat/completions`, feature-flagged); in that case the destination host is `credit-api.floelabs.xyz`, not the model provider's domain. An `api` policy matching on a hostname only counts spend that actually flows through the Floe proxy.

## Policy Types

| Type | What it caps | Match on | Example |
|------|-------------|----------|---------|
| **Session** | Total agent spend | Everything | "$100/day soft cap" |
| **Vendor** | Spend to a specific payee wallet | Payment recipient address | "$20/day to Venice AI" |
| **API** | Spend to a hostname or domain | Target URL hostname | "$100/week to *.venice.ai" |
| **Task** | Spend on a specific task ID | `X-Floe-Task-Id` header | "$5 budget for task-research-123" |

All types support **agent-scoped** (one agent wallet) or **team-scoped** (all your agent wallets combined).

## Quick Start

### Set a daily vendor cap

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents/1/policies \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "vendor",
    "matchKey": "0xB77561F454F10Ce87C93EfFC4682102017f4CE86",
    "limitRaw": "50000000",
    "windowKind": "rolling",
    "windowSeconds": 86400
  }'
```

This creates a $50/day rolling cap for a specific vendor wallet. Any x402 call where the payment recipient matches this address counts against the limit.

### Set a per-API hostname cap

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents/1/policies \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "api",
    "matchKey": ".venice.ai",
    "matchKind": "host_suffix",
    "limitRaw": "100000000",
    "windowKind": "rolling",
    "windowSeconds": 604800
  }'
```

This caps all calls to `*.venice.ai` at $100/week.

### Set a team-wide budget

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/policies \
  -H "Cookie: floe_session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "session",
    "limitRaw": "500000000",
    "windowKind": "rolling",
    "windowSeconds": 2592000
  }'
```

This caps total spend across ALL your agent wallets at $500/month.

## Time Windows

Policies can be scheduled with calendar bounds:

```json
{
  "kind": "vendor",
  "matchKey": "0x...",
  "limitRaw": "10000000",
  "windowKind": "rolling",
  "windowSeconds": 86400,
  "effectiveFrom": 1748908800,
  "effectiveUntil": 1749513600
}
```

- **effectiveFrom** — Policy is inactive before this timestamp (UNIX seconds)
- **effectiveUntil** — Policy auto-expires after this timestamp

Useful for campaign budgets, time-boxed experiments, or scheduled spending windows.

## Window Kinds

| Kind | Behavior | Use case |
|------|----------|----------|
| `rolling` | Resets every `windowSeconds` | Daily/weekly/monthly budgets |
| `session` | Resets when you call PUT /spend-limit | Manual session caps |
| `once` | Single-shot cap, expires at `expiresAt` | Pre-borrow task holds |

## Matching Rules

### Vendor policies
Match against the **payment recipient address** (the wallet that receives USDC). Lowercased, exact match.

### API policies
Match against the **target URL hostname**:
- `host_suffix` (default): `.venice.ai` matches `api.venice.ai`, `x402.venice.ai`, `venice.ai`
- `host_exact`: `api.venice.ai` matches only `api.venice.ai`

### Task policies
Match against the **`X-Floe-Task-Id` header** sent with each proxy call. Case-insensitive.

## Enforcement

Policies are checked on every `POST /v1/proxy/fetch` call, inside the same transaction as the balance reservation. If any policy would be exceeded, the call is rejected with:

```json
{
  "error": "policy_exceeded",
  "policy_id": 42,
  "kind": "vendor",
  "limit": "50000000",
  "spent": "48500000",
  "cost": "5000000"
}
```

Spend is calculated from settled + in-flight payments. Refunded/failed calls automatically drop out of the spend sum.

## API Reference

### Per-Agent Policies

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/agents/policies` | Agent key | List active policies |
| POST | `/v1/agents/policies` | Agent key | Create policy |
| PATCH | `/v1/agents/policies/:id` | Agent key | Update limit/bounds |
| DELETE | `/v1/agents/policies/:id` | Agent key | Revoke policy |
| POST | `/v1/agents/policies/:id/reset` | Agent key | Reset rolling window |

Same routes available at `/v1/developer/agents/:agentId/policies` with session cookie auth.

### Team Policies

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/developer/policies` | Session cookie | List team policies |
| POST | `/v1/developer/policies` | Session cookie | Create team policy |
| PATCH | `/v1/developer/policies/:id` | Session cookie | Update |
| DELETE | `/v1/developer/policies/:id` | Session cookie | Revoke |

### Create Policy Body

```typescript
{
  kind: 'vendor' | 'api' | 'task' | 'session',
  matchKey: string,              // Required except for session
  matchKind?: 'host_exact' | 'host_suffix' | 'recipient',
  limitRaw: string,              // Raw USDC, 6 decimals (e.g. "5000000" = $5)
  windowKind?: 'rolling' | 'once' | 'session',
  windowSeconds?: number,        // Required for rolling (minimum 60)
  effectiveFrom?: number,        // UNIX seconds
  effectiveUntil?: number,       // UNIX seconds
  label?: string,                // Free-form label
}
```

## Dashboard

Policies can also be managed from the [Developer Dashboard](https://dev-dashboard.floelabs.xyz):
- **Per-agent:** Agent detail page → Policies section
- **Team-wide:** Settings → Team Policies
