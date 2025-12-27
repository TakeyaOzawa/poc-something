---
name: github
displayName: GitHub Power
description: GitHubリポジトリとの統合を提供するカスタムパワー
version: 1.0.0
keywords:
  - github
  - git
  - repository
  - pull request
  - issue
  - version control
mcpServers:
  - github-mcp
---

# GitHub Power

GitHubリポジトリとの統合を提供するカスタムパワーです。

## 概要

このパワーは以下の機能を提供します：

- GitHubリポジトリの操作
- プルリクエストの作成・管理
- イシューの作成・更新
- ファイルの作成・更新
- ブランチの作成・管理
- コミット履歴の取得

## 主な機能

### リポジトリ操作
- `mcp_github_search_repositories`: リポジトリの検索
- `mcp_github_create_repository`: 新しいリポジトリの作成
- `mcp_github_fork_repository`: リポジトリのフォーク

### ファイル操作
- `mcp_github_get_file_contents`: ファイル内容の取得
- `mcp_github_create_or_update_file`: ファイルの作成・更新
- `mcp_github_push_files`: 複数ファイルの一括プッシュ

### プルリクエスト管理
- `mcp_github_create_pull_request`: プルリクエストの作成
- `mcp_github_list_pull_requests`: プルリクエスト一覧の取得
- `mcp_github_get_pull_request`: プルリクエストの詳細取得
- `mcp_github_merge_pull_request`: プルリクエストのマージ

### イシュー管理
- `mcp_github_create_issue`: イシューの作成
- `mcp_github_list_issues`: イシュー一覧の取得
- `mcp_github_update_issue`: イシューの更新

### ブランチ操作
- `mcp_github_create_branch`: ブランチの作成
- `mcp_github_list_commits`: コミット履歴の取得

## 設定

このパワーを使用するには、GitHub Personal Access Tokenが必要です。

### 環境変数の設定

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"
```

または、MCPサーバー設定で直接指定してください。

## 使用方法

このパワーを使用するには、まず`activate`アクションでパワーを有効化してください：

```
kiroPowers action="activate" powerName="github"
```

その後、`use`アクションで具体的な機能を実行できます：

```
kiroPowers action="use" powerName="github" serverName="github-mcp" toolName="mcp_github_search_repositories" arguments={"query": "検索キーワード"}
```

## 注意事項

- GitHub Personal Access Tokenには適切な権限が必要です
- プライベートリポジトリにアクセスする場合は、repo権限が必要です
- レート制限にご注意ください