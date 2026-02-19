# Tech Steering

## Stack Decisions
- Backend: Python + FastAPI
- Streaming runtime: Google ADK (`Runner`, `LiveRequestQueue`, `RunConfig` with `StreamingMode.BIDI`)
- Session service: `InMemorySessionService`
- Frontend: server-rendered static assets (`app/static`) with browser WebSocket + Web Audio Worklets

## Integration Pattern
- Keep ADK orchestration in `app/main.py` with explicit upstream/downstream task split.
- Use WebSocket as the single transport for all realtime interaction types.
- Send audio upstream as binary PCM frames (not base64 JSON) for efficiency.

## Coding Conventions
- Async-first flow for server streaming (`asyncio.gather` + task separation).
- Always close live request queue in `finally` during session teardown.
- Keep model/tool declaration centralized in `app/my_agent/agent.py`.
- Frontend JS is function-oriented and event-driven; behavior is split by concern (app, recorder, player, processors).

## Runtime Expectations
- Python >= 3.10
- Environment configured via `app/.env`
- Native audio model usage is assumed in current defaults (`gemini-live-2.5-flash-native-audio`).

## Change Guardrails
- Preserve websocket message contract (`type: text|image` + binary audio path).
- Preserve ADK streaming lifecycle order: init -> session setup -> bidi loop -> cleanup.
- If transport, audio format, or session backend changes, update steering and docs together.
