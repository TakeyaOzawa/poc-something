# コード品質・フォーマッティング方針

## 概要

このドキュメントでは、プロジェクトにおけるコード品質の担保とコードフォーマッティングのベストプラクティスをまとめます。

## 目的

- コードの一貫性を保つ
- バグやエラーを早期に発見する
- レビューの負担を軽減する
- 自動化によるヒューマンエラーの削減

---

## 1. 静的解析ツール（ESLint）

### 1.1 概要

ESLint は JavaScript/TypeScript の静的解析ツールで、コードの問題を検出します。

### 1.2 設定方針

#### 基本設定
- **TypeScript サポート**: `@typescript-eslint/parser` と `@typescript-eslint/eslint-plugin` を使用
- **推奨ルール**: `eslint:recommended` と `plugin:@typescript-eslint/recommended` をベースにする
- **カスタムルール**: プロジェクト固有のニーズに応じてルールを追加・調整

#### 推奨プラグイン
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "plugins": [
    "@typescript-eslint"
  ]
}
```

### 1.3 実行タイミング
- **開発中**: エディタでリアルタイムにチェック
- **コミット前**: Git hooks で自動実行
- **CI/CD**: PR/push 時に自動実行

### 1.4 npm スクリプト
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  }
}
```

---

## 2. コードフォーマッター（Prettier）

### 2.1 概要

Prettier はコードフォーマッターで、コードスタイルを自動的に統一します。

### 2.2 ESLint との違い

| ツール | 目的 | 役割 |
|--------|------|------|
| **ESLint** | コード品質 | バグやアンチパターンの検出 |
| **Prettier** | コードスタイル | インデント、クォート、改行などの整形 |

### 2.3 設定方針

#### 推奨設定（.prettierrc.json）
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### 除外設定（.prettierignore）
```
node_modules
dist
build
coverage
*.min.js
```

### 2.4 ESLint との統合

ESLint と Prettier の競合を避けるため、以下のパッケージを使用します：

```bash
npm install --save-dev eslint-config-prettier eslint-plugin-prettier
```

**ESLint 設定の更新**
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"  // 最後に追加
  ]
}
```

`eslint-config-prettier` は Prettier と競合する ESLint ルールを無効化します。

### 2.5 npm スクリプト
```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
  }
}
```

---

## 3. Git Hooks による自動化

### 3.1 概要

Git hooks を使用して、コミット前に自動的に lint と format を実行します。

### 3.2 推奨ツール

#### Husky
Git hooks を簡単に管理できるツール

#### lint-staged
ステージングされたファイルのみを対象に lint/format を実行

### 3.3 設定方針

#### インストール
```bash
npm install --save-dev husky lint-staged
```

#### Husky の初期化
```bash
npx husky init
```

#### package.json の設定
```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

#### pre-commit hook の設定（.husky/pre-commit）
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

#### commit-msg hook の設定（.husky/commit-msg）（オプション）
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# コミットメッセージの形式チェック（Conventional Commits など）
npx --no-install commitlint --edit "$1"
```

### 3.4 動作フロー

```
git add file.ts
       ↓
git commit -m "message"
       ↓
pre-commit hook 発動
       ↓
lint-staged 実行
       ↓
ESLint --fix
       ↓
Prettier --write
       ↓
修正があれば自動的に再ステージング
       ↓
commit-msg hook 発動
       ↓
コミットメッセージのチェック
       ↓
コミット完了
```

---

## 4. TypeScript 型チェック

### 4.1 概要

TypeScript の型チェックは ESLint とは別に実行します。

### 4.2 設定方針

#### tsconfig.json の推奨設定
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

#### npm スクリプト
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  }
}
```

### 4.3 pre-commit での実行

型チェックは時間がかかるため、変更されたファイルのみをチェックするか、CI/CD で実行することを推奨します。

**完全な型チェックが必要な場合**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "bash -c 'npm run type-check'"
    ]
  }
}
```

---

## 5. エディタ統合

### 5.1 VS Code 設定

#### 推奨拡張機能
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **EditorConfig** (`editorconfig.editorconfig`)

#### .vscode/settings.json
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

#### .vscode/extensions.json
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "editorconfig.editorconfig"
  ]
}
```

### 5.2 EditorConfig

異なるエディタ間でスタイルを統一するための設定

#### .editorconfig
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{ts,tsx,js,jsx,json}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

---

## 6. CI/CD での実行

### 6.1 概要

CI/CD パイプラインで自動的にチェックを実行することで、品質を担保します。

### 6.2 GitHub Actions の例

#### .github/workflows/lint.yml
```yaml
name: Lint and Format Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format:check

      - name: Run TypeScript type check
        run: npm run type-check

      - name: Run tests
        run: npm run test:coverage
```

### 6.3 実行タイミング

| タイミング | チェック内容 | 目的 |
|-----------|------------|------|
| **開発中** | エディタでリアルタイム | 即座にフィードバック |
| **コミット前** | Lint + Format（変更ファイルのみ） | コミット品質の保証 |
| **PR作成時** | 全チェック（Lint + Format + 型チェック + テスト） | マージ可能性の確認 |
| **マージ前** | 全チェック | 最終確認 |

---

## 7. ベストプラクティスまとめ

### 7.1 基本方針

1. **ESLint**: コード品質とバグの検出
2. **Prettier**: コードスタイルの統一
3. **Git Hooks**: コミット前の自動チェック・修正
4. **CI/CD**: PR/マージ時の最終チェック

### 7.2 推奨パッケージ一覧

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "typescript": "^5.4.0"
  }
}
```

### 7.3 npm スクリプト全体像

```json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "quality": "npm run lint && npm run format:check && npm run type-check",
    "quality:fix": "npm run lint:fix && npm run format"
  }
}
```

### 7.4 導入手順

1. **依存関係のインストール**
   ```bash
   npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged
   ```

2. **Prettier 設定ファイルの作成**
   - `.prettierrc.json`
   - `.prettierignore`

3. **ESLint 設定の更新**
   - `.eslintrc.js` に `plugin:prettier/recommended` を追加

4. **Git Hooks の設定**
   ```bash
   npx husky init
   ```
   - `package.json` に `lint-staged` の設定を追加
   - `.husky/pre-commit` を作成

5. **エディタ設定**
   - `.vscode/settings.json` と `.vscode/extensions.json` を作成

6. **CI/CD の設定**
   - GitHub Actions や他の CI ツールに lint・format チェックを追加

7. **既存コードの整形**
   ```bash
   npm run lint:fix
   npm run format
   ```

### 7.5 チームでの運用

1. **ドキュメントの共有**: このドキュメントをチームメンバーに共有
2. **拡張機能のインストール**: VS Code の推奨拡張機能をインストール
3. **初回セットアップ**: `npm install` 後に自動的に Husky がセットアップされる
4. **定期的な見直し**: ルールやプラクティスを定期的に見直し・更新

### 7.6 トラブルシューティング

#### Git Hooks が動作しない
```bash
# Husky の再インストール
rm -rf .husky
npx husky init
npx husky add .husky/pre-commit "npx lint-staged"
```

#### ESLint と Prettier の競合
- `eslint-config-prettier` が正しくインストールされているか確認
- ESLint 設定で `plugin:prettier/recommended` が最後に記載されているか確認

#### 型チェックが遅い
- `pre-commit` では型チェックをスキップし、CI/CD でのみ実行することを検討
- または `tsc --incremental` を使用してキャッシュを有効化

---

## 8. 参考資料

- [ESLint 公式ドキュメント](https://eslint.org/docs/latest/)
- [Prettier 公式ドキュメント](https://prettier.io/docs/en/)
- [Husky 公式ドキュメント](https://typicode.github.io/husky/)
- [lint-staged GitHub](https://github.com/okonet/lint-staged)
- [TypeScript 公式ドキュメント](https://www.typescriptlang.org/docs/)
