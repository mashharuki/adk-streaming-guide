# Code Style and Conventions (Current)
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

## Frontend Assets
- `app/static/js/` は機能別分割（録音、再生、processor、app本体）。
- WebSocket message schema（`type: text|image` と binary audio）をサーバー側実装と同期させる。

## Documentation
- 実運用中の主要ドキュメントは `docs/workshop_ja.md`。
- 既存の `CLAUDE.md` には広い文脈の記述があるため、作業時は現行ツリーと齟齬がないか確認して進める。