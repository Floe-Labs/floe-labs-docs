# From Bank Account to First API Call

Fund your agent with a bank account or card. Get a USDC credit line. Call any x402 API. Five steps, no crypto experience needed.

---

## The flow

```
Bank account / card
  → Buy USDC via Coinbase (in the Floe dashboard)
  → USDC lands on Base
  → Deposit to Floe → 95% credit line
  → Agent calls x402 APIs — Floe handles payment automatically
  → Repay when done → deposit returns
```

Your agent never touches crypto directly. Floe handles all blockchain transactions — gas-free.

---

## Step 1 — Sign in to the dashboard

Go to [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) and connect any EVM wallet (MetaMask, Coinbase Wallet, Rainbow, WalletConnect).

---

## Step 2 — Fund with fiat

Click **Buy USDC** in the dashboard. Coinbase processes the purchase — credit card, debit card, or bank transfer. USDC arrives on Base in your wallet within minutes.

No crypto exchange account needed. No bridging. No gas tokens.

---

## Step 3 — Get a credit line

Your agent deposits USDC and borrows up to 95% back as working capital.

**Via the SDK (one call):**

```typescript
import { floeActionProvider } from "floe-agent";

// Deposit $10,000 USDC → get $9,500 credit line
await agent.run("instant_borrow", {
  marketId: "USDC/USDC",
  borrowAmount: "9500000000",       // $9,500 (6 decimals)
  collateralAmount: "10000000000",  // $10,000 deposit
  maxInterestRateBps: "800",        // 8% APR max
  duration: "2592000",              // 30 days
});
```

**Via the dashboard:** The agent setup wizard walks through deposit + delegation in three steps.

---

## Step 4 — Call any x402 API

### Option A: Direct credit line

Your agent has USDC. Spend it however you want — API calls, compute, on-chain operations.

### Option B: x402 facilitator (zero-touch)

Delegate credit to the Floe facilitator once. Then your agent calls `POST /v1/proxy/fetch` with any URL — Floe auto-borrows, signs the payment, returns the API response. The agent never sees USDC, never signs a transaction, never pays gas.

```typescript
// One-time setup — provisions a managed Floe credit agent.
await agent.run("grant_credit_delegation", {
  name: "my-agent",
  facilitatorUrl: "https://credit-api.floelabs.xyz",
  borrowLimit: "10000",
  maxRateBps: "1500",
  expiryDays: "90",
});

// Every call after — zero transactions, zero gas
await agent.run("x402_fetch", {
  url: "https://api.example.com/premium/data",
});
```

---

## Step 5 — Repay

When your agent is done, repay the credit line. The deposit returns automatically.

```typescript
await agent.run("repay_credit", { loanId: "42" });
// → Deposit returned to wallet
```

Or let the Floe facilitator handle rollover automatically — it renews the credit line before expiry so your agent never stops.

---

## What it costs

| Item | Cost |
|---|---|
| Fiat → USDC | Coinbase fees (typically ~1.5%) |
| Credit line | Fixed interest rate (set at match time, typically 5–10% APR) |
| x402 API calls | Whatever the API charges (deducted from credit balance) |
| Gas | **Free** — Floe sponsors all blockchain transactions |

---

## FAQ

**Do I need ETH for gas?**
No. Floe sponsors all gas for agents using the facilitator.

**What if my agent runs out of credit?**
The facilitator returns `402 insufficient_balance` with the available and required amounts. Top up your deposit or increase the credit line.

**Can I withdraw my deposit anytime?**
After repaying the loan, your full deposit returns automatically. You can also withdraw excess collateral anytime the loan is healthy.

**Is there liquidation risk?**
For the USDC/USDC market: no price-driven liquidation (same token in and out). The only path to liquidation is unpaid interest past the grace period.

---

## Next

- [Quick Start (Agents)](quickstart-agents.md) — technical setup in 5 minutes
- [Credit for Agents](credit-for-agents.md) — full overview
- [x402 Credit Facilitator](../developers/x402-facilitator.md) — facilitator API reference
- [Developer Dashboard](../developers/developer-dashboard.md) — manage agents, keys, webhooks
