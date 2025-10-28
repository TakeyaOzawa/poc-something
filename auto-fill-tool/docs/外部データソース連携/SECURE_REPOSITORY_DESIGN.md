# Secure Repository 設計書

**作成日**: 2025-10-16
**バージョン**: 1.0
**ステータス**: 設計完了

---

## 📋 目次

1. [概要](#概要)
2. [設計原則](#設計原則)
3. [アーキテクチャ](#アーキテクチャ)
4. [実装パターン](#実装パターン)
5. [セキュリティ考慮事項](#セキュリティ考慮事項)
6. [実装対象Repository](#実装対象repository)
7. [マイグレーション戦略](#マイグレーション戦略)

---

## 概要

Secure Repositoryは、既存のRepositoryパターンに暗号化機能を統合し、機密データを安全に保存・管理するための実装です。

### 目的

1. **透過的な暗号化**: アプリケーション層（Use Case層）は暗号化を意識せず、通常のRepository操作を行う
2. **既存コードとの互換性**: 既存のRepositoryインターフェースを実装し、置き換え可能
3. **段階的移行**: 平文データと暗号化データの共存期間をサポート
4. **高いセキュリティ**: Section 3.2で実装した暗号化基盤を活用

### 暗号化対象データ

| Repository | 暗号化対象 | 理由 |
|-----------|----------|------|
| AutomationVariables | variables（変数値） | 個人情報、ログイン情報等を含む可能性 |
| WebsiteConfig | loginInfo（ログイン情報） | ユーザー名・パスワード |
| XPath | 全データ | XPath定義に機密情報が含まれる可能性 |
| SystemSettings | apiKeys, tokens | API認証情報 |

---

## 設計原則

### 1. 依存性逆転の原則 (DIP)

```
Use Case Layer
    ↓ (依存)
Domain Layer (Repository Interface)
    ↑ (実装)
Infrastructure Layer (Secure Repository Implementation)
```

**特徴**:
- Secure Repositoryは既存のRepositoryインターフェースを実装
- Use Case層は変更不要（Dependency Injection で切り替え可能）

### 2. 単一責任の原則 (SRP)

**責務の分離**:
- **Repository**: データのCRUD操作
- **SecureStorage**: 暗号化・復号化、セッション管理
- **Entity**: ビジネスロジック、データ検証

### 3. オープン・クローズドの原則 (OCP)

- 既存のRepositoryインターフェースを変更せず、新しい実装を追加
- Factory Patternで動的に切り替え可能

---

## アーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────────────────────────────┐
│                    Use Case Layer                        │
│  - ExecuteAutomationUseCase                             │
│  - SaveWebsiteConfigUseCase                             │
│  (既存のUse Caseは変更不要)                             │
└─────────────────────────────────────────────────────────┘
                         ↓ (依存)
┌─────────────────────────────────────────────────────────┐
│                    Domain Layer                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Repository Interfaces                             │  │
│  │  - AutomationVariablesRepository                  │  │
│  │  - WebsiteRepository                              │  │
│  │  - XPathRepository                                │  │
│  │  - SystemSettingsRepository                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↑ (実装)
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Secure Repository Implementations                 │  │
│  │  - SecureAutomationVariablesRepository            │  │
│  │  - SecureWebsiteConfigRepository                  │  │
│  │  - SecureXPathRepository                          │  │
│  │  - SecureSystemSettingsRepository                 │  │
│  │                                                    │  │
│  │ ┌────────────────────────────────────────────┐  │  │
│  │ │ SecureStorage (暗号化基盤)                  │  │  │
│  │ │  - WebCryptoService (AES-256-GCM)          │  │  │
│  │ │  - SessionManager (15分タイムアウト)       │  │  │
│  │ │  - LockoutManager (ブルートフォース対策)   │  │  │
│  │ └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### データフロー

#### 保存時 (Save)

```
Use Case
   ↓ save(entity: AutomationVariables)
Repository (Secure Implementation)
   ↓ entity.toData() → JSON.stringify
SecureStorage
   ↓ encrypt(data, masterPassword)
Chrome Storage (暗号化された状態で保存)
```

#### 読み込み時 (Load)

```
Chrome Storage (暗号化データ)
   ↓
SecureStorage
   ↓ decrypt(encryptedData, masterPassword)
Repository (Secure Implementation)
   ↓ JSON.parse → Entity.fromExisting(data)
Use Case
   ← entity: AutomationVariables
```

---

## 実装パターン

### 基本パターン

すべてのSecure Repositoryは以下のパターンに従います：

```typescript
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { SecureStorage } from '@domain/services/SecureStorage';

export class SecureAutomationVariablesRepository implements AutomationVariablesRepository {
  private readonly STORAGE_KEY = 'secure_automation_variables';

  constructor(private secureStorage: SecureStorage) {}

  async save(variables: AutomationVariables): Promise<void> {
    // 1. セッションチェック
    if (!this.secureStorage.isUnlocked()) {
      throw new Error('Storage is locked. Please unlock first.');
    }

    // 2. エンティティ → データ形式に変換
    const data = variables.toData();

    // 3. 既存データを読み込み
    const allData = await this.loadAllData();

    // 4. データを更新
    allData[variables.getWebsiteId()] = data;

    // 5. 暗号化して保存
    await this.secureStorage.saveEncrypted(this.STORAGE_KEY, allData);

    // 6. セッション延長
    this.secureStorage.extendSession();
  }

  async load(websiteId: string): Promise<AutomationVariables | null> {
    // 1. セッションチェック
    if (!this.secureStorage.isUnlocked()) {
      throw new Error('Storage is locked. Please unlock first.');
    }

    // 2. 暗号化データを読み込み・復号化
    const allData = await this.loadAllData();

    // 3. 該当データを取得
    const data = allData[websiteId];
    if (!data) return null;

    // 4. エンティティに変換
    const entity = AutomationVariables.fromExisting(data);

    // 5. セッション延長
    this.secureStorage.extendSession();

    return entity;
  }

  async loadAll(): Promise<AutomationVariables[]> {
    if (!this.secureStorage.isUnlocked()) {
      throw new Error('Storage is locked. Please unlock first.');
    }

    const allData = await this.loadAllData();
    const entities = Object.values(allData).map((data) =>
      AutomationVariables.fromExisting(data)
    );

    this.secureStorage.extendSession();
    return entities;
  }

  async delete(websiteId: string): Promise<void> {
    if (!this.secureStorage.isUnlocked()) {
      throw new Error('Storage is locked. Please unlock first.');
    }

    const allData = await this.loadAllData();
    delete allData[websiteId];

    await this.secureStorage.saveEncrypted(this.STORAGE_KEY, allData);
    this.secureStorage.extendSession();
  }

  async exists(websiteId: string): Promise<boolean> {
    if (!this.secureStorage.isUnlocked()) {
      return false;
    }

    const allData = await this.loadAllData();
    return websiteId in allData;
  }

  /**
   * Private helper: Load all data (decrypted)
   */
  private async loadAllData(): Promise<{ [key: string]: any }> {
    const data = await this.secureStorage.loadEncrypted<{ [key: string]: any }>(
      this.STORAGE_KEY
    );
    return data || {};
  }
}
```

### 共通処理のヘルパーメソッド

すべてのSecure Repositoryで共通する処理：

```typescript
/**
 * セッションチェック（すべての操作の前に実行）
 */
protected checkSession(): void {
  if (!this.secureStorage.isUnlocked()) {
    throw new Error('Storage is locked. Please unlock first.');
  }
}

/**
 * セッション延長（すべての操作の後に実行）
 */
protected extendSession(): void {
  this.secureStorage.extendSession();
}

/**
 * 全データ読み込み（内部使用）
 */
protected async loadAllData<T>(): Promise<{ [key: string]: T }> {
  const data = await this.secureStorage.loadEncrypted<{ [key: string]: T }>(
    this.STORAGE_KEY
  );
  return data || {};
}
```

---

## セキュリティ考慮事項

### 1. セッション管理

**Do**:
- ✅ すべての操作で `isUnlocked()` をチェック
- ✅ 操作完了後に `extendSession()` を呼び出し
- ✅ タイムアウト時は自動的にロック（SessionManagerが管理）

**Don't**:
- ❌ ロック状態で操作を試みない
- ❌ セッション延長を忘れない

### 2. データ整合性

**Do**:
- ✅ エンティティの `validate()` を活用
- ✅ `fromExisting()` で安全にエンティティ構築
- ✅ エラー時は既存データを破壊しない

**Don't**:
- ❌ 直接 `new Entity()` でデータを構築しない（バリデーションが重要）
- ❌ データ保存失敗時に中途半端な状態を残さない

### 3. エラーハンドリング

**ロックエラー**:
```typescript
try {
  await secureRepository.save(entity);
} catch (error) {
  if (error.message.includes('locked')) {
    // ユーザーに再ログインを促す
    showUnlockDialog();
  } else {
    // その他のエラー処理
  }
}
```

**復号化エラー**:
```typescript
try {
  const entity = await secureRepository.load(id);
} catch (error) {
  if (error.message.includes('Decryption failed')) {
    // データが破損している可能性
    logger.error('Data corruption detected', { id });
    // ユーザーに通知
  }
}
```

### 4. パフォーマンス

**最適化戦略**:
- 必要なデータのみを読み込み（`load(id)` を優先、`loadAll()` は最小限に）
- 大量データの場合はページネーション検討
- 暗号化/復号化は IO バウンドなので、並列化は効果的

---

## 実装対象Repository

### 優先順位

| Priority | Repository | 理由 |
|----------|-----------|------|
| 🔴 High | AutomationVariablesRepository | 個人情報含む可能性が最も高い |
| 🔴 High | WebsiteConfigRepository | ログイン情報を含む |
| 🟡 Medium | SystemSettingsRepository | API キー等の認証情報 |
| 🟢 Low | XPathRepository | 機密性は低いが、一貫性のため暗号化 |
| ⚪ N/A | AutomationResultRepository | ログデータ、暗号化不要 |

### 実装順序

1. **Phase 1** (高優先度): AutomationVariablesRepository, WebsiteConfigRepository
2. **Phase 2** (中優先度): SystemSettingsRepository
3. **Phase 3** (低優先度): XPathRepository

---

## マイグレーション戦略

### 段階的移行

**ステップ1**: Secure Repository実装完了
- 新規データは暗号化して保存
- 既存の平文データも読み込み可能（後方互換性）

**ステップ2**: 初回ログイン時にマイグレーション
```typescript
async function migrateToEncrypted(secureStorage: SecureStorage): Promise<void> {
  // 1. ユーザーにマスターパスワード設定を促す
  const masterPassword = await promptMasterPassword();

  // 2. SecureStorage初期化
  await secureStorage.initialize(masterPassword);
  await secureStorage.unlock(masterPassword);

  // 3. 既存の平文データを読み込み
  const plaintextData = await loadPlaintextAutomationVariables();

  // 4. Secure Repositoryで保存（暗号化）
  const secureRepo = new SecureAutomationVariablesRepository(secureStorage);
  for (const data of plaintextData) {
    const entity = AutomationVariables.fromExisting(data);
    await secureRepo.save(entity);
  }

  // 5. 平文データを削除
  await deletePlaintextAutomationVariables();
}
```

**ステップ3**: 既存コードの切り替え
- Dependency Injection Containerで通常Repository → Secure Repositoryに切り替え
- Use Case層は変更不要

### ロールバック戦略

万が一問題が発生した場合の復旧手順：

1. **暗号化前のバックアップ保持** (マイグレーション時に作成)
2. **Secure Repository → 通常Repositoryへ切り替え** (DI Container設定変更)
3. **バックアップから復元**

```typescript
// マイグレーション前にバックアップ
async function backupBeforeMigration(): Promise<void> {
  const data = await browser.storage.local.get(null);
  const backup = {
    timestamp: new Date().toISOString(),
    data: data,
  };
  await browser.storage.local.set({
    'migration_backup': backup,
  });
}
```

---

## テスト戦略

### ユニットテスト

各Secure Repositoryのテストパターン：

```typescript
describe('SecureAutomationVariablesRepository', () => {
  let secureStorage: SecureStorage;
  let repository: SecureAutomationVariablesRepository;

  beforeEach(async () => {
    // Mock SecureStorage
    secureStorage = {
      isUnlocked: jest.fn().mockReturnValue(true),
      saveEncrypted: jest.fn(),
      loadEncrypted: jest.fn(),
      removeEncrypted: jest.fn(),
      extendSession: jest.fn(),
    } as any;

    repository = new SecureAutomationVariablesRepository(secureStorage);
  });

  it('should save entity encrypted', async () => {
    const entity = AutomationVariables.create({
      websiteId: 'test-website',
      variables: { key: 'value' },
    });

    await repository.save(entity);

    expect(secureStorage.saveEncrypted).toHaveBeenCalledWith(
      'secure_automation_variables',
      expect.objectContaining({
        'test-website': expect.objectContaining({
          websiteId: 'test-website',
        }),
      })
    );
  });

  it('should throw error when locked', async () => {
    (secureStorage.isUnlocked as jest.Mock).mockReturnValue(false);

    const entity = AutomationVariables.create({
      websiteId: 'test-website',
      variables: {},
    });

    await expect(repository.save(entity)).rejects.toThrow('Storage is locked');
  });
});
```

### 統合テスト

Secure Repository + SecureStorage + CryptoService の統合テスト：

```typescript
describe('SecureRepository Integration', () => {
  let cryptoService: WebCryptoService;
  let secureStorage: SecureStorageService;
  let repository: SecureAutomationVariablesRepository;

  beforeEach(async () => {
    cryptoService = new WebCryptoService();
    secureStorage = new SecureStorageService(cryptoService);
    await secureStorage.initialize('TestPassword123!');
    await secureStorage.unlock('TestPassword123!');

    repository = new SecureAutomationVariablesRepository(secureStorage);
  });

  it('should encrypt and decrypt entity correctly', async () => {
    const entity = AutomationVariables.create({
      websiteId: 'test-website',
      variables: { username: 'admin', password: 'secret' },
    });

    await repository.save(entity);

    const loaded = await repository.load('test-website');

    expect(loaded).toBeTruthy();
    expect(loaded!.getVariables()).toEqual({ username: 'admin', password: 'secret' });
  });
});
```

---

## ベストプラクティス

### 1. Dependency Injection

```typescript
// ✅ Good: インターフェースに依存
class ExecuteAutomationUseCase {
  constructor(
    private repository: AutomationVariablesRepository // インターフェース
  ) {}
}

// ❌ Bad: 具象クラスに依存
class ExecuteAutomationUseCase {
  private repository = new SecureAutomationVariablesRepository(secureStorage);
}
```

### 2. エラーハンドリング

```typescript
// ✅ Good: 明確なエラーメッセージ
async save(entity: AutomationVariables): Promise<void> {
  if (!this.secureStorage.isUnlocked()) {
    throw new Error('Cannot save: Storage is locked. Please authenticate first.');
  }
  // ...
}

// ❌ Bad: 不明瞭なエラー
async save(entity: AutomationVariables): Promise<void> {
  if (!this.secureStorage.isUnlocked()) {
    throw new Error('Error');
  }
  // ...
}
```

### 3. セッション延長のタイミング

```typescript
// ✅ Good: 操作完了後に延長
async load(id: string): Promise<Entity | null> {
  this.checkSession();

  const data = await this.loadAllData();
  const entity = Entity.fromExisting(data[id]);

  this.extendSession(); // 操作完了後
  return entity;
}

// ❌ Bad: 延長を忘れる
async load(id: string): Promise<Entity | null> {
  this.checkSession();

  const data = await this.loadAllData();
  return Entity.fromExisting(data[id]);
  // セッション延長なし → タイムアウトしやすい
}
```

---

## 次のステップ

1. **Section 3.3.2**: SecureAutomationVariablesRepository 実装
2. **Section 3.3.3**: SecureWebsiteConfigRepository 実装
3. **Section 3.3.4**: SecureXPathRepository 実装
4. **Section 3.3.5**: SecureSystemSettingsRepository 実装
5. **Section 3.3.6**: Repository Factory 実装
6. **Section 3.3.7**: マイグレーション戦略詳細設計
7. **Section 3.3.8-3.3.9**: テスト作成
8. **Section 3.3.10**: 既存コードへの統合

---

**ドキュメント作成日**: 2025-10-16
**最終更新**: 2025-10-16
**次回更新予定**: Section 3.3実装完了時
