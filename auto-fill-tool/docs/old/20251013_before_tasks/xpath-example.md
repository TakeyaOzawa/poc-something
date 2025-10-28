# XPath設定の使用例

Auto-Fill ToolのXPath設定を使用すると、複数のアクションを順次実行し、Webサイトへの自動入力・操作を実現できます。

## 基本的な使い方

### 1. XPath設定の追加

XPath管理画面で以下の設定を追加：

| フィールド | 説明 | 例 |
|----------|------|-----|
| Value | 入力する値（変数使用可） | `{{username}}` |
| Action Type | アクション種別 | `input`, `click`, `change_url`, `check` |
| URL | 実行対象URL（正規表現可） | `https://example.com/login.*` |
| Execution Order | 実行順序 | `1`, `2`, `3`, ... |
| Selected Path Pattern | 使用するXPath | `smart`（推奨）, `short`, `absolute` |
| Path Short/Absolute/Smart | XPath式 | `//input[@id="username"]` |
| After Wait Seconds | 実行後待機時間 | `0.5`, `1.0`, ... |
| Execution Timeout Seconds | タイムアウト時間 | `30` |
| Retry Type | リトライ種別 | `0`（なし）, `10`（システム設定に従う） |

### 2. アクション種別

#### input - テキスト入力
```
Value: {{username}}
Action Type: input
XPath: //input[@id="username"]
```

#### click - クリック操作
```
Value: （不要）
Action Type: click
XPath: //button[@id="submit"]
```

#### change_url - URL変更
```
Value: https://example.com/next-page
Action Type: change_url
XPath: （不要）
```

#### check - 条件チェック
```
Value: 予約可能
Action Type: check
XPath: //div[@class="status"]
Dispatch Event Pattern: 10（等しい）, 20（等しくない）, 30（大なり）, 40（小なり）
```

### 3. 比較方法（checkアクション）

- **10 - 等しい**: 要素のテキストが値と完全一致（正規表現可）
- **20 - 等しくない**: 要素のテキストが値と異なる（正規表現可）
- **30 - 大なり**: 数値比較（数値変換可能な場合）または文字列比較
- **40 - 小なり**: 数値比較（数値変換可能な場合）または文字列比較

## 実際の使用例

### 例1: ログインフロー

```
# Step 1: ユーザー名入力
Execution Order: 1
Action Type: input
Value: {{username}}
URL: https://example.com/login
XPath: //input[@id="username"]
After Wait Seconds: 0.5

# Step 2: パスワード入力
Execution Order: 2
Action Type: input
Value: {{password}}
URL: https://example.com/login
XPath: //input[@id="password"]
After Wait Seconds: 0.5

# Step 3: ログインボタンクリック
Execution Order: 3
Action Type: click
URL: https://example.com/login
XPath: //button[@id="login-btn"]
After Wait Seconds: 2.0
```

### 例2: フォーム入力とチェック

```
# Step 1: 名前入力
Execution Order: 1
Action Type: input
Value: {{name}}
URL: https://example.com/form
XPath: //input[@name="name"]

# Step 2: メールアドレス入力
Execution Order: 2
Action Type: input
Value: {{email}}
URL: https://example.com/form
XPath: //input[@name="email"]

# Step 3: 送信ボタンクリック
Execution Order: 3
Action Type: click
URL: https://example.com/form
XPath: //button[@type="submit"]
After Wait Seconds: 2.0

# Step 4: 成功メッセージチェック
Execution Order: 4
Action Type: check
Value: 送信完了
URL: https://example.com/form
XPath: //div[@class="message"]
Dispatch Event Pattern: 10
```

### 例3: ページ遷移とデータ入力

```
# Step 1: 検索ページに移動
Execution Order: 1
Action Type: change_url
Value: https://example.com/search

# Step 2: 検索キーワード入力
Execution Order: 2
Action Type: input
Value: {{keyword}}
URL: https://example.com/search
XPath: //input[@id="search-input"]

# Step 3: 検索ボタンクリック
Execution Order: 3
Action Type: click
URL: https://example.com/search
XPath: //button[@id="search-btn"]
After Wait Seconds: 2.0

# Step 4: 検索結果の確認
Execution Order: 4
Action Type: check
Value: 検索結果
URL: https://example.com/search
XPath: //div[@id="results"]
Dispatch Event Pattern: 10
```

## 変数の使用

### 変数定義

XPath管理画面の「変数管理」で定義：

```
変数名: username
値: test_user

変数名: password
値: secret123

変数名: email
値: test@example.com
```

### 変数の使用方法

XPathのValueフィールドで `{{variable_name}}` 形式で使用：

```
Value: {{username}}
Value: {{password}}
Value: My name is {{username}} and my email is {{email}}
```

## リトライ機能

### Retry Type = 10 の場合

ステップが失敗した場合、システム設定に従って自動リトライします。

**システム設定（変数管理画面）:**
- リトライ待機時間: 最小30秒〜最大60秒（範囲内の乱数）
- リトライ回数: 3回（-1で無限回）

**動作:**
1. ステップ実行
2. 失敗した場合、30〜60秒のランダムな時間待機
3. 再試行（最大3回まで）
4. 3回失敗した場合はエラー

### Retry Type = 0 の場合

リトライせず、失敗したら即座にエラー。

## XPathパターン

### smart（推奨）
- ID、class、text等の属性を活用
- 人間が理解しやすい
- 構造変更に強い

```xpath
//div[@id="content"]/button[@class="submit"][contains(text(), "送信")]
```

### short
- IDを基準に短縮
- 比較的読みやすい

```xpath
//*[@id="content"]/button[1]
```

### absolute
- ルートからの完全パス
- 構造変更に弱い

```xpath
/html/body/div[1]/form[1]/button[1]
```

## Tips

### 待機時間の設定

- **ページ遷移後**: 2〜3秒
- **Ajax/動的コンテンツ**: 1〜2秒
- **通常の入力**: 0.5秒

### タイムアウトの設定

- **通常のアクション**: 30秒
- **遅いページ**: 60秒

### URL正規表現

```
https://example.com/login.*   # ログインページ全般
https://example.com/form\?.*  # クエリパラメータ付き
```

## トラブルシューティング

### 要素が見つからない場合

1. XPathが正しいか確認
2. ページが完全に読み込まれているか確認（待機時間を増やす）
3. smart → short → absolute の順で試す
4. Chrome DevToolsで要素を確認

### 実行が途中で止まる場合

1. Execution Orderが連番になっているか確認
2. URLパターンが正しいか確認
3. タイムアウト時間を増やす
4. Retry Typeを10に設定

## 参考

- [README.md](./README.md) - メインドキュメント
- [XPath Tutorial](https://www.w3schools.com/xml/xpath_intro.asp) - XPath基礎
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - 要素検証方法
