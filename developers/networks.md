---
icon: chart-network
---

# Contract Addresses

All Floe smart contracts deployed on supported networks.

## Base Mainnet (Production)

| Parameter    | Value                                |
| ------------ | ------------------------------------ |
| Network Name | Base                                 |
| Chain ID     | 8453                                 |
| Currency     | ETH                                  |
| RPC URL      | `https://mainnet.base.org`           |
| Explorer     | [basescan.org](https://basescan.org) |

### Core Contracts

| Contract             | Address                                      |
| -------------------- | -------------------------------------------- |
| LendingIntentMatcher | `0x17946cD3e180f82e632805e5549EC913330Bb175` |
| PriceOracle          | `0xEA058a06b54dce078567f9aa4dBBE82a100210Cc` |
| LendingViews         | `0x9101027166bE205105a9E0c68d6F14f21f6c5003` |

### Aerodrome (Flash Arb)

| Contract        | Address                                      |
| --------------- | -------------------------------------------- |
| SwapRouter      | `0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5` |
| QuoterV2        | `0x254cF9E1E6e233aa1AC962CB9B05b2cFeAAe15b0` |

### Token Addresses

| Token  | Role       | Address                                      | Decimals |
| ------ | ---------- | -------------------------------------------- | -------- |
| USDC   | Loan Token | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6        |
| USDT   | Loan Token | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6        |
| WETH   | Collateral | `0x4200000000000000000000000000000000000006` | 18       |
| cbBTC  | Collateral | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 8        |

### Active Markets

| Market     | Loan Token | Collateral Token |
| ---------- | ---------- | ---------------- |
| USDC/WETH  | USDC       | WETH             |
| USDC/cbBTC | USDC       | cbBTC            |
| USDT/WETH  | USDT       | WETH             |
| USDT/cbBTC | USDT       | cbBTC            |

### Configuration

```javascript
const BASE_MAINNET_CONFIG = {
  chainId: 8453,
  name: "Base",
  rpcUrl: "https://mainnet.base.org",
  lendingIntentMatcher: "0x17946cD3e180f82e632805e5549EC913330Bb175",
  priceOracle: "0xEA058a06b54dce078567f9aa4dBBE82a100210Cc",
  tokens: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    WETH: "0x4200000000000000000000000000000000000006",
    cbBTC: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
  },
};
```

***

## Base Sepolia (Testnet)

| Parameter    | Value                                                |
| ------------ | ---------------------------------------------------- |
| Network Name | Base Sepolia                                         |
| Chain ID     | 84532                                                |
| Currency     | ETH                                                  |
| RPC URL      | `https://sepolia.base.org`                           |
| Explorer     | [sepolia.basescan.org](https://sepolia.basescan.org) |

### Core Contracts

| Contract             | Address                                      |
| -------------------- | -------------------------------------------- |
| LendingIntentMatcher | `0xF351eDF229ded7E2e2b23E44c70e9964CbA91B2E` |
| PriceOracle          | `0x71020b939b1f0988b2d93c2d930fea5b370203a5` |

> ⚠️ Testnet contracts may differ from mainnet. Use for development only.

***

## Adding Base to Your Wallet

### MetaMask / Rainbow / Other Wallets

1. Open wallet settings
2. Add network manually with:
   * **Network Name**: Base
   * **RPC URL**: `https://mainnet.base.org`
   * **Chain ID**: `8453`
   * **Currency Symbol**: ETH
   * **Block Explorer**: `https://basescan.org`

Or visit [chainlist.org](https://chainlist.org/?search=base) for one-click add.

***

## RPC Providers

### Public RPCs (Rate Limited)

| Network      | URL                        |
| ------------ | -------------------------- |
| Base Mainnet | `https://mainnet.base.org` |
| Base Sepolia | `https://sepolia.base.org` |

### Recommended Providers

For production applications:

* [Alchemy](https://www.alchemy.com/) - `https://base-mainnet.g.alchemy.com/v2/YOUR_KEY`
* [Infura](https://www.infura.io/) - `https://base-mainnet.infura.io/v3/YOUR_KEY`
* [QuickNode](https://www.quicknode.com/)

***

## Protocol Constants

| Parameter             | Value       | Description                                   |
| --------------------- | ----------- | --------------------------------------------- |
| `minLtvGapBps`        | 800 (8%)    | Min gap between origination & liquidation LTV |
| `withdrawalBufferBps` | 300 (3%)    | Buffer below liquidation for withdrawals      |
| `stalenessTimeout`    | 3,600 sec   | Oracle staleness threshold                    |
| `maxDeviationBps`     | 1,500 (15%) | Max price deviation before circuit breaker    |
| `liquidationBonus`    | 500 (5%)    | Bonus for liquidators                         |
| `gracePeriod`         | 86,400 sec  | Grace period after loan expiry (24 hours)     |

***

## Verified Contracts

All contracts are verified on Basescan:

* [LendingIntentMatcher](https://basescan.org/address/0x17946cD3e180f82e632805e5549EC913330Bb175#code)
* [PriceOracle](https://basescan.org/address/0xEA058a06b54dce078567f9aa4dBBE82a100210Cc#code)
* [LendingViews](https://basescan.org/address/0x9101027166bE205105a9E0c68d6F14f21f6c5003#code)

***

## Bridging Assets to Base

### Bridge ETH

* [Base Bridge](https://bridge.base.org) (Official)
* [Superbridge](https://superbridge.app)

### Get USDC on Base

* Bridge from Ethereum via [Circle CCTP](https://www.circle.com/en/cross-chain-transfer-protocol)
* Swap on [Uniswap](https://app.uniswap.org/) (Base)
* Withdraw from exchanges that support Base
