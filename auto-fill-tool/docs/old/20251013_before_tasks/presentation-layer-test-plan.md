# Presentation層 テスト作成計画

## 概要

Presentation層の未テストファイル13件に対するテスト作成の優先順位と実装方針をまとめたドキュメントです。

**作成日**: 2025-01-08
**最終更新**: 2025-10-08
**ステータス**: Phase 1の一部完了

---

## テスト作成済みファイル

- ✅ `XPathManagerPresenter.test.ts`
- ✅ `ExecuteAutoFillHandler.test.ts`
- ✅ `GetXPathHandler.test.ts`
- ✅ `ShowXPathDialogHandler.test.ts`
- ✅ `XPathGenerator.test.ts` (現在は `XPathGenerationService.test.ts`)
- ✅ `PageOperationExecutor.test.ts` (27テストケース、カバレッジ90%以上達成 - 2025-10-08)

---

## テスト未作成ファイル一覧（13ファイル）

### Background Layer (2ファイル)
- `background/handlers/CancelAutoFillHandler.ts` (48行)
- `background/XPathContextMenuHandler.ts` (193行)

### Content Script Layer (5ファイル)
- `content-script/AutoFillHandler.ts` (198行)
- `content-script/AutoFillOverlay.ts` (450行)
- `content-script/XPathDialog.ts` (498行)

### Popup Layer (3ファイル)
- `popup/ModalManager.ts` (120行)
- `popup/WebsiteActionHandler.ts` (148行)
- `popup/WebsiteRenderer.ts` (69行)

### XPath Manager Layer (5ファイル)
- `xpath-manager/AutoFillExecutor.ts` (89行)
- `xpath-manager/SystemSettingsManager.ts` (80行)
- `xpath-manager/VariableManager.ts` (170行)
- `xpath-manager/WebsiteSelectManager.ts` (102行)
- `xpath-manager/XPathManagerView.ts` (111行)

---

## 優先順位別分類

## 🔴 最優先（Phase 1）

### 1. XPathContextMenuHandler.ts (2時間)

**行数**: 193行
**カバレッジ目標**: 90%以上

**理由**:
- XPath取得・保存の**核心機能**
- 新規サイト自動作成、start_url自動設定など重要なビジネスロジック
- バグがあるとXPath管理機能全体が使えなくなる
- 複雑な処理（UseCaseとの連携、ストレージ操作、通知）

**テスト方法**:
- browser.tabs, browser.storage, browser.contextMenusのモック
- MessageDispatcher, SaveXPathUseCase, IXPathRepositoryのモック
- INotificationServiceのモック

**主な懸念事項**:
- 複数のブラウザAPIモック
- URL解析とホスト名抽出
- ネストした非同期処理
- XPathリポジトリとの連携

**テストすべき主要機能**:
- `handleGetXPath()`: XPath取得と保存
- `handleShowXPath()`: XPath表示（保存なし）
- `handleContextMenuClick()`: メニューアイテムIDの分岐処理
- `createNewWebsite()`: 新規サイト自動作成
- `setStartUrlIfNeeded()`: start_url自動設定

---

### 2. AutoFillHandler.ts (2.5時間)

**行数**: 198行
**カバレッジ目標**: 90%以上

**理由**:
- **自動入力実行の核心**（ページロード時の自動実行）
- URL正規表現マッチング、CSV解析、status遷移など複雑なロジック
- バグがあると自動入力機能が全く動かない
- 'once' status の状態管理が重要

**テスト方法**:
- browser.storageのモック
- MessageDispatcherのモック
- AutoFillOverlayのモック
- matchUrl関数のモック

**主な懸念事項**:
- CSV解析ロジックのテスト
- URL マッチング（正規表現サポート）
- 'once' statusの状態遷移
- オーバーレイとの連携

**テストすべき主要機能**:
- `handlePageLoad()`: ページロード時の自動実行判定
- WebsiteConfig取得とフィルタリング（enabled/once）
- CSV解析とXPathデータ構築
- URL マッチングロジック（正規表現対応）
- 'once' → 'disabled' への状態遷移

---

### 3. WebsiteActionHandler.ts (2時間)

**行数**: 148行
**カバレッジ目標**: 90%以上

**理由**:
- Webサイト実行・保存・削除の**核心機能**
- popupからの実行フローを担当
- 'once' statusの状態遷移ロジック
- XPath削除との連携

**テスト方法**:
- browser.tabsのモック（tab作成）
- ChromeWebsiteConfigServiceのモック
- MessageDispatcherのモック
- alert()のモック

**主な懸念事項**:
- タブ作成とID取得
- setTimeout(500ms)の待機処理
- 'once' statusの状態遷移
- alert()のモック

**テストすべき主要機能**:
- `executeWebsite()`: 自動入力実行
- `saveWebsite()`: サイト作成/更新
- `deleteWebsite()`: サイト削除とXPath削除

---

**Phase 1 合計**: 3ファイル、約6.5時間

---

## 🟡 中優先度（Phase 2）

### 4. CancelAutoFillHandler.ts (30分)

**行数**: 48行
**カバレッジ目標**: 90%以上

**理由**:
- キャンセル機能は**ユーザー体験に直結**
- シンプルなのでテスト作成が早い（ROI高い）

**テスト方法**:
- IMessageHandlerの実装テスト
- ChromeAutoFillService.requestCancellation()の静的メソッドモック

**主な懸念事項**:
- 静的メソッドのモック

**テストすべき主要機能**:
- `handle()`: tabId取得とキャンセル要求
- tabIdがない場合のエラーハンドリング
- sender.tab.idからのtabId取得

---

### 5. SystemSettingsManager.ts (1.5時間)

**行数**: 80行
**カバレッジ目標**: 90%以上

**理由**:
- リトライ設定はシステム全体に影響
- バリデーションロジックのバグは致命的（無限ループ、負の値など）

**テスト方法**:
- HTMLInputElementsのモック
- ChromeStorageSystemSettingsRepositoryのモック
- alert()のモック

**主な懸念事項**:
- 入力値のバリデーション（範囲チェック、NaNチェック）
- alert()のモック
- リポジトリのload/save

**テストすべき主要機能**:
- `loadSystemSettings()`: 設定読み込み
- `saveSystemSettings()`: 設定保存とバリデーション
- バリデーション: min <= max, retryCount >= -1

---

### 6. VariableManager.ts (2時間)

**行数**: 170行
**カバレッジ目標**: 90%以上

**理由**:
- 変数機能は自動入力に必須
- ストレージ操作とDOM操作の両方がある

**テスト方法**:
- browser.storageのモック
- DOM生成のテスト
- イベントリスナーのアタッチ確認
- confirm()とalert()のモック

**主な懸念事項**:
- 動的HTML生成（変数リスト）
- イベントリスナーのアタッチ
- confirm()とalert()のモック
- XSS防止のテスト

**テストすべき主要機能**:
- `loadVariables()`: 変数一覧表示
- `addVariable()`: 変数追加
- `deleteVariable()`: 変数削除
- escapeHtml()のXSS防止

---

### 7. WebsiteSelectManager.ts (1.5時間)

**行数**: 102行
**カバレッジ目標**: 90%以上

**理由**:
- XPath Manager全体で使われる共通コンポーネント
- status更新ロジックがある

**テスト方法**:
- browser.storageのモック
- HTMLSelectElementのモック
- changeイベントのコールバック

**主な懸念事項**:
- select要素のoption動的生成
- changeイベントのコールバック
- 非同期CRUDメソッド

**テストすべき主要機能**:
- `initialize()`: イベントリスナー登録
- `loadWebsiteSelect()`: ドロップダウン生成
- `getWebsiteById()`: サイト取得
- `updateWebsite()`: サイト更新

---

**Phase 2 合計**: 4ファイル、約6.5時間

---

## 🟢 低優先度（Phase 3以降）

### 8. AutoFillOverlay.ts (3時間)

**行数**: 450行
**カバレッジ目標**: 90%以上

**理由**: テスト難易度が非常に高く、バグがあってもデータ破損には繋がらない。手動テストでも十分カバー可能。

**主な懸念事項**:
- Shadow DOMのテスト（JSDOM制限あり）
- ESCキーとボタンイベントのテスト
- カスタムイベント（auto-fill-progress-update）
- タイマーとアニメーション（setTimeout/transitionのモック）
- browser.runtime.sendMessageのモック

---

### 9. XPathDialog.ts (3時間)

**行数**: 498行
**カバレッジ目標**: 90%以上

**理由**: テスト難易度が非常に高く、視覚的UIコンポーネント。

**主な懸念事項**:
- Shadow DOMのテスト
- navigator.clipboard.writeText()のモック
- 位置計算（positionDialog）
- ESCキーとクリックイベント
- コピー成功時のビジュアルフィードバック（classList, timeout）

---

### 10. ModalManager.ts (1.5時間)

**行数**: 120行
**カバレッジ目標**: 90%以上

**理由**: UI補助コンポーネント

**主な懸念事項**:
- DOM要素（modal, form, inputs）の事前準備
- 変数リストの動的生成とイベント
- XSS防止（escapeHtml）のテスト

---

### 11. WebsiteRenderer.ts (45分)

**行数**: 69行
**カバレッジ目標**: 90%以上

**理由**: 純粋なHTML生成関数

**主な懸念事項**: なし（最もシンプル）

---

### 12. AutoFillExecutor.ts (1.5時間)

**行数**: 89行
**カバレッジ目標**: 90%以上

**理由**: 他のテストでカバー可能

**主な懸念事項**:
- WebsiteSelectManagerとの連携
- setTimeout(500ms)の待機処理
- 'once' statusの状態遷移

---

### 13. XPathManagerView.ts (2時間)

**行数**: 111行
**カバレッジ目標**: 90%以上

**理由**: Presenterテストで一部カバー済み

**主な懸念事項**:
- 複雑なHTML生成（XPathアイテム）
- loading indicatorの表示/非表示
- イベントパターンの表示ロジック

---

**Phase 3 合計**: 6ファイル、約10.5時間

---

## 技術的懸念事項まとめ

### 1. Shadow DOM
- AutoFillOverlay.tsとXPathDialog.tsでJSDOMの制限に対処が必要
- attachShadow()のモックが必要

### 2. Browser API Mocking
- tabs, storage, contextMenus, runtimeの広範なモック
- webextension-polyfillの完全なモック

### 3. Async/Await
- 多数の非同期処理のテスト
- Promise解決のタイミング制御

### 4. Event Listeners
- ESCキー、クリック、カスタムイベントのシミュレーション
- イベントリスナーのアタッチ確認

### 5. Timers & Animations
- setTimeout, transitionのモックとテスト
- jest.useFakeTimers()の活用

### 6. Global Functions
- alert(), confirm()のモック
- window.globalのモック

### 7. Clipboard API
- navigator.clipboardのモック
- writeText()の成功/失敗テスト

---

## 推定総作業時間

| Phase | ファイル数 | 合計時間 | 内容 |
|-------|-----------|---------|------|
| Phase 1（最優先） | 3 | 6.5時間 | ビジネスロジック核心 |
| Phase 2（中優先度） | 4 | 6.5時間 | システム設定・共通コンポーネント |
| Phase 3（低優先度） | 6 | 10.5時間 | UIコンポーネント |
| **合計** | **13** | **23.5時間** | |

---

## 推奨実装アプローチ

### Phase 1: ビジネスロジック核心（6.5時間）

```
1. XPathContextMenuHandler.ts
2. AutoFillHandler.ts
3. WebsiteActionHandler.ts
```

**目的**: 自動入力機能とXPath管理の核心ロジックを保護

---

### Phase 2: システム設定・共通（6.5時間）

```
4. CancelAutoFillHandler.ts
5. SystemSettingsManager.ts
6. VariableManager.ts
7. WebsiteSelectManager.ts
```

**目的**: システム全体に影響する設定とデータ管理を保護

---

### Phase 3以降: UIコンポーネント（10.5時間）

```
8. AutoFillOverlay.ts
9. XPathDialog.ts
10. ModalManager.ts
11. WebsiteRenderer.ts
12. AutoFillExecutor.ts
13. XPathManagerView.ts
```

**目的**: ユーザーインターフェースの品質向上（手動テストでもカバー可能）

---

## テスト作成のベストプラクティス

### 1. モックの準備
```typescript
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  tabs: {
    create: jest.fn(),
  },
  // ... 他のAPI
}));
```

### 2. async/awaitのテスト
```typescript
it('should execute auto-fill successfully', async () => {
  (browser.tabs.create as jest.Mock).mockResolvedValue({ id: 123 });

  await handler.executeWebsite(website, websites);

  expect(browser.tabs.create).toHaveBeenCalledWith({
    url: 'https://example.com',
    active: true,
  });
});
```

### 3. alert/confirmのモック
```typescript
beforeEach(() => {
  global.alert = jest.fn();
  global.confirm = jest.fn(() => true);
});
```

### 4. カバレッジ確認
```bash
npm test -- path/to/test.ts --coverage --collectCoverageFrom="path/to/source.ts"
```

---

## 進捗管理

### Phase 1 進捗
- [ ] XPathContextMenuHandler.ts
- [ ] AutoFillHandler.ts
- [ ] WebsiteActionHandler.ts

### Phase 2 進捗
- [ ] CancelAutoFillHandler.ts
- [ ] SystemSettingsManager.ts
- [ ] VariableManager.ts
- [ ] WebsiteSelectManager.ts

### Phase 3 進捗
- [ ] AutoFillOverlay.ts
- [ ] XPathDialog.ts
- [ ] ModalManager.ts
- [ ] WebsiteRenderer.ts
- [ ] AutoFillExecutor.ts
- [ ] XPathManagerView.ts

---

## 結論

**Phase 1 + Phase 2**（7ファイル、13時間）でビジネスロジックの核心部分を全てカバーできます。

Phase 3のUIコンポーネントは、手動テストでカバーするか、時間があれば追加する方針が最も効率的です。

---

**最終更新**: 2025-01-08
