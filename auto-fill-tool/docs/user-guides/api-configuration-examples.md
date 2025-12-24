# API設定例集

**最終更新日**: 2025-01-18
**バージョン**: 1.0.0

このドキュメントでは、Auto Fill Toolのデータ同期機能で使用できる外部API設定の具体例を提供します。

---

## 📋 目次

1. [Notion API](#1-notion-api)
2. [Google Sheets API](#2-google-sheets-api)
3. [カスタムREST API](#3-カスタムrest-api)
4. [認証方式の詳細](#4-認証方式の詳細)
5. [JSONPath の使い方](#5-jsonpath-の使い方)
6. [データ変換の設定](#6-データ変換の設定)
7. [トラブルシューティング](#7-トラブルシューティング)

---

## 1. Notion API

### 1.1 前提条件

1. Notion アカウント（無料プランでOK）
2. Notion Integration の作成
3. Notion Database の準備

### 1.2 Notion Integration の作成手順

#### ステップ1: Integration作成

1. [Notion Integrations](https://www.notion.so/my-integrations) にアクセス
2. 「+ New integration」をクリック
3. 以下を入力：
   - **Name**: `Auto Fill Tool Integration`
   - **Logo**: 任意
   - **Associated workspace**: 使用するワークスペースを選択
4. **Capabilities** で以下を有効化：
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
5. 「Submit」をクリック
6. **Internal Integration Token** をコピー（例: `secret_xxxxxxxxxxxxxxxxxxxx`）

#### ステップ2: Database作成

1. Notionで新しいページを作成
2. `/database` と入力して「Table - Inline」を選択
3. データベース名を設定（例: "Auto Fill Variables"）
4. 以下のプロパティを作成：

| プロパティ名 | タイプ | 必須 | 説明 |
|-------------|-------|------|------|
| `Name` | Title | ✅ | 変数名（自動で作成される） |
| `id` | Text | ✅ | 一意のID |
| `value` | Text | ✅ | 変数の値 |
| `description` | Text | ❌ | 説明 |
| `created_at` | Created time | ❌ | 作成日時（自動） |
| `updated_at` | Last edited time | ❌ | 更新日時（自動） |

#### ステップ3: Database をIntegrationに共有

1. データベースページの右上「•••」をクリック
2. 「Add connections」→ 作成したIntegrationを選択
3. 「Confirm」をクリック

#### ステップ4: Database ID の取得

データベースのURLから Database ID を取得：

```
https://www.notion.so/myworkspace/a1b2c3d4e5f67890a1b2c3d4e5f67890?v=...
                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                     これがDatabase ID
```

または32文字のIDをダッシュ付きUUIDに変換：
```
a1b2c3d4e5f67890a1b2c3d4e5f67890
↓
a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890
```

### 1.3 Auto Fill Tool での設定

#### 受信のみ（Notion → ローカル）

```json
{
  "同期設定名": "Notion自動化変数 - 受信のみ",
  "同期対象": "automationVariables",
  "同期方法": "notion",
  "同期タイミング": "periodic",
  "同期間隔（分）": 30,
  "同期方向": "receive_only",
  "認証": {
    "type": "bearer",
    "inputs": [
      {
        "key": "apiKey",
        "value": "secret_xxxxxxxxxxxxxxxxxxxx"
      }
    ]
  },
  "受信ステップ": [
    {
      "id": "query-database",
      "name": "Notionデータベース取得",
      "method": "POST",
      "url": "https://api.notion.com/v1/databases/a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890/query",
      "headers": {
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      "body": {
        "sorts": [
          {
            "property": "created_at",
            "direction": "ascending"
          }
        ]
      },
      "responseMapping": {
        "dataPath": "$.results[*].properties",
        "fieldMapping": {
          "id": "id.rich_text[0].plain_text",
          "name": "Name.title[0].plain_text",
          "value": "value.rich_text[0].plain_text",
          "description": "description.rich_text[0].plain_text"
        }
      }
    }
  ],
  "競合解決": "latest_timestamp"
}
```

#### 送信のみ（ローカル → Notion）

```json
{
  "同期設定名": "Notion自動化変数 - 送信のみ",
  "同期対象": "automationVariables",
  "同期方法": "notion",
  "同期タイミング": "manual",
  "同期方向": "send_only",
  "認証": {
    "type": "bearer",
    "inputs": [
      {
        "key": "apiKey",
        "value": "secret_xxxxxxxxxxxxxxxxxxxx"
      }
    ]
  },
  "送信ステップ": [
    {
      "id": "create-or-update",
      "name": "Notionページ作成/更新",
      "method": "PATCH",
      "url": "https://api.notion.com/v1/pages/{{page_id}}",
      "headers": {
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      "bodyTemplate": {
        "properties": {
          "Name": {
            "title": [
              {
                "text": {
                  "content": "{{name}}"
                }
              }
            ]
          },
          "id": {
            "rich_text": [
              {
                "text": {
                  "content": "{{id}}"
                }
              }
            ]
          },
          "value": {
            "rich_text": [
              {
                "text": {
                  "content": "{{value}}"
                }
              }
            ]
          },
          "description": {
            "rich_text": [
              {
                "text": {
                  "content": "{{description}}"
                }
              }
            ]
          }
        }
      }
    }
  ]
}
```

#### 双方向同期（ローカル ⇔ Notion）

受信ステップと送信ステップの両方を設定し、`"同期方向": "bidirectional"` に設定します。

### 1.4 Notion API のレート制限

Notion APIには以下のレート制限があります：

- **1秒あたり3リクエスト**
- 超過すると429エラーが返される

**対策**:
- 定期同期の間隔を1分以上に設定
- 大量データの同期は分割して実行

### 1.5 Notion API のトラブルシューティング

#### エラー: `object_not_found` (404)

**原因**: Database IDが間違っている、またはIntegrationに共有されていない

**解決方法**:
1. Database IDを再確認
2. データベースページで「Add connections」からIntegrationを追加

#### エラー: `unauthorized` (401)

**原因**: Integration Tokenが無効

**解決方法**:
1. [Notion Integrations](https://www.notion.so/my-integrations) でTokenを再確認
2. 必要に応じて新しいTokenを生成

---

## 2. Google Sheets API

### 2.1 前提条件

1. Googleアカウント
2. Google Cloud Project
3. Google Sheets API の有効化
4. OAuth 2.0 認証情報

### 2.2 Google Cloud Project の設定手順

#### ステップ1: プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 「プロジェクトを選択」→「新しいプロジェクト」
3. プロジェクト名を入力（例: "Auto Fill Tool"）
4. 「作成」をクリック

#### ステップ2: Google Sheets API を有効化

1. 左メニュー「APIとサービス」→「ライブラリ」
2. 「Google Sheets API」を検索
3. 「有効にする」をクリック

#### ステップ3: OAuth 2.0 クライアントIDの作成

1. 左メニュー「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth クライアントID」
3. アプリケーションの種類: **ウェブアプリケーション**
4. 名前を入力（例: "Auto Fill Tool Client"）
5. 「承認済みのリダイレクトURI」に以下を追加:
   ```
   https://<拡張機能ID>.chromiumapp.org/oauth2callback
   ```
6. 「作成」をクリック
7. **クライアントID** と **クライアントシークレット** をコピー

#### ステップ4: アクセストークンの取得

**方法1: OAuth 2.0 Playground を使用**

1. [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) にアクセス
2. 右上の歯車アイコンをクリック
3. 「Use your own OAuth credentials」にチェック
4. クライアントIDとシークレットを入力
5. 左側で「Google Sheets API v4」→「https://www.googleapis.com/auth/spreadsheets」を選択
6. 「Authorize APIs」をクリック
7. Googleアカウントでログイン
8. 「Exchange authorization code for tokens」をクリック
9. **Access token** をコピー

**方法2: Chrome拡張機能で直接取得**

（将来のバージョンで実装予定）

### 2.3 Google Sheets の準備

1. Google Sheets で新しいスプレッドシートを作成
2. シート名を設定（例: "AutoFillVariables"）
3. 1行目にヘッダーを作成：

| A | B | C | D |
|---|---|---|---|
| id | name | value | description |

4. スプレッドシートIDをURLから取得：
```
https://docs.google.com/spreadsheets/d/1abc...xyz/edit
                                      ^^^^^^^^^^
                                   Spreadsheet ID
```

### 2.4 Auto Fill Tool での設定

#### 受信のみ（Google Sheets → ローカル）

```json
{
  "同期設定名": "Google Sheets - 受信のみ",
  "同期対象": "automationVariables",
  "同期方法": "spread-sheet",
  "同期タイミング": "periodic",
  "同期間隔（分）": 60,
  "同期方向": "receive_only",
  "認証": {
    "type": "bearer",
    "inputs": [
      {
        "key": "accessToken",
        "value": "ya29.a0AfH6SM..."
      }
    ]
  },
  "受信ステップ": [
    {
      "id": "get-sheet-data",
      "name": "Sheets データ取得",
      "method": "GET",
      "url": "https://sheets.googleapis.com/v4/spreadsheets/1abc...xyz/values/AutoFillVariables!A2:D",
      "headers": {
        "Content-Type": "application/json"
      },
      "responseMapping": {
        "dataPath": "$.values[*]",
        "arrayToObject": {
          "0": "id",
          "1": "name",
          "2": "value",
          "3": "description"
        }
      }
    }
  ],
  "競合解決": "latest_timestamp"
}
```

**注意**:
- URLの`A2:D`は「A列2行目からD列の最後まで」を意味（1行目はヘッダーなのでスキップ）
- `arrayToObject`で配列をオブジェクトに変換

#### 送信のみ（ローカル → Google Sheets）

```json
{
  "同期設定名": "Google Sheets - 送信のみ",
  "同期対象": "automationVariables",
  "同期方法": "spread-sheet",
  "同期タイミング": "manual",
  "同期方向": "send_only",
  "認証": {
    "type": "bearer",
    "inputs": [
      {
        "key": "accessToken",
        "value": "ya29.a0AfH6SM..."
      }
    ]
  },
  "送信ステップ": [
    {
      "id": "clear-sheet",
      "name": "シートをクリア",
      "method": "POST",
      "url": "https://sheets.googleapis.com/v4/spreadsheets/1abc...xyz/values/AutoFillVariables!A2:D:clear",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    {
      "id": "append-data",
      "name": "データを追加",
      "method": "POST",
      "url": "https://sheets.googleapis.com/v4/spreadsheets/1abc...xyz/values/AutoFillVariables!A2:D:append?valueInputOption=RAW",
      "headers": {
        "Content-Type": "application/json"
      },
      "bodyTemplate": {
        "values": "{{dataAsArray}}"
      },
      "dataTransformation": {
        "objectToArray": ["id", "name", "value", "description"]
      }
    }
  ]
}
```

**注意**:
- 2ステップ構成：まずシートをクリア、次にデータを追加
- `objectToArray`でオブジェクトを配列に変換

### 2.5 Google Sheets API のトラブルシューティング

#### エラー: `Invalid Credentials` (401)

**原因**: アクセストークンの期限切れ（通常1時間）

**解決方法**:
1. OAuth 2.0 Playground で新しいアクセストークンを取得
2. または Refresh Token を使用して自動更新（将来実装予定）

#### エラー: `Requested entity was not found` (404)

**原因**: スプレッドシートIDまたはシート名が間違っている

**解決方法**:
1. スプレッドシートIDを再確認
2. シート名（例: `AutoFillVariables`）が正しいか確認

---

## 3. カスタムREST API

### 3.1 基本構成

カスタムREST APIを使用する場合、以下の構成で設定します：

```json
{
  "同期設定名": "カスタムAPI - 双方向",
  "同期対象": "automationVariables",
  "同期方法": "custom-api",
  "同期タイミング": "periodic",
  "同期間隔（分）": 30,
  "同期方向": "bidirectional",
  "認証": {
    "type": "api-key",
    "inputs": [
      {
        "key": "X-API-Key",
        "value": "your-api-key-here"
      }
    ]
  },
  "受信ステップ": [
    {
      "id": "fetch-data",
      "name": "データ取得",
      "method": "GET",
      "url": "https://api.example.com/v1/variables",
      "headers": {
        "Content-Type": "application/json"
      },
      "responseMapping": {
        "dataPath": "$.data[*]"
      }
    }
  ],
  "送信ステップ": [
    {
      "id": "send-data",
      "name": "データ送信",
      "method": "POST",
      "url": "https://api.example.com/v1/variables/batch",
      "headers": {
        "Content-Type": "application/json"
      },
      "bodyTemplate": {
        "variables": "{{data}}"
      }
    }
  ],
  "競合解決": "latest_timestamp"
}
```

### 3.2 認証方式の例

#### Bearer Token

```json
{
  "認証": {
    "type": "bearer",
    "inputs": [
      {
        "key": "bearerToken",
        "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    ]
  }
}
```

ヘッダーに以下が追加されます：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### API Key (カスタムヘッダー)

```json
{
  "認証": {
    "type": "api-key",
    "inputs": [
      {
        "key": "X-API-Key",
        "value": "abc123xyz"
      }
    ]
  }
}
```

ヘッダーに以下が追加されます：
```
X-API-Key: abc123xyz
```

#### Basic認証

```json
{
  "認証": {
    "type": "basic",
    "inputs": [
      {
        "key": "username",
        "value": "admin"
      },
      {
        "key": "password",
        "value": "secret123"
      }
    ]
  }
}
```

ヘッダーに以下が追加されます：
```
Authorization: Basic YWRtaW46c2VjcmV0MTIz
```

### 3.3 複雑なAPIレスポンスの処理

#### ネストされたデータの取得

**APIレスポンス例**:
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "attributes": {
          "name": "ユーザー名",
          "value": "user1"
        }
      },
      {
        "id": "2",
        "attributes": {
          "name": "パスワード",
          "value": "pass1"
        }
      }
    ]
  }
}
```

**responseMapping設定**:
```json
{
  "responseMapping": {
    "dataPath": "$.data.items[*]",
    "fieldMapping": {
      "id": "id",
      "name": "attributes.name",
      "value": "attributes.value"
    }
  }
}
```

#### ページネーション対応

複数ページにわたるデータを取得する場合：

```json
{
  "受信ステップ": [
    {
      "id": "fetch-page1",
      "name": "ページ1取得",
      "method": "GET",
      "url": "https://api.example.com/v1/variables?page=1&limit=100",
      "responseMapping": {
        "dataPath": "$.data[*]"
      }
    },
    {
      "id": "fetch-page2",
      "name": "ページ2取得",
      "method": "GET",
      "url": "https://api.example.com/v1/variables?page=2&limit=100",
      "responseMapping": {
        "dataPath": "$.data[*]"
      }
    }
  ]
}
```

**注意**: 現在はページ数を手動で指定する必要があります。自動ページネーションは将来実装予定です。

---

## 4. 認証方式の詳細

### 4.1 対応している認証方式

| 認証方式 | タイプ | 使用例 |
|---------|-------|--------|
| Bearer Token | `bearer` | JWT、OAuth 2.0 |
| API Key | `api-key` | カスタムヘッダー |
| Basic認証 | `basic` | ユーザー名とパスワード |
| カスタムヘッダー | `custom` | 独自の認証方式 |

### 4.2 認証情報のセキュリティ

Auto Fill Toolでは、認証情報を以下の方法で保護しています：

1. **暗号化保存**: Chrome Storage Local に AES-256-GCM で暗号化
2. **マスターパスワード**: 暗号化キーをマスターパスワードから導出
3. **メモリ保護**: セッション終了時にメモリから削除

**注意**: マスターパスワードを忘れると、保存された認証情報にアクセスできなくなります。

---

## 5. JSONPath の使い方

### 5.1 基本構文

JSONPathは、JSON内のデータを抽出するためのクエリ言語です。

| 構文 | 説明 | 例 |
|------|------|-----|
| `$` | ルート | `$` |
| `.key` | 子要素 | `$.data` |
| `[*]` | すべての要素 | `$.items[*]` |
| `[0]` | 配列のインデックス | `$.items[0]` |
| `..key` | 再帰検索 | `$..name` |
| `[?(@.key)]` | フィルタ | `$.items[?(@.active)]` |

### 5.2 実用例

#### 例1: シンプルな配列

**JSON**:
```json
{
  "data": [
    {"id": "1", "name": "A"},
    {"id": "2", "name": "B"}
  ]
}
```

**JSONPath**: `$.data[*]`

**結果**:
```json
[
  {"id": "1", "name": "A"},
  {"id": "2", "name": "B"}
]
```

#### 例2: ネストされたオブジェクト

**JSON**:
```json
{
  "response": {
    "results": [
      {
        "id": "1",
        "properties": {
          "name": {"value": "A"}
        }
      }
    ]
  }
}
```

**JSONPath**: `$.response.results[*]`

**フィールドマッピング**:
```json
{
  "fieldMapping": {
    "id": "id",
    "name": "properties.name.value"
  }
}
```

#### 例3: 条件フィルタ

**JSON**:
```json
{
  "items": [
    {"id": "1", "active": true, "name": "A"},
    {"id": "2", "active": false, "name": "B"},
    {"id": "3", "active": true, "name": "C"}
  ]
}
```

**JSONPath**: `$.items[?(@.active == true)]`

**結果**:
```json
[
  {"id": "1", "active": true, "name": "A"},
  {"id": "3", "active": true, "name": "C"}
]
```

### 5.3 JSONPath のテスト方法

設定する前にJSONPathをテストしたい場合：

1. オンラインツールを使用:
   - [JSONPath Online Evaluator](https://jsonpath.com/)
   - [JSONPath Finder](https://jsonpath-finder.herokuapp.com/)

2. APIレスポンスをコピー
3. JSONPathを入力してテスト
4. 正しい結果が得られたら、Auto Fill Toolに設定

---

## 6. データ変換の設定

### 6.1 配列からオブジェクトへの変換

Google Sheets APIのように、配列形式でデータが返される場合：

**APIレスポンス**:
```json
{
  "values": [
    ["1", "ユーザー名", "user1", "説明"],
    ["2", "パスワード", "pass1", "説明"]
  ]
}
```

**変換設定**:
```json
{
  "responseMapping": {
    "dataPath": "$.values[*]",
    "arrayToObject": {
      "0": "id",
      "1": "name",
      "2": "value",
      "3": "description"
    }
  }
}
```

**変換後**:
```json
[
  {"id": "1", "name": "ユーザー名", "value": "user1", "description": "説明"},
  {"id": "2", "name": "パスワード", "value": "pass1", "description": "説明"}
]
```

### 6.2 オブジェクトから配列への変換

送信時にオブジェクトを配列に変換する場合：

**ローカルデータ**:
```json
[
  {"id": "1", "name": "ユーザー名", "value": "user1"},
  {"id": "2", "name": "パスワード", "value": "pass1"}
]
```

**変換設定**:
```json
{
  "dataTransformation": {
    "objectToArray": ["id", "name", "value"]
  }
}
```

**変換後（送信データ）**:
```json
[
  ["1", "ユーザー名", "user1"],
  ["2", "パスワード", "pass1"]
]
```

---

## 7. トラブルシューティング

### 7.1 接続テストの実行

新しいAPI設定を保存する前に、「接続テスト」ボタンで動作確認することを推奨します。

**接続テストで確認される項目**:
- ✅ 認証情報の有効性
- ✅ APIエンドポイントの到達可能性
- ✅ レスポンス形式の妥当性
- ✅ JSONPathの正しさ

### 7.2 よくあるエラーと解決方法

#### エラー: `CORS policy error`

**原因**: APIサーバーがCORS（Cross-Origin Resource Sharing）を許可していない

**解決方法**:
- APIサーバー側でCORSヘッダーを設定
- または、プロキシサーバーを経由

#### エラー: `Network request failed`

**原因**: ネットワーク接続の問題、またはURLが間違っている

**解決方法**:
1. URLを再確認（typoがないか）
2. インターネット接続を確認
3. ファイアウォールの設定を確認

#### エラー: `JSON parse error`

**原因**: APIレスポンスがJSON形式ではない

**解決方法**:
1. APIのドキュメントでレスポンス形式を確認
2. ブラウザのDevToolsでレスポンスを確認
3. `Content-Type: application/json` ヘッダーが返されているか確認

### 7.3 デバッグの手順

1. **接続テストを実行**
2. **Chrome DevTools を開く**:
   - `chrome://extensions/` → Auto Fill Tool → 「バックグラウンドページ」
3. **Console タブでログを確認**
4. **Network タブでAPIリクエストを確認**
5. **問題箇所を特定して修正**

---

## 8. 参考リソース

### 8.1 公式ドキュメント

- [Notion API](https://developers.notion.com/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [JSONPath Specification](https://goessner.net/articles/JsonPath/)

### 8.2 関連ドキュメント

- [ユーザーマニュアル](./USER_MANUAL.md) - 基本的な使い方
- [競合解決ガイド](../CONFLICT_RESOLUTION_GUIDE.md) - 競合解決の詳細
- [CSVフォーマット例](./CSV_FORMAT_EXAMPLES.md) - CSV形式の詳細

---

**最終更新日**: 2025-01-18
**バージョン**: 1.0.0
**フィードバック**: [GitHub Issues](https://github.com/your-repo/auto-fill-tool/issues)
