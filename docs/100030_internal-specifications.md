# 内部仕様書

## アーキテクチャ概要

Amazon Q DevContainer環境の内部実装仕様を定義します。

## コンテナアーキテクチャ

### レイヤー構成

```
┌─────────────────────────────────────┐
│ Application Layer                   │
│ - Amazon Q CLI                      │
│ - VS Code Server                    │
│ - Development Tools                 │
├─────────────────────────────────────┤
│ Runtime Layer                       │
│ - Node.js v22                       │
│ - Rust toolchain                    │
│ - AWS CLI v2                        │
├─────────────────────────────────────┤
│ System Layer                        │
│ - Ubuntu 22.04 LTS                  │
│ - Essential packages                │
└─────────────────────────────────────┘
```

### プロセス構成

```
developer (UID: 1000)
├── entrypoint.sh (PID: 1)
├── sleep infinity (keep-alive)
├── VS Code Server (port: 46817)
└── q chat (when active)
```

## ビルドプロセス

### Dockerfile構成

```dockerfile
FROM ubuntu:22.04 AS devcontainer

# 1. System packages installation
RUN apt-get update && apt-get install -y \
    curl wget git unzip ca-certificates sudo \
    file build-essential pkg-config libssl-dev

# 2. Node.js installation
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# 3. Rust toolchain installation
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# 4. AWS CLI installation (multi-arch)
COPY scripts/install-aws-tools.sh /tmp/
RUN chmod +x /tmp/install-aws-tools.sh && /tmp/install-aws-tools.sh

# 5. Amazon Q CLI build
RUN . ~/.cargo/env && \
    git clone https://github.com/aws/amazon-q-developer-cli.git /tmp/amazon-q-cli && \
    cd /tmp/amazon-q-cli && \
    cargo build --release --bin chat_cli && \
    cp target/release/chat_cli /usr/local/bin/q

# 6. User setup
RUN useradd -m -s /bin/bash developer && \
    usermod -aG sudo developer && \
    echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 7. Scripts and entrypoint
COPY scripts/ /usr/local/scripts/
RUN chmod +x /usr/local/scripts/*.sh

USER developer
CMD ["bash"]
```

### ビルド最適化

- **マルチステージビルド**: 不要なファイルを除外
- **レイヤーキャッシュ**: 変更頻度の低い処理を上位レイヤーに配置
- **並列ビルド**: Rustコンパイル時の並列化

## 環境変数管理

### 環境変数の流れ

```
.env file → docker-compose.yml → container environment
```

### 環境変数処理

```bash
# docker-compose.yml
env_file:
  - .env

# コンテナ内での利用
echo $AMAZON_Q_START_URL
echo $AMAZON_Q_WORKSPACE
```

### 設定優先順位

1. コンテナ内環境変数
2. docker-compose.yml の environment
3. .env ファイル
4. デフォルト値

## ファイルシステム構成

### ディレクトリ構造

```
/home/developer/
├── .aws/                    # AWS認証情報（マウント）
├── .config/amazonq/         # Amazon Q設定（マウント）
├── .vscode-server/          # VS Code Server
├── workspace/               # ワークスペース（マウント）
└── vscode/                  # VSCode設定（マウント）

/usr/local/
├── bin/q                    # Amazon Q CLI
├── bin/aws                  # AWS CLI（シンボリックリンク）
└── scripts/                 # 管理スクリプト
    ├── auth-amazon-q.sh
    ├── check-auth.sh
    ├── entrypoint.sh
    └── install-aws-tools.sh

/opt/aws-cli/
├── x86_64/                  # x86_64版AWS CLI
└── aarch64/                 # ARM64版AWS CLI
```

### マウント戦略

| タイプ | パス | 用途 | 永続化 |
|--------|------|------|--------|
| bind | workspace | 開発ファイル | ○ |
| bind | .aws | 認証情報 | ○ |
| bind | amazonq | Q設定 | ○ |
| bind | .vscode | エディタ設定 | ○ |

## スクリプト仕様

### entrypoint.sh

```bash
#!/bin/bash

# デバッグ情報出力
echo "=== Entrypoint Debug Start ==="
echo "User: $(whoami)"
echo "UID: $(id -u)"
echo "Home: $HOME"
echo "PWD: $(pwd)"

# Amazon Q設定
setup_amazon_q() {
    if command -v q >/dev/null 2>&1; then
        echo "✓ Amazon Q CLI found"
        q --version || echo "Warning: q --version failed"
    else
        echo "✗ Amazon Q CLI not found"
    fi
    
    if [ -n "$AMAZON_Q_START_URL" ]; then
        echo "Amazon Q Start URL: $AMAZON_Q_START_URL"
    fi
}

# メイン処理
main() {
    /usr/local/scripts/check-auth.sh || echo "Warning: check-auth.sh failed"
    
    if [ $# -eq 0 ]; then
        exec bash
    else
        exec "$@"
    fi
}

main "$@"
```

### install-aws-tools.sh

```bash
#!/bin/bash

set -e

mkdir -p /opt/aws-cli

HOST_ARCH=$(uname -m)
if [ "$HOST_ARCH" = "arm64" ] || [ "$HOST_ARCH" = "aarch64" ]; then
    # ARM64版インストール
    curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2-arm.zip"
    unzip awscliv2-arm.zip
    ./aws/install --install-dir /opt/aws-cli/aarch64 --bin-dir /opt/aws-cli/aarch64/bin
    ln -sf /opt/aws-cli/aarch64/bin/aws /usr/local/bin/aws
else
    # x86_64版インストール
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2-x86.zip"
    unzip awscliv2-x86.zip
    ./aws/install --install-dir /opt/aws-cli/x86_64 --bin-dir /opt/aws-cli/x86_64/bin
    ln -sf /opt/aws-cli/x86_64/bin/aws /usr/local/bin/aws
fi
```

## 認証システム

### 認証フロー

```
1. コンテナ起動
2. entrypoint.sh実行
3. check-auth.sh実行
4. 認証状態確認
5. 未認証の場合、auth-amazon-q.sh実行を促す
```

### 認証情報管理

- **保存場所**: `~/.aws/` (ホストマウント)
- **形式**: AWS CLI標準形式
- **永続化**: ホスト側で永続化

## ネットワーク構成

### プロキシ対応

```bash
# 環境変数設定
export HTTP_PROXY=$HTTP_PROXY
export HTTPS_PROXY=$HTTPS_PROXY
export http_proxy=$HTTP_PROXY
export https_proxy=$HTTPS_PROXY
```

### 証明書管理

```bash
# CA証明書設定
export AWS_CA_BUNDLE=$AWS_CA_BUNDLE
```

## エラーハンドリング

### エラー分類

1. **ビルドエラー**: Dockerfile実行時
2. **起動エラー**: コンテナ起動時
3. **認証エラー**: Amazon Q認証時
4. **ネットワークエラー**: 外部通信時

### ログ出力

```bash
# 標準出力: 正常メッセージ
echo "✓ Success message"

# 標準エラー出力: エラーメッセージ
echo "✗ Error message" >&2

# 警告: 継続可能なエラー
echo "Warning: warning message"
```

## パフォーマンス最適化

### ビルド最適化

- **並列ビルド**: `cargo build -j$(nproc)`
- **キャッシュ活用**: Dockerレイヤーキャッシュ
- **最小イメージ**: 不要パッケージの除外

### 実行時最適化

- **メモリ使用量**: 最小限のプロセス
- **ディスクI/O**: キャッシュマウント使用
- **ネットワーク**: Keep-alive接続

## セキュリティ実装

### 権限管理

```bash
# 非rootユーザー実行
USER developer

# sudo権限（開発用）
echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
```

### ファイル権限

```bash
# スクリプト実行権限
chmod +x /usr/local/scripts/*.sh

# 設定ファイル権限
chmod 600 ~/.aws/credentials
```

## 監視・ログ

### ヘルスチェック

```bash
# プロセス確認
ps aux | grep -E "(q|aws)"

# 認証状態確認
q whoami --format json
```

### ログ管理

- **コンテナログ**: `docker logs`
- **アプリケーションログ**: 標準出力/エラー出力
- **デバッグログ**: 環境変数で制御
