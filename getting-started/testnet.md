---
description: Instructions to test Floe on Base Sepolia testnet
icon: wave
---

# Testnet

Test Floe on Base Sepolia before using real funds on mainnet.

## Important Note

**Floe is now live on Base Mainnet.** While testnet remains available for testing, we recommend using mainnet for real transactions. See [Quick Start](../docs/getting-started/quick-start.md) for mainnet instructions.

## Testnet Contracts

| Contract | Address |
|----------|---------|
| LendingIntentMatcher | `0xF351eDF229ded7E2e2b23E44c70e9964CbA91B2E` |
| Collateral Token (Test) | `0x46E693155cAaAeae3760D04E97a6911b94739F4C` |
| Loan Token (Mock WETH) | `0x01E6B4a1264FB32d42193cAa19De507B792291B7` |

## Step 1: Get Testnet ETH

Get free Base Sepolia ETH for gas:

**Coinbase Faucet**: [portal.cdp.coinbase.com/products/faucet](https://portal.cdp.coinbase.com/products/faucet)

1. Select "Base Sepolia" network
2. Enter your wallet address
3. Request ETH

## Step 2: Get Test Tokens

### Collateral Token (ERC20 Faucet)

**Address**: `0x46E693155cAaAeae3760D04E97a6911b94739F4C`

1. Go to [BaseScan](https://sepolia.basescan.org/address/0x46E693155cAaAeae3760D04E97a6911b94739F4C#writeContract)
2. Click "Contract" → "Write Contract"
3. Connect your wallet
4. Find `faucet()` and click "Write"
5. Confirm the transaction

*Note: Faucet can be used once every 24 hours per address.*

### Loan Token (Mock WETH)

**Address**: `0x01E6B4a1264FB32d42193cAa19De507B792291B7`

1. Go to [BaseScan](https://sepolia.basescan.org/address/0x01E6B4a1264FB32d42193cAa19De507B792291B7#writeContract)
2. Click "Contract" → "Write Contract"
3. Connect your wallet
4. Find `mint(address account, uint256 amount)`
5. Enter:
   - `account`: Your wallet address
   - `amount`: Amount in wei (e.g., `1000000000000000000` for 1 token)
6. Click "Write" and confirm

## Step 3: Add Tokens to Wallet

Import the test tokens to your wallet:

1. Open MetaMask
2. Click "Import tokens"
3. Enter the contract addresses above
4. Tokens will appear in your wallet

## Step 4: Use the App

1. Go to [app.floelabs.xyz](https://app.floelabs.xyz)
2. Connect your wallet
3. Switch to Base Sepolia network
4. Create lend or borrow intents
5. Test the full flow

## Network Configuration

Add Base Sepolia to your wallet:

| Setting | Value |
|---------|-------|
| Network Name | Base Sepolia |
| RPC URL | `https://sepolia.base.org` |
| Chain ID | 84532 |
| Currency Symbol | ETH |
| Block Explorer | `https://sepolia.basescan.org` |

## Known Testnet Limitations

1. **Stale Prices**: Pyth prices may become stale after ~3 hours
2. **Circuit Breaker**: May be triggered by stale prices
3. **No Real Value**: Test tokens have no monetary value

## SDK Configuration

```typescript
const testnetConfig = {
  rpcUrl: 'https://sepolia.base.org',
  lendingIntentMatcher: '0xF351eDF229ded7E2e2b23E44c70e9964CbA91B2E',
  loanToken: '0x01E6B4a1264FB32d42193cAa19De507B792291B7',
  collateralToken: '0x46E693155cAaAeae3760D04E97a6911b94739F4C',
  chainId: 84532,
};
```

## Feedback

Send bugs and feedback to:
- Email: hello@floelabs.xyz
- Discord: [discord.gg/floe](https://discord.gg/floe)
- Telegram: [t.me/floelabscommunity](https://t.me/floelabscommunity)

## Ready for Mainnet?

Once you're comfortable with the protocol, switch to mainnet:
- [Quick Start Guide](../docs/getting-started/quick-start.md)
- [Network Configuration](../developers/networks.md)
