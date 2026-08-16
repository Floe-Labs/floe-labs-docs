---
icon: arrows-rotate
---

# Ledger sync — coverage for BYOK & self-hosted spend

{% hint style="info" %}
**Rolling out.** The client methods and `floe-guard push` CLI ship in the guard library today; the server endpoint (`POST /v1/agents/ledger/sync`) is rolling out. If a sync returns `404`, the endpoint isn't enabled for your account yet — request access at [hello@floelabs.xyz](mailto:hello@floelabs.xyz).
{% endhint %}

Your [Coverage Score](coverage-score.md) can only count spend Floe can see. Floe sees the calls it routes — the gateway, the x402 proxy, Floe Phone. It **cannot** see a call it never touched: an LLM you hit with your own provider key (BYOK), a model you self-host, a tool you pay for off Floe's path. That spend is **dark** — it counts against nothing and appears nowhere.

Ledger sync closes that gap. The open-source [`floe-guard`](https://github.com/Floe-Labs/floe-guard) library already keeps a local, priced ledger of every call your agent makes. This feature lets it **push that ledger to Floe's [Reconcile Mode](../developers/webhooks.md#connect-your-orchestrator-reconcile-mode)**, so dark spend becomes **reconciled** — visible on the score, attributable in your billing, and on the path to full coverage.

## Trust & privacy first

This is opt-in, explicit, and quiet by default. Nothing about it phones home.

- **Off by default. Zero telemetry.** The guard sends nothing anywhere until you both (a) opt in with an API key and (b) explicitly call `sync()`. No background flush, no ambient reporting.
- **The request body is exactly your `export_log()` output** — priced spend events only: `timestamp`, `kind`, `model_or_tool`, token counts, `cost_usd`. That's it.
- **No prompts. No content. No identifiers.** The only free-form field that ever leaves the process is an optional `label` **you** set. There is no user id, no request payload, no transcript, no IP.
- **The client validates before it sends.** Anything outside the documented event schema is rejected locally — a malformed or over-broad row never leaves your process.
- **Revocable.** `disable_sync()` turns it back off and clears the stored key. No key on disk means no possible send.

If you can't send content you don't have, you can't leak it. The guard never captures prompts in the first place — it prices calls, it doesn't record them.

## Turn it on

You need a **`read_write`** agent key (`floe_…`) — mint one from the [Developer Dashboard](../developers/developer-dashboard.md) or `POST /v1/developer/agents/:id/keys` with `"permissions": "read_write"`. A read-only key is rejected.

### Programmatic

{% tabs %}
{% tab title="Python" %}
```python
from floe_guard import BudgetGuard

guard = BudgetGuard(limit_usd=25.0)

# ... your agent runs, guard prices each call into its local ledger ...

guard.enable_sync(api_key="floe_…")   # opt in once (stores the key)
result = guard.sync()                  # explicit send of the current ledger
print(result)  # {'synced': 128, 'duplicates': 0, 'rejected': 0}

guard.disable_sync()                   # revoke — clears the key, stops all sends
```
{% endtab %}

{% tab title="TypeScript" %}
```typescript
import { BudgetGuard } from "floe-guard";

const guard = new BudgetGuard({ limitUsd: 25.0 });

// ... your agent runs, guard prices each call into its local ledger ...

guard.enableSync({ apiKey: "floe_…" });   // opt in once (stores the key)
const result = await guard.sync();         // explicit send of the current ledger
console.log(result); // { synced: 128, duplicates: 0, rejected: 0 }

guard.disableSync();                        // revoke — clears the key, stops all sends
```
{% endtab %}
{% endtabs %}

`sync()` is safe to call repeatedly: re-sending events Floe has already seen dedupes server-side (they land in `duplicates`, not double-counted). Call it on a timer, at task boundaries, or once at shutdown — whatever fits your run.

### CLI

If your ledger already lives on disk as newline-delimited JSON (one `export_log()` event per line), push it directly:

```bash
floe-guard push ledger.jsonl --key floe_…
```

Or pipe `export_log()` output straight in:

```bash
your-agent --dump-ledger | floe-guard push - --key floe_…
```

Both print the same `{ synced, duplicates, rejected }` summary the programmatic call returns.

## What it does to your Coverage Score

Synced spend lands in the **reconciled** bucket (see the [three-way split](coverage-score.md)). Two things follow from that, and both are deliberate:

- **It *lowers* your enforceable percentage.** This spend is real, but Floe didn't gate it — so it's honest to count it as reconciled, not enforceable. A score that quietly ignored your BYOK bill would be lying. Reconciling it is the first step; the second is moving those legs onto Floe rails so they become enforceable pre-call. That's the ["graduate to 100% coverage"](migrate-to-full-coverage.md) path — you can't graduate a leg the score can't see.
- **It's budget, not balance.** A synced row reports spend that already happened, for coverage and attribution. It **moves no money**, debits no balance, and **never suspends the agent**. Ledger sync reconciles history; it does not enforce.

Watch the effect on the **Coverage Score card** in your [dashboard](https://dev-dashboard.floelabs.xyz) — dark spend drops, reconciled rises, and the score names which legs to move next.

## When to reach for this

- You call an LLM or tool with **your own provider key** and want its cost on the same score as your Floe-routed spend.
- You **self-host** a model (vLLM, Ollama, a private endpoint) that Floe never sees.
- You have **off-path** paid calls — a vendor billed on its own account — that you're not ready to move onto the [proxy](../developers/x402-facilitator.md) yet, but want counted.

If a leg *can* run through Floe, routing it there is strictly better — it becomes enforceable pre-call, not just reconciled after. Ledger sync is for the spend that can't (yet).

## Related

- [Coverage Score](coverage-score.md) — the enforceable / reconciled / dark split this feeds.
- [`POST /v1/agents/ledger/sync`](../developers/ledger-sync-api.md) — the endpoint reference.
- [Reconcile Mode](../developers/webhooks.md#connect-your-orchestrator-reconcile-mode) — the other way cost reaches the ledger (hosted orchestrators).
- [Graduate to 100% coverage](migrate-to-full-coverage.md) — moving reconciled legs onto Floe rails.
- [Budget-Aware Routing](budget-aware-routing.md) — `floe-guard`'s local hard-stop and advisory taper.
