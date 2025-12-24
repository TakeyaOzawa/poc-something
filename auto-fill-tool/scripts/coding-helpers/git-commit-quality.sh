#!/bin/bash
set -e

echo "## 📝 Gitコミット品質チェックを開始します"
echo ""
echo "### チェック項目"
echo "1. アーキテクチャ準拠確認"
echo "2. 品質メトリクス確認"
echo "3. テスト実行"
echo "4. Lintチェック"
echo "5. コミットメッセージ規約確認"
echo ""

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]コミット品質チェック開始" "Gitコミット前の品質チェックを開始しました。"
fi

echo "## 🏗️ ステップ1: アーキテクチャ準拠確認"
npm run lint:architecture

echo ""
echo "## 🧪 ステップ2: 変更ファイルのテスト実行"
# ステージされたTypeScriptファイルに関連するテストを実行
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=AM | grep '\.ts$' | grep -v '\.test\.ts$' | head -5)
if [ -n "$CHANGED_FILES" ]; then
    echo "変更されたファイル:"
    echo "$CHANGED_FILES"
    echo ""

    # ディレクトリごとにテストを実行
    echo "$CHANGED_FILES" | xargs -I {} dirname {} | sort | uniq | xargs -I {} npm test -- --testPathPattern="{}" --passWithNoTests
else
    echo "テスト対象のTypeScriptファイルの変更はありません"
fi

echo ""
echo "## 🔍 ステップ3: 変更ファイルのLintチェック"
CHANGED_TS_FILES=$(git diff --cached --name-only --diff-filter=AM | grep '\.ts$')
if [ -n "$CHANGED_TS_FILES" ]; then
    echo "Lintチェック対象ファイル:"
    echo "$CHANGED_TS_FILES"
    echo ""
    echo "$CHANGED_TS_FILES" | xargs npm run lint --
else
    echo "Lintチェック対象のTypeScriptファイルの変更はありません"
fi

echo ""
echo "## 📊 ステップ4: 型チェック"
npm run type-check

echo ""
echo "## 🎯 ステップ5: Clean Architecture違反チェック"
echo ""
echo "### 依存関係の方向確認"
echo "以下の依存関係違反がないかチェックします："
echo "- Domain層 → 他レイヤー（禁止）"
echo "- Application層 → Infrastructure/Presentation層（禁止）"
echo "- 循環依存（禁止）"
echo ""
npm run analyze:circular

echo ""
echo "## ✅ コミット品質チェック完了"
echo ""
echo "### 📋 確認項目"
echo "- [ ] アーキテクチャルール: 0エラー"
echo "- [ ] 変更ファイルのテスト: すべて合格"
echo "- [ ] Lintチェック: 0エラー、0警告"
echo "- [ ] 型チェック: エラーなし"
echo "- [ ] 循環依存: 検出されず"
echo ""
echo "### 🚨 問題が検出された場合の対処"
echo ""
echo "#### アーキテクチャ違反"
echo "```typescript"
echo "// ❌ 悪い例: Domain層で外部ライブラリを直接使用"
echo "import axios from 'axios'; // Domain層では禁止"
echo ""
echo "// ✅ 良い例: Domain層でポートインターフェースを定義"
echo "export interface HttpClient {"
echo "  get(url: string): Promise<any>;"
echo "}"
echo "```"
echo ""
echo "#### Lint違反"
echo "```typescript"
echo "// eslint-disable-next-line complexity -- 複数の同期方向に対する結果メッセージフォーマット処理のため分岐が必要。リファクタリングすると可読性が低下する。"
echo "function complexFunction() {"
echo "  // ..."
echo "}"
echo "```"
echo ""
echo "### 📝 推奨コミットメッセージ"
echo "```"
echo "feat(domain): User エンティティにバリデーション機能を追加"
echo ""
echo "- メールアドレスの形式チェックを実装"
echo "- パスワード強度の検証ロジックを追加"
echo "- StandardError を使用したエラーハンドリング"
echo ""
echo "Tested: UserEntity.test.ts で 15 テストケース追加"
echo "Coverage: 95.2% → 96.1% に向上"
echo ""
echo "Closes #456"
echo "```"
echo ""
echo "すべての品質チェックが通過しましたか？コミットを続行できます。"

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]コミット品質チェック完了" "Gitコミット前の品質チェックが完了しました。すべての基準をクリアした場合はコミット可能です。"
fi
