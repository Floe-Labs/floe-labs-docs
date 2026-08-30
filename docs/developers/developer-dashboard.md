---
icon: layout-dashboard
---

# Developer Dashboard

The Developer Dashboard is your home base for managing agents, API keys, webhooks, funding, and credit monitoring. Everything you need to integrate with Floe lives here.

**URL:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz)

## Authentication

The dashboard authenticates developers by having you sign a timestamped message with your wallet via RainbowKit. No usernames, passwords, or email signups — your wallet is your identity.

1. Connect a wallet (MetaMask, Coinbase Wallet, Rainbow, or WalletConnect)
2. Sign a timestamped message
3. Receive a 7-day JWT — attached automatically to every dashboard API call

> Email and Google login also work — Privy auto-creates an embedded wallet for users without an external wallet.

This is **only** for developers using the dashboard. Agents authenticate with their `floe_*` API key at runtime — see [Agent Runtime Contract](agent-runtime-contract.md).

## What You Can Do

### Agents (Multi-Agent)

Create and manage up to **5 agents per developer**. Each agent has its own credit line, delegation, and API key.

1. **Create Agent** — Name it, set a borrow limit, rate cap, and delegation expiry. The dashboard provisions a managed Privy wallet for the agent and submits the on-chain `setOperator` delegation **from that Privy wallet** server-side — you sign nothing on-chain from your own wallet.
2. **Fund Agent** — Send USDC to the agent's wallet, or **buy USDC directly via Coinbase** (credit card or bank transfer) using the "Fund Wallet" button. No crypto bridges needed.
3. **Mint API Key** — Once the agent shows `active`, click **Reveal API Key** to mint the agent's `floe_*` runtime key. It is shown once — copy it immediately. To rotate, click **Rotate** (revokes the old key and mints a new one atomically).

The same flow is available programmatically via `POST /v1/developer/agents` + `POST /v1/developer/agents/:id/keys`, or from the CLI: `npx @floelabs/cli init` (platform CLI — creates the agent and mints its key into your OS keychain, see [Floe CLI](cli.md)), with the full fleet surface on the same bin — `floe agents list|get|create|pause|resume|close|lock` — or `npx floe-agent register --name <name>` (TypeScript SDK) / `floe-agent register --name <name>` (Python SDK). See [agentkit-typescript](agentkit-typescript.md#cli-floe-agent) / [agentkit-python](agentkit-python.md#cli-floe-agent).

Each agent shows: status (`active` / `credit_frozen` / `pending_delegation` / `closed`), USDC balance (live), credit limit, delegation expiry, and active loans.

**Agent limits:**
- Max 5 agents per developer
- Max 5 active API keys per agent (`floe keys create` mints extras; `floe keys rotate` replaces one atomically)
- Borrow limit: 1–10B USDC (raw, 6 decimals)
- Rate cap: 1–10,000 bps (0.01%–100%)
- Delegation expiry: 1 minute–1 year

### Fund Wallet (Fiat On-Ramp)

Buy USDC directly from the dashboard using a credit card, debit card, or bank transfer — powered by Coinbase CDP. Funds land as USDC on Base directly in your agent's wallet.

1. Click **Fund Wallet** on any agent card
2. Enter an amount ($1–$100,000 USD) or use a preset ($50, $100, $500)
3. Complete the Coinbase checkout in the popup
4. Dashboard polls your agent's balance — shows success when USDC arrives (~30s–2min)

No crypto bridges, no token swaps, no gas tokens needed.

CLI equivalents: `floe funds topup [--amount <usd>] [--open]` prints the same Coinbase checkout link and watches for the funds; `floe funds address` prints the agent's raw USDC deposit address for wallet/exchange transfers.

### API Keys

Create and manage developer API keys (`floe_live_*`) for authenticating with the [Credit API](credit-api.md) developer endpoints and webhook management. Label keys by environment and revoke compromised keys instantly.

Go to **Gateway & keys** (under *Build* in the sidebar), or see [API Keys](api-keys.md). CLI equivalent: `floe devkeys list|create|revoke|rotate` (agent runtime keys: `floe keys …`).

### Webhooks

Register webhook endpoints to receive push notifications for loan events — health warnings, expiry alerts, liquidations, repayments, **credit utilization warnings**, and **delegation expiry alerts**.

Go to **Budgets & alerts** (under *Attribution* in the sidebar) → **Alerts** tab, or see [Webhooks](webhooks.md). The old `/webhooks` link redirects there and keeps your `?tab=logs` / `?endpoint=<id>` deep links. CLI equivalent: `floe webhooks list|create|get|pause|enable|delete|test|rotate-secret|deliveries`.

### Alerts

The dashboard monitors your agents and fires alerts when:

| Alert | Trigger | What to do |
|---|---|---|
| **Credit utilization warning** | Borrowed principal exceeds 80% of credit limit | Top up collateral or repay before API calls fail with `insufficient_balance` |
| **Delegation expiry** | Operator delegation expires within 7 days (warning) or 24 hours (urgent) | Close the agent via `POST /v1/developer/agents/:agentId/close` (or the dashboard's **Close** button) and register a fresh one — re-running `floe-agent register` with the same name returns `409 name_conflict` since the original agent still exists. |

Alerts are delivered via webhooks and shown in the dashboard.

## Quick Navigation

| Section | Path | What It Does | CLI equivalent |
|---------|------|--------------|----------------|
| Home | `/` | Dashboard home with usage summary | `floe usage summary` · `floe billing mtd` |
| Calls | `/usage` | Spend series and per-vendor rollup | `floe usage` |
| Coverage | `/coverage` | Fleet-wide coverage split — enforced pre-call vs reconciled after the fact | `floe usage coverage --agent <ref>` |
| Agents | `/agents` | Create, fund, and manage agents (up to 5) | `floe agents` · `floe funds` |
| Agent Detail | `/agents/:id` | Status, balance, delegation, keys | `floe agents get <agent> [--usage]` · `floe keys list --agent <agent>` |
| Gateway & keys | `/keys` | Create, list, and revoke developer keys | `floe devkeys` |
| Budgets & alerts | `/controls` | Spend policies (**Budgets** tab) and webhook endpoints + delivery logs (**Alerts** tab) | `floe budget` · `floe webhooks` |
| Docs | `/docs` | Interactive API reference | `floe help <command>` |

## Next Steps

- **[API Keys](api-keys.md)** — Create your first developer key.
- **[Webhooks](webhooks.md)** — Set up push notifications for loan events and alerts.
- **[Quickstart](../getting-started/quickstart.md)** — Full happy-path walkthrough from zero to first paid API call.
- **[x402 Credit Facilitator](x402-facilitator.md)** — Delegate collateral and let your agent pay for APIs automatically.
