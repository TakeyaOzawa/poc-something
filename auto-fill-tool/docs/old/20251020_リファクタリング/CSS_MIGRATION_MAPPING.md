# CSS Migration Mapping: common.css → Tailwind CSS

このドキュメントは、common.cssのクラスをTailwind CSSの utility classesに置き換えるためのマッピングを示します。

## ✅ 完全に置き換え可能なクラス

### Buttons

| common.css Class | Tailwind Equivalent |
|-----------------|---------------------|
| `.btn` | `px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 rounded-md border-none cursor-pointer transition-all duration-200` |
| `.btn-primary` | `bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed` |
| `.btn-secondary` | `bg-gray-400 text-white shadow-sm hover:bg-gray-500 hover:shadow-md hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed` |
| `.btn-success` | `bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-md hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed` |
| `.btn-danger` | `bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed` |
| `.btn-warning` | `bg-yellow-500 text-white shadow-sm hover:bg-yellow-600 hover:shadow-md hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed` |
| `.btn-info` | `bg-blue-500 text-white shadow-sm hover:bg-blue-600 hover:shadow-md hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed` |

### Modal Components

| common.css Class | Tailwind Equivalent |
|-----------------|---------------------|
| `.modal` | `hidden fixed inset-0 bg-black/50 z-[1000] backdrop-blur-sm` |
| `.modal.show` | 上記に `flex items-center justify-center` を追加 (JavaScriptで動的に追加) |
| `.modal-content` | `bg-white rounded-xl p-6 w-11/12 max-w-[500px] max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-200` |
| `.modal-header` | `text-xl font-semibold mb-5 text-gray-800 pb-3 border-b-2 border-gray-200` |
| `.modal-actions` | `flex gap-3 mt-5 pt-4 border-t-2 border-gray-200` |

### Form Elements

| common.css Class | Tailwind Equivalent |
|-----------------|---------------------|
| `.form-group` | `mb-4` |
| `.form-input` | `w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-800 bg-white transition-all hover:border-gray-300 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100` |
| `.form-select` | `w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-800 bg-white transition-all hover:border-gray-300 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 appearance-none` |
| `.form-textarea` | `w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-800 bg-white transition-all hover:border-gray-300 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 font-mono resize-y min-h-[80px] leading-relaxed` |

### Layout Components

| common.css Class | Tailwind Equivalent |
|-----------------|---------------------|
| `.container` | `max-w-screen-xl mx-auto w-full` |
| `.controls` | `flex flex-wrap gap-3 mb-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200` |
| `.empty-state` | `text-center py-8 px-5 text-gray-400 text-sm` |

### List Containers

| common.css Class | Tailwind Equivalent |
|-----------------|---------------------|
| `.xpath-list` | `bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-h-full overflow-y-auto` |
| `.website-list` | `bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-h-full overflow-y-auto` |
| `.variables-list` | `bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-h-full overflow-y-auto` |

### List Items

| common.css Class | Tailwind Equivalent |
|-----------------|---------------------|
| `.xpath-item` | `bg-white border border-gray-200 rounded-lg p-4 mb-3 last:mb-0 transition-all shadow-sm hover:border-blue-600 hover:shadow-md hover:-translate-y-0.5` |
| `.website-item` | `bg-white border border-gray-200 rounded-lg p-4 mb-3 last:mb-0 transition-all shadow-sm hover:border-blue-600 hover:shadow-md hover:-translate-y-0.5` |
| `.variable-item-card` | `bg-white border border-gray-200 rounded-lg p-4 mb-3 last:mb-0 transition-all shadow-sm hover:border-blue-600 hover:shadow-md hover:-translate-y-0.5` |

### Card Components

| common.css Class | Tailwind Equivalent |
|-----------------|---------------------|
| `.card` | `bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 mb-5` |
| `.card-header` | `px-5 py-4 bg-blue-50 border-b-2 border-gray-200 text-lg font-semibold text-gray-800` |
| `.card-body` | `p-5` |

### Section Headers

| common.css Class | Tailwind Equivalent |
|-----------------|---------------------|
| `.section-header` | `text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-200` |

## ⚠️ 追加のカスタムスタイルが必要なもの

以下のコンポーネントは、Tailwindのutility classesだけでは完全には置き換えられないため、各HTMLファイルの `<style>` セクションにカスタムCSSを追加する必要があります。

### 1. Unified Navigation Bar ✅ 完了 (2025-01-XX)

`.unified-nav-bar` とそのドロップダウンメニューは複雑なスタイル定義を持っているため、以下のアプローチで実装しました：

**実施内容**:
- `public/components/unified-nav-bar.html`: HTMLテンプレート（`<template>` タグ使用）
- `public/styles/unified-nav-bar.css`: 独立したCSSファイル（約350行）
  - モダンな紫グラデーション背景
  - ドロップダウンメニューアニメーション
  - レスポンシブデザイン（3ブレークポイント）
  - ダークモード対応
  - 印刷時非表示
- `src/presentation/common/UnifiedNavigationBar.ts`: テンプレートクローン方式にリファクタリング
  - `innerHTML`生成からテンプレート読み込みに変更
  - エクスポートメニュー項目を動的生成

**適用済みページ**:
- xpath-manager.html
- storage-sync-manager.html
- automation-variables-manager.html
- system-settings.html

### 2. Authentication Screens ✅ 完了 (2025-01-20)

認証画面（master-password-setup.html, unlock.html）の特殊なスタイルを実装しました。

**実施内容**:
- `master-password-setup.html`: 認証画面用の包括的なスタイルを `<style>` セクションに追加
  - `.auth-container`: tailwind.css のクラスを使用（bg-white, rounded-xl, p-6, shadow-lg）
  - `.auth-header-icon`: 大きなアイコン表示用スタイル（64px, インラインブロック）
  - `.auth-spinner`: スピナーアニメーション（@keyframes spin）
  - `.auth-message`: 成功/エラーメッセージ表示用スタイル
  - `.auth-loading-spinner`: ローディング表示用スタイル
  - `.auth-info-box`: 情報ボックス用スタイル（青色）
  - `.auth-warning-box`: 警告ボックス用スタイル（オレンジ色）

- `unlock.html`: 認証画面用スタイルを `<style>` セクションに追加
  - `.auth-header-icon`: アイコン表示 + pulseアニメーション（@keyframes pulse）
  - `.auth-spinner`: スピナーアニメーション（@keyframes spin）
  - `.auth-message`: 成功/エラーメッセージ表示用スタイル
  - `.auth-loading-spinner`: ローディング表示用スタイル
  - `.auth-link`: リンク用スタイル（ホバー効果付き）

**適用済みページ**:
- master-password-setup.html
- unlock.html

### 3. Progress Indicator

`.progress-indicator` とその関連クラスは、アニメーション(`@keyframes progress-indeterminate`)を使用しているため、`<style>` セクションに以下を追加:

```css
@keyframes progress-indeterminate {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

その後、Tailwindの `animate-[progress-indeterminate]` を使用可能にする。

### 4. Spinner Animation

認証画面のスピナー用 `@keyframes spin`:

```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

Tailwindには標準で `animate-spin` があるため、これは置き換え不要。

## 📝 注意事項

### JavaScript側の変更が必要な箇所

1. **Modal の表示/非表示**: `modal.classList.add('show')` を `modal.classList.remove('hidden')` + `modal.classList.add('flex')` に変更
2. **動的にクラスを追加/削除している箇所**: すべて新しいTailwindクラスに合わせて変更

### スクロールバーのカスタマイズ

common.cssには `::-webkit-scrollbar` のスタイルがありますが、これはTailwindでは標準サポートされていません。

**推奨**: 各HTMLファイルの `<style>` セクションに以下を追加:

```css
.xpath-list::-webkit-scrollbar,
.website-list::-webkit-scrollbar,
.variables-list::-webkit-scrollbar {
  width: 8px;
}

.xpath-list::-webkit-scrollbar-track,
.website-list::-webkit-scrollbar-track,
.variables-list::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.xpath-list::-webkit-scrollbar-thumb,
.website-list::-webkit-scrollbar-thumb,
.variables-list::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded hover:bg-gray-400;
}
```

## 🚀 移行手順

1. 各HTMLファイルで common.css クラスを上記のTailwindクラスに置き換え
2. `<style>` セクションにカスタムアニメーションやスクロールバースタイルを追加（必要に応じて）
3. JavaScriptファイル内のクラス名参照を更新
4. `<link rel="stylesheet" href="styles/common.css">` を削除
5. 表示確認

## 📊 移行状況

- [ ] xpath-manager.html
- [ ] popup.html
- [ ] storage-sync-manager.html
- [ ] automation-variables-manager.html
- [ ] system-settings.html
- [x] master-password-setup.html
- [x] unlock.html
