"""
Floe Credit API — Borrow USDC with ETH collateral on Base.

Demonstrates the full FLO-529 production flow:
  - Idempotency-Key on POST /v1/credit/instant-borrow (retry-safe)
  - attemptId capture from the response
  - Signed txs broadcast via /v1/tx/broadcast with attempt_id + phase
    (so the API can drive the borrow-attempt state machine and persist
    the txHash before the receipt to survive 60s wait timeouts)
  - Recovery branch: on match-phase failure, inspect attempt status
    via GET /borrow-attempts/:id and either resume or abandon

Usage:
  pip install web3 requests
  PRIVATE_KEY=0x... python borrow.py
"""

import os
import sys
import time
import uuid
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

BORROW_AMOUNT = "5000000000"               # $5,000 USDC (6 decimals)
COLLATERAL_AMOUNT = "2000000000000000000"  # 2 ETH (18 decimals)
MAX_RATE_BPS = "1200"                      # Up to 12% APR
DURATION = "2592000"                       # 30 days

# ── Setup ──

account = Account.from_key(PRIVATE_KEY)
w3 = Web3(Web3.HTTPProvider(RPC_URL))


# ── Helpers ──

def sign_and_broadcast(tx_data, attempt_id, phase, auth_headers):
    """
    Sign one of the unsigned txs returned by the API and broadcast it via
    /v1/tx/broadcast with attempt_id + phase. The broadcast endpoint
    persists the txHash on the attempt row BEFORE awaiting the receipt,
    so a 60s wait timeout no longer drops the hash on the floor.

    Returns dict {transactionHash, status} on success, raises on failure.
    """
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

    signed = account.sign_transaction(tx)
    raw_hex = "0x" + signed.raw_transaction.hex()

    resp = requests.post(
        f"{API_BASE}/v1/tx/broadcast",
        headers={**auth_headers, "Content-Type": "application/json"},
        json={
            "signed_transaction_hex": raw_hex,
            "attempt_id": attempt_id,
            "phase": phase,
        },
        timeout=60,
    )
    if not resp.ok:
        body = resp.json() if resp.content else {}
        raise RuntimeError(
            f"broadcast({phase}) failed: {resp.status_code} "
            f"{body.get('error', '')} {body.get('message', '')}"
        )
    return resp.json()


def poll_attempt_until_settled(attempt_id, auth_headers, max_attempts=6, delay_sec=5):
    """
    Fetch /borrow-attempts/:id, polling up to ~30s while status is
    'matching' to give an in-flight match receipt time to land. Returns
    the latest status dict, or None on a hard fetch error.

    Polling is bounded — the API has no obligation to advance from
    'matching' without help (the match-phase has no reconciler today;
    eventual fallback is the expiry sweep). We poll just long enough
    that a slow Base block doesn't trigger the warning path on a
    healthy attempt.
    """
    last = None
    for i in range(max_attempts):
        resp = requests.get(
            f"{API_BASE}/v1/credit/borrow-attempts/{attempt_id}",
            headers=auth_headers,
        )
        if not resp.ok:
            print(f"   recovery: GET /borrow-attempts/{attempt_id} failed ({resp.status_code})")
            return None
        last = resp.json()
        if last["status"] != "matching":
            return last
        if i < max_attempts - 1:
            print(f"   recovery: status='matching' — waiting {delay_sec}s for receipt...")
            time.sleep(delay_sec)
    return last


def recover_if_needed(attempt_id, auth_headers):
    """
    Recovery branch. Called when the match-phase broadcast fails or
    returns an unexpected status. Inspects the attempt and either
    resumes or abandons.

    IMPORTANT: never auto-abandon a row in 'matching' status. 'matching'
    means the match tx was already submitted on-chain (the broadcast
    endpoint persisted the txHash before awaiting receipt). The receipt
    may still be mining — calling /abandon now would race with on-chain
    confirmation and create row-vs-chain divergence. Poll briefly; if
    still 'matching' after the wait, surface a warning and exit so the
    operator can inspect the match tx hash manually.
    """
    status = poll_attempt_until_settled(attempt_id, auth_headers)
    if status is None:
        return False
    print(f"   recovery: attempt is in status='{status['status']}'")

    if status["status"] == "active":
        print(f"   recovery: loan already active (loanId={status['loanId']})")
        return True

    if status["status"] == "matching":
        # Polling timed out without the receipt resolving the row. The
        # match tx may still confirm on-chain; the operator should
        # check `status['matchTxHash']` on a block explorer before
        # doing anything else.
        print(
            f"   recovery: stuck in 'matching' (matchTxHash={status['matchTxHash']}). "
            "Check the tx on-chain manually — DO NOT call /abandon while the match tx is live."
        )
        return False

    if status["status"] != "pending_match":
        # Definitively terminal-non-active or pre-register; safe to abandon.
        return abandon(attempt_id, auth_headers)

    # Try resume.
    resume_resp = requests.post(
        f"{API_BASE}/v1/credit/borrow-attempts/{attempt_id}/resume",
        headers=auth_headers,
    )
    if not resume_resp.ok:
        body = resume_resp.json() if resume_resp.content else {}
        code = body.get("code")
        print(f"   recovery: /resume returned {resume_resp.status_code} (code={code})")
        if code in ("lend_intent_revoked", "lend_intent_expired", "lend_intent_insufficient"):
            return abandon(attempt_id, auth_headers)
        return False

    transactions = resume_resp.json()["transactions"]
    match_tx = transactions[0]
    print("   recovery: resuming with fresh match tx")
    result = sign_and_broadcast(match_tx, attempt_id, "match", auth_headers)
    return result["status"] == "confirmed"


def abandon(attempt_id, auth_headers):
    """
    Walk the abandon flow: get unsigned revoke (+ optional approve(0))
    txs from the API and broadcast them. Always returns False.
    """
    print("   recovery: calling /abandon to clean up")
    resp = requests.post(
        f"{API_BASE}/v1/credit/borrow-attempts/{attempt_id}/abandon",
        headers=auth_headers,
    )
    if not resp.ok:
        print(f"   abandon failed: {resp.status_code}")
        return False
    transactions = resp.json()["transactions"]
    # Broadcast every tx, including the one marked optional: True (the
    # approve(matcher, 0) reset). Skipping it would leave the matcher's
    # collateral allowance set forever — production hygiene > saving
    # one approval's worth of gas. If your environment really doesn't
    # want to pay for the cleanup, swap the loop below for one that
    # checks tx_data.get("optional") and skips with explicit acknowledgement.
    for tx_data in transactions:
        # For abandon we don't pass attempt_id+phase — the row is already
        # marked abandoned by the API and there's no further state to drive.
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
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        tag = f"{tx_data['description']} (optional)" if tx_data.get("optional") else tx_data["description"]
        print(f"   abandon: {tag}: {tx_hash.hex()}")
        w3.eth.wait_for_transaction_receipt(tx_hash)
    return False


# ── Main flow ──

def main():
    print(f"Wallet:     {account.address}")
    print(f"Borrow:     {int(BORROW_AMOUNT) / 1e6} USDC")
    print(f"Collateral: {int(COLLATERAL_AMOUNT) / 1e18} ETH")
    print()

    # Step 1: Authenticate.
    timestamp = str(int(time.time()))
    message = f"Floe Credit API\nTimestamp: {timestamp}"
    signed_msg = account.sign_message(encode_defunct(text=message))
    auth_headers = {
        "X-Wallet-Address": account.address,
        "X-Signature": "0x" + signed_msg.signature.hex(),
        "X-Timestamp": timestamp,
    }

    # Step 2: Resolve an idempotency key. A network retry of the
    # /instant-borrow call with the same key returns the cached attempt
    # instead of registering a second on-chain intent.
    #
    # Crash recovery requires the SAME key across re-runs. We read
    # IDEMPOTENCY_KEY from the env first; only mint a fresh UUID when
    # none is supplied. To recover from a crash, run again with
    # IDEMPOTENCY_KEY=<key from previous run>.
    idempotency_key = os.environ.get("IDEMPOTENCY_KEY") or str(uuid.uuid4())
    print(f"Idempotency-Key: {idempotency_key}")
    if not os.environ.get("IDEMPOTENCY_KEY"):
        print(
            f"   (newly minted — set IDEMPOTENCY_KEY={idempotency_key} "
            "to retry/recover this exact attempt later)"
        )
    print()

    # Step 3: POST /v1/credit/instant-borrow.
    print("1. Building borrow transactions...")
    resp = requests.post(
        f"{API_BASE}/v1/credit/instant-borrow",
        headers={
            **auth_headers,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotency_key,
        },
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
    if not resp.ok:
        body = resp.json() if resp.content else {}
        print(f"   Error: {body.get('error')} — {body.get('message')}")
        sys.exit(1)

    result = resp.json()
    attempt_id = result["attemptId"]
    print(f"   attemptId: {attempt_id}")
    print(f"   status:    {result['status']}")
    if result.get("reused"):
        print("   (reused existing attempt — see GET /borrow-attempts/:id for state)")
        ok = recover_if_needed(attempt_id, auth_headers)
        sys.exit(0 if ok else 1)
    print(f"   {len(result['transactions'])} transactions to submit")
    selected = result.get("selectedOffer")
    if selected:
        print(f"   matched at {int(selected['minInterestRateBps']) / 100}% APR")
    print()

    # Step 4: Pull out txs by description. The API returns:
    #   - optionally an "Approve collateral" tx
    #   - "Register borrow intent"
    #   - "Match loan intents"
    approve_tx = next((t for t in result["transactions"] if "approve" in t["description"].lower()), None)
    register_tx = next((t for t in result["transactions"] if "register" in t["description"].lower()), None)
    match_tx = next((t for t in result["transactions"] if "match" in t["description"].lower()), None)
    if not register_tx or not match_tx:
        print("   missing register/match tx in response")
        sys.exit(1)

    # Step 5: ERC-20 approve (if needed). No attempt_id — this is a plain
    # ERC-20 call and not part of the borrow_attempt state machine.
    if approve_tx:
        print("2. Approving collateral...")
        tx = {
            "to": Web3.to_checksum_address(approve_tx["to"]),
            "data": approve_tx["data"],
            "value": int(approve_tx["value"], 16),
            "chainId": approve_tx["chainId"],
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
        }
        tx["gas"] = w3.eth.estimate_gas(tx)
        tx["maxFeePerGas"] = w3.eth.gas_price * 2
        tx["maxPriorityFeePerGas"] = w3.eth.gas_price
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"   approve: {tx_hash.hex()} OK")
        print()

    # Step 6: Register borrow intent. attempt_id+phase=register so the API
    # persists registerTxHash + transitions pending_funding -> pending_on_chain
    # before awaiting the receipt.
    print("3. Registering borrow intent...")
    reg = sign_and_broadcast(register_tx, attempt_id, "register", auth_headers)
    print(f"   register: {reg['transactionHash']} {reg['status']}")
    if reg["status"] != "confirmed":
        print("   register reverted; the attempt is now funding_failed.")
        sys.exit(1)
    print()

    # Step 7: Match. Wrapped in try/except so any failure routes to the
    # recovery branch, which can resume or abandon as appropriate.
    print("4. Matching loan intents...")
    try:
        m = sign_and_broadcast(match_tx, attempt_id, "match", auth_headers)
        if m["status"] != "confirmed":
            print(f"   match reverted: {m['transactionHash']}")
            recovered = recover_if_needed(attempt_id, auth_headers)
            sys.exit(0 if recovered else 1)
        print(f"   match: {m['transactionHash']} {m['status']}")
    except Exception as e:
        print(f"   match broadcast threw: {e}")
        recovered = recover_if_needed(attempt_id, auth_headers)
        sys.exit(0 if recovered else 1)
    print()

    # Step 8: Confirm via GET — surfaces the real on-chain loanId.
    print("5. Confirming...")
    final_resp = requests.get(
        f"{API_BASE}/v1/credit/borrow-attempts/{attempt_id}",
        headers=auth_headers,
    )
    if not final_resp.ok:
        body = {}
        try:
            body = final_resp.json()
        except ValueError:
            pass
        print(
            f"   confirm failed: {final_resp.status_code} "
            f"{body.get('error', '')} {body.get('message', '')}"
        )
        sys.exit(1)

    final = final_resp.json()
    print(f"   final status: {final.get('status', 'unknown')}")
    print(f"   on-chain loanId: {final.get('loanId') or '(not yet active)'}")
    print()
    print("Done! USDC is in your wallet.")


if __name__ == "__main__":
    main()
