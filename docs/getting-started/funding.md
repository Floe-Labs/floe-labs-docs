---
icon: credit-card
---

# Funding the agent

The fastest way to give your agent working capital is to pay with a card. No exchange account, no bridge, no gas token.

---

## The dashboard flow (recommended)

1. Open [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) and sign in.
2. Pick your agent from the list (or create one if you haven't yet — see [Quickstart](quickstart.md)).
3. Click **Fund** on the agent's row.
4. Choose a method: **Card, Apple Pay, Google Pay, or bank transfer**. Coinbase processes the purchase; the USDC arrives in the agent's wallet typically within 30 seconds.

That's it. The dashboard shows the new balance, and the agent can immediately call `instant_borrow` or `x402_fetch`.

### How much should I fund?

| Use case | Suggested first deposit |
| --- | --- |
| Smoke-test the quickstart | **$10** |
| One agent paying for a handful of x402 calls per day | $25–$100 |
| Production agent with steady traffic | Size for ~7 days of expected spend, then top up via webhook |

There is no hard minimum on-chain, but the dashboard's card flow has a Coinbase-imposed floor of around $5. Bank transfers are higher-minimum but lower-fee.

---

## When a funding attempt fails

The most common failures all come from Coinbase's on-ramp, not Floe:

| Symptom | Cause | What to do |
| --- | --- | --- |
| Card declined | Issuer flags crypto purchase | Try a different card, or contact your issuer. Apple Pay sometimes succeeds where a raw card declines. |
| "Region not supported" | Coinbase doesn't yet serve your country | Use the [on-chain top-up path](#topping-up-on-chain-advanced) below. |
| Order stuck in "processing" | Coinbase compliance review | Wait up to 24 hours, then check the dashboard. The amount is not debited until the transfer succeeds. |
| Funded but agent still shows $0 | Block-explorer view lagged the dashboard | Refresh after ~60s; if still wrong, contact `support@floelabs.xyz` with the agent ID. |

If a funding flow leaves you stuck, the agent itself is unharmed — you can always close it with `floe-agent close --name <name>` (or the dashboard) and any USDC returned to the developer wallet.

---

## Topping up on-chain (advanced)

If you already hold USDC on Base and would rather not go through the on-ramp, you can transfer it directly to the agent's wallet address. **Most users should not do this** — the dashboard flow is faster, lower-fee, and avoids any chance of sending to the wrong chain.

If you still want to:

1. In the dashboard, open the agent's detail page and copy its **deposit address**. The page reminds you which network it's on.
2. Send USDC on **Base** (not Ethereum mainnet, not Polygon). The dashboard shows the balance once the transfer confirms.

> ⚠️ **Never send tokens other than USDC** to this address, and never send from a chain other than Base. Both are unrecoverable. If you're not 100% sure your source supports Base, use the card flow instead.

---

## Withdrawing funds

Closing an agent with `floe-agent close --name <name>` (or the dashboard's **Close agent** button) automatically:

1. Repays any outstanding facility loans.
2. Returns deposited collateral.
3. Transfers any remaining USDC back to your developer wallet (the one you used to register the agent).

You don't have to drain the wallet manually. The wind-down happens server-side.

---

## See also

- [Quickstart](quickstart.md) — register and fund an agent in five minutes
- [Agent wallet](../components/wallet.md) — how the managed wallet works under the hood
- [Fiat on/off-ramp](../components/onramp.md) — full on-ramp component reference
