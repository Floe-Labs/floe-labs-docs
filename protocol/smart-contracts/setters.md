# Setters

## Setters

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/Setters.sol)

**Inherits:** ISetters, Internal

### Functions

#### setMarket

Updates parameters of an existing market.

```solidity
function setMarket(
    bytes32 marketId,
    uint256 interestRateBps,
    uint256 ltvBps,
    uint256 marketFeeBps,
    uint256 liquidationIncentiveBps
) external onlyGovernor onlyWhenMarketCreated(marketId);
```

**Parameters**

| Name                      | Type      | Description                                  |
| ------------------------- | --------- | -------------------------------------------- |
| `marketId`                | `bytes32` | Unique identifier of the market to update.   |
| `interestRateBps`         | `uint256` | Minimum interest rate in basis points.       |
| `ltvBps`                  | `uint256` | Updated loan-to-value ratio in basis points. |
| `marketFeeBps`            | `uint256` | Updated market fee in basis points.          |
| `liquidationIncentiveBps` | `uint256` | Updated liquidation bonus in basis points.   |

#### setHookExecutor

Sets the address of the contract responsible for executing user-defined hooks in a non-priviledged environment.

```solidity
function setHookExecutor(address hookExecutor_) external onlyGovernor;
```

#### setGasForCallExactCheck

Updates the gas limit for the callExactCheck hook executor.

```solidity
function setGasForCallExactCheck(uint32 gasForCallExactCheck_) external onlyGovernor;
```

**Parameters**

| Name                    | Type     | Description                                  |
| ----------------------- | -------- | -------------------------------------------- |
| `gasForCallExactCheck_` | `uint32` | The new gas limit to set for callExactCheck. |

#### setPauseStatus

Allows the governor to pause or unpause operations in a specific market.

```solidity
function setPauseStatus(
    bytes32 marketId,
    bool isAddCollateralPaused,
    bool isBorrowPaused,
    bool isWithdrawCollateralPaused,
    bool isRepayPaused,
    bool isLiquidatePaused
) external onlyGovernor;
```

**Parameters**

| Name                         | Type      | Description                          |
| ---------------------------- | --------- | ------------------------------------ |
| `marketId`                   | `bytes32` | The market to update.                |
| `isAddCollateralPaused`      | `bool`    | Whether adding collateral is paused. |
| `isBorrowPaused`             | `bool`    | Whether borrowing is paused.         |
| `isWithdrawCollateralPaused` | `bool`    |                                      |
| `isRepayPaused`              | `bool`    | Whether repayments are paused.       |
| `isLiquidatePaused`          | `bool`    | Whether liquidations are paused.     |

#### setFlashloanFeeBps

Sets the flashloan fee in basis points.

```solidity
function setFlashloanFeeBps(uint256 _flashloanFeeBps) external onlyGovernor;
```

**Parameters**

| Name               | Type      | Description                                    |
| ------------------ | --------- | ---------------------------------------------- |
| `_flashloanFeeBps` | `uint256` | The new flashloan fee to set, in basis points. |

#### setFeeRecipient

Updates the address where protocol fees are sent.

```solidity
function setFeeRecipient(address _feeRecipient) external onlyGovernor;
```

**Parameters**

| Name            | Type      | Description                |
| --------------- | --------- | -------------------------- |
| `_feeRecipient` | `address` | New fee recipient address. |

#### setPriceOracle

Updates the price oracle used for valuations.

```solidity
function setPriceOracle(address _priceOracle) external onlyGovernor;
```

**Parameters**

| Name           | Type      | Description                               |
| -------------- | --------- | ----------------------------------------- |
| `_priceOracle` | `address` | Address of the new price oracle contract. |

#### setLogicsManager

Updates the lending logics manager used for delegation.

```solidity
function setLogicsManager(address _logicsManager) external onlyGovernor;
```

**Parameters**

| Name             | Type      | Description                                         |
| ---------------- | --------- | --------------------------------------------------- |
| `_logicsManager` | `address` | Address of the new lending logics manager contract. |
