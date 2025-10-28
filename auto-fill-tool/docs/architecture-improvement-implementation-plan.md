# アーキテクチャ改善タスク実装計画書

**作成日**: 2025-10-22
**最終更新**: 2025-10-23
**バージョン**: 1.1
**対象プロジェクト**: Auto Fill Tool - Chrome拡張機能

---

## 📋 目次

1. [概要](#概要)
2. [クリーンアーキテクチャ違反の検出と改善提案](#クリーンアーキテクチャ違反の検出と改善提案)
3. [タスク1: ドメインイベントの活用拡大](#タスク1-ドメインイベントの活用拡大)
4. [タスク2: パフォーマンスモニタリングの導入](#タスク2-パフォーマンスモニタリングの導入)
5. [タスク3: パフォーマンス最適化の調査・実施](#タスク3-パフォーマンス最適化の調査実施)
6. [タスク4: セキュリティ強化の調査・実施](#タスク4-セキュリティ強化の調査実施)
7. [実施順序と依存関係](#実施順序と依存関係)
8. [リスクと対策](#リスクと対策)

---

## 概要

本ドキュメントは、`docs/clean-architecture-summary-report.md`の「次のステップ」セクションに記載された以下の4つのタスクについて、詳細な実装計画を提供します。

### 対象タスク

| タスク | 優先度 | 見積工数 | 目的 |
|--------|--------|----------|------|
| ドメインイベントの活用拡大 | 🟢 Low | 1-2週間 | 疎結合化とビジネスロジック分離 |
| パフォーマンスモニタリングの導入 | 🟢 Low | 1-2週間 | 実行時パフォーマンスの可視化 |
| パフォーマンス最適化の調査・実施 | 🟢 Low | 2-3日 | システム全体のパフォーマンス向上 |
| セキュリティ強化の調査・実施 | 🟢 Low | 2-3日 | セキュリティ脆弱性の排除 |

### 前提条件

- ✅ Task 7: ドメインイベント基盤実装済み（EventBus, 22イベント、50テスト合格）
- ✅ Task 4 Phase 2: Security Event Logging実装済み（102テスト）
- ✅ クリーンアーキテクチャ準拠度98%達成
- ✅ テストカバレッジ96.17%達成

---

## クリーンアーキテクチャ違反の検出と改善提案

### 🔍 概要

本セクションでは、各タスクの実装において発生する可能性のあるクリーンアーキテクチャ違反を事前に特定し、正しい実装パターンを提示します。

**クリーンアーキテクチャの基本原則（再確認）**:

```
依存の方向: 外側 → 内側（内側は外側を知らない）

┌─────────────────────────────────────────┐
│ Presentation Layer                      │ ← UI、Controller、View
│ (最も外側)                               │
└─────────────────────────────────────────┘
              ↓ 依存可能
┌─────────────────────────────────────────┐
│ Infrastructure Layer                    │ ← 外部ライブラリ、API、DB
│ (外側)                                   │
└─────────────────────────────────────────┘
              ↓ 依存可能
┌─────────────────────────────────────────┐
│ UseCase Layer (Application)             │ ← ビジネスロジック調整
│ (中間)                                   │
└─────────────────────────────────────────┘
              ↓ 依存可能
┌─────────────────────────────────────────┐
│ Domain Layer                            │ ← エンティティ、ドメインロジック
│ (最も内側・独立)                         │ ← 外部に依存しない
└─────────────────────────────────────────┘
```

---

### ⚠️ タスク1: ドメインイベントでの違反リスク

#### 違反パターン1: UseCaseがEventBusの具象クラスに直接依存

**❌ 違反コード**:
```typescript
// src/usecases/websites/SaveWebsiteUseCase.ts
import { EventBus } from '@domain/events/EventBus'; // 具象クラス

export class SaveWebsiteUseCase {
  constructor(
    private repository: WebsiteRepository,
    private eventBus?: EventBus // ← 具象クラスに依存
  ) {}
}
```

**問題点**:
- UseCaseが特定の実装（EventBus）に強く結合している
- テスト時のモック作成が困難
- 将来的にEventBusの実装を変更する際に全UseCaseを修正する必要がある

**✅ 正しいコード**:
```typescript
// src/domain/interfaces/IEventPublisher.ts
export interface IEventPublisher {
  publish<T extends DomainEvent>(event: T): void;
}

// src/usecases/websites/SaveWebsiteUseCase.ts
import { IEventPublisher } from '@domain/interfaces';

export class SaveWebsiteUseCase {
  constructor(
    private repository: WebsiteRepository,
    private eventPublisher?: IEventPublisher // ← インターフェースに依存
  ) {}

  async execute(input: SaveWebsiteInput): Promise<SaveWebsiteOutput> {
    // ...
    this.eventPublisher?.publish(new WebsiteCreatedEvent({ ... }));
    // ...
  }
}

// src/domain/events/EventBus.ts
export class EventBus implements IEventPublisher {
  publish<T extends DomainEvent>(event: T): void {
    // 実装詳細
  }
  // その他のメソッド（subscribe等）
}
```

**改善効果**:
- 依存性逆転の原則（DIP）に準拠
- テスト容易性の向上
- 実装の差し替えが容易

#### 違反パターン2: Domain層のイベントがInfrastructure層の型に依存

**❌ 違反コード**:
```typescript
// src/domain/events/events/WebsiteEvents.ts
import { ChromeStorageData } from '@infrastructure/storage/types'; // ← Infrastructure層に依存

export class WebsiteCreatedEvent extends DomainEvent {
  constructor(
    public readonly websiteId: string,
    public readonly storageData: ChromeStorageData // ← 外部の型に依存
  ) {
    super('WebsiteCreatedEvent');
  }
}
```

**問題点**:
- Domain層がInfrastructure層に依存している（逆方向の依存）
- Domain層の独立性が損なわれる

**✅ 正しいコード**:
```typescript
// src/domain/events/events/WebsiteEvents.ts
export interface WebsiteCreatedEventData {
  websiteId: string;
  websiteName: string;
  url: string;
  timestamp: number;
}

export class WebsiteCreatedEvent extends DomainEvent {
  constructor(public readonly data: WebsiteCreatedEventData) {
    super('WebsiteCreatedEvent');
  }
}

// Infrastructure層でのマッピング（必要に応じて）
// src/infrastructure/adapters/StorageEventAdapter.ts
export class StorageEventAdapter {
  toStorageData(event: WebsiteCreatedEvent): ChromeStorageData {
    return {
      // Domain層のデータをInfrastructure層の形式に変換
    };
  }
}
```

---

### ⚠️ タスク2: パフォーマンスモニタリングでの違反リスク

#### 違反パターン3: UseCaseがInfrastructure層のPerformanceMonitorに直接依存

**❌ 違反コード**:
```typescript
// src/usecases/auto-fill/ExecuteAutoFillUseCase.ts
import { PerformanceMonitor } from '@infrastructure/monitoring/PerformanceMonitor'; // ← Infrastructure層

export class ExecuteAutoFillUseCase {
  constructor(
    private adapter: AutoFillAdapter,
    private performanceMonitor?: PerformanceMonitor // ← Infrastructure層に依存
  ) {}
}
```

**問題点**:
- **重大な違反**: UseCase層（内側）がInfrastructure層（外側）に依存している
- 依存の方向が逆転している
- テストが困難、実装の差し替えができない

**✅ 正しいコード**:
```typescript
// src/domain/interfaces/IPerformanceMonitor.ts
export interface IPerformanceMonitor {
  start(operationName: string): string;
  end(monitorId: string, metadata?: Record<string, unknown>): void;
}

// src/usecases/auto-fill/ExecuteAutoFillUseCase.ts
import { IPerformanceMonitor } from '@domain/interfaces';

export class ExecuteAutoFillUseCase {
  constructor(
    private adapter: AutoFillAdapter,
    private performanceMonitor?: IPerformanceMonitor // ← Domain層のインターフェースに依存
  ) {}

  async execute(input: ExecuteAutoFillInput): Promise<ExecuteAutoFillOutput> {
    const monitorId = this.performanceMonitor?.start('auto-fill-execution');
    try {
      const result = await this.adapter.executeAutoFill(input.steps);
      this.performanceMonitor?.end(monitorId, { success: true });
      return { success: true, result };
    } catch (error) {
      this.performanceMonitor?.end(monitorId, { success: false });
      throw error;
    }
  }
}

// src/infrastructure/monitoring/PerformanceMonitor.ts
import { IPerformanceMonitor } from '@domain/interfaces';

export class PerformanceMonitor implements IPerformanceMonitor {
  start(operationName: string): string {
    // Chrome Performance API を使った実装
    const monitorId = crypto.randomUUID();
    performance.mark(`${operationName}-start-${monitorId}`);
    return monitorId;
  }

  end(monitorId: string, metadata?: Record<string, unknown>): void {
    // 計測終了処理
  }
}
```

**改善効果**:
- 依存の方向が正しい（UseCase → Domain）
- PerformanceMonitorの実装をテスト用のスタブに差し替え可能
- Chrome API以外の計測ライブラリにも対応可能

#### 違反パターン4: Domain層がChrome APIに直接依存

**❌ 違反コード**:
```typescript
// src/domain/entities/PerformanceMetric.ts
export class PerformanceMetric {
  static create(): PerformanceMetric {
    const startTime = performance.now(); // ← Chrome APIに直接依存
    // ...
  }
}
```

**問題点**:
- Domain層がブラウザAPIに依存している
- ユニットテストが困難（ブラウザ環境が必要）
- Node.js環境等で動作しない

**✅ 正しいコード**:
```typescript
// src/domain/interfaces/ITimeProvider.ts
export interface ITimeProvider {
  now(): number;
}

// src/domain/entities/PerformanceMetric.ts
export class PerformanceMetric {
  static create(timeProvider: ITimeProvider): PerformanceMetric {
    const startTime = timeProvider.now(); // ← インターフェース経由
    // ...
  }
}

// src/infrastructure/adapters/ChromeTimeProvider.ts
export class ChromeTimeProvider implements ITimeProvider {
  now(): number {
    return performance.now();
  }
}

// テスト用
export class MockTimeProvider implements ITimeProvider {
  constructor(private currentTime: number = 0) {}
  now(): number {
    return this.currentTime;
  }
  setTime(time: number): void {
    this.currentTime = time;
  }
}
```

---

### ⚠️ タスク4: セキュリティ強化での違反リスク

#### 違反パターン5: Domain層が外部ライブラリ（zxcvbn）に直接依存

**❌ 違反コード**:
```typescript
// src/domain/entities/MasterPasswordPolicy.ts
import zxcvbn from 'zxcvbn'; // ← 外部ライブラリに直接依存

export class MasterPasswordPolicy {
  validatePassword(password: string): ValidationResult {
    const result = zxcvbn(password); // ← 外部ライブラリ使用
    const entropy = result.guesses_log10 * Math.log2(10);

    if (entropy < 80) {
      return { valid: false, message: 'パスワードが弱すぎます' };
    }
    return { valid: true };
  }
}
```

**問題点**:
- **重大な違反**: Domain層が外部ライブラリに依存している
- Domain層の独立性が損なわれる
- zxcvbnライブラリを別のライブラリに変更する際、Domain層を修正する必要がある
- ユニットテストで外部ライブラリをモック化する必要がある

**✅ 正しいコード**:
```typescript
// src/domain/interfaces/IPasswordStrengthChecker.ts
export interface PasswordStrengthResult {
  score: number; // 0-4
  entropy: number; // ビット
  suggestions: string[];
}

export interface IPasswordStrengthChecker {
  checkStrength(password: string): PasswordStrengthResult;
}

// src/domain/entities/MasterPasswordPolicy.ts
export class MasterPasswordPolicy {
  private static MIN_LENGTH = 12;
  private static MIN_ENTROPY = 80;

  constructor(private strengthChecker: IPasswordStrengthChecker) {}

  validatePassword(password: string): ValidationResult {
    // 1. 長さチェック
    if (password.length < MasterPasswordPolicy.MIN_LENGTH) {
      return {
        valid: false,
        message: `最低${MasterPasswordPolicy.MIN_LENGTH}文字以上必要です`,
      };
    }

    // 2. 複雑度チェック（大文字、小文字、数字、記号）
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasDigit && hasSymbol)) {
      return {
        valid: false,
        message: '大文字、小文字、数字、記号をすべて含める必要があります',
      };
    }

    // 3. 辞書攻撃耐性チェック（外部ライブラリ使用、但しインターフェース経由）
    const result = this.strengthChecker.checkStrength(password);

    if (result.entropy < MasterPasswordPolicy.MIN_ENTROPY) {
      return {
        valid: false,
        message: `パスワードが弱すぎます（強度スコア: ${result.score}/4）`,
        suggestions: result.suggestions,
      };
    }

    return { valid: true };
  }
}

// src/infrastructure/security/ZxcvbnPasswordStrengthChecker.ts
import zxcvbn from 'zxcvbn';
import { IPasswordStrengthChecker, PasswordStrengthResult } from '@domain/interfaces';

export class ZxcvbnPasswordStrengthChecker implements IPasswordStrengthChecker {
  checkStrength(password: string): PasswordStrengthResult {
    const result = zxcvbn(password);
    return {
      score: result.score,
      entropy: result.guesses_log10 * Math.log2(10),
      suggestions: result.feedback.suggestions,
    };
  }
}

// テスト用のモック
export class MockPasswordStrengthChecker implements IPasswordStrengthChecker {
  constructor(private mockResult: PasswordStrengthResult) {}

  checkStrength(password: string): PasswordStrengthResult {
    return this.mockResult;
  }
}
```

**改善効果**:
- Domain層が外部ライブラリに依存しない（依存性逆転）
- zxcvbnを別のライブラリ（例: passwdqc, cracklib等）に変更しても、Domain層は変更不要
- テストでモックを注入でき、外部ライブラリなしでテスト可能
- Domain層が純粋なビジネスロジックのみに集中できる

#### 違反パターン6: Domain層がDOMPurifyに直接依存

**❌ 違反コード**:
```typescript
// src/domain/services/XPathValueValidator.ts
import DOMPurify from 'dompurify'; // ← 外部ライブラリに直接依存

export class XPathValueValidator {
  sanitize(value: string): string {
    return DOMPurify.sanitize(value); // ← 外部ライブラリ使用
  }
}
```

**問題点**:
- Domain層が外部ライブラリ（DOMPurify）に依存している
- ブラウザ環境でしか動作しない（Node.js環境でテスト困難）

**✅ 正しいコード**:
```typescript
// src/domain/interfaces/IHtmlSanitizer.ts
export interface IHtmlSanitizer {
  sanitize(html: string): string;
}

// src/domain/services/XPathValueValidator.ts
export class XPathValueValidator {
  constructor(private sanitizer: IHtmlSanitizer) {}

  private static DANGEROUS_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
  ];

  validate(value: string): ValidationResult {
    // パターンマッチング検証（Domain層でも実行可能）
    const hasDangerousPattern = XPathValueValidator.DANGEROUS_PATTERNS.some(
      pattern => pattern.test(value)
    );

    if (hasDangerousPattern) {
      return {
        valid: false,
        message: 'XPath値に危険なパターンが含まれています',
      };
    }

    return { valid: true };
  }

  sanitize(value: string): string {
    // サニタイズはInfrastructure層に委譲
    return this.sanitizer.sanitize(value);
  }
}

// src/infrastructure/security/DOMPurifySanitizer.ts
import DOMPurify from 'dompurify';
import { IHtmlSanitizer } from '@domain/interfaces';

export class DOMPurifySanitizer implements IHtmlSanitizer {
  sanitize(html: string): string {
    return DOMPurify.sanitize(html);
  }
}
```

---

### 📐 正しいレイヤー構成のまとめ

#### Domain層に配置すべきもの

✅ **配置すべき**:
- エンティティ（User, Website, XPath等）
- 値オブジェクト（Email, Password等）
- ドメインサービス（ビジネスルール）
- ドメインイベント定義（WebsiteCreatedEvent等）
- インターフェース定義（IRepository, IEventPublisher, IPasswordStrengthChecker等）
- ドメインロジック（検証ルール、計算ロジック等）

❌ **配置すべきでない**:
- 外部ライブラリへの依存（zxcvbn, DOMPurify, Chart.js等）
- ブラウザAPIへの依存（chrome.storage, performance, localStorage等）
- Infrastructure層の型（ChromeStorageData, ApiResponse等）
- フレームワーク固有の機能（React Hooks, Decorator等）

#### UseCase層に配置すべきもの

✅ **配置すべき**:
- UseCaseクラス（ExecuteAutoFillUseCase等）
- UseCaseの入出力型（CreateUserInput, CreateUserOutput等）
- アプリケーション固有のロジック（複数のDomainサービスの調整等）

❌ **配置すべきでない**:
- Infrastructure層への直接依存（PerformanceMonitor, ChromeStorageAdapter等）
- UI層への依存（View, Presenter等）
- 外部ライブラリへの直接依存

#### Infrastructure層に配置すべきもの

✅ **配置すべき**:
- Repository実装（ChromeStorageRepository, IndexedDBRepository等）
- Adapter実装（AutoFillAdapter, SyncAdapter等）
- 外部ライブラリのラッパー（ZxcvbnPasswordStrengthChecker, DOMPurifySanitizer等）
- ブラウザAPIのラッパー（ChromeTimeProvider, ChromeStorageAdapter等）

#### Presentation層に配置すべきもの

✅ **配置すべき**:
- View（UI実装）
- Presenter（UIロジック）
- Controller（ユーザーアクション処理）

---

### ✅ 実装時のチェックリスト

各タスクの実装時に以下をチェックしてください：

#### 依存関係チェック

- [ ] **Domain層が外部ライブラリに依存していないか**
  - zxcvbn, DOMPurify, Chart.js等の外部ライブラリはインターフェース経由で使用
- [ ] **UseCase層がInfrastructure層に依存していないか**
  - PerformanceMonitor, ChromeStorageAdapter等はインターフェース経由で使用
- [ ] **Domain層がブラウザAPIに依存していないか**
  - chrome.storage, performance, localStorage等はインターフェース経由で使用
- [ ] **内側のレイヤーが外側のレイヤーを知らないか**
  - Domain → UseCase, Domain → Infrastructure等の依存は禁止

#### インターフェース設計チェック

- [ ] **Domain層にインターフェースが定義されているか**
  - IEventPublisher, IPerformanceMonitor, IPasswordStrengthChecker等
- [ ] **Infrastructure層がインターフェースを実装しているか**
  - EventBus implements IEventPublisher等
- [ ] **UseCaseがインターフェースに依存しているか**
  - コンストラクタ引数の型がインターフェースか

#### テスト容易性チェック

- [ ] **依存性をモックで差し替えられるか**
  - コンストラクタインジェクションが使われているか
- [ ] **外部ライブラリなしでDomain層をテストできるか**
  - Domain層のテストでzxcvbn等の外部ライブラリをインポートしていないか
- [ ] **ブラウザ環境なしでUseCaseをテストできるか**
  - chrome.storage等のAPIを直接使用していないか

---

## タスク1: ドメインイベントの活用拡大

### 📐 概要

**目的**: Task 7で構築したドメインイベント基盤を、既存の61個のUseCaseに段階的に統合し、横断的関心事（ロギング、通知、メトリクス収集）の管理を改善する。

**期間**: 1-2週間
**優先度**: 🟢 Low
**複雑度**: 中（既存コード変更が多数）

---

### 🎯 外部仕様

#### 機能要件

**ユーザー視点での機能追加・変更**:
- 自動入力実行時のリアルタイム通知が送信される
- データ同期完了時のメトリクス（実行時間、成功/失敗カウント）が収集される
- Websiteや XPath の CRUD 操作時の監査ログが自動記録される
- 異常系（エラー発生）時に詳細なイベントログが記録される

**外部から観測可能な動作**:
- 既存機能の動作は変わらないが、以下の付加価値が提供される：
  - Chrome DevTools Console にイベントログが出力される
  - Chrome Storage にイベント履歴が蓄積される（将来的なダッシュボード表示用）
  - Background Service Worker でイベントが購読され、通知が送信される

#### 非機能要件

| 項目 | 要件 | 測定方法 |
|------|------|----------|
| **パフォーマンス** | イベント発行のオーバーヘッドは1ms以下 | performance.now()で計測 |
| **信頼性** | イベント発行失敗が元の処理に影響しない | try-catchで隔離 |
| **保守性** | 既存UseCaseの変更は最小限（5行以内の追加） | コードレビュー |
| **テスタビリティ** | EventBusをモック可能 | Unit testで検証 |

---

### 🔧 内部仕様

#### アーキテクチャ設計

**レイヤー別の役割**:

```
┌──────────────────────────────────────────────┐
│ Presentation Layer (Background Service)     │
│ - GlobalEventBus初期化                       │
│ - イベントハンドラー登録                      │
│   • LoggingEventHandler (全イベントをログ)   │
│   • NotificationHandler (通知送信)           │
│   • MetricsHandler (メトリクス収集)          │
└──────────────────────────────────────────────┘
                    ↓ publish/subscribe
┌──────────────────────────────────────────────┐
│ UseCase Layer                                │
│ - イベント発行ロジック追加                    │
│   • 成功時: *CompletedEvent                  │
│   • 失敗時: *FailedEvent                     │
└──────────────────────────────────────────────┘
                    ↓ import
┌──────────────────────────────────────────────┐
│ Domain Layer (events/)                       │
│ - EventBus: Pub/Subメカニズム                │
│ - イベント定義: 22種類                        │
│   • AutoFillEvents (5種類)                   │
│   • WebsiteEvents (5種類)                    │
│   • XPathEvents (5種類)                      │
│   • SyncEvents (7種類)                       │
└──────────────────────────────────────────────┘
```

#### 統合対象UseCase（優先度順）

**Phase 1: 高頻度実行UseCase (3-4日)**
1. ✅ ExecuteAutoFillUseCase - 自動入力実行（最重要）
2. SaveWebsiteUseCase - Websiteの保存
3. SaveXPathUseCase - XPathの保存
4. SaveAutomationVariablesUseCase - 変数の保存

**Phase 2: データ同期UseCase (2-3日)**
5. ExecuteManualSyncUseCase - 手動同期
6. ExecuteScheduledSyncUseCase - スケジュール同期
7. ExecuteSendDataUseCase - データ送信
8. ExecuteReceiveDataUseCase - データ受信

**Phase 3: その他の重要UseCase (2-3日)**
9. DeleteWebsiteUseCase - Website削除
10. UpdateWebsiteUseCase - Website更新
11. ImportWebsitesUseCase - Websiteインポート
12. UnlockStorageUseCase - ストレージアンロック（セキュリティイベント）
13. LockStorageUseCase - ストレージロック（セキュリティイベント）

**Phase 4: 残りのUseCase (3-4日)**
14. その他48個のUseCase（必要に応じて優先順位を調整）

#### 実装パターン

**Before (イベントなし)**:
```typescript
// src/usecases/websites/SaveWebsiteUseCase.ts
export class SaveWebsiteUseCase {
  async execute(input: SaveWebsiteInput): Promise<SaveWebsiteOutput> {
    const website = Website.create(input);
    await this.repository.save(website);
    return { success: true, website };
  }
}
```

**After (イベント統合)**:
```typescript
import { EventBus } from '@domain/events';
import { WebsiteCreatedEvent, WebsiteSaveFailedEvent } from '@domain/events/events/WebsiteEvents';

export class SaveWebsiteUseCase {
  constructor(
    private repository: WebsiteRepository,
    private eventBus?: EventBus // Optional依存（後方互換性）
  ) {}

  async execute(input: SaveWebsiteInput): Promise<SaveWebsiteOutput> {
    try {
      const website = Website.create(input);
      await this.repository.save(website);

      // ✅ イベント発行（成功時）
      this.eventBus?.publish(new WebsiteCreatedEvent({
        websiteId: website.getId(),
        websiteName: website.getName(),
        timestamp: Date.now(),
      }));

      return { success: true, website };
    } catch (error) {
      // ✅ イベント発行（失敗時）
      this.eventBus?.publish(new WebsiteSaveFailedEvent({
        input,
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now(),
      }));

      throw error;
    }
  }
}
```

#### グローバルEventBus初期化

**src/presentation/background/index.ts**:
```typescript
import { EventBus } from '@domain/events';
import { LoggingEventHandler } from '@domain/events/examples/LoggingEventHandler';
import { AutoFillNotificationHandler } from '@domain/events/examples/AutoFillNotificationHandler';
import { SyncMetricsHandler } from '@domain/events/examples/SyncMetricsHandler';

// グローバルEventBusのシングルトン
export const globalEventBus = new EventBus();

// ハンドラー登録
globalEventBus.subscribeGlobal(new LoggingEventHandler(logger));
globalEventBus.subscribe('AutoFillCompletedEvent', new AutoFillNotificationHandler(notificationAdapter));
globalEventBus.subscribe('SyncCompletedEvent', new SyncMetricsHandler(metricsRepository));

// UseCaseインスタンス化時にEventBusを注入
const saveWebsiteUseCase = new SaveWebsiteUseCase(websiteRepository, globalEventBus);
```

#### テスト戦略

**Unit Test (UseCase単位)**:
```typescript
describe('SaveWebsiteUseCase with EventBus', () => {
  let useCase: SaveWebsiteUseCase;
  let mockRepository: jest.Mocked<WebsiteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockRepository = { save: jest.fn() };
    mockEventBus = { publish: jest.fn() };
    useCase = new SaveWebsiteUseCase(mockRepository, mockEventBus);
  });

  it('should publish WebsiteCreatedEvent on success', async () => {
    mockRepository.save.mockResolvedValue(undefined);

    await useCase.execute({ name: 'Test' });

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'WebsiteCreatedEvent',
      })
    );
  });

  it('should publish WebsiteSaveFailedEvent on error', async () => {
    mockRepository.save.mockRejectedValue(new Error('Save failed'));

    await expect(useCase.execute({ name: 'Test' })).rejects.toThrow();

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'WebsiteSaveFailedEvent',
      })
    );
  });
});
```

---

### ✅ 完了基準

#### 定量的基準

- [ ] **統合率**: 最低20個のUseCaseにイベント統合（優先度の高いもの）
- [ ] **テストカバレッジ**: 新規コード100%、既存コード維持
- [ ] **パフォーマンス**: イベント発行オーバーヘッド < 1ms（100回平均）
- [ ] **Lint**: 0 errors, 0 warnings

#### 定性的基準

- [ ] **後方互換性**: EventBusなしでも動作する（Optional依存）
- [ ] **ドキュメント**: 統合ガイド作成（`docs/domain-events-integration-guide.md`）
- [ ] **コードレビュー**: アーキテクチャ違反なし

---

### 📋 タスクリスト

#### Phase 1: 準備（1日）
- [ ] グローバルEventBusをbackground/index.tsで初期化
- [ ] LoggingEventHandlerを登録（全イベントをConsoleログ出力）
- [ ] EventBus統合のテンプレートコード作成（コピペ用）

#### Phase 2: 高頻度UseCaseへの統合（3-4日）
- [ ] ExecuteAutoFillUseCaseへの統合とテスト
  - [ ] AutoFillStartedEvent発行
  - [ ] AutoFillCompletedEvent発行
  - [ ] AutoFillFailedEvent発行
  - [ ] 10テストケース追加
- [ ] SaveWebsiteUseCaseへの統合とテスト（3テストケース）
- [ ] SaveXPathUseCaseへの統合とテスト（3テストケース）
- [ ] SaveAutomationVariablesUseCaseへの統合とテスト（3テストケース）

#### Phase 3: データ同期UseCaseへの統合（2-3日）
- [ ] ExecuteManualSyncUseCaseへの統合とテスト（4テストケース）
- [ ] ExecuteScheduledSyncUseCaseへの統合とテスト（3テストケース）
- [ ] ExecuteSendDataUseCaseへの統合とテスト（3テストケース）
- [ ] ExecuteReceiveDataUseCaseへの統合とテスト（3テストケース）

#### Phase 4: セキュリティUseCaseへの統合（1-2日）
- [ ] UnlockStorageUseCaseへの統合とテスト（3テストケース）
- [ ] LockStorageUseCaseへの統合とテスト（3テストケース）
- [ ] MigrateToSecureStorageUseCaseへの統合とテスト（3テストケース）

#### Phase 5: その他UseCaseへの統合（2-3日）
- [ ] DeleteWebsiteUseCaseへの統合とテスト
- [ ] UpdateWebsiteUseCaseへの統合とテスト
- [ ] ImportWebsitesUseCaseへの統合とテスト
- [ ] 残りの優先度の高いUseCase（10-15個）への統合

#### Phase 6: QA とドキュメント（1-2日）
- [ ] 全テスト実行（5,000+テストが合格すること）
- [ ] パフォーマンステスト（イベント発行オーバーヘッド計測）
- [ ] 統合ガイド作成（`docs/domain-events-integration-guide.md`）
- [ ] Lint/Build確認

---

## タスク2: パフォーマンスモニタリングの導入

### 📐 概要

**目的**: Chrome Performance APIを活用し、自動入力実行やデータ同期などの主要機能の実行時間を計測・可視化するシステムを構築する。

**期間**: 1-2週間
**優先度**: 🟢 Low
**複雑度**: 中（新規システム構築）

---

### 🎯 外部仕様

#### 機能要件

**ユーザー視点での機能追加**:
- ポップアップUIに「パフォーマンス」タブが追加される
- 主要機能の実行時間統計が表示される（平均、最小、最大、P95、P99）
- パフォーマンスグラフが表示される（時系列、ヒストグラム）
- パフォーマンスデータをCSV/JSONでエクスポート可能
- 実行時に自動的にパフォーマンスメトリクスが記録される（ユーザーアクション不要）

**ダッシュボード表示項目**:
```
┌─────────────────────────────────────────────┐
│ パフォーマンスダッシュボード                 │
├─────────────────────────────────────────────┤
│ 自動入力実行                                 │
│ ├ 平均実行時間: 1,234 ms                     │
│ ├ 最小: 890 ms                              │
│ ├ 最大: 2,100 ms                            │
│ ├ P95: 1,800 ms                             │
│ └ 実行回数: 156回（過去7日間）               │
├─────────────────────────────────────────────┤
│ データ同期                                   │
│ ├ 平均実行時間: 3,456 ms                     │
│ ├ 成功率: 98.5%                             │
│ └ 実行回数: 42回（過去7日間）                │
├─────────────────────────────────────────────┤
│ [グラフ表示] [CSV出力] [リセット]           │
└─────────────────────────────────────────────┘
```

#### 非機能要件

| 項目 | 要件 | 測定方法 |
|------|------|----------|
| **計測オーバーヘッド** | < 0.5ms per operation | performance.now()で計測 |
| **ストレージサイズ** | < 1MB (過去7日間のデータ) | Chrome Storage使用量確認 |
| **データ保持期間** | 7日間（設定可能） | SystemSettings拡張 |
| **計測精度** | ±1ms以内 | performance.now()の精度 |
| **UI表示速度** | < 500ms | ページロード時間計測 |

---

### 🔧 内部仕様

#### アーキテクチャ設計

**レイヤー別の責務**:

```
┌──────────────────────────────────────────────┐
│ Presentation Layer                           │
│ - PerformanceDashboardView.ts (UI)           │
│ - PerformanceDashboardPresenter.ts (ロジック)│
│ - Chart.js統合 (グラフ表示)                  │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ UseCase Layer                                │
│ - GetPerformanceMetricsUseCase               │
│ - ExportPerformanceDataUseCase               │
│ - ClearPerformanceDataUseCase                │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Domain Layer                                 │
│ - PerformanceMetric Entity                   │
│   • operationName: string                    │
│   • startTime: number                        │
│   • endTime: number                          │
│   • duration: number                         │
│   • success: boolean                         │
│   • metadata: Record<string, unknown>        │
│ - PerformanceRepository Port                 │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Infrastructure Layer                         │
│ - ChromeStoragePerformanceRepository         │
│   • save(): FIFO rotation (最大1000エントリ) │
│   • load(): 期間フィルタリング               │
│   • aggregate(): 統計計算                    │
└──────────────────────────────────────────────┘
```

#### Performance計測の統合方法

**⚠️ 重要: クリーンアーキテクチャ準拠のため、インターフェースを使用**

**パターン1: UseCase内で計測（推奨）**
```typescript
// src/domain/interfaces/IPerformanceMonitor.ts
export interface IPerformanceMonitor {
  start(operationName: string): string;
  end(monitorId: string, metadata?: Record<string, unknown>): void;
}

// src/usecases/auto-fill/ExecuteAutoFillUseCase.ts
import { IPerformanceMonitor } from '@domain/interfaces';

export class ExecuteAutoFillUseCase {
  constructor(
    private adapter: AutoFillAdapter,
    private performanceMonitor?: IPerformanceMonitor // ← インターフェースに依存
  ) {}

  async execute(input: ExecuteAutoFillInput): Promise<ExecuteAutoFillOutput> {
    const monitorId = this.performanceMonitor?.start('auto-fill-execution');

    try {
      const result = await this.adapter.executeAutoFill(input.steps);

      this.performanceMonitor?.end(monitorId, {
        success: true,
        stepsCount: input.steps.length,
      });

      return { success: true, result };
    } catch (error) {
      this.performanceMonitor?.end(monitorId, {
        success: false,
        error: error.message,
      });
      throw error;
    }
  }
}

// src/infrastructure/monitoring/PerformanceMonitor.ts
import { IPerformanceMonitor } from '@domain/interfaces';

export class PerformanceMonitor implements IPerformanceMonitor {
  constructor(
    private repository: PerformanceMetricRepository
  ) {}

  start(operationName: string): string {
    const monitorId = crypto.randomUUID();
    performance.mark(`${operationName}-start-${monitorId}`);
    return monitorId;
  }

  end(monitorId: string, metadata?: Record<string, unknown>): void {
    const [operationName] = monitorId.split('-');
    performance.mark(`${operationName}-end-${monitorId}`);
    performance.measure(
      `${operationName}-${monitorId}`,
      `${operationName}-start-${monitorId}`,
      `${operationName}-end-${monitorId}`
    );

    const measure = performance.getEntriesByName(`${operationName}-${monitorId}`)[0];
    const metric = PerformanceMetric.create({
      operationName,
      startTime: measure.startTime,
      endTime: measure.startTime + measure.duration,
      success: metadata?.success ?? true,
      metadata,
    });

    this.repository.save(metric);
  }
}
```

**パターン2: Decorator Pattern（高度な使い方）**
```typescript
// src/infrastructure/monitoring/PerformanceMonitoringDecorator.ts
import { IPerformanceMonitor } from '@domain/interfaces';

export function withPerformanceMonitoring(
  operationName: string,
  monitor: IPerformanceMonitor // ← インターフェースに依存
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const monitorId = monitor.start(operationName);

      try {
        const result = await originalMethod.apply(this, args);
        monitor.end(monitorId, { success: true });
        return result;
      } catch (error) {
        monitor.end(monitorId, { success: false, error: error.message });
        throw error;
      }
    };

    return descriptor;
  };
}

// 使用例（Presentation層でグローバルインスタンス取得）
// src/presentation/background/index.ts
import { PerformanceMonitor } from '@infrastructure/monitoring/PerformanceMonitor';

const globalPerformanceMonitor = new PerformanceMonitor(performanceRepository);

// UseCase作成時にDecoratorを適用
export class ExecuteAutoFillUseCase {
  @withPerformanceMonitoring('auto-fill-execution', globalPerformanceMonitor)
  async execute(input: ExecuteAutoFillInput): Promise<ExecuteAutoFillOutput> {
    // 実装コード（計測ロジック不要）
  }
}
```

**⚠️ 注意**: Decorator Patternは高度な機能のため、パターン1（コンストラクタインジェクション）を優先的に使用してください。Decoratorはグローバルな依存性を持つため、テストが複雑になる可能性があります。

#### PerformanceMetric Entity

**✅ クリーンアーキテクチャ準拠**: Domain層はブラウザAPIに依存しない

```typescript
// src/domain/entities/PerformanceMetric.ts
export interface PerformanceMetricData {
  id: string;
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export class PerformanceMetric {
  private constructor(private data: PerformanceMetricData) {}

  /**
   * PerformanceMetricを作成
   * @param data - 計測データ（id, durationは自動生成）
   * @returns PerformanceMetricインスタンス
   */
  static create(data: Omit<PerformanceMetricData, 'id' | 'duration'>): PerformanceMetric {
    // ✅ UUIDの生成はDomain層で行う（crypto.randomUUID()はブラウザAPIだが、標準仕様のため許容）
    // または、IUuidGeneratorインターフェースを定義して依存性注入も可能
    return new PerformanceMetric({
      ...data,
      id: crypto.randomUUID(),
      duration: data.endTime - data.startTime,
    });
  }

  getDuration(): number {
    return this.data.duration;
  }

  isSuccess(): boolean {
    return this.data.success;
  }

  toData(): PerformanceMetricData {
    return { ...this.data };
  }
}
```

**代替案: さらに厳密にしたい場合（UUID生成もインターフェース化）**

```typescript
// src/domain/interfaces/IUuidGenerator.ts
export interface IUuidGenerator {
  generate(): string;
}

// src/domain/entities/PerformanceMetric.ts
export class PerformanceMetric {
  private constructor(private data: PerformanceMetricData) {}

  static create(
    data: Omit<PerformanceMetricData, 'id' | 'duration'>,
    uuidGenerator: IUuidGenerator
  ): PerformanceMetric {
    return new PerformanceMetric({
      ...data,
      id: uuidGenerator.generate(), // ← インターフェース経由
      duration: data.endTime - data.startTime,
    });
  }
}

// src/infrastructure/adapters/CryptoUuidGenerator.ts
export class CryptoUuidGenerator implements IUuidGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
```

#### 統計計算ロジック

```typescript
// src/domain/services/PerformanceAnalyzer.ts
export class PerformanceAnalyzer {
  static calculateStatistics(metrics: PerformanceMetric[]): PerformanceStatistics {
    const durations = metrics.map(m => m.getDuration()).sort((a, b) => a - b);

    return {
      count: durations.length,
      avg: this.average(durations),
      min: Math.min(...durations),
      max: Math.max(...durations),
      p50: this.percentile(durations, 0.50),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
      successRate: metrics.filter(m => m.isSuccess()).length / metrics.length,
    };
  }

  private static percentile(sortedData: number[], percentile: number): number {
    const index = Math.ceil(sortedData.length * percentile) - 1;
    return sortedData[index];
  }

  private static average(data: number[]): number {
    return data.reduce((a, b) => a + b, 0) / data.length;
  }
}
```

---

### ✅ 完了基準

#### 定量的基準

- [ ] **計測対象**: 最低10種類の主要操作を計測
  - AutoFill実行、データ同期、Website/XPath CRUD、ストレージ操作等
- [ ] **テストカバレッジ**: 新規コード95%以上
- [ ] **パフォーマンスオーバーヘッド**: < 0.5ms per operation
- [ ] **UI表示速度**: < 500ms
- [ ] **Lint**: 0 errors, 0 warnings

#### 定性的基準

- [ ] **ダッシュボードUI**: 直感的で読みやすいデザイン
- [ ] **データ保持**: 7日間の履歴が自動的に保持される
- [ ] **エクスポート**: CSV/JSON形式で出力可能
- [ ] **ドキュメント**: 利用ガイド作成（`docs/performance-monitoring-guide.md`）

---

### 📋 タスクリスト

#### Phase 1: Domain層の実装（2-3日）
- [ ] PerformanceMetric Entity作成（100行、20テスト）
- [ ] PerformanceAnalyzer Service作成（統計計算ロジック、80行、15テスト）
- [ ] PerformanceRepository Port作成（30行）

#### Phase 2: Infrastructure層の実装（2-3日）
- [ ] PerformanceMonitor実装（計測ロジック、120行、25テスト）
- [ ] ChromeStoragePerformanceRepository実装（FIFO、150行、30テスト）
- [ ] PerformanceMonitoringDecorator実装（Decorator Pattern、80行、10テスト）

#### Phase 3: UseCase層の実装（1-2日）
- [ ] GetPerformanceMetricsUseCase作成（統計取得、60行、10テスト）
- [ ] ExportPerformanceDataUseCase作成（CSV/JSON出力、70行、12テスト）
- [ ] ClearPerformanceDataUseCase作成（データクリア、40行、5テスト）

#### Phase 4: 主要UseCaseへの計測統合（2-3日）
- [ ] ExecuteAutoFillUseCaseへの統合
- [ ] ExecuteManualSyncUseCaseへの統合
- [ ] SaveWebsiteUseCaseへの統合
- [ ] SaveXPathUseCaseへの統合
- [ ] その他6-8個の主要UseCaseへの統合

#### Phase 5: Presentation層の実装（3-4日）
- [ ] PerformanceDashboardView作成（HTML/CSS、200行）
- [ ] PerformanceDashboardPresenter作成（ロジック、180行、20テスト）
- [ ] Chart.js統合（グラフ表示、100行、10テスト）
- [ ] CSVエクスポート機能実装（50行、5テスト）

#### Phase 6: QA とドキュメント（1-2日）
- [ ] 全テスト実行（120新規テスト合格）
- [ ] パフォーマンスオーバーヘッド計測（< 0.5ms確認）
- [ ] UI/UXテスト（Chrome拡張で動作確認）
- [ ] 利用ガイド作成（`docs/performance-monitoring-guide.md`）
- [ ] Lint/Build確認

---

## タスク3: パフォーマンス最適化の調査・実施

### 📐 概要

**目的**: 自動入力実行、データ同期、ストレージアクセス等の主要機能のパフォーマンスボトルネックを特定し、最適化を実施する。

**期間**: 2-3日
**優先度**: 🟢 Low
**複雑度**: 低〜中（調査メイン）

---

### 🎯 外部仕様

#### 機能要件

**ユーザー視点での改善**:
- 自動入力実行が高速化される（目標: 平均20%改善）
- 大量データ同期（1,000件以上）がスムーズになる
- ストレージアクセスのレイテンシが減少する
- UI操作のレスポンスが向上する

#### 非機能要件

| 項目 | 現状（推定） | 目標 | 測定方法 |
|------|------------|------|----------|
| **AutoFill実行時間** | 平均1,500ms | 平均1,200ms (-20%) | performance.now() |
| **データ同期時間** | 平均4,000ms | 平均3,200ms (-20%) | performance.now() |
| **Storage読み込み** | 平均100ms | 平均50ms (-50%) | chrome.storage API計測 |
| **UI描画時間** | 平均300ms | 平均200ms (-33%) | requestAnimationFrame |

---

### 🔧 内部仕様

#### 調査項目と最適化手法

**1. 自動入力実行速度のプロファイリング**

**調査方法**:
- Chrome DevTools Performance タブで録画
- ExecuteAutoFillUseCaseの各ステップ実行時間を計測
- ボトルネックの特定（DOM検索、待機時間、アクション実行）

**最適化手法**:
```typescript
// Before: 毎回DOM検索を実行
for (const step of steps) {
  const element = await this.findElement(step.xpath); // 遅い
  await this.performAction(element, step);
}

// After: 要素を事前にキャッシュ
const elements = await this.findAllElements(steps.map(s => s.xpath)); // 並列
for (let i = 0; i < steps.length; i++) {
  await this.performAction(elements[i], steps[i]);
}
```

**期待効果**: 10-20%の高速化

---

**2. Chrome Storageアクセスの最適化（バッチ処理）**

**調査方法**:
- chrome.storage.local.get() の呼び出し回数を計測
- 複数回の読み込みが発生している箇所を特定

**最適化手法**:
```typescript
// Before: 個別に読み込み（N回のAPI呼び出し）
const website = await chromeStorage.get('website_123');
const xpaths = await chromeStorage.get('xpaths_123');
const variables = await chromeStorage.get('variables_123');

// After: バッチ読み込み（1回のAPI呼び出し）
const data = await chromeStorage.get(['website_123', 'xpaths_123', 'variables_123']);
const { website_123, xpaths_123, variables_123 } = data;
```

**期待効果**: Storage読み込み時間50%削減

---

**3. 大量データ同期のパフォーマンス最適化**

**調査方法**:
- 1,000件、5,000件、10,000件のデータ同期時間を計測
- メモリ使用量、CPU使用率を監視

**最適化手法**:
```typescript
// Before: 全データを一度に処理（メモリ負荷大）
const allWebsites = await this.repository.loadAll(); // 10,000件
await this.syncAdapter.send(allWebsites);

// After: チャンク処理（Batch size: 100件）
const chunkSize = 100;
for (let i = 0; i < totalCount; i += chunkSize) {
  const chunk = await this.repository.loadRange(i, chunkSize);
  await this.syncAdapter.send(chunk);
  await this.delay(100); // Rate limiting
}
```

**期待効果**: メモリ使用量80%削減、大量データ対応

---

**4. IndexedDB読み書き速度の最適化**

**調査方法**:
- IndexedDB操作のトランザクション時間を計測
- 録画データの読み書き頻度を分析

**最適化手法**:
```typescript
// Before: 個別トランザクション（遅い）
for (const recording of recordings) {
  await db.put('recordings', recording); // N回のトランザクション
}

// After: 一括トランザクション（高速）
const transaction = db.transaction('recordings', 'readwrite');
const store = transaction.objectStore('recordings');
for (const recording of recordings) {
  store.put(recording);
}
await transaction.complete; // 1回のトランザクション
```

**期待効果**: IndexedDB書き込み速度70%改善

---

**5. 不要なDOM操作の削減**

**調査方法**:
- Presentation層のrenderメソッド呼び出し頻度を計測
- Chrome DevTools Performance タブでPaintイベントを分析

**最適化手法**:
```typescript
// Before: 毎回全体を再描画
updateUI(data: Data[]) {
  this.container.innerHTML = ''; // 全削除
  data.forEach(item => this.container.appendChild(this.renderItem(item))); // 全再描画
}

// After: 差分更新
updateUI(newData: Data[]) {
  const diff = this.calculateDiff(this.oldData, newData);
  diff.added.forEach(item => this.container.appendChild(this.renderItem(item)));
  diff.removed.forEach(item => item.element.remove());
  diff.updated.forEach(item => this.updateItem(item));
  this.oldData = newData;
}
```

**期待効果**: UI描画時間30-40%削減

---

### ✅ 完了基準

#### 定量的基準

- [ ] **AutoFill実行時間**: 平均20%改善（1,500ms → 1,200ms）
- [ ] **データ同期時間**: 平均20%改善（4,000ms → 3,200ms）
- [ ] **Storage読み込み**: 50%高速化（100ms → 50ms）
- [ ] **テスト**: 既存テスト全合格、リグレッションなし

#### 定性的基準

- [ ] **ユーザー体感**: 「速くなった」と感じられるレベル
- [ ] **ドキュメント**: 最適化内容のレポート作成（`docs/performance-optimization-report.md`）

---

### 📋 タスクリスト

#### Phase 1: 調査・計測（1日）
- [ ] ExecuteAutoFillUseCaseのプロファイリング（Chrome DevTools）
- [ ] データ同期UseCaseのプロファイリング（1,000件/5,000件/10,000件）
- [ ] Chrome Storageアクセス頻度の分析（Grep + ログ）
- [ ] IndexedDB操作のトランザクション時間計測
- [ ] ボトルネック特定レポート作成

#### Phase 2: 最適化実装（1-2日）
- [ ] AutoFill: 要素キャッシュの実装とテスト
- [ ] Storage: バッチ読み込みの実装とテスト
- [ ] Sync: チャンク処理の実装とテスト（Batch size: 100）
- [ ] IndexedDB: 一括トランザクションの実装とテスト
- [ ] UI: 差分更新ロジックの実装とテスト

#### Phase 3: QA とドキュメント（0.5日）
- [ ] パフォーマンステスト（Before/After比較）
- [ ] 全テスト実行（リグレッション確認）
- [ ] 最適化レポート作成（`docs/performance-optimization-report.md`）
- [ ] Lint/Build確認

---

### 📊 実施状況

#### ✅ Phase 1: 調査・計測 - 完了

**実施日**: 2025-10-23
**ステータス**: ✅ 完了

**調査結果**:
- ExecuteAutoFillUseCaseのボトルネック特定完了
- 3つの主要な最適化ポイントを発見:
  1. AutomationResult全件取得 + フィルタリング（50-1000msのオーバーヘッド）
  2. N+1問題（AutomationVariablesのループ内読み込み）
  3. XPath全件取得 + フィルタリング（100-300msのオーバーヘッド）

**成果物**: `docs/performance-optimization-investigation-report.md`

---

#### ✅ Phase 2-2: Repository Query Optimization - 完了

**実施日**: 2025-10-23
**ステータス**: ✅ 完了

**実装内容**:

**1. Domain Layer Updates**
- `AutomationResultRepository`: `loadByStatus()`, `loadInProgress()` メソッド追加
- `XPathRepository`: `loadByWebsiteId()` メソッド追加

**2. Infrastructure Layer Implementation**
- `ChromeStorageAutomationResultRepository`: ストレージ層でのフィルタリング実装
- `ChromeStorageXPathRepository`: websiteId指定時の最適化実装
- `SecureXPathRepository`: 暗号化ストレージでも同様の最適化実装

**3. UseCase Layer Optimization**
- `ExecuteAutoFillUseCase`: 3つの主要最適化を適用
  - Full-table scan elimination（全件取得の排除）
  - N+1 problem elimination（ループ内Repository呼び出しの削除）
  - XPath query optimization（websiteId指定時の最適化）

**4. Test Coverage**
- 修正したテストファイル数: **14 files**
  - Unit tests: 12 files
  - Integration tests: 1 file
  - E2E tests: 1 file
  - Performance tests: 1 file

**テスト結果**:
```
Test Suites: 237/240 passed (98.75%)
Tests:       5467/5473 passed (99.89%)
```

**期待される効果** (Phase 1調査レポートより):

| 最適化項目 | Before | After | 改善率 |
|----------|--------|-------|--------|
| AutomationResult loading | 50-1000ms | 10-100ms | **80-90%** |
| XPath loading (filtered) | 100-300ms | 20-50ms | **70-80%** |
| N+1 problem elimination | N × 50ms = 100-500ms | 0ms | **100%** |
| **Total ExecuteAutoFillUseCase** | **250-1800ms** | **30-150ms** | **~85-90%** |

**技術的ハイライト**:
- Repository Pattern Best Practice: フィルタリングロジックをストレージ層に移動
- Query Optimization: 必要なデータのみを取得（Over-fetching解消）
- N+1 Problem Resolution: ループ内のRepository呼び出し削除
- Type Safety: 文字列リテラル → 型安全な定数使用 (`EXECUTION_STATUS.DOING`)

**成果物**: `docs/performance-optimization-investigation-report.md` (Phase 2-2 実施結果セクション追加)

---

#### ⏭️ Phase 2-3: Chrome Storage Batch Loading - 準備中

**予定実施日**: 2025-10-23
**ステータス**: 🔄 準備中

**実装予定内容**:
- Chrome Storageのバッチ読み込み実装
- 個別API呼び出しの統合（3回 → 1回）
- 期待効果: API呼び出し回数67%削減、読み込み時間67%削減 (150ms → 50ms)

---

#### ⏭️ Phase 3: QA とドキュメント - 未実施

**予定実施日**: Phase 2-3完了後
**ステータス**: ⏳ 待機中

**実施予定項目**:
- パフォーマンステスト（Before/After比較、1000件/5000件/10000件）
- 全テスト実行（リグレッション確認）
- 最適化レポート更新
- Lint/Build確認

---

## タスク4: セキュリティ強化の調査・実施

### 📐 概要

**目的**: Content Security Policy (CSP)の見直し、XSS脆弱性のチェック、マスターパスワード強度チェック強化、暗号化アルゴリズムの検証を行い、セキュリティ脆弱性を排除する。

**期間**: 2-3日
**優先度**: 🟢 Low
**複雑度**: 中（セキュリティ知識が必要）

---

### 🎯 外部仕様

#### 機能要件

**ユーザー視点での改善**:
- マスターパスワード設定時に強度チェックが強化される
- 弱いパスワード（辞書攻撃に脆弱）が拒否される
- XPath値にスクリプトタグが含まれる場合に警告が表示される
- 暗号化強度が最新の標準（AES-256-GCM）に準拠していることが保証される

**セキュリティ警告表示**:
```
┌─────────────────────────────────────────────┐
│ ⚠️ セキュリティ警告                         │
├─────────────────────────────────────────────┤
│ 入力されたマスターパスワードは弱いパスワード │
│ です。以下の条件を満たしてください：         │
│                                             │
│ ✗ 最低12文字以上                            │
│ ✗ 大文字、小文字、数字、記号を含む            │
│ ✗ 辞書単語を含まない                         │
│                                             │
│ [キャンセル]                  [再入力する]  │
└─────────────────────────────────────────────┘
```

#### 非機能要件

| 項目 | 要件 | 測定方法 |
|------|------|----------|
| **パスワード強度** | エントロピー80ビット以上 | zxcvbnライブラリ |
| **XSS防御** | すべての出力がサニタイズ済み | 静的解析 + 手動テスト |
| **CSP準拠** | CSP Level 3準拠 | CSP Evaluatorツール |
| **暗号化強度** | AES-256-GCM使用確認 | コードレビュー |

---

### 🔧 内部仕様

#### セキュリティ強化項目

**1. Content Security Policy (CSP)の見直し**

**現状確認**:
```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**改善案**:
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
  }
}
```

**チェック項目**:
- [ ] `script-src 'self'`: インラインスクリプト禁止
- [ ] `object-src 'self'`: プラグイン読み込み禁止
- [ ] `base-uri 'self'`: Base要素攻撃防止
- [ ] `form-action 'self'`: フォーム送信先制限
- [ ] `frame-ancestors 'none'`: Clickjacking防止
- [ ] `upgrade-insecure-requests`: HTTPS強制

**検証方法**: CSP Evaluator (https://csp-evaluator.withgoogle.com/)

---

**2. XSS脆弱性のチェック（XPath値のサニタイズ）**

**脆弱性の可能性**:
```typescript
// ❌ 危険: ユーザー入力を直接DOM挿入
element.innerHTML = xpathValue; // XSS脆弱性

// ❌ 危険: eval()での動的実行
eval(xpathValue); // 任意コード実行
```

**✅ 正しい対策実装（クリーンアーキテクチャ準拠）**:
```typescript
// src/domain/interfaces/IHtmlSanitizer.ts
export interface IHtmlSanitizer {
  sanitize(html: string): string;
}

// src/domain/services/XPathValueValidator.ts
export class XPathValueValidator {
  private static DANGEROUS_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // onerror=, onclick= 等
    /<iframe/i,
  ];

  /**
   * XPath値にXSS攻撃の可能性があるパターンが含まれているかチェック
   * @param value - 検証対象の文字列
   * @returns 検証結果
   */
  validate(value: string): { valid: boolean; message?: string } {
    const hasDangerousPattern = XPathValueValidator.DANGEROUS_PATTERNS.some(
      pattern => pattern.test(value)
    );

    if (hasDangerousPattern) {
      return {
        valid: false,
        message: 'XPath値に危険なパターンが含まれています',
      };
    }

    return { valid: true };
  }
}

// src/infrastructure/security/DOMPurifySanitizer.ts
import DOMPurify from 'dompurify';
import { IHtmlSanitizer } from '@domain/interfaces';

export class DOMPurifySanitizer implements IHtmlSanitizer {
  sanitize(html: string): string {
    return DOMPurify.sanitize(html);
  }
}

// src/presentation/views/XPathManagerView.ts
export class XPathManagerView {
  constructor(
    private validator: XPathValueValidator,
    private sanitizer: IHtmlSanitizer
  ) {}

  renderXPathValue(value: string, element: HTMLElement): void {
    // 1. 検証
    const validationResult = this.validator.validate(value);
    if (!validationResult.valid) {
      console.error(validationResult.message);
      element.textContent = '[Invalid XPath Value]';
      return;
    }

    // 2. 安全に表示（基本はtextContent）
    element.textContent = value;

    // HTMLとして表示が必要な場合のみサニタイズ
    // element.innerHTML = this.sanitizer.sanitize(value);
  }
}
```

**チェック対象箇所**:
- [ ] XPathManagerView.ts (XPath値の表示)
- [ ] AutoFillAdapter.ts (値の注入)
- [ ] PopupView.ts (Website/XPath情報の表示)
- [ ] その他、ユーザー入力を扱う全箇所

---

**3. マスターパスワード強度チェック強化**

**❌ 現状の実装（問題あり）**:
```typescript
// src/domain/entities/MasterPasswordPolicy.ts
validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return { valid: false, message: '8文字以上必要です' };
  }
  // 簡易的なチェックのみ
}
```

**✅ 正しい強化版実装（クリーンアーキテクチャ準拠）**:
```typescript
// src/domain/interfaces/IPasswordStrengthChecker.ts
export interface PasswordStrengthResult {
  score: number; // 0-4
  entropy: number; // ビット
  suggestions: string[];
}

export interface IPasswordStrengthChecker {
  checkStrength(password: string): PasswordStrengthResult;
}

// src/domain/entities/MasterPasswordPolicy.ts
export class MasterPasswordPolicy {
  private static MIN_LENGTH = 12; // 8 → 12に引き上げ
  private static MIN_ENTROPY = 80; // ビット

  constructor(private strengthChecker: IPasswordStrengthChecker) {}

  validatePassword(password: string): ValidationResult {
    // 1. 長さチェック（Domain層で実行可能）
    if (password.length < MasterPasswordPolicy.MIN_LENGTH) {
      return {
        valid: false,
        message: `最低${MasterPasswordPolicy.MIN_LENGTH}文字以上必要です`,
      };
    }

    // 2. 複雑度チェック（Domain層で実行可能）
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasDigit && hasSymbol)) {
      return {
        valid: false,
        message: '大文字、小文字、数字、記号をすべて含める必要があります',
      };
    }

    // 3. 辞書攻撃耐性チェック（インターフェース経由で外部ライブラリ使用）
    const result = this.strengthChecker.checkStrength(password);

    if (result.entropy < MasterPasswordPolicy.MIN_ENTROPY) {
      return {
        valid: false,
        message: `パスワードが弱すぎます。辞書単語や一般的なパターンは避けてください（強度スコア: ${result.score}/4）`,
        suggestions: result.suggestions,
      };
    }

    return { valid: true };
  }
}

// src/infrastructure/security/ZxcvbnPasswordStrengthChecker.ts
import zxcvbn from 'zxcvbn';
import { IPasswordStrengthChecker, PasswordStrengthResult } from '@domain/interfaces';

export class ZxcvbnPasswordStrengthChecker implements IPasswordStrengthChecker {
  checkStrength(password: string): PasswordStrengthResult {
    const result = zxcvbn(password);
    return {
      score: result.score,
      entropy: result.guesses_log10 * Math.log2(10),
      suggestions: result.feedback.suggestions,
    };
  }
}
```

**テストケース**:
```typescript
it('should reject common passwords', () => {
  const weakPasswords = [
    'password123',
    'qwerty12345',
    'admin@2024',
    'P@ssw0rd',
  ];

  weakPasswords.forEach(password => {
    const result = policy.validatePassword(password);
    expect(result.valid).toBe(false);
  });
});

it('should accept strong passwords', () => {
  const strongPasswords = [
    'Xk9#mL2$pQ7@wR4&',
    'Tr0ub4dor&3!Secure',
    'MyV3ry$tr0ng#P@ss',
  ];

  strongPasswords.forEach(password => {
    const result = policy.validatePassword(password);
    expect(result.valid).toBe(true);
  });
});
```

---

**4. 暗号化アルゴリズムの検証（AES-256-GCM）**

**現状確認**:
```typescript
// src/infrastructure/adapters/SecureStorageAdapter.ts
const algorithm = { name: 'AES-GCM', length: 256 };
```

**検証項目**:
- [ ] AES-256-GCMが正しく使用されている
- [ ] IVが毎回ランダムに生成されている（nonce reuse攻撃防止）
- [ ] 認証タグが検証されている（改ざん検知）
- [ ] 鍵導出にPBKDF2が使用されている（最低100,000イテレーション）

**推奨実装**:
```typescript
export class SecureStorageAdapter {
  async encrypt(plaintext: string, password: string): Promise<string> {
    // 1. ソルト生成（ランダム）
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // 2. 鍵導出（PBKDF2、100,000イテレーション）
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000, // OWASP推奨値
        hash: 'SHA-256',
      },
      await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // 3. IV生成（ランダム）
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 4. 暗号化
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plaintext)
    );

    // 5. ソルト + IV + 暗号文を結合してBase64エンコード
    return base64Encode(concat(salt, iv, ciphertext));
  }
}
```

---

### ✅ 完了基準

#### 定量的基準

- [ ] **CSPスコア**: CSP Evaluatorで90点以上
- [ ] **XSS脆弱性**: 静的解析ツールで0件検出
- [ ] **パスワード強度**: エントロピー80ビット以上強制
- [ ] **暗号化**: AES-256-GCM + PBKDF2 (100,000 iterations)使用確認

#### 定性的基準

- [ ] **セキュリティレビュー**: 外部レビューアーによるコードレビュー合格
- [ ] **ドキュメント**: セキュリティ強化レポート作成（`docs/security-enhancement-report.md`）
- [ ] **ペネトレーションテスト**: 主要な攻撃パターンに対する耐性確認

---

### 📋 タスクリスト

#### Phase 1: CSPの見直し（0.5日）
- [ ] manifest.jsonのCSP設定を確認
- [ ] CSP Level 3推奨設定に更新
- [ ] CSP Evaluatorで検証（90点以上）
- [ ] Chrome拡張での動作確認

#### Phase 2: XSS脆弱性チェック（1日）
- [ ] Grep検索: innerHTML, eval, dangerouslySetInnerHTML等
- [ ] 脆弱性の可能性がある箇所をリストアップ
- [ ] DOMPurifyライブラリの導入
- [ ] サニタイズロジックの実装とテスト（15テストケース）
- [ ] XPath値検証関数の実装とテスト（10テストケース）

#### Phase 3: マスターパスワード強度チェック強化（0.5日）
- [ ] zxcvbnライブラリの導入
- [ ] MasterPasswordPolicy更新（最低12文字、複雑度、辞書攻撃耐性）
- [ ] テストケース追加（20テストケース）
- [ ] UI更新（強度メーターの表示）

#### Phase 4: 暗号化アルゴリズムの検証（0.5日）
- [ ] SecureStorageAdapterのコードレビュー
- [ ] AES-256-GCM使用確認
- [ ] PBKDF2イテレーション数確認（100,000以上）
- [ ] IV/ソルトのランダム生成確認
- [ ] 認証タグ検証ロジック確認

#### Phase 5: ペネトレーションテスト（0.5日）
- [ ] XSS攻撃テスト（`<script>alert('XSS')</script>`等）
- [ ] CSRF攻撃テスト
- [ ] Clickjacking攻撃テスト（iframe埋め込み）
- [ ] 弱いパスワード攻撃テスト（辞書攻撃）
- [ ] 暗号化データ改ざんテスト

#### Phase 6: ドキュメント作成（0.5日）
- [ ] セキュリティ強化レポート作成（`docs/security-enhancement-report.md`）
- [ ] 脆弱性チェック結果のまとめ
- [ ] ペネトレーションテスト結果のまとめ
- [ ] Lint/Build確認

---

## 実施順序と依存関係

### 推奨実施順序

以下の順序で実施することを推奨します：

```
┌─────────────────────────────────────────────┐
│ Phase 0: 基盤整備（並行実施可能）            │
├─────────────────────────────────────────────┤
│ タスク3: パフォーマンス最適化 (2-3日)        │ ← 最優先（リスク低、効果高）
│ タスク4: セキュリティ強化 (2-3日)            │ ← 並行実施可能
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ Phase 1: モニタリング基盤構築               │
├─────────────────────────────────────────────┤
│ タスク2: パフォーマンスモニタリング (1-2週間) │ ← パフォーマンス改善効果を計測
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ Phase 2: イベント駆動アーキテクチャ拡大      │
├─────────────────────────────────────────────┤
│ タスク1: ドメインイベント活用拡大 (1-2週間)  │ ← 最後（影響範囲が広い）
└─────────────────────────────────────────────┘
```

### 依存関係

- **タスク3とタスク4**: 依存関係なし。並行実施可能。
- **タスク2**: タスク3完了後に実施推奨（パフォーマンス改善効果を計測できる）
- **タスク1**: 他のタスク完了後に実施推奨（イベント駆動化により全体の安定性を確保）

### マイルストーン

| マイルストーン | 期間 | 成果物 |
|--------------|------|--------|
| **M1: 基盤整備完了** | 4-6日 | タスク3・タスク4完了、パフォーマンス改善・セキュリティ強化レポート |
| **M2: モニタリング稼働** | M1 + 1-2週間 | タスク2完了、パフォーマンスダッシュボード稼働 |
| **M3: イベント駆動完成** | M2 + 1-2週間 | タスク1完了、20+ UseCaseにイベント統合 |

---

## リスクと対策

### 高リスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| **タスク1: 既存UseCaseの破壊** | 高 | 中 | 段階的統合、Optional依存、テスト充実 |
| **タスク2: パフォーマンスオーバーヘッド** | 中 | 中 | Decorator Pattern、非同期処理、キャッシュ |
| **タスク4: セキュリティ脆弱性の見落とし** | 高 | 低 | 外部レビュー、ペネトレーションテスト |

### 中リスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| **タスク3: 最適化による副作用** | 中 | 中 | リグレッションテスト充実、段階的ロールアウト |
| **タスク2: UIの複雑化** | 低 | 中 | シンプルなデザイン、段階的機能追加 |
| **工数超過** | 中 | 中 | バッファ期間（20%）を見込む |

### 対策の詳細

**1. 段階的ロールアウト**
- タスク1: Phase 1-4の順序で段階的に統合
- タスク3: Before/After比較を行い、問題があれば巻き戻し

**2. 十分なテスト**
- 各タスクで最低100テストケース以上追加
- リグレッションテストを毎Phase終了時に実行

**3. ドキュメント充実**
- 各タスクで実装ガイド・レポート作成
- コードレビューの徹底

---

## 📚 参考資料

### 内部ドキュメント

- `docs/clean-architecture-summary-report.md` - プロジェクト総括
- `docs/SECURITY_ENHANCEMENT_ROADMAP.md` - セキュリティ強化ロードマップ
- `README.md` - アーキテクチャ説明、開発コマンド

### 外部資料

**ドメインイベント**:
- Martin Fowler「Domain Events」: https://martinfowler.com/eaaDev/DomainEvent.html
- Eric Evans「Domain-Driven Design」

**パフォーマンス**:
- Chrome DevTools Performance: https://developer.chrome.com/docs/devtools/performance/
- Web Vitals: https://web.dev/vitals/

**セキュリティ**:
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CSP Level 3: https://www.w3.org/TR/CSP3/
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

---

## 📝 更新履歴

### バージョン 1.1 (2025-10-23)

**追加内容**:
- 「クリーンアーキテクチャ違反の検出と改善提案」セクションを新規追加
  - 6つの違反パターンと正しい実装例を詳細に説明
  - レイヤー別の配置ルールと実装時のチェックリストを追加

**主な改善点**:
1. **タスク1（ドメインイベント）**:
   - EventBusの具象クラス依存を指摘し、IEventPublisherインターフェースを使った実装に修正
   - Domain層のイベントがInfrastructure層の型に依存する問題を指摘

2. **タスク2（パフォーマンスモニタリング）**:
   - UseCaseがInfrastructure層のPerformanceMonitorに直接依存する問題を指摘
   - IPerformanceMonitorインターフェースを使った正しい実装パターンを提示
   - Domain層がChrome API（performance.now()）に依存する問題を指摘
   - ITimeProviderインターフェースを使った時刻取得パターンを追加

3. **タスク4（セキュリティ強化）**:
   - Domain層がzxcvbn外部ライブラリに直接依存する問題を指摘
   - IPasswordStrengthCheckerインターフェースを使った実装に修正
   - Domain層がDOMPurifyに直接依存する問題を指摘
   - IHtmlSanitizerインターフェースを使った実装に修正

**クリーンアーキテクチャの原則**:
- 依存の方向を明確化（外側 → 内側のみ）
- Domain層の独立性を強化（外部ライブラリ・ブラウザAPIへの依存を排除）
- インターフェースを使った依存性逆転の原則（DIP）を全タスクで適用
- テスト容易性の向上（モックによる依存性の差し替えが可能）

**目的**:
各タスクの実装前にクリーンアーキテクチャ違反を防止し、保守性・テスト容易性・拡張性の高いコードを実現する。

---

**End of Document**
