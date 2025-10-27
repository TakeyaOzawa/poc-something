#!/bin/bash

echo "=== Amazon Q Authentication Status ==="

if command -v q >/dev/null 2>&1; then
    echo "Amazon Q CLI: $(q --version)"
    
    if q auth status >/dev/null 2>&1; then
        echo "✅ Authentication: Active"
        q auth status
        echo ""
        echo "🎉 Ready to use 'q chat'!"
        return 0
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
            echo "   q auth login --start-url https://your-company.awsapps.com/start"
            echo ""
        fi
        return 1
    fi
else
    echo "❌ Amazon Q CLI not found"
    return 1
fi
