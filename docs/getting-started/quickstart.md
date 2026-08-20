---
icon: rocket
---

# Quickstart (5 minutes)

Run a voice turn — STT → LLM → TTS — through Floe and watch the **per-turn receipt** print on the very first call:

```text
floe · gpt-4o · $0.0012 est · left $…
```

One key meters every leg, and a spend cap you set server-side bounds the whole run. There are two ways in — pick the track that fits you:

| Track | Who it's for | Keys |
|---|---|---|
| **[Track 1 — BYOK](#track-1-byok-keep-your-keys)** | You already pay OpenAI / Deepgram and want Floe's metering, budgets, and one ledger over the top | Your own vendor keys ride `X-Floe-Provider-Key`; Floe bills only its fee |
| **[Track 2 — Keyless](#track-2-keyless-welcome-credit)** | You want to make a paid call in the next two minutes with no vendor accounts at all | None — Floe holds the provider keys, you spend the **$3 Welcome Credit** |

Both tracks are the same code with one line different (a `provider_key`). Both print the receipt on turn one.

> **$3 Welcome Credit (300 API credits).** Track 2 starts on the house — no card, once per account (not per agent). Roughly 300 calls at a typical ~$0.01/call. [Get a key →](https://dev-dashboard.floelabs.xyz)

---

## Get a Floe key (both tracks)

Every call is metered on a Floe agent key, whether or not you bring your own vendor keys. Point your coding agent at Floe and it does the setup for you:

```text
Read https://dev-dashboard.floelabs.xyz/agents.md and set up Floe for this project.
```

`agents.md` is an executable runbook written for agents: it triages what you already have, installs the right client, states the key-handling rules, provisions an agent, and ends with a settled paid call. It covers **both** tracks — it'll ask whether you're bringing your own vendor keys (BYOK) or spending the Welcome Credit (keyless).

Prefer to do it by hand? Open [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz), sign in with email or Google, click **New agent**, and copy the key (starts with `floe_…`, shown once). Export it:

```bash
export FLOE_API_KEY="floe_..."
```

---

## Track 1 — BYOK (keep your keys)

You already have an OpenAI key, a Deepgram key, whatever. Keep using them. Floe rides on top: it meters every call, enforces your spend caps, and settles the whole voice turn on one ledger — while the upstream call runs on *your* vendor key. Your vendor key travels as `X-Floe-Provider-Key`, is used for that one request, and is discarded — Floe never stores it. Floe bills only its own service fee, so the receipt reflects Floe's cut, not your vendor invoice.

### Step 1 — the receipt, on turn one

**Pipecat** (`pip install pipecat-floe` — 0.3.0 is live on PyPI). Swap your `OpenAILLMService` for `FloeLLMService` and pass your OpenAI key as `provider_key`:

```python
import os
from pipecat_floe import FloeLLMService

llm = FloeLLMService(
    model="openai/gpt-4o",                      # fully-qualified provider/model
    provider_key=os.environ["OPENAI_API_KEY"],  # BYOK → rides X-Floe-Provider-Key, used then discarded
    # api_key defaults to FLOE_API_KEY from the env — that's what the call is metered on
)
```

Cost receipts are **on by default** (`cost_receipts=True`). The first time that `llm` completes a turn inside a running pipeline, it logs:

```text
floe · gpt-4o · $0.0012 est · left $…
```

The cost is priced locally (free, offline, no extra call); `left $…` appears when a Floe key is present. Set `cost_receipts=False` to silence it.

**LiveKit** (see the [install note](#livekit-install-not-yet-on-pypi) — not on PyPI yet). The `floe.LLM` plugin takes the same `provider_key`, and `floe.enable_cost_receipts(session)` turns on the same receipt line across the session:

```python
import os
from livekit.plugins import floe
from livekit.agents import AgentSession

session = AgentSession(
    llm=floe.LLM(
        model="openai/gpt-4o",
        provider_key=os.environ["OPENAI_API_KEY"],  # BYOK → X-Floe-Provider-Key
        # api_key defaults to FLOE_API_KEY
    ),
    # ... stt, tts, vad
)
floe.enable_cost_receipts(session)   # logs `floe · gpt-4o · $… est · left $…` per turn
```

### Step 2 — the full voice turn (STT → LLM → TTS)

Wire all three legs through Floe so the whole turn lands on one key and one budget.

**Pipecat** — the runnable reference is [`examples/bot.py`](https://github.com/Floe-Labs/pipecat-floe/blob/main/examples/bot.py) in `pipecat-floe`. The three legs are just three services in the pipeline. The LLM and TTS services take an optional `provider_key` — pass it to keep that leg on your own vendor key, or omit it to run the leg keyless on Floe's keys. The STT leg streams over Floe's own WebSocket protocol on Floe-managed Deepgram, so it has no `provider_key` and always runs keyless:

```python
from pipecat_floe import FloeSTTService, FloeLLMService, FloeTTSService

stt = FloeSTTService(model="deepgram/nova-3")
llm = FloeLLMService(model="openai/gpt-4o", provider_key=os.environ["OPENAI_API_KEY"])
tts = FloeTTSService(model="openai/tts-1", voice="alloy")
# ... drop stt, llm, tts into a Pipeline([...]) — see examples/bot.py for the full runner
```

```bash
pip install pipecat-floe          # 0.3.0
python bot.py                     # connect an audio client to ws://localhost:8765
```

**LiveKit** — the plugin ships `floe.LLM` only: build the `AgentSession` with `floe.LLM` plus your usual LiveKit STT and TTS plugins, then `floe.enable_cost_receipts(session)` and `session.start(...)`. Floe's receipts and budget controls cover the Floe-routed LLM leg; the STT/TTS legs stay on their own plugins and billing. See the [LiveKit install note](#livekit-install-not-yet-on-pypi) first.

> **Scope note:** Floe caps and meters the calls that route through it. On BYOK, the *model/voice* legs run on your vendor keys — Floe meters them and shows the receipt, and bills its service fee; your vendor still invoices you directly for the underlying tokens.

Model ids are fully-qualified `provider/model`. Resolve the live set — and, once published, per-model pricing and which rail applies — at [`GET /v1/models`](../developers/keyless-inference.md) with your Floe agent key.

---

## Track 2 — Keyless (Welcome Credit)

No vendor accounts, no card. Floe holds the provider keys; you spend the **$3 Welcome Credit** (once per account). It's the same code as Track 1 with the `provider_key` line removed — Floe supplies the upstream key and bills the full call to your balance.

### Step 1 — the receipt, on turn one

**Pipecat:**

```python
from pipecat_floe import FloeLLMService

llm = FloeLLMService(model="openai/gpt-4o")   # no provider_key → Floe uses its own keys
# api_key defaults to FLOE_API_KEY; the call is metered on your Welcome Credit
```

First completed turn logs the same line — cost debited from your balance:

```text
floe · gpt-4o · $0.0012 est · left $3.00
```

**LiveKit** (see the [install note](#livekit-install-not-yet-on-pypi)):

```python
from livekit.plugins import floe
from livekit.agents import AgentSession

session = AgentSession(
    llm=floe.LLM(model="openai/gpt-4o"),   # no provider_key → keyless
    # ... stt, tts, vad
)
floe.enable_cost_receipts(session)
```

### Step 2 — the full voice turn (STT → LLM → TTS)

Identical to Track 1, minus the `provider_key`s — every leg runs on Floe's keys and bills to your balance:

```python
from pipecat_floe import FloeSTTService, FloeLLMService, FloeTTSService

stt = FloeSTTService(model="deepgram/nova-3")
llm = FloeLLMService(model="openai/gpt-4o")
tts = FloeTTSService(model="openai/tts-1", voice="alloy")
# ... same Pipeline([...]) as examples/bot.py
```

```bash
pip install pipecat-floe          # 0.3.0
python bot.py
```

That's a full STT → LLM → TTS turn — three legs, one key, one bill — off the Welcome Credit, no card.

---

## LiveKit install (not yet on PyPI)

`pipecat-floe` is published — `pip install pipecat-floe` works today (0.3.0). **`livekit-plugins-floe` is not on PyPI yet** (it's pending a merge into `livekit/agents`). Do **not** `pip install livekit-plugins-floe` — it will 404. Until it lands, install from source / the open PR:

```bash
# Preview only — a plugin package inside the livekit/agents#6890 PR branch, not a standalone repo.
# For production, wait for the PyPI release (below) rather than pinning an unmerged branch.
pip install "git+https://github.com/achris7/agents.git@feat/livekit-plugins-floe#subdirectory=livekit-plugins/livekit-plugins-floe"
```

Watch the [pipeline integration guide](integrate-existing-pipeline.md) and the [changelog](../changelog.md) for the PyPI release. If you'd rather not wait, the plain OpenAI-compatible base-URL swap (`openai.LLM(base_url="https://credit-api.floelabs.xyz/v1", api_key=FLOE_API_KEY)`) works on LiveKit today — you just don't get the built-in `floe.enable_cost_receipts` line.

---

## Fund & set budgets (later)

You don't need this to make your first call — Track 2 rides the Welcome Credit, and Track 1 rides your own vendor keys. Come back once you've seen the loop work.

- **Fund it.** When the Welcome Credit runs low, click **Fund Wallet** on the agent and pay with **card, Apple Pay, Google Pay, or bank transfer**. Funds arrive within seconds. See [Funding your agent](funding.md).
- **Set a spend control.** Cap what the agent can spend — per call, per day, per vendor, or across your team. Enforced server-side, so a runaway loop can't blow your budget. See [Spend Controls](../developers/spend-controls.md).

## What's next

- [Add Floe to your existing pipeline](integrate-existing-pipeline.md) — drop Floe into Vapi, Retell, Pipecat, LiveKit, and more
- [The Voice Stack](../build/voice-stack.md) — run a full voice turn — STT, LLM, TTS, telephony — on one key, one budget
- [Keyless inference & the model catalog](../developers/keyless-inference.md) — every gateway model, resolved live at `GET /v1/models`
- [Floe CLI](../developers/cli.md) — every command, flag, and exit code

---

Two tracks, one receipt: BYOK to keep your keys, keyless to skip them — either way the cost prints on turn one, in dollars.
