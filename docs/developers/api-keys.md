---
icon: key
---

# API Keys

Floe uses API keys to authenticate requests to the developer platform. There are two key types, each scoped to a different set of endpoints.

## Key Types

| Prefix | Name | Scope | Created Via | Used For |
|--------|------|-------|-------------|----------|
| `floe_live_*` | Developer key | Whole developer account | Dashboard **API Keys** page or `POST /v1/developer/keys` | Credit API developer endpoints, agent management, webhook management |
| `floe_*` | Agent key | One specific agent | Agent setup wizard, `POST /v1/developer/agents/:id/keys`, or `floe-agent register --name <name>` | x402 proxy, agent balance, agent-awareness endpoints, MCP server |

**Developer keys** are for your backend services — monitoring loan health, managing webhooks, registering new agents, and calling developer-scoped endpoints on the [Credit API](credit-api.md). One key per environment is typical.

**Agent keys** identify one specific agent. Every agent registered under a developer gets its own `floe_*` key with a one-active-key cap (rotate to issue a new one). Agent keys are required for the agent-awareness endpoints (`credit-remaining`, `loan-state`, `spend-limit`, etc.) and for [MCP server](mcp-server.md) sessions scoped to a single agent.

### Agent Keys

One developer can own multiple agents (up to 5 per account today). Each agent has its own scoped key. There are four ways to mint one:

1. **Dashboard wizard** — visit [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz), create an agent, copy the `floe_*` key shown on the final step. It is revealed once.
2. **TypeScript CLI** — `npx floe-agent register --name my-agent --borrow-limit 10000`. The key is stored in your OS keychain and surfaced once in stdout.
3. **Python CLI** — `floe-agent register --name my-agent --borrow-limit 10000`. Same behavior as the TypeScript CLI.
4. **REST API** — `POST /v1/developer/agents` to create, then `POST /v1/developer/agents/:id/keys` to mint. See [Credit API → Developer Agents](credit-api.md#developer-agents).

> The CLI's `--borrow-limit` flag is in **USDC** (`10000` = $10K). The REST API's `borrowLimitRaw` field is in **raw 6-decimal units** (`10000` = $0.01, `10000000000` = $10K).
>
> Each agent has a **one active key** cap. Mint a second key with `POST /v1/developer/agents/:id/keys/:keyId/rotate` — the old key is revoked atomically in the same transaction.

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

## Which Credential Goes Where

Floe has two authentication systems. Sending the wrong one is the most common onboarding snag — a credential can be perfectly valid yet rejected because it's the wrong *type* for that endpoint.

| Credential | How you send it | Works on |
|---|---|---|
| **Agent key** `floe_*` | `Authorization: Bearer floe_...` | x402 proxy (`/v1/proxy/*`), agent balance, agent-awareness endpoints, [MCP server](mcp-server.md) |
| **Developer key** `floe_live_*` | `Authorization: Bearer floe_live_...` | [Credit API](credit-api.md) developer endpoints, agent management, webhooks |
| **Wallet signature** | `X-Wallet-Address` + `X-Signature` + `X-Timestamp` headers (EIP-191 `personal_sign` over `Floe Credit API\nTimestamp: <unix>`) | Credit API endpoints that act on your own wallet |

The **x402 proxy accepts only an agent key.** A developer key, dashboard session, or wallet signature is accepted by the `/v1/*` auth layer but rejected by the proxy itself with:

```json
{
  "error": "wrong_credential_type",
  "message": "The x402 proxy requires an agent API key (prefix floe_..., not floe_live_...). ..."
}
```

See the [Agent Runtime Contract → Error Handling Matrix](agent-runtime-contract.md#error-handling-matrix) for the canonical `/v1/proxy/*` error bodies. If you see `wrong_credential_type`, mint an agent key (dashboard agent wizard, or `POST /v1/developer/agents/:agentId/keys`) and use it as the Bearer token for `/v1/proxy/*`.

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
