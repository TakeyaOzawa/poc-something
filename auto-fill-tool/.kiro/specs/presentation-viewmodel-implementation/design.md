# Design Document

## Overview

Presentation層のViewModel完全実装により、Presentation層からDomainエンティティへの直接参照を排除します。現在、4つのPresenterファイルでDomainエンティティを直接インスタンス化しており、これがクリーンアーキテクチャの原則に反しています。

この設計では、UseCaseをDTOベースに変更し、Presentation層でエンティティを作成する必要をなくします。

## Architecture

### Current Architecture (Before)

```
Presentation層
  ↓ (直接インスタンス化)
Domain層エンティティ
  ↓
UseCase (エンティティを受け取る)
```

### Target Architecture (After)

```
Presentation層
  ↓ (DTOを渡す)
UseCase (DTOを受け取る)
  ↓ (内部でエンティティを作成)
Domain層エンティティ
```

## Components and Interfaces

### 1. UpdateSystemSettingsUseCase

#### Before

```typescript
export interface UpdateSystemSettingsInput {
  settings: SystemSettingsCollection; // ❌ エンティティを直接受け取る
}
```

#### After

```typescript
export interface UpdateSystemSettingsInput {
  retryWaitSecondsMin?: number;
  retryWaitSecondsMax?: number;
  retryCount?: number;
  enableTabRecording?: boolean;
  recordingBitrate?: number;
  recordingRetentionDays?: number;
  enabledLogSources?: string[];
  securityEventsOnly?: boolean;
  maxStoredLogs?: number;
  logRetentionDays?: number;
  // その他の設定項目
}
```

### 2. CreateSyncConfigUseCase

#### Before

```typescript
async createConfig(config: StorageSyncConfig): Promise<void> {
  // ❌ エンティティを直接受け取る
}
```

#### After

```typescript
export interface CreateSyncConfigInput {
  storageKey: string;
  enabled: boolean;
  syncMethod: SyncMethod;
  syncTiming: SyncTiming;
  syncDirection: SyncDirection;
  syncIntervalSeconds?: number;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}

async execute(input: CreateSyncConfigInput): Promise<Result<...>> {
  // UseCase内でエンティティを作成
}
```

### 3. SaveAutomationVariablesUseCase

#### Before

```typescript
export interface SaveAutomationVariablesInput {
  automationVariables: AutomationVariables; // ❌ エンティティを直接受け取る
}
```

#### After

```typescript
export interface SaveAutomationVariablesInput {
  id?: string;
  websiteId: string;
  variables: Record<string, string>;
  status: 'enabled' | 'disabled' | 'once';
}
```

## Data Models

### UpdateSystemSettingsInputDTO

```typescript
export interface UpdateSystemSettingsInputDTO {
  // General Settings
  retryWaitSecondsMin?: number;
  retryWaitSecondsMax?: number;
  retryCount?: number;

  // Recording Settings
  enableTabRecording?: boolean;
  recordingBitrate?: number;
  recordingRetentionDays?: number;

  // Log Settings
  enabledLogSources?: string[];
  securityEventsOnly?: boolean;
  maxStoredLogs?: number;
  logRetentionDays?: number;

  // Appearance Settings
  gradientStartColor?: string;
  gradientEndColor?: string;
  gradientAngle?: number;
}
```

### CreateSyncConfigInputDTO

```typescript
export interface CreateSyncConfigInputDTO {
  storageKey: string;
  enabled: boolean;
  syncMethod: SyncMethod;
  syncTiming: SyncTiming;
  syncDirection: SyncDirection;
  syncIntervalSeconds?: number;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  conflictResolution?: 'latest_timestamp' | 'local_priority' | 'remote_priority' | 'user_confirm';
  retryPolicy?: {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };
}
```

### SaveAutomationVariablesInputDTO

```typescript
export interface SaveAutomationVariablesInputDTO {
  id?: string;
  websiteId: string;
  variables: Record<string, string>;
  status: 'enabled' | 'disabled' | 'once';
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do.
Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: UseCase accepts DTO input

_For any_ UpdateSystemSettingsUseCase execution with valid DTO input, the UseCase should successfully create a SystemSettingsCollection entity internally and save it
**Validates: Requirements 2.1**

### Property 2: UseCase accepts DTO input for sync config

_For any_ CreateSyncConfigUseCase execution with valid DTO input, the UseCase should successfully create a StorageSyncConfig entity internally and save it
**Validates: Requirements 2.2**

### Property 3: UseCase accepts DTO input for automation variables

_For any_ SaveAutomationVariablesUseCase execution with valid DTO input, the UseCase should successfully create an AutomationVariables entity internally and save it
**Validates: Requirements 2.3**

### Property 4: Entity creation from DTO

_For any_ valid DTO input, the UseCase should be able to construct the corresponding entity without errors
**Validates: Requirements 2.4**

### Property 5: Error handling for invalid DTO

_For any_ invalid DTO input (e.g., missing required fields, out-of-range values), the UseCase should return a Result with an appropriate error code
**Validates: Requirements 2.5**

## Error Handling

### Error Codes

- `VALIDATION_REQUIRED_FIELD` (1001): 必須フィールドが不足
- `VALIDATION_INVALID_FORMAT` (1002): フォーマットが不正
- `VALIDATION_OUT_OF_RANGE` (1003): 値が範囲外
- `BUSINESS_NOT_FOUND` (2001): エンティティが見つからない
- `INFRASTRUCTURE_STORAGE_ERROR` (3001): ストレージエラー

### Error Handling Strategy

1. **UseCase層**: DTOのバリデーションを実行し、エラーがあればResultパターンで返す
2. **Presenter層**: Resultを受け取り、エラーがあればViewに表示
3. **View層**: ユーザーフレンドリーなエラーメッセージを表示

## Testing Strategy

### Unit Tests

1. **UseCase Tests**
   - DTOを受け取って正しくエンティティを作成できることを確認
   - 無効なDTOを渡した場合、適切なエラーが返されることを確認
   - エンティティの保存が成功することを確認

2. **Presenter Tests**
   - DTOを正しく構築してUseCaseに渡すことを確認
   - UseCaseからのResultを正しく処理することを確認
   - エラー時にViewに適切なメッセージを表示することを確認

### Property-Based Tests

Property-based testing will use **fast-check** library for TypeScript.

Each property-based test should run a minimum of **100 iterations**.

1. **Property 1: UseCase accepts DTO input**
   - **Feature: presentation-viewmodel-implementation, Property 1: UseCase accepts DTO input**
   - Generate random valid DTOs and verify that UpdateSystemSettingsUseCase can process them

2. **Property 2: UseCase accepts DTO input for sync config**
   - **Feature: presentation-viewmodel-implementation, Property 2: UseCase accepts DTO input for sync config**
   - Generate random valid DTOs and verify that CreateSyncConfigUseCase can process them

3. **Property 3: UseCase accepts DTO input for automation variables**
   - **Feature: presentation-viewmodel-implementation, Property 3: UseCase accepts DTO input for automation variables**
   - Generate random valid DTOs and verify that SaveAutomationVariablesUseCase can process them

4. **Property 4: Entity creation from DTO**
   - **Feature: presentation-viewmodel-implementation, Property 4: Entity creation from DTO**
   - Generate random valid DTOs and verify that entities can be created without errors

5. **Property 5: Error handling for invalid DTO**
   - **Feature: presentation-viewmodel-implementation, Property 5: Error handling for invalid DTO**
   - Generate random invalid DTOs and verify that appropriate errors are returned

### Architecture Tests

- Presentation層からDomainエンティティへのimportが0件であることを確認
- アーキテクチャテストを実行してルール違反がないことを確認

## Implementation Phases

### Phase 1: SystemSettings関連

1. UpdateSystemSettingsUseCaseの入力をDTOベースに変更
2. SystemSettingsPresenterを更新
3. テストを更新
4. すべてのテストが通過することを確認

### Phase 2: StorageSyncConfig関連

1. CreateSyncConfigUseCaseの入力をDTOベースに変更
2. StorageSyncManagerPresenterを更新
3. テストを更新
4. すべてのテストが通過することを確認

### Phase 3: AutomationVariables関連

1. SaveAutomationVariablesUseCaseの入力をDTOベースに変更
2. VariableManagerとAutomationVariablesManagerPresenterを更新
3. テストを更新
4. すべてのテストが通過することを確認

### Phase 4: 最終検証

1. すべてのテストを実行
2. アーキテクチャテストを実行
3. ビルドを実行
4. ドキュメントを更新

## Migration Strategy

### Backward Compatibility

既存のコードとの互換性を保つため、以下の戦略を採用します：

1. **段階的な移行**: 一度にすべてを変更せず、機能ごとに段階的に移行
2. **テストの維持**: 各段階でテストを実行し、品質を保証
3. **ロールバック可能**: 問題が発生した場合、前の状態に戻せるようにする

### Rollback Plan

各フェーズで問題が発生した場合：

1. 変更をコミット前の状態に戻す
2. 問題を分析し、修正方針を決定
3. 修正後、再度実装を試みる

## Performance Considerations

- DTOからエンティティへの変換は軽量な操作であり、パフォーマンスへの影響は最小限
- エンティティの作成はUseCase内で一度だけ行われるため、オーバーヘッドは無視できる

## Security Considerations

- DTOのバリデーションを徹底し、不正なデータがエンティティに渡されないようにする
- エラーメッセージに機密情報を含めない

## Documentation Updates

- アーキテクチャドキュメントを更新
- 開発者ガイドを更新
- コーディング規約を更新
