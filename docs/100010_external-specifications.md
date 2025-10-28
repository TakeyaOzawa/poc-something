# 外部仕様書

## 概要

Amazon Q DevContainer環境の外部仕様を定義します。

## システム要件

### 必須要件

- **Docker Desktop**: 4.0以降
- **VSCode**: 1.80以降
- **Dev Containers拡張機能**: 0.300以降
- **メモリ**: 8GB以上推奨
- **ストレージ**: 10GB以上の空き容量

### 対応プラットフォーム

- **macOS**: 11.0以降（Intel/Apple Silicon）
- **Linux**: Ubuntu 20.04以降、CentOS 8以降
- **Windows**: Windows 10/11 + WSL2

## 環境変数仕様

### 必須環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `AMAZON_Q_WORKSPACE` | ワークスペースのパス | `/Users/user/workspace` |
| `AMAZON_Q_START_URL` | AWS SSO開始URL | `https://company.awsapps.com/start` |

### オプション環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `AWS_CA_BUNDLE` | CA証明書バンドルパス | なし |
| `AMAZON_Q_DANGEROUS_MODE` | 危険モード有効化 | `true` |
| `AMAZON_Q_REGION` | AWSリージョン | `us-east-1` |
| `HTTP_PROXY` | HTTPプロキシ | なし |
| `HTTPS_PROXY` | HTTPSプロキシ | なし |

## コンテナ仕様

### ベースイメージ

- **OS**: Ubuntu 22.04 LTS
- **アーキテクチャ**: linux/amd64, linux/arm64

### インストール済みソフトウェア

| ソフトウェア | バージョン | 用途 |
|-------------|-----------|------|
| Amazon Q CLI | latest | メインツール |
| AWS CLI | v2 | AWS操作 |
| Node.js | v22 LTS | 開発環境 |
| Rust | stable | Amazon Q CLIビルド |
| Git | latest | バージョン管理 |

### ポート仕様

| ポート | 用途 | 説明 |
|--------|------|------|
| 46817 | VS Code Server | DevContainer通信 |

### ボリュームマウント

| ホストパス | コンテナパス | 用途 |
|-----------|-------------|------|
| `${AMAZON_Q_WORKSPACE}` | `/home/developer/workspace` | ワークスペース |
| `~/.aws` | `/home/developer/.aws` | AWS認証情報 |
| `./amazonq` | `/home/developer/.config/amazonq` | Amazon Q設定 |
| `./.vscode` | `/home/developer/vscode` | VSCode設定 |

## API仕様

### 管理スクリプト（manage.sh）

```bash
./manage.sh <command>
```

#### コマンド一覧

| コマンド | 説明 | 戻り値 |
|---------|------|--------|
| `start` | コンテナ開始 | 0: 成功, 1: 失敗 |
| `stop` | コンテナ停止 | 0: 成功, 1: 失敗 |
| `restart` | コンテナ再起動 | 0: 成功, 1: 失敗 |
| `shell` | シェル接続 | - |
| `auth` | 認証実行 | 0: 成功, 1: 失敗 |
| `chat` | チャット開始 | - |
| `status` | 状態確認 | 0: 認証済み, 1: 未認証 |
| `logs` | ログ表示 | - |
| `ps` | コンテナ状態表示 | - |
| `build` | ビルド実行 | 0: 成功, 1: 失敗 |
| `config` | 設定確認 | - |
| `clean` | 完全削除 | 0: 成功 |

### 認証スクリプト（auth-amazon-q.sh）

```bash
/usr/local/scripts/auth-amazon-q.sh
```

- **入力**: 環境変数`AMAZON_Q_START_URL`または対話入力
- **出力**: 認証成功/失敗メッセージ
- **戻り値**: 0（成功）、1（失敗）

### 状態確認スクリプト（check-auth.sh）

```bash
/usr/local/scripts/check-auth.sh
```

- **出力**: 認証状態とユーザー情報
- **戻り値**: 0（認証済み）、1（未認証）

## ファイル形式仕様

### devcontainer.json

```json
{
  "name": "amazon-q-dev1",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "amazon-q-dev",
  "workspaceFolder": "/home/developer/workspace",
  "remoteUser": "developer",
  "shutdownAction": "stopCompose",
  "customizations": {
    "vscode": {
      "extensions": [...],
      "settings": {...}
    }
  }
}
```

### docker-compose.yml

```yaml
services:
  amazon-q-dev:
    build:
      context: .
      dockerfile: Dockerfile
    volumes: [...]
    env_file:
      - .env
    command: sleep infinity
    user: developer
```

### エージェント設定（default-agent.json）

```json
{
  "name": "development-assistant",
  "description": "開発作業用の自動承認エージェント",
  "allowedTools": ["fs_read", "fs_write", "execute_bash"],
  "toolsSettings": {
    "fs_read": {
      "allowedPaths": ["*"],
      "deniedPaths": ["~/.ssh/**", "/etc/**"]
    },
    "fs_write": {
      "allowedPaths": ["~/workspace/**"],
      "deniedPaths": ["~/workspace/production/**"]
    },
    "execute_bash": {
      "allowedCommands": ["*"],
      "deniedCommands": ["git push .*", "rm -rf .*"],
      "autoAllowReadonly": true
    }
  }
}
```

## セキュリティ仕様

### アクセス制御

- **ユーザー**: `developer`（非root）
- **UID/GID**: 1000:1000
- **sudo**: パスワードなしsudo有効

### ネットワーク

- **外部通信**: HTTPS（443）、SSH（22）
- **プロキシ**: HTTP_PROXY/HTTPS_PROXY環境変数対応

### 証明書

- **CA証明書**: AWS_CA_BUNDLE環境変数で指定
- **SSL検証**: 有効（証明書必須）

## 制限事項

### リソース制限

- **メモリ**: Dockerの設定に依存
- **CPU**: Dockerの設定に依存
- **ディスク**: ホストの空き容量に依存

### 機能制限

- **GUI**: サポートなし（CLI専用）
- **特権操作**: 制限あり
- **ネットワーク**: プロキシ環境での制限あり

## 互換性

### バージョン互換性

- **Amazon Q CLI**: 最新版を自動取得
- **AWS CLI**: v2系
- **Docker**: 20.10以降
- **Docker Compose**: v2系
