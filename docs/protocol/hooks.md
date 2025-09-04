# Hooks (Programmable Loans)

**Categories**: Collateral Mgmt, Liquidation, Credit/Access, Rates.

**Interface (sketch)**
```solidity
interface ILoanHook {
  function onCreate(address loan, bytes calldata data) external;
  function onTopUp(address loan, uint256 addl) external;
  function onBeforeLiquidate(address loan) external returns (bytes memory action);
  function onAfterRepay(address loan) external;
}
```
**Safety:** Start with allowlisted audited hooks; roadmap to permissionless with safeguards.
