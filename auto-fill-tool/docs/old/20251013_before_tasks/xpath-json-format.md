# XPath管理のデータフォーマット

## 概要

Auto-Fill ToolのXPath設定は、CSV形式で管理されています。このドキュメントでは、XPath設定のデータ構造とフォーマットについて説明します。

## CSV形式

XPath設定は、以下のフィールドを持つCSV形式で保存されます：

### CSVヘッダー

```csv
id,value,actionType,url,websiteId,executionOrder,selectedPathPattern,pathShort,pathAbsolute,pathSmart,action_pattern,afterWaitSeconds,executionTimeoutSeconds,retryType
```

### フィールド説明

| フィールド | 型 | 説明 | 例 |
|----------|-----|------|-----|
| `id` | string | 一意識別子 | `xpath_1696234567890_abc123def` |
| `value` | string | 入力する値（変数使用可） | `{{username}}` |
| `actionType` | string | アクション種別 | `input`, `click`, `change_url`, `check` |
| `url` | string | 実行対象URL（正規表現可） | `https://example.com/login.*` |
| `websiteId` | string | Webサイト識別子 | `website_123` |
| `executionOrder` | number | 実行順序 | `1`, `2`, `3` |
| `selectedPathPattern` | string | 使用するXPath | `smart`, `short`, `absolute`, `` |
| `pathShort` | string | Short形式XPath | `//*[@id="content"]/button[1]` |
| `pathAbsolute` | string | Absolute形式XPath | `/html/body/div[1]/button[1]` |
| `pathSmart` | string | Smart形式XPath | `//button[@id="submit"]` |
| `actionPattern` | number | アクションパターン（比較方法/選択パターン等） | `0`, `10`, `20`, `30`, `40` |
| `afterWaitSeconds` | number | 実行後待機時間（秒） | `0.5`, `1.0`, `2.0` |
| `executionTimeoutSeconds` | number | タイムアウト時間（秒） | `30`, `60` |
| `retryType` | number | リトライ種別 | `0`, `10` |

### CSV例

```csv
id,value,actionType,url,websiteId,executionOrder,selectedPathPattern,pathShort,pathAbsolute,pathSmart,action_pattern,afterWaitSeconds,executionTimeoutSeconds,retryType
xpath_1696234567890_abc123def,{{username}},type,https://example.com/login.*,website_123,1,smart,//*[@id="username"],/html/body/form/input[1],//input[@id="username"],20,0.5,30,0
xpath_1696234567891_def456ghi,{{password}},type,https://example.com/login.*,website_123,2,smart,//*[@id="password"],/html/body/form/input[2],//input[@id="password"],20,0.5,30,0
xpath_1696234567892_ghi789jkl,,click,https://example.com/login.*,website_123,3,smart,//*[@id="login-btn"],/html/body/form/button[1],//button[@id="login-btn"],20,2.0,30,10
```

## XPathパターンの詳細

### Smart形式（推奨）

**特徴:**
- ID、class、text、name等の属性を活用
- 最も人間が理解しやすい
- ページ構造の小さな変更に強い
- 自動化テストで推奨される形式

**例:**
```xpath
//div[@id="content"]/button[@class="submit"][contains(text(), "送信")]
//input[@name="username"]
//form[@id="login-form"]/button[@type="submit"]
```

**使用する属性の優先順位:**
1. `id` - 最優先（一意）
2. `name` - フォーム要素
3. `class` - 最初のクラス名を使用
4. `type` - input/button要素
5. `text` - リンク/ボタンのテキスト

### Short形式

**特徴:**
- IDを持つ要素を見つけたら、そこを基準にする
- 比較的短くて読みやすい
- IDは一意なので信頼性が高い

**例:**
```xpath
//*[@id="content"]/div[1]/button[2]
//*[@id="login-form"]/input[1]
```

### Absolute形式

**特徴:**
- HTMLのルート(`/html`)から完全なパスを生成
- 要素の絶対的な位置を示す
- デバッグ用途に適している

**例:**
```xpath
/html/body/div[1]/div[2]/form[1]/button[1]
/html/body/div[3]/form[1]/input[2]
```

**注意:**
- ページ構造の変更に最も弱い
- 動的なコンテンツには不適切
- 通常の使用では推奨されない

## アクション種別

### type - テキスト入力
```csv
id,value,actionType,url,websiteId,executionOrder,selectedPathPattern,pathSmart,action_pattern
xpath_001,{{username}},type,https://example.com/.*,web_001,1,smart,//input[@id="username"],20
```

### click - クリック操作
```csv
id,value,actionType,url,websiteId,executionOrder,selectedPathPattern,pathSmart,action_pattern
xpath_002,,click,https://example.com/.*,web_001,2,smart,//button[@id="submit"],20
```

### check - チェックボックス/ラジオボタンのON/OFF
```csv
id,value,actionType,url,websiteId,executionOrder,selectedPathPattern,pathSmart,action_pattern
xpath_003,1,check,https://example.com/.*,web_001,3,smart,//input[@id="agree-checkbox"],20
```

### judge - 条件チェック
```csv
id,value,actionType,url,websiteId,executionOrder,selectedPathPattern,pathSmart,action_pattern
xpath_004,予約可能,judge,https://example.com/.*,web_001,4,smart,//div[@class="status"],10
```

### change_url - URL変更
```csv
id,value,actionType,url,websiteId,executionOrder,selectedPathPattern
xpath_005,https://example.com/next-page,change_url,https://example.com/.*,web_001,5,
```

## Action Pattern（アクションパターン）

`actionPattern`フィールドは、`actionType`に応じて異なる用途で使用されます：

### actionTypeごとの用途

| actionType | actionPatternの用途 | 説明 |
|------------|---------------------|------|
| **JUDGE** | 比較パターン | テキスト比較方法を指定 |
| **SELECT_VALUE**, **SELECT_INDEX**, **SELECT_TEXT**, **SELECT_TEXT_EXACT** | 選択パターン | セレクトボックスの選択方法を指定 |
| **TYPE**, **CLICK**, **CHECK** | イベントパターン | フレームワーク対応レベルを指定 |
| **CHANGE_URL** | 未使用 | - |

### JUDGE（比較パターン）

| 値 | 意味 | 使用例 |
|----|------|--------|
| `10` | 等しい（正規表現可） | テキスト完全一致チェック |
| `20` | 等しくない（正規表現可） | テキスト不一致チェック |
| `30` | 大なり | 数値/文字列比較 |
| `40` | 小なり | 数値/文字列比較 |

### 等しい（10）の例
```
Value: 予約可能
要素のテキスト: 予約可能 → ✅ 一致
要素のテキスト: 空室待ち → ❌ 不一致

Value: 予約.*
要素のテキスト: 予約可能です → ✅ 正規表現一致
```

### 等しくない（20）の例
```
Value: 空室待ち
要素のテキスト: 予約可能 → ✅ 不一致（成功）
要素のテキスト: 空室待ち → ❌ 一致（失敗）
```

### SELECT操作（選択パターン）

| 値 | 意味 | 使用例 |
|----|------|--------|
| `10` | Native single selection | 標準セレクトボックス（単一選択） |
| `20` | Custom single selection | カスタムセレクトボックス（単一選択） |
| `30` | jQuery single selection | jQueryセレクトボックス（単一選択） |
| `110` | Native multiple selection | 標準セレクトボックス（複数選択） |
| `120` | Custom multiple selection | カスタムセレクトボックス（複数選択） |
| `130` | jQuery multiple selection | jQueryセレクトボックス（複数選択） |

### TYPE/CLICK/CHECK操作（イベントパターン）

| 値 | 意味 | 説明 |
|----|------|------|
| `10` | Basic | シンプルなイベント発火（標準的なWebページ向け） |
| `20` | Framework-agnostic（推奨） | 複数イベント + React/Vue/jQuery対応（デフォルト） |
| `0` または未指定 | デフォルト（20） | Pattern 20として扱われる |

**Pattern 10（Basic）**:
- TYPE: focus → input → change
- CLICK: click のみ
- CHECK: checked設定 → change

**Pattern 20（Framework-agnostic）**:
- TYPE: React/Preactのnativeセッター対応 → focus → input → change → blur + jQuery対応
- CLICK: pointerdown → mousedown → pointerup → mouseup → click + jQuery対応
- CHECK: checked設定 → click → input → change + jQuery対応

**使用例**:
```csv
# 標準Webページでのテキスト入力（Pattern 10）
xpath_001,test@example.com,type,https://example.com/.*,web_001,1,smart,//input[@id="email"],10

# Reactアプリでのテキスト入力（Pattern 20推奨）
xpath_002,test@example.com,type,https://react-app.com/.*,web_001,1,smart,//input[@id="email"],20

# チェックボックスON（Pattern 20推奨）
xpath_003,1,check,https://example.com/.*,web_001,2,smart,//input[@id="agree"],20
```

## インポート/エクスポート

### エクスポート

XPath管理画面の「エクスポート」ボタンをクリックすると、すべてのXPath設定がCSV形式でダウンロードされます。

ファイル名: `xpaths_YYYY-MM-DD.csv`

### インポート

XPath管理画面の「インポート」ボタンをクリックし、CSV形式のファイルを選択すると、既存の設定に追加されます。

**注意事項:**
- 同じIDの設定が存在する場合は上書きされます
- CSVのヘッダー行は必須です
- 文字エンコーディングはUTF-8を使用してください

## 変数の使用

### 変数定義

Webサイト設定に変数を定義：

```json
{
  "variables": {
    "username": "test_user",
    "password": "secret123",
    "email": "test@example.com"
  }
}
```

### CSV内での変数使用

```csv
id,value,actionType,url,websiteId,executionOrder,selectedPathPattern,pathSmart,action_pattern
xpath_001,{{username}},type,https://example.com/.*,web_001,1,smart,//input[@id="username"],20
xpath_002,{{password}},type,https://example.com/.*,web_001,2,smart,//input[@id="password"],20
xpath_003,{{email}},type,https://example.com/.*,web_001,3,smart,//input[@id="email"],20
```

## システム設定との連携

### Retry Type = 10 の場合

CSV:
```csv
id,value,actionType,url,websiteId,executionOrder,selectedPathPattern,pathSmart,action_pattern,retryType
xpath_001,{{username}},type,https://example.com/.*,web_001,1,smart,//input[@id="username"],20,10
```

システム設定:
- リトライ待機時間: 最小30秒〜最大60秒（範囲内の乱数）
- リトライ回数: 3回（-1で無限回）

→ 失敗した場合、30〜60秒待機して最大3回リトライ

## まとめ

### フォーマット選択ガイド

| 用途 | 推奨形式 | 理由 |
|-----|---------|------|
| 通常の自動化 | Smart | 可読性高、構造変更に強い |
| 一時的なテスト | Short | 素早く作成可能 |
| デバッグ | Absolute | 正確な位置特定 |

### ベストプラクティス

1. **Smart形式を優先**: 長期的な保守性を考慮
2. **変数を活用**: 環境ごとに異なる値を使用
3. **適切な待機時間**: ページロード/Ajax完了を考慮
4. **リトライ設定**: retry_type=10で失敗に備える
5. **URL正規表現**: 柔軟なURLマッチング

---

**最終更新**: 2025-10-08
**バージョン**: 2.4.0

## v2.4.0での変更点

### フィールド名の汎用化

- `dispatchEventPattern` → `actionPattern`に変更
- CSVヘッダー: `dispatch_event_pattern` → `action_pattern`
- より汎用的な名前により、action_typeに応じた異なる用途を明確化
- **後方互換性なし**: 既存のCSV/JSONファイルは新形式でエクスポート・インポートが必要

### actionTypeの拡張

- **新規追加**:
  - `type`: テキスト入力（旧 `input`）
  - `check`: チェックボックス/ラジオボタンON/OFF
  - `judge`: 値の判定/比較（旧 `check`）
  - `select_value`, `select_index`, `select_text`, `select_text_exact`: セレクトボックス操作

- **actionPatternの活用**:
  - TYPE/CLICK/CHECK: イベントパターン（10=Basic, 20=Framework-agnostic）
  - JUDGE: 比較パターン（10=等しい, 20=等しくない, 30=大なり, 40=小なり）
  - SELECT: 選択パターン（10/110=native, 20/120=custom, 30/130=jQuery）
