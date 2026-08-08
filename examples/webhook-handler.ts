/**
 * Floe Webhook Handler — Express.js server with signature verification.
 *
 * Usage:
 *   npm install express
 *   WEBHOOK_SECRET=whsec_... npx tsx webhook-handler.ts
 *
 * This server:
 *   1. Receives webhook events from Floe
 *   2. Verifies the HMAC-SHA256 signature
 *   3. Rejects stale timestamps (> 5 minutes)
 *   4. Deduplicates deliveries by X-Floe-Delivery-Id
 *   5. Routes events to handlers by type
 */

import express from "express";
import crypto from "crypto";

// ── Config ──

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  console.error("Set WEBHOOK_SECRET=whsec_... environment variable");
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || "3000", 10);
const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

// ── Signature Verification ──

function verifySignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  // Reject timestamps older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > TIMESTAMP_TOLERANCE_SECONDS) {
    console.warn("Webhook rejected: timestamp too old or too far in the future");
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// ── Idempotency ──

// In production, use Redis or a database instead of an in-memory set.
const processedDeliveries = new Set<string>();

function isDuplicate(deliveryId: string): boolean {
  if (processedDeliveries.has(deliveryId)) {
    return true;
  }
  processedDeliveries.add(deliveryId);
  return false;
}

// ── Event Handlers ──
// Payload fields are spread at the top level of the event, alongside
// `event` and `firedAt` — there is no nested `data` object.

function handleAgentCreated(event: Record<string, unknown>): void {
  console.log(
    `Agent created: ${event.name} (${event.agentWalletAddress}), ` +
      `funding=${event.fundingMode}`
  );
  // TODO: Kick off onboarding, advance your activation checklist
}

function handleAgentSuspended(event: Record<string, unknown>): void {
  console.log(
    `Agent suspended: ${event.agentId} — tripped policy ${event.policyId} ` +
      `(${event.reason})`
  );
  // TODO: Page on-call, pause the campaign, or raise the budget
}

function handleKeyRotated(event: Record<string, unknown>): void {
  console.log(
    `Key rotated: ${event.keyPrefix} (from key ${event.rotatedFromKeyId}) ` +
      `by ${event.actorWallet}`
  );
  // TODO: Update your audit log
}

function handleFirstSettlement(event: Record<string, unknown>): void {
  console.log(
    `First settlement: agent ${event.agentId} paid ${event.amountRaw} ` +
      `to ${event.url}`
  );
  // TODO: Mark the agent activated
}

// ── Express Server ──

const app = express();

// Use raw body for signature verification
app.post(
  "/webhooks/floe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-floe-signature"] as string;
    const timestamp = req.headers["x-floe-timestamp"] as string;
    const deliveryId = req.headers["x-floe-delivery-id"] as string;
    const rawBody = req.body.toString("utf-8");

    // Verify required headers
    if (!signature || !timestamp || !deliveryId) {
      console.warn("Webhook rejected: missing required headers");
      res.status(400).json({ error: "Missing required headers" });
      return;
    }

    // Verify signature
    if (!verifySignature(rawBody, signature, timestamp, WEBHOOK_SECRET!)) {
      console.warn("Webhook rejected: invalid signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Check for duplicate delivery
    if (isDuplicate(deliveryId)) {
      console.log(`Duplicate delivery ${deliveryId} — skipping`);
      res.status(200).json({ status: "already_processed" });
      return;
    }

    // Respond immediately — process async
    res.status(200).json({ status: "received" });

    // Parse and route the event
    const event = JSON.parse(rawBody);
    console.log(`\nReceived ${event.event} (delivery: ${deliveryId})`);

    switch (event.event) {
      case "agent.created":
        handleAgentCreated(event);
        break;
      case "agent.suspended":
        handleAgentSuspended(event);
        break;
      case "key.rotated":
        handleKeyRotated(event);
        break;
      case "x402.first_settlement":
        handleFirstSettlement(event);
        break;
      default:
        console.log(`Unknown event type: ${event.event}`);
    }
  }
);

app.listen(PORT, () => {
  console.log(`Floe webhook handler listening on port ${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/webhooks/floe`);
});
