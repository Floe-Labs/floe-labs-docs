# Credit for Agents

Working capital for AI agents. Fixed rates. No price-volatility risk. **Gas-free — Floe sponsors all transaction costs.**

---

## How it works

Your agent deposits USDC as collateral and borrows up to 95% back as working capital. Same token in, same token out — no crypto trading, no price risk. When the agent repays, the deposit returns automatically.

For agents that already hold ETH or BTC: Floe also supports WETH and cbBTC collateral for USDC loans (with lower LTV due to price volatility).

---

## Two ways to use Floe

### 1. Direct credit line

Agent deposits USDC, borrows USDC, spends it however it wants. Full control.

```
Agent deposits $10,000 USDC
  → Gets $9,500 USDC credit line (95% LTV)
  → Spends on API calls, compute, services
  → Repays $9,500 + fixed interest fee
  → Gets $10,000 deposit back
```

### 2. x402 payment proxy (zero-touch)

Agent's deployer delegates collateral to the Floe facilitator once. After that, the agent just calls `fetch()` on any x402 API — Floe handles borrowing, payment signing, and repayment automatically. The agent never thinks about money.

```
Deployer delegates $10,000 USDC collateral to facilitator (one-time)
  → Agent calls: POST /v1/proxy/fetch { url: "https://api.example.com/data" }
  → Floe auto-borrows, pays the API, returns the response
  → Agent keeps working. Floe manages the credit lifecycle.
```

---

## What it costs

| Parameter | Value |
|---|---|
| Advance | Up to 95% of your USDC deposit |
| Rate | Fixed — set at match time, never changes |
| Term | 1–365 days |
| Collateral | USDC (primary), WETH, or cbBTC |
| Gas | $0 — Floe sponsors all gas for agents using the facilitator |

---

## Why USDC collateral?

Most DeFi lending requires volatile crypto as collateral (ETH, BTC). That means managing liquidation risk, monitoring prices, and over-collateralizing significantly.

Floe's USDC/USDC market eliminates all of that:

- **No liquidation risk from price movements** — collateral and loan are the same asset
- **95% LTV** — deposit $10K, get $9.5K (vs. 30-70% on volatile collateral)
- **No token swaps needed** — if you have USDC, you're ready
- **Fiat on-ramp coming soon** — deposit with a credit card or bank transfer, get a credit line instantly

---

## Building credit history

Every loan your agent takes and repays builds on-chain credit history. This history will unlock:

- **Higher LTV** (up to 150% for qualified agents — underwritten by receivables)
- **Lower rates** from lenders who can verify repayment track record
- **Larger credit lines** as the agent proves reliability

---

## What Floe will not do

- **Custody your agent's funds.** Collateral is held by audited smart contracts, not by Floe.
- **Liquidate without cause.** For USDC/USDC loans, the only path to liquidation is unpaid interest — no price-driven liquidations.
- **Change your rate mid-term.** Fixed rate, fixed term, always.

---

## Next

- **Get started:** [Agent Quickstart](../developers/agent-quickstart.md) — working capital in 5 minutes
- **Integrate:** [AgentKit Integration](../developers/agentkit.md) — 36 actions across TypeScript + Python
- **x402 proxy:** [x402 Credit Facilitator](../developers/x402-facilitator.md) — zero-touch API payments
- **Dashboard:** [Developer Dashboard](../developers/developer-dashboard.md) — manage agents via web UI
