---
icon: credit-card
---

# Funding

The fastest way to give your agent spending money is to pay with a card. No exchange account, no setup.

---

## Starting with the $2 Welcome Credit

New agents get a **$2 Welcome Credit** to try paid APIs — no card needed.

One thing to know up front, because it trips people up: this is a Floe-managed balance, not a literal balance you draw down yourself. Floe handles the on-chain funding for you. The **first time your agent makes a _paid_ call, Floe activates the balance automatically** — no dashboard click, no signature. That first call comes back as `auto_borrow_in_progress` (retry in a few seconds); it then settles normally, and every call after is instant. (For the on-chain detail of how Floe funds payments today, see [How Floe works under the hood](core-concepts.md).)

So if the dashboard shows credit available but says it "can't be spent directly yet," that's expected — **just make your first paid call and it activates itself.** Free endpoints don't trigger activation, because there's nothing to pay; only a real paid (x402) call does.

Two numbers you'll see, and they're not the same:

| Field | What it means |
| --- | --- |
| **Credit available** (`creditAvailableRaw`) | Your ceiling — the most the agent can spend. The $2 Welcome Credit shows up here first. |
| **Spendable** (`spendableRaw`) | What the agent can pay with **right now**. It's `0` until that first paid call activates the balance, then it tracks your remaining credit. This is what the proxy checks. |

→ Full field breakdown in the [Credit REST API → balance](../developers/credit-api.md#get-v1agentsbalance).

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
- **Low-balance webhook**: subscribe with `POST /v1/agents/credit-thresholds` (a utilization threshold in basis points). Floe POSTs `credit.warning` / `credit.at_limit` to your webhook when the agent crosses it, so it can self-manage — page a human or trigger a programmatic top-up. See [Webhooks](../developers/webhooks.md).

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
