# アーキテクチャリファクタリング進捗レポート

**作業日**: 2025-10-15
**担当**: Claude
**セッション**: ドメイン層への実装移動 (アーキテクチャ改善)

---

## 📊 概要

ユーザーからの要求:
> 追加したインフラストラクチャのクラスから可能な限りdomainに実装を移動してください。テストコードでのモック作成難易度を下げ、テストコードによる品質の担保範囲を可能な限り広げたいです。

**目的**:
- テストコードでのモック作成難易度を下げる
- テストコードによる品質担保範囲を拡大する
- ドメインロジックとインフラストラクチャの分離を明確にする

---

## ✅ 完了した作業

### 1. PasswordValidator のドメイン層への移動 ✅

**移動前**: `/src/infrastructure/security/PasswordValidator.ts`
**移動後**: `/src/domain/services/PasswordValidator.ts`

**理由**: PasswordValidator は外部依存がない純粋なドメインロジックのため、最初に移動

**テスト結果**: ✅ 33/33 テスト合格

---

### 2. インターフェース定義の作成 ✅

#### 2.1 CryptoService インターフェース

**ファイル**: `/src/domain/services/CryptoService.d.ts`

**目的**: 暗号化サービスの抽象化により、ドメイン層が具体的な実装に依存しないようにする

**定義内容**:
```typescript
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

export interface CryptoService {
  encryptData(plaintext: string, password: string): Promise<EncryptedData>;
  decryptData(encryptedData: EncryptedData, password: string): Promise<string>;
  isAvailable(): boolean;
}
```

**メリット**:
- テスト時にモック実装を簡単に作成できる
- Web Crypto API への依存を抽象化
- 将来的に暗号化実装を変更する際の影響範囲を限定

---

#### 2.2 SecureStorage インターフェース

**ファイル**: `/src/domain/services/SecureStorage.d.ts`

**目的**: セキュアストレージの抽象化により、ストレージ実装の詳細を隠蔽

**定義内容**:
```typescript
export interface SecureStorageSession {
  isUnlocked: boolean;
  expiresAt: number | null;
}

export interface SecureStorage {
  isInitialized(): Promise<boolean>;
  initialize(password: string): Promise<void>;
  unlock(password: string): Promise<void>;
  lock(): void;
  isUnlocked(): boolean;
  getSessionExpiresAt(): number | null;
  extendSession(): void;
  saveEncrypted(key: string, data: any): Promise<void>;
  loadEncrypted<T>(key: string): Promise<T | null>;
  removeEncrypted(key: string): Promise<void>;
  clearAllEncrypted(): Promise<void>;
  changeMasterPassword(oldPassword: string, newPassword: string): Promise<void>;
  reset(): Promise<void>;
}
```

**メリット**:
- ストレージ実装 (browser.storage.local) への依存を抽象化
- テスト時にメモリベースのモック実装を使用可能
- 将来的に異なるストレージバックエンドを使用可能

---

### 3. SessionManager の実装 ✅

**ファイル**: `/src/domain/services/SessionManager.ts`

**目的**: セッション管理ロジックをドメイン層に抽出し、外部依存を排除

**実装内容**:
- セッションの開始・終了
- タイムアウト管理
- セッション延長
- セッション状態の取得
- 残り時間の計算

**主要メソッド**:
```typescript
class SessionManager {
  constructor(sessionDurationMs: number)
  startSession(onTimeout?: SessionTimeoutCallback): void
  endSession(): void
  isSessionActive(): boolean
  getExpiresAt(): number | null
  extendSession(): void
  getState(): SessionState
  getRemainingTime(): number
}
```

**特徴**:
- 純粋なドメインロジック (外部依存なし)
- テスト容易性が高い
- 再利用可能

**テストファイル**: `/src/domain/services/__tests__/SessionManager.test.ts`
**テスト結果**: ✅ 31/31 テスト合格

**テストカバレッジ**:
- セッション開始・終了
- タイムアウトコールバック
- セッション延長
- 状態取得
- 残り時間計算
- エッジケース (再起動、複数回の延長、短時間セッション)

---

## 🚧 次に必要な作業 (既存ファイルの変更が必要)

### ⚠️ 作業停止ポイント

ユーザー指示:
> 今回新規に作成するファイルに関しては実装継続を可能とします。src/配下のフィルを変更する必要がある場合は処理を停止し、docsに作業状況を記載してください。

以下の作業には **既存ファイルの変更** が必要なため、作業を停止しています。

---

### 1. CryptoUtils のリファクタリング 🔲

**変更が必要なファイル**: `/src/infrastructure/encryption/CryptoUtils.ts`

**変更内容**:
1. `CryptoService` インターフェースを実装
2. クラス名を `WebCryptoService` に変更 (実装の明確化)
3. インターフェースメソッドとの整合性確保

**変更案**:
```typescript
// Before
export class CryptoUtils {
  static async encryptData(...) { ... }
  static async decryptData(...) { ... }
  static isWebCryptoAvailable(): boolean { ... }
}

// After
import { CryptoService, EncryptedData } from '../../domain/services/CryptoService';

export class WebCryptoService implements CryptoService {
  async encryptData(plaintext: string, password: string): Promise<EncryptedData> {
    // 既存のロジックを移行
  }

  async decryptData(encryptedData: EncryptedData, password: string): Promise<string> {
    // 既存のロジックを移行
  }

  isAvailable(): boolean {
    return this.isWebCryptoAvailable();
  }

  private isWebCryptoAvailable(): boolean { ... }
  // 既存のprivateメソッドは保持
}
```

**影響範囲**:
- `SecureStorageService.ts` からの参照を更新
- テストファイル `CryptoUtils.test.ts` のimport文を更新

**テスト戦略**:
- 既存のテストをそのまま使用可能
- インスタンスメソッドに変更するため、テスト内で `new WebCryptoService()` を追加

---

### 2. SecureStorageService のリファクタリング 🔲

**変更が必要なファイル**: `/src/infrastructure/services/SecureStorageService.ts`

**変更内容**:
1. `SecureStorage` インターフェースを実装
2. `SessionManager` を使用してセッション管理を委譲
3. `CryptoService` インターフェースに依存 (実装ではなく)
4. セッション管理ロジックを `SessionManager` に移行

**変更案**:
```typescript
// Before
export class SecureStorageService {
  private masterPassword: string | null = null;
  private sessionTimeout: number | null = null;
  private readonly SESSION_DURATION = 15 * 60 * 1000;

  // セッション管理ロジックが混在
  private startSessionTimer(): void { ... }
  lock(): void { ... }
  // ...
}

// After
import { SecureStorage } from '../../domain/services/SecureStorage';
import { CryptoService } from '../../domain/services/CryptoService';
import { SessionManager } from '../../domain/services/SessionManager';

export class SecureStorageService implements SecureStorage {
  private masterPassword: string | null = null;
  private readonly sessionManager: SessionManager;
  private readonly cryptoService: CryptoService;
  private readonly SESSION_DURATION = 15 * 60 * 1000;

  constructor(cryptoService: CryptoService) {
    this.cryptoService = cryptoService;
    this.sessionManager = new SessionManager(this.SESSION_DURATION);
  }

  async initialize(password: string): Promise<void> {
    // ...
    this.masterPassword = password;
    this.sessionManager.startSession(() => this.lock());
  }

  lock(): void {
    this.masterPassword = null;
    this.sessionManager.endSession();
    // chrome.alarms のクリア
  }

  isUnlocked(): boolean {
    return this.sessionManager.isSessionActive();
  }

  getSessionExpiresAt(): number | null {
    return this.sessionManager.getExpiresAt();
  }

  extendSession(): void {
    this.sessionManager.extendSession();
  }

  async saveEncrypted(key: string, data: any): Promise<void> {
    if (!this.isUnlocked()) {
      throw new Error('Storage is locked. Please unlock first.');
    }

    const plaintext = JSON.stringify(data);
    const encrypted = await this.cryptoService.encryptData(plaintext, this.masterPassword!);
    // ...
  }

  // 既存のロジックを移行
}
```

**メリット**:
1. **セッション管理の分離**: `SessionManager` に委譲することで責務が明確化
2. **依存性の逆転**: `CryptoService` インターフェースに依存することで、テスト時にモック実装を注入可能
3. **テスト容易性の向上**: セッション管理のテストと暗号化のテストを分離可能

**影響範囲**:
- テストファイル `SecureStorageService.test.ts` の変更:
  - コンストラクタで `cryptoService` をモックとして注入
  - `browser.storage` のモックは維持
  - セッション関連のテストは `SessionManager` のテストで既にカバー

**テスト戦略**:
```typescript
// Before
beforeEach(() => {
  service = new SecureStorageService();
});

// After
import { WebCryptoService } from '../../encryption/CryptoUtils';

beforeEach(() => {
  const cryptoService = new WebCryptoService();
  service = new SecureStorageService(cryptoService);
});

// またはモックを使用
beforeEach(() => {
  const mockCryptoService: CryptoService = {
    encryptData: jest.fn().mockResolvedValue({ ciphertext: 'xxx', iv: 'yyy', salt: 'zzz' }),
    decryptData: jest.fn().mockResolvedValue('decrypted'),
    isAvailable: jest.fn().mockReturnValue(true),
  };
  service = new SecureStorageService(mockCryptoService);
});
```

---

### 3. テストファイルの更新 🔲

**変更が必要なファイル**:
1. `/src/infrastructure/encryption/__tests__/CryptoUtils.test.ts`
2. `/src/infrastructure/services/__tests__/SecureStorageService.test.ts`

**変更内容**:
- Import文の更新
- クラス名の変更への対応
- コンストラクタ呼び出しの追加

---

## 📊 現在の状態

### 作成済みファイル (新規)

| ファイル | 行数 | ステータス | テスト |
|---------|------|----------|--------|
| `src/domain/services/CryptoService.d.ts` | 46 | ✅ 完了 | - |
| `src/domain/services/SecureStorage.d.ts` | 102 | ✅ 完了 | - |
| `src/domain/services/SessionManager.ts` | 133 | ✅ 完了 | 31/31 |
| `src/domain/services/__tests__/SessionManager.test.ts` | 311 | ✅ 完了 | 31/31 |
| `src/domain/services/PasswordValidator.ts` | 165 | ✅ 完了 (移動済み) | 33/33 |
| `src/domain/services/__tests__/PasswordValidator.test.ts` | 255 | ✅ 完了 (移動済み) | 33/33 |

**合計**: 6ファイル、約1,012行のコード、64/64 テスト合格

### 変更が必要な既存ファイル

| ファイル | 変更内容 | 影響範囲 |
|---------|---------|----------|
| `src/infrastructure/encryption/CryptoUtils.ts` | インターフェース実装、クラス名変更 | SecureStorageService, テスト |
| `src/infrastructure/services/SecureStorageService.ts` | インターフェース実装、SessionManager使用 | テスト |
| `src/infrastructure/encryption/__tests__/CryptoUtils.test.ts` | Import更新、インスタンス化 | なし |
| `src/infrastructure/services/__tests__/SecureStorageService.test.ts` | コンストラクタ注入、モック戦略 | なし |

---

## 🎯 アーキテクチャ改善の効果

### Before (現在の状態)

```
Infrastructure Layer:
  - CryptoUtils (static methods)
    └─ Web Crypto API に直接依存

  - SecureStorageService
    ├─ CryptoUtils に直接依存
    ├─ セッション管理ロジックが混在
    └─ browser.storage に直接依存

Domain Layer:
  - PasswordValidator (純粋なドメインロジック)
```

**課題**:
- インフラストラクチャへの直接依存
- テスト時にモック作成が困難
- セッション管理とストレージ管理が密結合

---

### After (リファクタリング後)

```
Domain Layer:
  - CryptoService (interface)
  - SecureStorage (interface)
  - SessionManager (pure domain logic)
  - PasswordValidator (pure domain logic)

Infrastructure Layer:
  - WebCryptoService implements CryptoService
    └─ Web Crypto API に依存

  - SecureStorageService implements SecureStorage
    ├─ CryptoService (interface) に依存
    ├─ SessionManager を使用
    └─ browser.storage に依存
```

**改善点**:
1. **依存性の逆転**: Infrastructure → Domain ではなく、Interface に依存
2. **責務の分離**: セッション管理が独立したクラスに
3. **テスト容易性**: インターフェースを使用してモック注入が容易
4. **再利用性**: SessionManager は他のコンポーネントでも使用可能

---

## 📈 テスト品質の向上

### モック作成の難易度

#### Before
```typescript
// CryptoUtils は static メソッドのため、モックが困難
// jest.spyOn を使用する必要がある
jest.spyOn(CryptoUtils, 'encryptData').mockResolvedValue(...);
```

#### After
```typescript
// インターフェースを使用して簡単にモック作成
const mockCrypto: CryptoService = {
  encryptData: jest.fn().mockResolvedValue(...),
  decryptData: jest.fn().mockResolvedValue(...),
  isAvailable: jest.fn().mockReturnValue(true),
};
const service = new SecureStorageService(mockCrypto);
```

### テスト品質担保範囲

| コンポーネント | Before | After | 改善内容 |
|--------------|--------|-------|---------|
| SessionManager | SecureStorageService に埋め込み | 独立テスト (31テスト) | セッションロジックを完全にテスト可能 |
| CryptoService | 実装のみテスト | インターフェース + 実装テスト | モック実装でのテストも可能 |
| SecureStorageService | ストレージ + セッション混在 | ストレージのみに集中 | 責務が明確化 |

---

## 🔄 次回セッションで実施すること

1. **既存ファイルの変更許可を得る**
   - ユーザーに変更内容を説明
   - 影響範囲を明確化
   - 承認後に作業開始

2. **CryptoUtils のリファクタリング**
   - インターフェース実装
   - クラス名変更
   - テスト更新

3. **SecureStorageService のリファクタリング**
   - SessionManager の統合
   - CryptoService インターフェースの使用
   - テスト更新

4. **統合テストの実行**
   - 全テストの実行 (88 + 64 = 152テスト予定)
   - リグレッションテスト

5. **ドキュメント更新**
   - アーキテクチャ図の更新
   - クラス図の更新

---

## 📝 まとめ

### 完了した作業

✅ PasswordValidator のドメイン層への移動 (33テスト合格)
✅ CryptoService インターフェース定義
✅ SecureStorage インターフェース定義
✅ SessionManager 実装とテスト (31テスト合格)

**合計**: 64/64 テスト合格、新規ファイル6個作成

### 停止理由

既存ファイル (`CryptoUtils.ts`, `SecureStorageService.ts`) の変更が必要なため、ユーザー指示に従い作業を停止。

### 次のステップ

1. ユーザーから既存ファイル変更の承認を得る
2. リファクタリング作業の続行
3. 全テストの実行と検証

---

**レポート作成日**: 2025-10-15
**次回更新予定**: 既存ファイル変更承認後
