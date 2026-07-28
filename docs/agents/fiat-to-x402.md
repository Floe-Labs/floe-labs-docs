# From Bank Account to First API Call

Fund your agent with a card or bank transfer, then let it pay for any API. Everything is in dollars — no wallet to set up, no crypto to buy.

---

## The flow

```
Card / Apple Pay / Google Pay / bank transfer
  → Add funds in the Floe dashboard (a dollar balance for your agent)
  → Agent calls any API — Floe pays each one from the balance automatically
  → Top up when the balance runs low
```

Your agent never manages a wallet or touches crypto. Floe settles every payment behind the scenes — nothing to sign, no network fees to cover.

---

## Step 1 — Sign in to the dashboard

Go to [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) and sign in with email, Google, or a wallet. Create an agent — Floe provisions everything it needs in the background. No seed phrase, no MetaMask.

---

## Step 2 — Add funds

Click **Fund Wallet** in the dashboard and pay with **card, Apple Pay, Google Pay, or bank transfer**. The balance shows in dollars and arrives within seconds — ready to spend on the next call.

No exchange account, no setup, nothing to convert.

---

## Step 3 — Set spend controls

Cap what the agent can spend before it makes its first call — per call, per day, per session, per vendor, or across your whole agent team. The cap is enforced server-side by Floe, so a confused or runaway agent can't exceed it. (Scope: this governs x402 payments made through the Floe proxy, not raw LLM token bills you pay with your own provider key.)

→ [Spend Controls](../developers/spend-controls.md)

---

## Step 4 — Call any API

Your agent calls `POST /v1/proxy/fetch` with any URL. Floe pays the vendor from the agent's balance and returns the API response. The agent only ever sees dollars and the response — nothing to sign, no network fees.

```typescript
// Every call — one request, priced in dollars
await agentkit.run("x402_fetch", {
  url: "https://api.example.com/premium/data",
});
```

---

## Step 5 — Top up

When the balance runs low, top up from the dashboard. You can wire a low-balance webhook to be notified before the agent runs dry — see [Webhooks](../developers/webhooks.md).

---

## What it costs

| Item | Cost |
|---|---|
| Adding funds | A small processing fee on card/bank funding (typically ~1.5%) |
| API calls | Whatever the API charges (deducted from your balance) |
| Network fees | **None** — Floe covers settlement for you |

---

## FAQ

**Do I need to hold any crypto or cover network fees?**
No. Floe settles every payment for you — you only ever fund and spend in dollars.

**What if my agent runs out of money?**
The proxy returns `402 insufficient_balance` with the available and required amounts. Top up the balance from the dashboard.

**Can I withdraw my balance?**
Yes — the balance is your agent's. Manage or withdraw it from the dashboard.

---

## Next

- [Quickstart](../getting-started/quickstart.md) — first paid API call in 5 minutes
- [Funding your agent](../getting-started/funding.md) — every funding method and low-balance alerts
- [Payment Facilitator](../developers/x402-facilitator.md) — facilitator API reference
- [Developer Dashboard](../developers/developer-dashboard.md) — manage agents, keys, webhooks
