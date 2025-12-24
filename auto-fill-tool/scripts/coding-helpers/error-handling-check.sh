#!/bin/bash
set -e

echo "## 🚨 エラーハンドリング強化を開始します"
echo ""

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]エラーハンドリング強化開始" "エラーコード管理とStandardError使用の確認を開始しました。"
fi

echo "## 📋 エラーコード一覧表示"
npm run error:list

echo ""
echo "## 🎯 StandardError使用ガイド"
echo ""
echo "### 統一エラー管理システム"
echo "- **StandardError クラス**: 型安全なエラーコード管理"
echo "- **自動メッセージキー生成**: \`E_XPATH_0001\` → \`E_XPATH_0001_USER\`, \`E_XPATH_0001_DEV\`, \`E_XPATH_0001_RESOLUTION\`"
echo "- **コンパイル時検証**: \`ValidErrorCode\` 型による完全な型安全性"
echo "- **多言語対応**: 英語・日本語の自動テンプレート生成"
echo "- **カテゴリ別管理**: XPATH, AUTH, USER, STORAGE, SYNC 等のカテゴリ対応"
echo ""
echo "### 使用例"
echo "\`\`\`typescript"
echo "// ✅ 型安全なエラー生成"
echo "throw new StandardError('E_XPATH_0001', { "
echo "  xpath: '//*[@id=\"invalid\"]',"
echo "  url: 'https://example.com' "
echo "});"
echo ""
echo "// エラーハンドリング時に直接ローカライズされたメッセージを取得"
echo "try {"
echo "  // some operation"
echo "} catch (error) {"
echo "  if (error instanceof StandardError) {"
echo "    console.log('User:', error.getUserMessage());        // ユーザー向けメッセージ"
echo "    console.log('Dev:', error.getDevMessage());          // 開発者向けメッセージ"
echo "    console.log('Resolution:', error.getResolutionMessage()); // 解決方法メッセージ"
echo "    "
echo "    // UIに表示"
echo "    showErrorToUser(error.getUserMessage());"
echo "    logErrorForDeveloper(error.getDevMessage());"
echo "  }"
echo "}"
echo "\`\`\`"
echo ""
echo "### エラーコード管理コマンド"
echo "\`\`\`bash"
echo "# エラーコード一覧表示"
echo "npm run error:list"
echo ""
echo "# 新しいエラーコード予約"
echo "npm run error:reserve XPATH"
echo ""
echo "# エラーコード整合性チェック"
echo "npm run error:validate"
echo ""
echo "# ドキュメント生成"
echo "npm run error:docs"
echo "\`\`\`"
echo ""
echo "### 🔄 自動更新システム"
echo "- **対象ファイル**: \`messages.json\`, \`StandardError.ts\`, \`i18n-port.type.ts\`"
echo "- **生成ドキュメント**: \`docs/error-codes/\` 配下の全ドキュメント"
echo "- **自動実行**: エラーコード関連ファイル変更時に自動ドキュメント更新"
echo ""

echo "## ✅ エラーハンドリング強化完了"
echo ""
echo "StandardErrorクラスを使用して、型安全で多言語対応のエラーハンドリングを実装してください。"
echo "新しいエラーコードが必要な場合は、\`npm run error:reserve <CATEGORY>\` を使用してください。"

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]エラーハンドリング強化完了" "エラーコード管理とStandardError使用の確認が完了しました。"
fi
