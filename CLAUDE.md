# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains a real-time, bidirectional streaming AI voice demo built with Google ADK, plus Japanese workshop documentation that explains the architecture and implementation.

## Current Project Structure

```text
adk-streaming-guide/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── pyproject.toml
├── app/
│   ├── .env.template
│   ├── .env
│   ├── main.py                    # FastAPI app + WebSocket BIDI streaming endpoint
│   ├── my_agent/
│   │   ├── __init__.py
│   │   └── agent.py               # ADK Agent definition (model/tools/instruction)
│   └── static/
│       ├── index.html
│       ├── css/style.css
│       └── js/*.js                # UI, recorder/player, audio processors
├── docs/
│   ├── workshop_ja.md             # Main workshop document (Japanese)
│   └── new_ui_design.pen
└── .github/workflows/
    ├── adk-version-monitor.yml
    └── claude-code-reviewer.yml
```

## Runtime Architecture (app/main.py)

The app implements ADK bidirectional streaming with a 4-phase lifecycle:

1. Application initialization (startup)
- Create `InMemorySessionService`
- Create `Runner`

2. Session initialization (per WebSocket)
- Accept WebSocket (`/ws/{user_id}/{session_id}`)
- Create `RunConfig(streaming_mode=BIDI, response_modalities=["AUDIO"])`
- Get or create session
- Create `LiveRequestQueue`

3. Active bidi streaming
- `upstream_task`: Receive WebSocket input and forward to ADK
  - text JSON -> `send_content`
  - image JSON (base64) -> `send_realtime` with `types.Blob`
  - audio bytes -> `send_realtime` with PCM blob
- `downstream_task`: Iterate `runner.run_live(...)` events and send JSON to client

4. Termination
- Handle disconnect/runtime errors
- Always `live_request_queue.close()` in `finally`

When editing `app/main.py`, preserve this separation and cleanup pattern.

## Agent Definition (app/my_agent/agent.py)

- `Agent` is defined in one place with:
  - model: `gemini-live-2.5-flash-native-audio`
  - instruction: concise assistant behavior
  - tools: `google_search`

If you change model/tools, verify compatibility with audio-first streaming behavior.

## Local Development

1. Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -e .
```

2. Environment variables (`app/.env`)

```bash
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=TRUE
```

3. Run

```bash
cd app
python -m uvicorn main:app --host 0.0.0.0 --port 8080
```

## Coding and Change Guidelines

### Python / FastAPI

- Prefer async-first implementation.
- Keep upstream/downstream logic explicitly separated.
- Preserve `try/except/finally` flow around WebSocket lifecycle.
- Do not remove queue close handling in `finally`.

### Frontend Integration

- Keep WebSocket message schema aligned between `app/static/js/*` and `app/main.py`.
- Preserve handling for all three modalities: text, image, and audio.

### Documentation

- Main document in this repository is `docs/workshop_ja.md`.
- If behavior changes, update `README.md` and `docs/workshop_ja.md` in the same change where appropriate.

### Sensitive Data

- Never commit secrets.
- Treat `app/.env` as local-only runtime configuration.

## Useful Commands

- List files: `rg --files`
- Search text: `rg "pattern"`
- Check changes: `git status && git diff`
- Optional formatting/lint for Python code:

```bash
black app
isort app
flake8 app
```

## Commit Convention

Use Conventional Commits:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation change
- `refactor:` code restructuring without behavior change
- `chore:` maintenance/tooling/config
- `test:` test updates
- `ci:` CI workflow changes

In this repository, many changes will be `docs:` or small `fix:` updates.
