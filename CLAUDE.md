# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`floe-labs-docs` is the public documentation for [Floe](https://dev-dashboard.floelabs.xyz) — the spend layer for AI agents. It's a **GitBook-hosted Markdown site**. There is no build step, no bundler, no test suite. Changes to Markdown files on `main` deploy automatically to GitBook.

## Structure

```
SUMMARY.md              ← GitBook table of contents (defines sidebar nav + page ordering)
README.md               ← Landing page (rendered as the GitBook homepage)
llms.txt                ← Structured index for LLM agents reading the docs
docs/
  agents/               ← Agent operator guides (credit-for-agents, quickstart, fiat-to-x402)
  getting-started/      ← Quickstart + core concepts
  developers/           ← SDK, API, dashboard, webhooks, x402, MCP, flash loans
  protocol/             ← Architecture, matching, oracles, security
  reference/            ← Error codes, env vars
  glossary.md
  changelog.md
developers/
  networks.md           ← Contract addresses, market list, token addresses
faq/general.md
examples/               ← Runnable code snippets (TS + Python) linked from docs
.gitbook/assets/        ← Screenshots and images
```

**SUMMARY.md is the source of truth for navigation.** If you add or rename a page, update SUMMARY.md or it won't appear in GitBook.

## Key conventions

- **No frontmatter required** except `icon:` on some pages (GitBook feature). Don't add or remove frontmatter unless intentional.
- **Relative links between docs** use Markdown-style `[text](../path/to/file.md)`. GitBook resolves these. Anchor links use `#heading-slug`.
- **Code examples** should be in both TypeScript and Python where applicable (parity is a product requirement). Runnable examples go in `examples/`.
- **Contract addresses and market data** are canonical in `developers/networks.md`. All other pages should link there, not duplicate addresses inline.
- **Action counts**: 54 SDK actions today (30 Floe + 24 x402: delegation, x402 payment, agent-awareness, merchant-allowlist, Floe Inference); MCP tools: 65 (since @floelabs/mcp-server 0.3.0, 2026-07-24). Keep consistent across changelog, llms.txt, agentkit.md, agentkit-typescript/python.md, glossary, framework pages, and quickstart pages.
- **The changelog is an append-only historical record.** Add new entries for new work; do not rewrite, re-scope, or delete past entries — even during a reorganization. Reorganizing the docs does not rewrite their history.

## Product context for writing

Floe's product is the **spend layer** for AI agents: walletless onboarding (no crypto), fiat funding, and one API key that pays any vendor API — x402 vendors through the proxy (`/v1/proxy/fetch`) and LLM tokens through the LLM proxy (`/v1/llm/chat/completions`) — from a prepaid balance, governed by programmable spend controls. The LLM proxy, keyless inference (Floe Inference), spend controls, value-aware caps, quality throttle, and budget-aware routing are **live** — describe them as live; do not add "feature-flagged" or "coming soon" hedges to them. Lead every quickstart and guide with this.

**Primary ICP: voice operators** (Vapi / Retell / Bland / CrewAI). The through-line is "one key for the whole voice bill" — telephony + speech-to-text + LLM + text-to-speech on one ledger, under one set of caps. Organize the docs around that job-to-be-done.

**On-chain lending is out of scope for these docs.** Deposit/borrow, LTV, liquidation, same-token/volatile markets, intent matching / solver, dual-oracle / circuit breaker, flash loans, secured/unsecured working capital, and the credit & trust bureau are **not** part of the public spend-layer docs. Do not add them to the primary path. (This is a documentation reorganization around the voice-operator ICP, **not** a feature retraction — the protocol still exists; it simply isn't documented here.)

**Do not** reintroduce removed claims: "3,000+ lines", "zero defaults", LendrBot/Lendr, or the dead `app.floelabs.xyz` URL (live app = `dev-dashboard.floelabs.xyz`). No marketing superlatives. Vendor reach = "2,000+ vendor API services".

**Tone**: Developer-first, concise, no jargon gatekeeping. Write for a Python developer building their first AI agent, not for a DeFi native. Keep crypto mechanics out of user-facing copy: funding is a card / Apple Pay / Google Pay / bank — that Floe settles in USDC on Base is an under-the-hood detail, never a funding step the operator sees.

**The thesis** (for "why this matters" sections): Agents need to pay for things — APIs, compute, data — without a human in the loop and without touching crypto. Floe is the spend layer that makes that safe: walletless funding, one proxy endpoint, programmable server-side spend controls.

## Related repositories

Documentation references code and APIs from these sibling repos, checked out side-by-side under `$FLOE_ROOT` (default `~/floe`):

| Repo | What it provides to docs |
|---|---|
| `floe-monorepo` | API routes (`apps/api`), SDK (`packages/sdk`), dashboard (`apps/dev-dashboard`), facilitator (`apps/api`) |
| `modular-lending` | Smart contract source, deployment addresses, market parameters, operational runbooks |
| `agentkit-actions` | TypeScript AgentKit action provider — action names, schemas, README |
| `agentkit-actions-py` | Python AgentKit action provider — action names, schemas |
| `floe-mcp-server` | MCP server tool definitions |

When updating docs for a new feature, check the source repo first to get accurate function signatures, parameter names, and default values.

## Shared agent team

This repo participates in a shared agent team (see `.claude/README.md`). The `frontend-dev` agent handles doc authoring. The `orchestrator` can delegate docs updates after code changes in other repos.

## Automated sync PRs

The `claude-docs-sync.yml` workflow runs when floe-monorepo merges a docs-relevant change (the monorepo is checked out read-only at `./monorepo` during these runs). It opens **draft** PRs titled `[docs-sync] …` — proposals for human review, never auto-merged. Sync edits must be minimal: only pages the diff actually invalidates, respecting the out-of-scope list, the append-only changelog rule, and SUMMARY.md navigation. When in doubt whether a monorepo change is public-surface or internal, err on the side of no PR.

## Common tasks

**Add a new page**: Create the `.md` file in the appropriate `docs/` subdirectory, then add it to `SUMMARY.md` in the right section.

**Update market list**: Edit `developers/networks.md` (canonical), then grep for market tables in `core-concepts.md`, `agent-working-capital.md`, `agent-quickstart.md`, and `credit-api.md`.

**Update action counts**: Grep for the old count across `changelog.md`, `llms.txt`, `agentkit.md`, `quickstart-agents.md`, and `glossary.md`.

**Update contract addresses**: Edit `developers/networks.md` only. Other pages link there.

**Preview locally**: GitBook doesn't have a local dev server. Push to a branch and use GitBook's branch preview, or read the Markdown directly.
