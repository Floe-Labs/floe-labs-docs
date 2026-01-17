# Security Model

Floe's approach to security, risk mitigation, and protecting user funds.

## Security Overview

Floe's security model is built on:
1. **Overcollateralization**: All loans backed by excess collateral
2. **Isolated Risk**: P2P loans don't share risk
3. **Oracle Redundancy**: Dual-oracle with circuit breaker
4. **Conservative Parameters**: Built-in safety margins
5. **Upgradeable Contracts**: Ability to patch vulnerabilities

## Risk Categories

### Smart Contract Risk

**Mitigation:**
- Audited codebase
- UUPS proxy for upgrades
- Foundry testing with high coverage
- Formal verification of critical paths

### Oracle Risk

**Mitigation:**
- Chainlink primary oracle
- Pyth fallback oracle
- Circuit breaker on anomalies
- Staleness checks (1 hour)
- Deviation limits (15%)

### Liquidation Risk

**Mitigation:**
- 8% LTV gap requirement
- 3% withdrawal buffer
- Competitive liquidator ecosystem
- No grace period (immediate liquidation allowed)

### Counterparty Risk

**Mitigation:**
- Isolated P2P loans (no pool risk)
- Full collateralization
- On-chain transparency
- No rehypothecation

## Access Control

### Role-Based Permissions

| Action | Who Can Execute |
|--------|-----------------|
| Create intents | Any user |
| Cancel own intent | Intent owner |
| Match intents | Anyone (solvers) |
| Repay loan | Borrower only |
| Add collateral | Borrower only |
| Withdraw collateral | Borrower only |
| Liquidate | Anyone (if conditions met) |
| Upgrade contracts | Owner (multisig) |
| Pause protocol | Owner (emergency) |

### Owner Capabilities

The contract owner can:
- Upgrade implementation contracts
- Add/remove markets
- Adjust protocol parameters
- Pause in emergencies

The owner **cannot**:
- Access user funds
- Modify existing loans
- Prevent withdrawals
- Change loan terms retroactively

## Collateral Safety

### LTV Gap Enforcement

```
┌─────────────────────────────────────────────────────────────────────┐
│                       LTV SAFETY ZONES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   0%        50%       60%       68%       72%       80%       100%  │
│   │──────────│─────────│─────────│─────────│─────────│─────────│    │
│              │         │         │         │         │              │
│              │  SAFE   │    │    │  DANGER │  LIQUID │              │
│              │  ZONE   │ BUFFER  │  ZONE   │  ZONE   │              │
│              │         │  (8%)   │         │         │              │
│              │         │         │         │         │              │
│              │◄───────────────────────────►│         │              │
│              │    Borrower operating       │         │              │
│              │         range               │         │              │
│                                                                      │
│   Origin LTV ─────────────────────────► Liquidation LTV             │
│      60%                                     80%                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Withdrawal Buffer

Users cannot withdraw collateral if it would bring LTV within 3% of liquidation:

```solidity
uint256 constant WITHDRAWAL_BUFFER_BPS = 300; // 3%

function canWithdraw(uint256 loanId, uint256 amount) public view returns (bool) {
    uint256 newLtv = calculateLtvAfterWithdraw(loanId, amount);
    uint256 maxAllowedLtv = loan.liquidationLtvBps - WITHDRAWAL_BUFFER_BPS;
    return newLtv <= maxAllowedLtv;
}
```

## Circuit Breaker

### Trigger Conditions

| Condition | Threshold | Response |
|-----------|-----------|----------|
| Price = 0 | Immediate | Block all operations |
| Stale price | > 1 hour | Block all operations |
| Price deviation | > 15% | Block all operations |
| Sequencer down | Immediate | Block all operations |
| Sequencer recovery | < 1 hour | Wait for grace period |

### Protected Operations

When circuit breaker is active:

```solidity
modifier whenCircuitBreakerInactive() {
    require(!isCircuitBreakerActive(), "CircuitBreakerActive");
    _;
}

// These functions use the modifier:
function matchLoanIntents(...) external whenCircuitBreakerInactive { }
function repayLoan(...) external whenCircuitBreakerInactive { }
function liquidateLoan(...) external whenCircuitBreakerInactive { }
function addCollateral(...) external whenCircuitBreakerInactive { }
function withdrawCollateral(...) external whenCircuitBreakerInactive { }
```

## Upgrades & Governance

### UUPS Proxy Pattern

```solidity
contract LendingIntentMatcherUpgradeable is
    UUPSUpgradeable,
    OwnableUpgradeable
{
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {
        // Additional validation can be added
    }
}
```

### Upgrade Process

1. Deploy new implementation
2. Verify on block explorer
3. Test on fork
4. Execute upgrade via multisig
5. Verify functionality

### Storage Safety

Upgrades preserve storage layout:
- New variables added at end only
- Existing slots never reordered
- Inheritance chain preserved

## Emergency Procedures

### Pause Mechanism

```solidity
function pause() external onlyOwner {
    _pause();
    emit ProtocolPaused(msg.sender);
}

function unpause() external onlyOwner {
    _unpause();
    emit ProtocolUnpaused(msg.sender);
}
```

### When Paused

- All state-changing operations blocked
- Users can still cancel intents
- View functions remain available
- Loans continue accruing interest

### Recovery Steps

1. Identify and assess issue
2. Pause protocol if needed
3. Deploy fix (if contract issue)
4. Test thoroughly
5. Execute upgrade
6. Unpause protocol

## Attack Vectors & Mitigations

### Flash Loan Attacks

**Risk**: Attacker manipulates prices within single transaction

**Mitigation**:
- Oracle prices are external (Chainlink/Pyth)
- No on-chain AMM dependency
- Price cannot be manipulated in same tx

### Front-Running

**Risk**: MEV bots front-run liquidations or matches

**Mitigation**:
- Liquidators can use Flashbots
- Competition benefits users (faster execution)
- No significant profit from front-running matches

### Reentrancy

**Risk**: Callback exploitation during token transfers

**Mitigation**:
- Checks-effects-interactions pattern
- ReentrancyGuard on critical functions
- No external calls before state updates

```solidity
function repayLoan(uint256 loanId, uint256 maxAmount)
    external
    nonReentrant
{
    // Update state first
    loans[loanId].repaid = true;

    // Then transfer tokens
    loanToken.safeTransferFrom(msg.sender, lender, amount);
}
```

### Integer Overflow/Underflow

**Risk**: Arithmetic errors causing unexpected behavior

**Mitigation**:
- Solidity 0.8+ (automatic overflow checks)
- Explicit bounds checking
- Safe math for critical calculations

### Oracle Manipulation

**Risk**: Corrupted price data leading to incorrect liquidations

**Mitigation**:
- Decentralized Chainlink feeds
- Pyth fallback
- 15% deviation limit
- Staleness checks

## Audit Status

### Completed Audits

| Auditor | Date | Scope | Findings |
|---------|------|-------|----------|
| TBD | TBD | Core contracts | TBD |

### Bug Bounty

Contact: security@floelabs.xyz

| Severity | Reward |
|----------|--------|
| Critical | Up to $50,000 |
| High | Up to $20,000 |
| Medium | Up to $5,000 |
| Low | Up to $1,000 |

## Security Checklist

### For Users

- [ ] Verify you're on the official app (app.floelabs.xyz)
- [ ] Check contract addresses match documentation
- [ ] Understand liquidation risks before borrowing
- [ ] Maintain healthy LTV buffer (20%+ recommended)
- [ ] Don't approve unlimited amounts if concerned
- [ ] Monitor positions during market volatility

### For Developers

- [ ] Use official SDK from npm
- [ ] Verify contract ABIs match deployed code
- [ ] Handle reverts gracefully
- [ ] Validate all user inputs
- [ ] Use secure RPC providers
- [ ] Never expose private keys in code

### For Operators

- [ ] Secure private keys (HSM/multisig)
- [ ] Monitor bot health continuously
- [ ] Set appropriate gas limits
- [ ] Have backup RPC providers
- [ ] Monitor protocol events for anomalies

## Known Limitations

1. **No partial liquidation**: Entire loan liquidated at once
2. **No position migration**: Cannot transfer loans between users
3. **Single collateral type**: One collateral token per loan
4. **Fixed interest rate**: Rate doesn't change during loan

## Disclosure Policy

### Reporting Vulnerabilities

1. Email security@floelabs.xyz
2. Include detailed description
3. Provide reproduction steps
4. Do not disclose publicly
5. Allow 90 days for fix

### Response Timeline

| Stage | Timeframe |
|-------|-----------|
| Acknowledgment | 24 hours |
| Initial Assessment | 72 hours |
| Fix Development | 1-4 weeks |
| Deployment | After testing |
| Disclosure | After fix deployed |

## Next Steps

- [Error Codes Reference](../reference/02-error-codes.md)
- [FAQ](../reference/03-faq.md)
- [Risk & Liquidation](../user-guides/04-risk-and-liquidation.md)
