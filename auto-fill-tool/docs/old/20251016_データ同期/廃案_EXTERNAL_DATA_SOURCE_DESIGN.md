# 外部データソース連携機能 - 設計書

## 概要

現在 localstorage に格納している自動入力に必要な情報を、任意の外部サーバー（Notion、Googleスプレッドシート等）から取得できるようにする機能です。

## 目的

1. **データの一元管理**: 複数のブラウザや環境で同じ自動入力設定を共有
2. **柔軟なデータソース**: 様々な外部サービスからデータを取得可能
3. **カスタマイズ可能なAPI連携**: リクエスト・レスポンスの型定義とステップ管理
4. **変数の統合**: 外部データを AutomationVariables として利用可能

---

# 外部仕様

## 1. ユーザーインターフェース

### 1.1 システム設定画面への追加

既存のシステム設定画面（xpath-manager.html のシステム設定モーダル）に「外部データソース」タブを追加します。

#### 画面構成

```
┌────────────────────────────────────────────────────────────┐
│ システム設定                                          [×]    │
├────────────────────────────────────────────────────────────┤
│ [一般設定] [リトライ設定] [外部データソース]              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 📡 外部データソース設定                                     │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 登録済みデータソース (2)                  [＋ 新規追加] │   │
│ │                                                      │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ 📋 Notion データベース                  [編集] [削除] │ │   │
│ │ │ URL: https://api.notion.com/v1/databases/...  │ │   │
│ │ │ 認証: Bearer Token                              │ │   │
│ │ │ ステータス: 🟢 接続成功 (最終確認: 2025-10-15)  │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ 📊 Googleスプレッドシート            [編集] [削除] │ │   │
│ │ │ URL: https://sheets.googleapis.com/v4/...    │ │   │
│ │ │ 認証: OAuth 2.0                                 │ │   │
│ │ │ ステータス: 🟡 未検証                           │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│                                   [キャンセル] [保存]     │
└────────────────────────────────────────────────────────────┘
```

### 1.2 データソース登録・編集画面

#### 新規追加/編集モーダル

```
┌────────────────────────────────────────────────────────────┐
│ 外部データソースの設定                             [×]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 基本情報                                                   │
│ ┌────────────────────────────────────────────────────┐   │
│ │ データソース名 *                                      │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ Notion タスクデータベース                      │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │ 説明                                                 │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ タスク管理用のNotionデータベース               │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 認証設定                                                   │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 認証タイプ *                                         │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ [v] Bearer Token                               │ │   │
│ │ │     OAuth 2.0                                  │ │   │
│ │ │     API Key                                    │ │   │
│ │ │     Basic Auth                                 │ │   │
│ │ │     なし                                       │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │ トークン *                                           │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ secret_***************************            │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ │ [👁️ 表示]                                          │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ リクエスト設定                                [+ ステップ追加] │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ステップ 1: データベース取得                  [↑] [↓] [×] │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ メソッド: POST                                 │ │   │
│ │ │ URL: https://api.notion.com/v1/databases/...  │ │   │
│ │ │ ヘッダー:                                      │ │   │
│ │ │   - Notion-Version: 2022-06-28                │ │   │
│ │ │   - Content-Type: application/json            │ │   │
│ │ │ ボディ: { "page_size": 100 }                  │ │   │
│ │ │                                                │ │   │
│ │ │ レスポンスマッピング:                          │ │   │
│ │ │   - 変数名: database_id                        │ │   │
│ │ │     パス: $.results[0].id                     │ │   │
│ │ │   - 変数名: items                              │ │   │
│ │ │     パス: $.results                           │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │ ステップ 2: ページ詳細取得                    [↑] [↓] [×] │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ メソッド: GET                                  │ │   │
│ │ │ URL: https://api.notion.com/v1/pages/${items[0].id} │ │   │
│ │ │ ヘッダー:                                      │ │   │
│ │ │   - Notion-Version: 2022-06-28                │ │   │
│ │ │                                                │ │   │
│ │ │ レスポンスマッピング:                          │ │   │
│ │ │   - 変数名: username                           │ │   │
│ │ │     パス: $.properties.Username.title[0].text.content │ │   │
│ │ │   - 変数名: password                           │ │   │
│ │ │     パス: $.properties.Password.rich_text[0].text.content │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 最終変数マッピング                                         │
│ ┌────────────────────────────────────────────────────┐   │
│ │ AutomationVariables へのマッピング                   │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ username → username                            │ │   │
│ │ │ password → password                            │ │   │
│ │ │ database_id → notionDbId                       │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ テスト実行                                                 │
│ ┌────────────────────────────────────────────────────┐   │
│ │ [🧪 接続テスト]                                      │   │
│ │                                                      │   │
│ │ 結果: 🟢 成功                                        │   │
│ │ 取得データ:                                          │   │
│ │   username: "test_user"                             │   │
│ │   password: "********"                              │   │
│ │   notionDbId: "abc123..."                           │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│                                   [キャンセル] [保存]     │
└────────────────────────────────────────────────────────────┘
```

### 1.3 AutomationVariables 管理画面での外部データソース連携

既存の AutomationVariables 管理画面（automation-variables-manager.html）に外部データソース連携機能を追加します。

```
┌──────────────────────────────────────────────────────────────┐
│ 📌 Example Site                                              │
│ ID: abc123-def456-ghi789                                     │
│ Website ID: website-001                                      │
│ Status: 🟢 Active                                            │
│                                                              │
│ 📡 外部データソース: [v] Notion タスクデータベース           │
│    最終同期: 2025-10-15 10:30:45  [🔄 今すぐ同期]          │
│                                                              │
│ Variables:                                                   │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ username: test_user (外部データソースから取得)         │   │
│ │ password: ******** (外部データソースから取得)          │   │
│ │ email: manual@example.com (手動入力)                   │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Updated: 2025-10-15 10:30:45                                │
│                                   ┌─────┐┌─────┐┌─────┐   │
│                                   │✏️編集││🗑️削除││📋複製│   │
│                                   └─────┘└─────┘└─────┘   │
└──────────────────────────────────────────────────────────────┘
```

## 2. データフロー

### 2.1 全体フロー

```
[ユーザー] → [システム設定画面] → [外部データソース登録]
                                          ↓
                                    [認証情報保存]
                                          ↓
[AutomationVariables選択] → [外部データソース指定]
                                          ↓
                            [リクエストステップ実行]
                                          ↓
                              [レスポンス解析・変数抽出]
                                          ↓
                            [AutomationVariables として保存]
                                          ↓
                                [自動入力で使用]
```

### 2.2 データ取得フロー詳細

```
1. ユーザーがAutomationVariablesに外部データソースを割り当て

2. 同期トリガー（手動/自動）

3. 外部データソース定義を読み込み

4. ステップ1実行:
   - URLにリクエスト送信
   - 認証情報を含む
   - レスポンスから変数抽出（JSONPath等で）

5. ステップ2実行（必要に応じて）:
   - ステップ1の変数を使用してリクエスト構築
   - レスポンスから変数抽出

6. ... (N ステップまで繰り返し)

7. 最終的な変数をAutomationVariablesにマージ

8. chrome.storage.local に保存

9. 同期完了通知
```

### 2.3 同期タイミング

以下のタイミングで外部データソースからデータを取得します：

1. **手動同期**: ユーザーが「今すぐ同期」ボタンをクリック
2. **自動同期（オプション）**:
   - AutomationVariables読み込み時（最終同期から N 分経過している場合）
   - 自動入力実行前（最終同期から N 分経過している場合）
   - 定期的（バックグラウンドで N 分ごと）

## 3. ユースケース

### UC-1: 外部データソースの登録

1. ユーザーがシステム設定画面を開く
2. 「外部データソース」タブを選択
3. 「新規追加」ボタンをクリック
4. データソース名、認証情報、リクエストステップを入力
5. 「接続テスト」で動作確認
6. 「保存」で設定を保存

### UC-2: 外部データソースの編集

1. システム設定画面の外部データソース一覧から編集対象を選択
2. 「編集」ボタンをクリック
3. 設定を変更
4. 「接続テスト」で動作確認
5. 「保存」で変更を保存

### UC-3: 外部データソースの削除

1. システム設定画面の外部データソース一覧から削除対象を選択
2. 「削除」ボタンをクリック
3. 確認ダイアログで「削除」を選択
4. データソース設定が削除される（使用中のAutomationVariablesには影響なし）

### UC-4: AutomationVariablesへの外部データソース割り当て

1. AutomationVariables管理画面を開く
2. 対象のAutomationVariablesを選択
3. 「編集」ボタンをクリック
4. 「外部データソース」ドロップダウンからデータソースを選択
5. 「保存」で設定を保存

### UC-5: 外部データソースからのデータ同期

1. AutomationVariables管理画面で「今すぐ同期」ボタンをクリック
2. 外部データソース定義に基づいてリクエストを実行
3. レスポンスから変数を抽出
4. AutomationVariablesにマージ
5. 同期完了通知を表示

### UC-6: 自動入力実行時の自動同期

1. ユーザーが自動入力を実行
2. AutomationVariablesを読み込み
3. 外部データソースが設定されている場合、最終同期時刻を確認
4. N 分以上経過している場合、自動的にデータ同期
5. 最新データで自動入力を実行

## 4. エラーハンドリング

### 4.1 エラーケース

1. **認証エラー**: トークンが無効、期限切れ
2. **ネットワークエラー**: タイムアウト、接続失敗
3. **データ形式エラー**: 期待したフォーマットと異なる
4. **変数抽出エラー**: 指定したパスにデータが存在しない
5. **レート制限エラー**: API呼び出し回数の上限に達した

### 4.2 エラー表示

```
┌────────────────────────────────────────────────────────────┐
│ ❌ 同期エラー                                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ データソース: Notion タスクデータベース                    │
│ エラー内容: 認証トークンが無効です                         │
│                                                            │
│ 詳細:                                                      │
│ HTTP 401 Unauthorized                                      │
│ Invalid token: The token has expired.                      │
│                                                            │
│ 対処方法:                                                  │
│ - システム設定画面で認証情報を更新してください             │
│ - トークンの有効期限を確認してください                     │
│                                                            │
│                                   [設定を開く] [閉じる]    │
└────────────────────────────────────────────────────────────┘
```

### 4.3 フォールバック動作

- 外部データソースからの取得に失敗した場合、既存のローカルデータを使用
- 部分的に取得成功した場合、取得できた変数のみ更新
- エラー発生時、詳細ログを記録

## 5. セキュリティ考慮事項

### 5.1 認証情報の保護

- 認証トークン等は暗号化して chrome.storage.local に保存
- 画面表示時はマスクして表示（「secret_***...」）
- ログに認証情報を出力しない

### 5.2 HTTPS必須

- すべての外部データソース接続は HTTPS を必須とする
- HTTP 接続は警告を表示し、テスト実行を制限

### 5.3 CORS対策

- Chrome拡張機能の manifest.json に適切な permissions を設定
- 必要に応じて background script 経由でリクエスト実行

---

# 内部仕様

## 1. アーキテクチャ

既存のClean Architecture構造を維持し、以下の層で実装します：

```
Presentation Layer (UI)
    ├── SystemSettingsManager (外部データソース設定画面)
    ├── AutomationVariablesManager (データソース連携機能)
    └── ExternalDataSourceModal (データソース登録・編集UI)

Use Case Layer
    ├── CreateExternalDataSourceUseCase
    ├── UpdateExternalDataSourceUseCase
    ├── DeleteExternalDataSourceUseCase
    ├── GetExternalDataSourcesUseCase
    ├── TestExternalDataSourceConnectionUseCase
    ├── SyncAutomationVariablesFromExternalSourceUseCase
    └── GetAutomationVariablesWithExternalDataUseCase

Domain Layer
    ├── Entities
    │   ├── ExternalDataSource
    │   └── ExternalDataSyncResult
    ├── Repositories
    │   └── ExternalDataSourceRepository
    └── Services
        ├── IHttpClient
        └── IDataMapper

Infrastructure Layer
    ├── Repositories
    │   └── ChromeStorageExternalDataSourceRepository
    ├── Services
    │   ├── ChromeHttpClient
    │   └── JsonPathDataMapper
    └── Encryption
        └── TokenEncryptionService
```

## 2. データ構造

### 2.1 ExternalDataSource Entity

```typescript
// src/domain/entities/ExternalDataSource.ts

export interface RequestStep {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string; // 変数展開可能: "https://api.example.com/users/${userId}"
  headers: { [key: string]: string };
  body?: string; // JSON文字列
  responseMapping: {
    variableName: string;
    jsonPath: string; // JSONPath記法: "$.results[0].id"
  }[];
}

export interface AuthConfig {
  type: 'bearer' | 'oauth2' | 'apikey' | 'basic' | 'none';
  credentials: {
    token?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    // OAuth 2.0 用
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface VariableMapping {
  sourceVariable: string; // リクエストステップで抽出した変数名
  targetVariable: string; // AutomationVariables の変数名
}

export interface ExternalDataSourceData {
  id: string; // UUID v4
  name: string;
  description: string;
  authConfig: AuthConfig;
  requestSteps: RequestStep[];
  variableMappings: VariableMapping[];
  lastTestStatus?: 'success' | 'failed';
  lastTestDate?: string; // ISO 8601
  lastTestError?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export class ExternalDataSource {
  private data: ExternalDataSourceData;

  constructor(data: ExternalDataSourceData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: ExternalDataSourceData): void {
    if (!data.id) throw new Error('ID is required');
    if (!data.name) throw new Error('Name is required');
    if (!data.authConfig) throw new Error('Auth config is required');
    if (!data.requestSteps || data.requestSteps.length === 0) {
      throw new Error('At least one request step is required');
    }
  }

  // Getters
  getId(): string { return this.data.id; }
  getName(): string { return this.data.name; }
  getDescription(): string { return this.data.description; }
  getAuthConfig(): AuthConfig { return { ...this.data.authConfig }; }
  getRequestSteps(): RequestStep[] { return [...this.data.requestSteps]; }
  getVariableMappings(): VariableMapping[] { return [...this.data.variableMappings]; }
  getLastTestStatus(): 'success' | 'failed' | undefined { return this.data.lastTestStatus; }
  getLastTestDate(): string | undefined { return this.data.lastTestDate; }
  getLastTestError(): string | undefined { return this.data.lastTestError; }
  getCreatedAt(): string { return this.data.createdAt; }
  getUpdatedAt(): string { return this.data.updatedAt; }

  // Immutable setters
  setName(name: string): ExternalDataSource {
    return new ExternalDataSource({
      ...this.data,
      name,
      updatedAt: new Date().toISOString(),
    });
  }

  setDescription(description: string): ExternalDataSource {
    return new ExternalDataSource({
      ...this.data,
      description,
      updatedAt: new Date().toISOString(),
    });
  }

  setAuthConfig(authConfig: AuthConfig): ExternalDataSource {
    return new ExternalDataSource({
      ...this.data,
      authConfig,
      updatedAt: new Date().toISOString(),
    });
  }

  setRequestSteps(steps: RequestStep[]): ExternalDataSource {
    return new ExternalDataSource({
      ...this.data,
      requestSteps: steps,
      updatedAt: new Date().toISOString(),
    });
  }

  setVariableMappings(mappings: VariableMapping[]): ExternalDataSource {
    return new ExternalDataSource({
      ...this.data,
      variableMappings: mappings,
      updatedAt: new Date().toISOString(),
    });
  }

  setTestResult(status: 'success' | 'failed', error?: string): ExternalDataSource {
    return new ExternalDataSource({
      ...this.data,
      lastTestStatus: status,
      lastTestDate: new Date().toISOString(),
      lastTestError: error,
      updatedAt: new Date().toISOString(),
    });
  }

  // Export
  toData(): ExternalDataSourceData {
    return { ...this.data };
  }

  // Clone
  clone(): ExternalDataSource {
    return new ExternalDataSource({ ...this.data });
  }

  // Static factory
  static create(params: {
    name: string;
    description: string;
    authConfig: AuthConfig;
    requestSteps: RequestStep[];
    variableMappings: VariableMapping[];
  }): ExternalDataSource {
    return new ExternalDataSource({
      id: uuidv4(),
      name: params.name,
      description: params.description,
      authConfig: params.authConfig,
      requestSteps: params.requestSteps,
      variableMappings: params.variableMappings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
```

### 2.2 AutomationVariables への拡張

```typescript
// src/domain/entities/AutomationVariables.ts への追加

export interface AutomationVariablesData {
  id: string;
  websiteId: string;
  variables: { [key: string]: string };
  status?: AutomationStatus;

  // 追加: 外部データソース連携
  externalDataSourceId?: string; // 外部データソースのID
  lastSyncDate?: string; // 最終同期日時 (ISO 8601)
  lastSyncStatus?: 'success' | 'failed';
  lastSyncError?: string;

  updatedAt: string; // ISO 8601
}

export class AutomationVariables {
  // ... 既存のメソッド ...

  // 追加: 外部データソース関連のゲッター
  getExternalDataSourceId(): string | undefined {
    return this.data.externalDataSourceId;
  }

  getLastSyncDate(): string | undefined {
    return this.data.lastSyncDate;
  }

  getLastSyncStatus(): 'success' | 'failed' | undefined {
    return this.data.lastSyncStatus;
  }

  getLastSyncError(): string | undefined {
    return this.data.lastSyncError;
  }

  // 追加: 外部データソース設定
  setExternalDataSource(dataSourceId: string): AutomationVariables {
    return new AutomationVariables({
      ...this.data,
      externalDataSourceId: dataSourceId,
      updatedAt: new Date().toISOString(),
    });
  }

  clearExternalDataSource(): AutomationVariables {
    return new AutomationVariables({
      ...this.data,
      externalDataSourceId: undefined,
      lastSyncDate: undefined,
      lastSyncStatus: undefined,
      lastSyncError: undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  // 追加: 同期結果を記録
  setSyncResult(
    status: 'success' | 'failed',
    variables?: { [key: string]: string },
    error?: string
  ): AutomationVariables {
    return new AutomationVariables({
      ...this.data,
      variables: variables ? { ...this.data.variables, ...variables } : this.data.variables,
      lastSyncDate: new Date().toISOString(),
      lastSyncStatus: status,
      lastSyncError: error,
      updatedAt: new Date().toISOString(),
    });
  }
}
```

### 2.3 ExternalDataSyncResult Entity

```typescript
// src/domain/entities/ExternalDataSyncResult.ts

export interface ExternalDataSyncResultData {
  id: string;
  automationVariablesId: string;
  externalDataSourceId: string;
  status: 'success' | 'failed';
  extractedVariables: { [key: string]: string };
  errorMessage?: string;
  syncedAt: string; // ISO 8601
}

export class ExternalDataSyncResult {
  private data: ExternalDataSyncResultData;

  constructor(data: ExternalDataSyncResultData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: ExternalDataSyncResultData): void {
    if (!data.id) throw new Error('ID is required');
    if (!data.automationVariablesId) throw new Error('AutomationVariables ID is required');
    if (!data.externalDataSourceId) throw new Error('ExternalDataSource ID is required');
    if (!data.status) throw new Error('Status is required');
    if (!data.syncedAt) throw new Error('Synced date is required');
  }

  // Getters
  getId(): string { return this.data.id; }
  getAutomationVariablesId(): string { return this.data.automationVariablesId; }
  getExternalDataSourceId(): string { return this.data.externalDataSourceId; }
  getStatus(): 'success' | 'failed' { return this.data.status; }
  getExtractedVariables(): { [key: string]: string } { return { ...this.data.extractedVariables }; }
  getErrorMessage(): string | undefined { return this.data.errorMessage; }
  getSyncedAt(): string { return this.data.syncedAt; }

  // Export
  toData(): ExternalDataSyncResultData {
    return { ...this.data };
  }

  // Static factory
  static create(params: {
    automationVariablesId: string;
    externalDataSourceId: string;
    status: 'success' | 'failed';
    extractedVariables: { [key: string]: string };
    errorMessage?: string;
  }): ExternalDataSyncResult {
    return new ExternalDataSyncResult({
      id: uuidv4(),
      automationVariablesId: params.automationVariablesId,
      externalDataSourceId: params.externalDataSourceId,
      status: params.status,
      extractedVariables: params.extractedVariables,
      errorMessage: params.errorMessage,
      syncedAt: new Date().toISOString(),
    });
  }
}
```

## 3. Repository 設計

### 3.1 IExternalDataSourceRepository

```typescript
// src/domain/repositories/IExternalDataSourceRepository.ts

import { ExternalDataSource } from '@domain/entities/ExternalDataSource';

export interface IExternalDataSourceRepository {
  /**
   * Save external data source
   */
  save(dataSource: ExternalDataSource): Promise<void>;

  /**
   * Load external data source by ID
   */
  load(id: string): Promise<ExternalDataSource | null>;

  /**
   * Load all external data sources
   */
  loadAll(): Promise<ExternalDataSource[]>;

  /**
   * Delete external data source by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if external data source exists
   */
  exists(id: string): Promise<boolean>;
}
```

### 3.2 ChromeStorageExternalDataSourceRepository

```typescript
// src/infrastructure/repositories/ChromeStorageExternalDataSourceRepository.ts

import browser from 'webextension-polyfill';
import { IExternalDataSourceRepository } from '@domain/repositories/IExternalDataSourceRepository';
import { ExternalDataSource, ExternalDataSourceData } from '@domain/entities/ExternalDataSource';
import { ILogger } from '@domain/services/ILogger';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { TokenEncryptionService } from '@infrastructure/encryption/TokenEncryptionService';

export class ChromeStorageExternalDataSourceRepository implements IExternalDataSourceRepository {
  constructor(
    private logger: ILogger,
    private encryptionService: TokenEncryptionService
  ) {}

  async save(dataSource: ExternalDataSource): Promise<void> {
    try {
      const storage = await this.loadStorage();
      const data = dataSource.toData();

      // 認証情報を暗号化
      const encryptedData = await this.encryptAuthCredentials(data);

      const existingIndex = storage.findIndex((ds) => ds.id === data.id);
      if (existingIndex >= 0) {
        storage[existingIndex] = encryptedData;
        this.logger.info(`External data source updated: ${data.id}`);
      } else {
        storage.push(encryptedData);
        this.logger.info(`External data source created: ${data.id}`);
      }

      await this.saveStorage(storage);
    } catch (error) {
      this.logger.error('Failed to save external data source', error);
      throw new Error('Failed to save external data source');
    }
  }

  async load(id: string): Promise<ExternalDataSource | null> {
    try {
      const storage = await this.loadStorage();
      const data = storage.find((ds) => ds.id === id);

      if (!data) {
        return null;
      }

      // 認証情報を復号化
      const decryptedData = await this.decryptAuthCredentials(data);

      return new ExternalDataSource(decryptedData);
    } catch (error) {
      this.logger.error('Failed to load external data source', error);
      return null;
    }
  }

  async loadAll(): Promise<ExternalDataSource[]> {
    try {
      const storage = await this.loadStorage();

      // 認証情報を復号化
      const decryptedData = await Promise.all(
        storage.map((data) => this.decryptAuthCredentials(data))
      );

      return decryptedData.map((data) => new ExternalDataSource(data));
    } catch (error) {
      this.logger.error('Failed to load all external data sources', error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const storage = await this.loadStorage();
      const filtered = storage.filter((ds) => ds.id !== id);

      if (filtered.length === storage.length) {
        this.logger.warn(`No external data source found to delete: ${id}`);
      } else {
        await this.saveStorage(filtered);
        this.logger.info(`External data source deleted: ${id}`);
      }
    } catch (error) {
      this.logger.error('Failed to delete external data source', error);
      throw new Error('Failed to delete external data source');
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const storage = await this.loadStorage();
      return storage.some((ds) => ds.id === id);
    } catch (error) {
      this.logger.error('Failed to check external data source existence', error);
      return false;
    }
  }

  private async loadStorage(): Promise<ExternalDataSourceData[]> {
    const result = await browser.storage.local.get(STORAGE_KEYS.EXTERNAL_DATA_SOURCES);
    return (result[STORAGE_KEYS.EXTERNAL_DATA_SOURCES] as ExternalDataSourceData[]) || [];
  }

  private async saveStorage(data: ExternalDataSourceData[]): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEYS.EXTERNAL_DATA_SOURCES]: data });
  }

  private async encryptAuthCredentials(
    data: ExternalDataSourceData
  ): Promise<ExternalDataSourceData> {
    const authConfig = { ...data.authConfig };
    const credentials = { ...authConfig.credentials };

    if (credentials.token) {
      credentials.token = await this.encryptionService.encrypt(credentials.token);
    }
    if (credentials.apiKey) {
      credentials.apiKey = await this.encryptionService.encrypt(credentials.apiKey);
    }
    if (credentials.password) {
      credentials.password = await this.encryptionService.encrypt(credentials.password);
    }
    if (credentials.clientSecret) {
      credentials.clientSecret = await this.encryptionService.encrypt(credentials.clientSecret);
    }
    if (credentials.accessToken) {
      credentials.accessToken = await this.encryptionService.encrypt(credentials.accessToken);
    }
    if (credentials.refreshToken) {
      credentials.refreshToken = await this.encryptionService.encrypt(credentials.refreshToken);
    }

    return {
      ...data,
      authConfig: {
        ...authConfig,
        credentials,
      },
    };
  }

  private async decryptAuthCredentials(
    data: ExternalDataSourceData
  ): Promise<ExternalDataSourceData> {
    const authConfig = { ...data.authConfig };
    const credentials = { ...authConfig.credentials };

    if (credentials.token) {
      credentials.token = await this.encryptionService.decrypt(credentials.token);
    }
    if (credentials.apiKey) {
      credentials.apiKey = await this.encryptionService.decrypt(credentials.apiKey);
    }
    if (credentials.password) {
      credentials.password = await this.encryptionService.decrypt(credentials.password);
    }
    if (credentials.clientSecret) {
      credentials.clientSecret = await this.encryptionService.decrypt(credentials.clientSecret);
    }
    if (credentials.accessToken) {
      credentials.accessToken = await this.encryptionService.decrypt(credentials.accessToken);
    }
    if (credentials.refreshToken) {
      credentials.refreshToken = await this.encryptionService.decrypt(credentials.refreshToken);
    }

    return {
      ...data,
      authConfig: {
        ...authConfig,
        credentials,
      },
    };
  }
}
```

## 4. Service 設計

### 4.1 IHttpClient

```typescript
// src/domain/services/IHttpClient.ts

export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers: { [key: string]: string };
  body?: string;
  timeout?: number;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  body: string;
}

export interface IHttpClient {
  /**
   * Execute HTTP request
   */
  request(request: HttpRequest): Promise<HttpResponse>;
}
```

### 4.2 ChromeHttpClient

```typescript
// src/infrastructure/services/ChromeHttpClient.ts

import { IHttpClient, HttpRequest, HttpResponse } from '@domain/services/IHttpClient';
import { ILogger } from '@domain/services/ILogger';

export class ChromeHttpClient implements IHttpClient {
  constructor(private logger: ILogger) {}

  async request(request: HttpRequest): Promise<HttpResponse> {
    this.logger.info(`HTTP ${request.method} ${request.url}`);

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: request.timeout ? AbortSignal.timeout(request.timeout) : undefined,
      });

      const responseText = await response.text();

      this.logger.info(`HTTP ${request.method} ${request.url} - ${response.status}`);

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
      };
    } catch (error) {
      this.logger.error(`HTTP ${request.method} ${request.url} failed`, error);
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }
}
```

### 4.3 IDataMapper

```typescript
// src/domain/services/IDataMapper.ts

export interface IDataMapper {
  /**
   * Extract value from data using path expression
   * @param data - Data object (usually parsed JSON)
   * @param path - Path expression (e.g., JSONPath: "$.results[0].id")
   * @returns Extracted value or null if not found
   */
  extract(data: any, path: string): any;
}
```

### 4.4 JsonPathDataMapper

```typescript
// src/infrastructure/services/JsonPathDataMapper.ts

import { IDataMapper } from '@domain/services/IDataMapper';
import { ILogger } from '@domain/services/ILogger';
import * as jsonpath from 'jsonpath'; // 外部ライブラリを使用

export class JsonPathDataMapper implements IDataMapper {
  constructor(private logger: ILogger) {}

  extract(data: any, path: string): any {
    try {
      const result = jsonpath.query(data, path);

      if (result.length === 0) {
        this.logger.warn(`JSONPath extraction returned no results: ${path}`);
        return null;
      }

      // 結果が配列で1要素の場合は要素自体を返す
      if (result.length === 1) {
        return result[0];
      }

      // 複数要素の場合は配列を返す
      return result;
    } catch (error) {
      this.logger.error(`JSONPath extraction failed: ${path}`, error);
      return null;
    }
  }
}
```

### 4.5 TokenEncryptionService

```typescript
// src/infrastructure/encryption/TokenEncryptionService.ts

import { ILogger } from '@domain/services/ILogger';

export class TokenEncryptionService {
  constructor(private logger: ILogger) {}

  /**
   * Encrypt sensitive data
   * 実装方法: Web Crypto API を使用した AES-GCM 暗号化
   */
  async encrypt(plainText: string): Promise<string> {
    try {
      // Generate encryption key
      const key = await this.getEncryptionKey();

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encode plaintext
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);

      // Encrypt
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      // Combine IV + encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decrypt(encryptedText: string): Promise<string> {
    try {
      // Get encryption key
      const key = await this.getEncryptionKey();

      // Decode base64
      const combined = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      // Decode to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Get or create encryption key
   * 暗号化キーは chrome.storage.local に保存（初回生成後）
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    const ENCRYPTION_KEY_STORAGE_KEY = 'encryptionKey';

    // Load existing key
    const stored = await browser.storage.local.get(ENCRYPTION_KEY_STORAGE_KEY);

    if (stored[ENCRYPTION_KEY_STORAGE_KEY]) {
      const keyData = Uint8Array.from(
        atob(stored[ENCRYPTION_KEY_STORAGE_KEY]),
        (c) => c.charCodeAt(0)
      );

      return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
    }

    // Generate new key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Export and save key
    const exported = await crypto.subtle.exportKey('raw', key);
    const keyData = btoa(String.fromCharCode(...new Uint8Array(exported)));

    await browser.storage.local.set({ [ENCRYPTION_KEY_STORAGE_KEY]: keyData });

    return key;
  }
}
```

## 5. Use Case 設計

### 5.1 SyncAutomationVariablesFromExternalSourceUseCase

```typescript
// src/usecases/SyncAutomationVariablesFromExternalSourceUseCase.ts

import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { ExternalDataSource, RequestStep } from '@domain/entities/ExternalDataSource';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { IExternalDataSourceRepository } from '@domain/repositories/IExternalDataSourceRepository';
import { IHttpClient, HttpRequest } from '@domain/services/IHttpClient';
import { IDataMapper } from '@domain/services/IDataMapper';
import { ILogger } from '@domain/services/ILogger';

export class SyncAutomationVariablesFromExternalSourceUseCase {
  constructor(
    private automationVariablesRepo: AutomationVariablesRepository,
    private externalDataSourceRepo: IExternalDataSourceRepository,
    private httpClient: IHttpClient,
    private dataMapper: IDataMapper,
    private logger: ILogger
  ) {}

  async execute(automationVariablesId: string): Promise<void> {
    // 1. Load AutomationVariables
    const variables = await this.automationVariablesRepo.load(automationVariablesId);
    if (!variables) {
      throw new Error(`AutomationVariables not found: ${automationVariablesId}`);
    }

    const externalDataSourceId = variables.getExternalDataSourceId();
    if (!externalDataSourceId) {
      throw new Error('No external data source configured');
    }

    // 2. Load ExternalDataSource
    const dataSource = await this.externalDataSourceRepo.load(externalDataSourceId);
    if (!dataSource) {
      throw new Error(`External data source not found: ${externalDataSourceId}`);
    }

    try {
      // 3. Execute request steps and extract variables
      const extractedVariables = await this.executeRequestSteps(dataSource);

      // 4. Apply variable mappings
      const mappedVariables = this.applyVariableMappings(
        extractedVariables,
        dataSource.getVariableMappings()
      );

      // 5. Update AutomationVariables with extracted data
      const updatedVariables = variables.setSyncResult('success', mappedVariables);
      await this.automationVariablesRepo.save(updatedVariables);

      this.logger.info(`Sync completed successfully: ${automationVariablesId}`);
    } catch (error) {
      this.logger.error('Sync failed', error);

      // Record sync error
      const failedVariables = variables.setSyncResult('failed', undefined, error.message);
      await this.automationVariablesRepo.save(failedVariables);

      throw error;
    }
  }

  private async executeRequestSteps(
    dataSource: ExternalDataSource
  ): Promise<{ [key: string]: any }> {
    const steps = dataSource.getRequestSteps();
    const authConfig = dataSource.getAuthConfig();
    const extractedVariables: { [key: string]: any } = {};

    for (const step of steps) {
      this.logger.info(`Executing step: ${step.name}`);

      // 1. Build request with variable substitution
      const request = this.buildRequest(step, extractedVariables, authConfig);

      // 2. Execute HTTP request
      const response = await this.httpClient.request(request);

      // 3. Check response status
      if (response.status < 200 || response.status >= 300) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText}: ${response.body}`
        );
      }

      // 4. Parse response
      const responseData = JSON.parse(response.body);

      // 5. Extract variables from response
      for (const mapping of step.responseMapping) {
        const value = this.dataMapper.extract(responseData, mapping.jsonPath);
        extractedVariables[mapping.variableName] = value;

        this.logger.info(
          `Extracted variable: ${mapping.variableName} = ${JSON.stringify(value)}`
        );
      }
    }

    return extractedVariables;
  }

  private buildRequest(
    step: RequestStep,
    variables: { [key: string]: any },
    authConfig: any
  ): HttpRequest {
    // URL: 変数置換 (例: "https://api.example.com/users/${userId}")
    let url = step.url;
    for (const [key, value] of Object.entries(variables)) {
      url = url.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
    }

    // Headers: 認証情報を追加
    const headers = { ...step.headers };

    if (authConfig.type === 'bearer' && authConfig.credentials.token) {
      headers['Authorization'] = `Bearer ${authConfig.credentials.token}`;
    } else if (authConfig.type === 'apikey' && authConfig.credentials.apiKey) {
      headers['X-API-Key'] = authConfig.credentials.apiKey;
    } else if (authConfig.type === 'basic' && authConfig.credentials.username) {
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
      timeout: 30000, // 30 seconds
    };
  }

  private applyVariableMappings(
    extractedVariables: { [key: string]: any },
    mappings: { sourceVariable: string; targetVariable: string }[]
  ): { [key: string]: string } {
    const result: { [key: string]: string } = {};

    for (const mapping of mappings) {
      const value = extractedVariables[mapping.sourceVariable];
      if (value !== undefined && value !== null) {
        result[mapping.targetVariable] = String(value);
      }
    }

    return result;
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
  EXTERNAL_DATA_SOURCES: 'externalDataSources', // 追加
} as const;
```

## 7. テスト戦略

### 7.1 Unit Tests

- **Entity Tests**: ExternalDataSource, ExternalDataSyncResult のビジネスロジック
- **Repository Tests**: ChromeStorageExternalDataSourceRepository の CRUD 操作
- **Service Tests**:
  - ChromeHttpClient のリクエスト送信
  - JsonPathDataMapper のデータ抽出
  - TokenEncryptionService の暗号化・復号化
- **UseCase Tests**: SyncAutomationVariablesFromExternalSourceUseCase のフロー

### 7.2 Integration Tests

- 外部データソースからのデータ取得（モックサーバー使用）
- AutomationVariables との統合
- エラーハンドリング

### 7.3 E2E Tests

- UI からの外部データソース登録
- データ同期の実行
- 自動入力での使用

---

# 作業手順

## Phase 1: Entity & Repository (3日)

### 1.1 Entity 作成
- [ ] ExternalDataSource エンティティ作成
- [ ] ExternalDataSyncResult エンティティ作成
- [ ] AutomationVariables へ外部データソース連携フィールド追加
- [ ] ユニットテスト作成

### 1.2 Repository 作成
- [ ] IExternalDataSourceRepository インターフェース作成
- [ ] ChromeStorageExternalDataSourceRepository 実装
- [ ] TokenEncryptionService 実装
- [ ] ユニットテスト作成

### 1.3 StorageKeys 更新
- [ ] STORAGE_KEYS に EXTERNAL_DATA_SOURCES 追加

## Phase 2: Services (3日)

### 2.1 HTTP Client
- [ ] IHttpClient インターフェース作成
- [ ] ChromeHttpClient 実装
- [ ] ユニットテスト作成

### 2.2 Data Mapper
- [ ] IDataMapper インターフェース作成
- [ ] JsonPathDataMapper 実装（jsonpath ライブラリ使用）
- [ ] ユニットテスト作成

### 2.3 パッケージ追加
- [ ] `npm install jsonpath` 実行

## Phase 3: Use Cases (3日)

### 3.1 CRUD Use Cases
- [ ] CreateExternalDataSourceUseCase
- [ ] UpdateExternalDataSourceUseCase
- [ ] DeleteExternalDataSourceUseCase
- [ ] GetExternalDataSourcesUseCase
- [ ] ユニットテスト作成

### 3.2 Sync Use Cases
- [ ] TestExternalDataSourceConnectionUseCase
- [ ] SyncAutomationVariablesFromExternalSourceUseCase
- [ ] GetAutomationVariablesWithExternalDataUseCase
- [ ] ユニットテスト作成
- [ ] 統合テスト作成

## Phase 4: UI - システム設定画面 (4日)

### 4.1 外部データソース一覧表示
- [ ] SystemSettingsManager に外部データソースタブ追加
- [ ] ExternalDataSourceList コンポーネント作成
- [ ] 一覧表示機能実装

### 4.2 外部データソース登録・編集
- [ ] ExternalDataSourceModal コンポーネント作成
- [ ] 基本情報入力フォーム実装
- [ ] 認証設定フォーム実装
- [ ] リクエストステップ設定フォーム実装
- [ ] 変数マッピング設定フォーム実装

### 4.3 接続テスト機能
- [ ] テスト実行ボタン実装
- [ ] テスト結果表示実装

### 4.4 スタイリング
- [ ] CSS 作成
- [ ] レスポンシブ対応

### 4.5 多言語対応
- [ ] messages.json に文言追加（日本語・英語）

## Phase 5: UI - AutomationVariables 管理画面 (3日)

### 5.1 外部データソース連携機能追加
- [ ] AutomationVariablesManager に外部データソース選択機能追加
- [ ] 同期ボタン追加
- [ ] 最終同期日時表示

### 5.2 データ同期機能
- [ ] 手動同期実装
- [ ] 同期結果表示
- [ ] エラー表示

### 5.3 変数の視覚的区別
- [ ] 外部データソース由来の変数にアイコン表示
- [ ] ツールチップで詳細情報表示

## Phase 6: 自動同期機能 (2日)

### 6.1 自動同期ロジック
- [ ] 同期タイミング判定ロジック実装
- [ ] 自動入力実行前の同期実装
- [ ] バックグラウンド定期同期実装（オプション）

### 6.2 システム設定に同期設定追加
- [ ] 自動同期の有効化/無効化設定
- [ ] 同期間隔設定

## Phase 7: エラーハンドリング & 最適化 (2日)

### 7.1 エラーハンドリング
- [ ] 認証エラーハンドリング
- [ ] ネットワークエラーハンドリング
- [ ] データ形式エラーハンドリング
- [ ] エラー通知実装

### 7.2 パフォーマンス最適化
- [ ] キャッシュ機構実装
- [ ] リトライ処理実装
- [ ] タイムアウト設定

## Phase 8: ドキュメント & テスト (2日)

### 8.1 ドキュメント作成
- [ ] ユーザーマニュアル作成
- [ ] API 設定例（Notion、Google Sheets）作成
- [ ] トラブルシューティングガイド作成

### 8.2 総合テスト
- [ ] E2E テスト実施
- [ ] セキュリティレビュー
- [ ] パフォーマンステスト

## Phase 9: リリース準備 (1日)

### 9.1 最終確認
- [ ] すべてのテスト実行
- [ ] コードレビュー
- [ ] ドキュメント最終確認

### 9.2 リリースノート作成
- [ ] 変更内容まとめ
- [ ] 使用方法説明

---

# 推定工数

- Phase 1: 3日
- Phase 2: 3日
- Phase 3: 3日
- Phase 4: 4日
- Phase 5: 3日
- Phase 6: 2日
- Phase 7: 2日
- Phase 8: 2日
- Phase 9: 1日

**合計: 23日**

---

# リスクと対策

## リスク1: 外部API の制限

**リスク**: レート制限、データ形式変更等

**対策**:
- リトライ処理の実装
- エラーログの詳細化
- API ドキュメントの定期確認

## リスク2: セキュリティ懸念

**リスク**: 認証情報の漏洩

**対策**:
- Web Crypto API を使用した暗号化
- ログに認証情報を出力しない
- セキュリティレビューの実施

## リスク3: パフォーマンス低下

**リスク**: 外部API 呼び出しによる遅延

**対策**:
- キャッシュ機構の実装
- 同期タイミングの最適化
- タイムアウト設定

## リスク4: 複雑性の増加

**リスク**: UI が複雑になり使いにくくなる

**対策**:
- プリセット機能（Notion、Google Sheets 用）
- ウィザード形式の設定画面
- 詳細なヘルプテキスト

---

# 今後の拡張案

1. **プリセット機能**: Notion、Google Sheets 等の人気サービス用のテンプレート
2. **OAuth 2.0 フルサポート**: ブラウザフローを使った認証
3. **Webhook サポート**: データ更新時に外部から通知を受け取る
4. **複数データソースの統合**: 複数のデータソースから変数を収集
5. **条件付き変数マッピング**: 特定の条件下でのみ変数を適用
6. **データ変換機能**: 取得したデータを加工してから使用
7. **バージョン管理**: データソース定義のバージョン管理
