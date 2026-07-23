---
icon: database
---

# Storage

File storage and agent memory. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| 402104 | 402104 | $0.01 | POST | Verified |
| Pinata | Pinata | $0.10 | POST | Verified |
| zkStash | zkStash | $0.001 | POST | Verified |

---

## 402104

**Provider:** [402104](https://402104.xyz)
**Endpoint:** `POST https://api.402104.xyz/v1/store`
**Price:** $0.01 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> Expirable paywalled links to private files.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.402104.xyz/v1/store", "method": "POST"}'
```

## Pinata

**Provider:** [Pinata](https://pinata.cloud)
**Endpoint:** `POST https://402.pinata.cloud/v1/pin`
**Price:** $0.10 USDC per call (dynamic) · Base mainnet
**Floe compatible:** Yes

> File pinning and retrieval, account-free. Dynamic pricing.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://402.pinata.cloud/v1/pin", "method": "POST"}'
```

## zkStash

**Provider:** [zkStash](https://zkstash.xyz)
**Endpoint:** `POST https://api.zkstash.xyz/v1/store`
**Price:** $0.001 USDC per call · Base mainnet
**Floe compatible:** Yes

> Shared memory layer for agents.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.zkstash.xyz/v1/store", "method": "POST"}'
```

