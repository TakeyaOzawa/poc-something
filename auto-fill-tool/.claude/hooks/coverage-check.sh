#!/bin/bash
set -e

echo "## 📊 カバレッジチェック & テスト強化を開始します"
echo ""

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]カバレッジチェック開始" "テストカバレッジの測定とテスト強化を開始しました。"
fi

echo "## 📈 カバレッジ測定実行"
npm run test:coverage

echo ""
echo "## 🎯 カバレッジ分析"
echo ""
echo "### 目標カバレッジ"
echo "- Statements: 96%以上"
echo "- Branches: 89%以上"
echo "- Functions: 96%以上"
echo "- Lines: 96%以上"
echo "- 修正したファイル: 90%以上"
echo ""

echo "### 📝 カバレッジが90%未満の場合のテストケース追加ガイド"
echo ""
echo "#### 1. 正常系テスト"
echo "```typescript"
echo "it('should return expected result with valid input', () => {"
echo "  const result = myFunction(validInput);"
echo "  expect(result).toEqual(expectedOutput);"
echo "});"
echo "```"
echo ""
echo "#### 2. 異常系テスト"
echo "```typescript"
echo "it('should throw error with invalid input', () => {"
echo "  expect(() => myFunction(invalidInput)).toThrow(StandardError);"
echo "});"
echo "```"
echo ""
echo "#### 3. 境界値テスト"
echo "```typescript"
echo "it('should handle edge cases', () => {"
echo "  expect(myFunction(null)).toBeDefined();"
echo "  expect(myFunction(undefined)).toBeDefined();"
echo "  expect(myFunction([])).toBeDefined();"
echo "  expect(myFunction('')).toBeDefined();"
echo "});"
echo "```"
echo ""
echo "#### 4. 分岐網羅テスト"
echo "```typescript"
echo "describe('conditional branches', () => {"
echo "  it('should handle true condition', () => {"
echo "    // if分岐のtrueケース"
echo "  });"
echo "  "
echo "  it('should handle false condition', () => {"
echo "    // if分岐のfalseケース"
echo "  });"
echo "});"
echo "```"
echo ""

echo "## ✅ カバレッジチェック完了"
echo ""
echo "カバレッジレポートを確認し、90%未満の箇所があれば上記のガイドに従ってテストケースを追加してください。"

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]カバレッジチェック完了" "テストカバレッジの測定が完了しました。結果を確認してテスト強化を行ってください。"
fi
