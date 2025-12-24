# 残タスク一覧

最終更新日: 2024年11月22日

---

## 📊 全体進捗

### タスク完了状況

- 🔴 優先度: 高 - 2/3 完了（67%）
- 🟡 優先度: 中 - 3/4 完了（75%）
- 🟢 優先度: 低 - 0/3 完了（0%）
- **全体**: 5/10 完了（50%）

### アーキテクチャスコア

- **開始時**: 78/100
- **現在**: 88/100
- **改善**: +10ポイント
- **目標**: 90/100（全タスク完了時）

---

## 🔴 優先度: 高（残り1タスク）

### [ ] タスク1: Presentation層のViewModel完全実装

**進捗**: 40%  
**推定残り工数**: 1週間  
**影響度**: 高

#### 完了した内容

- ✅ GeneralSettingsManager.ts
- ✅ RecordingSettingsManager.ts
- ✅ AppearanceSettingsManager.ts

#### 残りの作業

##### 高優先度（エンティティクラスの直接使用）

- [ ] `SystemSettingsPresenter.ts` - `SystemSettingsCollection`を直接インスタンス化
- [ ] `StorageSyncManagerPresenter.ts` - `StorageSyncConfig`を使用
- [ ] `VariableManager.ts` - `AutomationVariables`を動的にimport
- [ ] `AutomationVariablesManagerPresenter.ts` - `AutomationVariables`を動的にimport

##### 低優先度（Data型の使用 - 許容可能）

- `AutoFillHandler.ts` - `WebsiteData`, `AutomationVariablesData`等を使用
- `background/index.ts` - `MasterPasswordPolicy`, `LogEntry`を使用

#### 推奨アプローチ

**Option 1: UseCaseをDTOベースに変更（推奨）**

```typescript
// Before
export interface SaveAutomationVariablesInput {
  automationVariables: AutomationVariables; // ❌ エンティティを直接受け取る
}

// After
export interface SaveAutomationVariablesInput {
  websiteId: string;
  status: 'enabled' | 'disabled';
  variables: Record<string, string>;
}
```

**Option 2: 段階的な移行（現実的）**

1. 新規コードではViewModelのみを使用
2. 既存コードは優先度に応じて段階的に移行
3. Data型と定数の使用は一時的に許容

---

## 🟡 優先度: 中（残り1タスク）

### [ ] タスク7: Domain Serviceのステートレス化

**推定工数**: 2日  
**影響度**: 中

#### 背景

一部のDomain Serviceがインスタンス変数を持ち、ステートレスでない状態です。

#### サブタスク

- [ ] 7.1 状態を持つDomain Serviceの特定
  - `src/domain/services/`配下を調査
  - インスタンス変数を持つサービスをリストアップ

- [ ] 7.2 リファクタリング計画の策定
  - 各サービスの状態の必要性を評価
  - Entityへの移動 or パラメータ化を決定

- [ ] 7.3 リファクタリングの実施
  - 状態をEntityに移動
  - またはメソッドパラメータとして渡す

- [ ] 7.4 テストの更新

#### 完了条件

- [ ] すべてのDomain Serviceがステートレス
- [ ] 必要な状態はEntityに移動
- [ ] すべてのテストが通過

---

## 🟢 優先度: 低（残り3タスク）

### [ ] タスク8: テストカバレッジの可視化

**推定工数**: 1日  
**影響度**: 低

#### サブタスク

- [ ] 8.1 カバレッジツールの設定
  - Jest設定にカバレッジオプションを追加
  - カバレッジ閾値の設定

- [ ] 8.2 カバレッジレポートの可視化
  - HTMLレポートの生成
  - CI/CDでのカバレッジ表示

- [ ] 8.3 カバレッジ目標の設定
  - Domain層: 90%以上
  - Application層: 85%以上
  - Infrastructure層: 75%以上

- [ ] 8.4 CI/CDへの統合

---

### [ ] タスク9: パフォーマンス最適化

**推定工数**: 3日  
**影響度**: 低

#### サブタスク

- [ ] 9.1 パフォーマンス計測の実装
- [ ] 9.2 ボトルネックの特定
- [ ] 9.3 最適化の実施
- [ ] 9.4 パフォーマンステストの追加

---

### [ ] タスク10: Bounded Contextの明確化

**推定工数**: 1週間  
**影響度**: 低

#### サブタスク

- [ ] 10.1 Bounded Contextの分析
- [ ] 10.2 Context Mapの作成
- [ ] 10.3 モジュール構造の見直し
- [ ] 10.4 Anti-Corruption Layerの実装

---

## 📋 完了したタスク（参考）

### ✅ タスク2: エラーハンドリングの統一

**完了日**: 2024年11月22日  
**達成率**: 100%

- エラーハンドリング戦略の文書化
- DomainErrorクラスの実装
- Result型の拡張
- エラーコード体系の確立（1000-5999）
- Domain層エンティティ: 21個のメソッドをResultパターンに変更

### ✅ タスク3: Application層のDTO完全実装

**確認日**: 2024年11月22日  
**達成率**: 100%

- すべてのUseCaseがDTOを使用していることを確認
- 追加作業は不要（既に完了済み）

### ✅ タスク4: Portディレクトリの整理

**完了日**: 2024年11月22日  
**達成率**: 100%

- 4つの新しいPortファイルを作成
- 命名規則の統一（\*Port.ts）
- 後方互換性を維持

### ✅ タスク5: Aggregateの明示的定義

**完了日**: 2024年11月22日  
**達成率**: 100%

- AggregateRoot基底クラスの実装
- 5つのAggregate Rootの実装
- ドメインイベント管理機能の実装

### ✅ タスク6: アーキテクチャドキュメントの整備

**完了日**: 2024年11月22日  
**達成率**: 100%

- 10種類のアーキテクチャ図を作成
- 包括的な開発者ガイドを作成
- 詳細なコーディング規約を作成
- ADRテンプレートの作成

---

## 🎯 次のアクション

### 短期（1週間以内）

1. **タスク1の残り作業を完了**
   - SystemSettingsPresenterの修正
   - StorageSyncManagerPresenterの修正
   - 動的importの段階的な削減

### 中期（1ヶ月以内）

2. **タスク7: Domain Serviceのステートレス化**
3. **UseCase層でのResultパターン徹底**
4. **Presentation層でのエラーハンドリング統一**

### 長期（3ヶ月以内）

5. **優先度: 低のタスクの実施**
6. **継続的な改善とレビュー**
7. **エラーメッセージのi18n対応**

---

## 📚 関連ドキュメント

### 現在有効なドキュメント

- [アーキテクチャ改善タスクリスト](./architecture-improvement-tasks.md) - 詳細なタスク定義
- [最終レポート v2](./architecture-improvement-final-report-v2.md) - 完了した作業の詳細
- [実装完了レポート](./implementation-completion-report.md) - 実装統計と成果
- [次のステップ](./architecture-next-steps.md) - 具体的な実装方針
- [開発者ガイド](./developer-guide.md) - 開発の進め方
- [コーディング規約](./coding-conventions.md) - コーディングルール

### アーカイブ（docs/old/2024-11-22/）

- error-handling-implementation-status.md
- architecture-improvement-final-report.md
- architecture-improvement-summary.md
- architecture-improvement-progress.md
- aggregate-implementation-status.md

---

## 💡 推奨事項

### 新規開発時のルール

1. **ViewModelの使用**: Presentation層では必ずViewModelを使用
2. **DTOの使用**: UseCaseの入出力は必ずDTOを使用
3. **Resultパターン**: エラーハンドリングは必ずResultパターンを使用
4. **エラーコード**: エラーには必ず適切なエラーコードを付与

### 既存コードの改善

1. **段階的な移行**: 一度にすべてを変更せず、優先度に応じて段階的に
2. **後方互換性**: 既存のコードを壊さないように注意
3. **テストの維持**: 変更後も必ずテストが通過することを確認

---

最終更新日: 2024年11月22日
