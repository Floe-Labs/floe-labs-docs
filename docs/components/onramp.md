---
icon: arrow-down-to-line
---

# 02 · Fiat on/off-ramp

| Direction | Status |
|---|---|
| Onramp (fiat → USDC into the agent wallet) | `GA` |
| Offramp (USDC → fiat / local payouts) | `Preview` |

---

## Onramp `GA`

Fund any agent wallet with USDC via Coinbase — credit card, bank transfer, Apple Pay, Google Pay — directly from the [Floe dashboard](https://dev-dashboard.floelabs.xyz). The agent doesn't touch fiat rails; the operator does.

### How it works for operators

1. Operator opens the dashboard, selects the agent's wallet.
2. Chooses an amount and a payment method.
3. Coinbase settles in USDC directly to the wallet.
4. The agent sees its balance change — no further action needed.

### How agents use it

The Floe SDK exposes the onramp as a **deep link** today (no SDK action). Hand the operator a URL like:

```
https://dev-dashboard.floelabs.xyz/onramp?agent=0x<wallet>
```

A programmatic `create_onramp_link` tool is on the roadmap.

### Coverage

- Visa, Mastercard, Apple Pay, Google Pay
- ACH and SEPA bank transfers
- 100+ countries supported

## Offramp `Preview`

Local payouts in 100+ countries are in design-partner preview. Email [hello@floelabs.xyz](mailto:hello@floelabs.xyz) to apply.

## Related

- [Bank Account → First API Call](../agents/fiat-to-x402.md) — step-by-step operator flow
- [Agent Wallet](./wallet.md)
