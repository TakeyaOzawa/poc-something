# アーキテクチャ改善 - 次のステップと実装ガイド

最終更新日: 2024年11月22日

> **注**: このドキュメントは、タスク1（Presentation層のViewModel完全実装）の具体的な実装方針を示します。
> 全体の残タスクについては [残タスク一覧](./remaining-tasks.md) を参照してください。

---

## 📊 現状サマリー

### 完了した作業

- ✅ エラーハンドリングの統一（100%）
- ✅ Application層のDTO完全実装（100%）
- ✅ Portディレクトリの整理（100%）
- ✅ Aggregateの明示的定義（100%）
- ✅ アーキテクチャドキュメントの整備（100%）
- 🔄 Presentation層のViewModel完全実装（40%）

### 現在の課題

Presentation層で以下のファイルがDomainエンティティを直接インスタンス化しています：

#### 高優先度（要対応）

1. `SystemSettingsPresenter.ts` - `SystemSettingsCollection`を直接インスタンス化
2. `StorageSyncManagerPresenter.ts` - `StorageSyncConfig`を使用
3. `VariableManager.ts` - `AutomationVariables`を動的にimport
4. `AutomationVariablesManagerPresenter.ts` - `AutomationVariables`を動的にimport

#### 低優先度（許容可能）

- `AutoFillHandler.ts` - `WebsiteData`, `AutomationVariablesData`等を使用（Data型は許容）
- `background/index.ts` - `MasterPasswordPolicy`, `LogEntry`を使用（定数/Enumは許容）

---

## 根本的な問題

### UseCaseの設計

現在のUseCaseは、Domainエンティティを直接受け取る設計になっています：

```typescript
// 現在の設計
export interface SaveAutomationVariablesInput {
  automationVariables: AutomationVariables; // ❌ エンティティを直接受け取る
}

export interface UpdateSystemSettingsInput {
  settings: SystemSettingsCollection; // ❌ エンティティを直接受け取る
}
```

この設計により、Presentation層でエンティティを作成する必要があります。

---

## 推奨される解決策

### アプローチ1: UseCaseをDTOベースに変更（推奨）

#### Before

```typescript
// UseCase
export interface SaveAutomationVariablesInput {
  automationVariables: AutomationVariables;
}

// Presenter
const automationVariables = new AutomationVariables(data);
await useCase.execute({ automationVariables });
```

#### After

```typescript
// UseCase
export interface SaveAutomationVariablesInput {
  websiteId: string;
  status: 'enabled' | 'disabled';
  variables: Record<string, string>;
}

// Presenter
await useCase.execute({
  websiteId: data.websiteId,
  status: data.status,
  variables: data.variables
});

// UseCase内部
async execute(input: SaveAutomationVariablesInput): Promise<Result<...>> {
  // UseCaseでエンティティを作成
  const automationVariables = AutomationVariables.create({
    websiteId: input.websiteId,
    status: input.status,
    variables: input.variables
  });

  const result = await this.repository.save(automationVariables);
  // ...
}
```

#### メリット

- Presentation層がDomainエンティティに依存しない
- UseCaseの入力が明確
- テストが容易

#### デメリット

- 多くのUseCaseを変更する必要がある
- 既存のコードへの影響が大きい

---

### アプローチ2: FactoryパターンでPresentation層から分離

#### Before

```typescript
// Presenter
const automationVariables = new AutomationVariables(data);
```

#### After

```typescript
// Factory (Application層)
export class AutomationVariablesFactory {
  static fromData(data: AutomationVariablesData): AutomationVariables {
    return new AutomationVariables(data);
  }
}

// Presenter
const automationVariables = AutomationVariablesFactory.fromData(data);
```

#### メリット

- 変更が小規模
- 既存のコードへの影響が少ない

#### デメリット

- 根本的な解決にはならない
- Presentation層がまだエンティティに依存

---

### アプローチ3: 段階的な移行（現実的）

#### Phase 1: 新規コードでDTOベースのUseCaseを使用

```typescript
// 新しいUseCase
export interface CreateWebsiteInput {
  name: string;
  startUrl?: string;
  editable?: boolean;
}

export class CreateWebsiteUseCase {
  async execute(input: CreateWebsiteInput): Promise<Result<WebsiteOutputDto, Error>> {
    // UseCase内でエンティティを作成
    const website = Website.create({
      name: input.name,
      startUrl: input.startUrl,
      editable: input.editable,
    });

    const result = await this.repository.save(website);
    if (result.isFailure) {
      return Result.failure(result.error!);
    }

    return Result.success(WebsiteMapper.toOutputDto(website));
  }
}
```

#### Phase 2: 既存のUseCaseを段階的に移行

優先度の高いUseCaseから順次変更：

1. SystemSettingsUseCase
2. AutomationVariablesUseCase
3. その他

#### Phase 3: Presentation層の更新

UseCaseの変更に合わせてPresenterを更新

---

## 具体的なタスク

### タスク1.1: SystemSettingsUseCaseのDTOベース化

#### 影響範囲

- `UpdateSystemSettingsUseCase.ts`
- `SystemSettingsPresenter.ts`
- `SettingsModalManager.ts`
- `GeneralSettingsManager.ts`
- `RecordingSettingsManager.ts`
- `AppearanceSettingsManager.ts`

#### 推定工数

3-5日

#### 手順

1. `UpdateSystemSettingsInput`をDTOベースに変更
2. UseCase内でエンティティを作成
3. Presenterを更新
4. テストを更新

---

### タスク1.2: AutomationVariablesUseCaseのDTOベース化

#### 影響範囲

- `SaveAutomationVariablesUseCase.ts`
- `AutomationVariablesManagerPresenter.ts`
- `VariableManager.ts`

#### 推定工数

3-5日

#### 手順

1. `SaveAutomationVariablesInput`をDTOベースに変更
2. UseCase内でエンティティを作成
3. Presenterを更新
4. テストを更新

---

## 推奨される優先順位

### 短期（1-2週間）

1. ✅ SystemSettings関連のViewModel化（完了）
2. 🔄 SystemSettingsUseCaseのDTOベース化
3. 🔄 SettingsModalManagerの更新

### 中期（1ヶ月）

4. AutomationVariablesUseCaseのDTOベース化
5. 他のUseCaseの段階的な移行

### 長期（3ヶ月）

6. すべてのUseCaseをDTOベースに統一
7. Presentation層からDomainエンティティへの依存を完全に排除

---

## 代替案: 現状を許容

### 許容する使用パターン

以下のパターンは、実用上問題が少ないため許容することも検討できます：

1. **Data型の使用**

   ```typescript
   import { WebsiteData } from '@domain/entities/Website';
   ```

   - Data型はエンティティのデータ表現で、DTOに近い
   - 影響が限定的

2. **定数/Enumの使用**

   ```typescript
   import { SyncDirection, SyncTiming } from '@domain/entities/StorageSyncConfig';
   ```

   - 定数は問題なし

3. **動的import**

   ```typescript
   const { AutomationVariables } = await import('@domain/entities/AutomationVariables');
   ```

   - 一時的な解決策として許容

### 排除すべき使用パターン

以下は優先的に排除すべきです：

1. **エンティティクラスの直接インスタンス化**

   ```typescript
   const settings = new SystemSettingsCollection({ ... }); // ❌
   ```

2. **エンティティクラスを型として使用（ViewModelに置き換え可能な場合）**
   ```typescript
   function loadSettings(settings: SystemSettings): void { ... } // ❌
   ```

---

## 結論

### 現実的なアプローチ

1. **新規コード**: DTOベースのUseCaseを使用
2. **既存コード**: 優先度に応じて段階的に移行
3. **許容範囲**: Data型と定数の使用は一時的に許容

### 期待される効果

- Presentation層とDomain層の結合度が低減
- テストが容易になる
- 保守性が向上

### 推定工数

- 完全な移行: 2-3ヶ月
- 主要部分の移行: 2-4週間

---

## 参考資料

### 関連ドキュメント

- [アーキテクチャ解析レポート](./architecture-analysis.md)
- [最終レポート](./architecture-improvement-final-report.md)

### 推奨パターン

- DTOパターン
- Factoryパターン
- Mapperパターン

---

最終更新日: 2024年11月22日
