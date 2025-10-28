FROM ubuntu:22.04 AS devcontainer

# ビルド引数
ARG HTTP_PROXY
ARG HTTPS_PROXY

# プロキシ設定
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV http_proxy=${HTTP_PROXY}
ENV https_proxy=${HTTPS_PROXY}
ENV AWS_CA_BUNDLE=/home/developer/.aws/nskp_config/netskope-cert-bundle.pem
ENV PATH="/usr/local/scripts:${PATH}"

# スクリプトディレクトリをコピー
COPY scripts/ /usr/local/scripts/
RUN chmod +x /usr/local/scripts/*.sh

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

# Rustツールチェーンインストール
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal

# AWS CLI v2インストール（両アーキテクチャ対応）
RUN /usr/local/scripts/install-aws-tools.sh

# Amazon Q CLI ビルド（ビルド時実行）
RUN . ~/.cargo/env && \
    cd /tmp && \
    git clone https://github.com/aws/amazon-q-developer-cli.git amazon-q-cli && \
    cd amazon-q-cli && \
    cargo build --release --bin chat_cli && \
    mkdir -p /usr/local/bin && \
    cp target/release/chat_cli /usr/local/bin/q && \
    chmod +x /usr/local/bin/q && \
    rm -rf /tmp/amazon-q-cli && \
    echo "Amazon Q CLI pre-installed"

# 非rootユーザー作成
RUN useradd -m -s /bin/bash developer \
    && usermod -aG sudo developer \
    && echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 作業ディレクトリ設定
WORKDIR /home/developer/workspace

# AWS認証ディレクトリの権限設定
RUN mkdir -p /home/developer/.aws && \
    chown -R developer:developer /home/developer/.aws && \
    chmod 700 /home/developer/.aws

# Entrypoint設定
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER developer

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
#CMD ["bash"]
