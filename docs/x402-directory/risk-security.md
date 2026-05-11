---
icon: shield
---

# Risk & Security

Token scanning, honeypot detection, risk assessment. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| Augur | Augur | $0.10 | POST | Verified |
| QuantumShield | QuantumShield | $0.01 | GET | Verified |
| Rug Munch Intelligence | Rug Munch | $0.02 | GET | Verified |
| Stakevia | Stakevia | $1.00 | GET | Verified |

---

## Augur

**Provider:** [Augur](https://augur.net)
**Endpoint:** `POST https://api.augur.net/v1/verify`
**Price:** $0.10 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Base contract admission control.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.augur.net/v1/verify", "method": "POST"}'
```

## QuantumShield

**Provider:** [QuantumShield](https://quantumshield.xyz)
**Endpoint:** `GET https://api.quantumshield.xyz/v1/check`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Token risk and honeypot detection.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.quantumshield.xyz/v1/check", "method": "GET"}'
```

## Rug Munch Intelligence

**Provider:** [Rug Munch](https://rugmunch.xyz)
**Endpoint:** `GET https://api.rugmunch.xyz/v1/scan`
**Price:** $0.02 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Rug/honeypot risk scanning on Base, Ethereum, Arbitrum, Polygon.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.rugmunch.xyz/v1/scan", "method": "GET"}'
```

## Stakevia

**Provider:** [Stakevia](https://stakevia.com)
**Endpoint:** `GET https://api.stakevia.com/v1/validators`
**Price:** $1.00 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Solana validator scoring and risk assessment.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.stakevia.com/v1/validators", "method": "GET"}'
```

