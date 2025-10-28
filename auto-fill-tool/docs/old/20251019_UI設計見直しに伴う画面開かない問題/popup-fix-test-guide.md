# Popup画面修正のテスト手順

## 📝 修正内容

popup.jsが実行されない問題を修正しました。

**原因**: webpackのコード分割により、popup.jsがvendorチャンク（別ファイル）を必要としていましたが、HTMLにそのscriptタグがなく、実行が開始されませんでした。

**修正**: popup.jsを**単一ファイル**にバンドルするようにwebpack設定を変更しました。

## ✅ テスト手順

### 1. 拡張機能の再読み込み

Chrome拡張機能の管理画面で「🔄更新」ボタンをクリックしてください。

### 2. Popup画面を開く

拡張機能アイコンをクリックしてPopup画面を開いてください。

### 3. DevToolsのConsoleを確認

Popup画面上で右クリック → 「検証」 → Consoleタブを開いてください。

### 期待される出力

以下のログが**順番に**表示されれば成功です：

```
[Popup] Script loaded, readyState: loading (または complete)
[Popup] Constructor started
[Popup] I18n applied
[Popup] Logger initialized
[Popup] Alpine assigned to window: true
[Popup] popupApp initialized: function
[Popup] Alpine started
[Popup] Constructor completed successfully
```

### 4. 動作確認

以下のコマンドをConsoleで実行してください：

```javascript
window.Alpine
// → {start: ƒ, stop: ƒ, ...} のようなオブジェクトが返る

window.popupApp
// → ƒ () のような関数が返る
```

### 5. ボタンの動作確認

Popup画面の各ボタン（「サイト追加」「XPath」「設定」など）をクリックして、正常に動作することを確認してください。

## 🐛 もし問題が続く場合

以下の情報を教えてください：

1. Consoleに表示されるエラーメッセージ（あれば）
2. 上記のログがどこまで表示されたか
3. `window.Alpine`と`window.popupApp`の実行結果

## 📊 技術詳細

修正前後の比較：

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| popup.jsサイズ | 20KB | 130KB |
| vendorチャンク | 必要（vendors-*.js） | 不要（すべてpopup.jsに含まれる） |
| 実行 | ❌ チャンク待機で停止 | ✅ 即座に実行 |

詳細な技術解説: `popup-js-execution-issue-resolved.md`
