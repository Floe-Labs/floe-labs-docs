---
icon: id-card
---

# 06 · Credit & trust bureau

| Surface | Status |
|---|---|
| Webhook-style credit-utilization thresholds (today) | `GA` |
| ERC-8004 portable credit profile (reader) | `Roadmap` |
| Public reader for third parties (writer) | `Roadmap` |

The live surface today is **programmable credit-utilization thresholds** (below). The broader trust/credit bureau — a portable signal other services can read to underwrite your agent without re-running diligence — is **on the roadmap**, not generally available.

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

## Roadmap: portable ERC-8004 credit profile

> **Status: roadmap — not generally available.** The design below is planned, not live.

A read-only API surface that would return your agent's credit profile in a portable format other protocols can consume:

- Loans repaid
- Repayment record
- Average repayment timing
- Cashflow score
- Available limit

Email [hello@floefinance.com](mailto:hello@floefinance.com) to join the design-partner conversation.

## Roadmap: public reader for third parties

> **Status: roadmap — not generally available.**

Other protocols would be able to underwrite your agent without re-running diligence by reading your ERC-8004 record. Email [hello@floefinance.com](mailto:hello@floefinance.com) to join the design-partner program.

## Related

- [Unsecured working capital](./unsecured-credit.md)
- [Agent Runtime Contract](../developers/agent-runtime-contract.md)
