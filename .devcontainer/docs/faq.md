# FAQ

## 一般的な質問

### Q: Amazon Q CLIとは何ですか？
A: AWSが提供するAI支援開発ツールのコマンドライン版です。コード生成、チャット、デバッグ支援などの機能があります。

### Q: なぜDevContainerを使うのですか？
A: 環境の一貫性、セットアップの簡素化、チーム間での統一された開発環境を提供するためです。

### Q: どのプラットフォームで動作しますか？
A: macOS (Intel/Apple Silicon)、Windows、Linuxで動作します。

## セットアップに関する質問

### Q: 環境変数はどこで設定しますか？
A: プロジェクトルートの`.env`ファイルで設定します。`.env.example`をコピーして編集してください。

### Q: NETSCOPE証明書は必須ですか？
A: オプションです。企業環境で必要な場合のみ`AWS_CA_BUNDLE`を設定してください。

### Q: プロキシ設定はどうすればよいですか？
A: `.env`ファイルで`HTTP_PROXY`と`HTTPS_PROXY`を設定してください。

## 技術的な質問

### Q: ビルド時間が長いのはなぜですか？
A: Amazon Q CLIをRustソースからコンパイルするため、初回は5-10分かかります。

### Q: 自動ビルドを無効にできますか？
A: `devcontainer.json`の`postCreateCommand`を編集することで制御できます。

### Q: 認証情報はどこに保存されますか？
A: `~/.aws/`ディレクトリに暗号化されて保存されます。適切な権限設定も自動で行われます。

### Q: オフラインで使用できますか？
A: 基本機能は可能ですが、Amazon Q CLIの多くの機能はAWSサービスとの通信が必要です。

## 運用に関する質問

### Q: アップデートはどうすればよいですか？
A: コンテナを再ビルドすることで最新版が取得されます：`Ctrl+Shift+P` → "Dev Containers: Rebuild Container"

### Q: 複数のAWSアカウントを使用できますか？
A: はい。AWS CLIのプロファイル機能を使用して複数アカウントを管理できます。

### Q: 設定変更後はどうすればよいですか？
A: `.env`ファイル変更後はコンテナの再ビルドが必要です。

## エラーに関する質問

### Q: "command not found: q"エラーが出ます
A: Amazon Q CLIのビルドが完了していない可能性があります。`sudo /usr/local/bin/build-amazon-q.sh`を実行してください。

### Q: マウントエラーが出ます
A: `.env`ファイルの環境変数設定を確認し、コンテナを再ビルドしてください。

### Q: 認証エラーが頻発します
A: `AMAZON_Q_START_URL`が正しく設定されているか確認し、`./.devcontainer/scripts/sso-auth.sh setup`を実行してください。

### Q: 証明書エラーが出ます
A: `AWS_CA_BUNDLE`が正しく設定されているか確認し、`/usr/local/bin/setup-certificates.sh`を実行してください。

### Q: Docker関連のエラーが出ます
A: Docker Desktopの再起動、または`docker system prune`でクリーンアップを試してください。

## パフォーマンスに関する質問

### Q: 動作が遅いです
A: Docker Desktopのリソース設定を確認し、必要に応じてCPU・メモリを増やしてください。

### Q: ビルドを高速化できますか？
A: Docker BuildKitを有効にし、十分なリソースを割り当てることで改善できます。
