# AutomationVariables Manager - Design Document

## 概要

Automation Variables（自動化変数）を管理する画面を新規作成します。この画面では、変数の一覧表示、追加、編集、削除、インポート/エクスポート機能を提供します。

## 現状分析

### 現在のlocalStorage構造

現在、`automationVariables` はオブジェクト形式（辞書型）で保存されています：

```typescript
// 現在の構造
{
  "automationVariables": {
    "websiteId1": {
      "websiteId": "websiteId1",
      "variables": {
        "username": "test@example.com",
        "password": "testpass123"
      },
      "status": "active",
      "updatedAt": "2025-10-15T10:00:00.000Z"
    },
    "websiteId2": { ... }
  }
}
```

### 課題

1. **配列形式への移行が必要**: 管理画面で一覧表示しやすい配列形式への変更が必要
2. **CRUD操作の画面がない**: 現在は変数管理モーダル内でWebsiteごとに編集するのみ
3. **一覧性の欠如**: すべてのAutomationVariablesを横断的に確認・管理できない

## 変更内容

### 1. localStorage構造の変更

配列形式に変更し、管理しやすくします：

```typescript
// 新しい構造
{
  "automationVariables": [
    {
      "id": "unique-id-1", // 新規追加: 一意なID
      "websiteId": "websiteId1",
      "variables": {
        // 動的な構造: レコードによって項目名と数が変わる
        "username": "test@example.com",
        "password": "testpass123"
      },
      "status": "active",
      "updatedAt": "2025-10-15T10:00:00.000Z"
    },
    {
      "id": "unique-id-2",
      "websiteId": "websiteId2",
      "variables": {
        // 別のレコードでは異なる項目構成
        "api_key": "key12345",
        "token": "token67890",
        "endpoint": "https://api.example.com"
      },
      "status": "test",
      "updatedAt": "2025-10-15T11:00:00.000Z"
    }
  ]
}
```

**variables の動的な構造:**
- `variables` は `{ [key: string]: string }` 型で、任意の項目を保持可能
- レコードごとに項目名と数が異なる（username/password, api_key/token など）
- UI での表示時に Website Repository からサイト名を動的に取得

### 2. エンティティの拡張

`AutomationVariables` エンティティに以下を追加：
- `id`: 一意な識別子（UUID v4）

**注意:** サイト名 (`websiteName`) はエンティティに含めず、表示時に `WebsiteRepository` から動的に取得します。

### 3. マイグレーション

既存データを新形式に移行する処理を実装：
- オブジェクト形式 → 配列形式
- 各エントリに `id` を付与（UUID v4 で自動生成）

## 画面構成

### UI レイアウト

```
┌─────────────────────────────────────────────────────────────┐
│ 🔤 Automation Variables 管理                                 │
├─────────────────────────────────────────────────────────────┤
│ [➕ 新規作成] [📤 エクスポート] [📥 インポート] [← 戻る]  │
├─────────────────────────────────────────────────────────────┤
│ フィルター: [全サイト ▾]                                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Site Name: Example Site                                 │ │
│ │ Website ID: abc123...                                   │ │
│ │ Status: Active                                          │ │
│ │ Variables: username, password (2 variables)             │ │
│ │ Updated: 2025-10-15 10:00:00                           │ │
│ │                          [✏️ 編集] [🗑️ 削除] [📋 複製] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Site Name: Another Site                                 │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 編集/新規作成モーダル

```
┌───────────────────────────────────────┐
│ Automation Variables を編集           │
├───────────────────────────────────────┤
│ サイト: [Example Site ▾]             │
│                                       │
│ ステータス:                           │
│ ○ Active  ○ Inactive  ○ Test        │
│                                       │
│ 変数一覧:                             │
│ ┌─────────────────────────────────┐  │
│ │ username: test@example.com      │  │
│ │                      [🗑️ 削除] │  │
│ │ password: ********              │  │
│ │                      [🗑️ 削除] │  │
│ └─────────────────────────────────┘  │
│                                       │
│ 新しい変数を追加:                     │
│ 変数名: [____________]               │
│ 値:     [____________]               │
│ [➕ 追加]                            │
│                                       │
│ [💾 保存] [✖ キャンセル]            │
└───────────────────────────────────────┘
```

## ユースケース一覧

### 1. Core Use Cases

#### GetAllAutomationVariablesUseCase
- **目的**: すべての Automation Variables を取得
- **入力**: なし
- **出力**: `AutomationVariables[]`

#### GetAutomationVariablesByIdUseCase
- **目的**: ID で特定の Automation Variables を取得
- **入力**: `id: string`
- **出力**: `AutomationVariables | null`

#### GetAutomationVariablesByWebsiteIdUseCase
- **目的**: Website ID で Automation Variables を取得
- **入力**: `websiteId: string`
- **出力**: `AutomationVariables | null`

#### SaveAutomationVariablesUseCase (既存)
- **目的**: Automation Variables を保存/更新
- **入力**: `AutomationVariables`
- **出力**: `void`

#### DeleteAutomationVariablesUseCase
- **目的**: Automation Variables を削除
- **入力**: `id: string`
- **出力**: `void`

#### DuplicateAutomationVariablesUseCase
- **目的**: Automation Variables を複製
- **入力**: `id: string`
- **出力**: `AutomationVariables`

### 2. Import/Export Use Cases

#### ExportAutomationVariablesUseCase (既存)
- **目的**: CSV 形式でエクスポート
- **入力**: なし
- **出力**: `string` (CSV)

#### ImportAutomationVariablesUseCase (既存)
- **目的**: CSV 形式からインポート
- **入力**: `csvText: string`
- **出力**: `void`

### 3. Migration Use Case

#### MigrateAutomationVariablesStorageUseCase
- **目的**: オブジェクト形式から配列形式へマイグレーション
- **入力**: なし
- **出力**: `{ migrated: boolean; count: number }`
- **実行タイミング**: アプリケーション起動時、またはマイグレーション画面から手動実行

## 実装手順

### Phase 1: データ層の準備 (1-2日)

#### 1.1 エンティティの拡張
- [ ] `AutomationVariables` エンティティに `id` フィールドを追加
- [ ] `AutomationVariables.create()` で自動的に UUID を生成
- [ ] `fromExisting()` メソッドを追加（マイグレーション用）
- [ ] 既存テストの更新

**ファイル:**
- `src/domain/entities/AutomationVariables.ts`
- `src/domain/entities/__tests__/AutomationVariables.test.ts`

#### 1.2 Repository の更新
- [ ] `ChromeStorageAutomationVariablesRepository` を配列形式に対応
- [ ] `loadStorage()` で配列とオブジェクト両方の形式をサポート（後方互換性）
- [ ] `save()`, `load()`, `loadAll()`, `delete()` を配列形式で動作するよう修正
- [ ] 既存テストの更新

**ファイル:**
- `src/infrastructure/repositories/ChromeStorageAutomationVariablesRepository.ts`
- `src/infrastructure/repositories/__tests__/ChromeStorageAutomationVariablesRepository.test.ts`

#### 1.3 マイグレーション処理の実装
- [ ] `MigrateAutomationVariablesStorageUseCase` の実装
- [ ] オブジェクト形式 → 配列形式への変換ロジック
- [ ] 各エントリに UUID を自動生成
- [ ] マイグレーションのテスト

**ファイル:**
- `src/usecases/MigrateAutomationVariablesStorageUseCase.ts`
- `src/usecases/__tests__/MigrateAutomationVariablesStorageUseCase.test.ts`

### Phase 2: Use Cases の実装 (1日)

#### 2.1 Core Use Cases
- [ ] `GetAllAutomationVariablesUseCase` の実装
- [ ] `GetAutomationVariablesByIdUseCase` の実装
- [ ] `GetAutomationVariablesByWebsiteIdUseCase` の実装（既存の Repository メソッドを使用）
- [ ] `DeleteAutomationVariablesUseCase` の実装
- [ ] `DuplicateAutomationVariablesUseCase` の実装
- [ ] すべての Use Case のテスト

**ファイル:**
- `src/usecases/GetAllAutomationVariablesUseCase.ts`
- `src/usecases/GetAutomationVariablesByIdUseCase.ts`
- `src/usecases/DeleteAutomationVariablesUseCase.ts`
- `src/usecases/DuplicateAutomationVariablesUseCase.ts`
- 対応するテストファイル

### Phase 3: Presenter の実装 (1日)

#### 3.1 Presenter インターフェース
- [ ] `IAutomationVariablesManagerView` インターフェースの定義
- [ ] `AutomationVariablesManagerPresenter` の実装
- [ ] WebsiteRepository から Website 名を取得して表示データに含める
- [ ] Presenter のテスト

**ファイル:**
- `src/presentation/automation-variables-manager/AutomationVariablesManagerPresenter.ts`
- `src/presentation/automation-variables-manager/__tests__/AutomationVariablesManagerPresenter.test.ts`

### Phase 4: UI の実装 (2-3日)

#### 4.1 HTML ファイルの作成
- [ ] `public/automation-variables-manager.html` の作成
- [ ] 一覧表示レイアウト
- [ ] 編集/新規作成モーダル
- [ ] 削除確認ダイアログ
- [ ] インポート/エクスポート UI

**ファイル:**
- `public/automation-variables-manager.html`

#### 4.2 Controller の実装
- [ ] `AutomationVariablesManagerController` の実装
- [ ] DI コンテナのセットアップ
- [ ] イベントハンドラの実装
- [ ] バリデーション処理

**ファイル:**
- `src/presentation/automation-variables-manager/AutomationVariablesManagerController.ts`
- `src/presentation/automation-variables-manager/index.ts`

#### 4.3 ビルド設定の更新
- [ ] `webpack.config.js` にエントリポイントを追加
- [ ] `manifest.json` に画面を登録（必要に応じて）

**ファイル:**
- `webpack.config.js`
- `public/manifest.json`

### Phase 5: 多言語対応 (半日)

#### 5.1 i18n メッセージの追加
- [ ] 日本語メッセージの追加
- [ ] 英語メッセージの追加
- [ ] 中国語メッセージの追加（必要に応じて）

**ファイル:**
- `public/_locales/ja/messages.json`
- `public/_locales/en/messages.json`
- `public/_locales/zh_CN/messages.json`

### Phase 6: 統合とマイグレーション (1日)

#### 6.1 起動時マイグレーション
- [ ] `background/index.ts` にマイグレーション処理を追加
- [ ] 初回起動時に自動的に実行
- [ ] マイグレーション完了フラグを保存

**ファイル:**
- `src/presentation/background/index.ts`

#### 6.2 既存画面からのリンク
- [ ] `popup.html` にリンクボタンを追加
- [ ] `xpath-manager.html` にリンクボタンを追加（オプション）

**ファイル:**
- `public/popup.html`
- `src/presentation/popup/WebsiteListController.ts`

### Phase 7: テストとドキュメント (1日)

#### 7.1 E2E テストシナリオ
- [ ] 新規作成フロー
- [ ] 編集フロー
- [ ] 削除フロー
- [ ] インポート/エクスポートフロー
- [ ] マイグレーションフロー

#### 7.2 ドキュメント更新
- [ ] README の更新
- [ ] CHANGELOG の更新
- [ ] ユーザーガイドの作成（必要に応じて）

**ファイル:**
- `README.md`
- `CHANGELOG.md`
- `docs/USER_GUIDE.md`（新規）

## テスト計画

### Unit Tests

| テスト対象 | テストケース | 期待値 |
|-----------|------------|--------|
| **AutomationVariables Entity** | | |
| - create() | UUID が自動生成される | id フィールドが存在 |
| - setVariable() | 変数を追加/更新できる | 新しい AutomationVariables インスタンス |
| - removeVariable() | 変数を削除できる | 変数が削除された新インスタンス |
| **Repository** | | |
| - save() | 配列形式で保存される | localStorage に配列で保存 |
| - load() | ID で取得できる | 正しい AutomationVariables を返す |
| - loadAll() | すべて取得できる | 全件の配列を返す |
| - delete() | 削除できる | 指定 ID のデータが削除 |
| - 後方互換性 | オブジェクト形式を読み込める | 正常に変換される |
| **Migration UseCase** | | |
| - execute() | オブジェクト → 配列 | 正しく変換される |
| - execute() | ID を生成 | すべてのエントリに id が付与 |
| - execute() | variables を保持 | すべての変数が保持される |
| **Core UseCases** | | |
| - GetAll | すべて取得 | 全件返却 |
| - GetById | ID で取得 | 該当データ返却 |
| - Delete | 削除 | 指定データが削除 |
| - Duplicate | 複製 | 新しい ID で複製 |
| **Presenter** | | |
| - loadVariables() | 一覧表示 | view.showVariables() 呼び出し |
| - saveVariable() | 保存成功 | view.showSuccess() 呼び出し |
| - deleteVariable() | 削除成功 | view.showSuccess() 呼び出し |
| - importVariables() | インポート成功 | view.showSuccess() 呼び出し |

### Integration Tests

1. **マイグレーションテスト**
   - オブジェクト形式のデータを準備
   - マイグレーション実行
   - 配列形式になっていることを確認
   - すべてのデータが保持されていることを確認

2. **CRUD操作テスト**
   - 新規作成 → 一覧に表示されることを確認
   - 編集 → 変更が反映されることを確認
   - 削除 → 一覧から消えることを確認
   - 複製 → 新しいエントリが作成されることを確認

3. **インポート/エクスポートテスト**
   - エクスポート → CSV が正しい形式
   - インポート → CSV から正しく読み込まれる
   - 往復テスト → エクスポート → インポートで同じデータ

### E2E Tests (Manual)

1. **初回マイグレーション**
   - 旧形式のデータを持つ拡張機能をインストール
   - 起動時に自動マイグレーション
   - 管理画面でデータが正しく表示される

2. **管理画面の操作**
   - 新規作成ボタン → モーダル表示 → 保存 → 一覧に追加
   - 編集ボタン → モーダル表示 → 変更 → 保存 → 一覧更新
   - 削除ボタン → 確認ダイアログ → 削除 → 一覧から削除
   - 複製ボタン → 複製確認 → 新しいエントリ作成

3. **フィルタリング**
   - サイト選択 → 該当サイトのみ表示
   - "全サイト" 選択 → すべて表示

4. **インポート/エクスポート**
   - エクスポートボタン → CSV ダウンロード
   - インポートボタン → ファイル選択 → 確認 → データ追加

## リスクと対応策

### リスク 1: 既存データの破損
- **対応**: マイグレーション前にバックアップを作成
- **対応**: オブジェクト形式と配列形式の両方をサポート（後方互換性）

### リスク 2: マイグレーション失敗
- **対応**: エラー時はロールバック処理を実装
- **対応**: マイグレーション状態を記録し、再試行可能にする

### リスク 3: パフォーマンス低下
- **対応**: 配列のサイズが大きい場合は仮想スクロールを検討
- **対応**: フィルタリング処理を最適化

### リスク 4: 既存機能への影響
- **対応**: 既存の変数管理機能は維持
- **対応**: 段階的な移行を可能にする

## スケジュール概算

| フェーズ | 作業内容 | 見積時間 |
|---------|---------|---------|
| Phase 1 | データ層の準備 | 1-2日 |
| Phase 2 | Use Cases 実装 | 1日 |
| Phase 3 | Presenter 実装 | 1日 |
| Phase 4 | UI 実装 | 2-3日 |
| Phase 5 | 多言語対応 | 0.5日 |
| Phase 6 | 統合・マイグレーション | 1日 |
| Phase 7 | テスト・ドキュメント | 1日 |
| **合計** | | **7.5-10日** |

## 追加機能: 実行履歴の表示

### automationResults の統合

AutomationVariables 管理画面では、各変数の最新の実行結果も表示します。

詳細は [AUTOMATION_RESULTS_DESIGN.md](./AUTOMATION_RESULTS_DESIGN.md) を参照してください。

**主な表示項目:**
- 実行ステータス（ready, doing, success, failed）
- 実行時間（秒）
- 結果詳細
- 開始・終了日時

**表示ロジック:**
- 各 AutomationVariables の ID に対して、最新の1件（startFrom が最新）を表示
- 実行履歴が存在しない場合は「実行履歴なし」を表示
- 実行中の場合は「実行中...」を表示

**実装への影響:**
- Presenter で `GetLatestAutomationResultUseCase` を呼び出し
- 一覧表示データに実行結果を含める
- UI で実行結果セクションを追加

### 実装スケジュールへの影響

実行履歴機能の追加により、以下のフェーズが追加されます：

| フェーズ | 作業内容 | 見積時間 |
|---------|---------|---------|
| Phase 1.4 | AutomationResult Entity & Repository | 0.5日 |
| Phase 2.2 | AutomationResult UseCases | 0.5日 |
| Phase 3.2 | Presenter に実行結果取得を追加 | 0.5日 |
| Phase 4.4 | UI に実行結果表示を追加 | 0.5日 |
| **追加合計** | | **2日** |

**更新後の合計見積**: **9.5-12日**

## 次のステップ

1. このドキュメントをレビューして承認を得る
2. Phase 1 から順次実装を開始
3. 各フェーズ完了後にレビューとテストを実施
4. 段階的に統合してリリース

## 参考資料

- Clean Architecture パターン: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- 既存の XPath Manager 実装: `src/presentation/xpath-manager/`
- エンティティ設計: `src/domain/entities/AutomationVariables.ts`
- Repository パターン: `src/infrastructure/repositories/`
- 実行履歴機能: [docs/AUTOMATION_RESULTS_DESIGN.md](./AUTOMATION_RESULTS_DESIGN.md)
