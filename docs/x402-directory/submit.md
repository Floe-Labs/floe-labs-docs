---
icon: plus
---

# Submit an API

Want your x402 API listed in the Floe directory? Two ways:

## Option 1: Pull Request (recommended)

1. Fork [floe-labs-docs](https://github.com/Floe-Labs/floe-labs-docs)
2. Add a JSON file to `x402-directory/entries/your-api-name.json`
3. Follow the schema in `x402-directory/schema.json`
4. Open a PR — we'll verify the endpoint and merge

## Option 2: Contact Us

Email [hello@floefinance.com](mailto:hello@floefinance.com) with:
- API endpoint URL
- Provider name
- Pricing (per-call in USDC)
- Brief description

## Requirements

- Must accept USDC on Base (chain ID 8453) via x402 protocol
- Must respond with HTTP 402 and a valid `PAYMENT-REQUIRED` header
- Must be reachable and functional at the time of submission
