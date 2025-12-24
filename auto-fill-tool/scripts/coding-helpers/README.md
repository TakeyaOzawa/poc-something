# Coding Helpers Scripts

このディレクトリには、生成AI（Claude、Kiro等）が開発作業用に使用できるスクリプトが配置されています。

## 📋 品質保証スクリプト

### 🎯 品質ゲート完全チェック
```bash
./scripts/coding-helpers/quality-gate.sh
```
- 6ステップの品質保証プロセスを実行
- カバレッジ測定 → テスト実行 → Lint修正 → Lintチェック → 型チェック → ビルド

### 📊 カバレッジチェック & テスト強化
```bash
./scripts/coding-helpers/coverage-check.sh
```
- テストカバレッジを測定
- 90%未満の場合のテスト追加ガイドを提供

### 📝 Gitコミット品質チェック
```bash
./scripts/coding-helpers/git-commit-quality.sh
```
- アーキテクチャ準拠確認
- 変更ファイルのテスト実行
- Lintチェック、型チェック、循環依存チェック

### 🔍 コミット前自動レビュー
```bash
./scripts/coding-helpers/pre-commit-review.sh
```
- デバッグコード検出
- 機密情報検出
- 不要ファイル検出
- 空白変更問題検出

### 🚨 エラーハンドリング強化
```bash
./scripts/coding-helpers/error-handling-check.sh
```
- StandardErrorクラス使用ガイド
- エラーコード管理システムの説明

### 🌍 多言語リソース更新
```bash
./scripts/coding-helpers/i18n-resource-update.sh
```
- i18nメッセージキーの管理
- 英語・日本語の整合性チェック

### 🧪 統合テスト実行
```bash
./scripts/coding-helpers/run-all-hooks.sh
```
- すべてのhooksの実行可能性をテスト
- Kiroとの機能比較表示

## 🔧 開発支援スクリプト

### Python修正スクリプト
- `add_result_imports.py` - Result型のimport追加
- `fix_all_create_calls.py` - create呼び出しの修正
- `fix_all_issues.py` - 一般的な問題の修正
- `fix_all_mocks.py` - モック関連の修正
- `fix_complex_mocks.py` - 複雑なモックの修正
- `fix_idgenerator.py` - IDGenerator関連の修正
- `fix_mocks.py` - モック修正
- `fix_storagesyncconfig.py` - StorageSyncConfig修正
- `fix-tests.py` - テスト修正

### Shell修正スクリプト
- `batch_integrate.sh` - バッチ統合処理
- `fix_constructors.sh` - コンストラクタ修正
- `fix_missing_braces.sh` - 括弧不足の修正
- `integrate_remaining.sh` - 残り統合処理
- `validate-and-test.sh` - 検証とテスト実行

### JavaScript/Node.js スクリプト
- `debug-log-level.js` - ログレベルのデバッグ設定
- `debug-password.js` - パスワード関連のデバッグ
- `reset-log-level.js` - ログレベルのリセット

### PowerShell環境構築スクリプト
- `setup-containers.ps1` - コンテナ環境構築
- `setup-monitoring.ps1` - 監視環境構築
- `setup-windows11-dev-environment.ps1` - Windows11開発環境構築
- `setup-wsl2-ubuntu.ps1` - WSL2 Ubuntu環境構築

## 🎯 生成AI使用ガイド

### Claude使用時
```bash
# プロジェクトルートで実行
cd auto-fill-tool

# 品質チェック実行
./scripts/coding-helpers/quality-gate.sh

# コミット前チェック
./scripts/coding-helpers/pre-commit-review.sh
./scripts/coding-helpers/git-commit-quality.sh
```

### Kiro使用時
- Kiroパネルの Agent Hooks セクションからボタンをクリック
- 同等の機能がUI統合されている

### 共通の環境変数設定
```bash
# Slack通知用
export MY_SLACK_OAUTH_TOKEN='xoxb-your-bot-token'
export MY_SLACK_USER_ID='U1234567890'
```

## 🔄 推奨ワークフロー

### 開発完了時
1. `./scripts/coding-helpers/quality-gate.sh` - 品質ゲート実行
2. 問題があれば修正
3. 再度品質ゲート実行

### コミット前
1. `git add .` - 変更をステージング
2. `./scripts/coding-helpers/pre-commit-review.sh` - 自動レビュー
3. `./scripts/coding-helpers/git-commit-quality.sh` - 品質チェック
4. `git commit -m "..."` - コミット実行

### カバレッジ不足時
1. `./scripts/coding-helpers/coverage-check.sh` - カバレッジ確認
2. ガイドに従ってテストケース追加
3. 再度カバレッジ確認

## 📊 品質基準

- **テストカバレッジ**: 90%以上
- **Lintエラー**: 0件
- **型エラー**: 0件
- **循環依存**: 0件
- **アーキテクチャ違反**: 0件

## 🚨 注意事項

- スクリプト実行前に必ずプロジェクトルート（`auto-fill-tool`）にいることを確認
- 実行権限が必要な場合は `chmod +x` で付与
- 環境変数が設定されていない場合、一部機能（Slack通知等）は無効化される
- 一部のnpmスクリプトが不足している場合、該当機能はスキップされる

## 🔗 関連ドキュメント

- **Kiro Agent Hooks**: `.kiro/hooks/` - JSON設定による自動実行
- **Claude設定**: `.claude/hooks/` - 手動実行ガイド
- **品質基準**: `.kiro/steering/quality-standards.md`
- **技術スタック**: `.kiro/steering/tech.md`
