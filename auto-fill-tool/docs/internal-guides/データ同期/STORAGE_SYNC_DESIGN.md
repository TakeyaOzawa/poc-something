# localStorage 汎用同期機能 - 設計書

## 概要

すべての localStorage データ（AutomationVariables, Websites, XPath, SystemSettings 等）に対して、柔軟な同期機能を提供します。CSV インポート・エクスポート、または外部 DB との HTTP(S) 同期をサポートします。

## 目的

1. **汎用的な同期機構**: localStorage 毎に同期方法を設定可能
2. **複数の同期方法**: CSV ファイル同期、HTTP(S) DB 同期
3. **柔軟な同期タイミング**: 手動同期、定期自動同期
4. **双方向同期**: 受信のみ、送信のみ、相互同期を選択可能
5. **カスタマイズ可能**: リクエスト手順と localStorage の紐付けを自由に設定

---

# 外部仕様

## 1. 同期設定の構造

### 1.1 localStorage キーごとの設定

以下の localStorage キーそれぞれに同期設定を持つことができます：

- `automationVariables`: 自動入力変数
- `websiteConfigs`: ウェブサイト設定
- `xpathCollectionCSV`: XPath 定義
- `automationResults`: 自動入力実行結果
- `systemSettings`: システム設定

### 1.2 同期設定の要素

各 localStorage キーに対して、以下の設定を行います：

```
┌─────────────────────────────────────────────────────────┐
│ 1. データ取得・同期方法                                 │
│    ○ CSV インポート・エクスポート                       │
│    ○ DB 同期（HTTP(S)）                                 │
├─────────────────────────────────────────────────────────┤
│ 2. 同期タイミング                                       │
│    ○ 手動（インポート / エクスポート選択可）            │
│    ○ 定期（DB同期のみ、頻度を秒単位で指定）            │
├─────────────────────────────────────────────────────────┤
│ 3. 同期種別                                             │
│    ○ 相互（送受信）                                     │
│    ○ 受信のみ                                           │
│    ○ 送信のみ                                           │
├─────────────────────────────────────────────────────────┤
│ 4. 同期手順（DB同期の場合）                             │
│    - URL、認証情報                                      │
│    - リクエスト順序                                     │
│    - localStorage の項目との紐付け                      │
└─────────────────────────────────────────────────────────┘
```

## 2. ユーザーインターフェース

### 2.1 システム設定画面 - データ同期タブ

既存のシステム設定画面（xpath-manager.html）に「データ同期」タブを追加します。

```
┌────────────────────────────────────────────────────────────┐
│ システム設定                                          [×]    │
├────────────────────────────────────────────────────────────┤
│ [一般設定] [リトライ設定] [データ同期]                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 🔄 データ同期設定                                          │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ localStorage 同期設定                               │   │
│ │                                                      │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ 📋 Automation Variables                 [設定] │ │   │
│ │ │ 同期方法: DB同期（HTTP(S)）                    │ │   │
│ │ │ タイミング: 定期（300秒ごと）                  │ │   │
│ │ │ 種別: 相互同期                                 │ │   │
│ │ │ 最終同期: 2025-10-15 10:30:45 ✅              │ │   │
│ │ │                              [今すぐ同期]     │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ 🌐 Website Configs                      [設定] │ │   │
│ │ │ 同期方法: CSV インポート・エクスポート         │ │   │
│ │ │ タイミング: 手動                               │ │   │
│ │ │ 種別: 相互同期                                 │ │   │
│ │ │ 最終同期: -                                    │ │   │
│ │ │           [インポート] [エクスポート]         │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ 🎯 XPath Collection                     [設定] │ │   │
│ │ │ 同期方法: DB同期（HTTP(S)）                    │ │   │
│ │ │ タイミング: 手動                               │ │   │
│ │ │ 種別: 受信のみ                                 │ │   │
│ │ │ 最終同期: 2025-10-15 09:00:00 ✅              │ │   │
│ │ │                              [今すぐ同期]     │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ 📊 Automation Results                   [設定] │ │   │
│ │ │ 同期方法: 未設定                               │ │   │
│ │ │                              [同期を設定]     │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ ⚙️ System Settings                      [設定] │ │   │
│ │ │ 同期方法: 未設定                               │ │   │
│ │ │                              [同期を設定]     │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│                                   [キャンセル] [保存]     │
└────────────────────────────────────────────────────────────┘
```

### 2.2 同期設定詳細モーダル

```
┌────────────────────────────────────────────────────────────┐
│ データ同期設定 - Automation Variables               [×]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 1. データ取得・同期方法 *                                  │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ○ CSV インポート・エクスポート                       │   │
│ │ ● DB 同期（HTTP(S)）                                 │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 2. 同期タイミング *                                        │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ○ 手動同期                                           │   │
│ │ ● 定期自動同期                                       │   │
│ │   └─ 同期間隔: [300] 秒ごと                         │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 3. 同期種別 *                                              │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ● 相互同期（送受信）                                 │   │
│ │ ○ 受信のみ                                           │   │
│ │ ○ 送信のみ                                           │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 4. 同期手順 - 受信設定                [+ ステップ追加]    │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 受信ステップ 1: データ一覧取得          [↑] [↓] [×] │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ メソッド: GET                                  │ │   │
│ │ │ URL: https://api.example.com/automation-vars  │ │   │
│ │ │                                                │ │   │
│ │ │ 認証設定:                                      │ │   │
│ │ │   タイプ: Bearer Token                         │ │   │
│ │ │   トークン: secret_*********************      │ │   │
│ │ │                                                │ │   │
│ │ │ ヘッダー:                                      │ │   │
│ │ │   - Content-Type: application/json            │ │   │
│ │ │                                                │ │   │
│ │ │ レスポンスマッピング:                          │ │   │
│ │ │   データパス: $.data                          │ │   │
│ │ │   localStorage への保存方法: 配列全体を保存   │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 5. 同期手順 - 送信設定                [+ ステップ追加]    │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 送信ステップ 1: データ全体を送信        [↑] [↓] [×] │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ メソッド: POST                                 │ │   │
│ │ │ URL: https://api.example.com/automation-vars  │ │   │
│ │ │                                                │ │   │
│ │ │ 認証設定:                                      │ │   │
│ │ │   タイプ: Bearer Token                         │ │   │
│ │ │   トークン: secret_*********************      │ │   │
│ │ │                                                │ │   │
│ │ │ ボディ構築:                                    │ │   │
│ │ │   localStorage から: automationVariables      │ │   │
│ │ │   送信データ形式: JSON配列                     │ │   │
│ │ │   テンプレート:                                │ │   │
│ │ │   {                                            │ │   │
│ │ │     "data": ${localStorage}                   │ │   │
│ │ │   }                                            │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ テスト実行                                                 │
│ ┌────────────────────────────────────────────────────┐   │
│ │ [🧪 受信テスト] [🧪 送信テスト]                      │   │
│ │                                                      │   │
│ │ 受信テスト結果: 🟢 成功（5件のデータを取得）        │   │
│ │ 送信テスト結果: 🟢 成功（3件のデータを送信）        │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│                                   [キャンセル] [保存]     │
└────────────────────────────────────────────────────────────┘
```

### 2.3 CSV 同期の場合

```
┌────────────────────────────────────────────────────────────┐
│ データ同期設定 - Website Configs                    [×]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 1. データ取得・同期方法 *                                  │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ● CSV インポート・エクスポート                       │   │
│ │ ○ DB 同期（HTTP(S)）                                 │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 2. 同期タイミング *                                        │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ● 手動同期                                           │   │
│ │   [インポート] [エクスポート] ボタンを使用          │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 3. 同期種別 *                                              │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ● 相互同期（インポート・エクスポート両方可能）       │   │
│ │ ○ 受信のみ（インポートのみ）                        │   │
│ │ ○ 送信のみ（エクスポートのみ）                      │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 4. CSV フォーマット設定                                    │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 文字コード: [v] UTF-8                                │   │
│ │              Shift-JIS                               │   │
│ │                                                      │   │
│ │ 区切り文字: [v] カンマ (,)                           │   │
│ │              タブ (\t)                               │   │
│ │              セミコロン (;)                          │   │
│ │                                                      │   │
│ │ ヘッダー行: ☑ 1行目をヘッダーとする                 │   │
│ │                                                      │   │
│ │ フィールドマッピング:                                │   │
│ │   CSV列 → localStorage フィールド                   │   │
│ │   ・id → id                                         │   │
│ │   ・name → name                                     │   │
│ │   ・url → url                                       │   │
│ │   ・status → status                                 │   │
│ │   [+ マッピング追加]                                │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│                                   [キャンセル] [保存]     │
└────────────────────────────────────────────────────────────┘
```

## 3. データフロー

### 3.1 全体フロー

```
[ユーザー] → [システム設定 - データ同期タブ]
                    ↓
        [localStorage キーを選択]
                    ↓
              [同期設定を構成]
                    ↓
    ┌───────────────┴────────────────┐
    │                                │
[CSV 同期]                     [DB 同期]
    │                                │
    ├─ インポート                   ├─ 受信（GET/POST）
    │  - ファイル選択               │  - HTTP リクエスト実行
    │  - CSV パース                 │  - レスポンス解析
    │  - データマージ               │  - データマージ
    │                                │
    └─ エクスポート                 └─ 送信（POST/PUT）
       - データ取得                    - localStorage 読み込み
       - CSV 生成                      - リクエストボディ構築
       - ダウンロード                  - HTTP リクエスト実行
```

### 3.2 DB 同期 - 受信フロー（相互同期 or 受信のみ）

```
1. 定期同期 or 手動同期トリガー

2. 同期設定を読み込み

3. 受信ステップを順番に実行:
   a. URLにGET/POSTリクエスト送信
   b. 認証情報を含む
   c. レスポンスを受信
   d. JSONパースしてデータパスから抽出

4. 既存のlocalStorageデータと比較:
   - 新規データ: 追加
   - 既存データ: 更新（タイムスタンプ比較）
   - 削除データ: 削除（オプション）

5. localStorage に保存

6. 同期完了通知
```

### 3.3 DB 同期 - 送信フロー（相互同期 or 送信のみ）

```
1. 定期同期 or 手動同期トリガー

2. 同期設定を読み込み

3. localStorage からデータを読み込み

4. 送信ステップを順番に実行:
   a. リクエストボディを構築（テンプレート使用）
   b. POST/PUT リクエスト送信
   c. 認証情報を含む
   d. レスポンスを受信して確認

5. 送信完了通知
```

### 3.4 CSV 同期 - インポートフロー

```
1. ユーザーが「インポート」ボタンをクリック

2. ファイル選択ダイアログを表示

3. ユーザーがCSVファイルを選択

4. CSVファイルを読み込み
   - 文字コード変換
   - CSVパース（区切り文字、ヘッダー行）

5. フィールドマッピングに基づいてデータ変換

6. 既存のlocalStorageデータとマージ
   - 新規データ: 追加
   - 既存データ: 上書き or スキップ（設定による）

7. localStorage に保存

8. インポート完了通知（件数表示）
```

### 3.5 CSV 同期 - エクスポートフロー

```
1. ユーザーが「エクスポート」ボタンをクリック

2. localStorage からデータを読み込み

3. フィールドマッピングに基づいてCSVデータ生成
   - ヘッダー行追加
   - データ行追加

4. 文字コード変換

5. CSVファイルとしてダウンロード

6. エクスポート完了通知（件数表示）
```

## 4. ユースケース

### UC-1: localStorage 同期設定の作成

1. システム設定画面を開く
2. 「データ同期」タブを選択
3. 対象の localStorage キーの「設定」ボタンをクリック
4. 同期方法（CSV / DB）を選択
5. 同期タイミング（手動 / 定期）を選択
6. 同期種別（相互 / 受信のみ / 送信のみ）を選択
7. 同期手順を設定（DB の場合）
8. テスト実行で動作確認
9. 「保存」で設定を保存

### UC-2: 手動同期の実行（CSV インポート）

1. データ同期タブで対象の localStorage キーの「インポート」ボタンをクリック
2. ファイル選択ダイアログでCSVファイルを選択
3. インポート処理が実行される
4. 完了通知が表示される（例: "5件のデータをインポートしました"）

### UC-3: 手動同期の実行（CSV エクスポート）

1. データ同期タブで対象の localStorage キーの「エクスポート」ボタンをクリック
2. CSVファイルが生成されダウンロードされる
3. 完了通知が表示される（例: "10件のデータをエクスポートしました"）

### UC-4: 手動同期の実行（DB 同期）

1. データ同期タブで対象の localStorage キーの「今すぐ同期」ボタンをクリック
2. 同期種別に応じて受信・送信処理が実行される
3. 同期進捗が表示される
4. 完了通知が表示される（例: "受信: 5件更新、送信: 3件送信"）

### UC-5: 定期自動同期（DB 同期のみ）

1. バックグラウンドで定期的にタイマーが発火
2. 定期同期が設定されている localStorage キーをチェック
3. 同期間隔が経過しているものを同期実行
4. 同期結果をログに記録
5. エラー発生時は通知を表示（オプション）

### UC-6: 同期設定の編集

1. データ同期タブで対象の localStorage キーの「設定」ボタンをクリック
2. 既存の設定が表示される
3. 設定を変更
4. テスト実行で動作確認
5. 「保存」で変更を保存

### UC-7: 同期設定の削除

1. データ同期タブで対象の localStorage キーの「設定」ボタンをクリック
2. 「同期設定を削除」ボタンをクリック
3. 確認ダイアログで「削除」を選択
4. 同期設定が削除される（localStorage のデータは保持）

## 5. 同期競合の解決

### 5.1 競合パターン

1. **ローカルとリモートの両方が更新されている場合**
   - タイムスタンプ比較で新しい方を採用（Last Write Wins）
   - または、ユーザーに選択させる（UI 表示）

2. **ローカルで削除、リモートで更新されている場合**
   - リモートの更新を優先（復活）
   - または、削除を優先（設定による）

3. **ローカルで更新、リモートで削除されている場合**
   - ローカルの更新を優先（再送信）
   - または、削除を優先（設定による）

### 5.2 競合解決ポリシー（設定可能）

```
競合解決ポリシー:
- 最新タイムスタンプ優先（デフォルト）
- ローカル優先
- リモート優先
- ユーザーに確認
```

## 6. エラーハンドリング

### 6.1 DB 同期のエラー

1. **認証エラー**: トークンが無効、期限切れ
   - エラー通知を表示
   - 設定画面で認証情報を更新するよう促す

2. **ネットワークエラー**: タイムアウト、接続失敗
   - リトライ処理（最大3回）
   - 失敗した場合はエラー通知

3. **データ形式エラー**: 期待したフォーマットと異なる
   - エラー詳細をログに記録
   - ユーザーに通知

4. **レート制限エラー**: API呼び出し回数の上限
   - 次回の同期時刻を調整
   - ユーザーに通知

### 6.2 CSV 同期のエラー

1. **ファイル読み込みエラー**: ファイルが破損、形式不正
   - エラー通知を表示
   - 正しい形式の例を表示

2. **文字コードエラー**: 文字コードが合わない
   - 自動検出を試みる
   - 手動で文字コードを選択させる

3. **フィールドマッピングエラー**: 必須フィールドがない
   - エラー箇所を具体的に表示
   - マッピング設定の確認を促す

### 6.3 競合エラー

1. **更新競合**: 同時に更新された
   - 競合解決ポリシーに従って処理
   - ユーザー確認が必要な場合はダイアログ表示

## 7. セキュリティ考慮事項

### 7.1 認証情報の保護

- 認証トークン等は暗号化して chrome.storage.local に保存
- UI表示時はマスク表示
- ログに認証情報を出力しない

### 7.2 HTTPS 必須

- DB 同期はすべて HTTPS を必須とする
- HTTP 接続は警告を表示し、実行を制限

### 7.3 データ検証

- 受信データの型検証
- XSS 対策（データのサニタイジング）
- CSV インジェクション対策

---

# 内部仕様

## 1. アーキテクチャ

既存のClean Architecture構造を維持し、以下の層で実装します：

```
Presentation Layer (UI)
    ├── SystemSettingsManager (データ同期タブ)
    ├── StorageSyncConfigModal (同期設定モーダル)
    └── StorageSyncController (同期実行制御)

Use Case Layer
    ├── CreateStorageSyncConfigUseCase
    ├── UpdateStorageSyncConfigUseCase
    ├── DeleteStorageSyncConfigUseCase
    ├── GetStorageSyncConfigsUseCase
    ├── ExecuteStorageSyncUseCase (メイン同期処理)
    ├── ImportCSVUseCase
    └── ExportCSVUseCase

Domain Layer
    ├── Entities
    │   ├── StorageSyncConfig (同期設定)
    │   ├── SyncStep (同期ステップ)
    │   └── SyncResult (同期結果)
    ├── Repositories
    │   └── StorageSyncConfigRepository
    └── Services
        ├── ISyncService (同期実行サービス)
        ├── IHttpClient (HTTPクライアント)
        ├── ICSVConverter (CSV変換)
        └── IDataMapper (データマッピング)

Infrastructure Layer
    ├── Repositories
    │   └── ChromeStorageStorageSyncConfigRepository
    ├── Services
    │   ├── DBSyncService (DB同期実装)
    │   ├── CSVSyncService (CSV同期実装)
    │   ├── ChromeHttpClient
    │   ├── CSVConverter
    │   └── JsonPathDataMapper
    ├── Encryption
    │   ├── WebCryptoService (implements CryptoService - 再利用)
    │   └── TokenEncryptionService (uses CryptoService)
    └── Scheduler
        └── PeriodicSyncScheduler (定期同期)

**Note**: セキュリティ基盤は Phase 1 (セキュリティ実装 - Section 3.2) で実装完了し、アーキテクチャリファクタリングも完了済み (2025-10-15)。

**完了したセキュリティコンポーネント (Section 3.2.1 ~ 3.2.8)**:
- `CryptoService` インターフェース (domain layer) - 暗号化サービス抽象化
- `WebCryptoService` 実装 (infrastructure layer) - AES-256-GCM 暗号化
- `SecureStorage` インターフェース (domain layer) - セキュアストレージ抽象化
- `SecureStorageService` 実装 (infrastructure layer) - マスターパスワード管理
- `SessionManager` (domain layer) - セッション管理ロジック
- `PasswordValidator` (domain layer) - パスワード強度検証
- `LockoutManager` インターフェース (domain layer) - ロックアウト管理抽象化
- `LockoutManager` 実装 (domain layer) - ログイン失敗追跡とロックアウト
- `ChromeStorageLockoutStorage` 実装 (infrastructure layer) - ロックアウト状態永続化

**使用方法**:
`TokenEncryptionService` は `CryptoService` インターフェースを依存性注入により受け取り、認証トークンを暗号化します。
既存の `SecureStorageService` も `CryptoService` インターフェースを使用する設計のため、同じパターンを踏襲してください。

**テスト結果**: 169/169 テスト合格 (Section 3.2 全体)
**詳細**: `docs/外部データソース連携/session-2025-10-15-progress.md` 参照
```

## 2. データ構造

### 2.1 StorageSyncConfig Entity

```typescript
// src/domain/entities/StorageSyncConfig.ts

import { v4 as uuidv4 } from 'uuid';

// 同期方法
export type SyncMethod = 'csv' | 'db';

// 同期タイミング
export type SyncTiming = 'manual' | 'periodic';

// 同期種別
export type SyncDirection = 'bidirectional' | 'receive_only' | 'send_only';

// 認証タイプ
export type AuthType = 'bearer' | 'oauth2' | 'apikey' | 'basic' | 'none';

// HTTPメソッド
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// 認証設定
export interface AuthConfig {
  type: AuthType;
  credentials: {
    token?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
  };
}

// 同期ステップ（DB同期用）
export interface SyncStep {
  id: string;
  name: string;
  method: HttpMethod;
  url: string; // 変数展開可能: "https://api.example.com/data/${id}"
  headers: { [key: string]: string };
  body?: string; // JSON文字列、変数展開可能
  responseMapping?: {
    dataPath: string; // JSONPath: "$.data"
    storageMapping: 'replace' | 'merge' | 'custom'; // localStorage への保存方法
  };
}

// CSV設定
export interface CSVConfig {
  encoding: 'utf-8' | 'shift-jis' | 'euc-jp';
  delimiter: ',' | '\t' | ';';
  hasHeader: boolean;
  fieldMapping: {
    csvColumn: string; // CSVの列名 or インデックス
    storageField: string; // localStorage のフィールド名
  }[];
}

// 同期設定データ
export interface StorageSyncConfigData {
  id: string; // UUID v4
  storageKey: string; // localStorage のキー (例: "automationVariables")
  enabled: boolean; // 有効/無効

  // 1. 同期方法
  syncMethod: SyncMethod;

  // 2. 同期タイミング
  syncTiming: SyncTiming;
  syncIntervalSeconds?: number; // 定期同期の場合の間隔（秒）

  // 3. 同期種別
  syncDirection: SyncDirection;

  // 4-1. DB同期設定
  authConfig?: AuthConfig;
  receiveSteps?: SyncStep[]; // 受信ステップ
  sendSteps?: SyncStep[]; // 送信ステップ

  // 4-2. CSV同期設定
  csvConfig?: CSVConfig;

  // 競合解決ポリシー
  conflictResolution: 'latest_timestamp' | 'local_priority' | 'remote_priority' | 'user_confirm';

  // 同期状態
  lastSyncDate?: string; // ISO 8601
  lastSyncStatus?: 'success' | 'failed';
  lastSyncError?: string;

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export class StorageSyncConfig {
  private data: StorageSyncConfigData;

  constructor(data: StorageSyncConfigData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: StorageSyncConfigData): void {
    if (!data.id) throw new Error('ID is required');
    if (!data.storageKey) throw new Error('Storage key is required');
    if (!data.syncMethod) throw new Error('Sync method is required');
    if (!data.syncTiming) throw new Error('Sync timing is required');
    if (!data.syncDirection) throw new Error('Sync direction is required');

    // 定期同期の場合、間隔が必須
    if (data.syncTiming === 'periodic' && !data.syncIntervalSeconds) {
      throw new Error('Sync interval is required for periodic sync');
    }

    // DB同期の場合、認証設定とステップが必須
    if (data.syncMethod === 'db') {
      if (!data.authConfig) throw new Error('Auth config is required for DB sync');
      if (
        data.syncDirection !== 'send_only' &&
        (!data.receiveSteps || data.receiveSteps.length === 0)
      ) {
        throw new Error('Receive steps are required for receiving data');
      }
      if (
        data.syncDirection !== 'receive_only' &&
        (!data.sendSteps || data.sendSteps.length === 0)
      ) {
        throw new Error('Send steps are required for sending data');
      }
    }

    // CSV同期の場合、CSV設定が必須
    if (data.syncMethod === 'csv') {
      if (!data.csvConfig) throw new Error('CSV config is required for CSV sync');
      if (data.syncTiming === 'periodic') {
        throw new Error('Periodic sync is not supported for CSV sync');
      }
    }
  }

  // Getters
  getId(): string { return this.data.id; }
  getStorageKey(): string { return this.data.storageKey; }
  isEnabled(): boolean { return this.data.enabled; }
  getSyncMethod(): SyncMethod { return this.data.syncMethod; }
  getSyncTiming(): SyncTiming { return this.data.syncTiming; }
  getSyncIntervalSeconds(): number | undefined { return this.data.syncIntervalSeconds; }
  getSyncDirection(): SyncDirection { return this.data.syncDirection; }
  getAuthConfig(): AuthConfig | undefined { return this.data.authConfig; }
  getReceiveSteps(): SyncStep[] | undefined { return this.data.receiveSteps; }
  getSendSteps(): SyncStep[] | undefined { return this.data.sendSteps; }
  getCSVConfig(): CSVConfig | undefined { return this.data.csvConfig; }
  getConflictResolution(): string { return this.data.conflictResolution; }
  getLastSyncDate(): string | undefined { return this.data.lastSyncDate; }
  getLastSyncStatus(): 'success' | 'failed' | undefined { return this.data.lastSyncStatus; }
  getLastSyncError(): string | undefined { return this.data.lastSyncError; }
  getCreatedAt(): string { return this.data.createdAt; }
  getUpdatedAt(): string { return this.data.updatedAt; }

  // Immutable setters
  setEnabled(enabled: boolean): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      enabled,
      updatedAt: new Date().toISOString(),
    });
  }

  setSyncTiming(timing: SyncTiming, intervalSeconds?: number): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      syncTiming: timing,
      syncIntervalSeconds: intervalSeconds,
      updatedAt: new Date().toISOString(),
    });
  }

  setSyncDirection(direction: SyncDirection): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      syncDirection: direction,
      updatedAt: new Date().toISOString(),
    });
  }

  setAuthConfig(authConfig: AuthConfig): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      authConfig,
      updatedAt: new Date().toISOString(),
    });
  }

  setReceiveSteps(steps: SyncStep[]): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      receiveSteps: steps,
      updatedAt: new Date().toISOString(),
    });
  }

  setSendSteps(steps: SyncStep[]): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      sendSteps: steps,
      updatedAt: new Date().toISOString(),
    });
  }

  setCSVConfig(csvConfig: CSVConfig): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      csvConfig,
      updatedAt: new Date().toISOString(),
    });
  }

  setSyncResult(status: 'success' | 'failed', error?: string): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      lastSyncDate: new Date().toISOString(),
      lastSyncStatus: status,
      lastSyncError: error,
      updatedAt: new Date().toISOString(),
    });
  }

  // Export
  toData(): StorageSyncConfigData {
    return { ...this.data };
  }

  // Clone
  clone(): StorageSyncConfig {
    return new StorageSyncConfig({ ...this.data });
  }

  // Static factory
  static create(params: {
    storageKey: string;
    syncMethod: SyncMethod;
    syncTiming: SyncTiming;
    syncDirection: SyncDirection;
    syncIntervalSeconds?: number;
    authConfig?: AuthConfig;
    receiveSteps?: SyncStep[];
    sendSteps?: SyncStep[];
    csvConfig?: CSVConfig;
    conflictResolution?: 'latest_timestamp' | 'local_priority' | 'remote_priority' | 'user_confirm';
  }): StorageSyncConfig {
    return new StorageSyncConfig({
      id: uuidv4(),
      storageKey: params.storageKey,
      enabled: true,
      syncMethod: params.syncMethod,
      syncTiming: params.syncTiming,
      syncDirection: params.syncDirection,
      syncIntervalSeconds: params.syncIntervalSeconds,
      authConfig: params.authConfig,
      receiveSteps: params.receiveSteps,
      sendSteps: params.sendSteps,
      csvConfig: params.csvConfig,
      conflictResolution: params.conflictResolution || 'latest_timestamp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
```

### 2.2 SyncResult Entity

```typescript
// src/domain/entities/SyncResult.ts

export interface SyncResultData {
  id: string;
  syncConfigId: string;
  storageKey: string;
  direction: 'receive' | 'send';
  status: 'success' | 'failed';
  itemsReceived?: number;
  itemsSent?: number;
  itemsUpdated?: number;
  itemsDeleted?: number;
  errorMessage?: string;
  syncedAt: string; // ISO 8601
}

export class SyncResult {
  private data: SyncResultData;

  constructor(data: SyncResultData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: SyncResultData): void {
    if (!data.id) throw new Error('ID is required');
    if (!data.syncConfigId) throw new Error('Sync config ID is required');
    if (!data.storageKey) throw new Error('Storage key is required');
    if (!data.direction) throw new Error('Direction is required');
    if (!data.status) throw new Error('Status is required');
    if (!data.syncedAt) throw new Error('Synced date is required');
  }

  // Getters
  getId(): string { return this.data.id; }
  getSyncConfigId(): string { return this.data.syncConfigId; }
  getStorageKey(): string { return this.data.storageKey; }
  getDirection(): 'receive' | 'send' { return this.data.direction; }
  getStatus(): 'success' | 'failed' { return this.data.status; }
  getItemsReceived(): number | undefined { return this.data.itemsReceived; }
  getItemsSent(): number | undefined { return this.data.itemsSent; }
  getItemsUpdated(): number | undefined { return this.data.itemsUpdated; }
  getItemsDeleted(): number | undefined { return this.data.itemsDeleted; }
  getErrorMessage(): string | undefined { return this.data.errorMessage; }
  getSyncedAt(): string { return this.data.syncedAt; }

  // Export
  toData(): SyncResultData {
    return { ...this.data };
  }

  // Static factory
  static create(params: {
    syncConfigId: string;
    storageKey: string;
    direction: 'receive' | 'send';
    status: 'success' | 'failed';
    itemsReceived?: number;
    itemsSent?: number;
    itemsUpdated?: number;
    itemsDeleted?: number;
    errorMessage?: string;
  }): SyncResult {
    return new SyncResult({
      id: uuidv4(),
      syncConfigId: params.syncConfigId,
      storageKey: params.storageKey,
      direction: params.direction,
      status: params.status,
      itemsReceived: params.itemsReceived,
      itemsSent: params.itemsSent,
      itemsUpdated: params.itemsUpdated,
      itemsDeleted: params.itemsDeleted,
      errorMessage: params.errorMessage,
      syncedAt: new Date().toISOString(),
    });
  }
}
```

## 3. Repository 設計

### 3.1 IStorageSyncConfigRepository

```typescript
// src/domain/repositories/IStorageSyncConfigRepository.ts

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';

export interface IStorageSyncConfigRepository {
  /**
   * Save storage sync config
   */
  save(config: StorageSyncConfig): Promise<void>;

  /**
   * Load storage sync config by ID
   */
  load(id: string): Promise<StorageSyncConfig | null>;

  /**
   * Load storage sync config by storage key
   */
  loadByStorageKey(storageKey: string): Promise<StorageSyncConfig | null>;

  /**
   * Load all storage sync configs
   */
  loadAll(): Promise<StorageSyncConfig[]>;

  /**
   * Load all enabled storage sync configs for periodic sync
   */
  loadAllEnabledPeriodic(): Promise<StorageSyncConfig[]>;

  /**
   * Delete storage sync config by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Delete storage sync config by storage key
   */
  deleteByStorageKey(storageKey: string): Promise<void>;

  /**
   * Check if storage sync config exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if storage sync config exists for storage key
   */
  existsByStorageKey(storageKey: string): Promise<boolean>;
}
```

## 4. Service 設計

### 4.1 ISyncService

```typescript
// src/domain/services/ISyncService.ts

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { SyncResult } from '@domain/entities/SyncResult';

export interface ISyncService {
  /**
   * Execute sync (receive and/or send based on config)
   */
  executeSync(config: StorageSyncConfig): Promise<SyncResult[]>;

  /**
   * Test sync connection (dry-run)
   */
  testSync(config: StorageSyncConfig): Promise<{
    receiveTest?: { success: boolean; itemCount?: number; error?: string };
    sendTest?: { success: boolean; itemCount?: number; error?: string };
  }>;
}
```

### 4.2 DBSyncService

```typescript
// src/infrastructure/services/DBSyncService.ts

import { ISyncService } from '@domain/services/ISyncService';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { SyncResult } from '@domain/entities/SyncResult';
import { IHttpClient } from '@domain/services/IHttpClient';
import { IDataMapper } from '@domain/services/IDataMapper';
import { ILogger } from '@domain/services/ILogger';
import browser from 'webextension-polyfill';

export class DBSyncService implements ISyncService {
  constructor(
    private httpClient: IHttpClient,
    private dataMapper: IDataMapper,
    private logger: ILogger
  ) {}

  async executeSync(config: StorageSyncConfig): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const direction = config.getSyncDirection();

    // 受信処理
    if (direction === 'bidirectional' || direction === 'receive_only') {
      const receiveResult = await this.executeReceive(config);
      results.push(receiveResult);
    }

    // 送信処理
    if (direction === 'bidirectional' || direction === 'send_only') {
      const sendResult = await this.executeSend(config);
      results.push(sendResult);
    }

    return results;
  }

  async testSync(config: StorageSyncConfig): Promise<{
    receiveTest?: { success: boolean; itemCount?: number; error?: string };
    sendTest?: { success: boolean; itemCount?: number; error?: string };
  }> {
    const result: any = {};
    const direction = config.getSyncDirection();

    // 受信テスト
    if (direction === 'bidirectional' || direction === 'receive_only') {
      try {
        const testResult = await this.testReceive(config);
        result.receiveTest = {
          success: true,
          itemCount: testResult.itemCount,
        };
      } catch (error) {
        result.receiveTest = {
          success: false,
          error: error.message,
        };
      }
    }

    // 送信テスト
    if (direction === 'bidirectional' || direction === 'send_only') {
      try {
        const testResult = await this.testSend(config);
        result.sendTest = {
          success: true,
          itemCount: testResult.itemCount,
        };
      } catch (error) {
        result.sendTest = {
          success: false,
          error: error.message,
        };
      }
    }

    return result;
  }

  private async executeReceive(config: StorageSyncConfig): Promise<SyncResult> {
    try {
      this.logger.info(`Executing receive sync for ${config.getStorageKey()}`);

      const receiveSteps = config.getReceiveSteps();
      if (!receiveSteps || receiveSteps.length === 0) {
        throw new Error('No receive steps configured');
      }

      let receivedData: any = null;

      // ステップを順番に実行
      for (const step of receiveSteps) {
        const request = this.buildRequest(step, {}, config.getAuthConfig());
        const response = await this.httpClient.request(request);

        if (response.status < 200 || response.status >= 300) {
          throw new Error(`HTTP ${response.status}: ${response.body}`);
        }

        const responseData = JSON.parse(response.body);

        // レスポンスマッピングに基づいてデータ抽出
        if (step.responseMapping) {
          receivedData = this.dataMapper.extract(responseData, step.responseMapping.dataPath);
        } else {
          receivedData = responseData;
        }
      }

      // localStorage に保存
      const storageKey = config.getStorageKey();
      const existingData = await this.loadFromStorage(storageKey);
      const mergedData = this.mergeData(existingData, receivedData, config.getConflictResolution());

      await this.saveToStorage(storageKey, mergedData);

      const itemCount = Array.isArray(receivedData) ? receivedData.length : 1;

      this.logger.info(`Receive sync completed: ${itemCount} items`);

      return SyncResult.create({
        syncConfigId: config.getId(),
        storageKey: config.getStorageKey(),
        direction: 'receive',
        status: 'success',
        itemsReceived: itemCount,
      });
    } catch (error) {
      this.logger.error('Receive sync failed', error);

      return SyncResult.create({
        syncConfigId: config.getId(),
        storageKey: config.getStorageKey(),
        direction: 'receive',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  private async executeSend(config: StorageSyncConfig): Promise<SyncResult> {
    try {
      this.logger.info(`Executing send sync for ${config.getStorageKey()}`);

      const sendSteps = config.getSendSteps();
      if (!sendSteps || sendSteps.length === 0) {
        throw new Error('No send steps configured');
      }

      // localStorage からデータ読み込み
      const storageKey = config.getStorageKey();
      const localData = await this.loadFromStorage(storageKey);

      // ステップを順番に実行
      for (const step of sendSteps) {
        const request = this.buildRequest(
          step,
          { localStorage: JSON.stringify(localData) },
          config.getAuthConfig()
        );
        const response = await this.httpClient.request(request);

        if (response.status < 200 || response.status >= 300) {
          throw new Error(`HTTP ${response.status}: ${response.body}`);
        }
      }

      const itemCount = Array.isArray(localData) ? localData.length : 1;

      this.logger.info(`Send sync completed: ${itemCount} items`);

      return SyncResult.create({
        syncConfigId: config.getId(),
        storageKey: config.getStorageKey(),
        direction: 'send',
        status: 'success',
        itemsSent: itemCount,
      });
    } catch (error) {
      this.logger.error('Send sync failed', error);

      return SyncResult.create({
        syncConfigId: config.getId(),
        storageKey: config.getStorageKey(),
        direction: 'send',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  private async testReceive(config: StorageSyncConfig): Promise<{ itemCount: number }> {
    // executeReceive と同じだが、localStorage には保存しない
    const receiveSteps = config.getReceiveSteps();
    if (!receiveSteps || receiveSteps.length === 0) {
      throw new Error('No receive steps configured');
    }

    let receivedData: any = null;

    for (const step of receiveSteps) {
      const request = this.buildRequest(step, {}, config.getAuthConfig());
      const response = await this.httpClient.request(request);

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP ${response.status}: ${response.body}`);
      }

      const responseData = JSON.parse(response.body);

      if (step.responseMapping) {
        receivedData = this.dataMapper.extract(responseData, step.responseMapping.dataPath);
      } else {
        receivedData = responseData;
      }
    }

    const itemCount = Array.isArray(receivedData) ? receivedData.length : 1;
    return { itemCount };
  }

  private async testSend(config: StorageSyncConfig): Promise<{ itemCount: number }> {
    // executeSend と同じ
    const sendSteps = config.getSendSteps();
    if (!sendSteps || sendSteps.length === 0) {
      throw new Error('No send steps configured');
    }

    const storageKey = config.getStorageKey();
    const localData = await this.loadFromStorage(storageKey);

    for (const step of sendSteps) {
      const request = this.buildRequest(
        step,
        { localStorage: JSON.stringify(localData) },
        config.getAuthConfig()
      );
      const response = await this.httpClient.request(request);

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP ${response.status}: ${response.body}`);
      }
    }

    const itemCount = Array.isArray(localData) ? localData.length : 1;
    return { itemCount };
  }

  private buildRequest(step: any, variables: any, authConfig: any): any {
    // URL: 変数置換
    let url = step.url;
    for (const [key, value] of Object.entries(variables)) {
      url = url.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
    }

    // Headers: 認証情報を追加
    const headers = { ...step.headers };

    if (authConfig?.type === 'bearer' && authConfig.credentials.token) {
      headers['Authorization'] = `Bearer ${authConfig.credentials.token}`;
    } else if (authConfig?.type === 'apikey' && authConfig.credentials.apiKey) {
      headers['X-API-Key'] = authConfig.credentials.apiKey;
    } else if (authConfig?.type === 'basic' && authConfig.credentials.username) {
      const credentials = btoa(
        `${authConfig.credentials.username}:${authConfig.credentials.password}`
      );
      headers['Authorization'] = `Basic ${credentials}`;
    }

    // Body: 変数置換
    let body = step.body;
    if (body) {
      for (const [key, value] of Object.entries(variables)) {
        body = body.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
      }
    }

    return {
      method: step.method,
      url,
      headers,
      body,
      timeout: 30000,
    };
  }

  private async loadFromStorage(key: string): Promise<any> {
    const result = await browser.storage.local.get(key);
    return result[key] || null;
  }

  private async saveToStorage(key: string, data: any): Promise<void> {
    await browser.storage.local.set({ [key]: data });
  }

  private mergeData(existing: any, received: any, resolution: string): any {
    // 簡易実装: received で上書き
    // TODO: 競合解決ロジックを実装
    return received;
  }
}
```

### 4.3 CSVSyncService

```typescript
// src/infrastructure/services/CSVSyncService.ts

import { ISyncService } from '@domain/services/ISyncService';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { SyncResult } from '@domain/entities/SyncResult';
import { ICSVConverter } from '@domain/services/ICSVConverter';
import { ILogger } from '@domain/services/ILogger';
import browser from 'webextension-polyfill';

export class CSVSyncService implements ISyncService {
  constructor(
    private csvConverter: ICSVConverter,
    private logger: ILogger
  ) {}

  async executeSync(config: StorageSyncConfig): Promise<SyncResult[]> {
    throw new Error('CSV sync must be executed manually via import/export');
  }

  async testSync(config: StorageSyncConfig): Promise<any> {
    // CSV 同期にはテストは不要
    return { success: true };
  }

  /**
   * Import CSV file to localStorage
   */
  async importCSV(config: StorageSyncConfig, csvContent: string): Promise<SyncResult> {
    try {
      this.logger.info(`Importing CSV for ${config.getStorageKey()}`);

      const csvConfig = config.getCSVConfig();
      if (!csvConfig) {
        throw new Error('CSV config is not defined');
      }

      // CSV をパース
      const parsedData = await this.csvConverter.parse(csvContent, {
        delimiter: csvConfig.delimiter,
        hasHeader: csvConfig.hasHeader,
      });

      // フィールドマッピングを適用
      const mappedData = this.applyFieldMapping(parsedData, csvConfig.fieldMapping);

      // localStorage に保存
      const storageKey = config.getStorageKey();
      const existingData = await this.loadFromStorage(storageKey);
      const mergedData = this.mergeData(existingData, mappedData, config.getConflictResolution());

      await this.saveToStorage(storageKey, mergedData);

      const itemCount = Array.isArray(mappedData) ? mappedData.length : 1;

      this.logger.info(`CSV import completed: ${itemCount} items`);

      return SyncResult.create({
        syncConfigId: config.getId(),
        storageKey: config.getStorageKey(),
        direction: 'receive',
        status: 'success',
        itemsReceived: itemCount,
      });
    } catch (error) {
      this.logger.error('CSV import failed', error);

      return SyncResult.create({
        syncConfigId: config.getId(),
        storageKey: config.getStorageKey(),
        direction: 'receive',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  /**
   * Export localStorage to CSV file
   */
  async exportCSV(config: StorageSyncConfig): Promise<{ csvContent: string; itemCount: number }> {
    try {
      this.logger.info(`Exporting CSV for ${config.getStorageKey()}`);

      const csvConfig = config.getCSVConfig();
      if (!csvConfig) {
        throw new Error('CSV config is not defined');
      }

      // localStorage からデータ読み込み
      const storageKey = config.getStorageKey();
      const localData = await this.loadFromStorage(storageKey);

      // フィールドマッピングを逆適用
      const unmappedData = this.reverseFieldMapping(localData, csvConfig.fieldMapping);

      // CSV 生成
      const csvContent = await this.csvConverter.generate(unmappedData, {
        delimiter: csvConfig.delimiter,
        hasHeader: csvConfig.hasHeader,
      });

      const itemCount = Array.isArray(localData) ? localData.length : 1;

      this.logger.info(`CSV export completed: ${itemCount} items`);

      return { csvContent, itemCount };
    } catch (error) {
      this.logger.error('CSV export failed', error);
      throw error;
    }
  }

  private applyFieldMapping(data: any[], mapping: any[]): any[] {
    return data.map((row) => {
      const mapped: any = {};
      for (const map of mapping) {
        if (row[map.csvColumn] !== undefined) {
          mapped[map.storageField] = row[map.csvColumn];
        }
      }
      return mapped;
    });
  }

  private reverseFieldMapping(data: any[], mapping: any[]): any[] {
    return data.map((item) => {
      const unmapped: any = {};
      for (const map of mapping) {
        if (item[map.storageField] !== undefined) {
          unmapped[map.csvColumn] = item[map.storageField];
        }
      }
      return unmapped;
    });
  }

  private async loadFromStorage(key: string): Promise<any> {
    const result = await browser.storage.local.get(key);
    return result[key] || null;
  }

  private async saveToStorage(key: string, data: any): Promise<void> {
    await browser.storage.local.set({ [key]: data });
  }

  private mergeData(existing: any, received: any, resolution: string): any {
    // 簡易実装: received で上書き
    // TODO: 競合解決ロジックを実装
    return received;
  }
}
```

## 5. Use Case 設計

### 5.1 ExecuteStorageSyncUseCase

```typescript
// src/usecases/ExecuteStorageSyncUseCase.ts

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { SyncResult } from '@domain/entities/SyncResult';
import { IStorageSyncConfigRepository } from '@domain/repositories/IStorageSyncConfigRepository';
import { ISyncService } from '@domain/services/ISyncService';
import { ILogger } from '@domain/services/ILogger';

export class ExecuteStorageSyncUseCase {
  constructor(
    private syncConfigRepo: IStorageSyncConfigRepository,
    private dbSyncService: ISyncService, // DBSyncService
    private csvSyncService: ISyncService, // CSVSyncService
    private logger: ILogger
  ) {}

  async execute(configIdOrStorageKey: string): Promise<SyncResult[]> {
    // 1. Load sync config
    let config = await this.syncConfigRepo.load(configIdOrStorageKey);
    if (!config) {
      config = await this.syncConfigRepo.loadByStorageKey(configIdOrStorageKey);
    }

    if (!config) {
      throw new Error(`Sync config not found: ${configIdOrStorageKey}`);
    }

    if (!config.isEnabled()) {
      throw new Error(`Sync is disabled for: ${config.getStorageKey()}`);
    }

    // 2. Execute sync based on method
    let results: SyncResult[];

    if (config.getSyncMethod() === 'db') {
      results = await this.dbSyncService.executeSync(config);
    } else if (config.getSyncMethod() === 'csv') {
      throw new Error('CSV sync must be executed via importCSV/exportCSV methods');
    } else {
      throw new Error(`Unknown sync method: ${config.getSyncMethod()}`);
    }

    // 3. Update sync config with result
    const lastResult = results[results.length - 1];
    const updatedConfig = config.setSyncResult(
      lastResult.getStatus(),
      lastResult.getErrorMessage()
    );
    await this.syncConfigRepo.save(updatedConfig);

    return results;
  }
}
```

## 6. StorageKeys の更新

```typescript
// src/domain/constants/StorageKeys.ts

export const STORAGE_KEYS = {
  XPATH_COLLECTION: 'xpathCollectionCSV',
  WEBSITE_CONFIGS: 'websiteConfigs',
  SYSTEM_SETTINGS: 'systemSettings',
  AUTOMATION_VARIABLES: 'automationVariables',
  AUTOMATION_RESULTS: 'automationResults',
  STORAGE_SYNC_CONFIGS: 'storageSyncConfigs', // 追加
} as const;
```

## 7. 定期同期スケジューラー

```typescript
// src/infrastructure/scheduler/PeriodicSyncScheduler.ts

import { IStorageSyncConfigRepository } from '@domain/repositories/IStorageSyncConfigRepository';
import { ExecuteStorageSyncUseCase } from '@usecases/ExecuteStorageSyncUseCase';
import { ILogger } from '@domain/services/ILogger';

export class PeriodicSyncScheduler {
  private timers: Map<string, number> = new Map();

  constructor(
    private syncConfigRepo: IStorageSyncConfigRepository,
    private executeSyncUseCase: ExecuteStorageSyncUseCase,
    private logger: ILogger
  ) {}

  /**
   * Start periodic sync scheduler
   */
  async start(): Promise<void> {
    this.logger.info('Starting periodic sync scheduler');

    // Load all enabled periodic sync configs
    const configs = await this.syncConfigRepo.loadAllEnabledPeriodic();

    for (const config of configs) {
      this.scheduleSync(config.getId(), config.getSyncIntervalSeconds()!);
    }
  }

  /**
   * Stop periodic sync scheduler
   */
  stop(): void {
    this.logger.info('Stopping periodic sync scheduler');

    for (const [configId, timerId] of this.timers.entries()) {
      clearInterval(timerId);
      this.logger.info(`Stopped sync timer for config: ${configId}`);
    }

    this.timers.clear();
  }

  /**
   * Schedule sync for a config
   */
  scheduleSync(configId: string, intervalSeconds: number): void {
    // Clear existing timer if any
    if (this.timers.has(configId)) {
      clearInterval(this.timers.get(configId)!);
    }

    // Set new timer
    const timerId = setInterval(async () => {
      try {
        this.logger.info(`Executing periodic sync for config: ${configId}`);
        await this.executeSyncUseCase.execute(configId);
      } catch (error) {
        this.logger.error(`Periodic sync failed for config: ${configId}`, error);
      }
    }, intervalSeconds * 1000);

    this.timers.set(configId, timerId as any);
    this.logger.info(`Scheduled sync timer for config: ${configId} (${intervalSeconds}s)`);
  }

  /**
   * Unschedule sync for a config
   */
  unscheduleSync(configId: string): void {
    if (this.timers.has(configId)) {
      clearInterval(this.timers.get(configId)!);
      this.timers.delete(configId);
      this.logger.info(`Unscheduled sync timer for config: ${configId}`);
    }
  }

  /**
   * Reschedule sync for a config (update interval)
   */
  rescheduleSync(configId: string, intervalSeconds: number): void {
    this.unscheduleSync(configId);
    this.scheduleSync(configId, intervalSeconds);
  }
}
```

---

# 作業手順

## Phase 1: Entity & Repository (4日)

### 1.1 Entity 作成
- [ ] StorageSyncConfig エンティティ作成
- [ ] SyncResult エンティティ作成
- [ ] ユニットテスト作成

### 1.2 Repository 作成
- [ ] IStorageSyncConfigRepository インターフェース作成
- [ ] ChromeStorageStorageSyncConfigRepository 実装
- [ ] TokenEncryptionService 実装（**CryptoService インターフェースを使用** - Phase 1で実装済み）
- [ ] ユニットテスト作成

**Note**: `CryptoService` インターフェースと `WebCryptoService` 実装は Phase 1 (Section 3.2) で完了済み。
`TokenEncryptionService` は依存性注入により `CryptoService` を受け取る設計とする。

### 1.3 StorageKeys 更新
- [ ] STORAGE_KEYS に STORAGE_SYNC_CONFIGS 追加

## Phase 2: Services (5日)

### 2.1 HTTP Client & Data Mapper
- [ ] IHttpClient インターフェース作成
- [ ] ChromeHttpClient 実装
- [ ] IDataMapper インターフェース作成
- [ ] JsonPathDataMapper 実装
- [ ] ユニットテスト作成

### 2.2 Sync Services
- [ ] ISyncService インターフェース作成
- [ ] DBSyncService 実装
- [ ] CSVSyncService 実装
- [ ] ユニットテスト作成

### 2.3 CSV Converter
- [ ] ICSVConverter インターフェース作成
- [ ] CSVConverter 実装（PapaParse ライブラリ使用）
- [ ] ユニットテスト作成

### 2.4 パッケージ追加
- [ ] `npm install jsonpath papaparse` 実行
- [ ] `npm install --save-dev @types/papaparse` 実行

## Phase 3: Use Cases (4日)

### 3.1 CRUD Use Cases
- [ ] CreateStorageSyncConfigUseCase
- [ ] UpdateStorageSyncConfigUseCase
- [ ] DeleteStorageSyncConfigUseCase
- [ ] GetStorageSyncConfigsUseCase
- [ ] ユニットテスト作成

### 3.2 Sync Use Cases
- [ ] ExecuteStorageSyncUseCase
- [ ] ImportCSVUseCase
- [ ] ExportCSVUseCase
- [ ] TestStorageSyncUseCase
- [ ] ユニットテスト作成
- [ ] 統合テスト作成

## Phase 4: Scheduler (2日)

### 4.1 定期同期スケジューラー
- [ ] PeriodicSyncScheduler 実装
- [ ] background script に統合
- [ ] ユニットテスト作成

## Phase 5: UI - データ同期タブ (6日)

### 5.1 データ同期タブ追加
- [ ] SystemSettingsManager にデータ同期タブ追加
- [ ] StorageSyncList コンポーネント作成
- [ ] localStorage キーごとの同期設定表示

### 5.2 同期設定モーダル
- [ ] StorageSyncConfigModal コンポーネント作成
- [ ] 同期方法選択フォーム実装
- [ ] 同期タイミング・種別設定フォーム実装
- [ ] DB同期: 認証設定フォーム実装
- [ ] DB同期: 受信ステップ設定フォーム実装
- [ ] DB同期: 送信ステップ設定フォーム実装
- [ ] CSV同期: CSV設定フォーム実装

### 5.3 テスト機能
- [ ] DB同期: 受信テスト実行ボタン実装
- [ ] DB同期: 送信テスト実行ボタン実装
- [ ] テスト結果表示実装

### 5.4 手動同期機能
- [ ] DB同期: 「今すぐ同期」ボタン実装
- [ ] CSV同期: 「インポート」ボタン実装
- [ ] CSV同期: 「エクスポート」ボタン実装
- [ ] 同期進捗表示実装
- [ ] 同期結果通知実装

### 5.5 スタイリング
- [ ] CSS 作成
- [ ] レスポンシブ対応

### 5.6 多言語対応
- [ ] messages.json に文言追加（日本語・英語）

## Phase 6: エラーハンドリング & 競合解決 (3日)

### 6.1 エラーハンドリング
- [ ] 認証エラーハンドリング
- [ ] ネットワークエラーハンドリング
- [ ] データ形式エラーハンドリング
- [ ] CSV形式エラーハンドリング
- [ ] エラー通知実装

### 6.2 競合解決
- [ ] タイムスタンプ比較ロジック実装
- [ ] 競合解決ポリシーの実装
- [ ] 競合確認ダイアログ実装（user_confirm の場合）

### 6.3 リトライ処理
- [ ] DB同期のリトライ処理実装
- [ ] リトライ回数・間隔設定

## Phase 7: ドキュメント & テスト (3日)

### 7.1 ドキュメント作成
- [ ] ユーザーマニュアル作成
- [ ] API 設定例（Notion、Google Sheets、カスタムAPI）作成
- [ ] CSV フォーマット例作成
- [ ] トラブルシューティングガイド作成

### 7.2 総合テスト
- [ ] E2E テスト実施
- [ ] セキュリティレビュー
- [ ] パフォーマンステスト
- [ ] 定期同期の動作確認

## Phase 8: リリース準備 (1日)

### 8.1 最終確認
- [ ] すべてのテスト実行
- [ ] コードレビュー
- [ ] ドキュメント最終確認

### 8.2 リリースノート作成
- [ ] 変更内容まとめ
- [ ] 使用方法説明

---

# 推定工数

- Phase 1: 4日
- Phase 2: 5日
- Phase 3: 4日
- Phase 4: 2日
- Phase 5: 6日
- Phase 6: 3日
- Phase 7: 3日
- Phase 8: 1日

**合計: 28日**

---

# リスクと対策

## リスク1: 定期同期のパフォーマンス影響

**リスク**: バックグラウンドでの定期同期が重くなる

**対策**:
- 同期間隔の最小値を設定（例: 60秒以上）
- 同期中はバッチ処理を最適化
- 同期失敗時の指数バックオフ

## リスク2: localStorage データの破損

**リスク**: 同期中にエラーが発生し、データが破損する

**対策**:
- 同期前にバックアップを作成
- トランザクショナルな更新
- ロールバック機能

## リスク3: CSV インポートの互換性

**リスク**: 様々な CSV 形式に対応する必要がある

**対策**:
- PapaParse ライブラリで柔軟に対応
- プレビュー機能でインポート前に確認
- エラー時の詳細なメッセージ

## リスク4: セキュリティ懸念

**リスク**: 認証情報の漏洩、不正なデータの受信

**対策**:
- 認証情報の暗号化
- データ検証
- HTTPS 必須

---

# 今後の拡張案

1. **プリセット機能**: Notion、Google Sheets 用のテンプレート
2. **差分同期**: 変更されたデータのみを送受信
3. **同期履歴**: 過去の同期結果を一覧表示
4. **Webhook サポート**: リアルタイムでデータを受信
5. **複数アカウント対応**: 同じサービスで複数アカウントを管理
6. **同期スケジュール**: 時刻指定での同期
7. **データフィルタリング**: 同期するデータの条件指定
8. **バージョン管理**: データの変更履歴を保持
