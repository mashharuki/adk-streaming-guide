# Project Overview
- Name: `voice-sample-agent` (from `pyproject.toml`)
- Purpose: Real-time bidirectional streaming AI voice agent demo using Google ADK + FastAPI WebSocket. Includes multimodal input (text/audio/image) and audio output transcription.
- Primary language: Python (>=3.10).
- Key dependencies: `google-adk`, `fastapi`, `uvicorn`, `python-dotenv`, `websockets`.

## Rough Structure
- `app/main.py`: FastAPI app, static hosting, WebSocket endpoint, upstream/downstream tasks, ADK `Runner` integration.
- `app/my_agent/agent.py`: ADK `Agent` definition and model/tool configuration.
- `app/static/`: frontend HTML/CSS/JS and audio processors.
- `docs/workshop_ja.md`: workshop documentation in Japanese.
- `README.md`: quickstart for local run.
- `CLAUDE.md`: repository-wide operational guidance (docs-heavy workflow + ADK context).