# Structure Steering

## Repository Organization Pattern
The project is organized by runtime boundary:
- `app/`: executable application (backend entrypoint + agent + static frontend)
- `docs/`: workshop and design artifacts
- root configs: packaging and contributor guidance

## Application Structure Pattern
- `app/main.py`: composition root for FastAPI routes, ADK runner/session wiring, websocket streaming loop
- `app/my_agent/`: isolated agent definition package
- `app/static/`: UI shell and browser-side realtime clients
  - `js/app.js`: websocket/session orchestration and UI event handling
  - `js/audio-*.js`, `js/pcm-*.js`: audio capture/playback pipeline

## Responsibility Boundaries
- Backend owns ADK session lifecycle and modality routing.
- Frontend owns interaction controls, rendering, and media device handling.
- Agent package owns model/tool instruction configuration.

## Naming and Flow Patterns
- User/session identity is path-based in websocket route.
- Upstream and downstream logic are treated as separate concurrent flows.
- Static assets are served under `/static`, while `/` returns the app shell.

## Documentation Scope Pattern
- Keep steering focused on stable design patterns and decision rules.
- Avoid cataloging every file; add details only when new architectural patterns emerge.
