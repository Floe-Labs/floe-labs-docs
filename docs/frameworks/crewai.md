---
icon: users
---

# CrewAI `Beta`

One Floe spend ceiling caps your crew's **paid tool calls** — and, **when you route models through Floe's LLM proxy (`FloeLLM`)**, its LLM tokens too — behind a hard, server-side limit. The agent can never spend past it, no matter what the model decides to do.

> **Scope.** Floe's spend controls cap every paid call it settles — x402 payments through the proxy **and** LLM tokens routed through Floe's LLM proxy (`FloeLLM`, see [Paying for LLM tokens](#paying-for-llm-tokens) below), on one ledger and one set of caps. A call sent straight to a provider with your own key, bypassing Floe, is the one thing a policy can't see.

> Your 3 AM infinite loop dies at **$1**, not $414.

CrewAI's most common production complaint is a runaway agentic loop quietly burning through tokens until you notice the bill. Floe puts a real dollar ceiling around the whole crew: a **server-side [spend control](../developers/spend-controls.md)** on your agent key. The cap is enforced by the Floe facilitator, not by the agent — so a confused or adversarial model can't talk its way past it. Scope the same policy to named vendors and the agent can only pay who you've allowed.

## Install

{% tabs %}
{% tab title="Standalone package" %}
```bash
pip install crewai-floe
```
{% endtab %}
{% tab title="Via floe-agentkit-actions" %}
```bash
pip install "floe-agentkit-actions[crewai]"
```
The same surface is available under `floe_agentkit_actions.integrations.crewai`.
{% endtab %}
{% endtabs %}

You'll need a Floe agent key (`floe_…`) from [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) — that's it. Floe manages the wallet, so there's no wallet provider, private key, or gas to configure ([Quickstart](../getting-started/quickstart.md)).

## Quickstart

Two Floe pieces wire into a plain `crewai.Agent`: **`Floe402Tool`** pays for x402 vendor APIs, and **`FloeLLM`** routes model tokens through Floe. Both draw on the **same prepaid balance** behind your one agent key, so a single spend control caps them together.

```python
import os
from crewai import Agent, Crew, Task
from crewai_floe import Floe402Tool, FloeLLM

FLOE_API_KEY = os.environ["FLOE_API_KEY"]   # your floe_… agent key

researcher = Agent(
    role="Market Researcher",
    goal="Pull pricing data from paid APIs and summarize it",
    backstory="Finds and summarizes live quotes.",
    tools=[Floe402Tool(url="https://api.somevendor.com/quote", api_key=FLOE_API_KEY)],
    llm=FloeLLM(                                     # BYOK — or go keyless, see "Paying for LLM tokens"
        model="openai/gpt-4o",
        proxy_base_url="https://credit-api.floelabs.xyz/v1/llm",
        credit_key=FLOE_API_KEY,                     # your Floe agent key — identifies your balance
        provider_key=os.environ["OPENAI_API_KEY"],   # your provider key; Floe meters + caps, never persists it
    ),
)

crew = Crew(agents=[researcher], tasks=[Task(
    description="Get the latest quote and summarize it",
    expected_output="A one-paragraph summary",
    agent=researcher,
)])

crew.kickoff()
```

Every tool call and every token is paid from the balance behind `FLOE_API_KEY`. Set a spend control on that key (see [The ceiling](#the-ceiling-a-server-side-spend-control) below) and the crew can never spend past it.

### Paying for tools — `Floe402Tool`

`Floe402Tool` is a `crewai.tools.BaseTool` that calls any of the **2,000+ vendor API services** reachable through [x402](../developers/x402-facilitator.md). Each call routes through the Floe facilitator, which funds the payment from your prepaid balance, signs the payment, and returns the response. The agent never holds USDC or an API key, never signs a transaction, never pays gas.

```python
from crewai_floe import Floe402Tool

quote_tool = Floe402Tool(url="https://api.somevendor.com/quote", api_key=FLOE_API_KEY)
```

Pass a `ledger=[]` list to record each call's cost as structured data (`{"url", "cost", "cost_raw", "tool"}`) instead of parsing it out of the response.

### Paying for LLM tokens

Route your crew's model calls through Floe two ways — both land on the **same** balance as your tool calls, so one spend control caps everything.

**Keyless (recommended) — [Floe Inference](../developers/keyless-inference.md).** No provider account, no OpenAI/Anthropic key: Floe fronts the upstream relationship from a pooled wallet and bills your balance. Point an OpenAI-compatible client at the gateway (`https://credit-api.floelabs.xyz/v1`) with your Floe agent key — ids are fully qualified (`openai/gpt-4o`, `anthropic/claude-…`) and the live catalog is `GET /v1/models`. Setup and the full model list are in the [Floe Inference](../developers/keyless-inference.md) docs.

**BYOK — `FloeLLM`.** Already have a provider account? `FloeLLM` is a thin `crewai.LLM` that routes *your* provider key through Floe's metered proxy (`/v1/llm`), so token spend is metered at **provider cost** (plus roughly a **5% buffer** — at-cost, Floe takes no margin) and debited from the same balance.

```python
from crewai_floe import FloeLLM

llm = FloeLLM(
    model="openai/gpt-4o",
    proxy_base_url="https://credit-api.floelabs.xyz/v1/llm",  # BYOK metered proxy
    credit_key=FLOE_API_KEY,                     # your Floe agent key — identifies your balance
    provider_key=os.environ["OPENAI_API_KEY"],   # your provider key; pass-through, never persisted
)
```

Floe holds no provider keys: with BYOK your `provider_key` is supplied per request and **never persisted**.

> **Open-weight models, zero extra infra.** Some providers (e.g. Venice) are already x402 vendors, so calls to them are just paid tool calls through `Floe402Tool` — every Floe control governs them with nothing extra to run. The honest caveat: the x402-native models available today are open-weight (Llama, Qwen, etc.). For GPT-4o and Claude, route through `FloeLLM`.

## The ceiling — a server-side spend control

The hard dollar limit is a **[spend control](../developers/spend-controls.md)** on your agent key, not anything in the agent's code. Set it once (dashboard or API) and Floe enforces it on every call it settles:

- **Per-task, per-day, or per-team caps** — bound a single run, a rolling day, or your whole team.
- **Per-vendor caps** — cap what any one x402 vendor can be paid; a vendor policy set to default-deny becomes an allowlist, so the crew can only pay hosts and payees you've named.
- **Policy kill-switch** — when a cap is breached, the call is refused (`402` / `429`), `crewai.LLM.call()` raises, and **the crew halts.** This is the actual stop: the 3 AM loop dies at your cap, server-side, no matter what the model does.

Because both `Floe402Tool` and `FloeLLM` route through Floe, one policy bounds the entire crew — tool spend and token spend on one ledger. See [Spend Controls](../developers/spend-controls.md) for policy types, time windows, and value-aware caps.

> **Per-role caps.** Want a Researcher capped at $1 and a Buyer at $5, independently? Give each crew member its own agent key — Floe allows up to 5 managed agents per developer, each with its own key and its own spend control — and pass that key to the role's `Floe402Tool` and `FloeLLM`.

## Budget awareness (optional)

Beyond the hard cap, a crew can *see* how much room it has left and plan accordingly. When your operator enables it, every paid response carries an **`X-Floe-Budget-Advisory`** header reporting remaining headroom on the tightest active cap — so an agent can downgrade to a cheaper model or change path **before** it hits a hard `402`. It's off by default; see the [Agent Runtime Contract](../developers/agent-runtime-contract.md#context-aware-spend-advisory).

**This is a soft signal.** LLMs honor it unreliably — a model can ignore its own instructions. Budget awareness is upside for cleaner planning; the **spend control is the real protection**. Don't rely on the advisory to stop a loop. Rely on the cap.

## Demos

Runnable crews live in [`floe-cookbook/crewai-demo`](https://github.com/Floe-Labs/floe-cookbook/tree/main/crewai-demo): a `loop_kill.py` that rigs an infinite loop and shows Floe refuse the call past the cap, and a `procurement_crew.py` Researcher → Buyer → Manager crew with per-vendor allowlisting. Setup is in the example's `README.md`.
