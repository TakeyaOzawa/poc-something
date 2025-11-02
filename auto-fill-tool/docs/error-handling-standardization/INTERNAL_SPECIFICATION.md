# エラーハンドリング標準化機能 - 内部仕様

**作成日**: 2025-11-02  
**バージョン**: 2.0  
**ステータス**: 実装完了

---

## 🏗️ アーキテクチャ概要

Clean Architectureに準拠したエラーハンドリングシステム。

### 主要コンポーネント

1. **StandardError エンティティ** (Domain層)
2. **I18nAdapter** (Infrastructure層)
3. **エラーコード管理スクリプト** (開発支援)

---

## 📁 ファイル構成

```
src/
├── domain/
│   └── entities/
│       ├── StandardError.ts              # メインエンティティ
│       └── __tests__/
│           └── StandardError.test.ts     # 単体テスト
├── infrastructure/
│   └── adapters/
│       └── I18nAdapter.ts               # 国際化アダプター
public/
├── _locales/
│   ├── en/
│   │   └── messages.json               # 英語メッセージ
│   └── ja/
│       └── messages.json               # 日本語メッセージ
scripts/
└── validate-and-test.sh               # エラーコード管理スクリプト
docs/
└── ERROR_CODES.md                     # 自動生成ドキュメント
```

---

## 🔧 StandardError クラス設計

### クラス構造
```typescript
export class StandardError extends Error {
  public readonly errorCode: ValidErrorCode;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  private readonly i18n: I18nAdapter;

  constructor(errorCode: ValidErrorCode, context: ErrorContext = {})
  
  // メッセージキー生成
  public getMessageKey(type: ErrorMessageType): MessageKey
  public getUserMessageKey(): MessageKey
  public getDevMessageKey(): MessageKey
  public getResolutionMessageKey(): MessageKey
  
  // 直接メッセージ取得
  public getUserMessage(): string
  public getDevMessage(): string
  public getResolutionMessage(): string
  
  // ユーティリティ
  public getErrorCode(): string
  public getContext(): ErrorContext
  public toJSON(): object
}
```

### 型定義
```typescript
// エラーコードから型を抽出
type ExtractErrorCode<T extends string> = 
  T extends `${infer Code}_${ErrorMessageType}` ? Code : never;

// 有効なエラーコード型
export type ValidErrorCode = ExtractErrorCode<MessageKey>;

// エラーメッセージタイプ
export type ErrorMessageType = 'USER' | 'DEV' | 'RESOLUTION';

// エラーコンテキスト
export interface ErrorContext {
  [key: string]: string | number | boolean | undefined;
}
```

---

## 🌐 I18nAdapter 統合

### 設計原則
- StandardErrorクラスがI18nAdapterを内包
- メッセージ取得時に自動的にローカライズ
- コンテキスト変数の自動置換

### 実装詳細
```typescript
// コンストラクタでI18nAdapterを初期化
constructor(errorCode: ValidErrorCode, context: ErrorContext = {}) {
  // ...
  this.i18n = new I18nAdapter();
}

// メッセージ取得時にI18nAdapterを使用
public getUserMessage(): string {
  return this.i18n.getMessage(this.getUserMessageKey(), this.context);
}
```

---

## 🛠️ エラーコード管理システム

### シェルスクリプト設計 (`scripts/validate-and-test.sh`)

#### 主要機能
1. **list**: エラーコード一覧表示
2. **reserve**: 新規エラーコード予約
3. **validate**: 整合性チェック
4. **generate**: ドキュメント生成

#### 技術スタック
- **Shell Script**: 軽量で高速
- **jq**: JSON処理
- **grep/sed**: テキスト処理

#### カテゴリ別テンプレート
```bash
get_category_templates() {
  local category="$1"
  local error_code="$2"
  
  case "$category" in
    "XPATH")
      echo "en_user:[TODO] XPath operation failed"
      echo "en_dev:[TODO] XPath selector error in $error_code"
      # ...
    "AUTH")
      echo "en_user:[TODO] Authentication failed"
      # ...
  esac
}
```

---

## 🔍 型安全性の実現

### コンパイル時検証
1. **MessageKey型**: `public/_locales/en/messages.json`から自動生成
2. **ValidErrorCode型**: MessageKeyから抽出
3. **TypeScript型チェック**: 存在しないエラーコードを検出

### 実装メカニズム
```typescript
// messages.jsonから型を生成
import messages from '../../../public/_locales/en/messages.json';
export type MessageKey = keyof typeof messages;

// エラーコードを抽出
type ExtractErrorCode<T extends string> = 
  T extends `${infer Code}_${ErrorMessageType}` ? Code : never;

// 有効なエラーコード型
export type ValidErrorCode = ExtractErrorCode<MessageKey>;
```

---

## 📊 品質保証メカニズム

### 自動検証レベル

1. **Level 1: TypeScript型チェック**
   - コンパイル時にエラーコードの存在を検証
   - IDEでのオートコンプリート支援

2. **Level 2: スクリプト検証**
   - 使用されているエラーコードの整合性チェック
   - メッセージの完成度チェック（[TODO]検出）

3. **Level 3: 単体テスト**
   - StandardErrorクラスの動作検証
   - I18nAdapter統合の検証

### 検証フロー
```bash
# 開発時
npm run error:validate    # Level 2検証

# ビルド時  
npm run type-check       # Level 1検証
npm run test            # Level 3検証
```

---

## 🔄 データフロー

### エラー発生から表示まで

1. **エラー発生**
   ```typescript
   throw new StandardError('E_XPATH_0001', { xpath: '//*[@id="test"]' });
   ```

2. **エラーキャッチ**
   ```typescript
   catch (error) {
     if (error instanceof StandardError) {
       // ...
     }
   }
   ```

3. **メッセージ取得**
   ```typescript
   const userMsg = error.getUserMessage(); // I18nAdapter経由
   ```

4. **UI表示**
   ```typescript
   showErrorToUser(userMsg); // ローカライズ済みメッセージ
   ```

### メッセージ解決プロセス
1. エラーコード → メッセージキー生成
2. メッセージキー → I18nAdapter
3. I18nAdapter → messages.json参照
4. コンテキスト変数置換
5. ローカライズ済みメッセージ返却

---

## 🚀 パフォーマンス考慮事項

### 最適化ポイント
1. **I18nAdapterキャッシュ**: メッセージの重複読み込み防止
2. **遅延初期化**: 必要時のみI18nAdapter初期化
3. **軽量スクリプト**: Node.js依存を排除したシェルスクリプト

### メモリ使用量
- StandardErrorインスタンス: ~200バイト
- I18nAdapterインスタンス: ~1KB（キャッシュ含む）
- 総メモリ影響: 無視できるレベル

---

## 🔧 拡張性設計

### 新カテゴリ追加
1. `get_category_templates()`関数にケース追加
2. 適切なメッセージテンプレート定義
3. `npm run error:reserve <NEW_CATEGORY>`で即座に利用可能

### 新言語対応
1. `public/_locales/<lang>/messages.json`追加
2. `reserve_error_code()`関数で新言語対応
3. I18nAdapterが自動的に新言語を認識

### 新機能追加
- エラー統計機能
- エラーレポート機能
- 自動翻訳機能
- エラー分析ダッシュボード
