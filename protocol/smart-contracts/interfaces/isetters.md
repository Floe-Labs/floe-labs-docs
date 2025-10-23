# ISetters

## ISetters

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/ISetters.sol)

Interface for setter functions that update protocol and market configuration.

### Functions

#### setMarket

Sets market parameters for a given marketId.

```solidity
function setMarket(
    bytes32 marketId,
    uint256 interestRateBps,
    uint256 ltvBps,
    uint256 marketFeeBps,
    uint256 liquidationIncentiveBps
) external;
```

**Parameters**

| Name                      | Type      | Description                                |
| ------------------------- | --------- | ------------------------------------------ |
| `marketId`                | `bytes32` | The identifier of the market.              |
| `interestRateBps`         | `uint256` | The interest rate in basis points.         |
| `ltvBps`                  | `uint256` | The loan-to-value ratio in basis points.   |
| `marketFeeBps`            | `uint256` | The market fee in basis points.            |
| `liquidationIncentiveBps` | `uint256` | The liquidation incentive in basis points. |

#### setHookExecutor

Sets the address of the hook executor contract.

```solidity
function setHookExecutor(address hookExecutor_) external;
```

**Parameters**

| Name            | Type      | Description                       |
| --------------- | --------- | --------------------------------- |
| `hookExecutor_` | `address` | The address of the hook executor. |

#### setGasForCallExactCheck

Sets the gas limit for call exact check operations.

```solidity
function setGasForCallExactCheck(uint32 gasForCallExactCheck_) external;
```

**Parameters**

| Name                    | Type     | Description            |
| ----------------------- | -------- | ---------------------- |
| `gasForCallExactCheck_` | `uint32` | The gas amount to set. |

#### setPauseStatus

Sets the pause status for various actions in a market.

```solidity
function setPauseStatus(
    bytes32 marketId,
    bool isAddCollateralPaused,
    bool isBorrowPaused,
    bool isWithdrawCollateralPaused,
    bool isRepayPaused,
    bool isLiquidatePaused
) external;
```

**Parameters**

| Name                         | Type      | Description                              |
| ---------------------------- | --------- | ---------------------------------------- |
| `marketId`                   | `bytes32` | The identifier of the market.            |
| `isAddCollateralPaused`      | `bool`    | Pause status for adding collateral.      |
| `isBorrowPaused`             | `bool`    | Pause status for borrowing.              |
| `isWithdrawCollateralPaused` | `bool`    | Pause status for withdrawing collateral. |
| `isRepayPaused`              | `bool`    | Pause status for repaying.               |
| `isLiquidatePaused`          | `bool`    | Pause status for liquidations.           |

#### setFlashloanFeeBps

Sets the flashloan fee in basis points.

```solidity
function setFlashloanFeeBps(uint256 _flashloanFeeBps) external;
```

**Parameters**

| Name               | Type      | Description                        |
| ------------------ | --------- | ---------------------------------- |
| `_flashloanFeeBps` | `uint256` | The flashloan fee in basis points. |

#### setFeeRecipient

Sets the address that receives protocol fees.

```solidity
function setFeeRecipient(address _feeRecipient) external;
```

**Parameters**

| Name            | Type      | Description                       |
| --------------- | --------- | --------------------------------- |
| `_feeRecipient` | `address` | The address of the fee recipient. |

#### setPriceOracle

Sets the address of the price oracle contract.

```solidity
function setPriceOracle(address _priceOracle) external;
```

**Parameters**

| Name           | Type      | Description                      |
| -------------- | --------- | -------------------------------- |
| `_priceOracle` | `address` | The address of the price oracle. |

#### setLogicsManager

Sets the address of the lending logics manager contract.

```solidity
function setLogicsManager(address _logicsManager) external;
```

**Parameters**

| Name             | Type      | Description                                |
| ---------------- | --------- | ------------------------------------------ |
| `_logicsManager` | `address` | The address of the lending logics manager. |
