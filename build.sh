#!/bin/bash

set -e

IMAGE_NAME="amazon-q-devcontainer"

echo "Building Amazon Q DevContainer image..."

docker build -t $IMAGE_NAME .devcontainer/

echo "Build completed successfully!"
echo "Image: $IMAGE_NAME"
