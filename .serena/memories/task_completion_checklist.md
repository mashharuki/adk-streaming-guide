# Task Completion Checklist
- Run relevant checks for changed scope:
  - App code changes: run formatter/linter if available (`black`, `isort`, `flake8`).
  - Docs changes: run docs/link validation commands if applicable.
- Verify runtime path for app changes:
  - `pip install -e .`
  - `cd app && python -m uvicorn main:app --host 0.0.0.0 --port 8080`
- Confirm no sensitive data committed (`app/.env` handling).
- Review `git diff` and ensure commit message follows Conventional Commits.
- Prefer preserving bidi-streaming lifecycle integrity (upstream/downstream separation + cleanup in `finally`).