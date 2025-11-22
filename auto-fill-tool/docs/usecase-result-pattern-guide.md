# UseCase層でのResultパターン徹底ガイド

## 概要

このガイドでは、UseCase層でResultパターンを徹底し、エラーハンドリングを統一する方法を説明します。

---

## 現状分析

### 良い点

- ほとんどのUseCaseが既にResultパターンを使用
- Repositoryからの戻り値をResultで処理

### 改善点

1. **DTOベースの入力**: 一部のUseCaseがエンティティを直接受け取っている
2. **エラーコードの使用**: エラーコードを使用していない
3. **エラーメッセージの統一**: エラーメッセージが統一されていない

---

## 推奨パターン

### パターン1: DTOベースの入力

#### Before

```typescript
export interface UpdateSystemSettingsInput {
  settings: SystemSettingsCollection; // ❌ エンティティを直接受け取る
}

export class UpdateSystemSettingsUseCase {
  async execute(input: UpdateSystemSettingsInput): Promise<Result<void, Error>> {
    const result = await this.repository.save(input.settings);
    if (result.isFailure) {
      return Result.failure(new Error(`Failed to update: ${result.error?.message}`));
    }
    return Result.success(undefined);
  }
}
```

#### After

```typescript
export interface UpdateSystemSettingsInput {
  retryWaitSecondsMin: number;
  retryWaitSecondsMax: number;
  retryCount: number;
  logLevel: LogLevel;
  // ... その他の設定
}

export class UpdateSystemSettingsUseCase {
  async execute(input: UpdateSystemSettingsInput): Promise<Result<void, Error>> {
    // UseCase内でエンティティを作成
    const settings = new SystemSettingsCollection(input);

    const result = await this.repository.save(settings);
    if (result.isFailure) {
      return Result.failureWithCode(
        'Failed to update system settings',
        NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR,
        { error: result.error?.message }
      );
    }
    return Result.success(undefined);
  }
}
```

### パターン2: エラーコードの使用

#### Before

```typescript
if (result.isFailure) {
  return Result.failure(new Error(`Failed to save: ${result.error?.message}`));
}
```

#### After

```typescript
if (result.isFailure) {
  return Result.failureWithCode(
    'Failed to save website',
    NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR,
    { websiteId: input.id, error: result.error?.message }
  );
}
```

### パターン3: ビジネスロジックのバリデーション

#### Before

```typescript
export class SaveWebsiteUseCase {
  async execute(input: SaveWebsiteInput): Promise<Result<WebsiteOutputDto, Error>> {
    const website = Website.create(input); // throwする可能性がある
    const result = await this.repository.save(website);
    return result;
  }
}
```

#### After

```typescript
export class SaveWebsiteUseCase {
  async execute(input: SaveWebsiteInput): Promise<Result<WebsiteOutputDto, Error>> {
    // バリデーション
    if (!input.name || input.name.trim().length === 0) {
      return Result.failureWithCode(
        'Website name is required',
        NUMERIC_ERROR_CODES.VALIDATION_REQUIRED_FIELD,
        { field: 'name' }
      );
    }

    // エンティティ作成
    try {
      const website = Website.create(input);
      const result = await this.repository.save(website);

      if (result.isFailure) {
        return Result.failureWithCode(
          'Failed to save website',
          NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR,
          { error: result.error?.message }
        );
      }

      return Result.success(WebsiteMapper.toOutputDto(website));
    } catch (error) {
      return Result.failureWithCode(
        'Failed to create website entity',
        NUMERIC_ERROR_CODES.BUSINESS_INVALID_STATE,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}
```

### パターン4: 複数の操作の連鎖

#### Before

```typescript
export class SaveWebsiteWithAutomationVariablesUseCase {
  async execute(input: Input): Promise<Result<Output, Error>> {
    const website = Website.create(input.website);
    await this.websiteRepository.save(website);

    const automationVars = AutomationVariables.create(input.variables);
    await this.automationVarsRepository.save(automationVars);

    return Result.success(output);
  }
}
```

#### After

```typescript
export class SaveWebsiteWithAutomationVariablesUseCase {
  async execute(input: Input): Promise<Result<Output, Error>> {
    // Website作成
    const website = Website.create(input.website);
    const websiteResult = await this.websiteRepository.save(website);

    if (websiteResult.isFailure) {
      return Result.failureWithCode(
        'Failed to save website',
        NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR,
        { error: websiteResult.error?.message }
      );
    }

    // AutomationVariables作成
    const automationVars = AutomationVariables.create({
      websiteId: website.getId().getValue(),
      ...input.variables,
    });
    const varsResult = await this.automationVarsRepository.save(automationVars);

    if (varsResult.isFailure) {
      // ロールバックが必要な場合は、ここで処理
      return Result.failureWithCode(
        'Failed to save automation variables',
        NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR,
        { error: varsResult.error?.message }
      );
    }

    return Result.success(output);
  }
}
```

---

## エラーコードの使用

### カテゴリ別のエラーコード

```typescript
// Validation Errors (1000-1999)
VALIDATION_REQUIRED_FIELD: 1001,
VALIDATION_INVALID_FORMAT: 1002,
VALIDATION_OUT_OF_RANGE: 1003,

// Business Errors (2000-2999)
BUSINESS_NOT_FOUND: 2001,
BUSINESS_ALREADY_EXISTS: 2002,
BUSINESS_INVALID_STATE: 2003,

// Infrastructure Errors (3000-3999)
INFRASTRUCTURE_STORAGE_ERROR: 3001,
INFRASTRUCTURE_NETWORK_ERROR: 3002,
INFRASTRUCTURE_TIMEOUT: 3003,

// External Errors (4000-4999)
EXTERNAL_API_ERROR: 4001,
EXTERNAL_AUTH_ERROR: 4002,

// System Errors (5000-5999)
SYSTEM_UNEXPECTED_ERROR: 5001,
```

### 使用例

```typescript
// バリデーションエラー
if (!input.name) {
  return Result.failureWithCode('Name is required', NUMERIC_ERROR_CODES.VALIDATION_REQUIRED_FIELD, {
    field: 'name',
  });
}

// ビジネスエラー
if (!website) {
  return Result.failureWithCode('Website not found', NUMERIC_ERROR_CODES.BUSINESS_NOT_FOUND, {
    websiteId: input.id,
  });
}

// インフラエラー
if (saveResult.isFailure) {
  return Result.failureWithCode(
    'Failed to save to storage',
    NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR,
    { error: saveResult.error?.message }
  );
}
```

---

## ロギング

### エラーログの記録

```typescript
export class SaveWebsiteUseCase {
  constructor(
    private repository: WebsiteRepository,
    private logger: LoggerPort
  ) {}

  async execute(input: SaveWebsiteInput): Promise<Result<WebsiteOutputDto, Error>> {
    this.logger.info('Saving website', { name: input.name });

    const result = await this.repository.save(website);

    if (result.isFailure) {
      this.logger.error('Failed to save website', {
        name: input.name,
        error: result.error?.message,
      });

      return Result.failureWithCode(
        'Failed to save website',
        NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR,
        { error: result.error?.message }
      );
    }

    this.logger.info('Website saved successfully', { id: website.getId().getValue() });
    return Result.success(WebsiteMapper.toOutputDto(website));
  }
}
```

---

## テスト

### UseCaseのテスト

```typescript
describe('SaveWebsiteUseCase', () => {
  let useCase: SaveWebsiteUseCase;
  let mockRepository: jest.Mocked<WebsiteRepository>;
  let mockLogger: jest.Mocked<LoggerPort>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as any;

    useCase = new SaveWebsiteUseCase(mockRepository, mockLogger);
  });

  it('should save website successfully', async () => {
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const result = await useCase.execute({
      name: 'Test Website',
      startUrl: 'https://example.com',
    });

    expect(result.isSuccess).toBe(true);
    expect(mockRepository.save).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Website saved successfully', expect.any(Object));
  });

  it('should return failure when repository fails', async () => {
    mockRepository.save.mockResolvedValue(Result.failure(new Error('Storage error')));

    const result = await useCase.execute({
      name: 'Test Website',
      startUrl: 'https://example.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeDefined();
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should return failure for invalid input', async () => {
    const result = await useCase.execute({
      name: '',
      startUrl: 'https://example.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getErrorCode()).toBe(NUMERIC_ERROR_CODES.VALIDATION_REQUIRED_FIELD);
  });
});
```

---

## チェックリスト

### UseCase実装時の確認事項

- [ ] 入力はDTOを使用しているか
- [ ] Resultパターンを使用しているか
- [ ] エラーコードを適切に使用しているか
- [ ] エラーメッセージが明確か
- [ ] ログを記録しているか
- [ ] テストを追加しているか
- [ ] エラーハンドリングが適切か

---

## 移行計画

### Phase 1: 新規UseCase（即座に適用）

- すべての新規UseCaseでDTOベースの入力を使用
- エラーコードを適切に使用
- ログを記録

### Phase 2: 既存UseCaseの段階的移行（1-2ヶ月）

#### 優先度: 高

1. SystemSettingsUseCase
2. WebsiteUseCase
3. AutomationVariablesUseCase

#### 優先度: 中

4. XPathUseCase
5. SyncUseCase

#### 優先度: 低

6. その他のUseCase

### Phase 3: レビューと改善（継続的）

- コードレビューでパターンを確認
- ベストプラクティスを共有
- ドキュメントを更新

---

## まとめ

UseCase層でResultパターンを徹底することで：

1. **型安全性**: エラーハンドリングが型安全になる
2. **一貫性**: すべてのUseCaseで統一されたパターン
3. **保守性**: エラーコードにより、エラーの分類と処理が容易
4. **デバッグ**: ログとエラー詳細により、問題の特定が容易

---

最終更新日: 2024年11月22日
