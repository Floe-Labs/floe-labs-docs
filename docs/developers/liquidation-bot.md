# Run a Liquidation Bot

Liquidation bots protect lenders by liquidating unhealthy loans and earn rewards in the process.

## What is a Liquidation Bot?

Liquidation bots:
1. Monitor active loans for health status
2. Identify liquidatable positions (LTV breach or overdue)
3. Execute liquidations to claim collateral + bonus
4. Protect lenders from bad debt

## Revenue Model

Liquidators earn a **5% bonus** on collateral:

```
Example:
- Loan debt: $5,000 USDC
- Collateral: 2 ETH @ $3,000 = $6,000
- Liquidator pays: $5,000 (the debt)
- Liquidator receives: 2 ETH ($6,000)
- Profit: $1,000 (including 5% bonus)
```

## Prerequisites

- Node.js 18+
- Base Mainnet RPC (Alchemy or Infura recommended)
- Wallet with:
  - ETH for gas
  - USDC capital to pay off debts
- Capital requirements scale with loan sizes you want to liquidate

## Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Floe-Labs/floe-monorepo.git
cd floe-monorepo
pnpm install
pnpm build
```

### 2. Configure Environment

```bash
cd apps/liquidator
cp .env.example .env
```

Edit `.env`:
```bash
# Required
PRIVATE_KEY=your_private_key_here
RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Optional
LOG_LEVEL=info
CHECK_INTERVAL_MS=10000
MIN_PROFIT_USD=10
MAX_GAS_PRICE_GWEI=100
```

### 3. Fund Your Wallet

You need:
- ETH for gas (~0.01 ETH minimum)
- USDC to pay off loans (depends on loan sizes)

### 4. Run the Bot

```bash
pnpm start
```

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `PRIVATE_KEY` | Wallet private key | Required |
| `RPC_URL` | Base Mainnet RPC | Required |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `CHECK_INTERVAL_MS` | Health check frequency | `10000` |
| `MIN_PROFIT_USD` | Minimum profit to execute | `10` |
| `MAX_GAS_PRICE_GWEI` | Gas price limit | `100` |
| `MAX_LOAN_SIZE_USD` | Largest loan to liquidate | `100000` |
| `ENABLE_FLASHLOANS` | Use flash loans for capital | `false` |

## Liquidation Conditions

A loan is liquidatable when **either** is true:

### 1. LTV Breach

```
Current LTV > Liquidation LTV (from lender's maxLtvBps)
```

Calculation:
```typescript
const currentLtv = (principal * 10000) / collateralValueUsd;
const isLtvBreach = currentLtv > loan.liquidationLtvBps;
```

### 2. Overdue

```
Current Time > Loan Start Time + Duration
```

```typescript
const isOverdue = Date.now() / 1000 > loan.startTime + loan.duration;
```

## Profitability Check

```typescript
function calculateLiquidationProfit(loan, prices) {
  // What we pay
  const debtToPay = calculateTotalDebt(loan);

  // What we receive (collateral)
  const collateralValue = loan.collateral * prices.eth / 1e18;

  // Gas cost estimate
  const gasCost = gasPrice * 300000 * prices.eth;

  // Net profit
  return collateralValue - debtToPay - gasCost;
}
```

Only execute if:
```
profit > MIN_PROFIT_USD
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LIQUIDATION BOT                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Loan      │───▶│   Health    │───▶│ Liquidation │     │
│  │   Monitor   │    │   Checker   │    │  Executor   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Indexer   │    │   Oracle    │    │  Blockchain │     │
│  │   GraphQL   │    │   Prices    │    │   (Base)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **Loan Monitor**: Fetches active loans from indexer
2. **Health Checker**: Evaluates LTV and expiry status
3. **Liquidation Executor**: Executes profitable liquidations

## Operating Strategies

### Basic Strategy

Check all loans periodically:

```typescript
while (running) {
  const activeLoans = await fetchActiveLoans();

  for (const loan of activeLoans) {
    const isLiquidatable = await checkLiquidatable(loan);

    if (isLiquidatable) {
      const profit = calculateProfit(loan);

      if (profit > MIN_PROFIT_USD) {
        await executeLiquidation(loan);
      }
    }
  }

  await sleep(CHECK_INTERVAL_MS);
}
```

### Priority Strategy

Process highest-profit liquidations first:

```typescript
const liquidatable = activeLoans
  .filter(loan => isLiquidatable(loan))
  .map(loan => ({ loan, profit: calculateProfit(loan) }))
  .filter(({ profit }) => profit > MIN_PROFIT_USD)
  .sort((a, b) => b.profit - a.profit);

for (const { loan } of liquidatable) {
  await executeLiquidation(loan);
}
```

### Flash Loan Strategy

Use flash loans when you don't have capital:

```typescript
// Borrow USDC via flash loan
// Pay off debt
// Receive collateral
// Sell collateral for USDC
// Repay flash loan + fee
// Keep profit
```

## Execution Flow

### Step 1: Approve USDC (one-time)

```typescript
await usdcContract.approve(
  LENDING_INTENT_MATCHER,
  ethers.MaxUint256
);
```

### Step 2: Execute Liquidation

```typescript
const tx = await sdk.lending.liquidateLoan(loanId);
const receipt = await tx.wait();
```

### Step 3: Verify Success

```typescript
// Parse events
const liquidationEvent = receipt.logs.find(
  log => log.topics[0] === LIQUIDATION_TOPIC
);

if (liquidationEvent) {
  console.log('Liquidation successful!');
  // Record profit, update balances
}
```

## Monitoring

### Logs

```bash
# Real-time monitoring
tail -f logs/liquidator.log

# Filter for executions
grep "LIQUIDATED" logs/liquidator.log

# Check errors
grep "ERROR" logs/liquidator.log
```

### Metrics

Expose metrics at `/metrics`:
- `loans_checked_total`: Loans evaluated
- `liquidations_executed_total`: Successful liquidations
- `liquidations_failed_total`: Failed attempts
- `profit_earned_total`: Cumulative USDC profit
- `gas_spent_total`: Gas in ETH

### Health Checks

```bash
# API endpoint
curl http://localhost:3001/health

# Response
{
  "status": "healthy",
  "lastCheck": "2025-01-15T10:30:00Z",
  "loansMonitored": 150,
  "usdcBalance": "25000.00",
  "ethBalance": "0.5"
}
```

## Risk Management

### Capital Management

| Strategy | Capital Required | Risk |
|----------|------------------|------|
| Small loans only (< $5k) | $10,000 | Low |
| Medium loans (< $25k) | $50,000 | Medium |
| All loans | $100,000+ | High |

### Competition Risks

- Other bots may liquidate first
- MEV bots can front-run your transactions
- Consider using Flashbots for large liquidations

### Market Risks

- Flash crashes may make collateral worthless fast
- Stale prices can cause circuit breaker activation
- Network congestion can delay transactions

## Troubleshooting

### "Loan not liquidatable"

Possible causes:
- LTV recovered (price moved favorably)
- Another bot liquidated first
- Circuit breaker is active

### "Insufficient balance"

- Add more USDC to your wallet
- Lower `MAX_LOAN_SIZE_USD`
- Enable flash loans if implemented

### "Transaction reverted"

- Loan was liquidated by competitor
- Gas price too low (increase priority)
- Contract paused (circuit breaker)

### "Oracle price stale"

- Wait for oracle update
- Check L2 sequencer status
- Verify RPC is synced

## Advanced: Custom Liquidation Logic

```typescript
import { BaseLiquidator } from '@floe/liquidator';

class MyLiquidator extends BaseLiquidator {
  async shouldLiquidate(loan: Loan): Promise<boolean> {
    // Custom logic
    const profit = await this.calculateProfit(loan);
    const gasPrice = await this.getGasPrice();

    // Only liquidate if profit > 2x gas cost
    return profit > gasPrice * 600000 * 2;
  }

  async executeLiquidation(loan: Loan): Promise<void> {
    // Use Flashbots for MEV protection
    await this.submitViaFlashbots(loan);
  }
}
```

## Economics Example

```
Scenario: 50 active loans monitored

Average liquidation opportunity: 2 per week
Average debt: $3,000
Average collateral: $4,000
Liquidator bonus: 5%

Per liquidation:
- Pay debt: $3,000
- Receive collateral: $4,000
- Gas cost: ~$2
- Net profit: ~$998

Weekly: 2 × $998 = $1,996
Monthly: $1,996 × 4 = $7,984

Note: Highly dependent on market volatility and competition.
```

## Best Practices

1. **Monitor gas prices** - Don't overpay during congestion
2. **Set appropriate limits** - Don't liquidate loans larger than your capital
3. **Handle failures gracefully** - Retry logic for transient errors
4. **Diversify strategies** - Don't rely on one approach
5. **Keep logs** - Debug issues and track performance
6. **Secure your keys** - Use hardware wallet or KMS

## Security Considerations

1. **Private Key Security**
   - Never commit keys to version control
   - Use environment variables or secrets manager
   - Consider hardware wallet integration

2. **MEV Protection**
   - Large liquidations attract MEV bots
   - Use private mempools (Flashbots, MEV Blocker)
   - Submit bundles when possible

3. **Capital Protection**
   - Set maximum loan size limits
   - Monitor wallet balance
   - Implement circuit breakers

## Next Steps

- [SDK Quick Start](01-sdk-quick-start.md)
- [API Reference](03-api-reference.md)
- [Run a Solver Bot](04-run-solver-bot.md)
