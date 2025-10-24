FROM ubuntu:22.04

# 環境変数設定
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Tokyo

# 基本パッケージインストール
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Node.js 18.x インストール
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# AWS CLI v2 インストール
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf aws awscliv2.zip

# Rustツールチェーンインストール
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && . ~/.cargo/env \
    && rustup default stable

# Amazon Q CLI ソースからビルド
RUN . ~/.cargo/env \
    && git clone https://github.com/aws/amazon-q-developer-cli.git /tmp/amazon-q-cli \
    && cd /tmp/amazon-q-cli \
    && cargo build --release --bin chat_cli \
    && cp target/release/chat_cli /usr/local/bin/q \
    && chmod +x /usr/local/bin/q \
    && rm -rf /tmp/amazon-q-cli ~/.cargo/registry

# 作業ディレクトリ設定
WORKDIR /workspace

# テストスクリプトをコピー
COPY scripts/ /workspace/scripts/
RUN chmod +x /workspace/scripts/*.sh

# デフォルトユーザー作成
RUN useradd -m -s /bin/bash developer \
    && echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER developer

# デフォルトコマンド
CMD ["/bin/bash"]
