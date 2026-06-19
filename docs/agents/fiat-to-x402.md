# From Bank Account to First API Call

Fund your agent with a bank account or card. Call any x402 API. No crypto experience needed.

---

## The flow

```
Bank account / card
  → Buy USDC via Coinbase (in the Floe dashboard)
  → USDC lands in your agent's Floe-managed balance on Base
  → Agent calls x402 APIs — Floe funds each payment from the balance automatically
  → Top up when the balance runs low
```

Your agent never touches crypto directly. Floe handles all blockchain transactions — gas-free.

---

## Step 1 — Sign in to the dashboard

Go to [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) and sign in with email, Google, or a wallet. Create an agent — Floe provisions a custodial wallet for it. No seed phrase, no MetaMask.

---

## Step 2 — Fund with fiat

Click **Fund Wallet** in the dashboard. Coinbase processes the purchase — credit card, debit card, Apple Pay, Google Pay, or bank transfer. USDC arrives in your agent's balance on Base within minutes.

No crypto exchange account needed. No bridging. No gas tokens.

---

## Step 3 — Set spend controls

Cap what the agent can spend before it makes its first call — per call, per day, per session, per vendor, or across your whole agent team. The cap is enforced server-side by Floe, so a confused or runaway agent can't exceed it. (Scope: this governs x402 payments made through the Floe proxy, not raw LLM token bills you pay with your own provider key.)

→ [Spend Controls](../developers/spend-controls.md)

---

## Step 4 — Call any x402 API

Your agent calls `POST /v1/proxy/fetch` with any URL. Floe funds the payment from the agent's Floe-managed balance, signs it, and returns the API response. The agent never sees USDC, never signs a transaction, never pays gas.

```typescript
// Every call — zero transactions, zero gas
await agent.run("x402_fetch", {
  url: "https://api.example.com/premium/data",
});
```

---

## Step 5 — Top up

When the balance runs low, top up from the dashboard or set auto-recharge (e.g. "add $50 when balance falls below $10"). You can also wire a webhook to be notified before the agent runs dry.

---

## What it costs

| Item | Cost |
|---|---|
| Fiat → USDC | Coinbase fees (typically ~1.5%) |
| x402 API calls | Whatever the API charges (deducted from your balance) |
| Gas | **Free** — Floe sponsors all blockchain transactions |

---

## FAQ

**Do I need ETH for gas?**
No. Floe sponsors all gas for agents using the facilitator.

**What if my agent runs out of money?**
The facilitator returns `402 insufficient_balance` with the available and required amounts. Top up the balance from the dashboard.

**Can I withdraw my balance?**
Yes — the USDC is your agent's. Manage it from the dashboard.

---

## Advanced (in development)

Borrowing USDC working capital against on-chain collateral (instead of pre-funding the balance) is **in development** and not generally available. See [Working capital (on-chain)](../components/secured-credit.md).

---

## Next

- [Quickstart](../getting-started/quickstart.md) — first paid API call in 5 minutes
- [How Agents Pay With Floe](credit-for-agents.md) — full overview
- [x402 Credit Facilitator](../developers/x402-facilitator.md) — facilitator API reference
- [Developer Dashboard](../developers/developer-dashboard.md) — manage agents, keys, webhooks
