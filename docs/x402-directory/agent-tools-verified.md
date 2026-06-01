---
icon: wrench
---

# Agent Tools

Communication, storage, and physical-world APIs for AI agents — payable with Floe credit on Base.

| Service | Endpoints | Price | Status |
|---------|-----------|-------|--------|
| AgentMail | Send Email, Read Inbox | metered | Verified |
| Pinata Cloud | Access Content | metered | Verified |
| PostalForm | Validate Order, Create Order | metered | Verified |

---

## AgentMail — Send Email

**Endpoint:** `POST https://x402.api.agentmail.to/v1/send`
**Price:** metered · Base mainnet · x402 v2

> Send emails from agent-owned addresses. Supports HTML, attachments, and reply threading.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.api.agentmail.to/v1/send", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"to\":\"recipient@example.com\",\"subject\":\"Hello from x402\",\"body\":\"Sent by an AI agent via Floe.\"}"}'
```

## AgentMail — Read Inbox

**Endpoint:** `POST https://x402.api.agentmail.to/v1/inbox`
**Price:** metered · Base mainnet · x402 v2

> Retrieve incoming emails for the agent's mailbox.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x402.api.agentmail.to/v1/inbox", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"limit\":10}"}'
```

---

## Pinata Cloud — Access Content

**Endpoint:** `GET https://<gateway>.mypinata.cloud/x402/cid/<cid>`
**Price:** creator-set per file · Base mainnet · x402 v2

> Access IPFS-hosted content behind x402 paywall. Price set by the content creator.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-gateway.mypinata.cloud/x402/cid/QmExample", "method": "GET"}'
```

---

## PostalForm — Validate Order

**Endpoint:** `POST https://postalform.com/api/machine/orders/validate`
**Price:** metered · Base mainnet · x402 v2

> Validate a mail order (address, contents, pricing) before committing.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://postalform.com/api/machine/orders/validate", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"type\":\"letter\",\"to\":{\"name\":\"Jane Doe\",\"address\":\"123 Main St\",\"city\":\"Springfield\",\"state\":\"IL\",\"zip\":\"62701\"}}"}'
```

## PostalForm — Create Order

**Endpoint:** `POST https://postalform.com/api/machine/orders`
**Price:** metered · Base mainnet · x402 v2

> Submit a physical mail order for fulfillment — letters, postcards, or packages.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://postalform.com/api/machine/orders", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "{\"type\":\"letter\",\"to\":{\"name\":\"Jane Doe\",\"address\":\"123 Main St\",\"city\":\"Springfield\",\"state\":\"IL\",\"zip\":\"62701\"},\"content\":\"Hello from an AI agent.\"}"}'
```
