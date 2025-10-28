#!/bin/bash

set -e

echo "Building Amazon Q DevContainer with Docker Compose..."

# .envファイルの存在確認
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "Error: .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# TARGET_WORKSPACE=${1:-${AMAZON_Q_WORKSPACE:-${AMAZON_Q_DEFAULT_WORKSPACE}}}
# WORK_HASH=$(echo "${TARGET_WORKSPACE}_$(date)" | md5sum | cut -c1-4)
# export AMAZON_Q_WORKSPACE="$TARGET_WORKSPACE"

# Docker Composeでビルド
cd q
docker compose build

echo "Build completed successfully!"
echo "Service: amazon-q"
echo ""
echo "To start the container:"
echo "  ./manage.sh start"
echo ""
echo "To use with DevContainer:"
echo "  Open in VS Code and use 'Dev Containers: Reopen in Container'"
