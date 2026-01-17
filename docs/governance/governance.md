# Governance

How Floe is governed and the path to decentralization.

## Current State: Phase 0

Floe is currently in **Phase 0: Multisig Guardianship**.

### Governance Structure

| Role | Address/Entity | Responsibility |
|------|----------------|----------------|
| Governor | Team Multisig | Protocol upgrades, parameter changes |
| Emergency | Team Multisig | Pause protocol if needed |
| Treasury | Team Multisig | Fee collection and distribution |

### Current Powers

The Governor multisig can:
- Create new markets
- Adjust protocol parameters (LTV limits, fees, oracle settings)
- Pause/unpause protocol operations
- Upgrade contract implementations
- Add/remove hooks from allowlist

The Governor **cannot**:
- Access user funds or collateral
- Modify existing loan terms
- Prevent loan repayments (when unpaused)
- Change historical data

## Governance Phases

### Phase 0: Multisig Guardianship (Current)

**Duration**: Launch through initial growth phase

| Feature | Implementation |
|---------|----------------|
| Upgrades | Timelocked (24-48 hours) |
| Parameters | Multisig approval |
| Emergency | Immediate pause capability |
| Transparency | All actions on-chain |

### Phase 1: Token DAO

**Target**: After protocol stability proven

| Feature | Implementation |
|---------|----------------|
| Voting | $FLOE token-weighted |
| Quorum | 4% of supply |
| Timelock | 48-hour delay |
| Delegation | Vote delegation supported |

**Governable Items**:
- Protocol parameters
- Hook registry
- Fee distribution
- Treasury allocation
- Market listings

### Phase 2: AI-Assisted Governance

**Target**: Long-term vision

| Feature | Implementation |
|---------|----------------|
| Analysis | AI monitors protocol health |
| Proposals | AI suggests parameter changes |
| Approval | Human DAO vote required |
| Guardrails | Hard limits on AI suggestions |

## Governable Parameters

### Market Parameters

| Parameter | Current Value | Governable |
|-----------|---------------|------------|
| Min LTV Gap | 8% (800 bps) | ✅ |
| Withdrawal Buffer | 3% (300 bps) | ✅ |
| Liquidation Bonus | 5% (500 bps) | ✅ |
| Market Fee | Per market | ✅ |

### Oracle Parameters

| Parameter | Current Value | Governable |
|-----------|---------------|------------|
| Staleness Timeout | 3,600 sec | ✅ |
| Max Deviation | 15% (1,500 bps) | ✅ |
| Sequencer Grace | 3,600 sec | ✅ |

### Protocol Settings

| Setting | Governable |
|---------|------------|
| Price Oracle Address | ✅ |
| Hook Executor Address | ✅ |
| Fee Recipient | ✅ |
| Flash Loan Fee | ✅ |

## Upgrade Process

### Standard Upgrade

1. **Proposal**: New implementation deployed
2. **Review**: Community review period (48+ hours)
3. **Verification**: Code verified on block explorer
4. **Testing**: Fork testing completed
5. **Execution**: Multisig executes upgrade
6. **Confirmation**: Post-upgrade verification

### Emergency Upgrade

For critical security issues:

1. **Discovery**: Vulnerability identified
2. **Assessment**: Severity evaluated
3. **Pause**: Protocol paused if needed
4. **Fix**: Patch developed and tested
5. **Upgrade**: Expedited multisig execution
6. **Resume**: Protocol unpaused

## Pause Mechanism

### What Can Be Paused

Per-market pause controls:
- Add collateral
- Borrow
- Withdraw collateral
- Repay
- Liquidate

### When to Pause

- Oracle manipulation detected
- Smart contract vulnerability discovered
- External dependency failure
- Abnormal market conditions

### Pause Process

1. Governor detects issue
2. `setPauseStatus` called for affected market
3. Affected operations blocked
4. Issue resolved
5. Operations unpaused

## Transparency

### On-Chain Records

All governance actions are on-chain:
- Parameter changes
- Upgrades
- Pause/unpause
- Market creation

### Monitoring

- [Governance Dashboard](https://app.floelabs.xyz/governance)
- Discord announcements
- GitHub releases

## Community Participation

### Current

- Provide feedback on Discord
- Report bugs and issues
- Suggest features
- Run solver/liquidation bots

### Future (Phase 1+)

- Hold $FLOE tokens
- Vote on proposals
- Delegate votes
- Create proposals

## Security Considerations

### Multisig Security

- Hardware wallet signers
- Geographically distributed
- Regular key rotation
- No single point of failure

### Upgrade Safety

- All upgrades preserve storage layout
- Extensive fork testing
- Gradual rollout when possible
- Rollback procedures ready

## Timeline

| Phase | Status | Target |
|-------|--------|--------|
| Phase 0 | ✅ Active | Current |
| Phase 1 | 📋 Planned | After stability |
| Phase 2 | 🔮 Vision | Long-term |

## Contact

- **Governance Discussion**: Discord #governance
- **Proposals**: GitHub Discussions
- **Security**: security@floelabs.xyz
