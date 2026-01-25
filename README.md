# リアル音声AIエージェントのデモアプリ

## 動かし方

### venvのセットアップ

```bash
python3 -m venv venv
source venv/bin/activate
```

### 依存関係のインストール

```bash
cd workshops/src
pip install -e .
```

### 環境変数の設定

`.env`を作って以下の設定

```bash
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=TRUE
```

### 音声エージェントの立ち上げ

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8080
```