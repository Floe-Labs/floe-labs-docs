---
icon: puzzle-piece
---

# Claude Code / Agent Skills

The **Floe agent skill** teaches Claude Code, Cursor, or any [Agent Skills](https://www.anthropic.com/news/skills) client to run your whole vendor stack — LLM, STT, TTS, telephony, search, data — on **one Floe key**, metered per call and capped by spend limits you set. Install it once and your coding agent knows how to onboard, migrate an existing project, add spend policies, wire telephony, and show you the receipt after every session.

> **$3 Welcome Credit (300 API credits).** New accounts get $3 to run the skill end-to-end immediately — no card required. [Get a key →](https://dev-dashboard.floelabs.xyz)

---

## Install

{% tabs %}
{% tab title="skills.sh CLI" %}
```bash
npx skills add floe-labs/agent-skills
```

Pin to a release for reproducibility: `npx skills add floe-labs/agent-skills@v1.0.0`.
{% endtab %}
{% tab title="Manual (global)" %}
Available in every project:

```bash
git clone https://github.com/floe-labs/agent-skills
cp -r agent-skills/skills/floe ~/.claude/skills/
```
{% endtab %}
{% tab title="Manual (per-project)" %}
Checked into one repo:

```bash
git clone https://github.com/floe-labs/agent-skills
cp -r agent-skills/skills/floe .claude/skills/
```
{% endtab %}
{% endtabs %}

Canonical home — issues, releases, source: **[github.com/floe-labs/agent-skills](https://github.com/Floe-Labs/agent-skills)**.

---

## What it does

The skill triggers whenever you're building or running an agent that touches multiple vendors — even if you never say the word "Floe." It knows how to:

- **Onboard** — one key, the `$3` Welcome Credit, your first governed call.
- **Migrate** — swap each vendor's base URL for the Floe gateway; keep your own provider key (BYOK) where you want it.
- **Cap spend** — session limits and per-task / per-vendor policies that bind **before** the call, not on an invoice.
- **Show the receipt** — the true cost per leg after every session:

```
Session cost: $0.048
  Twilio (telephony)     $0.003
  Deepgram (STT)         $0.004
  openai/gpt-4o (LLM)    $0.028
  ElevenLabs (TTS)       $0.009
  Web fetch (x402)       $0.001
  CRM API (x402)         $0.002
Budget remaining: $4.71 / $5.00 (session cap)
```

Budgets are enforced **server-side** — a breach returns `402`, or a kill-switch policy suspends the agent — and the agent tapers gracefully with [`floe-guard`](https://pypi.org/project/floe-guard/) before it ever hits that floor.

---

## Get a key

Sign up at [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) — email only, no card. New accounts get the **$3 Welcome Credit (300 API credits)** to run the skill immediately. The skill uses an **agent** key (`floe_…`) — never paste a key into a chat window; use an environment variable or secret manager. See [Authentication](authentication.md).

---

## Next

- [Quickstart (5 minutes)](quickstart.md) — create an agent and make your first paid call.
- [Set up with your AI tools](setup-with-ai-tools.md) — the MCP server, CLI, and the one-prompt `agents.md` runbook.
- [Add Floe to your existing pipeline](integrate-existing-pipeline.md) — the base-URL swap for an app you already have.
