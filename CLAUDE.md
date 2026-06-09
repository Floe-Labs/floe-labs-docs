# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`floe-labs-docs` is the public documentation for [Floe](https://dev-dashboard.floelabs.xyz) — working capital infrastructure for AI agents. It's a **GitBook-hosted Markdown site**. There is no build step, no bundler, no test suite. Changes to Markdown files on `main` deploy automatically to GitBook.

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
- **Action counts**: 47 SDK actions today (30 Floe + 17 x402: delegation, x402 payment, agent-awareness); MCP tools: 36. Next release adds 5 merchant-allowlist actions/tools (→ 52 SDK / 41 MCP). Keep consistent across changelog, llms.txt, agentkit.md, and quickstart pages.

## Product context for writing

Floe's primary product is the **spend layer**: walletless onboarding (no crypto), fiat funding, and one x402 proxy endpoint to pay any vendor API from a prepaid balance — governed by programmable spend controls. Lead every quickstart and guide with this.

The **on-chain working-capital credit path** (deposit USDC, borrow up to 95% in the USDC/USDC same-token market; WETH/USDC and cbBTC/USDC at 70%) is **in development / roadmap** — never describe it as GA or Preview-available, and never quote a live rate. Demote it into a clearly-labeled Advanced / on-chain / self-custody section. Active markets: USDC/USDC, WETH/USDC, cbBTC/USDC (no USDT markets).

**Do not** reintroduce removed claims: "3,000+ lines", "zero defaults", LendrBot/Lendr, or the dead `app.floelabs.xyz` URL (live app = `dev-dashboard.floelabs.xyz`). No marketing superlatives. Vendor reach = "2,000+ vendor API services".

**Tone**: Developer-first, concise, no jargon gatekeeping. Write for a Python developer building their first AI agent, not for a DeFi native. "Deposit" not "post collateral." "Credit line" not "overcollateralized loan." "Working capital" not "borrowed USDC."

**The thesis** (for "why this matters" sections): Agents need to pay for things — APIs, compute, data — without a human in the loop and without touching crypto. Floe is the spend layer that makes that safe: walletless funding, one proxy endpoint, programmable server-side spend controls.

## Related repositories

Documentation references code and APIs from these sibling repos under `/Users/ajc/floe/`:

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

## Common tasks

**Add a new page**: Create the `.md` file in the appropriate `docs/` subdirectory, then add it to `SUMMARY.md` in the right section.

**Update market list**: Edit `developers/networks.md` (canonical), then grep for market tables in `core-concepts.md`, `agent-working-capital.md`, `agent-quickstart.md`, and `credit-api.md`.

**Update action counts**: Grep for the old count across `changelog.md`, `llms.txt`, `agentkit.md`, `quickstart-agents.md`, and `glossary.md`.

**Update contract addresses**: Edit `developers/networks.md` only. Other pages link there.

**Preview locally**: GitBook doesn't have a local dev server. Push to a branch and use GitBook's branch preview, or read the Markdown directly.
