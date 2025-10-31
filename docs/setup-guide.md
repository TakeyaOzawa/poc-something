# Amazon Q DevContainer セットアップガイド

## 概要

Amazon Q CLIをDocker Compose + DevContainer環境で実行するための詳細セットアップガイドです。

## 前提条件

- Docker Desktop
- VSCode + Dev Containers拡張機能
- 会社のAWS SSOスタートURL

## ディレクトリ構造

```
dev-container-amazon-q/
├── .devcontainer/
│   └── devcontainer.json         # DevContainer設定
├── .github/workflows/
│   └── ci.yml                    # CI/CD設定
├── docs/                         # ドキュメント
│   ├── setup-guide.md            # 詳細セットアップガイド
│   ├── troubleshooting.md        # トラブルシューティング
│   └── faq.md                    # よくある質問
├── q/                            # Amazon Q環境
│   ├── amazonq/                  # Amazon Q設定保存
│   │   └── agents/
│   │       └── default-agent.json
│   ├── scripts/                  # セットアップスクリプト
│   │   ├── auth-amazon-q.sh      # 認証スクリプト
│   │   ├── build-complete.sh     # 完了メッセージ表示
│   │   ├── check-auth.sh         # 認証確認
│   │   ├── entrypoint.sh         # コンテナエントリーポイント
│   │   └── install-aws-tools.sh  # AWS CLI インストール
│   ├── docker-compose.yml        # Docker Compose設定
│   ├── Dockerfile                # コンテナイメージ定義
│   ├── .env                      # 環境変数（作成後）
│   └── .env.example              # 環境変数テンプレート
├── build.sh                      # ビルドスクリプト
├── deploy.sh                     # デプロイスクリプト
├── manage.sh                     # 管理スクリプト
├── cleanup.sh                    # クリーンアップスクリプト
└── README.md                     # このファイル
```

## セットアップ手順

### 1. 環境変数設定

`q/.env.example`をコピーして`q/.env`ファイルを作成し、環境に合わせて設定:

```bash
cp q/.env.example q/.env
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

1. VSCodeでプロジェクトルート（pocs/）を開く
2. `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
3. 初回起動時は自動的にAmazon Q CLIがRustでビルドされます（5-10分程度）

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
  "dockerComposeFile": "../q/docker-compose.yml",
  "service": "amazon-q",
  "workspaceFolder": "/home/developer/workspace",
  "remoteUser": "developer",
  "shutdownAction": "stopCompose",
  "customizations": {
    "vscode": {
      "extensions": [
        "amazonwebservices.aws-toolkit-vscode",
        "amazonwebservices.amazon-q-vscode",
        "amazonwebservices.codewhisperer-for-command-line-companion",
        "rust-lang.rust-analyzer",
        "vadimcn.vscode-lldb"
      ],
      "settings": {
        "terminal.integrated.defaultProfile.linux": "bash",
        "rust-analyzer.cargo.buildScripts.enable": true,
        "aws.telemetry": false
      }
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
    healthcheck:
      test: ["CMD", "sh", "-c", "q --version > /dev/null 2>&1 && /usr/local/scripts/build-complete.sh"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
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

### 直接Dockerコマンド

```bash
# q/ディレクトリに移動
cd q

# ビルド
docker build -t amazon-q-devcontainer .

# 起動
docker compose up -d

# 停止
docker stop <container_name>
# または最新のコンテナを停止
docker stop $(docker ps --format "{{.Names}}" | grep -E "q-.*amazon-q-1$" | head -n1)

# ログ確認
docker logs -f <container_name>
# または最新のコンテナのログ
docker logs -f $(docker ps --format "{{.Names}}" | grep -E "q-.*amazon-q-1$" | head -n1)

# ヘルスチェック状態確認
docker ps --filter "name=q-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# シェル接続
docker exec -it <container_name> bash
# または最新のコンテナに接続
docker exec -it $(docker ps --format "{{.Names}}" | grep -E "q-.*amazon-q-1$" | head -n1) bash
```

## ヘルスチェック機能

コンテナ起動後、Amazon Q CLIの準備が完了すると自動的に完了メッセージが表示されます：

```bash
# ヘルスチェック状態確認
docker ps --filter "name=q-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 完了メッセージ確認（ログ内）
docker logs -f <container_name>
# または最新のコンテナのログ
docker logs -f $(docker ps --format "{{.Names}}" | grep -E "q-.*amazon-q-1$" | head -n1)
```

完了時に表示されるナビゲーション：
```
╔══════════════════════════════════════╗
║     🎯 Amazon Q DevContainer        ║
║        準備完了！                    ║
╠══════════════════════════════════════╣
║ 利用可能なコマンド:                  ║
║ • ./manage.sh auth    (認証)         ║
║ • ./manage.sh chat    (チャット)     ║
║ • ./manage.sh shell   (シェル)       ║
║ • ./manage.sh status  (状態確認)     ║
╚══════════════════════════════════════╝
```

## トラブルシューティング

詳細は [troubleshooting.md](troubleshooting.md) を参照してください。
