---
icon: circle-check
---

# Outcome claims — what each call produced

You know [what every call cost](unified-ledger.md) and [which client it was for](attribution.md). An **outcome claim** is the other half of the row: what the call actually produced — a booked meeting, a qualified lead, a resolution — recorded against the call it came from, so cost and result sit on one record.

Your agent **reports** the outcome against the task id it already has; Floe resolves that id to the call and binds the claim there. You **confirm** it from your own backend, when the CRM webhook or the calendar invitation lands. That split is deliberate: confirming is what makes a claim billable, and the evidence for it reaches your systems minutes to days after the call, never the agent's process.

> **This is not the [action-outcome signal](../developers/agent-runtime-contract.md#outcome-linked-spend-attribution).** `POST /v1/agents/actions/:actionId/outcome` is a per-action quality signal (status + score) for eval and the quality throttle; it never reaches an invoice. The routes on this page produce an invoice-grade claim. They share a word and nothing else.

## Append-only, like the rest of the money path

Every write here is a **new event**, never an update. A claim's chain is identified by `(task, outcomeKind)`, and the current claim is the head of that chain. Correcting one appends an event that supersedes its predecessor and seals it — the same rule that keeps [statements](invoicing.md) reproducible.

| Status | Written by | Means |
|---|---|---|
| `reported` | the agent, via `POST /v1/agents/outcomes` | The outcome happened, as far as the agent knows. Not billable. |
| `confirmed` | you, via the confirm route | You checked it against your own evidence. This is the billable fact. |
| `void` | you, via the void route | Retired — a proven duplicate, or a claim that turned out not to be real. |

Claims also read `disputed` and `reversed`; `reversed` is terminal and exists so a credit against an already-billed claim stays traceable.

Every event carries an `oev_…` event id. A revision names its predecessor by that id — never by `(task, kind)`, which is ambiguous once a chain has three rows.

## Report an outcome (agent key)

```http
POST /v1/agents/outcomes
```

```json
{
  "taskId": "call-8f21a",
  "outcomeKind": "meeting_booked",
  "quantity": 1,
  "occurredAt": "2026-09-18T15:04:00Z",
  "externalSystem": "salesforce",
  "externalRef": "006Ax000001B2yZIAS",
  "note": "prospect accepted the 10am slot",
  "idempotencyKey": "vapi-evt-9d1c4a"
}
```

- **`taskId`** is the [`X-Floe-Task-Id`](attribution.md) the call already carries (on Floe Phone, the CallSid). Floe resolves it to the call and binds the claim there. **A task id that names no call is refused** with `404 task_not_found` — an outcome nothing can bill is worse than no outcome, because it looks like one.
- **`outcomeKind`** is opaque: lowercased, ≤64 chars, never interpreted. `resolution`, `meeting_booked`, `qualified_lead`, `escalation`, `abandoned` are a convention, not an enum. What an outcome is *worth* belongs on the [rate card](rate-cards.md), where money meaning lives.
- **`quantity`** defaults to `1`. Two meetings booked on one call is quantity `2` on **one** claim, not two claims.
- **`occurredAt`** defaults to now.
- **`externalSystem` / `externalRef`** are the corroboration pair. `externalRef` is stored **verbatim** (CRM and calendar ids are case-sensitive), and sending it without `externalSystem` is a `400`. Equality on the pair is the only duplication Floe treats as proven.
- **`idempotencyKey`** is required, ≤200 chars. Orchestrator webhooks retry; a replay returns the stored event with `200` instead of writing a second claim. A new claim answers `201`.
- **Unknown fields are rejected**, not ignored — a body that isn't exactly this shape gets a `400` rather than a `201` that quietly dropped half of it.

The response is the stored claim, with the call it landed on:

```json
{
  "outcome": {
    "eventId": "oev_4b7c0f19a2d36e58",
    "interactionId": "int_9a1f30c47be25d86",
    "outcomeKind": "meeting_booked",
    "status": "reported",
    "quantity": 1,
    "occurredAt": "2026-09-18T15:04:00Z",
    "confirmedAt": null,
    "source": "agent",
    "externalSystem": "salesforce",
    "externalRef": "006Ax000001B2yZIAS",
    "evidenceNote": "prospect accepted the 10am slot",
    "supersedesEventId": null,
    "billedInPeriodId": null
  }
}
```

**An agent key may report a first claim and nothing else.** Its `status` is always `reported`, and `source` is stamped `agent` from the credential. If a current claim of that kind already exists for the task, the emit returns `409 outcome_claim_exists` — correcting a claim is an operator action on the developer surface, below. Reusing one idempotency key under a *different* task id returns `409 outcome_claim_bound_elsewhere`: the key already names a claim bound to another call, and a new outcome needs a new key.

## Confirm it — the act that makes it billable

```http
POST /v1/developer/outcomes/{eventId}/confirm
```

```json
{ "idempotencyKey": "crm-hook-771", "confirmedAt": "2026-09-19T09:12:00Z", "quantity": 2, "externalSystem": "salesforce", "externalRef": "006Ax000001B2yZIAS" }
```

Needs a developer credential (dashboard session or `floe_live_…` key) with the **admin** role. Only `operator` and `client` confirmations may bill, which is why an agent key can't reach it.

- It appends a **new `confirmed` event** superseding the reported one, and re-binds it to the same call — a confirmed claim that lost its binding would be invisible to every rollup that reads through one.
- **`confirmedAt` is the billing anchor** for this confirmation, defaulting to now. It decides which period the claim lands in. A later reversal anchors on its own, never on this one.
- **`quantity`** corrects the reported count — the CRM shows two meetings against one call.
- **Your evidence wins where you give it**; otherwise the reported claim's own `externalSystem` / `externalRef` / note carry forward rather than being dropped.
- Same idempotency contract as the emit: `201` for a new event, `200` replaying a known key.

## Void a claim

```http
POST /v1/developer/outcomes/{eventId}/void
```

```json
{ "idempotencyKey": "dedupe-771", "duplicateOfEventId": "oev_4b7c0f19a2d36e58", "note": "same Salesforce id as the webhook's claim" }
```

Also admin-only, also append-only. `duplicateOfEventId` is a **justification, not a guess**: set it only when the duplication was proven by an identical `(externalSystem, externalRef)` or idempotency key. An *inferred* duplicate stays a finding for a human — see below.

## Two claims of one kind on one call

This is a legal state, not an error. A post-call webhook reporting against the orchestrator's call id and your agent reporting against the task id may be **one meeting reported twice, or two meetings genuinely booked**. Floe knows the rows describe one call and cannot know which — so it keeps both and opens an `outcome_claim_collision` finding rather than picking. The finding names the call, the kind, and the claim ids in contention.

There are exactly two resolutions:

1. **One of them is a duplicate** — void it with `duplicateOfEventId` naming the survivor.
2. **Both are real** — say so:

```http
POST /v1/developer/outcomes/collisions/confirm-distinct
```

```json
{ "interactionId": "int_9a1f30c47be25d86", "outcomeKind": "meeting_booked", "note": "two separate prospects on one conference call" }
```

```json
{ "resolved": "outcome_claim_collision:int_9a1f30c47be25d86:meeting_booked", "claimsRating": "both" }
```

It acts on the **finding**, not on an event — the finding is what named the ambiguity, so clearing it is what records the answer, resolved as `acknowledged` (a human decided) rather than `auto_cleared`. `interactionId` is the call id the emit response returned, or the one on the finding. No open collision for that call and kind answers `404 collision_not_found`.

## Once it's billed, it's frozen

When a [period close](invoicing.md#close-the-period) stamps a claim, the response carries `billedInPeriodId` and the claim is immutable — confirming or voiding it returns `409 outcome_claim_billed`. The statement it sits in has already been seen by a client, so the correction is a **reversal in the next open period**, never an edit. That is the same rule the rest of invoicing runs on.

## Errors

| Status | `error` | Surface | Meaning |
|---|---|---|---|
| `400` | `invalid_task_id` | emit | The task id normalized to nothing. |
| `400` | `Invalid request` | all | Body failed validation — including an unknown field, or `externalRef` without `externalSystem`. |
| `403` | `Forbidden` | confirm / void / confirm-distinct | The caller's account role is below **admin**. |
| `404` | `task_not_found` | emit | No call in your account carries that task id. The claim is refused, not stored unattached. |
| `404` | `outcome_not_found` | confirm / void | No claim with that `oev_…` id in your account. |
| `404` | `collision_not_found` | confirm-distinct | No open collision for that call and kind. |
| `409` | `outcome_claim_exists` | emit | A current claim of this kind already exists for the task. Correcting it is an operator action. |
| `409` | `outcome_claim_bound_elsewhere` | emit | That idempotency key already names a claim bound to a different call. Use a new key. |
| `409` | `outcome_claim_conflict` | confirm / void | The named claim is no longer the current head of its chain — it was already superseded (voiding the same claim twice under two keys does this). Re-read the head and act on that. |
| `409` | `outcome_claim_billed` | confirm / void | The claim sits in a closed statement. Correct it with a reversal in the next open period. |

## Related

- [Cost per client, campaign & task](attribution.md) — the task id an outcome is reported against.
- [Rate cards & the margin engine](rate-cards.md) — where what you bill is defined.
- [Client invoicing](invoicing.md) — periods, closes, and why a billed claim is frozen.
- [Agent Runtime Contract](../developers/agent-runtime-contract.md#outcome-linked-spend-attribution) — the separate per-action quality signal.
</content>
</invoke>
