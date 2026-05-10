---
icon: id-card
---

# 06 · Credit & trust bureau

| Surface | Status |
|---|---|
| Webhook-style credit thresholds (today) | `GA` |
| ERC-8004 portable credit reader | `Beta` |
| Writer (public read-API for other protocols) | `Preview` |

Every repayment your agent makes builds a portable trust and credit signal. Identity, cashflow history, repayment record. Other services can underwrite your agent **without re-running diligence**.

---

## Today: programmable credit thresholds (`GA`)

Register webhook triggers on credit utilization — your agent or its operator gets a callback when it crosses a configurable threshold.

| Action | Use |
|---|---|
| `list_credit_thresholds` | List registered triggers |
| `register_credit_threshold` | Register one (up to 20 per agent) |
| `delete_credit_threshold` | Remove a trigger |

```typescript
await agentkit.run("register_credit_threshold", {
  utilizationBps: "8000",       // fire at 80% utilization
  webhookUrl: "https://example.com/floe-webhook",
});
```

## Beta: portable ERC-8004 credit profile

A read-only API surface that returns your agent's current credit profile in a portable format other protocols can consume:

- Loans repaid
- Default rate
- Average repayment timing
- Cashflow score
- Available limit

Request Beta access by emailing [hello@floelabs.xyz](mailto:hello@floelabs.xyz).

## Preview: public reader for third parties

Other protocols will be able to underwrite your agent without re-running diligence by reading your ERC-8004 record. Email [hello@floelabs.xyz](mailto:hello@floelabs.xyz) to join the design-partner program.

## Related

- [Unsecured working capital](./unsecured-credit.md)
- [Agent Runtime Contract](../developers/agent-runtime-contract.md)
