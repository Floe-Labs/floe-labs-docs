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

function handleHealthWarning(data: Record<string, unknown>): void {
  console.log(
    `Health warning: Loan ${data.loanId} — LTV ${data.currentLtvBps} bps ` +
      `(liquidation at ${data.liquidationLtvBps} bps), state: ${data.healthState}`
  );
  // TODO: Send alert to Slack, PagerDuty, or your monitoring system
}

function handleExpiryWarning(data: Record<string, unknown>): void {
  console.log(
    `Expiry warning: Loan ${data.loanId} — ${data.hoursRemaining} hours remaining`
  );
  // TODO: Trigger auto-repay or notify the borrower
}

function handleLiquidated(data: Record<string, unknown>): void {
  console.log(
    `Liquidated: Loan ${data.loanId} — principal ${data.principal}, ` +
      `collateral ${data.collateralAmount}`
  );
  // TODO: Update internal records, notify stakeholders
}

function handleRepaid(data: Record<string, unknown>): void {
  console.log(
    `Repaid: Loan ${data.loanId} — principal ${data.principal}, ` +
      `interest rate ${data.interestRateBps} bps`
  );
  // TODO: Update internal records, release any holds
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
      case "loan.health_warning":
        handleHealthWarning(event.data);
        break;
      case "loan.expiry_warning":
        handleExpiryWarning(event.data);
        break;
      case "loan.liquidated":
        handleLiquidated(event.data);
        break;
      case "loan.repaid":
        handleRepaid(event.data);
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
