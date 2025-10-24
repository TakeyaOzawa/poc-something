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
    
    q auth login --start-url "$start_url"
}

case "$1" in
    setup)
        setup_auth "$2"
        ;;
    *)
        echo "Usage: $0 setup [start-url]"
        echo "If start-url is not provided, AMAZON_Q_START_URL environment variable will be used"
        exit 1
        ;;
esac
