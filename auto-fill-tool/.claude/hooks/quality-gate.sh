#!/bin/bash
set -e

echo "## ✅ 品質ゲート完全チェックを開始します"
echo ""
echo "### チェック項目"
echo "1. カバレッジ測定"
echo "2. テスト実行"
echo "3. Lint自動修正"
echo "4. Lintチェック"
echo "5. 型チェック"
echo "6. ビルド実行"
echo ""

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]品質ゲート開始" "6ステップ品質保証プロセスを開始しました。"
fi

echo "## 📊 ステップ1: カバレッジ測定"
npm run test:coverage

echo ""
echo "## 🧪 ステップ2: テスト実行"
npm test

echo ""
echo "## 🔧 ステップ3: Lint自動修正"
npm run lint:fix && npm run format

echo ""
echo "## 🔍 ステップ4: Lintチェック"
npm run lint

echo ""
echo "## 📊 ステップ5: 型チェック"
npm run type-check

echo ""
echo "## 🏗️ ステップ6: ビルド実行"
npm run build

echo ""
echo "## ✅ 品質ゲート完了"
echo ""
echo "### 📋 確認項目"
echo "- [ ] カバレッジ: 修正範囲が90%以上"
echo "- [ ] テスト: 0 failed, 意図的なskipのみ"
echo "- [ ] Lint: 0 errors, 0 warnings"
echo "- [ ] 型チェック: エラーなし"
echo "- [ ] ビルド: 成功、0 errors"
echo ""
echo "すべての品質基準をクリアしました！"

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]品質ゲート完了" "6ステップ品質保証プロセスが完了しました。すべての基準をクリアしています。"
fi
