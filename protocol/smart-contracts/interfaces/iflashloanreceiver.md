# IFlashloanReceiver

## IFlashloanReceiver

[Git Source](https://github.com/najienka/modular-lending.git/blob/7b73e93b2a34dccd74a2361cd2250d79990b9bba/src/interfaces/IFlashloanReceiver.sol)

Interface for contracts that want to handle flashloans

### Functions

#### receiveFlashLoan

Called after your contract has received the flashloaned amount

```solidity
function receiveFlashLoan(address token, uint256 amount, uint256 fee, bytes calldata data) external;
```

**Parameters**

| Name     | Type      | Description                                        |
| -------- | --------- | -------------------------------------------------- |
| `token`  | `address` | The address of the token being flashloaned         |
| `amount` | `uint256` | The amount of tokens received                      |
| `fee`    | `uint256` | The fee to be paid for the flashloan               |
| `data`   | `bytes`   | Arbitrary data passed from the flashloan initiator |
