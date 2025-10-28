# Popup画面ボタンが反応しない問題のデバッグ

## 📊 現状
- ✅ Popup画面は表示される
- ❌ ボタンをクリックしても反応しない

## 🔍 デバッグ手順

### ステップ1: コンソールエラーの確認

1. Popup画面を開く
2. Popup画面上で**右クリック** → **検証**
3. **Console**タブを開く
4. **赤いエラーメッセージ**が表示されているか確認

#### 確認してほしいエラー例:
- `Uncaught TypeError: ...`
- `Uncaught ReferenceError: ...`
- `Alpine is not defined`
- `Cannot read property ... of undefined`

### ステップ2: Alpine.jsの読み込み確認

Popupのコンソールで以下のコマンドを実行してください：

```javascript
console.log('Alpine:', window.Alpine);
```

#### 期待される出力:
```javascript
Alpine: {version: "3.14.0", start: ƒ, ...}
```

#### もしundefinedの場合:
Alpine.jsが読み込まれていません。

### ステップ3: popupApp関数の確認

Popupのコンソールで以下のコマンドを実行してください：

```javascript
console.log('popupApp:', typeof window.popupApp);
```

#### 期待される出力:
```javascript
popupApp: "function"
```

#### もしundefinedの場合:
popup.jsが正しく実行されていません。

### ステップ4: DOM要素の確認

Popupのコンソールで以下のコマンドを実行してください：

```javascript
// ボタンが存在するか確認
console.log('Add button:', document.getElementById('addWebsiteBtn'));
console.log('XPath button:', document.getElementById('xpathManagerBtn'));
console.log('Settings button:', document.getElementById('settingsBtn'));
```

#### 期待される出力:
```javascript
Add button: <button id="addWebsiteBtn">...</button>
XPath button: <button id="xpathManagerBtn">...</button>
Settings button: <button id="settingsBtn">...</button>
```

### ステップ5: イベントリスナーの確認

Popupのコンソールで以下を実行してください：

```javascript
// イベントリスナーがアタッチされているか確認
getEventListeners(document.getElementById('addWebsiteBtn'));
```

#### 期待される出力:
```javascript
{click: Array(1)}  // clickイベントが登録されている
```

#### もし空のオブジェクト `{}` の場合:
イベントリスナーがアタッチされていません。

## 📝 報告してほしい情報

以下の情報を教えてください：

1. **Consoleタブのエラーメッセージ全文**（赤い文字のもの）
2. **Alpine.jsの確認結果**（ステップ2の出力）
3. **popupAppの確認結果**（ステップ3の出力）
4. **DOM要素の確認結果**（ステップ4の出力）
5. **イベントリスナーの確認結果**（ステップ5の出力）

これらの情報があれば、原因を特定できます。
