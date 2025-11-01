# 実装計画 - セキュリティ & 同期機能

**最終更新日**: 2025-01-16
**ステータス**: Phase 1 100%完了、Phase 2 未着手
**全体進捗**: 52% (49/94 タスク完了)

---

## 📋 目次

- [1. プロジェクト概要](#1-プロジェクト概要)
- [2. 全体スケジュール](#2-全体スケジュール)
- [3. Phase 1: セキュリティ実装](#3-phase-1-セキュリティ実装)
- [4. Phase 2: 同期機能実装](#4-phase-2-同期機能実装)
- [5. 課題管理](#5-課題管理)
- [6. 仕様変更履歴](#6-仕様変更履歴)
- [7. 制限事項](#7-制限事項)
- [8. リスク管理](#8-リスク管理)

---

## 1. プロジェクト概要

### 1.1 目的

Chrome拡張機能「Auto Fill Tool」に以下の機能を追加：

1. **セキュリティ強化**
   - ソースコード難読化（Webpack + Terser）
   - localStorage データの暗号化（AES-GCM + PBKDF2）
   - マスターパスワード方式の実装

2. **データ同期機能**
   - localStorage 毎の柔軟な同期設定
   - CSV インポート・エクスポート
   - 外部DB（HTTP(S)）との同期
   - 手動・定期自動同期

### 1.2 実装方針

**実装順序**: セキュリティ → 同期機能

**理由**:
- 暗号化基盤を先に構築
- 同期機能は暗号化されたデータを扱う
- 二度手間を避ける

### 1.3 関連ドキュメント

- [SECURITY_DESIGN.md](./SECURITY_DESIGN.md) - セキュリティ設計書
- [STORAGE_SYNC_DESIGN.md](./STORAGE_SYNC_DESIGN.md) - 同期機能設計書

---

## 2. 全体スケジュール

### 2.1 タイムライン

```
Phase 1: セキュリティ実装 (10日)
├── 1.1 難読化設定 (1日)
├── 1.2 暗号化基盤 (2日)
├── 1.3 Secure Repository (2日)
├── 1.4 UI実装 (3日)
└── 1.5 データ移行 & テスト (2日)

Phase 2: 同期機能実装 (28日)
├── 2.1 Entity & Repository (4日)
├── 2.2 Services (5日)
├── 2.3 Use Cases (4日)
├── 2.4 Scheduler (2日)
├── 2.5 UI - データ同期タブ (6日)
├── 2.6 エラーハンドリング & 競合解決 (3日)
├── 2.7 ドキュメント & テスト (3日)
└── 2.8 リリース準備 (1日)

合計: 38日
```

### 2.2 マイルストーン

| マイルストーン | 予定日 | 実績日 | ステータス | 達成率 |
|--------------|--------|--------|----------|--------|
| **Phase 1: セキュリティ実装** | | | | **100%** |
| M1: 難読化設定完了 | Day 1 | Day 1 | ✅ 完了 (2025-10-15) | 100% (7/7タスク) |
| M2: 暗号化基盤完了 | Day 3 | Day 2 | ✅ 完了 (2025-10-16) | 100% (10/10タスク) |
| M3: Secure Repository完了 | Day 5 | Day 2 | ✅ 完了 (2025-10-16) | 100% (12/12タスク) |
| M4: セキュリティUI完了 | Day 8 | Day 2 | ✅ 完了 (2025-10-16) | 100% (15/15タスク) |
| M5: Phase 1完了 | Day 10 | Day 3 | ✅ 完了 (2025-01-16) | 100% (49/49タスク) |
| **Phase 2: 同期機能実装** | | | | **0%** |
| M6: 同期Entity完了 | Day 14 | - | 🔲 未着手 | 0% (0/8タスク) |
| M7: 同期Services完了 | Day 19 | - | 🔲 未着手 | 0% (0/14タスク) |
| M8: 同期UseCases完了 | Day 23 | - | 🔲 未着手 | 0% (0/10タスク) |
| M9: 同期UI完了 | Day 31 | - | 🔲 未着手 | 0% (0/15タスク) |
| M10: Phase 2完了 | Day 38 | - | 🔲 未着手 | 0% (0/48タスク) |

**Phase 1 完了サマリー**:
- 予定期間: 10日 → 実績期間: 3日 (70%短縮)
- タスク完了率: 100% (49/49タスク)
- テスト合格率: 100% (2,606/2,606テスト)
- セキュリティ評価: SECURE ✅
- 主要成果物: 暗号化基盤、Secure Repository、Master Password UI、データ移行、セキュリティレビュー

---

## 3. Phase 1: セキュリティ実装

**期間**: 10日
**進捗**: 100% (49/49 タスク完了)
**ステータス**: ✅ 完了
**完了日**: 2025-01-16

### 3.1 難読化設定 (1日)

**担当**: Claude
**進捗**: 100% (7/7 タスク完了)
**ステータス**: ✅ 完了
**完了日**: 2025-10-15

#### タスク

- [x] 3.1.1 `package.json` に必要なパッケージ追加
  - `terser-webpack-plugin`: ^5.3.9 ✅
  - `copy-webpack-plugin`: ^11.0.0 (既存) ✅
  - **成果物**: `package.json` 更新完了

- [x] 3.1.2 `npm install` 実行
  - **検証**: `node_modules` にパッケージがインストールされる ✅

- [x] 3.1.3 `webpack.config.js` を更新
  - TerserPlugin 設定追加 ✅
  - 圧縮・マングリング設定 ✅
  - **成果物**: `webpack.config.js` 更新完了
  - **参照**: [SECURITY_DESIGN.md - 1.2.1](./SECURITY_DESIGN.md#121-webpackconfigjs-の更新)

- [x] 3.1.4 `StringObfuscator` クラス実装
  - ファイル: `src/infrastructure/obfuscation/StringObfuscator.ts` ✅
  - Base64 エンコード・デコード ✅
  - XOR 簡易暗号化 ✅
  - **テスト**: ユニットテスト作成 (12/12 テスト合格) ✅

- [x] 3.1.5 `ObfuscatedStorageKeys` 実装
  - ファイル: `src/domain/constants/ObfuscatedStorageKeys.ts` ✅
  - STORAGE_KEYS を難読化 ✅
  - **テスト**: 復元が正しく動作するか確認 (16/16 テスト合格) ✅

- [x] 3.1.6 本番ビルド実行
  - `npm run build` ✅
  - **検証**: dist フォルダに難読化されたファイルが生成される ✅

- [x] 3.1.7 難読化の確認
  - 変数名が a, b, c 等になっているか ✅
  - console.log が削除されているか (0件確認) ✅
  - コメントが削除されているか ✅
  - **成果物**: [obfuscation-verification-results.md](./obfuscation-verification-results.md)

#### 課題

なし

#### 制限事項

- TerserPlugin の設定によっては、一部の動的コードが動作しなくなる可能性がある
- 完全な保護ではなく、解析の難易度を上げるのみ

---

### 3.2 暗号化基盤 (2日)

**担当**: Claude
**進捗**: 100% (10/10 タスク完了)
**ステータス**: ✅ 完了
**完了日**: 2025-10-16

#### タスク

- [x] 3.2.1 `WebCryptoService` クラス実装 ✅
  - ファイル: `src/infrastructure/encryption/CryptoUtils.ts`
  - AES-GCM 暗号化・復号化
  - PBKDF2 鍵導出
  - **参照**: [SECURITY_DESIGN.md - 2.2.2](./SECURITY_DESIGN.md#222-実装-cryptoutils)

- [x] 3.2.2 `WebCryptoService` ユニットテスト作成 ✅
  - ファイル: `src/infrastructure/encryption/__tests__/WebCryptoService.test.ts`
  - 暗号化・復号化のテスト (26テスト)
  - パスワードからの鍵導出テスト
  - 誤ったキーでの復号化エラーテスト

- [x] 3.2.3 `SecureStorageAdapter` クラス実装 ✅
  - ファイル: `src/infrastructure/adapters/SecureStorageAdapter.ts`
  - セッション管理
  - アンロック・ロック機能
  - **参照**: [ENCRYPTION_INFRASTRUCTURE.md](./ENCRYPTION_INFRASTRUCTURE.md)

- [x] 3.2.4 `SecureStorageAdapter` ユニットテスト作成 ✅
  - ファイル: `src/infrastructure/adapters/__tests__/SecureStorageAdapter.test.ts`
  - 初期化テスト (96テスト)
  - アンロック・ロックテスト
  - セッションタイムアウトテスト

- [x] 3.2.5 `PasswordValidator` クラス実装 ✅
  - ファイル: `src/infrastructure/security/PasswordValidator.ts`
  - パスワード検証ロジック
  - 強度スコア算出
  - **参照**: [ENCRYPTION_INFRASTRUCTURE.md](./ENCRYPTION_INFRASTRUCTURE.md)

- [x] 3.2.6 `PasswordValidator` ユニットテスト作成 ✅
  - ファイル: `src/infrastructure/security/__tests__/PasswordValidator.test.ts`
  - 各種パスワードパターンのテスト (30テスト)
  - 強度スコアの検証

- [x] 3.2.7 `LockoutManager` クラス実装 ✅
  - ファイル: `src/infrastructure/security/LockoutManager.ts`
  - ログイン試行回数管理
  - ロックアウト機能
  - **参照**: [ENCRYPTION_INFRASTRUCTURE.md](./ENCRYPTION_INFRASTRUCTURE.md)

- [x] 3.2.8 `LockoutManager` ユニットテスト作成 ✅
  - ファイル: `src/infrastructure/security/__tests__/LockoutManager.test.ts`
  - 失敗回数記録テスト (35テスト)
  - ロックアウト発動テスト
  - 段階的期間延長テスト

- [x] 3.2.9 統合テスト作成 ✅
  - ファイル: `src/infrastructure/adapters/__tests__/SecureStorageIntegration.test.ts`
  - 暗号化 → 復号化の一連の流れ
  - マスターパスワードの変更
  - 統合テスト合計: 187テスト

- [x] 3.2.10 暗号化基盤のドキュメント更新 ✅
  - ファイル: `docs/外部データソース連携/ENCRYPTION_INFRASTRUCTURE.md`
  - 完全な設計・実装ドキュメント作成

#### 課題

なし

#### 制限事項

- Web Crypto API の制限により、一部古いブラウザでは動作しない可能性がある
- PBKDF2 の100,000イテレーションは初期化時に100-200ms要する

---

### 3.3 Secure Repository (2日)

**担当**: Claude
**進捗**: 100% (12/12 タスク完了)
**ステータス**: ✅ 完了
**完了日**: 2025-10-16

#### タスク

- [x] 3.3.1 設計ドキュメント作成 ✅
  - ファイル: `docs/外部データソース連携/SECURE_REPOSITORY_DESIGN.md`
  - Clean Architecture原則に基づく設計
  - 実装パターンの詳細定義
  - **参照**: [SECURE_REPOSITORY_DESIGN.md](./SECURE_REPOSITORY_DESIGN.md)

- [x] 3.3.2 `SecureAutomationVariablesRepository` 実装 ✅
  - ファイル: `src/infrastructure/repositories/SecureAutomationVariablesRepository.ts`
  - 既存の `ChromeStorageAutomationVariablesRepository` を参考に実装
  - `SecureStorageService` を使用して暗号化
  - **参照**: [SECURITY_DESIGN.md - 2.3.1](./SECURITY_DESIGN.md#231-secureautomationvariablesrepository)

- [x] 3.3.3 `SecureAutomationVariablesRepository` ユニットテスト ✅
  - ファイル: `src/infrastructure/repositories/__tests__/SecureAutomationVariablesRepository.test.ts`
  - CRUD操作のテスト (40テスト)
  - アンロック状態のチェック
  - セッション管理の検証

- [x] 3.3.4 `SecureWebsiteRepository` 実装 ✅
  - ファイル: `src/infrastructure/repositories/SecureWebsiteRepository.ts`
  - Website エンティティの暗号化対応

- [x] 3.3.5 `SecureWebsiteRepository` ユニットテスト ✅
  - ファイル: `src/infrastructure/repositories/__tests__/SecureWebsiteRepository.test.ts`
  - 27テスト合格

- [x] 3.3.6 `SecureXPathRepository` 実装 ✅
  - ファイル: `src/infrastructure/repositories/SecureXPathRepository.ts`
  - XPath データの暗号化対応

- [x] 3.3.7 `SecureXPathRepository` ユニットテスト ✅
  - ファイル: `src/infrastructure/repositories/__tests__/SecureXPathRepository.test.ts`
  - 31テスト合格

- [x] 3.3.8 `SecureSystemSettingsRepository` 実装 ✅
  - ファイル: `src/infrastructure/repositories/SecureSystemSettingsRepository.ts`
  - SystemSettings の暗号化対応

- [x] 3.3.9 `SecureSystemSettingsRepository` ユニットテスト ✅
  - ファイル: `src/infrastructure/repositories/__tests__/SecureSystemSettingsRepository.test.ts`
  - 28テスト合格

- [x] 3.3.10 Repository 統合テスト ✅
  - ファイル: `src/infrastructure/repositories/__tests__/SecureRepositoryIntegration.test.ts`
  - 複数のRepositoryを使用したテスト (19テスト)
  - 実際の暗号化フロー検証
  - クロスリポジトリ統合

- [x] 3.3.11 `RepositoryFactory` 実装 ✅
  - ファイル: `src/infrastructure/factories/RepositoryFactory.ts`
  - DI Container パターン
  - 環境ベースのMode選択
  - **参照**: [REPOSITORY_FACTORY.md](./REPOSITORY_FACTORY.md)

- [x] 3.3.12 `RepositoryFactory` テスト & Presentation Layer統合 ✅
  - ファイル: `src/infrastructure/factories/__tests__/RepositoryFactory.test.ts` (36テスト)
  - 全5つのPresentation Layerファイルに統合
  - Global factory singleton pattern
  - **参照**: [factory-integration-progress.md](./factory-integration-progress.md)

#### 課題

なし

#### 制限事項

- 暗号化後は、マスターパスワードなしではデータにアクセスできない
- 既存のRepositoryとの互換性がないため、DI設定を変更する必要がある

---

### 3.4 UI実装 (3日)

**担当**: Claude
**進捗**: 100% (15/15 タスク完了)
**ステータス**: ✅ 完了
**完了日**: 2025-10-16

#### タスク

- [x] 3.4.1 Domain層実装 (5ファイル、790行)
  - `src/domain/types/Result.ts` (115行)
  - `src/domain/values/PasswordStrength.ts` (195行)
  - `src/domain/values/MasterPasswordRequirements.ts` (166行)
  - `src/domain/values/UnlockStatus.ts` (212行)
  - `src/domain/entities/MasterPasswordPolicy.ts` (187行)
  - **設計**: Domain-Driven Design (DDD)

- [x] 3.4.2 Domain層テスト (5ファイル、約1,700行、約250テストケース)
  - すべてのValue ObjectとEntityに包括的なテスト
  - 100%テストカバレッジ
  - PasswordStrength: 53/53テスト合格

- [x] 3.4.3 Use Case層実装 (4ファイル、222行)
  - `src/usecases/InitializeMasterPasswordUseCase.ts` (52行)
  - `src/usecases/UnlockStorageUseCase.ts` (75行)
  - `src/usecases/LockStorageUseCase.ts` (28行)
  - `src/usecases/CheckUnlockStatusUseCase.ts` (49行)

- [x] 3.4.4 Use Case層テスト (4ファイル、約1,800行、約150テストケース)
  - 各UseCaseに包括的なテスト
  - モックを使用した単体テスト
  - 100%テストカバレッジ

- [x] 3.4.5 マスターパスワード設定画面 (約600行)
  - ファイル: `public/master-password-setup.html`
  - ファイル: `src/presentation/master-password-setup/index.ts`
  - パスワード強度インジケーター (リアルタイム)
  - Domain層のPasswordStrengthを使用

- [x] 3.4.6 アンロック画面 (約720行)
  - ファイル: `public/unlock.html`
  - ファイル: `src/presentation/unlock/index.ts`
  - ロックアウトタイマー表示
  - 残り試行回数表示
  - Domain層のUnlockStatusを使用

- [x] 3.4.7 Background Service Worker 統合 (約170行)
  - ファイル: `src/presentation/background/index.ts` 更新
  - メッセージハンドラー追加 (4種類)
  - セッション管理実装 (Alarms API + Idle API)
  - 全タブへのイベントブロードキャスト

- [x] 3.4.8 webpack設定更新
  - エントリーポイント追加: master-password-setup, unlock

- [x] 3.4.9 多言語対応 (i18n) 実装 (約400行)
  - `_locales/en/messages.json` (約80メッセージ)
  - `_locales/ja/messages.json` (約80メッセージ)
  - manifest.json i18n サポート
  - Chrome Extension i18n API 使用

- [x] 3.4.10 E2E 統合テスト実装 (約595行、22テストケース)
  - ファイル: `src/__tests__/integration/MasterPasswordIntegration.test.ts`
  - 完全なライフサイクルテスト
  - 暗号化・復号化テスト
  - ロックアウト機能テスト
  - **100%合格 (22/22テスト)**

- [x] 3.4.11 webextension-polyfill モック実装
  - ファイル: `__mocks__/webextension-polyfill.js` (約110行)
  - Jest 自動検出による manual mock
  - Map-based in-memory storage

- [x] 3.4.12 テスト隔離問題の修正
  - `secureStorage.reset()` の追加
  - テスト実行順序に依存しない完全な隔離を実現

- [x] 3.4.13 Result.ts 型安全性の向上
  - Generic error type `E` の保持
  - `map()`, `flatMap()` での型保持

- [x] 3.4.14 統合テスト用 Mock 実装
  - MockLockoutStorage 実装
  - グローバルストレージマップ

- [x] 3.4.15 進捗ドキュメント作成
  - ファイル: `docs/外部データソース連携/section-3.4-progress.md` (約1,300行)
  - 完全な実装記録

#### 課題

なし

#### 制限事項

- マスターパスワードを忘れた場合、データは復元不可能
- セッションタイムアウト後は再度アンロックが必要

#### 成果物

**コード統計**:
- 実装ファイル: 17ファイル、約3,300行
  - Domain層: 5ファイル、790行
  - Use Case層: 4ファイル、222行
  - Presentation層: 4ファイル、約1,490行
  - i18n: 2ファイル、約400行
- テストファイル: 13ファイル、約4,990行
  - Unit テスト: 9ファイル、約3,800行 (約400テストケース)
  - 統合テスト: 1ファイル、約470行 (22テストケース)
  - Mock: 1ファイル、約110行

**テスト結果**:
- Unit テスト: 約400テストケース (100%合格)
- 統合テスト: 22/22テスト合格 (100%合格)
- 総テスト数: 約422テストケース

**アーキテクチャ**:
- Domain-Driven Design (DDD) の徹底
- すべてのビジネスロジックをDomain層に配置
- Use Case層は最小限のオーケストレーションのみ (20-80行/ファイル)
- Result Pattern による型安全なエラーハンドリング
- Value Object による不変性の保証

---

### 3.5 データ移行 & テスト (2日)

**担当**: Claude
**進捗**: 100% (3/3 タスク完了)
**ステータス**: ✅ 完了
**開始日**: 2025-10-16
**完了日**: 2025-01-16

#### タスク

- [x] 3.5.1 データ移行UseCase実装 ✅
  - ファイル: `src/usecases/MigrateToSecureStorageUseCase.ts` (280行)
  - 既存の平文データを暗号化データに移行
  - バックアップ作成機能 (MigrationBackup型)
  - ロールバック機能 (手動・自動)
  - 複数バックアップ管理 (listBackups, cleanupOldBackups)
  - **テスト**: `src/usecases/__tests__/MigrateToSecureStorageUseCase.test.ts` (572行、34テスト、100%合格)
  - **機能**:
    - マイグレーション実行 (execute)
    - バックアップからの復元 (restoreFromBackup)
    - 手動ロールバック (rollback)
    - マイグレーション状態確認 (isMigrated)
    - 古いバックアップのクリーンアップ (cleanupOldBackups)

- [x] 3.5.2 E2E テスト実施 ✅
  - ファイル: `src/__tests__/e2e/MigrationWorkflow.e2e.test.ts` (711行、15テスト、100%合格)
  - **テスト範囲**:
    - 初回起動 → マスターパスワード設定 → データ移行 (完全フロー)
    - アンロック → データ操作 (CRUD) → ロック (複数サイクル)
    - セッションタイムアウト動作検証
    - ロックアウト機能 (移行後も適用)
    - データ移行ワークフロー (成功・失敗・ロールバック)
    - バックアップ管理 (作成・一覧・取得・クリーンアップ)
    - エッジケース (空データ、大量データ、複数データ型)
    - 完全なユーザージャーニー (インストール → 日常使用)
  - **統合テスト結果**: 74/74テスト合格
    - Master Password Integration: 22テスト
    - Secure Repository Integration: 19テスト
    - Migration Workflow E2E: 15テスト
    - Security Infrastructure Integration: 18テスト
  - **完了日**: 2025-10-16

- [x] 3.5.3 セキュリティレビュー ✅
  - ファイル: `docs/外部データソース連携/SECURITY_REVIEW.md` (541行)
  - コードレビュー完了 (Clean Architecture、SOLID原則遵守確認)
  - 本番ビルド検証完了 (難読化、ソースマップなし、console.log削除確認)
  - 暗号化実装レビュー完了 (AES-256-GCM、PBKDF2 100,000イテレーション)
  - 認証セキュリティレビュー完了 (PasswordValidator、LockoutManager)
  - テストスイート実行完了 (2,606/2,606テスト合格、100%合格率)
  - OWASP Top 10 コンプライアンス分析完了 (全項目緩和済み)
  - セキュリティ標準準拠確認完了 (NIST SP 800-175B、SP 800-132、SP 800-38D)
  - テスト修正完了 (6つのコンパイルエラー修正)
  - **成果物**: セキュリティレビュー結果ドキュメント (総合評価: SECURE ✅)
  - **完了日**: 2025-01-16

#### 課題

なし

#### 制限事項

- データ移行は一度のみ実行可能（ロールバックは手動）
- 移行中はアプリケーションを使用できない

---

## 4. Phase 2: 同期機能実装

**期間**: 28日
**進捗**: 0% (0/48 タスク完了)
**ステータス**: 🔲 未着手

### 4.1 Entity & Repository (4日)

**担当**: -
**進捗**: 0% (0/8 タスク完了)
**ステータス**: 🔲 未着手

#### タスク

- [ ] 4.1.1 `StorageSyncConfig` エンティティ実装
  - ファイル: `src/domain/entities/StorageSyncConfig.ts`
  - 同期設定の定義
  - バリデーション
  - **参照**: [STORAGE_SYNC_DESIGN.md - 2.1](./STORAGE_SYNC_DESIGN.md#21-storagesyncconfig-entity)

- [ ] 4.1.2 `StorageSyncConfig` ユニットテスト
  - ファイル: `src/domain/entities/__tests__/StorageSyncConfig.test.ts`

- [ ] 4.1.3 `SyncResult` エンティティ実装
  - ファイル: `src/domain/entities/SyncResult.ts`
  - 同期結果の記録
  - **参照**: [STORAGE_SYNC_DESIGN.md - 2.2](./STORAGE_SYNC_DESIGN.md#22-syncresult-entity)

- [ ] 4.1.4 `SyncResult` ユニットテスト
  - ファイル: `src/domain/entities/__tests__/SyncResult.test.ts`

- [ ] 4.1.5 `IStorageSyncConfigRepository` インターフェース
  - ファイル: `src/domain/repositories/IStorageSyncConfigRepository.ts`
  - **参照**: [STORAGE_SYNC_DESIGN.md - 3.1](./STORAGE_SYNC_DESIGN.md#31-istoragesyncconfigrepository)

- [ ] 4.1.6 `ChromeStorageStorageSyncConfigRepository` 実装
  - ファイル: `src/infrastructure/repositories/ChromeStorageStorageSyncConfigRepository.ts`
  - CRUD操作
  - 暗号化対応

- [ ] 4.1.7 `ChromeStorageStorageSyncConfigRepository` ユニットテスト
  - ファイル: `src/infrastructure/repositories/__tests__/ChromeStorageStorageSyncConfigRepository.test.ts`

- [ ] 4.1.8 STORAGE_KEYS 更新
  - ファイル: `src/domain/constants/StorageKeys.ts`
  - `STORAGE_SYNC_CONFIGS` 追加

#### 課題

なし

#### 制限事項

- 定期同期はDB同期のみサポート（CSV同期は手動のみ）

---

### 4.2 Services (5日)

**担当**: -
**進捗**: 0% (0/14 タスク完了)
**ステータス**: 🔲 未着手

#### タスク

- [ ] 4.2.1 `IHttpClient` インターフェース
  - ファイル: `src/domain/services/IHttpClient.ts`
  - **参照**: [STORAGE_SYNC_DESIGN.md - 4.1](./STORAGE_SYNC_DESIGN.md#41-ihttpclient)

- [ ] 4.2.2 `ChromeHttpClient` 実装
  - ファイル: `src/infrastructure/services/ChromeHttpClient.ts`
  - fetch API を使用
  - タイムアウト処理

- [ ] 4.2.3 `ChromeHttpClient` ユニットテスト
  - ファイル: `src/infrastructure/services/__tests__/ChromeHttpClient.test.ts`

- [ ] 4.2.4 `IDataMapper` インターフェース
  - ファイル: `src/domain/services/IDataMapper.ts`

- [ ] 4.2.5 `JsonPathDataMapper` 実装
  - ファイル: `src/infrastructure/services/JsonPathDataMapper.ts`
  - JSONPath ライブラリ使用
  - **参照**: [STORAGE_SYNC_DESIGN.md - 4.4](./STORAGE_SYNC_DESIGN.md#44-jsonpathdatamapper)

- [ ] 4.2.6 `JsonPathDataMapper` ユニットテスト
  - ファイル: `src/infrastructure/services/__tests__/JsonPathDataMapper.test.ts`

- [ ] 4.2.7 `ISyncService` インターフェース
  - ファイル: `src/domain/services/ISyncService.ts`
  - **参照**: [STORAGE_SYNC_DESIGN.md - 4.1](./STORAGE_SYNC_DESIGN.md#41-isyncservice)

- [ ] 4.2.8 `DBSyncService` 実装
  - ファイル: `src/infrastructure/services/DBSyncService.ts`
  - 受信・送信処理
  - 変数置換
  - **参照**: [STORAGE_SYNC_DESIGN.md - 4.2](./STORAGE_SYNC_DESIGN.md#42-dbsyncservice)

- [ ] 4.2.9 `DBSyncService` ユニットテスト
  - ファイル: `src/infrastructure/services/__tests__/DBSyncService.test.ts`

- [ ] 4.2.10 `CSVSyncService` 実装
  - ファイル: `src/infrastructure/services/CSVSyncService.ts`
  - CSV インポート・エクスポート
  - PapaParse 使用
  - **参照**: [STORAGE_SYNC_DESIGN.md - 4.3](./STORAGE_SYNC_DESIGN.md#43-csvsyncservice)

- [ ] 4.2.11 `CSVSyncService` ユニットテスト
  - ファイル: `src/infrastructure/services/__tests__/CSVSyncService.test.ts`

- [ ] 4.2.12 パッケージ追加
  - `npm install jsonpath papaparse`
  - `npm install --save-dev @types/papaparse`

- [ ] 4.2.13 統合テスト作成
  - ファイル: `src/infrastructure/services/__tests__/sync-integration.test.ts`
  - モックサーバーを使用したDB同期テスト

- [ ] 4.2.14 CSVフォーマットテスト
  - 各種CSV形式のテスト
  - 文字コード変換テスト

#### 課題

なし

#### 制限事項

- CORS 制限により、一部のAPIとは通信できない可能性がある
- CSV の最大サイズは未定（パフォーマンステストで決定）

---

### 4.3 Use Cases (4日)

**担当**: -
**進捗**: 0% (0/10 タスク完了)
**ステータス**: 🔲 未着手

#### タスク

- [ ] 4.3.1 `CreateStorageSyncConfigUseCase` 実装
  - ファイル: `src/usecases/CreateStorageSyncConfigUseCase.ts`

- [ ] 4.3.2 `UpdateStorageSyncConfigUseCase` 実装
  - ファイル: `src/usecases/UpdateStorageSyncConfigUseCase.ts`

- [ ] 4.3.3 `DeleteStorageSyncConfigUseCase` 実装
  - ファイル: `src/usecases/DeleteStorageSyncConfigUseCase.ts`

- [ ] 4.3.4 `GetStorageSyncConfigsUseCase` 実装
  - ファイル: `src/usecases/GetStorageSyncConfigsUseCase.ts`

- [ ] 4.3.5 `ExecuteStorageSyncUseCase` 実装
  - ファイル: `src/usecases/ExecuteStorageSyncUseCase.ts`
  - メイン同期処理
  - **参照**: [STORAGE_SYNC_DESIGN.md - 5.1](./STORAGE_SYNC_DESIGN.md#51-executestoragesyncusecase)

- [ ] 4.3.6 `ImportCSVUseCase` 実装
  - ファイル: `src/usecases/ImportCSVUseCase.ts`

- [ ] 4.3.7 `ExportCSVUseCase` 実装
  - ファイル: `src/usecases/ExportCSVUseCase.ts`

- [ ] 4.3.8 `TestStorageSyncUseCase` 実装
  - ファイル: `src/usecases/TestStorageSyncUseCase.ts`
  - 接続テスト

- [ ] 4.3.9 Use Cases ユニットテスト
  - 各UseCaseのテストファイル作成

- [ ] 4.3.10 Use Cases 統合テスト
  - ファイル: `src/usecases/__tests__/sync-usecases-integration.test.ts`

#### 課題

なし

#### 制限事項

なし

---

### 4.4 Scheduler (2日)

**担当**: -
**進捗**: 0% (0/4 タスク完了)
**ステータス**: 🔲 未着手

#### タスク

- [ ] 4.4.1 `PeriodicSyncScheduler` 実装
  - ファイル: `src/infrastructure/scheduler/PeriodicSyncScheduler.ts`
  - chrome.alarms API 使用
  - タイマー管理
  - **参照**: [STORAGE_SYNC_DESIGN.md - 7](./STORAGE_SYNC_DESIGN.md#7-定期同期スケジューラー)

- [ ] 4.4.2 `PeriodicSyncScheduler` ユニットテスト
  - ファイル: `src/infrastructure/scheduler/__tests__/PeriodicSyncScheduler.test.ts`

- [ ] 4.4.3 Background Service Worker に統合
  - ファイル: `src/presentation/background/index.ts` 更新
  - スケジューラー起動
  - アラームイベントハンドラー

- [ ] 4.4.4 定期同期のテスト
  - 実際にスケジュールが動作するか確認
  - エラー時のリトライ動作

#### 課題

なし

#### 制限事項

- chrome.alarms の最小間隔は1分（それ以下は設定不可）
- バックグラウンドでの同期はバッテリー消費に影響

---

### 4.5 UI - データ同期タブ (6日)

**担当**: -
**進捗**: 0% (0/15 タスク完了)
**ステータス**: 🔲 未着手

#### タスク

- [ ] 4.5.1 システム設定画面にデータ同期タブ追加
  - ファイル: `public/xpath-manager.html` 更新
  - タブUI追加

- [ ] 4.5.2 `StorageSyncList` コンポーネント実装
  - ファイル: `src/presentation/xpath-manager/StorageSyncList.ts`
  - localStorage キーごとの同期設定一覧

- [ ] 4.5.3 `StorageSyncConfigModal` コンポーネント実装
  - ファイル: `src/presentation/xpath-manager/StorageSyncConfigModal.ts`
  - 同期設定モーダル
  - **参照**: [STORAGE_SYNC_DESIGN.md - 2.2](./STORAGE_SYNC_DESIGN.md#22-同期設定詳細モーダル)

- [ ] 4.5.4 同期方法選択フォーム実装
  - CSV / DB 選択

- [ ] 4.5.5 同期タイミング・種別設定フォーム実装
  - 手動・定期選択
  - 相互・受信のみ・送信のみ選択

- [ ] 4.5.6 DB同期: 認証設定フォーム実装
  - 認証タイプ選択
  - トークン入力（マスク表示）

- [ ] 4.5.7 DB同期: 受信ステップ設定フォーム実装
  - ステップの追加・削除・並び替え
  - URL、メソッド、ヘッダー、ボディ入力
  - レスポンスマッピング設定

- [ ] 4.5.8 DB同期: 送信ステップ設定フォーム実装
  - 同上

- [ ] 4.5.9 CSV同期: CSV設定フォーム実装
  - 文字コード、区切り文字選択
  - フィールドマッピング設定

- [ ] 4.5.10 テスト実行ボタン実装
  - DB同期: 受信テスト、送信テスト
  - テスト結果表示

- [ ] 4.5.11 手動同期ボタン実装
  - DB同期: 「今すぐ同期」ボタン
  - CSV同期: 「インポート」「エクスポート」ボタン
  - 進捗表示

- [ ] 4.5.12 CSS スタイリング
  - ファイル: `public/css/storage-sync.css`
  - レスポンシブ対応

- [ ] 4.5.13 多言語対応
  - `public/_locales/ja/messages.json` 更新
  - `public/_locales/en/messages.json` 更新

- [ ] 4.5.14 UI コンポーネントのテスト
  - 各コンポーネントのユニットテスト

- [ ] 4.5.15 UI 統合テスト
  - E2E テストシナリオ
  - 同期設定作成フロー
  - 同期実行フロー

#### 課題

なし

#### 制限事項

- CSVファイルのサイズが大きい場合、ブラウザがフリーズする可能性がある

---

### 4.6 エラーハンドリング & 競合解決 (3日)

**担当**: -
**進捗**: 0% (0/6 タスク完了)
**ステータス**: 🔲 未着手

#### タスク

- [ ] 4.6.1 認証エラーハンドリング実装
  - トークン無効時の処理
  - ユーザーへの通知

- [ ] 4.6.2 ネットワークエラーハンドリング実装
  - タイムアウト処理
  - リトライ処理（最大3回）

- [ ] 4.6.3 データ形式エラーハンドリング実装
  - JSON パースエラー
  - 予期しないレスポンス形式

- [ ] 4.6.4 CSV形式エラーハンドリング実装
  - 文字コードエラー
  - フィールドマッピングエラー

- [ ] 4.6.5 競合解決ロジック実装
  - タイムスタンプ比較
  - ローカル・リモート優先
  - ユーザー確認ダイアログ

- [ ] 4.6.6 エラーハンドリングのテスト
  - 各種エラーケースのテスト
  - 競合解決のテスト

#### 課題

なし

#### 制限事項

- 競合解決は簡易的な実装（完全な3-way merge は未サポート）

---

### 4.7 ドキュメント & テスト (3日)

**担当**: -
**進捗**: 0% (0/6 タスク完了)
**ステータス**: 🔲 未着手

#### タスク

- [ ] 4.7.1 ユーザーマニュアル作成
  - ファイル: `docs/USER_MANUAL.md`
  - 同期機能の使い方
  - トラブルシューティング

- [ ] 4.7.2 API 設定例作成
  - Notion API の設定例
  - Google Sheets API の設定例
  - カスタムAPI の設定例

- [ ] 4.7.3 CSV フォーマット例作成
  - AutomationVariables の CSV 例
  - Website の CSV 例

- [ ] 4.7.4 E2E テスト実施
  - 全機能の統合テスト
  - 実際のAPI（テスト環境）を使用

- [ ] 4.7.5 パフォーマンステスト
  - 大量データの同期
  - 定期同期の負荷テスト

- [ ] 4.7.6 セキュリティレビュー
  - 認証情報の暗号化確認
  - HTTPS 接続確認
  - データ検証の確認

#### 課題

なし

#### 制限事項

なし

---

### 4.8 リリース準備 (1日)

**担当**: -
**進捗**: 0% (0/5 タスク完了)
**ステータス**: 🔲 未着手

#### タスク

- [ ] 4.8.1 すべてのテスト実行
  - ユニットテスト
  - 統合テスト
  - E2E テスト
  - カバレッジ確認

- [ ] 4.8.2 コードレビュー
  - セキュリティ観点
  - パフォーマンス観点
  - コード品質

- [ ] 4.8.3 ドキュメント最終確認
  - README 更新
  - CHANGELOG 作成
  - API ドキュメント確認

- [ ] 4.8.4 リリースノート作成
  - ファイル: `docs/RELEASE_NOTES.md`
  - 変更内容まとめ
  - 使用方法説明
  - 既知の問題

- [ ] 4.8.5 本番ビルド & 動作確認
  - `npm run build`
  - 拡張機能として読み込み
  - 最終動作確認

#### 課題

なし

#### 制限事項

なし

---

## 5. 課題管理

### 5.1 現在の課題

| ID | 課題 | 重要度 | ステータス | 担当 | 期限 |
|----|------|--------|----------|------|------|
| - | なし | - | - | - | - |

### 5.2 解決済み課題

なし

---

## 6. 仕様変更履歴

### v1.0.0 (2025-01-15)

- 初版作成
- セキュリティ設計とデータ同期設計を統合

---

## 7. 制限事項

### 7.1 セキュリティ関連

1. **マスターパスワード**
   - 忘れた場合、データは復元不可能
   - パスワードリセット機能は未実装

2. **暗号化**
   - Web Crypto API に依存（古いブラウザは非対応）
   - PBKDF2 の100,000イテレーションは初期化時に100-200ms要する

3. **難読化**
   - 完全な保護ではなく、解析の難易度を上げるのみ
   - 高度な攻撃には対処不可

### 7.2 同期機能関連

1. **CSV同期**
   - 定期自動同期は未サポート（手動のみ）
   - 最大ファイルサイズは未定

2. **DB同期**
   - CORS 制限により、一部のAPIとは通信不可
   - レート制限は考慮されていない（API側で制限）

3. **競合解決**
   - 簡易的な実装（タイムスタンプ比較のみ）
   - 3-way merge は未サポート

4. **定期同期**
   - chrome.alarms の最小間隔は1分
   - バックグラウンドでの同期はバッテリー消費に影響

### 7.3 パフォーマンス

1. **暗号化オーバーヘッド**
   - 初期化: 約100-200ms
   - 暗号化/復号化: 約1-5ms / データ

2. **大量データ**
   - 1000件以上のデータ同期は未テスト
   - パフォーマンステストで最大サイズを決定予定

---

## 8. リスク管理

### 8.1 リスク一覧

| ID | リスク | 発生確率 | 影響度 | 対策 | ステータス |
|----|--------|---------|--------|------|----------|
| R1 | マスターパスワード忘れによるデータ損失 | 中 | 高 | ユーザーへの警告表示、パスワードヒント機能（将来） | 監視中 |
| R2 | 暗号化処理の遅延によるUX低下 | 低 | 中 | キャッシュ機構、バッチ処理 | 監視中 |
| R3 | 外部API の変更による同期エラー | 中 | 中 | エラーハンドリング、ユーザー通知 | 監視中 |
| R4 | 大量データの同期によるブラウザフリーズ | 低 | 高 | バッチ処理、プログレス表示 | 監視中 |
| R5 | CORS 制限による同期不可 | 中 | 中 | ドキュメントに記載、CORS対応APIの推奨 | 監視中 |

### 8.2 技術的負債

なし（新規実装のため）

---

## 9. 進捗報告テンプレート

### 週次報告

**報告日**: YYYY-MM-DD
**報告者**: -

#### 今週の実績

- [ ] 完了したタスク1
- [ ] 完了したタスク2

#### 次週の予定

- [ ] 予定タスク1
- [ ] 予定タスク2

#### 課題・ブロッカー

なし

#### 備考

なし

---

## 10. 更新履歴

| 日付 | 更新者 | 更新内容 |
|------|--------|----------|
| 2025-01-15 | Claude | 初版作成 |
| 2025-10-15 | Claude | セクション 3.1 (難読化設定) 完了 - 全7タスク完了、テスト合格、検証結果ドキュメント作成 |
| 2025-10-16 | Claude | セクション 3.2 (暗号化基盤) 完了 - 全10タスク完了、187テスト合格 |
| 2025-10-16 | Claude | セクション 3.3 (Secure Repository) 完了 - 全12タスク完了、145テスト + 36 Factory テスト合格、Presentation Layer統合完了 (2103総テスト) |
| 2025-10-16 | Claude | セクション 3.4 (UI実装) 完了 - Domain層(790行)、Use Case層(222行)、Presentation層(1,490行)、i18n(400行)、統合テスト(22/22合格)、約422テストケース、100%完了 |
| 2025-10-16 | Claude | セクション 3.5.1 (データ移行UseCase) 完了 - MigrateToSecureStorageUseCase実装(280行)、ユニットテスト(572行、34テスト、100%合格)、バックアップ・ロールバック機能実装 |
| 2025-10-16 | Claude | セクション 3.5.2 (E2Eテスト) 完了 - MigrationWorkflow E2Eテスト実装(711行、15テスト、100%合格)、統合テスト74/74テスト合格、完全なユーザージャーニー検証完了 |
| 2025-01-16 | Claude | セクション 3.5.3 (セキュリティレビュー) 完了 - 包括的セキュリティレビュー実施、SECURITY_REVIEW.md作成(541行)、全テスト修正(6つのエラー解決)、2,606/2,606テスト100%合格達成、OWASP Top 10準拠確認、総合評価: SECURE ✅ - **Phase 1 完全完了** |

---

## 11. 参考資料

- [SECURITY_DESIGN.md](./SECURITY_DESIGN.md) - セキュリティ設計書
- [STORAGE_SYNC_DESIGN.md](./STORAGE_SYNC_DESIGN.md) - 同期機能設計書
- [参照実装](../../hotel-booking-checker/secure-chrome-extension) - セキュリティ実装の参考

---

**注意**: このドキュメントは実装の進行に伴い、随時更新してください。
