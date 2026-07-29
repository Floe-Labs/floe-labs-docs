# Contributing to the Floe docs

Thanks for helping improve the Floe documentation! These docs are the public reference for [Floe](https://dev-dashboard.floelabs.xyz) — the spend layer for AI agents — and every fix, clarification, and example makes them better for the next developer.

## How the docs work

This is a **GitBook-hosted Markdown site**. There is no build step, no bundler, and no test suite. Merges to `main` deploy automatically to GitBook.

```
SUMMARY.md              ← GitBook table of contents (sidebar nav + page ordering)
README.md               ← Landing page
llms.txt                ← Structured index for LLM agents reading the docs
docs/                   ← All documentation pages
developers/networks.md  ← Contract addresses & market data (canonical)
examples/               ← Runnable code snippets (TypeScript + Python)
.gitbook/assets/        ← Screenshots and images
```

**Previewing:** GitBook has no local dev server. Read the Markdown directly, or open a PR and use GitBook's branch preview.

## Ways to contribute

- **Fix typos, broken links, or outdated commands** — small PRs are very welcome; no issue needed.
- **Report inaccuracies** — if a doc doesn't match the product's actual behavior, [open an issue](https://github.com/Floe-Labs/floe-labs-docs/issues) with the page and what you observed.
- **Improve examples** — clearer, runnable snippets in `examples/` (TypeScript and Python).
- **Request missing docs** — open an issue describing what you were trying to do and couldn't find.

For anything larger than a page-level edit (new sections, restructuring, new guides), please open an issue first so we can agree on scope before you invest the time.

## Making a change

1. Fork the repo and create a branch (`docs/fix-webhook-example`).
2. Make your edits.
3. If you **add or rename a page**, update `SUMMARY.md` — pages not listed there don't appear in GitBook.
4. Open a PR with a short description of what changed and why.

A maintainer will review, suggest edits if needed, and merge. Merged changes go live automatically.

## Conventions

Please follow these — they keep the docs consistent and are checked in review:

- **`SUMMARY.md` is the source of truth for navigation.** New or renamed pages must be added there.
- **Code examples come in both TypeScript and Python** wherever applicable. Parity between the two is a product requirement. Runnable examples live in `examples/`.
- **Contract addresses and market data live only in [`developers/networks.md`](developers/networks.md).** Other pages link there — never duplicate addresses inline.
- **The changelog is append-only.** Add new entries to `docs/changelog.md`; never rewrite, re-scope, or delete past entries.
- **Relative Markdown links** between docs (`[text](../path/to/file.md)`); anchors use `#heading-slug`.
- **Frontmatter** is only used for GitBook features like `icon:`. Don't add or remove it unless intentional.

## Style guide

- **Developer-first and concise.** Write for a Python developer building their first AI agent, not for a DeFi native.
- **No jargon gatekeeping, no marketing superlatives.** Say what a feature does; let it speak for itself.
- **Keep crypto mechanics out of user-facing copy.** Funding is a card / Apple Pay / Google Pay / bank transfer. Settlement details are under-the-hood, never a step the operator sees.
- **Lead with the job to be done.** Quickstarts and guides start with what the reader ships, not with architecture.
- Use sentence case for headings, and prefer short paragraphs and concrete examples over abstract descriptions.

## Reporting security issues

Please **do not** open public issues for security vulnerabilities — see [SECURITY.md](SECURITY.md).

## Code of conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## License

By contributing, you agree that your contributions are licensed under the repository's [MIT License](https://github.com/Floe-Labs/floe-labs-docs/blob/main/LICENSE).

## Questions?

- Open a [GitHub issue](https://github.com/Floe-Labs/floe-labs-docs/issues)
- Email [hello@floelabs.xyz](mailto:hello@floelabs.xyz)
- Reach us on X: [@FloeLabs](https://twitter.com/FloeLabs)
