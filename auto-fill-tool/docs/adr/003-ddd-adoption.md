# ADR-003: ドメイン駆動設計（DDD）の採用

## ステータス

承認済み

## コンテキスト

Auto-Fill Toolは、Website、XPath、AutomationVariablesなど、複雑なビジネスルールを持つドメインモデルを扱います。これらのビジネスロジックを適切に表現し、保守性を確保する必要がありました。

## 決定

ドメイン駆動設計（DDD）の戦術的パターンを採用します：

1. **Entity**: 識別子を持つオブジェクト
2. **Value Object**: 不変の値オブジェクト
3. **Aggregate**: トランザクション境界を持つエンティティの集合
4. **Domain Service**: エンティティに属さないビジネスロジック
5. **Repository**: 永続化の抽象化
6. **Domain Event**: ドメイン内で発生する重要なイベント

## 理由

### 1. ビジネスロジックの明確化

- ドメインモデルがビジネスルールを表現
- ユビキタス言語の確立

### 2. 不変性の保証

- Value Objectによる型安全性
- エンティティの不変操作

### 3. トランザクション境界の明確化

- Aggregateによる整合性の保証
- 並行処理での問題を防止

### 4. ビジネスロジックの集約

- ドメインモデル内にビジネスルールを配置
- アプリケーション層はオーケストレーションのみ

## 結果

### ポジティブな影響

- ビジネスルールがドメインモデル内に集約された
- 型安全性が大幅に向上
- テストが容易になった
- コードの可読性が向上

### ネガティブな影響

- 学習コストが高い
- Value Objectの作成により、コード量が増加
- 小さな変更でも複数のクラスを修正する必要がある場合がある

### トレードオフ

- **シンプルさ vs 表現力**: コードは複雑になるが、ビジネスルールの表現力が向上
- **開発速度 vs 品質**: 初期開発は遅いが、長期的には品質が向上

## 実装例

### Entity

```typescript
export class Website {
  private readonly id: WebsiteId; // Value Object
  private readonly name: string;

  constructor(data: WebsiteData) {
    this.validate(data);
    this.id = WebsiteId.from(data.id);
    this.name = data.name;
  }

  // Immutable setter
  setName(name: string): Website {
    return new Website({
      id: this.id.getValue(),
      name: name.trim(),
      // ...
    });
  }
}
```

### Value Object

```typescript
export class WebsiteId {
  private readonly value: string;

  constructor(id: string) {
    this.value = this.validate(id);
  }

  private validate(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Website ID cannot be empty');
    }
    return id.trim();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: WebsiteId): boolean {
    return this.value === other.value;
  }
}
```

### Domain Service

```typescript
export class URLMatchingService {
  matches(websiteUrl: WebsiteUrl, targetUrl: string): boolean {
    // ビジネスロジック
    return websiteUrl.getDomain() === new URL(targetUrl).hostname;
  }
}
```

### Aggregate

```typescript
export class XPathCollection {
  private readonly xpaths: ReadonlyMap<string, XPathData>;

  add(xpath: XPathData): XPathCollection {
    // Aggregateの整合性を保つ
    const newXPaths = new Map(this.xpaths);
    newXPaths.set(xpath.id, xpath);
    return new XPathCollection(Array.from(newXPaths.values()));
  }
}
```

## 代替案

### 代替案1: Anemic Domain Model

- **説明**: エンティティはデータのみを持ち、ロジックはServiceに配置
- **メリット**: シンプル、理解しやすい
- **デメリット**: ビジネスロジックが分散、保守性が低い
- **却下理由**: ビジネスルールの表現力が低い

### 代替案2: Transaction Script

- **説明**: 各ユースケースがすべてのロジックを持つ
- **メリット**: 非常にシンプル
- **デメリット**: コードの重複、保守性が低い
- **却下理由**: 複雑なビジネスルールに対応できない

## 関連する決定

- ADR-001: クリーンアーキテクチャの採用
- ADR-005: Value Objectの積極的な使用
- ADR-006: Resultパターンの採用

## 参考資料

- Domain-Driven Design (Eric Evans)
- Implementing Domain-Driven Design (Vaughn Vernon)
- https://martinfowler.com/bliki/DomainDrivenDesign.html

---

日付: 2024-11-22  
作成者: Architecture Team  
レビュアー: Development Team
