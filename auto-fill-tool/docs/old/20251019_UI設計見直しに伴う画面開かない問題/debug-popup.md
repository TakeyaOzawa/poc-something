# Popup画面のデバッグ手順

## 1. Chromeデベロッパーツールでエラー確認

### popup画面のコンソール確認
1. 拡張機能アイコンをクリックしてpopup画面を開く
2. popup画面上で**右クリック** → **検証**
3. **Console**タブを開く
4. **赤いエラーメッセージ**が表示されているか確認

### Service Worker（background.js）のコンソール確認  
1. `chrome://extensions/`を開く
2. 「Auto Fill Tool」の**Service Workerのリンク**をクリック
3. **Console**タブでエラーを確認

---

## 2. 確認してほしいこと

以下の情報を教えてください：

### A. popup画面のConsoleに表示されているエラー
```
例：
Uncaught TypeError: Cannot read property 'xxx' of undefined
  at popup.js:123
```

### B. Service WorkerのConsoleに表示されているログ/エラー
```
例：
[Background] Popup connected
または
Error: ...
```

### C. Network タブでリソースの読み込み失敗
1. popup画面の検証ツール → **Network**タブ
2. **Failed（赤色）**のリソースがあるか確認
   - popup.js
   - vendor-*.js（複数の分割ファイル）
   - styles/*.css

---

## 3. 簡易デバッグ

popup画面のConsoleで以下を実行してみてください：

```javascript
// Alpine.jsが読み込まれているか確認
console.log('Alpine:', window.Alpine);

// popupApp関数が定義されているか確認
console.log('popupApp:', window.popupApp);

// popup.jsが実行されているか確認
console.log('popup.js loaded:', document.querySelector('script[src="popup.js"]'));
```

結果を教えてください。
