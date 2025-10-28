# Advanced Features Proposal

## 概要

本ドキュメントでは、Auto-Fill Tool拡張機能の高度な機能追加について、技術的な実装方針、セキュリティ考察、UI/UX設計を詳述します。

---

## 1. マルチランゲージ対応

### 現状分析

**現在の言語実装:**
- UI要素: 日本語ハードコーディング
- エラーメッセージ: 日本語文字列
- ログメッセージ: 英語と日本語混在
- ドキュメント: 日本語

**対象言語:**
| 言語 | 優先度 | 市場規模 | 実装難易度 |
|------|-------|---------|----------|
| 日本語 (ja) | 🔴 必須 | 大 | - (既存) |
| 英語 (en) | 🔴 必須 | 最大 | 中 |
| 中国語簡体字 (zh-CN) | 🟡 推奨 | 大 | 中 |
| 韓国語 (ko) | 🟡 推奨 | 中 | 中 |
| スペイン語 (es) | 🟢 追加 | 大 | 中 |
| フランス語 (fr) | 🟢 追加 | 中 | 中 |
| ドイツ語 (de) | 🟢 追加 | 中 | 中 |

---

### 実装方針

#### アプローチ1: Chrome Extension i18n API（推奨）

**メリット:**
- Chrome標準機能
- 追加ライブラリ不要
- パフォーマンス最適
- マニフェストで自動切替

**デメリット:**
- JSON形式のみ
- 動的な文字列補間が制限的

**実装例:**

**ディレクトリ構造:**
```
auto-fill-tool/
├── public/
│   └── _locales/
│       ├── ja/
│       │   └── messages.json
│       ├── en/
│       │   └── messages.json
│       ├── zh_CN/
│       │   └── messages.json
│       └── ko/
│           └── messages.json
├── src/
│   ├── i18n/
│   │   ├── I18nService.ts
│   │   └── messages.ts
```

**messages.json構造（日本語）:**
```json
{
  "extensionName": {
    "message": "自動入力ツール",
    "description": "拡張機能の名前"
  },
  "popup_execute": {
    "message": "実行",
    "description": "実行ボタンのラベル"
  },
  "popup_status_enabled": {
    "message": "有効",
    "description": "ステータス: 有効"
  },
  "popup_status_disabled": {
    "message": "無効",
    "description": "ステータス: 無効"
  },
  "error_xpath_not_found": {
    "message": "要素が見つかりませんでした",
    "description": "XPath要素が見つからない場合のエラー"
  },
  "notification_autofill_success": {
    "message": "自動入力が完了しました（$STEPS$ ステップ処理）",
    "description": "自動入力成功通知",
    "placeholders": {
      "steps": {
        "content": "$1",
        "example": "5"
      }
    }
  },
  "xpath_manager_title": {
    "message": "XPath管理",
    "description": "XPath管理画面のタイトル"
  },
  "action_type_input": {
    "message": "入力",
    "description": "アクションタイプ: 入力"
  },
  "action_type_click": {
    "message": "クリック",
    "description": "アクションタイプ: クリック"
  },
  "action_type_check": {
    "message": "チェック",
    "description": "アクションタイプ: チェック"
  },
  "action_type_select": {
    "message": "選択",
    "description": "アクションタイプ: セレクト"
  }
}
```

**messages.json構造（英語）:**
```json
{
  "extensionName": {
    "message": "Auto-Fill Tool",
    "description": "Extension name"
  },
  "popup_execute": {
    "message": "Execute",
    "description": "Execute button label"
  },
  "popup_status_enabled": {
    "message": "Enabled",
    "description": "Status: Enabled"
  },
  "popup_status_disabled": {
    "message": "Disabled",
    "description": "Status: Disabled"
  },
  "error_xpath_not_found": {
    "message": "Element not found",
    "description": "Error when XPath element is not found"
  },
  "notification_autofill_success": {
    "message": "Auto-fill completed successfully ($STEPS$ steps processed)",
    "description": "Auto-fill success notification",
    "placeholders": {
      "steps": {
        "content": "$1",
        "example": "5"
      }
    }
  }
}
```

**I18nService実装:**
```typescript
// src/i18n/I18nService.ts
import browser from 'webextension-polyfill';

export class I18nService {
  /**
   * メッセージを取得
   */
  static getMessage(key: string, substitutions?: string | string[]): string {
    return browser.i18n.getMessage(key, substitutions);
  }

  /**
   * 現在のロケールを取得
   */
  static getLocale(): string {
    return browser.i18n.getUILanguage();
  }

  /**
   * 受け入れ言語を取得
   */
  static async getAcceptLanguages(): Promise<string[]> {
    return browser.i18n.getAcceptLanguages();
  }

  /**
   * メッセージキーの存在確認
   */
  static hasMessage(key: string): boolean {
    const message = browser.i18n.getMessage(key);
    return message !== '';
  }

  /**
   * 複数置換のヘルパー
   */
  static format(key: string, params: Record<string, string>): string {
    let message = this.getMessage(key);

    Object.keys(params).forEach(key => {
      const placeholder = `$${key.toUpperCase()}$`;
      message = message.replace(placeholder, params[key]);
    });

    return message;
  }
}

// エイリアス
export const t = I18nService.getMessage.bind(I18nService);
export const tf = I18nService.format.bind(I18nService);
```

**使用例:**
```typescript
import { t, tf } from '@i18n/I18nService';

// シンプルな使用
const title = t('extensionName');  // "Auto-Fill Tool" or "自動入力ツール"

// プレースホルダー付き
const message = t('notification_autofill_success', '5');
// "Auto-fill completed successfully (5 steps processed)"

// 複数プレースホルダー（format使用）
const errorMsg = tf('error_step_failed', {
  step: '3',
  error: 'Element not found'
});
```

**HTMLでの使用:**
```html
<!-- public/popup.html -->
<button data-i18n="popup_execute">実行</button>
<span data-i18n="popup_status_enabled">有効</span>

<!-- または直接置換 -->
<h1>__MSG_extensionName__</h1>
```

**TypeScript型定義:**
```typescript
// src/i18n/messages.ts
export type MessageKey =
  | 'extensionName'
  | 'popup_execute'
  | 'popup_status_enabled'
  | 'popup_status_disabled'
  | 'error_xpath_not_found'
  | 'notification_autofill_success'
  | 'xpath_manager_title'
  | 'action_type_input'
  | 'action_type_click'
  | 'action_type_check'
  | 'action_type_select';

// 型安全なラッパー
export function getMessage(key: MessageKey, substitutions?: string | string[]): string {
  return browser.i18n.getMessage(key, substitutions);
}
```

---

#### アプローチ2: i18next（より高機能な場合）

**メリット:**
- 動的な言語切替
- ネストされた翻訳
- 複数形対応
- リッチな補間機能

**デメリット:**
- 追加ライブラリ（30KB+）
- 複雑な設定
- Chrome標準外

**実装例:**
```typescript
// src/i18n/i18n.ts
import i18next from 'i18next';
import Backend from 'i18next-http-backend';

await i18next
  .use(Backend)
  .init({
    lng: navigator.language.split('-')[0],
    fallbackLng: 'en',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    }
  });

export default i18next;

// 使用
import i18n from '@i18n/i18n';
const title = i18n.t('extensionName');
```

---

### 実装手順

#### Phase 1: 基盤整備（2-3日）
- [ ] `_locales`ディレクトリ構造作成
- [ ] I18nService実装
- [ ] TypeScript型定義
- [ ] 既存文字列の抽出

#### Phase 2: 日本語・英語対応（3-4日）
- [ ] messages.jsonの作成（ja, en）
- [ ] 全UIコンポーネントの置換
- [ ] エラーメッセージの国際化
- [ ] 通知メッセージの国際化

#### Phase 3: 追加言語対応（言語ごとに1-2日）
- [ ] 中国語簡体字
- [ ] 韓国語
- [ ] その他言語

#### Phase 4: テスト・検証（2-3日）
- [ ] 各言語での動作確認
- [ ] 文字列の長さ調整（UIレイアウト）
- [ ] RTL言語対応（アラビア語等の場合）

**総実装工数:** 8-12日（日英のみ）/ 15-20日（7言語対応）

---

### manifest.jsonの変更

```json
{
  "manifest_version": 3,
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__",
  "default_locale": "ja",
  "version": "1.0.0"
}
```

---

### 言語切替UI（オプション）

```html
<!-- 設定画面に追加 -->
<div class="language-selector">
  <label data-i18n="settings_language">言語:</label>
  <select id="language-select">
    <option value="ja">日本語</option>
    <option value="en">English</option>
    <option value="zh-CN">简体中文</option>
    <option value="ko">한국어</option>
    <option value="es">Español</option>
    <option value="fr">Français</option>
    <option value="de">Deutsch</option>
  </select>
</div>
```

**注意:** Chrome拡張機能の言語はブラウザの言語設定に従うため、手動切替は非推奨。

---

### 翻訳管理のベストプラクティス

1. **翻訳キーの命名規則:**
   ```
   {コンポーネント}_{用途}_{詳細}

   例:
   popup_button_execute
   xpath_manager_label_action_type
   error_network_timeout
   notification_success_autofill
   ```

2. **翻訳ファイルの管理:**
   - 各言語ファイルを同期
   - 欠落した翻訳の自動検出スクリプト
   - 翻訳レビュープロセス

3. **プロフェッショナル翻訳の利用:**
   - Phase 1-2: 開発者が英語翻訳
   - Phase 3以降: プロ翻訳者またはクラウド翻訳サービス（Crowdin, Localazy等）

---

## 2. パスワード情報のセキュリティ対策

### セキュリティリスク分析

#### 脅威モデル

| 脅威 | リスクレベル | 攻撃シナリオ |
|------|------------|------------|
| LocalStorage盗聴 | 🔴 高 | XSS攻撃による読み取り |
| メモリダンプ | 🟡 中 | デバッガーによる実行時メモリ読み取り |
| ネットワーク傍受 | 🟢 低 | HTTPS通信の中間者攻撃 |
| 物理アクセス | 🟡 中 | PCへの物理アクセスでのデータ抽出 |
| マルウェア | 🔴 高 | キーロガー、スクリーンキャプチャ |
| 他拡張機能 | 🟡 中 | 悪意ある拡張機能によるアクセス |

---

### 現在の実装の脆弱性

**問題点:**
```typescript
// ❌ 危険: 平文でLocalStorageに保存
await browser.storage.local.set({
  variables: JSON.stringify({
    username: 'user@example.com',
    password: 'MyPassword123!'  // 平文
  })
});
```

**攻撃例:**
```javascript
// 悪意あるスクリプトが簡単に読み取り可能
const data = await browser.storage.local.get('variables');
const vars = JSON.parse(data.variables);
console.log(vars.password); // "MyPassword123!" が露出
```

---

### 対策案の比較

#### 対策1: クライアントサイド暗号化（AES-256）
**難易度:** ⭐⭐ 中
**セキュリティレベル:** ⭐⭐⭐ 中

**実装:**
```typescript
// src/infrastructure/security/CryptoService.ts
import { ILogger } from '@domain/services/ILogger';
import { NoOpLogger } from '@infrastructure/services/NoOpLogger';

export class CryptoService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly SALT_LENGTH = 16;

  constructor(private logger: ILogger = new NoOpLogger()) {}

  /**
   * マスターキーの派生（ユーザーパスフレーズから）
   */
  private async deriveKey(
    passphrase: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passphraseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // OWASP推奨
        hash: 'SHA-256'
      },
      passphraseKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * データの暗号化
   */
  async encrypt(plaintext: string, passphrase: string): Promise<string> {
    try {
      // ランダムなソルトとIVを生成
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // キーの派生
      const key = await this.deriveKey(passphrase, salt);

      // 暗号化
      const encoder = new TextEncoder();
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encoder.encode(plaintext)
      );

      // salt + iv + ciphertext を連結してBase64エンコード
      const combined = new Uint8Array(
        this.SALT_LENGTH + this.IV_LENGTH + encrypted.byteLength
      );
      combined.set(salt, 0);
      combined.set(iv, this.SALT_LENGTH);
      combined.set(new Uint8Array(encrypted), this.SALT_LENGTH + this.IV_LENGTH);

      return this.arrayBufferToBase64(combined);
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * データの復号化
   */
  async decrypt(ciphertext: string, passphrase: string): Promise<string> {
    try {
      // Base64デコード
      const combined = this.base64ToArrayBuffer(ciphertext);

      // salt, iv, encrypted dataを分離
      const salt = combined.slice(0, this.SALT_LENGTH);
      const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const encrypted = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);

      // キーの派生
      const key = await this.deriveKey(passphrase, salt);

      // 復号化
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data - invalid passphrase or corrupted data');
    }
  }

  /**
   * ArrayBufferをBase64に変換
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    const binary = String.fromCharCode(...buffer);
    return btoa(binary);
  }

  /**
   * Base64をArrayBufferに変換
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
```

**使用例:**
```typescript
// 変数の暗号化保存
import { CryptoService } from '@infrastructure/security/CryptoService';

const cryptoService = new CryptoService();

// ユーザーが設定するマスターパスワード
const masterPassword = 'User-Master-Password-123!';

// 変数データ
const variables = {
  username: 'user@example.com',
  password: 'MyPassword123!'
};

// 暗号化
const encrypted = await cryptoService.encrypt(
  JSON.stringify(variables),
  masterPassword
);

// LocalStorageに保存（暗号化済み）
await browser.storage.local.set({
  encryptedVariables: encrypted
});

// 復号化して使用
const encryptedData = await browser.storage.local.get('encryptedVariables');
const decrypted = await cryptoService.decrypt(
  encryptedData.encryptedVariables,
  masterPassword
);
const vars = JSON.parse(decrypted);
```

**マスターパスワードの管理:**

1. **オプション1: セッションごとに入力**
   - ユーザーが拡張機能使用時に毎回入力
   - 最もセキュア
   - UXが悪い

2. **オプション2: セッション中メモリ保持**
   - 初回入力後、Service Workerのメモリに保持
   - ブラウザ再起動で消去
   - バランス型

3. **オプション3: OS統合（推奨）**
   - Windows Credential Manager / macOS Keychain / Linux Secret Service
   - Native Messaging Host経由でアクセス
   - 最も安全＋UX良好

**長所:**
- ✅ LocalStorageのデータが暗号化される
- ✅ 標準Web Crypto API使用
- ✅ 追加ライブラリ不要

**短所:**
- ❌ マスターパスワードの管理が必要
- ❌ パスワード忘れるとデータ復元不可
- ❌ メモリ上では平文（実行時攻撃に脆弱）

---

#### 対策2: Native Messaging + OS Keychain（最も安全）
**難易度:** ⭐⭐⭐⭐ 困難
**セキュリティレベル:** ⭐⭐⭐⭐⭐ 最高

**アーキテクチャ:**
```
Chrome Extension
    ↓ (Native Messaging)
Native Host Application (Python/Node.js)
    ↓ (OS API)
OS Keychain/Credential Manager
    - Windows: Credential Manager
    - macOS: Keychain
    - Linux: Secret Service (libsecret)
```

**Native Host実装例（Node.js）:**
```javascript
// native-host/index.js
const keytar = require('keytar'); // OS Keystoreライブラリ

const SERVICE_NAME = 'auto-fill-tool';

// メッセージ受信
process.stdin.on('data', async (buffer) => {
  const message = JSON.parse(buffer.toString());

  switch (message.action) {
    case 'setPassword':
      await keytar.setPassword(
        SERVICE_NAME,
        message.account,
        message.password
      );
      sendResponse({ success: true });
      break;

    case 'getPassword':
      const password = await keytar.getPassword(
        SERVICE_NAME,
        message.account
      );
      sendResponse({ success: true, password });
      break;

    case 'deletePassword':
      await keytar.deletePassword(
        SERVICE_NAME,
        message.account
      );
      sendResponse({ success: true });
      break;
  }
});

function sendResponse(message) {
  const buffer = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);
  process.stdout.write(header);
  process.stdout.write(buffer);
}
```

**Chrome Extension側:**
```typescript
// src/infrastructure/security/NativeKeychainService.ts
import browser from 'webextension-polyfill';

export class NativeKeychainService {
  private static readonly NATIVE_HOST = 'com.autofill.keychain';

  /**
   * パスワードを保存
   */
  async setPassword(account: string, password: string): Promise<void> {
    const response = await browser.runtime.sendNativeMessage(
      this.NATIVE_HOST,
      {
        action: 'setPassword',
        account,
        password
      }
    );

    if (!response.success) {
      throw new Error('Failed to save password to keychain');
    }
  }

  /**
   * パスワードを取得
   */
  async getPassword(account: string): Promise<string | null> {
    const response = await browser.runtime.sendNativeMessage(
      this.NATIVE_HOST,
      {
        action: 'getPassword',
        account
      }
    );

    return response.success ? response.password : null;
  }

  /**
   * パスワードを削除
   */
  async deletePassword(account: string): Promise<void> {
    await browser.runtime.sendNativeMessage(
      this.NATIVE_HOST,
      {
        action: 'deletePassword',
        account
      }
    );
  }
}
```

**manifest.json設定:**
```json
{
  "permissions": [
    "nativeMessaging"
  ]
}
```

**Native Host manifest（Windows）:**
```json
{
  "name": "com.autofill.keychain",
  "description": "Auto-Fill Tool Keychain Bridge",
  "path": "C:\\Program Files\\AutoFillTool\\native-host.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://your-extension-id/"
  ]
}
```

**長所:**
- ✅ OS標準のセキュアストレージ使用
- ✅ マスターパスワード不要（OSが管理）
- ✅ 最高レベルのセキュリティ
- ✅ 生体認証対応（Windows Hello, Touch ID等）

**短所:**
- ❌ Native Hostの実装・配布が必要
- ❌ OSごとの個別対応
- ❌ インストール手順が複雑化
- ❌ Chrome Web Storeでの審査厳格化

---

#### 対策3: ハイブリッドアプローチ（推奨）
**難易度:** ⭐⭐⭐ 中〜高
**セキュリティレベル:** ⭐⭐⭐⭐ 高

**方針:**
1. デフォルト: クライアントサイド暗号化（AES-256）
2. オプション: Native Messaging + OS Keychain（上級ユーザー向け）
3. 追加: メモリ保護機能

**メモリ保護の実装:**
```typescript
// src/infrastructure/security/SecureMemory.ts
export class SecureMemory {
  private static secrets: Map<string, {
    value: string;
    timestamp: number;
    autoClean: boolean;
  }> = new Map();

  private static readonly TTL = 15 * 60 * 1000; // 15分

  /**
   * セキュアに値を保存（一時的）
   */
  static set(key: string, value: string, autoClean: boolean = true): void {
    this.secrets.set(key, {
      value,
      timestamp: Date.now(),
      autoClean
    });

    if (autoClean) {
      // TTL後に自動削除
      setTimeout(() => {
        this.delete(key);
      }, this.TTL);
    }
  }

  /**
   * 値を取得
   */
  static get(key: string): string | undefined {
    const secret = this.secrets.get(key);
    if (!secret) return undefined;

    // TTLチェック
    if (secret.autoClean && Date.now() - secret.timestamp > this.TTL) {
      this.delete(key);
      return undefined;
    }

    return secret.value;
  }

  /**
   * 値を削除（メモリから確実に消去）
   */
  static delete(key: string): void {
    const secret = this.secrets.get(key);
    if (secret) {
      // メモリを上書き消去（best effort）
      secret.value = '0'.repeat(secret.value.length);
    }
    this.secrets.delete(key);
  }

  /**
   * 全ての秘密情報をクリア
   */
  static clear(): void {
    this.secrets.forEach((_, key) => this.delete(key));
  }
}

// Service Worker終了時にクリア
browser.runtime.onSuspend.addListener(() => {
  SecureMemory.clear();
});
```

---

### UI実装

**マスターパスワード設定画面:**
```html
<div class="security-settings">
  <h2>セキュリティ設定</h2>

  <div class="form-group">
    <label>暗号化方式:</label>
    <select id="encryption-method">
      <option value="aes">AES-256暗号化（推奨）</option>
      <option value="keychain" disabled>OS Keychain（Native Host必要）</option>
      <option value="none">暗号化なし（非推奨）</option>
    </select>
  </div>

  <div id="master-password-section" class="form-group">
    <label>マスターパスワード:</label>
    <input type="password" id="master-password" autocomplete="new-password">
    <small>変数データを暗号化するためのパスワードを設定してください</small>

    <label>パスワード確認:</label>
    <input type="password" id="master-password-confirm">

    <button id="set-master-password">マスターパスワードを設定</button>
  </div>

  <div class="security-info">
    <h3>⚠️ 重要な注意事項</h3>
    <ul>
      <li>マスターパスワードを忘れると、保存された変数データを復元できません</li>
      <li>パスワードは安全な場所に別途保管してください</li>
      <li>定期的にパスワードを変更することを推奨します</li>
    </ul>
  </div>
</div>
```

---

### セキュリティベストプラクティス

1. **暗号化は必須ではなく推奨**
   - デフォルトで有効
   - 無効化には警告表示

2. **マスターパスワードの強度チェック**
   - 最低12文字
   - 大文字・小文字・数字・記号を含む
   - zxcvbn等のライブラリで強度評価

3. **タイムアウト実装**
   - 15分間操作なしで再認証要求
   - 秘密情報をメモリから削除

4. **監査ログ**
   - 暗号化/復号化の試行を記録
   - 失敗回数の監視

5. **CSP（Content Security Policy）強化**
   - unsafe-evalを禁止
   - unsafe-inlineを最小化

---

## 3. Notion DB連携機能

### 概要

Notion DatabaseをXPath管理データソースとして使用し、チームでの設定共有や一元管理を実現します。

---

### アーキテクチャ

```
Chrome Extension
    ↓ (HTTPS/REST API)
Notion API Server
    ↓
Notion Database
    - Website Configurations
    - XPath Collections
    - Variables (encrypted)
```

---

### Notion Database設計

#### Database 1: Websites
**目的:** Webサイト設定の管理

| プロパティ名 | タイプ | 説明 |
|------------|-------|------|
| Name | title | Webサイト名 |
| Website ID | text | 一意識別子（UUID） |
| Status | select | enabled / disabled / once |
| Start URL | url | 開始URL |
| Variables | relation | Variables DBへの関連 |
| Updated At | date | 最終更新日時 |
| Created By | person | 作成者 |
| Tags | multi_select | カテゴリタグ |

#### Database 2: XPaths
**目的:** XPathステップの管理

| プロパティ名 | タイプ | 説明 |
|------------|-------|------|
| Title | title | ステップ名 |
| Website | relation | Websites DBへの関連 |
| Execution Order | number | 実行順序 |
| Action Type | select | input / click / check / select |
| Value | text | 入力値 |
| XPath Pattern | select | smart / short / absolute |
| XPath Smart | text | Smart XPath |
| XPath Short | text | Short XPath |
| XPath Absolute | text | Absolute XPath |
| URL | url | 対象ページURL |
| Wait Seconds | number | 待機時間（秒） |
| Timeout Seconds | number | タイムアウト（秒） |
| Retry Type | select | none / retry_from_beginning |
| Event Pattern | number | イベントパターン |

#### Database 3: Variables（オプション）
**目的:** 変数の管理

| プロパティ名 | タイプ | 説明 |
|------------|-------|------|
| Name | title | 変数名 |
| Value | text | 値（暗号化推奨） |
| Website | relation | Websites DBへの関連 |
| Is Sensitive | checkbox | センシティブデータフラグ |
| Description | text | 説明 |

---

### Notion API統合実装

**依存関係:**
```bash
npm install @notionhq/client
```

**NotionService実装:**
```typescript
// src/infrastructure/services/NotionService.ts
import { Client } from '@notionhq/client';
import { ILogger } from '@domain/services/ILogger';
import { NoOpLogger } from './NoOpLogger';
import { WebsiteConfig } from '@domain/entities/Website';
import { XPathData } from '@domain/entities/XPathCollection';

export interface NotionConfig {
  apiKey: string;
  websitesDatabaseId: string;
  xpathsDatabaseId: string;
  variablesDatabaseId?: string;
}

export class NotionService {
  private client: Client;

  constructor(
    private config: NotionConfig,
    private logger: ILogger = new NoOpLogger()
  ) {
    this.client = new Client({
      auth: config.apiKey
    });
  }

  /**
   * Websiteの一覧を取得
   */
  async fetchWebsites(): Promise<WebsiteConfig[]> {
    try {
      this.logger.info('Fetching websites from Notion');

      const response = await this.client.databases.query({
        database_id: this.config.websitesDatabaseId,
        filter: {
          property: 'Status',
          select: {
            is_not_empty: true
          }
        }
      });

      const websites: WebsiteConfig[] = response.results.map((page: any) => {
        const props = page.properties;

        return {
          id: this.getPlainText(props['Website ID']),
          name: this.getTitle(props['Name']),
          status: this.getSelect(props['Status']) as 'enabled' | 'disabled' | 'once',
          start_url: this.getUrl(props['Start URL']),
          variables: {}, // 後で関連から取得
          updatedAt: this.getDate(props['Updated At']) || new Date().toISOString(),
          editable: true
        };
      });

      this.logger.info(`Fetched ${websites.length} websites from Notion`);
      return websites;
    } catch (error) {
      this.logger.error('Failed to fetch websites from Notion', error);
      throw error;
    }
  }

  /**
   * 特定WebsiteのXPathsを取得
   */
  async fetchXPathsForWebsite(websiteId: string): Promise<XPathData[]> {
    try {
      this.logger.info(`Fetching XPaths for website: ${websiteId}`);

      const response = await this.client.databases.query({
        database_id: this.config.xpathsDatabaseId,
        filter: {
          property: 'Website',
          relation: {
            contains: websiteId // Relation IDで検索
          }
        },
        sorts: [
          {
            property: 'Execution Order',
            direction: 'ascending'
          }
        ]
      });

      const xpaths: XPathData[] = response.results.map((page: any) => {
        const props = page.properties;

        return {
          id: page.id,
          websiteId: websiteId,
          value: this.getPlainText(props['Value']),
          actionType: this.getSelect(props['Action Type']),
          pathAbsolute: this.getPlainText(props['XPath Absolute']),
          pathShort: this.getPlainText(props['XPath Short']),
          pathSmart: this.getPlainText(props['XPath Smart']),
          selectedPathPattern: this.getSelect(props['XPath Pattern']),
          url: this.getUrl(props['URL']),
          afterWaitSeconds: this.getNumber(props['Wait Seconds']) || 0,
          executionTimeoutSeconds: this.getNumber(props['Timeout Seconds']) || 30,
          executionOrder: this.getNumber(props['Execution Order']) || 0,
          dispatchEventPattern: this.getNumber(props['Event Pattern']) || 0,
          retryType: this.getSelect(props['Retry Type']) === 'retry_from_beginning' ? 10 : 0
        };
      });

      this.logger.info(`Fetched ${xpaths.length} XPaths for website ${websiteId}`);
      return xpaths;
    } catch (error) {
      this.logger.error(`Failed to fetch XPaths for website ${websiteId}`, error);
      throw error;
    }
  }

  /**
   * Variablesを取得（暗号化されたものを復号化）
   */
  async fetchVariables(websiteId: string): Promise<Record<string, string>> {
    if (!this.config.variablesDatabaseId) {
      return {};
    }

    try {
      const response = await this.client.databases.query({
        database_id: this.config.variablesDatabaseId,
        filter: {
          property: 'Website',
          relation: {
            contains: websiteId
          }
        }
      });

      const variables: Record<string, string> = {};
      response.results.forEach((page: any) => {
        const props = page.properties;
        const name = this.getTitle(props['Name']);
        const value = this.getPlainText(props['Value']);
        const isSensitive = this.getCheckbox(props['Is Sensitive']);

        // センシティブデータの場合、復号化が必要
        variables[name] = isSensitive ? value : value; // TODO: 復号化処理
      });

      return variables;
    } catch (error) {
      this.logger.error(`Failed to fetch variables for website ${websiteId}`, error);
      throw error;
    }
  }

  /**
   * WebsiteをNotionに作成
   */
  async createWebsite(website: WebsiteConfig): Promise<string> {
    try {
      const response = await this.client.pages.create({
        parent: { database_id: this.config.websitesDatabaseId },
        properties: {
          'Name': {
            title: [{ text: { content: website.name } }]
          },
          'Website ID': {
            rich_text: [{ text: { content: website.id } }]
          },
          'Status': {
            select: { name: website.status }
          },
          'Start URL': {
            url: website.start_url || null
          },
          'Updated At': {
            date: { start: new Date().toISOString() }
          }
        }
      });

      this.logger.info(`Created website in Notion: ${website.name}`);
      return response.id;
    } catch (error) {
      this.logger.error('Failed to create website in Notion', error);
      throw error;
    }
  }

  /**
   * XPathをNotionに作成
   */
  async createXPath(xpath: XPathData, notionWebsitePageId: string): Promise<string> {
    try {
      const response = await this.client.pages.create({
        parent: { database_id: this.config.xpathsDatabaseId },
        properties: {
          'Title': {
            title: [{ text: { content: `${xpath.actionType} - ${xpath.value.substring(0, 30)}` } }]
          },
          'Website': {
            relation: [{ id: notionWebsitePageId }]
          },
          'Execution Order': {
            number: xpath.executionOrder
          },
          'Action Type': {
            select: { name: xpath.actionType }
          },
          'Value': {
            rich_text: [{ text: { content: xpath.value } }]
          },
          'XPath Pattern': {
            select: { name: xpath.selectedPathPattern }
          },
          'XPath Smart': {
            rich_text: [{ text: { content: xpath.pathSmart } }]
          },
          'XPath Short': {
            rich_text: [{ text: { content: xpath.pathShort } }]
          },
          'XPath Absolute': {
            rich_text: [{ text: { content: xpath.pathAbsolute } }]
          },
          'URL': {
            url: xpath.url
          },
          'Wait Seconds': {
            number: xpath.afterWaitSeconds
          },
          'Timeout Seconds': {
            number: xpath.executionTimeoutSeconds
          },
          'Event Pattern': {
            number: xpath.dispatchEventPattern
          }
        }
      });

      return response.id;
    } catch (error) {
      this.logger.error('Failed to create XPath in Notion', error);
      throw error;
    }
  }

  // ヘルパーメソッド
  private getTitle(property: any): string {
    return property?.title?.[0]?.plain_text || '';
  }

  private getPlainText(property: any): string {
    return property?.rich_text?.[0]?.plain_text || '';
  }

  private getSelect(property: any): string {
    return property?.select?.name || '';
  }

  private getUrl(property: any): string {
    return property?.url || '';
  }

  private getNumber(property: any): number {
    return property?.number || 0;
  }

  private getDate(property: any): string | null {
    return property?.date?.start || null;
  }

  private getCheckbox(property: any): boolean {
    return property?.checkbox || false;
  }
}
```

---

### 同期戦略

#### 戦略1: Pull型（定期同期）
```typescript
// 定期的にNotionからデータを取得
setInterval(async () => {
  const websites = await notionService.fetchWebsites();
  await localRepository.saveWebsites(websites);
}, 5 * 60 * 1000); // 5分ごと
```

#### 戦略2: Manual Pull（手動同期）
```typescript
// ユーザーが明示的に同期ボタンをクリック
async function syncFromNotion() {
  showLoadingIndicator();

  const websites = await notionService.fetchWebsites();

  for (const website of websites) {
    const xpaths = await notionService.fetchXPathsForWebsite(website.id);
    await localRepository.saveXPaths(xpaths);
  }

  hideLoadingIndicator();
  showSuccessMessage('同期完了');
}
```

#### 戦略3: Hybrid（推奨）
- ローカルデータを優先使用（高速）
- 定期的にバックグラウンドで同期
- 衝突時はユーザーに選択させる

---

### セキュリティ対策

#### 1. Notion API Keyの保護

**❌ 絶対にやってはいけないこと:**
```typescript
// コードに直接埋め込み
const NOTION_API_KEY = 'secret_abc123...'; // 危険！
```

**✅ 正しい保存方法:**
```typescript
// 暗号化してLocalStorageに保存
const encrypted = await cryptoService.encrypt(
  notionApiKey,
  masterPassword
);
await browser.storage.local.set({ notionApiKey: encrypted });

// 使用時に復号化
const encrypted = await browser.storage.local.get('notionApiKey');
const apiKey = await cryptoService.decrypt(
  encrypted.notionApiKey,
  masterPassword
);
```

#### 2. 最小権限の原則

Notion Integrationには必要最小限の権限のみを付与：

- ✅ Read content
- ✅ Update content (同期の場合)
- ❌ Delete content（通常不要）
- ❌ Comment（不要）

#### 3. センシティブデータの暗号化

**Notion上での暗号化:**
```typescript
// Notionに保存する前に暗号化
const encryptedPassword = await cryptoService.encrypt(
  password,
  teamMasterKey
);

await notionService.createVariable({
  name: 'user_password',
  value: encryptedPassword,
  isSensitive: true
});
```

#### 4. 監査ログ

```typescript
// 全てのNotion API呼び出しをログ記録
class AuditedNotionService extends NotionService {
  async fetchWebsites(): Promise<WebsiteConfig[]> {
    this.logger.info('Notion API: fetchWebsites called', {
      timestamp: new Date().toISOString(),
      user: getCurrentUser()
    });

    return super.fetchWebsites();
  }
}
```

#### 5. ネットワーク セキュリティ

- ✅ HTTPS通信必須
- ✅ Certificate Pinning（高度な場合）
- ✅ Rate Limiting対応
- ✅ タイムアウト設定

---

### UI実装

**Notion連携設定画面:**
```html
<div class="notion-integration">
  <h2>Notion連携</h2>

  <div class="form-group">
    <label>Notion Integration Token:</label>
    <input type="password" id="notion-api-key" placeholder="secret_...">
    <small>
      <a href="https://www.notion.so/my-integrations" target="_blank">
        Notion Integrationページ
      </a>
      で取得してください
    </small>
  </div>

  <div class="form-group">
    <label>Websites Database ID:</label>
    <input type="text" id="websites-db-id" placeholder="abc123...">
  </div>

  <div class="form-group">
    <label>XPaths Database ID:</label>
    <input type="text" id="xpaths-db-id" placeholder="def456...">
  </div>

  <div class="form-group">
    <label>Variables Database ID (オプション):</label>
    <input type="text" id="variables-db-id" placeholder="ghi789...">
  </div>

  <button id="test-connection">接続テスト</button>
  <button id="save-notion-config">設定を保存</button>

  <hr>

  <h3>同期</h3>
  <button id="sync-from-notion">Notionから同期</button>
  <button id="push-to-notion">Notionへプッシュ</button>

  <div id="sync-status"></div>
</div>
```

---

### セキュリティリスクと対策まとめ

| リスク | 対策 |
|--------|------|
| API Key漏洩 | 暗号化保存、定期的なローテーション |
| 中間者攻撃 | HTTPS必須、Certificate Pinning |
| データ傍受 | エンドツーエンド暗号化 |
| 不正アクセス | 最小権限、監査ログ |
| Notion側侵害 | ローカルバックアップ、定期エクスポート |

---

## 4. 自動入力中のUI制御とユーザー体験

### 課題

自動入力実行中、ユーザーがページを操作すると：
- 入力が競合し失敗する
- 誤ったフォームに入力される
- 想定外の画面遷移が発生する

---

### 対策方針

#### 1. ページ全体をブロック（推奨）

**実装:** オーバーレイで画面を覆う

```typescript
// src/presentation/content-script/AutoFillOverlay.ts
export class AutoFillOverlay {
  private overlay: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;

  /**
   * オーバーレイを表示
   */
  show(message: string = '自動入力中...'): void {
    if (this.overlay) return; // 既に表示中

    // コンテナ作成
    this.overlay = document.createElement('div');
    this.overlay.id = 'auto-fill-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      pointer-events: none;
    `;

    // Shadow DOM作成（スタイル隔離）
    this.shadowRoot = this.overlay.attachShadow({ mode: 'open' });

    // スタイル追加
    const style = document.createElement('style');
    style.textContent = `
      .overlay-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .loading-container {
        background: white;
        border-radius: 12px;
        padding: 32px 48px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        animation: slideUp 0.4s ease-out;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .spinner {
        width: 60px;
        height: 60px;
        border: 4px solid #e0e0e0;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .message {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .progress-bar-container {
        width: 300px;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        width: 0%;
        transition: width 0.3s ease-out;
      }

      .step-info {
        font-size: 14px;
        color: #666;
        text-align: center;
      }

      .cancel-button {
        margin-top: 10px;
        padding: 10px 24px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .cancel-button:hover {
        background: #d32f2f;
      }
    `;

    // コンテンツ作成
    const backdrop = document.createElement('div');
    backdrop.className = 'overlay-backdrop';
    backdrop.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <div class="message">${this.escapeHtml(message)}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" id="progress-bar"></div>
        </div>
        <div class="step-info" id="step-info">準備中...</div>
        <button class="cancel-button" id="cancel-button">キャンセル</button>
      </div>
    `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(backdrop);
    document.body.appendChild(this.overlay);

    // キャンセルボタンのイベント
    const cancelButton = this.shadowRoot.getElementById('cancel-button');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.triggerCancel();
      });
    }

    // ESCキーでキャンセル
    this.handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.triggerCancel();
      }
    };
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  /**
   * プログレスバーを更新
   */
  updateProgress(current: number, total: number): void {
    if (!this.shadowRoot) return;

    const progressBar = this.shadowRoot.getElementById('progress-bar');
    const stepInfo = this.shadowRoot.getElementById('step-info');

    if (progressBar) {
      const percentage = (current / total) * 100;
      progressBar.style.width = `${percentage}%`;
    }

    if (stepInfo) {
      stepInfo.textContent = `ステップ ${current} / ${total}`;
    }
  }

  /**
   * メッセージを更新
   */
  updateMessage(message: string): void {
    if (!this.shadowRoot) return;

    const messageEl = this.shadowRoot.querySelector('.message');
    if (messageEl) {
      messageEl.textContent = this.escapeHtml(message);
    }
  }

  /**
   * オーバーレイを非表示
   */
  hide(): void {
    if (this.overlay && this.overlay.parentNode) {
      // フェードアウトアニメーション
      this.overlay.style.opacity = '0';
      this.overlay.style.transition = 'opacity 0.3s ease-out';

      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.shadowRoot = null;

        if (this.handleEscapeKey) {
          document.removeEventListener('keydown', this.handleEscapeKey);
        }
      }, 300);
    }
  }

  /**
   * キャンセル処理をトリガー
   */
  private triggerCancel(): void {
    // カスタムイベントを発火
    document.dispatchEvent(new CustomEvent('auto-fill-cancel'));
    this.hide();
  }

  private handleEscapeKey: ((e: KeyboardEvent) => void) | null = null;

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
```

**使用例:**
```typescript
// content-script.ts
import { AutoFillOverlay } from './AutoFillOverlay';

const overlay = new AutoFillOverlay();

// 自動入力開始時
overlay.show('自動入力を開始しています...');

// 進捗更新
for (let i = 0; i < steps.length; i++) {
  overlay.updateProgress(i + 1, steps.length);
  overlay.updateMessage(`ステップ ${i + 1}: ${steps[i].description}`);

  await executeStep(steps[i]);
}

// 完了時
overlay.hide();
```

---

#### 2. 特定要素のみブロック（軽量版）

フォーム要素のみをブロックし、他の部分は操作可能にする：

```typescript
export class FormBlocker {
  private blockedElements: Set<HTMLElement> = new Set();

  /**
   * フォーム要素をブロック
   */
  blockForm(formElement: HTMLFormElement): void {
    // フォーム内の全入力要素を無効化
    const inputs = formElement.querySelectorAll('input, textarea, select, button');

    inputs.forEach((input) => {
      const el = input as HTMLElement;
      this.blockedElements.add(el);

      // disabled属性を追加
      (el as any).disabled = true;

      // 視覚的フィードバック
      el.style.opacity = '0.5';
      el.style.cursor = 'not-allowed';
      el.style.pointerEvents = 'none';
    });
  }

  /**
   * ブロック解除
   */
  unblockAll(): void {
    this.blockedElements.forEach((el) => {
      (el as any).disabled = false;
      el.style.opacity = '';
      el.style.cursor = '';
      el.style.pointerEvents = '';
    });

    this.blockedElements.clear();
  }
}
```

---

#### 3. マウス・キーボード イベントの無効化

```typescript
export class InputBlocker {
  private isBlocking = false;
  private eventHandler: (e: Event) => void;

  constructor() {
    this.eventHandler = (e: Event) => {
      if (this.isBlocking) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
  }

  /**
   * 全てのユーザー入力をブロック
   */
  block(): void {
    this.isBlocking = true;

    // 全ての入力イベントを捕捉
    const events = [
      'mousedown', 'mouseup', 'click', 'dblclick',
      'keydown', 'keyup', 'keypress',
      'touchstart', 'touchend', 'touchmove',
      'wheel', 'scroll'
    ];

    events.forEach(eventType => {
      document.addEventListener(eventType, this.eventHandler, {
        capture: true,
        passive: false
      });
    });
  }

  /**
   * ブロック解除
   */
  unblock(): void {
    this.isBlocking = false;

    const events = [
      'mousedown', 'mouseup', 'click', 'dblclick',
      'keydown', 'keyup', 'keypress',
      'touchstart', 'touchend', 'touchmove',
      'wheel', 'scroll'
    ];

    events.forEach(eventType => {
      document.removeEventListener(eventType, this.eventHandler, { capture: true });
    });
  }
}
```

---

### UI/UXデザインパターン

#### パターン1: ミニマルローディング
```
┌─────────────────────────────────┐
│                                 │
│         ⟳ 自動入力中...         │
│         ステップ 3/5             │
│                                 │
│  [━━━━━━━━━░░░░] 60%           │
│                                 │
└─────────────────────────────────┘
```

#### パターン2: 詳細進捗表示
```
┌──────────────────────────────────────┐
│  🤖 自動入力を実行中                  │
│                                      │
│  ✓ ユーザー名を入力しました          │
│  ✓ パスワードを入力しました          │
│  ⟳ ログインボタンをクリック中...     │
│  ○ 待機中...                         │
│  ○ 完了確認中...                     │
│                                      │
│  [━━━━━━━━░░░░░] 3/5 (60%)        │
│                                      │
│  [キャンセル]                        │
└──────────────────────────────────────┘
```

#### パターン3: アニメーション強調
```
┌──────────────────────────────────────┐
│                                      │
│          ✨ 魔法をかけています ✨      │
│                                      │
│      ⚡ 自動入力が進行中です ⚡       │
│                                      │
│     [▓▓▓▓▓▓▓▓▓▓░░░░░░] 67%        │
│                                      │
│    「メールアドレス」に入力中...     │
│                                      │
│         しばらくお待ちください        │
│                                      │
└──────────────────────────────────────┘
```

---

### キャンセル機能の実装

```typescript
// ChromeAutoFillService.tsに追加
export class ChromeAutoFillService implements IAutoFillService {
  private isCancelled = false;

  async executeAutoFill(
    tabId: number,
    xpaths: XPathData[],
    url: string,
    variables?: VariableCollection
  ): Promise<AutoFillResult> {
    // キャンセルイベントをリスニング
    const cancelHandler = () => {
      this.isCancelled = true;
      this.logger.info('Auto-fill cancelled by user');
    };
    document.addEventListener('auto-fill-cancel', cancelHandler);

    try {
      for (let i = 0; i < xpaths.length; i++) {
        // キャンセルチェック
        if (this.isCancelled) {
          return {
            success: false,
            processedSteps: i,
            error: 'Cancelled by user'
          };
        }

        // ステップ実行
        await this.executeStep(xpaths[i]);
      }

      return { success: true, processedSteps: xpaths.length };
    } finally {
      document.removeEventListener('auto-fill-cancel', cancelHandler);
      this.isCancelled = false;
    }
  }
}
```

---

### アクセシビリティ対応

1. **スクリーンリーダー対応:**
```html
<div role="dialog" aria-labelledby="loading-title" aria-describedby="loading-desc">
  <h2 id="loading-title">自動入力中</h2>
  <p id="loading-desc">ステップ 3 / 5 を処理しています</p>
  <div role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"></div>
</div>
```

2. **キーボード操作:**
- ESCキーでキャンセル
- Tabキーでボタン移動
- Enterでキャンセル確定

3. **色覚異常対応:**
- 色だけでなくアイコンと文字で状態表示
- 十分なコントラスト比（WCAG AA準拠）

---

### 実装優先度

| 機能 | 優先度 | 実装工数 |
|------|-------|---------|
| 基本オーバーレイ | 🔴 必須 | 1日 |
| プログレスバー | 🔴 必須 | 0.5日 |
| ステップ表示 | 🟡 推奨 | 0.5日 |
| キャンセル機能 | 🟡 推奨 | 1日 |
| 詳細進捗表示 | 🟢 追加 | 1日 |
| アニメーション | 🟢 追加 | 0.5日 |

**総実装工数:** 2-4日

---

## 実装ロードマップ

### Phase 1: 基本機能（必須）
**期間:** 2-3週間

- [ ] マルチランゲージ（日英のみ）
- [ ] パスワード暗号化（AES-256）
- [ ] 基本オーバーレイUI

### Phase 2: セキュリティ強化（推奨）
**期間:** 2-3週間

- [ ] Native Messaging（オプション機能）
- [ ] 監査ログ
- [ ] セッションタイムアウト

### Phase 3: 高度な機能（追加）
**期間:** 3-4週間

- [ ] Notion連携
- [ ] 追加言語対応
- [ ] 詳細UI/UX改善

---

## まとめ

| 機能 | 難易度 | セキュリティ | 実装工数 | 優先度 |
|------|-------|------------|---------|--------|
| マルチランゲージ | ⭐⭐ | - | 8-20日 | 🟡 推奨 |
| パスワード暗号化 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 3-7日 | 🔴 必須 |
| Notion連携 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 7-14日 | 🟢 追加 |
| UI制御 | ⭐⭐ | - | 2-4日 | 🔴 必須 |

**総実装工数見積:** 20-45日（全機能）

---

**最終更新:** 2025-10-08
**バージョン:** 1.0.0
