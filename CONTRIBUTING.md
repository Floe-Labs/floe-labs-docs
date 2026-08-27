# Contributing to Floe Docs

Thanks for helping improve Floe's documentation. This repo is the source for the docs published at [floe-labs.gitbook.io/docs](https://floe-labs.gitbook.io/docs).

## How the docs work

- Plain **Markdown**, published via GitBook. There is **no build step and no bundler** — changes to Markdown on `main` deploy automatically.
- **`SUMMARY.md` is the navigation source of truth.** A page only appears in the sidebar if it's listed there. If you add, rename, or move a page, update `SUMMARY.md` in the same change.
- `README.md` is the homepage.
- `llms.txt` is the annotated index for AI agents; `llms-full.txt` is the concatenated corpus and is **generated** — don't edit it by hand.
- Links between pages are Markdown-relative, e.g. `[Quickstart](docs/getting-started/quickstart.md)`. Anchors use `#heading-slug`.

## Making a change

1. Fork the repo and create your branch from `main`.
2. Edit the Markdown. If you added or renamed a page, update `SUMMARY.md`.
3. If you changed any page content, regenerate the corpus:
   ```bash
   npx tsx scripts/build-llms-full.ts
   ```
4. Keep the change focused, and match the surrounding tone.
5. Open a pull request with a clear description of what changed and why.

## Style

- Write for a developer building their first AI agent — concise, plain language, no jargon gatekeeping.
- Provide code examples in both **TypeScript and Python** where applicable.
- Keep canonical data (contract addresses, endpoints) on its canonical page and **link** to it rather than duplicating.
- The changelog is an append-only historical record — add new entries, don't rewrite past ones.

## Reporting issues

Open a GitHub issue for anything incorrect, outdated, unclear, or a broken link. Include the page URL and what's wrong. See the issue templates when you open one.

## Security issues

See [SECURITY.md](SECURITY.md) — do **not** open a public issue for security vulnerabilities. Report them privately to [hello@floefinance.com](mailto:hello@floefinance.com).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
