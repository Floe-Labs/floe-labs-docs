# IStorage

## IStorage

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/IStorage.sol)

Interface for storage-related view functions used by modules.

### Functions

#### isLendIntentOnChain

Checks if a lender intent is stored on-chain.

```solidity
function isLendIntentOnChain(bytes32 hash) external view returns (bool);
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
function isBorrowIntentOnChain(bytes32 hash) external view returns (bool);
```

**Parameters**

| Name   | Type      | Description                            |
| ------ | --------- | -------------------------------------- |
| `hash` | `bytes32` | Keccak256 hash of the borrower intent. |

**Returns**

| Name     | Type   | Description                             |
| -------- | ------ | --------------------------------------- |
| `<none>` | `bool` | True if intent exists, false otherwise. |
