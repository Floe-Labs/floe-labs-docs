# Intents & EIP‑712

- Domain: name=Floe, version=1, chainId, verifyingContract.
- Types: Intent, Collateral, Conditions.
- Signature: EOA `eth_signTypedData` or ERC‑1271 `isValidSignature`.

**Borrow Intent (example)**
```json
{
  "type":"borrow","asset":"USDC","amount":"20000","maxAprBps":500,
  "termDays":90,"collateral":[{"asset":"ETH","amount":"15"}],
  "maxLtvBps":6500,"minFillBps":4000,
  "conditions":{"price":{"feed":"ETH/USD","op":"<","value":2200}},
  "expiry":1738368000,"nonce":7
}
```
