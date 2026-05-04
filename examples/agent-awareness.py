"""
Floe Agent Awareness — Decision-loop demo.

Answers the three rational-agent questions before paying for an API call:
  1. Do I have enough credit?
  2. Is this call worth its cost?
  3. Where am I in the loan lifecycle?

Usage:
  FLOE_API_KEY=floe_... TARGET_URL=https://some-x402-api.com/data \
    python agent-awareness.py

Mirror of agent-awareness.ts — same behavior, same output format.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request


API_KEY = os.environ.get("FLOE_API_KEY")
if not API_KEY:
    sys.stderr.write("Set FLOE_API_KEY=floe_... environment variable\n")
    sys.exit(1)

BASE = os.environ.get("FLOE_API_BASE", "https://credit-api.floelabs.xyz")
TARGET_URL = os.environ.get("TARGET_URL", "https://some-x402-api.com/data")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


def get(path: str) -> dict:
    req = urllib.request.Request(f"{BASE}{path}", headers=HEADERS, method="GET")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def post(path: str, body: dict) -> dict:
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(body).encode(),
        headers=HEADERS,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def main() -> None:
    # Question 3 first — gate everything on loan state
    state = get("/v1/agents/loan-state")
    print(f"\n[loan-state] {state['state']} — {state.get('reason', '')}")
    if state["state"] == "at_limit":
        print("Skipping: agent is at_limit. Open another credit line or repay.")
        return
    if state["state"] in ("borrowing", "repaying"):
        print("Skipping: pending capital movement. Try again shortly.")
        return

    # Question 2 — estimate cost AND reflect against agent state in one call
    est = post("/v1/x402/estimate", {"url": TARGET_URL, "method": "GET"})
    print(f"\n[estimate] {est['method']} {est['url']}")
    if not est.get("x402"):
        print("URL is not x402-protected — call it directly.")
        return
    print(f"  price: {est.get('priceRaw')} raw USDC ({est.get('network')})")
    print(f"  cached: {est.get('cached')}")

    # Fail-closed: if the API didn't return a reflection block, abort. The
    # reflection is what tells us whether the call would exceed available
    # credit or our session spend-limit; without it we have no decision basis,
    # so don't fall through to the paid call.
    r = est.get("reflection")
    if not r:
        print("  ❌ estimate response missing reflection block — DO NOT CALL")
        return
    print(f"  available: {r.get('available')}")
    if r.get("willExceedAvailable"):
        print("  ❌ would exceed available credit — DO NOT CALL")
        return
    if r.get("willExceedSpendLimit"):
        print("  ❌ would exceed session spend-limit — DO NOT CALL")
        return
    if r.get("willExceedHeadroom"):
        print("  ⚠️  would dip into auto-borrow headroom — proceeding (informational)")

    # Question 1 was answered by the reflection block above. Proceed.
    print("\n[proxy/fetch] paying and calling target...")
    paid = post("/v1/proxy/fetch", {"url": TARGET_URL, "method": "GET"})
    print("  response:", json.dumps(paid)[:200])

    # After-call sanity check
    remaining = get("/v1/agents/credit-remaining")
    print(
        f"\n[after] available: {remaining['available']}, "
        f"utilization: {remaining['utilizationBps']} bps"
    )


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"HTTP {e.code}: {e.read().decode(errors='replace')}\n")
        sys.exit(1)
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)
