#!/bin/bash
set -e

echo "## 🌍 多言語リソース更新を開始します"
echo ""

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]多言語リソース更新開始" "i18nメッセージキーの追加・更新を開始しました。"
fi

echo "## 📂 対象ファイル"
echo "- \`public/_locales/en/messages.json\`"
echo "- \`public/_locales/ja/messages.json\`"
echo ""

echo "## 📝 メッセージキー命名規則"
echo ""
echo "### 基本形式"
echo "\`\`\`json"
echo "{"
echo "  \"feature_action_element\": {"
echo "    \"message\": \"メッセージ内容\","
echo "    \"description\": \"このメッセージの用途説明\""
echo "  }"
echo "}"
echo "\`\`\`"
echo ""
echo "### 命名例"
echo "- \`popup_save_button\`: ポップアップの保存ボタン"
echo "- \`settings_theme_label\`: 設定画面のテーマラベル"
echo "- \`error_network_timeout\`: ネットワークタイムアウトエラー"
echo "- \`success_data_exported\`: データエクスポート成功メッセージ"
echo ""

echo "## 🎯 メッセージ追加ガイド"
echo ""
echo "### 1. 英語メッセージ追加 (en/messages.json)"
echo "\`\`\`json"
echo "{"
echo "  \"new_feature_title\": {"
echo "    \"message\": \"New Feature\","
echo "    \"description\": \"Title for the new feature section\""
echo "  },"
echo "  \"new_feature_description\": {"
echo "    \"message\": \"This feature allows you to...\","
echo "    \"description\": \"Description text for the new feature\""
echo "  }"
echo "}"
echo "\`\`\`"
echo ""
echo "### 2. 日本語メッセージ追加 (ja/messages.json)"
echo "\`\`\`json"
echo "{"
echo "  \"new_feature_title\": {"
echo "    \"message\": \"新機能\","
echo "    \"description\": \"新機能セクションのタイトル\""
echo "  },"
echo "  \"new_feature_description\": {"
echo "    \"message\": \"この機能により...\","
echo "    \"description\": \"新機能の説明テキスト\""
echo "  }"
echo "}"
echo "\`\`\`"
echo ""

echo "## 🔧 TypeScriptでの使用方法"
echo ""
echo "### I18nAdapter経由でのメッセージ取得"
echo "\`\`\`typescript"
echo "import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';"
echo ""
echo "// メッセージ取得"
echo "const title = I18nAdapter.getMessage('new_feature_title');"
echo "const description = I18nAdapter.getMessage('new_feature_description');"
echo ""
echo "// プレースホルダー付きメッセージ"
echo "const errorMsg = I18nAdapter.getMessage('error_with_details', ["
echo "  'ファイル名.txt',"
echo "  '詳細情報'"
echo "]);"
echo "\`\`\`"
echo ""

echo "## 📊 現在のメッセージファイル確認"
echo ""
echo "### 英語メッセージファイル"
if [ -f "public/_locales/en/messages.json" ]; then
    echo "✅ public/_locales/en/messages.json が存在します"
    ENGLISH_KEYS=$(jq -r 'keys[]' public/_locales/en/messages.json | wc -l)
    echo "登録済みキー数: $ENGLISH_KEYS"
else
    echo "❌ public/_locales/en/messages.json が見つかりません"
fi

echo ""
echo "### 日本語メッセージファイル"
if [ -f "public/_locales/ja/messages.json" ]; then
    echo "✅ public/_locales/ja/messages.json が存在します"
    JAPANESE_KEYS=$(jq -r 'keys[]' public/_locales/ja/messages.json | wc -l)
    echo "登録済みキー数: $JAPANESE_KEYS"
else
    echo "❌ public/_locales/ja/messages.json が見つかりません"
fi

echo ""
echo "## 🔍 メッセージキー整合性チェック"
if [ -f "public/_locales/en/messages.json" ] && [ -f "public/_locales/ja/messages.json" ]; then
    echo "英語と日本語のメッセージキーの整合性をチェック中..."

    # 英語にあって日本語にないキー
    MISSING_IN_JA=$(comm -23 <(jq -r 'keys[]' public/_locales/en/messages.json | sort) <(jq -r 'keys[]' public/_locales/ja/messages.json | sort))
    if [ -n "$MISSING_IN_JA" ]; then
        echo "⚠️ 日本語版に不足しているキー:"
        echo "$MISSING_IN_JA"
    fi

    # 日本語にあって英語にないキー
    MISSING_IN_EN=$(comm -13 <(jq -r 'keys[]' public/_locales/en/messages.json | sort) <(jq -r 'keys[]' public/_locales/ja/messages.json | sort))
    if [ -n "$MISSING_IN_EN" ]; then
        echo "⚠️ 英語版に不足しているキー:"
        echo "$MISSING_IN_EN"
    fi

    if [ -z "$MISSING_IN_JA" ] && [ -z "$MISSING_IN_EN" ]; then
        echo "✅ 英語と日本語のメッセージキーは整合性が取れています"
    fi
else
    echo "⚠️ メッセージファイルが不足しているため、整合性チェックをスキップします"
fi

echo ""
echo "## ✅ 多言語リソース更新完了"
echo ""
echo "メッセージキーの追加・更新を行う場合は、上記のガイドに従って両方の言語ファイルを更新してください。"
echo "変更後は、TypeScriptコンパイルエラーがないことを確認してください。"

# Slack通知（環境変数が設定されている場合のみ）
if [ -n "$MY_SLACK_OAUTH_TOKEN" ] && [ -n "$MY_SLACK_USER_ID" ]; then
    bash slackNotification.sh "[$]多言語リソース更新完了" "i18nメッセージキーの確認が完了しました。必要に応じて更新を行ってください。"
fi
