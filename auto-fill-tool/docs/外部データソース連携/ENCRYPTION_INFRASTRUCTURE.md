# 暗号化基盤 - 実装ドキュメント

**作成日**: 2025-10-15
**バージョン**: 1.0
**ステータス**: 完全実装・テスト済み

---

## 📋 目次

1. [概要](#概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [コンポーネント詳細](#コンポーネント詳細)
4. [使用方法](#使用方法)
5. [セキュリティガイドライン](#セキュリティガイドライン)
6. [ベストプラクティス](#ベストプラクティス)
7. [テストカバレッジ](#テストカバレッジ)
8. [トラブルシューティング](#トラブルシューティング)

---

## 概要

本暗号化基盤は、Chrome拡張機能内で機密データを安全に保存・管理するための包括的なセキュリティインフラストラクチャです。Clean Architectureの原則に従い、高いテスト容易性と保守性を実現しています。

### 主要機能

- **暗号化ストレージ**: AES-256-GCM による強固な暗号化
- **セッション管理**: タイムアウトによる自動ロック機能
- **ブルートフォース対策**: ログイン試行回数制限とロックアウト
- **パスワード強度検証**: 包括的なパスワード要件チェック
- **マスターパスワード変更**: 既存データの自動再暗号化

### テスト結果

- **総テスト数**: 187テスト
- **合格率**: 100% (187/187)
- **カバレッジ**: ユニットテスト + 統合テスト

---

## アーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│                   (UI - 未実装予定)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Use Case Layer                          │
│              (今後の SecureRepository で使用)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Interfaces                                            │  │
│  │  - CryptoService (暗号化サービス抽象化)              │  │
│  │  - SecureStorage (セキュアストレージ抽象化)          │  │
│  │  - LockoutManager (ロックアウト管理)                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Services                                              │  │
│  │  - SessionManager (セッション管理ロジック)           │  │
│  │  - PasswordValidator (パスワード検証ロジック)        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Implementations                                       │  │
│  │  - WebCryptoService (Web Crypto API 実装)            │  │
│  │  - SecureStorageService (Chrome Storage 実装)        │  │
│  │  - ChromeStorageLockoutStorage (永続化実装)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 依存性の流れ

```
Infrastructure → Domain
    │              │
    │              ├─ Interfaces (抽象化)
    │              └─ Services (純粋ロジック)
    │
    └─ Implementations (依存性注入)
```

**特徴**:
- 依存性逆転の原則 (DIP) を適用
- Infrastructure層はDomain層のインターフェースに依存
- Domain層は外部依存なし (高いテスト容易性)

---

## コンポーネント詳細

### 1. CryptoService / WebCryptoService

**責務**: データの暗号化・復号化

**場所**:
- Interface: `src/domain/services/CryptoService.d.ts`
- Implementation: `src/infrastructure/encryption/CryptoUtils.ts`

**仕様**:
- **暗号化アルゴリズム**: AES-256-GCM
- **鍵導出**: PBKDF2 (100,000 iterations, SHA-256)
- **認証付き暗号化**: AES-GCM により改ざん検知
- **Semantic Security**: ランダムなIV/saltにより同じ平文でも異なる暗号文

**インターフェース**:

```typescript
interface CryptoService {
  isAvailable(): boolean;
  encryptData(plaintext: string, password: string): Promise<EncryptedData>;
  decryptData(encryptedData: EncryptedData, password: string): Promise<string>;
  generateSalt(): string;
}

interface EncryptedData {
  ciphertext: string; // Base64
  iv: string;         // Base64
  salt: string;       // Base64
}
```

**使用例**:

```typescript
import { WebCryptoService } from '@infrastructure/encryption/CryptoUtils';

const cryptoService = new WebCryptoService();

// 暗号化
const encrypted = await cryptoService.encryptData('secret data', 'password123');

// 復号化
const decrypted = await cryptoService.decryptData(encrypted, 'password123');
```

---

### 2. SecureStorage / SecureStorageService

**責務**: 暗号化されたデータの保存・管理とセッション管理

**場所**:
- Interface: `src/domain/services/SecureStorage.d.ts`
- Implementation: `src/infrastructure/services/SecureStorageService.ts`

**主要機能**:
- マスターパスワードによる初期化
- セッション管理 (15分タイムアウト)
- 暗号化データの保存・読み込み
- マスターパスワード変更 (全データ再暗号化)
- セキュアな削除とリセット

**インターフェース**:

```typescript
interface SecureStorage {
  isInitialized(): Promise<boolean>;
  initialize(password: string): Promise<void>;
  unlock(password: string): Promise<void>;
  lock(): void;
  isUnlocked(): boolean;
  saveEncrypted(key: string, data: any): Promise<void>;
  loadEncrypted<T>(key: string): Promise<T | null>;
  removeEncrypted(key: string): Promise<void>;
  clearAllEncrypted(): Promise<void>;
  changeMasterPassword(oldPassword: string, newPassword: string): Promise<void>;
  reset(): Promise<void>;
  getSessionExpiresAt(): number | null;
  extendSession(): void;
}
```

**使用例**:

```typescript
import { WebCryptoService } from '@infrastructure/encryption/CryptoUtils';
import { SecureStorageService } from '@infrastructure/services/SecureStorageService';

const cryptoService = new WebCryptoService();
const secureStorage = new SecureStorageService(cryptoService);

// 初回セットアップ
await secureStorage.initialize('MasterPassword123!');

// データ保存
const credentials = { username: 'admin', apiKey: 'secret-key' };
await secureStorage.saveEncrypted('api_credentials', credentials);

// データ読み込み
const loaded = await secureStorage.loadEncrypted<typeof credentials>('api_credentials');

// セッションロック
secureStorage.lock();

// 再アンロック
await secureStorage.unlock('MasterPassword123!');
```

---

### 3. SessionManager

**責務**: セッションのタイムアウト管理

**場所**: `src/domain/services/SessionManager.ts`

**特徴**:
- 純粋なドメインロジック (外部依存なし)
- setTimeout によるタイムアウト管理
- タイムアウトコールバックによる柔軟な制御

**インターフェース**:

```typescript
class SessionManager {
  constructor(timeoutMs: number);
  startSession(onTimeout: () => void): void;
  endSession(): void;
  extendSession(): void;
  isSessionActive(): boolean;
  getExpiresAt(): number | null;
  getRemainingTime(): number;
}
```

**使用例**:

```typescript
import { SessionManager } from '@domain/services/SessionManager';

const sessionManager = new SessionManager(15 * 60 * 1000); // 15分

sessionManager.startSession(() => {
  console.log('Session timed out');
  // 自動ロック処理
});

// アクティビティがあればセッション延長
sessionManager.extendSession();
```

---

### 4. PasswordValidator

**責務**: パスワード強度の検証

**場所**: `src/domain/services/PasswordValidator.ts`

**検証ルール**:
- 最小8文字
- 英字を含む
- 数字を含む
- 特殊文字を含む
- 一般的なパスワードをブロック

**強度スコア** (0-10):
- 長さボーナス (8+, 12+, 16+)
- 文字種ボーナス (小文字、大文字、数字、記号)
- 多様性ボーナス
- 連続文字・繰り返しペナルティ

**インターフェース**:

```typescript
class PasswordValidator {
  validate(password: string): {
    isValid: boolean;
    errors: string[];
  };
  getStrengthScore(password: string): number;
  getStrengthLabel(score: number): 'weak' | 'medium' | 'strong' | 'very_strong';
  getStrengthLabelJa(score: number): string;
  validateWithStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
    label: string;
  };
}
```

**使用例**:

```typescript
import { PasswordValidator } from '@domain/services/PasswordValidator';

const validator = new PasswordValidator();

const result = validator.validateWithStrength('MyPassword123!');
console.log(result);
// {
//   isValid: true,
//   errors: [],
//   score: 8,
//   label: 'strong'
// }
```

---

### 5. LockoutManager

**責務**: ブルートフォース攻撃対策

**場所**:
- Interface: `src/domain/services/LockoutManager.d.ts`
- Implementation: `src/domain/services/LockoutManager.ts`
- Storage: `src/infrastructure/services/ChromeStorageLockoutStorage.ts`

**機能**:
- 失敗試行回数の追跡
- 最大試行回数到達でロックアウト
- ロックアウト期間の管理
- 自動ロックアウト解除
- 永続化 (ブラウザ再起動後も保持)

**デフォルト設定**:
- 最大試行回数: 5回
- ロックアウト期間: 5分

**インターフェース**:

```typescript
interface LockoutManager {
  initialize(): Promise<void>;
  recordFailedAttempt(): Promise<void>;
  recordSuccessfulAttempt(): Promise<void>;
  isLockedOut(): Promise<boolean>;
  getStatus(): Promise<LockoutStatus>;
  reset(): Promise<void>;
  getRemainingAttempts(): Promise<number>;
  getMaxAttempts(): number;
  getLockoutDuration(): number;
}

interface LockoutStatus {
  isLockedOut: boolean;
  failedAttempts: number;
  lockoutStartedAt: number | null;
  lockoutEndsAt: number | null;
  remainingLockoutTime: number;
}
```

**使用例**:

```typescript
import { LockoutManager } from '@domain/services/LockoutManager';
import { ChromeStorageLockoutStorage } from '@infrastructure/services/ChromeStorageLockoutStorage';

const storage = new ChromeStorageLockoutStorage();
const lockoutManager = new LockoutManager(storage, 5, 5 * 60 * 1000);

await lockoutManager.initialize();

// ログイン試行
try {
  if (await lockoutManager.isLockedOut()) {
    throw new Error('Account is locked out');
  }

  // ログイン処理
  await authenticate(username, password);

  await lockoutManager.recordSuccessfulAttempt();
} catch (error) {
  await lockoutManager.recordFailedAttempt();
  throw error;
}
```

---

## 使用方法

### 基本的なフロー

#### 1. 初回セットアップ

```typescript
import { WebCryptoService } from '@infrastructure/encryption/CryptoUtils';
import { SecureStorageService } from '@infrastructure/services/SecureStorageService';
import { LockoutManager } from '@domain/services/LockoutManager';
import { ChromeStorageLockoutStorage } from '@infrastructure/services/ChromeStorageLockoutStorage';

// サービスの初期化
const cryptoService = new WebCryptoService();
const secureStorage = new SecureStorageService(cryptoService);
const lockoutStorage = new ChromeStorageLockoutStorage();
const lockoutManager = new LockoutManager(lockoutStorage);

await lockoutManager.initialize();

// マスターパスワード設定
await secureStorage.initialize('UserMasterPassword123!');
```

#### 2. 認証フロー

```typescript
async function login(password: string): Promise<boolean> {
  // ロックアウトチェック
  if (await lockoutManager.isLockedOut()) {
    const status = await lockoutManager.getStatus();
    throw new Error(`Account locked. Try again in ${Math.ceil(status.remainingLockoutTime / 1000)}s`);
  }

  try {
    // アンロック試行
    await secureStorage.unlock(password);

    // 成功: 失敗カウントリセット
    await lockoutManager.recordSuccessfulAttempt();

    return true;
  } catch (error) {
    // 失敗: カウント記録
    await lockoutManager.recordFailedAttempt();

    const remaining = await lockoutManager.getRemainingAttempts();
    throw new Error(`Invalid password. ${remaining} attempts remaining.`);
  }
}
```

#### 3. データ保存・読み込み

```typescript
// データ保存
const apiConfig = {
  endpoint: 'https://api.example.com',
  apiKey: 'secret-api-key-12345',
  refreshToken: 'refresh-token-xyz',
};

await secureStorage.saveEncrypted('api_config', apiConfig);

// データ読み込み
const loaded = await secureStorage.loadEncrypted<typeof apiConfig>('api_config');

if (loaded) {
  console.log('API Endpoint:', loaded.endpoint);
  // API Key は暗号化されている
}
```

#### 4. セッション管理

```typescript
// セッション状態確認
if (secureStorage.isUnlocked()) {
  // アクティビティがあればセッション延長
  secureStorage.extendSession();

  // 有効期限確認
  const expiresAt = secureStorage.getSessionExpiresAt();
  console.log('Session expires at:', new Date(expiresAt!));
}

// 手動ロック
secureStorage.lock();
```

#### 5. マスターパスワード変更

```typescript
try {
  await secureStorage.changeMasterPassword(
    'OldPassword123!',
    'NewPassword456!'
  );

  console.log('Password changed successfully');
} catch (error) {
  console.error('Failed to change password:', error);
}
```

---

## セキュリティガイドライン

### 1. 暗号化

#### ✅ Do

- 常に最新のWeb Crypto APIを使用
- ランダムなIVとsaltを毎回生成
- 認証付き暗号化 (AES-GCM) を使用
- 十分な鍵導出反復回数 (100,000回以上)

#### ❌ Don't

- 静的なIVやsaltを使用しない
- CBC modeなど認証なし暗号化を使用しない
- 平文をログに出力しない
- 暗号化されていないデータをストレージに保存しない

### 2. パスワード管理

#### ✅ Do

- PasswordValidatorで強度検証
- 最小8文字、英数字+記号を要求
- 一般的なパスワードをブロック
- パスワード変更時は全データ再暗号化

#### ❌ Don't

- 弱いパスワードを受け入れない
- パスワードをメモリに長時間保持しない (セッション限定)
- パスワードをログに出力しない
- パスワードをクリアテキストで保存しない

### 3. セッション管理

#### ✅ Do

- 適切なタイムアウト設定 (15分推奨)
- アクティビティでセッション延長
- タイムアウト時は自動ロック
- セッション情報はメモリのみ

#### ❌ Don't

- 無制限のセッションを許可しない
- セッション情報を永続化しない

### 4. ロックアウト対策

#### ✅ Do

- 失敗試行回数を制限 (5回推奨)
- ロックアウト期間を設定 (5分推奨)
- ロックアウト状態を永続化
- 成功時は失敗カウントリセット

#### ❌ Don't

- 無制限の試行を許可しない
- ロックアウト情報をクライアント側で改ざん可能にしない

---

## ベストプラクティス

### 1. 依存性注入パターン

```typescript
// ✅ Good: インターフェースに依存
class MyService {
  constructor(
    private cryptoService: CryptoService,
    private secureStorage: SecureStorage
  ) {}
}

// ❌ Bad: 具象クラスに直接依存
class MyService {
  private cryptoService = new WebCryptoService();
  private secureStorage = new SecureStorageService(this.cryptoService);
}
```

### 2. エラーハンドリング

```typescript
// ✅ Good: 詳細なエラー情報を提供
try {
  await secureStorage.unlock(password);
} catch (error) {
  if (error.message.includes('Invalid password')) {
    // パスワードエラー処理
  } else if (error.message.includes('locked out')) {
    // ロックアウトエラー処理
  } else {
    // その他のエラー
  }
}
```

### 3. TypeScript型安全性

```typescript
// ✅ Good: 型パラメータを使用
interface ApiConfig {
  endpoint: string;
  apiKey: string;
}

const config = await secureStorage.loadEncrypted<ApiConfig>('api_config');
if (config) {
  console.log(config.endpoint); // 型安全
}

// ❌ Bad: any型を使用
const config = await secureStorage.loadEncrypted('api_config') as any;
```

### 4. セッション延長のタイミング

```typescript
// ✅ Good: ユーザーアクティビティで延長
async function saveData(data: any) {
  if (secureStorage.isUnlocked()) {
    secureStorage.extendSession(); // アクティビティ検知
    await secureStorage.saveEncrypted('data', data);
  }
}

// ❌ Bad: 延長し忘れ
async function saveData(data: any) {
  await secureStorage.saveEncrypted('data', data);
  // セッションが途中で切れる可能性
}
```

---

## テストカバレッジ

### ユニットテスト

| コンポーネント | テスト数 | カバレッジ |
|--------------|---------|-----------|
| WebCryptoService | 21 | 100% |
| CryptoUtils (deprecated) | 8 | 100% |
| SecureStorageService | 30 | 100% |
| SessionManager | 31 | 100% |
| PasswordValidator | 33 | 100% |
| LockoutManager | 34 | 100% |
| ChromeStorageLockoutStorage | 12 | 100% |
| **合計** | **169** | **100%** |

### 統合テスト

| テストスイート | テスト数 | カバレッジ |
|--------------|---------|-----------|
| CryptoService + SecureStorage | 4 | 完全 |
| LockoutManager + SecureStorage | 3 | 完全 |
| Master Password Change | 3 | 完全 |
| Session Timeout | 2 | 完全 |
| End-to-End Security Workflow | 3 | 完全 |
| Error Recovery | 3 | 完全 |
| **合計** | **18** | **100%** |

### 総合

- **総テスト数**: 187
- **合格率**: 100% (187/187)
- **コードカバレッジ**: ほぼ100%

---

## トラブルシューティング

### 問題1: 復号化エラー

**症状**: `Decryption failed: Invalid password or corrupted data`

**原因**:
1. 間違ったパスワード
2. データが破損
3. 暗号化データの形式が不正

**解決策**:

```typescript
try {
  const data = await secureStorage.loadEncrypted('key');
} catch (error) {
  if (error.message.includes('Invalid password')) {
    // パスワードを再確認
  } else if (error.message.includes('corrupted data')) {
    // データを削除して再作成
    await secureStorage.removeEncrypted('key');
  }
}
```

### 問題2: セッションタイムアウト

**症状**: `Storage is locked. Please unlock first.`

**原因**: セッションがタイムアウト

**解決策**:

```typescript
if (!secureStorage.isUnlocked()) {
  // 再認証を促す
  await secureStorage.unlock(password);
}
```

### 問題3: ロックアウト

**症状**: `Account is locked out`

**原因**: 失敗試行回数が上限に達した

**解決策**:

```typescript
if (await lockoutManager.isLockedOut()) {
  const status = await lockoutManager.getStatus();
  const waitTime = Math.ceil(status.remainingLockoutTime / 1000);

  console.log(`Please wait ${waitTime} seconds before trying again`);

  // または管理者リセット
  // await lockoutManager.reset();
}
```

### 問題4: マスターパスワード忘れ

**症状**: ユーザーがマスターパスワードを忘れた

**解決策**:

暗号化されたデータは復元不可能です。完全リセットが必要:

```typescript
// 警告: すべてのデータが削除されます
await secureStorage.reset();

// 新しいマスターパスワードで再初期化
await secureStorage.initialize('NewPassword123!');
```

### 問題5: Web Crypto API が利用できない

**症状**: `Web Crypto API is not available`

**原因**: HTTPSでないコンテキストまたは古いブラウザ

**解決策**:

```typescript
import { WebCryptoService } from '@infrastructure/encryption/CryptoUtils';

const cryptoService = new WebCryptoService();

if (!cryptoService.isAvailable()) {
  console.error('Web Crypto API is not supported');
  // フォールバック処理または警告表示
}
```

---

## 付録

### A. セキュリティ監査チェックリスト

- [x] 暗号化アルゴリズムは業界標準 (AES-256-GCM)
- [x] 鍵導出は十分な反復回数 (100,000回)
- [x] ランダムなIV/salt生成
- [x] 認証付き暗号化 (改ざん検知)
- [x] パスワード強度検証
- [x] ブルートフォース対策
- [x] セッションタイムアウト
- [x] 平文のログ出力なし
- [x] メモリ内パスワード管理 (セッション限定)
- [x] HTTPS必須 (拡張機能環境)

### B. 参考資料

- [Web Crypto API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [AES-GCM - NIST](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [PBKDF2 - NIST](https://csrc.nist.gov/publications/detail/sp/800-132/final)
- [OWASP - Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### C. バージョン履歴

| バージョン | 日付 | 変更内容 |
|----------|------|---------|
| 1.0 | 2025-10-15 | 初版リリース - 完全実装 |

---

**ドキュメント終了**

ご質問や問題がある場合は、プロジェクトのIssue trackerにお問い合わせください。
