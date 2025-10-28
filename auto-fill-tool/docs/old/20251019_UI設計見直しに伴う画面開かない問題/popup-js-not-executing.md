# Popup.jsが実行されない問題のデバッグ

## 📊 現状

- ✅ popup.htmlは読み込まれる（画面は表示される）
- ✅ `<script src="popup.js"></script>` タグは存在する
- ✅ popup.jsファイルは存在する（20KB）
- ✅ popup.jsには`console.error`コードが含まれている（12箇所）
- ❌ しかし、コンソールに何も表示されない
- ❌ `window.Alpine` と `window.popupApp` が `undefined`

## 🔍 Networkタブの正確な確認手順

### 重要：Networkタブは「記録中」の状態でページを読み込む必要があります

1. **Popup画面を完全に閉じる**（×ボタンで閉じる）

2. **新しいPopup画面を開く**
   - 拡張機能アイコンをクリック

3. **Popup画面上で右クリック → 検証**

4. **Networkタブを開く**
   - この時点では何も表示されなくてOK

5. **Networkタブの左上にある「記録ボタン（●）」が赤くなっているか確認**
   - 赤 = 記録中（正常）
   - グレー = 停止中（クリックして赤にする）

6. **Popup画面を×ボタンで完全に閉じる**

7. **拡張機能アイコンを再度クリックしてPopup画面を開く**

8. **この瞬間、Networkタブにファイルのリストが表示されるはず**

### 確認してほしいファイル

Networkタブに以下のファイルが表示されるはずです：

#### 成功の場合（緑色または黒色）:
- `popup.html` - Status: 200
- `popup.js` - Status: 200
- `styles/tailwind.css` - Status: 200
- `styles/common.css` - Status: 200
- `vendors-*.js` (複数) - Status: 200

#### 失敗の場合（赤色）:
- どれかが赤色 - Status: 404 (Not Found) または 失敗

### スクリーンショットを撮ってください

以下のスクリーンショットを撮影してください：

1. **Networkタブ全体**
   - ファイルのリスト全体が見えるように
   - Status列が見えるように

2. **popup.jsの行をクリックした後の詳細**
   - Headers タブ
   - Response タブ

---

## 🔧 代替確認方法

もしNetworkタブがうまく動作しない場合、以下を試してください：

### 方法1: Sourcesタブで確認

1. Popup画面の検証ツールを開く
2. **Sources**タブを開く
3. 左側のファイルツリーで `chrome-extension://[拡張機能ID]/` を展開
4. `popup.js` が表示されているか確認
5. クリックして内容が表示されるか確認

### 方法2: Consoleでpopup.jsを手動実行

Popupのコンソールで以下を実行してください：

```javascript
// popup.jsを手動で読み込もうとする
fetch('popup.js')
  .then(response => {
    console.error('popup.js fetch status:', response.status, response.statusText);
    return response.text();
  })
  .then(text => {
    console.error('popup.js size:', text.length, 'bytes');
    console.error('popup.js first 200 chars:', text.substring(0, 200));
  })
  .catch(error => {
    console.error('popup.js fetch failed:', error);
  });
```

この結果を報告してください。

---

## 🐛 考えられる原因

### 1. popup.jsの読み込み失敗
- ファイルが存在しない（ビルドエラー）
- パスが間違っている
- 拡張機能のパッケージングエラー

### 2. Webpackチャンクの読み込み失敗
- vendorsチャンクが見つからない
- チャンクの依存関係エラー

### 3. Content Security Policy違反
- popup.jsが`'self'`ソースとして認識されていない
- manifest.jsonのCSP設定が厳しすぎる

### 4. 拡張機能の権限不足
- manifest.jsonで必要な権限が宣言されていない

---

## 📝 報告が必要な情報

以下の情報を教えてください：

1. **Networkタブのスクリーンショット**（最優先）
   - ファイルリスト全体
   - popup.jsのステータス（緑/赤）

2. **Sourcesタブでpopup.jsが見えるか？**
   - 見える場合：ファイルサイズは？
   - 見えない場合：どのファイルが見えるか？

3. **Consoleでfetchコマンドの実行結果**
   - 成功した場合：サイズと最初の200文字
   - 失敗した場合：エラーメッセージ

これらの情報があれば、確実に原因を特定できます。
