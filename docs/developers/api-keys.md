---
icon: key
---

# API Keys

Floe uses API keys to authenticate requests to the developer platform. There are two key types, each scoped to a different set of endpoints.

## Key Types

| Prefix | Name | Created Via | Used For |
|--------|------|-------------|----------|
| `floe_live_*` | Developer key | Dashboard `/keys` page or `POST /v1/developer/keys` | Credit API developer endpoints, webhook management |
| `floe_*` | Agent key | Agent setup wizard (Step 3) | x402 proxy, agent balance, agent transactions |

**Developer keys** are for your backend services — monitoring loan health, managing webhooks, and calling developer-scoped endpoints on the [Credit API](credit-api.md).

**Agent keys** are for x402 agents that need to make paid API calls through the facilitator proxy. You create these during the agent registration flow. See [x402 Credit Facilitator](x402-facilitator.md) for details.

## Authentication

Include your key in the `Authorization` header as a Bearer token:

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/keys" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

```typescript
const response = await fetch("https://credit-api.floelabs.xyz/v1/developer/keys", {
  headers: {
    Authorization: "Bearer floe_live_YOUR_KEY",
  },
});
```

```python
import requests

response = requests.get(
    "https://credit-api.floelabs.xyz/v1/developer/keys",
    headers={"Authorization": "Bearer floe_live_YOUR_KEY"},
)
```

## Creating Keys

### Via the Dashboard

1. Go to [dev-dashboard.floelabs.xyz/keys](https://dev-dashboard.floelabs.xyz/keys)
2. Click **Create Key**
3. Enter a label (e.g., "production-backend" or "staging-monitor")
4. Select permissions: **Read** or **Read/Write**
5. Optionally set an expiry date
6. Click **Create** — your full key is displayed once

Copy the key immediately. It is shown only at creation and cannot be retrieved later.

### Via the API

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/keys" \
  -H "Authorization: Bearer floe_live_EXISTING_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "production-backend",
    "permissions": "read_write"
  }'
```

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | No | Human-readable name for this key |
| `permissions` | string | No | `read` (default) or `read_write` |
| `expiresAt` | string | No | ISO 8601 expiry date. Omit for no expiry. |

**Response:**

```json
{
  "keyId": "key_abc123",
  "key": "floe_live_sk_a1b2c3d4e5f6...",
  "label": "production-backend",
  "permissions": "read_write",
  "prefix": "floe_live_sk_a1b2",
  "createdAt": "2026-04-07T12:00:00.000Z",
  "expiresAt": null
}
```

The `key` field contains the full key. This is the only time you see it.

---

## API Endpoints

All endpoints require an existing developer key in the `Authorization` header.

### POST /v1/developer/keys

Create a new developer key.

```bash
curl -X POST "https://credit-api.floelabs.xyz/v1/developer/keys" \
  -H "Authorization: Bearer floe_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "label": "my-new-key", "permissions": "read" }'
```

Returns the full key in the response. Store it securely.

### GET /v1/developer/keys

List all keys for your account. Returns prefixes only — full keys are never returned after creation.

```bash
curl "https://credit-api.floelabs.xyz/v1/developer/keys" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{
  "keys": [
    {
      "keyId": "key_abc123",
      "label": "production-backend",
      "permissions": "read_write",
      "prefix": "floe_live_sk_a1b2",
      "createdAt": "2026-04-07T12:00:00.000Z",
      "expiresAt": null,
      "lastUsedAt": "2026-04-07T14:30:00.000Z"
    }
  ]
}
```

### DELETE /v1/developer/keys/:keyId

Revoke a key immediately. Any requests using this key will fail with `401` after revocation.

```bash
curl -X DELETE "https://credit-api.floelabs.xyz/v1/developer/keys/key_abc123" \
  -H "Authorization: Bearer floe_live_YOUR_KEY"
```

**Response:**

```json
{ "deleted": true, "keyId": "key_abc123" }
```

---

## Security

- Keys are hashed with **HMAC-SHA256** before storage. The full key is never stored on Floe's servers.
- The full key is displayed exactly once — at creation. If you lose it, revoke and create a new one.
- All key operations are scoped to the authenticated wallet. You cannot access another wallet's keys.

## Rate Limits

| Key Type | Limit |
|----------|-------|
| Developer key (`floe_live_*`) | 100 requests/minute |
| Agent key (`floe_*`) | 30 requests/minute (x402 proxy) |

Rate limit headers are included in every response:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

If you exceed the limit, you receive a `429 Too Many Requests` response. Wait until `X-RateLimit-Reset` before retrying.

## Best Practices

- **Label keys by environment.** Use names like `production`, `staging`, `local-dev` so you can identify and rotate them easily.
- **Never commit keys to git.** Use environment variables or a secrets manager. Add `.env` to your `.gitignore`.
- **Use read-only keys when possible.** If a service only needs to read loan status or list webhooks, give it a `read` key.
- **Rotate immediately if compromised.** Revoke the old key via `DELETE /v1/developer/keys/:keyId` and create a new one. There is no downtime — the new key works instantly.
- **Set expiry for temporary access.** If you're granting a key to a contractor or CI pipeline, use `expiresAt` so it auto-expires.

## Next Steps

- **[Developer Dashboard](developer-dashboard.md)** — Manage keys through the web UI.
- **[Webhooks](webhooks.md)** — Use your developer key to register webhook endpoints.
- **[Credit API](credit-api.md)** — Full API reference for lending and borrowing.
