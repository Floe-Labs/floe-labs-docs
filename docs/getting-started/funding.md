---
icon: credit-card
---

# Funding

The fastest way to give your agent spending money is to pay with a card. No exchange account, no setup.

---

## Starting with the $2 Welcome Credit

New agents get a **$2 Welcome Credit** to try paid APIs — no card needed. It lands in your agent's balance and is spent per call, just like money you add yourself.

---

## Fund Wallet from the dashboard

1. Sign in at [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz).
2. Pick your agent and click **Fund Wallet**.
3. Choose a method: **Card, Apple Pay, Google Pay, or bank transfer**. Funds arrive within seconds.

That's it. Your agent's balance updates and it can immediately call paid APIs. Each call spends from that balance until it runs down; top it up whenever you like.

### How much should I fund?

| Use case | Suggested first amount |
| --- | --- |
| Try the quickstart | **$10** |
| One agent making a handful of API calls per day | $25–$100 |
| Production agent with steady traffic | Roughly seven days of expected spend |

There's no hard minimum, but card payments have a Coinbase-imposed floor around $5.

---

## Low-balance alerts

For production, don't manually babysit balances. Subscribe to a low-balance webhook with `POST /v1/agents/credit-thresholds` (a utilization threshold in basis points). Floe POSTs `credit.warning` / `credit.at_limit` to your webhook when the agent crosses it, so it can self-manage — page a human or trigger a top-up. See [Webhooks](../developers/webhooks.md).

---

## When funding fails

Almost all funding failures come from the card processor, not Floe:

| Symptom | Cause | What to do |
| --- | --- | --- |
| Card declined | Issuer flags the transaction | Try a different card. Apple Pay sometimes succeeds where a raw card declines. |
| "Region not supported" | The card processor doesn't serve your country yet | Email [hello@floelabs.xyz](mailto:hello@floelabs.xyz) — we have manual options for several regions. |
| Stuck in "processing" | Compliance review | Wait up to 24 hours. The amount isn't debited until the funding completes. |
| Funded but balance still $0 | Dashboard view lagged | Refresh after ~60 seconds; if still wrong, contact us with the agent ID. |

If a top-up gets stuck, the agent itself is unharmed — you can always close it, and any cleared funds return to you.

---

## Withdrawing

When you close an agent in the dashboard, any remaining balance is returned to your developer account. From there you can:

- **Withdraw to your bank** (supported regions): through the dashboard, lands in your bank within 1–3 business days.
- **Move it to another agent**: the dashboard transfers the balance internally.

---

The dashboard and SDK always show you dollars.

---

## See also

- [Quickstart](quickstart.md) — create and fund an agent in five minutes
- [Receiving payments](../agents/credit-for-agents.md) — accept payments from other agents
- [The Voice Stack](../build/voice-stack.md) — pay every leg of a voice call on one key
