#!/bin/bash

if [ -n "$AMAZON_Q_START_URL" ]; then
    echo "Authenticating with: $AMAZON_Q_START_URL"
    q login --license pro --identity-provider "$AMAZON_Q_START_URL" --region "${AMAZON_Q_REGION:-us-east-1}"
else
    echo "Please provide your SSO start URL:"
    read -p "Start URL: " start_url
    q login --license pro --identity-provider "$start_url" --region "${AMAZON_Q_REGION:-us-east-1}"
fi

# fs_read: ファイル読み取り（デフォルトで信頼済み）
# fs_write: ファイル作成・変更
# execute_bash: bashコマンド実行
# use_aws: AWS CLI呼び出し
# report_issue: 問題報告
# q chat --trust-tools=fs_read,fs_write,execute_bash