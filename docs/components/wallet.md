---
icon: wallet
---

# 01 · Agent Wallet `GA`

Every agent gets a wallet with a dollar balance you fund. You set the spend controls; the agent pays vendors per call, up to the limits you set.

That's the whole model: **funded balance → spend controls → pay-per-call.** No keys to manage, no crypto to touch.

---

## What you get

- **A funded balance.** Top it up with a card, Apple Pay, Google Pay, or bank transfer. The agent spends from that balance.
- **Spend limits.** Set a per-session ceiling with `set_spend_limit`; clear it with `clear_spend_limit`. A call that would exceed the cap is refused, not charged.
- **Allowed destinations.** Restrict the wallet to a specific list of vendor endpoints.

## Read state

```typescript
await agentkit.run("get_wallet_balance", {});
await agentkit.run("get_spend_limit", {});
```

Maps to MCP tools: `get_wallet_balance`, `get_spend_limit`.

## Manage spend caps

```typescript
await agentkit.run("set_spend_limit", { usdcAmount: "100000000" }); // $100 session cap
await agentkit.run("clear_spend_limit", {});
```

## Related

- [Quickstart](../getting-started/quickstart.md)
- [Agent Awareness](../developers/agent-awareness.md)
