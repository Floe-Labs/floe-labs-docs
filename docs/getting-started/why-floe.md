# Why Floe, Why Now

Every payment rail needs a credit layer. The agent economy doesn't have one.

---

## The four curves that just crossed

1. **Demand.** x402 has processed **100M+ machine payments** since May 2025.
2. **Rails.** Stripe ACP (Mar 2026), Coinbase Agentic Wallets (Feb 2026), Google AP2, Visa, Mastercard, PayPal — all live for agents. **Zero credit on any of them.**
3. **Identity.** ERC-8004 went live Jan 29, 2026. **30K agents week one. 106K within weeks.** Underwritable reputation, for the first time.
4. **Programmability.** EIP-7702 (May 2025) + ERC-7579. Smart-contract-enforced spend limits, atomic repayment, policy-bound credit are *now possible*. Twelve months ago, impossible.

The agent economy is here. The credit layer is the last missing piece.

---

## What's broken without it

Every agent operator pre-funds their agent's wallet. That's a **60–70% capital drag** — capital sits idle "just in case" the agent needs to pay for compute, APIs, data, or tools.

Today, operators have four bad options:

1. **Pre-fund every agent.** 60–70% capital drag.
2. **Use Stripe Issuing virtual cards or Shared Payment Tokens.** $0.30 card-network floor breaks sub-cent agent economics.
3. **Borrow from Aave.** $125 of collateral for $100 of credit. Variable rates. Liquidation can hit mid-task.
4. **Stop mid-task.** A LangChain workflow burned $47,000 in 11 days before anyone noticed. Gemini CLI racked up $300 in one session — OpenAI and Anthropic don't refund overages.

**The fix:** Deterministic onchain cashflows + smart-contract-enforced repayment = a credit primitive that works at machine speed.

---

## The market

| | Today | 2030 |
|---|---|---|
| **Agent credit market** | ~$0 outstanding | $1–2T (McKinsey: $3–5T agentic commerce; BCG: $1T agentic ecommerce influence) |

For reference, in the human economy: U.S. consumers carry ~$5T of credit on ~$18T spending (~28%). U.S. businesses carry ~$13T of credit on ~$29T revenue (~45%). Global credit markets are ~1.5x GDP.

Apply that ratio to a $3–5T agent economy and you get **$1–2T of agentic credit** that needs to exist by 2030.

---

## Why agents can be underwritten *better* than SMBs

Agents don't have FICO. They have something better: **deterministic onchain cashflows.**

| Signal | What it tells underwriters |
|---|---|
| x402 receipts | Per-inference / per-minute revenue, observable and verifiable |
| ACP revenue | Settled, signed, auditable |
| Chain-of-thought | Intention + execution quality |
| Task completion histories | Reliability over time |
| Counterparty quality | Who's paying — enterprise vs. unknown |

> "You can underwrite an agent's next 1,000 hours of work with higher confidence than any SMB loan."

Receipts, repayments, and CoT are richer signals than tax returns. They're also continuous — not annual.

---

## What Floe is (and isn't)

Floe **is**:

- A **protocol** — not a product feature.
- The **credit layer** behind payment rails (x402, ACP, AP2, Visa, Mastercard).
- A **bureau** — persistent trust profiles for agents and merchants.
- **Built for AI agents. Backed by institutions.**

Floe **is not**:

- A pool-based DeFi money market (we're per-loan isolated).
- A custodian.
- A neobank for agents.
- Limited to crypto-native borrowers.

---

## Stripe analogy

> Coinbase built the rails. Stripe built the checkout. Neither built the credit layer — because credit is a protocol problem, not a product feature. That's Floe.

The agent economy is going to need credit at every level: per-call, per-minute, per-task, per-pipeline. Card networks can't price sub-cent transactions. Variable-rate DeFi pools can't price fixed-cost agent work. Offline trade finance can't move at agent speed.

A programmable, deterministic, onchain credit primitive can.

---

## What's next

- **[Credit for Agents](../agents/credit-for-agents.md)** — secured working capital, gas-free
- **[Quick Start (Agents)](../agents/quickstart-agents.md)** — get an agent borrowing in 5 minutes
- **[How Floe Works](core-concepts.md)** — intents, isolated loans, LTV, oracles
