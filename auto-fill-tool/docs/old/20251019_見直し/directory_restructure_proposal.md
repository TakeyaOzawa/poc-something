# ディレクトリ構成見直し提案

## 現状分析

### 現在のテスト関連ディレクトリ構成

```
auto-fill-tool/
├── __mocks__/                     # グローバルモック (Jest)
│   ├── jsonpath-plus.js
│   └── webextension-polyfill.{js,ts}
├── e2e/                          # Playwright E2Eテスト
│   ├── helpers/
│   └── popup.spec.ts
├── src/
│   ├── __mocks__/                # srcローカルモック
│   │   └── webextension-polyfill.ts
│   └── __tests__/                # 統合/パフォーマンステスト
│       ├── e2e/                  # (混在：src内だがE2Eテスト)
│       ├── integration/          # 統合テスト
│       ├── performance/          # パフォーマンステスト
│       ├── fixtures/             # テストフィクスチャ
│       └── helpers/              # テストヘルパー
├── coverage/                     # カバレッジレポート (自動生成)
└── test-results/                 # Playwright結果 (自動生成)

# 各ドメイン層にも分散
src/domain/**/__tests__/          # ユニットテスト (約50+箇所)
src/infrastructure/**/__tests__/
src/usecases/**/__tests__/
src/presentation/**/__tests__/
```

### 問題点

1. **トップレベルが散在**: `__mocks__`, `e2e`, テスト結果ディレクトリが混在
2. **E2Eテストの重複**: トップレベル`e2e/`と`src/__tests__/e2e/`
3. **モックの重複**: トップレベル`__mocks__/`と`src/__mocks__/`
4. **テスト種別が不明瞭**: 統合/E2E/パフォーマンステストの配置が不統一

---

## 提案1: 【完全集中型】tests/ ディレクトリ統合 ⭐️推奨

### コンセプト
すべてのテスト関連ファイルを`tests/`配下に集約し、種類別に明確に分類

### 構成

```
auto-fill-tool/
├── src/                          # 実装コード (テストなし)
│   ├── domain/
│   ├── infrastructure/
│   ├── usecases/
│   └── presentation/
├── tests/                        # ✨ すべてのテスト集約
│   ├── unit/                     # ユニットテスト (実装構造を反映)
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── Website.test.ts
│   │   │   │   └── AutomationVariables.test.ts
│   │   │   ├── services/
│   │   │   └── ...
│   │   ├── infrastructure/
│   │   ├── usecases/
│   │   └── presentation/
│   ├── integration/              # 統合テスト
│   │   ├── MasterPasswordIntegration.test.ts
│   │   └── SecureRepositoryIntegration.test.ts
│   ├── e2e/                      # E2Eテスト (Playwright)
│   │   ├── popup.spec.ts
│   │   └── system-settings.spec.ts
│   ├── performance/              # パフォーマンステスト
│   │   └── PageTransitionPerformance.test.ts
│   ├── fixtures/                 # テストデータ
│   │   ├── TestDataFactories.ts
│   │   └── sampleData/
│   ├── helpers/                  # テストヘルパー
│   │   ├── MockLogger.ts
│   │   └── testHelpers.ts
│   └── mocks/                    # すべてのモック
│       ├── global/               # グローバルモック
│       │   ├── jsonpath-plus.js
│       │   └── webextension-polyfill.js
│       └── local/                # ローカルモック
│           └── webextension-polyfill.ts
├── .test-output/                 # ✨ テスト結果出力 (gitignore)
│   ├── coverage/
│   ├── playwright-report/
│   └── test-results/
├── docs/
├── public/
└── [設定ファイル群]
```

### メリット
✅ **明確な分離**: 実装(`src/`)とテスト(`tests/`)が完全分離
✅ **テスト種別が明瞭**: unit/integration/e2e/performanceで一目瞭然
✅ **モック管理の統一**: すべてのモックが`tests/mocks/`配下
✅ **メンテナンス性向上**: テストだけを探す場合、`tests/`を見ればOK
✅ **トップレベルがスッキリ**: テスト関連がすべて`tests/`配下に

### デメリット
⚠️ **移行コスト中**: 約50+の`__tests__/`ディレクトリの移動が必要
⚠️ **パスが長くなる**: `tests/unit/domain/entities/Website.test.ts`
⚠️ **IDEナビゲーション**: 実装とテストが離れるため、ファイル移動に手間

### 必要な変更
- `jest.config.js`: `roots: ['<rootDir>/tests']`
- `playwright.config.ts`: `testDir: './tests/e2e'`
- すべてのimportパスはそのまま（`@domain/`などエイリアス使用のため）

---

## 提案2: 【ハイブリッド型】Co-location + 集約テスト

### コンセプト
ユニットテストは実装と同じ場所に保持し、その他のテストを集約

### 構成

```
auto-fill-tool/
├── src/                          # 実装コード
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Website.ts
│   │   │   └── __tests__/       # ✨ ユニットテストはそのまま
│   │   │       └── Website.test.ts
│   ├── infrastructure/
│   ├── usecases/
│   └── presentation/
├── tests/                        # ✨ 横断テスト集約
│   ├── integration/              # 統合テスト
│   ├── e2e/                      # E2Eテスト
│   ├── performance/              # パフォーマンステスト
│   ├── fixtures/                 # 共有フィクスチャ
│   └── helpers/                  # 共有ヘルパー
├── __mocks__/                    # グローバルモック (Jestが認識)
│   ├── jsonpath-plus.js
│   └── webextension-polyfill.js
├── .test-output/                 # テスト結果出力
└── [その他]
```

### メリット
✅ **IDEナビゲーション良**: 実装とユニットテストが隣接
✅ **移行コスト小**: ユニットテストは移動不要
✅ **役割明確**: ユニット vs 横断テストで責任分離
✅ **業界標準**: 多くのプロジェクトで採用されるパターン

### デメリット
⚠️ **トップレベルに`__mocks__`残る**: 完全には集約できない
⚠️ **テスト分散**: ユニットテストは分散、その他は集約

### 必要な変更
- `jest.config.js`: `roots: ['<rootDir>/src', '<rootDir>/tests']`
- `playwright.config.ts`: `testDir: './tests/e2e'`
- `src/__tests__/`を`tests/`へ移動

---

## 提案3: 【最小変更型】現状改善案

### コンセプト
現在の構造を活かしつつ、命名と整理で改善

### 構成

```
auto-fill-tool/
├── src/
│   ├── domain/**/__tests__/      # ユニットテスト (そのまま)
│   └── [その他層]
├── test/                         # ✨ tests→test に統一
│   ├── __mocks__/                # ✨ モック移動
│   │   ├── global/
│   │   └── local/
│   ├── e2e/                      # ✨ Playwright E2E
│   │   ├── helpers/
│   │   └── *.spec.ts
│   ├── integration/              # ✨ 統合テスト移動
│   ├── performance/              # ✨ パフォーマンステスト移動
│   ├── fixtures/                 # ✨ フィクスチャ移動
│   └── helpers/                  # ✨ ヘルパー移動
├── .test-output/                 # テスト結果
└── [その他]
```

### メリット
✅ **最小変更**: ユニットテストは移動不要
✅ **トップレベルスッキリ**: `__mocks__`, `e2e`が消える
✅ **わかりやすい**: `test/`配下に横断テスト集約

### デメリット
⚠️ **中途半端**: ユニットテストは依然分散
⚠️ **`test/` vs `tests/`**: 命名規則が分かれる

---

## 比較表

| 項目 | 提案1: 完全集中型 | 提案2: ハイブリッド型 | 提案3: 最小変更型 |
|------|------------------|---------------------|------------------|
| **トップレベルの整理** | ⭐️⭐️⭐️ | ⭐️⭐️ | ⭐️⭐️ |
| **移行コスト** | 高 (2-3時間) | 中 (1-2時間) | 低 (30分-1時間) |
| **メンテナンス性** | ⭐️⭐️⭐️ | ⭐️⭐️ | ⭐️ |
| **IDEナビゲーション** | ⭐️ | ⭐️⭐️⭐️ | ⭐️⭐️⭐️ |
| **業界標準度** | ⭐️⭐️ | ⭐️⭐️⭐️ | ⭐️⭐️ |
| **将来性** | ⭐️⭐️⭐️ | ⭐️⭐️⭐️ | ⭐️⭐️ |

---

## 推奨案: 【提案2: ハイブリッド型】

### 理由

1. **バランスが良い**: IDEナビゲーションとトップレベル整理の両立
2. **業界標準**: React, Vue, Angular等の主要フレームワークで採用
3. **移行コスト適正**: ユニットテスト(約200ファイル)は移動不要
4. **Clean Architecture親和性**: 層ごとのテストが実装と同じ場所

### 移行ステップ (見積もり: 1-2時間)

#### ステップ1: ディレクトリ作成
```bash
mkdir -p tests/{integration,e2e,performance,fixtures,helpers}
```

#### ステップ2: ファイル移動
```bash
# 統合テスト移動
mv src/__tests__/integration/* tests/integration/

# E2Eテスト統合
mv e2e/* tests/e2e/
mv src/__tests__/e2e/* tests/e2e/

# パフォーマンステスト���動
mv src/__tests__/performance/* tests/performance/

# フィクスチャ・ヘルパー移動
mv src/__tests__/fixtures/* tests/fixtures/
mv src/__tests__/helpers/* tests/helpers/
mv src/__tests__/testHelpers.ts tests/helpers/

# 不要ディレクトリ削除
rm -rf e2e src/__tests__
```

#### ステップ3: 設定ファイル更新
```javascript
// jest.config.js
roots: ['<rootDir>/src', '<rootDir>/tests'],
testMatch: [
  '**/src/**/__tests__/**/*.test.ts',  // ユニットテスト
  '**/tests/**/*.test.ts',             // 統合/パフォーマンステスト
],

// playwright.config.ts
testDir: './tests/e2e',
```

#### ステップ4: .gitignore更新
```
# Test outputs
coverage/
test-results/
playwright-report/
.test-output/
```

#### ステップ5: 動作確認
```bash
npm test                    # Jest (ユニット+統合)
npm run test:e2e           # Playwright
npm run test:coverage      # カバレッジ確認
```

---

## 追加提案: テスト結果ディレクトリの整理

### 現状
```
coverage/           # Jestカバレッジ
test-results/       # Playwright結果
playwright-report/  # Playwrightレポート
```

### 提案
```
.test-output/       # ✨ すべてのテスト出力を集約 (gitignore)
├── coverage/
├── test-results/
└── playwright-report/
```

### .gitignoreに追加
```
# Test outputs (consolidated)
.test-output/
coverage/
test-results/
playwright-report/
```

---

## その他の改善提案

### 1. READMEの追加

#### `tests/README.md`
```markdown
# テストディレクトリ構成

## ディレクトリ構造

- `integration/` - 複数コンポーネントの統合テスト
- `e2e/` - Playwrightエンドツーエンドテスト
- `performance/` - パフォーマンステスト
- `fixtures/` - テストデータ・ファクトリ
- `helpers/` - 共有テストユーティリティ

## 実行方法

```bash
npm test              # すべてのテスト
npm run test:e2e     # E2Eテストのみ
```
```

### 2. package.jsonスクリプトの整理

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern='src/'",
    "test:integration": "jest --testPathPattern='tests/integration'",
    "test:e2e": "playwright test",
    "test:performance": "jest --testPathPattern='tests/performance'",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

---

## まとめ

### 最優先で実施すべき改善
1. ✅ **提案2 (ハイブリッド型)** の採用
2. ✅ テスト結果ディレクトリの`.test-output/`への統合
3. ✅ `tests/README.md`の追加

### 効果
- トップレベルディレクトリ: **41個** → **約35個** (6個削減)
- テスト関連がわかりやすく整理
- 新規メンバーのオンボーディング改善
- CI/CDパイプラインの設定が明瞭に
