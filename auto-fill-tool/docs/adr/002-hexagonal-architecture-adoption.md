# ADR-002: ヘキサゴナルアーキテクチャ（Ports and Adapters）の採用

## ステータス

承認済み

## コンテキスト

Chrome拡張機能は、Chrome Storage API、Messaging API、Tab APIなど、多くの外部システムと連携します。これらの外部依存を適切に管理し、ビジネスロジックを保護する必要がありました。

## 決定

ヘキサゴナルアーキテクチャ（Ports and Adapters パターン）を採用し、以下の構造を実装します：

### Ports（インターフェース）

- `domain/ports/` - ドメイン層が必要とする外部機能のインターフェース
- `domain/repositories/` - データ永続化のインターフェース

### Adapters（実装）

- `infrastructure/adapters/` - Portの具体的な実装
- `infrastructure/repositories/` - Repositoryの具体的な実装

## 理由

### 1. 技術的詳細からの分離

- ビジネスロジックがChrome APIに依存しない
- ストレージの実装を変更しても、ビジネスロジックは影響を受けない

### 2. テスタビリティ

- Portをモックすることで、外部依存なしでテスト可能
- 統合テストと単体テストの明確な分離

### 3. 置き換え可能性

- Chrome Storage → IndexedDB への移行が容易
- 外部APIの変更に強い

### 4. 明確な境界

- アプリケーションの境界が明確
- 外部システムとの統合ポイントが明確

## 結果

### ポジティブな影響

- 外部依存が明確に定義された
- テストが容易になった（モックが簡単）
- 技術スタックの変更が容易になった
- 新しい外部システムの統合が容易

### ネガティブな影響

- インターフェースと実装の両方を管理する必要がある
- 小さな変更でもPort/Adapterの両方を更新する必要がある場合がある

### トレードオフ

- **柔軟性 vs 複雑性**: 柔軟性が高いが、構造が複雑
- **抽象化 vs 直接性**: 抽象化により保守性が向上するが、直接的なコードより理解に時間がかかる

## 実装例

### Port定義

```typescript
// domain/ports/LoggerPort.ts
export interface LoggerPort {
  info(message: string, context?: LogContext): void;
  error(message: string, error?: Error): void;
}
```

### Adapter実装

```typescript
// infrastructure/adapters/ConsoleLogger.ts
export class ConsoleLogger implements LoggerPort {
  info(message: string, context?: LogContext): void {
    console.log(message, context);
  }

  error(message: string, error?: Error): void {
    console.error(message, error);
  }
}
```

### 使用例

```typescript
// application/usecases/SaveWebsiteUseCase.ts
export class SaveWebsiteUseCase {
  constructor(
    private repository: WebsiteRepository, // Port
    private logger: LoggerPort // Port
  ) {}

  async execute(input: SaveWebsiteInput): Promise<Result<...>> {
    this.logger.info('Saving website', { name: input.name });
    // ...
  }
}
```

## 代替案

### 代替案1: 直接依存

- **説明**: ビジネスロジックが直接Chrome APIを使用
- **メリット**: シンプル、コード量が少ない
- **デメリット**: テストが困難、技術スタックの変更が困難
- **却下理由**: 長期的な保守性が低い

### 代替案2: Serviceレイヤーパターン

- **説明**: Serviceレイヤーで外部依存をラップ
- **メリット**: シンプル、理解しやすい
- **デメリット**: 依存関係の方向が不明確
- **却下理由**: 依存関係逆転の原則が適用されない

## 関連する決定

- ADR-001: クリーンアーキテクチャの採用
- ADR-003: DDDの採用
- ADR-004: DIコンテナの実装

## 参考資料

- Hexagonal Architecture (Alistair Cockburn)
- https://alistair.cockburn.us/hexagonal-architecture/

---

日付: 2024-11-22  
作成者: Architecture Team  
レビュアー: Development Team
