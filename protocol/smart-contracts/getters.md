# Getters

## Getters

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/Getters.sol)

**Inherits:** IGetters, Internal

### Functions

#### getMarket

Returns the configuration of a given market.

```solidity
function getMarket(bytes32 marketId) public view returns (Market memory);
```

**Parameters**

| Name       | Type      | Description            |
| ---------- | --------- | ---------------------- |
| `marketId` | `bytes32` | The market identifier. |

**Returns**

| Name     | Type     | Description                                |
| -------- | -------- | ------------------------------------------ |
| `<none>` | `Market` | The Market struct with configuration data. |

#### getMarketId

Returns the market ID for a given loan and collateral token.

```solidity
function getMarketId(address loanToken, address collateralToken) public pure returns (bytes32);
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

#### getFlashloanFeeBps

Returns the flashloan fee in basis points (bps).

```solidity
function getFlashloanFeeBps() external view returns (uint256);
```

**Returns**

| Name     | Type      | Description                                  |
| -------- | --------- | -------------------------------------------- |
| `<none>` | `uint256` | The flashloan fee expressed in basis points. |

#### getLoan

Returns the full loan details for a given loan ID.

```solidity
function getLoan(uint256 loanId) public view returns (Loan memory);
```

**Parameters**

| Name     | Type      | Description         |
| -------- | --------- | ------------------- |
| `loanId` | `uint256` | The ID of the loan. |

**Returns**

| Name     | Type   | Description                    |
| -------- | ------ | ------------------------------ |
| `<none>` | `Loan` | Loan struct with loan details. |

#### getLoanPrincipal

Returns the outstanding principal of a loan.

```solidity
function getLoanPrincipal(uint256 loanId) external view returns (uint256);
```

**Parameters**

| Name     | Type      | Description         |
| -------- | --------- | ------------------- |
| `loanId` | `uint256` | The ID of the loan. |

**Returns**

| Name     | Type      | Description               |
| -------- | --------- | ------------------------- |
| `<none>` | `uint256` | Remaining loan principal. |

#### getOnChainLendIntent

Gets an on-chain stored lender intent by hash.

```solidity
function getOnChainLendIntent(bytes32 hash) external view returns (LendIntent memory);
```

**Parameters**

| Name   | Type      | Description                          |
| ------ | --------- | ------------------------------------ |
| `hash` | `bytes32` | Keccak256 hash of the lender intent. |

**Returns**

| Name     | Type         | Description               |
| -------- | ------------ | ------------------------- |
| `<none>` | `LendIntent` | The lender intent struct. |

#### getOnChainBorrowIntent

Gets an on-chain stored borrower intent by hash.

```solidity
function getOnChainBorrowIntent(bytes32 hash) external view returns (BorrowIntent memory);
```

**Parameters**

| Name   | Type      | Description                            |
| ------ | --------- | -------------------------------------- |
| `hash` | `bytes32` | Keccak256 hash of the borrower intent. |

**Returns**

| Name     | Type           | Description                 |
| -------- | -------------- | --------------------------- |
| `<none>` | `BorrowIntent` | The borrower intent struct. |

#### getAccruedInterest

Calculates accrued interest for a given loan.

```solidity
function getAccruedInterest(uint256 loanId) external view returns (uint256 interest, uint256 timeElapsed);
```

**Parameters**

| Name     | Type      | Description                 |
| -------- | --------- | --------------------------- |
| `loanId` | `uint256` | The unique loan identifier. |

**Returns**

| Name          | Type      | Description                                 |
| ------------- | --------- | ------------------------------------------- |
| `interest`    | `uint256` | Amount of interest accrued so far.          |
| `timeElapsed` | `uint256` | Time in seconds since the loan was started. |

#### getCurrentLtvBps

Returns the current loan-to-value (LTV) ratio in basis points for a given loan.

Fetches the loan and market details, validates tokens, retrieves price from oracle, and calculates the LTV as (principal / collateral value) in basis points.

**Note:** requirements:

* The market's loanToken must match the loan's loanToken.
* The market's collateralToken must match the loan's collateralToken.
* Oracle price for the collateralToken/loanToken pair must be greater than zero.
* ORACLE\_PRICE\_SCALE must be greater than zero to avoid division by zero.

```solidity
function getCurrentLtvBps(uint256 loanId) external view returns (uint256);
```

**Parameters**

| Name     | Type      | Description                          |
| -------- | --------- | ------------------------------------ |
| `loanId` | `uint256` | The identifier of the loan to query. |

**Returns**

| Name     | Type      | Description                                      |
| -------- | --------- | ------------------------------------------------ |
| `<none>` | `uint256` | The current LTV expressed in basis points (bps). |

#### getLoanIdsByUser

Retrieves the list of loan IDs associated with a specific user address.

```solidity
function getLoanIdsByUser(address user) external view returns (uint256[] memory);
```

**Parameters**

| Name   | Type      | Description                                               |
| ------ | --------- | --------------------------------------------------------- |
| `user` | `address` | The address of the user whose loan IDs are to be fetched. |

**Returns**

| Name     | Type        | Description                                                             |
| -------- | ----------- | ----------------------------------------------------------------------- |
| `<none>` | `uint256[]` | An array of uint256 representing the loan IDs linked to the given user. |

#### getRequiredCollateralAmount

Add a buffer to cover for fluctuating collateral token prices in case of a collateral token price drop in relation to the loan token of the market.

```solidity
function getRequiredCollateralAmount(
    bytes32 marketId,
    uint256 borrowAmount,
    uint256 customLtvBps // Pass 0 to use market default
)
    public
    view
    onlyWhenMarketCreated(marketId)
    returns (uint256 requiredCollateralAmount);
```

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
