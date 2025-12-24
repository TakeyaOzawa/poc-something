#!/bin/bash
set -e

echo "## 🔍 コミット前自動レビューを開始します"
echo ""
echo "大量のファイル変更において、以下の不自然な修正を検出します："
echo ""
echo "### 検出項目"
echo "1. 意図しない空白・改行の大量変更"
echo "2. デバッグコード（console.log, debugger等）の残存"
echo "3. 機密情報（APIキー、パスワード等）の混入"
echo "4. 一貫性のない命名規則変更"
echo "5. 不要なファイル（.DS_Store, node_modules等）の追加"
echo "6. 大量の同一パターン変更（一括置換ミス等）"
echo "7. 意図しないファイル権限変更"
echo ""

# Git状態確認
echo "## 📊 Git状態確認"
git status --porcelain

echo ""
echo "## 📈 変更ファイル数確認"
CHANGED_FILES_COUNT=$(git diff --cached --name-only | wc -l)
echo "ステージされたファイル数: $CHANGED_FILES_COUNT"

if [ "$CHANGED_FILES_COUNT" -ge 10 ]; then
    echo "⚠️ 10ファイル以上の変更が検出されました。詳細レビューを実行します。"
else
    echo "✅ 変更ファイル数は適切です。"
fi

echo ""
echo "## 🔍 デバッグコードの検出"
DEBUG_CODE=$(git diff --cached | grep -n -E '(console\.(log|debug|info|warn|error)|debugger;|alert\(|confirm\()' || true)
if [ -n "$DEBUG_CODE" ]; then
    echo "⚠️ デバッグコードが検出されました:"
    echo "$DEBUG_CODE"
else
    echo "✅ デバッグコードは検出されませんでした"
fi

echo ""
echo "## 🔒 機密情報の検出"
SENSITIVE_INFO=$(git diff --cached | grep -n -i -E '(api[_-]?key|password|secret|token|credential)\s*[=:]\s*["'"'"'][^"'"'"'\\n]{8,}' || true)
if [ -n "$SENSITIVE_INFO" ]; then
    echo "🚨 機密情報の可能性があるコードが検出されました:"
    echo "$SENSITIVE_INFO"
else
    echo "✅ 機密情報は検出されませんでした"
fi

echo ""
echo "## 🗑️ 不要ファイルの検出"
UNWANTED_FILES=$(git diff --cached --name-only | grep -E '\.(DS_Store|log|tmp|cache)$|node_modules/|dist/|coverage/' || true)
if [ -n "$UNWANTED_FILES" ]; then
    echo "⚠️ 不要ファイルが検出されました:"
    echo "$UNWANTED_FILES"
else
    echo "✅ 不要ファイルは検出されませんでした"
fi

echo ""
echo "## 📝 空白変更の検出"
WHITESPACE_ISSUES=$(git diff --cached --check || true)
if [ -n "$WHITESPACE_ISSUES" ]; then
    echo "⚠️ 空白変更の問題が検出されました:"
    echo "$WHITESPACE_ISSUES"
else
    echo "✅ 空白変更の問題は検出されませんでした"
fi

echo ""
echo "## 🎯 コミットメッセージ規約確認"
echo ""
echo "### 推奨コミットメッセージ形式"
echo "\`\`\`"
echo "<type>(<scope>): <subject>"
echo ""
echo "<body>"
echo ""
echo "<footer>"
echo "\`\`\`"
echo ""
echo "### Type一覧"
echo "- \`feat\`: 新機能"
echo "- \`fix\`: バグ修正"
echo "- \`refactor\`: リファクタリング"
echo "- \`test\`: テスト追加/修正"
echo "- \`docs\`: ドキュメント"
echo "- \`style\`: コードスタイル"
echo "- \`perf\`: パフォーマンス改善"
echo "- \`chore\`: その他"
echo ""
echo "### 良いコミットメッセージ例"
echo "\`\`\`"
echo "feat(user-registration): ユーザー登録機能を実装"
echo ""
echo "- Domain層にUserエンティティを追加"
echo "- RegisterUserUseCaseを実装"
echo "- バリデーションロジックを追加"
echo ""
echo "Closes #123"
echo "\`\`\`"
echo ""
echo "### 🚨 レビュー結果"
echo ""
echo "上記の検出結果を確認してください。問題が発見された場合は、コミット前に修正することを強く推奨します。"
echo ""
echo "**コミットを続行しますか？**"

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]コミット前レビュー完了" "コミット前の自動レビューが完了しました。結果を確認してからコミットしてください。"
fi
