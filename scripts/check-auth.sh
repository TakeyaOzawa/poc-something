#!/bin/bash

echo "=== Amazon Q Authentication Status ==="

if command -v q >/dev/null 2>&1; then
    echo "Amazon Q CLI: $(q --version)"
    
    if q whoami --format json >/dev/null 2>&1; then
        echo "✅ Authentication: Active"
        q whoami
        echo ""
        echo "🎉 Ready to use 'q chat'!"
    else
        echo "❌ Authentication: Required"
        echo ""
        if [ -n "$AMAZON_Q_START_URL" ]; then
            echo "Amazon Q Start URL configured: $AMAZON_Q_START_URL"
            echo ""
            echo "🚀 To complete setup, run:"
            echo "   /usr/local/scripts/auth-amazon-q.sh"
            echo ""
        else
            echo "⚠️  AMAZON_Q_START_URL not set"
            echo ""
            echo "🚀 To complete setup, run:"
            echo "   q login --license pro --identity-provider \"https://your-company.awsapps.com/start\" --region \"us-east-1\" --use-device-code"
            echo ""
        fi
    fi
else
    echo "❌ Amazon Q CLI not found"
fi
