# Wallets & ERC-1271

Using smart contract wallets, multisigs, and DAOs with Floe.

## Overview

Floe supports multiple wallet types:
- **EOA (Standard Wallets)**: MetaMask, Coinbase Wallet, Rainbow, etc.
- **Smart Contract Wallets**: Safe (Gnosis), Argent, smart accounts
- **Multisigs**: Multi-party approval for treasuries and DAOs

## Supported Wallets

### EOA Wallets

Standard wallets work seamlessly:

| Wallet | Status |
|--------|--------|
| MetaMask | ✅ Fully supported |
| Coinbase Wallet | ✅ Fully supported |
| Rainbow | ✅ Fully supported |
| WalletConnect | ✅ Fully supported |

EOA wallets sign intents using `eth_signTypedData_v4` (EIP-712).

### Smart Contract Wallets

Smart contract wallets use ERC-1271 for signature validation:

| Wallet | Status |
|--------|--------|
| Safe (Gnosis Safe) | ✅ Fully supported |
| Argent | ✅ Fully supported |
| Sequence | ✅ Fully supported |
| Smart Accounts (ERC-4337) | ✅ Fully supported |

## ERC-1271 Explained

ERC-1271 is a standard that allows smart contracts to validate signatures. Instead of checking a cryptographic signature directly, the Floe contract calls the wallet's `isValidSignature` function:

```solidity
interface IERC1271 {
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view returns (bytes4);

    // Returns 0x1626ba7e if valid
}
```

### How It Works

1. **Intent Creation**: DAO proposes a lend or borrow intent
2. **Multisig Approval**: Required signers approve the proposal
3. **Signature Generation**: Safe generates an ERC-1271 compatible signature
4. **Verification**: Floe contract calls `isValidSignature` to verify

## Using Safe (Gnosis Safe)

### Step 1: Create Intent Transaction

In the Safe app:

1. Go to **New Transaction** → **Contract Interaction**
2. Enter Floe contract address: `0x17946cD3e180f82e632805e5549EC913330Bb175`
3. Select `registerLendIntent` or `registerBorrowIntent`
4. Fill in intent parameters

### Step 2: Collect Signatures

- Required signers approve the transaction
- Safe accumulates signatures until threshold is met

### Step 3: Execute

- Once threshold is reached, any signer can execute
- Intent is registered on-chain from the Safe address

### Example: DAO Lending Strategy

```
DAO Treasury (Safe):
├── 3-of-5 multisig
├── 1M USDC idle
└── Goal: Earn 5% APR

Intent Parameters:
├── Amount: 500,000 USDC
├── Min Rate: 5% APR
├── Max LTV: 75%
├── Duration: 90 days
├── Partial Fill: Yes
└── Min Fill: 10,000 USDC
```

## Off-Chain vs On-Chain Intents

### Off-Chain (Recommended for DAOs)

1. Prepare intent off-chain
2. Collect multisig signatures via Safe Transaction Service
3. Matcher includes signatures when calling `matchLoanIntents`

**Benefits**:
- No gas for intent creation
- Intents can be cancelled without transaction

### On-Chain

1. Submit `registerLendIntent` / `registerBorrowIntent` transaction
2. Execute via multisig
3. Intent stored on-chain

**Benefits**:
- Visible in orderbook immediately
- No coordination with matcher needed

## Delegation

Allow trusted addresses to manage intents on behalf of the wallet:

### Use Cases

- **Bot Operators**: Let a hot wallet manage positions
- **Portfolio Managers**: Delegate to fund managers
- **AI Agents**: Allow Lendr to execute within limits

### Implementation

```solidity
// Future: Delegation registry
interface IDelegation {
    function delegate(
        address delegatee,
        uint256 maxAmount,
        uint256 expiry
    ) external;

    function isDelegated(
        address delegator,
        address delegatee
    ) external view returns (bool);
}
```

*Note: Delegation is planned for a future release.*

## Best Practices for DAOs

### Treasury Management

1. **Diversify**: Don't lend entire treasury through single intent
2. **Partial Fill**: Enable to allow multiple smaller matches
3. **Conservative LTV**: Use 70-75% max LTV for safety buffer
4. **Monitoring**: Set up alerts for loan health

### Risk Controls

1. **Intent Limits**: Max single intent as % of treasury
2. **Duration Limits**: Cap at 90 days for liquidity
3. **Rate Floors**: Set minimum acceptable APR
4. **Counterparty Rules**: Use whitelist hooks if needed

### Governance Integration

```
Proposal Template:
├── Title: Lend 100k USDC via Floe
├── Amount: 100,000 USDC
├── Min Rate: 5% APR
├── Max LTV: 75%
├── Duration: 30 days
└── Expiry: 14 days from proposal pass
```

## Security Considerations

### For Smart Contract Wallets

1. **Signature Validity**: Only valid while Safe config unchanged
2. **Owner Changes**: New owners must re-sign if threshold changes
3. **Cancellation**: Off-chain intents can be cancelled by any owner

### For Multisigs

1. **Threshold**: Higher threshold = more security, slower execution
2. **Backup Signers**: Ensure enough signers available for emergencies
3. **Regular Review**: Audit intent positions periodically

## Troubleshooting

### Intent Verification Failed

**Cause**: Safe signature not valid for current owner set

**Solution**:
- Regenerate signature with current owners
- Ensure all signers are still authorized

### Transaction Stuck

**Cause**: Not enough signatures or gas

**Solution**:
- Check if threshold is met
- Verify gas estimation is correct

### Intent Not Appearing

**Cause**: Off-chain intent not indexed

**Solution**:
- Submit on-chain via `registerLendIntent`
- Contact support if issue persists

## Support

- **Technical**: dev@floelabs.xyz
- **DAO Onboarding**: hello@floelabs.xyz
- **Discord**: #dao-support channel
