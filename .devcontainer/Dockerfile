FROM ubuntu:22.04

# 基本パッケージインストール
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Node.js 18インストール
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# AWS CLI v2インストール
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws

# Amazon Q CLIインストール
RUN npm install -g @aws/amazon-q-developer-cli

# 作業ディレクトリ設定
WORKDIR /workspace

# 非rootユーザー作成
RUN useradd -m -s /bin/bash vscode \
    && usermod -aG sudo vscode \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER vscode
