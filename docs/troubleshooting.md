# トラブルシューティングガイド

## よくある問題

### 1. qコマンドが見つからない

**症状**: `command not found: q`

**解決策**:
```bash
# 手動ビルド実行
sudo /usr/local/bin/build-amazon-q.sh

# PATHの確認
echo $PATH
source ~/.bashrc

# バージョン確認
q --version
```

### 2. DevContainerマウントエラー

**症状**: `invalid mount path: '${localWorkspaceFolder}'`

**解決策**:
```bash
# .envファイル確認
cat .env

# コンテナ再ビルド
# Ctrl+Shift+P → "Dev Containers: Rebuild Container"
```

### 3. Amazon Q CLI認証エラー

**症状**: `q auth login`失敗

**解決策**:
```bash
# 環境変数確認
echo $AMAZON_Q_START_URL

# 認証実行
./.devcontainer/scripts/sso-auth.sh setup

# 認証状態確認
./.devcontainer/scripts/sso-auth.sh status
```

### 4. 証明書エラー

**症状**: SSL certificate問題

**解決策**:
```bash
# 証明書パス確認
echo $AWS_CA_BUNDLE

# 証明書再設定
/usr/local/bin/setup-certificates.sh

# 証明書確認
ls /usr/local/share/ca-certificates/
```

### 5. プロキシ接続問題

**症状**: 外部接続失敗

**解決策**:
```bash
# プロキシ設定確認
echo $HTTP_PROXY
echo $HTTPS_PROXY

# .envファイル確認
grep PROXY .env

# ネットワーク接続テスト
curl -I https://github.com
```

### 6. ビルドが長時間かかる

**症状**: Amazon Q CLIビルドが15分以上

**解決策**:
```bash
# ネットワーク確認
timeout 10 curl -s --head https://github.com

# Docker設定確認
# Docker Desktop → Settings → Resources

# 手動ビルド（詳細ログ付き）
sudo /usr/local/bin/build-amazon-q.sh
```

## 診断コマンド

```bash
# 総合診断
./.devcontainer/scripts/test-setup.sh

# 環境変数確認
env | grep -E "(AMAZON_Q|NETSCOPE|PROXY)"

# Docker状態確認
docker system df
docker system events
```

## 初期化手順

問題が解決しない場合の完全リセット:

```bash
# 1. コンテナ削除
docker system prune -a

# 2. 設定確認
cat .env

# 3. 完全再ビルド
# Ctrl+Shift+P → "Dev Containers: Rebuild Container"

# 4. 認証再設定
./.devcontainer/scripts/sso-auth.sh setup
```

## サポート

問題が解決しない場合:
1. エラーログ確認
2. 環境情報収集: `./.devcontainer/scripts/test-setup.sh`
3. GitHub Issues作成
4. 社内サポートチーム連絡
