# Requirements Document

## Introduction

本仕様は、`new_ui_design.pen` で定義されたUI方針に基づき、既存のリアルタイム双方向音声デモ機能を欠落なく引き継いだ React.js + TypeScript + Vite + Tailwind CSS + Shadcn/uiのフロントエンドの要求を定義する。対象は、テキスト・音声・画像入力を伴う会話体験、接続状態の可視化、イベント監視、再接続時の継続利用性を含む。

## Requirements

### Requirement 1: レスポンシブ画面構成と操作導線

**Objective:** As a 利用者, I want 端末幅に応じて最適な画面構成で操作したい, so that デスクトップとスマートフォンの両方で同等の主要操作を実行できる

#### Acceptance Criteria

1. **1.1** When 画面幅がデスクトップ閾値以上である, the React Realtime Voice UI shall サイドバー・会話領域・補助パネルを同時表示する
2. **1.2** When 画面幅がタブレット範囲に入る, the React Realtime Voice UI shall 会話主領域を優先しつつ補助情報を省スペース表示する
3. **1.3** When 画面幅がモバイル閾値以下である, the React Realtime Voice UI shall 単一カラム表示と下部操作導線を提供する
4. **1.4** While 画面レイアウトが切り替わっている, the React Realtime Voice UI shall 主要入力操作（送信・音声開始・画像送信）への到達可能性を維持する
5. **1.5** The React Realtime Voice UI shall 各ブレークポイントで接続状態・会話表示・入力導線を常時視認可能にする

### Requirement 2: セッション接続と状態表示

**Objective:** As a 利用者, I want 接続状態を明確に把握したい, so that 通信可否に応じて適切に操作できる

#### Acceptance Criteria

1. **2.1** When WebSocket 接続が確立される, the React Realtime Voice UI shall 接続済み状態を明示表示する
2. **2.2** When 接続が切断される, the React Realtime Voice UI shall 切断状態と再接続予定を表示する
3. **2.3** While 再接続待機中である, the React Realtime Voice UI shall 再接続中状態を継続表示する
4. **2.4** If 接続エラーが発生する, the React Realtime Voice UI shall エラー状態を利用者が識別できる形式で提示する
5. **2.5** The React Realtime Voice UI shall 接続状態表示を画面サイズに依存せず一貫した意味で提供する

### Requirement 3: テキスト会話フロー

**Objective:** As a 利用者, I want テキストで会話を送受信したい, so that 音声を使わない状況でもエージェントと対話できる

#### Acceptance Criteria

1. **3.1** When 利用者が有効なテキストを送信する, the React Realtime Voice UI shall 送信内容をユーザー発話として会話履歴へ反映する
2. **3.2** When エージェントのテキスト応答イベントが到着する, the React Realtime Voice UI shall 応答を会話履歴へ逐次反映する
3. **3.3** While 応答が未完了である, the React Realtime Voice UI shall 部分応答であることを識別可能に表示する
4. **3.4** When turn complete イベントを受信する, the React Realtime Voice UI shall 当該ターンの部分表示状態を完了状態へ確定する
5. **3.5** The React Realtime Voice UI shall 新規メッセージ到着時に最新会話が確認できる位置へ表示を追従させる

### Requirement 4: 音声入出力フロー

**Objective:** As a 利用者, I want 音声で会話を送受信したい, so that ハンズフリーまたは高速に対話できる

#### Acceptance Criteria

1. **4.1** When 利用者が音声開始操作を行う, the React Realtime Voice UI shall 音声入力有効状態を表示する
2. **4.2** While 音声入力有効状態である, the React Realtime Voice UI shall 取得した音声チャンクを送信対象として扱う
3. **4.3** When 音声応答イベントを受信する, the React Realtime Voice UI shall 再生可能な音声出力として処理する
4. **4.4** If interrupted イベントを受信する, the React Realtime Voice UI shall 進行中の音声出力を停止し中断状態を表示する
5. **4.5** The React Realtime Voice UI shall 音声関連イベントを通常会話表示とは区別可能な運用表示へ反映できる

### Requirement 5: 画像入力とカメラモーダル

**Objective:** As a 利用者, I want カメラ画像を会話に送信したい, so that 視覚情報を含むマルチモーダル対話を行える

#### Acceptance Criteria

1. **5.1** When 利用者がカメラ操作を開始する, the React Realtime Voice UI shall カメラプレビュー用モーダルを表示する
2. **5.2** While カメラプレビューが表示中である, the React Realtime Voice UI shall 画像送信とキャンセルの両操作を提供する
3. **5.3** When 利用者が画像送信を確定する, the React Realtime Voice UI shall 撮影画像を会話履歴へ反映し送信要求として扱う
4. **5.4** If カメラ利用が拒否または失敗する, the React Realtime Voice UI shall 失敗理由を利用者が認識できる形で通知する
5. **5.5** The React Realtime Voice UI shall モーダル終了時にカメラ利用状態を適切に解除する

### Requirement 6: Event Console と運用可観測性

**Objective:** As a 運用者, I want 上下流イベントを追跡したい, so that セッション挙動と異常を迅速に把握できる

#### Acceptance Criteria

1. **6.1** When 上流または下流イベントが発生する, the React Realtime Voice UI shall 時刻付きでイベントログへ記録する
2. **6.2** When イベントに詳細データが存在する, the React Realtime Voice UI shall 展開表示により詳細内容を確認可能にする
3. **6.3** Where 音声イベント表示機能が有効である, the React Realtime Voice UI shall 音声イベントをログ表示に含める
4. **6.4** When 音声イベント表示機能が無効である, the React Realtime Voice UI shall 音声イベントをログ表示から除外する
5. **6.5** When 利用者がログ消去操作を行う, the React Realtime Voice UI shall イベント表示を初期化する

### Requirement 7: RunConfig 契約とオプション制御

**Objective:** As a 利用者, I want 会話オプションをUIから切り替えたい, so that 対話スタイルを利用状況に合わせて調整できる

#### Acceptance Criteria

1. **7.1** The React Realtime Voice UI shall Proactivity と Affective Dialog の状態を切替可能な設定項目として提供する
2. **7.2** When 利用者が設定値を変更する, the React Realtime Voice UI shall バックエンドの RunConfig 契約に適合する形式で設定値を送信して再接続フローを開始する
3. **7.3** While 再接続フロー中である, the React Realtime Voice UI shall 設定変更反映中であることを表示する
4. **7.4** When 再接続が完了する, the React Realtime Voice UI shall 有効化された実際の設定状態を利用者が確認可能な形で表示する
5. **7.5** If バックエンドが指定オプションを受理できない, the React Realtime Voice UI shall 非対応または失敗を識別可能に通知し安全な既定動作へフォールバックする
6. **7.6** The React Realtime Voice UI shall バックエンド実装差異がある環境でも設定機能が会話継続性を阻害しないように動作する

### Requirement 8: システム通知とエラー回復

**Objective:** As a 利用者, I want システムメッセージと異常状態を理解したい, so that 失敗時にも次の行動を判断できる

#### Acceptance Criteria

1. **8.1** When 接続開始・再接続・切断などのライフサイクルイベントが発生する, the React Realtime Voice UI shall システムメッセージとして通知する
2. **8.2** If WebSocket エラーが発生する, the React Realtime Voice UI shall エラー内容を運用ログに記録し利用者へ通知する
3. **8.3** When interrupted イベントが発生する, the React Realtime Voice UI shall 該当ターンを中断済みとして明示する
4. **8.4** While 回復可能なエラー状態である, the React Realtime Voice UI shall 自動回復試行中であることを表示する
5. **8.5** The React Realtime Voice UI shall システム通知と通常会話メッセージを視覚的に区別可能にする
