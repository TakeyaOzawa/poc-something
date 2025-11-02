# インフラストラクチャ層命名規則

**作成日**: 2025-11-01
**最終確認**: 2025-11-02

## 概要

インフラストラクチャ層では、Clean ArchitectureとHexagonal Architectureの原則に従い、特定の命名パターンを強制します。

## 許可されるクラス名パターン

### ✅ 推奨パターン

| パターン | 用途 | 例 |
|---------|------|-----|
| `*Adapter` | 外部システムとの連携 | `ChromeI18nAdapter`, `NotionSyncAdapter` |
| `*Repository` | データ永続化 | `ChromeStorageXPathRepository` |
| `*Factory` | オブジェクト生成 | `UuidIdGenerator` |
| `*Mapper` | データ変換 | `XPathCollectionMapper` |
| `*Decorator` | 機能拡張 | `PerformanceDecorator` |

### ❌ 禁止パターン

| パターン | 理由 | 代替案 |
|---------|------|--------|
| `*Service` | ドメイン層のServiceと混同 | `*Adapter`を使用 |
| その他の任意の名前 | アーキテクチャパターンが不明確 | 上記の推奨パターンを使用 |

## ESLintルール

以下のESLintルールにより自動的に検証されます：

```javascript
// .eslintrc.js
'no-restricted-syntax': [
  'error',
  {
    selector: "ClassDeclaration[id.name=/Service$/]",
    message: 'Infrastructure layer should use Adapter pattern instead of Service pattern'
  }
]

// .eslintrc-architecture.js
'infrastructure-adapter-pattern': {
  // インフラ層のクラス名とファイル名を検証
}
```

## 実装例

### ✅ 正しい実装

```typescript
// ChromeI18nAdapter.ts
export class ChromeI18nAdapter implements I18nPort {
  getMessage(key: string): string {
    return chrome.i18n.getMessage(key);
  }
}
```

### ❌ 間違った実装

```typescript
// ChromeI18nService.ts - これは禁止
export class ChromeI18nService implements I18nPort {
  getMessage(key: string): string {
    return chrome.i18n.getMessage(key);
  }
}
```

## 理由

1. **明確な責務分離**: Adapterパターンにより外部システムとの連携が明確
2. **アーキテクチャの一貫性**: Hexagonal Architectureの原則に準拠
3. **保守性の向上**: 命名により実装パターンが自明
4. **混乱の防止**: ドメイン層のServiceとの区別が明確

## 検証コマンド

```bash
# アーキテクチャ専用のlint実行
npm run lint:architecture

# 全体のlint実行
npm run lint
```
