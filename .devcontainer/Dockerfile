FROM ubuntu:22.04

# 基本パッケージインストール
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    ca-certificates \
    sudo \
    file \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22インストール
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Rustツールチェーンインストール（軽量版）
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal \
    && echo 'source ~/.cargo/env' >> ~/.bashrc

# AWS CLI v2 両アーキテクチャ版インストール
RUN mkdir -p /opt/aws-cli && \
    # x86_64版
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2-x86.zip" && \
    unzip awscliv2-x86.zip && \
    ./aws/install --install-dir /opt/aws-cli/x86_64 --bin-dir /opt/aws-cli/x86_64/bin && \
    rm -rf awscliv2-x86.zip aws && \
    # aarch64版
    curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2-arm.zip" && \
    unzip awscliv2-arm.zip && \
    ./aws/install --install-dir /opt/aws-cli/aarch64 --bin-dir /opt/aws-cli/aarch64/bin && \
    rm -rf awscliv2-arm.zip aws

# 起動時スクリプト作成
RUN echo '#!/bin/bash\n\
HOST_ARCH=$(uname -m)\n\
if [ "$HOST_ARCH" = "arm64" ] || [ "$HOST_ARCH" = "aarch64" ]; then\n\
    sudo ln -sf /opt/aws-cli/aarch64/bin/aws /usr/local/bin/aws\n\
    sudo ln -sf /opt/aws-cli/aarch64/bin/aws_completer /usr/local/bin/aws_completer\n\
    echo "Using ARM64 AWS CLI"\n\
else\n\
    sudo ln -sf /opt/aws-cli/x86_64/bin/aws /usr/local/bin/aws\n\
    sudo ln -sf /opt/aws-cli/x86_64/bin/aws_completer /usr/local/bin/aws_completer\n\
    echo "Using x86_64 AWS CLI"\n\
fi' > /usr/local/bin/setup-aws-cli.sh && \
    chmod +x /usr/local/bin/setup-aws-cli.sh

# 非rootユーザー作成
RUN useradd -m -s /bin/bash developer \
    && usermod -aG sudo developer \
    && echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 証明書セットアップスクリプト作成
RUN echo '#!/bin/bash\n\
if [ -n "$NETSCOPE_CERT_PATH" ] && [ -d "$NETSCOPE_CERT_PATH" ]; then\n\
    echo "Setting up NETSCOPE certificates from: $NETSCOPE_CERT_PATH"\n\
    sudo cp "$NETSCOPE_CERT_PATH"/*.crt /usr/local/share/ca-certificates/ 2>/dev/null || true\n\
    sudo update-ca-certificates\n\
    echo "Certificates updated successfully"\n\
else\n\
    echo "No NETSCOPE certificates found - skipping certificate setup"\n\
fi' > /usr/local/bin/setup-certificates.sh && \
    chmod +x /usr/local/bin/setup-certificates.sh

# Amazon Q CLIビルド用スクリプト作成（エラーハンドリング強化）
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Building Amazon Q CLI from source..."\n\
cd /tmp\n\
\n\
# ネットワーク接続確認\n\
if ! timeout 10 curl -s --head https://github.com > /dev/null; then\n\
    echo "Network connectivity issue - skipping Amazon Q CLI build"\n\
    echo "Please run: ./scripts/manual-build.sh after container startup"\n\
    exit 0\n\
fi\n\
\n\
git clone https://github.com/aws/amazon-q-developer-cli.git amazon-q-cli\n\
cd amazon-q-cli\n\
source ~/.cargo/env\n\
cargo build --release --bin chat_cli\n\
sudo cp target/release/chat_cli /usr/local/bin/q\n\
sudo chmod +x /usr/local/bin/q\n\
echo "Amazon Q CLI installed successfully!"\n\
q --version' > /usr/local/bin/build-amazon-q.sh && \
    chmod +x /usr/local/bin/build-amazon-q.sh

# 作業ディレクトリ設定
WORKDIR /workspace

USER developer
