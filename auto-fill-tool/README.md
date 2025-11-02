# Auto-Fill Tool - Web自動入力 Chrome拡張機能

Webサイトへの自動入力・操作を行うChrome拡張機能です。XPath管理機能により、複数サイトの自動入力フローを簡単に設定・管理できます。

## 主な機能

- ✅ **XPath管理**: 複数のWebサイトに対する自動入力設定を一元管理
- ✅ **変数管理**: サイトごとに変数を定義し、動的な値の入力に対応
- ✅ **リトライ機能**: 失敗時の自動リトライ（回数・待機時間をカスタマイズ可能）
- ✅ **アクション種別**: input（入力）、click（クリック）、change_url（URL変更）、check（条件チェック）
- ✅ **システム設定**: リトライ待機時間（範囲指定）、リトライ回数（無限回対応）
- ✅ **CSVインポート/エクスポート**: XPath設定のバックアップ・共有が可能
- ✅ **レスポンシブUI**: 画面幅いっぱいに対応した使いやすい管理画面
- ✅ **統一されたデザインシステム**: Tailwind CSSによる全画面のスタイル統一、共通コンポーネント（form-input, form-select, btn-*）で保守性向上
- ✅ **最適化されたBundle**: Webpack splitChunks設定により、最大chunkサイズを95%削減（11MB→572KB）、効率的なキャッシングと並列ロードを実現
- ✅ **タブ録画機能**: 自動入力実行中の画面を録画し、IndexedDBに保存。実行履歴から録画を視聴可能
- ✅ **データ同期機能**: 自動化変数を外部ストレージ（CSV、Notion、Google Sheets等）と同期。手動・定期同期、競合解決ポリシー対応
- ✅ **画面遷移対応**: 複数ページにまたがるフォーム入力を自動的に再開。ページ遷移後も実行を継続し、中断時には自動復旧

## アーキテクチャ

本プロジェクトは**Clean Architecture**と**Domain-Driven Design (DDD)** の原則に基づいて設計されています。

```
src/
├── domain/                    # ドメイン層（ビジネスロジック）
│   ├── entities/              # エンティティ
│   │   ├── XPathCollection.ts         # XPath管理
│   │   ├── SystemSettings.ts          # システム設定
│   │   ├── Website.ts                 # Webサイト
│   │   ├── WebsiteCollection.ts       # Webサイトコレクション
│   │   ├── Variable.ts                # 変数
│   │   ├── AutomationVariables.ts     # 自動化変数
│   │   ├── AutomationResult.ts        # 自動化実行結果
│   │   ├── TabRecording.ts            # タブ録画
│   │   ├── CheckerState.ts            # チェッカー状態
│   │   ├── AutoFillEvent.ts           # 自動入力イベント
│   │   ├── StorageSyncConfig.ts       # ストレージ同期設定
│   │   ├── SyncResult.ts              # 同期結果
│   │   └── MasterPasswordPolicy.ts    # マスターパスワードポリシー
│   ├── adapters/              # アダプターインターフェース
│   ├── constants/             # 定数定義（EventPattern, RetryType, MessageTypes等）
│   ├── factories/             # ファクトリーインターフェース
│   ├── repositories/          # リポジトリインターフェース
│   ├── services/              # サービスインターフェース
│   ├── types/                 # 型定義
│   └── values/                # 値オブジェクト（PageOperation等）
├── usecases/                  # ユースケース層（アプリケーションロジック）
│   ├── websites/              # Website管理（7ユースケース）
│   │   └── __tests__/         # テスト（9ファイル）
│   ├── xpaths/                # XPath管理（12ユースケース）
│   │   └── __tests__/         # テスト（5ファイル）
│   ├── automation-variables/  # 自動化変数管理（8ユースケース）
│   │   └── __tests__/         # テスト（12ファイル）
│   ├── auto-fill/             # Auto-fill実行（1ユースケース）
│   ├── system-settings/       # システム設定（5ユースケース）
│   │   └── __tests__/         # テスト（5ファイル）
│   ├── storage/               # ストレージ管理（8ユースケース）
│   │   └── __tests__/         # テスト（8ファイル）
│   ├── recording/             # タブ録画管理（5ユースケース）
│   │   └── __tests__/         # テスト
│   └── sync/                  # データ同期（8ユースケース）
│       └── __tests__/         # テスト
├── infrastructure/            # インフラ層（外部システムとの連携）
│   ├── repositories/          # データ永続化（Chrome Storage, IndexedDB）
│   ├── adapters/              # Chrome API アダプター
│   │   ├── ChromeTabCaptureAdapter.ts      # タブ録画
│   │   ├── ChromeNotificationAdapter.ts    # 通知
│   │   ├── ChromeContextMenuAdapter.ts     # コンテキストメニュー
│   │   └── I18nAdapter.ts                  # 国際化
│   ├── services/              # サービス実装
│   │   ├── AutoFillService.ts              # 自動入力サービス
│   │   ├── WebPageService.ts               # Webページ操作
│   │   ├── PageOperationExecutor.ts        # ページ操作実行
│   │   ├── XPathGenerationService.ts       # XPath生成
│   │   ├── CSVConverter.ts                 # CSV変換
│   │   ├── JsonPathDataMapper.ts           # JSONPath マッピング
│   │   └── CSVValidationService.ts         # CSV検証
│   ├── auto-fill/             # 自動入力アクション実行
│   │   ├── InputActionExecutor.ts
│   │   ├── ClickActionExecutor.ts
│   │   ├── CheckboxActionExecutor.ts
│   │   ├── JudgeActionExecutor.ts
│   │   ├── SelectActionExecutor.ts
│   │   └── ChangeUrlActionExecutor.ts
│   ├── messaging/             # メッセージング（MessageRouter, MessageDispatcher）
│   ├── mappers/               # データマッパー（CSV/JSON変換）
│   ├── loggers/               # ロガー実装（ConsoleLogger等）
│   ├── obfuscation/           # 難読化（StringObfuscator, SecureStorage）
│   └── factories/             # ファクトリー実装
└── presentation/              # プレゼンテーション層（UI）
    ├── background/            # バックグラウンドスクリプト
    ├── popup/                 # ポップアップUI
    ├── xpath-manager/         # XPath管理画面（Presenter Pattern）
    ├── automation-variables-manager/  # 自動化変数管理画面（Presenter Pattern）
    ├── content-script/        # コンテンツスクリプト
    ├── master-password-setup/ # マスターパスワード設定画面
    └── unlock/                # ロック解除画面
```

### Presenter Pattern

管理画面は**Presenter Pattern**で実装されており、UIフレームワークの変更に強い設計になっています：

- **Presenter**: ビジネスロジックとユースケースのオーケストレーション
- **View**: DOM操作とレンダリング（インターフェース実装）
- **index.ts**: Presenter/Viewの連携、イベントハンドリング

将来的にReact/Vue等へ移行する際は、Viewの実装を差し替えるだけで対応可能です。

## インストール方法

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. ビルド

```bash
npm run build
```

ビルド成果物は `dist/` フォルダに出力されます。

### 3. Chromeへの読み込み

1. Google Chromeを開く
2. アドレスバーに `chrome://extensions/` と入力してEnter
3. 右上の「デベロッパーモード」をONにする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. `dist` フォルダを選択
6. 拡張機能が追加されます

## 使い方

### 1. Webサイト設定の追加

ポップアップUIから対象Webサイトを登録します：

- **Website Name**: サイト識別名
- **Start URL**: 自動入力開始URL
- **Status**: enabled（有効）/ disabled（無効）/ once（1回のみ実行）
- **Variables**: サイト固有の変数（例: ユーザー名、パスワード）

### 2. XPath設定の追加

XPath管理画面で各入力ステップを設定します：

#### 基本設定

- **Value**: 入力する値（変数 `{{variable_name}}` 使用可）
- **Action Type**:
  - `input`: テキスト入力
  - `click`: クリック
  - `change_url`: URL変更
  - `check`: 条件チェック（比較方法: 等しい/等しくない/大なり/小なり）
- **URL**: 実行対象のURL（正規表現可）
- **Execution Order**: 実行順序（数値）

#### XPath設定

- **Selected Path Pattern**: smart（推奨）/ short / absolute
- **Short XPath**: 短縮XPath
- **Absolute XPath**: 絶対XPath
- **Smart XPath**: スマートXPath

#### 高度な設定

- **After Wait Seconds**: 実行後の待機時間（秒）
- **Execution Timeout Seconds**: タイムアウト時間（秒）
- **Retry Type**:
  - `0`: リトライなし
  - `10`: リトライあり（システム設定に従う）

### 3. システム設定

変数管理画面の「システム設定」セクションで設定します：

- **リトライ待機時間（範囲指定）**:
  - 最小値・最大値を指定
  - 各リトライ時に範囲内の乱数で待機時間を決定（アンチボット対策）
  - デフォルト: 30〜60秒
- **リトライ回数**:
  - retry_type=10のステップが失敗した時のリトライ回数
  - -1で無限回リトライ
  - デフォルト: 3回
- **集約ログ設定（Phase 1実装完了）**:
  - 有効なログソース（enabledLogSources）:
    - 表示するログソースを選択（background, popup, content-script, xpath-manager, automation-variables-manager等）
    - デフォルト: すべてのソースが有効
  - セキュリティイベントのみ表示（securityEventsOnly）:
    - 有効時は認証失敗、ロックアウト、パスワード変更等のセキュリティイベントのみ表示
    - デフォルト: false（すべてのログを表示）
  - 最大保存ログ数（maxStoredLogs）:
    - backgroundに保存するログの最大数（10～10000）
    - 上限に達するとローテーション（古いログから削除）
    - デフォルト: 100
  - ログ保持期間（logRetentionDays）:
    - ログの保持期間（1～365日）
    - 期間を超えたログは自動削除
    - デフォルト: 7日
  - **注**: Phase 1ではエンティティ層のみ実装完了。Phase 2以降でログ保存・表示UIを実装予定

### 4. 自動入力の実行

1. XPath管理画面でサイトを選択
2. 「▶️ 自動入力実行」ボタンをクリック
3. 新しいタブでstart_urlが開き、自動入力が開始されます

### 5. XPathのインポート/エクスポート

- **エクスポート**: 現在の全XPath設定をCSV形式でダウンロード
- **インポート**: CSVファイルから設定を一括インポート

## 画面遷移対応機能

### 概要

画面遷移対応機能により、複数ページにまたがるフォーム入力を自動的に継続・再開できます。ページ遷移後も実行が途切れることなく、ブラウザを閉じた場合でも24時間以内であれば自動的に再開されます。

**主な特徴:**
- **自動進捗保存**: CHANGE_URLアクション実行時に現在のステップ位置を自動保存
- **自動再開**: ページ遷移後、次のページを開くと自動的に続きから実行
- **中断復旧**: ブラウザを閉じても24時間以内なら再開可能
- **進捗管理**: 全体の進捗状況（現在のステップ/全ステップ数）を追跡

### 動作の仕組み

1. **自動入力開始**: 通常通りWebサイトで自動入力を開始
2. **進捗保存**: CHANGE_URLアクション実行時に以下を保存:
   - 現在のステップ番号 (currentStepIndex)
   - 全ステップ数 (totalSteps)
   - 最後に実行したURL (lastExecutedUrl)
3. **ページ遷移**: CHANGE_URLアクションで次のページへ移動
4. **自動検出**: 次のページ読み込み時、Content Scriptが実行中の自動入力を検出
5. **自動再開**: 保存された位置から自動的に続きを実行
6. **完了**: すべてのステップが完了すると状態がSUCCESSに更新

### ユースケース例

#### ユースケース1: 3ページ登録フォーム

**シナリオ**: 個人情報 → 住所情報 → アカウント作成の3ページで構成される登録フォーム

```
ページ1: 個人情報入力
  ステップ1: 名前入力
  ステップ2: メールアドレス入力
  ステップ3: 「次へ」ボタンクリック
  ステップ4: CHANGE_URL (ページ2へ) ← 進捗保存

ページ2: 住所情報入力
  ステップ5: 住所入力
  ステップ6: 電話番号入力
  ステップ7: 「次へ」ボタンクリック
  ステップ8: CHANGE_URL (ページ3へ) ← 進捗保存

ページ3: アカウント作成
  ステップ9: ユーザー名入力
  ステップ10: パスワード入力
  ステップ11: 「登録」ボタンクリック
```

**動作**:
- ページ1で自動入力開始
- ステップ4のCHANGE_URL実行後、進捗保存 (currentStepIndex=4)
- ページ2に遷移すると自動的にステップ5から再開
- ステップ8のCHANGE_URL実行後、進捗保存 (currentStepIndex=8)
- ページ3に遷移すると自動的にステップ9から再開
- ステップ11完了で全体が完了

#### ユースケース2: 中断からの復旧

**シナリオ**: ページ2で誤ってブラウザを閉じてしまった場合

```
1. ページ1で自動入力実行 → ページ2へ遷移
2. ページ2でステップ7まで完了後、ブラウザを誤って閉じる
3. 10分後、同じWebサイトのページ2を手動で開く
4. Content Scriptが実行中状態を検出 (currentStepIndex=8)
5. ステップ8から自動的に再開
6. 正常に完了
```

#### ユースケース3: ショッピングチェックアウト

**シナリオ**: カート → 配送情報 → 支払い情報 → 確認の4ページフロー

```
各ページ遷移時にCHANGE_URLアクションを設定することで、
どのページで中断しても自動的に続きから実行可能
```

### XPath設定例

CHANGE_URLアクションを使用した設定例:

```csv
websiteId,url,action_type,value,execution_order
my-site,https://example.com/register/step1,TYPE,John,1
my-site,https://example.com/register/step1,CLICK,,2
my-site,https://example.com/register/step2,CHANGE_URL,https://example.com/register/step2,3
my-site,https://example.com/register/step2,TYPE,123 Main St,4
my-site,https://example.com/register/step2,CLICK,,5
my-site,https://example.com/register/step3,CHANGE_URL,https://example.com/register/step3,6
my-site,https://example.com/register/step3,TYPE,username,7
my-site,https://example.com/register/step3,CLICK,,8
```

**ポイント**:
- CHANGE_URLアクションのurlは「次のページのURL」を指定
- CHANGE_URLアクション以降のステップは次のページのURLを設定
- execution_orderで順序を正しく設定

### 制約事項

#### 1. 再開可能期間

- **24時間以内**: 実行中状態のAutomationResultは24時間以内のもののみ再開対象
- **24時間経過後**: 自動再開されず、新規実行として扱われる
- **理由**: 古い実行状態の蓄積を防ぎ、ストレージを効率的に管理

#### 2. WebsiteId一致

- 再開するには、実行中状態のwebsiteIdと現在のページのwebsiteIdが一致する必要がある
- 異なるWebサイトの実行中状態は無視される
- 同じドメインでも別のWebサイト設定として登録している場合は再開されない

#### 3. CHANGE_URLアクションが必須

- 進捗保存はCHANGE_URLアクション実行時のみ行われる
- CHANGE_URLアクションがないページ遷移では進捗が保存されない
- ページ遷移の境界には必ずCHANGE_URLアクションを設定する必要がある

#### 4. URL正規表現マッチング

- 再開判定はXPathデータのurlフィールドとのマッチングで行われる
- 正規表現パターンを使用している場合、意図しない再開が発生する可能性がある
- 具体的なURLを指定することを推奨

#### 5. 複数タブでの実行

- 同じWebサイトを複数タブで実行した場合、最初に見つかった実行中状態が使用される
- タブごとの実行管理は現在サポートされていない（将来的な改善予定）

#### 6. パフォーマンス

- CHANGE_URLアクション実行時にChrome Storageへの書き込みが発生
- 書き込みは非同期で行われ、失敗しても実行は継続される
- 大量のCHANGE_URLアクション（100回以上）がある場合は注意が必要

### トラブルシューティング

#### 再開されない場合

1. **24時間以上経過していないか確認**
   - AutomationVariables管理画面から実行履歴を確認

2. **WebsiteIdが一致しているか確認**
   - XPath管理画面でWebsiteId設定を確認
   - Content Scriptのログを確認（DevTools Console）

3. **CHANGE_URLアクションが設定されているか確認**
   - XPath設定にCHANGE_URLアクションが含まれているか確認
   - execution_orderが正しい順序か確認

4. **URLマッチングが正しいか確認**
   - XPathデータのurlフィールドと現在のURLが一致するか確認
   - 正規表現の場合はパターンを見直す

#### 意図しない再開が発生する場合

1. **古い実行中状態をクリア**
   - AutomationVariables管理画面から古い実行中状態を削除

2. **URL正規表現パターンを見直す**
   - より具体的なURLパターンに変更
   - 可能であれば完全一致のURLを使用

## 開発コマンド

### ビルド

```bash
npm run build            # プロダクションビルド
npm run build:dev        # 開発ビルド
npm run build:clean      # クリーンビルド（成果物削除後にビルド）
npm run dev              # 開発ビルド（ウォッチモード）
npm run clean            # ビルド成果物のクリーンアップ
```

### テスト

```bash
npm test                 # 通常のテスト実行
npm run test:watch       # ウォッチモード
npm run test:coverage    # カバレッジ付きテスト
npm run test:silent      # サイレントモード（ログ抑制）
npm run test:ci          # CI用テスト（--ci --maxWorkers=2）
```

### コード品質

```bash
npm run lint             # Lintチェック（--max-warnings 0）
npm run lint:fix         # Lint自動修正
npm run lint:report      # Lintレポート生成（JSON形式）
npm run format           # Prettierフォーマット適用
npm run format:check     # Prettierフォーマットチェック
npm run type-check       # 型チェック
npm run type-check:watch # 型チェック（ウォッチモード）
```

### 検証

```bash
npm run quality          # コード品質チェック（lint + format:check + type-check）
npm run quality:fix      # コード品質の自動修正（lint:fix + format）
npm run validate         # ローカル検証（quality + test:silent）
npm run ci               # CI完全検証（quality + test:ci + build）
```

### コード分析

```bash
npm run complexity       # コード複雑度チェック（実装コードのみ）
npm run analyze:circular # 循環依存チェック
npm run analyze:deps     # 依存関係グラフ生成（SVG）
```

### セキュリティ

```bash
npm run security:audit   # 依存パッケージの脆弱性スキャン（moderate以上）
npm run security:fix     # 検出された脆弱性の自動修正
```

**自動化された脆弱性スキャン:**
- GitHub Dependabotが週次で依存パッケージをスキャン
- 脆弱性検出時に自動的にPRを作成
- 設定ファイル: `.github/dependabot.yml`

**推奨事項:**
- 定期的に `npm run security:audit` を実行して脆弱性を確認
- Dependabotが作成したPRは速やかにレビュー・マージ
- 詳細は `docs/SECURITY_ENHANCEMENT_ROADMAP.md` を参照

### 品質保証プロセス

**IMPORTANT**: 開発タスク完了時は、`.claude/CLAUDE.md` に定義された品質保証プロセスを必ず実行してください。

詳細な手順は [.claude/CLAUDE.md](.claude/CLAUDE.md) を参照してください。

**プロセス概要:**
1. カバレッジ測定 (`npm run test:coverage`)
2. テストケース作成・充実 (修正範囲で90%以上)
3. 失敗テストの修正 (0 failed)
4. Lint自動修正 (`npm run lint:fix`)
5. Lintエラー・警告の完全解消 (0 errors, 0 warnings)
6. ビルド実行 (`npm run build`)

### Git Hooks

HuskyによるGit hooksが設定されています：

#### pre-commit
`lint-staged`を使用して、コミット前に変更されたファイルに対して自動的にLintとフォーマットを実行します。

```bash
# 自動実行（git commit時）
- ESLint自動修正
- Prettierフォーマット
```

#### pre-push
プッシュ前に以下のチェックを実行します。**エラーがあればプッシュがブロック**されます：

```bash
# 自動実行（git push時）
- 型チェック（tsc --noEmit）
- 複雑度チェック（テストファイル除外）
```

**注意**: 複雑度チェックで以下のルールが適用されます（実装コードのみ）：
- 循環的複雑度: 最大10
- ネスト深度: 最大4
- 関数の行数: 最大50行
- ファイルの行数: 最大300行
- パラメータ数: 最大4

テストファイル（`**/__tests__/**`, `**/*.test.ts`）は複雑度チェックから除外されます。

## 技術スタック

### TypeScript設定と制限事項

**TypeScript 5.9.3対応**:
- ES2022ターゲット、bundlerモジュール解決
- パスマッピング（`@domain/*`、`@infrastructure/*`等）を設定済み

**既知の制限**:
- **TypeScriptコンパイラー（`tsc`）**: パスマッピングの型チェック時に解決エラーが発生する場合があります
- **実用上の影響**: なし（Webpack、Jest、実行時は正常動作）
- **回避策**: IDEの型チェックエラーは無視して構いません

**原因と詳細**:
- **根本原因**: TypeScriptコンパイラーの`paths`解決は、複雑な設定や他のオプション（`exclude`、`typeRoots`、`ts-node`）との相互作用により影響を受ける
- **公式Issue**: [TypeScript #48652](https://github.com/microsoft/TypeScript/issues/48652) - Path mapping resolution issues
- **関連Issue**: [TypeScript #62694](https://github.com/microsoft/TypeScript/issues/62694) - Module resolution with bundler mode

**設定の必要性**:
- **`typeRoots`**: Chrome拡張機能の型定義（`chrome`、`alpinejs`等）を正しく解決するため

この制限はTypeScriptコンパイラーの既知の問題であり、アプリケーションの動作には影響しません。

### フロントエンド
- **TypeScript**: 型安全性の確保
- **Webpack**: モジュールバンドラー
- **Chrome Extension Manifest V3**: 最新のChrome拡張機能API

### テスト
- **Jest**: ユニットテストフレームワーク
- **ts-jest**: TypeScript対応
- **5114テストケース**: 高いテストカバレッジ（229テストスイート）
- **カバレッジ**: Statements 93.11%, Branches 87.18%, Functions 93.15%, Lines 93.3%

### コード品質
- **ESLint**: 静的解析（複雑度ルール含む）
- **Prettier**: コードフォーマッター
- **TypeScript Compiler**: 型チェック
- **Husky + lint-staged**: Git hooks による自動チェック（pre-commit, pre-push）
- **madge**: 循環依存検出・依存関係グラフ生成

### アーキテクチャパターン
- **Clean Architecture**: レイヤー分離
- **Domain-Driven Design**: ドメインモデル駆動
- **Presenter Pattern**: UIとビジネスロジックの分離
- **Repository Pattern**: データアクセスの抽象化
- **Use Case Pattern**: アプリケーションロジックのカプセル化
- **Messaging Pattern**: コンポーネント間通信の抽象化

## テスト

全5114テストケース（229テストスイート）が実装されています。

```bash
npm test
```

**テストカバレッジ:**
- **Statements**: 93.11%
- **Branches**: 87.18%
- **Functions**: 93.15%
- **Lines**: 93.3%

**テスト範囲:**
- **ドメインエンティティ**: XPathCollection、SystemSettings、Website、WebsiteCollection、Variable、AutomationVariables、AutomationResult、TabRecording、CheckerState、AutoFillEvent、PageOperation、StorageSyncConfig、SyncResult、MasterPasswordPolicy
- **ユースケース**: 50以上のユースケース
  - XPath管理（12）
  - Website管理（6）
  - 自動化変数管理（8）
  - 自動化実行結果管理（5）
  - タブ録画管理（5）
  - **同期管理（8）**: CreateSyncConfig、UpdateSyncConfig、DeleteSyncConfig、ListSyncConfigs、ImportCSV、ExportCSV、ValidateSyncConfig、TestConnection
  - セキュリティ管理等
- **インフラストラクチャ**:
  - リポジトリ（Chrome Storage、IndexedDB）
  - アダプター（TabCapture、Notification、ContextMenu、I18n）
  - サービス（AutoFill、WebPage、PageOperationExecutor、XPathGeneration、CSVConverter、JsonPathDataMapper等）
  - Action Executors（Input、Click、Checkbox、Judge、Select、ChangeUrl）
  - マッパー（XPath、SystemSettings、Website、AutomationVariables等）
  - メッセージング（MessageDispatcher、MessageRouter）
  - セキュリティ（SecureStorage、StringObfuscator）
- **プレゼンテーション層**: Presenter、Handler、View（XPathManager、AutomationVariablesManager等）
- **ユーティリティ**: URL正規表現マッチング、日付フォーマット等

**レイヤー別カバレッジ:**
- Domain層: ~98%
- UseCase層: ~96%
- Infrastructure層: ~95%
- Presentation層: ~92%

## データ同期機能

### 概要

データ同期機能により、自動化変数（AutomationVariables）を外部ストレージと同期できます。以下の同期方法に対応しています：

- **CSV同期**: ローカルファイルシステムとのインポート/エクスポート
- **外部API同期**: Notion、Google Sheets、カスタムAPI等との連携

### 主な機能

#### 1. 同期設定管理

各ストレージキー（automationVariables、xpathCollectionCSV、websiteConfigs、systemSettings）ごとに同期設定を作成・管理できます。

**設定項目:**
- **同期方法** (syncMethod): `notion` or `spread-sheet`
- **同期タイミング** (syncTiming): `manual`（手動）or `periodic`（定期）
- **同期方向** (syncDirection):
  - `bidirectional`: 双方向同期
  - `receive_only`: 受信のみ
  - `send_only`: 送信のみ
- **競合解決ポリシー** (conflictResolution):
  - `latest_timestamp`: 最新タイムスタンプ優先
  - `local_priority`: ローカル優先
  - `remote_priority`: リモート優先
  - `user_confirm`: ユーザー確認（UI未実装、現在はエラー）
- **入力設定** (inputs): API認証情報等のキーと値のペア
- **出力設定** (outputs): 同期結果として期待する出力データのキーとデフォルト値

#### 2. CSV同期

**インポート:**
```bash
# システム設定画面 > データ同期タブから「CSVインポート」ボタンをクリック
# または自動化変数管理画面から個別にインポート
```

**エクスポート:**
```bash
# システム設定画面 > データ同期タブから「CSVエクスポート」ボタンをクリック
# または自動化変数管理画面から個別にエクスポート
```

**対応文字コード:**
- UTF-8（デフォルト）
- Shift-JIS
- EUC-JP

**対応区切り文字:**
- カンマ (`,`)
- タブ (`\t`)
- セミコロン (`;`)

#### 3. 外部API同期

**Notion連携:**
```javascript
// 同期設定例
{
  storageKey: 'automationVariables',
  syncMethod: 'notion',
  syncTiming: 'manual',
  syncDirection: 'bidirectional',
  inputs: [
    { key: 'apiKey', value: 'YOUR_NOTION_API_KEY' },
    { key: 'databaseId', value: 'YOUR_DATABASE_ID' }
  ],
  outputs: [
    { key: 'data', defaultValue: [] }
  ],
  conflictResolution: 'latest_timestamp'
}
```

**Google Sheets連携:**
```javascript
// 同期設定例
{
  storageKey: 'automationVariables',
  syncMethod: 'spread-sheet',
  syncTiming: 'periodic',
  syncIntervalSeconds: 3600, // 1時間ごと
  syncDirection: 'receive_only',
  inputs: [
    { key: 'apiKey', value: 'YOUR_GOOGLE_API_KEY' },
    { key: 'spreadsheetId', value: 'YOUR_SPREADSHEET_ID' },
    { key: 'sheetName', value: 'Sheet1' }
  ],
  outputs: [
    { key: 'data', defaultValue: [] }
  ],
  conflictResolution: 'remote_priority'
}
```

#### 4. 同期履歴管理

すべての同期実行は履歴として保存され、以下の情報を確認できます：

- **実行日時** (executedAt)
- **同期方向** (syncDirection)
- **成功/失敗** (success)
- **エラーメッセージ** (errorMessage)
- **受信データ数** (receivedCount)
- **送信データ数** (sentCount)

**履歴のクリーンアップ:**
- システム設定画面 > データ同期タブ > 履歴タブから「全履歴削除」または個別削除可能

#### 5. エラーハンドリング

**認証エラー:**
- 401 Unauthorized: API認証情報が無効です
- 403 Forbidden: アクセス権限がありません

**ネットワークエラー:**
- タイムアウト設定（デフォルト: 30秒）
- リトライ機能なし（手動再実行が必要）

**データ形式エラー:**
- CSV検証（ヘッダー、カラム数、文字コード）
- JSON検証（スキーマ検証）

**競合エラー:**
- 競合解決ポリシーに従って自動解決
- `user_confirm`選択時はエラーメッセージを表示（UI未実装）

### 使い方

#### 1. CSV同期

**データのエクスポート:**
1. システム設定画面（`system-settings.html#data-sync`）を開く
2. 同期したいストレージ（automationVariables等）の「CSVエクスポート」ボタンをクリック
3. ファイル名を指定してダウンロード

**データのインポート:**
1. システム設定画面（`system-settings.html#data-sync`）を開く
2. 同期したいストレージの「CSVインポート」ボタンをクリック
3. CSVファイルを選択してアップロード
4. 文字コード・区切り文字を確認（自動検出）
5. 「インポート」ボタンをクリック

#### 2. 外部API同期

**同期設定の作成:**
1. システム設定画面（`system-settings.html#data-sync`）を開く
2. 同期したいストレージの「設定」ボタンをクリック
3. 「新規作成」ボタンをクリック
4. 以下の項目を入力：
   - 同期方法（notion or spread-sheet）
   - 同期タイミング（manual or periodic）
   - 同期方向（bidirectional, receive_only, send_only）
   - 競合解決ポリシー
   - 入力設定（APIキー、データベースID等）
   - 出力設定（データキー、デフォルト値）
5. 「接続テスト」ボタンで接続確認（推奨）
6. 「保存」ボタンをクリック

**手動同期の実行:**
1. システム設定画面（`system-settings.html#data-sync`）を開く
2. 同期したいストレージの「同期実行」ボタンをクリック
3. 同期結果を確認

**定期同期の設定:**
1. 同期設定で「syncTiming: periodic」を選択
2. 同期間隔（秒）を指定（最小: 60秒）
3. Chrome拡張機能がバックグラウンドで自動的に定期同期を実行

**同期履歴の確認:**
1. 同期設定画面の「履歴」タブを開く
2. 実行日時、同期方向、成功/失敗、データ数を確認
3. エラーがある場合は詳細メッセージを確認

### API設定例

詳細なAPI設定例は以下のドキュメントを参照してください：

- [API Configuration Examples](docs/user-guides/データ同期/API_CONFIGURATION_EXAMPLES.md)
  - Notion API設定例
  - Google Sheets API設定例
  - カスタムAPI設定例
  - JSONPathマッピング例

- [CSV Format Examples](docs/user-guides/データ同期/CSV_FORMAT_EXAMPLES.md)
  - AutomationVariables CSV形式
  - XPath Collection CSV形式
  - Website Configs CSV形式
  - System Settings CSV形式

- [User Manual](docs/user-guides/データ同期/USER_MANUAL.md)
  - 同期機能の詳細な使い方
  - トラブルシューティング
  - FAQ

### アーキテクチャ

データ同期機能はClean Architectureに準拠して実装されています：

**ドメイン層:**
- `StorageSyncConfig`: 同期設定エンティティ
- `SyncHistory`: 同期履歴エンティティ
- `SyncResult`: 同期結果エンティティ

**ユースケース層（8ユースケース）:**
- `CreateSyncConfigUseCase`: 同期設定の作成
- `UpdateSyncConfigUseCase`: 同期設定の更新
- `DeleteSyncConfigUseCase`: 同期設定の削除
- `ListSyncConfigsUseCase`: 同期設定の一覧取得
- `ImportCSVUseCase`: CSVインポート
- `ExportCSVUseCase`: CSVエクスポート
- `ValidateSyncConfigUseCase`: 同期設定の検証
- `TestConnectionUseCase`: 接続テスト

**インフラ層:**
- `ChromeHttpClient`: HTTP通信（タイムアウト対応）
- `JsonPathDataMapper`: JSONPathベースのデータ変換
- `CSVConverter`: CSV変換（文字コード対応）
- `CSVValidationService`: CSV検証
- `CSVFormatDetectorService`: CSV形式自動検出
- `ConflictResolver`: 競合解決（4つのポリシー）
- `ChromeSchedulerAdapter`: chrome.alarms API統合（定期同期）

**プレゼンテーション層:**
- `DataSyncManager`: システム設定画面のデータ同期タブ
- `StorageSyncManagerPresenter`: 同期設定管理画面のビジネスロジック
- `StorageSyncManagerView`: 同期設定管理画面のUI

### 制限事項

- **定期同期の最小間隔**: 60秒（Chrome alarmsの制限）
- **CSV同期**: 定期同期非対応（手動のみ）
- **CORS**: ブラウザのCORS制限により一部APIにアクセスできない場合があります
- **ユーザー確認ポリシー**: `user_confirm`の競合解決UIは未実装（選択するとエラー）
- **大規模データ**: 10,000レコードを超えるデータの同期は検証されていません

### セキュリティ

#### 🔒 暗号化とデータ保護

- **マスターパスワード暗号化**: すべての同期設定とクレデンシャルはAES-256-GCM暗号化
- **パスワードハッシュ化**: SHA-256ハッシュと一意のソルトによるパスワード保護
- **自動ロック**: 非アクティブ時に自動的にストレージをロック
- **認証情報の安全性**: APIキー等は暗号化ストレージに保存され、平文では保存されません
- **同期履歴の保護**: 同期履歴にも認証情報は含まれません

#### 🛡️ セキュリティ機能

- **パスワード強度メーター**: Shannon エントロピー計算によるリアルタイムフィードバック
- **ロックアウト保護**: 5回の認証失敗後、5分間のロックアウト
- **オプショナルパーミッション**: 必要な権限のみをユーザーが制御可能
- **セキュリティイベントログ**: 7種類のセキュリティイベントを追跡（認証失敗、ロックアウト、パーミッション拒否など）
- **依存関係の監視**: Dependabotによる自動脆弱性スキャン（日次）
- **外部CDN排除**: セキュリティ強化のため、すべてのJavaScriptライブラリをローカル化

#### 📦 Vendorライブラリ管理

外部CDNを使用せず、セキュリティを強化するためにすべてのJavaScriptライブラリをローカル管理しています：

```bash
# 現在のvendorライブラリバージョンを確認
npm run vendor:check

# vendorライブラリを最新版に更新（自動ビルド付き）
npm run vendor:update
```

**自動管理の仕組み**:
- **Webpack自動コピー**: `node_modules`から`dist/vendor/`に自動コピー
- **バージョン同期**: `package.json`のバージョンと自動連動
- **セキュリティテスト**: 外部CDN使用の検出とvendor管理の検証

**管理対象ライブラリ**:
- Alpine.js v3.15.1: リアクティブUI
- Chart.js v4.5.1: パフォーマンスダッシュボード

#### 🔍 セキュリティコマンド

```bash
# セキュリティ監査（中レベル以上の脆弱性を検出）
npm run security:audit

# 完全な監査（低レベルの脆弱性も含む）
npm run security:audit:full

# クリティカルのみ検出
npm run security:audit:critical

# JSON形式のレポート生成
npm run security:audit:json

# 脆弱性の自動修正
npm run security:fix

# 強制的な修正（breaking changesを含む可能性あり）
npm run security:fix:force

# セキュリティチェック（監査 + 成功メッセージ）
npm run security:check
```

#### 📋 セキュリティポリシー

詳細なセキュリティポリシー、脆弱性報告プロセス、インシデント対応については以下を参照：

- **[セキュリティポリシー](./docs/SECURITY_POLICY.md)** - 脆弱性報告、サポートバージョン、セキュリティ対策
- **[オプショナルパーミッションガイド](./docs/user-guides/OPTIONAL_PERMISSIONS_GUIDE.md)** - 権限管理のベストプラクティス
- **[セキュリティ強化ロードマップ](./docs/SECURITY_ENHANCEMENT_ROADMAP.md)** - 今後のセキュリティ機能計画

#### 🚨 脆弱性報告

セキュリティ上の問題を発見した場合は、**公開のGitHub Issueを作成せず**、以下にご連絡ください：

- **Email**: security@your-domain.com（実際のメールアドレスに置き換えてください）
- **Response Time**: 48時間以内に初回応答

#### ✅ セキュリティベストプラクティス

ユーザー向けのセキュリティ推奨事項：

1. **強力なマスターパスワード**:
   - 最低12文字
   - 大文字、小文字、数字、記号の組み合わせ
   - 一般的な単語や個人情報を避ける

2. **自動ロック設定**:
   - 適切な非アクティブタイムアウトを設定（5-15分）
   - デバイスから離れる際は即座にロック

3. **定期的な更新**:
   - 拡張機能を最新バージョンに保つ
   - セキュリティ改善のリリースノートを確認

4. **権限管理**:
   - 使用しないオプショナルパーミッションは無効化
   - 各権限の目的を理解する

## プロジェクト構成

```
auto-fill-tool/
├── src/
│   ├── domain/                              # ドメイン層
│   │   ├── entities/                        # エンティティ（13個）
│   │   │   ├── XPathCollection.ts           # XPath管理
│   │   │   ├── SystemSettings.ts            # システム設定
│   │   │   ├── Website.ts / WebsiteCollection.ts  # Webサイト管理
│   │   │   ├── Variable.ts                  # 変数
│   │   │   ├── AutomationVariables.ts       # 自動化変数
│   │   │   ├── AutomationResult.ts          # 自動化実行結果
│   │   │   ├── TabRecording.ts              # タブ録画
│   │   │   ├── CheckerState.ts              # チェッカー状態
│   │   │   ├── AutoFillEvent.ts             # 自動入力イベント
│   │   │   ├── StorageSyncConfig.ts / SyncResult.ts  # 同期管理
│   │   │   ├── MasterPasswordPolicy.ts      # パスワードポリシー
│   │   │   └── __tests__/                   # エンティティのテスト
│   │   ├── adapters/                        # アダプターインターフェース
│   │   ├── constants/                       # 定数定義
│   │   ├── factories/                       # ファクトリーインターフェース
│   │   ├── repositories/                    # リポジトリインターフェース
│   │   ├── services/                        # サービスインターフェース
│   │   ├── types/                           # 型定義
│   │   └── values/                          # 値オブジェクト
│   ├── usecases/                            # ユースケース層（50以上）
│   │   ├── websites/                        # Website管理（7ユースケース）
│   │   │   ├── GetAllWebsitesUseCase.ts
│   │   │   ├── GetWebsiteByIdUseCase.ts
│   │   │   ├── SaveWebsiteUseCase.ts
│   │   │   ├── UpdateWebsiteUseCase.ts
│   │   │   ├── DeleteWebsiteUseCase.ts
│   │   │   ├── ImportWebsitesUseCase.ts
│   │   │   ├── ExportWebsitesUseCase.ts
│   │   │   └── __tests__/
│   │   ├── xpaths/                          # XPath管理（12ユースケース）
│   │   │   ├── GetAllXPathsUseCase.ts
│   │   │   ├── GetXPathByIdUseCase.ts
│   │   │   ├── SaveXPathUseCase.ts
│   │   │   ├── UpdateXPathUseCase.ts
│   │   │   ├── DeleteXPathUseCase.ts
│   │   │   ├── ImportXPathUseCase.ts
│   │   │   ├── ExportXPathUseCase.ts
│   │   │   ├── ClearAllXPathsUseCase.ts
│   │   │   └── __tests__/
│   │   ├── automation-variables/            # 自動化変数管理（8ユースケース）
│   │   │   ├── GetAllAutomationVariablesUseCase.ts
│   │   │   ├── GetAutomationVariablesByIdUseCase.ts
│   │   │   ├── SaveAutomationVariablesUseCase.ts
│   │   │   ├── UpdateAutomationVariablesUseCase.ts
│   │   │   ├── DeleteAutomationVariablesUseCase.ts
│   │   │   ├── ImportAutomationVariablesUseCase.ts
│   │   │   ├── ExportAutomationVariablesUseCase.ts
│   │   │   ├── SaveAutomationResultUseCase.ts
│   │   │   └── __tests__/
│   │   ├── auto-fill/                       # Auto-fill実行（1ユースケース）
│   │   │   ├── ExecuteAutoFillUseCase.ts
│   │   │   └── __tests__/
│   │   ├── system-settings/                 # システム設定（5ユースケース）
│   │   │   ├── GetSystemSettingsUseCase.ts
│   │   │   ├── UpdateSystemSettingsUseCase.ts
│   │   │   ├── ResetSystemSettingsUseCase.ts
│   │   │   ├── ImportSystemSettingsUseCase.ts
│   │   │   ├── ExportSystemSettingsUseCase.ts
│   │   │   └── __tests__/
│   │   ├── storage/                         # ストレージ管理（8ユースケース）
│   │   │   ├── InitializeMasterPasswordUseCase.ts
│   │   │   ├── UnlockStorageUseCase.ts
│   │   │   ├── LockStorageUseCase.ts
│   │   │   ├── CheckUnlockStatusUseCase.ts
│   │   │   ├── MigrateToSecureStorageUseCase.ts
│   │   │   ├── ExecuteStorageSyncUseCase.ts
│   │   │   ├── ExportStorageSyncConfigsUseCase.ts
│   │   │   ├── GetAllStorageSyncConfigsUseCase.ts
│   │   │   └── __tests__/
│   │   ├── recording/                       # タブ録画管理（5ユースケース）
│   │   │   ├── StartTabRecordingUseCase.ts
│   │   │   ├── StopTabRecordingUseCase.ts
│   │   │   ├── GetRecordingByResultIdUseCase.ts
│   │   │   ├── GetLatestRecordingByVariablesIdUseCase.ts
│   │   │   ├── DeleteOldRecordingsUseCase.ts
│   │   │   └── __tests__/
│   │   ├── sync/                            # データ同期（8ユースケース）
│   │   │   ├── CreateSyncConfigUseCase.ts
│   │   │   ├── UpdateSyncConfigUseCase.ts
│   │   │   ├── DeleteSyncConfigUseCase.ts
│   │   │   ├── ListSyncConfigsUseCase.ts
│   │   │   ├── ImportCSVUseCase.ts
│   │   │   ├── ExportCSVUseCase.ts
│   │   │   ├── ValidateSyncConfigUseCase.ts
│   │   │   ├── TestConnectionUseCase.ts
│   │   │   └── __tests__/
│   │   └── __tests__/                       # 統合テスト・E2Eテスト
│   ├── infrastructure/                      # インフラ層
│   │   ├── repositories/                    # データ永続化
│   │   │   ├── ChromeStorageXPathRepository.ts
│   │   │   ├── ChromeStorageWebsiteRepository.ts
│   │   │   ├── ChromeStorageAutomationVariablesRepository.ts
│   │   │   ├── IndexedDBRecordingRepository.ts
│   │   │   └── __tests__/
│   │   ├── adapters/                        # Chrome API アダプター
│   │   │   ├── ChromeTabCaptureAdapter.ts
│   │   │   ├── ChromeNotificationAdapter.ts
│   │   │   ├── ChromeContextMenuAdapter.ts
│   │   │   ├── I18nAdapter.ts
│   │   │   └── __tests__/
│   │   ├── services/                        # サービス実装
│   │   │   ├── AutoFillService.ts
│   │   │   ├── WebPageService.ts
│   │   │   ├── PageOperationExecutor.ts
│   │   │   ├── XPathGenerationService.ts
│   │   │   ├── CSVConverter.ts
│   │   │   ├── JsonPathDataMapper.ts
│   │   │   └── __tests__/
│   │   ├── auto-fill/                       # 自動入力アクション実行
│   │   │   ├── InputActionExecutor.ts
│   │   │   ├── ClickActionExecutor.ts
│   │   │   ├── CheckboxActionExecutor.ts
│   │   │   ├── JudgeActionExecutor.ts
│   │   │   ├── SelectActionExecutor.ts
│   │   │   ├── ChangeUrlActionExecutor.ts
│   │   │   └── __tests__/
│   │   ├── messaging/                       # メッセージング
│   │   │   ├── MessageRouter.ts
│   │   │   ├── MessageDispatcher.ts
│   │   │   └── __tests__/
│   │   ├── mappers/                         # データマッパー
│   │   │   ├── XPathCollectionMapper.ts
│   │   │   ├── WebsiteCollectionMapper.ts
│   │   │   └── __tests__/
│   │   ├── loggers/                         # ロガー実装
│   │   ├── obfuscation/                     # 難読化・セキュリティ
│   │   │   ├── StringObfuscator.ts
│   │   │   ├── SecureStorage.ts
│   │   │   └── __tests__/
│   │   └── factories/                       # ファクトリー実装
│   ├── presentation/                        # プレゼンテーション層
│   │   ├── background/                      # バックグラウンドスクリプト
│   │   │   ├── index.ts
│   │   │   ├── handlers/                    # メッセージハンドラー
│   │   │   └── __tests__/
│   │   ├── popup/                           # ポップアップUI
│   │   ├── xpath-manager/                   # XPath管理画面
│   │   │   ├── index.ts
│   │   │   ├── XPathManagerPresenter.ts
│   │   │   ├── XPathManagerView.ts
│   │   │   └── __tests__/
│   │   ├── automation-variables-manager/    # 自動化変数管理画面
│   │   │   ├── index.ts
│   │   │   ├── AutomationVariablesManagerPresenter.ts
│   │   │   ├── AutomationVariablesManagerView.ts
│   │   │   └── __tests__/
│   │   ├── content-script/                  # コンテンツスクリプト
│   │   │   ├── index.ts
│   │   │   ├── handlers/
│   │   │   └── __tests__/
│   │   ├── master-password-setup/           # マスターパスワード設定
│   │   └── unlock/                          # ロック解除画面
│   ├── utils/                               # ユーティリティ
│   │   ├── urlMatcher.ts
│   │   ├── dateFormatter.ts
│   │   └── __tests__/
│   └── __tests__/                           # 統合テスト・E2Eテスト
│       ├── integration/                     # 統合テスト
│       ├── e2e/                             # E2Eテスト
│       ├── fixtures/                        # テストフィクスチャ
│       └── helpers/                         # テストヘルパー
├── public/
│   ├── manifest.json                        # 拡張機能マニフェスト
│   ├── popup.html                           # ポップアップHTML
│   ├── xpath-manager.html                   # XPath管理画面HTML
│   ├── automation-variables-manager.html    # 自動化変数管理画面HTML
│   ├── master-password-setup.html           # マスターパスワード設定HTML
│   ├── unlock.html                          # ロック解除画面HTML
│   └── icon*.png                            # アイコン
├── dist/                                    # ビルド成果物（自動生成）
├── coverage/                                # テストカバレッジレポート
├── webpack.config.js                        # Webpack設定
├── tsconfig.json                            # TypeScript設定
├── jest.config.js                           # Jest設定
├── .eslintrc.js                             # ESLint設定
├── .prettierrc.json                         # Prettier設定
└── package.json                             # npm設定
```

## パフォーマンス最適化

### Task 3: Chrome Storage Batch Loading (v3.2.0)

プロジェクトのパフォーマンスを大幅に改善する3つの最適化を実装しました：

1. **Bidirectional Sync Parallelization** (Phase 2-1):
   - 双方向同期の受信・送信処理を並列実行に変更
   - **50%の高速化**を達成

2. **Repository Optimization** (Phase 2-2):
   - リポジトリメソッドを最適化し、必要なデータのみをロード
   - **85-90%の高速化**を達成

3. **Chrome Storage Batch Loading** (Phase 2-3):
   - 複数のChrome Storage API呼び出しを1回のバッチ操作に統合
   - **APIコール数を67%削減**（3回→1回）
   - **~100msの読み込み時間短縮**

**詳細なパフォーマンスレポート**: [Task 3 Performance Optimization Report](docs/TASK_3_PERFORMANCE_OPTIMIZATION_REPORT.md)

**主な改善点**:
- `ExecuteAutoFillUseCase`で`BatchStorageLoader`を使用し、3つのストレージキー（XPATH_COLLECTION、AUTOMATION_VARIABLES、AUTOMATION_RESULTS）を1回のAPI呼び出しでロード
- `loadByWebsiteId()`、`loadInProgress()`などの最適化されたリポジトリメソッドを使用
- フォールバックメカニズムにより、バッチロード失敗時も個別ロードで動作継続

**品質保証**:
- テスト: 5473/5473合格 (100%)
- Lint: 0エラー、0警告
- ビルド: Production build成功
- カバレッジ: Statements 96.14%, Lines 96.17%

---

## 更新履歴

### v3.2.0 (2025-10-23)

#### パフォーマンス最適化完了（Task 3）
- **Phase 2-1: Bidirectional Sync Parallelization**:
  - 双方向同期の受信・送信処理を並列実行
  - Promise.allSettled()による並行処理
  - 50%の実行時間短縮
  - 部分的成功のサポート（片方が失敗しても継続）
- **Phase 2-2: Repository Optimization**:
  - `loadByWebsiteId()`メソッドの一貫した使用
  - `loadInProgress()`メソッドで24時間以内のDOINGステータスのみロード
  - 不要な全件ロードを回避
  - 85-90%の高速化達成
- **Phase 2-3: Chrome Storage Batch Loading**:
  - `BatchStorageLoader`インターフェース実装
  - `ChromeStorageBatchLoader`クラスで3つのキーを1回のAPI呼び出しでロード
  - `loadFromBatch()`メソッドをXPathRepository、AutomationResultRepositoryに追加
  - `ExecuteAutoFillUseCase`でバッチロードを使用
  - APIコール数を67%削減（3回→1回）
  - ~100msの読み込み時間短縮
  - フォールバックメカニズムで信頼性確保
- **Phase 3: QA and Documentation**:
  - 全5473テスト合格（100%）
  - Lintエラー・警告0件
  - Production build成功
  - 包括的なパフォーマンスレポート作成
  - アーキテクチャドキュメント更新

### v3.1.0 (2025-10-18)

#### 画面遷移対応自動入力機能の実装完了

- **新機能**: 複数ページにまたがるフォーム入力の自動継続・再開
  - CHANGE_URLアクション実行時に自動進捗保存
  - ページ遷移後の自動再開（24時間以内）
  - ブラウザ中断からの復旧機能
  - 進捗状況の可視化（現在ステップ/全ステップ数）

- **ドメイン層拡張**:
  - `AutomationResult`エンティティに進捗管理フィールド追加
    - `currentStepIndex`: 現在のステップ位置
    - `totalSteps`: 全ステップ数
    - `lastExecutedUrl`: 最後に実行したURL
    - `getProgressPercentage()`: 進捗率計算メソッド

- **ユースケース強化**:
  - `ExecuteAutoFillUseCase`に再開機能を実装
    - `checkExistingExecution()`: 実行中状態の検出（24時間以内）
    - `resumeExecution()`: 保存位置からの再開
    - `startNewExecution()`: 進捗追跡付き新規実行
    - `finalizeExecution()`: 完了処理と状態更新

- **インフラ層改善**:
  - `ChromeAutoFillAdapter`に進捗保存機能追加
    - `executeAutoFillWithProgress()`: 進捗保存付き実行
    - `saveProgress()`: CHANGE_URLアクション後の自動保存
    - 非ブロッキング保存（エラー時も実行継続）

- **Content Script強化**:
  - `AutoFillHandler`にスマート再開検出機能
    - `findInProgressExecution()`: ページ読み込み時の実行中状態検索
    - `getNextStep()`: 保存位置からの次ステップ取得
    - `urlMatches()`: URL一致検証
    - 条件合致時の自動再開トリガー

- **Background Script統合**:
  - 再開調整用メッセージハンドラ追加
    - `resumeAutoFill`: Content Scriptからの再開リクエスト処理
    - `getCurrentTabId`: 実行追跡用タブコンテキスト提供

- **テスト実装**:
  - 統合テスト: 16テストケース（100%合格）
  - E2Eテスト: 5テストケース（100%合格）
  - 総テスト数: 3,607テスト合格（3,586 passed, 21 skipped）

- **制約事項**:
  - 24時間制限: 24時間以上前の実行は再開対象外
  - WebsiteId一致: 同一WebsiteId設定のみ再開可能
  - CHANGE_URL必須: 進捗保存にはCHANGE_URLアクションが必要
  - 単一タブ制限: 複数タブでは最初に見つかった実行を使用

- **ユースケース例**:
  - 3ページ登録フォーム（個人情報 → 住所 → アカウント作成）
  - ショッピングチェックアウト（カート → 配送 → 支払い → 確認）
  - 中断からの復旧（ブラウザを閉じた後の再開）

- **パフォーマンス**:
  - 進捗保存オーバーヘッド: 1-5ms/CHANGE_URLアクション（非ブロッキング）
  - Chrome Storage書き込み: CHANGE_URLアクションのみに最適化
  - 再開検出: ページ読み込み時<10ms
  - メモリ影響: 無視できるレベル（進捗データ~200バイト/実行）

### v3.0.0 (2025-10-17)

#### UI/UX大幅改善 - 5フェーズ完了
- **Phase 1: 重複設定の削除**:
  - 専用の設定ページ (`system-settings.html`) を新規作成、4つのタブで構成
  - popup.htmlとxpath-manager.htmlから重複していたシステム設定を完全削除
  - 全画面から統一された設定ページへのナビゲーションを実装
  - 設定は1箇所のみに存在（Single Source of Truth）
- **Phase 2: UIコンポーネントの統一**:
  - `/public/styles/common.css` を新規作成（統一コンポーネントライブラリ）
  - ~860行以上の重複CSSコードを削除
  - ボタンクラスの標準化（btn-primary, btn-secondary, btn-danger等）
  - 全画面で一貫したモーダル、フォーム、カードスタイルを適用
- **Phase 3: ナビゲーション改善**:
  - 全サブページに統一ナビゲーションヘッダーを追加
  - "← メインに戻る"ボタンで直感的なナビゲーション
  - ページタイトルをヘッダー内に配置し、現在位置を明確化
- **Phase 4: 最終検証**:
  - 全ナビゲーションフローのレビュー完了
  - 27個の不足していたi18nキーを追加（日本語・英語）
  - 設定の永続化動作を検証（正常動作確認）
  - レスポンシブデザインの確認完了
- **Phase 5: テストと品質保証**:
  - Phase 2のボタンクラス変更により失敗した13テストを修正
  - 3テストファイルのボタンクラス期待値を更新
  - 廃止されたSystemSettingsManagerのテストをdescribe.skip()で処理
  - Lintエラー・警告をすべて解消（0エラー、0警告）
  - **最終テスト結果**: 3,490テストケース合格、21スキップ、0失敗
- **技術品質指標**:
  - アーキテクチャ: Clean Architectureパターンを維持
  - 型安全性: 100% TypeScript with strict typing
  - テストカバレッジ: 100%パス率（3,490 passed, 21 skipped）
  - コード品質: ESLintとPrettier準拠（0エラー、0警告）
  - ビルド: すべて成功（0エラー）
- **ユーザー向け改善**:
  - 設定が1箇所に集約され、混乱を解消
  - 全ボタン、フォーム、モーダルが統一された見た目と動作
  - すべてのサブページに明確な"戻る"ボタン
  - 完全な国際化サポート（全UI要素）
- **開発者向け改善**:
  - 保守性: 単一CSSソースで将来のメンテナンスコストを削減
  - 拡張性: コンポーネントライブラリで新UI要素の追加が容易
  - コード再利用: 共通パターンの確立とドキュメント化
  - ビルドシステム: Webpackがすべてのアセットを警告なしでバンドル

### v2.7.0 (2025-01-16)

#### Phase 2.4: Use Cases テスト実装完了
- **同期管理テスト**: 8つのUse Caseに対する包括的な単体テスト実装
  - CreateSyncConfigUseCase (18テスト)
  - UpdateSyncConfigUseCase (24テスト)
  - DeleteSyncConfigUseCase (11テスト)
  - ListSyncConfigsUseCase (19テスト)
  - ImportCSVUseCase (18テスト)
  - ExportCSVUseCase (18テスト)
  - ValidateSyncConfigUseCase (21テスト)
  - TestConnectionUseCase (23テスト)
- **テスト品質**:
  - 正常系、異常系、エラーハンドリング、エッジケースを網羅
  - jest.Mockによる依存性の完全な隔離
  - Chrome Storage APIのモック実装
  - テストヘルパー関数による保守性向上
- **テストケース大幅増加**: 2893→3050ケース（162スイート）
- **実装修正**:
  - CreateSyncConfigUseCaseの入力型に`authConfig`と`csvConfig`を追加
  - HttpResponse型に合わせたモックレスポンス修正
  - Chrome API型定義への準拠（lastError: undefined）

### v2.6.0 (2025-10-16)

#### タブ録画機能の実装完了
- **タブ録画機能**: 自動入力実行中の画面を録画
  - Chrome Tab Capture API + MediaRecorder APIを使用
  - 録画データをIndexedDBに保存（大容量対応）
  - AutomationResultに紐付けて録画を管理
- **システム設定の拡張**:
  - 録画の有効/無効切り替え
  - 録画ビットレート設定（デフォルト: 2.5Mbps）
  - 録画保持期間設定（デフォルト: 10日間）
- **録画視聴機能**: automation-variables-manager画面から最新の録画を視聴可能
- **自動削除機能**: 保持期間を超えた録画を自動削除
- **Clean Architecture準拠**:
  - TabRecordingエンティティ（ドメイン層）
  - IndexedDBRecordingRepository（インフラ層）
  - ChromeTabCaptureAdapter（インフラ層）
  - 5つのUseCase（アプリケーション層）
- **統合テスト**: 12個の統合テストを実装、すべて合格
- **テストケース大幅増加**: 866→2893ケース（154スイート）
- **テストカバレッジ**: Statements 96.14%, Branches 89.89%, Functions 96.77%, Lines 96.17%

### v2.5.0 (2025-01-10)

#### Phase 5 Presentation層リファクタリング完了
- **新規テスト作成**: AutoFillHandler.test.ts（12テスト）、CancelAutoFillHandler.test.ts（7テスト）
- **パフォーマンス最適化**:
  - ProgressReporter を fire-and-forget に変更し、不要な待機を削減
  - 自動入力ステップ実行速度が大幅に向上
- **ログ機能強化**:
  - 全 Action Executor にページコンテキストログ収集機能を追加
  - `ActionExecutionResult` に `logs?: string[]` フィールド追加
  - デバッグ時の可視性向上
- **MessageRouter改善**:
  - 内部メッセージ無視リスト機能を追加
  - `updateAutoFillProgress` の不要な警告を抑制
- **テスト環境改善**:
  - `jest.setup.js` で `window.alert` をグローバルモック
  - jsdom 環境でのテストエラー解消
- **Action Executor 委譲パターン完成**:
  - InputActionExecutor、ClickActionExecutor、CheckboxActionExecutor、JudgeActionExecutor、SelectActionExecutor、ChangeUrlActionExecutor
  - 単一責任の原則に従った設計
- **テストケース大幅増加**: 575→866ケース（64スイート）

### v2.4.0 (2025-10-08)

#### アーキテクチャの大幅な拡張
- **Website管理のClean Architecture化完了**:
  - `Website`エンティティ、`WebsiteCollection`エンティティ追加
  - `IWebsiteRepository`インターフェース、`ChromeStorageWebsiteRepository`実装
  - Website管理の6つのユースケース実装（GetAll、GetById、Save、Update、Delete、UpdateStatus）
  - 56テストケース追加
- **メッセージングアーキテクチャ導入**:
  - `MessageTypes`、`Messages`定義
  - `IMessageHandler`インターフェース
  - `MessageRouter`、`MessageDispatcher`実装
  - コンポーネント間通信の抽象化
- **新機能追加**:
  - `AutoFillEvent`エンティティ（イベント管理）
  - `PageOperation`エンティティ（ページ操作：CLICK、SCROLL、WAIT、CHECK_EXISTENCE）
  - `PageOperationExecutor`サービス（ページ操作実行）
  - `I18nAdapter`（国際化サービス）
  - `ConsoleLogger`（ロギングサービス）
  - `ChromeContextMenuAdapter`（コンテキストメニューサービス）
  - `XPathGenerationService`（XPath生成サービス）
- **フィールド名の汎用化**:
  - `dispatchEventPattern` → `actionPattern`に変更
  - action_typeに応じて異なる用途で使用（JUDGE: 比較パターン、SELECT_*: 選択パターン、TYPE/CLICK/CHECK: イベントパターン）
  - 全レイヤー（Domain、Infrastructure、Presentation）で一貫して変更
  - CSV/JSONインポート・エクスポート形式更新
- **コード品質向上**:
  - Prettier導入（コードフォーマッティング）
  - Husky + lint-staged導入（Git hooks）
  - テストケース大幅増加（132→575ケース）
  - テストスイート数増加（17→49スイート）
  - PageOperationExecutorのテストカバレッジ90%以上達成（27テストケース）

### v2.3.0 (2025-10-07)

#### XPath管理画面のUI改善とアーキテクチャ改善
- **UI拡張**: 画面幅を95vwに拡張、レスポンシブ対応
- **レイアウト改善**:
  - 画面高さを100vhに設定、XPathリスト高さを`calc(100vh - 250px)`に変更
  - XPathデータフィールドのホバー時全文表示機能追加
  - コントロールボタンのflex-wrap対応
- **Presenter Pattern導入**:
  - `XPathManagerPresenter.ts`: ビジネスロジック層（新規作成）
  - `XPathManagerView.ts`: View層（新規作成）
  - `IXPathManagerView`インターフェース定義
  - 将来のUIフレームワーク変更に対応可能な設計
- **ビルド・テスト**: 全132テストケース合格

### v2.2.0 (2025-10-07)

#### テスト出力の改善
- 無効なJSONテストケースでの意図的なエラーログを抑制
- `console.error`のモック化により、テスト出力がクリーンに（エラー表示0件）
- 対象ファイル:
  - `SystemSettings.test.ts`
  - `SystemSettingsMapper.test.ts`
  - `Variable.test.ts`

#### コード品質改善
- `XPathCollection.ts`の`generateId()`メソッドで非推奨の`substr()`を`slice()`に変更
- 従来: `substr(2, 9)` → 新: `slice(2, 11)`

### v2.1.0 (2025-10-07)

#### リトライ待機時間の範囲指定機能
- **システム設定変更**:
  - `retryWaitSeconds`（単一値）→ `retryWaitSecondsMin`/`retryWaitSecondsMax`（範囲指定）
  - 各リトライ時に範囲内の乱数で待機時間を決定（アンチボット対策）
  - デフォルト値: 最小30秒、最大60秒
- **後方互換性**: 旧設定は自動的に最小値=最大値に変換
- **UI更新**: XPath管理画面に最小値・最大値の入力フィールド追加
- **バリデーション**: 最小値 ≤ 最大値のチェック
- **ログ出力改善**: リトライ時に選択された待機時間と範囲を表示
- **テスト更新**: 全132テストケース合格

### v2.0.0 (2025-10-07)

#### リトライ回数設定機能
- **システム設定に`retryCount`追加**:
  - デフォルト値: 3回
  - -1で無限回リトライ対応
  - retry_type=10のステップに適用
- **UI追加**: XPath管理画面の「変数管理・システム設定」にリトライ回数入力欄
- **ログ改善**:
  - リトライ設定表示: `Max attempts: 3, Wait time: 30 seconds`
  - 試行回数表示: `Retrying... (attempt 2 of 3)`
  - 無限回の場合: `attempt 2 of infinite`
- **テスト追加**: SystemSettings、SystemSettingsMapper、ChromeAutoFillServiceのテストケース追加

### v1.0.0 (2025-10-03)

- 初回リリース
- Clean Architecture + DDD設計
- XPath管理機能
- 変数管理機能
- CSV インポート/エクスポート
- リトライ機能
- アクション種別（input, click, change_url, check）

## ライセンス

MIT License

## 注意事項

⚠️ この拡張機能は自己責任で使用してください。

⚠️ 対象サイトの利用規約を必ず確認してください。

⚠️ サーバーへの過度な負荷をかけないよう、適切な待機時間を設定してください。

⚠️ サイトの構造が変更された場合、XPath設定の更新が必要になる場合があります。
