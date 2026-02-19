# Code Style and Conventions
## Python code
- Async-first style with FastAPI + WebSocket handlers.
- Clear lifecycle split for bidi streaming:
  - app/session init
  - upstream task (client -> ADK queue)
  - downstream task (ADK events -> client)
  - cleanup in `finally` (`live_request_queue.close()`).
- Use module-level constants for app configuration (e.g., `APP_NAME`).
- Keep functions focused (`upstream_task`, `downstream_task`) and type annotate key interfaces.

## Documentation / workflow conventions
- `CLAUDE.md` is the main operational guide in this repo.
- Conventional Commits are expected (`feat:`, `fix:`, `docs:`, etc.).
- Repository guidance indicates docs-heavy workflows; some references (e.g., `STYLES.md`, multi-part docs) may reflect broader/adjacent setup and should be validated against current tree before acting.