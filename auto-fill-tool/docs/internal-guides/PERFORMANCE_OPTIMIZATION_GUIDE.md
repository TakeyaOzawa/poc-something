# テスト・Lint高速化ガイド

## 🚀 高速化手法

### 1. 高速テスト実行

#### 開発時の高速テスト
```bash
# 単体テストのみ（最速）
npm run test:unit:fast

# 高速設定でのテスト実行
npm run test:fast

# ウォッチモード（高速）
npm run test:watch:fast

# 開発時の簡易チェック
npm run dev:check
```

#### 高速化のポイント
- **testEnvironment**: `jsdom` → `node` (3-5倍高速)
- **maxWorkers**: `1` → `50%` (並列実行)
- **cache**: Jest キャッシュ有効化
- **coverage**: 無効化（開発時）
- **bail**: 最初の失敗で停止

### 2. 高速Lint実行

#### 開発時の高速Lint
```bash
# 高速Lint（キャッシュ有効）
npm run lint:fast

# 高速修正
npm run lint:fix:fast

# 高速品質チェック
npm run quality:fast
```

#### 高速化のポイント
- **cache**: ESLintキャッシュ有効化
- **project**: TypeScript型チェック無効化
- **rules**: 最小限のルールセット
- **ignorePatterns**: テストファイル除外

### 3. 統合高速化

#### 開発ワークフロー
```bash
# 最速の開発時チェック（推奨）
npm run dev:check

# 高速品質チェック + テスト
npm run validate:fast

# 高速修正 + フォーマット
npm run quality:fix:fast
```

## ⚡ パフォーマンス比較

### テスト実行時間
| コマンド | 通常 | 高速 | 改善率 |
|---------|------|------|--------|
| `test:unit` | ~75s | ~15s | **80%短縮** |
| `test:watch` | ~10s/変更 | ~2s/変更 | **80%短縮** |
| `test:coverage` | ~90s | N/A | カバレッジ無効 |

### Lint実行時間
| コマンド | 通常 | 高速 | 改善率 |
|---------|------|------|--------|
| `lint` | ~30s | ~8s | **73%短縮** |
| `lint:fix` | ~45s | ~12s | **73%短縮** |

### 統合チェック時間
| コマンド | 通常 | 高速 | 改善率 |
|---------|------|------|--------|
| `validate` | ~120s | ~25s | **79%短縮** |
| `quality` | ~45s | ~10s | **78%短縮** |

## 🔧 設定ファイル

### Jest高速設定 (`jest.config.fast.js`)
- **testEnvironment**: `node`
- **maxWorkers**: `50%`
- **cache**: 有効
- **coverage**: 無効
- **bail**: 有効

### ESLint高速設定 (`.eslintrc.fast.js`)
- **project**: 無効（型チェック無し）
- **cache**: 有効
- **rules**: 最小限
- **ignorePatterns**: テスト除外

## 💡 使い分けガイド

### 開発時（推奨）
```bash
# 日常的な開発チェック
npm run dev:check

# ファイル変更監視
npm run test:watch:fast
```

### コミット前
```bash
# 高速品質チェック
npm run validate:fast

# 問題があれば修正
npm run quality:fix:fast
```

### CI/本格テスト
```bash
# 完全なテスト実行
npm run ci

# 完全な品質チェック
npm run validate
```

## 🎯 メモリ最適化

### Node.js設定
- **--max-old-space-size**: `4096MB` → `2048MB`
- **workerIdleMemoryLimit**: `256MB` → `128MB`

### Jest設定
- **maxWorkers**: CPU使用率の調整
- **cache**: ディスクキャッシュ活用
- **forceExit**: メモリリーク防止

## 📊 監視とプロファイリング

### パフォーマンス測定
```bash
# 実行時間測定
time npm run test:fast

# メモリ使用量監視
NODE_OPTIONS="--inspect" npm run test:fast
```

### キャッシュ管理
```bash
# Jestキャッシュクリア
rm -rf .jest-cache

# ESLintキャッシュクリア
rm -f .eslintcache

# 全キャッシュクリア
npm run clean
```

## ⚠️ 注意事項

### 高速設定の制限
- **型チェック**: ESLint高速設定では無効
- **カバレッジ**: Jest高速設定では無効
- **統合テスト**: 高速設定では除外

### 使用場面
- **開発時**: 高速設定推奨
- **CI/CD**: 通常設定必須
- **リリース前**: 完全テスト必須

---

**作成日**: 2025-11-01  
**対象**: Auto Fill Tool Chrome Extension  
**更新**: パフォーマンス改善に応じて随時更新
