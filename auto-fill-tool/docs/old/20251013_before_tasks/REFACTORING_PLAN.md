# リファクタリング計画 - WebsiteConfig管理のClean Architecture化

## 現状の問題

現在、WebsiteConfig（Webサイト設定）の管理がClean Architectureの原則に違反しています：

### 問題点
1. **UIから直接Chrome Storageにアクセス**（`popup/index.ts`, `xpath-manager/index.ts`, `background/index.ts`）
2. **WebsiteConfig管理のユースケースが存在しない**
3. **WebsiteConfigのドメインエンティティが存在しない**（interfaceのみ）
4. **テスト不可能な構造**

## リファクタリング計画

### Phase 1: ドメイン層の追加

#### 1.1 WebsiteEntity の作成

**ファイル**: `/src/domain/entities/Website.ts`

```typescript
/**
 * Domain Entity: Website Configuration
 * Represents a website configuration for auto-fill operations
 */

export interface WebsiteData {
  id: string;
  name: string;
  status: 'disabled' | 'enabled' | 'once';
  variables: { [key: string]: string };
  updatedAt: string; // ISO 8601
  editable: boolean;
  startUrl?: string;
}

export class Website {
  private data: WebsiteData;

  constructor(data: WebsiteData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: WebsiteData): void {
    if (!data.id) throw new Error('Website ID is required');
    if (!data.name) throw new Error('Website name is required');
    if (!['disabled', 'enabled', 'once'].includes(data.status)) {
      throw new Error('Invalid status');
    }
  }

  // Getters
  getId(): string { return this.data.id; }
  getName(): string { return this.data.name; }
  getStatus(): 'disabled' | 'enabled' | 'once' { return this.data.status; }
  getVariables(): { [key: string]: string } { return { ...this.data.variables }; }
  getStartUrl(): string | undefined { return this.data.startUrl; }
  isEditable(): boolean { return this.data.editable; }
  isEnabled(): boolean { return this.data.status !== 'disabled'; }

  // Immutable setters
  setStatus(status: 'disabled' | 'enabled' | 'once'): Website {
    return new Website({ ...this.data, status, updatedAt: new Date().toISOString() });
  }

  setVariable(name: string, value: string): Website {
    const variables = { ...this.data.variables, [name]: value };
    return new Website({ ...this.data, variables, updatedAt: new Date().toISOString() });
  }

  removeVariable(name: string): Website {
    const variables = { ...this.data.variables };
    delete variables[name];
    return new Website({ ...this.data, variables, updatedAt: new Date().toISOString() });
  }

  setStartUrl(url: string): Website {
    return new Website({ ...this.data, startUrl: url, updatedAt: new Date().toISOString() });
  }

  // Export data
  toData(): WebsiteData {
    return { ...this.data };
  }

  // Clone
  clone(): Website {
    return new Website({ ...this.data });
  }

  // Static factory
  static create(params: {
    name: string;
    status?: 'disabled' | 'enabled' | 'once';
    variables?: { [key: string]: string };
    editable?: boolean;
    startUrl?: string;
  }): Website {
    return new Website({
      id: `website_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: params.name,
      status: params.status || 'once',
      variables: params.variables || {},
      editable: params.editable !== undefined ? params.editable : true,
      startUrl: params.startUrl,
      updatedAt: new Date().toISOString()
    });
  }
}
```

#### 1.2 WebsiteCollection の作成

**ファイル**: `/src/domain/entities/WebsiteCollection.ts`

```typescript
/**
 * Domain Entity: Website Collection
 * Manages a collection of websites
 */

import { Website, WebsiteData } from './Website';

export class WebsiteCollection {
  private websites: Map<string, Website>;

  constructor(websites: Website[] = []) {
    this.websites = new Map();
    websites.forEach(website => {
      this.websites.set(website.getId(), website);
    });
  }

  add(website: Website): WebsiteCollection {
    const newWebsites = new Map(this.websites);
    newWebsites.set(website.getId(), website);
    return new WebsiteCollection(Array.from(newWebsites.values()));
  }

  update(id: string, website: Website): WebsiteCollection {
    if (!this.websites.has(id)) {
      throw new Error(`Website not found: ${id}`);
    }
    const newWebsites = new Map(this.websites);
    newWebsites.set(id, website);
    return new WebsiteCollection(Array.from(newWebsites.values()));
  }

  delete(id: string): WebsiteCollection {
    const newWebsites = new Map(this.websites);
    newWebsites.delete(id);
    return new WebsiteCollection(Array.from(newWebsites.values()));
  }

  getById(id: string): Website | undefined {
    return this.websites.get(id)?.clone();
  }

  getAll(): Website[] {
    return Array.from(this.websites.values()).map(w => w.clone());
  }

  getAllSortedByUpdatedAt(): Website[] {
    return this.getAll().sort((a, b) => {
      return new Date(b.toData().updatedAt).getTime() -
             new Date(a.toData().updatedAt).getTime();
    });
  }

  getEditableWebsites(): Website[] {
    return this.getAll().filter(w => w.isEditable());
  }

  toJSON(): string {
    const data = this.getAll().map(w => w.toData());
    return JSON.stringify(data);
  }

  static fromJSON(json: string): WebsiteCollection {
    try {
      const data: WebsiteData[] = JSON.parse(json);
      const websites = data.map(d => new Website(d));
      return new WebsiteCollection(websites);
    } catch (error) {
      console.error('Failed to parse WebsiteCollection JSON:', error);
      return new WebsiteCollection();
    }
  }

  static empty(): WebsiteCollection {
    return new WebsiteCollection();
  }
}
```

#### 1.3 IWebsiteRepository インターフェースの作成

**ファイル**: `/src/domain/repositories/IWebsiteRepository.ts`

```typescript
/**
 * Domain Repository Interface: Website Repository
 */

import { WebsiteCollection } from '@domain/entities/WebsiteCollection';

export interface IWebsiteRepository {
  /**
   * Save website collection to storage
   */
  save(collection: WebsiteCollection): Promise<void>;

  /**
   * Load website collection from storage
   */
  load(): Promise<WebsiteCollection>;
}
```

### Phase 2: インフラ層の追加

#### 2.1 ChromeStorageWebsiteRepository の作成

**ファイル**: `/src/infrastructure/repositories/ChromeStorageWebsiteRepository.ts`

```typescript
/**
 * Infrastructure Repository: Chrome Storage Website Repository
 */

import { IWebsiteRepository } from '@domain/repositories/IWebsiteRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';

export class ChromeStorageWebsiteRepository implements IWebsiteRepository {
  private STORAGE_KEY = 'websiteConfigs';

  async save(collection: WebsiteCollection): Promise<void> {
    try {
      const json = collection.toJSON();
      await chrome.storage.local.set({ [this.STORAGE_KEY]: json });
      console.log('Website collection saved to storage');
    } catch (error) {
      console.error('Failed to save website collection:', error);
      throw new Error('Failed to save website collection');
    }
  }

  async load(): Promise<WebsiteCollection> {
    try {
      console.log('Loading website collection from storage');
      const result = await chrome.storage.local.get(this.STORAGE_KEY);

      if (!result[this.STORAGE_KEY]) {
        console.log('No website collection found in storage');
        return WebsiteCollection.empty();
      }

      return WebsiteCollection.fromJSON(result[this.STORAGE_KEY]);
    } catch (error) {
      console.error('Failed to load website collection:', error);
      return WebsiteCollection.empty();
    }
  }
}
```

### Phase 3: ユースケース層の追加

#### 3.1 GetAllWebsitesUseCase

**ファイル**: `/src/usecases/GetAllWebsitesUseCase.ts`

```typescript
import { IWebsiteRepository } from '@domain/repositories/IWebsiteRepository';
import { WebsiteData } from '@domain/entities/Website';

export class GetAllWebsitesUseCase {
  constructor(private websiteRepository: IWebsiteRepository) {}

  async execute(): Promise<WebsiteData[]> {
    const collection = await this.websiteRepository.load();
    return collection.getAll().map(w => w.toData());
  }
}
```

#### 3.2 GetWebsiteByIdUseCase

```typescript
import { IWebsiteRepository } from '@domain/repositories/IWebsiteRepository';
import { WebsiteData } from '@domain/entities/Website';

export class GetWebsiteByIdUseCase {
  constructor(private websiteRepository: IWebsiteRepository) {}

  async execute(id: string): Promise<WebsiteData | null> {
    const collection = await this.websiteRepository.load();
    const website = collection.getById(id);
    return website ? website.toData() : null;
  }
}
```

#### 3.3 SaveWebsiteUseCase

```typescript
import { IWebsiteRepository } from '@domain/repositories/IWebsiteRepository';
import { Website, WebsiteData } from '@domain/entities/Website';

export class SaveWebsiteUseCase {
  constructor(private websiteRepository: IWebsiteRepository) {}

  async execute(params: {
    name: string;
    status?: 'disabled' | 'enabled' | 'once';
    variables?: { [key: string]: string };
    editable?: boolean;
    startUrl?: string;
  }): Promise<WebsiteData> {
    const collection = await this.websiteRepository.load();
    const website = Website.create(params);
    const newCollection = collection.add(website);
    await this.websiteRepository.save(newCollection);
    return website.toData();
  }
}
```

#### 3.4 UpdateWebsiteUseCase

```typescript
import { IWebsiteRepository } from '@domain/repositories/IWebsiteRepository';
import { Website, WebsiteData } from '@domain/entities/Website';

export class UpdateWebsiteUseCase {
  constructor(private websiteRepository: IWebsiteRepository) {}

  async execute(data: WebsiteData): Promise<void> {
    const collection = await this.websiteRepository.load();
    const website = new Website(data);
    const newCollection = collection.update(data.id, website);
    await this.websiteRepository.save(newCollection);
  }
}
```

#### 3.5 DeleteWebsiteUseCase

```typescript
import { IWebsiteRepository } from '@domain/repositories/IWebsiteRepository';
import { IXPathRepository } from '@domain/repositories/IXPathRepository';

export class DeleteWebsiteUseCase {
  constructor(
    private websiteRepository: IWebsiteRepository,
    private xpathRepository: IXPathRepository
  ) {}

  async execute(id: string): Promise<void> {
    // Delete website
    const websiteCollection = await this.websiteRepository.load();
    const newWebsiteCollection = websiteCollection.delete(id);
    await this.websiteRepository.save(newWebsiteCollection);

    // Delete associated XPaths
    const xpathCollection = await this.xpathRepository.load();
    const filteredXPaths = xpathCollection.getAll().filter(x => x.websiteId !== id);

    let newXPathCollection = xpathCollection;
    xpathCollection.getAll().forEach(xpath => {
      if (xpath.websiteId === id) {
        newXPathCollection = newXPathCollection.delete(xpath.id);
      }
    });

    await this.xpathRepository.save(newXPathCollection);
  }
}
```

#### 3.6 UpdateWebsiteStatusUseCase

```typescript
import { IWebsiteRepository } from '@domain/repositories/IWebsiteRepository';

export class UpdateWebsiteStatusUseCase {
  constructor(private websiteRepository: IWebsiteRepository) {}

  async execute(id: string, status: 'disabled' | 'enabled' | 'once'): Promise<void> {
    const collection = await this.websiteRepository.load();
    const website = collection.getById(id);

    if (!website) {
      throw new Error(`Website not found: ${id}`);
    }

    const updatedWebsite = website.setStatus(status);
    const newCollection = collection.update(id, updatedWebsite);
    await this.websiteRepository.save(newCollection);
  }
}
```

### Phase 4: テストの追加

#### 4.1 Website.test.ts
#### 4.2 WebsiteCollection.test.ts
#### 4.3 ChromeStorageWebsiteRepository.test.ts
#### 4.4 各UseCase.test.ts

### Phase 5: Presentation層のリファクタリング

#### 5.1 popup/index.ts

**変更前:**
```typescript
private async loadWebsites(): Promise<void> {
  const result = await chrome.storage.local.get(this.STORAGE_KEY);
  // ...
}
```

**変更後:**
```typescript
private getAllWebsitesUseCase: GetAllWebsitesUseCase;
// constructor で初期化

private async loadWebsites(): Promise<void> {
  this.currentWebsites = await this.getAllWebsitesUseCase.execute();
}
```

#### 5.2 xpath-manager/index.ts
#### 5.3 background/index.ts

同様にすべてのChrome Storage直接アクセスをユースケース経由に変更。

## 実装順序

1. ✅ **Phase 1: ドメイン層（Website, WebsiteCollection, IWebsiteRepository）** - **完了 (2025-10-07)**
2. ✅ **Phase 2: インフラ層（ChromeStorageWebsiteRepository）** - **完了 (2025-10-07)**
3. ✅ **Phase 3: ユースケース層（6つのユースケース）** - **完了 (2025-10-07)**
4. ✅ **Phase 4: テスト追加（56テストケース）** - **完了 (2025-10-07)**
5. ❌ **Phase 5: Presentation層リファクタリング** - **未実装（保留中）**
6. ❌ **Phase 6: 動作確認・統合テスト** - **未実装（Phase 5完了後）**

### Phase 1-4 実装完了 (2025-10-07)

✅ **作成されたファイル:**

**Domain層:**
- `src/domain/entities/Website.ts` (138行)
- `src/domain/entities/WebsiteCollection.ts` (78行)
- `src/domain/repositories/IWebsiteRepository.ts` (18行)

**Infrastructure層:**
- `src/infrastructure/repositories/ChromeStorageWebsiteRepository.ts` (38行)

**UseCase層:**
- `src/usecases/GetAllWebsitesUseCase.ts`
- `src/usecases/GetWebsiteByIdUseCase.ts`
- `src/usecases/SaveWebsiteUseCase.ts`
- `src/usecases/UpdateWebsiteUseCase.ts`
- `src/usecases/DeleteWebsiteUseCase.ts`
- `src/usecases/UpdateWebsiteStatusUseCase.ts`

**Test層:**
- `src/domain/entities/__tests__/Website.test.ts` (149行, 18テストケース)
- `src/domain/entities/__tests__/WebsiteCollection.test.ts` (164行, 18テストケース)
- `src/infrastructure/repositories/__tests__/ChromeStorageWebsiteRepository.test.ts` (66行, 5テストケース)
- `src/usecases/__tests__/GetAllWebsitesUseCase.test.ts` (3テストケース)
- `src/usecases/__tests__/GetWebsiteByIdUseCase.test.ts` (2テストケース)
- `src/usecases/__tests__/SaveWebsiteUseCase.test.ts` (3テストケース)
- `src/usecases/__tests__/UpdateWebsiteUseCase.test.ts` (2テストケース)
- `src/usecases/__tests__/DeleteWebsiteUseCase.test.ts` (2テストケース)
- `src/usecases/__tests__/UpdateWebsiteStatusUseCase.test.ts` (3テストケース)

**合計:**
- **新規ファイル数**: 18ファイル
- **新規テストケース数**: 56テストケース
- **全テスト実行結果**: ✅ 56 passed

---

### その他の完了項目 (2025-10-08)

#### フィールド名の汎用化完了

✅ **`dispatchEventPattern` → `actionPattern` への変更:**
- **理由**: action_typeに応じて異なる用途で使用されるため、より汎用的な名前に変更
  - JUDGE: 比較パターン (10=equals, 20=not equals, 30=greater than, 40=less than)
  - SELECT_*: 選択パターン (10/110=native single/multiple, 20/120=custom single/multiple)
  - TYPE/CLICK/CHECK: イベントパターン (将来の拡張用)
  - CHANGE_URL: 未使用

**変更されたファイル:**
- Domain層: `XPathCollection.ts`
- Infrastructure層:
  - `ChromeAutoFillService.ts` (メソッドシグネチャ更新)
  - `XPathCollectionMapper.ts` (CSV/JSON形式更新、後方互換性削除)
  - `auto-fill/executors/` 配下の全Executorクラス
- Presentation層:
  - `xpath-manager/index.ts` (DOM要素ID変更)
  - `xpath-manager.html` (フォームフィールド更新)
  - `XPathManagerView.ts` (表示ロジック更新)
  - `background/XPathContextMenuHandler.ts`
- UseCase層: `SaveXPathUseCase.ts`, `DuplicateXPathUseCase.ts`
- Test層: 全5テストファイル更新
- Helper: `testHelpers.ts`

**CSV/JSON形式変更:**
- CSVヘッダー: `dispatch_event_pattern` → `action_pattern`
- 後方互換性: なし（ユーザーは新形式でエクスポート・インポート必要）

---

### 次のステップ: Phase 5（Presentation層リファクタリング）

**ステータス**: ❌ 未実装（保留中）

Phase 5では以下のファイルをリファクタリングする必要があります：

1. **popup/index.ts**: PopupController クラスの以下のメソッド
   - `loadWebsites()` - GetAllWebsitesUseCase経由に変更
   - `saveWebsites()` - SaveWebsiteUseCase/UpdateWebsiteUseCase経由に変更
   - `deleteWebsite()` - DeleteWebsiteUseCase経由に変更

2. **xpath-manager/index.ts**: XPathManager の以下の処理
   - `loadWebsiteSelect()` - GetAllWebsitesUseCase経由に変更
   - `loadVariables()` - GetWebsiteByIdUseCase経由に変更
   - `saveVariables()` - UpdateWebsiteUseCase経由に変更

3. **background/index.ts**: Background Service Worker
   - `handleGetXPath()` - SaveWebsiteUseCase経由に変更
   - `createContextMenus()` - GetAllWebsitesUseCase経由に変更
   - `handleUpdateWebsiteStatus()` - UpdateWebsiteStatusUseCase経由に変更

**注意**: Phase 5は現在保留中。既存のpopup/xpath-manager/backgroundは直接Chrome Storageにアクセスしているが、動作は正常。リファクタリングの優先度は中程度。

## 期待される効果

- ✅ Clean Architectureの原則に準拠
- ✅ テスト容易性の向上
- ✅ ビジネスロジックの集約
- ✅ 保守性の向上
- ✅ ストレージ実装の変更が容易に

## 注意事項

- **破壊的変更ではない**: 既存のChrome Storage形式は維持
- **段階的移行可能**: ファイルごとに順次リファクタリング可能
- **テストカバレッジ維持**: 各フェーズでテスト追加

---

**作成日**: 2025-10-07
**優先度**: 高（Clean Architecture違反の修正）
