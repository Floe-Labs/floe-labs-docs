---
icon: bolt
---

# Flash Loans

Floe supports flash loans — uncollateralized loans that must be borrowed and repaid within a single transaction. If the loan is not repaid by the end of the transaction, the entire transaction reverts.

## How It Works

1. A smart contract calls `flashLoan(token, amount, callbackData)` on the LendingIntentMatcher
2. The protocol transfers `amount` of `token` to `msg.sender`
3. The protocol calls `receiveFlashLoan(token, amount, callbackData)` on `msg.sender`
4. The receiver executes its logic (arbitrage, liquidation, collateral swap, etc.)
5. The receiver must repay `amount + fee` back to the protocol before the callback returns
6. If repayment fails, the entire transaction reverts

**Important:** The receiver (`msg.sender`) must be a smart contract implementing `IFlashloanReceiver`. EOA wallets cannot receive flash loans directly.

## Fee

Flash loans charge a fee in basis points, set by protocol governance. The fee is paid on top of the borrowed amount.

## Flash Arbitrage

Floe provides a **FlashArbReceiver** contract specifically for executing flash arbitrage through [Aerodrome](https://aerodrome.finance/) DEX on Base.

### How Flash Arb Works

```
1. EOA calls FlashArbReceiver.executeArb(token, amount, params)
2. FlashArbReceiver calls flashLoan() on LendingIntentMatcher
3. Protocol sends tokens to FlashArbReceiver
4. FlashArbReceiver executes multi-leg swaps on Aerodrome
5. FlashArbReceiver repays loan + fee to protocol
6. Profit remains in the FlashArbReceiver contract
7. Owner withdraws profit via rescueTokens()
```

### Deploying a FlashArbReceiver

Each user deploys their own FlashArbReceiver contract. The contract has immutable references to the LendingIntentMatcher and Aerodrome SwapRouter, and is owned by the deployer.

This can be done via the [AgentKit CLI](../developers/agentkit.md) or programmatically through the `deploy_flash_arb_receiver` action.

### Pre-Flight Checks

Before deploying, the system verifies:

* Flash loan fee is readable from the protocol
* WETH liquidity exists in the protocol
* Circuit breaker is not active
* Aerodrome SwapRouter is deployed and functional

## Use Cases

| Use Case | Description |
|----------|-------------|
| **Arbitrage** | Exploit price differences between Floe and Aerodrome pools |
| **Liquidation** | Borrow funds to liquidate unhealthy loans without upfront capital |
| **Collateral swaps** | Swap collateral type within a single transaction |
| **Debt refinancing** | Repay one loan and open another atomically |

## Contract Addresses

| Contract | Address |
|----------|---------|
| LendingIntentMatcher | `0x17946cD3e180f82e632805e5549EC913330Bb175` |
| Aerodrome SwapRouter | `0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5` |
| Aerodrome QuoterV2 | `0x254cF9E1E6e233aa1AC962CB9B05b2cFeAAe15b0` |
