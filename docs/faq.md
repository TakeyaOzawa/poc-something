# よくある質問（FAQ）

## 基本的な質問

### Q1: Amazon Q DevContainerとは何ですか？

A: Amazon Q CLIをDocker環境で実行するためのDevContainer環境です。VSCodeと統合され、一貫した開発環境を提供します。

### Q2: どのような利点がありますか？

A: 
- **環境の一貫性**: どのマシンでも同じ環境で実行
- **簡単セットアップ**: 複雑な依存関係を自動解決
- **分離された環境**: ホストシステムに影響を与えない
- **バージョン管理**: 環境設定もGitで管理可能

### Q3: 対応プラットフォームは？

A: 
- **アーキテクチャ**: x86_64, ARM64 (Apple Silicon)
- **OS**: macOS, Linux, Windows (WSL2)
- **Docker**: Docker Desktop 4.0以降

## セットアップ関連

### Q4: 初回セットアップにどのくらい時間がかかりますか？

A: 
- **初回ビルド**: 5-15分（ネットワーク速度とマシンスペックに依存）
- **2回目以降**: 1-2分（キャッシュ利用）

### Q5: .envファイルの設定項目は？

A: 必須項目:
```bash
AMAZON_Q_WORKSPACE=/path/to/your/workspace
AMAZON_Q_START_URL=https://your-company.awsapps.com/start
```

オプション項目:
```bash
HTTP_PROXY=http://proxy:8080
HTTPS_PROXY=http://proxy:8080
```

### Q6: プロキシ環境での設定方法は？

A: `.env`ファイルにプロキシ設定を追加:
```bash
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
```

## 使用方法

### Q7: Amazon Q CLIの基本的な使い方は？

A: 
```bash
# 認証
q login --license pro --identity-provider "https://your-sso-url" --region "us-east-1"

# チャット開始
q chat

# 認証状態確認
q whoami

# バージョン確認
q --version
```

### Q8: 管理スクリプトの使い方は？

A: 
```bash
./manage.sh start      # コンテナ開始
./manage.sh stop       # コンテナ停止
./manage.sh restart    # コンテナ再起動
./manage.sh shell      # シェル接続
./manage.sh auth       # 認証実行
./manage.sh chat       # チャット開始
./manage.sh auth-status # 認証状態確認
./manage.sh logs       # ログ表示
./manage.sh ps         # コンテナ状態
./manage.sh build      # ビルド実行
./manage.sh config     # 設定確認
./manage.sh clean      # 完全削除
```

### Q9: ファイルの永続化はどうなっていますか？

A: 以下がマウントされ永続化されます:
- ワークスペースディレクトリ
- AWS認証情報（~/.aws）
- Amazon Q設定（./amazonq）
- VSCode設定（./.vscode）

## トラブルシューティング

### Q10: 「q: command not found」エラーが出ます

A: 
1. コンテナが正常にビルドされているか確認
2. パスが正しく設定されているか確認
3. 手動でパスを追加: `export PATH=$PATH:/usr/local/bin`

### Q11: 認証に失敗します

A: 
1. SSO URLが正しいか確認
2. ネットワーク接続を確認
3. プロキシ設定が必要な場合は設定
4. 手動認証を試行: `./manage.sh auth`

### Q12: DevContainerが起動しません

A: 
1. Docker Desktopが起動しているか確認
2. `.env`ファイルの設定を確認
3. ワークスペースパスが存在するか確認
4. 完全リセットを実行: `./manage.sh clean`

### Q13: ビルドが遅いです

A: 
- **初回**: Rustコンパイルのため時間がかかります（正常）
- **2回目以降**: Dockerキャッシュが効くため高速化
- **高速化**: SSDの使用、メモリ増設、Docker設定最適化

## 高度な使用方法

### Q14: カスタムエージェントの設定方法は？

A: `amazonq/agents/default-agent.json`を編集:
```json
{
  "name": "custom-agent",
  "description": "カスタムエージェント",
  "allowedTools": ["fs_read", "fs_write", "execute_bash"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": ["~/workspace/**"]
    }
  }
}
```

### Q15: CI/CDでの使用方法は？

A: `.github/workflows/ci.yml`を参照:
```yaml
- name: Build DevContainer
  run: docker build -f .devcontainer/Dockerfile -t amazon-q-devcontainer .

- name: Run Tests
  run: docker run --rm -v $PWD:/workspace amazon-q-devcontainer /workspace/tests/test.sh
```

### Q16: 複数のワークスペースを使い分けたい

A: 
1. 各ワークスペース用の`.env`ファイルを作成
2. `AMAZON_Q_WORKSPACE`を変更
3. コンテナを再起動

### Q17: デバッグ方法は？

A: 
```bash
# デバッグモードでコンテナ起動
docker compose run --rm amazon-q bash

# ログ確認
./manage.sh logs

# 設定確認
./manage.sh config

# コンテナ状態確認
./manage.sh ps
```

## セキュリティ

### Q18: セキュリティ上の注意点は？

A: 
- AWS認証情報は適切に管理
- プロダクション環境での使用は慎重に
- 機密ファイルのマウントに注意
- エージェント設定でツール権限を制限

### Q19: 証明書の設定方法は？

A: 
1. 証明書ファイルを適切な場所に配置
2. `.env`で`AWS_CA_BUNDLE`を設定
3. コンテナ内で証明書が正しくマウントされているか確認

## パフォーマンス

### Q20: パフォーマンスを向上させる方法は？

A: 
- **Docker設定**: メモリとCPUを増加
- **ストレージ**: SSDの使用
- **キャッシュ**: Dockerレイヤーキャッシュの活用
- **ネットワーク**: 高速なインターネット接続
