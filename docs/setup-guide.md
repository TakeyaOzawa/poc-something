# Amazon Q DevContainer セットアップガイド

## 概要

Amazon Q CLIをDocker Compose + DevContainer環境で実行するための詳細セットアップガイドです。

## 前提条件

- Docker Desktop
- VSCode + Dev Containers拡張機能
- 会社のAWS SSOスタートURL

## ディレクトリ構造

```
q/
├── .devcontainer/
│   └── devcontainer.json         # DevContainer設定
├── .github/workflows/
│   └── ci.yml                    # CI/CD設定
├── .vscode/                      # VSCode設定
├── amazonq/                      # Amazon Q設定保存
├── docs/                         # ドキュメント
├── scripts/                      # セットアップスクリプト
│   ├── auth-amazon-q.sh          # 認証スクリプト
│   ├── check-auth.sh             # 認証確認
│   ├── entrypoint.sh             # コンテナエントリーポイント
│   └── install-aws-tools.sh      # AWS CLI インストール
├── docker-compose.yml            # Docker Compose設定
├── Dockerfile                    # コンテナイメージ定義
├── .env.example                  # 環境変数テンプレート
├── build.sh                      # ビルドスクリプト
├── deploy.sh                     # デプロイスクリプト
├── manage.sh                     # 管理スクリプト
└── cleanup.sh                    # クリーンアップスクリプト
```

## セットアップ手順

### 1. 環境変数設定

`.env.example`をコピーして`.env`ファイルを作成し、環境に合わせて設定:

```bash
cp .env.example .env
```

主要な設定項目:
```bash
# Amazon Q SSO start URL (必須)
AMAZON_Q_START_URL=https://your-company.awsapps.com/start

# Workspace path (必須)
AMAZON_Q_WORKSPACE=/Users/<UserName>/<Workspace>

# Proxy settings (オプション)
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
```

### 2. Docker Compose起動

```bash
# ビルド
./build.sh

# デプロイ
./deploy.sh
```

### 3. DevContainer起動

1. VSCodeでプロジェクトを開く
2. `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
3. 初回起動時は自動的にAmazon Q CLIがビルドされます（5-10分程度）

### 4. 認証設定

コンテナ起動後、認証を実行:

```bash
# manage.sh経由
./manage.sh auth

# または直接コンテナ内で
/usr/local/scripts/auth-amazon-q.sh

# 認証状態確認
./manage.sh auth-status
```

## 設定ファイル詳細

### devcontainer.json

```json
{
  "dockerComposeFile": "../docker-compose.yml",
  "service": "amazon-q",
  "workspaceFolder": "/home/developer/workspace",
  "remoteUser": "developer",
  "shutdownAction": "stopCompose",
  "customizations": {
    "vscode": {
      "extensions": [
        "amazonwebservices.aws-toolkit-vscode",
        "amazonwebservices.amazon-q-vscode"
      ]
    }
  }
}
```

### docker-compose.yml

```yaml
services:
  amazon-q:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ${AMAZON_Q_WORKSPACE}:/home/developer/workspace:cached
      - ~/.aws/nskp_config/netskope-cert-bundle.pem:/home/developer/.aws/nskp_config/netskope-cert-bundle.pem:cached
      - ./amazonq:/home/developer/.config/amazonq:cached
      - ./.vscode:/vscode:cached
    env_file:
      - .env
    command: sleep infinity
    user: developer
```

## 使用方法

### Amazon Q CLI

```bash
# チャット開始
q chat

# バージョン確認
q --version

# 認証状態確認
q whoami
```

### 管理スクリプト（manage.sh）

```bash
# コンテナ管理
./manage.sh start      # 開始
./manage.sh stop       # 停止
./manage.sh restart    # 再起動
./manage.sh shell      # シェル接続
./manage.sh auth       # 認証
./manage.sh chat       # チャット開始
./manage.sh auth-status # 認証状態確認
./manage.sh logs       # ログ表示
./manage.sh ps         # コンテナ状態
./manage.sh config     # 設定確認
./manage.sh build      # ビルド
./manage.sh clean      # 完全削除
```

### 直接Docker Composeコマンド

```bash
# ビルド
docker compose build

# 起動
docker compose up -d

# 停止
docker compose down

# ログ確認
docker compose logs -f

# シェル接続
docker compose exec amazon-q bash
```

## トラブルシューティング

詳細は [troubleshooting.md](troubleshooting.md) を参照してください。
