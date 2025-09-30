---
description: Instructions to test Floe on Base Sepolia testnet
icon: wave
---

# Testnet

First, get test tokens on Base Sepolia. To interact with the Floe protocol on Base Sepolia, you need test tokens for both the loan token (WETH) and the collateral token (ERC20 Faucet). You can mint these tokens from their verified contracts as follows:

1. **Collateral Token (ERC20 Faucet)**&#x20;

Contract Address: 0x46E693155cAaAeae3760D04E97a6911b94739F4C

Call the faucet() function (no parameters). This mints a set amount of collateral tokens to your wallet (caller) every 24 hours.

Steps:

1. Go to the contract page. [https://sepolia.basescan.org/address/0x46E693155cAaAeae3760D04E97a6911b94739F4C](https://sepolia.basescan.org/address/0x46E693155cAaAeae3760D04E97a6911b94739F4C).  Click on Contract.
2. Click on Write Contract.&#x20;
3. Click on connect to Web3 then connect your wallet.&#x20;
4. Under the Write Contract tab, find faucet(). Click "Write" and confirm the transaction.

\
\
**2.Loan Token (Mock WETH)** \
\
Contract Address: 0x01E6B4a1264FB32d42193cAa19De507B792291B7\
\
-Call the mint(address account, uint256 amount) function. \
-Enter your wallet address and the amount of WETH to mint (in wei, 18 decimals).

Steps:

1. Go to the contract page [https://sepolia.basescan.org/address/0x01E6B4a1264FB32d42193cAa19De507B792291B7](https://sepolia.basescan.org/address/0x01E6B4a1264FB32d42193cAa19De507B792291B7). Click on Contract.&#x20;
2. Click on Write Contract.
3. Click on Connect to Web3 / your wallet e.g. Metamask.&#x20;
4. Under the Write Contract tab, find mint function. &#x20;
5. Under Mint function, Enter your wallet address in the account(address) field and the amount (e.g., 1000000000000000000 for 1 WETH) in the amount(unit256) field
6. Click "Write" and confirm the transaction.



In Metamask wallet, Import tokens based on Contract addresses above for Base Sepolia.

Notes:

-The faucet can be used once every 24 hours per address.&#x20;

-The mint function allows you to specify any amount and recipient address. Now you have test tokens for both loan and collateral to use with the Floe SDK and contracts on Base Sepolia testnet at app.floelabs.xyz

Send us any bugs and constructive feedback to hello@floelabs or on Telegram channel https://t.me/c/floelabscommunity/1
