# Storage

## Storage

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/Storage.sol)

**Inherits:** IStorage, Governable, ReentrancyGuard

Contains storage variables, data types, and access control modifiers for the lending protocol.

### State Variables

#### markets

Maps market IDs to market metadata

```solidity
mapping(bytes32 => Market) public markets
```

#### marketsCreated

List of all market IDs created

```solidity
bytes32[] public marketsCreated
```

#### onChainLendIntents

Tracks whether a lender's intent hash has been posted on-chain

```solidity
mapping(bytes32 => LendIntent) public onChainLendIntents
```

#### onChainBorrowIntents

Tracks whether a borrower's intent hash has been posted on-chain

```solidity
mapping(bytes32 => BorrowIntent) public onChainBorrowIntents
```

#### registeredIntentHashes

Records whether a specific intent hash has been registered on-chain (prevents duplicate registration)

```solidity
mapping(bytes32 => bool) public registeredIntentHashes
```

#### usedIntentHashes

Records whether a specific intent hash has been used in a loan match (prevents replay attacks)

```solidity
mapping(bytes32 => bool) public usedIntentHashes
```

#### loans

Maps loan IDs to active or repaid loan data

```solidity
mapping(uint256 => Loan) public loans
```

#### userToLoanIds

```solidity
mapping(address => uint256[]) public userToLoanIds
```

#### DOMAIN\_SEPARATOR

EIP-712 domain separator for signing and verifying intent messages

```solidity
bytes32 public immutable DOMAIN_SEPARATOR
```

#### feeRecipient

Address that receives protocol fees

```solidity
address public feeRecipient
```

#### priceOracle

Address of the price oracle used for valuations

```solidity
address public priceOracle
```

#### hookExecutor

Address of the contract that executes hooks without any non-priviledges

```solidity
address public hookExecutor
```

#### logicsManager

Address of the lending logics manager contract for delegation

```solidity
address public logicsManager
```

#### loanCounter

Global counter for assigning unique loan IDs

```solidity
uint256 public loanCounter
```

#### flashloanFeeBps

Flashloan fee in basis points (bps)

```solidity
uint256 public flashloanFeeBps = 5
```

### Functions

#### onlyWhenAddCollateralNotPaused

Ensures add collateral is not paused for the given market.

```solidity
modifier onlyWhenAddCollateralNotPaused(bytes32 marketId) ;
```

#### onlyWhenWithdrawCollateralNotPaused

Ensures withdraw collateral is not paused for the given market.

```solidity
modifier onlyWhenWithdrawCollateralNotPaused(bytes32 marketId) ;
```

#### onlyWhenBorrowNotPaused

Ensures borrowing is not paused for the given market.

```solidity
modifier onlyWhenBorrowNotPaused(bytes32 marketId) ;
```

#### onlyWhenRepayNotPaused

Ensures repay is not paused for the given market.

```solidity
modifier onlyWhenRepayNotPaused(bytes32 marketId) ;
```

#### onlyWhenLiquidateNotPaused

Ensures liquidation is not paused for the given market.

```solidity
modifier onlyWhenLiquidateNotPaused(bytes32 marketId) ;
```

#### onlyNonZeroAddress

Ensures the provided address is not the zero address.

```solidity
modifier onlyNonZeroAddress(address account) ;
```

#### onlyWhenMarketCreated

Ensures the market has been created (tokens are set).

```solidity
modifier onlyWhenMarketCreated(bytes32 marketId) ;
```

#### constructor

```solidity
constructor(address _governor) Governable(_governor);
```

#### isLendIntentOnChain

Checks if a lender intent is stored on-chain.

```solidity
function isLendIntentOnChain(bytes32 hash) public view returns (bool);
```

**Parameters**

| Name   | Type      | Description                          |
| ------ | --------- | ------------------------------------ |
| `hash` | `bytes32` | Keccak256 hash of the lender intent. |

**Returns**

| Name     | Type   | Description                             |
| -------- | ------ | --------------------------------------- |
| `<none>` | `bool` | True if intent exists, false otherwise. |

#### isBorrowIntentOnChain

Checks if a borrower intent is stored on-chain.

```solidity
function isBorrowIntentOnChain(bytes32 hash) public view returns (bool);
```

**Parameters**

| Name   | Type      | Description                            |
| ------ | --------- | -------------------------------------- |
| `hash` | `bytes32` | Keccak256 hash of the borrower intent. |

**Returns**

| Name     | Type   | Description                             |
| -------- | ------ | --------------------------------------- |
| `<none>` | `bool` | True if intent exists, false otherwise. |
