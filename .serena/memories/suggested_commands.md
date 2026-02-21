# Suggested Commands (Updated)
## Setup (Backend)
- `python3 -m venv venv`
- `source venv/bin/activate`
- `pip install -e .`

## Setup (Frontend)
- `cd frontend`
- `bun install`

## Build Frontend
- `cd frontend`
- `bun run build`  # 成果物は `app/static/` に出力

## Run App
- `cd app`
- `cp .env.template .env`  # 初回のみ
- `python -m uvicorn main:app --host 0.0.0.0 --port 8080`

## Run Frontend Tests
- `cd frontend`
- `bun run test`

## Docker (Backend)
- `cd app`
- `docker build -t voice-agent-backend .`
- `source .env`
- `docker run --rm -p 8080:8080 voice-agent-backend \
  -e GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/google/key.json \
  -v /path/to/service-account.json:/var/secrets/google/key.json:ro \
  voice-agent-backend`

## Inspect Repository
- `rg --files`
- `rg "pattern"`
- `git status`
- `git diff`

## Optional Checks (Python)
- `black app`
- `isort app`
- `flake8 app`

## Environment Variables (app/.env)
- `GOOGLE_CLOUD_PROJECT=...`
- `GOOGLE_CLOUD_LOCATION=us-central1`
- `GOOGLE_GENAI_USE_VERTEXAI=TRUE`