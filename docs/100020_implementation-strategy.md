# 実装戦略

## 概要

Amazon Q DevContainer環境の実装戦略と技術的判断について説明します。

## アーキテクチャ選択

### DevContainer + Docker Compose

**選択理由**:
- **開発体験**: VSCodeとの統合による優れたDX
- **環境一貫性**: どのマシンでも同じ環境を再現
- **設定管理**: コードとして環境設定を管理
- **拡張性**: 複数サービスへの拡張が容易

**代替案との比較**:

| 方式 | メリット | デメリット | 採用判断 |
|------|----------|------------|----------|
| DevContainer | VSCode統合、設定管理 | Docker依存 | ✅ 採用 |
| 直接インストール | 高速、軽量 | 環境差異、管理困難 | ❌ |
| VM | 完全分離 | リソース消費大 | ❌ |

### マルチアーキテクチャ対応

**実装方針**:
```bash
# アーキテクチャ検出
HOST_ARCH=$(uname -m)
if [ "$HOST_ARCH" = "arm64" ] || [ "$HOST_ARCH" = "aarch64" ]; then
    # ARM64版AWS CLI
    curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip"
else
    # x86_64版AWS CLI
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip"
fi
```

**対応アーキテクチャ**:
- x86_64 (Intel/AMD)
- ARM64 (Apple Silicon, ARM servers)

## ビルド戦略

### レイヤー最適化

```dockerfile
# 1. 基本システム（変更頻度: 低）
FROM ubuntu:22.04 AS devcontainer
RUN apt-get update && apt-get install -y ...

# 2. 言語ランタイム（変更頻度: 低）
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. ツールインストール（変更頻度: 中）
COPY scripts/install-aws-tools.sh /tmp/
RUN /tmp/install-aws-tools.sh

# 4. アプリケーション（変更頻度: 高）
RUN git clone https://github.com/aws/amazon-q-developer-cli.git
RUN cargo build --release
```

### キャッシュ戦略

- **Dockerレイヤーキャッシュ**: 変更頻度順にレイヤー配置
- **Rustビルドキャッシュ**: `target/`ディレクトリの活用
- **パッケージキャッシュ**: `apt-get`キャッシュの保持

## 環境変数管理

### 設定階層

```
1. .env ファイル（開発者設定）
   ↓
2. docker-compose.yml（環境固有設定）
   ↓
3. Dockerfile（デフォルト設定）
   ↓
4. entrypoint.sh（実行時設定）
```

### 設定パターン

```yaml
# docker-compose.yml
services:
  amazon-q-dev:
    env_file:
      - .env  # ファイルから読み込み
    environment:
      - AMAZON_Q_DANGEROUS_MODE=true  # 直接指定
    volumes:
      - ${AMAZON_Q_WORKSPACE}:/home/developer/workspace  # 変数展開
```

## セキュリティ戦略

### 最小権限原則

```dockerfile
# 非rootユーザーで実行
RUN useradd -m -s /bin/bash developer
USER developer

# 必要最小限のsudo権限
RUN echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
```

### エージェント権限制御

```json
{
  "name": "development-assistant",
  "allowedTools": ["fs_read", "fs_write", "execute_bash"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": ["~/workspace/**"],
      "deniedPaths": ["~/workspace/production/**"]
    },
    "execute_bash": {
      "deniedCommands": ["git push .*", "rm -rf .*"]
    }
  }
}
```

### 証明書管理

```bash
# 企業証明書の自動設定
if [ -n "$AWS_CA_BUNDLE" ]; then
    export AWS_CA_BUNDLE="$AWS_CA_BUNDLE"
    export REQUESTS_CA_BUNDLE="$AWS_CA_BUNDLE"
    export SSL_CERT_FILE="$AWS_CA_BUNDLE"
fi
```

## エラーハンドリング戦略

### グレースフルデグラデーション

```bash
# 認証エラーでも継続実行
setup_amazon_q() {
    if command -v q >/dev/null 2>&1; then
        echo "✓ Amazon Q CLI found"
        q --version || echo "Warning: q --version failed"
    else
        echo "✗ Amazon Q CLI not found"
    fi
}

# エラーがあっても続行
setup_amazon_q || echo "Warning: setup_amazon_q failed"
```

### エラー分類と対応

| エラー分類 | 対応戦略 | 実装 |
|------------|----------|------|
| 致命的エラー | 即座に停止 | `set -e` |
| 回復可能エラー | 警告表示して継続 | `|| echo "Warning"` |
| 設定エラー | デフォルト値使用 | `${VAR:-default}` |

## パフォーマンス戦略

### ビルド時間最適化

```dockerfile
# 並列ビルド
ENV MAKEFLAGS="-j$(nproc)"
ENV CARGO_BUILD_JOBS="$(nproc)"

# キャッシュマウント（BuildKit）
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y ...
```

### 実行時最適化

```yaml
# docker-compose.yml
services:
  amazon-q-dev:
    volumes:
      - ${AMAZON_Q_WORKSPACE}:/home/developer/workspace:cached  # キャッシュマウント
    shm_size: 2gb  # 共有メモリ増加
```

## 拡張性戦略

### プラグインアーキテクチャ

```bash
# scripts/ディレクトリ構造
scripts/
├── core/           # コア機能
├── plugins/        # プラグイン
└── hooks/          # フック機能
```

### 設定の外部化

```yaml
# 設定ファイルの分離
configs/
├── development.yml
├── staging.yml
└── production.yml
```

## テスト戦略

### CI/CD統合

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    strategy:
      matrix:
        platform: [linux/amd64, linux/arm64]
    steps:
      - name: Build DevContainer
        run: docker buildx build --platform ${{ matrix.platform }} .
      
      - name: Integration Test
        run: docker run --rm -v $PWD:/workspace test-image /workspace/tests/test.sh
```

### テスト分類

1. **ユニットテスト**: スクリプト単体テスト
2. **統合テスト**: コンテナ全体テスト
3. **E2Eテスト**: 実際の使用シナリオテスト

## 運用戦略

### ログ管理

```bash
# 構造化ログ
log_info() {
    echo "$(date -Iseconds) [INFO] $*"
}

log_error() {
    echo "$(date -Iseconds) [ERROR] $*" >&2
}
```

### 監視

```bash
# ヘルスチェック
healthcheck() {
    # Amazon Q CLI確認
    command -v q >/dev/null || return 1
    
    # 認証状態確認
    q whoami --format json >/dev/null 2>&1 || return 1
    
    return 0
}
```

## 移行戦略

### 段階的移行

1. **Phase 1**: 基本環境構築
2. **Phase 2**: 認証システム統合
3. **Phase 3**: エージェント機能追加
4. **Phase 4**: CI/CD統合

### 後方互換性

```bash
# 旧バージョンとの互換性維持
if [ -f ".env.legacy" ]; then
    echo "Warning: Using legacy .env format"
    source .env.legacy
fi
```

## 技術的負債管理

### 定期的な見直し

- **依存関係更新**: 月次でのセキュリティアップデート
- **パフォーマンス監視**: ビルド時間、起動時間の追跡
- **コード品質**: 静的解析ツールの導入

### ドキュメント管理

- **設定変更**: 必ずドキュメント更新
- **トラブルシューティング**: 新しい問題の追加
- **FAQ**: ユーザーフィードバックの反映
