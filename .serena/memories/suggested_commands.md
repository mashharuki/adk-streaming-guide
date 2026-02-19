# Suggested Commands
## Environment setup
- `python3 -m venv venv`
- `source venv/bin/activate`
- `pip install -e .`

## Run app
- `cd app`
- `python -m uvicorn main:app --host 0.0.0.0 --port 8080`

## Useful repository inspection commands (Darwin/macOS)
- `ls`, `cd`, `pwd`
- `rg --files`, `rg "pattern"`
- `find . -type f`
- `cat`, `sed -n 'start,endp' <file>`
- `git status`, `git diff`, `git log --oneline`

## Optional quality commands (from CLAUDE guidance, if tools installed)
- Code formatting/lint (for Python under demo app):
  - `black .`
  - `isort .`
  - `flake8 .`
- Docs checks (when docs workflow is used):
  - `.claude/skills/docs-lint/check-links.sh docs/part*.md`
  - `python3 .claude/skills/docs-lint/check-source-refs.py --docs docs/ --adk-python-repo ../adk-python --adk-samples-repo ../adk-samples --new-version HEAD`