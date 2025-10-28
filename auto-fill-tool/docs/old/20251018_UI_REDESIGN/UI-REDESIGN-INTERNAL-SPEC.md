# Auto-Fill Tool - UI/UX Redesign Internal Specification
# UI/UX再設計 内部仕様書

**Version:** 4.0.0
**Date:** 2025-01-18
**Status:** Design Phase

---

## 📋 目次

1. [技術スタック](#技術スタック)
2. [アーキテクチャ設計](#アーキテクチャ設計)
3. [コンポーネント設計](#コンポーネント設計)
4. [状態管理](#状態管理)
5. [ビルド設定](#ビルド設定)
6. [テスト戦略](#テスト戦略)
7. [移行戦略](#移行戦略)

---

## 技術スタック

### フレームワーク選定

| 技術 | バージョン | 用途 | サイズ | 理由 |
|-----|----------|------|-------|------|
| **Alpine.js** | 3.14+ | JSフレームワーク | 15KB | 超軽量、HTMLで完結、ビルド不要 |
| **Tailwind CSS** | 3.4+ | CSSフレームワーク | ~10KB（Purge後） | ユーティリティファースト、高速開発 |
| **TypeScript** | 5.0+ | 型システム | - | 既存コードとの互換性 |
| **Webpack** | 5.0+ | バンドラー | - | 既存ビルドシステム |

### 既存技術との共存

```
┌─────────────────────────────────────┐
│ Presentation Layer                  │
│ ┌─────────────────────────────────┐ │
│ │ Alpine.js + Tailwind CSS        │ │ ← 新規（UI層）
│ │ (HTML-centric, reactive)        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ TypeScript Presenter Pattern    │ │ ← 既存（ロジック層）
│ │ (Business logic, Use cases)     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**重要**: Alpine.jsはViewレイヤーのみを担当し、既存のPresenter/UseCaseは維持します。

---

## アーキテクチャ設計

### レイヤー構成

```
┌────────────────────────────────────────────────────────┐
│ View Layer (Alpine.js + Tailwind CSS)                  │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Alpine Component (.html)                           │ │
│ │ <div x-data="websiteList()">                       │ │
│ │   <button @click="addWebsite()">追加</button>      │ │
│ │ </div>                                             │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
                           ↕️
┌────────────────────────────────────────────────────────┐
│ Presenter Layer (TypeScript)                           │
│ ┌────────────────────────────────────────────────────┐ │
│ │ WebsitePresenter.ts                                │ │
│ │ class WebsitePresenter {                           │ │
│ │   async loadWebsites() { ... }                     │ │
│ │   async addWebsite(data) { ... }                   │ │
│ │ }                                                  │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
                           ↕️
┌────────────────────────────────────────────────────────┐
│ Use Case Layer (TypeScript)                            │
│ GetAllWebsitesUseCase, SaveWebsiteUseCase, etc.       │
└────────────────────────────────────────────────────────┘
```

### Alpine.jsとPresenterの連携

**例: popup.html**

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css" rel="stylesheet">
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
  <script src="popup.js"></script> <!-- Presenter + Alpine初期化 -->
</head>
<body class="bg-gray-50">
  <div x-data="popupApp()" class="w-[420px] min-h-[600px] p-4">
    <!-- ヘッダー -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-900">🎯 Auto-Fill Tool</h1>
      <button @click="openSettings()" class="p-2 hover:bg-gray-100 rounded">⚙️</button>
    </div>

    <!-- クイックアクション -->
    <div class="grid grid-cols-3 gap-2 mb-4">
      <button @click="addWebsite()" class="btn-primary">
        ➕ サイト追加
      </button>
      <button @click="openXPathManager()" class="btn-info">
        🔍 XPath管理
      </button>
      <button @click="openHistory()" class="btn-info">
        📋 実行履歴
      </button>
    </div>

    <!-- サイト一覧 -->
    <div x-show="websites.length === 0" class="text-center py-8 text-gray-500">
      Webサイトが登録されていません
    </div>

    <div class="space-y-3">
      <template x-for="website in websites" :key="website.id">
        <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900" x-text="website.name"></h3>
              <p class="text-sm text-gray-600" x-text="website.startUrl"></p>
            </div>
            <span
              :class="{
                'bg-green-100 text-green-800': website.status === 'enabled',
                'bg-gray-100 text-gray-800': website.status === 'disabled',
                'bg-blue-100 text-blue-800': website.status === 'once'
              }"
              class="px-2 py-1 rounded text-xs font-medium"
              x-text="getStatusLabel(website.status)"
            ></span>
          </div>
          <div class="mt-3 flex gap-2">
            <button @click="executeAutoFill(website.id)" class="btn-sm btn-primary">
              ▶️ 実行
            </button>
            <button @click="editWebsite(website)" class="btn-sm btn-secondary">
              ✏️ 編集
            </button>
            <button @click="deleteWebsite(website.id)" class="btn-sm btn-danger">
              🗑️
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- モーダル（編集用） -->
    <div x-show="showEditModal"
         @click.away="showEditModal = false"
         x-cloak
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full" @click.stop>
        <h2 class="text-xl font-bold mb-4">Webサイト編集</h2>
        <form @submit.prevent="saveWebsite()">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input x-model="editingWebsite.name" type="text" required
                   class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">開始URL</label>
            <input x-model="editingWebsite.startUrl" type="url"
                   class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select x-model="editingWebsite.status"
                    class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <option value="enabled">有効</option>
              <option value="disabled">無効</option>
              <option value="once">1度だけ有効</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="btn-primary flex-1">💾 保存</button>
            <button type="button" @click="showEditModal = false" class="btn-secondary flex-1">✖ キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>
```

**popup.js (TypeScript → JS)**

```typescript
// popup.ts
import { WebsitePresenter } from './presentation/popup/WebsitePresenter';

// Alpine.jsコンポーネント定義
function popupApp() {
  const presenter = new WebsitePresenter();

  return {
    // State
    websites: [],
    showEditModal: false,
    editingWebsite: null,

    // Lifecycle
    async init() {
      await this.loadWebsites();
    },

    // Methods
    async loadWebsites() {
      this.websites = await presenter.loadWebsites();
    },

    async addWebsite() {
      this.editingWebsite = { id: '', name: '', startUrl: '', status: 'enabled' };
      this.showEditModal = true;
    },

    async editWebsite(website) {
      this.editingWebsite = { ...website };
      this.showEditModal = true;
    },

    async saveWebsite() {
      await presenter.saveWebsite(this.editingWebsite);
      await this.loadWebsites();
      this.showEditModal = false;
    },

    async deleteWebsite(id) {
      if (confirm('削除してもよろしいですか?')) {
        await presenter.deleteWebsite(id);
        await this.loadWebsites();
      }
    },

    async executeAutoFill(websiteId) {
      await presenter.executeAutoFill(websiteId);
    },

    openSettings() {
      chrome.tabs.create({ url: 'system-settings.html' });
    },

    openXPathManager() {
      chrome.tabs.create({ url: 'xpath-manager.html' });
    },

    openHistory() {
      chrome.tabs.create({ url: 'automation-variables-manager.html' });
    },

    getStatusLabel(status) {
      const labels = {
        enabled: '有効',
        disabled: '無効',
        once: '1回のみ'
      };
      return labels[status] || status;
    }
  };
}

// グローバルに登録（AlpineがHTMLから呼び出せるように）
window.popupApp = popupApp;
```

---

## コンポーネント設計

### 共通コンポーネントライブラリ

**public/components/alpine-components.html**（再利用可能なコンポーネント定義）

```html
<!-- ボタンコンポーネント -->
<template x-component="app-button">
  <button
    :class="{
      'btn-primary': variant === 'primary',
      'btn-secondary': variant === 'secondary',
      'btn-danger': variant === 'danger',
      'btn-sm': size === 'sm',
      'btn-lg': size === 'lg'
    }"
    class="btn"
    @click="$emit('click')"
  >
    <span x-show="icon" x-text="icon" class="mr-1"></span>
    <slot></slot>
  </button>
</template>

<!-- カードコンポーネント -->
<template x-component="app-card">
  <div class="bg-white rounded-lg shadow hover:shadow-md transition p-4">
    <div x-show="title" class="font-semibold text-lg mb-2" x-text="title"></div>
    <slot></slot>
  </div>
</template>

<!-- モーダルコンポーネント -->
<template x-component="app-modal">
  <div x-show="show"
       @click.away="$emit('close')"
       x-cloak
       class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
       x-transition:enter="ease-out duration-300"
       x-transition:enter-start="opacity-0"
       x-transition:enter-end="opacity-100">
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
         @click.stop
         x-transition:enter="ease-out duration-300"
         x-transition:enter-start="opacity-0 scale-90"
         x-transition:enter-end="opacity-100 scale-100">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold" x-text="title"></h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">✖</button>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<!-- トーストコンポーネント -->
<template x-component="app-toast">
  <div x-show="visible"
       x-transition:enter="ease-out duration-300"
       x-transition:enter-start="opacity-0 translate-y-4"
       x-transition:enter-end="opacity-100 translate-y-0"
       x-transition:leave="ease-in duration-200"
       x-transition:leave-start="opacity-100 translate-y-0"
       x-transition:leave-end="opacity-0 translate-y-4"
       class="fixed bottom-4 right-4 z-50">
    <div :class="{
           'bg-green-500': type === 'success',
           'bg-red-500': type === 'error',
           'bg-blue-500': type === 'info',
           'bg-yellow-500': type === 'warning'
         }"
         class="text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
      <span x-text="message"></span>
      <button @click="visible = false" class="ml-2">✖</button>
    </div>
  </div>
</template>
```

### Tailwind CSSユーティリティクラス

**public/styles/tailwind-custom.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Button Variants */
@layer components {
  .btn {
    @apply px-4 py-2 rounded font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2;
  }

  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500;
  }

  .btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
  }

  .btn-success {
    @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
  }

  .btn-info {
    @apply bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400;
  }

  .btn-sm {
    @apply text-sm px-3 py-1;
  }

  .btn-lg {
    @apply text-lg px-6 py-3;
  }

  /* Form Elements */
  .form-input {
    @apply w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  }

  .form-select {
    @apply w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white;
  }

  .form-label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }

  /* Cards */
  .card {
    @apply bg-white rounded-lg shadow hover:shadow-md transition p-4;
  }

  /* Table */
  .table {
    @apply w-full border-collapse;
  }

  .table-header {
    @apply bg-gray-50 border-b border-gray-200;
  }

  .table-row {
    @apply border-b border-gray-100 hover:bg-gray-50 transition;
  }

  .table-cell {
    @apply px-4 py-3 text-sm;
  }
}

/* Utility Extensions */
@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
```

---

## 状態管理

### Alpine.js Store（グローバル状態）

**src/presentation/stores/app-store.ts**

```typescript
// Alpine Storeを使用してグローバル状態を管理
export function initAppStore() {
  Alpine.store('app', {
    // Settings
    theme: 'light',
    language: 'ja',

    // Notifications
    notifications: [],

    // Loading state
    isLoading: false,

    // Methods
    setTheme(theme: 'light' | 'dark') {
      this.theme = theme;
      document.documentElement.classList.toggle('dark', theme === 'dark');
    },

    setLanguage(lang: string) {
      this.language = lang;
      // Trigger i18n update
      window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
    },

    showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
      const id = Date.now();
      this.notifications.push({ id, message, type });
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 5000);
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    }
  });
}
```

**使用例（HTMLから）:**

```html
<div x-data>
  <!-- テーマ切り替え -->
  <button @click="$store.app.setTheme($store.app.theme === 'light' ? 'dark' : 'light')">
    <span x-text="$store.app.theme === 'light' ? '🌙' : '☀️'"></span>
  </button>

  <!-- ローディング表示 -->
  <div x-show="$store.app.isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="spinner"></div>
  </div>

  <!-- 通知トースト -->
  <template x-for="notification in $store.app.notifications" :key="notification.id">
    <div class="toast" x-text="notification.message"></div>
  </template>
</div>
```

### ローカル状態（コンポーネント内）

Alpine.jsの`x-data`で管理：

```html
<div x-data="{
  // State
  items: [],
  filter: '',
  sortBy: 'name',

  // Computed
  get filteredItems() {
    return this.items
      .filter(item => item.name.includes(this.filter))
      .sort((a, b) => a[this.sortBy].localeCompare(b[this.sortBy]));
  },

  // Lifecycle
  init() {
    this.loadItems();
  },

  // Methods
  async loadItems() {
    this.items = await fetchItems();
  }
}">
  <!-- UI -->
</div>
```

---

## ビルド設定

### Webpack設定の更新

**webpack.config.js**

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    popup: './src/presentation/popup/index.ts',
    'xpath-manager': './src/presentation/xpath-manager/index.ts',
    'automation-variables-manager': './src/presentation/automation-variables-manager/index.ts',
    'system-settings': './src/presentation/system-settings/index.ts',
    'storage-sync-manager': './src/presentation/storage-sync-manager/index.ts',
    'master-password-setup': './src/presentation/master-password-setup/index.ts',
    'unlock': './src/presentation/unlock/index.ts',
    background: './src/presentation/background/index.ts',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader', // Tailwind CSS処理
        ],
      },
    ],
  },

  plugins: [
    // HTML生成
    new HtmlWebpackPlugin({
      template: './public/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: './public/xpath-manager.html',
      filename: 'xpath-manager.html',
      chunks: ['xpath-manager'],
    }),
    // ... 他の画面

    // CSS抽出
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@usecases': path.resolve(__dirname, 'src/usecases'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@presentation': path.resolve(__dirname, 'src/presentation'),
    },
  },
};
```

### PostCSS設定（Tailwind CSS）

**postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
};
```

**tailwind.config.js**

```javascript
module.exports = {
  content: [
    './public/**/*.html',
    './src/presentation/**/*.{ts,js}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1976D2',
          light: '#42A5F5',
          dark: '#1565C0',
        },
      },
    },
  },
  plugins: [],
};
```

---

## テスト戦略

### Alpine.jsコンポーネントのテスト

**例: popup.test.ts**

```typescript
import { JSDOM } from 'jsdom';
import Alpine from 'alpinejs';

describe('Popup Component', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    // JSDOM環境をセットアップ
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div x-data="popupApp()" id="app">
            <button @click="addWebsite()" id="addBtn">Add</button>
            <div x-show="websites.length === 0" id="empty">Empty</div>
          </div>
        </body>
      </html>
    `, { runScripts: 'dangerously' });

    document = dom.window.document;
    global.window = dom.window as any;
    global.document = document;

    // Alpine.js初期化
    Alpine.start();
  });

  afterEach(() => {
    dom.window.close();
  });

  test('should display empty message when no websites', async () => {
    const emptyDiv = document.getElementById('empty');
    expect(emptyDiv?.style.display).not.toBe('none');
  });

  test('should open modal when add button is clicked', async () => {
    const addBtn = document.getElementById('addBtn');
    addBtn?.click();

    // モーダルが表示されることを確認
    await new Promise(resolve => setTimeout(resolve, 100)); // Alpine更新待ち
    const modal = document.querySelector('[x-show="showEditModal"]');
    expect(modal?.style.display).not.toBe('none');
  });
});
```

### E2Eテスト（Playwright）

```typescript
import { test, expect } from '@playwright/test';

test('popup workflow', async ({ page }) => {
  // 拡張機能のポップアップを開く
  await page.goto('chrome-extension://[ID]/popup.html');

  // サイト追加ボタンをクリック
  await page.click('text=サイト追加');

  // モーダルが表示される
  await expect(page.locator('.modal')).toBeVisible();

  // フォーム入力
  await page.fill('input[name="name"]', 'Test Site');
  await page.fill('input[name="startUrl"]', 'https://example.com');

  // 保存
  await page.click('text=保存');

  // サイトがリストに追加される
  await expect(page.locator('text=Test Site')).toBeVisible();
});
```

---

## 移行戦略

### ✅ Phase 1: Atomic Design共通コンポーネントライブラリ構築（完了: 2025-01-19）

**実施内容:**
- ✅ Tailwind CSS導入（既存）
- ✅ Atomic Designパターンでの共通コンポーネントライブラリ構築
  - **Atoms（9個）**: Button, Input, Select, Textarea, Checkbox, Toggle, Badge, Icon, ColorPicker
  - **Molecules（6個）**: FormField, TableRow, TableHeader, FilterBar, ActionBar, TabItem
  - **Organisms（4個）**: Table, Navigation, FilterPanel, TabBar
- ✅ TypeScriptベースのコンポーネント設計（`src/presentation/common/components/`）
- ✅ i18n対応、Alpine.js統合、Tailwind CSSスタイル適用
- ✅ 品質保証完了（Lint 0 errors, Type Check完了, Tests 4218 passed）

**技術的特徴:**
- String-based HTML generation（Alpine.jsと統合可能）
- Clean Architectureとの共存（Presentation層のみ）
- 既存Presenterパターンを維持
- 完全な型安全性（TypeScript）

**削減効果:**
- コード行数: 約150行削減（XPath Manager実装例）
- 保守性: コンポーネント責任分離、再利用性向上

---

### Phase 2: 画面ごと段階移行（Week 2-8）

#### ✅ Phase 2.1: XPath Manager部分適用（完了: 2025-01-19）

**実施内容:**
- ✅ XPathCardコンポーネント作成（`src/presentation/xpath-manager/components/molecules/XPathCard.ts`）
  - 180行の専用Molecule
  - Action pattern display logic統合
  - Judge/Select/Input pattern対応
- ✅ XPathManagerView.tsリファクタリング
  - 8個のヘルパーメソッド削除
  - renderXPathItem → renderXPathCard移行
  - 約150行のコード削減
- ✅ テスト完了（31 passed）
- ✅ Lint・Type Check完了

---

#### ✅ Phase 2.2: XPath Manager完全移行（完了: 2025-01-19）

**実施内容:**
- ✅ **Edit Modalのフォームフィールド置き換え**
  - 11個のフォームフィールドをTailwind CSS共通スタイルクラスで統一
  - `form-input`, `form-select`クラス適用
  - モーダルレイアウト改善（max-w-3xl, overflow-y-auto）
  - フォーム内間隔調整（space-y-4）
- ✅ **Variables Modalの整理**
  - グリッドレイアウト適用（grid-cols-2）
  - 共通スタイルクラス適用
  - レイアウト改善（space-y-2, mb-4）
- ✅ **Control Barのコンポーネント化**
  - FilterBar風スタイル（bg-white border-b）
  - Flexboxレイアウト（justify-between）
  - レスポンシブ対応（flex-1, max-w-xs）
- ✅ **品質保証完了**
  - テスト: 140 passed（XPath Manager関連全テスト）
  - Lint: 0 errors, 0 warnings
  - ビルド: Success

**技術的詳細:**
- HTML直接編集アプローチ（既存TypeScriptコード保持）
- Tailwind CSS共通スタイルクラス活用（form-input, form-select）
- 既存ID参照維持（DOM操作互換性確保）
- モノスペースフォント適用（XPath表示: font-mono text-sm）

---

#### ✅ Phase 2.3: Automation Variables Manager完全移行（完了: 2025-01-19）

**実施内容:**
- ✅ **Control Barのコンポーネント化**
  - FilterBar風スタイル（bg-white border-b border-gray-200）
  - Flexboxレイアウト（flex items-center justify-between）
  - レスポンシブ対応（gap-4）
- ✅ **Edit/Create Modalの更新**
  - フォームフィールドをTailwind CSS共通スタイルクラスで統一
  - `form-input`, `form-select`クラス適用
  - モーダルレイアウト改善（max-w-2xl, max-h-[90vh] overflow-y-auto）
  - フォーム内間隔調整（space-y-4）
  - 変数フィールドコンテナに`space-y-2`適用
- ✅ **Variables List表示確認**
  - カードベースの表示システム維持
  - 既存の動的レンダリングロジック確認
- ✅ **品質保証完了**
  - テスト: 62 passed（Automation Variables Manager関連全テスト）
  - Lint: 0 errors, 0 warnings
  - ビルド: Success

**技術的詳細:**
- HTML直接編集アプローチ（既存TypeScriptコード保持）
- Tailwind CSS共通スタイルクラス活用（form-input, form-select）
- 既存ID参照維持（DOM操作互換性確保）
- カードベース表示システム継続使用（variables-item, variables-header等）

**推定工数:** 約1時間（予定3-4時間より短縮）
**成功基準達成:** ✅ E2Eテスト合格、Lint 0 errors

---

#### ✅ Phase 2.4: System Settings完全移行（完了: 2025-01-19）

**実施内容:**
- ✅ **タブUI維持**
  - 既存のタブナビゲーション（4タブ: 基本設定、録画設定、外観設定、データ同期）を維持
  - カスタムスタイルとTailwind CSSの共存
- ✅ **General Settings Tab更新**
  - 6個のフォームフィールドを共通スタイルクラスで統一
  - `form-input`, `form-select`クラス適用
  - サブセクション区切り（border-t border-gray-200）
  - フォーム内間隔調整（space-y-6）
- ✅ **Recording Settings Tab更新**
  - 4個のフォームフィールド（チェックボックス2個、入力2個）を更新
  - チェックボックスレイアウト改善（flex items-start gap-3）
  - 共通スタイルクラス適用
- ✅ **Appearance Settings Tab更新**
  - 3個のフォームフィールド（カラーピッカー2個、数値1個）を更新
  - カラーピッカーレイアウト改善（flex gap-3 items-center）
  - 数値表示スタイル改善
- ✅ **Data Sync Tab維持**
  - カードベースの表示システム維持
  - 既存のカスタムスタイル継続使用
- ✅ **品質保証完了**
  - テスト: 166 passed（System Settings関連全テスト）
  - Lint: 0 errors, 0 warnings
  - ビルド: Success

**技術的詳細:**
- HTML直接編集アプローチ（既存TypeScriptコード保持）
- Tailwind CSS共通スタイルクラス活用（form-input, form-select）
- 既存タブナビゲーション維持（カスタムスタイルと共存）
- レスポンシブ対応（flex, gap utilities）

**推定工数:** 約1.5時間（予定3-4時間より短縮）
**成功基準達成:** ✅ 全タブ動作、設定保存確認、レスポンシブ対応

---

#### ✅ Phase 2.5: Storage Sync Manager完全移行（完了: 2025-01-19）

**推定工数:** 約1時間（予定2-3時間より短縮）
**作業内容:**
- ✅ **Edit/Create Modal更新**
  - 8個のフォームフィールドを共通スタイルクラスで統一
  - `form-input`, `form-select`クラス適用
  - モーダルレイアウト改善（max-w-2xl, max-h-[90vh] overflow-y-auto）
  - フォーム内間隔調整（space-y-4）
- ✅ **Input/Output Sections構造化**
  - セクションヘッダー（font-semibold text-sm text-blue-600）
  - 動的リストコンテナ（space-y-2）
  - 全幅ボタン（btn-success w-full）
  - 説明テキスト（text-xs text-gray-500）
- ✅ **CSV Config Section条件表示**
  - 境界線分離（border-t border-gray-200 pt-4）
  - エンコーディング、区切り文字、ヘッダー行の3セレクトボックス
- ✅ **品質保証完了**
  - テスト: 4218 passed
  - Lint: 0 errors, 0 warnings
  - ビルド: Success

**技術的詳細:**
- HTML直接編集アプローチ（既存TypeScriptコード保持）
- Tailwind CSS共通スタイルクラス活用（form-input, form-select）
- 複雑なフォーム構造への対応（条件表示、動的リスト）
- セクション分離による視覚的階層構造の改善

---

#### ✅ Phase 2.6-2.7: 認証系画面2画面完全移行（完了: 2025-01-19）

**推定工数:** 約30分（予定2-3時間より大幅短縮）
**作業内容:**
- ✅ **master-password-setup.html更新**
  - 2個のパスワード入力フィールドに form-input 適用
  - ラベル統一（block text-sm font-medium text-gray-700 mb-1）
  - ボタン更新（btn-primary w-full）
  - フォーム間隔調整（space-y-4）
  - パスワード強度インジケーター維持
- ✅ **unlock.html更新**
  - パスワード入力フィールドに form-input 適用
  - ラベル統一
  - ボタン更新（btn-primary w-full）
  - フォーム間隔調整（space-y-4）
  - ロックアウトタイマー、試行回数表示維持
- ✅ **品質保証完了**
  - テスト: 4218 passed
  - Lint: 0 errors, 0 warnings
  - ビルド: Success

**技術的詳細:**
- HTML直接編集アプローチ（既存TypeScriptコード保持）
- Tailwind CSS共通スタイルクラス活用（form-input, btn-primary）
- 既存認証スタイル（auth-container, auth-form）との共存
- 最小限の変更でUI統一

---

### Phase 3: テスト・最適化（Week 9）

- [ ] 全画面の統合テスト（E2E）
- [ ] パフォーマンステスト（初期表示150ms以下確認）
- [ ] アクセシビリティ監査（WCAG 2.1 AA準拠）
- [ ] ドキュメント更新（README, CHANGELOG）

---

### Phase 4: リリース（Week 10）

- [ ] ベータテスト（テストユーザーフィードバック）
- [ ] フィードバック収集・バグ修正
- [ ] 最終調整
- [ ] プロダクションリリース

---

### 移行優先度（更新版）

| 優先度 | 画面 | 状態 | 推定工数 | 理由 |
|-------|------|------|---------|------|
| ⚡ 最高 | XPath Manager | ✅ 完了 | 完了 | XPathCard + Modal + Control Bar完成 |
| 🔥 高 | Automation Variables Manager | ✅ 完了 | 完了 | Control Bar + Modal完成、カード表示維持 |
| 🔥 高 | System Settings | ✅ 完了 | 完了 | 4タブ全フォーム更新、カスタムスタイル共存 |
| 🟢 中 | Storage Sync Manager | ✅ 完了 | 完了 | Modal更新、Input/Output sections構造化 |
| 🟡 低 | Master Password Setup | ✅ 完了 | 完了 | フォーム更新、既存スタイル共存 |
| 🟡 低 | Unlock | ✅ 完了 | 完了 | フォーム更新、既存スタイル共存 |

**注記:** popup.htmlは既にAlpine.js + Tailwind CSSで実装済みのため、本移行計画の対象外です。

---

### 合計推定工数

| フェーズ | 工数 | 状態 |
|---------|------|------|
| Phase 1: 共通コンポーネント | 2-3時間 | ✅ 完了 (2025-01-19) |
| Phase 2.1: XPath Manager部分適用 | ~1時間 | ✅ 完了 (2025-01-19) |
| Phase 2.2: XPath Manager完全移行 | ~2時間 | ✅ 完了 (2025-01-19) |
| Phase 2.3: Automation Variables Manager完全移行 | ~1時間 | ✅ 完了 (2025-01-19) |
| Phase 2.4: System Settings完全移行 | ~1.5時間 | ✅ 完了 (2025-01-19) |
| Phase 2.5: Storage Sync Manager完全移行 | ~1時間 | ✅ 完了 (2025-01-19) |
| Phase 2.6-2.7: 認証画面2画面移行 | ~0.5時間 | ✅ 完了 (2025-01-19) |
| Phase 3: テスト・最適化 | 2-3時間 | 📋 未着手 |
| Phase 4: リリース | 1-2時間 | 📋 未着手 |
| **合計** | **15-22.5時間** | **Phase 2完了（約60%）** |

---

## まとめ

この内部仕様書により：

1. **Alpine.js + Tailwind CSS**を既存アーキテクチャと統合
2. **コンポーネント共通化**で保守性向上
3. **段階的移行**でリスク最小化
4. **テスト戦略**で品質担保

次のステップ: [修正方針](./UI-REDESIGN-REFACTORING-PLAN.md)で詳細な実装計画を策定します。
