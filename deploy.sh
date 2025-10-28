#!/bin/bash

set -e

# デフォルト値
CONTAINER_NAME="amazon-q-dev"
IMAGE_NAME="amazon-q-devcontainer"

# 引数処理
AMAZON_Q_WORKSPACE="${1:-$AMAZON_Q_DEFAULT_WORKSPACE}"

echo "Deploying Amazon Q DevContainer..."
echo "Workspace path: $AMAZON_Q_WORKSPACE"

# .envファイルの存在確認
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    cp .env.example .env
fi

# 既存コンテナの停止・削除
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Stopping and removing existing container..."
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
fi

# コンテナ起動
docker run -d \
    --name $CONTAINER_NAME \
    --env-file .env \
    -v "${HOME}/.aws:/home/developer/.aws" \
    -v "${AMAZON_Q_WORKSPACE}:/workspace" \
    -w /workspace \
    $IMAGE_NAME \
    sleep infinity

echo "Container started successfully!"
echo "To connect: docker exec -it $CONTAINER_NAME bash"
echo "To stop: docker stop $CONTAINER_NAME"
