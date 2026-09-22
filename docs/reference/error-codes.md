---
icon: circle-exclamation
---

# Error Codes

Every error the Floe Credit API can return, grouped by where it appears. Each entry lists the HTTP status, the `error` string in the response body, what it means, and what to do.

For the agent-runtime subset (the error matrix that appears on `/v1/proxy/fetch` responses), the canonical reference is the **[Agent Runtime Contract](../developers/agent-runtime-contract.md)**. This page covers the full surface area including dashboard, developer key, webhook, and self-hosting errors.

## Quick Index

- [Agent runtime (`/v1/proxy/fetch`)](#agent-runtime-v1proxyfetch)
- [Dashboard session (`/v1/developer/auth/*`)](#dashboard-session)
- [Developer keys (`/v1/developer/keys`)](#developer-keys)
- [Agent registration (`/v1/agents/*`)](#agent-registration)
- [Floe Phone numbers (`/v1/developer/agents/:agentId/numbers`, `/v1/numbers`)](#floe-phone-numbers)
- [Webhooks (`/v1/developer/webhooks/*`)](#webhooks)
- [Admin (`/v1/admin/*`)](#admin)
- [Self-hosting startup errors](#self-hosting-startup-errors)

---

## Agent runtime (`/v1/proxy/fetch`)

These are the errors your agent will see at runtime. This section is a condensed index — the full matrix with retry guidance lives in the [Agent Runtime Contract](../developers/agent-runtime-contract.md#error-handling-matrix).

| Status | `error` | Summary |
|---|---|---|
| 400 | `blocked_destination` | SSRF guard blocked the target URL. Do not retry. |
| 401 | `wrong_credential_type` | A non-agent credential (e.g. a `floe_live_*` dev key, dashboard session, or wallet signature) was sent. Use a `floe_*` agent key. |
| 401 | `Missing or invalid Authorization header` | No credential at all, or a malformed one. |
| 402 | `insufficient_balance` | Credit line exhausted. Body has `available` and `required`. |
| 403 | `account_closed` | Deployer wound the agent down. Do not retry. |
| 403 | `credit_frozen` | Health monitoring froze spending. Operator must top up. |
| 403 | `credit_line_expired` | Rollover failed. Operator must re-delegate. |
| 409 | `request_in_flight` | Concurrent retry of the same `Idempotency-Key` is still running. Body has the `idempotency_key`. Wait briefly and retry, or use a fresh key. |
| 429 | `rate_limit_exceeded` | Rate limit tripped. Body has `reason` (`agent_proxy_limit` \| `ip_rate_limit` \| `global_rate_limit`), `retry_after_seconds`, `limit_per_minute`, `remaining`. |
| 500 | `Payment signing failed` | Privy or EIP-3009 signing error. Retry with backoff. |
| 502 | `Failed to reach target URL` | Network error before `X-PAYMENT` was attached. Safe to retry. |
| 502 | `upstream_paid_request_failed_ambiguous` | Network error **after** `X-PAYMENT` was sent. **Do not retry** — call `awaitSettlement(nonce)` / `await_settlement(nonce)`. The body carries `reservation.nonce`; see [Awaiting an ambiguous payment](#awaiting-an-ambiguous-payment). |
| 503 | `agent_features_unavailable` | Facilitator booted without Privy credentials configured. |
| 503 | `agent_wallet_not_configured` | Agent has no Privy wallet — provision one via `POST /v1/developer/agents`. |

### Awaiting an ambiguous payment

When `/v1/proxy/fetch` returns `502 upstream_paid_request_failed_ambiguous`, the payment header **was already sent upstream** — the merchant may or may not have actually charged. The reservation is parked in `pending_settlement` and reconciliation flips it to `settled`, `payment_rejected`, or `expired_unsettled` once on-chain state is known.

**Never retry an ambiguous call** — that may double-charge. Instead, take the nonce out of the 502 body and await settlement:

```ts
// TypeScript
try {
  await agent.fetch("https://api.example.com/paid");
} catch (e) {
  if (e instanceof FloeAgentError && e.code === "upstream_paid_request_failed_ambiguous") {
    // `body` is the parsed JSON response (added in FLO-567); `detail` stays
    // the raw body string for back-compat with pre-FLO-567 callers.
    const nonce = (e.body as { reservation: { nonce: string } }).reservation.nonce;
    const final = await agent.awaitSettlement(nonce, { intervalMs: 2_000, timeoutMs: 15 * 60_000 });
    // final.state ∈ { "settled", "payment_rejected", "expired_unsettled" }
  } else {
    throw e;
  }
}
```

```python
# Python
try:
    agent.fetch(url="https://api.example.com/paid")
except FloeAgentError as e:
    if e.code == "upstream_paid_request_failed_ambiguous":
        nonce = e.detail["reservation"]["nonce"]
        final = agent.await_settlement(nonce, interval_seconds=2.0, timeout_seconds=900.0)
        # final.state ∈ { "settled", "payment_rejected", "expired_unsettled" }
    else:
        raise
```

Under the hood, the helpers poll `GET /v1/agents/reservations/{nonce}` (documented in [credit-api.md](../developers/credit-api.md#get-v1agentsreservationsnonce)) until `terminal: true`. AgentKit exposes the same flow as the `x402_await_settlement` action so an LLM can react to a 502 directly.

---

## Dashboard session

Endpoints: `POST /v1/developer/auth/privy` (email / Google sign-in) and `POST /v1/developer/auth/verify` (wallet sign-in). Both set the HttpOnly `floe_session` cookie. See [Credit API → Dashboard sign-in](../developers/credit-api.md#dashboard-sign-in).

### Email / Google sign-in (`POST /v1/developer/auth/privy`)

Every error body is `{ "error": "<code>", "message": "<sentence>" }`, plus `retryable` or `retryAfterSeconds` where noted.

| Status | `error` | Cause | Fix |
|---|---|---|---|
| 400 | `invalid_request` | `Content-Type` isn't `application/json`, the body isn't a JSON object, `walletHint` isn't a `0x` address, or `allowNew` isn't a boolean | Send a JSON object with `Content-Type: application/json` |
| 401 | `invalid_privy_token` | No `Authorization: Bearer` token, a `floe_…` API key sent instead, or a Privy access token that is expired or invalid (a token issued for a different Privy app is `503 privy_app_mismatch` instead) | Sign in again for a fresh token |
| 409 | `embedded_wallet_pending` | A brand-new email / Google sign-in whose account isn't fully set up yet. Body has `retryable: true` | Retry after a moment (the dashboard does this for you) |
| 409 | `wallet_signature_required` | This sign-in would create a new account, but the account this browser already uses (`walletHint`) exists and doesn't belong to this sign-in | Choose. To create a new account, repeat with `allowNew: true`. To continue with the existing account, sign out of this sign-in and sign in the way you originally did: with its wallet at `/auth/verify`, or with the email / Google account you used before. The two sign-ins are not linked |
| 409 | `identity_ambiguous` | More than one Floe account could belong to this sign-in. For a new account, this also happens when the sign-in has several wallets and Floe can't tell which one to use | Sign in with the wallet of the account you want (`/auth/verify`) |
| 409 | `identity_conflict` | The account already belongs to a different email / Google sign-in (one per account) | Sign in the way you originally did: with that email / Google account, or with the account's wallet (`/auth/verify`) |
| 429 | `rate_limited` | More than 30 attempts a minute from one IP, or 24 a minute for one signed-in user. Body has `retryAfterSeconds`; `Retry-After` is set too | Wait `retryAfterSeconds`, then retry. The dashboard waits for you |
| 502 | `privy_unavailable` | Temporary Privy outage: Floe couldn't reach Privy to verify the sign-in | Retry shortly. The dashboard retries for you |
| 503 | `privy_auth_unavailable` | Email / Google sign-in isn't configured on this server, or Privy rejects the server's own credentials (a wrong or rotated `PRIVY_APP_SECRET`, or a `PRIVY_APP_ID` Privy doesn't recognize) | Sign in with a wallet instead; the dashboard falls back to wallet sign-in automatically. Self-hosters: set `PRIVY_APP_ID` and `PRIVY_APP_SECRET` from the same Privy app (see [Environment Variables](environment-variables.md#dashboard-sign-in-privy)). When Privy rejects them, the API logs `privy_login_misconfigured` |
| 503 | `privy_app_mismatch` | The sign-in token was issued for a different Privy app than the server's: the dashboard's `NEXT_PUBLIC_PRIVY_APP_ID` and the API's `PRIVY_APP_ID` name different apps. A server misconfiguration, not a problem with your sign-in; every sign-in through that dashboard fails until it's fixed | Retrying doesn't help. The dashboard shows "Sign-in is temporarily unavailable" and does **not** fall back to wallet sign-in, because that would sign you in to a different, new account. Self-hosters: point both variables at the same Privy app; the API logs `privy_login_app_mismatch` with both app IDs |

### Wallet sign-in (`POST /v1/developer/auth/verify`) and signed requests

Every error here has `"error": "Unauthorized"`. The `message` tells you which check failed.

| Status | `message` | Cause | Fix |
|---|---|---|---|
| 401 | *"Signing in requires a fresh wallet signature (X-Wallet-Address, X-Signature, X-Timestamp). API keys and existing sessions cannot start a new dashboard session."* | `/auth/verify` received a `floe_live_` developer key instead of a fresh wallet signature | Send fresh `X-Wallet-Address` / `X-Signature` / `X-Timestamp` headers |
| 401 | *"Missing required auth headers: X-Wallet-Address, X-Signature, X-Timestamp"* | No signature headers. On `/auth/verify`, a request that carries only an existing session (cookie or Bearer token) also gets this, because a session can't start a new one. On other routes, it means there's no valid session either: missing, or expired after 7 days | Send fresh signature headers, or sign in to the dashboard again |
| 401 | *"Invalid wallet address format"* / *"Invalid signature format."* / *"Invalid timestamp"* | A signature header is malformed | Client bug — send a `0x` address, a hex signature, and a Unix timestamp in seconds |
| 401 | *"Timestamp too stale. Must be within 300 seconds of server time."* | `X-Timestamp` is more than ±5 minutes from server time | Check client clock (NTP drift); re-sign |
| 401 | *"Signature verification failed."* | The signature doesn't verify for `X-Wallet-Address` over `Floe Credit API\nTimestamp: <X-Timestamp>` (EOA, ERC-1271, or ERC-6492) | Check the signed message and signing library, then re-sign |

> Signed requests don't use server-side nonces. Replay protection comes from the ±5-minute timestamp window, and dashboard sessions expire after 7 days.

---

## Developer keys

Endpoints: `POST/GET/DELETE /v1/developer/keys`

| Status | `error` | Cause | Fix |
|---|---|---|---|
| 400 | `Invalid request body` | Missing `label` or malformed JSON | Fix payload |
| 401 | Any [dashboard-session](#dashboard-session) error | No valid developer credential (session missing or expired, bad key or signature) | Re-authenticate |
| 403 | `forbidden` | The key does not belong to the authenticated wallet | Double-check key ownership |
| 404 | `Key not found` | Revoking a key that does not exist or is already revoked | No action — idempotent |

### Key prefix confusion

If a request against `/v1/proxy/fetch` returns `401 wrong_credential_type` despite passing a `floe_live_*` key: **that is intentional**. `/proxy/fetch` only accepts `floe_*` (agent) keys. Use a `floe_*` key minted via the Agent Setup wizard — see [API Keys](../developers/api-keys.md) for the full taxonomy.

---

## Agent registration

Endpoints: `POST /v1/developer/agents`, `POST/GET/DELETE /v1/developer/agents/:agentId/keys`, `POST /v1/developer/agents/:agentId/keys/:keyId/rotate`, `POST /v1/developer/agents/:agentId/close`

| Status | `error` | Cause | Fix |
|---|---|---|---|
| 400 | `Invalid request` | Body failed Zod validation (`name`, `borrowLimitRaw`, `maxRateBps`, `expirySeconds`) | Inspect the `details` array and fix the offending field |
| 401 | (auth error) | None of the accepted credentials (session cookie, dev key, wallet signature) were present or valid | Re-authenticate the calling client |
| 404 | `not_found` | Agent does not exist OR belongs to a different developer (cross-tenant probes return 404, not 403) | Check the agentId; confirm ownership |
| 409 | `limit_exceeded` | Developer is at the 5-agent cap (or the 5-active-key cap per agent on `POST /keys`) | Close an agent first, or revoke/rotate an existing key |
| 409 | `name_conflict` | Another agent owned by the same developer already uses this name | Pick a different name |
| 502 | `privy_provisioning_failed` | Privy refused to create the Privy wallet | Inspect `detail`; the agent row stays in `pending_delegation` for a retry |
| 502 | `delegation_failed` | Server-side `setOperator` tx threw | Inspect `detail`; retry once Privy / facilitator are healthy |
| 503 | `agent_creation_unavailable` | `privyService` or `agentDelegationService` not initialized at boot | Self-hosters: set `PRIVY_APP_ID` / `PRIVY_APP_SECRET` / `PRIVY_AUTHORIZATION_PRIVATE_KEY` / `PRIVY_SIGNER_ID` and `FACILITATOR_PRIVATE_KEY` |
| 503 | `winddown_unavailable` | `POST /:id/close` called without `WinddownService` configured AND agent has active loans | Configure the winddown service or close manually via on-chain repay |

---

## Floe Phone numbers

Endpoints: `POST /v1/developer/agents/:agentId/numbers` (developer key / dashboard) and `POST /v1/numbers` (agent key) — both run the same purchase core, so the codes are identical. Every error body carries a human-readable `detail` next to the `error` code. Full flow: [Floe Phone](../developers/floe-phone.md).

| Status | `error` | Cause | Fix |
|---|---|---|---|
| 400 | `area_code_required` | Body has neither `areaCode` nor `phoneNumber` — the carrier picks a number by area code or exact E.164, never "any US number". Refused before anything is reserved or charged | Send `areaCode` (3-digit US, `2xx`–`9xx`) or an exact `phoneNumber` from `GET …/numbers/search` |
| 400 | `invalid_area_code` | `areaCode` is not 3 digits with a leading `2`–`9` | Fix the code (e.g. `415`) |
| 402 | `insufficient_balance` | The agent's spendable balance can't cover the first month's rental (`available` / `required` in the body) | Fund the agent, then retry |
| 402 | `spend_limit_exceeded` / `policy_exceeded` | A session limit or spend policy blocked the rental debit | Raise the limit / adjust the policy |
| 403 | `telephony_suspended` | Phone service is suspended for this account | Contact support |
| 409 | `number_exists` | The agent already has a live number (one per agent); the body includes it as `number` | Reuse it, or release it first |
| 409 | `no_numbers_available` | Nothing purchasable in that area code, or the exact `phoneNumber` was taken | Try another area code / search again |
| 409 | `agent_unavailable` / `agent_not_ready` | Agent is suspended/closed, or its wallet isn't provisioned yet | Use an active, provisioned agent |
| 502 | `provisioning_failed` | Carrier-side purchase failed — the reservation was released, nothing was charged | Retry, or pick another area code |
| 503 | `telephony_unavailable` | Floe Phone isn't configured on this deployment, or the phone rate card isn't seeded | Self-hosters: set `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` and run `pnpm --filter @floe/api seed:catalog` |

---

## Webhooks

Endpoints: `POST/GET /v1/developer/webhooks`, `GET/PATCH/DELETE /v1/developer/webhooks/:id`, `GET /v1/developer/webhooks/events`, `POST /v1/developer/webhooks/:id/rotate-secret`, `POST /v1/developer/webhooks/:id/test`, `GET /v1/developer/webhooks/:id/deliveries`, `POST /v1/developer/webhooks/:id/deliveries/:deliveryId/retry`, `GET /v1/developer/webhook-deliveries` (+ `/:deliveryId`)

| Status | `error` | Cause | Fix |
|---|---|---|---|
| 400 | `url must be HTTPS` | Webhook URL is plain HTTP | Use HTTPS (enforced even for localhost in non-dev) |
| 400 | `blocked_destination` | Webhook URL resolved to a private IP or blocked range (SSRF guard) | Use a public HTTPS endpoint, or set `SSRF_ALLOW_LOCALHOST=1` for local development |
| 400 | `events must be a non-empty array` | No events selected | Pick at least one — exact names, `*`, or a prefix wildcard like `call.*` that matches at least one catalog event (`GET /webhooks/events`) |
| 400 | `invalid_scope` | Scope is not `global` / `wallet` / `agent` / `loan`, or the scopeValue doesn't fit it | `wallet`/`agent` take a `0x` wallet address (for `agent`, the agent's **wallet** address, not its numeric id); `loan` takes a numeric loan id; `global` takes none |
| 400 | `scopeValue required for non-global scope` | `scope` is `wallet`, `agent`, or `loan` but `scopeValue` is missing | Supply the wallet address or loan ID |
| 400 | `Limit exceeded` | The account already has 10 webhooks | Delete one first (max 10 per account) |
| 400 | `invalid_filter` | A `GET /webhook-deliveries` filter is malformed (non-numeric `endpoint`, bad `agent` address, unknown `status`, unparseable `from`/`to`) | Fix the named filter; the error says which |
| 400 | `invalid_cursor` | `cursor` is not an opaque value from a previous response | Pass `nextCursor` verbatim, or drop it to restart from the newest rows |
| 404 | `Webhook not found` | Editing/deleting a webhook that doesn't belong to you | Check ownership |
| 404 | `delivery_not_found` | Unknown `deliveryId`, a delivery on someone else's webhook, or a row past the 30-day retention window | List via `GET /v1/developer/webhook-deliveries` and use the hex `deliveryId` (not the numeric row id) |

### Scope is immutable

`PATCH /v1/developer/webhooks/:id` updates `url`, `events`, `active`, and `description` only — `scope`/`scopeValue` cannot be changed after creation. To re-scope an endpoint, delete it and create a new one.

### Delivery errors (on your server's side)

If Floe cannot deliver a webhook, the delivery is retried up to 3 total attempts (attempt 2 fires 60 seconds after the first failure; attempt 3 fires 300 seconds after attempt 2) and then marked `failed`; test deliveries are never retried. Common causes visible in the delivery log:

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
| 503 | `circuit_breaker_active` | Protocol-wide halt due to oracle stale price / deviation > 20% / L2 sequencer down | Back off, poll `/v1/status`; do not retry blindly |
| 503 | `circuit_breaker_stale` | Facilitator cannot reach its RPC provider, so it cannot verify the breaker state | Back off, alert operator — this is an infra issue |

The breaker auto-clears when all conditions resolve; there is no manual reset for agents.
