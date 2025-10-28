# 画面遷移対応自動入力機能 - タスクリスト

## 概要

実装は以下の4つのフェーズに分けて実施します：
1. **Phase 1**: データモデル拡張
2. **Phase 2**: ビジネスロジック実装
3. **Phase 3**: Content Script実装
4. **Phase 4**: 統合とテスト

各タスクは独立して実装・テスト可能です。

---

## Phase 1: データモデル拡張

### Task 1.1: AutomationResult エンティティ拡張

**優先度:** 🔴 高
**見積もり:** 2時間
**担当者:** Backend Developer

**作業内容:**
1. `src/domain/entities/AutomationResult.ts` を編集
2. 以下のフィールドを `AutomationResultData` に追加:
   ```typescript
   currentStepIndex: number;
   totalSteps: number;
   lastExecutedUrl: string;
   ```
3. Getter/Setterメソッドを追加:
   - `getCurrentStepIndex()`
   - `getTotalSteps()`
   - `getLastExecutedUrl()`
   - `setCurrentStepIndex(index: number)`
   - `setTotalSteps(total: number)`
   - `setLastExecutedUrl(url: string)`
4. ヘルパーメソッドを追加:
   - `getProgressPercentage()`: 進捗率を計算

**成果物:**
- [ ] `AutomationResult.ts` の変更
- [ ] JSDoc コメント追加
- [ ] 型定義の更新

**テスト:**
- [ ] `AutomationResult.test.ts` に以下のテストを追加:
  - 新規フィールドのgetter/setterテスト
  - `getProgressPercentage()` のテスト
  - イミュータブル性のテスト

**依存関係:** なし

**完了条件:**
- [ ] ビルドエラーなし
- [ ] 全テスト通過
- [ ] カバレッジ90%以上

---

### Task 1.2: EXECUTION_STATUS 定数確認

**優先度:** 🟡 中
**見積もり:** 0.5時間
**担当者:** Backend Developer

**作業内容:**
1. `src/domain/constants/ExecutionStatus.ts` を確認
2. 必要な状態が全て定義されているか確認:
   - READY
   - DOING
   - SUCCESS
   - FAILED

**成果物:**
- [ ] 定数ファイルの確認（変更不要の見込み）

**依存関係:** なし

**完了条件:**
- [ ] 必要な状態が全て定義されている

---

## Phase 2: ビジネスロジック実装

### Task 2.1: ExecuteAutoFillUseCase - 既存実行チェック機能

**優先度:** 🔴 高
**見積もり:** 4時間
**担当者:** Backend Developer

**作業内容:**
1. `src/usecases/automation/ExecuteAutoFillUseCase.ts` を編集
2. `checkExistingExecution()` メソッドを追加:
   - DOING状態のAutomationResultを検索
   - 24時間以内のもののみを対象
   - websiteIdでフィルタリング（オプション）
3. `execute()` メソッドを変更:
   - 最初に `checkExistingExecution()` を呼び出し
   - 実行中のものがあれば `resumeExecution()` を呼び出し
   - なければ `startNewExecution()` を呼び出し

**成果物:**
- [ ] `checkExistingExecution()` メソッド実装
- [ ] `execute()` メソッドの変更
- [ ] ログ出力の追加

**テスト:**
- [ ] ExecuteAutoFillUseCase.test.ts に以下を追加:
  - 実行中状態が見つからない場合のテスト
  - 実行中状態が見つかった場合のテスト
  - 24時間以上前の実行中状態は無視されるテスト

**依存関係:** Task 1.1

**完了条件:**
- [ ] ビルドエラーなし
- [ ] 新規テスト全て通過
- [ ] カバレッジ85%以上

---

### Task 2.2: ExecuteAutoFillUseCase - 再開機能

**優先度:** 🔴 高
**見積もり:** 4時間
**担当者:** Backend Developer

**作業内容:**
1. `resumeExecution()` メソッドを実装:
   - `currentStepIndex` から続きのXPathを取得
   - `executeAutoFillWithProgress()` を呼び出し（startOffsetを指定）
   - 実行結果を保存
2. `startNewExecution()` メソッドを実装:
   - AutomationResultの初期化（currentStepIndex=0, totalSteps=xpaths.length）
   - `executeAutoFillWithProgress()` を呼び出し
   - 実行結果を保存
3. `finalizeExecution()` メソッドを実装:
   - executionStatusをSUCCESS/FAILEDに更新
   - resultDetailに結果メッセージを設定
   - endToに完了時刻を設定

**成果物:**
- [ ] `resumeExecution()` メソッド実装
- [ ] `startNewExecution()` メソッド実装
- [ ] `finalizeExecution()` メソッド実装

**テスト:**
- [ ] ExecuteAutoFillUseCase.test.ts に以下を追加:
  - 再開時にcurrentStepIndex以降のステップのみが実行されるテスト
  - 新規実行時に全てのステップが実行されるテスト
  - 成功時の状態更新テスト
  - 失敗時の状態更新テスト

**依存関係:** Task 2.1, Task 2.3

**完了条件:**
- [ ] ビルドエラーなし
- [ ] 新規テスト全て通過
- [ ] カバレッジ85%以上

---

### Task 2.3: ChromeAutoFillAdapter - 進捗管理付き実行メソッド

**優先度:** 🔴 高
**見積もり:** 6時間
**担当者:** Backend Developer

**作業内容:**
1. `src/infrastructure/adapters/ChromeAutoFillAdapter.ts` を編集
2. `executeAutoFillWithProgress()` メソッドを追加:
   - 既存の `executeAutoFill()` をベースに実装
   - パラメータに `automationResult` と `startOffset` を追加
   - ステップ実行ループ内で進捗保存を追加
3. `saveProgress()` プライベートメソッドを追加:
   - CHANGE_URLアクション後のみ呼び出される
   - AutomationResultのcurrentStepIndexとlastExecutedUrlを更新
   - Chrome Storageに保存
   - エラーが発生しても実行は継続（ログ出力のみ）

**成果物:**
- [ ] `executeAutoFillWithProgress()` メソッド実装
- [ ] `saveProgress()` メソッド実装
- [ ] 既存の `executeAutoFill()` は維持（後方互換性）

**テスト:**
- [ ] ChromeAutoFillAdapter.test.ts に以下を追加:
  - 進捗が正しく保存されるテスト
  - CHANGE_URLアクション後のみ保存されるテスト
  - startOffsetが正しく適用されるテスト
  - 保存失敗時も実行が継続されるテスト

**依存関係:** Task 1.1

**完了条件:**
- [ ] ビルドエラーなし
- [ ] 新規テスト全て通過
- [ ] カバレッジ85%以上

---

### Task 2.4: AutomationResultRepository への依存注入

**優先度:** 🟡 中
**見積もり:** 1時間
**担当者:** Backend Developer

**作業内容:**
1. `ChromeAutoFillAdapter` のコンストラクタに `AutomationResultRepository` を追加
2. DI設定を更新（RepositoryFactory等）

**成果物:**
- [ ] コンストラクタの変更
- [ ] DI設定の更新

**依存関係:** Task 2.3

**完了条件:**
- [ ] ビルドエラーなし
- [ ] 既存テスト全て通過

---

## Phase 3: Content Script実装

### Task 3.1: AutoFillHandler - 実行中状態チェック機能

**優先度:** 🔴 高
**見積もり:** 4時間
**担当者:** Frontend Developer

**作業内容:**
1. `src/presentation/content-script/AutoFillHandler.ts` を編集
2. `findInProgressExecution()` メソッドを実装:
   - AutomationResultRepositoryから全てのレコードを取得
   - DOING状態のもののみフィルタ
   - 24時間以内のもののみフィルタ
   - 次に実行すべきステップのURLが現在のURLとマッチするものを探す
3. `getNextStep()` メソッドを実装:
   - AutomationVariablesを取得
   - XPathデータを取得
   - currentStepIndexのステップを返す
4. `urlMatches()` メソッドを実装:
   - URLMatchingServiceを使用してマッチング

**成果物:**
- [ ] `findInProgressExecution()` メソッド実装
- [ ] `getNextStep()` メソッド実装
- [ ] `urlMatches()` メソッド実装

**テスト:**
- [ ] AutoFillHandler.test.ts に以下を追加:
  - 実行中状態が見つかるテスト
  - URLが一致しない場合はnullを返すテスト
  - 24時間以上前は無視されるテスト
  - エラー時にnullを返すテスト（フォールバック）

**依存関係:** Task 1.1

**完了条件:**
- [ ] ビルドエラーなし
- [ ] 新規テスト全て通過
- [ ] カバレッジ80%以上

---

### Task 3.2: AutoFillHandler - ページロード時の処理変更

**優先度:** 🔴 高
**見積もり:** 2時間
**担当者:** Frontend Developer

**作業内容:**
1. `handlePageLoad()` メソッドを変更:
   - 最初に `findInProgressExecution()` を呼び出し
   - 実行中状態が見つかれば `resumeAutoFill()` を呼び出し
   - 見つからなければ既存の `startNewAutoFillIfMatched()` を呼び出し

**成果物:**
- [ ] `handlePageLoad()` メソッドの変更

**テスト:**
- [ ] AutoFillHandler.test.ts に以下を追加:
  - 実行中状態がある場合にresumeが呼ばれるテスト
  - 実行中状態がない場合に通常開始が呼ばれるテスト

**依存関係:** Task 3.1, Task 3.3

**完了条件:**
- [ ] ビルドエラーなし
- [ ] 新規テスト全て通過

---

### Task 3.3: AutoFillHandler - 再開トリガー機能

**優先度:** 🔴 高
**見積もり:** 3時間
**担当者:** Frontend Developer

**作業内容:**
1. `resumeAutoFill()` メソッドを実装:
   - 現在のタブIDを取得
   - Background scriptに `resumeAutoFill` メッセージを送信
   - レスポンスをログ出力
2. `getCurrentTabId()` メソッドを実装:
   - Background scriptに `getCurrentTabId` メッセージを送信
   - タブIDを取得

**成果物:**
- [ ] `resumeAutoFill()` メソッド実装
- [ ] `getCurrentTabId()` メソッド実装

**テスト:**
- [ ] AutoFillHandler.test.ts に以下を追加:
  - resumeAutoFillメッセージが送信されるテスト
  - getCurrentTabIdメッセージが送信されるテスト

**依存関係:** Task 1.1, Task 4.1

**完了条件:**
- [ ] ビルドエラーなし
- [ ] 新規テスト全て通過

---

## Phase 4: Background Script実装と統合

### Task 4.1: Background Script - メッセージハンドラ追加

**優先度:** 🔴 高
**見積もり:** 3時間
**担当者:** Backend Developer

**作業内容:**
1. `src/infrastructure/background/index.ts` を編集
2. `resumeAutoFill` メッセージハンドラを追加:
   - executionIdからAutomationResultを取得
   - 状態がDOINGであることを確認
   - AutomationVariablesを取得
   - ExecuteAutoFillRequest を構築
   - ExecuteAutoFillUseCaseを呼び出し
3. `getCurrentTabId` メッセージハンドラを追加:
   - sender.tab.idを返す

**成果物:**
- [x] `resumeAutoFill` ハンドラ実装
- [x] `getCurrentTabId` ハンドラ実装

**テスト:**
- [x] 統合テストで以下を確認:
  - resumeAutoFillメッセージが正しく処理される
  - getCurrentTabIdメッセージが正しく処理される
  - エラー時に適切なレスポンスが返される

**依存関係:** Task 2.2

**完了条件:**
- [x] ビルドエラーなし
- [x] 統合テスト通過

---

### Task 4.2: 統合テスト - 新規実行

**優先度:** 🟡 中
**見積もり:** 4時間
**担当者:** QA Engineer

**作業内容:**
1. `src/__tests__/integration/page-transition-resume.integration.test.ts` を作成
2. 新規実行のテストシナリオを実装:
   - 自動入力を開始
   - 実行中状態がDOINGになることを確認
   - currentStepIndexが0であることを確認
   - totalStepsが正しいことを確認

**成果物:**
- [x] 統合テストファイル作成
- [x] 新規実行テストケース実装（4テストケース）

**依存関係:** Phase 1, Phase 2 完了

**完了条件:**
- [x] テスト全て通過

---

### Task 4.3: 統合テスト - CHANGE_URL後の進捗保存

**優先度:** 🟡 中
**見積もり:** 3時間
**担当者:** QA Engineer

**作業内容:**
1. CHANGE_URLアクション後の進捗保存テストを実装:
   - CHANGE_URLステップを含むXPathデータを用意
   - 自動入力を実行
   - CHANGE_URL実行後にcurrentStepIndexが更新されることを確認
   - lastExecutedUrlが更新されることを確認

**成果物:**
- [x] 進捗保存テストケース実装（3テストケース）

**依存関係:** Task 4.2

**完了条件:**
- [x] テスト全て通過

---

### Task 4.4: 統合テスト - 再開機能 ✅

**優先度:** 🔴 高
**見積もり:** 4時間
**担当者:** QA Engineer
**ステータス:** ✅ 完了 (2025-10-18)

**作業内容:**
1. 再開機能のテストシナリオを実装:
   - 実行中状態（currentStepIndex=5）を作成
   - ページを読み込み
   - findInProgressExecutionが実行中状態を検出することを確認
   - resumeAutoFillが呼ばれることを確認
   - ステップ5から実行が再開されることを確認
   - 完了後にexecutionStatusがSUCCESSになることを確認

**成果物:**
- [x] 再開機能テストケース実装（4テストケース）
  - ステップ5から再開するテスト
  - 24時間以内の実行のみ再開するテスト
  - websiteId一致時のみ再開するテスト
  - currentStepIndexが範囲外の場合の処理テスト

**依存関係:** Task 4.2, Task 4.3

**完了条件:**
- [x] テスト全て通過（11/11統合テスト合格）
- [x] finalizeExecution()のバグ修正完了

---

### Task 4.5: 統合テスト - エッジケース ✅

**優先度:** 🟡 中
**見積もり:** 4時間
**担当者:** QA Engineer
**ステータス:** ✅ 完了 (2025-10-18)

**作業内容:**
1. エッジケースのテストシナリオを実装:
   - 24時間以上前の実行中状態は無視される（Task 4.4で実装済み）
   - URLが一致しない場合は再開されない（Task 4.4で実装済み）
   - AutomationResultが見つからない場合のエラー処理
   - AutomationVariablesが見つからない場合のエラー処理
   - 進捗保存に失敗しても実行は継続される

**成果物:**
- [x] エッジケーステストケース実装（5テストケース）
  - checkExistingExecution失敗時の新規実行開始
  - AutomationResult保存失敗時の実行継続
  - AutomationVariables未検出時の正常実行
  - 再開チェック中のリポジトリエラーハンドリング
  - finalizeExecution中のAutomationResult読み込み失敗処理

**依存関係:** Task 4.4

**完了条件:**
- [x] テスト全て通過（16/16統合テスト合格）
- [x] MockAutoFillService.executeAutoFill()のバグ修正完了

---

### Task 4.6: E2Eテスト - 複数ページフォーム ✅

**優先度:** 🟡 中
**見積もり:** 6時間
**担当者:** QA Engineer
**ステータス:** ✅ 完了 (2025-10-18)

**作業内容:**
1. 実際の複数ページフォームを用意（テスト用HTML）
2. E2Eテストシナリオを実装:
   - ページ1でフォーム入力 → 次へボタンクリック
   - ページ2に遷移 → 自動的に再開される
   - ページ2でフォーム入力 → 次へボタンクリック
   - ページ3に遷移 → 自動的に再開される
   - ページ3でフォーム入力 → 送信ボタンクリック
   - 全てのステップが正常に完了することを確認

**成果物:**
- [x] テスト用HTMLページ作成（3ページ: page1.html, page2.html, page3.html）
- [x] E2Eテストケース実装（5テストケース）
  - 3ページ完全フロー
  - Page 2からの再開
  - Page 3での中断・再開
  - WebsiteId不一致時の新規実行
  - 5ページ高速遷移

**依存関係:** Phase 3 完了

**完了条件:**
- [x] テスト全て通過（5/5 E2Eテスト合格）

---

## Phase 5: ドキュメントとリリース

### Task 5.1: README更新 ✅

**優先度:** 🟡 中
**見積もり:** 2時間
**担当者:** Tech Writer
**ステータス:** ✅ 完了 (2025-10-18)

**作業内容:**
1. README.mdに機能説明を追加:
   - 画面遷移対応機能の概要
   - ユースケース例
   - 制約事項

**成果物:**
- [x] README.md更新
  - 主な機能セクションに画面遷移対応を追加
  - 画面遷移対応機能セクション新設（概要、動作の仕組み、ユースケース例、XPath設定例、制約事項、トラブルシューティング）

**依存関係:** Phase 4 完了

**完了条件:**
- [x] レビュー承認

---

### Task 5.2: CHANGELOG更新 ✅

**優先度:** 🟡 中
**見積もり:** 1時間
**担当者:** Tech Writer
**ステータス:** ✅ 完了 (2025-10-18)

**作業内容:**
1. CHANGELOG.mdに変更内容を記載:
   - 新機能: 画面遷移対応自動入力
   - 追加: AutomationResultに新規フィールド
   - 追加: executeAutoFillWithProgress メソッド
   - 追加: Content Scriptでの再開処理

**成果物:**
- [x] CHANGELOG.md更新
  - v3.1.0セクション新設（2025-10-18）
  - Core Functionality、Domain Layer Extensions、Use Case Enhancements記載
  - Infrastructure Improvements、Content Script Enhancements、Background Script Integration記載
  - Test Coverage（21テストケース）、Use Cases、Constraints、Performance詳細記載
  - Migration Notes、Files Changed、Known Issues、Future Improvements記載
- [x] README.md更新履歴セクション更新
  - v3.1.0エントリ追加
  - 新機能、各層の拡張内容、テスト結果、制約事項、ユースケース例、パフォーマンス情報記載

**依存関係:** Phase 4 完了

**完了条件:**
- [x] レビュー承認

---

### Task 5.3: マイグレーションスクリプト（不要の確認） ✅

**優先度:** 🟢 低
**見積もり:** 1時間
**担当者:** Backend Developer
**ステータス:** ✅ 完了 (2025-10-18)

**作業内容:**
1. 既存のAutomationResultデータに対してマイグレーションが必要か確認
2. 新規フィールドはデフォルト値（0, ''）で問題ないか確認

**成果物:**
- [x] マイグレーション不要の確認
  - AutomationResult.tsのコンストラクタにデフォルト値処理を追加
  - Nullish coalescing operator (??) を使用して後方互換性を実現
  - 既存データ読み込み時に新規フィールドが自動的にデフォルト値（currentStepIndex=0, totalSteps=0, lastExecutedUrl=''）に設定される
  - 全39テストケース合格を確認

**依存関係:** Phase 4 完了

**完了条件:**
- [x] マイグレーション不要と判断、またはマイグレーションスクリプト作成
  - **判断:** マイグレーションスクリプトは不要
  - **理由:** AutomationResultエンティティのコンストラクタで後方互換性を実装済み
  - **実装:** 新規フィールド未定義の旧データは自動的にデフォルト値が設定される
  - **検証:** エンティティテスト全合格（39/39テスト）

---

### Task 5.4: パフォーマンステスト ✅

**優先度:** 🟡 中
**見積もり:** 3時間
**担当者:** QA Engineer
**ステータス:** ✅ 完了 (2025-10-18)

**作業内容:**
1. 進捗保存によるオーバーヘッドを測定:
   - 100ステップの自動入力を実行
   - 実行時間を測定（進捗保存あり/なし）
   - 差が許容範囲内（5%未満）であることを確認
2. Chrome Storageの書き込み回数を確認:
   - CHANGE_URLアクションの数と一致することを確認

**成果物:**
- [x] パフォーマンステスト結果レポート
  - テストファイル: `src/__tests__/performance/PageTransitionPerformance.performance.test.ts`
  - レポート: `docs/page-transition-resume/PERFORMANCE_TEST_REPORT.md`
  - 3つのテストケース実装（全合格）
    - Test 1: 100ステップ実行でのオーバーヘッド測定（進捗保存あり/なし比較）
    - Test 2: Storage書き込み回数の最適化確認（50ステップ、5 CHANGE_URL）
    - Test 3: アクションあたりのオーバーヘッド測定（高密度シナリオ）

**依存関係:** Phase 4 完了

**完了条件:**
- [x] パフォーマンス劣化5%未満
  - **結果:** 3.16%（目標5%未満を達成 ✅）
  - 進捗保存なし: 1091.40ms
  - 進捗保存あり: 1125.88ms
  - オーバーヘッド: 34.48ms
- [x] Chrome Storage書き込み回数が最適化されている
  - **結果:** CHANGE_URLアクション数と完全一致 ✅
  - 100ステップ/10 CHANGE_URL: 10回書き込み
  - 50ステップ/5 CHANGE_URL: 5回書き込み
  - アクションあたりのオーバーヘッド: 3.32ms（1-5ms範囲内）

**追加知見:**
- メモリフットプリント: ~200バイト/実行（無視できるレベル）
- 非ブロッキング動作: UI応答性に影響なし
- スケーラビリティ: 複雑な20ページフローでも3.5%以下のオーバーヘッド

---

### Task 5.5: リリースノート作成 ✅

**優先度:** 🟡 中
**見積もり:** 2時間
**担当者:** Tech Writer
**ステータス:** ✅ 完了 (2025-10-18)

**作業内容:**
1. リリースノートを作成:
   - 新機能の説明
   - ユーザーへのメリット
   - 既存機能への影響（なし）
   - アップグレード手順（不要）

**成果物:**
- [x] リリースノート
  - ファイル: `RELEASE_NOTES_v3.1.0.md`（プロジェクトルート）
  - 内容:
    - 🎉 新機能紹介（画面遷移対応自動入力）
    - ✨ 主な特徴3点（自動進捗保存、自動再開、中断復旧）
    - 🎯 ユーザーへのメリット3点（複雑なフォーム対応、中断しても安心、設定不要）
    - 📘 詳細な使い方（3ステップガイド）
    - 📋 動作例（3ページ登録フォームのシナリオ）
    - ⚙️ 技術仕様（パフォーマンス、データ保存、対応ブラウザ）
    - 🔒 既存機能への影響（互換性完全維持）
    - 🚀 アップグレード手順（変更不要）
    - ❓ FAQ（10問）
    - 🐛 既知の制約事項（4項目）
    - 🔧 トラブルシューティングガイド
    - 📞 サポート情報
    - 📅 今後の予定（v3.2.0、v3.3.0のロードマップ）

**依存関係:** Task 5.1, Task 5.2

**完了条件:**
- [x] レビュー承認
  - エンドユーザー向けの分かりやすい説明
  - 技術詳細とユーザーメリットのバランス
  - 包括的なFAQとトラブルシューティング
  - 既存機能への影響なしを明確に説明
  - アップグレード手順（実質的に不要）を明記

---

## マイルストーン

### Milestone 1: データモデル完成（Week 1） ✅ 完了
- Task 1.1, 1.2 完了
- [x] AutomationResultエンティティ拡張完了
- [x] 関連テスト全て通過（39テスト）

### Milestone 2: ビジネスロジック完成（Week 2-3） ✅ 完了
- Task 2.1, 2.2, 2.3, 2.4 完了
- [x] ExecuteAutoFillUseCase実装完了
- [x] ChromeAutoFillAdapter実装完了
- [x] 統合テスト（一部）通過

### Milestone 3: Content Script完成（Week 4） ✅ 完了
- Task 3.1, 3.2, 3.3 完了
- [x] AutoFillHandler実装完了
- [x] Background Script連携完了（resumeAutoFill, getCurrentTabId実装）

### Milestone 4: 統合・テスト完成（Week 5-6） ✅ 完了
- Task 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 完了
- [x] 全統合テスト通過（16/16統合テスト）
- [x] 全E2Eテスト通過（5/5 E2Eテスト）
- [x] パフォーマンステスト合格（Task 5.4で実施完了）

### Milestone 5: リリース準備完了（Week 7） ✅ 完了
- Task 5.1, 5.2, 5.3, 5.4, 5.5 完了
- [x] ドキュメント完成
  - README.md: 画面遷移対応機能セクション追加
  - CHANGELOG.md: v3.1.0リリース詳細記載
  - PERFORMANCE_TEST_REPORT.md: パフォーマンス測定結果
  - task-list.md: 全20タスク完了記録
- [x] リリースノート完成
  - RELEASE_NOTES_v3.1.0.md: エンドユーザー向け包括的ガイド
- [x] 最終レビュー完了
  - 全機能実装完了
  - 全テスト合格（3,607テスト）
  - ドキュメント整備完了

---

## リスクと対策

### リスク1: Chrome Storageのパフォーマンス問題

**リスク内容:**
進捗保存が頻繁に行われるとChrome Storageへの書き込みがボトルネックになる可能性

**対策:**
- CHANGE_URLアクション後のみ保存することで書き込み回数を最小化
- パフォーマンステストで閾値を設定
- 必要に応じてメモリキャッシュを導入

### リスク2: URL マッチングの誤判定

**リスク内容:**
URLが類似しているページで誤って再開される可能性

**対策:**
- URLMatchingServiceの精度を向上
- XPathデータに正確なURLを設定するようユーザーにガイド
- テストケースで誤判定のパターンを網羅

### リスク3: 古い実行中状態の蓄積

**リスク内容:**
24時間以上前の実行中状態がストレージに残り続ける

**対策:**
- 定期的なクリーンアップバッチを実装（オプション）
- ユーザーに手動クリーンアップ機能を提供

### リスク4: 複数タブでの競合

**リスク内容:**
同じ自動入力を複数タブで実行した場合の競合

**対策:**
- AutomationResultにtabIdを追加（将来的な改善）
- 現時点では最初に見つかったものを使用（ドキュメントに記載）

---

## 進捗トラッキング

### 全体進捗

- **Phase 1:** ✅ 2/2 タスク完了
- **Phase 2:** ✅ 4/4 タスク完了
- **Phase 3:** ✅ 3/3 タスク完了
- **Phase 4:** ✅ 6/6 タスク完了
- **Phase 5:** ✅ 5/5 タスク完了

**全体:** ✅ 20/20 タスク完了 (100%)

### 週次目標

- **Week 1:** Phase 1 完了
- **Week 2-3:** Phase 2 完了
- **Week 4:** Phase 3 完了
- **Week 5-6:** Phase 4 完了
- **Week 7:** Phase 5 完了

---

## 連絡先

質問や問題がある場合は以下に連絡してください：

- **プロジェクトリード:** [Name]
- **Backend担当:** [Name]
- **Frontend担当:** [Name]
- **QA担当:** [Name]
