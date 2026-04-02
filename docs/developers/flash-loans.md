---
icon: bolt
---

# Flash Loans

Borrow any token from Floe's lending pool with zero collateral — repay within the same transaction or it reverts. Use it for arbitrage, liquidations, collateral swaps, or debt refinancing.

## Try It: Estimate an Arb

Before deploying anything, check if an arbitrage opportunity exists:

```typescript
import { floeActionProvider } from "@floe/agentkit-actions";

// Estimate profit for a USDC → WETH → USDC route through Aerodrome
const estimate = await agentkit.invoke("estimate_flash_arb_profit", {
  token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",  // USDC
  amount: "10000000000",  // $10,000 USDC
  legs: [
    {
      tokenIn: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",   // USDC
      tokenOut: "0x4200000000000000000000000000000000000006",    // WETH
      tickSpacing: "100",
    },
    {
      tokenIn: "0x4200000000000000000000000000000000000006",    // WETH
      tokenOut: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",   // USDC
      tickSpacing: "100",
    },
  ],
});
// → { estimatedProfit, flashLoanFee, netProfit, isProfitable }
```

## Quick Start: Flash Arbitrage

Three steps to execute a flash arb on Base:

```typescript
// 1. Deploy your FlashArbReceiver (one-time)
const deploy = await agentkit.invoke("deploy_flash_arb_receiver", {});
// → { receiverAddress: "0x...", owner: "0x..." }

// 2. Estimate profitability
const estimate = await agentkit.invoke("estimate_flash_arb_profit", {
  token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  amount: "10000000000",
  legs: [
    { tokenIn: "0x833589f...", tokenOut: "0x420000...", tickSpacing: "100" },
    { tokenIn: "0x420000...", tokenOut: "0x833589f...", tickSpacing: "100" },
  ],
});

// 3. Execute if profitable
if (estimate.isProfitable) {
  const result = await agentkit.invoke("flash_arb", {
    token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    amount: "10000000000",
    legs: [
      { tokenIn: "0x833589f...", tokenOut: "0x420000...", tickSpacing: "100" },
      { tokenIn: "0x420000...", tokenOut: "0x833589f...", tickSpacing: "100" },
    ],
  });
  // → { txHash, profit, fee }
}

// 4. Withdraw profit from the receiver
const balance = await agentkit.invoke("get_flash_arb_balance", {
  token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
});
```

## How Flash Loans Work

```
Your Contract                   Floe Protocol
     │                                │
     │ flashLoan(token, amount, data) │
     │───────────────────────────────►│
     │                                │
     │◄── token transferred to you ───│
     │                                │
     │ receiveFlashLoan() called      │
     │   → execute your logic         │
     │   → repay amount + fee         │
     │                                │
     │── repayment ──────────────────►│
     │                                │
     │  ✓ Transaction succeeds        │
     │  ✗ If not repaid → reverts     │
```

1. Your smart contract calls `flashLoan(token, amount, callbackData)` on the LendingIntentMatcher
2. Floe transfers `amount` to your contract
3. Floe calls `receiveFlashLoan(token, amount, callbackData)` on your contract
4. Your contract executes its logic (arb, liquidation, etc.)
5. Your contract repays `amount + fee` before the callback returns
6. If repayment fails → entire transaction reverts atomically

**The receiver must be a smart contract** implementing `IFlashloanReceiver`. EOA wallets cannot receive flash loans directly. For EOA-based arbitrage, use the `FlashArbReceiver` contract (see below).

## Flash Loan Fee

```typescript
const fee = await agentkit.invoke("get_flash_loan_fee", {});
// → { feeBps: "9" }  (0.09%)
```

The fee is set by protocol governance and paid on top of the borrowed amount.

## FlashArbReceiver

For EOA wallets, Floe provides a `FlashArbReceiver` contract that handles the flash loan callback and executes multi-leg swaps on [Aerodrome](https://aerodrome.finance/) (Base's largest DEX).

### How It Works

```
EOA Wallet → FlashArbReceiver → Floe (flash loan) → Aerodrome (swaps) → Repay → Profit stays in receiver
```

1. You deploy your own `FlashArbReceiver` (you're the owner)
2. Call `flash_arb` with a token, amount, and swap legs
3. The receiver borrows from Floe, swaps through Aerodrome, repays the loan + fee
4. Profit accumulates in the receiver contract
5. Withdraw anytime via `rescueTokens()`

### Pre-Flight Checks

Before deploying, the system automatically verifies:
- Flash loan fee is readable from the protocol
- WETH liquidity exists in the lending pool
- Oracle circuit breaker is not active
- Aerodrome SwapRouter is deployed and functional

If any check fails, deployment aborts with a descriptive error.

## AgentKit Actions Reference

| Action | Description |
|--------|-------------|
| `get_flash_loan_fee` | Get the current flash loan fee in basis points |
| `estimate_flash_arb_profit` | Simulate a swap route and estimate net profit after fee |
| `deploy_flash_arb_receiver` | Deploy a new FlashArbReceiver (one-time, you're the owner) |
| `flash_arb` | Execute a flash arbitrage via your deployed receiver |
| `get_flash_arb_balance` | Check accumulated profit in your receiver |
| `flash_loan` | Execute a raw flash loan (receiver must be a smart contract) |
| `verify_flash_arb_receiver` | Verify a receiver contract's ownership and configuration |
| `rescue_tokens` | Withdraw tokens from your receiver contract |

## Direct Contract Integration

If you're not using AgentKit, call the contract directly:

### Solidity Interface

```solidity
interface IFlashloanReceiver {
    function receiveFlashLoan(
        address token,
        uint256 amount,
        bytes calldata data
    ) external;
}

// On LendingIntentMatcher:
function flashLoan(
    address token,
    uint256 amount,
    bytes calldata callbackData
) external;

function getFlashLoanFeeBps() external view returns (uint256);
```

### Example Receiver

```solidity
contract MyReceiver is IFlashloanReceiver {
    address immutable lender;  // LendingIntentMatcher

    constructor(address _lender) {
        lender = _lender;
    }

    function receiveFlashLoan(
        address token,
        uint256 amount,
        bytes calldata data
    ) external {
        require(msg.sender == lender, "unauthorized");

        // Your logic here: arb, liquidation, collateral swap, etc.

        // Repay: amount + fee
        uint256 fee = (amount * ILender(lender).getFlashLoanFeeBps()) / 10000;
        IERC20(token).transfer(lender, amount + fee);
    }

    function execute(address token, uint256 amount, bytes calldata data) external {
        ILender(lender).flashLoan(token, amount, data);
    }
}
```

### Python (via Credit REST API)

```python
# Flash loans require on-chain contract interaction — the Credit REST API
# doesn't support flash loans directly. Use ethers/viem/web3.py to call
# the LendingIntentMatcher contract.

from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://mainnet.base.org"))
matcher = w3.eth.contract(
    address="0x17946cD3e180f82e632805e5549EC913330Bb175",
    abi=[{
        "name": "flashLoan",
        "type": "function",
        "inputs": [
            {"name": "token", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "callbackData", "type": "bytes"}
        ]
    }]
)

# Your receiver contract must be deployed first
fee_bps = matcher.functions.getFlashLoanFeeBps().call()
print(f"Flash loan fee: {fee_bps / 100}%")
```

## Use Cases

| Use Case | Description | Example |
|----------|-------------|---------|
| **Arbitrage** | Exploit price differences between Floe and Aerodrome | Borrow USDC → swap to WETH on Aerodrome → swap back at better rate |
| **Liquidation** | Liquidate unhealthy Floe loans without upfront capital | Borrow USDC → repay borrower's debt → receive collateral at discount |
| **Collateral swap** | Change collateral type in a single transaction | Borrow USDC → repay loan → withdraw WETH → deposit cbBTC → re-borrow |
| **Debt refinancing** | Repay one loan and open another atomically | Borrow at new rate → repay old loan → create new loan in same tx |

## Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| LendingIntentMatcher | `0x17946cD3e180f82e632805e5549EC913330Bb175` |
| Aerodrome SwapRouter | `0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5` |
| Aerodrome QuoterV2 | `0x254cF9E1E6e233aa1AC962CB9B05b2cFeAAe15b0` |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| WETH | `0x4200000000000000000000000000000000000006` |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` |
