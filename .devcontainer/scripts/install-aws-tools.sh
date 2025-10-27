#!/bin/bash

mkdir -p /opt/aws-cli

HOST_ARCH=$(uname -m)
if [ "$HOST_ARCH" = "arm64" ] || [ "$HOST_ARCH" = "aarch64" ]; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2-arm.zip" && \
    unzip awscliv2-arm.zip && \
    ./aws/install --install-dir /opt/aws-cli/aarch64 --bin-dir /opt/aws-cli/aarch64/bin && \
    rm -rf awscliv2-arm.zip aws && \
    sudo ln -sf /opt/aws-cli/aarch64/bin/aws /usr/local/bin/aws && \
    echo "Using ARM64 AWS CLI"
else
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2-x86.zip" && \
    unzip awscliv2-x86.zip && \
    ./aws/install --install-dir /opt/aws-cli/x86_64 --bin-dir /opt/aws-cli/x86_64/bin && \
    rm -rf awscliv2-x86.zip aws && \
    sudo ln -sf /opt/aws-cli/x86_64/bin/aws /usr/local/bin/aws && \
    echo "Using x86_64 AWS CLI"
fi