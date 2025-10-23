# IGetters

## IGetters

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/IGetters.sol)

Interface for getter functions that provide protocol, market, loan, and intent data.

### Functions

#### getMarketId

Returns the market ID for a given loan and collateral token.

```solidity
function getMarketId(address loanToken, address collateralToken) external pure returns (bytes32);
```

**Parameters**

| Name              | Type      | Description                          |
| ----------------- | --------- | ------------------------------------ |
| `loanToken`       | `address` | The address of the loan token.       |
| `collateralToken` | `address` | The address of the collateral token. |

**Returns**

| Name     | Type      | Description                      |
| -------- | --------- | -------------------------------- |
| `<none>` | `bytes32` | The market ID as a bytes32 hash. |

#### getMarket

Retrieves the Market struct associated with a given marketId.

```solidity
function getMarket(bytes32 marketId) external view returns (Market memory);
```

**Parameters**

| Name       | Type      | Description                                      |
| ---------- | --------- | ------------------------------------------------ |
| `marketId` | `bytes32` | The unique identifier of the market to retrieve. |

**Returns**

| Name     | Type     | Description                                               |
| -------- | -------- | --------------------------------------------------------- |
| `<none>` | `Market` | The Market struct corresponding to the provided marketId. |

#### getFlashloanFeeBps

Retrieves the current flashloan fee in basis points.

```solidity
function getFlashloanFeeBps() external view returns (uint256);
```

**Returns**

| Name     | Type      | Description                        |
| -------- | --------- | ---------------------------------- |
| `<none>` | `uint256` | The flashloan fee in basis points. |

#### getLoan

Retrieves the Loan struct associated with a given loanId.

```solidity
function getLoan(uint256 loanId) external view returns (Loan memory);
```

**Parameters**

| Name     | Type      | Description                                    |
| -------- | --------- | ---------------------------------------------- |
| `loanId` | `uint256` | The unique identifier of the loan to retrieve. |

**Returns**

| Name     | Type   | Description                                           |
| -------- | ------ | ----------------------------------------------------- |
| `<none>` | `Loan` | The Loan struct corresponding to the provided loanId. |

#### getLoanPrincipal

Retrieves the principal amount of a given loan.

```solidity
function getLoanPrincipal(uint256 loanId) external view returns (uint256);
```

**Parameters**

| Name     | Type      | Description                        |
| -------- | --------- | ---------------------------------- |
| `loanId` | `uint256` | The unique identifier of the loan. |

**Returns**

| Name     | Type      | Description                       |
| -------- | --------- | --------------------------------- |
| `<none>` | `uint256` | The principal amount of the loan. |

#### getOnChainLendIntent

Retrieves the on-chain lend intent associated with a given hash.

```solidity
function getOnChainLendIntent(bytes32 hash) external view returns (LendIntent memory);
```

**Parameters**

| Name   | Type      | Description                  |
| ------ | --------- | ---------------------------- |
| `hash` | `bytes32` | The hash of the lend intent. |

**Returns**

| Name     | Type         | Description                                               |
| -------- | ------------ | --------------------------------------------------------- |
| `<none>` | `LendIntent` | The LendIntent struct corresponding to the provided hash. |

#### getOnChainBorrowIntent

Retrieves the on-chain borrow intent associated with a given hash.

```solidity
function getOnChainBorrowIntent(bytes32 hash) external view returns (BorrowIntent memory);
```

**Parameters**

| Name   | Type      | Description                    |
| ------ | --------- | ------------------------------ |
| `hash` | `bytes32` | The hash of the borrow intent. |

**Returns**

| Name     | Type           | Description                                                 |
| -------- | -------------- | ----------------------------------------------------------- |
| `<none>` | `BorrowIntent` | The BorrowIntent struct corresponding to the provided hash. |

#### getAccruedInterest

Retrieves the accrued interest and time elapsed for a given loan.

```solidity
function getAccruedInterest(uint256 loanId) external view returns (uint256 interest, uint256 timeElapsed);
```

**Parameters**

| Name     | Type      | Description                        |
| -------- | --------- | ---------------------------------- |
| `loanId` | `uint256` | The unique identifier of the loan. |

**Returns**

| Name          | Type      | Description                                           |
| ------------- | --------- | ----------------------------------------------------- |
| `interest`    | `uint256` | The accrued interest amount.                          |
| `timeElapsed` | `uint256` | The time elapsed since the last interest calculation. |

#### getCurrentLtvBps

Retrieves the current loan-to-value ratio in basis points for a given loan.

```solidity
function getCurrentLtvBps(uint256 loanId) external view returns (uint256);
```

**Parameters**

| Name     | Type      | Description                        |
| -------- | --------- | ---------------------------------- |
| `loanId` | `uint256` | The unique identifier of the loan. |

**Returns**

| Name     | Type      | Description                      |
| -------- | --------- | -------------------------------- |
| `<none>` | `uint256` | The current LTV in basis points. |

#### getLoanIdsByUser

Retrieves all loan IDs associated with a given user.

```solidity
function getLoanIdsByUser(address user) external view returns (uint256[] memory);
```

**Parameters**

| Name   | Type      | Description              |
| ------ | --------- | ------------------------ |
| `user` | `address` | The address of the user. |

**Returns**

| Name     | Type        | Description                                 |
| -------- | ----------- | ------------------------------------------- |
| `<none>` | `uint256[]` | An array of loan IDs belonging to the user. |

#### getRequiredCollateralAmount

Calculates the required collateral amount for a given market, borrow amount, and custom LTV.

```solidity
function getRequiredCollateralAmount(bytes32 marketId, uint256 borrowAmount, uint256 customLtvBps)
    external
    view
    returns (uint256 requiredCollateralAmount);
```

**Parameters**

| Name           | Type      | Description                                     |
| -------------- | --------- | ----------------------------------------------- |
| `marketId`     | `bytes32` | The unique identifier of the market.            |
| `borrowAmount` | `uint256` | The amount to borrow.                           |
| `customLtvBps` | `uint256` | The custom loan-to-value ratio in basis points. |

**Returns**

| Name                       | Type      | Description                     |
| -------------------------- | --------- | ------------------------------- |
| `requiredCollateralAmount` | `uint256` | The required collateral amount. |

#### getPrice

Returns the price of the collateralToken in terms of the loanToken from the PriceOracle.

```solidity
function getPrice(address collateralToken, address loanToken) external view returns (uint256 price);
```

**Parameters**

| Name              | Type      | Description                          |
| ----------------- | --------- | ------------------------------------ |
| `collateralToken` | `address` | The address of the collateral token. |
| `loanToken`       | `address` | The address of the loan token.       |

**Returns**

| Name    | Type      | Description                |
| ------- | --------- | -------------------------- |
| `price` | `uint256` | The price from the oracle. |
