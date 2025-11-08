# usecases/ → application/usecases/ 移行分析

## 🎯 移行の必要性

### Clean Architecture における正しい配置

**現在の構造:**
```
src/
├── application/
│   ├── dtos/
│   └── mappers/
├── usecases/          # ❌ 独立したディレクトリ
└── domain/
```

**正しい構造:**
```
src/
├── application/       # Application Layer
│   ├── dtos/
│   ├── mappers/
│   └── usecases/      # ✅ Application層の一部
└── domain/
```

### 理論的根拠

1. **Clean Architecture**: UseCaseはApplication層の中核コンポーネント
2. **依存関係の方向**: UseCase → Domain (Application → Domain)
3. **責務の明確化**: アプリケーション固有のビジネスルール

## 📊 影響範囲分析

### 移動対象ファイル数
```bash
find src/usecases -name "*.ts" | wc -l
# 結果: 約80ファイル (テスト含む)
```

### 主要なUseCaseカテゴリ
1. **auto-fill/** (1ファイル)
2. **automation-variables/** (13ファイル)
3. **recording/** (5ファイル)
4. **storage/** (9ファイル)
5. **system-settings/** (5ファイル)
6. **sync/** (16ファイル)
7. **websites/** (9ファイル)
8. **xpaths/** (8ファイル)

### Import文の影響範囲

**現在のimport例:**
```typescript
import { ExecuteAutoFillUseCase } from '@usecases/auto-fill/ExecuteAutoFillUseCase';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
```

**移行後のimport例:**
```typescript
import { ExecuteAutoFillUseCase } from '@application/usecases/auto-fill/ExecuteAutoFillUseCase';
import { GetAllWebsitesUseCase } from '@application/usecases/websites/GetAllWebsitesUseCase';
```

## 🔧 移行手順

### Step 1: ディレクトリ構造の準備
```bash
mkdir -p src/application/usecases
```

### Step 2: ファイル移動
```bash
mv src/usecases/* src/application/usecases/
rmdir src/usecases
```

### Step 3: tsconfig.json更新
```json
{
  "compilerOptions": {
    "paths": {
      "@application/*": ["src/application/*"],
      "@usecases/*": ["src/application/usecases/*"]  // 後方互換性
    }
  }
}
```

### Step 4: Import文の一括置換
```bash
# 全ファイルでimport文を置換
find src -name "*.ts" -exec sed -i 's|from.*usecases/|from @application/usecases/|g' {} \;
find src -name "*.ts" -exec sed -i "s|from.*'usecases/|from '@application/usecases/|g" {} \;
```

### Step 5: テストファイルの更新
```bash
# テストファイル内のimport文も更新
find src -name "*.test.ts" -exec sed -i 's|../../../usecases/|../../../application/usecases/|g' {} \;
```

## ⚠️ 注意点とリスク

### 高リスク項目
1. **大量のファイル変更**: 全プロジェクトに影響
2. **Import文の見落とし**: 動的importや文字列内のパス
3. **テストの破綻**: 相対パスの変更によるテスト失敗

### 軽減策
1. **段階的移行**: 一度に全てではなく、カテゴリごとに移行
2. **自動テスト**: 各段階でテスト実行
3. **バックアップ**: Git commitで変更を追跡

## 🧪 検証方法

### 移行完了の確認
```bash
# 1. 全テストの実行
npm test

# 2. 型チェック
npm run type-check

# 3. Lintチェック
npm run lint

# 4. ビルド確認
npm run build

# 5. 旧パスの残存確認
grep -r "from.*usecases/" src/ || echo "旧パスなし"
```

## 📈 移行の利点

### 短期的利点
1. **アーキテクチャの正確性**: Clean Architectureに準拠
2. **依存関係の明確化**: Application層の責務が明確
3. **コードの整理**: 論理的なディレクトリ構造

### 長期的利点
1. **保守性向上**: アーキテクチャルールの一貫性
2. **新人教育**: 標準的なClean Architecture構造
3. **拡張性**: 新しいUseCaseの追加が直感的

## 🚀 実装推奨事項

### 推奨する移行順序
1. **Phase 1**: `auto-fill/` (影響範囲が小さい)
2. **Phase 2**: `system-settings/` (独立性が高い)
3. **Phase 3**: `websites/`, `xpaths/` (相互依存あり)
4. **Phase 4**: `automation-variables/`, `sync/` (複雑な依存関係)
5. **Phase 5**: `storage/`, `recording/` (インフラ依存)

### 各Phase後の確認事項
- [ ] 該当カテゴリのテストが全て通る
- [ ] 関連するPresenterが正常動作する
- [ ] ビルドエラーがない
- [ ] 型エラーがない

## 📋 移行チェックリスト

### 事前準備
- [ ] 現在のテスト状況確認（全テスト合格）
- [ ] Gitで現在の状態をcommit
- [ ] 影響範囲の詳細調査

### 移行実行
- [ ] ディレクトリ作成
- [ ] ファイル移動
- [ ] tsconfig.json更新
- [ ] Import文一括置換
- [ ] 手動でのImport文確認

### 移行後検証
- [ ] 全テスト実行・合格確認
- [ ] 型チェック合格確認
- [ ] Lint合格確認
- [ ] ビルド成功確認
- [ ] 実際の機能動作確認

## 🎯 結論

**usecases/ → application/usecases/ への移行は必要かつ有益**

**理由:**
1. Clean Architectureの正しい実装
2. アーキテクチャの一貫性向上
3. 長期的な保守性の向上

**推奨アプローチ:**
段階的移行により、リスクを最小化しながら確実に実行する。
