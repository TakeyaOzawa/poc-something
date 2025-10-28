# Phase 2.7: システム設定画面統合 - 実装計画書

**作成日**: 2025-10-17
**ステータス**: 計画中
**担当**: Development Team

---

## 📋 目次

- [概要](#概要)
- [背景と目的](#背景と目的)
- [現状分析](#現状分析)
- [実装計画](#実装計画)
- [成果物](#成果物)
- [スケジュール](#スケジュール)
- [リスクと対策](#リスクと対策)

---

## 概要

STORAGE_SYNC_DESIGN.mdの「### 2.1 システム設定画面 - データ同期タブ」に準拠し、既存のxpath-manager.htmlを「システム設定」画面としてタブ化し、データ同期機能をタブとして統合します。

### 目標

1. ✅ **設計準拠**: STORAGE_SYNC_DESIGN.mdの設計通りにUI配置を実現
2. ✅ **統合**: 既存のXPath管理とデータ同期を統一インターフェースで提供
3. ✅ **ユーザビリティ**: 1つの設定画面で全ての設定を管理可能に

---

## 背景と目的

### 設計書の意図

STORAGE_SYNC_DESIGN.md（2.1節）では、以下のUI構成が設計されていました：

```
┌────────────────────────────────────────────────────────────┐
│ システム設定                                          [×]    │
├────────────────────────────────────────────────────────────┤
│ [一般設定] [リトライ設定] [データ同期]                    │
├────────────────────────────────────────────────────────────┤
│ （各タブのコンテンツ）                                      │
└────────────────────────────────────────────────────────────┘
```

### 現在の実装状況

実際には以下のように実装されています：

1. **xpath-manager.html** - XPath管理専用ページ（タブなし）
2. **storage-sync-manager.html** - データ同期管理専用ページ（独立）

### 問題点

- 設計書と実装が乖離している
- ユーザーが2つの独立したページを行き来する必要がある
- 「システム設定」という統一的な概念がない

### 解決策

xpath-manager.htmlを「system-settings.html」に改名・拡張し、以下のタブ構成で統合：

1. **XPath管理タブ** - 既存のxpath-manager.htmlの機能
2. **データ同期タブ** - storage-sync-manager.htmlの機能を統合
3. **一般設定タブ** - 将来的な拡張用（現時点では空でも可）

---

## 現状分析

### 実装済みコンポーネント

#### Phase 2.1 ~ 2.6（完了済み）

| コンポーネント | ステータス | カバレッジ |
|-------------|----------|-----------|
| StorageSyncConfig Entity | ✅ 完了 | 100% |
| StorageSyncConfigRepository | ✅ 完了 | 100% |
| HttpClient / DataMapper | ✅ 完了 | 100% / 50% |
| CSVConverter | ✅ 完了 | 94.66% |
| BatchProcessor | ✅ 完了 | 4.59% |
| DataTransformationService | ✅ 完了 | 15.32% |
| SchedulerService | ✅ 完了 | 100% |
| SyncStateNotifier | ✅ 完了 | 35.29% |
| CreateSyncConfigUseCase | ✅ 完了 | 100% |
| UpdateSyncConfigUseCase | ✅ 完了 | 89.09% |
| DeleteSyncConfigUseCase | ✅ 完了 | 100% |
| ListSyncConfigsUseCase | ✅ 完了 | 100% |
| ImportCSVUseCase | ✅ 完了 | 100% |
| ExportCSVUseCase | ✅ 完了 | 100% |
| ValidateSyncConfigUseCase | ✅ 完了 | 90.1% |
| TestConnectionUseCase | ✅ 完了 | 100% |
| ExecuteManualSyncUseCase | ✅ 完了 | 85.96% |
| ExecuteSendStepsUseCase | ✅ 完了 | 99.15% |
| ExecuteReceiveStepsUseCase | ✅ 完了 | 98.68% |
| ExecuteScheduledSyncUseCase | ✅ 完了 | 98.5% |
| GetSyncHistoriesUseCase | ✅ 完了 | 100% |
| CleanupSyncHistoriesUseCase | ✅ 完了 | 100% |
| storage-sync-manager.html | ✅ 完了 | - |
| StorageSyncManagerPresenter | ✅ 完了 | 100% |
| StorageSyncManagerView | ✅ 完了 | 0% (503行View層) |

### 未実装コンポーネント

| コンポーネント | ステータス | 必要性 |
|-------------|----------|-------|
| system-settings.html | ❌ 未実装 | **必須** |
| タブコンポーネント | ❌ 未実装 | **必須** |
| データ同期タブUI | ❌ 未実装 | **必須** |
| 一般設定タブUI | ❌ 未実装 | オプション |
| SystemSettingsController | ❌ 未実装 | **必須** |

---

## 実装計画

### Task 1: タブコンポーネントの実装

#### 1.1 TabController クラス作成

```typescript
// src/presentation/components/TabController.ts

export class TabController {
  private activeTab: string;
  private tabs: Map<string, HTMLElement>;

  constructor(
    private tabContainer: HTMLElement,
    private contentContainer: HTMLElement
  ) {
    this.tabs = new Map();
  }

  registerTab(tabId: string, tabButton: HTMLElement, contentElement: HTMLElement): void {
    this.tabs.set(tabId, contentElement);
    tabButton.addEventListener('click', () => this.switchTo(tabId));
  }

  switchTo(tabId: string): void {
    // タブ切り替えロジック
    this.tabs.forEach((content, id) => {
      if (id === tabId) {
        content.style.display = 'block';
        content.classList.add('active');
      } else {
        content.style.display = 'none';
        content.classList.remove('active');
      }
    });

    this.activeTab = tabId;
    this.updateTabButtons(tabId);
  }

  private updateTabButtons(activeTabId: string): void {
    const tabButtons = this.tabContainer.querySelectorAll('.tab-button');
    tabButtons.forEach((button) => {
      if (button.getAttribute('data-tab-id') === activeTabId) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }
}
```

#### 1.2 タブUI HTML構造

```html
<!-- system-settings.html -->
<div class="tab-container">
  <div class="tab-header">
    <button class="tab-button active" data-tab-id="xpath-management" data-i18n="xpathManagementTab">
      XPath管理
    </button>
    <button class="tab-button" data-tab-id="data-sync" data-i18n="dataSyncTab">
      データ同期
    </button>
    <button class="tab-button" data-tab-id="general-settings" data-i18n="generalSettingsTab">
      一般設定
    </button>
  </div>

  <div class="tab-content">
    <!-- Tab 1: XPath管理 -->
    <div id="xpath-management-tab" class="tab-panel active">
      <!-- 既存のxpath-manager.htmlの内容 -->
    </div>

    <!-- Tab 2: データ同期 -->
    <div id="data-sync-tab" class="tab-panel">
      <!-- storage-sync-manager.htmlの内容を統合 -->
    </div>

    <!-- Tab 3: 一般設定 -->
    <div id="general-settings-tab" class="tab-panel">
      <!-- 将来的な拡張用（現時点では空） -->
    </div>
  </div>
</div>
```

#### 1.3 タブCSS

```css
/* Tab styles */
.tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-header {
  display: flex;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  padding: 0 10px;
}

.tab-button {
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.05);
}

.tab-button.active {
  color: #fff;
  border-bottom-color: #4CAF50;
  background: rgba(255, 255, 255, 0.1);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.tab-panel {
  display: none;
  animation: fadeIn 0.3s ease;
}

.tab-panel.active {
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Task 2: データ同期タブUIの実装

#### 2.1 localStorage キーカード表示

STORAGE_SYNC_DESIGN.mdの「2.1 システム設定画面 - データ同期タブ」に準拠したUI：

```html
<div id="data-sync-tab" class="tab-panel">
  <div class="sync-config-list">
    <!-- automationVariables -->
    <div class="sync-config-card" data-storage-key="automationVariables">
      <div class="card-header">
        <div class="card-icon">📋</div>
        <div class="card-title" data-i18n="automationVariables">Automation Variables</div>
        <button class="btn-settings" data-i18n="configure">設定</button>
      </div>
      <div class="card-body">
        <div class="config-info">
          <span data-i18n="syncMethod">同期方法:</span>
          <span class="sync-method">DB同期（HTTP(S)）</span>
        </div>
        <div class="config-info">
          <span data-i18n="syncTiming">タイミング:</span>
          <span class="sync-timing">定期（300秒ごと）</span>
        </div>
        <div class="config-info">
          <span data-i18n="syncDirection">種別:</span>
          <span class="sync-direction">相互同期</span>
        </div>
        <div class="config-info">
          <span data-i18n="lastSync">最終同期:</span>
          <span class="last-sync">2025-10-15 10:30:45 ✅</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn-primary sync-now-btn" data-i18n="syncNow">今すぐ同期</button>
      </div>
    </div>

    <!-- websiteConfigs -->
    <div class="sync-config-card" data-storage-key="websiteConfigs">
      <!-- 同様の構造 -->
    </div>

    <!-- xpathCollectionCSV -->
    <div class="sync-config-card" data-storage-key="xpathCollectionCSV">
      <!-- 同様の構造 -->
    </div>

    <!-- automationResults -->
    <div class="sync-config-card" data-storage-key="automationResults">
      <div class="card-header">
        <div class="card-icon">📊</div>
        <div class="card-title" data-i18n="automationResults">Automation Results</div>
      </div>
      <div class="card-body">
        <div class="config-info">
          <span data-i18n="syncMethod">同期方法:</span>
          <span class="sync-method" data-i18n="notConfigured">未設定</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn-secondary configure-sync-btn" data-i18n="configureSyncButton">同期を設定</button>
      </div>
    </div>

    <!-- systemSettings -->
    <div class="sync-config-card" data-storage-key="systemSettings">
      <!-- 同様の構造 -->
    </div>
  </div>
</div>
```

#### 2.2 カードCSS

```css
.sync-config-list {
  display: grid;
  gap: 15px;
  max-width: 1200px;
}

.sync-config-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
}

.sync-config-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.card-icon {
  font-size: 24px;
}

.card-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
}

.btn-settings {
  padding: 6px 12px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-settings:hover {
  background: rgba(255, 255, 255, 0.15);
}

.card-body {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.config-info {
  display: flex;
  font-size: 13px;
  gap: 8px;
}

.config-info > span:first-child {
  opacity: 0.7;
  min-width: 100px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.sync-now-btn {
  padding: 8px 16px;
  font-size: 13px;
}
```

### Task 3: SystemSettingsController の実装

```typescript
// src/presentation/system-settings/SystemSettingsController.ts

import { TabController } from '@presentation/components/TabController';
import { StorageSyncManagerPresenter } from '@presentation/storage-sync-manager/StorageSyncManagerPresenter';

export class SystemSettingsController {
  private tabController: TabController;
  private syncPresenter: StorageSyncManagerPresenter;

  constructor() {
    this.initializeTabs();
    this.initializeDataSyncTab();
  }

  private initializeTabs(): void {
    const tabContainer = document.querySelector('.tab-header');
    const contentContainer = document.querySelector('.tab-content');

    if (!tabContainer || !contentContainer) {
      throw new Error('Tab container elements not found');
    }

    this.tabController = new TabController(tabContainer as HTMLElement, contentContainer as HTMLElement);

    // タブ登録
    this.registerTab('xpath-management', 'XPath管理');
    this.registerTab('data-sync', 'データ同期');
    this.registerTab('general-settings', '一般設定');

    // デフォルトタブを表示
    this.tabController.switchTo('xpath-management');

    // URL hashに基づいてタブ切り替え
    this.handleHashChange();
    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  private registerTab(tabId: string, label: string): void {
    const tabButton = document.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement;
    const contentElement = document.getElementById(`${tabId}-tab`) as HTMLElement;

    if (tabButton && contentElement) {
      this.tabController.registerTab(tabId, tabButton, contentElement);
    }
  }

  private handleHashChange(): void {
    const hash = window.location.hash.slice(1); // "#data-sync" -> "data-sync"
    if (hash) {
      this.tabController.switchTo(hash);
    }
  }

  private initializeDataSyncTab(): void {
    // StorageSyncManagerPresenter を初期化
    // （既存のstorage-sync-manager.jsの機能を統合）

    // 同期設定カードの初期化
    this.loadSyncConfigs();

    // イベントリスナーの設定
    this.setupEventListeners();
  }

  private async loadSyncConfigs(): Promise<void> {
    // localStorage キーごとの同期設定を読み込んでカード表示を更新
    const storageKeys = [
      'automationVariables',
      'websiteConfigs',
      'xpathCollectionCSV',
      'automationResults',
      'systemSettings'
    ];

    for (const key of storageKeys) {
      await this.loadConfigForKey(key);
    }
  }

  private async loadConfigForKey(storageKey: string): Promise<void> {
    // Use Case経由で設定を読み込み、UIを更新
    // 実装は既存のStorageSyncManagerPresenterを再利用
  }

  private setupEventListeners(): void {
    // 「設定」ボタン
    document.querySelectorAll('.btn-settings').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest('.sync-config-card');
        const storageKey = card?.getAttribute('data-storage-key');
        if (storageKey) {
          this.openConfigModal(storageKey);
        }
      });
    });

    // 「今すぐ同期」ボタン
    document.querySelectorAll('.sync-now-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest('.sync-config-card');
        const storageKey = card?.getAttribute('data-storage-key');
        if (storageKey) {
          this.executeSyncNow(storageKey);
        }
      });
    });

    // 「同期を設定」ボタン
    document.querySelectorAll('.configure-sync-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest('.sync-config-card');
        const storageKey = card?.getAttribute('data-storage-key');
        if (storageKey) {
          this.openConfigModal(storageKey);
        }
      });
    });
  }

  private openConfigModal(storageKey: string): void {
    // storage-sync-manager.htmlのモーダルを表示
    // 既存のStorageSyncManagerViewを再利用
  }

  private async executeSyncNow(storageKey: string): Promise<void> {
    // ExecuteManualSyncUseCaseを実行
    // 既存のStorageSyncManagerPresenterを再利用
  }
}
```

### Task 4: ファイル移行・統合

#### 4.1 ファイル構成

```
public/
├── system-settings.html (新規作成 - xpath-manager.htmlを拡張)
├── xpath-manager.html (削除 or リネーム)
├── storage-sync-manager.html (残存 - 後方互換性のため)
└── system-settings.js (新規作成)

src/presentation/
├── components/
│   └── TabController.ts (新規作成)
├── system-settings/
│   ├── SystemSettingsController.ts (新規作成)
│   └── __tests__/
│       └── SystemSettingsController.test.ts (新規作成)
├── xpath-manager/
│   └── (既存ファイル維持)
└── storage-sync-manager/
    └── (既存ファイル維持)
```

#### 4.2 移行手順

1. **xpath-manager.htmlをベースにsystem-settings.htmlを作成**
   ```bash
   cp public/xpath-manager.html public/system-settings.html
   ```

2. **タブUI構造を追加**
   - タブヘッダーの追加
   - タブコンテンツ領域の追加
   - 既存のXPath管理UIをタブ1に配置

3. **データ同期タブUIを統合**
   - storage-sync-manager.htmlの主要UI要素を抽出
   - タブ2に配置

4. **システム設定コントローラーを実装**
   - TabController作成
   - SystemSettingsController作成
   - イベントハンドリング実装

5. **既存コンポーネントの再利用**
   - StorageSyncManagerPresenter
   - StorageSyncManagerView
   - 各Use Case

### Task 5: ナビゲーションの更新

#### 5.1 Unified Navigation Bar の更新

```typescript
// src/presentation/components/UnifiedNavBar.ts に以下を追加

const navItems = [
  // ... 既存の項目 ...
  {
    id: 'system-settings',
    label: i18n.getMessage('systemSettings') || 'システム設定',
    href: 'system-settings.html',
    icon: '⚙️'
  }
];
```

#### 5.2 多言語対応

```json
// public/_locales/ja/messages.json
{
  "systemSettings": {
    "message": "システム設定"
  },
  "xpathManagementTab": {
    "message": "XPath管理"
  },
  "dataSyncTab": {
    "message": "データ同期"
  },
  "generalSettingsTab": {
    "message": "一般設定"
  }
}
```

```json
// public/_locales/en/messages.json
{
  "systemSettings": {
    "message": "System Settings"
  },
  "xpathManagementTab": {
    "message": "XPath Management"
  },
  "dataSyncTab": {
    "message": "Data Synchronization"
  },
  "generalSettingsTab": {
    "message": "General Settings"
  }
}
```

---

## 成果物

### 新規作成ファイル

1. **public/system-settings.html** - システム設定画面（タブ統合）
2. **public/system-settings.js** - システム設定コントローラー（バンドル後）
3. **src/presentation/components/TabController.ts** - タブコンポーネント
4. **src/presentation/system-settings/SystemSettingsController.ts** - コントローラー
5. **src/presentation/system-settings/__tests__/SystemSettingsController.test.ts** - ユニットテスト

### 更新ファイル

1. **public/_locales/ja/messages.json** - 日本語メッセージ追加
2. **public/_locales/en/messages.json** - 英語メッセージ追加
3. **src/presentation/components/UnifiedNavBar.ts** - ナビゲーション項目追加
4. **docs/外部データソース連携/README.md** - Phase 2.7追加

### 削除候補ファイル

1. **public/xpath-manager.html** - system-settings.htmlに統合されるため削除候補

---

## スケジュール

### Week 1: タブコンポーネント実装（2日）

- **Day 1**: TabController実装 + ユニットテスト
- **Day 2**: system-settings.html作成 + タブUI実装

### Week 2: データ同期タブ統合（2日）

- **Day 3**: データ同期タブUI実装 + カード表示
- **Day 4**: SystemSettingsController実装 + イベントハンドリング

### Week 3: 統合テスト（1日）

- **Day 5**: E2Eテスト + バグ修正 + ドキュメント更新

**合計工数**: 5日

---

## リスクと対策

### リスク1: 既存コードの破壊

**リスク**: xpath-manager.htmlの削除により既存機能が動作しなくなる

**対策**:
- xpath-manager.htmlは削除せず、system-settings.htmlにリダイレクト
- 既存のXPath管理機能は100%互換性を維持
- 段階的な移行期間を設ける

### リスク2: ユーザーの混乱

**リスク**: 新しいタブUIに慣れていないユーザーが混乱する

**対策**:
- リリースノートで変更内容を明記
- 初回アクセス時にガイドツアーを表示（オプション）
- 旧URLからの自動リダイレクト

### リスク3: パフォーマンス

**リスク**: タブ切り替え時のパフォーマンス低下

**対策**:
- Lazy loading: 非アクティブタブの内容は遅延読み込み
- Virtual scrolling: 大量のデータ表示時に適用
- CSS transitionを最適化

---

## 次のステップ

1. ✅ Phase 2.7実装計画書のレビュー
2. ⏸️ TabController実装着手
3. ⏸️ system-settings.html作成
4. ⏸️ データ同期タブUI統合
5. ⏸️ SystemSettingsController実装
6. ⏸️ E2Eテスト実施
7. ⏸️ ドキュメント更新

---

**ドキュメント作成者**: Claude
**最終更新日**: 2025-10-17
