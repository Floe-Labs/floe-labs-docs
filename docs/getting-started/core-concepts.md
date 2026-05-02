# How Floe Works

The mechanics behind Floe's credit protocol — intents, isolated loans, and the matching engine.

> **TL;DR.** A borrower (human or agent) signs an *intent*. A solver matches it with a lender's intent. The result is an isolated, fixed-rate loan with smart-contract-enforced repayment. Fixed rate. Fixed term. Per-loan isolated escrow. Gas-free for agents.

---

## 1. Intents

An **intent** is a signed message expressing what you want to achieve, not how. Floe matches intents into loans.

### Lend intent

A lender's offer to provide capital:

- **Amount** — USDC or USDT to lend
- **Min interest rate** — minimum APR accepted
- **Max LTV** — liquidation threshold
- **Duration** — max loan length (supports min/max range)
- **Expiry** — when the offer becomes void

### Borrow intent

A borrower's request:

- **Amount** — USDC/USDT requested
- **Collateral** — WETH or cbBTC posted by the borrower
- **Max interest rate** — max APR willing to pay
- **Min LTV** — target loan-to-value
- **Duration** — desired term (supports min/max range)

### Matching rules

Two intents match when:

1. Same market (e.g. USDC/WETH)
2. Rate compatible — borrower's max ≥ lender's min
3. LTV gap ≥ 8% — borrower's LTV + 8% ≤ lender's max LTV
4. Duration compatible — overlap exists between the borrower's and lender's ranges
5. Both intents are unexpired

Matching can be manual (browse the order book in-app) or automatic (solver bots).

---

## 2. Solvers (matchers)

**Solvers** are off-chain bots that:

1. Monitor open intents
2. Find compatible pairs
3. Submit match transactions onchain
4. Earn a commission (set by intent creators, typically 0.1–2%)

Solving is permissionless. Anyone can run a matcher — see [Run a Solver Bot](../developers/run-solver-bot.md).

---

## 3. Isolated loans

Each loan is **isolated** with its own:

- Principal
- Collateral escrow
- Fixed interest rate
- Liquidation threshold
- Duration

Unlike pool-based protocols, **bad debt does not spread** between loans, markets, or across the protocol. A liquidation in one loan affects only the parties to that loan.

---

## 4. Loan-to-Value (LTV)

```
LTV = (Loan Value / Collateral Value) × 100%
```

### LTV zones

| Zone | Range | Status |
|---|---|---|
| Safe | Loan LTV below liquidation LTV (>8% gap) | Healthy |
| Buffer | Within 8% of liquidation LTV | Caution |
| Danger | Within 3% of liquidation | High risk |
| Liquidation | At or above max LTV | Liquidatable |

### Key parameters

| Parameter | Value | Description |
|---|---|---|
| Min LTV gap | 8% | Required gap between origination and liquidation LTV |
| Withdrawal buffer | 3% | Cannot withdraw collateral within 3% of liquidation |
| Liquidation bonus | 5% | Liquidator incentive |

---

## 5. Oracles

Dual-oracle system:

1. **Chainlink** (primary) — decentralized price feeds
2. **Pyth** (fallback) — high-frequency updates

### Circuit breaker

The protocol auto-pauses when:

- Price is stale (>1 hour old)
- Price deviates >15%
- L2 sequencer is down
- Price returns zero

→ [Oracles & Circuit Breaker](../protocol/oracles-conditions.md)

---

## 6. Grace period & minimum interest

**Grace period.** When a loan reaches expiry, the borrower has additional protocol-set time to repay before the loan becomes liquidatable. Interest continues to accrue.

**Minimum interest.** Every loan enforces a floor on total interest paid, regardless of how short the term or how small the principal — preventing dust loans from being economically meaningless.

---

## 7. Duration ranges

Intents support **min and max duration** instead of a fixed value. A lender offering "30 to 90 days" matches a borrower requesting "14 to 60 days" — the matcher picks a compatible duration in the overlap. This significantly improves match rates.

---

## 8. Credit scores

Floe surfaces onchain credit scores via [Cred Protocol](https://cred.xyz) on the human dashboard — radar chart + tier badges (Excellent / Good / Fair / New). Today these are **informational only** and don't gate access.


---

## 12. Safe / Multisig support

Floe works natively in **Safe{Wallet}**. The app forces onchain transaction mode (no off-chain signatures), shows Safe-aware messaging, and guides co-signers to confirm in the Safe app.

---

## 13. LendrBot & agent interfaces

- **LendrBot** — natural-language assistant for humans. "Borrow 5000 USDC for 30 days at max 6% APR."
- **MCP server** — same actions exposed to any Claude/OpenAI/Cursor-compatible agent.
- **AgentKit** — TS + Python SDKs with 36 actions.

→ [LendrBot](../user/lendr-ai.md) · [MCP Server](../developers/mcp-server.md) · [AgentKit](../developers/agentkit.md)

---

## 14. Markets

A market is a (loan token, collateral token) pair. Currently live:

| Market | Loan token | Collateral token |
|---|---|---|
| USDC/WETH | USDC | WETH |
| USDC/cbBTC | USDC | cbBTC |
| USDT/WETH | USDT | WETH |
| USDT/cbBTC | USDT | cbBTC |

New markets are added by governance and have their own default rate, default LTV, protocol fee, and liquidation incentive.

---

## Summary

| Concept | What it is |
|---|---|
| Intent | Signed message expressing desired outcome |
| Solver | Bot matching compatible intents |
| Isolated loan | Per-match escrow with own terms |
| LTV | Loan / collateral value (Tier 1) |
| Oracle | Chainlink + Pyth with circuit breaker |
| Grace period | Buffer time after expiry before liquidation |
| Min interest | Floor interest amount per loan |
| Duration range | Min/max for flexible matching |
| Credit Bureau | Persistent trust/credit profiles |
| LendrBot | AI assistant (natural language) |

---

## Next

- [Credit for Agents](../agents/credit-for-agents.md) — secured working capital for AI agents
- [How to Borrow](../user/borrow.md) — step-by-step (Tier 1)
- [How to Lend](../user/lend.md) — earn yield as a lender
- [Architecture](../protocol/architecture.md) — contracts and flow
