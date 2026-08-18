---
icon: file-contract
---

# Agent Runtime Contract

You are an agent authored against the Floe credit facilitator. You never sign transactions, never see USDC, and never think about intents or loans. You have one environment variable — `FLOE_API_KEY` — and you call `POST /v1/proxy/fetch`. This page is your runtime contract: read it once, then code against it.

Wallet provisioning, collateral funding, and operator delegation were all handled by your deployer at setup time via the [Developer Dashboard](developer-dashboard.md) (or the `floe-agent register` CLI) — Floe provisions a managed Privy wallet and submits the on-chain `setOperator` server-side. You inherit a ready-to-use API key.

## The Invariants

- You never hold a private key.
- You never handle USDC directly.
- You never call `registerBorrowIntent`, `repayLoan`, or any on-chain function.
- Your deployer ran `POST /v1/developer/agents` (or the CLI/dashboard equivalent) once, at setup time.
- If your API key is revoked or delegation expires, you get `401` or `403` — **stop and alert your operator**.
- The facilitator charges your credit line; your deployer is billed.

## Auth and Identification

Every paid request carries `Authorization: Bearer floe_<hex>`. This is a **`floe_*` agent key**, minted by the facilitator when your deployer provisioned the agent. It is **not** a `floe_live_*` developer key — developer keys are for the dashboard and webhook management, and will `401` if sent to `/v1/proxy/fetch`. See [API Keys](api-keys.md) for the full taxonomy.

## The Happy Path

```ts
// Agent code — complete runtime
const res = await fetch('https://credit-api.floelabs.xyz/v1/proxy/fetch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.FLOE_API_KEY}`,
    'Content-Type': 'application/json',
    // Recommended: send a fresh UUID per logical attempt so 502/timeout
    // retries replay the original response instead of paying twice.
    'Idempotency-Key': crypto.randomUUID(),
  },
  body: JSON.stringify({
    url: 'https://api.some-x402-service.com/premium/analyze',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'hello' }),
  }),
});
if (res.ok) {
  const costUsdc = res.headers.get('X-Floe-Cost-USDC'); // raw 6-decimal USDC string
  return { data: await res.json(), costUsdc };
}
```

If the target URL returns `402 Payment Required`, the facilitator signs the EIP-3009 authorization out of your deployer's delegated credit line, retries, and streams back the merchant's 2xx response. You never see the 402. You only see success or one of the error codes below.

## Request and Response Headers

**Request**

| Header | Required | Purpose |
|---|---|---|
| `Authorization: Bearer floe_<hex>` | yes | Your agent API key |
| `Content-Type: application/json` | yes | — |
| `Idempotency-Key: <opaque>` | **recommended** | Stripe-style retry key, ≤255 chars (typically a UUIDv4). Same key + same agent within 10 minutes replays the cached response — including its status, headers, and body — instead of running a second payment. Without this header, a retry after a network failure can double-charge you. See [x402 Facilitator → Idempotency](x402-facilitator.md#idempotency). |
| `X-Floe-Task-Id: <opaque>` | optional | Task tag (≤128 chars, lowercased server-side). Spend accrues against any per-task budget with this id — see [Spend Controls](spend-controls.md). |
| `X-Floe-Action-Id: <opaque>` | optional | Decision/action tag (≤128 chars, lowercased server-side). Attributes this call's cost to one action of your run for the cost-vs-outcome eval view — see [Outcome-Linked Spend Attribution](#outcome-linked-spend-attribution). Accepted on **every** paid surface (x402 proxy, marketplace, keyless gateway, `/v1/llm`, `/v1/venice`, realtime). |
| `X-Floe-Task-Value: <bps>` | optional | Task-value multiplier in basis points (`10000` = 1×, integer 1..100000). Scales the effective cap of policies whose operator set value-scaling bounds — and only inside those bounds; policies without bounds ignore it entirely. See [Spend Controls → Value-Aware Caps](spend-controls.md#value-aware-caps-x-floe-task-value). |

**Response**

| Header | When | Purpose |
|---|---|---|
| `X-Floe-Cost-USDC` | **every** 2xx | Raw USDC units (6-decimal integer string) charged for this request. `0` when the target was free (a passthrough). Consume it to budget, attribute, or surface cost upstream. |
| `X-Floe-Payment` | **every** 2xx | `paid` (Floe signed an x402 payment — see the cost header) or `passthrough` (the target was free, cost `0`). Branch on this so you never have to infer free-vs-paid from the presence of the cost header. |
| `X-Floe-Budget-Advisory` | 2xx after a paid call (when enabled) | JSON describing how close you are to your tightest active spend cap. Use it to downgrade models or change path *before* you hit a hard `402`. See [Context-Aware Spend Advisory](#context-aware-spend-advisory). **On for the hosted API**; opt-in (`BUDGET_ADVISORY_ENABLED`) when self-hosting. |
| `X-Floe-RateLimit-Advisory` | keyless-gateway responses (when enabled) | The upstream provider's rate-limit headroom, normalized across providers (OpenAI / Anthropic / `Retry-After`) into one `near_limit` signal so you can back off before the 429 wall. See [Keyless Inference → Rate-Limit Advisory](keyless-inference.md#rate-limit-advisory-cross-provider-backpressure). Off by default. |
| `X-Floe-Idempotent-Replay: true` | only on replays | The body you received is a cached replay of a prior request with the same `Idempotency-Key`. No new payment occurred. |

## Context-Aware Spend Advisory

The hosted API (`credit-api.floelabs.xyz`) enables this; self-hosters turn it on with `BUDGET_ADVISORY_ENABLED=1`. Paid 2xx responses then carry an `X-Floe-Budget-Advisory` header. It reflects how close you are to the **tightest** spend cap Floe already enforces for you — your credit-line backstop (when a credit line is set), plus any session, per-task, or per-vendor caps your operator has set. The point is to let you **downgrade to a cheaper model or change path before** you hit a hard `402`. (If no credit line or policy cap applies — e.g. provisioning still in flight — the header is omitted.)

```jsonc
// X-Floe-Budget-Advisory (parsed)
{
  "near_limit": true,                 // omitted if no threshold configured; otherwise true OR false
  "tightest": {
    "scope": "vendor",                // credit_line | session | task | api | vendor
    "match": "api.openai.com",         // value depends on scope; e.g. "0xpayee…" (vendor), "task-id" (task), or null
    "used_bps": 8500,                 // 0–10000; 8500 = 85% of this cap used
    "remaining_raw": "150000",        // raw USDC (6-decimal) left on this cap
    "window_kind": "rolling",         // once | rolling | session | credit_line | null
    "window_resets_at": "2026-06-04T00:00:00.000Z" // rolling windows only
  }
}
```

How to use it:

```ts
const adv = res.headers.get('X-Floe-Budget-Advisory');
if (adv) {
  const { tightest, near_limit } = JSON.parse(adv);
  // Apply your own % if no threshold is configured, or trust near_limit if it is.
  if (near_limit ?? tightest.used_bps >= 8000) {
    useCheaperModel(); // or alert your operator, or slow down
  }
}
```

Notes:
- **Always raw + optional flag.** `used_bps` and `remaining_raw` are always present, so you can apply any threshold yourself. `near_limit` appears only when your operator configured an alert threshold.
- **Floe caps only.** This reflects spend Floe tracks against Floe caps. If your LLM calls run outside Floe, combine this with your own cost accounting — it is not your total budget.
- **Advisory, not enforcement.** Ignoring it doesn't break anything; the existing `402 insufficient_balance` / policy hard-stop is still the backstop.
- **`window_resets_at`** tells you when a rolling cap refills, so you can choose to wait instead of downgrade. `once`/`session` caps don't auto-refill.

### Same signal, locally (open source)

No Floe account yet? The open-source [`floe-guard`](https://github.com/Floe-Labs/floe-guard) library exposes the **same advisory shape** on its in-process budget guard — `guard.advisory()` returns `near_limit`, `used_bps`, and `remaining_usd` for your local cap (Python and TypeScript). Write your taper logic against it for free, no account, no network.

When you move to the hosted proxy, that logic ports unchanged — it just reads `X-Floe-Budget-Advisory` and gains what a single in-process budget can't know: the **tightest** cap across `credit_line | session | task | api | vendor`, cross-vendor reasoning, server-truth balances, and `window_resets_at`. Local guard is estimate-based and single-cap; the hosted advisory is server-truth and multi-cap.

## Outcome-Linked Spend Attribution

Cost tells you what an action spent; only you know whether it worked. Close the loop in three steps:

**1. Tag your paid calls.** Send `X-Floe-Action-Id` (any opaque id, ≤128 chars) on any paid surface. Every debit row that call produces carries the tag.

**2. Report the outcome.** When you know how the action turned out, report it against the same id:

```ts
await fetch('https://credit-api.floelabs.xyz/v1/agents/actions/summarize-doc-42/outcome', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.FLOE_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'success',        // success | failure | partial | unknown
    scoreBps: 9000,           // optional quality score, 0..10000 (90%)
    note: 'summary accepted', // optional, ≤500 chars
  }),
});
```

Re-reporting the same action replaces the previous signal (a `reportCount` tracks how many times). Floe never judges quality — the status/score are yours, stored verbatim.

With the `floe-agent` SDK this is two calls:

```ts
await agent.fetch({ url, actionId: 'summarize-doc-42' });
await agent.reportOutcome('summarize-doc-42', { status: 'success', scoreBps: 9000 });
```

**3. Read cost-vs-outcome.** Your operator's dashboard (agent page → *Actions*) and `GET /v1/developer/agents/:id/actions` (session auth) return, per action: total calls, settled spend, and your reported outcome — the raw material for "was this decision worth what it cost?" eval and optimization. Your operator can also report/correct outcomes via `POST /v1/developer/agents/:id/actions/:actionId/outcome`.

Notes:
- `X-Floe-Action-Id` is attribution only — it never affects budgets or enforcement. Use `X-Floe-Task-Id` for per-task **caps**; use action ids for per-decision **accounting**. The two compose (a task usually spans several actions).
- Spend is aggregated from settled calls only; failed/refunded calls are counted but not summed.
- An outcome may be reported before (or without) any tagged spend — it shows as a zero-cost action.

## Error Handling Matrix

| Status | `error` body | Meaning | Retry? | How |
|---|---|---|---|---|
| 200 | — | Success — the merchant paid and replied | — | Consume the body |
| 400 | `blocked_destination` | SSRF guard blocked the target URL | **No** | Fix the URL; do not retry |
| 400 | `Invalid request` | Your request body failed schema validation | **No** | Fix the request |
| 401 | `wrong_credential_type` | A non-agent credential (e.g. a `floe_live_*` dev key, dashboard session, or wallet signature) was sent — valid on other `/v1` endpoints but not `/v1/proxy/*` | **No** | Mint a `floe_*` agent key and send it as the Bearer token |
| 401 | `Missing or invalid Authorization header` | No credential at all, or a malformed one | **No** | Alert operator — the agent key is missing or broken |
| 402 | `insufficient_balance` | Credit line exhausted; body includes `available` and `required` | **Wait** | Back off; poll `GET /v1/agents/balance`. Retry only once `available >= required` |
| 403 | `account_closed` | Deployer wound the agent down | **No** | Exit; do not retry |
| 403 | `credit_frozen` | Health monitoring froze spending (low collateral health) | **No** | Alert operator — they must top up collateral or wait for auto-unfreeze |
| 403 | `credit_line_expired` | Rollover failed (no liquidity on rollover) | **No** | Alert operator |
| 409 | `request_in_flight` | Concurrent retry of the same `Idempotency-Key` is still running. Body includes the `idempotency_key`. | **Wait** | Wait briefly (seconds) and retry the same key; or generate a fresh key for a new attempt |
| 429 | `rate_limit_exceeded` | Token bucket / sliding window / global limit tripped; body includes `reason`, `retry_after_seconds`, `limit_per_minute`, `remaining` | **Yes, after backoff** | Sleep `retry_after_seconds`, then retry. Branch on `reason` (`agent_proxy_limit` / `ip_rate_limit` / `global_rate_limit`) to decide whether to slow down or fall back to a free path |
| 500 | `Payment signing failed` / `Reservation persistence failed` | Internal facilitator error | **Yes, with backoff** | Exponential backoff with jitter, max 3 attempts |
| 502 | `Failed to reach target URL` | Request never reached the merchant (DNS, TCP, timeout) | **Yes** | Retry if transient |
| 502 | `upstream_paid_request_failed_ambiguous` | Network error after `X-PAYMENT` was sent — the merchant may have already claimed the authorization on-chain. Body includes `reservation: { nonce, validBefore }` | **DO NOT retry immediately** | The reservation is parked in `pending_settlement`. Reconciliation typically finalizes within 15-90 seconds. Poll `GET /v1/agents/balance` every 10 seconds until `pendingSettlements` drops to zero (or at least below the stuck amount), then retry. Prefer a different provider on retry. |
| 502 | `upstream_payment_unsettled` | Merchant returned 2xx but `validBefore` expired before reconciliation observed the on-chain USDC Transfer — authorization can no longer be claimed, reserved balance is released | **Yes, safe to retry** | Preferably on a different provider |
| 502 | `Failed to parse PAYMENT-REQUIRED header` / `402 response missing PAYMENT-REQUIRED header` | Merchant is broken | **No** | Pick a different provider |
| 4xx (passthrough) | `Payment was not accepted by resource server` | Merchant rejected the signed payment | **No** | Inspect `detail`; pick a different provider |

## The Retry Golden Rule

**The only response you must not retry immediately is `502 upstream_paid_request_failed_ambiguous`.** Retrying before reconciliation finalizes may cause a double-charge against your credit line if the original authorization settles on-chain. Wait until `pendingSettlements` in your balance response drops to zero (or at least below the stuck amount), then retry — and prefer a different provider if possible. All other 502s are safe to retry.

For the full state machine behind `pending_settlement`, `settled`, and `expired_unsettled`, see [Reservation Lifecycle (RC-12)](x402-facilitator.md#reservation-lifecycle-rc-12).

## What To Do When Blocked

When you see `401`, `403`, or any `credit_frozen` / `account_closed` response:

1. **Stop making paid calls.** Do not retry blindly — you will just burn rate-limit budget and noise up the operator's logs.
2. **Log the incident** with the full response body (`error`, `reason`, and any `detail`).
3. **Escalate to your deployer** via whatever out-of-band channel you have (webhook, alert, status file). The deployer must act in the [Developer Dashboard](developer-dashboard.md) — you cannot fix this yourself.
4. Either exit the task cleanly or park it until the operator acknowledges.

## Further Reading

- [x402 Credit Facilitator](x402-facilitator.md) — the full protocol, including the [Reservation Lifecycle (RC-12)](x402-facilitator.md#reservation-lifecycle-rc-12)
- [API Keys](api-keys.md) — `floe_live_*` vs `floe_*` key taxonomy
- [Developer Dashboard](developer-dashboard.md) — how your deployer manages the agent, delegation, and credit line
