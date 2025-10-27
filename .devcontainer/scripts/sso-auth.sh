#!/bin/bash

setup_auth() {
    local start_url="${1:-$AMAZON_Q_START_URL}"
    
    if [ -z "$start_url" ]; then
        echo "Error: Amazon Q start URL not provided"
        echo "Usage: $0 setup <start-url>"
        echo "Or set AMAZON_Q_START_URL environment variable"
        exit 1
    fi
    
    echo "Setting up Amazon Q authentication..."
    echo "Start URL: $start_url"
    
    # AWS SSOディレクトリの権限設定
    mkdir -p ~/.aws/sso/cache
    chmod 700 ~/.aws/sso
    chmod 600 ~/.aws/sso/cache/* 2>/dev/null || true
    
    q auth login --start-url "$start_url"
    
    echo "Authentication completed. Credentials will persist across container restarts."
}

check_auth() {
    if q auth status >/dev/null 2>&1; then
        echo "✓ Amazon Q authentication is active"
        q auth status
    else
        echo "✗ Amazon Q authentication required"
        echo "Run: ./.devcontainer/scripts/sso-auth.sh setup"
    fi
}

case "$1" in
    setup)
        setup_auth "$2"
        ;;
    status)
        check_auth
        ;;
    *)
        echo "Usage: $0 {setup|status} [start-url]"
        echo "  setup  - Setup authentication (optionally with start-url)"
        echo "  status - Check authentication status"
        exit 1
        ;;
esac
