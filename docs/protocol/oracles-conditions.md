---
icon: crystal-ball
---

# Oracles & Circuit Breaker

How Floe obtains reliable price data for collateral valuation and liquidation decisions.

## Overview

Accurate price data is critical for:

* Calculating loan-to-value (LTV) ratios
* Determining liquidation eligibility
* Protecting lenders from bad debt
* Ensuring fair collateral operations

Floe uses a **dual-oracle system** with automatic failover and circuit breaker protection.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ORACLE SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │
│   │   Chainlink  │────▶│    Pyth      │────▶│   Circuit    │       │
│   │   (Primary)  │     │  (Fallback)  │     │   Breaker    │       │
│   └──────────────┘     └──────────────┘     └──────────────┘       │
│          │                    │                    │                │
│          │                    │                    │                │
│          ▼                    ▼                    ▼                │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                    Price Validation                          │  │
│   │   • Positive price                                          │  │
│   │   • Not stale (< 1 hour)                                    │  │
│   │   • Within deviation bounds (15%)                           │  │
│   │   • Sequencer online                                        │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                    Validated Price                           │  │
│   │                    (8 decimal precision)                     │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Price Sources

### Chainlink (Primary)

[Chainlink Data Feeds](https://docs.chain.link/) provide:

* Industry-standard price oracles
* High reliability and uptime
* Decentralized node network
* Regular price updates

```solidity
// Chainlink price feed
AggregatorV3Interface chainlinkFeed;

function getChainlinkPrice() internal view returns (int256 price) {
    (, price, , uint256 updatedAt, ) = chainlinkFeed.latestRoundData();
    require(price > 0, "Invalid price");
    require(block.timestamp - updatedAt < stalenessTimeout, "Stale price");
}
```

### Pyth Network (Fallback)

[Pyth Network](https://pyth.network/) provides:

* High-frequency price updates
* Cross-chain price feeds
* Low-latency data
* Backup when Chainlink is unavailable

```solidity
// Pyth price feed
IPyth pythOracle;
bytes32 pythPriceId;

function getPythPrice() internal view returns (int256 price) {
    PythStructs.Price memory pythPrice = pythOracle.getPrice(pythPriceId);
    require(pythPrice.price > 0, "Invalid price");
    return int256(pythPrice.price);
}
```

## Oracle Failover

```
┌─────────────────────────────────────────┐
│           getPrice(token)               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Try Chainlink  │
         └────────┬───────┘
                  │
         ┌────────▼────────┐
         │  Price Valid?   │
         └────────┬────────┘
                  │
          Yes ────┼──── No
          │       │       │
          │       │       ▼
          │       │  ┌──────────┐
          │       │  │ Try Pyth │
          │       │  └────┬─────┘
          │       │       │
          │       │  ┌────▼────────┐
          │       │  │ Price Valid?│
          │       │  └────┬────────┘
          │       │       │
          │       │  Yes ─┼── No
          │       │  │    │    │
          ▼       ▼  ▼    │    ▼
     ┌─────────────────┐  │ ┌────────────────┐
     │  Return Price   │  │ │ Circuit Breaker│
     └─────────────────┘  │ │    ACTIVE      │
                          │ └────────────────┘
                          │
                          ▼
                   Return Pyth Price
```

## Price Precision

All prices use 8 decimal precision (10^8 = 100,000,000):

```
ETH/USD: $3,500.00 → 350000000000 (3500 × 10^8)
USDC/USD: $1.00 → 100000000 (1 × 10^8)
```

### Conversion Example

```solidity
uint256 constant ORACLE_SCALE = 1e8;

// Calculate collateral value in USD
function getCollateralValue(uint256 collateral, int256 price)
    internal pure returns (uint256)
{
    // collateral is in 18 decimals (ETH)
    // price is in 8 decimals
    // Result in 6 decimals (USDC)
    return (collateral * uint256(price)) / (ORACLE_SCALE * 1e12);
}
```

## Circuit Breaker

The circuit breaker protects the protocol from oracle manipulation and failures.

### Trigger Conditions

| Condition       | Threshold | Description                       |
| --------------- | --------- | --------------------------------- |
| Invalid Price   | price ≤ 0 | Oracle returning zero or negative |
| Stale Price     | > 1 hour  | Price hasn't updated              |
| Price Deviation | > 15%     | Sudden price movement             |
| Sequencer Down  | N/A       | L2 sequencer offline              |
| Grace Period    | 1 hour    | Post-sequencer recovery           |

### When Active

Circuit breaker blocks:

* ❌ New intent matching
* ❌ Loan repayments
* ❌ Liquidations
* ❌ Collateral additions
* ❌ Collateral withdrawals

Circuit breaker allows:

* ✅ Intent creation (stored but not matchable)
* ✅ Intent cancellation
* ✅ View functions

### Detection Logic

```solidity
function isCircuitBreakerActive() public view returns (bool) {
    // Check price validity
    int256 price = getPrice(collateralToken);
    if (price <= 0) return true;

    // Check staleness
    uint256 lastUpdate = getLastUpdateTime(collateralToken);
    if (block.timestamp - lastUpdate > stalenessTimeout) return true;

    // Check deviation
    int256 lastValidPrice = getLastValidPrice(collateralToken);
    uint256 deviation = calculateDeviation(price, lastValidPrice);
    if (deviation > maxDeviationBps) return true;

    // Check L2 sequencer
    if (isSequencerDown()) return true;

    return false;
}
```

## L2 Sequencer Protection

On Layer 2 networks (Base), the sequencer can go offline. During this time:

* Users cannot submit transactions
* Prices may become stale
* Positions cannot be managed

### Sequencer Feed

```solidity
AggregatorV3Interface sequencerFeed;

function isSequencerUp() internal view returns (bool) {
    (, int256 answer, , uint256 startedAt, ) =
        sequencerFeed.latestRoundData();

    // Check if sequencer is up
    bool isUp = answer == 0;

    // Check grace period after recovery
    bool passedGracePeriod =
        block.timestamp - startedAt > sequencerGracePeriod;

    return isUp && passedGracePeriod;
}
```

### Grace Period

After sequencer recovers:

1. **1 hour grace period** before operations resume
2. Prevents immediate liquidations from stale prices
3. Allows users to manage positions

## Price Validation

### Per-Operation Validation

Each operation validates price freshness:

```solidity
function _validatePrice() internal view {
    int256 price = getPrice(collateralToken);

    require(price > 0, "PriceOracle: invalid price");
    require(!isStale(price), "PriceOracle: stale price");
    require(!exceedsDeviation(price), "PriceOracle: price deviation");
    require(isSequencerUp(), "PriceOracle: sequencer down");
}
```

### Deviation Check

```solidity
uint256 constant MAX_DEVIATION_BPS = 1500; // 15%

function exceedsDeviation(int256 currentPrice)
    internal view returns (bool)
{
    int256 lastValid = lastValidPrice[token];

    // Calculate percentage deviation
    uint256 deviation = abs(currentPrice - lastValid) * 10000 / lastValid;

    return deviation > MAX_DEVIATION_BPS;
}
```

## Configuration

### Protocol Constants

| Parameter              | Value       | Description            |
| ---------------------- | ----------- | ---------------------- |
| `ORACLE_SCALE`         | 10^8        | Price precision        |
| `stalenessTimeout`     | 3,600 sec   | Max price age (1 hour) |
| `maxDeviationBps`      | 1,500 (15%) | Max allowed deviation  |
| `sequencerGracePeriod` | 3,600 sec   | Post-recovery wait     |

### Token-Specific Feeds

| Token    | Chainlink Feed | Pyth Price ID |
| -------- | -------------- | ------------- |
| ETH/USD  | Base Mainnet   | `0xff61...`   |
| USDC/USD | Base Mainnet   | `0xeaa0...`   |

## User Impact

### For Borrowers

When circuit breaker is active:

* Cannot create new loans
* Cannot repay existing loans
* Cannot add collateral
* **Risk**: Position may become liquidatable after breaker lifts

**Recommendation**: Maintain healthy LTV buffer (20%+) to survive oracle downtime.

### For Lenders

When circuit breaker is active:

* Cannot receive repayments
* Cannot liquidate positions
* **Risk**: Extended exposure during market volatility

**Recommendation**: Account for oracle risk in LTV settings.

### For Liquidators

When circuit breaker is active:

* Cannot execute liquidations
* **Risk**: Miss liquidation opportunities

**Recommendation**: Monitor circuit breaker status and prepare transactions.

## Monitoring

### Circuit Breaker Status

```graphql
query CircuitBreakerStatus {
  CircuitBreakerState {
    isActive
    reason
    activatedAt
    lastPriceUpdate
  }
}
```

### Price History

```graphql
query PriceHistory($token: String!) {
  PriceUpdate(
    where: { token: { _eq: $token } }
    order_by: { timestamp: desc }
    limit: 100
  ) {
    price
    source
    timestamp
  }
}
```

## Error Codes

| Error                  | Meaning               |
| ---------------------- | --------------------- |
| `CircuitBreakerActive` | Operations blocked    |
| `StalePriceError`      | Price too old         |
| `InvalidPriceError`    | Price <= 0            |
| `PriceDeviationError`  | Exceeds 15% threshold |
| `SequencerDownError`   | L2 sequencer offline  |

## Security Considerations

### Oracle Manipulation

Protections against manipulation:

1. **Decentralized sources**: Chainlink's node network
2. **Deviation limits**: 15% max movement
3. **Multiple sources**: Chainlink + Pyth fallback
4. **Time-weighted**: Staleness checks

### Flash Loan Attacks

Oracle prices cannot be manipulated within a single transaction:

* Chainlink uses off-chain aggregation
* Pyth requires signed price updates
* No on-chain DEX dependency

## Testnet Considerations

On testnet (Base Sepolia):

* Pyth prices become stale after \~3 hours
* Manual price updates may be required:

```bash
# Update Pyth prices on testnet
PRIVATE_KEY="..." pnpm tsx scripts/update-pyth-prices-v2.ts
```

## Next Steps

* [Fee Structure](04-fee-structure.md)
* [Security Model](05-security-model.md)
* [Error Codes Reference](../reference/02-error-codes.md)
