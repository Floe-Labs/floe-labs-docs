# Matcher Operator Guide

Solver bots (also called Matchers) are the backbone of Floe's intent matching system. They scan for compatible intents and execute matches, earning fees in the process.

## What is a Solver?

Solvers are automated bots that:
1. Monitor open lend and borrow intents
2. Find compatible pairs based on matching criteria
3. Execute the `matchLoanIntents` transaction
4. Earn the matcher commission set by borrowers

## Revenue Model

Solvers earn the **matcher commission** set by borrowers:
- Typical range: 0.1% - 0.5% of loan amount
- Paid from the loan proceeds at settlement
- Example: 0.3% on a $10,000 loan = $30

## Prerequisites

- Node.js 18+
- Base Mainnet RPC (Alchemy or Infura recommended)
- Funded wallet with ETH for gas
- Capital for gas fees only (no loan capital needed)

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
cd apps/solver
cp .env.example .env
```

Edit `.env`:
```bash
# Required
PRIVATE_KEY=your_private_key_here
RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Optional
LOG_LEVEL=info
MATCHING_INTERVAL_MS=5000
MIN_PROFIT_THRESHOLD_BPS=10
```

### 3. Run the Solver

```bash
pnpm start
```

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `PRIVATE_KEY` | Wallet private key for signing transactions | Required |
| `RPC_URL` | Base Mainnet RPC endpoint | Required |
| `LOG_LEVEL` | Logging verbosity (debug, info, warn, error) | `info` |
| `MATCHING_INTERVAL_MS` | How often to scan for matches (ms) | `5000` |
| `MIN_PROFIT_THRESHOLD_BPS` | Minimum profit to execute match (basis points) | `10` |
| `GAS_PRICE_MULTIPLIER` | Gas price buffer for faster inclusion | `1.2` |
| `MAX_GAS_PRICE_GWEI` | Maximum gas price to use | `100` |

## Matching Logic

### Compatibility Requirements

For two intents to be matchable:

1. **Same Market**: Both intents must be for the same loan/collateral pair
2. **Rate Compatible**: `borrower.maxInterestRate >= lender.minInterestRate`
3. **LTV Compatible**: `borrower.minLtv + 800bps <= lender.maxLtv`
4. **Duration Compatible**: `borrower.duration <= lender.duration`
5. **Amount Available**: `lender.remainingAmount >= borrower.amount`
6. **Not Expired**: Both intents must be within their validity period

### LTV Gap Requirement

The protocol enforces an 8% minimum gap between:
- **Origination LTV** (borrower's `minLtvBps`)
- **Liquidation LTV** (lender's `maxLtvBps`)

```
Valid Match: borrower.minLtvBps (60%) + 800 <= lender.maxLtvBps (75%) ✅
Invalid:     borrower.minLtvBps (70%) + 800 <= lender.maxLtvBps (75%) ❌
```

## Profitability Calculation

```typescript
function calculateProfit(borrowIntent, lendIntent, fillAmount) {
  const matcherCommission = fillAmount * borrowIntent.matcherCommissionBps / 10000;
  const estimatedGasCost = gasPrice * gasLimit * ethPrice;

  return matcherCommission - estimatedGasCost;
}
```

The solver only executes matches where:
```
matcherCommission > gasCost + MIN_PROFIT_THRESHOLD
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       SOLVER BOT                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Indexer   │───▶│  Matching   │───▶│  Executor   │     │
│  │   Client    │    │   Engine    │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Envio     │    │ Profitability│   │  Blockchain │     │
│  │   GraphQL   │    │   Scorer    │    │   (Base)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **Indexer Client**: Fetches open intents from Envio GraphQL
2. **Matching Engine**: Finds compatible intent pairs
3. **Profitability Scorer**: Calculates expected profit per match
4. **Executor**: Submits transactions to the blockchain

## Strategies

### Greedy Strategy (Default)
Executes matches immediately when found, prioritizing by profit.

```typescript
// Pseudocode
while (running) {
  const intents = await fetchOpenIntents();
  const matches = findCompatiblePairs(intents);
  const profitable = matches.filter(m => calculateProfit(m) > threshold);

  // Execute highest profit first
  profitable.sort((a, b) => b.profit - a.profit);

  for (const match of profitable) {
    await executeMatch(match);
  }

  await sleep(MATCHING_INTERVAL_MS);
}
```

### Optimal Strategy
Finds the globally optimal set of matches considering partial fills.

More complex but can extract more value when multiple matches are possible.

## Monitoring

### Logs

```bash
# Tail logs in real-time
tail -f logs/solver.log

# Filter by level
grep "ERROR" logs/solver.log
```

### Metrics

The solver exposes metrics at `/metrics` (if enabled):
- `matches_executed_total`: Total successful matches
- `matches_failed_total`: Failed match attempts
- `profit_earned_total`: Cumulative profit in USDC
- `gas_spent_total`: Cumulative gas in ETH

## Troubleshooting

### "Transaction reverted"

Common causes:
- Intent was already matched by another solver
- Intent expired during execution
- Insufficient gas price (front-run)

Solution: Increase `GAS_PRICE_MULTIPLIER` or reduce `MATCHING_INTERVAL_MS`

### "No profitable matches found"

- Market conditions may not have compatible intents
- Your `MIN_PROFIT_THRESHOLD_BPS` may be too high
- Check that indexer is synced

### "RPC rate limited"

- Switch to a dedicated RPC provider (Alchemy, Infura)
- Increase `MATCHING_INTERVAL_MS` to reduce request frequency

## Security Considerations

1. **Private Key Security**
   - Never commit `.env` to version control
   - Consider using a hardware wallet or KMS
   - Use a dedicated wallet for the solver

2. **Gas Management**
   - Set `MAX_GAS_PRICE_GWEI` to prevent excessive spending during network congestion
   - Monitor wallet balance for gas

3. **MEV Protection**
   - Consider using Flashbots or private mempools for large matches
   - Front-running risk exists for high-value matches

## Advanced: Custom Strategies

You can implement custom matching strategies by extending the base solver:

```typescript
// custom-strategy.ts
import { BaseSolver, Match } from '@floe/solver';

class MyCustomSolver extends BaseSolver {
  async selectMatches(candidates: Match[]): Promise<Match[]> {
    // Implement your custom selection logic
    return candidates.filter(m => this.meetsCustomCriteria(m));
  }

  private meetsCustomCriteria(match: Match): boolean {
    // Your custom logic here
    return true;
  }
}
```

## Economics Example

```
Scenario: Active market with 100 open intents

Average match opportunity: 5 per hour
Average loan size: $5,000
Average matcher commission: 0.3%
Average gas cost: $0.50

Revenue per match: $5,000 × 0.3% = $15
Cost per match: $0.50
Profit per match: $14.50

Hourly: 5 × $14.50 = $72.50
Daily: $72.50 × 24 = $1,740
Monthly: $1,740 × 30 = $52,200

Note: Actual results depend on market activity and competition.
```

## Next Steps

- [Run a Liquidation Bot](liquidation-bot.md)
- [REST/Graph API](api.md)
- [Networks & Contracts](../../developers/networks.md)
