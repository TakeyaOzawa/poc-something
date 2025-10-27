#!/bin/bash

echo "Preparing build environment..."

# 証明書ファイルをscriptsディレクトリにコピー
if [ -n "$AWS_CA_BUNDLE" ] && [ -f "$AWS_CA_BUNDLE" ]; then
    echo "Copying certificate: $AWS_CA_BUNDLE"
    cp "$AWS_CA_BUNDLE" .devcontainer/scripts/netskope-cert-bundle.pem
else
    echo "No certificate file found, creating empty placeholder"
    touch .devcontainer/scripts/netskope-cert-bundle.pem
fi

echo "Build preparation complete!"
