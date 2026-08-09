---
icon: shield-check
---

# Spend Controls

Programmable budgets for your agent wallets. Cap spending per vendor, per task, per API, or across your whole team — with optional time windows.

> **Scope: one ledger, one policy set.** Spend controls cap **every paid call Floe settles** — x402 vendors through the proxy (`POST /v1/proxy/fetch`) **and** LLM/voice tokens through the keyless gateway (`POST /v1/chat/completions`, host `credit-api.floelabs.xyz`); the legacy BYOK metered proxy `/v1/llm/chat/completions` is capped the same way. Route both through Floe and a single task or session budget bounds the entire conversation cost across every vendor. The one thing a policy can't see is a call you send straight to a provider with your own key, bypassing Floe — so route it through Floe.

## Policy Types

| Type | What it caps | Match on | Example |
|------|-------------|----------|---------|
| **Session** | Total agent spend | Everything | "$100/day soft cap" |
| **Vendor** | Spend to a specific payee wallet | Payment recipient address | "$20/day to Venice AI" |
| **API** | Spend to a hostname or domain | Target URL hostname | "$100/week to *.venice.ai" |
| **Task** | Spend on a specific task ID | `X-Floe-Task-Id` header | "$5 budget for task-research-123" |

Most types are **agent-scoped** (one agent wallet) or **team-scoped** (all your agent wallets combined); the `session` kind and the `session` window are **team-scoped only** (`/v1/developer/policies`).

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
| `session` | Resets when you call PUT /spend-limit | Manual session caps (team policies only) |
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

Policies are checked on every `POST /v1/proxy/fetch` call, inside the same transaction as the balance reservation. If any policy would be exceeded, the call is rejected with **402**:

```json
{
  "error": "policy_exceeded",
  "kind": "vendor",
  "matchKey": "0xb775…ce86",
  "policyId": 42,
  "label": "Venice daily cap",
  "reason": null,
  "required": "5000000",
  "spent": "48500000",
  "limit": "50000000"
}
```

When the breached policy is a kill-switch (`action: "suspend_agent"`, see below), the same body additionally carries `"auto_suspended": true`. The field is present **only** in that case — a plain breach omits it:

```json
{
  "error": "policy_exceeded",
  "kind": "task",
  "matchKey": "batch-run-7",
  "policyId": 57,
  "label": null,
  "reason": null,
  "required": "5000000",
  "spent": "9500000",
  "limit": "10000000",
  "auto_suspended": true
}
```

`suspendedReason` is **not** part of the 402 body — it lives on the agent record (`GET /v1/developer/agents/:agentId`) as the audit trail for why the agent is suspended.

Spend is calculated from settled + in-flight payments. Refunded/failed calls automatically drop out of the spend sum.

## Breach Action: the Policy Kill-Switch

By default a breach only declines the single call (the agent can keep trying). Set `action: "suspend_agent"` on a policy to turn it into a **kill-switch**: the breaching call still gets the 402 above (with `"auto_suspended": true`), and the **whole agent is suspended** — every subsequent call is rejected at authentication with 403 until you resume it.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents/1/policies \
  -H "Cookie: floe_session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "task",
    "matchKey": "batch-run-7",
    "limitRaw": "10000000",
    "windowKind": "rolling",
    "windowSeconds": 86400,
    "action": "suspend_agent"
  }'
```

A runaway agent that blows through this $10/day task budget is stopped cold instead of burning retries against a 402 wall.

Notes:

- Omitted or `"block"` preserves the default decline-one-call behavior.
- Only a genuine over-limit breach trips the switch. Fail-closed denials (e.g. an `api` policy that can't resolve the target hostname) decline the call but never suspend.
- **Team-scoped policies:** `action` is accepted on team policies too. A breach suspends **the single agent whose call crossed the cap** — never the whole team. The team cap keeps counting every agent's spend, so once it's saturated, each additional agent trips itself on its next paid call.
- The suspension is auditable: the agent record's `suspendedReason` (`GET /v1/developer/agents/:agentId`) reads `policy:<id>`, and the dashboard's agent page shows which policy tripped it.
- Resume via the pause/resume endpoint below or the dashboard — the policy stays active, so an unresolved budget breach will trip it again.

## Value-Aware Caps (`X-Floe-Task-Value`)

A static cap treats a $0.10 spam-filter run and a $500-revenue lead-enrichment run the same. Value-aware caps let one policy definition flex with the business value of the task — **inside operator-set bounds**.

Enable it by giving a policy scaling bounds:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents/1/policies \
  -H "Cookie: floe_session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "task",
    "matchKey": "lead-enrichment",
    "limitRaw": "1000000",
    "limitFloorRaw": "500000",
    "limitCeilingRaw": "3000000",
    "windowKind": "rolling",
    "windowSeconds": 86400
  }'
```

The caller then sends `X-Floe-Task-Value` (basis points; `10000` = 1×) on its paid calls:

```
X-Floe-Task-Value: 30000    → effective cap = clamp($1 × 3, $0.50, $3) = $3
X-Floe-Task-Value: 2500     → effective cap = clamp($1 × 0.25, $0.50, $3) = $0.50
(no header)                 → effective cap = $1 (the base limitRaw)
```

Security model — the header is **caller-supplied and untrusted by construction**:

- A policy **without** bounds ignores the header completely. Nothing changes for existing policies.
- With bounds, the header can only move the cap **between** `limitFloorRaw` and `limitCeilingRaw` — both operator-set (`floor ≤ limitRaw ≤ ceiling`, enforced at the API and by DB constraints). A caller can never grant itself more than the operator provisioned.
- An unset side clamps at `limitRaw`: a bare ceiling enables upscaling only, a bare floor downscaling only.
- Enforcement, `/forecast` preflight, and the `X-Floe-Budget-Advisory` header all report the same **effective** cap (one shared computation — they cannot drift).

Accepted range for the header: integer `1..100000` (0.0001×–10×); anything else is ignored (1×).

## Outcome-Quality Throttle (throttle on value, not just cost)

Cost caps stop an agent from spending too much; the quality throttle stops it from spending too much **on work that isn't working**. It consumes the caller-reported outcome signal from [Outcome-Linked Spend Attribution](agent-runtime-contract.md#outcome-linked-spend-attribution) — Floe never judges quality; your agent's own reports drive it.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents/1/policies \
  -H "Cookie: floe_session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "task",
    "matchKey": "lead-enrichment",
    "limitRaw": "1000000",
    "qualityThrottleFloorBps": 5000,
    "qualityWindowSeconds": 3600,
    "windowKind": "rolling",
    "windowSeconds": 86400
  }'
```

How it behaves:

- Floe averages the agent's reported outcomes in the window (`scoreBps` when reported; otherwise `success`→100%, `partial`→50%, `failure`/`unknown`→0%) into a quality reading.
- The effective cap is multiplied by `max(quality, qualityThrottleFloorBps)` — successive low-quality actions tighten spend toward the floor **even under budget**; recovering quality relaxes it back to 1×.
- **No reported outcomes in the window → factor 1.0 — behavior unchanged.** No signal, no change: the throttle is deliberately fail-open (unlike the fail-closed host/recipient guards) because quality is an optional caller-supplied signal, not a resolvable request fact.
- With value scaling on the same policy, quality applies after it; an operator `limitFloorRaw` still bounds the result from below.
- The reading is cached for ~30s, which also damps a flapping signal.

Trust boundary, stated plainly: quality is self-reported. An agent that lies about its own quality can avoid being throttled — the throttle protects you from *honest* runaway waste (retry loops, degraded upstream output), not from an adversarial agent. Hard caps remain the backstop.

## Pause / Resume an Agent (self-serve kill-switch)

Pause one agent without touching the rest of your fleet — no key rotation, no close:

```bash
curl -X PATCH https://credit-api.floelabs.xyz/v1/developer/agents/1/status \
  -H "Cookie: floe_session=..." \
  -H "Content-Type: application/json" \
  -d '{ "status": "suspended" }'   # or "active" to resume
```

- Takes effect on the agent's next call (403 at authentication).
- Only `active ↔ suspended` transitions are allowed. Closed or credit-frozen agents can't be resurrected through this endpoint (409) — those states belong to their own lifecycle flows.
- Resuming clears `suspendedReason`; pausing sets it to `developer_manual`.

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

### Agent Status (kill-switch)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/v1/developer/agents/:agentId/status` | Session cookie | Pause (`suspended`) or resume (`active`) one agent |

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
  kind: 'vendor' | 'api' | 'task',   // per-agent; the 'session' kind is team-only (/v1/developer/policies)
  matchKey: string,              // Required (except for the team-only 'session' kind)
  matchKind?: 'host_exact' | 'host_suffix' | 'recipient',
  limitRaw: string,              // Raw USDC, 6 decimals (e.g. "5000000" = $5)
  windowKind?: 'rolling' | 'once',   // 'session' window is team-only
  windowSeconds?: number,        // Required for rolling (minimum 60)
  effectiveFrom?: number,        // UNIX seconds
  effectiveUntil?: number,       // UNIX seconds
  label?: string,                // Free-form label
  action?: 'block' | 'suspend_agent',  // Breach behavior; omitted = 'block'
  limitFloorRaw?: string,        // Value-scaling lower bound (≤ limitRaw)
  limitCeilingRaw?: string,      // Value-scaling upper bound (≥ limitRaw); enables X-Floe-Task-Value
  qualityThrottleFloorBps?: number,  // 0..10000 — enables the outcome-quality throttle
  qualityWindowSeconds?: number,     // Quality lookback (min 60; default 86400)
}
```

## Dashboard

Policies can also be managed from the [Developer Dashboard](https://dev-dashboard.floelabs.xyz):
- **Per-agent:** Agent detail page → Policies section
- **Team-wide:** Settings → Team Policies
