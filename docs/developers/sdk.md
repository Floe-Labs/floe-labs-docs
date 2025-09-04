# Client SDK (JS/TS)

```bash
npm i @floe-labs/sdk
```

```ts
import { Floe, signBorrowIntent } from "@floe-labs/sdk";
const floe = new Floe({ chainId: 8453, relayUrl: "https://relay.floe" });
const intent = await signBorrowIntent(wallet, { /* fields */ });
await floe.postIntent(intent);
```
