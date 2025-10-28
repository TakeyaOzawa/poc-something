# セキュリティ設計 - ソースコード難読化と localStorage 秘匿化

## 概要

Chrome拡張機能において、ソースコードの難読化とlocalStorageに保存される機密情報の秘匿化は重要なセキュリティ対策です。本ドキュメントでは、参照実装 (`/Users/takeya_ozawa/Downloads/hotel-booking-checker/secure-chrome-extension`) を基にした具体的な実装方法を記載します。

---

# 1. ソースコード難読化

## 1.1 目的

- **リバースエンジニアリング対策**: ビルド後のコードを解析困難にする
- **機密情報の保護**: 認証トークン、API エンドポイント等の漏洩防止
- **知的財産の保護**: アルゴリズムやビジネスロジックの保護

## 1.2 Webpack + Terser による難読化

### 1.2.1 webpack.config.js の更新

既存の `webpack.config.js` に以下の設定を追加：

```javascript
// webpack.config.js

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production', // 本番モード
  entry: {
    background: './src/presentation/background/index.ts',
    popup: './src/presentation/popup/index.ts',
    'xpath-manager': './src/presentation/xpath-manager/index.ts',
    'automation-variables-manager': './src/presentation/automation-variables-manager/index.ts',
    'content-script': './src/presentation/content-script/index.ts',
    'crypto-utils': './src/infrastructure/encryption/CryptoUtils.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true, // ビルド前にdistをクリーン
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@usecases': path.resolve(__dirname, 'src/usecases'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@presentation': path.resolve(__dirname, 'src/presentation'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  optimization: {
    minimize: true, // 最小化を有効化
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // 圧縮設定
          compress: {
            // console系を削除
            drop_console: true,
            drop_debugger: true,
            pure_funcs: [
              'console.log',
              'console.info',
              'console.debug',
              'console.trace',
            ],
            // 不要なコードを削除
            dead_code: true,
            unused: true,
            // より積極的な最適化
            passes: 3, // 最適化パス回数を増やす
            // 条件式の評価
            evaluate: true,
            // if文の簡略化
            conditionals: true,
            // 比較演算の最適化
            comparisons: true,
            // 変数の結合
            sequences: true,
            // 重複コードの削除
            join_vars: true,
          },
          // 変数名・プロパティ名のマングリング（難読化）
          mangle: {
            safari10: true,
            // 特定パターンのプロパティ名を難読化
            properties: {
              regex: /^_(secret|key|password|token|encrypted|auth|credential|private|internal)/,
            },
            // トップレベルの変数も難読化
            toplevel: true,
          },
          // 出力形式
          format: {
            comments: false, // コメントを削除
            ascii_only: false,
            ecma: 2020,
            semicolons: true,
            // 読みにくくするための設定
            beautify: false,
            indent_level: 0,
          },
          // クラス名・関数名を削除
          keep_classnames: false,
          keep_fnames: false,
        },
        extractComments: false, // ライセンスコメント等も削除
        parallel: true, // 並列処理でビルド高速化
      }),
    ],
    // コード分割を無効化（難読化効果を高める）
    splitChunks: false,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.' },
        { from: 'manifest.json', to: '.' },
      ],
    }),
  ],
  // ソースマップを無効化（重要: デバッグ情報を含めない）
  devtool: false,
  // パフォーマンス警告を無効化
  performance: {
    hints: false,
  },
};
```

### 1.2.2 package.json の更新

必要なパッケージを追加：

```json
{
  "name": "auto-fill-tool",
  "version": "1.0.0",
  "scripts": {
    "build": "webpack --mode production",
    "build:dev": "webpack --mode development",
    "watch": "webpack --mode development --watch",
    "build:secure": "npm run build && npm run verify-obfuscation"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.246",
    "copy-webpack-plugin": "^11.0.0",
    "terser-webpack-plugin": "^5.3.9",
    "ts-loader": "^9.5.0",
    "typescript": "^5.2.2",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "@types/node": "^20.0.0"
  }
}
```

### 1.2.3 難読化の確認

ビルド後、以下を確認：

```bash
# 本番ビルド実行
npm run build

# 出力ファイルサイズ確認（大幅に削減されているはず）
ls -lh dist/*.js

# 難読化の確認（変数名が a, b, c 等になっているか）
head -n 50 dist/background.js
```

## 1.3 追加の難読化手法

### 1.3.1 文字列の難読化

機密性の高い文字列（API エンドポイント、キー名等）を Base64 エンコードまたは簡易暗号化：

```typescript
// src/infrastructure/obfuscation/StringObfuscator.ts

export class StringObfuscator {
  /**
   * Base64エンコード
   */
  static encode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
  }

  /**
   * Base64デコード
   */
  static decode(encoded: string): string {
    return decodeURIComponent(escape(atob(encoded)));
  }

  /**
   * XOR簡易暗号化（コンパイル時に実行）
   */
  static xorEncrypt(str: string, key: number): string {
    return str
      .split('')
      .map((char) => String.fromCharCode(char.charCodeAt(0) ^ key))
      .join('');
  }

  /**
   * XOR復号化
   */
  static xorDecrypt(encrypted: string, key: number): string {
    return this.xorEncrypt(encrypted, key); // XORは対称暗号
  }
}

// 使用例: 機密文字列の難読化
const OBFUSCATED_API_ENDPOINT = StringObfuscator.encode('https://api.example.com/v1');
const OBFUSCATED_STORAGE_KEY = StringObfuscator.xorEncrypt('automationVariables', 0x42);

// 実行時に復元
const apiEndpoint = StringObfuscator.decode(OBFUSCATED_API_ENDPOINT);
const storageKey = StringObfuscator.xorDecrypt(OBFUSCATED_STORAGE_KEY, 0x42);
```

### 1.3.2 定数の難読化

```typescript
// src/domain/constants/ObfuscatedStorageKeys.ts

import { StringObfuscator } from '@infrastructure/obfuscation/StringObfuscator';

// ビルド時に難読化された文字列
const _k1 = 'eHBhdGhDb2xsZWN0aW9uQ1NW'; // xpathCollectionCSV (Base64)
const _k2 = 'd2Vic2l0ZUNvbmZpZ3M='; // websiteConfigs (Base64)
const _k3 = 'c3lzdGVtU2V0dGluZ3M='; // systemSettings (Base64)
const _k4 = 'YXV0b21hdGlvblZhcmlhYmxlcw=='; // automationVariables (Base64)
const _k5 = 'YXV0b21hdGlvblJlc3VsdHM='; // automationResults (Base64)

export const STORAGE_KEYS = {
  get XPATH_COLLECTION() { return StringObfuscator.decode(_k1); },
  get WEBSITE_CONFIGS() { return StringObfuscator.decode(_k2); },
  get SYSTEM_SETTINGS() { return StringObfuscator.decode(_k3); },
  get AUTOMATION_VARIABLES() { return StringObfuscator.decode(_k4); },
  get AUTOMATION_RESULTS() { return StringObfuscator.decode(_k5); },
} as const;
```

### 1.3.3 デッドコード挿入（オプション）

解析を困難にするため、使用されない関数を挿入：

```typescript
// src/infrastructure/obfuscation/DecoyCode.ts

/**
 * デコイコード: 実際には使用されない関数
 * 解析者を混乱させる目的
 */
export class DecoyCode {
  // 実際には呼ばれない
  private static _unused1(): void {
    const fakeToken = 'fake_token_12345';
    const fakeEndpoint = 'https://fake.api.com';
    console.log(fakeToken, fakeEndpoint);
  }

  private static _unused2(): void {
    const fakeData = { key: 'value', secret: 'not_real' };
    localStorage.setItem('fake_key', JSON.stringify(fakeData));
  }

  // 実際のコードに混在させる
  static initialize(): void {
    // 何もしない（または最小限の処理）
  }
}
```

---

# 2. localStorage 秘匿化

## 2.1 目的

- **機密情報の保護**: パスワード、トークン、個人情報等の暗号化
- **傍受対策**: DevTools 等で localStorage を閲覧されても内容が分からないようにする
- **改ざん防止**: 暗号化により、データの改ざんを検出可能に

## 2.2 暗号化アーキテクチャ

### 2.2.1 マスターパスワード方式

ユーザーが設定したマスターパスワードを使用して、すべての localStorage データを暗号化します。

```
[ユーザー]
    ↓ マスターパスワード入力
[PBKDF2 鍵導出]
    ↓ 100,000 iterations + salt
[暗号化キー (AES-256)]
    ↓
[localStorage データ暗号化]
    ↓
[chrome.storage.local に保存]
    - 暗号化データ
    - IV (初期化ベクトル)
    - salt
```

### 2.2.2 実装: CryptoUtils

```typescript
// src/infrastructure/encryption/CryptoUtils.ts

export interface EncryptedData {
  encryptedData: number[]; // 暗号化されたデータ（配列形式）
  iv: number[]; // 初期化ベクトル
}

export class CryptoUtils {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly PBKDF2_ITERATIONS = 100000; // OWASP推奨: 100,000回以上
  private readonly IV_LENGTH = 12; // AES-GCMの推奨IV長
  private readonly SALT_LENGTH = 16;

  /**
   * 暗号化キーを生成
   */
  async generateEncryptionKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // exportable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 暗号化キーをエクスポート（保存用）
   */
  async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  /**
   * 暗号化キーをインポート（読み込み用）
   */
  async importKey(keyData: string): Promise<CryptoKey> {
    const keyObject = JSON.parse(keyData);
    return await crypto.subtle.importKey(
      'jwk',
      keyObject,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * パスワードから暗号化キーを導出（PBKDF2）
   */
  async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // パスワードから基本キーを作成
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // PBKDF2で暗号化キーを導出
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * データを暗号化
   */
  async encryptData(data: string, key: CryptoKey): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    // ランダムなIVを生成
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    // AES-GCMで暗号化
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      encodedData
    );

    return {
      encryptedData: Array.from(new Uint8Array(encryptedBuffer)),
      iv: Array.from(iv),
    };
  }

  /**
   * データを復号化
   */
  async decryptData(encryptedObj: EncryptedData, key: CryptoKey): Promise<string> {
    const encryptedData = new Uint8Array(encryptedObj.encryptedData);
    const iv = new Uint8Array(encryptedObj.iv);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      throw new Error('Decryption failed: Invalid key or corrupted data');
    }
  }

  /**
   * マスターパスワード初期化（初回のみ）
   */
  async initializeWithPassword(password: string): Promise<CryptoKey> {
    // ランダムなsaltを生成
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));

    // saltを保存
    await chrome.storage.local.set({
      _salt: Array.from(salt),
      _initialized: true,
    });

    // パスワードから暗号化キーを導出
    return await this.deriveKeyFromPassword(password, salt);
  }

  /**
   * マスターパスワードから暗号化キーを取得
   */
  async getKeyFromPassword(password: string): Promise<CryptoKey> {
    const result = await chrome.storage.local.get('_salt');

    if (!result._salt) {
      throw new Error('Not initialized. Please set master password first.');
    }

    const salt = new Uint8Array(result._salt);
    return await this.deriveKeyFromPassword(password, salt);
  }

  /**
   * 暗号化してchrome.storage.localに保存
   */
  async saveEncrypted(storageKey: string, plaintext: string, encryptionKey: CryptoKey): Promise<void> {
    const encrypted = await this.encryptData(plaintext, encryptionKey);
    await chrome.storage.local.set({ [storageKey]: encrypted });
  }

  /**
   * chrome.storage.localから読み込んで復号化
   */
  async loadEncrypted(storageKey: string, encryptionKey: CryptoKey): Promise<string | null> {
    const result = await chrome.storage.local.get(storageKey);

    if (!result[storageKey]) {
      return null;
    }

    return await this.decryptData(result[storageKey], encryptionKey);
  }

  /**
   * 初期化済みかチェック
   */
  async isInitialized(): Promise<boolean> {
    const result = await chrome.storage.local.get('_initialized');
    return result._initialized === true;
  }
}
```

### 2.2.3 実装: SecureStorageService

既存のRepositoryと統合するためのサービス：

```typescript
// src/infrastructure/services/SecureStorageService.ts

import { CryptoUtils } from '@infrastructure/encryption/CryptoUtils';
import { ILogger } from '@domain/services/ILogger';

export class SecureStorageService {
  private cryptoUtils: CryptoUtils;
  private encryptionKey: CryptoKey | null = null;
  private sessionTimeout: number | null = null;
  private readonly SESSION_DURATION = 15 * 60 * 1000; // 15分

  constructor(private logger: ILogger) {
    this.cryptoUtils = new CryptoUtils();
  }

  /**
   * マスターパスワードで初期化
   */
  async initialize(password: string): Promise<void> {
    this.logger.info('Initializing secure storage with master password');
    this.encryptionKey = await this.cryptoUtils.initializeWithPassword(password);
    this.startSessionTimer();
  }

  /**
   * マスターパスワードでアンロック
   */
  async unlock(password: string): Promise<void> {
    this.logger.info('Unlocking secure storage');
    this.encryptionKey = await this.cryptoUtils.getKeyFromPassword(password);
    this.startSessionTimer();
  }

  /**
   * ロック（暗号化キーをメモリから削除）
   */
  lock(): void {
    this.logger.info('Locking secure storage');
    this.encryptionKey = null;
    if (this.sessionTimeout !== null) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * アンロック状態かチェック
   */
  isUnlocked(): boolean {
    return this.encryptionKey !== null;
  }

  /**
   * 暗号化して保存
   */
  async saveEncrypted(key: string, data: any): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Storage is locked. Please unlock first.');
    }

    const plaintext = JSON.stringify(data);
    await this.cryptoUtils.saveEncrypted(key, plaintext, this.encryptionKey);
    this.logger.info(`Encrypted data saved: ${key}`);
  }

  /**
   * 復号化して読み込み
   */
  async loadEncrypted<T>(key: string): Promise<T | null> {
    if (!this.encryptionKey) {
      throw new Error('Storage is locked. Please unlock first.');
    }

    const plaintext = await this.cryptoUtils.loadEncrypted(key, this.encryptionKey);
    if (!plaintext) {
      return null;
    }

    return JSON.parse(plaintext) as T;
  }

  /**
   * セッションタイマー開始
   */
  private startSessionTimer(): void {
    if (this.sessionTimeout !== null) {
      clearTimeout(this.sessionTimeout);
    }

    this.sessionTimeout = setTimeout(() => {
      this.logger.warn('Session expired. Locking secure storage.');
      this.lock();
    }, this.SESSION_DURATION) as any;

    // Chrome alarms API も使用（バックグラウンドでも動作）
    chrome.alarms.clear('session-timer');
    chrome.alarms.create('session-timer', {
      delayInMinutes: this.SESSION_DURATION / 60000,
    });
  }

  /**
   * 初期化済みかチェック
   */
  async isInitialized(): Promise<boolean> {
    return await this.cryptoUtils.isInitialized();
  }
}
```

## 2.3 Repository への統合

### 2.3.1 SecureAutomationVariablesRepository

既存の `ChromeStorageAutomationVariablesRepository` を拡張：

```typescript
// src/infrastructure/repositories/SecureAutomationVariablesRepository.ts

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables, AutomationVariablesData } from '@domain/entities/AutomationVariables';
import { SecureStorageService } from '@infrastructure/services/SecureStorageService';
import { ILogger } from '@domain/services/ILogger';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';

export class SecureAutomationVariablesRepository implements AutomationVariablesRepository {
  constructor(
    private secureStorage: SecureStorageService,
    private logger: ILogger
  ) {}

  async save(variables: AutomationVariables): Promise<void> {
    try {
      const id = variables.getId();
      const data = variables.toData();

      // 既存データを読み込み
      const storage = await this.loadStorage();

      // 更新または追加
      const existingIndex = storage.findIndex((v) => v.id === id);
      if (existingIndex >= 0) {
        storage[existingIndex] = data;
        this.logger.info(`Automation variables updated (encrypted): ${id}`);
      } else {
        storage.push(data);
        this.logger.info(`Automation variables created (encrypted): ${id}`);
      }

      // 暗号化して保存
      await this.saveStorage(storage);
    } catch (error) {
      this.logger.error('Failed to save automation variables', error);
      throw new Error('Failed to save automation variables');
    }
  }

  async load(idOrWebsiteId: string): Promise<AutomationVariables | null> {
    try {
      const storage = await this.loadStorage();
      const data = storage.find((v) => v.id === idOrWebsiteId || v.websiteId === idOrWebsiteId);

      if (!data) {
        return null;
      }

      return AutomationVariables.fromExisting(data);
    } catch (error) {
      this.logger.error('Failed to load automation variables', error);
      return null;
    }
  }

  async loadAll(): Promise<AutomationVariables[]> {
    try {
      const storage = await this.loadStorage();
      return storage.map((data) => AutomationVariables.fromExisting(data));
    } catch (error) {
      this.logger.error('Failed to load all automation variables', error);
      return [];
    }
  }

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
        this.logger.info(`Automation variables deleted (encrypted): ${idOrWebsiteId}`);
      }
    } catch (error) {
      this.logger.error('Failed to delete automation variables', error);
      throw new Error('Failed to delete automation variables');
    }
  }

  async exists(idOrWebsiteId: string): Promise<boolean> {
    try {
      const storage = await this.loadStorage();
      return storage.some((v) => v.id === idOrWebsiteId || v.websiteId === idOrWebsiteId);
    } catch (error) {
      this.logger.error('Failed to check automation variables existence', error);
      return false;
    }
  }

  /**
   * 暗号化されたストレージから読み込み
   */
  private async loadStorage(): Promise<AutomationVariablesData[]> {
    const data = await this.secureStorage.loadEncrypted<AutomationVariablesData[]>(
      STORAGE_KEYS.AUTOMATION_VARIABLES
    );
    return data || [];
  }

  /**
   * 暗号化してストレージに保存
   */
  private async saveStorage(data: AutomationVariablesData[]): Promise<void> {
    await this.secureStorage.saveEncrypted(STORAGE_KEYS.AUTOMATION_VARIABLES, data);
  }
}
```

## 2.4 UI での実装

### 2.4.1 マスターパスワード設定画面

初回起動時、ユーザーにマスターパスワードを設定させる：

```html
<!-- public/master-password-setup.html -->

<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>マスターパスワード設定</title>
  <style>
    body {
      width: 400px;
      padding: 20px;
      font-family: sans-serif;
    }
    .error { color: red; }
    .success { color: green; }
    input[type="password"] {
      width: 100%;
      padding: 8px;
      margin: 10px 0;
      box-sizing: border-box;
    }
    button {
      padding: 10px 20px;
      cursor: pointer;
    }
    .strength-indicator {
      height: 10px;
      background: #ddd;
      margin: 10px 0;
      border-radius: 5px;
    }
    .strength-bar {
      height: 100%;
      border-radius: 5px;
      transition: width 0.3s, background 0.3s;
    }
  </style>
</head>
<body>
  <h2>🔒 マスターパスワード設定</h2>
  <p>すべてのデータを暗号化するためのマスターパスワードを設定してください。</p>

  <label>マスターパスワード:</label>
  <input type="password" id="password" placeholder="8文字以上、英数記号を含む" />

  <div class="strength-indicator">
    <div class="strength-bar" id="strengthBar"></div>
  </div>
  <div id="strengthLabel"></div>

  <label>確認用（再入力）:</label>
  <input type="password" id="passwordConfirm" placeholder="もう一度入力" />

  <div id="message"></div>

  <button id="setupBtn">設定する</button>

  <script src="master-password-setup.js"></script>
</body>
</html>
```

```typescript
// src/presentation/master-password-setup/index.ts

import { PasswordValidator } from '@infrastructure/security/PasswordValidator';

const passwordValidator = new PasswordValidator();

document.getElementById('password')!.addEventListener('input', (e) => {
  const password = (e.target as HTMLInputElement).value;
  const score = passwordValidator.getStrengthScore(password);
  const label = passwordValidator.getStrengthLabel(score);

  const strengthBar = document.getElementById('strengthBar')!;
  const strengthLabel = document.getElementById('strengthLabel')!;

  strengthBar.style.width = `${score * 10}%`;
  strengthBar.style.background = getStrengthColor(score);
  strengthLabel.textContent = `強度: ${label} (${score}/10)`;
});

document.getElementById('setupBtn')!.addEventListener('click', async () => {
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const passwordConfirm = (document.getElementById('passwordConfirm') as HTMLInputElement).value;
  const messageDiv = document.getElementById('message')!;

  // パスワード検証
  const validation = passwordValidator.validate(password);
  if (!validation.valid) {
    messageDiv.className = 'error';
    messageDiv.textContent = validation.errors.join('\n');
    return;
  }

  // 確認用パスワードチェック
  if (password !== passwordConfirm) {
    messageDiv.className = 'error';
    messageDiv.textContent = 'パスワードが一致しません';
    return;
  }

  // マスターパスワード初期化
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'initializeMasterPassword',
      password: password,
    });

    if (response.success) {
      messageDiv.className = 'success';
      messageDiv.textContent = '✅ マスターパスワードが設定されました！';

      // 3秒後にメイン画面に遷移
      setTimeout(() => {
        window.location.href = 'popup.html';
      }, 3000);
    } else {
      messageDiv.className = 'error';
      messageDiv.textContent = response.error;
    }
  } catch (error: any) {
    messageDiv.className = 'error';
    messageDiv.textContent = `エラー: ${error.message}`;
  }
});

function getStrengthColor(score: number): string {
  if (score <= 3) return '#f44336'; // 赤
  if (score <= 5) return '#ff9800'; // オレンジ
  if (score <= 7) return '#4caf50'; // 緑
  return '#2196f3'; // 青
}
```

### 2.4.2 アンロック画面

拡張機能使用時、マスターパスワードでアンロック：

```html
<!-- public/unlock.html -->

<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>アンロック</title>
  <style>
    body {
      width: 300px;
      padding: 20px;
      font-family: sans-serif;
      text-align: center;
    }
    .error { color: red; margin: 10px 0; }
    input[type="password"] {
      width: 100%;
      padding: 8px;
      margin: 10px 0;
      box-sizing: border-box;
    }
    button {
      padding: 10px 20px;
      cursor: pointer;
      width: 100%;
    }
  </style>
</head>
<body>
  <h2>🔒 アンロック</h2>
  <p>マスターパスワードを入力してください</p>

  <input type="password" id="password" placeholder="マスターパスワード" />

  <div id="message"></div>
  <div id="lockoutMessage"></div>

  <button id="unlockBtn">アンロック</button>

  <script src="unlock.js"></script>
</body>
</html>
```

### 2.4.3 Background Service Worker での管理

```typescript
// src/presentation/background/index.ts への追加

import { SecureStorageService } from '@infrastructure/services/SecureStorageService';
import { LockoutManager } from '@infrastructure/security/LockoutManager';
import { PasswordValidator } from '@infrastructure/security/PasswordValidator';

const secureStorage = new SecureStorageService(logger);
const lockoutManager = new LockoutManager();
const passwordValidator = new PasswordValidator();

// メッセージハンドラーに追加
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleSecureStorageMessage(request, sender, sendResponse);
  return true;
});

async function handleSecureStorageMessage(
  request: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  try {
    switch (request.action) {
      case 'initializeMasterPassword':
        await handleInitializeMasterPassword(request.password, sendResponse);
        break;

      case 'unlockStorage':
        await handleUnlockStorage(request.password, sendResponse);
        break;

      case 'lockStorage':
        secureStorage.lock();
        sendResponse({ success: true, message: 'ロックしました' });
        break;

      case 'checkStorageStatus':
        const isUnlocked = secureStorage.isUnlocked();
        const isInitialized = await secureStorage.isInitialized();
        sendResponse({ success: true, isUnlocked, isInitialized });
        break;

      default:
        // 既存のメッセージ処理
        break;
    }
  } catch (error: any) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleInitializeMasterPassword(
  password: string,
  sendResponse: (response: any) => void
) {
  // パスワード検証
  const validation = passwordValidator.validate(password);
  if (!validation.valid) {
    sendResponse({ success: false, error: validation.errors.join('\n') });
    return;
  }

  try {
    await secureStorage.initialize(password);
    await lockoutManager.recordSuccessfulAttempt();
    sendResponse({ success: true, message: 'マスターパスワードが設定されました' });
  } catch (error: any) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUnlockStorage(
  password: string,
  sendResponse: (response: any) => void
) {
  // ロックアウトチェック
  const isLocked = await lockoutManager.isLocked();
  if (isLocked) {
    const remainingTime = await lockoutManager.getRemainingLockTime();
    const formattedTime = lockoutManager.formatRemainingTime(remainingTime);
    sendResponse({
      success: false,
      error: `ログイン試行回数が上限に達しました。${formattedTime}後に再試行してください。`,
    });
    return;
  }

  try {
    await secureStorage.unlock(password);
    await lockoutManager.recordSuccessfulAttempt();
    sendResponse({ success: true, message: 'アンロックしました' });
  } catch (error: any) {
    await lockoutManager.recordFailedAttempt();
    const remainingAttempts = await lockoutManager.getRemainingAttempts();
    const isNowLocked = await lockoutManager.isLocked();

    if (isNowLocked) {
      const remainingTime = await lockoutManager.getRemainingLockTime();
      const formattedTime = lockoutManager.formatRemainingTime(remainingTime);
      sendResponse({
        success: false,
        error: `ログイン試行回数が上限に達しました。${formattedTime}後に再試行してください。`,
      });
    } else {
      sendResponse({
        success: false,
        error: `パスワードが間違っています（残り${remainingAttempts}回）`,
      });
    }
  }
}

// セッション期限切れ通知
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'session-timer') {
    secureStorage.lock();
    chrome.runtime.sendMessage({ action: 'sessionExpired' }).catch(() => {});
  }
});

// アイドル時に自動ロック
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'locked' || state === 'idle') {
    secureStorage.lock();
  }
});
```

## 2.5 セキュリティ補助機能

### 2.5.1 PasswordValidator

```typescript
// src/infrastructure/security/PasswordValidator.ts

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export class PasswordValidator {
  private readonly MIN_LENGTH = 8;

  /**
   * パスワードを検証
   */
  validate(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // 最小文字数
    if (password.length < this.MIN_LENGTH) {
      errors.push(`パスワードは${this.MIN_LENGTH}文字以上である必要があります`);
    }

    // 英字を含む
    if (!/[A-Za-z]/.test(password)) {
      errors.push('英字を1文字以上含める必要があります');
    }

    // 数字を含む
    if (!/[0-9]/.test(password)) {
      errors.push('数字を1文字以上含める必要があります');
    }

    // 記号を含む
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('記号を1文字以上含める必要があります');
    }

    // 一般的なパスワードをブロック
    const commonPasswords = [
      'password',
      'password123',
      'admin123',
      '12345678',
      'qwerty123',
      'abc12345',
      'test1234',
      'password1!',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('このパスワードは一般的すぎます。別のパスワードを使用してください');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * パスワード強度スコア (0-10)
   */
  getStrengthScore(password: string): number {
    let score = 0;

    // 長さによる加点
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // 文字種による加点
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // 文字の多様性
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score++;

    // 連続文字・繰り返しのペナルティ
    if (/(.)\1{2,}/.test(password)) score--; // 3文字以上の繰り返し
    if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde/.test(password.toLowerCase()))
      score--; // 連続文字

    return Math.max(0, Math.min(score, 10));
  }

  /**
   * パスワード強度ラベル
   */
  getStrengthLabel(score: number): string {
    if (score <= 3) return '弱い';
    if (score <= 5) return '中程度';
    if (score <= 7) return '強い';
    return '非常に強い';
  }
}
```

### 2.5.2 LockoutManager

```typescript
// src/infrastructure/security/LockoutManager.ts

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
  consecutiveFailures: number;
}

export class LockoutManager {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATIONS = [
    30 * 1000, // 1回目: 30秒
    60 * 1000, // 2回目: 1分
    5 * 60 * 1000, // 3回目: 5分
    15 * 60 * 1000, // 4回目: 15分
    60 * 60 * 1000, // 5回目以降: 1時間
  ];

  async getState(): Promise<LockoutState> {
    const result = await chrome.storage.local.get([
      '_failedAttempts',
      '_lockedUntil',
      '_consecutiveFailures',
    ]);
    return {
      failedAttempts: result._failedAttempts || 0,
      lockedUntil: result._lockedUntil || null,
      consecutiveFailures: result._consecutiveFailures || 0,
    };
  }

  async isLocked(): Promise<boolean> {
    const state = await this.getState();

    if (state.lockedUntil === null) {
      return false;
    }

    const now = Date.now();
    if (now < state.lockedUntil) {
      return true;
    }

    // ロック期限が過ぎた場合、リセット
    await chrome.storage.local.set({ _lockedUntil: null });
    return false;
  }

  async getRemainingLockTime(): Promise<number> {
    const state = await this.getState();

    if (state.lockedUntil === null) {
      return 0;
    }

    const remaining = state.lockedUntil - Date.now();
    return Math.max(0, remaining);
  }

  async recordFailedAttempt(): Promise<void> {
    const state = await this.getState();
    const newFailedAttempts = state.failedAttempts + 1;
    const newConsecutiveFailures = state.consecutiveFailures + 1;

    if (newFailedAttempts >= this.MAX_ATTEMPTS) {
      // ロックアウト発動
      const lockoutIndex = Math.min(
        newConsecutiveFailures - 1,
        this.LOCKOUT_DURATIONS.length - 1
      );
      const lockoutDuration = this.LOCKOUT_DURATIONS[lockoutIndex];
      const lockedUntil = Date.now() + lockoutDuration;

      await chrome.storage.local.set({
        _failedAttempts: 0,
        _lockedUntil: lockedUntil,
        _consecutiveFailures: newConsecutiveFailures,
      });
    } else {
      await chrome.storage.local.set({
        _failedAttempts: newFailedAttempts,
        _consecutiveFailures: newConsecutiveFailures,
      });
    }
  }

  async recordSuccessfulAttempt(): Promise<void> {
    await chrome.storage.local.set({
      _failedAttempts: 0,
      _lockedUntil: null,
      _consecutiveFailures: 0,
    });
  }

  async getRemainingAttempts(): Promise<number> {
    const state = await this.getState();
    return Math.max(0, this.MAX_ATTEMPTS - state.failedAttempts);
  }

  formatRemainingTime(milliseconds: number): string {
    const seconds = Math.ceil(milliseconds / 1000);

    if (seconds < 60) {
      return `${seconds}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes}分`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.ceil((seconds % 3600) / 60);
      if (minutes > 0) {
        return `${hours}時間${minutes}分`;
      }
      return `${hours}時間`;
    }
  }
}
```

---

# 3. 実装手順

## Phase 1: 難読化設定 (1日)

- [ ] webpack.config.js に Terser 設定追加
- [ ] package.json に必要なパッケージ追加
- [ ] npm install 実行
- [ ] StringObfuscator 実装
- [ ] ビルドして難読化を確認

## Phase 2: 暗号化基盤 (2日)

- [ ] CryptoUtils 実装
- [ ] SecureStorageService 実装
- [ ] PasswordValidator 実装
- [ ] LockoutManager 実装
- [ ] ユニットテスト作成

## Phase 3: Repository 統合 (2日)

- [ ] SecureAutomationVariablesRepository 実装
- [ ] SecureWebsiteRepository 実装（必要に応じて）
- [ ] SecureXPathRepository 実装（必要に応じて）
- [ ] 統合テスト作成

## Phase 4: UI 実装 (3日) - ✅ 完了 (100%完了) **← 2025-10-16 完成**

### Domain層 (100%完了) ✅
- [x] Result 型実装 (generic wrapper) - 115行
- [x] PasswordStrength 値オブジェクト実装 - 195行
- [x] MasterPasswordRequirements 値オブジェクト実装 - 166行
- [x] UnlockStatus 値オブジェクト実装 - 212行
- [x] MasterPasswordPolicy エンティティ実装 - 187行

### Use Case層 (100%完了) ✅
- [x] InitializeMasterPasswordUseCase 実装 - 52行
- [x] UnlockStorageUseCase 実装 - 75行
- [x] LockStorageUseCase 実装 - 28行
- [x] CheckUnlockStatusUseCase 実装 - 49行

### テスト (100%完了) ✅
- [x] Domain層テスト (5テストファイル、約1,700行、約250テストケース)
- [x] Use Case層テスト (4テストファイル、約1,800行、約150テストケース)
- [x] E2E統合テスト (1ファイル、約470行、22テストケース、100%合格)
- [x] webextension-polyfill モック実装 (約110行)
- [x] テスト隔離問題の修正 (100%達成)

### Presentation層 (100%完了) ✅
- [x] マスターパスワード設定画面実装 (HTML/CSS/TS、約600行)
- [x] アンロック画面実装 (HTML/CSS/TS、約720行)
- [x] Background Service Worker にメッセージハンドラー追加 (約170行)
- [x] セッション管理実装 (Alarms API + Idle API)
- [x] 多言語対応 (i18n) 実装 (en/ja、約80メッセージ、約400行)
- [x] webpack設定更新 (エントリーポイント追加)

**設計原則**: Domain-Driven Design (DDD)
- すべてのビジネスロジックをDomain層に配置
- Use Case層は最小限のオーケストレーションのみ (20-80行/ファイル)
- Presentation層は最小限のUI処理のみ

**実装統計**:
- 実装ファイル: 17ファイル、約3,300行
  - Domain層: 5ファイル、790行
  - Use Case層: 4ファイル、222行
  - Presentation層: 4ファイル、約1,490行
  - i18n: 2ファイル、約400行
- テストファイル: 13ファイル、約4,990行
  - Unit テスト: 約400テストケース (100%合格)
  - 統合テスト: 22テストケース (100%合格)
  - 総計: 約422テストケース

**技術的達成**:
1. ✅ Domain-Driven Design (DDD) の完全実装
2. ✅ Result Pattern による型安全なエラーハンドリング
3. ✅ Value Object による不変性の保証
4. ✅ Progressive Lockout によるセキュリティ強化
5. ✅ Web Crypto API による AES-256-GCM 暗号化
6. ✅ Jest による包括的なテストカバレッジ (100%)
7. ✅ i18n による多言語サポート (英語/日本語)
8. ✅ E2E 統合テストによる完全な機能検証

**参照ドキュメント**:
- [MASTER_PASSWORD_UI_DESIGN.md](./MASTER_PASSWORD_UI_DESIGN.md) - 詳細設計書
- [section-3.4-progress.md](./section-3.4-progress.md) - 実装進捗レポート (約1,300行)

## Phase 5: テスト & ドキュメント (2日)

- [ ] E2E テスト実施
- [ ] セキュリティレビュー
- [ ] ユーザーマニュアル作成
- [ ] トラブルシューティングガイド作成

---

# 4. セキュリティベストプラクティス

## 4.1 開発時の注意事項

1. **devtoolを無効化**: `webpack.config.js` で `devtool: false` に設定
2. **本番ビルドを使用**: 必ず `npm run build` (production mode) でビルド
3. **ソースマップを含めない**: dist に .map ファイルが含まれないことを確認
4. **console.log を削除**: Terser で `drop_console: true` に設定
5. **機密情報をハードコードしない**: 環境変数または暗号化して保存

## 4.2 ユーザーへの注意喚起

マスターパスワード設定画面で以下を表示：

```
⚠️ 重要な注意事項

1. マスターパスワードは忘れないでください
   → 忘れた場合、すべてのデータが復元不可能になります

2. 安全なパスワードを使用してください
   → 8文字以上、英数字・記号を含む

3. マスターパスワードを他人と共有しないでください

4. 定期的にパスワードを変更することを推奨します
```

## 4.3 監査ログ

重要な操作をログに記録（オプション）：

```typescript
// src/infrastructure/security/AuditLogger.ts

export class AuditLogger {
  async logEvent(event: {
    action: string;
    success: boolean;
    timestamp: string;
    details?: string;
  }): Promise<void> {
    const logs = await this.loadLogs();
    logs.push(event);

    // 最新100件のみ保持
    if (logs.length > 100) {
      logs.shift();
    }

    await chrome.storage.local.set({ _auditLogs: logs });
  }

  private async loadLogs(): Promise<any[]> {
    const result = await chrome.storage.local.get('_auditLogs');
    return result._auditLogs || [];
  }
}
```

---

# 5. パフォーマンスとのトレードオフ

## 5.1 暗号化によるオーバーヘッド

- **初期化**: 約100-200ms (PBKDF2による鍵導出)
- **暗号化**: 約1-5ms / データ
- **復号化**: 約1-5ms / データ

## 5.2 最適化

- **バッチ処理**: 複数データをまとめて暗号化
- **キャッシュ**: 頻繁にアクセスするデータはメモリにキャッシュ
- **遅延読み込み**: 必要なデータのみ復号化

---

# 6. リスク評価

## 6.1 脅威モデル

| 脅威 | 対策 | リスクレベル |
|------|------|------------|
| DevTools での localStorage 閲覧 | 暗号化 | 低 |
| ソースコード解析 | 難読化 | 低-中 |
| マスターパスワードのブルートフォース | PBKDF2 + ロックアウト | 低 |
| セッションハイジャック | セッションタイムアウト | 低 |
| メモリダンプ | メモリから暗号化キーを削除 | 中 |

## 6.2 残存リスク

1. **高度な攻撃**: 難読化は完全な保護ではない
2. **ユーザーの弱いパスワード**: ユーザー次第
3. **ブラウザの脆弱性**: Chrome自体の脆弱性には対処不可

---

# 7. まとめ

本設計により、以下のセキュリティ対策が実現されます：

✅ **ソースコード難読化**: Webpack + Terser による変数名マングリング、console削除、コメント削除
✅ **localStorage 暗号化**: AES-GCM + PBKDF2 によるマスターパスワード方式
✅ **セッション管理**: タイムアウト、アイドル検出、自動ロック
✅ **ロックアウト機能**: 連続失敗時のロックアウト（段階的な期間延長）
✅ **パスワード検証**: 強度チェック、一般的なパスワードのブロック

これらの対策により、機密情報の漏洩リスクを大幅に低減できます。
