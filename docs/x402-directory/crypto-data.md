---
icon: chart-line
---

# Crypto Data & Analytics

On-chain analytics, prices, wallet intelligence. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| AdEx AURA | AdEx | $0.005 | GET | Verified |
| CoinGecko | CoinGecko | $0.001 | GET | Verified |
| DappLooker AI | DappLooker | $0.005 | POST | Verified |
| DiamondClaws | DiamondClaws | $0.002 | GET | Verified |
| Einstein AI | Einstein AI | $0.01 | GET | Verified |
| invy.bot | invy.bot | $0.002 | GET | Verified |
| Messari | Messari | $0.005 | GET | Verified |
| Mycelia Signal | Mycelia | $0.001 | GET | Verified |
| Nansen | Nansen | $0.01 | GET | Verified |
| Ordiscan | Ordiscan | $0.001 | GET | Verified |
| SLAMai | SLAMai | $0.005 | GET | Verified |
| WalletIQ | WalletIQ | $0.005 | GET | Verified |

---

## AdEx AURA

**Provider:** [AdEx](https://adex.network)
**Endpoint:** `GET https://api.adex.network/v1/aura`
**Price:** $0.005 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Portfolio, DeFi positions, and yield strategies.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.adex.network/v1/aura", "method": "GET"}'
```

## CoinGecko

**Provider:** [CoinGecko](https://www.coingecko.com)
**Endpoint:** `GET https://api.coingecko.com/api/v3/x402/coins`
**Price:** $0.001 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Crypto price and market data via x402.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.coingecko.com/api/v3/x402/coins", "method": "GET"}'
```

## DappLooker AI

**Provider:** [DappLooker](https://dapplooker.com)
**Endpoint:** `POST https://api.dapplooker.com/v1/x402/query`
**Price:** $0.005 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Unified on-chain and market intelligence.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.dapplooker.com/v1/x402/query", "method": "POST"}'
```

## DiamondClaws

**Provider:** [DiamondClaws](https://diamondclaws.xyz)
**Endpoint:** `GET https://api.diamondclaws.xyz/v1/yields`
**Price:** $0.002 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> DeFi yield and protocol risk across 17K pools, 7K protocols.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.diamondclaws.xyz/v1/yields", "method": "GET"}'
```

## Einstein AI

**Provider:** [Einstein AI](https://einstein.ai)
**Endpoint:** `GET https://api.einstein.ai/v1/whales`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Whale tracking, MEV, and smart-money signals.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.einstein.ai/v1/whales", "method": "GET"}'
```

## invy.bot

**Provider:** [invy.bot](https://invy.bot)
**Endpoint:** `GET https://api.invy.bot/v1/holdings`
**Price:** $0.002 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Wallet token holdings across Ethereum and Solana.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.invy.bot/v1/holdings", "method": "GET"}'
```

## Messari

**Provider:** [Messari](https://messari.io)
**Endpoint:** `GET https://api.messari.io/x402/assets`
**Price:** $0.005 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Crypto intelligence APIs — research, metrics, profiles.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.messari.io/x402/assets", "method": "GET"}'
```

## Mycelia Signal

**Provider:** [Mycelia](https://mycelia.xyz)
**Endpoint:** `GET https://api.mycelia.xyz/v1/price`
**Price:** $0.001 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Ed25519-signed price oracle — 7 feeds incl BTC, ETH, SOL.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.mycelia.xyz/v1/price", "method": "GET"}'
```

## Nansen

**Provider:** [Nansen](https://www.nansen.ai)
**Endpoint:** `GET https://api.nansen.ai/v1/x402/analytics`
**Price:** $0.01 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> On-chain intelligence and wallet analytics.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.nansen.ai/v1/x402/analytics", "method": "GET"}'
```

## Ordiscan

**Provider:** [Ordiscan](https://ordiscan.com)
**Endpoint:** `GET https://api.ordiscan.com/v1/inscriptions`
**Price:** $0.001 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Bitcoin Ordinals API and inscriptions, no API key.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.ordiscan.com/v1/inscriptions", "method": "GET"}'
```

## SLAMai

**Provider:** [SLAMai](https://slamai.xyz)
**Endpoint:** `GET https://api.slamai.xyz/v1/signals`
**Price:** $0.005 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Smart-money intelligence on Base and Ethereum.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.slamai.xyz/v1/signals", "method": "GET"}'
```

## WalletIQ

**Provider:** [WalletIQ](https://walletiq.xyz)
**Endpoint:** `GET https://api.walletiq.xyz/v1/profile`
**Price:** $0.005 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Wallet profile: age, DeFi usage, risk score across 5+ chains.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.walletiq.xyz/v1/profile", "method": "GET"}'
```

