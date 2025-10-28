# 拡張機能の動作確認手順

## ✅ 修正内容

### 問題の根本原因
webpack設定で`chunkLoading: 'import-scripts'`がすべてのエントリーポイントに適用されていたため:
- **Service Worker (background.js)**: `import-scripts`が必要 → ✅ 正常
- **Popup/Content Script**: `import-scripts`を使用できない → ❌ エラー

### 実施した修正
`webpack.config.js`の`entry`設定を変更し、背景スクリプト(Service Worker)のみに`chunkLoading: 'import-scripts'`を適用:

```javascript
entry: {
  background: {
    import: './src/presentation/background/index.ts',
    filename: 'background.js',
    chunkLoading: 'import-scripts', // Service Worker専用設定
  },
  popup: './src/presentation/popup/index.ts', // デフォルトのチャンクロード方式
  // ... 他のエントリーポイント
}
```

### 検証結果
- ✅ `dist/background.js`: `importScripts`を2箇所使用（正常）
- ✅ `dist/popup.js`: `importScripts`を0箇所使用（正常）
- ✅ ビルド成功: webpack 5.102.0 compiled with 2 warnings

---

## 🔧 拡張機能のテスト手順

### ステップ1: 拡張機能の再読み込み

1. Chrome を開く
2. `chrome://extensions/` に移動
3. 右上の**デベロッパーモード**をONにする
4. "Auto Fill Tool" の**更新ボタン(🔄)**をクリック

### ステップ2: 拡張機能の状態確認

**確認ポイント:**
- ✅ 拡張機能がONになっているか（青色のトグルスイッチ）
- ✅ エラーメッセージが表示されていないか

**もし拡張機能がOFFの場合:**
1. "Auto Fill Tool" の**詳細**をクリック
2. **エラー**セクションを確認
3. エラーメッセージをコピーして報告してください

### ステップ3: Service Workerの動作確認

1. `chrome://extensions/` で "Auto Fill Tool" の**Service worker**リンクをクリック
2. DevTools (Console タブ) が開く
3. **赤いエラーメッセージ**が表示されていないか確認

**期待される出力:**
```
[HH:MM:SS] [Background] Background script starting to initialize...
[HH:MM:SS] [Background] Loaded log level from settings: INFO
[HH:MM:SS] [Background] Auto Fill Tool background service initialized
```

**もしエラーが表示されている場合:**
- エラーメッセージ全文をコピーして報告してください

### ステップ4: Popup画面の動作確認

1. Chrome ツールバーの**拡張機能アイコン**をクリック
2. Popup画面が開く
3. Popup画面上で**右クリック** → **検証**
4. **Console**タブを開く

**期待される出力:**
```
[HH:MM:SS] [Popup] [INFO] Initializing popup
[HH:MM:SS] [Popup] [INFO] Popup log level set from settings
[HH:MM:SS] [Popup] [DEBUG] Applied gradient background
```

**確認ポイント:**
- ✅ `Refused to load the script ... CSP` エラーが**出ていない**こと
- ✅ `Uncaught ReferenceError: importScripts is not defined` エラーが**出ていない**こと
- ✅ ログが正常に出力されていること

---

## 🐛 トラブルシューティング

### 問題A: 拡張機能がOFFのまま

**原因:** Service Worker (background.js) の初期化エラー

**対処法:**
1. Service Worker のコンソールを確認（ステップ3）
2. エラーメッセージを確認
3. 以下のコマンドで詳細ログを確認:
   ```bash
   cat dist/background.js | head -50
   ```

### 問題B: Popup画面が真っ白

**原因:** Alpine.js の初期化エラー

**対処法:**
1. Popup の Console を確認（ステップ4）
2. **Network** タブで以下のファイルが読み込まれているか確認:
   - `popup.js`
   - `vendors-*.js` (複数)
   - `styles/tailwind.css`

### 問題C: Alpine.js エラー

**原因:** Alpine.js CSP ビルドの問題

**確認コマンド:**
```bash
# popup.js 内で Alpine.js が正しくバンドルされているか確認
grep -o "Alpine" dist/popup.js | head -5
```

**期待される出力:** "Alpine" が複数回出現すること

---

## 📊 デバッグ用コマンド

Popup の Console で以下を実行して、Alpine.js の状態を確認:

```javascript
// Alpine.js が読み込まれているか確認
console.log('Alpine:', window.Alpine);

// popupApp 関数が定義されているか確認
console.log('popupApp:', window.popupApp);

// popup.js が実行されているか確認
console.log('popup.js loaded:', document.querySelector('script[src="popup.js"]'));
```

---

## 📝 報告が必要な情報

以下の情報を確認してください:

1. **拡張機能の状態**: ON or OFF?
2. **Service Worker のログ**: エラーメッセージの有無
3. **Popup のログ**: エラーメッセージの有無
4. **Network タブ**: 失敗したリソースの有無

これらの情報を基に、さらなる調査を行います。
