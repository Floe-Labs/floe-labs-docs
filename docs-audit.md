# Floe Docs Positioning Audit — `floe-labs-docs`

**Scope:** read-only audit of the GitBook repo (`main` content) against Floe's shipped-product positioning.
**Branch:** `positioning-align` (no edits made — this file is the only artifact, uncommitted).
**Repo state:** 64 `.md` pages under `docs/`, plus `README.md`, `SUMMARY.md`, `llms.txt`, `faq/general.md`, `developers/networks.md`.

> **Note on a pre-existing file:** the repo already contains `DOCS_AUDIT.md` at root (a prior, different audit). It was not used as input and is out of scope.

---

## 0. Headline findings (read this first)

1. **The two worst banned claims are already gone.** Greps for "zero defaults", "3,000+ working-capital lines", "lines issued", and "stop pre-funding" return **nothing** in shipped content. Someone has already done a cleanup pass. The remaining work is finer-grained.
2. **The single biggest live problem is an internal contradiction about the core spend model.** `getting-started/quickstart.md`, `README.md`, `components/x402.md`, `faq`, and `llms.txt` describe the live model as a **"prepaid balance" you debit directly**. But `getting-started/funding.md:15` explicitly says the opposite: *"that credit isn't a prepaid balance you draw down directly. It's a small working-capital line… the first time your agent makes a paid call, Floe opens the line for you automatically."* Per the confirmed nuance, **`funding.md` is correct** (payments are funded by the credit-line/borrow mechanism today; the prepaid-balance spend model is NOT live), and the "prepaid balance" pages are selling a roadmap model as if shipped. This must be reconciled — see §4 and the open question in §8.
3. **One endpoint-count drift left:** `crewai.md:61` says "13,000+". Everything else already uses "2,000+".
4. **LLM-scope caveat is present on exactly one page** (`agent-runtime-contract.md:105`) and missing everywhere else it matters — most importantly `spend-controls.md`, whose flagship example is `"$50/week to *.openai.com"` (line 15), which does not work for direct OpenAI token bills.
5. **The MCP server page advertises "36 tools for paying x402 APIs" but ~24 of them are on-chain lending/borrowing tools** (`create_borrow_intent`, `repay_loan`, `liquidate_loan`, etc.) — i.e. the roadmap/self-custody credit product, not the spend layer. A developer adding the MCP server today sees a borrow-a-loan toolset, not a pay-for-APIs toolset.
6. **"Credit APR / rate" claims remain** in product-facing prose (`secured-credit.md:31` "12% APR ceiling", `faq:102-104` APR tiers, `agent-working-capital.md:84` "6.5% APR"). These advertise borrowing-at-a-rate as a product. Distinguish from `maxRateBps` as an `OperatorPermission` *plumbing parameter* (keep) vs an advertised credit rate (remove).

---

## 1. Page inventory (64 docs pages + nav-referenced extras)

Classification legend: **KEEP-LIVE** / **FIX-CLAIMS** / **DEMOTE-TO-ROADMAP** / **KEEP-AS-MANAGED-PLUMBING** / **DELETE** / **ADD-LLM-SCOPE-CAVEAT**. Multiple tags where applicable.

### Getting Started
| Page | Classification | Note |
|---|---|---|
| `docs/getting-started/quickstart.md` | **FIX-CLAIMS** | "prepaid balance" model (roadmap framing), "$2 free credit"→Welcome Credit, hero omits "governed"/spend controls. Should become the walletless hero. |
| `docs/getting-started/funding.md` | **KEEP-AS-MANAGED-PLUMBING** + FIX-CLAIMS | Most accurate page on the live borrow mechanism. Rename "$2 free credit"→Welcome Credit; soften "working-capital line" product language into "managed internals". |
| `docs/getting-started/core-concepts.md` | **KEEP-AS-MANAGED-PLUMBING** | Already gated as "Advanced / on-chain … in development". On-chain protocol explainer. Move under Advanced/under-the-hood. |

### Components
| Page | Classification | Note |
|---|---|---|
| `docs/components/wallet.md` | **KEEP-LIVE** | Custodial wallet + spend limits = shipped. Minor: ERC-8004 "portable record other protocols read" leans roadmap. |
| `docs/components/onramp.md` | **KEEP-LIVE** | Fiat on/off-ramp, 100+ countries = shipped. |
| `docs/components/x402.md` | **FIX-CLAIMS** | "from your prepaid balance" (×3). Already gates `grant_credit_delegation` as in-development (good). Reframe to managed plumbing. |
| `docs/components/credit-bureau.md` | **DEMOTE-TO-ROADMAP** (mostly) | Reputation graph as a product = roadmap. Keep ONLY the credit-threshold webhooks (GA, shipped) — move those to spend/awareness; demote ERC-8004 reader/writer, "Default rate", cashflow score to Roadmap. |
| `docs/components/secured-credit.md` | **DEMOTE-TO-ROADMAP** | Already labeled "in development". It's the sold credit product. Keep in Roadmap, future tense. Banned: "12% APR ceiling" (line 31). |
| `docs/components/unsecured-credit.md` | **DEMOTE-TO-ROADMAP** | Already labeled "In development". Roadmap. |

### Frameworks
| Page | Classification | Note |
|---|---|---|
| `docs/frameworks/agentkit.md` | KEEP-LIVE | Spot-check for prepaid/credit framing. |
| `docs/frameworks/langchain.md` | **ADD-LLM-SCOPE-CAVEAT** | `langchain.md:41` example "borrows, pays an x402 endpoint, and repays" leans on borrow product. |
| `docs/frameworks/vercel-ai.md` | **ADD-LLM-SCOPE-CAVEAT** | Verify budget language. |
| `docs/frameworks/crewai.md` | **FIX-CLAIMS** + ADD-LLM-SCOPE-CAVEAT | Hero (line 7) "caps … LLM tokens" only true via `FloeLLM`/`/v1/llm` proxy — qualify it. "13,000+" (line 61)→"2,000+". "credit line" framing throughout. `"api.openai.com": "$2"` allowlist (line 106) is misleading (see §4). Body §"LLM cost control" is actually accurate — promote that nuance up. |
| `docs/frameworks/elizaos.md` | KEEP-LIVE / verify | Spot-check for prepaid/credit/LLM framing. |
| `docs/frameworks/openai.md` | KEEP-LIVE | Honestly marked `Preview`, MCP fallback. References "36 MCP tools" (line 24) — inherits MCP tool-surface problem (§6). |
| `docs/frameworks/claude-mcp.md` | KEEP-LIVE | Inherits MCP tool-surface problem (§6). |
| `docs/frameworks/http.md` | **ADD-LLM-SCOPE-CAVEAT** | Plain-REST pay guide; verify it doesn't imply LLM-bill capping. |

### Guides (`docs/agents/`)
| Page | Classification | Note |
|---|---|---|
| `docs/agents/fiat-to-x402.md` | **FIX-CLAIMS** + ADD-LLM-SCOPE-CAVEAT | "prepaid balance" (×3). Line 37 "Cap what the agent can spend… can't exceed it" needs LLM-scope caveat. Line 87 already gates borrow as in-development (good). |
| `docs/agents/credit-for-agents.md` | **FIX-CLAIMS** | "prepaid balance" (×3). Already gates on-chain borrow as in-development. Reframe. |
| `docs/agents/quickstart-agents.md` | **FIX-CLAIMS** + NOT-IN-NAV | Duplicate of getting-started/quickstart. Not in SUMMARY. "prepaid balance", references `instant_borrow`/`add_collateral` (line 100, correctly gated as in-development). Consolidate or delete. |

### Developers
| Page | Classification | Note |
|---|---|---|
| `docs/developers/developer-dashboard.md` | KEEP-LIVE | Dashboard = shipped. |
| `docs/developers/api-keys.md` | KEEP-LIVE | Key management = shipped. |
| `docs/developers/agent-runtime-contract.md` | **KEEP-LIVE** (model page) | The ONLY page with a correct LLM-scope caveat (line 105). Use as template. Minor: `api.openai.com` example (line 81). |
| `docs/developers/spend-controls.md` | **ADD-LLM-SCOPE-CAVEAT** (critical) | Flagship live page. `*.openai.com` example (line 15) is the headline LLM-scope trap. No caveat present. |
| `docs/developers/agent-awareness.md` | **FIX-CLAIMS** (managed-plumbing terms) + KEEP-LIVE | Live reasoning layer, but exposes borrow internals ("open a credit line", "creditLimit on-chain", "headroomToAutoBorrow"). Reframe credit→spend. |
| `docs/developers/x402-facilitator.md` | **KEEP-AS-MANAGED-PLUMBING** + FIX-CLAIMS | Live + required. "How It Works" headlines "Provision a Floe credit agent / Open the credit line". Reframe: borrow is managed internals, not the hero. `grant_credit_delegation` = keep (required plumbing). `revoke/check_credit_delegation` = legacy self-custody. |
| `docs/developers/agent-working-capital.md` | **DEMOTE-TO-ROADMAP** | Already "In development". Sold credit product (`instant_borrow`, APRs). Roadmap, future tense. Banned: "6.5% APR" (84), "8% APR" (83), `maxInterestRateBps: 800` (126). |
| `docs/developers/agentkit-typescript.md` | KEEP-LIVE + FIX-CLAIMS | Mixes live x402 actions with `open-credit-line` CLI (143). Split live vs roadmap actions. |
| `docs/developers/agentkit-python.md` | KEEP-LIVE + FIX-CLAIMS | Same. "47 total actions incl. instant_borrow etc." (line 9) — flag credit-facility actions as roadmap. |
| `docs/developers/agentkit.md` | NOT-IN-NAV / KEEP | Cross-linked from mcp-server/openai but not in SUMMARY. Reconcile with `frameworks/agentkit.md`. |
| `docs/developers/agent-quickstart.md` | **FIX-CLAIMS** + NOT-IN-NAV | "$2 free credit" (11). Duplicate-ish quickstart not in nav. |
| `docs/developers/mcp-server.md` | **FIX-CLAIMS** (tool surface) | See §6. Remove lending tools from LIVE list; "36 tools for paying x402 APIs" is inaccurate. |
| `docs/developers/webhooks.md` | KEEP-LIVE | Credit-threshold + payment webhooks = shipped. |
| `docs/developers/credit-api.md` | **FIX-CLAIMS** (split) | 1460+ lines. Mixes live (proxy, agents, policies, balance, awareness) with roadmap on-chain credit (`maxInterestRateBps` 12% APR @331/342, intent matching). Live endpoints → API ref; on-chain credit endpoints → Roadmap/Advanced. |
| `docs/developers/self-custody.md` | **KEEP-AS-MANAGED-PLUMBING** / Advanced | Self-custody path. Keep under Advanced. |
| `docs/developers/flash-loans.md` | **KEEP** (Advanced) | On-chain self-custody feature. Advanced section. |

### x402 Directory (marketplace — all LIVE)
| Page | Classification | Note |
|---|---|---|
| `docs/x402-directory/README.md` | KEEP-LIVE | "2,000+" ✓. Line 44 "CDP Bazaar 46,000+ endpoints" is externally attributed to Coinbase — acceptable, not a Floe reach claim. |
| `compute.md`, `voice.md`, `image.md`, `text.md`, `search.md`, `browser.md`, `agent-tools-verified.md`, `submit.md` | KEEP-LIVE | In-nav marketplace category pages. |
| `agent-tooling.md`, `browser-compute.md`, `identity-reputation.md`, `infra-gateway.md`, `llm-inference.md`, `media-generation.md`, `payments-commerce.md`, `social-news.md`, `storage.md`, `web-search.md` | KEEP-LIVE + **NOT-IN-NAV** | 10 category pages not referenced in SUMMARY (newer taxonomy not wired into nav, or stale duplicates of the 8 above). Decide: adopt new taxonomy or remove. `web-search.md:114` "50+ endpoints" is a single-vendor count, not a Floe reach claim — acceptable. |

### Protocol (on-chain — Advanced)
| Page | Classification | Note |
|---|---|---|
| `docs/protocol/architecture.md` | **KEEP-AS-MANAGED-PLUMBING** / Advanced | Already gated "on-chain protocol layer … credit in development". "12% APR" example (166) is illustrative — acceptable in Advanced. |
| `docs/protocol/orderbook-matching.md` | Advanced | Intent matching internals. APR/USDC numbers are worked examples, not product claims. |
| `docs/protocol/oracles-conditions.md` | Advanced | Oracle/circuit-breaker internals. |
| `docs/protocol/security.md` | KEEP / Advanced | Security model. |
| `docs/protocol/flash-loans.md` | **NOT-IN-NAV** (duplicate) | Duplicate basename of `developers/flash-loans.md` (which is in nav). Reconcile/dedupe. |

### Reference
| Page | Classification | Note |
|---|---|---|
| `docs/reference/error-codes.md` | KEEP-LIVE | Includes `insufficient_balance` = "Credit line exhausted" (32) — reflects managed plumbing; fine. |
| `docs/reference/environment-variables.md` | KEEP (self-host) | `X402_DOMAIN_ALLOWLIST=api.openai.com,api.anthropic.com` (157) — verify it doesn't imply LLM-bill capping. |
| `docs/glossary.md` | **FIX-CLAIMS** | "Working Capital" entry (96) and "Facilitator pays from prepaid balance" (121) carry both contradictory framings. Reconcile. |
| `docs/changelog.md` | KEEP | Correctly documents Welcome Credit (39-41), `open-credit-line` plumbing (85). Historical — leave, but ensure no live-tense roadmap claims. |

### Nav-referenced extras
| Page | Classification | Note |
|---|---|---|
| `README.md` | **FIX-CLAIMS** | Well-positioned overall ("spend layer", "2,000+", spend controls). Fix: "prepaid balance" (104), Credit-bureau as `Beta` product (106), line 27 LLM-scope caveat. |
| `SUMMARY.md` | RESTRUCTURE | See §7. |
| `llms.txt` | **FIX-CLAIMS** | "prepaid USDC balance" funding model (18, 98, 112) stated as live. Reconcile with managed-plumbing reality. |
| `faq/general.md` | **FIX-CLAIMS** | APR tiers "4-6% / 6-8% / 8%+" (102-104) and worked interest example "6% APR" (158-161) advertise credit rates. Demote/qualify as roadmap. On-chain section already gated (31). |
| `developers/networks.md` | KEEP / Advanced | Contract addresses + market table. "Same-token working capital" framing (55,59) → move under Advanced. |

**Orphans / not-in-nav (14):** `agents/quickstart-agents.md`, `developers/agent-quickstart.md`, `developers/agentkit.md`*, `protocol/flash-loans.md`*, and 10 x402-directory category pages (`agent-tooling`, `browser-compute`, `identity-reputation`, `infra-gateway`, `llm-inference`, `media-generation`, `payments-commerce`, `social-news`, `storage`, `web-search`). (* = duplicate basename of an in-nav page.)

---

## 2. Banned-claim register (file:line + exact text + fix)

### 2a. "$2 free credit" / "$2 free working capital" → must become "$2 Welcome Credit"
| file:line | exact text | fix |
|---|---|---|
| `docs/getting-started/funding.md:13` | "New agents get **$2 in free credit**" | "**$2 Welcome Credit**" |
| `docs/getting-started/funding.md:23` | "The $2 shows up here first." | keep $ amount; ensure "Welcome Credit" used on first mention |
| `docs/getting-started/quickstart.md:9` | "**$2 free credit (~200 API calls).**" | "**$2 Welcome Credit (~200 API calls).**" |
| `docs/developers/agent-quickstart.md:11` | "**$2 free credit (~200 API calls).**" | "**$2 Welcome Credit…**" |

*(`changelog.md:39-41` correctly uses "Welcome Credit" already — leave.)*

### 2b. Endpoint count other than "2,000+"
| file:line | exact text | fix |
|---|---|---|
| `docs/frameworks/crewai.md:61` | "calls any of the 13,000+ [x402] endpoints Floe can reach" | "2,000+ vendor API services" |

*(Acceptable, not flagged: `x402-directory/README.md:44` "CDP Bazaar … 46,000+ endpoints" — externally attributed to Coinbase. `web-search.md:114` "50+ endpoints" — single-vendor count. `agentkit-python.md:9` "47 total actions" — SDK action count, not endpoint reach.)*

### 2c. Specific credit APR / rate as a product claim
| file:line | exact text | fix |
|---|---|---|
| `docs/components/secured-credit.md:31` | `maxInterestRateBps: "1200", // 12% APR ceiling` | page is roadmap; remove APR or mark future-tense |
| `docs/developers/agent-working-capital.md:83` | "up to 8% APR, 30 days" | roadmap; future-tense, drop concrete rate |
| `docs/developers/agent-working-capital.md:84` | "Finds best lender at 6.5% APR" | roadmap; remove |
| `docs/developers/credit-api.md:342` | "1200 = 12% APR" | roadmap on-chain endpoint; move to Roadmap |
| `docs/developers/credit-api.md:331` | `"maxInterestRateBps": "1200"` | same |
| `faq/general.md:102-104` | "Conservative 4-6% APR / Moderate 6-8% APR / Higher risk 8%+ APR" | demote to Roadmap or remove rate tiers |
| `faq/general.md:158,161` | "Interest = Principal × (APR/365) × Days … $5,000 at 6% APR = $24.66" | roadmap; move/qualify |
| `docs/developers/agent-quickstart.md:36` | `maxInterestRateBps: "800", // up to 8% APR` | live quickstart should not show borrow rates — remove |

**Plumbing-parameter `maxRateBps` (KEEP, do not flag as banned):** `x402-facilitator.md:88,194,226,262,533`, `credit-api.md:995,1006,1044,1074,1156`, `environment-variables.md:105`, `error-codes.md:122`, `changelog.md:176`. These are the `OperatorPermission` borrow-rate *ceiling* — a technical bound of the managed plumbing, required for payments to work. **However** the inline annotations that translate to APR (e.g. `x402-facilitator.md:194` "// 15% max interest rate", `:533` "1500 = 15% APR") expose the borrow-as-credit framing and should be softened to "borrow-rate ceiling the facilitator must stay under" without advertising a rate.

### 2d. "zero defaults" / default-rate stat
- **None found in shipped content.** Only hit: `components/credit-bureau.md:39` lists "Default rate" as a *field* of the roadmap ERC-8004 reader (not a stat/number). Demote with the rest of that page to Roadmap. (`get_loan_state` etc. are unrelated.)

### 2e. "stop pre-funding" as a live outcome
- **None found.** `agents/fiat-to-x402.md:87` and `environment-variables.md:103` discuss pre-funding only to say borrowing-instead-of-prefunding is *in development* / that you shouldn't pre-fund the facilitator EOA. Both correct — no change.

### 2f. "3,000+ working-capital lines" / "lines issued"
- **None found.** Already removed. The only "3,000" hits are worked loan-amount examples in `orderbook-matching.md` (3,000 USDC) — not proof-point claims.

---

## 3. Endpoint-count drift (every file:line not using "2,000+")

Only **one** true drift in Floe-reach context:
- `docs/frameworks/crewai.md:61` — "13,000+" → "2,000+".

Correct usages confirmed at: `README.md:42,117`; `llms.txt:108`; `x402-directory/README.md:7`; `components/x402.md:7,65`; `x402-facilitator.md:11`; `changelog.md:31`. No "27 APIs" anywhere.

---

## 4. LLM-scope gaps (pages about budgets/limits/spend lacking the "x402 tool calls, not raw LLM tokens" caveat)

**The accurate scope statement** (template, already correct at `agent-runtime-contract.md:105`): *"Floe caps only spend that flows through Floe — x402 tool-call payments via `/v1/proxy/fetch`, plus LLM tokens only if you route them through the Floe LLM proxy (`/v1/llm/chat/completions`). It does NOT cap direct OpenAI/Anthropic token bills paid with the provider's own API key."*

Pages making a budget/cap promise WITHOUT this caveat:

| file:line | issue |
|---|---|
| `docs/developers/spend-controls.md:15` | Flagship example `"$50/week to *.openai.com"` (API/host-suffix policy). A direct OpenAI call with the dev's own key never traverses `/v1/proxy/fetch`, so this cap is a **no-op** for it. No caveat anywhere on the page. **Highest priority.** Either change the example to an x402 vendor (e.g. `.venice.ai`, already used at line 48) or add the caveat + an explicit "routes through the Floe LLM proxy" note. |
| `docs/frameworks/crewai.md:7` | "One Floe credit line caps everything your crew spends — paid tool calls *and* LLM tokens". True ONLY via `FloeLLM`/`/v1/llm` (the page's own §"LLM cost control" line 116-129 says so). Qualify the hero. |
| `docs/frameworks/crewai.md:106` | allowlist `"api.openai.com": "$2"` — if you route LLM through `FloeLLM`, the host is `credit-api.floelabs.xyz`, not `api.openai.com`; if you don't, the entry never matches. Misleading example. |
| `README.md:27` | "a runaway loop can't blow your budget" — implies blanket protection. Add scope. |
| `docs/agents/fiat-to-x402.md:37` | "Cap what the agent can spend … can't exceed it" — add scope. |
| `docs/changelog.md:20` | "API policies … e.g. *.openai.com" — same trap as spend-controls. |
| `docs/developers/agent-runtime-contract.md:81` | `"match": "api.openai.com"` example — has the §105 caveat later, but the example itself reinforces the misconception. |
| `docs/reference/environment-variables.md:157` | `X402_DOMAIN_ALLOWLIST=api.openai.com,api.anthropic.com` — self-host config; verify wording doesn't imply token-bill capping. |

**Note the genuinely-accurate handling:** `crewai.md` §"LLM cost control" (Path A x402-native open models / Path B `FloeLLM` metered proxy) and `agent-runtime-contract.md:105,111-113` are the model for how to talk about this. The fix is to propagate that honesty to the hero claims and to `spend-controls.md`.

---

## 5. Credit / working-capital pages — disposition (managed-plumbing vs sold product)

**KEEP-AS-MANAGED-PLUMBING (live, required for payments today — reframe as "what the facilitator does for you", under Advanced/under-the-hood or the facilitator-mechanism page):**
- `docs/developers/x402-facilitator.md` — the `open-credit-line` / `setOperator` / `maybeAutoBorrow` flow IS the live funding mechanism. Keep, but demote the "credit agent / open the credit line" language from hero to secondary "managed internals" section.
- `docs/getting-started/funding.md` — the auto-`auto_borrow_in_progress` first-call explanation is correct live behavior. Keep as managed-plumbing; strip product-credit framing.
- `docs/getting-started/core-concepts.md`, `docs/developers/self-custody.md`, `developers/networks.md`, `docs/protocol/*` — on-chain protocol layer. Keep under Advanced.
- The action `grant_credit_delegation` (provisions Privy wallet + delegation) and the endpoint `POST …/open-credit-line` — **required plumbing, keep**, but framed as setup the platform performs, not a "borrow" product.
- `error-codes.md` `insufficient_balance`/`RATE_TOO_HIGH`, `credit-remaining`/`loan-state` awareness reads — keep (live), reframe "credit" → "spend/balance" wording.

**DEMOTE-TO-ROADMAP (sold credit product — future tense only, no quickstart, no live code sample):**
- `docs/components/secured-credit.md` — "Working capital (on-chain)" (already "In development").
- `docs/components/unsecured-credit.md` — "Unsecured working capital" (already "In development").
- `docs/developers/agent-working-capital.md` — `instant_borrow`, APRs, repay/reborrow as a dev tool.
- `docs/components/credit-bureau.md` — the reputation graph / portable ERC-8004 credit *as a product* (keep only the GA credit-threshold webhooks, relocated to the spend/awareness layer).
- The credit-product slices of `docs/developers/credit-api.md` (intent matching, `maxInterestRateBps` rate offers) and `faq/general.md` (APR tiers, interest math).
- SDK credit-facility actions surfaced as dev-facing tools: `instant_borrow`, `repay_and_reborrow`, `request_credit`, `manual_match_credit`, `check_credit_status`, `repay_credit`, `renew_credit_line` (`agentkit-python.md:9`, `agentkit-typescript.md`).

**The distinction in one line:** if the page tells a developer "you can borrow money / here's the APR / call `instant_borrow`" → Roadmap. If it explains "the facilitator borrows under the hood so your `fetch()` gets paid" → managed plumbing, keep.

---

## 6. MCP tool surface (`docs/developers/mcp-server.md`)

The page claims (line 7, 142): **"36 tools for paying x402 APIs"** and a "Tools Reference (36)". In reality the table is dominated by **on-chain lending/borrowing tools** — the roadmap credit product. A developer wiring up the MCP server today should NOT be shown a borrow-a-loan toolset as the live surface.

**REMOVE from the LIVE MCP tool list (these are the roadmap credit / self-custody on-chain product):**
- Read: `get_open_lend_intents`, `get_open_borrow_intents`, `get_intent_details`, `get_loan`, `get_user_loans`, `get_loan_health`, `get_liquidation_quote`, `get_accrued_interest`, `get_token_price` (oracle), `get_markets`, `get_market_details`
- Write: `create_lend_intent`, `create_borrow_intent`, `create_counter_intent`, `repay_loan`, `add_collateral`, `withdraw_collateral`, `liquidate_loan`, `revoke_intent`, `approve_token`
- Analysis: `check_compatibility`, `calculate_risk`, `estimate_interest`
- Utility (on-chain tx): `simulate_transaction`, `broadcast_transaction`, `get_transaction_status`

(If self-custody users still need these, isolate them under an explicit "Advanced / on-chain (self-custody)" sub-list, not the headline 36.)

**KEEP as the shipped spend-layer MCP tools:**
- `get_wallet_balance` (balance)
- `get_credit_remaining` (reframe label → spendable/available)
- `get_loan_state` (keep only if reframed as managed-plumbing state; it exposes `borrowing|repaying|at_limit`)
- `get_spend_limit`, `set_spend_limit`, `clear_spend_limit`
- `list_credit_thresholds`, `register_credit_threshold`, `delete_credit_threshold`
- `estimate_x402_cost`

**Gap flag:** the MCP tool tables do **not** list an actual x402 *payment* tool (no `proxy_fetch` / `x402_fetch` equivalent), yet the page's headline is "tools for paying x402 APIs". Either the pay action is missing from the docs or the server genuinely lacks it — **verify against `floe-mcp-server` source** (cannot confirm from docs alone; see §8). The AgentKit surface DOES have `x402_fetch` (`x402-facilitator.md:328`), so the MCP omission looks like a doc gap.

---

## 7. Proposed before/after nav (`SUMMARY.md`)

### Current (abridged)
`Getting Started` (Quickstart, Funding) → `Components` (Wallet, Onramp, x402, Spend Controls, **Credit & trust bureau**) → `Frameworks` (8) → `Guides` (2 agent-operator) → `Developers` (Dashboard, Keys, Runtime, Spend Controls [dup], Awareness, x402 Facilitator, **x402 Directory + subpages**, MCP, Webhooks) → `API Reference` (Credit REST API) → `Protocol` (Architecture, Matching, Oracles, Security) → `Reference` (Errors, Env, Contracts, FAQ, Glossary, Changelog) → `Advanced / on-chain` (Core-concepts, **Working capital**, **Unsecured**, **Agent Working Capital**, Self-custody, Flash Loans).

**Problems:** Credit-bureau sits in top-level Components (implies shipped product); Spend Controls listed twice; x402 Directory buried under Developers; no clean "Roadmap" home (roadmap items scattered between Components and a half-roadmap "Advanced" bucket); managed-plumbing (facilitator borrow) mixed with sold credit product; Quickstart leads with "prepaid balance".

### Target IA
```
Introduction (README — spend layer; 2,000+; walletless; Welcome Credit)

Quickstart
  • Quickstart — walletless: create agent → $2 Welcome Credit → first GOVERNED x402 call
  • Funding your agent (card/bank/on-ramp; Welcome Credit)

Core concepts
  • Agents & API keys
  • Spend controls (context-aware, pre-transaction) [+ LLM-scope caveat]
  • Context-aware budgets / advisory headers       [+ LLM-scope caveat]
  • The vendor marketplace (x402 directory + categories)
  • Spend analytics & typed receipts
  • Agent wallet (custodial-by-default)
  • Fiat on/off-ramp

Guides
  • Voice / telephony spend governance              [+ LLM-scope caveat]
  • Browser / data spend governance                 [+ LLM-scope caveat]
  • CrewAI / LangChain / Vercel AI / OpenAI / ElizaOS  (each [+ LLM-scope caveat])
  • Claude Desktop / Cursor (MCP)                    [spend-layer tools only]
  • Plain HTTP / REST

API reference (SHIPPED endpoints only)
  • Proxy (/v1/proxy/fetch, /check)
  • Agents & keys, balance, awareness, spend-limit, policies, webhooks
  • Error codes, Environment variables, Contract addresses

Advanced / under-the-hood (managed plumbing — how the facilitator funds payments)
  • How Floe works under the hood (on-chain protocol)
  • x402 facilitator mechanism (setOperator, open-credit-line, auto-borrow as INTERNALS)
  • Self-custody
  • Protocol: architecture, intent matching, oracles, security
  • Flash loans

Roadmap (future tense — NO quickstart, NO live code, NO API-ref-implying-it-works)
  • Working capital (secured)
  • Unsecured / receivables credit
  • LP-funded credit marketplace · revenue-based repayment · dynamic spend authority
  • Reputation graph / portable ERC-8004 credit (as a product)
  • Prepaid-balance spend model

Reference: FAQ · Glossary · Changelog
```

Key moves: Credit-bureau out of Components → split (threshold webhooks to Core concepts, reputation graph to Roadmap); Spend Controls deduped; marketplace promoted to Core concepts; facilitator-borrow consolidated into Advanced/under-the-hood as plumbing; a single explicit **Roadmap** section absorbs the four "In development" pages **plus the prepaid-balance model**.

---

## 8. Open questions / can't-verify flags

1. **The "prepaid balance" vs "credit line" contradiction (most important).** `funding.md:15` says it's NOT a prepaid balance (it's an auto-opened working-capital line); quickstart/README/x402/faq/llms.txt say payments debit a prepaid balance. The brief confirms the prepaid-balance *spend model* is NOT live and borrow-plumbing IS. **But:** the Welcome Credit flow (`changelog.md:41`) sends real $2 USDC to the agent wallet, and card funding lands USDC in the wallet — so the wallet genuinely holds a balance. **Which user-facing word is correct for GA?** Does a *card-funded* agent still pay via auto-borrow plumbing (like the $2 credit does per `funding.md`), or does it spend the held USDC directly? This determines whether "prepaid balance" is wrong everywhere or only for the Welcome-Credit path. **Needs product-owner confirmation before any rewrite** — I will not guess.
2. **MCP pay tool.** The MCP page headlines "paying x402 APIs" but lists no `proxy_fetch`/`x402_fetch` tool. Is there a live MCP payment tool missing from the docs, or does the MCP server genuinely not expose one (pay only via AgentKit/REST)? Cannot verify without `floe-mcp-server` source (out of scope for this repo).
3. **`/v1/llm/chat/completions` proxy status.** Referenced via `crewai.md:80` (`/v1/llm`) and described as live (FloeLLM/LiteLLM, at-cost + 5% buffer). Is the LLM proxy GA, beta, or example-only? It's the linchpin of every LLM-scope caveat — confirm its status before writing the caveats authoritatively.
4. **10 not-in-nav x402-directory category pages** (`agent-tooling`, `browser-compute`, `identity-reputation`, `infra-gateway`, `llm-inference`, `media-generation`, `payments-commerce`, `social-news`, `storage`, `web-search`) vs the 8 in-nav ones (`compute/voice/image/text/search/browser/agent-tools-verified/submit`). Is the new taxonomy intended to replace the old, or are these stale? Affects whether they're KEEP or DELETE.
5. **Duplicate basenames:** `protocol/flash-loans.md` vs `developers/flash-loans.md`; `developers/agentkit.md` vs `frameworks/agentkit.md`. Which is canonical? Cannot tell from content alone whether one is a stale copy.
6. **Spend analytics / typed receipts** are in the LIVE positioning list but I found no dedicated page (only `X-Floe-Cost-USDC` header at `agent-runtime-contract.md:66`). Is there an analytics page to write, or is it dashboard-only? Flagging as a likely **ADD-PAGE** gap, not a drift.

---

*End of audit. No doc pages, SUMMARY.md, or other content were modified. This file is uncommitted.*
