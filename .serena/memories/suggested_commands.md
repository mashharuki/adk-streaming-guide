# Suggested Commands (Current)
## Setup
- `python3 -m venv venv`
- `source venv/bin/activate`
- `pip install -e .`

## Run App
- `cd app`
- `cp .env.template .env`  # 初回のみ
- `python -m uvicorn main:app --host 0.0.0.0 --port 8080`

## Inspect Repository
- `rg --files`
- `rg "pattern"`
- `find . -maxdepth 3 -type d | sort`
- `git status`
- `git diff`

## Optional Checks
- Python formatting/lint:
  - `black app`
  - `isort app`
  - `flake8 app`
- Docs sanity check:
  - `rg "TODO|FIXME" docs/workshop_ja.md`
  - `python -m markdown -h`  # 環境にある場合の簡易確認

## Environment Variables (app/.env)
- `GOOGLE_CLOUD_PROJECT=...`
- `GOOGLE_CLOUD_LOCATION=us-central1`
- `GOOGLE_GENAI_USE_VERTEXAI=TRUE`