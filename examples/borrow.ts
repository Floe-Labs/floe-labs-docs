/**
 * Floe Credit API — Borrow USDC with ETH collateral on Base.
 *
 * Usage:
 *   npm install viem
 *   PRIVATE_KEY=0x... npx tsx borrow.ts
 *
 * This script:
 *   1. Queries available lender offers (no auth)
 *   2. Authenticates with your wallet
 *   3. Builds instant-borrow transactions
 *   4. Signs and submits them to Base
 *   5. Prints the loan details
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
} from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// ── Config ──

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
if (!PRIVATE_KEY) {
  console.error("Set PRIVATE_KEY=0x... environment variable");
  process.exit(1);
}

const API_BASE = "https://credit-api.floelabs.xyz";
const WETH_USDC_MARKET =
  "0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930";

// How much to borrow
const BORROW_AMOUNT = "5000000000"; // $5,000 USDC
const COLLATERAL_AMOUNT = "2000000000000000000"; // 2 ETH
const MAX_RATE_BPS = "1200"; // Up to 12% APR
const DURATION = "2592000"; // 30 days

// ── Setup ──

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: base, transport: http() });
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

console.log(`Wallet: ${account.address}`);
console.log(`Borrow: ${Number(BORROW_AMOUNT) / 1e6} USDC`);
console.log(`Collateral: ${Number(COLLATERAL_AMOUNT) / 1e18} ETH\n`);

// ── Step 1: Check available offers ──

console.log("1. Checking available lender offers...");
const offersResp = await fetch(
  `${API_BASE}/v1/credit/offers?marketId=${WETH_USDC_MARKET}`
);
const { offers } = (await offersResp.json()) as { offers: any[] };

if (!offers.length) {
  console.log("   No lender offers available. Try again later.");
  process.exit(1);
}

const best = offers.reduce((a, b) =>
  Number(a.minInterestRateBps) < Number(b.minInterestRateBps) ? a : b
);
console.log(
  `   Found ${offers.length} offers. Best rate: ${Number(best.minInterestRateBps) / 100}% APR\n`
);

// ── Step 2: Authenticate ──

console.log("2. Authenticating...");
const timestamp = Math.floor(Date.now() / 1000).toString();
const message = `Floe Credit API\nTimestamp: ${timestamp}`;
const signature = await account.signMessage({ message });

const headers = {
  "X-Wallet-Address": account.address,
  "X-Signature": signature,
  "X-Timestamp": timestamp,
  "Content-Type": "application/json",
};

// ── Step 3: Build instant-borrow transactions ──

console.log("3. Building borrow transactions...");
const borrowResp = await fetch(`${API_BASE}/v1/credit/instant-borrow`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    marketId: WETH_USDC_MARKET,
    borrowAmount: BORROW_AMOUNT,
    collateralAmount: COLLATERAL_AMOUNT,
    maxInterestRateBps: MAX_RATE_BPS,
    duration: DURATION,
  }),
});

if (borrowResp.status === 404) {
  const err = await borrowResp.json();
  console.log(`   No liquidity: ${err.message}`);
  process.exit(1);
}

if (!borrowResp.ok) {
  const err = await borrowResp.json();
  console.error(`   Error: ${err.error} — ${err.message}`);
  process.exit(1);
}

const result = (await borrowResp.json()) as {
  transactions: { to: string; data: string; value: string; chainId: number; description: string }[];
  selectedOffer: { minInterestRateBps: string };
};

console.log(
  `   Matched at ${Number(result.selectedOffer.minInterestRateBps) / 100}% APR`
);
console.log(`   ${result.transactions.length} transactions to submit\n`);

// ── Step 4: Sign and submit transactions ──

console.log("4. Submitting transactions to Base...");
for (let i = 0; i < result.transactions.length; i++) {
  const txData = result.transactions[i];
  const hash = await walletClient.sendTransaction({
    to: txData.to as Hex,
    data: txData.data as Hex,
    value: BigInt(txData.value),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const status = receipt.status === "success" ? "OK" : "FAILED";
  console.log(
    `   [${i + 1}/${result.transactions.length}] ${txData.description}: ${hash} (${status})`
  );

  if (receipt.status !== "success") {
    console.error("   Transaction failed. Aborting.");
    process.exit(1);
  }
}

console.log("\nDone! Loan created. USDC is in your wallet.");
console.log(
  `Check status: curl '${API_BASE}/v1/credit/status/<loanId>' with auth headers`
);
