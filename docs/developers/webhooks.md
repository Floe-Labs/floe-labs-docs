---
icon: webhook
---

# Webhooks

Floe uses webhooks in **two directions**:

1. **Events Floe sends you** — register a URL and Floe POSTs it when something happens on your account (an agent is provisioned, a loan nears liquidation, a call ends, a marketplace payment settles). Use these to drive activation checklists, audit logs, and spend alerts instead of polling.
2. **Cost you report to Floe (Reconcile Mode)** — get every call's cost onto one ledger so one budget spans your whole stack. On **hosted platforms (Vapi, Retell, Bland)** you point the platform's own end-of-call cost webhook at Floe. On **self-hosted stacks (Pipecat, LiveKit)** there is no such webhook — your agent self-reports each call's cost to Floe. Enforcement then differs by platform (see [Connect your orchestrator](#connect-your-orchestrator-reconcile-mode)).

**Base URL:** `https://credit-api.floelabs.xyz`

---

## Events Floe sends you

### Event catalog

Floe emits **46 events across seven categories**. The tables below are a snapshot — the live catalog is `GET /v1/developer/webhooks/events` (or `floe webhooks events` from the [CLI](cli.md)), which returns every event's name, title, description, category, and scope dimension. Treat that endpoint as the source of truth; new events appear there first.

Every delivery is a JSON POST with the shape `{ "event": "<name>", ...fields, "firedAt": "<ISO 8601>" }`.

#### Loan events

Routed on the loan ID — subscribe with `loan` scope to follow one loan, or `global` for all.

| Event | Fires when |
|-------|-----------|
| `loan.health_warning` | A loan's collateral ratio is approaching its liquidation threshold — top up collateral or repay to avoid liquidation |
| `loan.expiry_warning` | A loan is nearing its maturity date and is still outstanding |
| `loan.overdue` | A loan passed its maturity date without being repaid |
| `loan.liquidated` | A loan was liquidated — collateral was seized to cover the outstanding debt |
| `loan.repaid` | A loan was fully repaid and closed |

#### Agent lifecycle events

Routed on the agent's wallet address.

| Event | Fires when |
|-------|-----------|
| `agent.created` | A new agent finished provisioning and is ready to spend |
| `agent.suspended` | An agent was suspended by a spend-policy kill-switch — its requests return `403` until you reactivate it |
| `key.created` | A new API key was minted for an agent |
| `key.rotated` | An API key was rotated; the previous key no longer authenticates |
| `x402.first_settlement` | The agent's first x402 payment settled — the activation milestone for a new integration |
| `provider_key.created` | A bring-your-own provider key was stored |
| `provider_key.updated` | A stored provider key was enabled, disabled, or otherwise modified |
| `provider_key.deleted` | A stored provider key was removed |

#### Credit events

Threshold crossings on an agent's credit utilization, routed on the agent's wallet address.

| Event | Fires when |
|-------|-----------|
| `credit.warning` | Credit utilization crossed one of your subscribed thresholds from below |
| `credit.at_limit` | Utilization crossed a threshold at or above 95% — the agent is effectively out of credit |
| `credit.recovered` | Utilization dropped back below a previously crossed threshold |

#### Call events

Voice call lifecycle, routed on the agent's wallet address. Delivery rows carry the provider call ID (or Twilio CallSid) as the correlation ID.

| Event | Fires when |
|-------|-----------|
| `call.started` | A Floe Phone call began (Floe-provisioned numbers only) |
| `call.ended` | A voice call finished — includes duration and settled cost legs where available |
| `call.report.ready` | The post-call report is available — a sanitized summary and transcript extract from the voice provider |
| `call.recording.ready` | The voice provider published a recording URL for a finished call |
| `call.analyzed` | Post-call analysis arrived from the voice provider (success evaluation, structured data, sentiment) |
| `call.rejected` | An incoming call was denied before it started (spend policy, budget, or a fail-closed guard) |

#### Phone number events

Rented number lifecycle, routed on the agent's wallet address.

| Event | Fires when |
|-------|-----------|
| `phone.number.grace` | A rented phone number entered its expiry grace period — renew it to keep the number |
| `phone.number.released` | A rented phone number was released and is no longer attached to your agent |

#### Marketplace events

Vendor spend events, routed on the agent's wallet address — except the two `marketplace.vendor.*` events, which are **platform-wide broadcasts** delivered to every subscribed webhook regardless of scope.

| Event | Fires when |
|-------|-----------|
| `marketplace.job.completed` | An asynchronous marketplace vendor job finished — carries the job ID as the correlation ID |
| `marketplace.payment.settled` | A marketplace request's payment settled — fired per call, on either the x402 or credit rail |
| `marketplace.spend_cap.hit` | An agent hit a marketplace spend cap and the request was blocked |
| `marketplace.tripwire.triggered` | A metering anomaly tripwire fired (for example an STT duration divergence) — informational only, nothing is auto-suspended |
| `marketplace.vendor.degraded` | A marketplace vendor's health probe flipped to down — platform-wide broadcast |
| `marketplace.vendor.recovered` | A previously degraded marketplace vendor is healthy again — platform-wide broadcast |

Payloads never contain plaintext key material — only a masked `keyPrefix`.

#### Billing & invoicing events

Account-level events — no agent attribution. They reach a `global` webhook, or a `wallet`/`agent` webhook whose `scopeValue` is set to your **account's own wallet address** (the `0x...` value the [Scopes](#scopes) table describes — for these events, your account wallet rather than an agent's). Payloads carry the public `acct_…` account ID, never a wallet address.

| Event | Fires when |
|-------|-----------|
| `billing.plan.changed` | Your account's effective plan changed — an upgrade, downgrade, cancellation, or an admin-assigned plan starting or expiring |
| `billing.payment_failed` | A payment for your Floe plan failed or needs action — update your payment method to keep the plan |
| `billing.invoice.paid` | A Floe plan invoice was paid — carries the amount and the hosted invoice link |
| `billing.renewal_upcoming` | Your plan renews soon — carries the amount due and the end of the current period |
| `billing.usage_threshold` | Month-to-date tracked spend crossed 80% or 100% of your plan's cap — informational, nothing is blocked |
| `client_invoice.sent` | A client invoice was sent through your connected Stripe account |
| `client_invoice.paid` | A client paid an invoice issued from your connected Stripe account |
| `client_invoice.voided` | A client invoice was voided in Stripe and will not be collected |
| `client_invoice.uncollectible` | A client invoice was marked uncollectible in Stripe |
| `vendor_actuals.connection.created` | A vendor billing connection was added |
| `vendor_actuals.connection.updated` | A vendor billing connection was enabled, disabled, or reconfigured |
| `vendor_actuals.connection.deleted` | A vendor billing connection was removed |
| `vendor_actuals.invoice.footed` | A vendor invoice was footed against your account |
| `vendor_actuals.close_gate_overridden` | An account owner closed a billing period while some vendor costs were still unconfirmed |
| `stripe.connected` | A Stripe account was connected for client invoicing |
| `stripe.disconnected` | The connected Stripe account was disconnected — client invoicing pauses until it is reconnected |

### Wildcard subscriptions

The `events` array accepts three forms:

- **Exact names** — `"call.ended"`, `"loan.liquidated"`
- **The global wildcard** — `"*"` subscribes to every event
- **Prefix wildcards** — `"<prefix>.*"`, matched at every dot level: `"call.*"` covers all six call events (including `call.report.ready`), and `"call.report.*"` is also valid

A prefix wildcard must cover at least one catalog event — a typo like `"lone.*"` is rejected at creation instead of silently never matching. Wildcard subscriptions automatically pick up new events added under the prefix later.

### Scopes

Each webhook is scoped to control which events reach it:

| Scope | Description | `scopeValue` |
|-------|-------------|--------------|
| `global` | Every event on your account | Not accepted |
| `wallet` | Only events for one agent | The agent's wallet address (`0x...`) |
| `agent` | Only events for one agent (synonym of `wallet`) | The agent's **wallet address** (`0x...`) — never the numeric agent ID |
| `loan` | Only events for one loan | The numeric loan ID |

`wallet` and `agent` behave identically — both filter on a `0x...` wallet address; `agent` is the value the dashboard's per-agent screen uses. For an agent-scoped event that address is the event's agent wallet. For an **account-scoped event** (the billing & invoicing category) it is your **account's own wallet** — the single wallet those events resolve to — so to receive billing events on a `wallet`/`agent` webhook, set its `scopeValue` to your account wallet. `loan` filters on the event's loan ID. A `global` webhook receives everything it subscribes to, account-scoped events included.

Two exceptions ignore scope entirely: `marketplace.vendor.degraded` and `marketplace.vendor.recovered` are platform-wide broadcasts sent to every webhook subscribed to them.

> **Scope is immutable.** `scope` and `scopeValue` cannot be changed after creation — to re-scope, delete the webhook and create a new one.

---

## Registering webhooks

### Via the dashboard

1. Go to [dev-dashboard.floelabs.xyz/controls?view=alerts](https://dev-dashboard.floelabs.xyz/controls?view=alerts) — **Budgets & alerts** → **Alerts** tab (the old `/webhooks` URL redirects here)
2. Click **Create Webhook**
3. Enter your endpoint URL (must be HTTPS)
4. Select the events you want to receive — per-category select-all covers a whole group
5. Choose scope: `global`, `wallet`, `agent`, or `loan`
6. Click **Create** — your webhook secret is displayed once

Copy the secret immediately. You need it to verify webhook signatures.

### Via the API

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhooks/floe",
    "events": ["agent.suspended", "call.*", "x402.first_settlement"],
    "scope": "global",
    "description": "Spend + call + activation alerts"
  }'
```

**Response:**

```json
{
  "webhook": {
    "id": 17,
    "url": "https://your-server.com/webhooks/floe",
    "secret": "whsec_a1b2c3d4e5f6...",
    "events": ["agent.suspended", "call.*", "x402.first_settlement"],
    "scope": "global",
    "scopeValue": null,
    "active": true,
    "description": "Spend + call + activation alerts",
    "createdAt": "2026-08-11T12:00:00.000Z"
  }
}
```

The `secret` is shown only at creation (and when you rotate it). Store it securely.

---

## API endpoints

All endpoints require a developer key (`floe_live_*`) in the `Authorization` header, or a dashboard session. Agent keys (`floe_*`) are rejected on every `/v1/developer` route.

### POST /v1/developer/webhooks

Register a new webhook endpoint. Maximum **10 webhooks** per account.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Endpoint to receive events — max 2048 chars; HTTPS required in production, and private/internal addresses are rejected |
| `events` | string[] | Yes | At least one event name, `*`, or `<prefix>.*` wildcard |
| `scope` | string | Yes | `global`, `wallet`, `agent`, or `loan` |
| `scopeValue` | string | Conditional | Required for non-global scopes: a `0x` wallet address for `wallet`/`agent`, a numeric loan ID for `loan`. Must be absent for `global` |
| `description` | string | No | Human-readable label, max 256 chars |

### GET /v1/developer/webhooks

List all registered webhooks. Secrets are never included.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhooks" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

### GET /v1/developer/webhooks/events

The live event catalog — every subscribable event with its name, title, description, category, and scope dimension. This is the source of truth for what you can subscribe to; the CLI equivalent is `floe webhooks events`.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhooks/events" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response (truncated):**

```json
{
  "events": [
    {
      "name": "call.ended",
      "title": "Call ended",
      "description": "A voice call finished. Includes duration and settled cost legs where available.",
      "category": "call",
      "scope": "agent"
    }
  ]
}
```

### GET /v1/developer/webhooks/:id

Fetch a single webhook, including a rollup of its delivery outcomes.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhooks/17" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{
  "webhook": {
    "id": 17,
    "url": "https://your-server.com/webhooks/floe",
    "events": ["agent.suspended", "call.*", "x402.first_settlement"],
    "scope": "global",
    "scopeValue": null,
    "active": true,
    "description": "Spend + call + activation alerts",
    "createdAt": "2026-08-11T12:00:00.000Z"
  },
  "deliveryStats": {
    "pending": 0,
    "success": 240,
    "failed": 2,
    "retrying": 1,
    "total": 243
  }
}
```

### PATCH /v1/developer/webhooks/:id

Update a webhook's `url`, `events`, `active` state, or `description`. `scope` and `scopeValue` are not updatable — recreate the webhook to change them. URL updates pass the same HTTPS and private-address checks as creation.

```bash
curl -X PATCH "https://credit-api.floelabs.xyz/v1/developer/webhooks/17" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["agent.created", "agent.suspended", "key.rotated"],
    "description": "Updated: also track provisioning + rotation"
  }'
```

### DELETE /v1/developer/webhooks/:id

Delete a webhook. No further events are sent after deletion.

```bash
curl -X DELETE "https://credit-api.floelabs.xyz/v1/developer/webhooks/17" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

### POST /v1/developer/webhooks/:id/test

Send a test delivery to your endpoint. The payload's `event` is `"test"` and uses realistic-looking placeholder data. Test deliveries are one-shot — a failed test is never retried (and cannot be retried manually).

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks/17/test" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

### POST /v1/developer/webhooks/:id/rotate-secret

Generate a new HMAC secret. The old secret stops working immediately, and the new one is returned only in this response. Update your server's verification logic before rotating in production.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks/17/rotate-secret" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{ "secret": "whsec_new_secret_value..." }
```

### GET /v1/developer/webhooks/:id/deliveries

Recent deliveries for one endpoint. Query params: `limit` (default 50, max 100) and `offset`.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhooks/17/deliveries?limit=20" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{
  "deliveries": [
    {
      "id": 88,
      "deliveryId": "del_xyz789",
      "event": "agent.suspended",
      "statusCode": 200,
      "status": "success",
      "attempt": 1,
      "error": null,
      "createdAt": "2026-08-11T14:30:00.000Z"
    }
  ]
}
```

### POST /v1/developer/webhooks/:id/deliveries/:deliveryId/retry

Manually re-send a past delivery. The retry is signed with a fresh timestamp so your replay-protection window accepts it, and it keeps the original delivery's `agentWallet` and correlation ID so it stays findable under the same log filters. Test deliveries cannot be retried.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks/17/deliveries/del_xyz789/retry" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

---

## Delivery logs

Beyond the per-endpoint list, Floe keeps an **account-wide delivery log** across all your webhooks — the same data behind the dashboard's Logs tab. Use it to answer "did my server get the `call.ended` for this call?" without knowing which endpoint it went to. The CLI equivalent is `floe webhooks logs`, which takes the same filters.

Delivery logs are retained for **30 days**.

### GET /v1/developer/webhook-deliveries

Filterable, cursor-paginated log of every delivery on your account, newest first.

| Query param | Description |
|-------------|-------------|
| `endpoint` | Numeric webhook ID — only deliveries to that endpoint |
| `event` | Exact event name (e.g. `call.ended` — wildcards apply to subscriptions, not this filter) |
| `agent` | A `0x` agent wallet address |
| `status` | `pending`, `success`, `failed`, or `retrying` |
| `from` / `to` | ISO 8601 timestamp bounds on the delivery time |
| `id` | Searches both delivery IDs **and** correlation IDs — pass a call session ID, Twilio CallSid, job ID, or loan ID to find every delivery for that call, job, or loan |
| `cursor` | Opaque pagination cursor — pass a previous page's `nextCursor` verbatim |
| `limit` | Page size, default 50, max 100 |

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhook-deliveries?limit=20" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

A filtered query — failed `call.ended` deliveries for one agent:

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhook-deliveries?status=failed&event=call.ended&agent=0xYourAgentWallet" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{
  "deliveries": [
    {
      "id": 412,
      "deliveryId": "a1b2c3d4e5f6...",
      "webhookId": 17,
      "webhookUrl": "https://your-server.com/webhooks/floe",
      "event": "call.ended",
      "status": "failed",
      "statusCode": 500,
      "attempt": 3,
      "error": "HTTP 500",
      "agentWallet": "0xyouragentwallet...",
      "correlationId": "CA9d3f...",
      "createdAt": "2026-08-11T14:30:00.000Z"
    }
  ],
  "nextCursor": "eyJ0cyI6Ii4uLiIsImlkIjo0MTJ9",
  "hasMore": true
}
```

List rows are deliberately lightweight — they carry no payloads or response bodies. When `hasMore` is `true`, pass `nextCursor` back as `cursor` for the next page.

### GET /v1/developer/webhook-deliveries/:deliveryId

Full detail for one delivery. The path parameter is the hex `deliveryId` (the value in `X-Floe-Delivery-Id` and in list rows) — **not** the numeric row `id`.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhook-deliveries/a1b2c3d4e5f6..." \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

The response includes everything from the list row plus:

| Field | Description |
|-------|-------------|
| `payload` | Exactly what was POSTed to your endpoint |
| `responseBody` | Your server's response body, sanitized and capped at 1 KB |
| `nextRetryAt` | When the next automatic retry is scheduled, if the delivery is `retrying` |

---

## Payload format

Every delivery is a JSON POST to your endpoint. Fields are spread at the top level alongside `event` and `firedAt`:

```json
{
  "event": "agent.suspended",
  "agentId": "0xAgentWalletAddress...",
  "policyId": 12,
  "reason": "policy:12",
  "firedAt": "2026-08-11T14:30:00.000Z"
}
```

Alongside each delivery, the log records the agent wallet and a correlation ID (a call session ID, Twilio CallSid, job ID, or loan ID) so you can trace a delivery back to the thing that fired it.

---

## Signature verification

Every delivery includes three headers:

| Header | Description |
|--------|-------------|
| `X-Floe-Signature` | Hex HMAC-SHA256 of `{timestamp}.{raw_body}` using your webhook secret |
| `X-Floe-Timestamp` | Unix timestamp (seconds) when the event was sent |
| `X-Floe-Delivery-Id` | ID for this delivery, **stable across its retry attempts** — use it for idempotency |

The signature is computed as:

```
HMAC-SHA256(secret, "{X-Floe-Timestamp}.{raw_request_body}")
```

Always verify the signature against the **raw** request body before processing the event. This prevents forged requests from reaching your business logic.

{% tabs %}
{% tab title="TypeScript" %}
```typescript
import crypto from "crypto";

function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  // Reject timestamps older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```
{% endtab %}

{% tab title="Python" %}
```python
import hmac
import hashlib
import time

def verify_webhook_signature(
    payload: str,
    signature: str,
    timestamp: str,
    secret: str,
) -> bool:
    # Reject timestamps older than 5 minutes
    now = int(time.time())
    if abs(now - int(timestamp)) > 300:
        return False

    expected = hmac.new(
        secret.encode(),
        f"{timestamp}.{payload}".encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(signature, expected)
```
{% endtab %}
{% endtabs %}

See the full handler examples: [TypeScript](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/webhook-handler.ts) | [Python](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/webhook-handler.py)

---

## Delivery guarantees

- **At-least-once delivery.** Your endpoint may receive the same event more than once. Use `X-Floe-Delivery-Id` for idempotency.
- **10-second timeout.** Your endpoint must respond within 10 seconds or the attempt counts as failed. Return `2xx` immediately and process asynchronously.
- **3 attempts maximum.** If your endpoint does not respond with a `2xx` status code, Floe retries: attempt 2 fires 60 seconds after the first failure, attempt 3 fires 300 seconds after that.
- **Delivery statuses:** `pending` (queued) → `success` (2xx received), or `retrying` (a failed attempt with retries remaining) → `success` or `failed` (all 3 attempts exhausted).
- **Test deliveries are one-shot.** A failed test stays `failed` — it is never retried, automatically or manually.

After a delivery goes `failed`, re-drive it manually with [`POST /v1/developer/webhooks/:id/deliveries/:deliveryId/retry`](#post-v1developerwebhooksiddeliveriesdeliveryidretry). Inspect failures in the dashboard, the per-endpoint list, or the account-wide [delivery log](#delivery-logs) — logs are retained for 30 days.

---

## Connect your orchestrator (Reconcile Mode)

The webhooks above are events Floe sends **you**. Reconcile Mode is the other direction: it gets every call's cost onto one ledger. **How the cost reaches Floe depends on where the agent runs:**

- **Hosted (Vapi, Retell, Bland)** — Floe ingests the platform's own end-of-call cost webhook. You paste the `call-end` URL into the platform.
- **Self-hosted (Pipecat, LiveKit)** — there is no platform cost webhook. Your agent **self-reports** each call's cost to Floe's `call-end` URL, signed with `X-Floe-Signature`.
- **BYOK / off-path LLM & tool spend** — for priced calls Floe never routes (your own provider key, a self-hosted model), the [`floe-guard`](https://github.com/Floe-Labs/floe-guard) library can push its local spend ledger to Reconcile Mode via [`POST /v1/agents/ledger/sync`](ledger-sync-api.md). See the [ledger sync guide](../build/ledger-sync.md).

**Enforcement at the cap is also platform-specific** — Floe can only stop a call where it sits in the path:

- **Vapi & Retell** — a pre-call webhook can deny the next inbound call, but only for the configured number/assistant path and only when you've set the pre-call URL.
- **Pipecat & LiveKit** — the pre-call check is **cooperative**: your agent must call `preCallUrl` before dialing and honor the `{ "allowed": false }` response. Floe cannot enforce it for you, and any leg not on a Floe key can bypass it.
- **Bland** — **no pre-call hook.** A reconciled breach suspends the agent, which hard-blocks its subsequent Floe-keyed actions (LLM / STT / TTS / telephony on a Floe key) rather than rejecting the inbound call.

So a runaway campaign is stopped **before the next call** on Vapi/Retell, **at the next Floe-keyed action** on Bland, and on Pipecat/LiveKit **only if the agent honors the cooperative check**.

This works with **Vapi, Retell, Bland, Pipecat, and LiveKit**. The full per-platform setup — where to paste each URL, provider-specific fields, and the pre-call deny responses — lives in the guide:

→ **[Voice orchestrators — connect & reconcile](../build/voice-orchestrators.md)**

What follows is the reference.

### 1. Register a connection

Connecting an orchestrator is an **admin** action — do it from the dashboard, or via the API with an admin dashboard session:

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/orchestrators" \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin dashboard session>" \
  -d '{
    "agentId": 42,
    "provider": "vapi",
    "label": "support line"
  }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agentId` | number | Yes | The agent this connection meters against |
| `provider` | string | Yes | `vapi`, `retell`, `bland`, `pipecat`, or `livekit` |
| `secret` | string | Conditional | The platform's signing secret — **required for `retell` and `bland`**; for `vapi`, `pipecat`, and `livekit` Floe mints one and returns it once |
| `label` | string | No | Human-readable label |

**Response (201):**

```json
{
  "id": 7,
  "provider": "vapi",
  "agentWallet": "0xAgentWalletAddress...",
  "label": "support line",
  "active": true,
  "lastEventAt": null,
  "webhookUrl": "https://credit-api.floelabs.xyz/v1/webhooks/vapi/call-end/<token>",
  "preCallUrl": "https://credit-api.floelabs.xyz/v1/webhooks/vapi/pre-call/<token>",
  "secret": "<shown once, Floe-minted providers only>",
  "createdAt": "2026-08-07T12:00:00.000Z",
  "updatedAt": "2026-08-07T12:00:00.000Z"
}
```

Manage connections with `GET /v1/developer/orchestrators`, `POST /v1/developer/orchestrators/:id/rotate` (mints a fresh token + secret), `PATCH /v1/developer/orchestrators/:id` (`{ "active": false }`), and `DELETE /v1/developer/orchestrators/:id`. Rotating invalidates the old URL token **and** secret immediately, so update the URLs everywhere you pasted them — and for `retell`/`bland`, update the signing credential in the provider's dashboard — before the next call, or deliveries fail `401`.

### 2. Paste the URLs into your platform

The token in each URL identifies the connection — **treat the URLs as secrets** and rotate if leaked.

| Endpoint | Shape | Purpose |
|----------|-------|---------|
| **Call-end** | `POST /v1/webhooks/{provider}/call-end/{token}` | Ingests the call's cost at end-of-call; meters it onto the ledger (counts against policies, does **not** debit balance) |
| **Pre-call** | `POST /v1/webhooks/{provider}/pre-call/{token}` | Admission gate before a call connects. Returns whether the agent may proceed. `null` for Bland (no pre-call hook) |

Ingest is idempotent per call ID — safe for provider retries.

### 3. Inbound signature verification

Authentication is **provider-specific**. The path token always identifies the connection; how the request is authenticated depends on the provider — Retell, Bland, Pipecat, and LiveKit sign the **raw** request body with HMAC, while Vapi compares a shared-secret header (`X-Vapi-Secret`) independent of the body. A bad or missing signature is rejected `401` with no ledger write; an unknown or disabled token is `404`.

| Provider | Header | Scheme |
|----------|--------|--------|
| `vapi` | `X-Vapi-Secret` | Equality against your stored secret |
| `retell` | `x-retell-signature` | `v={ts},d={hex}` — HMAC-SHA256 of `body + ts`, within a ±5-minute window |
| `bland` | `x-webhook-signature` | Hex HMAC-SHA256 of the raw body with your stored secret |
| `pipecat` / `livekit` | `x-floe-signature` | Hex HMAC-SHA256 of the raw body with the Floe-minted secret |

### 4. Pre-call gate response

The pre-call endpoint decides admission from server-side state (agent status + budget). Deny reasons include `unknown_agent`, `agent_suspended`, and `budget_exceeded`; it **fails closed** if the check can't run. Responses are shaped to each platform's contract — e.g. Retell receives `{ "call_inbound": { "reject": true } }` on deny, and Pipecat/LiveKit receive `{ "allowed": false, "reason": "budget_exceeded" }`. On **Vapi**, admission applies to the configured assistant/number path (an admit returns `{ "assistantId": … }`). On **self-hosted stacks (Pipecat, LiveKit)** the gate only bites if your agent actually calls `preCallUrl` before dialing and honors the response — Floe cannot block the call for you. See the [guide](../build/voice-orchestrators.md) for the exact per-platform bodies.

---

## Testing

### Dashboard

Click **Send Test Event** on any webhook in the [dashboard](https://dev-dashboard.floelabs.xyz/controls?view=alerts) (**Budgets & alerts** → **Alerts**). The test payload looks like a real event but does not correspond to an actual one.

### webhook.site

For quick testing without deploying a server:

1. Go to [webhook.site](https://webhook.site) and copy your unique URL
2. Register that URL as a webhook endpoint
3. Send a test event from the dashboard
4. Inspect the payload and headers on webhook.site

---

## Best practices

- **Always verify signatures.** Never process a payload without checking `X-Floe-Signature` against the raw body. This prevents spoofed requests.
- **Respond with `2xx` quickly.** Return a `200` as soon as you receive the payload — the delivery times out after 10 seconds. Process the event asynchronously in a background job or queue.
- **Implement idempotency.** Store `X-Floe-Delivery-Id` and skip duplicates. Retries can send the same event more than once.
- **Use HTTPS endpoints.** Floe only delivers to HTTPS URLs in production.
- **Monitor delivery logs.** Check the dashboard, `GET /v1/developer/webhooks/:id/deliveries`, or the account-wide `GET /v1/developer/webhook-deliveries` log (`floe webhooks logs`) periodically for failed deliveries.
- **Prefer wildcards over long event lists.** Subscribing to `call.*` keeps you current as new call events ship; enumerate exact names only when you need to exclude some.
- **Rotate secrets with a short window.** `rotate-secret` returns the new secret and invalidates the old one immediately — there is no overlap period. Install the returned secret in your verifier right away; any deliveries signed with the old secret during the swap fail signature and retry (3 attempts over ~6 minutes), so keep the window short.

## Next steps

- **[Voice orchestrators](../build/voice-orchestrators.md)** — the full connect-and-reconcile walkthrough for Vapi / Retell / Bland / Pipecat / LiveKit.
- **[Webhook Handler (TypeScript)](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/webhook-handler.ts)** — Express.js example with signature verification.
- **[Webhook Handler (Python)](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/webhook-handler.py)** — Flask example with HMAC verification.
- **[Floe CLI](cli.md)** — `floe webhooks` manages endpoints, tests deliveries, and tails logs from the terminal.
- **[API Keys](api-keys.md)** — create your developer key to register webhooks.
- **[Developer Dashboard](developer-dashboard.md)** — manage webhooks through the web UI.
