# REST/Graph API (Draft)

- `GET /intents` query by type/asset/term
- `POST /intents` signed payload
- `GET /loans/:id`
- `POST /loans/:id/repay` | `topup`
- WS `/stream` for real‑time events

**Errors:** 400 invalid signature, 412 conditions unmet, 409 conflict.
