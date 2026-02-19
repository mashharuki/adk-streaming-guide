# リアル音声AIエージェントのデモアプリ

## 動かし方

### venvのセットアップ

```bash
python3 -m venv venv
source venv/bin/activate
```

### 依存関係のインストール

```bash
pip install -e .
```

### 環境変数の設定

`.env`を作って以下の設定

```bash
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=TRUE
```

### フロントエンドアプリケーションのビルド

```bash
cd frontend 
bun run build
```

### 音声エージェントの立ち上げ(バックエンド)

```bash
cd app
python -m uvicorn main:app --host 0.0.0.0 --port 8080
```

### PWA の確認

- `http://localhost:8080/` でアクセス
- ブラウザ DevTools の Application タブで以下を確認
  - `Manifest` が読める
  - `Service Workers` に `/service-worker.js` が登録される
  - オフライン時もシェルが表示される

## 参考文献
- [GitHub -adk-samples](https://github.com/google/adk-samples/tree/main)
