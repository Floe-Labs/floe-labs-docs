---
icon: webhook
---

# Webhooks

Floe uses webhooks in **two directions**:

1. **Events Floe sends you** — register a URL and Floe POSTs it when something happens on your account (an agent is provisioned, a key is rotated, an agent is suspended by a spend policy). Use these to drive activation checklists, audit logs, and spend alerts instead of polling.
2. **Webhooks you connect to Floe (Reconcile Mode)** — point your voice platform's end-of-call webhook at Floe so it meters every call onto one ledger and stops it at the cap. How the stop happens depends on the platform — a denied *next call* where a pre-call hook exists, or a blocked next Floe-keyed action otherwise (see [Connect your orchestrator](#connect-your-orchestrator-reconcile-mode)). This is how Vapi / Retell / Bland / Pipecat / LiveKit agents get spend enforcement.

**Base URL:** `https://credit-api.floelabs.xyz`

---

## Events Floe sends you

### Event catalog

Every delivery is a JSON POST with the shape `{ "event": "<name>", ...fields, "firedAt": "<ISO 8601>" }`.

| Event | Trigger | Key data fields |
|-------|---------|-----------------|
| `agent.created` | An agent finished provisioning and is active | `agentId`, `name`, `agentWalletAddress`, `privyWalletAddress`, `fundingMode`, `delegationTxHash`, `actorWallet` |
| `agent.suspended` | A `suspend_agent` spend policy tripped — a pre-call breach or a reconciled orchestrator cost pushed the agent over its cap | `agentId`, `policyId`, `reason` |
| `key.created` | A developer or agent API key was minted | `keyId`, `keyType`, `keyPrefix`, `label`, `actorWallet` |
| `key.rotated` | An API key was rotated | `keyId`, `rotatedFromKeyId`, `keyType`, `keyPrefix`, `label`, `actorWallet` |
| `provider_key.created` | A stored BYOK provider key was added | `provider`, `keyPrefix`, `label`, `enabled`, `actorWallet` |
| `provider_key.updated` | A stored BYOK key was enabled or disabled | `provider`, `enabled`, `actorWallet` |
| `provider_key.deleted` | A stored BYOK key was deleted | `provider`, `actorWallet` |
| `x402.first_settlement` | An agent's first metered vendor payment settled — an onboarding milestone | `agentId`, `agentWalletAddress`, `url`, `amountRaw`, `txHash` |

Payloads never contain plaintext key material — only a masked `keyPrefix`.

### Scopes

Each webhook is scoped to control which events reach it:

| Scope | Description | `scopeValue` |
|-------|-------------|--------------|
| `global` | Every event on your account | Not required |
| `wallet` | Only events for one agent | The agent's wallet address (`0x...`) |

`wallet` scope filters on the event's agent wallet, so it only narrows the **agent-level** events (`agent.created`, `agent.suspended`, `x402.first_settlement`). Account-level events (`key.*`, `provider_key.*`) carry no agent wallet and are delivered only to `global` webhooks.

---

## Registering webhooks

### Via the dashboard

1. Go to [dev-dashboard.floelabs.xyz/webhooks](https://dev-dashboard.floelabs.xyz/webhooks)
2. Click **Create Webhook**
3. Enter your endpoint URL (must be HTTPS)
4. Select the events you want to receive
5. Choose scope: `global` or `wallet`
6. Click **Create** — your webhook secret is displayed once

Copy the secret immediately. You need it to verify webhook signatures.

### Via the API

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhooks/floe",
    "events": ["agent.suspended", "x402.first_settlement"],
    "scope": "global",
    "description": "Spend + activation alerts"
  }'
```

**Response:**

```json
{
  "webhook": {
    "id": 17,
    "url": "https://your-server.com/webhooks/floe",
    "events": ["agent.suspended", "x402.first_settlement"],
    "scope": "global",
    "scopeValue": null,
    "description": "Spend + activation alerts",
    "secret": "whsec_a1b2c3d4e5f6...",
    "active": true,
    "createdAt": "2026-08-07T12:00:00.000Z"
  }
}
```

The `secret` is shown only at creation (and when you rotate it). Store it securely.

---

## API endpoints

All endpoints require a developer key (`floe_live_*`) in the `Authorization` header, or a dashboard session.

### POST /v1/developer/webhooks

Register a new webhook endpoint.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | HTTPS endpoint to receive events |
| `events` | string[] | Yes | One or more event names from the catalog above |
| `scope` | string | Yes | `global` or `wallet` |
| `scopeValue` | string | Conditional | The agent wallet address — required for `wallet` scope |
| `description` | string | No | Human-readable label |

### GET /v1/developer/webhooks

List all registered webhooks.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhooks" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

### PATCH /v1/developer/webhooks/:id

Update a webhook's URL, events, active state, or description.

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

Send a test event to your endpoint. The test payload uses realistic data but does not correspond to a real event.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks/17/test" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

### POST /v1/developer/webhooks/:id/rotate-secret

Generate a new HMAC secret. The old secret stops working immediately. Update your server's verification logic before rotating in production.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks/17/rotate-secret" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{ "secret": "whsec_new_secret_value..." }
```

### GET /v1/developer/webhooks/:id/deliveries

View the delivery log for a webhook — recent attempts, status codes, and timestamps.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhooks/17/deliveries" \
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
      "createdAt": "2026-08-07T14:30:00.000Z"
    }
  ]
}
```

Re-drive a failed delivery with `POST /v1/developer/webhooks/:id/deliveries/:deliveryId/retry`.

---

## Payload format

Every delivery is a JSON POST to your endpoint. Fields are spread at the top level alongside `event` and `firedAt`:

```json
{
  "event": "agent.suspended",
  "agentId": "0xAgentWalletAddress...",
  "policyId": 12,
  "reason": "policy:12",
  "firedAt": "2026-08-07T14:30:00.000Z"
}
```

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

### Node.js verification

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

### Python verification

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

See the full handler examples: [TypeScript](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/webhook-handler.ts) | [Python](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/webhook-handler.py)

---

## Delivery guarantees

- **At-least-once delivery.** Your endpoint may receive the same event more than once. Use `X-Floe-Delivery-Id` for idempotency.
- **3 attempts maximum.** If your endpoint does not respond with a `2xx` status code, Floe retries with backoff.
- **Retry schedule:** attempt 1 immediately, attempt 2 after 1 minute, attempt 3 after 5 minutes.
- **Delivery states:** `retrying` (attempts in flight) → `success` (2xx received) or `failed` (all attempts exhausted).

After 3 failed attempts the delivery is marked `failed`. Inspect failures in the dashboard or via `GET /v1/developer/webhooks/:id/deliveries`.

---

## Connect your orchestrator (Reconcile Mode)

The webhooks above are events Floe sends **you**. Reconcile Mode is the other direction: you connect your **voice platform's** end-of-call webhook to Floe so every call is metered onto one ledger. Metering works for **all** providers. Enforcement at the cap is provider-specific:

- **Vapi & Retell** — a pre-call webhook can deny the next inbound call outright, but only when you've configured the pre-call URL.
- **Pipecat & LiveKit** — the pre-call check is **cooperative**: Floe returns `{ "allowed": false }` and your pipeline must honor it. Legs not on a Floe key can bypass it.
- **Bland** — **no pre-call hook.** A reconciled breach suspends the agent, which hard-blocks its subsequent Floe-keyed actions (LLM / STT / TTS / telephony on a Floe key) rather than rejecting the inbound call.

Either way a runaway campaign is stopped — the difference is whether it's blocked *before the next call connects* or *at the agent's next Floe-keyed action*.

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

The pre-call endpoint decides admission from server-side state (agent status + budget). Deny reasons include `unknown_agent`, `agent_suspended`, and `budget_exceeded`; it **fails closed** if the check can't run. Responses are shaped to each platform's contract — e.g. Retell receives `{ "call_inbound": { "reject": true } }` on deny, and Pipecat/LiveKit receive `{ "allowed": false, "reason": "budget_exceeded" }`. See the [guide](../build/voice-orchestrators.md) for the exact per-platform bodies.

---

## Testing

### Dashboard

Click **Send Test Event** on any webhook in the [dashboard](https://dev-dashboard.floelabs.xyz/webhooks). The test payload looks like a real event but does not correspond to an actual one.

### webhook.site

For quick testing without deploying a server:

1. Go to [webhook.site](https://webhook.site) and copy your unique URL
2. Register that URL as a webhook endpoint
3. Send a test event from the dashboard
4. Inspect the payload and headers on webhook.site

---

## Best practices

- **Always verify signatures.** Never process a payload without checking `X-Floe-Signature` against the raw body. This prevents spoofed requests.
- **Respond with `2xx` quickly.** Return a `200` as soon as you receive the payload. Process the event asynchronously in a background job or queue.
- **Implement idempotency.** Store `X-Floe-Delivery-Id` and skip duplicates. Retries can send the same event more than once.
- **Use HTTPS endpoints.** Floe only delivers to HTTPS URLs in production.
- **Monitor delivery logs.** Check the dashboard or `GET /v1/developer/webhooks/:id/deliveries` periodically for failed deliveries.
- **Rotate secrets with a short window.** `rotate-secret` returns the new secret and invalidates the old one immediately — there is no overlap period. Install the returned secret in your verifier right away; any deliveries signed with the old secret during the swap fail signature and retry (3 attempts over ~6 minutes), so keep the window short.

## Next steps

- **[Voice orchestrators](../build/voice-orchestrators.md)** — the full connect-and-reconcile walkthrough for Vapi / Retell / Bland / Pipecat / LiveKit.
- **[Webhook Handler (TypeScript)](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/webhook-handler.ts)** — Express.js example with signature verification.
- **[Webhook Handler (Python)](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/webhook-handler.py)** — Flask example with HMAC verification.
- **[API Keys](api-keys.md)** — create your developer key to register webhooks.
- **[Developer Dashboard](developer-dashboard.md)** — manage webhooks through the web UI.
