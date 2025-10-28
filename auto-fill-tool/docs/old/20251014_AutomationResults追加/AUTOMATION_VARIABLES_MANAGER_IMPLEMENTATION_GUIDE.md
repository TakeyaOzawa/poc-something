# AutomationVariables Manager - Implementation Guide

## 開発環境のセットアップ

### 前提条件
- Node.js 16+ インストール済み
- npm インストール済み
- TypeScript の基礎知識
- Clean Architecture の理解

### 開発サーバーの起動

```bash
# 依存関係のインストール
npm install

# 開発モード（ファイル監視）
npm run watch

# ビルド（本番用）
npm run build

# テスト実行
npm test

# テスト（カバレッジ付き）
npm run test:coverage

# ESLint チェック
npm run lint

# 型チェック
npm run type-check
```

## Phase 1: データ層の準備 ✅ **完了**

**完了日: 2025-10-15**
**テスト: 112 tests passing**
**詳細: `docs/PHASE_1_COMPLETION_SUMMARY.md` 参照**

### Step 1.1: AutomationVariables エンティティの拡張 ✅ 完了

#### ファイル: `src/domain/entities/AutomationVariables.ts`

```typescript
// 追加するインポート
import { v4 as uuidv4 } from 'uuid';

// インターフェースの更新
export interface AutomationVariablesData {
  id: string; // 追加
  websiteId: string;
  variables: { [key: string]: string }; // 動的な構造
  status?: AutomationStatus;
  updatedAt: string;
}

// バリデーションの更新
private validate(data: AutomationVariablesData): void {
  if (!data.id) throw new Error('ID is required');
  if (!data.websiteId) throw new Error('Website ID is required');
  if (data.status && !isAutomationStatus(data.status)) {
    throw new Error('Invalid status');
  }
}

// Getter の追加
getId(): string {
  return this.data.id;
}

// Factory の更新
static create(params: {
  websiteId: string;
  variables?: { [key: string]: string };
  status?: AutomationStatus;
}): AutomationVariables {
  return new AutomationVariables({
    id: uuidv4(), // 自動生成
    websiteId: params.websiteId,
    variables: params.variables || {},
    status: params.status,
    updatedAt: new Date().toISOString(),
  });
}

// 既存データから作成（マイグレーション用）
static fromExisting(data: AutomationVariablesData): AutomationVariables {
  return new AutomationVariables({
    ...data,
    id: data.id || uuidv4(), // ID がなければ生成
  });
}
```

#### テスト: `src/domain/entities/__tests__/AutomationVariables.test.ts`

```typescript
describe('AutomationVariables', () => {
  describe('create()', () => {
    it('should auto-generate UUID for id', () => {
      const vars = AutomationVariables.create({
        websiteId: 'test-website',
      });

      expect(vars.getId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should support dynamic variables structure', () => {
      const vars1 = AutomationVariables.create({
        websiteId: 'test-website-1',
        variables: {
          username: 'user@example.com',
          password: 'secret123',
        },
      });

      const vars2 = AutomationVariables.create({
        websiteId: 'test-website-2',
        variables: {
          api_key: 'key12345',
          token: 'token67890',
          endpoint: 'https://api.example.com',
        },
      });

      expect(Object.keys(vars1.getVariables())).toEqual(['username', 'password']);
      expect(Object.keys(vars2.getVariables())).toEqual(['api_key', 'token', 'endpoint']);
    });
  });

  describe('fromExisting()', () => {
    it('should generate id if missing', () => {
      const data: any = {
        websiteId: 'test',
        variables: {},
        updatedAt: new Date().toISOString(),
      };

      const vars = AutomationVariables.fromExisting(data);

      expect(vars.getId()).toBeDefined();
    });

    it('should preserve existing id', () => {
      const data: AutomationVariablesData = {
        id: 'existing-id',
        websiteId: 'test',
        variables: {},
        updatedAt: new Date().toISOString(),
      };

      const vars = AutomationVariables.fromExisting(data);

      expect(vars.getId()).toBe('existing-id');
    });
  });
});
```

### Step 1.2: Repository の更新

#### ファイル: `src/infrastructure/repositories/ChromeStorageAutomationVariablesRepository.ts`

```typescript
// Storage 形式の型定義を更新
type AutomationVariablesStorageV1 = {
  [websiteId: string]: AutomationVariablesData;
};

type AutomationVariablesStorageV2 = AutomationVariablesData[];

type AutomationVariablesStorage = AutomationVariablesStorageV1 | AutomationVariablesStorageV2;

// ストレージバージョンを判定
private isArrayFormat(storage: AutomationVariablesStorage): storage is AutomationVariablesStorageV2 {
  return Array.isArray(storage);
}

// Storage 読み込み処理を更新
private async loadStorage(): Promise<AutomationVariablesStorageV2> {
  const result = await browser.storage.local.get(STORAGE_KEYS.AUTOMATION_VARIABLES);
  const storage = result[STORAGE_KEYS.AUTOMATION_VARIABLES] as AutomationVariablesStorage;

  if (!storage) {
    return [];
  }

  // 配列形式ならそのまま返す
  if (this.isArrayFormat(storage)) {
    this.logger.info('AutomationVariables storage is in array format');
    return storage;
  }

  // オブジェクト形式なら配列に変換（後方互換性）
  this.logger.warn('AutomationVariables storage is in legacy object format, converting to array');
  const arrayFormat = Object.values(storage);

  // 変換後のデータを保存（次回からは配列形式）
  await this.saveStorage(arrayFormat);

  return arrayFormat;
}

// Storage 保存処理を追加
private async saveStorage(data: AutomationVariablesStorageV2): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.AUTOMATION_VARIABLES]: data });
}

// save() を配列形式に更新
async save(variables: AutomationVariables): Promise<void> {
  try {
    const id = variables.getId();
    const data = variables.toData();

    // Load existing storage
    const storage = await this.loadStorage();

    // Find and update, or append
    const existingIndex = storage.findIndex((v) => v.id === id);
    if (existingIndex >= 0) {
      storage[existingIndex] = data;
      this.logger.info(`Automation variables updated: ${id}`);
    } else {
      storage.push(data);
      this.logger.info(`Automation variables created: ${id}`);
    }

    // Save to storage
    await this.saveStorage(storage);
  } catch (error) {
    this.logger.error('Failed to save automation variables', error);
    throw new Error('Failed to save automation variables');
  }
}

// load() を ID ベースに更新
async load(idOrWebsiteId: string): Promise<AutomationVariables | null> {
  try {
    this.logger.info(`Loading automation variables: ${idOrWebsiteId}`);
    const storage = await this.loadStorage();

    // Try to find by id first, then by websiteId
    const data = storage.find(
      (v) => v.id === idOrWebsiteId || v.websiteId === idOrWebsiteId
    );

    if (!data) {
      this.logger.info(`No automation variables found: ${idOrWebsiteId}`);
      return null;
    }

    return AutomationVariables.fromExisting(data);
  } catch (error) {
    this.logger.error('Failed to load automation variables', error);
    return null;
  }
}

// loadAll() を配列形式に対応
async loadAll(): Promise<AutomationVariables[]> {
  try {
    this.logger.info('Loading all automation variables');
    const storage = await this.loadStorage();

    return storage.map((data) => AutomationVariables.fromExisting(data));
  } catch (error) {
    this.logger.error('Failed to load all automation variables', error);
    return [];
  }
}

// delete() を ID ベースに更新
async delete(idOrWebsiteId: string): Promise<void> {
  try {
    const storage = await this.loadStorage();

    const filtered = storage.filter(
      (v) => v.id !== idOrWebsiteId && v.websiteId !== idOrWebsiteId
    );

    if (filtered.length === storage.length) {
      this.logger.warn(`No automation variables found to delete: ${idOrWebsiteId}`);
    } else {
      await this.saveStorage(filtered);
      this.logger.info(`Automation variables deleted: ${idOrWebsiteId}`);
    }
  } catch (error) {
    this.logger.error('Failed to delete automation variables', error);
    throw new Error('Failed to delete automation variables');
  }
}

// exists() を ID ベースに更新
async exists(idOrWebsiteId: string): Promise<boolean> {
  try {
    const storage = await this.loadStorage();
    return storage.some((v) => v.id === idOrWebsiteId || v.websiteId === idOrWebsiteId);
  } catch (error) {
    this.logger.error('Failed to check automation variables existence', error);
    return false;
  }
}
```

#### テスト: `src/infrastructure/repositories/__tests__/ChromeStorageAutomationVariablesRepository.test.ts`

テストケースを追加：

```typescript
describe('ChromeStorageAutomationVariablesRepository', () => {
  // 既存のテストは維持

  describe('Array format support', () => {
    it('should save and load in array format', async () => {
      const vars = AutomationVariables.create({
        websiteId: 'test-website',
        websiteName: 'Test Site',
        variables: { key: 'value' },
      });

      await repository.save(vars);

      const loaded = await repository.load(vars.getId());

      expect(loaded).not.toBeNull();
      expect(loaded?.getId()).toBe(vars.getId());
      expect(loaded?.getWebsiteName()).toBe('Test Site');
    });

    it('should convert legacy object format to array', async () => {
      // Setup legacy format
      const legacyData = {
        'website-1': {
          websiteId: 'website-1',
          variables: { key1: 'value1' },
          updatedAt: new Date().toISOString(),
        },
      };

      await browser.storage.local.set({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: legacyData,
      });

      // Load should convert to array format
      const all = await repository.loadAll();

      expect(all.length).toBe(1);
      expect(all[0].getWebsiteId()).toBe('website-1');
      expect(all[0].getId()).toBeDefined(); // ID should be generated

      // Check that storage is now in array format
      const result = await browser.storage.local.get(STORAGE_KEYS.AUTOMATION_VARIABLES);
      expect(Array.isArray(result[STORAGE_KEYS.AUTOMATION_VARIABLES])).toBe(true);
    });
  });

  describe('loadAll()', () => {
    it('should return all automation variables', async () => {
      const vars1 = AutomationVariables.create({
        websiteId: 'website-1',
        variables: { key: 'value1' },
      });
      const vars2 = AutomationVariables.create({
        websiteId: 'website-2',
        variables: { key: 'value2' },
      });

      await repository.save(vars1);
      await repository.save(vars2);

      const all = await repository.loadAll();

      expect(all.length).toBe(2);
    });
  });

  describe('delete()', () => {
    it('should delete by id', async () => {
      const vars = AutomationVariables.create({
        websiteId: 'test',
        variables: {},
      });

      await repository.save(vars);
      await repository.delete(vars.getId());

      const loaded = await repository.load(vars.getId());
      expect(loaded).toBeNull();
    });

    it('should delete by websiteId', async () => {
      const vars = AutomationVariables.create({
        websiteId: 'test',
        variables: {},
      });

      await repository.save(vars);
      await repository.delete(vars.getWebsiteId());

      const loaded = await repository.load(vars.getWebsiteId());
      expect(loaded).toBeNull();
    });
  });
});
```

### Step 1.3: マイグレーション UseCase の実装

#### ファイル: `src/usecases/MigrateAutomationVariablesStorageUseCase.ts`

```typescript
import { IAutomationVariablesRepository } from '@domain/repositories/IAutomationVariablesRepository';
import { IWebsiteRepository } from '@domain/repositories/IWebsiteRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import browser from 'webextension-polyfill';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';

export interface MigrationResult {
  migrated: boolean;
  count: number;
  errors: string[];
}

export class MigrateAutomationVariablesStorageUseCase {
  constructor(
    private automationVariablesRepository: IAutomationVariablesRepository
  ) {}

  async execute(): Promise<MigrationResult> {
    try {
      // Check if migration is needed
      const result = await browser.storage.local.get(STORAGE_KEYS.AUTOMATION_VARIABLES);
      const storage = result[STORAGE_KEYS.AUTOMATION_VARIABLES];

      // No data to migrate
      if (!storage) {
        return { migrated: false, count: 0, errors: [] };
      }

      // Already in array format
      if (Array.isArray(storage)) {
        return { migrated: false, count: storage.length, errors: [] };
      }

      // Migrate from object format to array format
      const errors: string[] = [];
      const entries = Object.entries(storage);
      const migratedData: any[] = [];

      for (const [websiteId, data] of entries) {
        try {
          const vars = AutomationVariables.create({
            websiteId,
            variables: (data as any).variables || {},
            status: (data as any).status,
          });

          migratedData.push(vars.toData());
        } catch (error) {
          errors.push(`Failed to migrate websiteId ${websiteId}: ${error}`);
        }
      }

      // Save migrated data
      await browser.storage.local.set({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: migratedData,
      });

      return {
        migrated: true,
        count: migratedData.length,
        errors,
      };
    } catch (error) {
      return {
        migrated: false,
        count: 0,
        errors: [`Migration failed: ${error}`],
      };
    }
  }
}
```

#### テスト: `src/usecases/__tests__/MigrateAutomationVariablesStorageUseCase.test.ts`

```typescript
import { MigrateAutomationVariablesStorageUseCase } from '../MigrateAutomationVariablesStorageUseCase';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { ChromeStorageWebsiteRepository } from '@infrastructure/repositories/ChromeStorageWebsiteRepository';
import { Website } from '@domain/entities/Website';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import browser from 'webextension-polyfill';
import { NoOpLogger } from '@infrastructure/services/NoOpLogger';

describe('MigrateAutomationVariablesStorageUseCase', () => {
  let useCase: MigrateAutomationVariablesStorageUseCase;
  let automationVariablesRepository: ChromeStorageAutomationVariablesRepository;

  beforeEach(() => {
    automationVariablesRepository = new ChromeStorageAutomationVariablesRepository(
      new NoOpLogger()
    );
    useCase = new MigrateAutomationVariablesStorageUseCase(
      automationVariablesRepository
    );

    // Clear storage
    (browser.storage.local.get as jest.Mock).mockResolvedValue({});
    (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);
    (browser.storage.local.remove as jest.Mock).mockResolvedValue(undefined);
  });

  it('should migrate object format to array format', async () => {
    // Setup legacy data
    const legacyData = {
      'website-1': {
        websiteId: 'website-1',
        variables: { username: 'test@example.com' },
        status: 'active',
        updatedAt: '2025-10-15T10:00:00.000Z',
      },
      'website-2': {
        websiteId: 'website-2',
        variables: { password: 'secret' },
        updatedAt: '2025-10-15T11:00:00.000Z',
      },
    };

    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      [STORAGE_KEYS.AUTOMATION_VARIABLES]: legacyData,
    });

    const result = await useCase.execute();

    expect(result.migrated).toBe(true);
    expect(result.count).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Verify array format was saved
    const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
    const migratedArray = savedData[STORAGE_KEYS.AUTOMATION_VARIABLES];

    expect(Array.isArray(migratedArray)).toBe(true);
    expect(migratedArray).toHaveLength(2);
    expect(migratedArray[0]).toHaveProperty('id');
    expect(migratedArray[0]).toHaveProperty('websiteId');
    expect(migratedArray[0]).toHaveProperty('variables');
  });

  it('should return false if already in array format', async () => {
    const arrayData = [
      {
        id: 'id-1',
        websiteId: 'website-1',
        variables: {},
        updatedAt: '2025-10-15T10:00:00.000Z',
      },
    ];

    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      [STORAGE_KEYS.AUTOMATION_VARIABLES]: arrayData,
    });

    const result = await useCase.execute();

    expect(result.migrated).toBe(false);
    expect(result.count).toBe(1);
  });

  it('should return false if no data exists', async () => {
    (browser.storage.local.get as jest.Mock).mockResolvedValue({});

    const result = await useCase.execute();

    expect(result.migrated).toBe(false);
    expect(result.count).toBe(0);
  });
});
```

## Phase 2: Use Cases の実装 ✅ **完了**

**完了日: 2025-10-15**
**テスト: 15 tests passing**
**詳細: `docs/PHASE_2_COMPLETION_SUMMARY.md` 参照**

### 実装された Use Cases

```
src/usecases/
  ├── GetAllAutomationVariablesUseCase.ts               ✅ (既存)
  ├── GetAutomationVariablesByIdUseCase.ts              ✅ 完了
  ├── GetAutomationVariablesByWebsiteIdUseCase.ts       ✅ (既存)
  ├── SaveAutomationVariablesUseCase.ts                 ✅ (既存)
  ├── DeleteAutomationVariablesUseCase.ts               ✅ 完了 (カスケード削除)
  ├── DuplicateAutomationVariablesUseCase.ts            ✅ 完了
  ├── ExportAutomationVariablesUseCase.ts               ✅ (既存)
  ├── ImportAutomationVariablesUseCase.ts               ✅ (既存)
  ├── SaveAutomationResultUseCase.ts                    ✅ 完了
  ├── GetLatestAutomationResultUseCase.ts               ✅ 完了
  ├── GetAutomationResultHistoryUseCase.ts              ✅ 完了
  └── __tests__/
      ├── GetAutomationVariablesByIdUseCase.test.ts     ✅ 2 tests
      ├── DeleteAutomationVariablesUseCase.test.ts      ✅ 2 tests
      ├── DuplicateAutomationVariablesUseCase.test.ts   ✅ 4 tests
      ├── SaveAutomationResultUseCase.test.ts           ✅ 2 tests
      ├── GetLatestAutomationResultUseCase.test.ts      ✅ 2 tests
      └── GetAutomationResultHistoryUseCase.test.ts     ✅ 3 tests
```

**新規作成: 6 UseCases (15 tests)**
**既存確認: 5 UseCases**

詳細な実装は `docs/PHASE_2_COMPLETION_SUMMARY.md` を参照してください。

## Phase 3: Presenter の実装 ✅ **完了**

**完了日: 2025-10-15**
**テスト: 20 tests passing**
**詳細: `docs/PHASE_3_COMPLETION_SUMMARY.md` 参照**

**全体テスト結果（Phase 1-3 完了時点）:**
```
Test Suites: 100 passed, 100 total
Tests:       1367 passed, 1367 total
Time:        16.748 s
```

### ファイル構成

```
src/presentation/automation-variables-manager/
├── AutomationVariablesManagerPresenter.ts  ✅ 完了
└── __tests__/
    └── AutomationVariablesManagerPresenter.test.ts  ✅ 完了 (20 tests)
```

### View インターフェース

```typescript
// src/presentation/automation-variables-manager/AutomationVariablesManagerPresenter.ts

export interface IAutomationVariablesManagerView {
  showVariables(variables: AutomationVariablesViewModel[]): void;
  showError(message: string): void;
  showSuccess(message: string): void;
  showLoading(): void;
  hideLoading(): void;
  showEmpty(): void;
}
```

### ViewModel 定義

```typescript
export interface AutomationVariablesViewModel extends AutomationVariablesData {
  latestResult?: AutomationResultData | null;
}
```

### Presenter 実装

```typescript
export class AutomationVariablesManagerPresenter {
  private logger: ILogger;

  // eslint-disable-next-line max-params
  constructor(
    private view: IAutomationVariablesManagerView,
    private getAllAutomationVariablesUseCase: GetAllAutomationVariablesUseCase,
    private getAutomationVariablesByIdUseCase: GetAutomationVariablesByIdUseCase,
    private getAutomationVariablesByWebsiteIdUseCase: GetAutomationVariablesByWebsiteIdUseCase,
    private saveAutomationVariablesUseCase: SaveAutomationVariablesUseCase,
    private deleteAutomationVariablesUseCase: DeleteAutomationVariablesUseCase,
    private duplicateAutomationVariablesUseCase: DuplicateAutomationVariablesUseCase,
    private exportAutomationVariablesUseCase: ExportAutomationVariablesUseCase,
    private importAutomationVariablesUseCase: ImportAutomationVariablesUseCase,
    private getLatestAutomationResultUseCase: GetLatestAutomationResultUseCase,
    private getAutomationResultHistoryUseCase: GetAutomationResultHistoryUseCase,
    logger?: ILogger
  ) {
    this.logger = logger || LoggerFactory.createLogger('AutomationVariablesManagerPresenter');
  }

  /**
   * Load automation variables with their latest execution results
   */
  async loadVariables(websiteId?: string): Promise<void> {
    try {
      this.view.showLoading();

      // Load automation variables
      const variables = websiteId
        ? [await this.getAutomationVariablesByWebsiteIdUseCase.execute(websiteId)].filter(
            (v) => v !== null
          ) as AutomationVariables[]
        : await this.getAllAutomationVariablesUseCase.execute();

      if (variables.length === 0) {
        this.view.showEmpty();
        return;
      }

      // Load latest result for each automation variables
      const viewModels = await Promise.all(
        variables.map(async (v) => {
          const latestResult = await this.getLatestAutomationResultUseCase.execute(v.getId());
          return {
            ...v.toData(),
            latestResult: latestResult?.toData() || null,
          };
        })
      );

      this.view.showVariables(viewModels);
    } catch (error) {
      this.logger.error('Failed to load automation variables', error);
      this.view.showError(I18nService.getMessage('automationVariablesLoadFailed'));
    } finally {
      this.view.hideLoading();
    }
  }

  /**
   * Save automation variables
   */
  async saveVariables(variables: AutomationVariables): Promise<void> {
    try {
      await this.saveAutomationVariablesUseCase.execute(variables);
      this.view.showSuccess(I18nService.getMessage('automationVariablesSaved'));
    } catch (error) {
      this.logger.error('Failed to save automation variables', error);
      this.view.showError(I18nService.getMessage('saveFailed'));
      throw error;
    }
  }

  /**
   * Delete automation variables and associated results
   */
  async deleteVariables(id: string): Promise<void> {
    try {
      await this.deleteAutomationVariablesUseCase.execute(id);
      this.view.showSuccess(I18nService.getMessage('automationVariablesDeleted'));
    } catch (error) {
      this.logger.error('Failed to delete automation variables', error);
      this.view.showError(I18nService.getMessage('deleteFailed'));
      throw error;
    }
  }

  /**
   * Duplicate automation variables
   */
  async duplicateVariables(id: string): Promise<void> {
    try {
      const duplicate = await this.duplicateAutomationVariablesUseCase.execute(id);
      if (duplicate) {
        this.view.showSuccess(I18nService.getMessage('automationVariablesDuplicated'));
      } else {
        this.view.showError(I18nService.getMessage('automationVariablesNotFound'));
      }
    } catch (error) {
      this.logger.error('Failed to duplicate automation variables', error);
      this.view.showError(I18nService.getMessage('duplicateFailed'));
      throw error;
    }
  }

  /**
   * Get automation variables by ID
   */
  async getVariablesById(id: string): Promise<AutomationVariablesData | null> {
    try {
      const variables = await this.getAutomationVariablesByIdUseCase.execute(id);
      return variables?.toData() || null;
    } catch (error) {
      this.logger.error('Failed to get automation variables', error);
      this.view.showError(I18nService.getMessage('automationVariablesGetFailed'));
      return null;
    }
  }

  /**
   * Export automation variables to CSV
   */
  async exportVariables(): Promise<string> {
    try {
      return await this.exportAutomationVariablesUseCase.execute();
    } catch (error) {
      this.logger.error('Failed to export automation variables', error);
      this.view.showError(I18nService.getMessage('exportFailed'));
      throw error;
    }
  }

  /**
   * Import automation variables from CSV
   */
  async importVariables(csvText: string): Promise<void> {
    try {
      await this.importAutomationVariablesUseCase.execute(csvText);
      this.view.showSuccess(I18nService.getMessage('importCompleted'));
    } catch (error) {
      this.logger.error('Failed to import automation variables', error);
      const errorMessage =
        error instanceof Error ? error.message : I18nService.getMessage('unknownError');
      this.view.showError(I18nService.format('importFailed', errorMessage));
      throw error;
    }
  }

  /**
   * Load execution history for specific automation variables
   */
  async loadResultHistory(variablesId: string): Promise<AutomationResultData[]> {
    try {
      const results = await this.getAutomationResultHistoryUseCase.execute(variablesId);
      return results.map((r) => r.toData());
    } catch (error) {
      this.logger.error('Failed to load automation result history', error);
      this.view.showError(I18nService.getMessage('resultHistoryLoadFailed'));
      return [];
    }
  }
}
```

### テストファイル

すべてのメソッドに対して包括的なテストを実装済み:

- loadVariables: 4 tests
- saveVariables: 2 tests
- deleteVariables: 2 tests
- duplicateVariables: 3 tests
- getVariablesById: 3 tests
- exportVariables: 2 tests
- importVariables: 2 tests
- loadResultHistory: 2 tests

**合計: 20 tests ✅ All passing**

### I18n メッセージキーの追加

`src/infrastructure/services/I18nService.ts` に以下のキーを追加済み:

```typescript
// AutomationVariables Manager keys
| 'automationVariablesLoadFailed'    // 変数の読み込みに失敗しました
| 'automationVariablesSaved'         // 変数を保存しました
| 'automationVariablesDeleted'       // 変数を削除しました
| 'automationVariablesDuplicated'    // 変数を複製しました
| 'automationVariablesNotFound'      // 変数が見つかりませんでした
| 'automationVariablesGetFailed'     // 変数の取得に失敗しました
| 'resultHistoryLoadFailed'          // 実行履歴の読み込みに失敗しました
```

## Phase 4: UI の実装

### HTML ファイル作成

`public/automation-variables-manager.html` を作成します。
既存の `xpath-manager.html` をベースにして、AutomationVariables 用にカスタマイズします。

### Controller 実装

```typescript
// src/presentation/automation-variables-manager/AutomationVariablesManagerController.ts

export class AutomationVariablesManagerController implements IAutomationVariablesManagerView {
  private presenter: AutomationVariablesManagerPresenter;

  constructor() {
    // DI setup
    this.setupDependencies();
    this.setupEventListeners();
    this.loadData();
  }

  private setupDependencies(): void {
    // Repository インスタンスの作成
    // UseCase インスタンスの作成
    // Presenter インスタンスの作成
  }

  private setupEventListeners(): void {
    // ボタンクリック
    // フォーム送信
    // モーダル操作
  }

  // IAutomationVariablesManagerView の実装
  showVariables(variables: AutomationVariablesData[]): void {
    // DOM更新
  }

  // ...
}
```

### webpack.config.js の更新

```javascript
module.exports = {
  entry: {
    background: './src/presentation/background/index.ts',
    popup: './src/presentation/popup/index.ts',
    'xpath-manager': './src/presentation/xpath-manager/index.ts',
    'content-script': './src/presentation/content-script/index.ts',
    'automation-variables-manager': './src/presentation/automation-variables-manager/index.ts', // 追加
  },
  // ...
};
```

## Phase 5: 多言語対応

### i18n メッセージの追加

`public/_locales/ja/messages.json` に追加：

```json
{
  "automationVariablesManagerTitle": {
    "message": "🔤 Automation Variables 管理"
  },
  "createNew": {
    "message": "➕ 新規作成"
  },
  "editAutomationVariables": {
    "message": "Automation Variables を編集"
  },
  "selectSite": {
    "message": "サイト"
  },
  "variablesList": {
    "message": "変数一覧"
  },
  "addNewVariable": {
    "message": "新しい変数を追加"
  },
  "variablesCount": {
    "message": "$count$ 個の変数",
    "placeholders": {
      "count": {
        "content": "$1"
      }
    }
  }
}
```

## テスト実行

### Unit Tests

```bash
# 全テスト実行
npm test

# 特定のテストファイル
npm test AutomationVariables.test.ts

# ウォッチモード
npm test -- --watch

# カバレッジ
npm run test:coverage
```

### Integration Tests

手動で以下を確認：

1. マイグレーション処理
2. CRUD 操作
3. フィルタリング
4. インポート/エクスポート

### デバッグ

```typescript
// Logger の活用
this.logger.debug('Debug info', { data });
this.logger.info('Info message');
this.logger.warn('Warning message');
this.logger.error('Error occurred', error);

// Chrome DevTools
// background.js: chrome://extensions/ → Inspect views: background page
// popup.html: 右クリック → 検証
// content-script: ページ上で F12
```

## リリース手順

1. **ビルド**
   ```bash
   npm run build
   ```

2. **テスト**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

3. **manifest.json のバージョン更新**
   ```json
   {
     "version": "2.5.0"
   }
   ```

4. **CHANGELOG.md の更新**
   ```markdown
   ## [2.5.0] - 2025-10-XX
   ### Added
   - Automation Variables 管理画面
   - 配列形式でのlocalStorage保存
   - マイグレーション機能
   ```

5. **拡張機能のパッケージング**
   ```bash
   cd dist
   zip -r ../extension.zip *
   ```

6. **Chrome Web Store へアップロード**

## トラブルシューティング

### ビルドエラー

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### テストエラー

```bash
# Jest キャッシュをクリア
npm test -- --clearCache
```

### localStorage が空

```bash
# Chrome DevTools Console で確認
chrome.storage.local.get(null, console.log)
```

### マイグレーションが実行されない

```bash
# background.js のログを確認
# chrome://extensions/ → Inspect views: background page
```

## 参考リンク

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
