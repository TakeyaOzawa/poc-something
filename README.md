# Amazon Q DevContainer Environment

Amazon Q CLIをDocker Compose + DevContainer環境で実行するためのセットアップです。

## ディレクトリ構造

```
q/
├── .devcontainer/
│   └── devcontainer.json      # DevContainer設定
├── .github/workflows/
│   └── ci.yml                 # CI/CD設定
├── .vscode/                   # VSCode設定
├── amazonq/                   # Amazon Q設定保存
├── docs/                      # ドキュメント
│   ├── setup-guide.md         # 詳細セットアップガイド
│   ├── troubleshooting.md     # トラブルシューティング
│   └── faq.md                 # よくある質問
├── scripts/                   # セットアップスクリプト
│   ├── auth-amazon-q.sh       # 認証スクリプト
│   ├── check-auth.sh          # 認証確認
│   ├── entrypoint.sh          # コンテナエントリーポイント
│   └── install-aws-tools.sh   # AWS CLI インストール
├── docker-compose.yml         # Docker Compose設定
├── Dockerfile                 # コンテナイメージ定義
├── .env.example               # 環境変数テンプレート
├── build.sh                   # ビルドスクリプト
├── deploy.sh                  # デプロイスクリプト
├── manage.sh                  # 管理スクリプト
├── cleanup.sh                 # クリーンアップスクリプト
└── README.md                  # このファイル
```

## 前提条件

- Docker Desktop
- VSCode + Dev Containers拡張機能
- 会社のAWS SSOスタートURL

## セットアップ

### 環境変数設定

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

### Docker Compose起動

1. このリポジトリをクローン
2. `.env`ファイルを作成・編集して環境変数を設定
3. コンテナをビルド・起動:
   ```bash
   ./build.sh
   ./deploy.sh
   ```

### DevContainer起動

1. VSCodeで開く
2. `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
3. 初回起動時は自動的にAmazon Q CLIがソースからビルドされます（5-10分程度）

### 認証設定

コンテナ起動後、認証を実行:
```bash
# manage.sh経由
./manage.sh auth

# または直接コンテナ内で
/usr/local/scripts/auth-amazon-q.sh

# 認証状態確認
./manage.sh status
```


## 使用方法

### Amazon Q CLI（manage.sh経由）
```bash
# コンテナシェルに入る
./manage.sh shell

# Amazon Q認証
./manage.sh auth

# チャット開始
./manage.sh chat

# 認証状態確認
./manage.sh auth-status

# その他のコマンド
./manage.sh logs     # ログ表示
./manage.sh stop     # コンテナ停止
./manage.sh restart  # コンテナ再起動
./manage.sh build    # コンテナビルド
./manage.sh clean    # 完全削除
```

### 直接実行（コンテナ内）
```bash
# チャット開始
q chat

# バージョン確認
q --version

# ヘルプ
q --help
```

### AWS CLI（コンテナ内）
```bash
# 認証情報確認
aws sts get-caller-identity

# S3バケット一覧
aws s3 ls
```

## 特徴

### 自動セットアップ
- **Amazon Q CLI**: GitHubソースから自動ビルド・インストール
- **AWS CLI**: マルチアーキテクチャ対応（x86_64/ARM64）
- **証明書**: NETSCOPE証明書の自動設定
- **プロキシ**: 環境変数による自動設定
- **認証永続化**: AWS SSO認証情報をホスト側で保持
- **コンテナ自動検索**: 複数プロジェクト環境で最新のコンテナを自動選択

### 環境変数サポート
- `.env`ファイルによる環境変数の自動読み込み
- `AMAZON_Q_START_URL`: SSO認証URL
- `AWS_CA_BUNDLE`: 証明書パス（ホスト側）
- `HTTP_PROXY`/`HTTPS_PROXY`: プロキシ設定
- `AMAZON_Q_WORKSPACE`: ワークスペースパス

## トラブルシューティング

### コンテナが見つからない場合
manage.shは自動的に動いているAmazon Qコンテナを検索します：
```bash
# 動いているコンテナを確認
docker ps | grep amazon-q

# 手動でコンテナ名を指定
./manage.sh shell <コンテナ名>
```

### 初回ビルドが長い場合
Amazon Q CLIのソースビルドには時間がかかります：
- 通常: 5-10分
- 低スペック環境: 15-20分

### コンテナ再ビルドが必要な場合
設定変更後は以下を実行:
```
Ctrl+Shift+P → "Dev Containers: Rebuild Container"
```

## 技術詳細

- **ベースイメージ**: Ubuntu 22.04
- **Amazon Q CLI**: GitHubソースからRustでビルド
- **AWS CLI**: 公式バイナリ（マルチアーキテクチャ対応）
- **Node.js**: v22（最新LTS）
