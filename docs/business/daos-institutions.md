# For DAOs & Institutions

Enterprise features for treasuries, DAOs, and institutional users.

## Why Floe for Organizations

### Treasury Yield

Put idle stablecoins to work:

| Feature | Benefit |
|---------|---------|
| Customizable Terms | Set your own risk parameters |
| No Pool Risk | Isolated loans, no bad debt socialization |
| Predictable Yields | Fixed-rate loans, known returns |
| Partial Fill | Diversify across multiple borrowers |

### Borrowing Against Holdings

Access liquidity without selling:

| Feature | Benefit |
|---------|---------|
| Maintain Governance | Keep voting rights on collateral |
| Tax Efficiency | Avoid taxable sales |
| Fixed Costs | Known interest rate |
| Flexible Terms | Custom durations |

## Treasury Use Cases

### Conservative Yield Strategy

```
Treasury: 5M USDC

Strategy:
├── 2M USDC - Short-term (30 days)
│   └── Min Rate: 4%, Max LTV: 70%
├── 2M USDC - Medium-term (90 days)
│   └── Min Rate: 5%, Max LTV: 75%
└── 1M USDC - Reserve

Expected Yield: ~4.5% APR
Risk Level: Low
```

### Credit Line for Operations

```
Holdings: 1000 ETH

Strategy:
├── Borrow: 500k USDC
├── Collateral: 300 ETH
├── Max Rate: 6%
├── Duration: 90 days
└── Use: Operations, payroll, grants

Benefit: Keep ETH exposure while accessing USD
```

## Compliance Features

### Audit Trail

All actions recorded on-chain:
- Intent creation timestamps
- Match details
- Repayment history
- Collateral movements

### Exportable Reports

Generate reports for:
- Treasury accounting
- Tax reporting
- Governance transparency
- Auditor requests

### Hooks for Compliance

| Hook | Purpose |
|------|---------|
| Whitelist | Limit counterparties |
| KYC Gate | Require verified parties |
| Jurisdiction | Geographic restrictions |
| Amount Limits | Per-transaction caps |

## Technical Integration

### ERC-1271 Support

Use multisig treasuries directly:

1. Floe supports Safe, Aragon, and other ERC-1271 wallets
2. No fund transfers needed
3. Maintain custody at all times
4. Full multisig approval flow

### API Access

For treasury management systems:

```typescript
// Query treasury positions
const positions = await sdk.indexer.getUserLoans(treasuryAddress);

// Create intent via governance
const intent = await sdk.lending.prepareLendIntent({
  amount: parseUnits('1000000', 6),
  minInterestRateBps: 500,
  maxLtvBps: 7500,
  duration: 90 * 24 * 60 * 60,
});

// Submit via multisig
await safeWallet.proposeTransaction(intent);
```

### Monitoring & Alerts

Set up monitoring for:
- Loan health changes
- Matched intents
- Repayment due dates
- Collateral value changes

## Risk Management

### LTV Recommendations

| Risk Tolerance | Max LTV | Use Case |
|----------------|---------|----------|
| Conservative | 65-70% | Long-term treasuries |
| Moderate | 70-75% | Active management |
| Aggressive | 75-80% | Short-term operations |

### Diversification

| Strategy | Benefit |
|----------|---------|
| Multiple Intents | Spread across borrowers |
| Partial Fills | Smaller individual exposures |
| Duration Mix | Ladder maturities |

### Emergency Procedures

If loan health deteriorates:
1. Monitor alerts triggered
2. Add collateral via multisig
3. Or repay early
4. All actions require governance

## Onboarding Process

### Step 1: Initial Consultation

- Discuss treasury goals
- Review risk tolerance
- Plan integration approach

### Step 2: Technical Setup

- Configure multisig integration
- Set up monitoring
- Test on testnet

### Step 3: Governance Proposal

- Draft lending/borrowing policy
- Community/token holder approval
- Execute approved strategy

### Step 4: Ongoing Management

- Regular position reviews
- Adjust parameters as needed
- Reporting and compliance

## Case Studies

### DAO Treasury Yield

*Example based on typical use case*

```
DAO: Protocol Treasury
Size: 10M USDC idle
Goal: Earn yield while maintaining liquidity

Implementation:
├── Allocated: 3M USDC to Floe
├── Strategy: 90-day max, 75% LTV, 5% min rate
├── Result: ~150k USDC annual yield
└── Benefit: No governance token selling
```

### Working Capital

*Example based on typical use case*

```
Project: DeFi Protocol
Need: 200k USDC for operations
Holdings: 500 ETH

Implementation:
├── Collateral: 100 ETH
├── Borrowed: 200k USDC
├── Rate: 5.5% APR
├── Duration: 60 days
└── Benefit: Maintained ETH exposure
```

## Enterprise Support

### Dedicated Assistance

For institutional users:
- Dedicated account manager
- Priority technical support
- Custom integration help
- Governance consulting

### SLA

| Service | Commitment |
|---------|------------|
| Response Time | < 4 hours |
| Uptime | 99.9% target |
| Integration Support | Dedicated engineer |

## Contact

- **Institutional Sales**: institutions@floelabs.xyz
- **Technical Integration**: dev@floelabs.xyz
- **Partnerships**: partnerships@floelabs.xyz

Schedule a call: [calendly.com/floelabs](https://calendly.com/floelabs)
