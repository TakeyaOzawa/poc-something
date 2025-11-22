# エラーハンドリング戦略

## 概要

本プロジェクトにおけるエラーハンドリングの統一戦略を定義します。

## 基本方針

### 1. Resultパターンの使用

- **原則**: すべてのビジネスロジックでResultパターンを使用
- **理由**:
  - 型安全なエラーハンドリング
  - エラーの明示的な処理
  - 例外によるパフォーマンス低下の回避

### 2. 例外の使用

例外は以下の場合にのみ使用します：

- **プログラミングエラー**: null参照、配列の範囲外アクセスなど
- **システムエラー**: メモリ不足、ファイルシステムエラーなど
- **予期しないエラー**: 回復不可能なエラー

## レイヤー別のエラーハンドリング

### Domain層

```typescript
// ✅ 推奨: Resultパターン
class Website {
  static create(data: WebsiteData): Result<Website, Error> {
    if (!data.name) {
      return Result.failure(new Error('Website name is required'));
    }
    return Result.success(new Website(data));
  }
}

// ❌ 非推奨: 例外
class Website {
  constructor(data: WebsiteData) {
    if (!data.name) {
      throw new Error('Website name is required');
    }
  }
}
```

### Application層（UseCase）

```typescript
// ✅ 推奨: Resultパターン
class SaveWebsiteUseCase {
  async execute(input: SaveWebsiteInput): Promise<Result<WebsiteOutputDto, Error>> {
    const website = Website.create(input);
    if (website.isFailure) {
      return Result.failure(website.error!);
    }

    const saveResult = await this.repository.save(website.value!);
    if (saveResult.isFailure) {
      return Result.failure(saveResult.error!);
    }

    return Result.success(this.mapper.toDto(website.value!));
  }
}
```

### Infrastructure層

```typescript
// ✅ 推奨: Resultパターン + 例外のキャッチ
class ChromeStorageRepository {
  async save(data: Data): Promise<Result<void, Error>> {
    try {
      await browser.storage.local.set({ key: data });
      return Result.success(undefined);
    } catch (error) {
      // 例外をResultに変換
      return Result.failure(
        new Error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
      );
    }
  }
}
```

### Presentation層

```typescript
// ✅ 推奨: Resultを受け取り、UIに表示
class Presenter {
  async saveWebsite(input: SaveWebsiteInput): Promise<void> {
    this.view.showLoading();

    const result = await this.useCase.execute(input);

    if (result.isFailure) {
      this.view.showError(result.error!.message);
      return;
    }

    this.view.showSuccess('保存しました');
    this.view.showWebsite(result.value!);
  }
}
```

## エラーコードの体系

### カテゴリ

1. **VALIDATION (1000-1999)**: バリデーションエラー
2. **BUSINESS (2000-2999)**: ビジネスルール違反
3. **INFRASTRUCTURE (3000-3999)**: インフラストラクチャエラー
4. **EXTERNAL (4000-4999)**: 外部システムエラー
5. **SYSTEM (5000-5999)**: システムエラー

### エラーコードの定義

```typescript
export const ERROR_CODES = {
  // Validation Errors (1000-1999)
  VALIDATION_REQUIRED_FIELD: 1001,
  VALIDATION_INVALID_FORMAT: 1002,
  VALIDATION_OUT_OF_RANGE: 1003,

  // Business Errors (2000-2999)
  BUSINESS_DUPLICATE_ENTRY: 2001,
  BUSINESS_NOT_FOUND: 2002,
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
  SYSTEM_NOT_IMPLEMENTED: 5002,
} as const;
```

## Result型の拡張

### エラーコードのサポート

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class Result<T, E extends Error = Error> {
  // ... existing implementation

  static failureWithCode<T>(
    message: string,
    code: number,
    details?: Record<string, unknown>
  ): Result<T, DomainError> {
    return Result.failure(new DomainError(message, code, details));
  }
}
```

### 使用例

```typescript
class Website {
  static create(data: WebsiteData): Result<Website, DomainError> {
    if (!data.name) {
      return Result.failureWithCode(
        'Website name is required',
        ERROR_CODES.VALIDATION_REQUIRED_FIELD,
        { field: 'name' }
      );
    }
    return Result.success(new Website(data));
  }
}
```

## エラーメッセージのi18n対応

### エラーメッセージの定義

```typescript
// messages/ja.json
{
  "errors": {
    "1001": "必須項目です: {field}",
    "1002": "形式が正しくありません: {field}",
    "2001": "既に存在します: {name}",
    "3001": "保存に失敗しました"
  }
}
```

### 使用例

```typescript
class Presenter {
  private showError(error: DomainError): void {
    const message = I18nAdapter.getMessage(`errors.${error.code}`, error.details);
    this.view.showError(message);
  }
}
```

## ベストプラクティス

### 1. エラーの伝播

```typescript
// ✅ 推奨: エラーを伝播
async function processData(): Promise<Result<Data, Error>> {
  const loadResult = await loadData();
  if (loadResult.isFailure) {
    return loadResult; // エラーをそのまま返す
  }

  const validateResult = validate(loadResult.value!);
  if (validateResult.isFailure) {
    return validateResult;
  }

  return Result.success(validateResult.value!);
}
```

### 2. エラーのラップ

```typescript
// ✅ 推奨: コンテキストを追加してエラーをラップ
async function saveWebsite(website: Website): Promise<Result<void, Error>> {
  const result = await repository.save(website);
  if (result.isFailure) {
    return Result.failure(
      new Error(`Failed to save website ${website.getName()}: ${result.error!.message}`)
    );
  }
  return result;
}
```

### 3. エラーのログ記録

```typescript
// ✅ 推奨: エラーをログに記録
async function execute(input: Input): Promise<Result<Output, Error>> {
  const result = await process(input);
  if (result.isFailure) {
    this.logger.error('Process failed', {
      error: result.error!,
      input,
    });
    return result;
  }
  return result;
}
```

## 移行ガイドライン

### Phase 1: 新規コード

- すべての新規コードでResultパターンを使用

### Phase 2: 既存コードの段階的移行

1. Repository層から開始（既に完了）
2. UseCase層を移行
3. Domain Service層を移行
4. Presentation層を移行

### Phase 3: 例外の削減

- 例外をResultに変換
- 例外は本当に必要な場合のみ使用

## チェックリスト

### コードレビュー時の確認事項

- [ ] Resultパターンを使用しているか
- [ ] エラーコードが定義されているか
- [ ] エラーメッセージがi18n対応しているか
- [ ] エラーがログに記録されているか
- [ ] エラーが適切に伝播されているか
- [ ] 例外が適切にキャッチされているか

---

最終更新日: 2024年11月22日
