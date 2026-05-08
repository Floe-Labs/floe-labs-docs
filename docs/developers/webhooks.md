---
icon: webhook
---

# Webhooks

Webhooks push loan events to your server in real time. Instead of polling the [Credit API](credit-api.md) for status changes, register a URL and Floe sends you an HTTP POST when something happens.

**Base URL:** `https://credit-api.floelabs.xyz`

## Events

| Event | Trigger | Key Data Fields |
|-------|---------|-----------------|
| `loan.health_warning` | LTV approaches liquidation threshold (at-risk or unhealthy) | `currentLtvBps`, `liquidationLtvBps`, `healthState`, `borrower`, `lender` |
| `loan.expiry_warning` | 24 hours before loan maturity | `maturityTime`, `hoursRemaining` |
| `loan.liquidated` | Loan was liquidated on-chain | `principal`, `collateralAmount`, `liquidationLtvBps` |
| `loan.repaid` | Loan was fully repaid | `principal`, `collateralAmount`, `interestRateBps` |
| `credit.utilization_warning` | Borrowed principal exceeds 80% of credit limit | `utilizationBps`, `creditLimitRaw`, `creditUsedRaw` |
| `delegation.expiry_warning` | Operator delegation expires within 7 days (or 24 hours for urgent) | `expiryTimestamp`, `hoursRemaining`, `agentId` |

## Scopes

Each webhook is scoped to control which loans trigger it:

| Scope | Description | `scopeValue` |
|-------|-------------|--------------|
| `global` | All loans on the protocol | Not required |
| `wallet` | Loans where a specific address is borrower or lender | Wallet address (`0x...`) |
| `loan` | A specific loan by ID | Loan ID (e.g., `"42"`) |

---

## Registering Webhooks

### Via the Dashboard

1. Go to [dev-dashboard.floelabs.xyz/webhooks](https://dev-dashboard.floelabs.xyz/webhooks)
2. Click **Create Webhook**
3. Enter your endpoint URL (must be HTTPS)
4. Select the events you want to receive
5. Choose scope: global, wallet, or loan
6. Click **Create** — your webhook secret is displayed once

Copy the secret immediately. You need it to verify webhook signatures.

### Via the API

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhooks/floe",
    "events": ["loan.health_warning", "loan.liquidated"],
    "scope": "wallet",
    "scopeValue": "0xYourWalletAddress",
    "description": "Monitor my loans"
  }'
```

**Response:**

```json
{
  "id": "wh_abc123",
  "url": "https://your-server.com/webhooks/floe",
  "events": ["loan.health_warning", "loan.liquidated"],
  "scope": "wallet",
  "scopeValue": "0xYourWalletAddress",
  "description": "Monitor my loans",
  "secret": "whsec_a1b2c3d4e5f6...",
  "active": true,
  "createdAt": "2026-04-07T12:00:00.000Z"
}
```

The `secret` field is shown only at creation (and when you rotate it). Store it securely.

---

## API Endpoints

All endpoints require a developer key (`floe_live_*`) in the `Authorization` header.

### POST /v1/developer/webhooks

Register a new webhook endpoint.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | HTTPS endpoint to receive events |
| `events` | string[] | Yes | Array of event types to subscribe to |
| `scope` | string | Yes | `global`, `wallet`, or `loan` |
| `scopeValue` | string | Conditional | Required for `wallet` and `loan` scopes |
| `description` | string | No | Human-readable label |

### GET /v1/developer/webhooks

List all registered webhooks.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhooks" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

### PATCH /v1/developer/webhooks/:id

Update a webhook's URL, events, scope, or description.

```bash
curl -X PATCH "https://credit-api.floelabs.xyz/v1/developer/webhooks/wh_abc123" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["loan.health_warning", "loan.liquidated", "loan.repaid"],
    "description": "Updated: also track repayments"
  }'
```

### DELETE /v1/developer/webhooks/:id

Delete a webhook. No further events are sent after deletion.

```bash
curl -X DELETE "https://credit-api.floelabs.xyz/v1/developer/webhooks/wh_abc123" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

### POST /v1/developer/webhooks/:id/test

Send a test event to your endpoint. The test payload uses realistic data but does not correspond to a real loan.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks/wh_abc123/test" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

### POST /v1/developer/webhooks/:id/rotate-secret

Generate a new HMAC secret. The old secret stops working immediately. Update your server's verification logic before rotating in production.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks/wh_abc123/rotate-secret" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{
  "id": "wh_abc123",
  "secret": "whsec_new_secret_value..."
}
```

### GET /v1/developer/webhooks/:id/deliveries

View the delivery log for a webhook. Shows recent delivery attempts, status codes, and timestamps.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/webhooks/wh_abc123/deliveries" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{
  "deliveries": [
    {
      "deliveryId": "del_xyz789",
      "event": "loan.health_warning",
      "status": "delivered",
      "statusCode": 200,
      "attemptNumber": 1,
      "createdAt": "2026-04-07T14:30:00.000Z",
      "respondedAt": "2026-04-07T14:30:00.150Z"
    }
  ]
}
```

---

## Payload Format

Every webhook delivery sends a JSON POST request to your endpoint:

```json
{
  "id": "evt_abc123",
  "event": "loan.health_warning",
  "timestamp": "2026-04-07T14:30:00.000Z",
  "data": {
    "loanId": "42",
    "currentLtvBps": 8200,
    "liquidationLtvBps": 8500,
    "healthState": "at_risk",
    "borrower": "0xBorrowerAddress...",
    "lender": "0xLenderAddress...",
    "collateralToken": "0x4200000000000000000000000000000000000006",
    "loanToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  }
}
```

---

## Signature Verification

Every delivery includes three headers for verification:

| Header | Description |
|--------|-------------|
| `X-Floe-Signature` | HMAC-SHA256 signature of `{timestamp}.{payload}` using your webhook secret |
| `X-Floe-Timestamp` | Unix timestamp (seconds) when the event was sent |
| `X-Floe-Delivery-Id` | Unique ID for this delivery attempt (use for idempotency) |

The signature is computed as:

```
HMAC-SHA256(secret, "{X-Floe-Timestamp}.{raw_request_body}")
```

Always verify the signature before processing the event. This prevents forged requests from reaching your business logic.

### Node.js Verification

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

### Python Verification

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

## Delivery Guarantees

- **At-least-once delivery.** Your endpoint may receive the same event more than once. Use `X-Floe-Delivery-Id` for idempotency.
- **3 attempts maximum.** If your endpoint does not respond with a `2xx` status code, Floe retries with exponential backoff.
- **Retry schedule:** Attempt 1 immediately, Attempt 2 after 1 minute, Attempt 3 after 5 minutes.
- **Delivery states:** `pending` (first attempt) -> `retrying` (attempts 2-3) -> `delivered` (success) or `failed` (all attempts exhausted).

After 3 failed attempts, the delivery is marked as `failed`. You can see failed deliveries in the dashboard or via `GET /v1/developer/webhooks/:id/deliveries`.

---

## Testing

### Dashboard

Click **Send Test Event** on any webhook in the [dashboard](https://dev-dashboard.floelabs.xyz/webhooks). The test payload looks like a real event but does not correspond to an actual loan.

### webhook.site

For quick testing without deploying a server:

1. Go to [webhook.site](https://webhook.site) and copy your unique URL
2. Register that URL as a webhook endpoint
3. Send a test event from the dashboard
4. Inspect the payload and headers on webhook.site

### API

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/webhooks/wh_abc123/test" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

---

## Best Practices

- **Always verify signatures.** Never process a webhook payload without checking `X-Floe-Signature`. This prevents spoofed requests.
- **Respond with `2xx` quickly.** Return a `200` as soon as you receive the payload. Process the event asynchronously in a background job or queue.
- **Implement idempotency.** Store `X-Floe-Delivery-Id` and skip duplicates. Retries can send the same event more than once.
- **Use HTTPS endpoints.** Floe only delivers to HTTPS URLs in production.
- **Monitor delivery logs.** Check the dashboard or `GET /v1/developer/webhooks/:id/deliveries` periodically for failed deliveries.
- **Rotate secrets safely.** Update your server's verification logic to accept both old and new secrets during rotation, then remove the old one.

## Next Steps

- **[Webhook Handler (TypeScript)](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/webhook-handler.ts)** — Complete Express.js example with signature verification.
- **[Webhook Handler (Python)](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/webhook-handler.py)** — Complete Flask example with HMAC verification.
- **[API Keys](api-keys.md)** — Create your developer key to register webhooks.
- **[Developer Dashboard](developer-dashboard.md)** — Manage webhooks through the web UI.
- **[Credit API](credit-api.md)** — Full HTTP API reference.
