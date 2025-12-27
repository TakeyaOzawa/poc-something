# GitHub Power - はじめに

## 基本的な使い方

### 1. パワーの有効化

```
kiroPowers action="activate" powerName="github"
```

### 2. リポジトリの検索

```
kiroPowers action="use" powerName="github" serverName="github-mcp" toolName="mcp_github_search_repositories" arguments={"query": "リポジトリ名"}
```

### 3. プルリクエストの作成

```
kiroPowers action="use" powerName="github" serverName="github-mcp" toolName="mcp_github_create_pull_request" arguments={"owner": "ユーザー名", "repo": "リポジトリ名", "title": "PR タイトル", "head": "feature-branch", "base": "main", "body": "PR の説明"}
```

## よく使用するワークフロー

### コードレビュー用PR作成

1. **ブランチ作成**: 新しい機能ブランチを作成
2. **ファイル更新**: 変更をプッシュ
3. **PR作成**: レビュー用のプルリクエストを作成

### イシュー管理

1. **イシュー作成**: バグ報告や機能要望を作成
2. **ラベル付け**: 適切なラベルを設定
3. **アサイン**: 担当者を割り当て

## 便利なTips

- プルリクエスト作成時は詳細な説明を記載
- イシューには再現手順を明記
- ブランチ名は機能を表す分かりやすい名前に