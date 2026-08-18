# CLAUDE.md

Guidance for Claude Code (and the `claude-docs-sync` bot) when editing this repository.

## What this repo is

`floe-labs-docs` is the **public documentation** for [Floe](https://dev-dashboard.floelabs.xyz) — spend controls for voice AI agents. It is a **GitBook-hosted Markdown site** synced from `main`: there is no build step, no bundler, no test suite. Merging Markdown to `main` publishes it. The repo also ships two agent-consumable artifacts (`llms.txt`, `openapi/floe-api.yaml`) and is the source of record for the x402 vendor directory (`x402-directory/entries/*.json`).

Human contributor rules live in [CONTRIBUTING.md](CONTRIBUTING.md); everything below adds the detail an automated editor needs.

## Structure

```
SUMMARY.md                 GitBook table of contents — THE nav source of truth
README.md                  Homepage ("Floe — Spend controls for Voice AI")
llms.txt                   Hand-maintained LLM index of the docs + "key facts" block
llms-full.txt              GENERATED corpus (scripts/build-llms-full.ts) — never edit by hand
docs/
  getting-started/         Start-here pages (setup-with-ai-tools, quickstart, installation, auth, funding, pricing …)
  build/                   The voice stack: voice-stack, voice-orchestrators, unified-ledger, budget-aware-routing,
                           coverage-score, ledger-sync, latency-overhead, migrate-to-full-coverage
  platforms/               Vapi / Retell / Bland setup guides
  x402-directory/          Vendor Marketplace pages (hand-curated: README, compute, voice, image, search, browser,
                           database, agent-tools-verified, submit)
  components/              Agent Balance (wallet.md) + a couple of orphaned legacy pages
  developers/              20 pages: credit-api, spend-controls, api-keys, cli, mcp-server, webhooks, floe-phone,
                           keyless-inference, x402-facilitator, marketplace-shim, agent-runtime-contract,
                           agentkit-typescript / agentkit-python, venice, sarvam, ledger-sync-api …
  frameworks/              http, langchain, crewai, openai, claude-mcp, vercel-ai, agentkit (+ elizaos, orphan)
  agents/                  quickstart-agents, fiat-to-x402
  reference/               error-codes, environment-variables
  changelog.md             Append-only release history (also carries the "Current counts" banner)
  glossary.md              Reachable by URL, not in nav
faq/general.md             FAQ (not in nav)
examples/                  14 runnable snippets, TypeScript + Python pairs, linked from docs via raw GitHub URLs
openapi/floe-api.yaml      OpenAPI 3.0.3 spec of the Credit API (also self-served at credit-api.floelabs.xyz/.well-known/openapi.yaml)
x402-directory/
  entries/*.json           Vendor entries — source of truth (75 today)
  schema.json              Entry JSON Schema
  directory.json           GENERATED + committed manifest — regenerate in the same commit as any entry change
scripts/
  build-directory.ts       Validates entries, regenerates directory.json + generated category pages
  build-llms-full.ts       Regenerates llms-full.txt from SUMMARY.md
.gitbook/assets/           Screenshots
.github/workflows/         claude-docs-sync.yml (see "Automated sync PRs")
```

**A page only appears on the site if it is listed in `SUMMARY.md`.** If you add, rename, or move a page, update `SUMMARY.md` in the same change. A handful of pages are intentionally *not* in nav (`docs/glossary.md`, `docs/getting-started/core-concepts.md`, `faq/general.md`, `docs/developers/agent-quickstart.md`, `docs/developers/agentkit.md`, `docs/frameworks/elizaos.md`, `docs/components/x402.md`, `docs/components/credit-bureau.md`) — they are reachable by URL and cross-linked; don't add them to nav or delete them without a reason.

## Page conventions (as actually used)

- **Frontmatter is optional and only ever `icon:`** (`---` / `icon: rocket` / `---`). Never add any other frontmatter key; don't add or remove `icon:` casually.
- **Relative Markdown links** between pages (`[text](../developers/webhooks.md)`), anchors as `#heading-slug`. External links to sibling repos and to `dev-dashboard.floelabs.xyz` are fine.
- **GitBook blocks in use:** `{% tabs %}` / `{% tab title="Python" %}` … `{% endtabs %}` (TypeScript vs Python, or one tab per framework) and `{% hint style="…" %}` callouts on the platform/build pages. Most callouts are plain blockquotes (`> **Bold lead.** …`) — match whatever the page you're editing already uses.
- **Code examples in both TypeScript and Python** where applicable (parity is a product requirement). Runnable versions live in `examples/`; several pages link them by raw GitHub URL, so renaming an example breaks a live link.
- **Canonical data lives once; other pages link to it.** Endpoints → `docs/developers/credit-api.md` (and the OpenAPI spec); vendor prices/endpoints → the marketplace pages + `x402-directory/entries`; server env vars → `docs/reference/environment-variables.md`. Contract addresses appear in a few reference pages (`credit-api.md`, `mcp-server.md`, `environment-variables.md`, `agentkit-typescript.md`, changelog) — if one changes, grep the repo for the old address and update every occurrence.
- **Counts must stay consistent.** The canonical numbers are the "Current counts" banner at the top of `docs/changelog.md` and the "key facts" block at the bottom of `llms.txt` (SDK actions, MCP tools, CLI commands, package versions). When a count changes, grep for the old number across `docs/changelog.md`, `llms.txt`, `docs/getting-started/core-concepts.md`, `docs/getting-started/setup-with-ai-tools.md`, `docs/developers/mcp-server.md`, `docs/developers/agentkit-typescript.md`, `docs/frameworks/agentkit.md`, `docs/frameworks/openai.md`, `docs/glossary.md`. Do **not** touch the per-version numbers inside dated changelog entries — they were accurate at that release.
- **The changelog is an append-only historical record.** Add a new `### vX.Y.Z — Title (Month YYYY)` entry at the top of `## Version History`; do not rewrite, re-scope, or delete past entries — even during a reorganization.
- **`llms.txt` is hand-maintained** — update it whenever nav, positioning, packages, or counts change. **`llms-full.txt` is generated** — regenerate with `npx tsx scripts/build-llms-full.ts` after content changes (or, if you can't run it, say so in the PR so a reviewer does).
- **Vendor directory:** add/edit `x402-directory/entries/<id>.json` (validate against `schema.json`), then regenerate `directory.json` with `npx tsx scripts/build-directory.ts`. The generator writes the manifest, `submit.md`, and per-category pages that are **not** in nav; it deliberately skips `docs/x402-directory/README.md` and `voice.md`. The in-nav marketplace pages (`README.md`, `compute.md`, `voice.md`, `image.md`, `search.md`, `browser.md`, `database.md`, `agent-tools-verified.md`) are hand-curated — a JSON entry alone does not change the published site; edit the matching hand-curated page too.

## Product context for writing

Floe is **spend controls for voice AI**: a voice agent's whole bill — telephony, STT, LLM, TTS, search — on one ledger, enforced before money moves. Walletless onboarding (no crypto), fiat funding, and one API key that pays any vendor API — x402 vendors through the payment proxy (`/v1/proxy/fetch`) and LLM/voice through the keyless Floe Inference gateway (`/v1/chat/completions`, `/v1/embeddings`, `/v1/audio/*`, marketplace shim; the older BYOK metered proxy is `/v1/llm/chat/completions`) — from a prepaid balance, governed by programmable server-side spend controls. Floe Inference, the LLM proxy, spend controls, value-aware caps, quality throttle, budget-aware routing, Floe Phone, and the coverage score are **live** — describe them as live; never add "feature-flagged" or "coming soon" hedges to them.

**Primary audience: voice operators** (Vapi / Retell / Bland / Pipecat / LiveKit / CrewAI). The through-line is "one key for the whole voice bill". Lead every quickstart and guide with that job-to-be-done.

**Out of scope for these docs: the on-chain lending protocol.** Deposit/borrow, LTV, liquidation, same-token/volatile markets, intent matching / solvers, dual-oracle / circuit breaker, flash loans, secured/unsecured working capital, and the credit & trust bureau are **not** part of the public spend-layer docs. Don't add them to the primary path or the changelog. (This is a documentation scoping decision, not a feature retraction.)

**Do not reintroduce removed claims:** "3,000+ lines", "zero defaults", LendrBot/Lendr, or the dead `app.floelabs.xyz` URL (the live app is `dev-dashboard.floelabs.xyz`). No marketing superlatives. Vendor reach is "2,000+ vendor API services".

**Tone:** developer-first, concise, no jargon gatekeeping. Write for a Python developer building their first AI agent, not for a DeFi native. Keep crypto mechanics out of user-facing copy: funding is a card / Apple Pay / Google Pay / bank — that Floe settles in USDC on Base is an under-the-hood detail, never a step the operator sees.

## Ground truth lives in sibling repos

Docs describe code that lives in other `Floe-Labs` repositories. When documenting a change, check the source first for exact route paths, parameter names, defaults, and counts:

| Repo | What it is the source of truth for |
|---|---|
| `floe-monorepo` | Credit API routes (`apps/api`), marketplace shim, developer dashboard, webhooks, env vars |
| `floe-cli` | `@floelabs/cli` — the `floe` bin, command tree, exit codes |
| `floe-mcp-server` | `@floelabs/mcp-server` tool names and input schemas |
| `agentkit-actions` / `agentkit-actions-py` | `floe-agent` / `floe-agentkit-actions` action names and schemas |
| `floe-guard` | Local spend/latency kill-switch packages |
| `modular-lending` | Contract addresses (Base mainnet 8453) — reference only; the protocol itself is out of scope here |

## Automated sync PRs

`.github/workflows/claude-docs-sync.yml` runs when `floe-monorepo` merges a change under its public surface (API routes/services, SDK packages, dashboard app). During that run the monorepo is checked out **read-only** at `./monorepo` — never edit anything under it. The bot must:

1. Inspect the diff (`git -C monorepo log/diff $BEFORE..$AFTER`) and decide which pages *here* it invalidates.
2. Treat internal-only changes — refactors, tests, migrations, monitoring, admin-only or owner-only routes, analytics/attribution plumbing, dashboard internals with no user-visible behaviour — as invalidating **nothing**: print a one-line reason and stop. No branch, no commit, no PR. When in doubt whether a change is public-surface or internal, err on the side of no PR.
3. Otherwise make the **minimal** edits: only the pages the diff actually invalidates, respecting the out-of-scope list, the append-only changelog rule, `SUMMARY.md` navigation, and count consistency. Mention in the PR body if `llms.txt` / `llms-full.txt` need regenerating and you could not run the script.
4. Open a **draft** PR titled `[docs-sync] …` on branch `docs-sync/<sha7>` with the compare link. Sync PRs are proposals for human review, never auto-merged.

## Common tasks

- **Add a page:** create the `.md` under the right `docs/` subdirectory, add it to `SUMMARY.md`, add it to `llms.txt` if it's a page agents should find, regenerate `llms-full.txt`.
- **Update counts / package versions:** change the changelog banner + `llms.txt` key facts, then grep for the old value (see the list above).
- **Add a vendor:** JSON entry + regenerate `directory.json` + edit the hand-curated category page + (if it's a headline vendor) `docs/x402-directory/README.md`.
- **Update contract addresses:** grep for the old address across the repo; every occurrence must change together.
- **Preview:** GitBook has no local dev server — push a branch and use GitBook's branch preview, or read the Markdown directly.
