"""
Floe Credit API — Borrow USDC with ETH collateral on Base.

Usage:
  pip install web3 requests
  PRIVATE_KEY=0x... python borrow.py

This script:
  1. Queries available lender offers (no auth)
  2. Authenticates with your wallet
  3. Builds instant-borrow transactions
  4. Signs and submits them to Base
  5. Prints the loan details
"""

import os
import sys
import time
import requests
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct

# ── Config ──

PRIVATE_KEY = os.environ.get("PRIVATE_KEY")
if not PRIVATE_KEY:
    print("Set PRIVATE_KEY=0x... environment variable")
    sys.exit(1)

API_BASE = "https://credit-api.floelabs.xyz"
RPC_URL = os.environ.get("RPC_URL", "https://mainnet.base.org")
WETH_USDC_MARKET = "0xfe92656527bae8e6d37a9e0bb785383fbb33f1f0c7e29fdd733f5af7390c2930"

# How much to borrow
BORROW_AMOUNT = "5000000000"           # $5,000 USDC (6 decimals)
COLLATERAL_AMOUNT = "2000000000000000000"  # 2 ETH (18 decimals)
MAX_RATE_BPS = "1200"                  # Up to 12% APR
DURATION = "2592000"                   # 30 days in seconds

# ── Setup ──

account = Account.from_key(PRIVATE_KEY)
w3 = Web3(Web3.HTTPProvider(RPC_URL))

print(f"Wallet: {account.address}")
print(f"Borrow: {int(BORROW_AMOUNT) / 1e6} USDC")
print(f"Collateral: {int(COLLATERAL_AMOUNT) / 1e18} ETH")
print()

# ── Step 1: Check available offers ──

print("1. Checking available lender offers...")
resp = requests.get(f"{API_BASE}/v1/credit/offers", params={"marketId": WETH_USDC_MARKET})
resp.raise_for_status()
offers = resp.json()["offers"]

if not offers:
    print("   No lender offers available. Try again later.")
    sys.exit(1)

best = min(offers, key=lambda o: int(o["minInterestRateBps"]))
print(f"   Found {len(offers)} offers. Best rate: {int(best['minInterestRateBps']) / 100}% APR")
print()

# ── Step 2: Authenticate ──

print("2. Authenticating...")
timestamp = str(int(time.time()))
message = f"Floe Credit API\nTimestamp: {timestamp}"
signed = account.sign_message(encode_defunct(text=message))

headers = {
    "X-Wallet-Address": account.address,
    "X-Signature": "0x" + signed.signature.hex(),
    "X-Timestamp": timestamp,
    "Content-Type": "application/json",
}

# ── Step 3: Build instant-borrow transactions ──

print("3. Building borrow transactions...")
resp = requests.post(
    f"{API_BASE}/v1/credit/instant-borrow",
    headers=headers,
    json={
        "marketId": WETH_USDC_MARKET,
        "borrowAmount": BORROW_AMOUNT,
        "collateralAmount": COLLATERAL_AMOUNT,
        "maxInterestRateBps": MAX_RATE_BPS,
        "duration": DURATION,
        "maxLtvBps": "7500",
    },
)

if resp.status_code == 404:
    print(f"   No liquidity: {resp.json().get('message', 'No matching offers')}")
    sys.exit(1)

resp.raise_for_status()
result = resp.json()
transactions = result["transactions"]
selected = result.get("selectedOffer", {})
print(f"   Matched with lender at {int(selected.get('minInterestRateBps', 0)) / 100}% APR")
print(f"   {len(transactions)} transactions to submit")
print()

# ── Step 4: Sign and submit transactions ──

print("4. Submitting transactions to Base...")
for i, tx_data in enumerate(transactions):
    tx = {
        "to": Web3.to_checksum_address(tx_data["to"]),
        "data": tx_data["data"],
        "value": int(tx_data["value"], 16),
        "chainId": tx_data["chainId"],
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
    }
    tx["gas"] = w3.eth.estimate_gas(tx)
    tx["maxFeePerGas"] = w3.eth.gas_price * 2
    tx["maxPriorityFeePerGas"] = w3.eth.gas_price

    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    status = "OK" if receipt.status == 1 else "FAILED"
    print(f"   [{i+1}/{len(transactions)}] {tx_data['description']}: {tx_hash.hex()} ({status})")

    if receipt.status != 1:
        print(f"   Transaction failed. Aborting.")
        sys.exit(1)

print()
print("Done! Loan created. USDC is in your wallet.")
print(f"Check status: curl '{API_BASE}/v1/credit/status/<loanId>' with auth headers")
