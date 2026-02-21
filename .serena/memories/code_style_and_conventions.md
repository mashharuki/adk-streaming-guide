# Code Style and Conventions (Updated)
## Python / FastAPI
- 非同期中心 (`async def`, `asyncio.gather`) で upstream/downstream を明確に分離する。
- ADK BIDI の責務分離を維持する:
  - 受信: WebSocket message → ADK input (`send_content` / `send_realtime`)
  - 送信: `run_live()` event → WebSocket text
  - 終了: `finally` で queue close
- `RunConfig` の設定（modalities/transcription）は接続時にまとめて定義。
- セッション管理は `InMemorySessionService` を使用。永続化が必要な変更時は影響範囲を明示する。

## Agent Definition
- `app/my_agent/agent.py` にモデル名、instructions、tools を集約。
- モデル変更時は音声入出力（native audio対応）との整合性を確認する。

## Frontend (React + Vite)
- `frontend/` は React + TypeScript の関数コンポーネント中心。
- Vite build の出力先は `app/static/`（`vite.config.ts` の `outDir`）。
- `base` は build 時に `/static/` を前提としているため、静的配信パスを崩さない。
- WebSocket message schema は `app/main.py` と常に同期させる。

## PWA
- `manifest.webmanifest` と `service-worker.js` を `app/main.py` で明示的に提供。
- PWA 関連のパスや headers を変更する場合は、フロントとバックの両方を合わせて更新する。

## Documentation
- 実運用中の主要ドキュメントは `docs/workshop_ja.md`。
- 既存の `CLAUDE.md` には広い文脈の記述があるため、作業時は現行ツリーと齟齬がないか確認して進める。