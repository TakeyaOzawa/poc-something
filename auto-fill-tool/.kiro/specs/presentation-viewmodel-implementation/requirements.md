# Requirements Document

## Introduction

Presentation層のViewModel完全実装により、Presentation層からDomainエンティティへの直接参照を排除し、レイヤー間の結合度を低減します。現在、4つのPresenterファイルでDomainエンティティを直接インスタンス化しており、これがアーキテクチャの原則に反しています。

## Glossary

- **Presentation層**: ユーザーインターフェースとユーザー操作を処理する層
- **Domain層**: ビジネスロジックとエンティティを含む層
- **ViewModel**: Presentation層で使用するデータ表現
- **DTO (Data Transfer Object)**: レイヤー間でデータを転送するためのオブジェクト
- **UseCase**: Application層のビジネスロジックを実行するクラス
- **Presenter**: Presentation層でViewとUseCaseを仲介するクラス

## Requirements

### Requirement 1

**User Story:** As a developer, I want Presentation層がDomainエンティティに直接依存しないようにしたい, so that レイヤー間の結合度が低減され、保守性が向上する

#### Acceptance Criteria

1. WHEN SystemSettingsPresenterがsaveGeneralSettings()を実行する THEN SystemSettingsCollectionを直接インスタンス化せずにDTOを使用する
2. WHEN SystemSettingsPresenterがsaveRecordingSettings()を実行する THEN SystemSettingsCollectionを直接インスタンス化せずにDTOを使用する
3. WHEN StorageSyncManagerPresenterがcreateConfig()を実行する THEN StorageSyncConfigエンティティの代わりにDTOを受け取る
4. WHEN VariableManagerがaddVariable()を実行する THEN AutomationVariablesを動的にimportせずにUseCaseを使用する
5. WHEN AutomationVariablesManagerPresenterがsaveVariables()を実行する THEN AutomationVariablesを動的にimportせずにUseCaseを使用する

### Requirement 2

**User Story:** As a developer, I want UseCaseがDTOベースの入力を受け取るようにしたい, so that Presentation層でエンティティを作成する必要がなくなる

#### Acceptance Criteria

1. WHEN UpdateSystemSettingsUseCaseが実行される THEN SystemSettingsCollectionエンティティの代わりにDTOを受け取る
2. WHEN CreateSyncConfigUseCaseが実行される THEN StorageSyncConfigエンティティの代わりにDTOを受け取る
3. WHEN SaveAutomationVariablesUseCaseが実行される THEN AutomationVariablesエンティティの代わりにDTOを受け取る
4. WHEN UseCase内でエンティティを作成する THEN 入力DTOから適切にエンティティを構築する
5. WHEN エンティティ作成に失敗する THEN Resultパターンで適切なエラーを返す

### Requirement 3

**User Story:** As a developer, I want 既存のテストが引き続き動作するようにしたい, so that リファクタリング後も品質が保証される

#### Acceptance Criteria

1. WHEN UseCaseの入力が変更される THEN 対応するテストを更新する
2. WHEN Presenterの実装が変更される THEN 対応するテストを更新する
3. WHEN すべてのテストを実行する THEN すべてのテストが通過する
4. WHEN アーキテクチャテストを実行する THEN Presentation層からDomainエンティティへのimportが0件である
5. WHEN ビルドを実行する THEN エラーなく完了する

### Requirement 4

**User Story:** As a developer, I want 段階的に移行できるようにしたい, so that 一度にすべてを変更するリスクを最小化できる

#### Acceptance Criteria

1. WHEN SystemSettings関連の変更を完了する THEN 他の機能に影響を与えない
2. WHEN StorageSyncConfig関連の変更を完了する THEN 他の機能に影響を与えない
3. WHEN AutomationVariables関連の変更を完了する THEN 他の機能に影響を与えない
4. WHEN 各段階でテストを実行する THEN すべてのテストが通過する
5. WHEN 各段階でビルドを実行する THEN エラーなく完了する
