---
name: notion
displayName: Notion
description: Notionワークスペースとの統合を提供するパワー
version: 1.0.0
keywords: [notion, ノート, ドキュメント, データベース, wiki, ページ, 検索]
---

# Notion Power

Notionワークスペースとの統合を提供するカスタムパワーです。

## 概要

このパワーは以下の機能を提供します：

- Notionページの検索・取得
- ページの作成・更新
- データベースの操作
- コメントの管理
- チーム・ユーザー情報の取得

## 主な機能

### 検索機能
- `notion_search`: ワークスペース全体での検索
- ページ、データベース、ユーザーの検索が可能

### ページ操作
- `notion_fetch`: ページの取得
- `notion_update_page`: ページの更新
- `notion_create_comment`: コメントの追加

### データベース操作
- `notion_create_database`: **無効化済み** - データベースの作成は安全のため無効化されています
- `notion_update_database`: **無効化済み** - データベースの更新は安全のため無効化されています

### ユーザー・チーム管理
- `notion_get_users`: ユーザー一覧の取得
- `notion_get_teams`: チーム情報の取得
- `notion_get_self`: 自分のアカウント情報

## 使用方法

このパワーを使用するには、まず`activate`アクションでパワーを有効化してください：

```
kiroPowers action="activate" powerName="notion"
```

その後、`use`アクションで具体的な機能を実行できます：

``` 
kiroPowers action="use" powerName="notion" serverName="notion-mcp" toolName="notion_search" arguments={"query": "検索キーワード"}
```

## 設定

このパワーはNotionのMCPサーバーを使用します。認証情報は自動的に設定されます。

## 注意事項

- Notionワークスペースへのアクセス権限が必要です
- 一部の操作には管理者権限が必要な場合があります
- **データベース操作制限**: データベースの作成・更新機能は安全のため無効化されています
- 既存のデータベースの読み取りや検索は引き続き利用可能です