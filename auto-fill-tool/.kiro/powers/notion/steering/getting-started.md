# Notion Power - はじめに

## 基本的な使い方

### 1. パワーの有効化

```
kiroPowers action="activate" powerName="notion"
```

### 2. 検索の実行

ワークスペース全体を検索：
```
kiroPowers action="use" powerName="notion" serverName="notion-mcp" toolName="mcp_notion_notion_search" arguments={"query": "検索キーワード"}
```

### 3. ページの取得

特定のページを取得：
```
kiroPowers action="use" powerName="notion" serverName="notion-mcp" toolName="mcp_notion_notion_fetch" arguments={"id": "ページID"}
```

## よく使用するワークフロー

### ドキュメント検索から編集まで

1. **検索**: 関連するページを見つける
2. **取得**: ページの詳細を確認
3. **更新**: 必要に応じてページを更新

### データベース操作

1. **検索**: データベースを特定
2. **取得**: スキーマを確認
3. **更新**: 新しいエントリを追加

## 便利なTips

- 検索時は日本語キーワードも効果的
- ページIDはURLから取得可能
- データベース操作時はスキーマを事前確認