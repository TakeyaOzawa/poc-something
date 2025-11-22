# コーディング規約

## 概要

このドキュメントは、Auto-Fill Tool プロジェクトのコーディング規約を定義します。一貫性のあるコードベースを維持し、チーム開発を円滑にするためのガイドラインです。

---

## 📝 一般原則

### 1. 可読性を最優先

- コードは書くよりも読まれることが多い
- 明確で理解しやすいコードを書く
- 適切な命名と構造化を心がける

### 2. 一貫性の維持

- プロジェクト全体で統一されたスタイルを使用
- 既存のコードスタイルに合わせる
- 自動フォーマッターとリンターを活用

### 3. シンプルさを重視

- 複雑さを避け、シンプルな解決策を選ぶ
- 過度な抽象化を避ける
- YAGNI (You Aren't Gonna Need It) 原則を適用

---

## 🔤 命名規則

### TypeScript/JavaScript

#### クラス名

```typescript
// ✅ 良い例
class UserService {}
class WebsiteRepository {}
class AutomationVariablesManager {}

// ❌ 悪い例
class userservice {}
class websiteRepo {}
class automationVariablesMgr {}
```

#### インターフェース名

```typescript
// ✅ 良い例
interface UserRepository {}
interface LoggerPort {}
interface SystemSettingsView {}

// ❌ 悪い例
interface IUserRepository {} // I プレフィックスは使用しない
interface userRepository {}
```

#### 変数・関数名

```typescript
// ✅ 良い例
const userName = 'john';
const maxRetryCount = 3;
function getUserById(id: string) {}
async function saveWebsite(website: Website) {}

// ❌ 悪い例
const user_name = 'john';
const MaxRetryCount = 3;
function GetUserById(id: string) {}
```

#### 定数名

```typescript
// ✅ 良い例
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT_SECONDS = 30;
const ERROR_CODES = {
  VALIDATION_FAILED: 1001,
  NOT_FOUND: 2001,
} as const;

// ❌ 悪い例
const maxRetryCount = 3;
const defaultTimeoutSeconds = 30;
```

#### Enum名

```typescript
// ✅ 良い例
enum AutomationStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ONCE = 'once',
}

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// ❌ 悪い例
enum automationStatus {}
enum LOGLEVEL {}
```

### ファイル名

#### TypeScript ファイル

```
// ✅ 良い例
user-service.ts
website-repository.ts
automation-variables-manager.ts
system-settings.types.ts

// ❌ 悪い例
UserService.ts
websiteRepository.ts
AutomationVariablesManager.ts
```

#### テストファイル

```
// ✅ 良い例
user-service.test.ts
website-repository.test.ts
__tests__/user-service.test.ts

// ❌ 悪い例
UserService.spec.ts
test-user-service.ts
```

---

## 📁 ファイル構成

### ディレクトリ構造

```
src/
├── domain/
│   ├── entities/
│   │   ├── __tests__/
│   │   ├── Website.ts
│   │   └── index.ts
│   ├── values/
│   └── services/
├── application/
│   ├── usecases/
│   │   ├── websites/
│   │   │   ├── __tests__/
│   │   │   ├── SaveWebsiteUseCase.ts
│   │   │   └── index.ts
│   └── dtos/
└── infrastructure/
```

### ファイル内の構成順序

```typescript
// 1. インポート文（外部ライブラリ → 内部モジュール）
import { Result } from '@domain/values/result.value';
import { WebsiteId } from '@domain/values/WebsiteId';

// 2. 型定義・インターフェース
export interface WebsiteData {
  id: string;
  name: string;
  url?: string;
}

// 3. 定数
const DEFAULT_WEBSITE_NAME = 'Untitled';

// 4. クラス定義
export class Website {
  // プライベートフィールド
  private readonly id: WebsiteId;
  private readonly name: string;

  // コンストラクタ
  constructor(id: WebsiteId, name: string) {
    this.id = id;
    this.name = name;
  }

  // 静的メソッド
  static create(data: WebsiteData): Result<Website, Error> {
    // ...
  }

  // パブリックメソッド
  public getName(): string {
    return this.name;
  }

  // プライベートメソッド
  private validateName(name: string): boolean {
    return name.trim().length > 0;
  }
}
```

---

## 🎯 TypeScript 規約

### 型定義

#### 明示的な型指定

```typescript
// ✅ 良い例
function getUserById(id: string): Promise<User | null> {
  // ...
}

const users: User[] = [];

const config: SystemConfig = {
  timeout: 30,
  retries: 3,
};

// ❌ 悪い例
function getUserById(id) {
  // 型指定なし
  // ...
}

const users = []; // 型推論に依存
```

#### any 型の回避

```typescript
// ✅ 良い例
interface ApiResponse {
  data: unknown;
  status: number;
}

function processResponse(response: ApiResponse): void {
  if (typeof response.data === 'string') {
    // 型ガードを使用
  }
}

// ❌ 悪い例
function processResponse(response: any): void {
  // any 型の使用
}
```

#### Union Types の活用

```typescript
// ✅ 良い例
type Status = 'loading' | 'success' | 'error';
type Result<T> = { success: true; data: T } | { success: false; error: string };

// ❌ 悪い例
type Status = string; // 曖昧な型
```

### インターフェース vs Type Alias

```typescript
// ✅ 良い例（拡張可能なオブジェクト型）
interface User {
  id: string;
  name: string;
}

interface AdminUser extends User {
  permissions: string[];
}

// ✅ 良い例（Union Types や複雑な型）
type Status = 'active' | 'inactive';
type EventHandler<T> = (event: T) => void;

// ❌ 悪い例
type User = {
  id: string;
  name: string;
}; // インターフェースを使うべき
```

---

## 🏗️ クラス設計

### 不変性の重視

```typescript
// ✅ 良い例
export class Website {
  constructor(
    private readonly id: WebsiteId,
    private readonly name: string,
    private readonly url?: WebsiteUrl
  ) {}

  // 新しいインスタンスを返す
  withName(name: string): Website {
    return new Website(this.id, name, this.url);
  }
}

// ❌ 悪い例
export class Website {
  public id: string;
  public name: string;

  setName(name: string): void {
    this.name = name; // ミューテーション
  }
}
```

### メソッドの設計

```typescript
// ✅ 良い例
class UserService {
  // 単一責任
  async findUserById(id: string): Promise<Result<User, Error>> {
    // ...
  }

  // 明確な命名
  async saveUser(user: User): Promise<Result<void, Error>> {
    // ...
  }
}

// ❌ 悪い例
class UserService {
  // 複数の責任
  async processUser(id: string, action: string): Promise<any> {
    // ...
  }
}
```

---

## 🔄 エラーハンドリング

### Result パターンの使用

```typescript
// ✅ 良い例
async function saveWebsite(website: Website): Promise<Result<void, Error>> {
  try {
    await repository.save(website);
    return Result.success(undefined);
  } catch (error) {
    return Result.failure(new Error(`Failed to save: ${error}`));
  }
}

// 使用側
const result = await saveWebsite(website);
if (result.isFailure) {
  console.error(result.error);
  return;
}

// ❌ 悪い例
async function saveWebsite(website: Website): Promise<void> {
  await repository.save(website); // エラーハンドリングなし
}
```

### エラーメッセージ

```typescript
// ✅ 良い例
return Result.failure(new Error('Website name cannot be empty'));
return Result.failure(new Error(`Website not found: ${id}`));

// ❌ 悪い例
return Result.failure(new Error('Error'));
return Result.failure(new Error('Invalid'));
```

---

## 📝 コメント

### JSDoc の使用

```typescript
// ✅ 良い例
/**
 * Saves a website to the repository.
 *
 * @param website - The website entity to save
 * @returns A Result containing void on success or Error on failure
 */
async function saveWebsite(website: Website): Promise<Result<void, Error>> {
  // ...
}

// ❌ 悪い例
// save website
async function saveWebsite(website: Website): Promise<Result<void, Error>> {
  // ...
}
```

### インラインコメント

```typescript
// ✅ 良い例
// ビジネスルール: 名前は3文字以上必要
if (name.length < 3) {
  return Result.failure(new Error('Name too short'));
}

// ❌ 悪い例
// check name
if (name.length < 3) {
  return Result.failure(new Error('Name too short'));
}
```

---

## 🧪 テスト

### テストの命名

```typescript
// ✅ 良い例
describe('Website', () => {
  describe('create', () => {
    it('should create website with valid data', () => {
      // ...
    });

    it('should fail when name is empty', () => {
      // ...
    });
  });
});

// ❌ 悪い例
describe('Website', () => {
  it('test1', () => {
    // ...
  });
});
```

### テストの構造

```typescript
// ✅ 良い例
it('should enable feature successfully', async () => {
  // Arrange
  const feature = createTestFeature();
  const repository = createMockRepository();
  const useCase = new EnableFeatureUseCase(repository);

  // Act
  const result = await useCase.execute({ featureId: 'test-id' });

  // Assert
  expect(result.isSuccess).toBe(true);
  expect(result.value!.enabled).toBe(true);
});

// ❌ 悪い例
it('test', async () => {
  const result = await useCase.execute({ featureId: 'test-id' });
  expect(result.isSuccess).toBe(true);
});
```

---

## 🎨 フォーマット

### インデント

- スペース2つを使用
- タブは使用しない

### 行の長さ

- 最大100文字を推奨
- 長い行は適切に分割

### 空行

```typescript
// ✅ 良い例
export class Website {
  private readonly id: WebsiteId;
  private readonly name: string;

  constructor(id: WebsiteId, name: string) {
    this.id = id;
    this.name = name;
  }

  getName(): string {
    return this.name;
  }
}

// ❌ 悪い例
export class Website {
  private readonly id: WebsiteId;
  private readonly name: string;
  constructor(id: WebsiteId, name: string) {
    this.id = id;
    this.name = name;
  }
  getName(): string {
    return this.name;
  }
}
```

---

## 🔧 ツール設定

### ESLint

プロジェクトの `.eslintrc.js` に従う

### Prettier

プロジェクトの `.prettierrc.json` に従う

### TypeScript

`tsconfig.json` の厳密な設定を使用

---

## 📚 参考資料

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Clean Code (Robert C. Martin)](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Effective TypeScript](https://effectivetypescript.com/)

---

最終更新日: 2024年11月22日
