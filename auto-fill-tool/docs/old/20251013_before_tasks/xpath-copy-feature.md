# XPath取得機能

## 概要

Webページ上の任意の要素を右クリックし、コンテキストメニューから「XPathを取得」を選択することで、その要素のXPathを取得・保存できる機能です。

**実装状況**: ✅ v2.4.0で実装済み

## 機能

### 基本機能

1. Webページ上で任意の要素を右クリック
2. コンテキストメニューから「XPathをコピーする」を選択
3. 3つの形式のXPath（smart, short, absolute）がクリップボードにコピーされる
4. 通知が表示される

### 取得されるXPath形式

#### Smart形式（推奨）
- ID、class、text等の属性を活用
- 最も人間が理解しやすく、構造変更に強い

```xpath
//div[@id="content"]/button[@class="submit"][contains(text(), "送信")]
```

#### Short形式
- IDを基準に短縮
- 比較的読みやすい

```xpath
//*[@id="content"]/button[1]
```

#### Absolute形式
- ルートからの完全パス
- デバッグ用

```xpath
/html/body/div[1]/form[1]/button[1]
```

## 現在の代替方法

現在のバージョンでは、Chrome DevToolsを使用してXPathを取得できます：

### Chrome DevToolsを使用したXPath取得

1. **要素を検証**
   - 対象要素を右クリック
   - 「検証」を選択

2. **XPathをコピー**
   - Elements タブで要素が選択される
   - 選択された要素を右クリック
   - Copy → Copy XPath または Copy full XPath を選択

3. **XPathを調整**
   - コピーされたXPathは絶対パス形式
   - 必要に応じてsmart形式に書き換え

### Smart形式への書き換え例

**Chrome DevToolsからのXPath（absolute）:**
```xpath
/html/body/div[1]/div[2]/form[1]/input[1]
```

**Smart形式に書き換え:**
```xpath
//form[@id="login-form"]/input[@name="username"]
```

または

```xpath
//input[@id="username"]
```

## 技術実装

### 実装済みの機能

- **XPathContextMenuHandler**: コンテキストメニューの管理とXPath取得処理
- **XPathGenerationService**: 3つの形式のXPath自動生成
- **XPathDialog**: XPathを表示するダイアログUI（Shadow DOM使用）
- **自動保存機能**: 取得したXPathを直接XPath管理に保存

### 権限

```json
{
  "permissions": [
    "contextMenus",
    "scripting",
    "notifications",
    "activeTab"
  ]
}
```

### XPath生成アルゴリズム（実装済み）

`XPathGenerationService.ts`で実装されています:

```typescript
// Smart形式生成（実装済み）
generateSmartXPath(element: Element): string {
  // 1. IDがあれば優先
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  // 2. Name属性（フォーム要素）
  if ((element as HTMLInputElement).name) {
    return `//*[@name="${(element as HTMLInputElement).name}"]`;
  }

  // 3. Class名を使用
  if (element.className && typeof element.className === 'string') {
    const classList = element.className.trim().split(/\s+/);
    if (classList.length > 0 && classList[0]) {
      return `//${element.tagName.toLowerCase()}[@class="${classList[0]}"]`;
    }
  }

  // 4. テキストを使用（リンクやボタン）
  if (['A', 'BUTTON'].includes(element.tagName)) {
    const text = element.textContent?.trim();
    if (text && text.length < 50) {
      return `//${element.tagName.toLowerCase()}[contains(text(), "${text}")]`;
    }
  }

  // 5. 相対パス
  return this.generateRelativeXPath(element);
}
```

## 使用方法

### 方法1: XPathを表示してコピー

1. 対象要素を右クリック
2. コンテキストメニューから「XPathを表示」を選択
3. ダイアログに3つの形式のXPathが表示される
4. 各XPathの「コピー」ボタンをクリックしてクリップボードにコピー
5. XPath管理画面で手動で追加

### 方法2: 直接XPath管理に保存

1. 対象要素を右クリック
2. コンテキストメニューから「XPathを取得して保存」を選択
3. 自動的にXPath管理に保存される
4. 新規Webサイトの場合、自動的にWebサイト設定が作成される
5. start_urlが未設定の場合、現在のURLが自動設定される

## 参考資料

- [XPath Tutorial](https://www.w3schools.com/xml/xpath_intro.asp)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [XPath Cheatsheet](https://devhints.io/xpath)

## 実装ファイル

- `src/presentation/background/XPathContextMenuHandler.ts` (193行): コンテキストメニュー管理
- `src/domain/services/XPathGenerationService.ts`: XPath生成ロジック
- `src/presentation/content-script/XPathDialog.ts` (498行): XPath表示ダイアログ
- `src/presentation/background/handlers/GetXPathHandler.ts`: XPath取得ハンドラ
- `src/presentation/background/handlers/ShowXPathDialogHandler.ts`: ダイアログ表示ハンドラ

## フィードバック

この機能についてご意見・ご要望がありましたら、GitHub Issuesにてお知らせください。

---

**ステータス**: ✅ v2.4.0で実装済み
**最終更新**: 2025-10-08
