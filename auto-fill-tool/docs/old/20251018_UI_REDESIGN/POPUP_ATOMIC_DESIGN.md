# Popup UI - Atomic Design 設計書

## 概要

popup.htmlのUIをAtomic Designパターンで再構築します。Alpine.jsコンポーネントをTypeScriptで管理し、コンパクトで使いやすいUIを実現します。

## デザイン方針

### 基本方針
- **コンパクト性**: 文字サイズと余白を最小化し、限られたポップアップスペースを有効活用
- **視認性**: 小さくても読みやすいフォントとコントラスト
- **操作性**: タッチターゲットサイズは最低32x32pxを確保
- **一貫性**: Tailwind CSSのユーティリティクラスで統一

### サイズ指針
- **フォントサイズ**:
  - ベース: text-xs (12px)
  - タイトル: text-sm (14px)
  - アイコンラベル: text-[10px] (10px)
- **余白**:
  - カード間: mb-2 (8px)
  - カード内: p-2 (8px)
  - ボタン間: gap-1 (4px)
- **ポップアップサイズ**: 幅400px、最小高さ300px

## Atomic Design 構造

### Atoms（原子）

#### 1. IconButton
**用途**: アイコン付きの小型ボタン
**Props**:
- `icon`: 絵文字アイコン
- `label`: ラベルテキスト
- `onClick`: クリックハンドラー
- `variant`: 'primary' | 'info' | 'success' | 'danger'

**実装**:
```typescript
// src/presentation/popup/components/atoms/IconButton.ts
export interface IconButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'info' | 'success' | 'danger';
}

export function renderIconButton(props: IconButtonProps): string {
  const baseClasses = 'flex flex-col items-center justify-center gap-0.5 min-h-[40px] px-1.5 py-1.5 rounded transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    info: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return `
    <button
      class="${baseClasses} ${variantClasses[props.variant || 'info']}"
      @click="${props.onClick}">
      <span class="text-base leading-none">${props.icon}</span>
      <span class="text-[10px] font-semibold leading-tight">${props.label}</span>
    </button>
  `;
}
```

#### 2. StatusBadge
**用途**: ステータス表示バッジ
**Props**:
- `status`: 'enabled' | 'disabled' | 'once'
- `text`: 表示テキスト

**実装**:
```typescript
// src/presentation/popup/components/atoms/StatusBadge.ts
export interface StatusBadgeProps {
  status: 'enabled' | 'disabled' | 'once';
  text: string;
}

export function renderStatusBadge(props: StatusBadgeProps): string {
  const statusClasses = {
    enabled: 'bg-green-100 text-green-800',
    disabled: 'bg-gray-200 text-gray-700',
    once: 'bg-blue-100 text-blue-800',
  };

  return `
    <span class="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${statusClasses[props.status]}">
      ${props.text}
    </span>
  `;
}
```

#### 3. ActionButton
**用途**: ウェブサイトアクション用の小型アイコンボタン
**Props**:
- `icon`: アイコン絵文字
- `action`: 'execute' | 'edit' | 'delete'
- `id`: ウェブサイトID
- `onClick`: クリックハンドラー

### Molecules（分子）

#### 1. ControlBar
**用途**: トップの制御ボタンバー
**構成**: IconButton x 5
**レイアウト**: グリッド 5列、gap-1

**実装**:
```typescript
// src/presentation/popup/components/molecules/ControlBar.ts
export interface ControlBarProps {
  onAddWebsite: () => void;
  onXPathManager: () => void;
  onAutomationVariables: () => void;
  onDataSync: () => void;
  onSettings: () => void;
}

export function renderControlBar(props: ControlBarProps): string {
  return `
    <div class="grid grid-cols-5 gap-1 mb-3 bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
      ${renderIconButton({ icon: '➕', label: 'サイト追加', onClick: props.onAddWebsite, variant: 'primary' })}
      ${renderIconButton({ icon: '🔍', label: 'XPath', onClick: props.onXPathManager })}
      ${renderIconButton({ icon: '📋', label: '実行履歴', onClick: props.onAutomationVariables })}
      ${renderIconButton({ icon: '🔄', label: '同期', onClick: props.onDataSync })}
      ${renderIconButton({ icon: '⚙️', label: '設定', onClick: props.onSettings })}
    </div>
  `;
}
```

#### 2. WebsiteCard
**用途**: 個別ウェブサイトの情報カード
**構成**:
- ヘッダー（名前 + アクションボタン群）
- ステータスバッジ
- 変数表示エリア

**実装**:
```typescript
// src/presentation/popup/components/molecules/WebsiteCard.ts
export interface WebsiteCardProps {
  id: string;
  name: string;
  status: 'enabled' | 'disabled' | 'once';
  statusText: string;
  variables: string;
  onExecute: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function renderWebsiteCard(props: WebsiteCardProps): string {
  return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-2 hover:shadow-md transition-shadow"
         data-id="${props.id}">
      <!-- ヘッダー -->
      <div class="flex items-start justify-between mb-1.5">
        <div class="font-semibold text-gray-900 text-sm flex-1 mr-2 leading-tight">${props.name}</div>
        <div class="flex gap-0.5 flex-shrink-0">
          <button
            class="px-1.5 py-0.5 text-xs bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
            @click="handleExecute('${props.id}')"
            title="実行">▶️</button>
          <button
            class="px-1.5 py-0.5 text-xs bg-yellow-500 text-white hover:bg-yellow-600 rounded transition-colors"
            @click="handleEdit('${props.id}')"
            title="編集">✏️</button>
          <button
            class="px-1.5 py-0.5 text-xs bg-red-600 text-white hover:bg-red-700 rounded transition-colors"
            @click="handleDelete('${props.id}')"
            title="削除">🗑️</button>
        </div>
      </div>

      <!-- ステータス -->
      <div class="mb-1.5">
        ${renderStatusBadge({ status: props.status, text: props.statusText })}
      </div>

      <!-- 変数 -->
      <div class="text-xs text-gray-600 font-mono bg-gray-50 px-1.5 py-1 rounded border border-gray-200 overflow-x-auto whitespace-nowrap">
        ${props.variables}
      </div>
    </div>
  `;
}
```

#### 3. EmptyState
**用途**: ウェブサイト未登録時の空状態表示
**構成**: アイコン + メッセージ

**実装**:
```typescript
// src/presentation/popup/components/molecules/EmptyState.ts
export function renderEmptyState(): string {
  return `
    <div class="text-center py-8 px-4 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
      <div class="text-3xl mb-2">📝</div>
      <div class="text-xs">Webサイトが登録されていません</div>
      <div class="text-[10px] text-gray-400 mt-1">「サイト追加」ボタンから登録してください</div>
    </div>
  `;
}
```

### Organisms（有機体）

#### 1. WebsiteList
**用途**: ウェブサイトカードのリスト表示
**構成**: WebsiteCard[] | EmptyState
**状態管理**: Alpine.js x-data

**実装**:
```typescript
// src/presentation/popup/components/organisms/WebsiteList.ts
export function renderWebsiteList(): string {
  return `
    <div class="website-list">
      <!-- 空状態 -->
      <template x-if="isEmpty()">
        ${renderEmptyState()}
      </template>

      <!-- ウェブサイトリスト -->
      <template x-for="website in websites" :key="website.id">
        <div x-html="renderWebsiteCard(website)"></div>
      </template>
    </div>
  `;
}
```

#### 2. EditModal
**用途**: ウェブサイト編集モーダル
**構成**:
- モーダルヘッダー
- フォームフィールド群
- アクションボタン（保存/キャンセル）

**実装**:
```typescript
// src/presentation/popup/components/organisms/EditModal.ts
export function renderEditModal(): string {
  return `
    <div
      class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3"
      x-show="showModal"
      style="display: none;"
      @click.self="closeModal()">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" @click.stop>
        <!-- ヘッダー -->
        <div class="bg-blue-600 text-white px-4 py-2.5 rounded-t-lg font-semibold text-sm">
          Webサイト設定
        </div>

        <!-- フォーム -->
        <form id="editForm" class="p-4">
          <input type="hidden" id="editId">

          <!-- 名前 -->
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1">名前</label>
            <input
              type="text"
              id="editName"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例: マイサイト"
              required>
          </div>

          <!-- ステータス -->
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1">ステータス</label>
            <select
              id="editStatus"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required>
              <option value="disabled">無効</option>
              <option value="enabled">有効</option>
              <option value="once">1度だけ有効</option>
            </select>
          </div>

          <!-- 編集可否 -->
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1">編集可否</label>
            <select
              id="editEditable"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required>
              <option value="true">編集可能</option>
              <option value="false">編集不可</option>
            </select>
          </div>

          <!-- 開始URL -->
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1">開始URL (オプション)</label>
            <input
              type="text"
              id="editStartUrl"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例: https://example.com">
          </div>

          <!-- 変数 -->
          <div class="mb-4">
            <label class="block text-xs font-semibold text-gray-700 mb-1">変数</label>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-2">
              <div class="text-[10px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">変数一覧</div>
              <div id="variablesList" class="space-y-1.5 mb-2"></div>
              <button
                type="button"
                class="w-full py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                id="addVariableBtn">➕ 変数を追加</button>
            </div>
          </div>

          <!-- アクション -->
          <div class="flex gap-2">
            <button type="submit" class="flex-1 py-2 text-xs font-semibold bg-green-600 text-white hover:bg-green-700 rounded transition-colors">
              💾 保存
            </button>
            <button type="button" class="flex-1 py-2 text-xs font-semibold bg-gray-300 text-gray-700 hover:bg-gray-400 rounded transition-colors" id="cancelBtn">
              ✖ キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}
```

### Templates（テンプレート）

#### PopupLayout
**用途**: ポップアップ全体のレイアウト
**構成**:
- ヘッダー（タイトル）
- ControlBar
- WebsiteList
- EditModal

**実装**:
```typescript
// src/presentation/popup/components/templates/PopupLayout.ts
export function renderPopupLayout(): string {
  return `
    <div class="w-[400px] min-h-[300px] p-3 bg-gradient-to-br from-gray-50 to-gray-100">
      <!-- ヘッダー -->
      <h1 class="text-base font-semibold text-center text-gray-900 mb-3">
        📝 自動入力ツール
      </h1>

      <!-- コントロールバー -->
      ${renderControlBar({
        onAddWebsite: 'openAddModal',
        onXPathManager: 'openXPathManager',
        onAutomationVariables: 'openAutomationVariablesManager',
        onDataSync: 'openDataSyncSettings',
        onSettings: 'openSettings',
      })}

      <!-- ウェブサイトリスト -->
      ${renderWebsiteList()}

      <!-- 編集モーダル -->
      ${renderEditModal()}
    </div>
  `;
}
```

## Alpine.js統合

### コンポーネント化
Alpine.jsコンポーネントをTypeScriptで定義し、DOMレンダリングを制御します。

```typescript
// src/presentation/popup/popup-alpine.ts
import Alpine from '@alpinejs/csp';

export function initPopupAlpine() {
  Alpine.data('popupApp', () => ({
    websites: [],
    showModal: false,
    editingId: null,

    // 状態チェック
    isEmpty() {
      return this.websites.length === 0;
    },

    // ウェブサイトカードのレンダリング
    renderWebsiteCard(website: any) {
      return renderWebsiteCard({
        id: website.id,
        name: website.name,
        status: this.getWebsiteStatusClass(website.id),
        statusText: this.getWebsiteStatus(website.id),
        variables: this.getWebsiteVariablesText(website.id),
        onExecute: this.handleExecute,
        onEdit: this.handleEdit,
        onDelete: this.handleDelete,
      });
    },

    // アクションハンドラー
    handleExecute(id: string) {
      window.dispatchEvent(new CustomEvent('websiteAction', {
        detail: { action: 'execute', id }
      }));
    },

    handleEdit(id: string) {
      window.dispatchEvent(new CustomEvent('websiteAction', {
        detail: { action: 'edit', id }
      }));
    },

    handleDelete(id: string) {
      window.dispatchEvent(new CustomEvent('websiteAction', {
        detail: { action: 'delete', id }
      }));
    },

    // モーダル制御
    closeModal() {
      this.showModal = false;
    },

    // ヘルパーメソッド（既存のWebsiteListControllerから移植）
    getWebsiteStatus(id: string): string {
      // 実装
    },

    getWebsiteStatusClass(id: string): string {
      // 実装
    },

    getWebsiteVariablesText(id: string): string {
      // 実装
    },
  }));
}
```

## ファイル構成

```
src/presentation/popup/
├── index.ts                          # エントリーポイント
├── popup-alpine.ts                   # Alpine.jsコンポーネント定義
├── components/
│   ├── atoms/
│   │   ├── IconButton.ts
│   │   ├── StatusBadge.ts
│   │   └── ActionButton.ts
│   ├── molecules/
│   │   ├── ControlBar.ts
│   │   ├── WebsiteCard.ts
│   │   └── EmptyState.ts
│   ├── organisms/
│   │   ├── WebsiteList.ts
│   │   └── EditModal.ts
│   └── templates/
│       └── PopupLayout.ts
├── WebsiteListController.ts         # 既存（削減予定）
├── WebsiteRenderer.ts                # 既存（削減予定）
├── ModalManager.ts                   # 既存（削減予定）
└── WebsiteActionHandler.ts          # 既存（削減予定）
```

## 移行戦略

### ✅ フェーズ1: コンポーネント作成（完了）
1. ✅ atoms層の実装（IconButton, StatusBadge, ActionButton）
2. ✅ molecules層の実装（ControlBar, WebsiteCard, EmptyState）
3. ✅ organisms層の実装（WebsiteList, EditModal）
4. ✅ templates層の実装（PopupLayout）

**作成ファイル**:
- `src/presentation/popup/components/atoms/IconButton.ts`
- `src/presentation/popup/components/atoms/StatusBadge.ts`
- `src/presentation/popup/components/atoms/ActionButton.ts`
- `src/presentation/popup/components/molecules/ControlBar.ts`
- `src/presentation/popup/components/molecules/WebsiteCard.ts`
- `src/presentation/popup/components/molecules/EmptyState.ts`
- `src/presentation/popup/components/organisms/WebsiteList.ts`
- `src/presentation/popup/components/organisms/EditModal.ts`
- `src/presentation/popup/components/templates/PopupLayout.ts`

### ✅ フェーズ2: Alpine.js統合（完了）
1. ✅ popup-alpine.tsの拡張
   - `renderWebsiteCard()` メソッド追加
   - ナビゲーションメソッド追加（openXPathManager, openAutomationVariablesManager, openDataSyncSettings, openSettings）
   - `getWebsiteStatusClass()` 戻り値型を 'enabled' | 'disabled' | 'once' に変更
2. ✅ イベントハンドラーの統合
   - CustomEvent経由でWebsiteActionHandlerと連携
3. ✅ 状態管理の統合
   - Alpine.jsの`websites`, `automationVariablesMap`, `showModal`, `editingId`で管理

**ビルド結果**:
- popup.js: 127 KiB（コンパクト化達成）
- 0 errors, 3 warnings（パフォーマンス警告のみ）

### ✅ フェーズ3: popup.html更新（完了）
1. ✅ 既存HTMLにコンパクトAtomic Designスタイル適用
   - Body: `p-3`, gradient background (`bg-gradient-to-br from-gray-50 to-gray-100`)
   - Title: `text-base mb-3` (was `text-2xl mb-4`)
   - Control buttons: `min-h-[40px] px-1.5 py-1.5 gap-0.5 text-[10px]` (was `min-h-[48px] p-2`)
   - Status badges: `px-1.5 py-0.5 text-[10px]` (was `px-2 py-1 text-xs`)
   - Website cards: `p-2 mb-2` (was `p-4 mb-3`)
   - Modal header: `px-4 py-2.5 text-sm` (was `px-6 py-4 text-lg`)
   - Form inputs: `px-2 py-1.5 text-xs` (was `px-3 py-2`)
2. ✅ Alpine.jsディレクティブ維持（@click, x-show, x-for等）
3. ✅ E2E test用セレクタ維持（website-item, empty-state, modal-header等）

### フェーズ4: 既存コードの削減（予定）
1. WebsiteRenderer削除（Atomic Designコンポーネントで置換済み）
2. ModalManager削減（EditModalで代替）
3. WebsiteListController簡素化（Alpine.jsに委譲）
4. index.tsのリファクタリング（dataSyncRequest イベントリスナー追加）

### フェーズ5: E2Eテスト更新（予定）
1. セレクタの更新（website-item, empty-state, modal-header は維持）
2. 待機ロジックの調整（waitForAlpine()は実装済み）
3. 全テストの実行と検証

## 期待される効果

1. **コンパクト化**: 文字サイズと余白を20-30%削減
2. **保守性向上**: Atomic Design構造で責任分離
3. **再利用性**: コンポーネントの他画面への展開が容易
4. **パフォーマンス**: Alpine.jsの効率的な差分更新
5. **型安全性**: TypeScriptでコンポーネントを定義

## 注意事項

- 既存のWebsiteListController等は段階的に削減
- E2Eテストはコンポーネント実装後に更新
- i18n対応は後続フェーズで実施
- アクセシビリティ（aria-label等）は最終調整で追加
