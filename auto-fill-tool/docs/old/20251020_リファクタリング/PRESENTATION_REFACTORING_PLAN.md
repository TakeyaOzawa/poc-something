# Presentation Layer Refactoring Plan
# プレゼンテーション層リファクタリング計画書

**Version:** 2.0.0
**Date:** 2025-01-20
**Status:** ✅ Completed - All Phases (Phase 1-8)
**Target:** v5.0.0

**進捗状況**:
- ✅ **Phase 1**: master-password-setup（完了）- 87.3%削減
- ✅ **Phase 2**: offscreen（完了）- 新規MVP作成
- ✅ **Phase 3**: unlock（完了）- 90.8%削減
- ✅ **Phase 4**: popup（完了）- 10.1%削減、Coordinator導入、98.14%カバレッジ達成
- ✅ **Phase 5**: system-settings（完了）- オーケストレーション層リファクタリング
- ✅ **Phase 6**: automation-variables-manager（完了）- 15.9%削減、Coordinator導入
- ✅ **Phase 7**: xpath-manager（完了）- 19.5%削減、Coordinator導入
- ✅ **Phase 8**: storage-sync-manager（完了）- 構造改善優先、Coordinator導入

**詳細**: 最新の進捗は `mvp-refactoring-progress.md` を参照

---

## 📋 目次

1. [外部仕様](#1-外部仕様-external-specification)
2. [内部仕様](#2-内部仕様-internal-specification)
3. [作業方針](#3-作業方針-implementation-strategy)
4. [影響範囲](#4-影響範囲-impact-analysis)
5. [タスクリスト](#5-タスクリスト-task-list)

---

## 1. 外部仕様 (External Specification)

### 1.1 概要

**目的**: プレゼンテーション層の4つのUI画面を、既存のPresenterパターンに統一してリファクタリングする。

**対象画面**:
1. `master-password-setup` - マスターパスワード設定画面（210行）
2. `unlock` - ロック解除画面（315行）
3. `offscreen` - オフスクリーンドキュメント（284行）
4. `popup` - ポップアップメイン画面（344行）

**ゴール**:
- メンテナンス性向上（コードの責任分離、単一責任原則の遵守）
- 可読性向上（クラス構造による明確な責任範囲）
- テスタビリティ向上（ユニットテストカバレッジ95%以上）
- プロジェクト全体のアーキテクチャ統一（既存4画面と同じパターン）

### 1.2 ユーザーへの影響

**重要**: このリファクタリングは内部実装のみの変更であり、**ユーザー体験（UX）への影響はゼロ**です。

#### 変更なし（No Changes）

- ✅ UI/UXデザイン（見た目、レイアウト、操作性）
- ✅ 機能（すべての既存機能が同じように動作）
- ✅ パフォーマンス（実行速度、レスポンス時間）
- ✅ 互換性（Chrome拡張機能API、既存データ）

#### 内部的な改善（Internal Improvements）

- ✅ コードの保守性向上（バグ修正が容易）
- ✅ テストカバレッジ向上（品質保証の強化）
- ✅ 将来の機能追加が容易（拡張性の向上）

### 1.3 機能要件（変更なし）

#### master-password-setup

- マスターパスワード入力（8文字以上、複雑さ要件）
- パスワード強度インジケーター（リアルタイム更新）
- パスワード確認入力
- バリデーションエラー表示
- セットアップ完了後の自動遷移

#### unlock

- マスターパスワード入力
- ロック解除試行
- 試行回数制限（5回まで）
- ロックアウト機能（5回失敗後、5分間ロック）
- ロックアウトタイマー表示
- セッションタイマー表示
- 自動ロック機能（アイドル時）

#### offscreen

- MediaRecorderによる画面録画処理
- メッセージハンドリング（background ↔ content-script間の中継）
- オフスクリーンドキュメントのライフサイクル管理

#### popup

- サイト一覧表示
- サイト追加・編集・削除
- 自動入力実行
- システム設定アクセス
- XPath管理画面アクセス
- 変数管理画面アクセス
- 同期設定アクセス

---

## 2. 内部仕様 (Internal Specification)

### 2.1 アーキテクチャパターン選定

#### 採用パターン: **MVP (Model-View-Presenter)**

**選定理由**:

1. **既存コードとの統一性**:
   - xpath-manager、system-settings、automation-variables-manager、storage-sync-manager が既にMVPパターンを採用
   - プロジェクト全体の統一性を保つ

2. **Clean Architectureとの親和性**:
   - Presenter が Use Case を呼び出す構造
   - View はDOM操作に専念
   - Domain層、UseCase層との明確な分離

3. **テスタビリティ**:
   - Presenter のビジネスロジックを単体テスト可能
   - View のモック化が容易
   - Use Case のモック化が容易

4. **TypeScriptとの相性**:
   - 型安全なインターフェース定義
   - 依存性注入（DI）の明確化

#### 検討したが採用しなかった他のパターン

| パターン | 不採用理由 |
|---------|-----------|
| **MVVM** | 双方向バインディングがTypeScript環境で複雑、既存コードとの統一性が低い |
| **MVC** | Controller が肥大化しやすい、テストが困難 |
| **FLUX/Redux** | 小規模なUI画面にはオーバーエンジニアリング |

### 2.2 クラス設計

#### 基本構成（各画面共通）

```
src/presentation/<screen-name>/
├── index.ts                          # エントリポイント（初期化のみ）
├── <ScreenName>Presenter.ts         # Presenter（ビジネスロジック）
├── <ScreenName>View.ts               # View（DOM操作）
├── types.ts                          # 型定義
└── __tests__/
    ├── <ScreenName>Presenter.test.ts
    └── <ScreenName>View.test.ts
```

#### 責任範囲

**index.ts** (Entry Point):
- 依存関係の初期化（Repository、UseCase、Logger）
- Presenter、Viewのインスタンス生成
- 初期化処理の起動
- **責任**: 依存性注入のみ（20-50行程度）

**Presenter** (Business Logic):
- Use Caseの呼び出し
- ビジネスロジックの調整
- View への表示指示
- イベントハンドリングの調整
- **責任**: ビジネスロジックの orchestration（100-200行程度）

**View** (DOM Manipulation):
- DOM要素の取得
- DOM要素の更新（表示/非表示、テキスト設定、スタイル変更）
- イベントリスナーの登録（Presenterのメソッドを呼び出し）
- **責任**: DOM操作のみ（80-150行程度）

**types.ts** (Type Definitions):
- Presenterインターフェース
- Viewインターフェース
- 画面固有の型定義
- **責任**: 型安全性の保証（20-40行程度）

### 2.3 実装例: master-password-setup

#### ディレクトリ構造

```
src/presentation/master-password-setup/
├── index.ts                             # 30行
├── MasterPasswordSetupPresenter.ts      # 150行
├── MasterPasswordSetupView.ts           # 120行
├── types.ts                             # 30行
└── __tests__/
    ├── MasterPasswordSetupPresenter.test.ts  # 200行
    └── MasterPasswordSetupView.test.ts       # 150行
```

#### types.ts

```typescript
import { Logger } from '@domain/services/Logger';
import { InitializeMasterPasswordUseCase } from '@usecases/InitializeMasterPasswordUseCase';

export interface IMasterPasswordSetupView {
  // DOM要素の取得
  getPassword(): string;
  getPasswordConfirm(): string;

  // 表示更新
  showMessage(text: string, type: 'error' | 'success'): void;
  hideMessage(): void;
  showLoading(): void;
  hideLoading(): void;
  updateStrengthIndicator(percentage: number, color: string, levelText: string, score: string): void;
  showFeedback(feedback: string[]): void;
  hideFeedback(): void;
  enableSetupButton(): void;
  disableSetupButton(): void;

  // イベントリスナー登録
  onPasswordInput(handler: () => void): void;
  onPasswordConfirmInput(handler: () => void): void;
  onSetupClick(handler: () => void): void;
}

export interface IMasterPasswordSetupPresenter {
  // 初期化
  init(): void;

  // イベントハンドラ
  handlePasswordInput(): void;
  handlePasswordConfirmInput(): void;
  handleSetup(): Promise<void>;
}

export interface MasterPasswordSetupDependencies {
  view: IMasterPasswordSetupView;
  initializeMasterPasswordUseCase: InitializeMasterPasswordUseCase;
  logger: Logger;
}
```

#### MasterPasswordSetupPresenter.ts

```typescript
import { PasswordStrength } from '@domain/values/PasswordStrength';
import { MasterPasswordRequirements } from '@domain/values/MasterPasswordRequirements';
import type {
  IMasterPasswordSetupPresenter,
  IMasterPasswordSetupView,
  MasterPasswordSetupDependencies,
} from './types';

export class MasterPasswordSetupPresenter implements IMasterPasswordSetupPresenter {
  private view: IMasterPasswordSetupView;
  private initializeMasterPasswordUseCase;
  private logger;

  constructor(deps: MasterPasswordSetupDependencies) {
    this.view = deps.view;
    this.initializeMasterPasswordUseCase = deps.initializeMasterPasswordUseCase;
    this.logger = deps.logger;
  }

  public init(): void {
    this.logger.info('Initializing Master Password Setup');

    // イベントリスナー登録
    this.view.onPasswordInput(() => this.handlePasswordInput());
    this.view.onPasswordConfirmInput(() => this.handlePasswordConfirmInput());
    this.view.onSetupClick(() => this.handleSetup());

    // 初期状態設定
    this.view.disableSetupButton();
    this.view.hideMessage();
  }

  public handlePasswordInput(): void {
    const password = this.view.getPassword();

    if (!password) {
      this.view.hideFeedback();
      this.view.disableSetupButton();
      return;
    }

    // パスワード強度計算（Domain層）
    const strength = PasswordStrength.calculate(password);

    // View更新
    const percentage = strength.getPercentage();
    const color = strength.getColor();
    const levelText = chrome.i18n.getMessage(`passwordStrength_${strength.level}`);
    const score = `${Math.round(percentage)}%`;

    this.view.updateStrengthIndicator(percentage, color, levelText, score);

    if (strength.feedback.length > 0) {
      this.view.showFeedback(strength.feedback);
    } else {
      this.view.hideFeedback();
    }

    // バリデーション
    this.validateAndUpdateButton();
  }

  public handlePasswordConfirmInput(): void {
    this.validateAndUpdateButton();
  }

  public async handleSetup(): Promise<void> {
    const password = this.view.getPassword();
    const passwordConfirm = this.view.getPasswordConfirm();

    // バリデーション
    const passwordValidation = MasterPasswordRequirements.validate(password);
    if (!passwordValidation.isValid) {
      this.view.showMessage(passwordValidation.errors.join(', '), 'error');
      return;
    }

    const confirmValidation = MasterPasswordRequirements.validateConfirmation(
      password,
      passwordConfirm
    );
    if (!confirmValidation.isValid) {
      this.view.showMessage(confirmValidation.errors.join(', '), 'error');
      return;
    }

    // Use Case実行
    this.view.showLoading();
    this.view.disableSetupButton();

    try {
      const result = await this.initializeMasterPasswordUseCase.execute({ password });

      if (result.success) {
        this.view.showMessage(chrome.i18n.getMessage('masterPasswordSetup_success'), 'success');
        // 1秒後にリダイレクト
        setTimeout(() => {
          window.location.href = 'popup.html';
        }, 1000);
      } else {
        this.view.showMessage(
          result.error || chrome.i18n.getMessage('masterPasswordSetup_error'),
          'error'
        );
        this.view.enableSetupButton();
      }
    } catch (error) {
      this.logger.error('Setup failed', { error });
      this.view.showMessage(chrome.i18n.getMessage('masterPasswordSetup_error'), 'error');
      this.view.enableSetupButton();
    } finally {
      this.view.hideLoading();
    }
  }

  private validateAndUpdateButton(): void {
    const password = this.view.getPassword();
    const passwordConfirm = this.view.getPasswordConfirm();

    const passwordValid = MasterPasswordRequirements.validate(password).isValid;
    const confirmValid =
      MasterPasswordRequirements.validateConfirmation(password, passwordConfirm).isValid;

    if (passwordValid && confirmValid) {
      this.view.enableSetupButton();
    } else {
      this.view.disableSetupButton();
    }
  }
}
```

#### MasterPasswordSetupView.ts

```typescript
import type { IMasterPasswordSetupView } from './types';

export class MasterPasswordSetupView implements IMasterPasswordSetupView {
  private passwordInput: HTMLInputElement;
  private passwordConfirmInput: HTMLInputElement;
  private setupBtn: HTMLButtonElement;
  private messageDiv: HTMLDivElement;
  private strengthIndicator: HTMLDivElement;
  private strengthBar: HTMLDivElement;
  private strengthText: HTMLSpanElement;
  private strengthScore: HTMLSpanElement;
  private feedbackDiv: HTMLDivElement;
  private loadingSpinner: HTMLDivElement;

  constructor() {
    // DOM要素の取得
    this.passwordInput = document.getElementById('password') as HTMLInputElement;
    this.passwordConfirmInput = document.getElementById('passwordConfirm') as HTMLInputElement;
    this.setupBtn = document.getElementById('setupBtn') as HTMLButtonElement;
    this.messageDiv = document.getElementById('message') as HTMLDivElement;
    this.strengthIndicator = document.getElementById('strengthIndicator') as HTMLDivElement;
    this.strengthBar = document.getElementById('strengthBar') as HTMLDivElement;
    this.strengthText = document.getElementById('strengthText') as HTMLSpanElement;
    this.strengthScore = document.getElementById('strengthScore') as HTMLSpanElement;
    this.feedbackDiv = document.getElementById('feedback') as HTMLDivElement;
    this.loadingSpinner = document.getElementById('loadingSpinner') as HTMLDivElement;
  }

  public getPassword(): string {
    return this.passwordInput.value;
  }

  public getPasswordConfirm(): string {
    return this.passwordConfirmInput.value;
  }

  public showMessage(text: string, type: 'error' | 'success'): void {
    this.messageDiv.textContent = text;
    this.messageDiv.className = `message show ${type}`;
  }

  public hideMessage(): void {
    this.messageDiv.className = 'message';
  }

  public showLoading(): void {
    this.loadingSpinner.style.display = 'flex';
  }

  public hideLoading(): void {
    this.loadingSpinner.style.display = 'none';
  }

  public updateStrengthIndicator(
    percentage: number,
    color: string,
    levelText: string,
    score: string
  ): void {
    this.strengthIndicator.style.display = 'block';
    this.strengthBar.style.width = `${percentage}%`;
    this.strengthBar.style.backgroundColor = color;
    this.strengthText.textContent = `${chrome.i18n.getMessage('masterPasswordSetup_strengthLabel')} ${levelText}`;
    this.strengthScore.textContent = score;
  }

  public showFeedback(feedback: string[]): void {
    const feedbackHtml = `
      <strong>${chrome.i18n.getMessage('passwordFeedback_title')}:</strong>
      <ul>
        ${feedback.map((f) => `<li>${f}</li>`).join('')}
      </ul>
    `;
    this.feedbackDiv.innerHTML = feedbackHtml;
    this.feedbackDiv.classList.add('show');
  }

  public hideFeedback(): void {
    this.feedbackDiv.classList.remove('show');
  }

  public enableSetupButton(): void {
    this.setupBtn.disabled = false;
  }

  public disableSetupButton(): void {
    this.setupBtn.disabled = true;
  }

  public onPasswordInput(handler: () => void): void {
    this.passwordInput.addEventListener('input', handler);
  }

  public onPasswordConfirmInput(handler: () => void): void {
    this.passwordConfirmInput.addEventListener('input', handler);
  }

  public onSetupClick(handler: () => void): void {
    this.setupBtn.addEventListener('click', handler);
  }
}
```

#### index.ts

```typescript
import { BackgroundLogger } from '@/infrastructure/loggers/BackgroundLogger';
import { LogLevel } from '@domain/services/Logger';
import { InitializeMasterPasswordUseCase } from '@usecases/InitializeMasterPasswordUseCase';
import { MasterPasswordSetupPresenter } from './MasterPasswordSetupPresenter';
import { MasterPasswordSetupView } from './MasterPasswordSetupView';

// 初期化
const logger = new BackgroundLogger('MasterPasswordSetup', LogLevel.INFO);
const initializeMasterPasswordUseCase = new InitializeMasterPasswordUseCase();

const view = new MasterPasswordSetupView();
const presenter = new MasterPasswordSetupPresenter({
  view,
  initializeMasterPasswordUseCase,
  logger,
});

// 起動
presenter.init();
```

### 2.4 他の画面の実装方針

#### unlock

**追加Manager**: TimerManager (セッションタイマー、ロックアウトタイマー管理)

```
src/presentation/unlock/
├── index.ts
├── UnlockPresenter.ts
├── UnlockView.ts
├── TimerManager.ts           # タイマー管理専用
├── types.ts
└── __tests__/
    ├── UnlockPresenter.test.ts
    ├── UnlockView.test.ts
    └── TimerManager.test.ts
```

#### offscreen

**追加Handler**: MediaRecorderHandler (録画処理の管理)

```
src/presentation/offscreen/
├── index.ts
├── OffscreenPresenter.ts
├── OffscreenView.ts
├── MediaRecorderHandler.ts   # MediaRecorder専用
├── types.ts
└── __tests__/
    ├── OffscreenPresenter.test.ts
    ├── OffscreenView.test.ts
    └── MediaRecorderHandler.test.ts
```

#### popup

**統合方針**: 既存のWebsiteListController、ModalManager、WebsiteActionHandlerを維持しつつ、Presenterパターンに統合

```
src/presentation/popup/
├── index.ts
├── PopupPresenter.ts          # 新規（全体の orchestration）
├── PopupView.ts               # 新規（DOM操作の統一）
├── WebsiteListController.ts   # 既存（サイト一覧管理、Presenterから呼び出し）
├── ModalManager.ts            # 既存（モーダル管理、Presenterから呼び出し）
├── WebsiteActionHandler.ts   # 既存（アクション処理、Presenterから呼び出し）
├── SettingsModalManager.ts    # 既存（設定モーダル）
├── PopupAlpine.ts             # 既存（Alpine.js統合）
├── types.ts                   # 既存＋追加
└── __tests__/
    ├── PopupPresenter.test.ts  # 新規
    ├── PopupView.test.ts       # 新規
    └── WebsiteListController.test.ts  # 既存
```

---

## 3. 作業方針 (Implementation Strategy)

### 3.1 基本原則

1. **段階的移行 (Incremental Refactoring)**:
   - 1画面ずつ実装・テスト・リリース
   - 各画面でテスト合格後、次の画面へ進む
   - リスクを最小化

2. **テスト駆動 (Test-Driven)**:
   - 既存機能のE2Eテストを先に作成（Playwright）
   - リファクタリング後も同じテストが合格すること
   - ユニットテストカバレッジ95%以上

3. **既存コードとの統一 (Consistency)**:
   - xpath-manager、system-settings等と同じパターン
   - 命名規則の統一（Presenter、View、types）
   - ディレクトリ構造の統一

4. **Clean Architectureの遵守**:
   - Presenter → Use Case → Repository の流れ
   - Domain層への依存のみ許可（逆依存禁止）
   - View は Presenter のみに依存

### 3.2 実装順序

**優先順位の根拠**:
- 小さい画面から実装（リスク低減）
- 機能的に独立した画面から実装（影響範囲の限定）

```
Phase 1: master-password-setup (210行、最小、独立性高)
Phase 2: offscreen (284行、独立性高)
Phase 3: unlock (315行、master-password-setupと連携）
Phase 4: popup (344行、最大、既存Controller/Manager統合が必要）
```

### 3.3 各フェーズの手順

**各画面共通の実装ステップ** (6ステップ):

1. **設計** (1日):
   - 責任範囲の明確化
   - インターフェース定義 (types.ts)
   - クラス図作成

2. **View実装** (1日):
   - MasterPasswordSetupView.ts 作成
   - DOM操作メソッド実装
   - イベントリスナー登録メソッド実装

3. **Presenter実装** (2日):
   - MasterPasswordSetupPresenter.ts 作成
   - ビジネスロジック移行
   - Use Case呼び出し実装

4. **index.ts簡素化** (0.5日):
   - 依存性注入のみに縮小
   - 初期化処理をPresenter.init()に移譲

5. **ユニットテスト作成** (2日):
   - Presenter.test.ts (150-200行)
   - View.test.ts (100-150行)
   - カバレッジ95%以上確認

6. **統合テスト・検証** (1.5日):
   - 既存機能のE2Eテスト作成（Playwright）
   - リファクタリング後のE2Eテスト実行
   - 手動テスト（全機能確認）

**合計工数**: 8日/画面

### 3.4 品質保証プロセス

**各フェーズ完了時の必須チェック**:

```bash
# 1. Lint
npm run lint
# → 0 errors, 0 warnings

# 2. ユニットテスト
npm test
# → 全テスト合格

# 3. カバレッジ
npm run test:coverage
# → 修正範囲が95%以上

# 4. ビルド
npm run build
# → 0 errors

# 5. E2Eテスト（該当画面のみ）
npm run test:e2e -- <screen-name>.spec.ts
# → 全テスト合格
```

---

## 4. 影響範囲 (Impact Analysis)

### 4.1 ファイル追加・変更一覧

#### Phase 1: master-password-setup

**新規作成** (5ファイル):
```
src/presentation/master-password-setup/
├── MasterPasswordSetupPresenter.ts      # 新規 (150行)
├── MasterPasswordSetupView.ts           # 新規 (120行)
├── types.ts                             # 新規 (30行)
└── __tests__/
    ├── MasterPasswordSetupPresenter.test.ts  # 新規 (200行)
    └── MasterPasswordSetupView.test.ts       # 新規 (150行)
```

**変更** (1ファイル):
```
src/presentation/master-password-setup/
└── index.ts                             # 変更 (210行 → 30行、-180行)
```

**合計**: +470行（新規650行 - 削減180行）

#### Phase 2: offscreen

**新規作成** (6ファイル):
```
src/presentation/offscreen/
├── OffscreenPresenter.ts                # 新規 (180行)
├── OffscreenView.ts                     # 新規 (100行)
├── MediaRecorderHandler.ts              # 新規 (120行)
├── types.ts                             # 新規 (40行)
└── __tests__/
    ├── OffscreenPresenter.test.ts       # 新規 (220行)
    ├── OffscreenView.test.ts            # 新規 (150行)
    └── MediaRecorderHandler.test.ts     # 新規 (180行)
```

**変更** (1ファイル):
```
src/presentation/offscreen/
└── index.ts                             # 変更 (284行 → 40行、-244行)
```

**合計**: +746行（新規990行 - 削減244行）

#### Phase 3: unlock

**新規作成** (7ファイル):
```
src/presentation/unlock/
├── UnlockPresenter.ts                   # 新規 (200行)
├── UnlockView.ts                        # 新規 (150行)
├── TimerManager.ts                      # 新規 (100行)
├── types.ts                             # 新規 (40行)
└── __tests__/
    ├── UnlockPresenter.test.ts          # 新規 (250行)
    ├── UnlockView.test.ts               # 新規 (180行)
    └── TimerManager.test.ts             # 新規 (150行)
```

**変更** (1ファイル):
```
src/presentation/unlock/
└── index.ts                             # 変更 (315行 → 40行、-275行)
```

**合計**: +795行（新規1070行 - 削減275行）

#### Phase 4: popup

**新規作成** (3ファイル):
```
src/presentation/popup/
├── PopupPresenter.ts                    # 新規 (250行)
├── PopupView.ts                         # 新規 (180行)
└── __tests__/
    ├── PopupPresenter.test.ts           # 新規 (300行)
    └── PopupView.test.ts                # 新規 (200行)
```

**変更** (2ファイル):
```
src/presentation/popup/
├── index.ts                             # 変更 (344行 → 50行、-294行)
└── types.ts                             # 変更 (既存に追加 +50行)
```

**合計**: +636行（新規930行 - 削減294行）

#### 全体サマリー

| Phase | 新規ファイル | 新規行数 | 削減行数 | 純増 | テストファイル | テスト行数 |
|-------|-------------|---------|---------|------|--------------|----------|
| Phase 1 | 5 | 650 | 180 | +470 | 2 | 350 |
| Phase 2 | 6 | 990 | 244 | +746 | 3 | 550 |
| Phase 3 | 7 | 1070 | 275 | +795 | 3 | 580 |
| Phase 4 | 3 | 930 | 294 | +636 | 2 | 500 |
| **合計** | **21** | **3640** | **993** | **+2647** | **10** | **1980** |

### 4.2 テストカバレッジへの影響

#### 現状（リファクタリング前）

```
File                                     | % Stmts | % Branch | % Funcs | % Lines |
-----------------------------------------|---------|----------|---------|---------|
src/presentation/master-password-setup/  | 0%      | 0%       | 0%      | 0%      |
src/presentation/offscreen/              | 0%      | 0%       | 0%      | 0%      |
src/presentation/unlock/                 | 0%      | 0%       | 0%      | 0%      |
src/presentation/popup/                  | 75%     | 60%      | 80%     | 75%     |
```

**注**: master-password-setup、offscreen、unlockは現在テストなし

#### 目標（リファクタリング後）

```
File                                     | % Stmts | % Branch | % Funcs | % Lines |
-----------------------------------------|---------|----------|---------|---------|
src/presentation/master-password-setup/  | 96%     | 90%      | 98%     | 96%     |
src/presentation/offscreen/              | 96%     | 90%      | 98%     | 96%     |
src/presentation/unlock/                 | 96%     | 90%      | 98%     | 96%     |
src/presentation/popup/                  | 96%     | 90%      | 98%     | 96%     |
```

**全体への影響**:
- プロジェクト全体のテストケース数: 4302 → **約4800** (+498件)
- プロジェクト全体のカバレッジ: 85.4% → **約88%** (+2.6%)

### 4.3 ビルドへの影響

#### バンドルサイズ

**現状**: 13MB (dist/)

**予測**: 13.2MB (+200KB、+1.5%)

**理由**:
- クラス構造化による若干のオーバーヘッド
- インターフェース定義の追加
- 影響は軽微（許容範囲）

#### ビルド時間

**現状**: ~30秒 (production build)

**予測**: ~32秒 (+2秒、+6.7%)

**理由**:
- TypeScript型チェックの対象ファイル増加
- 影響は軽微（許容範囲）

### 4.4 既存コードへの影響

#### 影響なし（Zero Impact）

- ✅ Domain層（エンティティ、バリューオブジェクト）
- ✅ UseCase層（すべてのユースケース）
- ✅ Infrastructure層（Repository、Adapter）
- ✅ 他のPresentation層画面（xpath-manager、system-settings等）
- ✅ Background script
- ✅ Content script

#### 軽微な影響（Minor Impact）

- ⚠️ **HTMLファイル**: 変更なし（既存のDOM構造を維持）
- ⚠️ **CSSファイル**: 変更なし（既存のスタイルを維持）
- ⚠️ **webpack.config.js**: 変更なし（エントリポイント維持）

---

## 5. タスクリスト (Task List)

**注**: Phase 1-8はすべて完了しました（2025-01-20）。詳細な実装内容と成果は `mvp-refactoring-progress.md` を参照してください。

### 5.1 Phase 1: master-password-setup ✅ 完了 (8日間)

#### Week 1: 設計・View実装 (3日)

**Day 1: 設計**
- [ ] 責任範囲の明確化ドキュメント作成
- [ ] types.ts のインターフェース設計
- [ ] クラス図作成（Presenter、View）
- [ ] メソッド一覧作成（Presenter: 10個、View: 20個）

**Day 2-3: View実装**
- [ ] MasterPasswordSetupView.ts 作成
- [ ] DOM要素取得メソッド実装 (2個)
  - [ ] getPassword()
  - [ ] getPasswordConfirm()
- [ ] 表示更新メソッド実装 (10個)
  - [ ] showMessage(), hideMessage()
  - [ ] showLoading(), hideLoading()
  - [ ] updateStrengthIndicator()
  - [ ] showFeedback(), hideFeedback()
  - [ ] enableSetupButton(), disableSetupButton()
- [ ] イベントリスナー登録メソッド実装 (3個)
  - [ ] onPasswordInput()
  - [ ] onPasswordConfirmInput()
  - [ ] onSetupClick()

#### Week 2: Presenter実装 (3日)

**Day 4-5: Presenter実装**
- [ ] MasterPasswordSetupPresenter.ts 作成
- [ ] コンストラクタ・依存性注入
- [ ] init() メソッド実装
- [ ] イベントハンドラ実装 (3個)
  - [ ] handlePasswordInput()
  - [ ] handlePasswordConfirmInput()
  - [ ] handleSetup()
- [ ] プライベートメソッド実装 (2個)
  - [ ] validateAndUpdateButton()
  - [ ] redirectToPopup()

**Day 6: index.ts簡素化**
- [ ] index.ts を依存性注入のみに簡素化
- [ ] RepositoryFactory 初期化
- [ ] UseCase 初期化
- [ ] Logger 初期化
- [ ] Presenter、View インスタンス生成
- [ ] presenter.init() 呼び出し

#### Week 3: テスト・検証 (2日)

**Day 7: ユニットテスト作成**
- [ ] MasterPasswordSetupPresenter.test.ts (200行)
  - [ ] init()のテスト (3ケース)
  - [ ] handlePasswordInput()のテスト (5ケース)
  - [ ] handlePasswordConfirmInput()のテスト (3ケース)
  - [ ] handleSetup()のテスト (8ケース)
    - [ ] 正常系: セットアップ成功
    - [ ] 異常系: パスワードバリデーション失敗
    - [ ] 異常系: 確認パスワード不一致
    - [ ] 異常系: UseCase実行失敗
- [ ] MasterPasswordSetupView.test.ts (150行)
  - [ ] DOM要素取得のテスト (2ケース)
  - [ ] 表示更新メソッドのテスト (10ケース)
  - [ ] イベントリスナー登録のテスト (3ケース)
- [ ] カバレッジ確認 (95%以上)

**Day 8: 統合テスト・検証**
- [ ] E2Eテスト作成 (master-password-setup.spec.ts)
  - [ ] パスワード入力 → 強度インジケーター更新
  - [ ] バリデーションエラー表示
  - [ ] セットアップ成功 → popup.htmlへリダイレクト
- [ ] 手動テスト（全機能確認）
- [ ] Lint・ビルド確認
- [ ] ドキュメント更新（CHANGELOG.md）

---

### 5.2 Phase 2: offscreen ✅ 完了 (8日間)

#### Week 1: 設計・View実装 (3日)

**Day 1: 設計**
- [ ] 責任範囲の明確化（MediaRecorder処理の分離）
- [ ] types.ts のインターフェース設計
- [ ] クラス図作成（Presenter、View、MediaRecorderHandler）

**Day 2-3: View・Handler実装**
- [ ] OffscreenView.ts 作成
- [ ] MediaRecorderHandler.ts 作成
  - [ ] startRecording()
  - [ ] stopRecording()
  - [ ] onDataAvailable()
  - [ ] onError()

#### Week 2: Presenter実装 (3日)

**Day 4-5: Presenter実装**
- [ ] OffscreenPresenter.ts 作成
- [ ] メッセージハンドリング実装
  - [ ] handleStartRecording()
  - [ ] handleStopRecording()
  - [ ] handleGetStream()
- [ ] MediaRecorderHandlerとの連携

**Day 6: index.ts簡素化**
- [ ] index.ts を依存性注入のみに簡素化
- [ ] chrome.runtime.onMessage リスナー登録

#### Week 3: テスト・検証 (2日)

**Day 7: ユニットテスト作成**
- [ ] OffscreenPresenter.test.ts (220行)
- [ ] OffscreenView.test.ts (150行)
- [ ] MediaRecorderHandler.test.ts (180行)
- [ ] カバレッジ確認 (95%以上)

**Day 8: 統合テスト・検証**
- [ ] E2Eテスト作成 (offscreen.spec.ts)
- [ ] 手動テスト（画面録画機能）
- [ ] Lint・ビルド確認
- [ ] ドキュメント更新

---

### 5.3 Phase 3: unlock ✅ 完了 (8日間)

#### Week 1: 設計・View実装 (3日)

**Day 1: 設計**
- [ ] 責任範囲の明確化（タイマー管理の分離）
- [ ] types.ts のインターフェース設計
- [ ] クラス図作成（Presenter、View、TimerManager）

**Day 2-3: View・TimerManager実装**
- [ ] UnlockView.ts 作成
- [ ] TimerManager.ts 作成
  - [ ] startSessionTimer()
  - [ ] stopSessionTimer()
  - [ ] startLockoutTimer()
  - [ ] stopLockoutTimer()
  - [ ] formatTime()

#### Week 2: Presenter実装 (3日)

**Day 4-5: Presenter実装**
- [ ] UnlockPresenter.ts 作成
- [ ] イベントハンドラ実装
  - [ ] handleUnlock()
  - [ ] handlePasswordInput()
- [ ] タイマー連携実装
- [ ] ロックアウトロジック実装

**Day 6: index.ts簡素化**
- [ ] index.ts を依存性注入のみに簡素化
- [ ] UseCase 初期化

#### Week 3: テスト・検証 (2日)

**Day 7: ユニットテスト作成**
- [ ] UnlockPresenter.test.ts (250行)
- [ ] UnlockView.test.ts (180行)
- [ ] TimerManager.test.ts (150行)
- [ ] カバレッジ確認 (95%以上)

**Day 8: 統合テスト・検証**
- [ ] E2Eテスト作成 (unlock.spec.ts)
  - [ ] ロック解除成功
  - [ ] ロック解除失敗（5回失敗でロックアウト）
  - [ ] ロックアウトタイマー表示
  - [ ] セッションタイマー表示
- [ ] 手動テスト
- [ ] Lint・ビルド確認
- [ ] ドキュメント更新

---

### 5.4 Phase 4: popup ✅ 完了 (8日間)

#### Week 1: 設計・View実装 (3日)

**Day 1: 設計**
- [ ] 既存Controller/Managerとの統合方針確定
- [ ] types.ts 拡張設計
- [ ] クラス図作成（Presenter、View、既存クラスとの関係）

**Day 2-3: View実装**
- [ ] PopupView.ts 作成
- [ ] DOM操作メソッド実装 (25個)
- [ ] 既存Manager（ModalManager、SettingsModalManager）との連携

#### Week 2: Presenter実装 (3日)

**Day 4-5: Presenter実装**
- [ ] PopupPresenter.ts 作成
- [ ] 既存WebsiteListControllerとの統合
- [ ] 既存WebsiteActionHandlerとの統合
- [ ] Alpine.js統合維持

**Day 6: index.ts簡素化**
- [ ] index.ts を依存性注入のみに簡素化
- [ ] RepositoryFactory、UseCase初期化
- [ ] Presenter、View、既存Controllerのインスタンス生成

#### Week 3: テスト・検証 (2日)

**Day 7: ユニットテスト作成**
- [ ] PopupPresenter.test.ts (300行)
- [ ] PopupView.test.ts (200行)
- [ ] 既存テスト（WebsiteListController.test.ts）の更新
- [ ] カバレッジ確認 (95%以上)

**Day 8: 統合テスト・検証**
- [ ] E2Eテスト作成 (popup.spec.ts)
  - [ ] サイト一覧表示
  - [ ] サイト追加・編集・削除
  - [ ] 自動入力実行
  - [ ] 各種画面遷移
- [ ] 手動テスト
- [ ] Lint・ビルド確認
- [ ] ドキュメント更新

---

### 5.5 Phase 5-8: 追加リファクタリング ✅ 完了

Phase 5-8はPhase 1-4の実施後に追加で実施されました。各Phaseの詳細は `mvp-refactoring-progress.md` を参照してください。

**Phase 5: system-settings**（完了 2025-01-17）
- オーケストレーション層リファクタリング
- index.ts: 508行→212行（58%削減）
- SystemSettingsCoordinator拡張
- 96%カバレッジ維持

**Phase 6: automation-variables-manager**（完了 2025-01-20）
- Coordinator新規作成 + Controller維持パターン
- index.ts: 725行→610行（15.9%削減）
- 98.46%カバレッジ達成

**Phase 7: xpath-manager**（完了 2025-01-20）
- Phase 6パターン適用
- index.ts: 478行→385行（19.5%削減）
- 140テスト合格

**Phase 8: storage-sync-manager**（完了 2025-01-20）
- 構造改善優先（行数増加も正当化）
- index.ts: 877行→984行（+12.2%、4ヘルパー関数抽出）
- 105テスト合格

### 5.6 最終フェーズ: 統合・リリース ✅ 完了

**全体統合テスト**
- ✅ 全画面のテスト実行（Phase 1-8）
- ✅ ユニットテストカバレッジ96%以上達成
- ✅ Lint 0 errors, 0 warnings
- ✅ ビルド成功

**ドキュメント更新**
- ✅ mvp-refactoring-progress.md 作成（Phase 1-8詳細記録）
- ✅ PRESENTATION_REFACTORING_PLAN.md 更新（本ドキュメント）

---

## 6. スケジュール

### 6.1 全体スケジュール

```
Phase 1: master-password-setup  → 8日 (Week 1-2)
Phase 2: offscreen              → 8日 (Week 3-4)
Phase 3: unlock                 → 8日 (Week 5-6)
Phase 4: popup                  → 8日 (Week 7-8)
統合・リリース                   → 3日 (Week 9)

合計: 35日 (約7週間)
```

### 6.2 マイルストーン

| Week | Phase | 主な成果物 | 完了基準 |
|------|-------|-----------|---------|
| Week 1-2 | Phase 1 | master-password-setup Presenterパターン化 | テスト95%以上、E2E合格 |
| Week 3-4 | Phase 2 | offscreen Presenterパターン化 | テスト95%以上、E2E合格 |
| Week 5-6 | Phase 3 | unlock Presenterパターン化 | テスト95%以上、E2E合格 |
| Week 7-8 | Phase 4 | popup Presenterパターン化 | テスト95%以上、E2E合格 |
| Week 9 | 統合 | v5.0.0リリース | 全E2Eテスト合格、ドキュメント完成 |

---

## 7. リスク管理

### 7.1 高リスク項目

| リスク | 影響 | 確率 | 軽減策 |
|-------|------|------|--------|
| **既存機能のデグレ** | 高 | 中 | E2Eテスト先行作成、段階的移行 |
| **popup画面の統合難** | 中 | 中 | 既存Controller/Managerを最大限維持、段階的統合 |
| **スケジュール遅延** | 中 | 中 | 週次レビュー、優先度調整 |
| **E2Eテスト不安定** | 中 | 高 | Playwright + Manifest V3問題は既知、ユニットテスト重視 |

### 7.2 対応方針

**E2Eテスト不安定への対応**:
- v4.1.0で判明した「Playwright + Chrome Extension Manifest V3」の技術制約を考慮
- E2Eテストは補助的な位置づけ
- ユニットテスト95%以上を必須条件とする
- 手動テストで主要フローを必ず確認

---

## 8. 成功基準

### 8.1 技術的成功基準

| 指標 | 現状 | 目標 | 測定方法 |
|-----|------|------|---------|
| ユニットテストカバレッジ | 0-75% | **95%以上** | `npm run test:coverage` |
| Lint エラー | 0 errors | **0 errors** | `npm run lint` |
| ビルド成功 | ✅ | **✅** | `npm run build` |
| E2Eテスト合格率 | 0% | **80%以上** | `npm run test:e2e` |
| コード行数（実装部分） | 1153行 | **約900行** | 約-250行削減（重複除去） |
| テストコード行数 | 350行 | **約2330行** | +1980行 |

### 8.2 品質基準

- ✅ すべての既存機能が同じように動作（デグレなし）
- ✅ すべてのユニットテストが合格
- ✅ カバレッジ95%以上
- ✅ Lint 0 errors, 0 warnings
- ✅ ビルド成功
- ✅ E2Eテスト80%以上合格（Playwright制約を考慮）

### 8.3 保守性基準

- ✅ 各クラスの責任が明確（Single Responsibility Principle）
- ✅ 各ファイルが200行以内（読みやすさ）
- ✅ 循環的複雑度10以下（Cognitive Complexity）
- ✅ すべてのpublicメソッドに型定義

---

## 9. 参考資料

### 9.1 既存のPresenterパターン実装例

- `src/presentation/xpath-manager/` - Presenter + View + Manager
- `src/presentation/system-settings/` - Presenter + View + Controller
- `src/presentation/automation-variables-manager/` - Presenter + View
- `src/presentation/storage-sync-manager/` - Presenter + View

### 9.2 関連ドキュメント

- `README.md` - プロジェクト概要、アーキテクチャ
- `CHANGELOG.md` - 変更履歴
- `docs/UI_REDESIGN/DEVELOPER_GUIDE.md` - 開発者ガイド
- `docs/外部データソース連携/IMPLEMENTATION_PLAN.md` - Clean Architecture実装方針

### 9.3 外部参考資料

- [Martin Fowler - GUI Architectures](https://martinfowler.com/eaaDev/uiArchs.html)
- [MVP Pattern in TypeScript](https://refactoring.guru/design-patterns/mvp)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## 更新履歴

- **2025-01-19**: 初版作成
- **2025-01-20**: Phase 1-8完了により全体ステータス更新

---

**最終更新日**: 2025-01-20
**Version**: 2.0.0
