# Research & Design Decisions

## Summary

- **Feature**: `react-realtime-voice-ui`
- **Discovery Scope**: Complex Integration（既存vanillaフロントの全面React移行 + リアルタイム音声/画像 + PWA導入）
- **Key Findings**:
  - 現行機能の中核は `app/static/js/app.js` に集約されており、UI再実装時は通信・音声・カメラ契約の分離が必須。
  - RunConfig系（proactivity / affective_dialog）はフロント送信は存在するが、サーバー反映契約が未実装で機能ギャップ。
  - Vite + Tailwind v4 + shadcn/ui は公式導入手順が明確で、React+TS基盤を短期間で標準化可能。

## Research Log

### 現行コードベースの拡張可能性

- **Context**: 要件が「既存機能を欠落なくReactへ移行」であるため、再利用可能資産を特定する必要があった。
- **Sources Consulted**:
  - `app/static/js/app.js`
  - `app/static/css/style.css`
  - `app/main.py`
- **Findings**:
  - テキスト/音声/画像/イベントコンソール/再接続は既存で機能的に成立している。
  - 1ファイル集中のため責務分割が弱く、UI刷新時に状態境界の再定義が必要。
  - サーバー `RunConfig` は固定生成で、クエリパラメータによる反映がない。
- **Implications**:
  - UI層だけを先に再実装するのではなく、通信アダプタ層の抽出を先行すべき。
  - 設計で「フロント契約」「バックエンド契約」「表示状態」を明示分離する。

### React/Vite の基盤妥当性

- **Context**: 要件に React.js 前提があり、最新の標準導入経路を確認する必要がある。
- **Sources Consulted**:
  - React Blog: https://react.dev/blog
  - Vite Guide: https://vite.dev/guide/
- **Findings**:
  - React公式ブログ上で v19 系継続更新（v19.2系）を確認。
  - Vite は `react-ts` テンプレートを正式サポートし、現代ブラウザ向け高速開発体験を提供。
- **Implications**:
  - React 19.x + Vite + TypeScript を設計上の基準スタックにできる。
  - 型境界（no any）を初期設計から強制する前提が妥当。

### Tailwind v4 + shadcn/ui 導入実現性

- **Context**: 要件に Tailwind と shadcn/ui が含まれており、Viteとの組み合わせ互換が必要。
- **Sources Consulted**:
  - shadcn/ui Vite導入: https://ui.shadcn.com/docs/installation/vite
  - shadcn/ui Installation: https://ui.shadcn.com/docs/installation
  - Tailwind docs（Viteプラグイン系記述）: https://tailwindcss.com/docs/installation/framework-guides/laravel/vite
- **Findings**:
  - shadcn/ui は Vite + Tailwind v4 前提導入手順を公式提供。
  - パスエイリアス（`@/*`）設定が設計上の標準構成に組み込まれている。
- **Implications**:
  - コンポーネント層を `components/ui`（shadcn）と `features/*`（業務）で分離する設計が適合。
  - デザインシステムの変数化・再利用を初期段階で定義可能。

### PWA とブラウザAPI制約

- **Context**: スマホ操作とPWA運用要件により、Service Worker/Install/Audio APIの制約確認が必要。
- **Sources Consulted**:
  - Service Worker API: https://developer.mozilla.org/docs/Web/API/Service_Worker_API
  - ServiceWorkerContainer: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer
  - beforeinstallprompt: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event
  - AudioWorklet: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet
- **Findings**:
  - Service Worker と AudioWorklet はいずれも secure context 要件が強い。
  - `beforeinstallprompt` は non-standard/limited availability でフォールバック設計が必要。
- **Implications**:
  - 設計では「PWA installは可能時のみ表示」「非対応時は通常Web継続」を明示。
  - 音声機能は HTTPS/localhost 前提を明文化し、失敗時UXを必須化する。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
| --- | --- | --- | --- | --- |
| A: 既存JS拡張 | `app.js` を段階修正しReactを部分導入 | 初速が速い | 責務混在が進み保守性低下 | 一時的な移行案としてのみ有効 |
| B: 全面新規構築 | React側で通信も含め再実装 | 境界が明確、型安全最大化 | 既存挙動の取りこぼしリスク | 検証コスト高 |
| C: Hybrid Adapter | 通信/音声/カメラ契約を抽出しUIをReact新規化 | 既存知見を活かしつつ再設計可能 | アダプタ設計品質に依存 | 本機能の推奨案 |

## Design Decisions

### Decision: Hybrid Adapter を採用し段階移行する

- **Context**: 機能欠落リスクを抑えつつ React 設計へ移行したい。
- **Alternatives Considered**:
  1. 既存JS拡張
  2. 完全新規再実装
- **Selected Approach**: 通信/メディア契約をアダプタとして定義し、UIコンポーネントはReactで新規実装する。
- **Rationale**: 既存動作の再利用性と設計の将来保守性を両立できる。
- **Trade-offs**: 初期に境界設計コストが増えるが、以後の機能追加は安定する。
- **Follow-up**: アダプタI/Fの型定義、イベント正規化、契約テストを先行で設計する。

### Decision: RunConfig 契約を明示し、反映確認を要件化する

- **Context**: `proactivity` / `affective_dialog` が現行サーバーで反映されないギャップがある。
- **Alternatives Considered**:
  1. フロントのみで表示制御
  2. バックエンド契約を拡張
- **Selected Approach**: バックエンド反映の成否をUIに返せる契約を設計対象とする。
- **Rationale**: ユーザーが設定効果を確認できない状態を防ぐため。
- **Trade-offs**: バックエンド変更と互換性管理が必要になる。
- **Follow-up**: 設計で「受理/非対応/失敗」の状態遷移を定義する。

### Decision: PWA はオフラインシェル中心で、リアルタイム通信は再接続前提

- **Context**: WebSocket会話は本質的にオンライン依存。
- **Alternatives Considered**:
  1. 完全オフライン会話を目指す
  2. オフライン時はUIシェル維持のみ
- **Selected Approach**: オフラインで静的UIと既存履歴閲覧を維持し、会話送受信は再接続後に復帰。
- **Rationale**: 要件実現性と複雑性のバランスが良い。
- **Trade-offs**: オフライン中の送信遅延キュー仕様は限定的にする必要がある。
- **Follow-up**: 再接続時の未送信メッセージ扱いを設計で明示する。

## Risks & Mitigations

- 音声権限拒否やsecure context不足で機能停止するリスク — 権限状態表示とフォールバック導線を標準化。
- RunConfig反映結果が曖昧なリスク — 反映確認イベント/レスポンスを設計で明確化。
- 大規模UI刷新で既存挙動が劣化するリスク — 機能同等性チェックリストと段階的移行を採用。

## References

- [React Blog](https://react.dev/blog) — React 19系の継続更新確認
- [Vite Guide](https://vite.dev/guide/) — React+TSテンプレート、ブラウザサポート指針
- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation) — 公式導入フロー
- [shadcn/ui for Vite](https://ui.shadcn.com/docs/installation/vite) — Vite固有設定
- [MDN AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) — 低遅延音声処理とsecure context制約
- [MDN Service Worker API](https://developer.mozilla.org/docs/Web/API/Service_Worker_API) — オフラインキャッシュとライフサイクル
- [MDN beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event) — PWAインストール促進イベントの制約
