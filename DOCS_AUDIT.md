# Floe Labs Docs — Reality Audit (Report Only)

**Scope:** every Markdown file in `floe-labs-docs` plus cross-checks against `floe-cookbook`, the SDK/MCP source, and `developers/networks.md`.
**Mode:** REPORT ONLY. No published file was edited. This file is the only artifact created.
**Date generated:** 2026-06-09.

> **Branch caveat.** The docs working tree is on `docs/crewai-budget-agents`, not `main`. The published GitBook renders `main`. A few files (`docs/getting-started/quickstart.md`, `docs/getting-started/funding.md`, `docs/developers/self-custody.md`, `docs/frameworks/crewai.md`) are already partly reframed on this branch and may differ from what is live. Findings below are against the working tree; re-confirm against `main` before editing live.

> **Source-of-truth note.** The SDK/MCP sibling repos are checked out on their **open PR branches** (`feat/ts-merchant-allowlist-parity`, `feat/crewai-integration`, `feat/mcp-merchant-allowlist-parity`), i.e. the **post-merge** state. Counted there: TS x402 provider = 22 actions, Py x402 provider = 22, MCP = 41 tools, both Floe providers = 30. Subtracting the 5 unmerged allowlist actions/tools yields **main = 47 SDK / 36 MCP**, confirming the supplied ground-truth numbers. Post-merge = **52 SDK / 41 MCP**.

---

## 1. Summary — offending instances by category

| Category | Count (instances) | Worst-hit files |
|---|---|---|
| `discontinued-product` (LendrBot / Lendr, 3,000+ lines, zero defaults) | 11 | `README.md`, `docs/agents/credit-for-agents.md`, `docs/components/secured-credit.md`, `llms.txt`, `docs/glossary.md`, `docs/changelog.md` |
| `dead-link` (`app.floelabs.xyz`) | 2 published + 3 in unpublished draft | `docs/getting-started/quick-start.md` (orphan), `docs/changelog.md` |
| `not-live-as-live` (credit lines / live rates / borrow as GA) | ~20 | `docs/agents/fiat-to-x402.md`, `docs/agents/quickstart-agents.md`, `docs/agents/credit-for-agents.md`, `docs/components/secured-credit.md`, `docs/developers/agent-working-capital.md`, `docs/developers/x402-facilitator.md`, `README.md` |
| `number-drift` (45 actions; 13,000+; vendor count 27 vs 60; market LTV 70 vs 75; USDT markets) | ~22 | many (see §2) |
| `positioning` (lending / P2P / yield as headline; non-custodial wallet) | ~15 | `faq/general.md`, `docs/protocol/architecture.md`, `docs/getting-started/core-concepts.md`, `docs/components/wallet.md`, `llms.txt` |

Two **internal contradictions** stand out and should be treated as high priority:
1. `docs/getting-started/quickstart.md` correctly says the agent wallet is **custodial** ("Each agent has its own custodial wallet that we operate on your behalf"), while `docs/components/wallet.md` headlines it as **"non-custodial… Keys live with you."** Same product, opposite claim, both published.
2. The market list and LTV ceilings disagree across at least five pages (see §2.4).

---

## 2. Inventory — file → line → claim → category

### 2.1 `discontinued-product`

| File | Line | Exact claim | Category |
|---|---|---|---|
| `README.md` | 104 | "3,000+ lines · zero defaults" (Secured working capital row) | discontinued-product |
| `README.md` | 116 | "**3,000+** secured working capital lines issued through Floe" | discontinued-product |
| `README.md` | 117 | "**Zero** defaults or losses" | discontinued-product |
| `docs/agents/credit-for-agents.md` | 5 | "**3,000+ secured working capital lines issued. Zero defaults or losses.**" | discontinued-product |
| `docs/components/secured-credit.md` | 7 | "**3,000+ lines issued · zero defaults.**" | discontinued-product |
| `llms.txt` | 3 | "3,000+ lines issued, zero defaults" | discontinued-product |
| `docs/glossary.md` | 42–43 | "## Lendr — Floe's AI assistant. Chat with it…" | discontinued-product |
| `docs/changelog.md` | 222 | "Telegram Bot — **LendrBot** available on Telegram." | discontinued-product |
| `floe-docs-optimization/12_roadmap.md` | 21 | "✅ LendrBot (in-app + on Telegram + on X)" | discontinued-product (unpublished draft) |
| `floe-docs-optimization/01_introduction.md` | 72 | "In-app chat: LendrBot (humans)" | discontinued-product (unpublished draft) |
| `floe-docs-optimization/14_llms.txt` | 32 | "[LendrBot]… AI assistant in-app and on Telegram / X" | discontinued-product (unpublished draft) |

`.claude/agents/orchestrator.md:24` also references "Lendr AI chatbot" but is an internal agent config, not published docs — leave to repo owners.

### 2.2 `dead-link`

| File | Line | Exact claim | Category |
|---|---|---|---|
| `docs/getting-started/quick-start.md` | 17 | "Go to [app.floelabs.xyz](https://app.floelabs.xyz)" | dead-link (file is an **orphan** — not in `SUMMARY.md`) |
| `docs/changelog.md` | 245 | "Web app at [app.floelabs.xyz](https://app.floelabs.xyz)." | dead-link |
| `floe-docs-optimization/01_introduction.md` | 35, 69 | "App: [app.floelabs.xyz]" | dead-link (unpublished draft) |
| `floe-docs-optimization/14_llms.txt` | 3 | "App: app.floelabs.xyz" | dead-link (unpublished draft) |

No instances of `x402.floelabs.xyz`, `x402.floe.xyz`, or `floe.run` found anywhere. The live hosts in use are correct: `dev-dashboard.floelabs.xyz`, `credit-api.floelabs.xyz`, `mcp.floelabs.xyz`.

### 2.3 `not-live-as-live` (credit lines / live rates / auto-borrow presented as shipped)

Per ground truth, working-capital credit lines, any live rate, and "stop pre-funding" are **roadmap, not GA/Preview**. The live model is a **prepaid USDC balance** paid out through the x402 proxy (correctly described only in `quickstart.md`, `funding.md`, `agent-quickstart.md`'s "$2 free credit" framing, and `self-custody.md`).

| File | Line(s) | Exact claim | Category |
|---|---|---|---|
| `README.md` | 25–29 | Step 3 "Open a credit line… Floe issues a USDC credit line against your deposit — up to 95% LTV" | not-live-as-live |
| `README.md` | 104 | Secured working capital badged **`GA`** | not-live-as-live |
| `docs/components/secured-credit.md` | 5 | Title "Secured working capital **`GA`**" | not-live-as-live |
| `docs/components/secured-credit.md` | 15–19, 25–42 | `instant_borrow` / `repay_loan` / `repay_and_reborrow` presented as live GA actions | not-live-as-live |
| `docs/components/unsecured-credit.md` | 5, 7 | "Unsecured working capital **`Preview`**"; "Real-time underwriting on deterministic cashflows" — ground truth says unsecured/receivables credit must be **roadmap**, never Preview-available | not-live-as-live |
| `docs/agents/credit-for-agents.md` | 11, 23–29, 36–46, 65–69 | "borrows up to 95% back as working capital" as live; "Higher LTV (up to 150% … underwritten by receivables)"; rate table | not-live-as-live |
| `docs/agents/fiat-to-x402.md` | 3, 13, 36–53, 87–97, 105 | "Get a USDC credit line"; `instant_borrow` live step; `repay_credit`; **"Fixed interest rate … typically 5–10% APR"** (a live rate) | not-live-as-live |
| `docs/agents/quickstart-agents.md` | 3, 64–82, 86–95 | "borrow up to 95% instantly"; `instant_borrow` as the happy path | not-live-as-live |
| `docs/developers/agent-working-capital.md` | 7, 11 | "Floe provides AI agents with instant credit lines — deposit USDC, borrow up to 95%" | not-live-as-live |
| `docs/developers/x402-facilitator.md` | 7 | "delegate your collateral and the facilitator handles everything" (auto-borrow-against-credit framing) | not-live-as-live |
| `docs/getting-started/core-concepts.md` | 228–229 | "Credit for Agents — secured working capital"; "deposit, borrow, repay via the API" | not-live-as-live |
| `docs/frameworks/crewai.md` | 61 | "auto-borrows USDC against your credit line" | not-live-as-live |
| `docs/changelog.md` | 74, 83, 89–97, 105, 167–169 | v1.6/v1.7 entries document "open-credit-line", "managed credit line", auto-borrow as shipped | not-live-as-live (see VERIFY-1) |

<!-- VERIFY-1 (NON-BLOCKING — cross-team follow-up, not a docs placeholder): the docs already treat the credit/borrow layer as "in development" per the ground-truth override, so no published page asserts it as live. This note remains only as a standing flag for backend-dev to confirm the prod status of /v1/credit/instant-borrow, /v1/developer/agents/:id/open-credit-line, and /v1/credit/offers, and to reconcile the v1.6/v1.7 changelog entries that describe them as shipped. Does not block this PR. -->

### 2.4 `number-drift`

**Action / tool counts** — docs say **45** SDK actions and **36** MCP tools. Verified current `main` = **47** SDK / **36** MCP; post-merge = **52** / **41**. So every "45" is wrong now; "36 tools" is correct for MCP on main but will need updating to 41 when the allowlist PR merges.

| File | Line | Claim | Should be (main / post-merge) |
|---|---|---|---|
| `docs/developers/agentkit.md` | 20, 25, 31 | "45" SDK actions | 47 / 52 |
| `docs/developers/agentkit-typescript.md` | 7, 68, 125 | "45 total actions" | 47 / 52 |
| `docs/developers/agentkit-python.md` | 7, 9 | "45 total actions"; parity note enumerates 30+6+9 | 47 / 52 (30+17 split, not 30+6+9) |
| `docs/frameworks/agentkit.md` | 7 | "same 45 actions" | 47 / 52 |
| `docs/frameworks/openai.md` | 31 | "same 45 actions" | 47 / 52 |
| `docs/getting-started/core-concepts.md` | 176, 185 | "45 actions" (x2) | 47 / 52 |
| `docs/agents/credit-for-agents.md` | 84 | "45 actions" | 47 / 52 |
| `docs/agents/quickstart-agents.md` | 31, 95 | "45 actions" (x2) | 47 / 52 |
| `docs/glossary.md` | 97 | "45 actions (30 lending + 6 x402 + 9 agent-awareness)" | 47 / 52 |
| `docs/developers/agent-working-capital.md` | 110 | "other **36** Floe actions" (conflates MCP tool count with SDK) | 47 / 52 |
| `docs/developers/agent-quickstart.md` | 348 | "45 actions" | 47 / 52 |
| `docs/developers/mcp-server.md` | 7 | "**36** tools" | 36 (OK now) / 41 |
| `docs/frameworks/openai.md` | 24 | "all 36 Floe MCP tools" | 36 (OK now) / 41 |
| `docs/frameworks/claude-mcp.md` | 30 | "All 36 Floe MCP tools" | 36 (OK now) / 41 |
| `docs/frameworks/elizaos.md` | 24 | "36 Floe MCP tools" | 36 (OK now) / 41 |
| `llms.txt` | 31 | "36 tools" | 36 (OK now) / 41 |

`docs/changelog.md:145` ("45 actions total"), `:146` ("36 tools total"), `:186` ("36 total"), `:194–195` ("36 actions") are **dated historical entries** (v1.5.0 / v1.4.0 / v1.3.0). They were accurate for those releases. Lower priority, but `:145` will read as the current count to a casual reader — consider a "(current: 47 / 52 after allowlist)" note rather than rewriting history.

**Vendor / API count** — three different live numbers:

| File | Line | Claim | Category |
|---|---|---|---|
| `README.md` | 42, 118 | "27 verified endpoints" / "**27** verified x402 API endpoints across 7 categories" | number-drift |
| `docs/changelog.md` | 29 | "27 endpoints across 7 categories" | number-drift |
| `docs/components/x402.md` | 7 | "any of **13,000+ x402 APIs**" | number-drift |
| `docs/components/x402.md` | 63 | "**60** verified APIs you can call today" | number-drift |
| `docs/developers/x402-facilitator.md` | 11 | "Works with **13,000+** existing x402 APIs" | number-drift |
| `docs/frameworks/crewai.md` | 61 | "any of the **13,000+** x402 endpoints" | number-drift |

<!-- VERIFY-2 (RESOLVED 2026-06-09): vendor count confirmed as "2,000+ vendor API services". All 27 / 60 / 13,000+ instances were replaced with that phrasing across the published docs. -->

**Market list / LTV drift** (canonical = `developers/networks.md`):

| File | Line | Claim | Conflict |
|---|---|---|---|
| `developers/networks.md` | 54–60 | 5 markets incl. USDT/WETH, USDT/cbBTC; volatile LTV **70%** | canonical |
| `docs/components/secured-credit.md` | 46–50 | WETH/cbBTC LTV **75%**; "USDC/USDC up to 99.5%" | LTV mismatch (70 vs 75) |
| `faq/general.md` | 27–32 | "4 tokens across 4 active markets: USDC/WETH, USDC/cbBTC, USDT/WETH, USDT/cbBTC" — **omits USDC/USDC entirely** | market-list drift |
| `docs/getting-started/core-concepts.md` | 76–82 vs 195–201 | one table lists 3 markets (USDC/USDC, WETH, cbBTC), a second duplicate table lists 5 incl. USDT | internal contradiction |
| `docs/glossary.md` | 46 | 5 markets incl. USDT | vs CLAUDE.md "3 active markets" |

<!-- VERIFY-3 (RESOLVED 2026-06-09): confirmed against modular-lending/script/deploy/deployments/8453.json and project CLAUDE.md — no live USDT market (USDT only appears as hypotheticals in modular-lending/docs design docs). Canonical 3-market list stands: USDC/USDC (95%), WETH/USDC (70%), cbBTC/USDC (70%). USDT markets removed from networks.md and downstream; 75% → 70% LTV drift fixed. -->

### 2.5 `positioning` (lending / P2P / yield as headline; custody)

| File | Line | Claim | Category |
|---|---|---|---|
| `faq/general.md` | 9 | "Floe is a peer-to-peer, intent-based lending protocol on Base." (opening definition) | positioning |
| `faq/general.md` | 11–19 | Aave/Compound comparison as the framing | positioning |
| `faq/general.md` | 74–79 | "## Lending → How do I earn interest?" | positioning (yield) |
| `faq/general.md` | 40, 24 | "Connect wallet with ETH on Base" as the entry path | positioning (contradicts walletless) |
| `docs/protocol/architecture.md` | 11 | "Floe is an **intent-based peer-to-peer lending protocol**" | positioning (acceptable in a clearly-Advanced section, but page is not labeled Advanced) |
| `docs/getting-started/core-concepts.md` | 1–5 | "The mechanics behind Floe's credit protocol — intents, isolated loans, matching engine" as a **Getting Started** page | positioning |
| `docs/components/wallet.md` | 5, 7, 13 | "non-custodial smart-contract wallet… Keys live with you" | positioning (contradicts walletless/custodial default; see §1) |
| `docs/changelog.md` | 241 | "Intent-based P2P lending on Base Mainnet" (v1.0.0 — historical, lower priority) | positioning |
| `README.md` | 102 | Agent Wallet "Non-custodial wallet with programmable spend limits" | positioning |
| `README.md` | 115 | "100M+ machine payments via x402 since May 2025" | positioning (unverified superlative; not on the explicit removal list — flag, don't auto-remove) |
| `README.md` | 124 | "Intent-based matching. No pools." in "What's underneath" — acceptable as demoted Advanced content | positioning (OK if kept under Advanced) |
| `llms.txt` | 3 | "Floe is the credit bureau and capital rail for AI agents. Deposit USDC, borrow up to 95%…" — leads with lending, not spend/walletless | positioning |
| `docs/agents/fiat-to-x402.md` | 24 | Step 1 "connect any EVM wallet (MetaMask, Coinbase Wallet…)" | positioning (contradicts walletless onboarding) |
| `docs/agents/quickstart-agents.md` | 10 | "An EVM wallet your agent controls (private key, CDP, Privy, Turnkey…)" as a requirement | positioning |

The `floe-docs-optimization/` folder (15 files) is an **unpublished** internal restructuring draft (not in `SUMMARY.md`, does not render on GitBook). It is positioned around a "three credit tiers / receivables / institutions" story that is **further** from current ground truth than the live docs, and it reintroduces LendrBot, `app.floelabs.xyz`, and receivables-as-near-term-product. Recommend deleting it or moving it out of the repo; do not let it leak into nav.

---

## 3. Number verification (spot-checked against source)

| Claim in docs | Verified value | Evidence |
|---|---|---|
| SDK "45 actions" | **47 on main / 52 post-merge** | `agentkit-actions/src/floeActionProvider.ts` = 30 `@CreateAction`; `x402ActionProvider.ts` = 22 on the open PR branch (= 17 on main + 5 allowlist). `agentkit-actions-py` matches: `action_provider.py` 30, `x402_action_provider.py` 22. |
| MCP "36 tools" | **36 on main / 41 post-merge** | `floe-mcp-server/src/tools/index.ts` = 41 tool registrations on `feat/mcp-merchant-allowlist-parity` (= 36 main + 5 allowlist). |
| Py "30 + 6 + 9" split | The X402 provider is a single 17→22 action group; the "6+9" historical split is stale | `x402ActionProvider.ts` action names include 4 x402 + 9 awareness + 4 delegation + 5 allowlist on branch. |
| "27 verified endpoints" / "60 verified" / "13,000+" | **resolved → "2,000+ vendor API services"** (VERIFY-2) | was conflicting across `README.md`, `x402.md`, `changelog.md` |
| Volatile LTV "70%" vs "75%" | networks.md (canonical) = **70%** | `developers/networks.md:57–60` |
| USDT markets live? | **resolved → no** (VERIFY-3, confirmed vs 8453.json) | canonical 3-market list stands; USDT removed |

---

## 4. Example run-status (cross-check `floe-cookbook`)

"Runs today" = executes end-to-end against **live** functionality (prepaid x402 proxy, hosted MCP, spend controls, agent-awareness reads). Anything depending on `instant_borrow` / `repay_loan` / `repay_credit` / `open_credit_line` / managed `grant_credit_delegation` is on the **not-live credit path**. Anything importing `crewai_floe` depends on the unmerged PR #27.

| Example | What it calls | Runs today on LIVE? | Notes |
|---|---|---|---|
| `mcp-demo` | hosted MCP config only (`mcp.floelabs.xyz/mcp`) | **Yes** | Config-only; MCP server is live (36 tools on main). |
| `vapi-voice-agent` | `POST /v1/proxy/fetch` with x402 endpoints, prepaid balance | **Yes** (needs funded `FLOE_API_KEY`) | Pure spend-layer path. `server.ts:16` uses the live proxy. Cleanest live example. |
| `financial-os-loop` | **Executes** `instant_borrow`, `repay_loan` (TS `index.ts:54,80`; Py `main.py:51,78`) | **No** | Real `agentkit.run` calls on the not-live credit path → will hit `insufficient_balance`/no offer. |
| `langchain-agent` | `instant_borrow`, `check_credit_status`, `repay_credit` (`agent.py`) | **No** | Not-live credit path. |
| `yield-optimizer` | **Narrates** `instant_borrow`/`check_credit_status`/`repay_credit` via `console.log` only (`index.ts`); self-custody WETH | **No** (and doesn't truly execute) | Illustrative walkthrough, not a runnable loop; advanced/self-custody on-chain lending. |
| `x402-client` | **Narrates** `grant_credit_delegation`/`x402_fetch`/`x402_get_balance` via `console.log` only | **No** (executes nothing) | Represents managed credit delegation (not-live) + `x402_fetch` (live). Rewrite to actually call the live prepaid `fetch`. |
| `agentkit-ts-chatbot` | Generic LLM loop with floe-agent providers wired; `index.ts` does not hardcode `instant_borrow` (LLM decides) | **Partial / VERIFY** | Could call live `x402_fetch` or not-live `instant_borrow` depending on prompt. README narrative (lines 32–38) leads with borrow/repay (not-live). |
| `crewai-demo` | imports `crewai_floe` (`FloeBudget`, `Floe402Tool`, `budget_enabled_agent`) | **No — blocked** | `crewai-floe` only exists on unmerged `agentkit-actions-py` PR #27; README line 22 admits the git-install workaround. |
| `flash-arb-bot` | flash-loan / MEV arbitrage via `FlashArbReceiver` | **No** | Advanced/self-custody on-chain; not the spend path. |
| `openai-agents` | README only → hosted MCP | **Yes (conceptually)** | No runnable code in the dir; points to live MCP. |

**Live-today, no caveats:** `mcp-demo`, `vapi-voice-agent`, `openai-agents` (pointer). **Everything else is built on the not-live credit path, narrates rather than executes, or is blocked on unmerged PR #27.** Do not advertise the credit-loop examples as "runnable today."

---

## 5. Proposed corrections per file (OUTLINE — not applied)

**Restructuring principle:** lead with the spend/payment + walletless/no-crypto story (the model `docs/getting-started/quickstart.md` already nails). Collapse intent-matching, solver/liquidation, collateral mechanics, flash loans, and self-custody into a clearly-labeled **Advanced / on-chain (self-custody)** section. Keep the on-chain lending docs — reframe and demote, do not delete. Label all credit-line content **"In development / roadmap."**

- **`README.md`** — Drop "3,000+ lines / zero defaults" (116–117), drop the proof-points block (115–118) or replace with verified spend metrics; reframe Step 3 (25–29) from "open a credit line" to "fund a prepaid balance"; change Secured-working-capital row badge from `GA` to a roadmap label; fix Agent Wallet "Non-custodial" (102) to "custodial by default, self-custody optional"; reconcile vendor count (42, 118) to the one verified number.
- **`docs/components/wallet.md`** — Rewrite headline from "non-custodial… keys live with you" to the walletless/custodial-default reality; move self-custody options to an "Advanced" subsection. Align with `quickstart.md`.
- **`docs/components/secured-credit.md`** — Relabel title from `GA` to roadmap/in-development; move `instant_borrow`/`repay_*` examples under "Advanced / on-chain"; fix LTV 75% → 70%; remove "3,000+ lines · zero defaults."
- **`docs/components/unsecured-credit.md`** — Downgrade from `Preview` to "In development / roadmap"; convert capability claims to future tense throughout.
- **`docs/components/x402.md`** — Keep `GA` (the proxy is live), but reframe line 53 away from "pays from your delegated credit" toward "pays from your prepaid balance"; resolve 13,000+ vs 60 vs 27.
- **`docs/agents/credit-for-agents.md`** — Heaviest rewrite. Remove proof-points (5); demote the working-capital-line example to Advanced; drop the "150% LTV / receivables" line (67); reframe as "how an agent pays for APIs"; fix 45→47.
- **`docs/agents/fiat-to-x402.md`** — Reframe entire flow to prepaid balance (mirror `quickstart.md`); remove the live rate "5–10% APR" (105); replace `instant_borrow`/`repay_credit` steps with funding + `fetch`; fix Step 1 "connect EVM wallet" to walletless sign-in.
- **`docs/agents/quickstart-agents.md`** — Same reframe; or deprecate in favor of the already-good `getting-started/quickstart.md` (this file is not in `SUMMARY.md`). Fix 45→47.
- **`docs/getting-started/core-concepts.md`** — Move under **Advanced**; retitle "How Floe works under the hood"; **fix the duplicated/garbled section numbering and the two conflicting market tables** (76–82 vs 195–201); fix 45→47 (x2).
- **`docs/getting-started/quick-start.md`** — Orphan with a dead link. Delete (preferred) or fix `app.floelabs.xyz` and add to `SUMMARY.md`. The canonical quickstart is `quickstart.md`.
- **`faq/general.md`** — Largest positioning rewrite. Replace the opening "P2P intent-based lending protocol" definition with the spend-layer definition; move Aave comparison, "earn interest," liquidation Q&A under Advanced; add USDC/USDC to the market list and reconcile the USDT markets (VERIFY-3); remove "connect wallet with ETH" entry framing.
- **`docs/protocol/architecture.md`** — Fine as deep technical content; ensure it sits under **Advanced/Protocol** (it already does in `SUMMARY.md`); no positioning change needed beyond a one-line "this is the on-chain layer beneath the spend product" preamble.
- **`docs/glossary.md`** — Remove the `Lendr` entry (42–43); de-duplicate the two `ACP` entries (120–124); fix 45→47 (97); reconcile market list (46); soften "Lender = earn interest" yield framing.
- **`docs/changelog.md`** — Remove "LendrBot" (222) and `app.floelabs.xyz` (245); leave dated counts as history but add a current-count note near line 145; the v1.6/v1.7 credit-line entries should not be edited until VERIFY-1 resolves.
- **`docs/developers/agent-working-capital.md`** — Reframe "instant credit lines" as roadmap/Advanced; fix "other 36 Floe actions" → 47 (110).
- **`docs/developers/agentkit*.md`, `frameworks/*.md`** — Bulk fix 45→47 (SDK) and prep 36→41 (MCP) to land with the allowlist PR; fix the Python 30+6+9 split description to 30+17.
- **`llms.txt`** — Rewrite the one-line definition to lead with spend/walletless; remove "3,000+ lines, zero defaults"; update "36 tools" to 41 when the PR lands; mirror the new positioning.
- **`developers/networks.md`** — Resolve VERIFY-3 (USDT markets live or not); this is canonical, so fix here first and let other pages link in.
- **`floe-docs-optimization/`** — Unpublished stale draft; delete from the repo or relocate. It reintroduces removed claims and an off-ground-truth "credit-tiers/receivables/institutions" narrative.
- **`floe-cookbook` (cross-repo, flag only):** rewrite `x402-client` and `financial-os-loop` to the live prepaid `fetch` path; gate the credit-loop examples (`financial-os-loop`, `langchain-agent`, `yield-optimizer`) behind a clear "Advanced / on-chain (requires self-custody, roadmap credit)" label; `crewai-demo` stays blocked until PR #27 publishes `crewai-floe`.

---

## 6. Follow-ups requiring other agents

- **backend-dev (VERIFY-1):** confirm prod status of `/v1/credit/instant-borrow`, `/v1/developer/agents/:id/open-credit-line`, `/v1/credit/offers`, `/v1/credit/repay*`. The docs and changelog describe a live managed credit line; ground truth says credit lines are roadmap. The correct relabeling hinges on this answer.
- **backend-dev / content owner (VERIFY-2):** pin one verified vendor/endpoint count; decide whether "13,000+ reachable" survives.
- **smart-contract-dev (VERIFY-3):** confirm whether USDT/WETH and USDT/cbBTC markets are live; reconcile 70% vs 75% volatile LTV against the deployment record.
- **SDK/MCP maintainers:** the 47→52 (SDK) and 36→41 (MCP) doc updates should land in the same PR wave as `agentkit-actions#35`, `agentkit-actions-py#27`, `floe-mcp-server#27`.
</content>
</invoke>
