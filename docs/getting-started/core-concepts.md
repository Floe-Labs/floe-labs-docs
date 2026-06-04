# How Floe Works

The mechanics behind Floe's credit protocol — intents, isolated loans, and the matching engine.

> **TL;DR.** A borrower (human or agent) signs an *intent*. A solver matches it with a lender's intent. The result is an isolated, fixed-rate loan with smart-contract-enforced repayment. Fixed rate. Fixed term. Per-loan isolated escrow. Gas-free for agents.

---

## 1. Intents

An **intent** is a signed message expressing what you want to achieve, not how. Floe matches intents into loans.

### Lend intent

A lender's offer to provide capital:

- **Amount** — USDC to lend
- **Min interest rate** — minimum APR accepted
- **Max LTV** — liquidation threshold
- **Duration** — max loan length (supports min/max range)
- **Expiry** — when the offer becomes void

### Borrow intent

A borrower's request:

- **Amount** — USDC requested as working capital
- **Collateral** — USDC deposit (for the USDC/USDC market), or WETH/cbBTC for volatile markets
- **Max interest rate** — max APR willing to pay
- **Min LTV** — target loan-to-value (up to 95% for USDC/USDC)
- **Duration** — desired term (supports min/max range)

### Matching rules

Two intents match when:

1. Same market (e.g., USDC/USDC or USDC/WETH)
2. Rate compatible — borrower's max rate >= lender's min rate
3. LTV gap met — for volatile markets: borrower's LTV + 8% <= lender's max LTV; for USDC/USDC: only 0.5% gap required
4. Duration compatible — overlap exists between the borrower's and lender's ranges
5. Both intents are unexpired

Matching can be manual (browse the order book in-app) or automatic (solver bots).

---

## 2. Solvers (matchers)

**Solvers** are off-chain bots that:

1. Monitor open intents
2. Find compatible pairs
3. Submit match transactions onchain
4. Earn a commission (set by intent creators, typically 0.1-2%)

Matching runs automatically — agents never touch it.

---

## 3. Isolated loans

Each loan is **isolated** with its own:

- Principal
- Collateral escrow
- Fixed interest rate
- Liquidation threshold
- Duration

Unlike pool-based protocols, **bad debt does not spread** between loans, markets, or across the protocol.

---

## 4. Markets

A market is a (loan token, collateral token) pair. Currently live:

| Market | Deposit | Borrow | Max LTV | Liquidation risk |
|---|---|---|---|---|
| **USDC/USDC** | USDC | USDC | **95%** | **Interest accrual only** |
| WETH/USDC | WETH | USDC | 70% | Price volatility |
| cbBTC/USDC | cbBTC | USDC | 70% | Price volatility |

### Same-token markets (USDC/USDC)

The USDC/USDC market is designed for **secured working capital**. Because the collateral and loan are the same asset:

- The oracle returns a fixed 1:1 ratio (hardcoded, no Chainlink dependency)
- Price-driven liquidation is impossible
- LTV can be much higher (up to 99.5% protocol cap, 95% recommended)
- The LTV gap is reduced to 0.5% (vs. 8% for volatile markets)
- No circuit breaker impact — the market is immune to oracle failures

The only path to liquidation is if accrued interest pushes the debt above the liquidation threshold. At 95% origination LTV with typical rates, this takes months.

### Volatile markets (WETH/USDC, cbBTC/USDC)

Traditional over-collateralized lending. Post ETH or BTC, borrow USDC at lower LTV (30-70%). Requires monitoring collateral health.

---

## 5. Loan-to-Value (LTV)

```
LTV = (Loan Value / Collateral Value) x 100%
```

### For USDC/USDC

| Zone | What it means |
|---|---|
| 95% origination | Healthy — normal operating range |
| 95.5% liquidation | Only reachable via interest accrual over long periods |

### For volatile markets

| Zone | Range | Status |
|---|---|---|
| Safe | Loan LTV below liquidation LTV (>8% gap) | Healthy |
| Buffer | Within 8% of liquidation LTV | Caution |
| Danger | Within 3% of liquidation | High risk |
| Liquidation | At or above max LTV | Liquidatable |

---

## 6. Oracles

### USDC/USDC markets

No external oracle. The protocol hardcodes a 1:1 ratio for same-token pairs. No price feed to go stale, no circuit breaker to trip.

### Volatile markets

Dual-oracle system:

1. **Chainlink** (primary) — decentralized price feeds
2. **Pyth** (fallback) — high-frequency updates

### Circuit breaker

The protocol auto-pauses volatile markets when:

- Price is stale (>1 hour old)
- Price deviates >15%
- L2 sequencer is down
- Price returns zero

USDC/USDC markets are **unaffected** by circuit breaker events.

-> [Oracles & Circuit Breaker](../protocol/oracles-conditions.md)

---

## 7. Grace period & minimum interest

**Grace period.** When a loan reaches expiry, the borrower has additional time to repay before the loan becomes liquidatable. Interest continues to accrue.

**Minimum interest.** Every loan enforces a floor on total interest paid, regardless of how short the term — preventing dust loans from being economically meaningless.

---

## 8. Duration ranges

Intents support **min and max duration** instead of a fixed value. A lender offering "30 to 90 days" matches a borrower requesting "14 to 60 days" — the matcher picks a compatible duration in the overlap. This significantly improves match rates.

---

## 9. Credit scores

Floe surfaces onchain credit scores via [Cred Protocol](https://cred.xyz) on the human dashboard. Today these are **informational only** and don't gate access. Over time, strong credit history will unlock higher LTV and better rates.

---

## 10. Agent interfaces

- **AgentKit** — TypeScript + Python SDKs with 45 actions
- **MCP server** — same actions exposed to any Claude/OpenAI/Cursor-compatible agent
- **Credit REST API** — HTTP endpoints for any language

---

## 13. Agent interfaces

- **MCP server** — same actions exposed to any Claude/OpenAI/Cursor-compatible agent.
- **AgentKit** — TS + Python SDKs with 45 actions.

→ [MCP Server](../developers/mcp-server.md) · [AgentKit](../developers/agentkit.md)

---

## 14. Markets

A market is a (loan token, collateral token) pair. Currently live:

| Market | Loan token | Collateral | Max LTV | Liquidation risk |
|---|---|---|---|---|
| **USDC/USDC** | USDC | USDC | **95%** | **Interest accrual only** |
| USDC/WETH | USDC | WETH | 70% | Price volatility |
| USDC/cbBTC | USDC | cbBTC | 70% | Price volatility |
| USDT/WETH | USDT | WETH | 70% | Price volatility |
| USDT/cbBTC | USDT | cbBTC | 70% | Price volatility |

**USDC/USDC (same-token market):** The protocol hardcodes a 1:1 oracle ratio — no external price feed, no circuit breaker impact. LTV gap reduced to 0.5% (vs 8% for volatile markets). Designed for secured working capital lines.

New markets are added by governance and have their own default rate, default LTV, protocol fee, and liquidation incentive.

---

## Summary

| Concept | What it is |
|---|---|
| Intent | Signed message expressing desired outcome |
| Solver | Bot matching compatible intents |
| Isolated loan | Per-match escrow with own terms |
| Same-token market | USDC/USDC — no price risk, 95% LTV |
| LTV | Loan / collateral value ratio |
| Oracle | Hardcoded 1:1 for same-token; Chainlink + Pyth for volatile |
| Grace period | Buffer time after expiry before liquidation |
| Min interest | Floor interest amount per loan |
| Duration range | Min/max for flexible matching |
| Credit history | On-chain repayment record, unlocks higher LTV over time |

---

## Next

- [Credit for Agents](../agents/credit-for-agents.md) — secured working capital for AI agents
- [Agent Working Capital](../developers/agent-working-capital.md) — deposit, borrow, repay via the API
- [Architecture](../protocol/architecture.md) — contracts and flow
