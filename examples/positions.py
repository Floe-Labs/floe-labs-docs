"""
Floe Credit API — Portfolio inspection (FLO-530, SELF-CUSTODY).

⚠️ This example uses a raw PRIVATE_KEY for wallet-signature auth. The
   managed-wallet flow (recommended for nearly all agents) authenticates
   with a `floe_…` runtime key instead — no key custody on your side. See
   docs/getting-started/quickstart.md and docs/developers/self-custody.md.


Walks an agent through reading its credit portfolio via
GET /v1/positions/:wallet:

  1. Indexer-mode read (default) — fast; fine for "what do I owe".
                                    `worstHealthFactor` is null because the
                                    indexer returns origination LTV which
                                    doesn't reflect price movement.
  2. Live-mode read    (?live=true) — slower, fully on-chain. Health factor
                                      is computed against the live oracle.
  3. includePending     — surface borrow intents that haven't matched yet.
  4. Pagination         — loop with ?skip= until positions.length < limit.
  5. 503 handling       — what to do when the API instance has no indexer.

Usage:
  pip install web3 requests
  PRIVATE_KEY=0x... python positions.py
"""

import os
import re
import sys
import time
from urllib.parse import quote

import requests
from eth_account import Account
from eth_account.messages import encode_defunct

# Defense-in-depth: reject obviously malformed wallets before we
# interpolate them into the URL path. The API also validates, but a
# caller-side check produces a clearer error and avoids a wasted round
# trip if TARGET_WALLET is misconfigured.
ADDRESS_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")

# ── Config ──

PRIVATE_KEY = os.environ.get("PRIVATE_KEY")
if not PRIVATE_KEY:
    print("Set PRIVATE_KEY=0x... environment variable")
    sys.exit(1)

API_BASE = os.environ.get("FLOE_API_BASE", "https://credit-api.floelabs.xyz")

# Wallet whose portfolio we want to read. Defaults to the signer's own.
# Any authenticated caller can query any wallet's positions today.
TARGET_WALLET = os.environ.get("TARGET_WALLET")

# Pagination — small for the example so the loop is exercised on
# realistic portfolios. Production callers can use the API's defaults.
PAGE_LIMIT = 5
MAX_PAGES = 1_000

# ── Setup ──

account = Account.from_key(PRIVATE_KEY)
target_wallet = TARGET_WALLET or account.address


# ── Auth helper (mirrors examples/borrow.py) ──

def sign_request():
    """
    Build EIP-191 auth headers for the credit API. Mirrors the helper in
    examples/borrow.py — keep them in lockstep when the message format
    changes.
    """
    timestamp = str(int(time.time()))
    message = f"Floe Credit API\nTimestamp: {timestamp}"
    signed = account.sign_message(encode_defunct(text=message))
    return {
        "X-Wallet-Address": account.address,
        "X-Signature": "0x" + signed.signature.hex(),
        "X-Timestamp": timestamp,
    }


def get_positions(wallet, *, live=False, include_pending=False, limit=None, skip=None, pending_limit=None):
    """GET /v1/positions/:wallet with optional flags."""
    if not ADDRESS_RE.match(wallet):
        raise ValueError(
            f"Invalid wallet address: {wallet!r}. "
            "Expected a 0x-prefixed 20-byte address."
        )

    params = {}
    if live:
        params["live"] = "true"
    if include_pending:
        params["includePending"] = "true"
    if limit is not None:
        params["limit"] = str(limit)
    if skip is not None:
        params["skip"] = str(skip)
    if pending_limit is not None:
        params["pendingLimit"] = str(pending_limit)

    resp = requests.get(
        f"{API_BASE}/v1/positions/{quote(wallet, safe='')}",
        headers=sign_request(),
        params=params,
        timeout=15,
    )

    if resp.status_code == 503:
        # The API instance was started without an Envio indexer endpoint.
        # getPositions cannot run without it (chain-only fallback would
        # be too slow). Retry against a different instance or surface to
        # the operations team.
        raise RuntimeError(
            f"503 — indexer not configured on {API_BASE}. "
            "Try a different API instance."
        )
    resp.raise_for_status()
    return resp.json()


def fmt_rate(bps_str_or_none):
    if bps_str_or_none is None:
        return "—"
    return f"{int(bps_str_or_none) / 100:.2f}%"


def fmt_health(hf):
    if hf is None:
        return "n/a (indexer mode)"
    if hf >= 2.0:
        tag = "safe"
    elif hf >= 1.2:
        tag = "ok"
    elif hf > 1.0:
        tag = "tight"
    else:
        tag = "LIQUIDATABLE"
    return f"{hf:.3f} ({tag})"


def print_summary(label, body):
    summary = body["summary"]
    print(f"--- {label} ---")
    print(f"  source              : {body['source']}")
    print(f"  ltvStale            : {body['ltvStale']}")
    print(f"  indexerBlockNumber  : {body['indexerBlockNumber']}")
    print(f"  active loans        : {summary['activeLoanCount']}")
    print(f"  total debt          : {int(summary['totalDebt']) / 1e6:,.2f} USDC")
    print(f"  weighted-avg rate   : {fmt_rate(summary['weightedAvgInterestRateBps'])}")
    print(f"  worst health factor : {fmt_health(summary['worstHealthFactor'])}")
    if summary.get("nextMaturityAt"):
        print(f"  next maturity       : {summary['nextMaturityAt']} (unix)")
    print()


def main():
    print(f"Signer:  {account.address}")
    print(f"Target:  {target_wallet}")
    print(f"API:     {API_BASE}")
    print()

    # ── Step 1: indexer-mode read ────────────────────────────────────
    body = get_positions(target_wallet)
    print_summary("Step 1: indexer mode (default)", body)

    # The summary's worstHealthFactor is intentionally null in indexer
    # mode. Calling code that drives liquidation alarms should always
    # use live mode (Step 2).

    # ── Step 2: live-mode read ───────────────────────────────────────
    body = get_positions(target_wallet, live=True)
    print_summary("Step 2: live mode (?live=true)", body)

    # ── Step 3: include pending borrow intents ───────────────────────
    body = get_positions(target_wallet, include_pending=True)
    pending = body.get("pendingBorrowIntents") or []
    print(f"--- Step 3: pending borrow intents ({len(pending)}) ---")
    for intent in pending[:5]:
        print(
            f"  • {intent['offerHash']}  "
            f"borrow={int(intent['borrowAmount']) / 1e6:,.2f} USDC  "
            f"max={fmt_rate(intent['maxInterestRateBps'])}  "
            f"expires={intent['expiry']}"
        )
    if len(pending) > 5:
        print(f"  … and {len(pending) - 5} more")
    print()

    # ── Step 4: paginate ────────────────────────────────────────────
    # Per the API contract, paginate as long as `len(loans) == limit`
    # (the page is "full"). Don't gate on summary.activeLoanCount —
    # that's the wallet-wide total and stays constant across pages.
    #
    # Hard cap on iterations as a safety net: a buggy backend that always
    # returns a full page would otherwise spin forever.
    print(f"--- Step 4: paginate active loans (page size {PAGE_LIMIT}) ---")
    seen = 0
    skip = 0
    pages = 0
    while True:
        if pages >= MAX_PAGES:
            raise RuntimeError(
                f"Pagination exceeded {MAX_PAGES} pages; aborting to avoid an infinite loop."
            )
        page = get_positions(target_wallet, limit=PAGE_LIMIT, skip=skip)
        loans = page["positions"]
        for loan in loans:
            seen += 1
            print(
                f"  loan #{loan['loanId']}: "
                f"debt={int(loan['totalDebt']) / 1e6:,.2f} USDC, "
                f"buffer={fmt_rate(loan['bufferBps'])}"
            )
        pages += 1
        if len(loans) < PAGE_LIMIT:
            break
        skip += PAGE_LIMIT
    print(f"  total surfaced via pagination: {seen}")


if __name__ == "__main__":
    main()
