# 設計書

## 概要

この設計書は、auto-fill-toolプロジェクトのPresentation層におけるViewModel実装を完了するためのアプローチを概説します。主な目標は以下の通りです：

1. SystemSettingsPresenterをSystemSettingsCollectionを直接インスタンス化する代わりにDTOを使用するようにリファクタリング
2. StorageSyncManagerPresenterをStorageSyncConfigエンティティを直接使用する代わりにDTOベースのインターフェースを使用するようにリファクタリング
3. AutomationVariablesManagerPresenterをドメインエンティティの動的インポートを排除するようにリファクタリング
4. すべてのPresentation層コンポーネントが一貫したViewModelパターンに従うことを確保

## アーキテクチャ

### 現在の状態

コードベースは現在以下の状況です：

- SystemSettingsPresenterがSystemSettingsCollectionエンティティを直接インスタンス化
- StorageSyncManagerPresenterがStorageSyncConfigエンティティを直接使用
- AutomationVariablesManagerPresenterがAutomationVariablesエンティティを動的にインポート
- Presentation層コンポーネント間で一貫性のないパターン

### 目標状態

実装後：

- すべてのPresenterがUIデータ表現にViewModelを使用
- すべてのUseCase相互作用がデータ転送にDTOを使用
- Presentation層でのドメインエンティティの直接インスタンス化なし
- 一貫したViewModelMapperの使用によるデータ変換

## コンポーネントとインターフェース

### 影響を受けるコンポーネント

1. **SystemSettingsPresenter**
   - 現在: SystemSettingsCollectionを直接インスタンス化
   - 目標: UseCaseからのSystemSettingsOutputDtoとUI用のSystemSettingsViewModelを使用

2. **StorageSyncManagerPresenter**
   - 現在: StorageSyncConfigエンティティを直接使用
   - 目標: StorageSyncConfigViewModelとDTOベースのUseCaseインターフェースを使用

3. **AutomationVariablesManagerPresenter**
   - 現在: AutomationVariablesエンティティを動的にインポート
   - 目標: AutomationVariablesViewModelと静的DTOインターフェースを使用

### データフローアーキテクチャ

```
UI層
    ↓ (ユーザー入力)
Presenter層 (ViewModels)
    ↓ (DTOs)
UseCase層
    ↓ (ドメインオブジェクト)
ドメイン層
```

### ViewModelマッピング戦略

- **入力フロー**: UI → ViewModel → DTO → UseCase
- **出力フロー**: UseCase → DTO → ViewModelMapper → ViewModel → UI
- **エラーハンドリング**: 既存のエラーメッセージパターンとI18nサポートを維持

## データモデル

### SystemSettingsPresenterリファクタリング

**現在の問題**: 直接エンティティインスタンス化
```typescript
// 現在（問題あり）
const settingsCollection = result.value!;
const settingsDto = SystemSettingsMapper.toOutputDto(settingsCollection);
```

**解決策**: DTOベースアプローチ
```typescript
// 目標（正しい）
const settingsDto = result.value!; // UseCaseから既にDTO
const settingsViewModel = ViewModelMapper.toSystemSettingsViewModel(settingsDto);
```

### StorageSyncManagerPresenterリファクタリング

**現在の問題**: 直接エンティティ使用
```typescript
// 現在（問題あり）
async createConfig(config: StorageSyncConfig): Promise<void>
```

**解決策**: ViewModelベースインターフェース
```typescript
// 目標（正しい）
async createConfig(configViewModel: StorageSyncConfigViewModel): Promise<void>
```

### AutomationVariablesManagerPresenterリファクタリング

**現在の問題**: 動的エンティティインポート
```typescript
// 現在（問題あり）
const { AutomationVariables } = await import('@domain/entities/AutomationVariables');
const automationVariables = new AutomationVariables(automationVariablesData);
```

**解決策**: DTOベースデータ構造
```typescript
// 目標（正しい）
const saveInput: SaveAutomationVariablesInputDto = {
  websiteId: variablesViewModel.websiteId,
  status: variablesViewModel.status as 'enabled' | 'disabled',
  variables: variablesViewModel.variables
};
```

## 正確性プロパティ

_プロパティとは、システムのすべての有効な実行において真であるべき特性や動作のことです。本質的に、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証の橋渡しとして機能します。_

### プロパティ1: ViewModel-DTO変換の一貫性

_任意の_ ViewModelとDTO間のデータ変換において、変換はすべての重要なデータフィールドを保持し、変換プロセス全体を通してデータの整合性を維持すべきです。
**検証対象: 要件1.1, 1.2, 2.1, 2.4, 3.1**

### プロパティ2: ViewModelMapperの使用一貫性

_任意の_ Presenterでのデータ変換において、変換は直接変換や手動マッピングではなくViewModelMapperメソッドを使用すべきです。
**検証対象: 要件1.3, 4.3**

### プロパティ3: DTOベースのUseCase通信

_任意の_ PresenterからのUseCase相互作用において、通信はドメインエンティティではなく入力と出力の両方でDTOインターフェースを使用すべきです。
**検証対象: 要件1.2, 2.2, 3.4, 4.2**

### プロパティ4: 一貫したViewModelの使用

_任意の_ PresenterでのUIデータ表現において、データはドメインエンティティや生のDTOではなくViewModelとして構造化されるべきです。
**検証対象: 要件2.3, 3.2, 4.1**

### プロパティ5: 機能等価性の保持

_任意の_ リファクタリング前に動作していた操作において、同じ操作はリファクタリング後も同一の結果を生成すべきです。
**検証対象: 要件5.1, 5.3**

### プロパティ6: エラーハンドリングの一貫性

_任意の_ 以前に特定のエラーメッセージを表示していたエラー条件において、リファクタリングされたコードは同じエラーメッセージとハンドリング動作を表示すべきです。
**検証対象: 要件1.4, 5.4**

### プロパティ7: 動的インポートなしの型安全性

_任意の_ AutomationVariablesManagerPresenterの操作において、コードはドメインエンティティの動的インポートを使用せずにTypeScriptの型安全性を維持すべきです。
**検証対象: 要件3.3**

### プロパティ8: ドメインロジックの委譲

_任意の_ Presenterでのドメインロジック操作において、ロジックは直接エンティティ操作ではなく適切なUseCaseに委譲されるべきです。
**検証対象: 要件4.4**

## エラーハンドリング

### データ変換エラー

ViewModelとDTO間の変換時：

- 必要なフィールドが存在することを検証
- 欠落または無効なデータに対して意味のあるエラーメッセージを提供
- 既存のI18nメッセージキーと形式を維持
- デバッグ用に変換エラーをログ出力

### UseCase統合エラー

UseCase相互作用のリファクタリング時：

- 既存のエラーハンドリングパターンを保持
- 該当する場合はResultパターンの使用を維持
- 既存のエラーメッセージ翻訳を保持
- UIへのエラー伝播の一貫性を確保

## テスト戦略

### 単体テスト

既存の単体テストは回帰テストとして機能します：

- 既存のすべてのPresenterテストは引き続き合格する必要があります
- テストはリファクタリング後も動作が変更されていないことを検証します
- モックオブジェクトはエンティティインターフェースの代わりにDTOインターフェースを使用すべきです

### プロパティベーステスト

このリファクタリングでは新機能を追加するのではなく、アーキテクチャの一貫性を改善するだけなので、プロパティベーステストは適用されません。

### 統合テスト

- UI入力からUseCase実行までの完全なデータフローをテスト
- ViewModel ↔ DTO変換が正しく動作することを検証
- エラーハンドリングパスが機能し続けることを確保

## 実装アプローチ

### フェーズ1: SystemSettingsPresenterリファクタリング

1. **現在の実装を分析**
   - すべての直接SystemSettingsCollectionインスタンス化を特定
   - 現在のデータフローパターンをマップ
   - 既存のエラーハンドリングを文書化

2. **データフローをリファクタリング**
   - 直接エンティティインスタンス化を削除
   - UseCaseからSystemSettingsOutputDtoを使用
   - すべての変換にViewModelMapperを適用
   - ViewModelを使用するようにメソッドシグネチャを更新

3. **エラーハンドリングを更新**
   - エラーメッセージの一貫性を確保
   - I18nメッセージキーを維持
   - エラー伝播パターンを保持

### フェーズ2: StorageSyncManagerPresenterリファクタリング

1. **メソッドシグネチャを更新**
   - `StorageSyncConfig`パラメータから`StorageSyncConfigViewModel`に変更
   - ViewModelを使用するように戻り値の型を更新
   - UseCase境界でのDTO変換を確保

2. **設定操作をリファクタリング**
   - 作成: UseCase入力用にViewModelをDTOに変換
   - 更新: DTOベースの更新操作を使用
   - 検証: ViewModelデータ構造で動作
   - テスト: ViewModelを適切なDTO形式に変換

### フェーズ3: AutomationVariablesManagerPresenterリファクタリング

1. **動的インポートを排除**
   - 動的エンティティインポートを静的DTOインターフェースに置き換え
   - 保存操作にSaveAutomationVariablesInputDtoを使用
   - リファクタリング全体を通して型安全性を維持

2. **データ処理を更新**
   - ViewModelとDTOのみで動作
   - すべてのデータ変換にViewModelMapperを使用
   - UseCase相互作用が適切なDTOインターフェースを使用することを確保

### フェーズ4: 一貫性検証

1. **すべてのPresenterをレビュー**
   - 一貫したViewModelの使用パターンを確保
   - DTOベースのUseCase相互作用を検証
   - ViewModelMapperの使用一貫性をチェック

2. **ドキュメントを更新**
   - 新しいパターンを反映するようにコードコメントを更新
   - アーキテクチャドキュメントが最新であることを確保

## リスク軽減

1. **破壊的変更リスク**: リファクタリングが既存機能を破壊する可能性
   - 軽減策: 各変更後に包括的なテストスイートを実行
   - 軽減策: 可能な限り同一のパブリックインターフェースを維持

2. **データ損失リスク**: ViewModel ↔ DTO変換でデータが失われる可能性
   - 軽減策: 変換用の包括的なプロパティベーステストを実装
   - 軽減策: すべてのデータフィールドが変換を通して保持されることを検証

3. **パフォーマンスリスク**: 追加のデータ変換がパフォーマンスに影響する可能性
   - 軽減策: 変更前後の重要パスをプロファイル
   - 軽減策: 必要に応じてViewModelMapperメソッドを最適化

## 成功基準

1. **アーキテクチャの一貫性**: すべてのPresenterがViewModelパターンに従う
2. **機能の保持**: すべての既存機能が同一に動作する
3. **型安全性**: TypeScriptコンパイルエラーなし
4. **テストカバレッジ**: すべての既存テストが変更なしで合格
5. **コード品質**: Presentation層でのドメインエンティティの直接インスタンス化なし

## ファイル別変更

### SystemSettingsPresenter.ts

**主要な変更**:
- SystemSettingsCollectionインスタンス化を削除
- UseCaseからSystemSettingsOutputDtoを直接使用
- UIデータにViewModelMapper.toSystemSettingsViewModel()を適用
- ViewModelをUpdateSystemSettingsInputDtoに変換するように保存メソッドを更新

### StorageSyncManagerPresenter.ts

**主要な変更**:
- メソッドシグネチャをStorageSyncConfigからStorageSyncConfigViewModelに変更
- UseCase境界でViewModelをDTOに変換
- すべてのデータ変換にViewModelMapperを使用
- 既存のエラーハンドリングパターンを維持

### AutomationVariablesManagerPresenter.ts

**主要な変更**:
- AutomationVariablesエンティティの動的インポートを削除
- 保存操作にSaveAutomationVariablesInputDtoを使用
- 全体を通してAutomationVariablesViewModelで動作
- 動的インポートなしで静的型付けを維持

## 検証アプローチ

1. **コンパイル時検証**: TypeScriptコンパイルが成功することを確保
2. **ランタイム検証**: 動作の保持を検証するために完全なテストスイートを実行
3. **手動テスト**: UI機能が同一のままであることを検証
4. **コードレビュー**: アーキテクチャパターンが一貫して適用されていることを確保
