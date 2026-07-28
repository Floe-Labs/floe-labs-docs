# Security Policy

## Reporting a vulnerability

If you believe you've found a security vulnerability in Floe — the API, dashboard, SDKs, payment facilitator, or smart contracts — please report it privately. **Do not open a public GitHub issue.**

- **Email:** [hello@floelabs.xyz](mailto:hello@floelabs.xyz) with the subject line `SECURITY`
- **GitHub:** use [private vulnerability reporting](https://github.com/Floe-Labs/floe-labs-docs/security/advisories/new) on this repository if the issue concerns the docs themselves

Please include:

- A description of the issue and its impact
- Steps to reproduce (a proof of concept helps a lot)
- Any affected endpoints, packages, or contract addresses

We'll acknowledge your report as quickly as we can, keep you updated as we investigate, and credit you in the fix disclosure if you'd like.

## Scope notes for this repository

This repository contains **documentation only** — Markdown, images, and example snippets. Issues most relevant here:

- Docs that recommend an insecure practice (e.g., exposing an API key client-side)
- Example code with a security flaw
- Links pointing to compromised or spoofed destinations

For vulnerabilities in the product itself, the private channels above reach the right team regardless of which repo the issue lives in.

## Supported versions

The docs track the live product. Only the current published version (the `main` branch) is maintained.
