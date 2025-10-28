# Auto-Fill Tool - 開発者ガイド
# Developer Guide for UI/UX Redesign

**Version:** 4.0.0
**Date:** 2025-01-19
**Status:** Phase 2-3 Complete

---

## 📋 目次

1. [概要](#概要)
2. [技術スタック](#技術スタック)
3. [Tailwind CSS使い方](#tailwind-css使い方)
4. [共通スタイルクラス](#共通スタイルクラス)
5. [HTMLファイル構造](#htmlファイル構造)
6. [Alpine.js統合](#alpinejs統合)
7. [ベストプラクティス](#ベストプラクティス)
8. [トラブルシューティング](#トラブルシューティング)

---

## 概要

このガイドは、Auto-Fill ToolのUI/UX再設計プロジェクト（Phase 2-3完了）における開発者向けの実践的なドキュメントです。

### プロジェクトの目標

- ✅ **UIの高速化**: 初期表示時間50%削減
- ✅ **保守性向上**: 共通スタイルクラスによる統一
- ✅ **UX改善**: Tailwind CSS準拠の一貫したデザイン
- ✅ **Bundle最適化**: 最大chunkサイズを95%削減

### 完了した作業

- **Phase 1**: Tailwind CSS環境構築完了
- **Phase 2**: 6画面のHTML/CSS移行完了
- **Phase 3**: テスト・最適化完了（4218テスト合格、カバレッジ85.4%）
- **残課題対応**: Bundle最適化（splitChunks）、E2Eテストインフラ改善

---

## 技術スタック

### CSS Framework

- **Tailwind CSS v4** (`@tailwindcss/postcss`)
- **PostCSS** (Tailwind CSS処理)
- **共通スタイルシート** (`public/styles/common.css`)

### JavaScript Framework（オプション）

- **Alpine.js 3.14.0** (popup.htmlでのみ使用)
- CDN経由でロード（ビルド不要）

### Build Tools

- **Webpack 5** (Module Bundler)
- **MiniCssExtractPlugin** (CSS抽出)
- **PostCSS Loader** (Tailwind CSS処理)

---

## Tailwind CSS使い方

### 基本構造

すべてのHTMLファイルに以下のリンクを含める：

```html
<head>
  <link rel="stylesheet" href="styles/common.css">
  <link rel="stylesheet" href="styles/tailwind.css">
</head>
```

### ビルドプロセス

1. **開発ビルド**:
   ```bash
   npm run dev  # ウォッチモード
   ```

2. **プロダクションビルド**:
   ```bash
   npm run build
   ```

3. **成果物**: `dist/styles/tailwind.css` (47.1KB)

### Tailwind CSS v4の重要な変更点

#### 新しい構文

```css
/* public/styles/tailwind.css */
@import "tailwindcss";  /* v4の新構文（@tailwind は廃止） */

@layer components {
  /* 共通コンポーネントスタイル */
}
```

#### PostCSS設定

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},  /* v4の新プラグイン */
  },
};
```

---

## 共通スタイルクラス

### 1. フォーム要素

#### Input Fields

```html
<input
  type="text"
  class="form-input w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  placeholder="例: テキスト">
```

**共通クラス**: `form-input`

**追加クラス**:
- `w-full`: 幅100%
- `px-2 py-1.5`: 内側余白
- `text-xs`: 小さいフォントサイズ
- `focus:ring-2 focus:ring-blue-500`: フォーカス時のリング

#### Select Boxes

```html
<select
  class="form-select w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
  <option value="option1">オプション1</option>
  <option value="option2">オプション2</option>
</select>
```

**共通クラス**: `form-select`

**重要**: `bg-white` を追加して、ブラウザデフォルトの背景色を上書き

#### Labels

```html
<label
  for="inputId"
  class="form-label block text-xs font-semibold text-gray-700 mb-1">
  ラベル名
</label>
```

**共通クラス**: `form-label`

### 2. ボタン

#### Primary Button

```html
<button
  class="btn btn-primary py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors">
  保存
</button>
```

**共通クラス**: `btn btn-primary`

#### Secondary Button

```html
<button
  class="btn btn-secondary py-2 text-xs font-semibold bg-gray-300 text-gray-700 hover:bg-gray-400 rounded transition-colors">
  キャンセル
</button>
```

**共通クラス**: `btn btn-secondary`

#### Danger Button

```html
<button
  class="btn btn-danger py-2 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 rounded transition-colors">
  削除
</button>
```

**共通クラス**: `btn btn-danger`

#### Success Button

```html
<button
  class="btn btn-success py-2 text-xs font-semibold bg-green-600 text-white hover:bg-green-700 rounded transition-colors">
  実行
</button>
```

**共通クラス**: `btn btn-success`

#### Info Button

```html
<button
  class="btn btn-info py-2 text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors">
  情報
</button>
```

**共通クラス**: `btn btn-info`

#### Small Button

```html
<button
  class="btn btn-primary btn-sm px-1.5 py-0.5 text-xs">
  小さいボタン
</button>
```

**共通クラス**: `btn-sm`

### 3. レイアウト

#### Card

```html
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
  <h2 class="font-semibold text-gray-900 mb-2">カードタイトル</h2>
  <p class="text-xs text-gray-600">カードの内容...</p>
</div>
```

**共通パターン**:
- `bg-white`: 白背景
- `rounded-lg`: 角丸
- `shadow-sm`: 軽いシャドウ
- `border border-gray-200`: 境界線
- `p-4`: 内側余白

#### Control Bar (FilterBar風)

```html
<div class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4">
  <!-- 左側: フィルター -->
  <div class="flex items-center gap-2 flex-1">
    <input
      type="text"
      class="form-input flex-1 max-w-xs"
      placeholder="検索...">
  </div>

  <!-- 右側: アクション -->
  <div class="flex items-center gap-2">
    <button class="btn btn-primary">追加</button>
    <button class="btn btn-info">設定</button>
  </div>
</div>
```

**共通パターン**:
- `flex items-center justify-between`: Flexboxレイアウト
- `gap-4`: 要素間の間隔
- `flex-1 max-w-xs`: フィルター入力の幅制限

#### Grid Layout

```html
<div class="grid grid-cols-2 gap-4">
  <div>列1</div>
  <div>列2</div>
</div>
```

**共通クラス**:
- `grid grid-cols-2`: 2カラムグリッド
- `gap-4`: グリッドアイテム間の間隔

### 4. モーダル

```html
<div
  class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3"
  id="myModal"
  style="display: none;">
  <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    <!-- ヘッダー -->
    <div class="modal-header bg-blue-600 text-white px-4 py-2.5 rounded-t-lg font-semibold text-sm">
      モーダルタイトル
    </div>

    <!-- ボディ -->
    <div class="p-4 space-y-4">
      <!-- モーダルの内容 -->
    </div>

    <!-- フッター -->
    <div class="p-4 border-t border-gray-200 flex gap-2">
      <button class="btn btn-primary flex-1">保存</button>
      <button class="btn btn-secondary flex-1">キャンセル</button>
    </div>
  </div>
</div>
```

**共通パターン**:
- `fixed inset-0`: 全画面オーバーレイ
- `bg-black bg-opacity-50`: 半透明黒背景
- `max-h-[90vh] overflow-y-auto`: 最大高さ制限とスクロール

### 5. 間隔ユーティリティ

```html
<!-- 垂直方向の間隔 -->
<div class="space-y-4">
  <div>要素1</div>
  <div>要素2</div>
  <div>要素3</div>
</div>

<!-- マージン -->
<div class="mb-4">マージン下: 1rem</div>
<div class="mt-2">マージン上: 0.5rem</div>

<!-- パディング -->
<div class="p-4">パディング: 1rem</div>
<div class="px-2 py-1.5">パディング横: 0.5rem, 縦: 0.375rem</div>
```

**サイズ対応表**:
- `1`: 0.25rem (4px)
- `1.5`: 0.375rem (6px)
- `2`: 0.5rem (8px)
- `3`: 0.75rem (12px)
- `4`: 1rem (16px)
- `6`: 1.5rem (24px)

---

## HTMLファイル構造

### 基本テンプレート

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ページタイトル</title>
  <link rel="stylesheet" href="styles/common.css">
  <link rel="stylesheet" href="styles/tailwind.css">
</head>
<body class="bg-gray-50 p-4">
  <!-- ナビゲーションヘッダー（サブページの場合） -->
  <div class="bg-white border-b border-gray-200 px-4 py-3 mb-4">
    <a href="popup.html" class="text-blue-600 hover:text-blue-700 text-sm">
      ← メインに戻る
    </a>
    <h1 class="font-semibold text-gray-900 text-lg mt-2">ページタイトル</h1>
  </div>

  <!-- メインコンテンツ -->
  <div class="max-w-7xl mx-auto">
    <!-- コンテンツ -->
  </div>

  <script src="page-name.js"></script>
</body>
</html>
```

### レスポンシブデザインのポイント

```html
<!-- 画面幅に応じた最大幅 -->
<div class="max-w-7xl mx-auto">
  <!-- コンテンツ -->
</div>

<!-- レスポンシブグリッド -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- グリッドアイテム -->
</div>

<!-- レスポンシブフォントサイズ -->
<h1 class="text-lg md:text-xl lg:text-2xl">見出し</h1>
```

---

## Alpine.js統合

### 使用箇所

現在、**popup.html**でのみAlpine.jsを使用しています。

### CDNロード

```html
<head>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.0/dist/cdn.min.js"></script>
</head>
```

### 基本的な使い方

```html
<div x-data="{ open: false }">
  <button @click="open = !open">トグル</button>
  <div x-show="open">
    表示/非表示される内容
  </div>
</div>
```

### popup.htmlでの実装例

```html
<body x-data="window.popupApp ? window.popupApp() : {}">
  <!-- x-for ディレクティブでリスト表示 -->
  <template x-for="website in websites" :key="website.id">
    <div>
      <span x-text="website.name"></span>
      <button @click="handleEdit(website.id)">編集</button>
    </div>
  </template>

  <!-- x-show ディレクティブで条件表示 -->
  <div x-show="showModal">
    モーダルの内容
  </div>
</body>
```

**重要**: Alpine.jsは `popup.js` で定義された `window.popupApp()` 関数と連携しています。

---

## ベストプラクティス

### 1. スタイルクラスの優先順位

1. **共通スタイルクラス** (`form-input`, `btn-primary` 等) を**最優先**で使用
2. Tailwind CSSユーティリティクラスで微調整
3. カスタムCSSは最小限にとどめる

```html
<!-- Good -->
<input class="form-input w-full">

<!-- Bad -->
<input style="width: 100%; padding: 0.5rem;">
```

### 2. 既存ID参照の維持

DOM操作のため、既存の `id` 属性は**必ず維持**してください。

```html
<!-- Good -->
<button id="addWebsiteBtn" class="btn btn-primary">
  追加
</button>

<!-- Bad (IDを削除してはいけない) -->
<button class="btn btn-primary">
  追加
</button>
```

### 3. TypeScriptコードの互換性

HTML/CSSの変更時は、TypeScriptコード（Presenter、View）との互換性を維持してください。

- `getElementById()` で参照される要素のIDを変更しない
- `querySelector()` のセレクタに影響する変更をしない
- イベントハンドラが期待する要素の構造を維持する

### 4. レスポンシブデザイン

すべての画面で以下の幅範囲に対応：

- **最小幅**: 320px（モバイル）
- **推奨幅**: 400px-1920px
- **popup.html**: 固定幅 400px

```html
<!-- レスポンシブ対応例 -->
<div class="w-full sm:w-96 md:w-[600px] lg:w-[800px]">
  <!-- コンテンツ -->
</div>
```

### 5. アクセシビリティ

すべてのフォーム要素に `label` を関連付けてください。

```html
<!-- Good -->
<label for="inputName" class="form-label">名前</label>
<input id="inputName" type="text" class="form-input">

<!-- Bad -->
<input type="text" class="form-input" placeholder="名前">
```

**WCAG 2.1 AA準拠** を維持：
- ✅ label要素
- ✅ キーボード操作
- ✅ セマンティックHTML
- ✅ 色のコントラスト

### 6. ビルドとテスト

変更後は必ず以下を実行：

```bash
npm run build          # ビルド
npm test               # ユニットテスト
npm run lint           # Lintチェック
```

**品質基準**:
- ✅ ビルド成功（0 errors）
- ✅ テスト合格（4218 passed）
- ✅ Lint合格（0 errors, 0 warnings）

---

## トラブルシューティング

### 問題1: Tailwind CSSスタイルが適用されない

**原因**: ビルドが完了していない、またはHTMLにリンクが欠けている

**解決策**:
```bash
npm run build
```

HTMLファイルに以下が含まれているか確認：
```html
<link rel="stylesheet" href="styles/tailwind.css">
```

### 問題2: Alpine.jsが動作しない（popup.htmlの場合）

**原因**: Alpine.js CDNが読み込まれていない

**解決策**:
```html
<head>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.0/dist/cdn.min.js"></script>
</head>
```

### 問題3: Webpack警告「asset size limit」

**原因**: Bundle最適化後もvendor chunksが推奨サイズを超えている

**解決策**: Chrome拡張機能では**問題なし**（ローカルインストール）。警告を無視しても動作に影響はありません。

詳細: 最大chunkサイズは11MB→572KB（95%削減）に改善済み。

### 問題4: E2Eテストの既知の制限事項（v4.1.0実施結果）

**現状**: E2Eテスト13件すべてが失敗（合格率0%）

**v4.1.0で実施した対策**:
1. ✅ **extension-loader.ts完全リファクタリング** (261行):
   - リトライループ追加（デフォルト2回、1秒遅延）
   - 詳細なデバッグログ（タイムスタンプ付き）
   - Service Worker待機ロジック改善（polling方式）
   - timeout/retry/headless/debug設定オプション

2. ✅ **playwright.config.ts最適化**:
   - タイムアウト延長: 60秒 → 90秒
   - expectTimeout追加: 10秒
   - actionTimeout追加: 15秒
   - リトライ設定: ローカル1回、CI 2回

**根本的な原因**:

**Playwright + Chrome Extension Manifest V3統合の技術的制約**:

1. **Service Worker初期化検出の困難性**:
   - Manifest V3のService Workerは、Background Pageとは異なり`context.waitForEvent('page')`イベントを発火しない
   - chrome-extension:// ページの検出も不安定（テストでは5秒以内に検出されなかった）

2. **Extension Context初期化失敗**:
   - 全テストで `extensionContext` が `undefined` のまま進行
   - `loadExtension()` 関数がExtensionContextを正常に返せない
   - 原因: Extension IDが取得できない、またはPopup pageが開けない

3. **Playwright内部エラー**:
   - `Internal error: step id not found: fixture@33` が繰り返し発生
   - Playwright Test fixture自体の問題の可能性

**現在の対応策（ミティゲーション）**:

- ✅ **主要な品質保証手段**: ユニットテスト（4,218件合格、カバレッジ85.4%）
- ✅ **副次的保証**: 主要フローの手動テスト
- ⏳ **E2Eテスト**: 将来的な技術改善を待つ

**将来的な代替アプローチ（検討中）**:

- **短期（v4.2.0以降）**:
  - Puppeteerへの移行POC（Chrome DevTools Protocol直接利用、Extensionサポートが充実）
  - E2Eテストスコープ削減（13件 → 3-5件の重要フロー）

- **中期（v5.0.0以降）**:
  - Seleniumへの移行検討（Chrome Extension testing実績が豊富）
  - Playwright Manifest V3 Service Worker完全サポート待ち

**重要な注意事項**:

⚠️ E2Eテスト失敗は**実機能に影響なし**
- v4.0.0ではHTML/CSSのみ変更、TypeScriptロジック未変更
- すべてのユニットテスト（4,218件）が合格
- 手動テストで主要フローの動作確認済み

**詳細情報**:
- 実施結果詳細: `CHANGELOG.md` の "v4.1.0: E2E Test Infrastructure Improvements (Partial)" セクション
- 計画と実施経緯: `docs/UI_REDESIGN/UI-REDESIGN-REFACTORING-PLAN.md` の "v4.1.0実施結果" セクション

---

## 参考資料

### 公式ドキュメント

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Alpine.js Documentation](https://alpinejs.dev/start-here)
- [Webpack Documentation](https://webpack.js.org/concepts/)

### プロジェクト内ドキュメント

- **計画書**: `docs/UI_REDESIGN/UI-REDESIGN-REFACTORING-PLAN.md`
- **内部仕様**: `docs/UI_REDESIGN/UI-REDESIGN-INTERNAL-SPEC.md`
- **CHANGELOG**: `CHANGELOG.md` (Unreleasedセクション)
- **README**: `README.md` (主な機能セクション)

### サンプルコード

実際の実装例は以下のHTMLファイルを参照：
- `public/popup.html` - Alpine.js統合、レスポンシブデザイン
- `public/xpath-manager.html` - Control Bar、Edit Modal
- `public/system-settings.html` - タブUI、フォーム統一
- `public/storage-sync-manager.html` - 複雑なフォーム構造

---

## 更新履歴

- **2025-01-19**: 初版作成（Phase 2-3完了後）
- **2025-01-19**: Bundle最適化、E2Eテストインフラ改善を追加

---

**最終更新日**: 2025-01-19
**Version**: 4.0.0
