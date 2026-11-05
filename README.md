<div align="center">

# Free Rotation LLM Provider

<sub>Fork of [tashfeenahmed/freellmapi](https://github.com/tashfeenahmed/freellmapi) · MIT licensed.</sub>

**7.4 billion tokens per month.  34 free LLM providers. 635 free model endpoints. One OpenAI-compatible endpoint.**

Aggregate free tiers from dozens of providers, plus custom OpenAI-compatible chat, embedding, image, and audio endpoints, behind a single `/v1` API. Keys are stored encrypted. A router picks the best available model for each request, falls over to the next provider when one is rate-limited, and tracks per-key usage so you stay under every free-tier cap.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)


**English** · [简体中文](README.zh-cn.md) · [Русский](README.ru.md) · [O'zbekcha](README.uz.md)

<p align="center">
  <a href="docs/en/install/01-install.md#docker-compose"><img src="repo-assets/badges/docker.svg" height="48" alt="Self-host with Docker"></a>
</p>

![Free Rotation LLM Provider dashboard — Models page with the monthly token budget](repo-assets/github-hero.png)



</div>

---

## Contents

- [Why this exists](#why-this-exists)
- [Supported providers](#supported-providers)
- [Compatible CLIs & coding agents](#compatible-clis--coding-agents)
- [How it compares](#how-it-compares)
- [Features](#features)
- [Quick start](#quick-start)
- [Desktop app](#desktop-app)
- [Works with OpenAI-compatible clients](#works-with-openai-compatible-clients)
- [Languages](#languages)
- [Using the API](#using-the-api)
- [Screenshots](#screenshots)
- [How it works](#how-it-works)
- [FAQ](#faq)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)

**Guides:** [Install & deploy](docs/en/install/01-install.md) · [API reference](docs/en/api/01-rest-api.md) · [Clients & coding agents](docs/en/clients/01-agent-clients.md) · [Prompt compression](docs/en/compression/01-compression-pipeline.md) · [Architecture & internals](docs/en/architecture/00-high-level-index.md) · [Documentation index](docs/en/README.md) · [Contributor guide](CONTRIBUTING.md)

## Why this exists

Every serious AI lab now offers a free tier, a few million tokens a month, a few thousand requests a day. On its own each tier is a toy. Stacked together, they add up to roughly **7.4 billion tokens per month** of working inference capacity, across **474 model families / 635 provider endpoints** from small-and-fast to reasonably capable.

The problem is that stacking them by hand is painful: thirty-four different SDKs, thirty-four different rate limits, thirty-four places a request can fail. Free Rotation LLM Provider collapses that into one OpenAI-compatible endpoint. Point any OpenAI client library at your local server, and it routes transparently across whichever providers you've added keys for.

And the free-tier landscape shifts weekly: providers launch models, retire them, and change quotas without notice. Free Rotation LLM Provider tracks all of that for you. The router pulls a signed model catalog on its own, so your install keeps up without a `git pull`.

![The free tier, stacked — ~7.4B tokens of free inference per month across 34 providers](repo-assets/free-tier.png)

## Supported providers

<div align="center">
<table>
<tr>
<td align="center" width="150"><img src="repo-assets/providers/google.png" width="44" alt="Google"><br/><b>Google</b></td>
<td align="center" width="150"><picture><source media="(prefers-color-scheme: dark)" srcset="repo-assets/providers/groq-dark.png"><img src="repo-assets/providers/groq.png" width="44" alt="Groq"></picture><br/><b>Groq</b></td>
<td align="center" width="150"><img src="repo-assets/providers/cerebras.png" width="44" alt="Cerebras"><br/><b>Cerebras</b></td>
<td align="center" width="150"><picture><source media="(prefers-color-scheme: dark)" srcset="repo-assets/providers/opencode-dark.png"><img src="repo-assets/providers/opencode.png" width="44" alt="OpenCode Zen"></picture><br/><b>OpenCode Zen</b></td>
</tr>
<tr>
<td align="center"><img src="repo-assets/providers/mistral.png" width="44" alt="Mistral"><br/><b>Mistral</b></td>
<td align="center"><img src="repo-assets/providers/openrouter.png" width="44" alt="OpenRouter"><br/><b>OpenRouter</b></td>
<td align="center"><img src="repo-assets/providers/cloudflare.png" width="44" alt="Cloudflare"><br/><b>Cloudflare</b></td>
<td align="center"><img src="repo-assets/providers/cohere.png" width="44" alt="Cohere"><br/><b>Cohere</b></td>
</tr>
<tr>
<td align="center"><img src="repo-assets/providers/zhipu.png" width="44" alt="Z.ai (Zhipu)"><br/><b>Z.ai (Zhipu)</b></td>
<td align="center"><img src="repo-assets/providers/nvidia.png" width="44" alt="NVIDIA"><br/><b>NVIDIA</b></td>
<td align="center"><img src="repo-assets/providers/huggingface.png" width="44" alt="HuggingFace"><br/><b>HuggingFace</b></td>
</tr>
<tr>
<td align="center"><a href="https://modelscope.cn"><b>ModelScope</b><br/>Qwen3 · DeepSeek V4 · GLM-5 (needs Aliyun cn binding)</a></td>
</tr>
</table>

<i>… and 22 more free providers</i>

</div>

Plus a **custom** provider — point chat, embedding, image, or audio models at any OpenAI-compatible endpoint (llama.cpp, LM Studio, vLLM, a local Ollama, or a remote gateway) from the Keys page.

The full list, with per-model rate limits, context windows, and free-token budgets, is on the dashboard's **Models** page.

## Compatible CLIs & coding agents

<div align="center">
<table>
<tr>
<td align="center" width="150"><img src="repo-assets/agents/claude-code.png" width="44" alt="Claude Code"><br/><b>Claude Code</b></td>
<td align="center" width="150"><img src="repo-assets/agents/codex.png" width="44" alt="Codex CLI"><br/><b>Codex CLI</b></td>
<td align="center" width="150"><img src="repo-assets/agents/gemini-cli.png" width="44" alt="Gemini CLI"><br/><b>Gemini CLI</b></td>
<td align="center" width="150"><img src="repo-assets/agents/cursor.png" width="44" alt="Cursor"><br/><b>Cursor</b></td>
</tr>
<tr>
<td align="center"><img src="repo-assets/agents/cline.png" width="44" alt="Cline"><br/><b>Cline</b></td>
<td align="center"><img src="repo-assets/agents/roo-code.png" width="44" alt="Roo Code"><br/><b>Roo Code</b></td>
<td align="center"><img src="repo-assets/agents/opencode.png" width="44" alt="OpenCode"><br/><b>OpenCode</b></td>
<td align="center"><img src="repo-assets/agents/aider.png" width="44" alt="Aider"><br/><b>Aider</b></td>
</tr>
</table>

<i>… plus Continue, Goose, Qwen Code, Kilo Code, Crush, Zed, JetBrains AI, DeepSeek Harness, MiMo Code, AtomCode, OpenClaw, Hermes Agent, Pi, Reasonix, ZCode and any OpenAI-compatible, Anthropic, Gemini or Ollama client</i>

</div>

Most agents configure themselves with one command that reads your live catalog, backs up the existing config and merges into it:

```bash
npx freellmapi setup-claude --url http://localhost:3001 --api-key <unified-key>
```

**[All supported agents and their setup commands →](docs/en/clients/02-supported-agents.md)** · [Per-tool recipes, MCP server and URL tokens →](docs/en/clients/01-agent-clients.md)

## How it compares

![Feature comparison against OpenRouter, LiteLLM, and Portkey](repo-assets/comparison.png)

Based on public documentation, July 2026 — corrections welcome.

## Features

![Feature overview](repo-assets/features.png)

- **Every OpenAI-style surface** — `/v1/chat/completions`, `/v1/responses` (what Codex CLI needs), `/v1/completions` (editor ghost-text autocomplete), `/v1/images/generations`, `/v1/videos/generations`, `/v1/audio/speech`, `/v1/audio/transcriptions`, `/v1/embeddings`, and `/v1/models` — streaming and non-streaming, from the official SDKs or any OpenAI-compatible client. [API reference →](docs/en/api/01-rest-api.md)
- **Anthropic Messages API** — `/v1/messages` speaks Anthropic's wire format over the same router, so **Claude Code** and the official Anthropic SDKs run against your free pool. [Details →](docs/en/api/01-rest-api.md#anthropic--claude-clients)
- **Native Gemini + Ollama surfaces** — Gemini CLI can use `/v1beta` (`generateContent`, streaming, token counting, models), while opt-in Ollama emulation serves NDJSON chat/generate, tags, metadata, and embeddings for Zed, JetBrains, and other local-model clients.
- **Fusion (multi-model synthesis)** — request the virtual `fusion` model and the router fans your prompt out to a panel of diverse free models in parallel, then a judge model synthesizes one answer from the drafts. [Details →](docs/en/api/01-rest-api.md#fusion-multi-model-synthesis)
- **Image, video & speech generation** — `/v1/images/generations`, `/v1/videos/generations`, and `/v1/audio/speech` route across the providers that serve media models; images and speech also accept custom OpenAI-compatible media endpoints. Video jobs are normalized across synchronous and queued providers and return a completed MP4.
- **Tool calling & structured outputs** — OpenAI-style `tools` round-trip across providers (plain-text tool calls are rescued into real `tool_calls`), plus `response_format`, `seed`, `logprobs`, penalties, and the rest of the sampling params passed through per provider.
- **Smart routing, six strategies** — live per-model speed/capability/reliability scores rank your chain; automatic fallover retries the next model on 429/5xx with cooldowns and key rotation. [Routing in detail →](docs/en/architecture/00-high-level-index.md#how-it-works)
- **Unified models & profiles** — the same model on several providers collapses into one entry with strict in-group failover; named fallback-chain profiles (a coding chain, a vision chain) switch from the dashboard or per request via `auto:<profile>`, and custom chains can be renamed in place from the chain manager.
- **Per-key rate tracking** — RPM/RPD/TPM/TPD counters per `(platform, model, key)` that learn providers' reported ceilings, so routing always stays under every cap.
- **Self-updating model catalog** — the router syncs a signed, pinned-key-verified catalog twice a day: new models, quota changes, and provider quirk fixes land automatically, and your own enable/disable choices and custom providers are never touched.
- **Sticky sessions & context handoff** — conversations stay on one model for 30 minutes; an optional compact handoff note keeps the thread coherent when a mid-chat switch does happen. [Details →](docs/en/clients/01-agent-clients.md#context-handoff)
- **Prompt compression (opt-in)** — a shared, fail-open request pipeline can deduplicate prompts, filter tool output, compact repeated JSON, and trim stale context before cache lookup and routing. [Details →](docs/en/compression/01-compression-pipeline.md)
- **Encrypted keys, one token out** — provider keys are AES-256-GCM encrypted in SQLite and decrypted in-memory per request; your apps only ever see a single unified `freellmapi-…` bearer token.
- **Admin dashboard & analytics** — React UI to manage keys, reorder the chain, run a playground, and read p50/p95/TTFT analytics over 24h–90d windows; login-gated, dark/light themes, [60 languages](#languages).
- **ChatGPT-ready MCP server & interactive docs** — ChatGPT and other MCP clients can call Free Rotation LLM Provider inference, list usable models, inspect provider health/usage/cache/routing metadata, and manage the routing strategy over `/mcp`; a dependency-free OpenAPI viewer lives at `/v1/docs`. [ChatGPT and coding agents →](docs/en/clients/01-agent-clients.md#mcp-server)
- **Ops niceties** — opt-in response cache, encrypted DB backups, periodic key health checks, bulk key import/export, declarative startup config. [Install & deploy →](docs/en/install/01-install.md)
- **Runs anywhere Node 20+ runs** — Windows, macOS, Linux servers, or a small ARM SBC (Raspberry Pi included). ~40 MB RSS at idle behind PM2 / systemd / whatever supervisor you prefer.

The scope is deliberately narrow — see [what's not supported yet](docs/en/architecture/00-high-level-index.md#not-yet-supported).

## Quick start

**Docker** (recommended):

```bash
git clone https://github.com/lucaterribili/free-rotation-llm.git
cd free-rotation-llm
printf "ENCRYPTION_KEY=%s\nPORT=3001\n" "$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

Keep the generated `.env`: the encryption key is needed to read your stored provider keys.

Open http://localhost:3001, add your provider keys on the **Keys** page, reorder the **Fallback Chain** to taste, and grab your unified API key from the **Keys** page header. That unified key is what you point your OpenAI SDK at.

On Android, see the experimental [Termux guide](docs/en/install/02-android-termux.md).

Everything else — Docker Compose, local development, declarative startup config, production builds, LAN access, and backups — is in **[docs/en/install/01-install.md](docs/en/install/01-install.md)**.

## Desktop app

A native menu-bar app lives in [`desktop/`](./desktop): the entire router + dashboard running locally from your tray, with a glass popover showing live request stats.

![Free Rotation LLM Provider desktop app](repo-assets/desktop.png)

Installers are not published for this fork yet: build the app from source. No account or password to set up: the only credential you need is the unified API key from the tray popover. Build-from-source steps and where your data lives: [docs/en/install/01-install.md#desktop-app](docs/en/install/01-install.md#desktop-app).

## Works with OpenAI-compatible clients

Anything that can target an OpenAI-compatible base URL works: set it to `http://localhost:3001/v1` with the unified key from the dashboard. Every generator supports `--dry-run`; `npx freellmapi launch` (Claude Code) and `launch-codex` (Codex) keep credentials out of config files entirely. The router also doubles as an MCP server your agents can introspect mid-session.

**ChatGPT** connects to the same local router through a private Secure MCP Tunnel. The
`ask_freellmapi` MCP tool routes a ChatGPT-requested task through `/v1/chat/completions` and
returns the answer with served-model, fallback, cache, execution, and token metadata. Base
URL and bearer authentication live in the tunnel-client configuration; the default model is
set with `MCP_INFERENCE_DEFAULT_MODEL` (`auto` when unset). No key belongs in Git or in the
MCP URL. **[ChatGPT setup →](docs/en/clients/01-agent-clients.md#chatgpt-private-secure-mcp-tunnel)**

Provider keys can be managed from the terminal too, with a dashboard session token (`FREELLMAPI_DASHBOARD_TOKEN` or `--token`): `npx freellmapi keys add|list|remove|test <platform>`, where `keys test` re-checks stored keys. See [cli/README.md](cli/README.md#provider-keys).

Free Rotation LLM Provider is local-first and single-user by design. Your provider keys stay in your SQLite database, encrypted at rest, and requests go from your machine to the upstream providers you enabled.

## Languages

The dashboard ships in **60 languages** (the desktop tray menu in 6). The UI
auto-detects your browser/system language on first load and you can switch any
time from **⋯ → Settings**; the choice is remembered. Right-to-left languages
(العربية, עברית, فارسی, اردو) flip the whole layout automatically, and only the
active language's dictionary is loaded — the rest never touch your bandwidth.

<img src="https://flagcdn.com/24x18/us.png" srcset="https://flagcdn.com/48x36/us.png 2x" width="24" height="18" alt="United States" title="United States"> <img src="https://flagcdn.com/24x18/cn.png" srcset="https://flagcdn.com/48x36/cn.png 2x" width="24" height="18" alt="China" title="China"> <img src="https://flagcdn.com/24x18/es.png" srcset="https://flagcdn.com/48x36/es.png 2x" width="24" height="18" alt="Spain" title="Spain"> <img src="https://flagcdn.com/24x18/fr.png" srcset="https://flagcdn.com/48x36/fr.png 2x" width="24" height="18" alt="France" title="France"> <img src="https://flagcdn.com/24x18/br.png" srcset="https://flagcdn.com/48x36/br.png 2x" width="24" height="18" alt="Brazil" title="Brazil"> <img src="https://flagcdn.com/24x18/it.png" srcset="https://flagcdn.com/48x36/it.png 2x" width="24" height="18" alt="Italy" title="Italy"> <img src="https://flagcdn.com/24x18/in.png" srcset="https://flagcdn.com/48x36/in.png 2x" width="24" height="18" alt="India" title="India"> <img src="https://flagcdn.com/24x18/sa.png" srcset="https://flagcdn.com/48x36/sa.png 2x" width="24" height="18" alt="Saudi Arabia" title="Saudi Arabia"> <img src="https://flagcdn.com/24x18/bd.png" srcset="https://flagcdn.com/48x36/bd.png 2x" width="24" height="18" alt="Bangladesh" title="Bangladesh"> <img src="https://flagcdn.com/24x18/ru.png" srcset="https://flagcdn.com/48x36/ru.png 2x" width="24" height="18" alt="Russia" title="Russia"> <img src="https://flagcdn.com/24x18/pk.png" srcset="https://flagcdn.com/48x36/pk.png 2x" width="24" height="18" alt="Pakistan" title="Pakistan"> <img src="https://flagcdn.com/24x18/id.png" srcset="https://flagcdn.com/48x36/id.png 2x" width="24" height="18" alt="Indonesia" title="Indonesia"> <img src="https://flagcdn.com/24x18/de.png" srcset="https://flagcdn.com/48x36/de.png 2x" width="24" height="18" alt="Germany" title="Germany"> <img src="https://flagcdn.com/24x18/jp.png" srcset="https://flagcdn.com/48x36/jp.png 2x" width="24" height="18" alt="Japan" title="Japan"> <img src="https://flagcdn.com/24x18/ke.png" srcset="https://flagcdn.com/48x36/ke.png 2x" width="24" height="18" alt="Kenya" title="Kenya"> <img src="https://flagcdn.com/24x18/tr.png" srcset="https://flagcdn.com/48x36/tr.png 2x" width="24" height="18" alt="Türkiye" title="Türkiye"> <img src="https://flagcdn.com/24x18/vn.png" srcset="https://flagcdn.com/48x36/vn.png 2x" width="24" height="18" alt="Vietnam" title="Vietnam"> <img src="https://flagcdn.com/24x18/kr.png" srcset="https://flagcdn.com/48x36/kr.png 2x" width="24" height="18" alt="South Korea" title="South Korea"> <img src="https://flagcdn.com/24x18/ir.png" srcset="https://flagcdn.com/48x36/ir.png 2x" width="24" height="18" alt="Iran" title="Iran"> <img src="https://flagcdn.com/24x18/th.png" srcset="https://flagcdn.com/48x36/th.png 2x" width="24" height="18" alt="Thailand" title="Thailand"> <img src="https://flagcdn.com/24x18/pl.png" srcset="https://flagcdn.com/48x36/pl.png 2x" width="24" height="18" alt="Poland" title="Poland"> <img src="https://flagcdn.com/24x18/ua.png" srcset="https://flagcdn.com/48x36/ua.png 2x" width="24" height="18" alt="Ukraine" title="Ukraine"> <img src="https://flagcdn.com/24x18/mm.png" srcset="https://flagcdn.com/48x36/mm.png 2x" width="24" height="18" alt="Myanmar" title="Myanmar"> <img src="https://flagcdn.com/24x18/ro.png" srcset="https://flagcdn.com/48x36/ro.png 2x" width="24" height="18" alt="Romania" title="Romania"> <img src="https://flagcdn.com/24x18/nl.png" srcset="https://flagcdn.com/48x36/nl.png 2x" width="24" height="18" alt="Netherlands" title="Netherlands"> <img src="https://flagcdn.com/24x18/my.png" srcset="https://flagcdn.com/48x36/my.png 2x" width="24" height="18" alt="Malaysia" title="Malaysia"> <img src="https://flagcdn.com/24x18/ph.png" srcset="https://flagcdn.com/48x36/ph.png 2x" width="24" height="18" alt="Philippines" title="Philippines"> <img src="https://flagcdn.com/24x18/ng.png" srcset="https://flagcdn.com/48x36/ng.png 2x" width="24" height="18" alt="Nigeria" title="Nigeria"> <img src="https://flagcdn.com/24x18/et.png" srcset="https://flagcdn.com/48x36/et.png 2x" width="24" height="18" alt="Ethiopia" title="Ethiopia"> <img src="https://flagcdn.com/24x18/uz.png" srcset="https://flagcdn.com/48x36/uz.png 2x" width="24" height="18" alt="Uzbekistan" title="Uzbekistan"> <img src="https://flagcdn.com/24x18/az.png" srcset="https://flagcdn.com/48x36/az.png 2x" width="24" height="18" alt="Azerbaijan" title="Azerbaijan"> <img src="https://flagcdn.com/24x18/lk.png" srcset="https://flagcdn.com/48x36/lk.png 2x" width="24" height="18" alt="Sri Lanka" title="Sri Lanka"> <img src="https://flagcdn.com/24x18/np.png" srcset="https://flagcdn.com/48x36/np.png 2x" width="24" height="18" alt="Nepal" title="Nepal"> <img src="https://flagcdn.com/24x18/kh.png" srcset="https://flagcdn.com/48x36/kh.png 2x" width="24" height="18" alt="Cambodia" title="Cambodia"> <img src="https://flagcdn.com/24x18/gr.png" srcset="https://flagcdn.com/48x36/gr.png 2x" width="24" height="18" alt="Greece" title="Greece"> <img src="https://flagcdn.com/24x18/cz.png" srcset="https://flagcdn.com/48x36/cz.png 2x" width="24" height="18" alt="Czechia" title="Czechia"> <img src="https://flagcdn.com/24x18/hu.png" srcset="https://flagcdn.com/48x36/hu.png 2x" width="24" height="18" alt="Hungary" title="Hungary"> <img src="https://flagcdn.com/24x18/se.png" srcset="https://flagcdn.com/48x36/se.png 2x" width="24" height="18" alt="Sweden" title="Sweden"> <img src="https://flagcdn.com/24x18/il.png" srcset="https://flagcdn.com/48x36/il.png 2x" width="24" height="18" alt="Israel" title="Israel"> <img src="https://flagcdn.com/24x18/dk.png" srcset="https://flagcdn.com/48x36/dk.png 2x" width="24" height="18" alt="Denmark" title="Denmark"> <img src="https://flagcdn.com/24x18/fi.png" srcset="https://flagcdn.com/48x36/fi.png 2x" width="24" height="18" alt="Finland" title="Finland"> <img src="https://flagcdn.com/24x18/no.png" srcset="https://flagcdn.com/48x36/no.png 2x" width="24" height="18" alt="Norway" title="Norway"> <img src="https://flagcdn.com/24x18/sk.png" srcset="https://flagcdn.com/48x36/sk.png 2x" width="24" height="18" alt="Slovakia" title="Slovakia"> <img src="https://flagcdn.com/24x18/bg.png" srcset="https://flagcdn.com/48x36/bg.png 2x" width="24" height="18" alt="Bulgaria" title="Bulgaria"> <img src="https://flagcdn.com/24x18/hr.png" srcset="https://flagcdn.com/48x36/hr.png 2x" width="24" height="18" alt="Croatia" title="Croatia"> <img src="https://flagcdn.com/24x18/rs.png" srcset="https://flagcdn.com/48x36/rs.png 2x" width="24" height="18" alt="Serbia" title="Serbia"> <img src="https://flagcdn.com/24x18/lt.png" srcset="https://flagcdn.com/48x36/lt.png 2x" width="24" height="18" alt="Lithuania" title="Lithuania"> <img src="https://flagcdn.com/24x18/tw.png" srcset="https://flagcdn.com/48x36/tw.png 2x" width="24" height="18" alt="Taiwan" title="Taiwan"> <img src="https://flagcdn.com/24x18/pt.png" srcset="https://flagcdn.com/48x36/pt.png 2x" width="24" height="18" alt="Portugal" title="Portugal"> <img src="https://flagcdn.com/24x18/ge.png" srcset="https://flagcdn.com/48x36/ge.png 2x" width="24" height="18" alt="Georgia" title="Georgia">

The full list of locales lives in
[`client/src/i18n/locale-config.ts`](./client/src/i18n/locale-config.ts).

The original six locales are human-reviewed; the newer ones are machine-
translated and improve as native speakers send corrections — a one-string PR is
a great first contribution.

Translations live in [`client/src/i18n/locales/`](./client/src/i18n/locales) as
flat JSON files. To fix a string, edit the value in the locale's JSON file. To
add a language, copy `en.json`, translate the values, and register the locale in
`client/src/i18n/locale-config.ts` (and `desktop/src/i18n.ts` for the tray
strings); `npm test` checks every locale for key/placeholder parity — PRs
welcome.

## Using the API

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="freellmapi-your-unified-key",
)

resp = client.chat.completions.create(
    model="auto",  # let the router pick; or "auto:fast", "auto:smart", a profile, or a model id
    messages=[{"role": "user", "content": "Summarise the fall of Rome in one sentence."}],
)
print(resp.choices[0].message.content)
print("Routed via:", resp.headers.get("x-routed-via"))
```

Streaming, the `auto:*` routing strategies, tool calling, vision input, Gemini Google Search grounding, embeddings, and the Anthropic Messages surface — with curl and Python examples for each — are all in **[docs/en/api/01-rest-api.md](docs/en/api/01-rest-api.md)**. Every response carries an `X-Routed-Via: <platform>/<model>` header so you can see which provider actually served it.

## Screenshots

### Models

Pick a routing strategy and watch the monthly token budget fill across the whole provider fleet. Every model shows live reliability, speed, and intelligence scores — the order below is how requests route right now.

![Models page](repo-assets/models.png)

### Keys

Manage provider credentials and grab the unified API key your apps connect with. Each key shows a status dot and when it was last health-checked.

![Keys page](repo-assets/keys.png)

### Playground

Send a chat completion through the router and see which provider served it, with the model ID and latency printed right on the message. Attach files by button, drag-and-drop, or paste: images (PNG/JPEG/WebP/GIF) are downscaled in the browser and sent as image content parts to a vision-capable model, and text files (TXT/MD/CSV/JSON/LOG) are inlined into the prompt as fenced blocks.

![Playground page](repo-assets/playground.png)

### Analytics

Request volume, success rate, tokens in and out, average latency, and per-provider breakdowns over 24h / 7d / 30d / 90d windows.

![Analytics page](repo-assets/analytics.png)

## How it works

![One request in, the best free model out — the fallback chain with live scores, cooldowns, and quota tracking](repo-assets/router-flow.png)

One request in, the best free model out: the router picks the highest-priority model with a healthy key that's under all its rate limits, decrypts the key in memory, and calls the provider — on a 429/5xx it cools that key down and retries the next model in your chain. The component walkthrough, routing internals, and operational details live in **[docs/en/architecture/00-high-level-index.md](docs/en/architecture/00-high-level-index.md)**.

## FAQ

**Do I need a password?** Not for the desktop app — the dashboard signs itself in with a hidden local account, so there is nothing to set up and nothing to forget. Open it from the tray icon → **Open Dashboard**, or in any browser on the same computer (for example http://127.0.0.1:31415); both sign in on their own. Another device reaching the app over LAN access still sees the sign-in form. Server installs (Docker, one-liner, `npm run dev`) do have an email + password account.

**I forgot the password on a server install.** Click **Forgot password?** on the login page. There is no email to send a link to, so the one-time code is printed to the server log — read it with `docker compose logs -f freellmapi` (or in the terminal running the server, or in the desktop log file), then enter it on the reset form. The code lasts 15 minutes.

**Where are the logs?** In the container log for Docker, in the terminal for a source run, and in `<data dir>/logs/freeapi.log` for the desktop app — reachable from the tray menu's **Open Logs Folder**.

**How do I uninstall?** Remove the app (Trash on macOS, *Settings → Apps* on Windows, `docker compose down -v` for Docker), then delete the data directory: `%APPDATA%\FreeLLMAPI\`, `~/Library/Application Support/FreeLLMAPI/`, or `~/.config/FreeLLMAPI/`. Uninstalling never touches that folder on its own.

Longer answers, per install method: **[docs/en/install/01-install.md#faq-passwords-logs-uninstall](docs/en/install/01-install.md#faq-passwords-logs-uninstall)**.

## Limitations

Stacking free tiers has real trade-offs: no frontier models, variable latency, no SLA — and the effective intelligence of the endpoint dips late in the day as top models hit their daily caps, then resets at UTC midnight. Read the honest list in **[docs/en/architecture/00-high-level-index.md#limitations](docs/en/architecture/00-high-level-index.md#limitations)** before building anything real on this.

## Contributing

Contributors very welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for the dev loop, PR expectations, and the policy on AI/LLM-assisted contributions (short version: welcome, same quality bar as any other PR). Good first PRs:

- **Add a provider** — copy `server/src/providers/openai-compat.ts` as a template, wire it into `server/src/providers/index.ts`, seed its models in `server/src/db/index.ts`, add a test in `server/src/__tests__/providers/`.
- **Add an endpoint** — other OpenAI-compatible surfaces (e.g. `/v1/realtime`). The provider base class can grow new methods; adapters declare which they support.
- **Improve the router** — cost-aware routing (cheapest-healthy-fastest tradeoffs), better latency-weighted priority, regional pinning.
- **Dashboard polish** — charts on the Analytics page, key rotation UX, batch import of keys from `.env`.
- **Docs** — more examples, client library snippets for Go/Rust/etc., a deployment recipe for Docker or Fly.

`npm install && npm run dev` gets you the server on :3001 and the dashboard on :5173, both with HMR. For a repeatable setup, use `./scripts/dev-bootstrap.sh` on Bash or `.\scripts\dev-bootstrap.ps1` on PowerShell; each preserves an existing `.env`. PRs should include a test, keep the existing suite green (`npm test`), and match the `.editorconfig` / tsconfig defaults already in the repo. Database migration workflow and the full contributor loop are in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Disclaimer

**This project is for personal experimentation and learning, not production.** Free tiers exist so developers can prototype against them; they aren't a stable, supported inference substrate and shouldn't be treated as one. If you build something real on top of Free Rotation LLM Provider, swap in a paid API before you ship. Your relationship with each upstream provider is governed by the terms you accepted when you created your account — those terms still apply when the traffic is proxied through this project, and you're responsible for complying with them.

How each provider's ToS views a personal, single-user proxy — reviewed provider by provider in May 2026 — is in [docs/en/architecture/00-high-level-index.md#terms-of-service-review](docs/en/architecture/00-high-level-index.md#terms-of-service-review).

## License

[MIT](./LICENSE)
