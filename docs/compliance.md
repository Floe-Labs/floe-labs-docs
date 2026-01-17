# Compliance Notes

Regulatory and compliance considerations for Floe protocol.

## Disclaimer

This documentation is for informational purposes only. Floe Labs does not provide legal, tax, or regulatory advice. Users should consult qualified professionals regarding their specific circumstances.

## Protocol Design

### Decentralized Architecture

Floe is designed as a decentralized, permissionless protocol:
- Smart contracts deployed on public blockchains
- No central custodian of user funds
- Peer-to-peer matching without intermediaries
- Open-source, auditable code

### User Custody

Users maintain custody of their assets:
- Collateral held in smart contracts, not by Floe Labs
- Users control their own private keys
- No access to user funds by protocol team

## Compliance Features

### For Institutional Users

Floe provides tools for compliance-conscious users:

| Feature | Description |
|---------|-------------|
| ERC-1271 | Smart contract wallet support for treasuries |
| On-chain Records | Complete transaction audit trail |
| Hooks | Programmable compliance logic |
| Reporting | Exportable transaction history |

### KYC/AML Hooks

Optional hooks can enforce compliance requirements:

```solidity
// Example: Whitelist-only lending
contract KYCHook is ILoanHook {
    mapping(address => bool) public verified;

    function onCreate(uint256 loanId, bytes calldata data) external {
        // Only allow verified counterparties
        require(verified[borrower], "Not KYC verified");
    }
}
```

### Treasury Controls

For DAOs and institutions:
- Multi-signature approval for transactions
- Role-based access control
- Audit-ready transaction logs

## Regulatory Considerations

### DeFi Lending

DeFi lending protocols operate in an evolving regulatory landscape. Users should consider:

- Local securities laws
- Lending regulations
- Tax obligations
- Reporting requirements

### Geographic Restrictions

Certain jurisdictions may have restrictions on:
- DeFi protocol usage
- Cryptocurrency lending
- Token holdings

Users are responsible for ensuring compliance with local laws.

## Token Considerations

### $FLOE Token (Future)

When launched, the $FLOE token may be subject to:
- Securities regulations
- Tax treatment
- Transfer restrictions

Detailed token compliance information will be provided at launch.

## Best Practices

### For Users

1. Consult legal counsel for significant transactions
2. Maintain records for tax reporting
3. Understand local regulations
4. Use compliant on/off ramps

### For DAOs

1. Establish treasury policies
2. Document governance decisions
3. Consider multi-sig requirements
4. Maintain audit trails

### For Institutions

1. Conduct due diligence
2. Implement internal controls
3. Use KYC/AML hooks if required
4. Work with compliance teams

## Contact

For compliance-related inquiries:
- Email: compliance@floelabs.xyz

*This page does not constitute legal advice. Regulations vary by jurisdiction and change over time.*
