# テストディレクトリ構成

Auto Fill Tool のテストは以下のように構成されています。

## ディレクトリ構造

```
tests/
├── integration/        # 統合テスト - 複数コンポーネントの連携テスト
├── e2e/                # E2Eテスト - Playwrightによるブラウザテスト
├── performance/        # パフォーマンステスト - 実行時間や負荷テスト
├── fixtures/           # テストデータ・ファクトリ
└── helpers/            # 共有テストユーティリティ
```

### ユニットテスト

ユニットテストは実装コードと同じ場所に配置されています：

```
src/
├── domain/**/__tests__/           # ドメイン層のユニットテスト
├── usecases/**/__tests__/         # ユースケース層のユニットテスト
├── infrastructure/**/__tests__/   # インフラ層のユニットテスト
└── presentation/**/__tests__/     # プレゼンテーション層のユニットテスト
```

## テストの種類

### 1. ユニットテスト (Unit Tests)

**場所**: `src/**/__tests__/*.test.ts`
**フレームワーク**: Jest

個別のクラス・関数の動作を検証します。

**実行コマンド**:
```bash
npm test                           # すべてのユニットテストを実行
npm test -- path/to/file.test.ts   # 特定のファイルのみ実行
npm run test:watch                 # 変更監視モード
```

### 2. 統合テスト (Integration Tests)

**場所**: `tests/integration/*.test.ts`
**フレームワーク**: Jest

複数のコンポーネントの連携を検証します（例: Repository ↔ Mapper、UseCase ↔ Service）。

**実行コマンド**:
```bash
npm run test:integration          # 統合テストのみ実行
```

### 3. パフォーマンステスト (Performance Tests)

**場所**: `tests/performance/*.test.ts`
**フレームワーク**: Jest

実行時間、メモリ使用量、負荷時の動作を検証します。

**実行コマンド**:
```bash
npm run test:performance          # パフォーマンステストのみ実行
```

### 4. E2Eテスト (End-to-End Tests)

**場所**: `tests/e2e/*.spec.ts`
**フレームワーク**: Playwright

実際のブラウザで拡張機能の動作を検証します。

**実行コマンド**:
```bash
npm run test:e2e                  # E2Eテストを実行
npm run test:e2e -- --headed      # ブラウザを表示して実行
npm run test:e2e -- --debug       # デバッグモード
```

**注意**: E2Eテストは事前にビルドが必要です：
```bash
npm run build                     # 拡張機能をビルド
npm run test:e2e                  # E2Eテスト実行
```

## テストヘルパー・フィクスチャ

### helpers/

共有のテストユーティリティ：

- `MockLogger.ts` - ログ出力のモック
- `MockSecureStorage.ts` - セキュアストレージのモック
- `testHelpers.ts` - 共通ヘルパー関数

### fixtures/

テストデータファクトリ：

- `TestDataFactories.ts` - テストデータ生成関数
- `sampleData/` - サンプルデータファイル

## カバレッジ

テストカバレッジを確認：

```bash
npm run test:coverage              # カバレッジレポート生成
open coverage/lcov-report/index.html  # レポートをブラウザで表示
```

**カバレッジ目標**:
- Statements: 80%以上
- Branches: 65%以上
- Functions: 75%以上
- Lines: 80%以上

## CI/CD

すべてのテストを実行（CI環境想定）：

```bash
npm run ci                        # quality + test:ci + build
```

## トラブルシューティング

### テストが失敗する

1. **依存関係の確認**:
   ```bash
   npm install
   ```

2. **キャッシュのクリア**:
   ```bash
   npm run clean
   npm install
   ```

3. **特定のテストのみ実行**:
   ```bash
   npm test -- path/to/failing.test.ts
   ```

### E2Eテストが失敗する

1. **ビルドの確認**:
   ```bash
   npm run build
   ls -la dist/manifest.json  # マニフェストファイルが存在するか確認
   ```

2. **Playwrightブラウザのインストール**:
   ```bash
   npx playwright install chromium
   ```

## ベストプラクティス

1. **ユニットテストは実装と同じ場所に配置**
   - コードレビュー時に実装とテストを同時に確認可能
   - リファクタリング時の移動が容易

2. **横断的なテストは `tests/` 配下に配置**
   - 統合テスト・E2E・パフォーマンステストは別管理
   - テスト種別が明確

3. **モックは適切に使用**
   - 外部依存（ブラウザAPI、ネットワーク）はモック化
   - テストの独立性を保つ

4. **テストは高速に実行可能に**
   - ユニットテストは数秒以内
   - 並列実行を活用（Jest: `maxWorkers: '50%'`）

## 参考リンク

- [Jest公式ドキュメント](https://jestjs.io/)
- [Playwright公式ドキュメント](https://playwright.dev/)
- [プロジェクトREADME](../README.md)
