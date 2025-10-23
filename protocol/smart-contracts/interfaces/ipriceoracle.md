# IPriceOracle

## IPriceOracle

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/IPriceOracle.sol)

Interface that price oracles for markets used must implement.

### Functions

#### getPrice

Returns the price of 1 asset of collateral token quoted in 1 asset of loan token, scaled by 1e36.

It corresponds to the price of 10\*\*(collateral token decimals) assets of collateral token quoted in 10\*\*(loan token decimals) assets of loan token with `36 + loan token decimals - collateral token decimals` decimals of precision.

```solidity
function getPrice(address collateralToken, address loanToken) external view returns (uint256);
```
