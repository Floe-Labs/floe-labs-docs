"""
Floe Webhook Handler — Flask server with signature verification.

Usage:
  pip install flask
  WEBHOOK_SECRET=whsec_... python webhook-handler.py

This server:
  1. Receives webhook events from Floe
  2. Verifies the HMAC-SHA256 signature
  3. Rejects stale timestamps (> 5 minutes)
  4. Deduplicates deliveries by X-Floe-Delivery-Id
  5. Routes events to handlers by type
"""

import os
import sys
import hmac
import hashlib
import json
import time

from flask import Flask, request, jsonify

# ── Config ──

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET")
if not WEBHOOK_SECRET:
    print("Set WEBHOOK_SECRET=whsec_... environment variable")
    sys.exit(1)

PORT = int(os.environ.get("PORT", "3000"))
TIMESTAMP_TOLERANCE_SECONDS = 300  # 5 minutes


# ── Signature Verification ──


def verify_signature(
    payload: str, signature: str, timestamp: str, secret: str
) -> bool:
    """Verify the HMAC-SHA256 signature from Floe webhook headers."""
    # Reject timestamps older than 5 minutes
    now = int(time.time())
    if abs(now - int(timestamp)) > TIMESTAMP_TOLERANCE_SECONDS:
        print("Webhook rejected: timestamp too old or too far in the future")
        return False

    expected = hmac.new(
        secret.encode(),
        f"{timestamp}.{payload}".encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(signature, expected)


# ── Idempotency ──

# In production, use Redis or a database instead of an in-memory set.
processed_deliveries: set[str] = set()


def is_duplicate(delivery_id: str) -> bool:
    """Check if a delivery has already been processed."""
    if delivery_id in processed_deliveries:
        return True
    processed_deliveries.add(delivery_id)
    return False


# ── Event Handlers ──
# Payload fields are spread at the top level of the event, alongside
# `event` and `firedAt` — there is no nested `data` object.


def handle_agent_created(event: dict) -> None:
    print(
        f"Agent created: {event.get('name')} "
        f"({event.get('agentWalletAddress')}), funding={event.get('fundingMode')}"
    )
    # TODO: Kick off onboarding, advance your activation checklist


def handle_agent_suspended(event: dict) -> None:
    print(
        f"Agent suspended: {event.get('agentId')} — "
        f"tripped policy {event.get('policyId')} ({event.get('reason')})"
    )
    # TODO: Page on-call, pause the campaign, or raise the budget


def handle_key_rotated(event: dict) -> None:
    print(
        f"Key rotated: {event.get('keyPrefix')} "
        f"(from key {event.get('rotatedFromKeyId')}) by {event.get('actorWallet')}"
    )
    # TODO: Update your audit log


def handle_first_settlement(event: dict) -> None:
    print(
        f"First settlement: agent {event.get('agentId')} paid "
        f"{event.get('amountRaw')} to {event.get('url')}"
    )
    # TODO: Mark the agent activated


# ── Event Router ──

EVENT_HANDLERS = {
    "agent.created": handle_agent_created,
    "agent.suspended": handle_agent_suspended,
    "key.rotated": handle_key_rotated,
    "x402.first_settlement": handle_first_settlement,
}


# ── Flask Server ──

app = Flask(__name__)


@app.route("/webhooks/floe", methods=["POST"])
def webhook():
    signature = request.headers.get("X-Floe-Signature")
    timestamp = request.headers.get("X-Floe-Timestamp")
    delivery_id = request.headers.get("X-Floe-Delivery-Id")
    raw_body = request.get_data(as_text=True)

    # Verify required headers
    if not signature or not timestamp or not delivery_id:
        print("Webhook rejected: missing required headers")
        return jsonify({"error": "Missing required headers"}), 400

    # Verify signature
    if not verify_signature(raw_body, signature, timestamp, WEBHOOK_SECRET):
        print("Webhook rejected: invalid signature")
        return jsonify({"error": "Invalid signature"}), 401

    # Check for duplicate delivery
    if is_duplicate(delivery_id):
        print(f"Duplicate delivery {delivery_id} — skipping")
        return jsonify({"status": "already_processed"}), 200

    # Parse and route the event
    event = json.loads(raw_body)
    event_type = event.get("event", "unknown")
    print(f"\nReceived {event_type} (delivery: {delivery_id})")

    handler = EVENT_HANDLERS.get(event_type)
    if handler:
        handler(event)
    else:
        print(f"Unknown event type: {event_type}")

    return jsonify({"status": "received"}), 200


if __name__ == "__main__":
    print(f"Floe webhook handler listening on port {PORT}")
    print(f"Endpoint: POST http://localhost:{PORT}/webhooks/floe")
    app.run(host="0.0.0.0", port=PORT)
