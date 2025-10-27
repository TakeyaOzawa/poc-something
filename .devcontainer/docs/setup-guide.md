# Amazon Q DevContainer セットアップガイド

## 前提条件

- Docker Desktop (最新版)
- Visual Studio Code
- Dev Containers拡張機能
- AWS SSO スタートURL

## 環境変数設定

`.env.example`をコピーして`.env`ファイルを作成し、環境に合わせて設定:

```bash
cp .env.example .env
```

主要な設定項目:
```bash
# Amazon Q SSO start URL (必須)
AMAZON_Q_START_URL=https://your-company.awsapps.com/start

# NETSCOPE certificate path (オプション - ホスト側のパス)
AWS_CA_BUNDLE=/Users/<ユーザー名>/.aws/nskp_config/netskope-cert-bundle.pem

# Proxy settings (オプション)
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080

# Workspace path
WORKSPACE_PATH=/Users/<UserName>/<Workspace>
```

## クイックスタート

1. **リポジトリクローン**
   ```bash
   git clone <repository-url>
   cd amazon_q_base
   ```

2. **環境変数設定**
   ```bash
   cp .env.example .env
   # .envファイルを編集
   ```

3. **VSCodeで開く**
   ```bash
   code .
   ```

4. **DevContainerで開く**
   - `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
   - 初回ビルド: 5-10分程度（Amazon Q CLI自動ビルド）
   - `.env`ファイルは自動的に読み込まれます

5. **認証設定**
   ```bash
   # 環境変数が設定されている場合
   ./.devcontainer/scripts/sso-auth.sh setup
   
   # または直接URLを指定
   ./.devcontainer/scripts/sso-auth.sh setup https://your-company.awsapps.com/start
   ```

6. **動作確認**
   ```bash
   q chat
   q --version
   aws sts get-caller-identity
   ```

## 詳細設定

### 証明書設定
NETSCOPE証明書がある場合:
```bash
# .envファイルで設定
AWS_CA_BUNDLE=/Users/<ユーザー名>/.aws/nskp_config/netskope-cert-bundle.pem
```

### プロキシ環境
```bash
# .envファイルで設定
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
```

### 手動ビルド
```bash
sudo /usr/local/bin/build-amazon-q.sh
```

### テスト実行
```bash
./.devcontainer/scripts/test-setup.sh
```

## トラブルシューティング

### ビルドエラー
- ネットワーク接続確認
- Docker Desktop再起動
- コンテナ再ビルド: `Ctrl+Shift+P` → "Dev Containers: Rebuild Container"

### qコマンドが見つからない
```bash
# 手動ビルド実行
sudo /usr/local/bin/build-amazon-q.sh

# PATHの確認
echo $PATH
source ~/.bashrc
```

### 認証エラー
```bash
# 認証状態確認
./.devcontainer/scripts/sso-auth.sh status

# 再認証
./.devcontainer/scripts/sso-auth.sh setup
```

### 証明書エラー
```bash
# 証明書の再設定
/usr/local/bin/setup-certificates.sh
```
