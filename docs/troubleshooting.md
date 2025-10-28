# トラブルシューティング

## よくある問題と解決方法

### DevContainer関連

#### 1. コンテナが起動しない

**症状**: DevContainerの起動に失敗する

**原因と対処法**:
- Docker Desktopが起動していない → Docker Desktopを起動
- `q/.env`ファイルの設定が間違っている → 環境変数を確認
- ワークスペースパスが存在しない → `AMAZON_Q_WORKSPACE`のパスを確認

```bash
# 設定確認
./manage.sh config

# コンテナログ確認
./manage.sh logs

# 手動ビルド
./build.sh
```

#### 2. ビルドエラー

**症状**: `docker build`でエラーが発生

**対処法**:
```bash
# キャッシュクリア
docker system prune -a

# 手動ビルド
./build.sh
```

#### 3. マウントエラー

**症状**: ボリュームマウントに失敗

**対処法**:
- ホスト側のパスが存在することを確認
- Docker Desktopのファイル共有設定を確認
- 権限問題の場合は`chmod`で修正

### Amazon Q CLI関連

#### 1. 認証エラー

**症状**: `q chat`で認証エラー

**対処法**:
```bash
# 認証状態確認
./manage.sh auth-status

# 再認証
./manage.sh auth

# 手動認証
q login --license pro --identity-provider "https://your-company.awsapps.com/start" --region "us-east-1"
```

#### 2. Amazon Q CLIが見つからない

**症状**: `q: command not found`

**対処法**:
```bash
# パス確認
echo $PATH
which q

# 手動インストール確認
ls -la /usr/local/bin/q

# 権限確認
chmod +x /usr/local/bin/q
```

#### 3. プロキシエラー

**症状**: ネットワーク接続エラー

**対処法**:
`q/.env`ファイルにプロキシ設定を追加:
```bash
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
```

### AWS CLI関連

#### 1. AWS CLI認証エラー

**症状**: AWS CLIコマンドで認証エラー

**対処法**:
```bash
# AWS CLI確認
aws --version

# 認証情報確認
aws sts get-caller-identity

# 設定確認
aws configure list
```

#### 2. 証明書エラー

**症状**: SSL証明書エラー

**対処法**:
```bash
# 証明書パス確認
echo $AWS_CA_BUNDLE

# 証明書ファイル確認
ls -la /home/developer/.aws/nskp_config/netskope-cert-bundle.pem

# ホスト側の証明書確認
ls -la ~/.aws/nskp_config/netskope-cert-bundle.pem
```

## デバッグ方法

### 1. コンテナ内でのデバッグ

```bash
# コンテナに接続
./manage.sh shell

# 環境変数確認
env | grep AMAZON_Q

# プロセス確認
ps aux | grep q
```

### 2. ログ確認

```bash
# コンテナログ
./manage.sh logs

# または直接
docker compose logs -f amazon-q
```

### 3. 設定ファイル確認

```bash
# Docker Compose設定確認
./manage.sh config

# または直接
docker compose config
```

## 完全リセット

問題が解決しない場合の完全リセット手順:

```bash
# 1. コンテナとイメージを削除
./manage.sh clean

# 2. Docker システムクリーンアップ
docker system prune -a

# 3. VSCode DevContainerキャッシュクリア (macOS)
rm -rf "$HOME/Library/Application Support/Code/User/globalStorage/ms-vscode-remote.remote-containers"

# Linuxの場合
rm -rf "$HOME/.vscode-server/data/Machine/globalStorage/ms-vscode-remote.remote-containers"

# 4. 再ビルド
./build.sh

# 5. 再起動
./manage.sh start

# 6. DevContainer再起動（VSCode使用時）
# VSCode: Ctrl+Shift+P → "Dev Containers: Rebuild Container"
```

## サポート

問題が解決しない場合は、以下の情報を含めて報告してください:

1. エラーメッセージの全文
2. 実行したコマンド
3. 環境情報（OS、Docker version等）
4. 設定ファイルの内容（機密情報は除く）
