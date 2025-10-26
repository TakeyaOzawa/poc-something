# Amazon Q DevContainer Environment

Amazon Q CLIをDevContainer環境で実行するためのセットアップです。

## 前提条件

- Docker Desktop
- VSCode + Dev Containers拡張機能
- 会社のAWS SSOスタートURL

## セットアップ

### 環境変数設定

`.env`ファイルを作成して環境に合わせて設定:

```bash
# Amazon Q SSO start URL (必須)
AMAZON_Q_START_URL=https://your-company.awsapps.com/start

# NETSCOPE certificate path (オプション - ホスト側のパス)
NETSCOPE_CERT_PATH=/path/to/netscope/certificates

# Proxy settings (オプション)
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
```

### DevContainer起動

1. このリポジトリをクローン
2. `.env`ファイルを作成・編集して環境変数を設定
3. VSCodeで開く
4. `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
5. 初回起動時は自動的にAmazon Q CLIがソースからビルドされます（5-10分程度）
6. 認証を実行（初回のみ）:
   ```bash
   # 環境変数が設定されている場合
   ./scripts/sso-auth.sh setup
   
   # または直接URLを指定
   ./scripts/sso-auth.sh setup https://your-company.awsapps.com/start
   
   # 認証状態確認
   ./scripts/sso-auth.sh status
   ```

**注意**: 認証情報はホスト側の`~/.aws`ディレクトリに保存され、コンテナ再起動後も保持されます。

## 使用方法

### Amazon Q CLI
```bash
# チャット開始
q chat

# バージョン確認
q --version

# ヘルプ
q --help
```

### AWS CLI
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

### 環境変数サポート
- `AMAZON_Q_START_URL`: SSO認証URL
- `NETSCOPE_CERT_PATH`: 証明書パス（ホスト側）
- `HTTP_PROXY`/`HTTPS_PROXY`: プロキシ設定

## トラブルシューティング

### 初回ビルドが長い場合
Amazon Q CLIのソースビルドには時間がかかります：
- 通常: 5-10分
- 低スペック環境: 15-20分

### qコマンドが見つからない場合
```bash
# 手動ビルド実行
sudo /usr/local/bin/build-amazon-q.sh

# PATHの確認
echo $PATH
source ~/.bashrc
```

### 証明書エラーの場合
```bash
# 証明書の再設定
/usr/local/bin/setup-certificates.sh
```

### コンテナ再ビルドが必要な場合
設定変更後は以下を実行:
```
Ctrl+Shift+P → "Dev Containers: Rebuild Container"
```

## セットアップ検証

```bash
# セットアップが正しく完了しているかテスト
./test-setup.sh
```

## 技術詳細

- **ベースイメージ**: Ubuntu 22.04
- **Amazon Q CLI**: GitHubソースからRustでビルド
- **AWS CLI**: 公式バイナリ（マルチアーキテクチャ対応）
- **Node.js**: v22（最新LTS）
