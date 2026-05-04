---
icon: swap
---

# Changelog

Notable changes and updates to the Floe protocol.

## Version History

### v1.5.0 — Agent Awareness Primitives (May 2026)

Lets agents reason about their own credit before committing capital. Answers the three rational-agent questions in one round-trip: "do I have credit?", "is this call worth its cost?", "where am I in the loan lifecycle?".

**REST API (`credit-api.floelabs.xyz`):**

* `GET /v1/agents/credit-remaining` — available USDC, headroom to auto-borrow, utilization in bps, session-cap state.
* `GET /v1/agents/loan-state` — coarse state machine: `idle | borrowing | at_limit | repaying`.
* `GET / PUT / DELETE /v1/agents/spend-limit` — operator-defined session ceiling, enforced inside the proxy paid-request transaction.
* `GET / POST / DELETE /v1/agents/credit-thresholds` — webhook subscriptions for `credit.warning` / `credit.at_limit` / `credit.recovered`. Atomic hysteresis guarantees exactly-once delivery per edge crossing. Cap of 20 per agent.
* `POST /v1/x402/estimate` — preflight an x402-protected URL, return cost + reflection against the calling agent's credit. SSRF-policy-keyed cache for cross-tenant isolation.

**SDK Updates:**

* `floe-agent` (npm) and `floe-agentkit-actions` (PyPI) updated to **0.3.0** — adds 9 agent-awareness actions to `X402ActionProvider`. **45 actions total** (30 Floe + 15 X402: 6 credit-delegation + 9 agent-awareness).
* `@floelabs/mcp-server` (npm) updated to **0.2.0** — adds 9 corresponding MCP tools. **36 tools total**.
* All names are snake_case and identical across REST / MCP / TS / Python: `get_credit_remaining`, `get_loan_state`, `{get,set,clear}_spend_limit`, `{list,register,delete}_credit_threshold`, `estimate_x402_cost`.

**Docs:**

* New concept page: [Agent Awareness](developers/agent-awareness.md) with the decision-loop pattern.
* End-to-end demo: [`examples/agent-awareness.ts`](https://github.com/Floe-Labs/floe-labs-docs/tree/main/examples/agent-awareness.ts) and [`.py`](https://github.com/Floe-Labs/floe-labs-docs/tree/main/examples/agent-awareness.py).

***

### v1.4.0 — Unified Developer Platform + x402 Credit Facilitator (April 2026)

**Developer Platform:**

* **Developer Dashboard** at [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) — manage API keys, webhooks, and agents via wallet sign-in.
* **API Keys** (`floe_live_*`) — programmatic access without per-request wallet signing. See [API Keys](developers/api-keys.md).
* **Webhooks** — push notifications for loan events (`loan.health_warning`, `loan.expiry_warning`, `loan.liquidated`, `loan.repaid`) with HMAC-signed payloads and retry. See [Webhooks](developers/webhooks.md).
* **Unified API** — all endpoints at `credit-api.floelabs.xyz` under one base URL, dual auth (`floe_live_*` developer keys + `floe_*` agent keys). See [Credit REST API](developers/credit-api.md).

**x402 Credit Facilitator:**

* Agents grant a scoped on-chain `setOperator` permission, then call `POST /v1/proxy/fetch` with any x402 URL — the facilitator handles borrowing, EIP-3009 signing, and payment automatically.
* 3-step setup: Create Wallet → Deposit & Delegate → Activate Agent. See [Agent Quickstart](developers/agent-quickstart.md).
* Automated credit health monitoring and graceful wind-down via `POST /v1/agents/close` or `revokeOperator`.
* See [x402 Credit Facilitator](developers/x402-facilitator.md) and [Agent Runtime Contract](developers/agent-runtime-contract.md) for the full API.

**Smart Contract Upgrade #12 (Operator Delegation):**

* `setOperator` / `revokeOperator` / `getOperatorPermission` — scoped, revocable delegation with `borrowLimit`, `maxRateBps`, `expiry`, and `onBehalfOfRestriction`.
* All constraints re-validated at every borrow match — the facilitator provably cannot exceed the agent's bounds.
* Proxy address unchanged: `0x17946cD3e180f82e632805e5549EC913330Bb175`. See [Contract Addresses](../../developers/networks.md).

**Security:**

* SSRF hardening on outbound proxy requests.
* Proxy request rate limiting and domain allowlisting.
* See [Error Codes](reference/error-codes.md) and [Environment Variables](reference/environment-variables.md) for operational reference.

**AgentKit SDK Updates:**

* `floe-agent` (npm) and `floe-agentkit-actions` (PyPI) updated to **0.2.0** — adds `X402ActionProvider` with 6 new actions (36 total). See [AgentKit Integration](developers/agentkit.md).

***

### v1.3.0 — AgentKit, Flash Loans & Safe Support (March 2026)

**AgentKit Integration:**

* **floe-agent** (npm) / **floe-agentkit-actions** (PyPI) — 36 AI agent actions for Floe via [Coinbase AgentKit](https://docs.cdp.coinbase.com/agent-kit/). Supports Vercel AI SDK, LangChain, OpenAI Agents SDK, and MCP server.
* **floe-agent CLI** — interactive terminal agent for testing all 36 actions without framework code.
* Flash Loan and Deploy actions included.

**Flash Loans:**

* Uncollateralized loans borrowed and repaid within a single transaction via `flashLoan()`.
* `FlashArbReceiver` — deployable contract for executing flash arbitrage through Aerodrome DEX on Base.
* Pre-flight checks for fee, liquidity, circuit breaker, and router availability.

**Credit Scores:**

* [Cred Protocol](https://cred.xyz) integration — on-chain credit scores displayed as radar charts and tier badges (Excellent/Good/Fair/New).

**Safe / Multisig Support:**

* Floe loads natively inside the Safe{Wallet} App Store. Automatic detection via RainbowKit, forced on-chain tx mode (no EIP-712 signing).

**Smart Contract Updates:**

* Configurable grace period after loan expiry before liquidation.
* Minimum interest floor for lenders on short-duration loans.
* Duration ranges (min/max) instead of single values for improved matching.

***

### v1.2.0 — Smart Contract Hardening (February 2026)

* Telegram Bot — LendrBot available on Telegram.
* X/Twitter Notifications — intent summaries and post-match alerts.
* Farcaster Mini App.
* DefiLlama TVL tracking.

***

### v1.1.0 — Intent Creation Overhaul (February 2026)

* Preset templates (Conservative, Balanced, Aggressive) for lending and borrowing.
* Real-time risk preview panel with LTV risk levels and liquidation warnings.
* Duration bucket selector (1W, 1M, 3M, 6M, 1Y).
* Redesigned loan cards with LTV donut gauge.
* 4 active markets: USDC/WETH, USDC/cbBTC, USDT/WETH, USDT/cbBTC.

***

### v1.0.0 — Mainnet Launch (January 2025)

* Intent-based P2P lending on Base Mainnet.
* USDC/WETH market with dual-oracle price feeds (Chainlink + Pyth).
* Circuit breaker protection, solver-based matching, liquidation with 5% bonus.
* LendingIntentMatcher proxy: `0x17946cD3e180f82e632805e5549EC913330Bb175`.
* Web app at [app.floelabs.xyz](https://app.floelabs.xyz).

***

## Protocol Parameters

| Parameter              | Value       | Description                                   |
| ---------------------- | ----------- | --------------------------------------------- |
| `minLtvGapBps`         | 800 (8%)    | Min gap between origination & liquidation LTV |
| `withdrawalBufferBps`  | 300 (3%)    | Buffer below liquidation for withdrawals      |
| `stalenessTimeout`     | 3,600 sec   | Oracle staleness threshold                    |
| `maxDeviationBps`      | 1,500 (15%) | Max price deviation before circuit breaker    |
| `sequencerGracePeriod` | 3,600 sec   | Post-recovery wait period                     |
| `liquidationBonus`     | 500 (5%)    | Bonus for liquidators                         |
| `minGracePeriod`       | 86,400 sec  | Min grace period after loan expiry (1 day)    |
| `maxGracePeriod`       | 2,592,000 sec | Max grace period (30 days)                  |

***

## Security

### Bug Bounty

* Program active at security@floelabs.xyz
* Critical: Up to $50,000
* High: Up to $20,000
* Medium: Up to $5,000
* Low: Up to $1,000

### Reporting Issues

1. **Security issues**: security@floelabs.xyz (do not disclose publicly)
2. **General bugs**: GitHub Issues or Discord
3. **Feature requests**: Discord #suggestions

***

## Links

* [Contract Addresses](../../developers/networks.md)
* [Agent Quickstart](developers/agent-quickstart.md)
* [GitHub](https://github.com/Floe-Labs)
* [Discord](https://discord.gg/floelabs)
