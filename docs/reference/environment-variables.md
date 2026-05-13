---
icon: gears
---

# Environment Variables

Every environment variable the Floe Credit API (`apps/api`) reads at startup or runtime, with security posture, defaults, and self-hosting guidance.

**Audience:** self-hosters and anyone running the facilitator in staging. If you're using the hosted `credit-api.floelabs.xyz`, you only need the agent-side variables (`FLOE_API_KEY`) — the rest are server-side and managed by Floe.

## Quick reference

| Variable | Required | Where | Purpose |
|---|---|---|---|
| `PORT` | — | Server | HTTP listen port (default 3001) |
| `NODE_ENV` | — | Server | `development` / `test` / `production` — enables fail-fast |
| `DATABASE_URL` | **Prod** | Server | SQLite file path |
| `JWT_SECRET` | **Prod** | Server | HMAC signing key for developer session JWTs |
| `API_KEY_HMAC_SECRET` | **Prod** | Server | HMAC key used to hash `floe_live_*` and `floe_*` API keys at rest |
| `ADMIN_API_KEY` | **Prod** | Server | Bearer token for `/v1/admin/*` endpoints |
| `RPC_URL` | Yes | Server | Base chain RPC — used for balance reads and `setOperator` verification |
| `ENVIO_HTTP_ENDPOINT` | Yes | Server | Envio indexer GraphQL endpoint |
| `ENVIO_API_TOKEN` | — | Server | Envio bearer token (required for hosted Envio) |
| `PRIVY_APP_ID` | **Agents** | Server | Privy project ID — required for agent features |
| `PRIVY_APP_SECRET` | **Agents** | Server | Privy project secret |
| `PRIVY_AUTHORIZATION_PRIVATE_KEY` | **Agents** | Server | Privy server-signer private key |
| `FACILITATOR_PRIVATE_KEY` | **Agents** | Server | Private key for the facilitator EOA — required for agent registration and all on-chain matching |
| `ENVIO_ADMIN_SECRET` | — | Server | Envio admin secret for deep queries |
| `LENDING_INTENT_MATCHER` | — | Server | Matcher contract (defaults to Base mainnet) |
| `PRICE_ORACLE_ADDRESS` | — | Server | PriceOracle contract — **must override for testnet** |
| `USDC_ADDRESS` | — | Server | USDC contract (defaults to Base mainnet native USDC) |
| `WETH_ADDRESS` | — | Server | WETH contract (defaults to Base mainnet) |
| `X402_VALID_BEFORE_SECONDS` | — | Server | EIP-3009 `validBefore` offset (default 90) |
| `X402_DOMAIN_ALLOWLIST` | — | Server | Comma-separated list of allowed upstream domains (empty = allow all public) |
| `SSRF_ALLOW_LOCALHOST` | — | Server | `1` / `true` to permit `localhost` and private-IP targets (dev only) |
| `MONITORING_URL` | — | Server | Monitoring API base URL (default `http://localhost:4000`) |
| `MONITORING_INTERNAL_KEY` | — | Server | Shared secret for monitoring push |
| `CONTRACT_ADDRESS` | — | Server | Legacy — prefer `LENDING_INTENT_MATCHER` |
| `FLOE_API_KEY` | **Agent** | Agent runtime | The `floe_*` key the agent sends as `Authorization: Bearer` |

---

## Fail-fast variables

These four will crash the server at startup when `NODE_ENV=production`. The crash is intentional — booting with a weak default would leak secrets or split database state.

### `JWT_SECRET`

**Required in production.** HMAC-SHA256 key used to sign developer session JWTs issued by `/v1/developer/auth/verify`. A compromised value lets an attacker mint valid JWTs for any wallet.

- **Generate:** `openssl rand -hex 32`
- **Length:** ≥32 bytes
- **Rotate:** invalidates all active developer sessions; dashboards will need to re-authenticate

### `API_KEY_HMAC_SECRET`

**Required in production.** HMAC-SHA256 key used to hash `floe_live_*` (developer) and `floe_*` (agent) API keys before persisting to the database. Raw keys are never stored. Rotating this key invalidates every issued API key — callers must re-create them.

- **Generate:** `openssl rand -hex 32`
- **Must be different** from `JWT_SECRET`

### `ADMIN_API_KEY`

**Required in production.** Bearer token that guards every `/v1/admin/*` endpoint. These endpoints can close agents, release reservations, and inspect arbitrary balances — treat it like a root credential.

- **Generate:** `openssl rand -hex 48`
- **Rotate:** immediately invalidates any operator tools using the old value; no session persistence

### `DATABASE_URL`

**Required outside `development`/`test`.** Filesystem path to the SQLite database. In production, the default (`./data/floe-api.db`) is refused to prevent silently booting a fresh empty database on a misconfigured deploy and splitting state from the intended backing store.

- **Recommended:** `/var/lib/floe/api.db` on a persistent GCP/AWS volume
- **Dev override:** set `NODE_ENV=development` to fall back to `./data/floe-api.db`

---

## Agent features (Privy)

Agent registration, wallet provisioning, and x402 signing all require Privy credentials. If any of the three are missing, the server boots with a warning and agent endpoints return `503 agent_features_unavailable`.

### `PRIVY_APP_ID`
Your Privy project ID (`cm...`).

### `PRIVY_APP_SECRET`
Your Privy project secret. Scoped to the app ID above.

### `PRIVY_AUTHORIZATION_PRIVATE_KEY`
The server-signer private key used to sign `setOperator` confirmation messages and EIP-3009 authorizations on behalf of agent Privy wallets. Generate via the Privy dashboard under **Server wallets → Authorization keys**. **Never commit this.**

### `FACILITATOR_PRIVATE_KEY`
The private key for the **facilitator EOA** — a purpose-built wallet that submits `matchLoanIntents`, `repayLoan`, and lifecycle transactions on behalf of delegated agents. Without this key set, `POST /v1/developer/agents` returns `503 agent_creation_unavailable — AgentDelegationService not initialized`.

**Key ↔ address relationship.** The facilitator EOA address is the public half of this private key, derived via `address = keccak256(publicKey)[12:]`. The **address must be published** because every deployer passes it as the `operator` argument to `setOperator` when granting `OperatorPermission`. The **private key must stay secret** because it signs match and repay transactions.

- **Floe-hosted mainnet facilitator EOA:** `0x58EDdE022FFDAD3Fb0Fb0E7D51eb05AaF66a31f1`
  (see [Contract Addresses → x402 Credit Facilitator](../../developers/networks.md#x402-credit-facilitator))
- **Generate for a private deployment:** `cast wallet new` — use a single-purpose wallet, never reuse an existing hot wallet.

**What the EOA holds.** The facilitator EOA is a delegated *signer*, not a custodian. It should hold:

- **Base ETH for gas** — ~0.05 ETH floor, alert at 0.02 ETH. `matchLoanIntents` is ~300–500k gas per call.
- **Nothing else.** Not USDC, not WETH, not cbBTC. The `onBehalfOfRestriction` field in each `OperatorPermission` binds borrowed USDC routing directly to each agent's Privy wallet — USDC never passes through the facilitator EOA. Pre-funding the facilitator with tokens creates unnecessary liability. If you find yourself wanting to pre-fund the facilitator with anything other than gas, something is wrong with the flow.

**Blast radius.** A compromised facilitator private key can only borrow within the bounds each deployer explicitly granted (`borrowLimit`, `maxRateBps`, `expiry`), and only into the `onBehalfOfRestriction` address each deployer specified. The `LendingIntentMatcher` contract re-validates all five `OperatorPermission` fields on every match, so a stolen key cannot exceed its delegated scope.

**Key Rotation Procedure:**
1. Generate a new EOA (`cast wallet new`) and fund with ~0.05 ETH for gas
2. Deploy a **parallel facilitator instance** with the new key (`FACILITATOR_PRIVATE_KEY=<new>`) — this instance handles new agent registrations while the old instance continues servicing existing loans
3. Notify all deployers to re-run `setOperator` with the new facilitator address
4. The old facilitator instance (still running with the old key) can continue to repay and close existing loans during the migration window — do NOT shut it down until all deployers have migrated
5. Once all deployers have re-delegated to the new address, shut down the old instance and drain remaining gas ETH from the old EOA

**Never commit this.**

---

## Chain configuration

### `RPC_URL`
Base chain RPC endpoint. Used for:
- Reading `OperatorPermission` state during `setOperator` verification
- Reading the on-chain `PriceOracle` circuit breaker state (via the fail-closed `CircuitBreakerCache`)
- Balance reads and nonce management

**Default:** `https://mainnet.base.org` (rate-limited; use Alchemy / Infura / QuickNode for production)

### `PRICE_ORACLE_ADDRESS`
**Override on testnet.** The fail-closed circuit breaker cache reads this contract's state. If left at the Base mainnet default (`0xEA058a06b54dce078567f9aa4dBBE82a100210Cc`) on Base Sepolia or any other chain, every paid request will be blocked with `circuit_breaker_stale` because the contract does not exist at that address.

- **Base mainnet:** `0xEA058a06b54dce078567f9aa4dBBE82a100210Cc` (default)
- **Base Sepolia:** `0x71020b939b1f0988b2d93c2d930fea5b370203a5`

### `LENDING_INTENT_MATCHER`
The core `LendingIntentMatcherUpgradeable` proxy address.

- **Base mainnet:** `0x17946cD3e180f82e632805e5549EC913330Bb175`
- **Base Sepolia:** `0xF351eDF229ded7E2e2b23E44c70e9964CbA91B2E`

### `USDC_ADDRESS` / `WETH_ADDRESS`
Token addresses used by the matcher. Defaults target Base mainnet. Override for testnets.

---

## x402 tunables

### `X402_VALID_BEFORE_SECONDS`
The `validBefore` offset (seconds) added to each EIP-3009 authorization. The authorization can be claimed on-chain any time between `validAfter = 0` and `now + X402_VALID_BEFORE_SECONDS`.

- **Default:** `90`
- **Recommendation:** leave at 90. Longer windows increase the blast radius of a compromised Privy key; shorter windows cause more `expired_unsettled` reconciliations during slow networks.
- **Validation:** must be a positive integer — server refuses to start otherwise.

### `X402_DOMAIN_ALLOWLIST`
Comma-separated list of fully-qualified domain names the facilitator is allowed to proxy to. When empty, any public destination is allowed (still subject to the SSRF IP guard).

Example:
```
X402_DOMAIN_ALLOWLIST=api.openai.com,api.anthropic.com,gpt.x402.example
```

Use this when running a private facilitator for a specific agent fleet. Leaving it unset is appropriate for a public facilitator.

### `SSRF_ALLOW_LOCALHOST`
Set to `1` or `true` to permit `localhost`, `127.0.0.0/8`, and RFC1918 targets. **Only use in development.** In production this bypasses the primary SSRF defense — an attacker who controls an agent's target URL could enumerate and attack internal services.

---

## Observability

### `MONITORING_URL`
Base URL of the monitoring API that receives health telemetry pushes. **Default:** `http://localhost:4000`.

### `MONITORING_INTERNAL_KEY`
Shared secret sent as a header when pushing monitoring events. If unset, monitoring pushes are silently skipped.

### `ENVIO_HTTP_ENDPOINT` / `ENVIO_API_TOKEN` / `ENVIO_ADMIN_SECRET`
Indexer connection. `ENVIO_HTTP_ENDPOINT` is required for balance reads and loan status. `ENVIO_API_TOKEN` is required when using hosted Envio. `ENVIO_ADMIN_SECRET` enables deep admin queries and is optional.

---

## Agent-side variables

### `FLOE_API_KEY`
The `floe_*` agent key minted at the end of the Agent Setup wizard. This is the only environment variable your agent needs at runtime. See the [Agent Runtime Contract](../developers/agent-runtime-contract.md).

```bash
FLOE_API_KEY=floe_3c9f8e1a2b...
```

**Do not** use a `floe_live_*` developer key here — `/v1/proxy/fetch` will reject it with `401`.

---

## Example `.env` — production facilitator

```bash
# Server
NODE_ENV=production
PORT=3001

# Fail-fast secrets — all generated with `openssl rand -hex 32` (or 48 for admin)
JWT_SECRET=<32-byte hex>
API_KEY_HMAC_SECRET=<32-byte hex>
ADMIN_API_KEY=<48-byte hex>

# Persistent state
DATABASE_URL=/var/lib/floe/api.db

# Chain
RPC_URL=https://base-mainnet.g.alchemy.com/v2/<key>
LENDING_INTENT_MATCHER=0x17946cD3e180f82e632805e5549EC913330Bb175
PRICE_ORACLE_ADDRESS=0xEA058a06b54dce078567f9aa4dBBE82a100210Cc

# Indexer
ENVIO_HTTP_ENDPOINT=https://indexer.bigdevenergy.link/<project>/v1/graphql
ENVIO_API_TOKEN=<token>

# Privy — required for agent features
PRIVY_APP_ID=cm...
PRIVY_APP_SECRET=<secret>
PRIVY_AUTHORIZATION_PRIVATE_KEY=<server-signer key>

# x402
X402_VALID_BEFORE_SECONDS=90
# X402_DOMAIN_ALLOWLIST=              # empty = allow all public

# Monitoring (optional)
MONITORING_URL=https://monitoring.internal
MONITORING_INTERNAL_KEY=<shared secret>
```

## Example `.env` — local development

```bash
NODE_ENV=development
PORT=3001

# Fail-fasts are bypassed in dev — insecure defaults are used with a warning
# DATABASE_URL=                   # falls back to ./data/floe-api.db

RPC_URL=https://base-sepolia.g.alchemy.com/v2/<key>
LENDING_INTENT_MATCHER=0xF351eDF229ded7E2e2b23E44c70e9964CbA91B2E
PRICE_ORACLE_ADDRESS=0x71020b939b1f0988b2d93c2d930fea5b370203a5

ENVIO_HTTP_ENDPOINT=http://localhost:8090/v1/graphql

SSRF_ALLOW_LOCALHOST=1            # dev only — allows localhost targets

# Optional — leave Privy out entirely to test without agent features
# PRIVY_APP_ID=...
# PRIVY_APP_SECRET=...
# PRIVY_AUTHORIZATION_PRIVATE_KEY=...
```

See **[Error Codes → Self-hosting startup errors](error-codes.md#self-hosting-startup-errors)** for the exact text of every fail-fast exception and what to set to resolve it.
