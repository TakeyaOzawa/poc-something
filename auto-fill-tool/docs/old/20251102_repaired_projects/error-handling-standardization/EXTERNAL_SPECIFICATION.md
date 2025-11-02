# エラーハンドリング標準化機能 - 外部仕様

**作成日**: 2025-11-02  
**バージョン**: 2.0  
**ステータス**: 実装完了

---

## 📋 機能概要

統一されたエラーハンドリングシステムにより、型安全性、多言語対応、開発効率を向上させます。

### 主要機能

1. **型安全なエラーコード管理**
2. **自動メッセージキー生成**
3. **多言語対応（英語・日本語）**
4. **コンパイル時検証**
5. **開発支援ツール**

---

## 🎯 エラーコード仕様

### エラーコード形式
```
E_{CATEGORY}_{NUMBER}
```

**例**: `E_XPATH_0001`, `E_AUTH_0001`, `E_STORAGE_0001`

### サポートカテゴリ
- `XPATH`: XPath操作関連エラー
- `AUTH`: 認証関連エラー
- `USER`: ユーザー管理関連エラー
- `STORAGE`: ストレージ操作関連エラー
- `SYNC`: データ同期関連エラー

### メッセージキー自動生成
各エラーコードから3つのメッセージキーを自動生成：

- `E_XPATH_0001_USER`: ユーザー向けメッセージ
- `E_XPATH_0001_DEV`: 開発者向けメッセージ
- `E_XPATH_0001_RESOLUTION`: 解決方法メッセージ

---

## 💻 使用方法

### 基本的な使用例
```typescript
// エラーを投げる
throw new StandardError('E_XPATH_0001', { 
  xpath: '//*[@id="invalid"]',
  url: 'https://example.com' 
});

// エラーハンドリング
try {
  // some operation
} catch (error) {
  if (error instanceof StandardError) {
    console.log('User:', error.getUserMessage());
    console.log('Dev:', error.getDevMessage());
    console.log('Resolution:', error.getResolutionMessage());
    
    // UIに表示
    showErrorToUser(error.getUserMessage());
  }
}
```

### 型安全性
```typescript
// ✅ 型安全 - 存在するエラーコードのみ使用可能
throw new StandardError('E_XPATH_0001', {});

// ❌ コンパイルエラー - 存在しないエラーコード
throw new StandardError('E_INVALID_0001', {}); // Type error!
```

---

## 🛠️ 開発支援ツール

### エラーコード管理コマンド

```bash
# エラーコード一覧表示
npm run error:list

# 新しいエラーコードを予約
npm run error:reserve XPATH

# エラーコードの整合性チェック
npm run error:validate

# ドキュメント生成
npm run error:generate
```

### 自動化機能

1. **コンパイル時検証**: TypeScriptが存在しないエラーコードを検出
2. **カテゴリ別テンプレート**: 予約時に適切なメッセージテンプレートを自動生成
3. **多言語同期**: 英語・日本語のメッセージを同時作成

---

## 🌐 多言語対応

### メッセージ定義例

**English (`public/_locales/en/messages.json`)**:
```json
{
  "E_XPATH_0001_USER": {
    "message": "Element not found on the page"
  },
  "E_XPATH_0001_DEV": {
    "message": "XPath selector failed: element not found in DOM"
  },
  "E_XPATH_0001_RESOLUTION": {
    "message": "Check XPath selector or wait for element to load"
  }
}
```

**Japanese (`public/_locales/ja/messages.json`)**:
```json
{
  "E_XPATH_0001_USER": {
    "message": "ページ上で要素が見つかりませんでした"
  },
  "E_XPATH_0001_DEV": {
    "message": "XPathセレクターが失敗しました: DOM内で要素が見つかりません"
  },
  "E_XPATH_0001_RESOLUTION": {
    "message": "XPathセレクターを確認するか、要素の読み込み完了を待ってください"
  }
}
```

---

## 📊 品質保証

### 自動検証
- **型チェック**: コンパイル時にエラーコードの存在を検証
- **整合性チェック**: 全エラーコードに対してUSER/DEV/RESOLUTIONメッセージの存在を確認
- **プレースホルダー検出**: [TODO]が残っているメッセージを警告

### 開発フロー
1. `npm run error:reserve <CATEGORY>` でエラーコード予約
2. 自動生成されたテンプレートメッセージを編集
3. `npm run error:validate` で整合性確認
4. TypeScriptコンパイルで型安全性確認

---

## 🔄 移行・運用

### 既存コードからの移行
1. 既存のエラー処理を特定
2. 適切なカテゴリでエラーコードを予約
3. StandardErrorクラスに置き換え
4. メッセージを適切に設定

### 継続的な品質管理
- CIパイプラインでの自動検証
- 定期的なエラーメッセージレビュー
- ユーザーフィードバックに基づく改善
