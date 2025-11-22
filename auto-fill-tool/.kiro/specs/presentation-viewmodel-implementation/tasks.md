# Implementation Plan

- [x] 1. Phase 1: SystemSettings関連の実装
  - UpdateSystemSettingsUseCaseの入力をDTOベースに変更し、SystemSettingsPresenterを更新する
  - _Requirements: 1.1, 1.2, 2.1_

- [x] 1.1 UpdateSystemSettingsInputDTOの作成
  - `src/application/dtos/UpdateSystemSettingsInputDto.ts`を作成
  - すべての設定項目をオプショナルプロパティとして定義
  - _Requirements: 2.1_

- [x] 1.2 UpdateSystemSettingsUseCaseの修正
  - `execute()`メソッドの入力をDTOベースに変更
  - UseCase内でSystemSettingsCollectionエンティティを作成
  - 現在の設定を取得し、DTOの値でマージ
  - Resultパターンでエラーハンドリング
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 1.3 Property test for UpdateSystemSettingsUseCase
  - **Property 1: UseCase accepts DTO input**
  - **Validates: Requirements 2.1**

- [x] 1.4 SystemSettingsPresenterの修正
  - `saveGeneralSettings()`メソッドを修正してDTOを使用
  - `saveRecordingSettings()`メソッドを修正してDTOを使用
  - `saveAppearanceSettings()`メソッドを修正してDTOを使用
  - SystemSettingsCollectionの直接インスタンス化を削除
  - _Requirements: 1.1, 1.2_

- [x] 1.5 Unit tests for SystemSettingsPresenter
  - DTOを正しく構築してUseCaseに渡すことを確認
  - UseCaseからのResultを正しく処理することを確認
  - エラー時にViewに適切なメッセージを表示することを確認
  - _Requirements: 1.1, 1.2_

- [x] 1.6 Phase 1のテスト実行と検証
  - すべてのテストを実行して通過することを確認
  - ビルドを実行してエラーがないことを確認
  - _Requirements: 3.3, 3.5, 4.1, 4.4, 4.5_

---

- [ ] 2. Phase 2: StorageSyncConfig関連の実装
  - CreateSyncConfigUseCaseの入力をDTOベースに変更し、StorageSyncManagerPresenterを更新する
  - _Requirements: 1.3, 2.2_

- [ ] 2.1 CreateSyncConfigInputDTOの作成
  - `src/application/dtos/CreateSyncConfigInputDto.ts`を作成
  - すべての必須項目とオプショナル項目を定義
  - _Requirements: 2.2_

- [ ] 2.2 CreateSyncConfigUseCaseの修正
  - `execute()`メソッドの入力をDTOベースに変更
  - UseCase内でStorageSyncConfigエンティティを作成
  - Resultパターンでエラーハンドリング
  - _Requirements: 2.2, 2.4, 2.5_

- [ ] 2.3 Property test for CreateSyncConfigUseCase
  - **Property 2: UseCase accepts DTO input for sync config**
  - **Validates: Requirements 2.2**

- [ ] 2.4 StorageSyncManagerPresenterの修正
  - `createConfig()`メソッドを修正してDTOを受け取る
  - StorageSyncConfigエンティティの直接使用を削除
  - _Requirements: 1.3_

- [ ] 2.5 Unit tests for StorageSyncManagerPresenter
  - DTOを正しく構築してUseCaseに渡すことを確認
  - UseCaseからのResultを正しく処理することを確認
  - _Requirements: 1.3_

- [ ] 2.6 Phase 2のテスト実行と検証
  - すべてのテストを実行して通過することを確認
  - ビルドを実行してエラーがないことを確認
  - _Requirements: 3.3, 3.5, 4.2, 4.4, 4.5_

---

- [ ] 3. Phase 3: AutomationVariables関連の実装
  - SaveAutomationVariablesUseCaseの入力をDTOベースに変更し、PresenterとManagerを更新する
  - _Requirements: 1.4, 1.5, 2.3_

- [ ] 3.1 SaveAutomationVariablesInputDTOの作成
  - `src/application/dtos/SaveAutomationVariablesInputDto.ts`を作成
  - id, websiteId, variables, statusを定義
  - _Requirements: 2.3_

- [ ] 3.2 SaveAutomationVariablesUseCaseの修正
  - `execute()`メソッドの入力をDTOベースに変更
  - UseCase内でAutomationVariablesエンティティを作成
  - Resultパターンでエラーハンドリング
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 3.3 Property test for SaveAutomationVariablesUseCase
  - **Property 3: UseCase accepts DTO input for automation variables**
  - **Validates: Requirements 2.3**

- [ ] 3.4 VariableManagerの修正
  - `addVariable()`メソッドを修正してUseCaseを使用
  - AutomationVariablesの動的importを削除
  - _Requirements: 1.4_

- [ ] 3.5 AutomationVariablesManagerPresenterの修正
  - `saveVariables()`メソッドを修正してDTOを使用
  - AutomationVariablesの動的importを削除
  - _Requirements: 1.5_

- [ ] 3.6 Unit tests for VariableManager and AutomationVariablesManagerPresenter
  - DTOを正しく構築してUseCaseに渡すことを確認
  - UseCaseからのResultを正しく処理することを確認
  - _Requirements: 1.4, 1.5_

- [ ] 3.7 Phase 3のテスト実行と検証
  - すべてのテストを実行して通過することを確認
  - ビルドを実行してエラーがないことを確認
  - _Requirements: 3.3, 3.5, 4.3, 4.4, 4.5_

---

- [ ] 4. Phase 4: 最終検証とドキュメント更新
  - すべてのテストとアーキテクチャテストを実行し、ドキュメントを更新する
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 4.1 Property test for entity creation from DTO
  - **Property 4: Entity creation from DTO**
  - **Validates: Requirements 2.4**

- [ ] 4.2 Property test for error handling
  - **Property 5: Error handling for invalid DTO**
  - **Validates: Requirements 2.5**

- [ ] 4.3 アーキテクチャテストの実行
  - Presentation層からDomainエンティティへのimportが0件であることを確認
  - アーキテクチャテストを実行してルール違反がないことを確認
  - _Requirements: 3.4_

- [ ] 4.4 すべてのテストの実行
  - すべてのUnit Testsを実行
  - すべてのProperty-Based Testsを実行
  - すべてのテストが通過することを確認
  - _Requirements: 3.3_

- [ ] 4.5 ビルドの実行
  - ビルドを実行してエラーがないことを確認
  - _Requirements: 3.5_

- [ ] 4.6 ドキュメントの更新
  - `docs/architecture-next-steps.md`を更新
  - `docs/remaining-tasks.md`を更新
  - タスク1を完了としてマーク
  - _Requirements: すべて_

---

## Checkpoint

- [ ] 5. Checkpoint - すべてのテストが通過することを確認
  - Ensure all tests pass, ask the user if questions arise.
