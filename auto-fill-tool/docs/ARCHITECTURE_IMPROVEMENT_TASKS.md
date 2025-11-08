# アーキテクチャ改善タスクリスト

## 概要

このドキュメントは、現在のプロジェクトをクリーンアーキテクチャ、DDD、ヘキサゴナルアーキテクチャの原則により厳密に準拠させるための改善タスクをまとめています。

## 🏗️ 構造的改善タスク

### Task 1: usecases/ を application/ 配下に移動 【高優先度】

**現状の問題:**
- `src/usecases/` が独立したディレクトリとして存在
- Clean Architectureでは、UseCaseはApplication層の一部であるべき

**改善内容:**
```
現在: src/usecases/
改善後: src/application/usecases/
```

**影響範囲:**
- 全てのimport文の修正が必要
- tsconfig.jsonのパスマッピング更新
- テストファイルのパス更新

**実装手順:**
1. `src/application/usecases/` ディレクトリ作成
2. `src/usecases/` の全ファイルを移動
3. tsconfig.jsonのpaths設定更新
4. 全ファイルのimport文を一括置換
5. テスト実行で動作確認

### Task 2: utils/ の適切な層への移動 【中優先度】

**現状の問題:**
- `src/utils/` が独立したディレクトリとして存在
- ユーティリティ関数がアーキテクチャ層を無視している

**改善内容:**
```
src/utils/htmlSanitization.ts → src/domain/services/HtmlSanitizationService.ts
src/utils/dateFormatter.ts → src/domain/services/DateFormatterService.ts
```

**理由:**
- ビジネスロジックに関わるユーティリティはDomain層のServiceとして配置
- インフラに依存するものはInfrastructure層に配置

## 🔧 クラス設計改善タスク

### Task 3: ApplicationService の責務分離 【高優先度】

**現状の問題:**
- `ApplicationService` が複数の責務を持ちすぎている
- Factory、Command、Observer、Repository、Loggerを全て管理

**改善内容:**
```typescript
// 現在の ApplicationService を以下に分離:
- ApplicationServiceRegistry (サービス登録管理)
- ApplicationServiceLocator (サービス取得)
- ApplicationServiceLifecycle (ライフサイクル管理)
```

**実装手順:**
1. 責務ごとにクラスを分離
2. 各クラスの単一責任を明確化
3. 依存関係の整理
4. テストの追加・修正

### Task 4: Coordinator パターンの統一 【中優先度】

**現状の問題:**
- PopupCoordinator、XPathManagerCoordinator等が異なる実装パターン
- 一部のCoordinatorが複雑すぎる（max-lines-per-function警告）

**改善内容:**
```typescript
// 共通のCoordinatorインターフェース定義
interface Coordinator {
  initialize(): Promise<void>;
  cleanup(): void;
  handleError(error: Error): void;
}

// 基底クラスの作成
abstract class BaseCoordinator implements Coordinator {
  // 共通実装
}
```

### Task 5: Presenter の責務明確化 【中優先度】

**現状の問題:**
- 一部のPresenterがViewの詳細を知りすぎている
- ビジネスロジックとプレゼンテーションロジックの境界が曖昧

**改善内容:**
- Presenterは純粋にUseCaseとViewの仲介のみ
- ViewModelの変換ロジックを専用のMapperに分離
- Viewの実装詳細への依存を排除

## 🏛️ ヘキサゴナルアーキテクチャ準拠タスク

### Task 6: Port/Adapter パターンの完全実装 【高優先度】

**現状の問題:**
- 一部のAdapterがPortインターフェースを実装していない
- Domain層が具象クラスに直接依存している箇所がある

**改善内容:**
```typescript
// 全てのAdapterに対応するPortを定義
src/domain/ports/
├── repositories/     # Repository Ports
├── services/        # External Service Ports  
├── adapters/        # Infrastructure Adapter Ports
└── gateways/        # External Gateway Ports
```

**実装手順:**
1. 不足しているPortインターフェースの特定
2. Portインターフェースの作成
3. AdapterクラスでPortを実装
4. Domain層の依存関係をPortに変更

### Task 7: Infrastructure層の依存関係整理 【中優先度】

**現状の問題:**
- Infrastructure層内でのクラス間依存が複雑
- 一部のAdapterが他のAdapterに直接依存

**改善内容:**
- AdapterはPortを通じてのみ他のサービスと通信
- Infrastructure層内の循環依存の排除
- 依存関係の可視化と整理

## 🎯 DDD準拠タスク

### Task 8: Domain Service の責務明確化 【中優先度】

**現状の問題:**
- 一部のDomain Serviceがインフラの詳細を知っている
- ビジネスルールとテクニカルな処理が混在

**改善内容:**
```typescript
// Domain Serviceの分類
- Pure Domain Services (ビジネスルールのみ)
- Application Services (ユースケース調整)
- Infrastructure Services (技術的処理)
```

### Task 9: Value Object の活用拡大 【低優先度】

**現状の問題:**
- プリミティブ型を直接使用している箇所が多い
- ビジネス概念がValue Objectとして表現されていない

**改善内容:**
```typescript
// 新しいValue Objectの追加
- WebsiteUrl (URL検証ロジック含む)
- XPathExpression (XPath構文検証含む)
- RetryCount (範囲検証含む)
- TimeoutSeconds (範囲検証含む)
```

### Task 10: Aggregate の境界明確化 【低優先度】

**現状の問題:**
- Entity間の関係が複雑
- Aggregateの境界が不明確

**改善内容:**
- WebsiteAggregate (Website + XPathCollection + AutomationVariables)
- SystemSettingsAggregate (SystemSettings + 関連設定)
- SyncConfigAggregate (StorageSyncConfig + SyncHistory)

## 🧪 テスト改善タスク

### Task 11: アーキテクチャテストの追加 【中優先度】

**現状の問題:**
- アーキテクチャルールの違反を自動検出できない
- 依存関係の方向性をテストで保証していない

**改善内容:**
```typescript
// アーキテクチャテストの追加
- 層間依存関係のテスト
- 循環依存の検出テスト
- Portパターンの実装確認テスト
- Domain層の純粋性テスト
```

### Task 12: 統合テストの充実 【低優先度】

**現状の問題:**
- 統合テストが不足している
- End-to-Endのシナリオテストがない

**改善内容:**
- UseCase統合テスト
- Repository統合テスト
- UI統合テスト

## 📋 実装優先順位

### Phase 1: 構造改善 (1-2週間)
1. Task 1: usecases/ の移動
2. Task 6: Port/Adapter パターン完全実装
3. Task 3: ApplicationService 責務分離

### Phase 2: 設計改善 (1週間)
4. Task 4: Coordinator パターン統一
5. Task 5: Presenter 責務明確化
6. Task 8: Domain Service 責務明確化

### Phase 3: 品質向上 (1週間)
7. Task 2: utils/ の適切配置
8. Task 7: Infrastructure層依存関係整理
9. Task 11: アーキテクチャテスト追加

### Phase 4: 拡張改善 (必要に応じて)
10. Task 9: Value Object 活用拡大
11. Task 10: Aggregate 境界明確化
12. Task 12: 統合テスト充実

## 🎯 期待される効果

### 短期的効果
- アーキテクチャの一貫性向上
- コードの可読性・保守性向上
- テストの安定性向上

### 長期的効果
- 新機能追加の容易性
- バグの早期発見・修正
- チーム開発の効率化
- 技術的負債の削減

## 📝 注意事項

1. **段階的実装**: 一度に全てを変更せず、段階的に実装する
2. **テスト保証**: 各段階でテストが通ることを確認する
3. **影響範囲確認**: 変更前に影響範囲を十分に調査する
4. **ドキュメント更新**: アーキテクチャ変更に伴いドキュメントも更新する

## 🔍 検証方法

各タスク完了後、以下を確認する：

1. **全テストの合格**: `npm test` で全テストが通る
2. **Lintエラー0**: `npm run lint` でエラー・警告が0
3. **ビルド成功**: `npm run build` が成功する
4. **型チェック**: `npm run type-check` が成功する
5. **アーキテクチャルール**: 新しいアーキテクチャテストが通る
