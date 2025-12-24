---
inclusion: always
---

# 品質基準とワークフロー

## 📋 開発完了時の必須プロセス

すべての開発タスク（機能追加、バグ修正、リファクタリング等）が完了した際は、以下のプロセスを**必ず順番通りに実行**してください。

### ステップ実行順序

1. **カバレッジ測定** → 2. **テストケース作成・充実** → 3. **失敗テストの修正** → 4. **Lint修正** → 5. **Lintエラー・警告の完全解消** → 6. **ビルド実行**

#### ステップ1: カバレッジ測定

```bash
npm run test:coverage
```

**確認項目**:
- 修正したファイルのカバレッジが90%以上
- 全体カバレッジ: Statements 96%以上、Branches 89%以上、Functions 96%以上、Lines 96%以上

#### ステップ2: テストケース作成・充実

カバレッジが90%未満の場合、以下のテストケースを作成：

1. **正常系テスト**: 期待される入力で正しい出力が得られること
2. **異常系テスト**: 不正な入力でエラーが発生すること、エラーメッセージが適切であること
3. **境界値テスト**: 空配列、null、undefined、0、負の数など
4. **分岐網羅**: if/else、switch/caseのすべての分岐、三項演算子の両方の結果

**テストファイルの配置**:
```
src/
├── domain/entities/MyEntity.ts
│   └── __tests__/MyEntity.test.ts
├── application/usecases/MyUseCase.ts
│   └── __tests__/MyUseCase.test.ts
```

**モックの使用例**:
```typescript
// 外部依存をモック
jest.mock('@infrastructure/repositories/MyRepository');

describe('MyUseCase', () => {
  let useCase: MyUseCase;
  let mockRepository: jest.Mocked<MyRepository>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    useCase = new MyUseCase(mockRepository);
  });

  it('should handle successful case', async () => {
    mockRepository.load.mockResolvedValue({ data: 'test' });
    const result = await useCase.execute();
    expect(result).toEqual({ data: 'test' });
  });
});
```

#### ステップ3: 失敗テストの修正

```bash
npm test
```

**成功基準**: 0 failed、意図的なskipのみ許容

**失敗時の対応**:
- テストコードのバグ → テストコードを修正
- 実装コードのバグ → 実装コードを修正
- 仕様変更 → 新しい仕様に合わせてテストを更新

#### ステップ4: Lint自動修正

```bash
npm run lint:fix && npm run format
```

#### ステップ5: Lintエラー・警告の完全解消

```bash
npm run lint
```

**成功基準**: 0 errors, 0 warnings

**eslint-disable使用時は詳細な理由を記述**:
```typescript
// eslint-disable-next-line complexity -- 複数の同期方向に対する結果メッセージフォーマット処理のため分岐が必要。リファクタリングすると可読性が低下する。
function complexFunction() {
  // ...
}
```

#### ステップ6: ビルド実行

```bash
npm run build
```

**成功基準**: ビルド正常終了、エラー・警告0件

### 完了チェックリスト

- ✅ `npm run test:coverage` → **修正範囲が90%以上**
- ✅ `npm test` → **0 failed, 意図的なskipのみ**
- ✅ `npm run lint` → **0 errors, 0 warnings**
- ✅ `npm run build` → **成功、0 errors**

### 統合検証コマンド

```bash
npm run hooks:quality-gate  # 完全品質チェック（カバレッジ + テスト + Lint + 型チェック + ビルド）
npm run hooks:coverage      # カバレッジチェック & テスト強化
```

## 🔗 Agent Hooks連携

### 自動化されたワークフロー

以下のAgent Hooksが品質保証プロセスを自動化します：

#### 📊 カバレッジ強制実行Hook
- **トリガー**: 手動実行ボタン「📊 カバレッジチェック & テスト強化」
- **機能**: カバレッジ測定 → 90%未満の場合はテスト追加ガイド
- **自動実行**: `npm run test:coverage`

#### ✅ 品質ゲート完全チェックHook  
- **トリガー**: 手動実行ボタン「✅ 品質ゲート実行」
- **機能**: 6ステップ品質保証プロセスの完全自動実行
- **実行順序**: カバレッジ測定 → テスト実行 → Lint修正 → Lint確認 → ビルド

#### 🔄 ファイル保存時自動チェックHook
- **トリガー**: TypeScriptファイル保存時（`**/*.ts`、テストファイル除く）
- **機能**: 関連テスト実行 + Lintチェック
- **自動実行**: 保存したファイルに関連するテストのみ実行

#### 🚨 エラーハンドリング強化Hook
- **トリガー**: 手動実行ボタン「🚨 エラーハンドリング強化」  
- **機能**: エラーコード管理 + StandardError使用ガイド
- **自動実行**: `npm run error:list`

#### 🌍 多言語リソース更新Hook
- **トリガー**: 手動実行ボタン「🌍 多言語リソース更新」
- **機能**: i18nメッセージキーの追加・更新ガイド
- **対象**: `public/_locales/en/messages.json`, `public/_locales/ja/messages.json`

### Hook使用方法

1. **Kiroパネル**: Agent Hooks セクションからボタンをクリック
2. **コマンドパレット**: `Ctrl+Shift+P` → "Kiro Hook" で検索
3. **自動トリガー**: ファイル保存、メッセージ送信、実行完了時に自動実行

## 🔄 Gitワークフロー統合

### コミット前品質チェックHooks

#### 🔍 コミット前レビューHook
- **トリガー**: 手動実行ボタン「🔍 コミット前レビュー実行」
- **機能**: 
  - 大量ファイル変更の検出と警告
  - デバッグコード残存チェック
  - 機密情報混入チェック
  - 不要ファイル追加チェック
  - 空白変更問題の検出
- **検出項目**:
  ```bash
  # デバッグコード検出
  console.(log|debug|info|warn|error)
  debugger;
  alert(|confirm(
  
  # 機密情報検出
  api[_-]?key|password|secret|token|credential
  
  # 不要ファイル検出
  .DS_Store|.log|.tmp|node_modules/|dist/|coverage/
  ```

#### 📝 コミット品質チェックHook
- **トリガー**: 手動実行ボタン「📝 コミット品質チェック」
- **機能**:
  - アーキテクチャ準拠確認（`npm run lint:architecture`）
  - 変更ファイルのテスト実行
  - Lintチェック（変更ファイルのみ）
  - 型チェック（`npm run type-check`）
  - 循環依存チェック（`npm run analyze:circular`）

### 推奨コミットワークフロー

```bash
# 1. 変更をステージング
git add .

# 2. Kiroでコミット前レビュー実行
# → 🔍 コミット前レビュー実行 ボタンをクリック

# 3. Kiroでコミット品質チェック実行  
# → 📝 コミット品質チェック ボタンをクリック

# 4. 問題がなければコミット実行
git commit -m "feat(domain): 新機能を追加"

# 5. プッシュ前に最終確認
git push origin feature/new-feature
```

### コミットメッセージ規約（再掲）

```
<type>(<scope>): <subject>

<body>

<footer>
```

**良いコミットメッセージ例**:
```
feat(user-registration): ユーザー登録機能を実装

- Domain層にUserエンティティを追加
- RegisterUserUseCaseを実装  
- バリデーションロジックを追加

Tested: UserEntity.test.ts で 15 テストケース追加
Coverage: 95.2% → 96.1% に向上

Closes #123
```

## 🎯 品質目標

### コード品質メトリクス

| メトリクス | 目標値 | 測定方法 |
|-----------|--------|----------|
| テストカバレッジ | 90%以上 | `npm run test:coverage` |
| 複雑度 | 10以下 | ESLint complexity rule |
| 関数の長さ | 50行以下 | ESLint max-lines-per-function |
| ネストの深さ | 4レベル以下 | ESLint max-depth |
| パラメータ数 | 4個以下 | ESLint max-params |
| 重複コード | 5%以下 | 手動レビュー |
| セキュリティ脆弱性 | 0件 | `npm audit` |

### 品質チェックコマンド

```bash
# 全体的な品質チェック
npm run hooks:quality-gate

# テストカバレッジ確認
npm run test:coverage

# セキュリティ監査
npm run security:audit

# 複雑度チェック
npm run complexity

# 循環依存チェック
npm run analyze:circular
```

## 📊 コードレビュー基準

### レビュー観点

#### 1. アーキテクチャ準拠
- [ ] レイヤー分離が適切
- [ ] 依存関係の方向が正しい
- [ ] 適切なパターンを使用

#### 2. コード品質
- [ ] 可読性が高い
- [ ] 適切な命名
- [ ] 複雑度が基準内

#### 3. テスト
- [ ] テストが追加されている
- [ ] カバレッジが十分
- [ ] テストケースが適切

#### 4. セキュリティ
- [ ] 入力検証が実装
- [ ] 機密情報の保護
- [ ] 権限チェック

### レビュー手順

1. **自動チェック確認**
   ```bash
   npm run hooks:commit-check
   npm run test:coverage
   npm run security:audit
   ```

2. **手動レビュー**
   - アーキテクチャ準拠
   - ビジネスロジックの妥当性
   - エラーハンドリング

3. **承認基準**
   - 2名以上の承認
   - 全自動テスト通過
   - 品質基準クリア

## 🚨 品質違反の対処

### 警告レベル
- テストカバレッジ70-80%
- 複雑度8-10
- 軽微なセキュリティ問題

**対処**: 次回のスプリントで改善

### エラーレベル
- テストカバレッジ70%未満
- 複雑度10超過
- セキュリティ脆弱性

**対処**: 即座に修正が必要

## 🔄 継続的改善

### 定期的な品質レビュー

#### 週次チェック項目
- テストカバレッジの推移
- 複雑度の変化
- バグ発生率
- セキュリティ脆弱性の状況

#### 月次レビュー項目
- 技術的負債の棚卸し
- パフォーマンスメトリクスの確認
- チーム生産性の評価
- 品質基準の見直し

#### 四半期改善計画
- 品質向上施策の立案
- ツール・プロセスの改善
- チーム教育・知識共有

## 📝 コードレビューテンプレート

```markdown
## アーキテクチャ
- [ ] レイヤー分離が適切
- [ ] 依存関係の方向が正しい
- [ ] 単一責任原則に従っている

## 品質
- [ ] テストが追加されている
- [ ] 複雑度が基準内
- [ ] 型安全性が確保されている

## セキュリティ
- [ ] 入力検証が実装されている
- [ ] 機密情報の漏洩がない
- [ ] 適切な権限チェック

## パフォーマンス
- [ ] 不要な処理がない
- [ ] メモリリークの可能性がない
- [ ] 適切な非同期処理
```

## 🎓 チーム内知識共有

### 定期活動
- **技術勉強会**: 月1回
- **アーキテクチャレビュー**: 四半期1回
- **ベストプラクティス共有**: 随時
- **コードレビュー振り返り**: 月1回

### ドキュメント管理
- **ADR (Architecture Decision Records)**: 重要な設計決定を記録
- **技術仕様書**: 機能ごとに作成・更新
- **トラブルシューティングガイド**: 問題解決手順を蓄積

## 🔧 開発環境品質

### 必須ツール設定
- **VS Code拡張機能**: TypeScript Hero, ESLint, Prettier, Jest Runner, GitLens
- **Git Hooks**: pre-commit（lint + format）, pre-push（type-check + complexity）
- **エディタ設定**: 統一されたフォーマット設定

### 開発効率化
- **ホットリロード**: 開発時の自動リビルド
- **型チェック**: リアルタイム型エラー表示
- **テストウォッチ**: ファイル変更時の自動テスト実行
