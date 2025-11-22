# ドキュメント一覧

最終更新日: 2024年11月22日

---

## 📋 現在有効なドキュメント

### プロジェクト管理

| ドキュメント                                                                       | 説明                                  | 対象者             |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ------------------ |
| [残タスク一覧](./remaining-tasks.md)                                               | 未完了タスクの一覧と優先順位          | 全員               |
| [アーキテクチャ改善タスクリスト](./architecture-improvement-tasks.md)              | 全タスクの詳細定義（完了/未完了含む） | プロジェクト管理者 |
| [アーキテクチャ改善 - 最終レポート](./architecture-improvement-final-report-v2.md) | 完了した作業の詳細レポート            | 全員               |

### 開発ガイド

| ドキュメント                                                                     | 説明                                   | 対象者               |
| -------------------------------------------------------------------------------- | -------------------------------------- | -------------------- |
| [開発者ガイド](./developer-guide.md)                                             | プロジェクト構造と開発の進め方         | 新規開発者           |
| [コーディング規約](./coding-conventions.md)                                      | コーディングルールとベストプラクティス | 全開発者             |
| [次のステップと実装ガイド](./architecture-next-steps.md)                         | タスク1の具体的な実装方針              | 実装担当者           |
| [エラーハンドリング戦略](./error-handling-strategy.md)                           | エラーハンドリングの方針とパターン     | 全開発者             |
| [UseCase Result パターンガイド](./usecase-result-pattern-guide.md)               | UseCaseでのResultパターン使用方法      | 全開発者             |
| [Presentation層エラーハンドリングガイド](./presentation-error-handling-guide.md) | Presentation層でのエラー処理方法       | フロントエンド開発者 |
| [テスト更新ガイド](./test-update-guide.md)                                       | Resultパターン移行時のテスト更新方法   | 全開発者             |

### アーキテクチャ

| ドキュメント                                             | 説明                           | 対象者       |
| -------------------------------------------------------- | ------------------------------ | ------------ |
| [アーキテクチャ解析レポート](./architecture-analysis.md) | 現在のアーキテクチャの詳細分析 | アーキテクト |
| [アーキテクチャ図](./architecture-diagrams.md)           | 10種類のアーキテクチャ図       | 全員         |
| [ドメインモデル](./domain-model.md)                      | ドメインモデルの説明           | 全開発者     |
| [ADR (Architecture Decision Records)](./adr/)            | アーキテクチャ決定記録         | アーキテクト |

### その他

| ドキュメント                       | 説明                       | 対象者   |
| ---------------------------------- | -------------------------- | -------- |
| [エラーコード一覧](./error-codes/) | エラーコードの定義と説明   | 全開発者 |
| [ユーザーガイド](./user-guides/)   | エンドユーザー向けのガイド | ユーザー |
| [内部ガイド](./internal-guides/)   | 内部向けのガイド           | チーム内 |

---

## 📁 アーカイブ

完了したタスクのドキュメントは `docs/old/` 配下に日付ディレクトリで管理されています。

### 2024-11-22

以下のドキュメントは完了したため、アーカイブされました：

- `error-handling-implementation-status.md` - エラーハンドリング実装状況（100%完了）
- `architecture-improvement-final-report.md` - 最終レポート v1（v2に統合）
- `architecture-improvement-summary.md` - サマリー（最終レポートに統合）
- `architecture-improvement-progress.md` - 進捗レポート（残タスク一覧に統合）
- `aggregate-implementation-status.md` - Aggregate実装状況（100%完了）
- `implementation-completion-report.md` - 実装完了レポート（最終レポートに統合）

---

## 🎯 ドキュメントの使い方

### 新規開発者の場合

1. [開発者ガイド](./developer-guide.md) を読む
2. [コーディング規約](./coding-conventions.md) を確認
3. [アーキテクチャ図](./architecture-diagrams.md) でシステム全体を理解
4. [エラーハンドリング戦略](./error-handling-strategy.md) を確認

### タスクを実施する場合

1. [残タスク一覧](./remaining-tasks.md) で優先順位を確認
2. [アーキテクチャ改善タスクリスト](./architecture-improvement-tasks.md) で詳細を確認
3. 該当するガイド（[次のステップと実装ガイド](./architecture-next-steps.md) など）を参照
4. 実装後、[テスト更新ガイド](./test-update-guide.md) に従ってテストを更新

### アーキテクチャを理解する場合

1. [アーキテクチャ解析レポート](./architecture-analysis.md) で現状を理解
2. [アーキテクチャ図](./architecture-diagrams.md) で視覚的に理解
3. [ドメインモデル](./domain-model.md) でビジネスロジックを理解
4. [ADR](./adr/) で設計決定の背景を理解

---

## 📝 ドキュメント更新ルール

### 更新時の注意事項

1. **最終更新日を記載**: すべてのドキュメントに最終更新日を記載
2. **変更履歴を記録**: 重要な変更は変更履歴セクションに記録
3. **関連ドキュメントへのリンク**: 関連するドキュメントへのリンクを追加
4. **アーカイブルール**: 完了したタスクのドキュメントは `docs/old/YYYY-MM-DD/` に移動

### ドキュメントの種類

- **タスク管理**: 残タスク一覧、タスクリスト、進捗レポート
- **ガイド**: 開発者ガイド、実装ガイド、テストガイド
- **アーキテクチャ**: 解析レポート、アーキテクチャ図、ADR
- **完了レポート**: 最終レポート、実装完了レポート

---

## 🔗 外部リンク

### 推奨書籍

- [Clean Architecture](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164) (Robert C. Martin)
- [Domain-Driven Design](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215) (Eric Evans)
- [Implementing Domain-Driven Design](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577) (Vaughn Vernon)
- [Refactoring](https://www.amazon.com/Refactoring-Improving-Existing-Addison-Wesley-Signature/dp/0134757599) (Martin Fowler)

### 参考サイト

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/)

---

最終更新日: 2024年11月22日
