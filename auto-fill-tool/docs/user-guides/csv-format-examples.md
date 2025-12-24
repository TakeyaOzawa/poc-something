# CSV フォーマット例集

**最終更新日**: 2025-01-18
**バージョン**: 1.0.0

このドキュメントでは、Auto Fill Toolのデータ同期機能で使用できるCSVファイルの形式を詳しく説明します。

---

## 📋 目次

1. [基本ルール](#1-基本ルール)
2. [自動化変数 (Automation Variables)](#2-自動化変数-automation-variables)
3. [Webサイト設定 (Websites)](#3-webサイト設定-websites)
4. [XPath設定 (XPaths)](#4-xpath設定-xpaths)
5. [文字コードと区切り文字](#5-文字コードと区切り文字)
6. [エラー例と修正方法](#6-エラー例と修正方法)
7. [Excelでの編集方法](#7-excelでの編集方法)
8. [よくある質問](#8-よくある質問)

---

## 1. 基本ルール

### 1.1 共通ルール

すべてのCSVファイルに適用される基本ルールです：

✅ **必須項目**:
- 1行目はヘッダー行（カラム名）
- 2行目以降がデータ行
- UTF-8エンコーディングを推奨

✅ **データ形式**:
- 区切り文字: カンマ (`,`) / セミコロン (`;`) / タブ (`\t`)
- 改行: LF (`\n`) または CRLF (`\r\n`)
- 引用符: ダブルクォート (`"`) でエスケープ

❌ **禁止事項**:
- ヘッダー行の省略（必ず1行目に配置）
- 空行の挿入（データ行の間に空行を入れない）
- カラム数の不一致（すべての行で同じ数のカラム）

### 1.2 特殊文字のエスケープ

カンマ、改行、ダブルクォートを含むデータは、ダブルクォートで囲みます：

| データ | CSVでの表記 |
|--------|------------|
| `Hello, World` | `"Hello, World"` |
| `Line1\nLine2` | `"Line1\nLine2"` |
| `Say "Hello"` | `"Say ""Hello"""` |

**例**:
```csv
id,name,value
1,"ユーザー名, 会社","test_user"
2,"パスワード","pass""123"""
3,"メッセージ","Hello
World"
```

---

## 2. 自動化変数 (Automation Variables)

### 2.1 基本フォーマット

自動化変数のCSVファイルには以下のカラムが必要です：

| カラム名 | 必須 | データ型 | 説明 |
|---------|------|---------|------|
| `id` | ✅ | 文字列 | 一意のID（UUID推奨） |
| `name` | ✅ | 文字列 | 変数名 |
| `value` | ✅ | 文字列 | 変数の値 |
| `description` | ❌ | 文字列 | 説明（任意） |
| `created_at` | ❌ | ISO8601 | 作成日時（任意） |
| `updated_at` | ❌ | ISO8601 | 更新日時（任意） |

### 2.2 サンプルCSV

#### 最小構成（必須カラムのみ）

```csv
id,name,value
550e8400-e29b-41d4-a716-446655440000,ユーザー名,test_user
550e8400-e29b-41d4-a716-446655440001,パスワード,password123
550e8400-e29b-41d4-a716-446655440002,メールアドレス,user@example.com
```

#### 完全版（すべてのカラム）

```csv
id,name,value,description,created_at,updated_at
550e8400-e29b-41d4-a716-446655440000,ユーザー名,test_user,テスト環境のログインユーザー名,2025-01-01T00:00:00Z,2025-01-15T12:30:00Z
550e8400-e29b-41d4-a716-446655440001,パスワード,password123,テスト環境のパスワード,2025-01-01T00:00:00Z,2025-01-15T12:30:00Z
550e8400-e29b-41d4-a716-446655440002,メールアドレス,user@example.com,通知先メールアドレス,2025-01-02T10:00:00Z,2025-01-15T12:30:00Z
550e8400-e29b-41d4-a716-446655440003,API URL,https://api.example.com/v1,APIのベースURL,2025-01-03T15:00:00Z,2025-01-15T12:30:00Z
550e8400-e29b-41d4-a716-446655440004,タイムアウト,30000,API通信のタイムアウト（ミリ秒）,2025-01-03T15:00:00Z,2025-01-15T12:30:00Z
```

### 2.3 実践的な例

#### ログイン情報のセット

```csv
id,name,value,description
1,本番環境_ユーザー名,prod_user,本番環境のログインユーザー名
2,本番環境_パスワード,Prod@2025!,本番環境のパスワード
3,開発環境_ユーザー名,dev_user,開発環境のログインユーザー名
4,開発環境_パスワード,Dev@2025!,開発環境のパスワード
5,ステージング環境_ユーザー名,staging_user,ステージング環境のログインユーザー名
6,ステージング環境_パスワード,Staging@2025!,ステージング環境のパスワード
```

#### API設定のセット

```csv
id,name,value,description
api-1,Notion API Key,secret_xxxxxxxxxxxxxxxxxxxx,Notion Integration Token
api-2,Google Sheets Spreadsheet ID,1abc...xyz,Google Sheets のスプレッドシートID
api-3,Slack Webhook URL,https://hooks.slack.com/services/xxx/yyy/zzz,Slack通知用のWebhook URL
api-4,GitHub Personal Access Token,ghp_xxxxxxxxxxxxxxxxxxxx,GitHub API用のPersonal Access Token
```

---

## 3. Webサイト設定 (Websites)

### 3.1 基本フォーマット

Webサイト設定のCSVファイルには以下のカラムが必要です：

| カラム名 | 必須 | データ型 | 説明 |
|---------|------|---------|------|
| `id` | ✅ | 文字列 | 一意のID（UUID推奨） |
| `name` | ✅ | 文字列 | サイト名 |
| `url` | ✅ | URL | WebサイトのURL |
| `description` | ❌ | 文字列 | 説明（任意） |
| `automation_variables_id` | ❌ | 文字列 | 関連する自動化変数のID |
| `created_at` | ❌ | ISO8601 | 作成日時（任意） |
| `updated_at` | ❌ | ISO8601 | 更新日時（任意） |

### 3.2 サンプルCSV

#### 最小構成

```csv
id,name,url
w1,テスト環境ログインページ,https://test.example.com/login
w2,本番環境ログインページ,https://example.com/login
w3,管理画面,https://admin.example.com
```

#### 完全版

```csv
id,name,url,description,automation_variables_id,created_at,updated_at
w1,テスト環境ログインページ,https://test.example.com/login,テスト環境の自動ログイン設定,550e8400-e29b-41d4-a716-446655440000,2025-01-01T00:00:00Z,2025-01-15T12:30:00Z
w2,本番環境ログインページ,https://example.com/login,本番環境の自動ログイン設定,550e8400-e29b-41d4-a716-446655440001,2025-01-01T00:00:00Z,2025-01-15T12:30:00Z
w3,管理画面ダッシュボード,https://admin.example.com/dashboard,管理者用ダッシュボードへの自動遷移,550e8400-e29b-41d4-a716-446655440002,2025-01-02T10:00:00Z,2025-01-15T12:30:00Z
w4,APIドキュメント,https://docs.example.com/api,API仕様書ページ,,2025-01-03T15:00:00Z,2025-01-15T12:30:00Z
```

### 3.3 実践的な例

#### 複数環境の管理

```csv
id,name,url,description
env-dev-1,開発環境 - ログイン,https://dev.example.com/login,開発環境のログインページ
env-dev-2,開発環境 - ダッシュボード,https://dev.example.com/dashboard,開発環境のダッシュボード
env-staging-1,ステージング環境 - ログイン,https://staging.example.com/login,ステージング環境のログインページ
env-staging-2,ステージング環境 - ダッシュボード,https://staging.example.com/dashboard,ステージング環境のダッシュボード
env-prod-1,本番環境 - ログイン,https://example.com/login,本番環境のログインページ
env-prod-2,本番環境 - ダッシュボード,https://example.com/dashboard,本番環境のダッシュボード
```

---

## 4. XPath設定 (XPaths)

### 4.1 基本フォーマット

XPath設定のCSVファイルには以下のカラムが必要です：

| カラム名 | 必須 | データ型 | 説明 |
|---------|------|---------|------|
| `id` | ✅ | 文字列 | 一意のID（UUID推奨） |
| `website_id` | ✅ | 文字列 | 関連するWebサイトのID |
| `step_order` | ✅ | 数値 | 実行順序（1から始まる連番） |
| `action_type` | ✅ | 文字列 | アクションタイプ（input, click, wait等） |
| `xpath` | ✅ | 文字列 | XPath式 |
| `value` | ❌ | 文字列 | 入力値（action_type=inputの場合に必要） |
| `description` | ❌ | 文字列 | 説明（任意） |
| `created_at` | ❌ | ISO8601 | 作成日時（任意） |
| `updated_at` | ❌ | ISO8601 | 更新日時（任意） |

### 4.2 action_type の種類

| action_type | 説明 | value 必須 |
|-------------|------|-----------|
| `input` | テキスト入力 | ✅ |
| `click` | クリック | ❌ |
| `wait` | 待機 | ❌ |
| `select` | セレクトボックス選択 | ✅ |
| `hover` | マウスホバー | ❌ |

### 4.3 サンプルCSV

#### ログインフローの例

```csv
id,website_id,step_order,action_type,xpath,value,description
x1,w1,1,input,//input[@name='username'],"{{ユーザー名}}",ユーザー名を入力
x2,w1,2,input,//input[@name='password'],"{{パスワード}}",パスワードを入力
x3,w1,3,click,//button[@type='submit'],,ログインボタンをクリック
x4,w1,4,wait,//div[@class='dashboard'],,ダッシュボード表示まで待機
```

#### フォーム入力フローの例

```csv
id,website_id,step_order,action_type,xpath,value,description
f1,w2,1,input,//input[@id='first-name'],"{{名前}}",名前を入力
f2,w2,2,input,//input[@id='last-name'],"{{姓}}",姓を入力
f3,w2,3,input,//input[@id='email'],"{{メールアドレス}}",メールアドレスを入力
f4,w2,4,select,//select[@id='country'],Japan,国を選択
f5,w2,5,input,//textarea[@id='message'],"{{問い合わせ内容}}",問い合わせ内容を入力
f6,w2,6,click,//button[@id='submit'],,送信ボタンをクリック
```

### 4.4 実践的な例

#### 複雑なログインフロー（2段階認証）

```csv
id,website_id,step_order,action_type,xpath,value,description
auth-1,w3,1,input,//input[@name='email'],"{{メールアドレス}}",メールアドレスを入力
auth-2,w3,2,click,//button[text()='次へ'],,「次へ」ボタンをクリック
auth-3,w3,3,wait,//input[@name='password'],,パスワード入力画面を待機
auth-4,w3,4,input,//input[@name='password'],"{{パスワード}}",パスワードを入力
auth-5,w3,5,click,//button[text()='ログイン'],,「ログイン」ボタンをクリック
auth-6,w3,6,wait,//input[@name='otp'],,2段階認証コード入力画面を待機
auth-7,w3,7,input,//input[@name='otp'],"{{認証コード}}",2段階認証コードを入力
auth-8,w3,8,click,//button[text()='確認'],,「確認」ボタンをクリック
auth-9,w3,9,wait,//div[@class='dashboard'],,ダッシュボード表示まで待機
```

---

## 5. 文字コードと区切り文字

### 5.1 文字コードの選択

| 文字コード | 推奨度 | 使用ケース |
|-----------|-------|----------|
| **UTF-8** | ⭐⭐⭐ | 日本語・英語混在（推奨） |
| **UTF-8 BOM付き** | ⭐⭐ | Excelで開く場合 |
| **Shift-JIS** | ⭐ | レガシーシステムとの連携 |
| **EUC-JP** | ⭐ | 古いUnixシステムとの連携 |

**注意**: 特別な理由がない限り、**UTF-8** を使用することを推奨します。

### 5.2 区切り文字の選択

| 区切り文字 | 推奨度 | 使用ケース |
|-----------|-------|----------|
| **カンマ (`,`)** | ⭐⭐⭐ | 標準的なCSV（推奨） |
| **セミコロン (`;`)** | ⭐⭐ | ヨーロッパ圏のExcel |
| **タブ (`\t`)** | ⭐ | TSV形式（データにカンマが多い場合） |

**ヒント**: データにカンマが多く含まれる場合は、タブ区切りを使うとエスケープが不要になります。

### 5.3 文字化けの防止

#### Windowsの場合

**BOM付きUTF-8で保存**:
1. メモ帳でCSVファイルを開く
2. 「ファイル」→「名前を付けて保存」
3. 「エンコード」で「UTF-8 (BOM付き)」を選択
4. 保存

#### Macの場合

**UTF-8で保存**:
1. TextEditでCSVファイルを開く
2. 「フォーマット」→「標準テキストにする」
3. 「ファイル」→「保存」
4. エンコーディングを「Unicode (UTF-8)」に設定

---

## 6. エラー例と修正方法

### 6.1 よくあるエラー

#### エラー1: ヘッダー行がない

❌ **間違った例**:
```csv
550e8400-e29b-41d4-a716-446655440000,ユーザー名,test_user
550e8400-e29b-41d4-a716-446655440001,パスワード,password123
```

✅ **正しい例**:
```csv
id,name,value
550e8400-e29b-41d4-a716-446655440000,ユーザー名,test_user
550e8400-e29b-41d4-a716-446655440001,パスワード,password123
```

#### エラー2: カラム数が不一致

❌ **間違った例**:
```csv
id,name,value,description
1,ユーザー名,test_user
2,パスワード,password123,テストパスワード
```

✅ **正しい例**:
```csv
id,name,value,description
1,ユーザー名,test_user,
2,パスワード,password123,テストパスワード
```

または空のdescriptionカラムを削除：
```csv
id,name,value
1,ユーザー名,test_user
2,パスワード,password123
```

#### エラー3: カンマのエスケープ漏れ

❌ **間違った例**:
```csv
id,name,value
1,ユーザー名, 会社,test_user
```

✅ **正しい例**:
```csv
id,name,value
1,"ユーザー名, 会社",test_user
```

#### エラー4: 改行のエスケープ漏れ

❌ **間違った例**:
```csv
id,name,value
1,メッセージ,Hello
World
```

✅ **正しい例**:
```csv
id,name,value
1,メッセージ,"Hello
World"
```

### 6.2 検証ツール

CSVファイルが正しいかチェックする方法：

#### オンラインツール

- [CSV Lint](https://csvlint.io/) - CSVの構文チェック
- [CSV Validator](https://www.csvvalidator.com/) - バリデーション

#### Auto Fill Tool の接続テスト機能

1. 同期設定を作成
2. CSVファイルを選択
3. 「接続テスト」ボタンをクリック
4. エラーメッセージを確認

---

## 7. Excelでの編集方法

### 7.1 Excelで開く

#### Windows

1. Excelを起動
2. 「データ」タブ→「テキストまたはCSVから」
3. CSVファイルを選択
4. 「ファイルの元の形式」で「UTF-8」を選択
5. 「区切り文字」で「カンマ」を選択
6. 「読み込み」をクリック

#### Mac

1. Excelを起動
2. 「ファイル」→「インポート」→「CSVファイル」
3. CSVファイルを選択
4. 「ファイルの種類」で「区切り文字付き」を選択
5. 「区切り文字」で「カンマ」を選択
6. 「終了」をクリック

### 7.2 Excelで保存

#### Windows

1. 「ファイル」→「名前を付けて保存」
2. 「ファイルの種類」で「CSV UTF-8 (カンマ区切り) (*.csv)」を選択
3. 保存

#### Mac

1. 「ファイル」→「名前を付けて保存」
2. 「フォーマット」で「CSV UTF-8 (コンマ区切り) (.csv)」を選択
3. 保存

### 7.3 注意事項

⚠️ **Excelで編集する際の注意**:
- 先頭の0が消える場合がある（例: `001` → `1`）
- 日付が自動変換される場合がある（例: `2025-01-01` → `2025/1/1`）
- 大きな数値が指数表記になる場合がある（例: `12345678901234567890` → `1.23E+19`）

**対策**:
- 数値として扱いたくない場合は、セルを「テキスト」形式に設定
- または、値の前に `'` (シングルクォート) を付ける（例: `'001`）

---

## 8. よくある質問

### Q1: IDは必ずUUID形式でなければいけませんか？

**A**: いいえ。IDは一意であれば任意の文字列で構いません。ただし、UUID（例: `550e8400-e29b-41d4-a716-446655440000`）を使用することで重複を防げます。

シンプルな連番（`1`, `2`, `3`...）でも問題ありません。

---

### Q2: 日本語のカラム名は使えますか？

**A**: いいえ。カラム名は英語で指定する必要があります。

❌ **間違い**: `ID,名前,値`
✅ **正しい**: `id,name,value`

---

### Q3: 空の値はどう表記しますか？

**A**: 何も入力せず、カンマだけを記載します。

```csv
id,name,value,description
1,ユーザー名,test_user,
2,パスワード,password123,テストパスワード
```

または NULL を使用:
```csv
id,name,value,description
1,ユーザー名,test_user,NULL
2,パスワード,password123,テストパスワード
```

---

### Q4: 1ファイルに何行まで記載できますか？

**A**: 明確な上限はありませんが、10,000行を超えると処理が遅くなる可能性があります。

大量のデータを同期する場合は、複数ファイルに分割するか、外部DB同期の使用を推奨します。

---

### Q5: CSVファイルのテンプレートはありますか？

**A**: はい。Auto Fill Toolの「CSVエクスポート」機能を使うと、現在のデータをCSV形式でダウンロードできます。これをテンプレートとして使用できます。

---

### Q6: ExcelのマクロやVBAは使えますか？

**A**: いいえ。CSVは純粋なテキスト形式なので、Excelのマクロやシート機能は使用できません。

データ加工が必要な場合は、Excelで編集後にCSVとして保存してください。

---

## 9. 参考リソース

### 9.1 関連ドキュメント

- [ユーザーマニュアル](./USER_MANUAL.md) - 基本的な使い方
- [API設定例](./API_CONFIGURATION_EXAMPLES.md) - 外部API連携の設定
- [競合解決ガイド](../CONFLICT_RESOLUTION_GUIDE.md) - 競合解決の詳細

### 9.2 外部リソース

- [RFC 4180 - CSV形式の仕様](https://tools.ietf.org/html/rfc4180)
- [CSV Lint](https://csvlint.io/) - CSV検証ツール
- [Excel CSV 文字化け対策](https://support.microsoft.com/ja-jp/office)

---

**最終更新日**: 2025-01-18
**バージョン**: 1.0.0
**フィードバック**: [GitHub Issues](https://github.com/your-repo/auto-fill-tool/issues)
