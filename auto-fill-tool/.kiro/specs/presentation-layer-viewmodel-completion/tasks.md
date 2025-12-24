# 実装計画: Presentation層ViewModel完了

## 概要

この実装計画は、Presentation層におけるViewModel実装を完了するための残りの高優先度タスクに対処します。アプローチは、直接ドメインエンティティの使用を排除し、一貫したViewModelパターンを確立するために、残り4つのPresenterファイルをリファクタリングすることに焦点を当てています。

## タスク

- [x] 1. SystemSettingsPresenterをDTOベースアプローチにリファクタリング
  - [x] 1.1 SystemSettingsCollectionの直接インスタンス化を削除
    - loadSettings()メソッドをDTOで直接動作するように更新
    - エンティティでのSystemSettingsMapper.toOutputDto()呼び出しを削除
    - _要件: 1.1, 1.3_
  - [x] 1.2 ViewModel-to-DTO変換を使用するように保存メソッドを更新
    - saveGeneralSettings()をViewModelをUpdateSystemSettingsInputDtoに変換するように変更
    - saveRecordingSettings()をViewModelをUpdateSystemSettingsInputDtoに変換するように変更
    - saveAppearanceSettings()をViewModelをUpdateSystemSettingsInputDtoに変換するように変更
    - _要件: 1.2, 1.3_
  - [x] 1.3 SystemSettingsPresenterデータフロー用のプロパティテストを作成
    - **プロパティ1: ViewModel-DTO変換の一貫性**
    - **検証対象: 要件1.1, 1.2**
  - [x] 1.4 SystemSettingsPresenterエラーハンドリング用の単体テストを作成
    - 読み込みと保存操作のエラーハンドリング保持をテスト
    - _要件: 1.4_

- [x] 2. StorageSyncManagerPresenterをViewModelベースインターフェースにリファクタリング
  - [x] 2.1 ViewModelを使用するようにメソッドシグネチャを更新
    - createConfig()パラメータをStorageSyncConfigからStorageSyncConfigViewModelに変更
    - エンティティの代わりにViewModelで動作するように他のメソッドを更新
    - _要件: 2.1, 2.3_
  - [x] 2.2 UseCase相互作用用のViewModel-to-DTO変換を実装
    - createConfig()をUseCase入力用にViewModelをDTOに変換するように更新
    - updateConfig()をDTOベースの更新操作を使用するように更新
    - validateConfig()をViewModelデータ構造で動作するように更新
    - testConnection()をViewModelを適切なDTO形式に変換するように更新
    - _要件: 2.1, 2.2, 2.4_
  - [x] 2.3 StorageSyncManagerPresenter DTO使用用のプロパティテストを作成
    - **プロパティ3: DTOベースのUseCase通信**
    - **検証対象: 要件2.2**
  - [x] 2.4 StorageSyncManagerPresenter ViewModelハンドリング用の単体テストを作成
    - ViewModelパラメータハンドリングとDTO変換をテスト
    - _要件: 2.3_

- [x] 3. AutomationVariablesManagerPresenterをリファクタリングして動的インポートを排除
  - [x] 3.1 AutomationVariablesエンティティの動的インポートを削除
    - saveVariables()メソッドの動的インポートを置き換え
    - 代わりにSaveAutomationVariablesInputDtoインターフェースを使用
    - _要件: 3.1, 3.3_
  - [x] 3.2 DTOベースデータ構造を使用するようにsaveVariables()を更新
    - AutomationVariablesOutputDtoをSaveAutomationVariablesInputDtoに変換
    - 変換全体を通して型安全性を維持
    - _要件: 3.1, 3.2, 3.4_
  - [x] 3.3 AutomationVariablesManagerPresenter型安全性用のプロパティテストを作成
    - **プロパティ7: 動的インポートなしの型安全性**
    - **検証対象: 要件3.3**
  - [x] 3.4 AutomationVariablesManagerPresenter DTO使用用の単体テストを作成
    - DTOベースの保存操作と静的型付けをテスト
    - _要件: 3.2, 3.4_

- [x] 4. すべてのPresenter間で一貫したViewModelパターンを確保
  - [x] 4.1 ViewModelの使用一貫性をレビューおよび検証
    - すべてのPresenterがUIデータ表現にViewModelを使用することを検証
    - すべてのデータ変換にViewModelMapperが使用されることを確保
    - _要件: 4.1, 4.3_
  - [x] 4.2 DTOベースのUseCase通信を検証
    - すべてのUseCase相互作用がデータ転送にDTOを使用することを検証
    - Presenterでの直接ドメインエンティティ操作がないことを確保
    - _要件: 4.2, 4.4_
  - [x] 4.3 一貫したViewModelの使用用のプロパティテストを作成
    - **プロパティ4: 一貫したViewModelの使用**
    - **検証対象: 要件4.1**
  - [x] 4.4 ドメインロジック委譲用のプロパティテストを作成
    - **プロパティ8: ドメインロジック委譲**
    - **検証対象: 要件4.4**

- [x] 5. チェックポイント - 機能保持を検証
  - すべてのテストが合格することを確認し、質問があれば ユーザーに尋ねる。
  - TypeScriptコンパイルを実行してエラーがないことを検証
  - 既存機能が変更されていないことを検証
  - _要件: 5.1, 5.3_

- [-] 6. 最終検証とテスト
  - [x] 6.1 包括的なテストスイートを実行
    - すべての既存テストが変更なしで合格することを検証
    - 機能に回帰がないことを確保
    - _要件: 5.1, 5.3_
  - [x] 6.2 エラーハンドリングの一貫性を検証
    - エラー条件が同じエラーメッセージを生成することをテスト
    - エラーハンドリング動作が保持されることを検証
    - _要件: 5.4_
  - [x] 6.3 機能等価性用のプロパティテストを作成
    - **プロパティ5: 機能等価性の保持**
    - **検証対象: 要件5.1, 5.3**
  - [ ] 6.4 エラーハンドリング一貫性用のプロパティテストを作成
    - **プロパティ6: エラーハンドリングの一貫性**
    - **検証対象: 要件5.4**

## 注記

- 各タスクは追跡可能性のために特定の要件を参照しています
- チェックポイントは段階的な検証を確保します
- プロパティテストは普遍的な正確性プロパティを検証します
- 単体テストは特定の例とエッジケースを検証します
- アーキテクチャを改善しながら既存機能を維持することに焦点を当てています
