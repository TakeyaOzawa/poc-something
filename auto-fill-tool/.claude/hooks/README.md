# Claude Code Hooks & Automation

このディレクトリは、Claudeでの開発ワークフロー自動化のガイドを提供します。

**重要**: 実際のスクリプトは `scripts/coding-helpers/` に統一配置されており、生成AI（Claude、Kiro等）が共通で使用できるように管理されています。

## 📋 利用可能なワークフロー

### 1. 品質ゲート完全チェック

開発完了時の6ステップ品質保証プロセスを実行します。

```bash
cd auto-fill-tool
./scripts/coding-helpers/quality-gate.sh
```

**実行内容**:
- カバレッジ測定 → テスト実行 → Lint修正 → Lintチェック → 型チェック → ビルド
- Slack通知統合（環境変数設定時）

### 2. カバレッジチェック & テスト強化

テストカバレッジを測定し、90%未満の場合はテスト追加ガイドを提供します。

```bash
cd auto-fill-tool
./scripts/coding-helpers/coverage-check.sh
```

**提供内容**:
- カバレッジ測定実行
- 正常系・異常系・境界値・分岐網羅テストのガイド

### 3. Gitコミット品質チェック

コミット前にアーキテクチャ準拠と品質基準を確認します。

```bash
cd auto-fill-tool
./scripts/coding-helpers/git-commit-quality.sh
```

**チェック項目**:
- アーキテクチャ準拠確認
- 変更ファイルのテスト実行
- Lintチェック、型チェック、循環依存チェック

### 4. コミット前自動レビュー

大量ファイル変更時の自動レビューを実行します。

```bash
cd auto-fill-tool
./scripts/coding-helpers/pre-commit-review.sh
```

**検出項目**:
- デバッグコード残存
- 機密情報混入
- 不要ファイル追加
- 空白変更問題

### 5. エラーハンドリング強化

エラーコード管理とStandardError使用のガイドを提供します。

```bash
cd auto-fill-tool
./scripts/coding-helpers/error-handling-check.sh
```

**提供内容**:
- StandardErrorクラス使用ガイド
- エラーコード管理システムの説明

### 6. 多言語リソース更新

i18nメッセージキーの追加・更新を行います。

```bash
cd auto-fill-tool
./scripts/coding-helpers/i18n-resource-update.sh
```

**管理内容**:
- メッセージキー命名規則
- 英語・日本語の整合性チェック

### 7. 統合テスト実行

すべてのhooksの実行可能性をテストします。

```bash
cd auto-fill-tool
./scripts/coding-helpers/run-all-hooks.sh
```

**テスト内容**:
- 全スクリプトの実行可能性確認
- Kiroとの機能比較表示

## 🔔 Slack通知設定

環境変数を設定することで、Slack通知が有効になります：

```bash
export MY_SLACK_OAUTH_TOKEN='xoxb-your-bot-token'
export MY_SLACK_USER_ID='U1234567890'
```

## 🔄 推奨Gitワークフロー

```bash
# 1. 変更をステージング
git add .

# 2. コミット前レビュー実行
./scripts/coding-helpers/pre-commit-review.sh

# 3. コミット品質チェック実行
./scripts/coding-helpers/git-commit-quality.sh

# 4. 問題がなければコミット
git commit -m "feat(domain): 新機能を追加"

# 5. プッシュ
git push origin feature/new-feature
```

## 🎯 Kiroとの連携

これらのスクリプトは、Kiro Agent Hooksと同等の機能を提供します：

| Claude Script | Kiro Agent Hook | 実行方法 |
|---------------|-----------------|----------|
| `quality-gate.sh` | ✅ 品質ゲート実行 | コマンドライン vs UIボタン |
| `coverage-check.sh` | 📊 カバレッジチェック & テスト強化 | コマンドライン vs UIボタン |
| `git-commit-quality.sh` | 📝 コミット品質チェック | コマンドライン vs UIボタン |
| `pre-commit-review.sh` | 🔍 コミット前レビュー実行 | コマンドライン vs UIボタン |
| `error-handling-check.sh` | 🚨 エラーハンドリング強化 | コマンドライン vs UIボタン |
| `i18n-resource-update.sh` | 🌍 多言語リソース更新 | コマンドライン vs UIボタン |

## 📚 関連ドキュメント

- **詳細ガイド**: `scripts/coding-helpers/README.md`
- **品質基準**: `.kiro/steering/quality-standards.md`
- **技術スタック**: `.kiro/steering/tech.md`
- **MCP統合**: `.kiro/steering/mcp-integration.md`

## 💡 使用のコツ

### Claude使用時
1. プロジェクトルート（`auto-fill-tool`）で実行
2. 環境変数設定でSlack通知を有効化
3. 実行権限エラーの場合は `chmod +x scripts/coding-helpers/*.sh`

### 開発完了時の推奨フロー
```bash
# 品質ゲート実行
./scripts/coding-helpers/quality-gate.sh

# 問題があれば修正後、再実行
./scripts/coding-helpers/quality-gate.sh
```

### コミット前の推奨フロー
```bash
# レビュー実行
./scripts/coding-helpers/pre-commit-review.sh

# 品質チェック実行
./scripts/coding-helpers/git-commit-quality.sh

# 問題なければコミット
git commit -m "..."
```
