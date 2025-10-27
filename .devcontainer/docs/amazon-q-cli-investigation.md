# Amazon Q CLI インストール方法調査結果

## 調査日時
2025-10-24

## 調査結果

### 公式リポジトリ
- GitHub: https://github.com/aws/amazon-q-developer-cli
- 最新バージョン: 1.18.1
- リリースにバイナリファイルなし（ソースコードのみ）

### 公式ドキュメント
- URL: https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-installing.html
- インストール方法が記載されているが、具体的なコマンドが不明

### 試行したインストール方法

#### 1. npm経由
```bash
npm install -g @aws/amazon-q-developer-cli
```
**結果**: パッケージが存在しない

#### 2. 公式インストールスクリプト
```bash
curl -sSL https://amazonq.aws/install | bash
```
**結果**: ホストが解決できない

#### 3. 代替インストールスクリプト
```bash
curl -sSL https://q.aws.dev/install | bash
```
**結果**: ホストが解決できない

#### 4. 直接ダウンロード
```bash
wget https://d2908q01vomqb2.cloudfront.net/.../q-linux-x64.zip
```
**結果**: 403 Forbidden

### 判明した情報

#### macOS用
- DMG: https://desktop-release.q.us-east-1.amazonaws.com/latest/Amazon%20Q.dmg
- Homebrew: `brew install --cask amazon-q`

#### Linux用
- Ubuntu/Debian: 公式ドキュメント参照
- AppImage: 公式ドキュメント参照
- ソースからビルド: Rustツールチェーンが必要

## 現在の課題

1. **公式インストールスクリプトのURLが不明**
   - ドキュメントに記載されているが、実際のURLが見つからない

2. **バイナリの直接ダウンロードができない**
   - GitHubリリースにバイナリが含まれていない

3. **npmパッケージが存在しない**
   - 公式のnpmパッケージが見つからない

## 推奨対応方針

### 短期対応
1. **ソースからビルド**
   - Rustツールチェーンをインストール
   - GitHubからソースをクローン
   - `cargo build --release`でビルド

2. **代替手段**
   - 一旦Amazon Q CLIなしでコンテナを完成
   - 後でインストール方法が判明次第追加

### 長期対応
1. **AWS公式サポートに問い合わせ**
2. **コミュニティフォーラムで情報収集**
3. **定期的な調査継続**

## 次のアクション

1. Rustベースのビルド方法を実装
2. 代替案として手動インストール手順を作成
3. 公式情報の更新を待つ

## 追加調査結果 (2025-10-24 18:06)

### macOS環境での成功例

#### Homebrew経由でのインストール
```bash
brew install --cask amazon-q
```
**結果**: 成功 - Amazon Q.app がインストールされる

#### CLI バイナリの場所
- メインCLI: `/Applications/Amazon Q.app/Contents/MacOS/q`
- チャット機能: `/Applications/Amazon Q.app/Contents/MacOS/qchat`
- ターミナル機能: `/Applications/Amazon Q.app/Contents/MacOS/qterm`
- デスクトップ版: `/Applications/Amazon Q.app/Contents/MacOS/q_desktop`

#### バージョン確認
```bash
"/Applications/Amazon Q.app/Contents/MacOS/q" --version
# 出力: q 1.18.1
```

### Linux環境での対応方針

#### 1. macOSバイナリからの抽出
- macOS版のバイナリを解析し、Linux版の入手方法を調査
- 可能であればバイナリを直接利用

#### 2. 公式ドキュメントの再確認
- AWS公式ドキュメントの最新情報を確認
- 隠れたダウンロードリンクがないか調査

#### 3. 代替インストール方法
- AWS Session Manager Plugin の方式を参考
- 直接バイナリダウンロードの可能性を調査

## 実装予定

1. **devContainer更新**
   - macOSバイナリベースのLinux対応を実装
   - 複数アーキテクチャ対応を維持

2. **インストールスクリプト作成**
   - 自動検出・インストール機能
   - フォールバック機能付き

## 最終実装 (2025-10-24 18:06)

### 解決策: ソースからビルド

#### 実装内容
1. **Rustツールチェーンの追加**
   - Ubuntu 22.04ベースコンテナにRustインストール
   - 必要な依存関係（build-essential, libssl-dev等）を追加

2. **自動ビルドスクリプト**
   ```bash
   /usr/local/bin/build-amazon-q.sh
   ```
   - GitHubからソースコードをクローン
   - `cargo build --release --bin chat_cli`でビルド
   - `/usr/local/bin/q`にインストール

3. **devContainer設定更新**
   - postCreateCommandでビルドスクリプトを自動実行
   - Rust Analyzerエクステンションを追加
   - ユーザー名を`developer`に統一

#### 動作確認
- ビルド成功後、`q --version`でバージョン確認可能
- `q chat`でAmazon Q CLIの使用が可能

### 利点
- 最新のソースコードを使用
- 全アーキテクチャ対応（x86_64, ARM64）
- 公式リポジトリからの直接ビルドで信頼性確保
- 将来のアップデートにも対応可能

### 注意点
- 初回ビルド時間が長い（約5-10分）
- Rustツールチェーンによりイメージサイズが増加
- ネットワーク接続が必要

## 完了

Amazon Q CLI devContainer環境の構築が完了しました。
- ✅ AWS CLI マルチアーキテクチャ対応
- ✅ Amazon Q CLI ソースビルド対応  
- ✅ 自動セットアップスクリプト
- ✅ VSCode統合
