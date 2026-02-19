# Gap Analysis: react-realtime-voice-ui

## 前提と注意
- `spec.json` 上、要件は `generated: true` だが `approved: false`。
- 本分析は要件修正の入力としても利用可能なため、承認前でも実施。

## 1. Current State Investigation

### 既存実装の中核
- フロントエンドは静的配信 (`app/static/index.html`, `app/static/css/style.css`, `app/static/js/*.js`)。
- UI制御は `app/static/js/app.js` 単一大型ファイル（989行）に集中。
- バックエンドは `app/main.py` のWebSocketエンドポイントで BIDI ストリーミングを実行。
- 音声は AudioWorklet (`audio-recorder.js`, `audio-player.js`, `pcm-*.js`) で入出力。

### 既存パターン/制約
- 画面: 現行は vanilla HTML/CSS + 1段階モバイルレスポンシブ（`@media (max-width: 768px)`）。
- ログ: Event Console の詳細展開、音声フィルタ、クリア操作を既に実装。
- 接続: 5秒自動再接続あり。
- 制約: React/TypeScript/Vite/Tailwind/shadcn の基盤は未存在（`package.json`, `tsconfig`, `vite.config` なし）。

## 2. Requirement-to-Asset Map

| Requirement | 既存資産 | 判定 |
|---|---|---|
| 1 レスポンシブ画面構成 | `style.css` の単一ブレークポイントのみ | **Missing**（3段階設計未実装） |
| 2 接続状態表示 | `updateConnectionStatus`, ステータス表示要素 | **Partial** |
| 3 テキスト会話 | `sendMessage`, message bubble更新 | **Covered** |
| 4 音声入出力 | `startAudio*`, AudioWorklet, interrupted処理 | **Covered** |
| 5 画像入力/カメラモーダル | `cameraModal`, `captureImageFromPreview` | **Covered** |
| 6 Event Console | `addConsoleEntry`, show audio, clear, expand | **Covered** |
| 7 RunConfig切替 | フロントでquery付与のみ、`main.py` で未反映 | **Constraint**（バックエンド契約不足） |
| 8 通知と回復 | system message, error log, reconnect | **Covered** |

### 明確なギャップ
- **Missing**: React+TS+Vite+Tailwind+shadcn 基盤そのもの。
- **Constraint**: `proactivity` / `affective_dialog` はフロントで送るが、`app/main.py` はクエリを受けて `RunConfig` を変更していない。
- **Unknown**: ADK現行版での該当オプションの正式な設定先（`RunConfig` 直接 or 他構造）。

## 3. Implementation Approach Options

### Option A: 既存静的UIを段階的にReactへ移行（Extend）
- 方式: `app/static` を起点に、機能単位でReactコンポーネントへ置換。
- 利点: 既存挙動を保持しながら差分検証しやすい。
- 欠点: 旧DOM操作とReact状態管理の混在期間が発生し複雑化。

### Option B: Reactアプリを新規構築し、現行機能を再実装（New）
- 方式: 新しいフロントエンドディレクトリを作成し、既存JSは参照実装として扱う。
- 利点: 責務分離・型安全・UI設計反映が最も綺麗。
- 欠点: 初期コスト高、既存機能の取りこぼしリスク。

### Option C: Hybrid（推奨候補）
- 方式: 先に通信/音声/カメラを「契約アダプタ層」として抽出し、UIのみReactで新規実装。
- 利点: 既存コアロジック再利用 + 新UI実装速度のバランスが良い。
- 欠点: アダプタ層の設計品質が悪いと中途半端に複雑化。

## 4. Complexity & Risk
- Effort: **L (1–2 weeks)**
  - 理由: UI全面刷新 + 音声/カメラ/WSのリアルタイム統合 + PWA考慮。
- Risk: **Medium-High**
  - 理由: ブラウザ音声制約、再接続時状態同期、RunConfig契約不整合。

## 5. Research Needed (Design Phase)
1. ADKで `proactivity` / `affective_dialog` を正しく反映するサーバー側契約。
2. Vite環境でのAudioWorklet配布・読み込み方式（相対URL/ビルド後パス）。
3. PWA（service worker）導入時のWebSocket再接続UX方針。
4. モバイル権限拒否時（mic/camera）の共通エラーハンドリングUX。

## 6. Design Phaseへの推奨
- 第一候補: **Option C (Hybrid)**。
- 先行決定すべき事項:
  - フロントエンド新規基盤（React+TS+Vite+Tailwind+shadcn）
  - 通信/音声/カメラのアダプタ境界
  - RunConfig切替のバックエンド契約修正方針
