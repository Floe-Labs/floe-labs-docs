---
icon: credit-card
---

# Funding

The fastest way to give your agent spending money is to pay with a card. No exchange account, no crypto, no setup.

---

## Fund Wallet from the dashboard

1. Sign in at [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz).
2. Pick your agent and click **Fund Wallet**.
3. Choose a method: **Card, Apple Pay, Google Pay, or bank transfer**. Funds arrive within seconds.

That's it. Your agent's balance updates and it can immediately call paid APIs.

### How much should I fund?

| Use case | Suggested first amount |
| --- | --- |
| Try the quickstart | **$10** |
| One agent making a handful of API calls per day | $25–$100 |
| Production agent with steady traffic | Roughly seven days of expected spend, then auto-recharge |

There's no hard minimum, but card payments have a Coinbase-imposed floor around $5.

---

## Auto-recharge and low-balance alerts

For production, don't manually babysit balances. In your agent's dashboard settings:

- **Auto-recharge**: "When balance falls below $10, charge my card for $50." Set once, forget.
- **Low-balance webhook**: Floe POSTs to a URL of your choice when the balance crosses a threshold you set, so you can page a human or trigger a programmatic top-up.

---

## When funding fails

Almost all funding failures come from the card processor, not Floe:

| Symptom | Cause | What to do |
| --- | --- | --- |
| Card declined | Issuer flags the transaction | Try a different card. Apple Pay sometimes succeeds where a raw card declines. |
| "Region not supported" | The card processor doesn't serve your country yet | Email [support@floelabs.xyz](mailto:support@floelabs.xyz) — we have manual options for several regions. |
| Stuck in "processing" | Compliance review | Wait up to 24 hours. The amount isn't debited until the funding completes. |
| Funded but balance still $0 | Dashboard view lagged | Refresh after ~60 seconds; if still wrong, contact support with the agent ID. |

If a top-up gets stuck, the agent itself is unharmed — you can always close it, and any cleared funds return to you.

---

## Withdrawing

When you close an agent in the dashboard, any remaining balance is returned to your developer account. From there you can:

- **Withdraw to your bank** (supported regions): off-ramp through the dashboard, lands as fiat in your bank within 1–3 business days.
- **Move it to another agent**: skip the off-ramp and the on-ramp; the dashboard transfers internally.

---

## Two wallets, both handled for you

You don't need to know this to use Floe, but here's the plumbing if you're curious:

- When you sign up, we provision a **developer wallet** for you. It's non-custodial Privy — you own it, you can export the keys, but you don't have to manage them. Your card-funded balance lives here.
- When you create an agent, we provision a **custodial wallet** for that agent. We operate it on your behalf, scoped by an on-chain permission you can revoke any time. This is where the agent's spending balance lives and where x402 payments are signed from.

Both are USDC-denominated under the hood, on Base. The dashboard and SDK always show you dollars.

---

## See also

- [Quickstart](quickstart.md) — create and fund an agent in five minutes
- [Receiving payments](../agents/credit-for-agents.md) — accept x402 from other agents
- [Advanced: how Floe works](core-concepts.md) — what's actually happening on-chain
