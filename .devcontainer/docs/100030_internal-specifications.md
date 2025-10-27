# Amazon Q DevContainer環境 - 内部仕様

## アーキテクチャ概要

### システム構成
```
Host OS (macOS/Ubuntu/Windows)
├── Docker Desktop ✅
├── VSCode + DevContainer Extension ✅
└── DevContainer ✅
    ├── Ubuntu 22.04 Base Image ✅
    ├── Amazon Q CLI ⚠️（インストール課題）
    ├── AWS CLI v2 ✅（Rosettaエラーあり）
    ├── Node.js 18.x Runtime ✅
    └── 開発ツール群 ✅
```

### コンテナ設計

#### ベースイメージ
- `ubuntu:22.04` を使用 ✅
- マルチアーキテクチャ対応（amd64/arm64）❌

#### インストール済み
- ✅ AWS CLI v2
- ✅ Node.js 18.20.8
- ✅ Git, curl, wget, unzip
- ✅ 基本開発ツール
- ⚠️ Amazon Q CLI（インストール方法要調査）

#### 設定済み
- ✅ 開発ユーザー（developer）
- ✅ sudo権限設定
- ✅ 作業ディレクトリ（/workspace）

### ネットワーク設計

#### Netscopeプロキシ対応
- ✅ 環境変数テンプレート（.env.example）
- ❌ CA証明書の自動インストール
- ❌ DNS設定の調整
- ❌ プロキシ自動検出

#### 通信フロー
```
DevContainer → Netscope Proxy → AWS SSO → Amazon Q Service
            ↑未実装      ↑未実装    ↑未実装
```

### 認証設計

#### SSO認証フロー（未実装）
1. `q auth login --start-url <company-start-url>`
2. ブラウザでの認証（ホストOS側）
3. 認証情報のコンテナ内保存
4. セッション管理

#### 認証情報管理（未実装）
- `~/.aws/sso/` ディレクトリの永続化
- ボリュームマウントによる認証情報共有

## データ設計

### ボリューム構成
- ✅ `workspace`: プロジェクトファイル（bind mount）
- ❌ `aws-config`: AWS設定・認証情報
- ❌ `vscode-extensions`: VSCode拡張機能

### 設定ファイル
- ✅ `.devcontainer/devcontainer.json`: DevContainer設定
- ✅ `Dockerfile`: コンテナイメージ定義
- ❌ `docker-compose.yml`: 複数コンテナ管理（必要時）

### 現在のファイル構成
```
amazon_q_base/
├── .devcontainer/
│   └── devcontainer.json ✅
├── docs/ ✅
├── scripts/
│   └── test-basic.sh ✅
├── Dockerfile ✅
├── .env.example ✅
└── README.md ✅
```

## セキュリティ設計

### プロキシ設定
- ✅ HTTP_PROXY, HTTPS_PROXY環境変数テンプレート
- ❌ NO_PROXY設定でローカル通信除外
- ❌ SSL証明書検証設定

### 認証情報保護（未実装）
- ❌ ボリュームの適切な権限設定
- ❌ 一時的な認証情報の自動削除
- ❌ セッションタイムアウト管理

## 技術的課題

### 優先度高
1. **Amazon Q CLI インストール方法**
   - 公式パッケージが見つからない
   - 代替インストール手段の調査必要

2. **AWS CLI Rosettaエラー**
   - macOS Apple Silicon環境での実行エラー
   - アーキテクチャ対応が必要

### 優先度中
3. **プロキシ設定自動化**
4. **CA証明書インストール**
5. **認証フロー実装**
