# Project Overview (Updated)
- Repository: `adk-streaming-guide`
- Package name: `voice-sample-agent` (`pyproject.toml`)
- Purpose: Google ADK を使ったリアルタイム双方向ストリーミング（音声/テキスト/画像）デモと、日本語ワークショップ資料の管理。
- Primary stack: Python 3.10+, FastAPI, WebSocket, Google ADK (`Runner`, `RunConfig`, `LiveRequestQueue`), Gemini Live model, React + Vite + Tailwind.

## Current Structure
- `app/main.py`: FastAPI アプリ本体。`/` で `static/index.html` を返し、`/ws/{user_id}/{session_id}` で BIDI ストリーミングを処理。PWA 用の `manifest.webmanifest` と `service-worker.js` も提供。
- `app/my_agent/agent.py`: `Agent` 定義（モデル/ツール/インストラクションを集約）。
- `app/static/`: フロントエンドのビルド成果物と PWA アセット（`index.html`, `assets/*`, `manifest.webmanifest`, `service-worker.js`）。
- `frontend/`: React + Vite の UI 実装とテスト（`src`, `__tests__`, `vite.config.ts`）。
- `app/.env.template`: 環境変数テンプレート。
- `docs/workshop_ja.md`: 日本語ワークショップ本体ドキュメント。
- `.github/workflows/`: `adk-version-monitor.yml`, `claude-code-reviewer.yml`。

## Streaming Lifecycle (Implemented)
- App init: `InMemorySessionService` と `Runner` をプロセス起動時に作成。
- Session init: WebSocket接続ごとに `RunConfig(BIDI)` と `LiveRequestQueue` を作成し、セッション取得/作成。
- Upstream: WebSocketから text / image(base64) / audio(bytes) を受信して ADK に送信。
- Downstream: `runner.run_live()` の `Event` を JSON 化して WebSocket に送信。
- Cleanup: 切断時に `live_request_queue.close()` を呼んで終了処理。