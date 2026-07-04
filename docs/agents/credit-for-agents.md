# How Agents Pay With Floe

Agents need to pay for things — APIs, compute, data — without a human in the loop and without touching crypto. Floe gives every agent a funded balance and one endpoint to spend it through, with hard, server-side spend controls.

Gas-free — Floe sponsors all transaction costs.

---

## How it works (live today)

1. **Create an agent** in the [dashboard](https://dev-dashboard.floelabs.xyz). Floe provisions a custodial wallet — no seed phrase, no MetaMask.
2. **Fund it** with a card, Apple Pay, Google Pay, or bank transfer. Fiat converts to USDC on Base behind the scenes. Or send USDC from any wallet.
3. **Set spend controls** — per call, per day, per session, per vendor, or across your whole agent team.
4. **Pay any x402 API** through `POST /v1/proxy/fetch`. The facilitator signs and settles from your agent's Floe-managed balance; the agent only sees the response.

The agent never touches crypto, never signs a transaction, never pays gas.

→ [Quickstart](../getting-started/quickstart.md) · [Bank Account → First API Call](fiat-to-x402.md)

---

## Example: x402 facilitator (zero-touch)

An agent calls x402-enabled APIs. The deployer provisions the agent once via `POST /v1/developer/agents` (dashboard, CLI, or REST) — Floe creates a managed Privy wallet for the agent. The agent then calls `POST /v1/proxy/fetch` with any URL — the facilitator funds the payment from the agent's Floe-managed balance, signs the EIP-3009 payment, and returns the API response. The agent never thinks about money.

---

## What it costs

| Item | Cost |
|---|---|
| Fiat → USDC | Coinbase fees (typically ~1.5%) |
| x402 API calls | Whatever the API charges (deducted from your balance) |
| Gas | $0 — Floe sponsors all transaction costs |
| Funding | Buy USDC from the [dashboard](../developers/developer-dashboard.md) via Coinbase (card or bank transfer) |

---

## Advanced (in development): on-chain working capital

> **Status: in development / roadmap.** Borrowing USDC working capital against on-chain collateral — and any associated rate — is **not generally available** as a product. The section below describes the intended self-custody, on-chain surface. The live way to give an agent money is the Floe-managed balance above. (Today, the facilitator already funds your payments on-chain for you — see [How Floe works under the hood](../getting-started/core-concepts.md) — but you don't borrow, set rates, or manage loans.)

The planned model: an agent deposits USDC and borrows up to 95% back as working capital in the same-token USDC/USDC market — same token in, same token out, so no price-volatility risk. Volatile-collateral markets (WETH/USDC, cbBTC/USDC at 70% LTV) would let agents that already hold ETH or BTC borrow USDC at a fixed rate and term.

Design intent:

- **No liquidation risk from price movements** in the USDC/USDC market — collateral and loan are the same asset.
- **No token swaps** — if you have USDC, you're ready.
- **Custody by audited smart contracts**, not by Floe, on the self-custody path.
- **Fixed rate, fixed term** — set at match time.

Repayment history would feed the [Credit & trust bureau](../components/credit-bureau.md) as a portable on-chain signal.

---

## Next

- **Get started:** [Quickstart](../getting-started/quickstart.md) — first paid API call in 5 minutes
- **Integrate:** [AgentKit Integration](../developers/agentkit.md) — 54 actions across TypeScript + Python
- **x402 proxy:** [x402 Credit Facilitator](../developers/x402-facilitator.md) — zero-touch API payments
- **Dashboard:** [Developer Dashboard](../developers/developer-dashboard.md) — manage agents via web UI
