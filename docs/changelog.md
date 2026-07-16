---
icon: swap
---

# Changelog

Notable changes and updates to the Floe protocol.

> **Current counts (today):** SDKs `floe-agent` / `floe-agentkit-actions` expose **54 actions** (30 Floe + 24 x402, incl. merchant-allowlist + Floe Inference); `@floelabs/mcp-server` exposes **43 tools**. Per-version numbers in the dated entries below were accurate at the time of that release.

## Version History

### v1.14.0 — Value-aware caps, outcome-quality throttling, LatencyBudget (July 2026)

Spend controls learn about *value* — of the task, of the results, and of time:

* **Value-aware caps** — give a policy operator-set bounds (`limitFloorRaw` / `limitCeilingRaw`) and the caller's `X-Floe-Task-Value` header (bps, `10000` = 1×) scales the effective cap between them: high-value tasks get more headroom, low-value ones less, from one policy definition. Policies without bounds ignore the header; a caller can never raise a cap beyond what the operator provisioned. Enforcement, `/forecast`, and the budget advisory all report the same effective cap.
* **Outcome-quality throttle** — set `qualityThrottleFloorBps` on a policy and the effective cap tightens toward that floor when the agent's caller-reported outcomes (v1.13.0 attribution) degrade — throttle on value delivered, not just dollars spent — and relaxes as quality recovers. No reported outcomes → behavior unchanged (fail-open by design). Floe never judges quality; the signal is the caller's.
* **`LatencyBudget` (floe-guard)** — the open-source guard gains BudgetGuard's time sibling: `LatencyBudget(sla_ms=5000)`, `check(expected_ms)` sheds the next call before it would blow the SLA, `remaining_ms` steers routing, and `advisory().near_deadline` mirrors `near_limit`. Monotonic clock; cooperative (the kill is your framework's job). Python + TypeScript.

→ [Spend Controls — Value-Aware Caps & Quality Throttle](developers/spend-controls.md#value-aware-caps-x-floe-task-value)

### v1.13.0 — Outcome-linked spend attribution: cost per action vs result (July 2026)

Tag paid calls with an `X-Floe-Action-Id` header (accepted on every paid surface — x402 proxy, marketplace, keyless gateway, `/v1/llm`, `/v1/venice`, realtime) and report how each action turned out; Floe joins spend ↔ outcome so you can evaluate what every decision cost against what it produced.

* **Tagging** — `X-Floe-Action-Id` (≤128 chars) rides on the authenticated request; every debit row carries it. Attribution only — never affects budgets (use `X-Floe-Task-Id` for caps).
* **Outcome reporting** — `POST /v1/agents/actions/:id/outcome` (agent key) or `POST /v1/developer/agents/:agentId/actions/:id/outcome` (session): `{ status: success|failure|partial|unknown, scoreBps?, note? }`. Caller-supplied verbatim — Floe never judges quality. Re-reports upsert.
* **Eval view** — `GET /v1/developer/agents/:id/actions` returns calls / settled spend / outcome per action; new *Actions* panel on the dashboard agent page.
* **SDK (`floe-agent`)** — `fetch({ actionId, taskId })` sends the tags; new `reportOutcome(actionId, { status, scoreBps, note })`.

→ [Agent Runtime Contract — Outcome-Linked Spend Attribution](developers/agent-runtime-contract.md#outcome-linked-spend-attribution)

### v1.11.0 — Per-agent kill-switch: pause/resume + suspend-on-breach policies (July 2026)

Two ways to stop a runaway agent without touching the rest of your fleet:

* **Self-serve pause/resume** — `PATCH /v1/developer/agents/:id/status { "status": "suspended" | "active" }` (plus a Pause/Resume toggle on the dashboard agent page). A paused agent's calls are rejected at authentication; resume restores it. No key rotation, no close.
* **Policy-triggered auto-suspend** — spend policies gain an `action` field. `action: "suspend_agent"` turns any cap (task / api / vendor / session) into a kill-switch: the breaching call is declined with `"auto_suspended": true` on the 402 body, **and** the agent is suspended automatically — its record's `suspendedReason` reads `policy:<id>` for audit. Fail-closed denials (unresolvable host/recipient) never trip it.

→ [Spend Controls — Breach Action & Pause/Resume](developers/spend-controls.md#breach-action-the-policy-kill-switch)

### v1.10.0 — Sarvam AI: sovereign Indic inference (July 2026)

Added **Sarvam AI** — India's sovereign-AI stack for **22+ Indian languages** — as a Floe-verified vendor. Keyless: Floe holds the Sarvam subscription key and meters each call to your credit line (Sarvam's INR list at ~₹83/$ + 5% Floe margin).

* **Chat** — `sarvam/sarvam-105b` (128K ctx) and `sarvam/sarvam-30b` (64K ctx) on the OpenAI-compatible gateway (`POST /v1/chat/completions`, model `sarvam/<id>`), metered per token
* **Voice & language via the [marketplace shim](developers/marketplace-shim.md)** (`POST /v1/proxy/fetch`): Bulbul **TTS** (`/v1/tts/sarvam`), Saaras **STT** (`/v1/stt/sarvam`) and **speech-translate** (`/v1/stt-translate/sarvam`), Mayura **translation** (`/v1/translate/sarvam`), **transliteration** (`/v1/transliterate/sarvam`), **language ID** (`/v1/lid/sarvam`), and **Sarvam Vision** document digitization (`/v1/doc/sarvam`, async · preview)

→ [Sarvam AI — Indic Inference](developers/sarvam.md) · [Compute](x402-directory/compute.md#sarvam-ai-chat-completions) · [Voice](x402-directory/voice.md#sarvam-ai-text-to-speech)

### v1.9.0 — Floe Inference: keyless pay-as-you-go LLM & voice (June 2026)

**Floe Inference (FLO-602)**

One OpenAI-compatible endpoint to call LLMs, embeddings, and voice models and pay **per call** from your Floe balance — no provider account, no provider key, no wallet. Floe routes each call to the cheapest available source, meters exact usage, and debits your balance (your balance is the hard ceiling).

* **Endpoints** (base `https://credit-api.floelabs.xyz/v1`): `chat/completions`, `embeddings`, `audio/speech`, `audio/transcriptions`, `realtime` (WS), `models`, `estimate`
* **Rails** — `direct-account`, `self-host`, `venice`, `x402-router`, `byok` (your key, fee only), `free`; cheapest available wins, with transparent cross-rail fallback on upstream 5xx/429
* **Metering** — per token (text/realtime), per character (TTS), or per audio second (STT); a 5% Floe margin over metered upstream cost, returned in `X-Floe-Cost-USDC`
* **Estimate before you spend** — `POST /v1/estimate` prices a usage vector without making the call

→ [Floe Inference docs](developers/keyless-inference.md)

**Voice (FLO-606)**

* **OpenAI-native audio on the gateway** — `openai/tts-1` (per character), `openai/whisper-1` (per audio second)
* **Realtime** — OpenAI (`gpt-realtime`) and Google (`gemini-live`), metered per completed turn
* **Third-party voice vendors** — ElevenLabs, Cartesia, Google Cloud (TTS) and Deepgram, AssemblyAI (STT) are served through the [Vendor Marketplace](../x402-directory/voice.md) via `POST /v1/proxy/fetch` (keyless, billed to your Floe balance), not the OpenAI-compatible gateway surface

**Closed-model coverage (direct-account)**

Keyless closed LLMs added to the gateway catalog (OpenAI-compatible, Floe-fronted accounts): **xAI Grok**, **Mistral**, **Cohere Command**, **DeepSeek** (direct API), **Z.AI/Zhipu GLM**, **Moonshot Kimi**, **Perplexity Sonar** — alongside the existing OpenAI, Anthropic, Google. Plus OpenAI audio `tts-1-hd`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`. Each is a catalog row + Floe-held key; browse the live set with `GET /v1/models`.

**MCP + AgentKit**

* MCP: `list_models`, `estimate_inference_cost` (**43 tools** total)
* AgentKit (TypeScript + Python): `list_inference_models`, `estimate_inference_cost` (**54 actions** total, full TS/Python parity)

### v1.8.0 — Spend Controls, Vendor Marketplace, Welcome Credit (June 2026)

**Spend Controls (FLO-577)**

Programmable budgets for agent wallets. Cap spending per vendor, per API hostname, per task, or across your whole team — with rolling or calendar-based time windows.

* **Vendor policies** — cap spend per payee wallet address (e.g. "$20/day to Venice AI")
* **API policies** — cap spend per hostname or domain suffix (e.g. "$50/week to *.openai.com")
* **Task policies** — budget per `X-Floe-Task-Id` header
* **Team policies** — caps that roll up across all agent wallets owned by a developer
* **Time-bound windows** — `effectiveFrom` / `effectiveUntil` for scheduled budgets
* API: `POST/PATCH/DELETE /v1/agents/policies` (agent key) and `/v1/developer/policies` (team)
* Dashboard: per-agent policies section + team policies in settings

→ [Spend Controls docs](developers/spend-controls.md)

**Vendor Marketplace**

Curated directory of verified x402 vendor API services callable with Floe. 2,000+ vendor API services across categories.

* **Categories**: Compute, Voice, Image, Text, Search, Browser, Agent Tools
* **Services**: Venice AI (9 endpoints), Exa (2), Firecrawl (2), Tavily (1), Parallel AI (3), Hyperbrowser (2), Browserbase (1), Anchor Browser (1), dTelecom STT (1), AgentMail (2), Pinata Cloud (1), PostalForm (2)
* Dashboard: Vendor Marketplace page with category filters, detail pages with code examples (cURL, TypeScript, Python)

→ [x402 API Directory](../x402-directory/README.md)

**Welcome Credit**

New developer's first agent wallet receives $2 USDC from treasury. Strict Privy policy blocks outbound transfers until $1.90 is spent via x402 — then policy swaps to standard. Feature-flagged via `WELCOME_CREDIT_ENABLED`.

**Other changes**

* **Agent Wallets rename** — "Agents" → "Agent Wallets" throughout the dashboard for clarity
* **Session persistence** — sliding cookie refresh (active users no longer logged out at 7 days), global 401 interceptor with re-auth prompt, error UI on agents page
* **`X-Floe-Payment-Amount` header** — human-readable decimal USDC amount on every paid response (e.g. `0.005000`), alongside existing `X-Floe-Cost-USDC` raw units
* **`GET /v1/developer/balances`** — developer wallet balance, agent wallets balance, and available API credits in one call
* **MCP security fix** — CORS restricted to localhost origins (was `*`), shared-key fallback rejects untrusted cross-origin requests

---

### v1.7.1 — x402 v2 Wire Protocol Support (May 2026)

The facilitator now negotiates between **x402 v1 and x402 v2** per request based on what the merchant returns. Previously, only the v1 bare-requirement envelope was understood, which caused parse failures against modern `@x402/hono` and other v2-compliant servers — and which made the v2 entries already published in the [Floe x402 directory](../../x402-directory/directory.json) unreachable in practice.

**What changed:**

* `parsePaymentRequired` now accepts either a v1 bare `PaymentRequirement` (single or array) or a v2 `{ x402Version, accepts, resource, error, extensions }` envelope, and normalizes the renamed `amount` field back to the internal `maxAmountRequired` shape.
* On the outbound side, the signed payment header is written as `PAYMENT-SIGNATURE` when the merchant advertised v2, or `X-PAYMENT` for v1 — picked automatically per request.
* The settlement response header (`PAYMENT-RESPONSE` in v2, `X-PAYMENT-RESPONSE` in v1) is base64-decoded when it carries a v2 `SettlementResponse`; the `transaction` field becomes the recorded tx hash. v1 strings still pass through unchanged.
* `GET /v1/proxy/check` surfaces the negotiated `x402Version` and, on parse failure, a typed `code` (`invalid_base64` / `invalid_json` / `no_compatible_requirement`) so misformatted upstreams are diagnosable without a redeploy.

**What didn't change:**

* EIP-3009 `TransferWithAuthorization` typed data and signing — identical between v1 and v2.
* Reservation lifecycle (RC-12), idempotency keys, rate limits, agent registration, and credit-line opening flows.
* The supported asset (USDC) and network (Base mainnet); CAIP-2 `"eip155:8453"` and the short name `"base"` are both still accepted.

**Why this matters:** developers running v2 merchants no longer hit "Failed to parse PAYMENT-REQUIRED header" against Floe, and the directory's v2 entries (Firecrawl, Exa, Soundside, Freepik, and the rest) now negotiate correctly. Spec refs: [x402-specification-v2.md](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md), [transports-v2/http.md](https://github.com/x402-foundation/x402/blob/main/specs/transports-v2/http.md), [CDP migration guide](https://docs.cdp.coinbase.com/x402/migration-guide).

---

### v1.7.0 — Unified Agent Registration + Managed Credit Line (May 2026)

The legacy single-agent registration path is removed. All agent provisioning now flows through the same dashboard surface that multi-agent uses (`POST /v1/developer/agents`), authenticated by a dashboard session, a `floe_live_*` developer key, or a wallet signature. Provisioning is intentionally decoupled from credit-line opening: a new server-signed endpoint mints the facility loan from the agent's managed Privy wallet (USDC/USDC market).

**Removed (breaking):**

* `POST /v1/agents/pre-register` and `POST /v1/agents/register` — replaced by `POST /v1/developer/agents` (provision) + `POST /v1/developer/agents/:id/keys` (mint).
* `developers.agentApiKeyHash` legacy fallback in `api_key_auth` middleware — all agents now resolve via the `api_keys` table.

**Added:**

* `POST /v1/developer/agents/:agentId/open-credit-line` — server-signs `registerBorrowIntent` from the agent's managed Privy wallet in the USDC/USDC market. Body: `{ depositRaw, maxLtvBps?, maxRateBps? }`. Default LTV 9500 (95%, the same-token market cap). Returns `{ loanId, registerTxHash, approveTxHash?, principalRaw, status: 'pending_on_chain' }`. The existing `FacilityLoanReconciler` advances the row to `pending_match` once the receipt confirms; the solver matches it asynchronously. Idempotent via the `Idempotency-Key` header. **This is the step that makes a managed agent's `creditIn` non-zero** — without calling it, `/proxy/fetch` returns `insufficient_balance`.

**SDK migration (`floe-agent` v0.4.0 / `floe-agentkit-actions` v0.4.0):**

* New subcommands: `floe-agent register`, `agents`, `use`, `rotate`, `revoke`, `open-credit-line`. Each developer can register up to 5 agents from the CLI.
* Per-agent API keys now live in the OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) via `@napi-rs/keyring` / `keyring`. Falls back to `FLOE_AGENT_KEY_<NAME>` env vars in headless environments.
* `grant_credit_delegation` action rewired to the new provisioning flow. The schema gains a required `name`; the `facilitatorAddress` / `collateralToken` / `collateralApproval` fields are removed (the server's Privy wallet handles on-chain delegation and collateral). Return message points users at the new `open_credit_line` step.
* New `open_credit_line` action — calls `POST /v1/developer/agents/:id/open-credit-line` with wallet-signed auth and prints the resulting `loanId` + tx hashes. Available in both TS and Python SDKs.
* `revoke_credit_delegation` and `check_credit_delegation` unchanged — still pure on-chain operations against the lending matcher.

**MCP server (`@floelabs/mcp-server`):**

* No code change; remote endpoint and stdio mode already accept per-request Bearer tokens. README + `.env.example` clarify that `floe_*` agent keys are the recommended credential — `floe_live_*` developer keys still work but disable the agent-awareness tools.

**Why this matters:** one registration path, one key model, one explicit "open the credit line" step. Splitting provisioning from credit-line opening makes the lifecycle visible: developers see exactly when their agent gains spendable USDC instead of having it bundled invisibly into registration.

---

### v1.6.0 — Same-Token Markets, Fiat On-Ramp, Multi-Agent (May 2026)

**Same-Token Markets (Upgrade #13):**

* **USDC/USDC market live on Base Mainnet.** Deposit USDC, borrow up to 95% as working capital. No price-volatility risk — the oracle returns a hardcoded 1:1 ratio.
* New protocol constants: `SAME_TOKEN_MAX_LTV_BPS` (99.5% cap), `SAME_TOKEN_MIN_LTV_GAP_BPS` (0.5% gap). Normal markets (WETH/USDC, cbBTC/USDC) are completely unaffected.
* Oracle `getPrice()` and `getPriceChecked()` short-circuit for same-token pairs — immune to Chainlink staleness, circuit breaker, and sequencer downtime.
* Market ID: `0x5027ae5ed5c85380c5dfa34a79915f41f139f4e859f56d15a6f958ea6b662820`
* 4 contracts upgraded: `LendingLogicsManager`, `LendingCalcLib`, `LendingViewsUpgradeable`, `PriceOracleUpgradeable`

**Fiat On-Ramp:**

* **Buy USDC from the Developer Dashboard** via Coinbase CDP. Credit card, debit card, or bank transfer — USDC lands directly in your agent's wallet on Base. No crypto bridges needed.
* `POST /v1/onramp/session-token` mints a CDP session token for authenticated developers
* Webhook verification via Hook0 HMAC-SHA256 for audit trail

**Multi-Agent System:**

* **Up to 5 agents per developer**, each with independent credit limits, rate caps, and delegation expiry.
* New API routes: `GET/POST /v1/developer/agents`, `GET /v1/developer/agents/:id`, `POST /v1/developer/agents/:id/close`, key management per agent.
* Agent modes: `managed` (new, server-provisioned) and `legacy` (existing SDK-registered agents).
* Per-agent session spend limits via `PUT /v1/agents/spend-limit`.

**New Webhook Events:**

* `credit.utilization_warning` — fires when borrowed principal exceeds 80% of credit limit.
* `delegation.expiry_warning` — fires 7 days and 24 hours before operator delegation expires.

---

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

* Telegram and X/Twitter notifications — intent summaries and post-match alerts.
* Farcaster Mini App.
* DefiLlama TVL tracking.

***

### v1.1.0 — Intent Creation Overhaul (February 2026)

* Preset templates (Conservative, Balanced, Aggressive) for lending and borrowing.
* Real-time risk preview panel with LTV risk levels and liquidation warnings.
* Duration bucket selector (1W, 1M, 3M, 6M, 1Y).
* Redesigned loan cards with LTV donut gauge.
* Active markets: USDC/USDC, USDC/WETH, USDC/cbBTC.

***

### v1.0.0 — Mainnet Launch (January 2025)

* Intent-based P2P lending on Base Mainnet.
* USDC/WETH market with dual-oracle price feeds (Chainlink + Pyth).
* Circuit breaker protection, solver-based matching, liquidation with 5% bonus.
* LendingIntentMatcher proxy: `0x17946cD3e180f82e632805e5549EC913330Bb175`.
* Web app at [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz).

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
