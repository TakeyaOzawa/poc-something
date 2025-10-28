# Amazon Q DevContainer セットアップガイド

## 概要

Amazon Q CLIをDevContainer環境で実行するための詳細セットアップガイドです。

## 前提条件

- Docker Desktop
- VSCode + Dev Containers拡張機能
- 会社のAWS SSOスタートURL

## ディレクトリ構造

```
amazon_q_base/
├── .devcontainer/
│   └── devcontainer.json         # DevContainer設定
├── .github/workflows/
│   └── ci.yml                    # CI/CD設定
├── .vscode/
│   ├── launch.json               # デバッグ設定
│   └── settings.json             # VSCode設定
├── amazonq/agents/
│   └── default-agent.json        # Amazon Qエージェント設定
├── docs/                         # ドキュメント
├── scripts/                      # セットアップスクリプト
│   ├── auth-amazon-q.sh          # 認証スクリプト
│   ├── check-auth.sh             # 認証確認
│   ├── entrypoint.sh             # コンテナエントリーポイント
│   └── install-aws-tools.sh      # AWS CLI インストール
├── docker-compose.yml            # Docker Compose設定
├── Dockerfile                    # コンテナイメージ定義
├── .env                          # 環境変数
├── build.sh                      # ビルドスクリプト
├── deploy.sh                     # デプロイスクリプト
└── manage.sh                     # 管理スクリプト
```

## セットアップ手順

### 1. 環境変数設定

`.env`ファイルを作成し、環境に合わせて設定:

```bash
# Workspace settings
AMAZON_Q_WORKSPACE=/Users/<ユーザー名>/works/poc-something/amazon_q_base

# AWS CA bundle path (host side)
AWS_CA_BUNDLE=/Users/<ユーザー名>/.aws/nskp_config/netskope-cert-bundle.pem

# Amazon Q SSO start URL
AMAZON_Q_START_URL=https://your-company.awsapps.com/start

# Amazon Q dangerous mode (default: true)
AMAZON_Q_DANGEROUS_MODE=true
```

### 2. DevContainer起動

1. VSCodeでプロジェクトを開く
2. `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
3. 初回起動時は自動的にAmazon Q CLIがビルドされます（5-10分程度）

### 3. 認証設定

コンテナ起動後、認証を実行:

```bash
# 認証実行
/usr/local/scripts/auth-amazon-q.sh

# 認証状態確認
/usr/local/scripts/check-auth.sh
```

## 設定ファイル詳細

### devcontainer.json

```json
{
  "name": "amazon-q-dev1",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "amazon-q-dev",
  "workspaceFolder": "/home/developer/workspace",
  "remoteUser": "developer",
  "shutdownAction": "stopCompose"
}
```

### docker-compose.yml

```yaml
services:
  amazon-q-dev:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ${AMAZON_Q_WORKSPACE}:/home/developer/workspace:cached
      - ~/.aws/nskp_config/netskope-cert-bundle.pem:/home/developer/.aws/nskp_config/netskope-cert-bundle.pem:cached
      - ./amazonq:/home/developer/.config/amazonq:cached
      - ./.vscode:/home/developer/vscode:cached
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

### 管理スクリプト（Docker Compose版）

```bash
# ビルド
./build.sh

# コンテナ管理
./manage.sh start    # 開始
./manage.sh stop     # 停止
./manage.sh restart  # 再起動
./manage.sh shell    # シェル接続
./manage.sh auth     # 認証
./manage.sh chat     # チャット開始
./manage.sh status   # 状態確認
./manage.sh logs     # ログ表示
./manage.sh ps       # コンテナ状態
./manage.sh config   # 設定確認
./manage.sh clean    # 完全削除
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
docker compose exec amazon-q-dev bash
```

## トラブルシューティング

詳細は [troubleshooting.md](troubleshooting.md) を参照してください。
