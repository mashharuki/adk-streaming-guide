# Dev Container Configuration

このディレクトリには、ADK Streaming Guideリポジトリ用のVisual Studio Code Dev Container設定が含まれています。

## 機能

このDev Containerには以下が含まれています:

- **Python 3.11**: ADKとFastAPIアプリケーション開発用
- **Google Cloud SDK (gcloud CLI)**: Google Cloud Platformとの連携用
- **MkDocs**: ドキュメントのビルドとプレビュー用
- **コード品質ツール**: black、isort、flake8
- **VS Code拡張機能**: Python開発、Markdown編集、Google Cloud Tools

## ポート転送

- **8080**: FastAPIアプリケーション（workshop/demo）
- **8000**: MkDocsドキュメントサーバー

## 使い方

### Dev Containerを開く

1. このリポジトリをVS Codeで開く
2. コマンドパレット（`Cmd+Shift+P` / `Ctrl+Shift+P`）を開く
3. "Dev Containers: Reopen in Container"を選択
4. コンテナのビルドと初期化を待つ（初回は数分かかります）

### gcloud認証

Dev Container起動後、Google Cloudサービスを使用する場合は認証が必要です:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

または、ローカルのgcloud設定をマウントする場合（既にdevcontainer.jsonに設定済み）:

```bash
# ローカルの ~/.config/gcloud がコンテナにマウントされます
gcloud config list
```

### よく使うコマンド

#### MkDocsサーバーを起動

```bash
mkdocs serve
# http://localhost:8000 でアクセス可能
```

#### Workshopアプリを起動

```bash
cd workshops/src
uvicorn app.main:app --reload --port 8080
# http://localhost:8080 でアクセス可能
```

#### コードのlint

```bash
# すべてのPythonコードをフォーマット
black .
isort .
flake8 .

# または、code-lint skillを使用
# "use code-lint skill" in Claude Code
```

#### ドキュメントのlint

```bash
# リンクチェック
.claude/skills/docs-lint/check-links.sh docs/part*.md

# または、docs-lint skillを使用
# "use docs-lint skill" in Claude Code
```

## カスタマイズ

### Python バージョンを変更

`devcontainer.json`の`image`を変更:

```json
"image": "mcr.microsoft.com/devcontainers/python:3.12"
```

### 追加のツールをインストール

`post-create.sh`に追加のインストールコマンドを記述してください。

## トラブルシューティング

### コンテナのリビルド

設定を変更した後は、コンテナをリビルドする必要があります:

1. コマンドパレット: "Dev Containers: Rebuild Container"
2. または: "Dev Containers: Rebuild Without Cache" (完全なクリーンビルド)

### ポートが使用中

ローカルで既に8080や8000ポートを使用している場合は、`devcontainer.json`の`forwardPorts`を変更してください。
