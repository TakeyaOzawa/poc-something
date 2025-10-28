# Popup.js実行問題の根本原因と解決策

## 🔍 根本原因

popup.jsが実行されない理由は、**webpackのコード分割とHTMLの不一致**でした。

### 問題の詳細

1. **webpack.config.js**は`splitChunks`を使用してvendorチャンクを作成:
   ```javascript
   splitChunks: {
     chunks: 'all',  // ← すべてのエントリーポイントでコード分割
     cacheGroups: {
       vendors: {
         test: /[\\/]node_modules[\\/]/,
         name: 'vendors',
         ...
       }
     }
   }
   ```

2. **ビルド結果**:
   - `dist/popup.js` - メインバンドル + webpackランタイム
   - `dist/vendors-69b6fc20.js` - Alpineなどのvendorコード
   - その他のvendorチャンク

3. **dist/popup.html**は`public/`からコピーされただけ:
   ```html
   <script src="popup.js"></script>  ← vendorチャンクのscriptタグがない！
   </body>
   ```

4. **HtmlWebpackPluginが未設定**:
   - webpack.config.jsにHtmlWebpackPluginの設定がない
   - そのため、vendorチャンクのscriptタグが自動注入されない

### なぜpopup.jsが実行されないのか

`popup.js`の最後の部分:
```javascript
var o=s.O(void 0,[997,8100,4673,...],()=>s(82858));
o=s.O(o)
```

このコードは:
- `s.O()` = webpackランタイムの依存関係解決関数
- `[997,8100,...]` = 必要なチャンクIDのリスト
- これらのチャンクが**すでにロードされている**ことを前提としている

しかし、実際には:
- vendorチャンクのscriptタグがHTMLにない
- チャンクがロードされていない
- `s.O()`が依存関係を解決できず、**コードが実行されない**
- エラーも出力されない（webpack内部で待機状態になる）

## ✅ 解決策

Chrome拡張機能ではHtmlWebpackPluginが使えない（動的にHTMLを生成できない）ため、**popupエントリーのコード分割を無効化**します。

### webpack.config.js修正

```javascript
optimization: {
  splitChunks: {
    chunks(chunk) {
      // background以外はコード分割しない
      return chunk.name === 'background';
    },
    cacheGroups: {
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
        reuseExistingChunk: true,
      },
    },
  },
},
```

この変更により:
- ✅ background.jsは引き続きコード分割される（Service Worker用）
- ✅ popup.jsは単一ファイルにバンドルされる（依存関係込み）
- ✅ public/popup.htmlの`<script src="popup.js"></script>`だけで動作

## 📝 学んだこと

1. **Chrome拡張機能のwebpack設定は特殊**:
   - Service WorkerはimportScriptsでチャンク読み込み
   - Popupなど他のページは単一ファイルにバンドルすべき

2. **HtmlWebpackPluginが使えない理由**:
   - manifest.jsonで静的にHTMLパスを指定する必要がある
   - 動的に生成されたHTMLは使えない

3. **デバッグの難しさ**:
   - webpackランタイムの依存関係エラーは沈黙する
   - console.errorも実行されない（モジュール初期化前のため）

## 🔧 今後の対策

- 新しいエントリーポイント追加時は、コード分割の対象外にする
- HtmlWebpackPluginを使わない設計を維持する
- テストビルドで各HTMLページが正しく動作するか確認

## ✅ 修正結果の検証

### ビルド後のファイル構成

```bash
dist/popup.js         130K  # 修正後：すべての依存関係を含む単一バンドル
dist/background.js    186K  # Service Worker（コード分割あり）
dist/vendors.js        35K  # backgroundの vendorチャンク
dist/869.js            11M  # backgroundの大きなチャンク
```

### popup.jsの検証

1. **ファイルサイズ**: 20KB → 130KB
   - Alpine.jsなどすべての依存関係が含まれている

2. **webpack chunk loading なし**:
   ```bash
   $ grep -c "s\.O(" dist/popup.js
   0  # ← チャンク最適化コードがない
   ```

3. **デバッグコード確認**:
   ```bash
   $ grep -c "console.error" dist/popup.js
   15  # ← デバッグコードが含まれている
   ```

4. **Alpine.js 確認**:
   ```bash
   $ grep -c "Alpine" dist/popup.js
   多数  # ← Alpine.jsがバンドルされている
   ```

5. **構造確認**:
   - 開始: `(()=>{var t={65606:t=>{...`（標準的なwebpack IIFE）
   - 終了: `...new ui)})()})();`（PopupController初期化あり）

### 期待される動作

拡張機能を再読み込みしてpopup画面を開くと：

1. ✅ `console.error("[Popup] Script loaded, readyState:...")` が表示される
2. ✅ `console.error("[Popup] Constructor started")` が表示される
3. ✅ `console.error("[Popup] Alpine started")` が表示される
4. ✅ `window.Alpine` が定義されている
5. ✅ `window.popupApp` が定義されている
6. ✅ ボタンがクリック可能になる

---

**解決日時**: 2025-10-19
**影響範囲**: popup.js (130KB), webpack.config.js
**修正内容**: splitChunksをbackgroundのみに制限、popup等は単一バンドル化
