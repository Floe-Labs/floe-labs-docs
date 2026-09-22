---
icon: layout-dashboard
---

# Developer Dashboard

The Developer Dashboard is your home base for managing agents, API keys, webhooks, funding, and credit monitoring. Everything you need to integrate with Floe lives here.

**URL:** [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz)

## Authentication

Sign in with your **email** (a one-time code) or your **Google** account. There is no wallet to connect, no message to sign, and no network to switch. Your first sign-in creates your account.

1. Open [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz). The sign-in window opens by itself; if you closed it, click **Sign up or sign in**.
2. Enter your email and the one-time code you receive, or continue with Google.
3. You land in the dashboard, signed in for 7 days. The session renews while you use the dashboard.

**Signed up with a wallet?** If you created your account with MetaMask, Coinbase Wallet, Rainbow, or WalletConnect, sign in with that wallet. In a browser where you've signed in with a wallet before, the sign-in window lists the wallet option next to email and Google, so pick it there. In a new browser the window shows only email and Google: close it, click **Use a wallet instead** (next to **Sign up or sign in**), and choose your wallet.

**Already have an account?** If this browser already has a Floe account and you sign in a different way (for example with Google, when your account was created with a wallet), the dashboard asks whether to **continue with your existing account** or **create a new one**. If you continue, the dashboard signs you out of the new sign-in and asks you to sign in the way you originally did: with your wallet, or with the email or Google account you used before. The two sign-ins stay separate, so keep using your original sign-in to reach that account.

You never need a wallet to use the dashboard. It only appears on the funding screens, and only after you turn funding on (see [Add funds](#add-funds)). Gateway, Marketplace, keys, usage, and every other screen work without it.

This is **only** for developers using the dashboard. Agents authenticate with their `floe_*` API key at runtime — see [Agent Runtime Contract](agent-runtime-contract.md). SDKs and scripts that sign each request with a wallet (`X-Wallet-Address` + `X-Signature` + `X-Timestamp`) keep working unchanged — see [Credit API → Wallet Signature Authentication](credit-api.md#wallet-signature-authentication-eip-191).

## What You Can Do

### Agents (Multi-Agent)

Create and manage agents — **how many depends on your plan** (see [plans](../reference/plans.md)). Each agent has its own credit line, delegation, and API key.

1. **Create Agent** — Name it, set a borrow limit, rate cap, and delegation expiry. The dashboard provisions a managed Privy wallet for the agent and submits the on-chain `setOperator` delegation **from that Privy wallet** server-side — you sign nothing on-chain from your own wallet.
2. **Fund Agent** — Add funds by card, Apple Pay, Google Pay, bank transfer, or a USDC deposit from the agent's **Balance & funding** tab or from **Plan & billing → Funding**. No crypto bridges needed. See [Add funds](#add-funds).
3. **Mint API Key** — Once the agent shows `active`, click **Reveal API Key** to mint the agent's `floe_*` runtime key. It is shown once — copy it immediately. To rotate, click **Rotate** (revokes the old key and mints a new one atomically).

The same flow is available programmatically via `POST /v1/developer/agents` + `POST /v1/developer/agents/:id/keys`, or from the CLI: `npx @floelabs/cli init` (platform CLI — creates the agent and mints its key into your OS keychain, see [Floe CLI](cli.md)), with the full fleet surface on the same bin — `floe agents list|get|create|pause|resume|close|lock` — or `npx floe-agent register --name <name>` (TypeScript SDK) / `floe-agent register --name <name>` (Python SDK). See [agentkit-typescript](agentkit-typescript.md#cli-floe-agent) / [agentkit-python](agentkit-python.md#cli-floe-agent).

Each agent shows: status (`active` / `credit_frozen` / `pending_delegation` / `closed`), USDC balance (live), credit limit, delegation expiry, and active loans.

**Agent limits:**
- Agents per account, and API keys per agent, are **per-plan** — Free allows 5 of each, and the ceiling rises with the plan. See [plans](../reference/plans.md) for the current numbers. (`floe keys create` mints extras; `floe keys rotate` replaces one atomically.)
- Borrow limit: 1–10B USDC (raw, 6 decimals)
- Rate cap: 1–10,000 bps (0.01%–100%)
- Delegation expiry: 1 minute–1 year

### Add funds

Funding lives in **Plan & billing → Funding**. For a single agent, it's also on that agent's **Balance & funding** tab.

**Turn on funding (one time).** The first time you open Funding, the dashboard explains how it works and shows a **Turn on funding** button. Floe keeps your balance in a wallet it sets up and runs for you. You install nothing and need no crypto knowledge. The balance stays yours, and you can cash out or export it anytime. Until you turn funding on, the dashboard shows no wallet at all. If your account already had agents or had moved money before this step existed, funding is already on. Only the account owner can add or move funds.

Once funding is on:

1. Click **Add funds**, choose where the money goes (your account balance or a specific agent), and pay by card, Apple Pay, Google Pay, or bank transfer. Coinbase handles the checkout in a popup, with $50 / $100 / $500 presets or a custom amount. Money added to the account balance stays there until you move it to an agent with **Move between** in the same window.
2. Or choose **Deposit USDC directly** to get a deposit address.
3. Your balance updates once the payment clears.

The Funding section also holds the wallet's own actions: copy its address and **Cash out** to your bank or Coinbase account. For a wallet Floe runs for you, you can also send USDC and export its private key. If you signed up with your own wallet, you already hold that key.

No crypto bridges, no token swaps, no gas tokens needed.

CLI equivalents: `floe funds topup [--amount <usd>] [--open]` prints the same Coinbase checkout link and watches for the funds; `floe funds address` prints the agent's raw USDC deposit address for wallet/exchange transfers.

### Usage & activity

**Usage** (`/usage`) answers where your spend went. Pick a date range, filter by vendor, client or reconciliation status, and group the result by **client, campaign, agent, channel, outcome or task type** — the same six dimensions the API serves.

One range drives the whole screen: the KPI tiles, the spend chart and the rollup table all cover the period you picked, and the API reports back the range it actually aggregated. If your plan's history window is shorter than the range you asked for, the screen says so rather than captioning a clamped result with the window you requested.

Untagged spend is never hidden. Calls with no value for the dimension you grouped by are bucketed under a placeholder row — usually the most actionable line on the page, since it is spend you cannot bill back to anyone.

Reading all of this is **free on every plan**. CLI equivalent: `floe usage summary` for the KPIs, and `floe interactions rollups --by <customer|campaign|agent|channel|outcome|task_type>` for the same six groupings.

> Not `floe ledger --group-by campaign`: that groups `/ledger` by **task id**, which is a different question from a campaign rollup. See [attribution](../build/attribution.md).

### Exports

**Exports** (`/exports`) lists every CSV Floe can produce. Each one is built on the screen that owns its date range and filters, so the file always matches what you were looking at:

| Export | Where | Contains |
|---|---|---|
| Usage rollup | `/usage` | Cost per client / campaign / agent / channel / outcome / task type, with duration and $/min where a call has both |
| Vendor cost legs | `/actuals` | Every vendor charge with its reconciliation status, units and provenance |
| Client ledger | `/customers` | One client's per-charge cost, revenue and margin, plus the range summary that matches their invoice |
| Monthly charges | `/exports` | Every charge Floe settled this calendar month |
| Statements · margin · close packs | `/close` | The artifacts for a closed billing period |

Every export is rendered server-side and **refuses rather than truncates**: past its row ceiling you get `413 export_too_large` telling you to narrow the range, never a short file that looks complete.

CSV export rides the **Pro** `exports` feature. Statements, margin files and close packs are deliberately **not** gated — they are artifacts you already issued to your own clients, and a downgrade never retracts them.

### API Keys

Create and manage developer API keys (`floe_live_*`) for authenticating with the [Credit API](credit-api.md) developer endpoints and webhook management. Label keys by environment and revoke compromised keys instantly.

Go to **Keys** in the sidebar, or see [API Keys](api-keys.md). CLI equivalent: `floe devkeys list|create|revoke|rotate` (agent runtime keys: `floe keys …`).

### Webhooks

Register webhook endpoints to receive push notifications for loan events — health warnings, expiry alerts, liquidations, repayments, **credit utilization warnings**, and **delegation expiry alerts**.

Go to **Webhooks** in the sidebar, or see [Webhooks](webhooks.md). CLI equivalent: `floe webhooks list|create|get|pause|enable|delete|test|rotate-secret|deliveries`.

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
| Overview | `/` | Dashboard home with usage summary | `floe usage summary` · `floe billing mtd` |
| Usage | `/usage` | Filter, group and chart your spend by any dimension | `floe usage summary` · `floe interactions rollups --by <dim>` |
| Exports | `/exports` | Every CSV Floe can produce, and where it comes from | — |
| Agents | `/agents` | Create, fund, and manage agents (per-plan limits) | `floe agents` · `floe funds` |
| Agent Detail | `/agents/:id` | Status, balance, delegation, keys | `floe agents get <agent> [--usage]` · `floe keys list --agent <agent>` |
| API Keys | `/keys` | Create, list, and revoke developer keys | `floe devkeys` |
| Webhooks | `/webhooks` | Register endpoints, test deliveries, view logs | `floe webhooks` |
| Docs | `/docs` | Interactive API reference | `floe help <command>` |

## Next Steps

- **[API Keys](api-keys.md)** — Create your first developer key.
- **[Webhooks](webhooks.md)** — Set up push notifications for loan events and alerts.
- **[Quickstart](../getting-started/quickstart.md)** — Full happy-path walkthrough from zero to first paid API call.
- **[x402 Credit Facilitator](x402-facilitator.md)** — Delegate collateral and let your agent pay for APIs automatically.
