---
icon: wallet
---

# 01 · Agent Wallet `GA`

A non-custodial smart-contract wallet purpose-built for AI agents. ERC-8004 identity, programmable spend limits, allowed-destination permissions, and chain-of-thought-aware authorization — all enforced on-chain.

---

## What you get

- **Non-custodial.** Keys live with you (Privy embedded, CDP MPC, raw private key, or smart-wallet AA — your choice).
- **ERC-8004 identity.** A portable agent record that other protocols can read.
- **Spend limits.** Per-session USDC ceilings managed via `set_spend_limit` / `clear_spend_limit`.
- **Allowed destinations.** Lock the wallet to a list of contracts or x402 endpoints.
- **Programmable permissions.** Spend caps, time windows, and operator delegation are enforced in the smart contract — not in the SDK.

## Wallet providers (`GA`)

| Provider | Use case | Setup |
|---|---|---|
| `CdpV2WalletProvider` | Production agents | CDP API key + wallet secret |
| `CdpSmartWalletProvider` | Gasless on Base (AA) | CDP Smart Wallet API |
| `ViemWalletProvider` | Dev / scripting | Raw private key |
| `PrivyWalletProvider` | Embedded / delegated wallets | Privy app credentials |

## Read state

```typescript
await agentkit.run("get_credit_remaining", {});
await agentkit.run("get_loan_state", {});
await agentkit.run("get_spend_limit", {});
```

Maps to MCP tools: `get_wallet_balance`, `get_credit_remaining`, `get_loan_state`, `get_spend_limit`.

## Manage spend caps

```typescript
await agentkit.run("set_spend_limit", { usdcAmount: "100000000" }); // $100 session cap
await agentkit.run("clear_spend_limit", {});
```

## Related

- [Quickstart](../getting-started/quickstart.md)
- [Agent Runtime Contract](../developers/agent-runtime-contract.md)
- [Credit & trust bureau](./credit-bureau.md)
