---
icon: layout-dashboard
---

# Developer Dashboard

The Developer Dashboard is your home base for managing API keys, webhooks, and x402 agent configurations. Everything you need to integrate with Floe lives here.

**URL:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz)

## Authentication

The dashboard uses wallet-based authentication via RainbowKit. There are no usernames, passwords, or email signups.

1. Visit [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz)
2. Click **Connect Wallet**
3. Select your wallet (MetaMask, Coinbase Wallet, WalletConnect, etc.)
4. Approve the signature request — this authenticates you automatically

That's it. One click, one signature, you're in. The signature proves wallet ownership without any on-chain transaction or gas cost.

## What You Can Do

### API Keys

Create and manage developer API keys (`floe_live_*`) for authenticating with the [Credit API](credit-api.md) developer endpoints and webhook management. Label keys by environment, set permissions (read-only or read/write), and revoke compromised keys instantly.

Go to **Keys** in the sidebar, or see the [API Keys documentation](api-keys.md).

### Webhooks

Register webhook endpoints to receive push notifications for loan events — health warnings, expiry alerts, liquidations, and repayments. Configure event filters, test deliveries, and monitor delivery logs.

Go to **Webhooks** in the sidebar, or see the [Webhooks documentation](webhooks.md).

### Agent Setup

Register x402 agents through a guided wizard. The setup flow walks you through:

1. **Create agent profile** — name and description
2. **Configure delegation** — collateral token, borrow limit, rate cap, expiry
3. **Generate agent key** — your `floe_*` key for the x402 proxy

See [x402 Credit Facilitator](x402-facilitator.md) for the full agent lifecycle.

### API Documentation

Browse interactive API documentation directly from the dashboard under the **Docs** section. Endpoint schemas, request/response examples, and error codes are all available inline.

## Quick Navigation

| Section | Path | What It Does |
|---------|------|--------------|
| Overview | `/` | Dashboard home with usage summary |
| API Keys | `/keys` | Create, list, and revoke developer keys |
| Webhooks | `/webhooks` | Register endpoints, test deliveries, view logs |
| Webhook Detail | `/webhooks/:id` | Edit a webhook, rotate secret, view delivery history |
| Agents | `/agents` | Register and manage x402 agents |
| Docs | `/docs` | Interactive API reference |

## Next Steps

- **[API Keys](api-keys.md)** — Create your first developer key and start calling authenticated endpoints.
- **[Webhooks](webhooks.md)** — Set up push notifications for loan events.
- **[Credit API](credit-api.md)** — Full HTTP API reference for lending, borrowing, and loan management.
- **[x402 Credit Facilitator](x402-facilitator.md)** — Delegate collateral and let your agent pay for APIs automatically.
