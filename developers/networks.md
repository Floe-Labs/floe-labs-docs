---
icon: chart-network
---

# Contract Addresses

Floe runs on **Base Mainnet**. That's the only supported network — there is no testnet, sandbox, or staging environment. Every reference to a chain or address in this repo means Base Mainnet.

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

### x402 Credit Facilitator

| Endpoint             | Value                                        |
| -------------------- | -------------------------------------------- |
| Facilitator API      | `https://credit-api.floelabs.xyz`            |
| Facilitator EOA      | `0x58EDdE022FFDAD3Fb0Fb0E7D51eb05AaF66a31f1` |

The **Facilitator EOA** is the address you pass as the `operator` argument to `setOperator` on `LendingIntentMatcher` when delegating credit to the Floe-hosted x402 facilitator. The corresponding private key lives only on the facilitator server; this address is the public half of the pair and is the one you grant `OperatorPermission` to. See [x402 Credit Facilitator](../docs/developers/x402-facilitator.md) for the full delegation flow.

### Aerodrome (Flash Arb)

| Contract        | Address                                      |
| --------------- | -------------------------------------------- |
| SwapRouter      | `0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5` |
| QuoterV2        | `0x254cF9E1E6e233aa1AC962CB9B05b2cFeAAe15b0` |

### Token Addresses

| Token  | Role                  | Address                                      | Decimals |
| ------ | --------------------- | -------------------------------------------- | -------- |
| USDC   | Loan + Collateral     | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6        |
| USDT   | Loan Token            | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6        |
| WETH   | Collateral            | `0x4200000000000000000000000000000000000006` | 18       |
| cbBTC  | Collateral            | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 8        |

### Active Markets

| Market     | Loan Token | Collateral Token | Max LTV | Notes |
| ---------- | ---------- | ---------------- | ------- | ----- |
| **USDC/USDC** | USDC    | USDC             | **95%** | Secured working capital — no price risk, hardcoded 1:1 oracle |
| USDC/WETH  | USDC       | WETH             | 70%     | |
| USDC/cbBTC | USDC       | cbBTC            | 70%     | |
| USDT/WETH  | USDT       | WETH             | 70%     | |
| USDT/cbBTC | USDT       | cbBTC            | 70%     | |

The **USDC/USDC market** (`marketId: 0x5027ae5ed5c85380c5dfa34a79915f41f139f4e859f56d15a6f958ea6b662820`) is the recommended market for AI agents. Deposit USDC, borrow up to 95% as working capital. No liquidation risk from price movements — the only path to liquidation is unpaid interest accrual.

### Configuration

```javascript
const BASE_MAINNET_CONFIG = {
  chainId: 8453,
  name: "Base",
  rpcUrl: "https://mainnet.base.org",
  lendingIntentMatcher: "0x17946cD3e180f82e632805e5549EC913330Bb175",
  priceOracle: "0xEA058a06b54dce078567f9aa4dBBE82a100210Cc",
  facilitator: {
    apiUrl: "https://credit-api.floelabs.xyz",
    eoa: "0x58EDdE022FFDAD3Fb0Fb0E7D51eb05AaF66a31f1",
  },
  tokens: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    WETH: "0x4200000000000000000000000000000000000006",
    cbBTC: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
  },
};
```

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
