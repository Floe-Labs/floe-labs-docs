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

Register x402 agents through a three-step guided wizard at `/agents`. The shipped flow is:

1. **Create Wallet** — Click **Create Agent Wallet**. The dashboard asks your wallet to sign a plain "Register with Floe Facilitator" message, then calls `POST /v1/agents/pre-register`. The server provisions a Privy custodial wallet for the agent and returns its `privyWalletAddress`, which is displayed in a code block.
2. **Deposit & Delegate** — Send WETH collateral to the Privy wallet address from Step 1, then call `setOperator()` on `LendingIntentMatcher` from your own wallet to delegate borrow authority to the facilitator. **Known gap:** the wizard currently shows the address and a short instruction only — there is no one-click Authorize button yet, so you will need to call `setOperator` from your own wallet tooling (wagmi, cast, etc.). See the [Full Happy Path Example](agent-quickstart.md#full-happy-path-example) for a concrete wagmi snippet. A native Authorize button is on the roadmap.
3. **Activate Agent** — Click **Complete Registration**. The dashboard signs another wallet message and calls `POST /v1/agents/register`, which verifies the on-chain delegation and mints your `floe_*` agent API key. The key is revealed once via a secret-reveal modal — copy it immediately.

Once activated, the same `/agents` page becomes a status view showing the Privy wallet address, agent status (`active` / `credit_frozen` / `pending_delegation`), delegation badge, and credit limit.

See [x402 Credit Facilitator](x402-facilitator.md) for the full agent lifecycle and [Agent Runtime Contract](agent-runtime-contract.md) for what the agent itself does at runtime.

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
