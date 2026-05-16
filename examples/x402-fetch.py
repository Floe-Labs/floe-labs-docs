"""
Floe x402 Credit Facilitator — Pay for x402 APIs with Floe credit.

Usage:
  pip install requests
  FLOE_API_KEY=floe_... python x402-fetch.py

This script:
  1. Checks your balance
  2. Previews the cost of an x402 API call
  3. Makes the paid call through the facilitator
  4. Shows the response and updated balance
"""

import os
import sys
import requests

API_KEY = os.environ.get("FLOE_API_KEY")
if not API_KEY:
    print("Set FLOE_API_KEY=floe_... environment variable")
    sys.exit(1)

BASE = "https://x402.floelabs.xyz"
TARGET_URL = os.environ.get("TARGET_URL", "https://some-x402-api.com/data")

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

# ── 1. Check balance ──
print("1. Checking balance...")
balance_resp = requests.get(f"{BASE}/agents/balance", headers=headers)
balance_resp.raise_for_status()
balance = balance_resp.json()
print(f"   Ledger balance: {int(balance['balance']) / 1e6:.2f} USDC")
print(f"   Wallet balance: {int(balance['privyWalletBalance']) / 1e6:.2f} USDC")
print()

# ── 2. Check if the target URL requires payment ──
print(f"2. Checking {TARGET_URL}...")
check_resp = requests.get(f"{BASE}/proxy/check", params={"url": TARGET_URL})
check = check_resp.json()

if not check.get("x402"):
    print(f"   This URL is free (status {check.get('status')})")
else:
    amount = int(check["payment"]["amount"])
    print(f"   x402 payment required: {amount / 1e6:.4f} USDC")
    print(f"   Payment to: {check['payment']['payTo']}")
print()

# ── 3. Make the call ──
print("3. Making the call through the facilitator...")
resp = requests.post(
    f"{BASE}/proxy/fetch",
    headers=headers,
    json={"url": TARGET_URL, "method": "GET"},
)

if resp.status_code == 402:
    err = resp.json()
    print(f"   Insufficient balance!")
    print(f"   Available: {int(err['available']) / 1e6:.2f} USDC")
    print(f"   Required:  {int(err['required']) / 1e6:.4f} USDC")
    print("   Top up at https://dev-dashboard.floelabs.xyz (card / Apple Pay / bank).")
    sys.exit(1)

if resp.status_code != 200:
    print(f"   Error ({resp.status_code}): {resp.text[:200]}")
    sys.exit(1)

print(f"   Success! Status: {resp.status_code}")
print(f"   Response: {resp.text[:500]}")
print()

# ── 4. Check updated balance ──
print("4. Updated balance:")
balance_resp = requests.get(f"{BASE}/agents/balance", headers=headers)
balance = balance_resp.json()
print(f"   Ledger balance: {int(balance['balance']) / 1e6:.2f} USDC")
