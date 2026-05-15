---
icon: credit-card
---

# Funding

The fastest way to give yourself or your agent working capital is to pay with a card. No exchange account, no bridge, no gas token.

---

## Two wallets, both provisioned for you

When you first sign in to the dashboard, Floe provisions a **non-custodial wallet for you** (the developer). You own it, but you never see a private key — sign-in is by email or social, with Privy doing the wallet plumbing under the hood. This is where your fiat on-ramp purchases arrive.

When you register an agent, Floe provisions a **second non-custodial wallet** for that agent. The agent's wallet is what holds the deposited collateral and pays merchants over x402.

You can fund **either** wallet directly from the dashboard.

---

## The dashboard flow (recommended)

1. Open [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) and sign in.
2. Click **Fund**. The dashboard asks whether you want USDC to land in your developer wallet (so you can split it across multiple agents later) or directly in one of your agents' wallets (one-and-done).
3. Choose a method: **Card, Apple Pay, Google Pay, or bank transfer**. Coinbase processes the purchase; the USDC arrives in the chosen wallet typically within 30 seconds.

That's it. The dashboard shows the new balance, and the agent (or you) can immediately call `instant_borrow` or `x402_fetch`.

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

Already have USDC on Base in an external wallet (MetaMask, Coinbase Wallet, hardware wallet)? You can transfer it directly to either Floe-provisioned wallet's address. **Most users should not do this** — the dashboard flow is faster, lower-fee, and avoids any chance of sending to the wrong chain.

If you still want to:

1. In the dashboard, open the developer or agent wallet detail page and copy its **deposit address**. The page tells you which network it's on.
2. Send USDC on **Base** (not Ethereum mainnet, not Polygon, not Optimism). The dashboard shows the balance once the transfer confirms.

> ⚠️ **Never send tokens other than USDC** to these addresses, and never send from a chain other than Base. Both are unrecoverable. If you're not 100% sure your source supports Base, use the card flow instead.

---

## Withdrawing funds

Closing an agent with `floe-agent close --name <name>` (or the dashboard's **Close agent** button) automatically:

1. Repays any outstanding facility loans.
2. Returns deposited collateral.
3. Transfers any remaining USDC from the agent's wallet back to your developer wallet.

You don't have to drain the wallet manually. The wind-down happens server-side.

To cash out from your developer wallet, the dashboard's **Withdraw** action lets you send USDC to any external address on Base, or convert to fiat through Coinbase's off-ramp if you're in a supported region.

---

## See also

- [Quickstart](quickstart.md) — register and fund an agent in five minutes
- [Agent wallet](../components/wallet.md) — how the managed wallet works under the hood
- [Fiat on/off-ramp](../components/onramp.md) — full on-ramp component reference
