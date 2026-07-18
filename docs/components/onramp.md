---
icon: arrow-down-to-line
---

# 02 · Funding & Withdrawals

| Direction | Status |
|---|---|
| Deposit (add money to an agent) | `GA` |
| Withdrawal (money back out to you) | `Preview` |

---

## Deposits `GA`

Add money to any agent from the [Floe dashboard](https://dev-dashboard.floelabs.xyz) — card, bank transfer, Apple Pay, or Google Pay. The agent doesn't touch any of this; the operator funds it.

### How it works for operators

1. Operator opens the dashboard and selects the agent.
2. Chooses an amount and a payment method.
3. The funds settle directly to the agent's balance.
4. The agent sees its balance change — no further action needed.

### How agents use it

The Floe SDK exposes funding as a **deep link** today (no SDK action). Hand the operator a URL like:

```
https://dev-dashboard.floelabs.xyz/onramp?agent=0x<wallet>
```

A programmatic `create_onramp_link` tool is on the roadmap.

### Coverage

- Visa, Mastercard, Apple Pay, Google Pay
- ACH and SEPA bank transfers
- 100+ countries supported

## Withdrawals `Preview`

Payouts back to your bank in 100+ countries are in design-partner preview. Email [hello@floelabs.xyz](mailto:hello@floelabs.xyz) to apply.

## Related

- [Bank Account → First API Call](../agents/fiat-to-x402.md) — step-by-step operator flow
- [Agent Wallet](./wallet.md)
