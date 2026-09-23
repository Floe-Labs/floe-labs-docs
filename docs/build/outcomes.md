---
icon: circle-check
---

# Outcomes — what a task produced

[Attribution](attribution.md) tells you what a task **cost**. This page is the other half: what it **produced** — a booked meeting, a qualified lead, a resolved ticket. Report the outcome against the task id you already send, and Floe binds it to the same call your costs are on. Cost and outcome then sit on one row.

That is what turns *cost per outcome* into a number instead of an estimate. "Our meetings cost $4.10 each" is only sayable if the meeting and the spend are the same record.

Floe never judges whether an outcome is good, and never infers one. You state what happened; Floe joins it to the money.

## Two different things called "outcome"

This trips people up more than anything else on this page, so take thirty seconds on it.

| | **Action outcome** (`reportOutcome`) | **Outcome claim** (`emitOutcome`) |
|---|---|---|
| What it is | Your own eval signal for a tagged action | The billable claim for a task |
| Keyed on | `actionId` | `taskId` |
| Shape | `status` + `scoreBps` + `note` | `outcomeKind` + `quantity` + evidence |
| Reaches an invoice | Never | Yes — this is what gets rated |
| Re-reporting | Overwrites the previous signal | **Refused** — see [Emitting the same outcome twice](#emitting-the-same-outcome-twice). Only an operator appends a correction |

If you are asking *"did this decision work?"*, that is the action outcome. If you are asking *"what did this task produce that we bill for?"*, that is an outcome claim — this page.

## Emit a claim

Your agent reports the fact, using its **agent key** (`floe_…`), as soon as it knows.

{% tabs %}
{% tab title="TypeScript" %}
```ts
await agent.fetch({ url, taskId: "call-8821" });

await agent.emitOutcome({
  taskId: "call-8821",
  outcomeKind: "meeting_booked",
  idempotencyKey: "call-8821:meeting_booked",
});
```
{% endtab %}

{% tab title="Python" %}
```python
agent.fetch(url, task_id="call-8821")

agent.emit_outcome(
    "call-8821", "meeting_booked",
    idempotency_key="call-8821:meeting_booked",
)
```
{% endtab %}

{% tab title="curl" %}
```bash
# $FLOE_API_KEY holds the AGENT key (floe_…) for this route — a floe_live_…
# developer key is refused with wrong_credential_type.
curl -X POST https://credit-api.floelabs.xyz/v1/agents/outcomes \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "call-8821",
    "outcomeKind": "meeting_booked",
    "idempotencyKey": "call-8821:meeting_booked"
  }'
```
{% endtab %}
{% endtabs %}

An MCP-connected agent uses the `emit_outcome` tool instead — same fields in snake_case.

### The rules worth knowing before you build on it

**A task id that names no call is refused** with `404 task_not_found`, not stored. An outcome nothing can bill is worse than no outcome, because it looks like one. Tag the call first (see [attribution](attribution.md)), emit after.

**`outcomeKind` is opaque.** Lowercased, ≤64 characters, never interpreted by Floe — the vocabulary is yours. Pick stable machine-ish names (`meeting_booked`, `lead_qualified`, `ticket_resolved`) and keep them stable once you start emitting, because anything that later prices an outcome will key on the kind.

> **Pricing per outcome kind is not available yet.** [Rate cards](rate-cards.md) today meter per request, per audio minute, per task and per voice call — there is no outcome unit. Emitting claims, confirming them and reading them back all work now; rating a kind against a price comes with the rating work. Record the outcomes in the meantime: the claims are what that will rate.

**`idempotencyKey` is required.** Emitters retry; a replay of the same key returns the stored claim rather than creating a second one. Derive it from the fact itself (`<taskId>:<kind>`) rather than generating a random one, or a retry becomes a duplicate claim. Reusing one key under a *different* task id is refused — the claim is already attached to the first call.

**Two meetings on one call is `quantity: 2` on one claim**, not two claims.

### Emitting the same outcome twice

The one thing to get right before you build a retry loop:

| What you send | What happens |
|---|---|
| Same `idempotencyKey` | `200` with the stored claim — no second row. This is why retries are safe |
| New key, same task **and** kind, claim still live | `409 outcome_claim_exists` |
| New key, **different** kind on the same task | `201` — a separate claim, which is correct |
| Same key, **different** task | `409 outcome_claim_bound_elsewhere` |

**Your agent never appends to a chain.** Appending is a *revision* — confirming or voiding — and that is the operator surface, not this one. So there is no way for an agent to "re-report" an outcome: it either replays the claim it already made, or it is refused.

## Reporting is not confirming

An agent key may **report** a claim and nothing else. It cannot confirm one, void one, or resolve a conflict — those move money, and the evidence that justifies them (a CRM webhook, a calendar invitation) reaches your backend minutes to days after the call, not the agent's process.

So a freshly emitted claim is `reported`, and its `confirmedAt` is null. It becomes billable when **you** confirm it with a developer credential. Floe stamps `confirmedAt` with the time it receives the confirmation. You can't send your own, because that time decides which billing period the claim lands in. (`occurredAt` is still yours to send: it's when the outcome happened.)

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/outcomes/oev_00112233445566aa/confirm \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"idempotencyKey": "close-sep:oev_0011", "externalSystem": "hubspot", "externalRef": "DEAL-9"}'
```

| Status | Meaning |
|---|---|
| `reported` | Stated by an agent or an orchestrator. Not billable yet. |
| `confirmed` | An operator (or the client) vouched for it. This is what rates. |
| `void` | Retired — typically a proven duplicate. |
| `disputed` / `reversed` | Contested, or credited back after it was already billed. |

Every claim is **append-only**. Confirming does not edit the reported row; it writes a new event that supersedes it, so the chain of who said what, when, survives. A claim already billed into a closed statement is frozen — the correction is a reversal in the next open period, never an edit.

## Evidence is an allowlist

Three optional fields, and nothing else is accepted:

| Field | Notes |
|---|---|
| `externalSystem` | The namespace — `hubspot`, `google_calendar`. Lowercased. |
| `externalRef` | Its id, stored **verbatim** (these are case-sensitive). Requires `externalSystem`. |
| `note` | Free text, ≤500 characters. |

Equality on `(externalSystem, externalRef)` is the only thing that **proves** two claims are one fact, which is why the reference is never normalised. All three are erasable: a subject erasure nulls them and stamps the claim. The claim itself survives, because an invoice line must outlive an erasure — a CRM id need not.

> **Don't put personal data in `note`.** It is erasable, but it is still the wrong place for it.

## When two claims land on one call

A post-call webhook reporting against the orchestrator's call id, and your agent reporting against the task id, can both resolve to the same call. That is either **one meeting reported twice** or **two meetings booked once** — and nothing in the data distinguishes them.

Floe does not guess. Both claims are kept, each with its own chain, and an `outcome_claim_collision` finding names the conflict for a person. You resolve it by voiding one as a proven duplicate, or by confirming that both are genuinely distinct — after which both rate.

This is the same rule the rest of the ledger follows: a guessed attribution is a silent accounting error, and a named conflict is not.

## Reading them back

Discovery is **by the call**, because when you are asking the question you have a task or a client — not a claim id.

```bash
# every claim on one campaign, newest first
curl "https://credit-api.floelabs.xyz/v1/developer/outcomes?campaignId=q3-outbound&status=confirmed" \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"

# one claim, with the chain it belongs to
curl "https://credit-api.floelabs.xyz/v1/developer/outcomes/oev_00112233445566aa" \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

Filter by `taskId`, `interactionId`, `customerId`, `campaignId`, `outcomeKind`, `status`, `source` and a date range. Results are keyset paged — pass `nextCursor` back verbatim. MCP clients have the same two reads as `list_outcomes` and `get_outcome`.

Two behaviours worth relying on:

- **A saved claim id never 404s because it was corrected.** Naming any event in a chain answers with the current head and tells you whether the id you held is still it (`isHead`).
- **A claim that cannot be bound is returned, not hidden.** In practice you should never see one: every claim reaches Floe through a path that binds it at write, and emitting against a task id that names no call is refused outright. The reason field exists because the read surface will not drop a row it cannot explain — if a claim ever does arrive unbound, it comes back saying so instead of going quietly missing from your outcome data.

Reading outcomes is on the **free** plan, like the rest of the [by-call ledger](unified-ledger.md).

Full request and response schemas for every route on this page live in the [OpenAPI specification](https://credit-api.floelabs.xyz/.well-known/openapi.yaml).
