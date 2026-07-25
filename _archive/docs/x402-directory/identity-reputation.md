---
icon: fingerprint
---

# Identity & Reputation

Attestations, identity, and trust scores. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| DJD Agent Score | DJD | $0.005 | GET | Verified |
| OOBE | OOBE | $0.005 | GET | Verified |
| Trusta.AI | Trusta.AI | $0.01 | POST | Verified |

---

## DJD Agent Score

**Provider:** [DJD](https://djd.xyz)
**Endpoint:** `GET https://api.djd.xyz/v1/score`
**Price:** $0.005 USDC per call · Base mainnet
**Floe compatible:** Yes

> Agent reputation scoring and identity verification.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.djd.xyz/v1/score", "method": "GET"}'
```

## OOBE

**Provider:** [OOBE](https://oobe.xyz)
**Endpoint:** `GET https://api.oobe.xyz/v1/score`
**Price:** $0.005 USDC per call · Base mainnet
**Floe compatible:** Yes

> Decentralized identity and reputation scoring.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.oobe.xyz/v1/score", "method": "GET"}'
```

## Trusta.AI

**Provider:** [Trusta.AI](https://trusta.ai)
**Endpoint:** `POST https://api.trusta.ai/v1/attest`
**Price:** $0.01 USDC per call · Base mainnet
**Floe compatible:** Yes

> Pay USDC on Base to publish attestations.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.trusta.ai/v1/attest", "method": "POST"}'
```

