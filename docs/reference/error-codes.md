---
icon: circle-exclamation
---

# Error Codes

Every error the Floe Credit API can return, grouped by where it appears. Each entry lists the HTTP status, the `error` string in the response body, what it means, and what to do.

For the agent-runtime subset (the error matrix that appears on `/v1/proxy/fetch` responses), the canonical reference is the **[Agent Runtime Contract](../developers/agent-runtime-contract.md)**. This page covers the full surface area including dashboard, developer key, webhook, and self-hosting errors.

## Quick Index

- [Agent runtime (`/v1/proxy/fetch`)](#agent-runtime-v1proxyfetch)
- [Developer auth (SIWE + JWT)](#developer-auth)
- [Developer keys (`/v1/developer/keys`)](#developer-keys)
- [Agent registration (`/v1/agents/*`)](#agent-registration)
- [Webhooks (`/v1/developer/webhooks/*`)](#webhooks)
- [Admin (`/v1/admin/*`)](#admin)
- [Self-hosting startup errors](#self-hosting-startup-errors)

---

## Agent runtime (`/v1/proxy/fetch`)

These are the errors your agent will see at runtime. This section is a condensed index — the full matrix with retry guidance lives in the [Agent Runtime Contract](../developers/agent-runtime-contract.md#error-handling-matrix).

| Status | `error` | Summary |
|---|---|---|
| 400 | `blocked_destination` | SSRF guard blocked the target URL. Do not retry. |
| 401 | `Missing or invalid Authorization header` | API key missing, wrong format, or a `floe_live_*` dev key was sent. |
| 402 | `insufficient_balance` | Credit line exhausted. Body has `available` and `required`. |
| 403 | `account_closed` | Deployer wound the agent down. Do not retry. |
| 403 | `credit_frozen` | Health monitoring froze spending. Operator must top up. |
| 403 | `credit_line_expired` | Rollover failed. Operator must re-delegate. |
| 429 | `rate_limit_exceeded` | 30 req/min token bucket. Body has `retry_after_seconds`. |
| 500 | `Payment signing failed` | Privy or EIP-3009 signing error. Retry with backoff. |
| 502 | `Failed to reach target URL` | Network error before `X-PAYMENT` was attached. Safe to retry. |
| 502 | `upstream_paid_request_failed_ambiguous` | Network error **after** `X-PAYMENT` was sent. **Do not retry immediately** — wait for reconciliation. |
| 503 | `agent_features_unavailable` | Facilitator booted without Privy credentials configured. |
| 503 | `agent_wallet_not_configured` | Agent has no Privy wallet — finish registration via `/agents/register`. |

### `agent_missing_privy_wallet` vs `agent_wallet_not_configured`

These two look similar but mean different things:

- **`agent_missing_privy_wallet`** appears in the `error` field of the internal `proxy_requests.error` log column when the agent record exists but `privyWalletAddress` is null. It is recorded for debugging and never exposed directly to the agent.
- **`agent_wallet_not_configured`** is the client-facing 500 response that surfaces the above condition with an actionable `message`.

If you see either, finish agent registration through the Developer Dashboard.

---

## Developer auth

Endpoints: `POST /v1/developer/auth/verify`

| Status | `error` | Cause | Fix |
|---|---|---|---|
| 401 | `Unauthorized` | Wallet signature missing, expired, or invalid | Re-sign — the dashboard does this automatically if the session drops |
| 401 | `Invalid signature` | `X-Signature` does not recover to the claimed address | Client bug — check signing library; wagmi should handle this correctly |
| 401 | `Timestamp out of window` | `X-Timestamp` is more than ±5 minutes from server time | Check client clock (NTP drift); re-sign |
| 401 | `Invalid JWT` | Bearer JWT signature failed HMAC verification, is malformed, or is expired (>7 days old) | Re-authenticate via the dashboard |

> Server-side nonces are **not** used. Replay protection comes from the timestamp window and the short JWT TTL. A future SIWE upgrade will add one-shot nonces.

---

## Developer keys

Endpoints: `POST/GET/DELETE /v1/developer/keys`

| Status | `error` | Cause | Fix |
|---|---|---|---|
| 400 | `Invalid request body` | Missing `label` or malformed JSON | Fix payload |
| 401 | Any dev-auth error | JWT missing or expired | Re-authenticate |
| 403 | `forbidden` | The key does not belong to the authenticated wallet | Double-check key ownership |
| 404 | `Key not found` | Revoking a key that does not exist or is already revoked | No action — idempotent |

### Key prefix confusion

If a request against `/v1/proxy/fetch` returns `401` despite passing a `floe_live_*` key: **that is intentional**. `/proxy/fetch` only accepts `floe_*` (agent) keys. Use a `floe_*` key minted via the Agent Setup wizard — see [API Keys](../developers/api-keys.md) for the full taxonomy.

---

## Agent registration

Endpoints: `POST /v1/agents/pre-register`, `POST /v1/agents/register`

| Status | `error` | Cause | Fix |
|---|---|---|---|
| 400 | `Invalid wallet address` | Non-EVM address in request body | Send a 0x-prefixed EVM address |
| 400 | `Invalid signature` | Signed message does not match the expected format | Re-sign using the exact message the dashboard shows |
| 403 | `agent_features_unavailable` | API booted without `PRIVY_APP_ID` / `PRIVY_APP_SECRET` / `PRIVY_AUTHORIZATION_PRIVATE_KEY` | Self-hosters: set all three env vars. Cloud: contact Floe support |
| 409 | `already_registered` | An agent is already registered for this developer wallet | Revoke and re-register, or reuse the existing agent |
| 422 | `delegation_not_found` | `/register` called before `setOperator` landed on-chain | Confirm the `setOperator` tx is finalized, then retry |
| 422 | `delegation_invalid` | On-chain `OperatorPermission` is inactive, expired, or has zero `borrowLimit` | Re-run the delegation with valid values |

---

## Webhooks

Endpoints: `POST/GET/PATCH/DELETE /v1/developer/webhooks`, `POST /v1/developer/webhooks/:id/rotate-secret`, `POST /v1/developer/webhooks/:id/test`

| Status | `error` | Cause | Fix |
|---|---|---|---|
| 400 | `url must be HTTPS` | Webhook URL is plain HTTP | Use HTTPS (enforced even for localhost in non-dev) |
| 400 | `blocked_destination` | Webhook URL resolved to a private IP or blocked range (SSRF guard) | Use a public HTTPS endpoint, or set `SSRF_ALLOW_LOCALHOST=1` for local development |
| 400 | `events must be a non-empty array` | No events selected | Pick at least one |
| 400 | `Invalid scope` | Scope is not `global` / `wallet` / `loan` | Use one of the three |
| 400 | `scopeValue required for non-global scope` | `scope` is `wallet` or `loan` but `scopeValue` is missing | Supply the wallet address or loan ID |
| 404 | `Webhook not found` | Editing/deleting a webhook that doesn't belong to you | Check ownership |

### Clearing scope

To convert a `wallet`-scoped or `loan`-scoped webhook back to `global`, PATCH with `{ "scope": "global", "scopeValue": null }`. Omitting `scopeValue` keeps the existing value; explicit `null` clears it.

### Delivery errors (on your server's side)

If Floe cannot deliver a webhook, the delivery row is marked `failed` and retried with exponential backoff. Common causes visible in the webhook detail page:

- **`HTTP 5xx from target`** — your server returned an error. Fix your handler; Floe will retry.
- **`Signature verification expected but no secret on webhook`** — webhook record lost its secret. Rotate via `/rotate-secret`.
- **`Timed out after 10s`** — your handler took too long. Enqueue work and return 200 fast; Floe does not wait for downstream processing.

---

## Admin

Endpoints: `POST /v1/admin/*` (self-host only)

| Status | `error` | Cause | Fix |
|---|---|---|---|
| 401 | `Unauthorized` | `X-Admin-Key` header missing or wrong | Set it to the value of `ADMIN_API_KEY` env var |
| 400 | `Invalid JSON body` | Malformed request body | Send valid JSON |
| 400 | `Invalid address` | Non-EVM id parameter | Use a 0x-prefixed EVM address |
| 404 | `Not found` | Target entity does not exist | Check the ID |

> In production, startup **fails fast** if `ADMIN_API_KEY` is not set. Any deployment that reaches a 401 here means the env var is set — the caller just has the wrong value.

---

## Self-hosting startup errors

These are thrown during server boot. Each has a clear fix.

| Error | When | Fix |
|---|---|---|
| `JWT_SECRET is required in production` | `NODE_ENV=production` but `JWT_SECRET` is unset or empty | Set `JWT_SECRET` to a ≥32-byte high-entropy string |
| `API_KEY_HMAC_SECRET is required in production` | Same as above for the HMAC secret | Set `API_KEY_HMAC_SECRET` independently from `JWT_SECRET` |
| `ADMIN_API_KEY is required in production` | Same as above for the admin key | Set `ADMIN_API_KEY` — guards every `/v1/admin/*` endpoint |
| `DATABASE_URL is required outside development` | Running in any non-`development`/`test` `NODE_ENV` without `DATABASE_URL` | Set `DATABASE_URL` to the persistent SQLite path (e.g. `/var/lib/floe/api.db`) |
| `Invalid PORT: "<value>"` | `PORT` env var is non-numeric, negative, or out of range | Use an integer between 1 and 65535 |
| `Invalid X402_VALID_BEFORE_SECONDS: "<value>"` | Tunable is non-numeric, zero, or negative | Use a positive integer (default 90) |
| `FATAL: failed to load @floe/protocol-services` | Workspace package import failed with a non-`MODULE_NOT_FOUND` error (e.g. syntax error in the package) | Rebuild workspace: `pnpm --filter @floe/protocol-services build`. If the package is genuinely absent the server will log a warning and disable agent features instead of crashing. |

All startup errors are intentional — the alternative is silently booting with insecure defaults or a fresh empty database, which are worse outcomes than a crash-and-alert on deploy. See **[Environment Variables](environment-variables.md)** for the full list with recommended values.

---

## Circuit breaker

When the on-chain `PriceOracle` circuit breaker is tripped (stale, deviation, sequencer down), the facilitator fails closed: every paid request returns a 5xx until the breaker clears.

| Status | `error` | Cause | Agent action |
|---|---|---|---|
| 503 | `circuit_breaker_active` | Protocol-wide halt due to oracle stale price / deviation > 15% / L2 sequencer down | Back off, poll `/v1/status`; do not retry blindly |
| 503 | `circuit_breaker_stale` | Facilitator cannot reach its RPC provider, so it cannot verify the breaker state | Back off, alert operator — this is an infra issue |

The breaker auto-clears when all conditions resolve; there is no manual reset for agents. See [Oracles & Circuit Breaker](../protocol/oracles-conditions.md) for the full list of trigger conditions.
