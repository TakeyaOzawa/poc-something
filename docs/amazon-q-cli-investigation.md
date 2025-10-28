# Amazon Q CLI 調査結果

## 概要

Amazon Q Developer CLIの調査結果と実装に関する技術的知見をまとめます。

## Amazon Q CLI 基本情報

### リポジトリ情報
- **GitHub**: https://github.com/aws/amazon-q-developer-cli
- **言語**: Rust
- **ライセンス**: Apache License 2.0
- **メインバイナリ**: `chat_cli`

### ビルド要件
- **Rust**: stable toolchain
- **依存関係**: OpenSSL, pkg-config
- **ビルド時間**: 5-15分（環境依存）
- **バイナリサイズ**: 約50-80MB

## コマンド体系

### 基本コマンド

```bash
# バージョン確認
q --version

# ヘルプ表示
q --help

# チャット開始
q chat

# 認証関連
q login --license pro --identity-provider <SSO_URL> --region <REGION>
q whoami
q logout
```

### 認証システム

#### SSO認証フロー
1. `q login` コマンド実行
2. ブラウザでSSO認証
3. 認証トークン取得
4. ローカルに認証情報保存

#### 認証情報保存場所
```bash
~/.aws/sso/cache/          # SSOキャッシュ
~/.aws/config              # AWS設定
~/.aws/credentials         # AWS認証情報
```

### エージェント機能

#### ツール権限
- `fs_read`: ファイル読み取り
- `fs_write`: ファイル書き込み
- `execute_bash`: Bashコマンド実行
- `use_aws`: AWS CLI実行

#### 設定例
```json
{
  "name": "development-assistant",
  "allowedTools": ["fs_read", "fs_write", "execute_bash"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": ["~/workspace/**"],
      "deniedPaths": ["~/.ssh/**"]
    }
  }
}
```

## 技術的制約

### ネットワーク要件
- **HTTPS**: 443ポート（AWS API通信）
- **プロキシ**: HTTP_PROXY/HTTPS_PROXY環境変数対応
- **証明書**: 企業証明書対応（AWS_CA_BUNDLE）

### システム要件
- **OS**: Linux, macOS, Windows
- **アーキテクチャ**: x86_64, ARM64
- **メモリ**: 最低512MB、推奨2GB以上
- **ディスク**: 100MB以上の空き容量

### 制限事項
- **GUI**: サポートなし（CLI専用）
- **同時実行**: 単一プロセスのみ
- **オフライン**: インターネット接続必須

## DevContainer統合

### 統合方針
1. **ソースビルド**: GitHubから最新ソースを取得してビルド
2. **バイナリ配置**: `/usr/local/bin/q` に配置
3. **権限設定**: 実行権限付与
4. **パス設定**: 自動的にPATHに追加

### ビルドプロセス
```dockerfile
# Rust環境準備
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# ソースクローン
RUN git clone https://github.com/aws/amazon-q-developer-cli.git /tmp/amazon-q-cli

# ビルド実行
RUN cd /tmp/amazon-q-cli && \
    . ~/.cargo/env && \
    cargo build --release --bin chat_cli

# バイナリ配置
RUN cp /tmp/amazon-q-cli/target/release/chat_cli /usr/local/bin/q
```

## 認証統合

### SSO統合戦略
```bash
#!/bin/bash
# auth-amazon-q.sh

if [ -n "$AMAZON_Q_START_URL" ]; then
    echo "Authenticating with: $AMAZON_Q_START_URL"
    q login --license pro --identity-provider "$AMAZON_Q_START_URL" --region "${AMAZON_Q_REGION:-us-east-1}"
else
    echo "Please provide your SSO start URL:"
    read -p "Start URL: " start_url
    q login --license pro --identity-provider "$start_url" --region "${AMAZON_Q_REGION:-us-east-1}"
fi
```

### 認証状態確認
```bash
#!/bin/bash
# check-auth.sh

if q whoami --format json >/dev/null 2>&1; then
    echo "✅ Authentication: Active"
    q whoami
else
    echo "❌ Authentication: Required"
    echo "Run: /usr/local/scripts/auth-amazon-q.sh"
fi
```

## パフォーマンス分析

### ビルド時間
- **初回ビルド**: 5-15分
  - Rust依存関係ダウンロード: 2-5分
  - コンパイル: 3-10分
- **キャッシュ利用時**: 1-3分

### 実行時パフォーマンス
- **起動時間**: 1-3秒
- **メモリ使用量**: 50-200MB
- **CPU使用率**: 低（待機時）、高（処理時）

### 最適化手法
```dockerfile
# 並列ビルド
ENV CARGO_BUILD_JOBS="$(nproc)"

# リンク時最適化
ENV RUSTFLAGS="-C target-cpu=native"

# デバッグ情報削除
RUN strip /usr/local/bin/q
```

## セキュリティ考慮事項

### 認証情報管理
- **保存場所**: `~/.aws/` ディレクトリ
- **権限**: 600 (所有者のみ読み書き)
- **暗号化**: AWS標準の暗号化方式

### ネットワークセキュリティ
```bash
# 証明書設定
export AWS_CA_BUNDLE="/path/to/ca-bundle.pem"

# プロキシ設定
export HTTP_PROXY="http://proxy:8080"
export HTTPS_PROXY="http://proxy:8080"
```

### エージェント権限制御
```json
{
  "toolsSettings": {
    "execute_bash": {
      "deniedCommands": [
        "git push .*",
        "rm -rf .*",
        "sudo .*",
        "chmod 777 .*"
      ]
    }
  }
}
```

## トラブルシューティング

### よくある問題

#### 1. ビルドエラー
```bash
# 原因: Rust toolchainが古い
rustup update stable

# 原因: 依存関係不足
apt-get install -y build-essential pkg-config libssl-dev
```

#### 2. 認証エラー
```bash
# 認証情報クリア
rm -rf ~/.aws/sso/cache/

# 再認証
q login --license pro --identity-provider <SSO_URL>
```

#### 3. ネットワークエラー
```bash
# プロキシ設定確認
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 証明書確認
echo $AWS_CA_BUNDLE
```

## 将来の拡張計画

### 機能拡張
- **カスタムエージェント**: ユーザー定義エージェント
- **プラグインシステム**: 外部ツール統合
- **バッチ処理**: 非対話モード
- **API統合**: REST API経由での操作

### パフォーマンス改善
- **バイナリキャッシュ**: 事前ビルド済みバイナリ配布
- **起動高速化**: 常駐プロセス化
- **メモリ最適化**: 使用量削減

### セキュリティ強化
- **MFA対応**: 多要素認証
- **監査ログ**: 操作履歴記録
- **権限管理**: より細かい権限制御

## 参考資料

### 公式ドキュメント
- [Amazon Q Developer CLI GitHub](https://github.com/aws/amazon-q-developer-cli)
- [AWS SSO Documentation](https://docs.aws.amazon.com/singlesignon/)
- [Rust Programming Language](https://www.rust-lang.org/)

### 関連技術
- [DevContainers Specification](https://containers.dev/)
- [Docker Compose](https://docs.docker.com/compose/)
- [VS Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview)
