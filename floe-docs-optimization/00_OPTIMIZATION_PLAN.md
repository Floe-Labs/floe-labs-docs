# Floe Docs Optimization — Plan & Rationale

**Author:** DevRel Lead review
**Source positioning:** Floe Onchain Credit Protocol deck (v10)
**Current docs:** https://floe-labs.gitbook.io/docs

---

## TL;DR — what's wrong, what to do

The current docs read like an Aave-style P2P lending manual. The deck positions Floe as **the onchain credit protocol and bureau for AI agents and institutions** — agent credit at the x402 boundary, merchant receivables financing, CoT underwriting, deterministic-cashflow-backed credit. None of that is visible in the docs.

Result: a developer or agent operator landing on the docs today can't tell whether Floe is "another P2P money market" or "the credit layer for the agent economy." Institutional readers bounce. Agent builders don't see themselves. Lendrs don't see what's coming.

**Fix:** restructure the docs around four audiences — Agents, Operators (humans running agents), Developers, Institutions/Lenders — with a positioning-led intro, a clear credit-tier story (Secured / Receivables / Uncollateralized), and an explicit "Credit Bureau" surface area. Keep the existing Aave-comparison and intent mechanics; reframe them as the **secured tier (live)** of a three-tier credit stack.

---

## Audience map (who lands here, what they need)

| Audience | What they're looking for | Where they should land |
|---|---|---|
| **Agent operator** (Vapi/Retell/Browserbase dev) | "Can I get my agent credit instead of pre-funding?" | `/agents/credit-for-agents` |
| **AI agent itself** (LLM reading docs) | Tools, actions, MCP endpoint, error semantics | `/agents/quickstart-agent`, `/developers/agentkit`, `llms.txt` |
| **DeFi user (lender/borrower)** | "How do I earn yield / borrow against WETH?" | `/users/lend`, `/users/borrow` (today's user-guides, kept) |
| **Merchant / SMB** | "How do I get paid now on my receivables?" | `/receivables/overview` (Q3 — coming soon page now) |
| **Institutional LP / credit desk** | Returns, structure, risk, custody, tokenization | `/institutions/overview` |
| **Protocol developer** | Contracts, SDKs, solver/liquidation bots | `/developers/*` (keep, add credit-tier APIs) |
| **Auditor / risk reviewer** | Oracles, circuit breaker, liquidations, security | `/protocol/*` (keep) |

---

## Proposed sidebar (replaces current)

```
Introduction                          ← rewritten, positioning-led
Why Floe                              ← NEW (why now, four curves, Stripe analogy)

Getting Started
  Quick Start (Humans)
  Quick Start (Agents)                ← NEW
  Core Concepts                       ← rewritten with credit-tier framing

For Agent Operators                   ← NEW SECTION
  Credit for Agents
  The Three Credit Tiers
  x402 + Deferred Settlement
  CoT Underwriting & the Credit Bureau
  Pricing & Limits

For Users (Lend / Borrow)             ← today's "User Guides"
  How to Lend
  How to Borrow
  Risk & Liquidations
  Credit Scores
  LendrBot

For Merchants (Receivables)           ← NEW (Q3 launch page now)
  Receivables Financing — Overview
  How Pledging Works
  Eligibility & Pricing

For Institutions                      ← NEW
  Overview & Thesis
  Asset Classes
  Risk Framework
  LP Onboarding

Developers
  AgentKit (TS / Python)              ← keep, light edits
  MCP Server                          ← surface as top-level
  Credit REST API                     ← keep
  Run a Solver Bot
  Run a Liquidation Bot
  Agent Working Capital
  llms.txt                            ← NEW

Protocol
  Architecture
  Intent Auto-Matching
  Oracles & Circuit Breaker
  Flash Loans
  Security
  Credit Bureau (Scoring Engine)      ← NEW

Reference
  Contract Addresses
  Roadmap                             ← NEW (Q3 launches)
  FAQ
  Glossary                            ← extend with agent-economy terms
  Changelog
```

---

## What changes vs. what stays

**KEEP AS-IS (already strong):**
- AgentKit Integration page (well-structured action reference)
- Quick Start for humans (good)
- Core Concepts mechanics (LTV, oracles, circuit breaker)
- Aave/Compound comparison table
- Contract addresses

**REWRITE (this package provides):**
- Introduction (`01_introduction.md`)
- Core Concepts (`02_core-concepts.md` — reframed around credit tiers)

**NEW PAGES (this package provides):**
- Why Floe / Why Now (`03_why-floe.md`)
- Quick Start for Agents (`04_quickstart-agents.md`)
- Credit for Agents — overview (`05_credit-for-agents.md`)
- Three Credit Tiers (`06_three-credit-tiers.md`)
- x402 + Deferred Settlement (`07_x402-deferred-settlement.md`)
- CoT Underwriting & Credit Bureau (`08_cot-underwriting.md`)
- Receivables — coming soon (`09_receivables-overview.md`)
- Institutions — overview (`10_institutions-overview.md`)
- MCP Server (`11_mcp-server.md`)
- Roadmap (`12_roadmap.md`)
- Glossary additions (`13_glossary-additions.md`)
- llms.txt (`14_llms.txt`)

---

## Cross-cutting fixes (apply globally)

1. **Voice consistency.** Pick one: "Floe" (third person) throughout, not mixing with "we." DevRel pages can use "you" for the reader. No marketing fluff in reference pages.

2. **Plain-English first sentence on every page.** Anyone landing cold should know in one line what the page is for. Right now several pages start mid-mechanic.

3. **Code blocks > prose for procedures.** Quick Starts especially. Less "click X then Y," more copy-pasteable shell + JS.

4. **One canonical example per concept.** The deck uses concrete numbers ($100 x402 payment → $92 sweep → $8 to agent wallet; $50K invoice → $42.5K advance). Reuse those exact numbers in the docs so a reader who saw the deck recognizes them.

5. **Surface the bureau.** "Floe Credit Bureau" should be a noun the docs use, not just deck language. Agent reputation, repayment history, CoT score — these need pages and they need to be discoverable.

6. **Status badges.** Mark every feature `LIVE` / `Q3 2026` / `ROADMAP`. Right now Receivables and Uncollateralized credit are mentioned in the deck as Q3 but invisible in docs.

7. **Add `llms.txt`** at root so Claude/ChatGPT/Cursor agents reading Floe docs get a clean structured map (the GitBook `?ask=` endpoint is great — pair it with llms.txt for first-class agent discovery).

8. **Add a "Quick Start (Agents)" mirror of the human Quick Start.** Same 5-minute promise but the steps are: install SDK → connect MCP → first action call. The deck claims "ships inside every major agent framework" — the docs should make that the path of least resistance.

9. **Roadmap page.** Right now the deck promises receivables + uncollateralized credit Q3. The docs need a public roadmap, otherwise readers assume what they see is all there is.

10. **Embedded diagrams.** The deck has strong visual flows (PLEDGE LIEN → MEASURE → CAPITAL UNLOCKED, x402 boundary credit). Recreate as Mermaid diagrams in docs (Mermaid renders natively in GitBook).

---

## SEO / discoverability

Current page titles are functional but generic ("Core Concepts," "How to Lend"). For external readers searching, retitle with intent:

| Current | Proposed |
|---|---|
| Introduction | Floe — Onchain Credit for AI Agents & Institutions |
| Core Concepts | How Floe Works (Credit Tiers, Intents, LTV) |
| How to Borrow | Borrow USDC against ETH or BTC on Base |
| AgentKit Integration | Build Agents with Credit (AgentKit + MCP) |

---

## Files in this package

Each numbered file below is drop-in for GitBook (markdown, GitBook hint blocks, Mermaid). Sequence to ship:

1. **Phase 1 (do this week):** `01_introduction.md`, `03_why-floe.md`, `02_core-concepts.md`, `12_roadmap.md`, `14_llms.txt`. Highest ratio of positioning lift to effort.
2. **Phase 2 (next 2 weeks):** Agent operator section (`04`–`08`), `11_mcp-server.md`. This is the audience the deck targets hardest and the docs ignore most.
3. **Phase 3 (Q3 prep):** `09_receivables-overview.md`, `10_institutions-overview.md`. Start as "coming soon" pages, fill in as the launches happen.

---

## What I deliberately did NOT change

- The intent mechanics, LTV math, oracle setup, liquidation bonus structure. Those pages are accurate and well-written.
- AgentKit action reference. Already in good shape.
- The DeFi-user (lend/borrow) flow. It works, real users use it, no need to disrupt.

The optimization is **additive positioning + restructure**, not a rewrite of working content.
