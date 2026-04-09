---
icon: rocket
---

# Agent Working Capital Quickstart

Get USDC into your agent's wallet in under a minute.

For a guided setup experience, use the [Developer Dashboard](developer-dashboard.md) at `dev-dashboard.floelabs.xyz` — connect your wallet and follow the 3-step agent wizard.

## Check Live Offers First

See what lenders are offering right now — no auth, no setup:

```bash
curl "https://credit-api.floelabs.xyz/v1/credit/offers"
```

## Get Your Agent Capital in 3 Steps

```typescript
import { floeActionProvider } from "@floe/agentkit-actions";

// 1. Set up Floe actions
const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [floeActionProvider({ rpcUrl: "https://mainnet.base.org" })],
});

// 2. Borrow USDC instantly
const loan = await agentkit.invoke("instant_borrow", {
  borrowAmount: "5000000000",          // $5,000 USDC
  collateralAmount: "2000000000000000000", // 2 ETH
  maxInterestRateBps: "1200",          // up to 12% APR
  duration: "2592000",                 // 30 days
});
// → loan.loanId, loan.rate, loan.collateralLocked

// 3. Check your loan anytime
const status = await agentkit.invoke("check_credit_status", {
  loanId: loan.loanId,
});
// → status.totalDebt, status.currentLtvBps, status.daysRemaining
```

**Not using AgentKit?** Run the complete [Python example](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/borrow.py) or [TypeScript example](https://github.com/Floe-Labs/floe-labs-docs/blob/main/examples/borrow.ts) — or use the [Credit REST API](credit-api.md) directly.

## What Just Happened

Floe queried all available lenders on Base, selected the best rate for your amount, and executed the match on-chain. USDC transferred directly to your agent's wallet. Your ETH collateral is held by the protocol's smart contract and returns automatically when you repay. Fixed rate, fixed term, no surprises.

## Markets

| Market | Collateral | Loan Token |
|--------|------------|------------|
| WETH/USDC | ETH | USDC |
| cbBTC/USDC | cbBTC | USDC |

See the [Credit REST API](credit-api.md#markets) for marketIds and token addresses.

## Want Automatic API Payments?

If your agent needs to call x402-enabled APIs, you don't need to manage USDC at all. Delegate your collateral to the x402 facilitator and it handles everything.

`grant_credit_delegation` is the **AgentKit wrapper** — under the hood it pre-registers a Privy wallet, calls `setOperator` on the `LendingIntentMatcher` contract, approves collateral, and finalizes agent registration, all in one action. Use it when you are integrating via AgentKit. If you are integrating directly against the REST API + smart contract, use the `setOperator` snippet in the [Full Happy Path Example](#full-happy-path-example) below instead.

```typescript
// One-time setup: delegate collateral (AgentKit wrapper)
await agentkit.invoke("grant_credit_delegation", {
  facilitator_url: "https://credit-api.floelabs.xyz",
  facilitator_address: "0x58EDdE022FFDAD3Fb0Fb0E7D51eb05AaF66a31f1", // Base mainnet
  borrow_limit: "10000",                // human-decimal USDC (not raw units)
  max_rate_bps: 1500,                   // cap at 15% APR
  expiry_days: 90,                      // delegation TTL
});

// Now call any x402 API — payment is automatic
await agentkit.invoke("x402_fetch", { url: "https://api.example.com/data" });
```

See **[x402 Credit Facilitator](x402-facilitator.md)** for details.

## Full Happy Path Example

End-to-end, from zero to your agent's first paid `/v1/proxy/fetch` call. This is the complete flow — everything the deployer does once, and the agent code that runs forever after.

### 1. Developer signs in (SIWE)

The deployer visits [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) and connects a wallet via RainbowKit. The dashboard asks the wallet to sign a short timestamped message, then posts it to `POST /v1/developer/auth/verify` with `X-Wallet-Address`, `X-Signature`, and `X-Timestamp` headers. The API validates the signature against a ±5-minute replay window and returns a 7-day JWT. From here on, every dashboard request carries that JWT. **Takeaway:** no passwords, no email — wallet signature is identity.

### 2. Mint a developer API key (`floe_live_*`)

From the **Keys** page the deployer calls `POST /v1/keys` and receives a one-time reveal:

```json
{
  "id": "key_01J...",
  "key": "floe_live_7a2b9c4d8e...",
  "label": "prod-backend",
  "createdAt": "2026-04-07T12:00:00Z"
}
```

**Takeaway:** this key is for dashboard and programmatic webhook/key management. It is **not** what the agent uses at runtime.

### 3. Run the agent wizard

On the **Agents** page the deployer walks through three steps: **Create Wallet → Deposit & Delegate → Activate Agent**. Step 1 ("Create Agent Wallet" button) signs a message in the browser wallet and calls `POST /v1/agents/pre-register`, which provisions a Privy custodial wallet and returns `privyWalletAddress`. **Takeaway:** the agent gets its own on-chain wallet that the deployer never holds keys for.

### 4. Deposit WETH collateral

The deployer sends WETH from their own wallet to the returned `privyWalletAddress`. **Takeaway:** this is the collateral backing every future `/proxy/fetch` charge.

### 5. Sign `setOperator` on-chain

The wizard currently shows the Privy wallet address and asks the deployer to delegate themselves. Until the dashboard ships a one-click Authorize button, call `setOperator` directly against the `LendingIntentMatcher` contract from the deployer's own wallet tooling:

```ts
import { useWriteContract } from 'wagmi';

const { writeContract } = useWriteContract();

const FACILITATOR_EOA = '0x58EDdE022FFDAD3Fb0Fb0E7D51eb05AaF66a31f1'; // Base mainnet

writeContract({
  address: LENDING_INTENT_MATCHER_ADDRESS,
  abi: lendingIntentMatcherAbi,
  functionName: 'setOperator',
  args: [
    FACILITATOR_EOA,
    {
      borrowLimit: 10_000_000000n,      // 10,000 USDC (6 decimals)
      maxRateBps: 1500n,                // cap at 15% APR
      expiry: BigInt(Math.floor(Date.now() / 1000) + 90 * 24 * 3600), // 90 days
      onBehalfOfRestriction: privyWalletAddress,
    },
  ],
});
```

**Takeaway:** this single on-chain tx is the only time the deployer signs a transaction on behalf of the agent. After this the facilitator can borrow USDC from the credit line, capped by `borrowLimit` and `maxRateBps`.

### 6. Activate the agent

The deployer clicks **Complete Registration** in Step 3. The dashboard calls `POST /v1/agents/register`, which verifies the on-chain delegation and mints the agent's runtime key. The response reveals the `floe_*` key once via a secret-reveal modal:

```json
{ "apiKey": "floe_3c9f8e1a2b..." }
```

**Takeaway:** copy it now — the dashboard will never show it again. This is `FLOE_API_KEY`.

### 7. Agent code — TypeScript

```ts
const FLOE = 'https://credit-api.floelabs.xyz/v1/proxy/fetch';

async function paidFetch(url: string, body: unknown) {
  const res = await fetch(FLOE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FLOE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });

  if (res.status === 429) {
    const { retry_after_seconds } = await res.json();
    await new Promise(r => setTimeout(r, retry_after_seconds * 1000));
    return paidFetch(url, body); // safe to retry
  }
  if (res.status === 502) {
    const b = await res.json();
    if (b.error === 'upstream_paid_request_failed_ambiguous') {
      // DO NOT retry — wait for pendingSettlements to drop first
      throw new Error('ambiguous payment; wait for reconciliation');
    }
    // other 502s are safe to retry
  }
  if (!res.ok) throw new Error(`floe ${res.status}`);
  return res.json();
}

const data = await paidFetch('https://api.somex402service.com/premium/analyze', { prompt: 'hi' });
```

**Takeaway:** one env var, one function, full x402 payment abstraction. See [Agent Runtime Contract](agent-runtime-contract.md) for the complete error matrix.

### 8. Agent code — Python

```python
import os, time, httpx

FLOE = "https://credit-api.floelabs.xyz/v1/proxy/fetch"

def paid_fetch(url: str, body: dict) -> dict:
    with httpx.Client(timeout=60) as c:
        res = c.post(
            FLOE,
            headers={
                "Authorization": f"Bearer {os.environ['FLOE_API_KEY']}",
                "Content-Type": "application/json",
            },
            json={"url": url, "method": "POST",
                  "headers": {"Content-Type": "application/json"},
                  "body": __import__("json").dumps(body)},
        )
    if res.status_code == 429:
        time.sleep(res.json()["retry_after_seconds"])
        return paid_fetch(url, body)
    if res.status_code == 502:
        b = res.json()
        if b.get("error") == "upstream_paid_request_failed_ambiguous":
            raise RuntimeError("ambiguous payment; wait for reconciliation")
    res.raise_for_status()
    return res.json()

data = paid_fetch("https://api.somex402service.com/premium/analyze", {"prompt": "hi"})
```

**Takeaway:** identical contract, identical retry rules, any language with an HTTP client will do.

## Next Steps

- **[Developer Dashboard](developer-dashboard.md)** — Manage agents, API keys, and webhooks through a web UI.
- **[API Keys](api-keys.md)** — Generate `floe_live_*` keys for programmatic access without per-request wallet signing.
- **[x402 Credit Facilitator](x402-facilitator.md)** — Pay for any x402 API automatically. Delegate collateral, facilitator handles the rest.
- **[Credit REST API](credit-api.md)** — HTTP endpoints for Python, Rust, or any language.
- **[AgentKit Integration](agentkit.md)** — Full action reference (36 in both TypeScript and Python — full parity as of April 2026).
- **[Agent Working Capital](agent-working-capital.md)** — Deep dive into credit facility design, supported markets, and early repayment terms.
- **Talk to us** — [Discord](https://discord.gg/floelabs) or reach out for pilot access.
