# Phase 2.3: Use Cases 実装 - 完了報告

**実装期間**: 2025-01-16
**ステータス**: ✅ 完了
**進捗**: 100% (8/8 タスク完了)

---

## 📋 実装概要

Phase 2.3では、データ同期機能で使用するアプリケーション層のUse Casesを実装しました。設定管理、CSV インポート/エクスポート、接続テスト、設定検証のユースケースを作成し、Clean ArchitectureとDomain-Driven Design (DDD)の原則に従って実装しました。

---

## ✅ 完了タスク

### Task 4.3.1: CreateSyncConfigUseCase 実装
**ファイル**: `src/application/use-cases/sync/CreateSyncConfigUseCase.ts` (165行)
**実装内容**:
- 新しい同期設定の作成
- 既存設定の重複チェック
- 同期方向の検証（受信/送信ステップ要件）
- 定期同期間隔の検証（最小1分）

**主要メソッド**:
- `execute()` - Use Case実行
- `validateInput()` - 入力検証
- `validateSyncDirection()` - 同期方向検証
- `validatePeriodicSync()` - 定期同期検証

**検証ルール**:
- storageKey の一意性チェック
- 双方向/受信同期: receiveSteps が必須
- 双方向/送信同期: sendSteps が必須
- 定期同期: syncIntervalMinutes ≥ 1

---

### Task 4.3.2: UpdateSyncConfigUseCase 実装
**ファイル**: `src/application/use-cases/sync/UpdateSyncConfigUseCase.ts` (180行)
**実装内容**:
- 既存設定の更新
- Immutableな更新パターン使用
- 更新前の存在チェック
- 更新後の検証

**主要メソッド**:
- `execute()` - Use Case実行
- `applyUpdates()` - 設定更新適用
- `validateUpdatedConfig()` - 更新設定検証
- `validateSyncDirection()` - 同期方向検証
- `validatePeriodicSync()` - 定期同期検証

**更新可能フィールド**:
- enabled, syncMethod, syncTiming, syncDirection
- syncIntervalMinutes
- receiveSteps, sendSteps
- lastSyncDate

**パターン**: Immutable Entity Pattern - すべてのsetterは新しいインスタンスを返す

---

### Task 4.3.3: DeleteSyncConfigUseCase 実装
**ファイル**: `src/application/use-cases/sync/DeleteSyncConfigUseCase.ts` (55行)
**実装内容**:
- 同期設定の削除
- 削除前の存在チェック
- エラーハンドリング

**主要メソッド**:
- `execute()` - Use Case実行

**検証ルール**:
- 存在しない設定の削除はエラー

---

### Task 4.3.4: ListSyncConfigsUseCase 実装
**ファイル**: `src/application/use-cases/sync/ListSyncConfigsUseCase.ts` (76行)
**実装内容**:
- 同期設定の一覧取得
- オプションフィルタリング

**主要メソッド**:
- `execute()` - Use Case実行

**フィルタリングオプション**:
- `storageKey` - 特定のストレージキーのみ
- `enabledPeriodicOnly` - 有効な定期同期のみ
- デフォルト - 全設定

---

### Task 4.3.5: ImportCSVUseCase 実装
**ファイル**: `src/application/use-cases/sync/ImportCSVUseCase.ts` (143行)
**実装内容**:
- CSVデータのインポート
- Chrome Storage への保存
- 既存データとのマージオプション

**主要メソッド**:
- `execute()` - Use Case実行
- `getStorageData()` - Chrome Storage からデータ取得
- `setStorageData()` - Chrome Storage へデータ保存

**機能**:
- CSV形式検証
- パースオプション対応
- マージモード対応（mergeWithExisting）
- インポート統計情報の返却

---

### Task 4.3.6: ExportCSVUseCase 実装
**ファイル**: `src/application/use-cases/sync/ExportCSVUseCase.ts` (100行)
**実装内容**:
- Chrome Storage からCSVエクスポート
- 配列データの検証
- CSV生成オプション対応

**主要メソッド**:
- `execute()` - Use Case実行
- `getStorageData()` - Chrome Storage からデータ取得

**機能**:
- データ存在チェック
- 配列型検証
- CSV生成オプション対応
- エクスポート統計情報の返却

---

### Task 4.3.7: ValidateSyncConfigUseCase 実装
**ファイル**: `src/application/use-cases/sync/ValidateSyncConfigUseCase.ts` (320行)
**実装内容**:
- 同期設定の包括的検証
- エラーと警告の分離
- Deep Validation オプション

**主要メソッド**:
- `execute()` - Use Case実行
- `validateBasicStructure()` - 基本構造検証
- `validateDbSync()` - DB同期検証
- `validateDbSyncDeep()` - DB同期深度検証
- `validateCsvSync()` - CSV同期検証
- `validateTiming()` - タイミング検証
- `validateDirectionAndSteps()` - 方向とステップ検証
- `isValidUrl()` - URL検証（変数展開対応）

**検証項目**:
1. **基本構造**: storageKey の存在
2. **DB同期**:
   - 認証設定の存在
   - 認証タイプ別の必須フィールド
   - Bearer: token
   - API Key: apiKey
   - Basic: username + password
   - OAuth2: accessToken (警告)
3. **Deep Validation** (オプション):
   - URL形式検証（変数 `${...}` 対応）
   - JSONPath式検証
   - HTTPメソッドとボディの整合性
4. **CSV同期**:
   - CSV設定の存在
   - フィールドマッピング
5. **タイミング**:
   - 定期同期間隔 > 0
   - 間隔 < 60秒で警告
6. **方向とステップ**:
   - receiveSteps / sendSteps の要件チェック

**出力**:
- エラー（error）と警告（warning）を分離
- フィールド単位の詳細情報

---

### Task 4.3.8: TestConnectionUseCase 実装
**ファイル**: `src/application/use-cases/sync/TestConnectionUseCase.ts` (123行)
**実装内容**:
- 同期エンドポイントへの接続テスト
- 認証ヘッダーの構築
- レスポンスタイム測定

**主要メソッド**:
- `execute()` - Use Case実行

**機能**:
- DB同期のみサポート
- 最初の receiveStep を使用
- 認証タイプ別のヘッダー構築:
  - Bearer: `Authorization: Bearer {token}`
  - API Key: `X-API-Key: {apiKey}`
  - Basic: `Authorization: Basic {base64(username:password)}`
  - OAuth2: `Authorization: Bearer {accessToken}`
- タイムアウト設定（デフォルト10秒）
- レスポンスタイム測定
- 2xx ステータスコードを成功と判定

**出力**:
- isConnectable: 接続可否
- responseTime: レスポンスタイム（ミリ秒）
- statusCode: HTTPステータスコード
- error: エラーメッセージ

---

## 🎯 実装品質

### アーキテクチャ準拠
- ✅ Clean Architecture: Application層の適切な実装
- ✅ DDD: Use Caseパターンの適用
- ✅ Dependency Inversion: リポジトリとサービスへの依存は抽象
- ✅ Single Responsibility: 各Use Caseが単一のユースケースを実装

### コード品質
- ✅ TypeScript: Input/Output型の明示的定義
- ✅ Error Handling: Try-Catchによる包括的エラーハンドリング
- ✅ Validation: 詳細な検証ロジック
- ✅ Logging: ステップごとの詳細ログ
- ✅ Immutability: Entity更新時の不変性維持

### Use Case パターン
- ✅ Input/Output DTOs: 明確なデータ転送オブジェクト
- ✅ Execute Method: 統一されたexecute()メソッド
- ✅ Constructor Injection: 依存性のコンストラクタ注入
- ✅ Success/Error Response: 統一されたレスポンス形式

---

## 📁 作成ファイル一覧

### Application Layer (Use Cases)
1. `src/application/use-cases/sync/CreateSyncConfigUseCase.ts` (165行)
2. `src/application/use-cases/sync/UpdateSyncConfigUseCase.ts` (180行)
3. `src/application/use-cases/sync/DeleteSyncConfigUseCase.ts` (55行)
4. `src/application/use-cases/sync/ListSyncConfigsUseCase.ts` (76行)
5. `src/application/use-cases/sync/ImportCSVUseCase.ts` (143行)
6. `src/application/use-cases/sync/ExportCSVUseCase.ts` (100行)
7. `src/application/use-cases/sync/ValidateSyncConfigUseCase.ts` (320行)
8. `src/application/use-cases/sync/TestConnectionUseCase.ts` (123行)

**合計**: 8新規ファイル
**合計行数**: 1,162行

---

## 🔧 依存関係

### Domain Layer
- `StorageSyncConfig` - Entity
- `IStorageSyncConfigRepository` - Repository Interface
- `IHttpClient` - HTTP Client Interface
- `ICSVConverter` - CSV Converter Interface
- `IDataMapper` - Data Mapper Interface
- `Logger` - Logger Service

### Infrastructure Layer
- `ChromeHttpClient` - HTTP Client Implementation
- `CSVConverter` - CSV Converter Implementation
- `JsonPathDataMapper` - Data Mapper Implementation

### Chrome APIs
- `chrome.storage.local` - ローカルストレージ API

---

## 📊 Use Case 一覧

| Use Case | 主な機能 | 依存サービス |
|---------|---------|------------|
| CreateSyncConfig | 設定作成 | Repository, Logger |
| UpdateSyncConfig | 設定更新 | Repository, Logger |
| DeleteSyncConfig | 設定削除 | Repository, Logger |
| ListSyncConfigs | 設定一覧 | Repository, Logger |
| ImportCSV | CSV インポート | CSVConverter, Logger, Chrome Storage |
| ExportCSV | CSV エクスポート | CSVConverter, Logger, Chrome Storage |
| ValidateSyncConfig | 設定検証 | DataMapper, Logger |
| TestConnection | 接続テスト | HttpClient, Logger |

---

## 🚀 使用例

### CreateSyncConfigUseCase
```typescript
const useCase = new CreateSyncConfigUseCase(repository, logger);
const result = await useCase.execute({
  storageKey: 'myData',
  enabled: true,
  syncMethod: 'db',
  syncTiming: 'periodic',
  syncDirection: 'bidirectional',
  syncIntervalMinutes: 15,
  receiveSteps: [/* ... */],
  sendSteps: [/* ... */],
});

if (result.success) {
  console.log('Config created:', result.config.getId());
}
```

### ImportCSVUseCase
```typescript
const useCase = new ImportCSVUseCase(csvConverter, logger);
const result = await useCase.execute({
  csvData: 'name,age\nAlice,25\nBob,30',
  storageKey: 'users',
  mergeWithExisting: true,
});

if (result.success) {
  console.log(`Imported ${result.importedCount} rows`);
}
```

### TestConnectionUseCase
```typescript
const useCase = new TestConnectionUseCase(httpClient, logger);
const result = await useCase.execute({
  config: syncConfig,
  timeout: 5000,
});

if (result.isConnectable) {
  console.log(`Connected in ${result.responseTime}ms`);
}
```

---

## 🎨 設計パターン

### Use Case Pattern
- **Input/Output DTOs**: 明確なインプット/アウトプット型
- **Execute Method**: 統一されたインターフェース
- **Success/Error Response**: 成功/失敗の明示的な区別

### Validation Pattern
- **Early Return**: バリデーションエラー時の早期リターン
- **Separation of Concerns**: バリデーションロジックの分離
- **Error/Warning Distinction**: エラーと警告の区別

### Repository Pattern
- **Abstract Data Access**: データアクセスの抽象化
- **Domain Model Focus**: ドメインモデル中心の設計

### Service Layer Pattern
- **Business Logic**: ビジネスロジックの集約
- **Orchestration**: 複数サービスの協調

---

## 🔒 セキュリティ考慮事項

### 認証情報の取り扱い
- ✅ 認証情報はSecure Storageから取得（Phase 1実装済み）
- ✅ HTTP通信時のみメモリに展開
- ✅ ログに認証情報を出力しない

### 入力検証
- ✅ Use Case入力の厳密な検証
- ✅ URL検証（SSRF対策）
- ✅ JSONPath式検証（インジェクション対策）

### エラーメッセージ
- ✅ センシティブ情報を含まないエラーメッセージ
- ✅ ユーザーフレンドリーなエラー表示

---

## ⚡ パフォーマンス考慮事項

### 非同期処理
- ✅ Async/Awaitによる非ブロッキング処理
- ✅ 適切なタイムアウト設定

### バリデーション
- ✅ 軽量なバリデーションから実行
- ✅ Deep Validationはオプション

### データ処理
- ✅ CSVパースの効率的な実装（PapaParse）
- ✅ JSONPath式のキャッシング候補（今後の最適化）

---

## 📈 次のステップ

### Phase 2.4: Use Cases テスト実装 (次フェーズ)

**予定タスク**:
1. CreateSyncConfigUseCase テスト作成
2. UpdateSyncConfigUseCase テスト作成
3. DeleteSyncConfigUseCase テスト作成
4. ListSyncConfigsUseCase テスト作成
5. ImportCSVUseCase テスト作成
6. ExportCSVUseCase テスト作成
7. ValidateSyncConfigUseCase テスト作成
8. TestConnectionUseCase テスト作成

**目標**:
- 各Use Caseで10〜15テスト
- 正常系、異常系、エッジケースの網羅
- モックを使用した単体テスト
- コードカバレッジ 90%以上

**予定期間**: 2日
**予定テスト数**: 約80〜120テスト

---

### Phase 2.5: Integration & End-to-End Testing

**予定タスク**:
1. 統合テスト環境の構築
2. Use Case統合テスト作成
3. エンドツーエンドシナリオテスト
4. パフォーマンステスト

---

## 📝 備考

### Lint結果
- ✅ Prettier自動修正適用済み
- ⚠️ 一部 complexity 警告あり（Use Caseのビジネスロジックによるもの、許容範囲内）
- ⚠️ 一部 `any` 型警告あり（Chrome Storage APIとの型互換性のため、許容範囲内）

### ディレクトリ構造
```
src/application/use-cases/sync/
├── CreateSyncConfigUseCase.ts
├── UpdateSyncConfigUseCase.ts
├── DeleteSyncConfigUseCase.ts
├── ListSyncConfigsUseCase.ts
├── ImportCSVUseCase.ts
├── ExportCSVUseCase.ts
├── ValidateSyncConfigUseCase.ts
└── TestConnectionUseCase.ts
```

### Chrome Storage API使用
- `chrome.storage.local.get()` - データ取得
- `chrome.storage.local.set()` - データ保存
- Promise ベースのラッパー実装

---

**実装完了日**: 2025-01-16
**実装者**: Claude
**レビュー**: 未実施
**次フェーズ開始予定**: Phase 2.4 - Use Cases テスト実装
