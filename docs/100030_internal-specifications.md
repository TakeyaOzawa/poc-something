# Amazon Q DevContainer環境 - 内部仕様

## アーキテクチャ概要

### システム構成
```
Host OS (macOS/Ubuntu/Windows)
├── Docker Desktop
├── VSCode + DevContainer Extension
└── DevContainer
    ├── Ubuntu Base Image
    ├── Amazon Q CLI
    ├── AWS CLI v2
    ├── Node.js Runtime
    └── 開発ツール群
```

### コンテナ設計

#### ベースイメージ
- `ubuntu:22.04` を使用
- マルチアーキテクチャ対応（amd64/arm64）

#### インストール対象
- Amazon Q CLI (最新版)
- AWS CLI v2
- Node.js 18+ (Amazon Q CLIの依存関係)
- Git, curl, wget
- 開発支援ツール

### ネットワーク設計

#### Netscopeプロキシ対応
- 環境変数でのプロキシ設定
- CA証明書の自動インストール
- DNS設定の調整

#### 通信フロー
```
DevContainer → Netscope Proxy → AWS SSO → Amazon Q Service
```

### 認証設計

#### SSO認証フロー
1. `q auth login --start-url <company-start-url>`
2. ブラウザでの認証（ホストOS側）
3. 認証情報のコンテナ内保存
4. セッション管理

#### 認証情報管理
- `~/.aws/sso/` ディレクトリの永続化
- ボリュームマウントによる認証情報共有

## データ設計

### ボリューム構成
- `workspace`: プロジェクトファイル
- `aws-config`: AWS設定・認証情報
- `vscode-extensions`: VSCode拡張機能

### 設定ファイル
- `.devcontainer/devcontainer.json`: DevContainer設定
- `Dockerfile`: コンテナイメージ定義
- `docker-compose.yml`: 複数コンテナ管理（必要時）

## セキュリティ設計

### プロキシ設定
- HTTP_PROXY, HTTPS_PROXY環境変数
- NO_PROXY設定でローカル通信除外
- SSL証明書検証設定

### 認証情報保護
- ボリュームの適切な権限設定
- 一時的な認証情報の自動削除
- セッションタイムアウト管理
