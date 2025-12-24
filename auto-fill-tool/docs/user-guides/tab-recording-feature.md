# タブ録画機能の設計と実装手順

## 概要

自動入力中のタブを録画し、`AutomationResult`に関連付けて保存する機能を追加します。
参考実装: `../hotel-booking-checker/chrome-tab-recorder-clean-arch`

**主な変更点（v2.0）**:
- データ格納にIndexedDBを使用（大容量対応）
- システム設定に録画関連の設定項目を追加
- タブのライフサイクルに応じた録画制御
- UIからの録画視聴機能

### データ構造の関係性

本機能では、3つのストレージを使用してデータを管理します：

```
【Chrome Local Storage】

┌─────────────────────────────────────┐
│ Website (Webサイト基本情報)        │
│ ├─ id                               │  ← Webサイト識別子
│ ├─ name                             │
│ ├─ startUrl                         │
│ ├─ editable                         │
│ └─ updatedAt                        │
└─────────────────────────────────────┘
         │ 1:N                  │ 1:N
         ↓                      ↓
┌─────────────────────┐  ┌─────────────────────────────────────┐
│ XPath               │  │ AutomationVariables                 │
│ (自動入力フロー定義)│  │ (実行用変数データ)                  │
│ ├─ id               │  │ ├─ id                               │  ← UIで選択されるID
│ ├─ websiteId ───────┼──┼─ websiteId ────┐                   │
│ ├─ value            │  │ ├─ variables    │ 同じWebsite      │
│ ├─ actionType       │  │ ├─ status       │                   │
│ ├─ pathAbsolute     │  │ └─ updatedAt    │                   │
│ ├─ executionOrder   │  └─────────────────┼───────────────────┘
│ └─ ...              │                    │
└─────────────────────┘                    │
                                           │ 1:N
                                           ↓
                            ┌─────────────────────────────────────┐
                            │ AutomationResult                    │
                            │ ├─ id (UUID)                        │  ← 実行ごとに生成
                            │ ├─ automationVariablesId            │  → AutomationVariables.id
                            │ ├─ executionStatus                  │
                            │ ├─ startedAt                        │
                            │ └─ endedAt                          │
                            └─────────────────────────────────────┘
                                           │ 1:1
                                           ↓
【IndexedDB】
┌─────────────────────────────────────┐
│ TabRecording                        │
│ ├─ id (UUID)                        │
│ ├─ automationResultId               │  → AutomationResult.id
│ ├─ blobData (Blob: 大容量動画)     │
│ ├─ startedAt                        │
│ └─ metadata                         │
└─────────────────────────────────────┘
```

**なぜこの構造か？**
1. **Chrome Local Storage**: 既存の`Website`, `XPath`, `AutomationVariables`, `AutomationResult`はここに保存されており、軽量なメタデータに適している
2. **IndexedDB**: 大容量の録画データ（Blob）を保存するため。Chrome Local Storageには10MB制限がある
3. **エンティティの役割**:
   - **Website**: Webサイトの基本情報（名前、URL等）
   - **XPath**: 自動入力の操作フロー定義（どのような順序でどの要素に何を入力するか）
   - **AutomationVariables**: 実際の入力値（Webサイトごとのテストデータや個人情報）
   - **AutomationResult**: 実行結果（成功/失敗、実行時刻等）
   - **TabRecording**: 実行中の画面録画（大容量のBlob）
4. **1:1の関係**: 1つの実行（AutomationResult）に対して1つの録画（TabRecording）

**重要な設計ポイント**:
- AutomationVariablesには`name`フィールドは存在せず、`websiteId`でWebsiteを参照
- UI表示時には、Presenterが`Website.name`を取得して`websiteName`として追加（AutomationVariablesManagerPresenter.ts:102）
- 同じWebsiteに対して複数のAutomationVariablesを作成可能（異なるテストデータセット）

**UIからの録画視聴の流れ**
```
automation-variables-manager.html
  → AutomationVariables.id を持っている
  → 最新のAutomationResultを取得 (loadLatestByAutomationVariablesId)
  → そのAutomationResult.idから録画を取得
  → 録画データ（Blob）を動画プレーヤーで再生
```

---

## 1. 外部仕様

### 1.1 機能要件

#### 主要機能

1. **自動録画開始**
   - 自動入力実行開始時に、システム設定に応じてタブの録画を自動的に開始
   - 録画対象: タブの映像（オーディオはオプション）
   - 録画形式: WebM形式（MediaRecorder APIのデフォルト）
   - 録画品質: システム設定で指定されたビットレートを使用

2. **自動録画停止**
   - 以下のタイミングで録画を自動停止：
     - 自動入力が成功した場合
     - 自動入力が失敗した場合
     - 録画対象のタブが閉じられた場合
   - 録画データを`AutomationResult`に関連付けて保存

3. **録画データの保存**
   - 録画データ（Blobデータ）をIndexedDBに保存
   - `AutomationResult`のIDをキーとして関連付け
   - 録画メタデータ（ファイルサイズ、録画時間、ビットレート等）も保存
   - 古い録画データの自動削除（過去10日間のみ保持、10日より古い録画は削除）

4. **録画データの取得と視聴**
   - `AutomationResult`のIDから録画データを取得可能
   - automation-variables-manager.htmlから最新の録画を視聴可能
   - 録画データをBlobとして返却し、video要素で再生

5. **システム設定**
   - 録画の有効/無効を切り替え可能
   - 録画ビットレート（品質）を設定可能
   - 録画保持期間（日数）を設定可能（デフォルト: 10日間）

### 1.2 利用シーン

- 自動入力の実行プロセスを証跡として記録
- デバッグ時に自動入力の動作を確認
- 自動入力が失敗した場合の原因調査
- 実行履歴から過去の自動入力の様子を確認

### 1.3 非機能要件

- **パフォーマンス**: 録画によって自動入力の実行速度が著しく低下しないこと
- **ストレージ**: IndexedDBを使用し、大容量データに対応
- **プライバシー**: 録画データは暗号化して保存（将来対応）
- **互換性**: Chrome Manifest V3に準拠
- **ユーザビリティ**: 録画の有効/無効を簡単に切り替え可能

---

## 2. 内部仕様

### 2.1 アーキテクチャ概要

クリーンアーキテクチャの原則に従い、以下の層で実装します：

```
┌─────────────────────────────────────────────────────────┐
│              Presentation Layer                          │
│  - ExecuteAutoFillUseCase にタブ録画機能を統合         │
│  - AutomationVariablesManagerに録画視聴機能を追加      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────────┐
│           Application Layer (Use Cases)                 │
│                    │                                     │
│  ┌─────────────────┴──────────────────────────┐        │
│  │  StartTabRecordingUseCase                  │        │
│  │  StopTabRecordingUseCase                   │        │
│  │  GetRecordingByResultIdUseCase             │        │
│  │  GetLatestRecordingByVariablesIdUseCase    │        │
│  │  DeleteOldRecordingsUseCase                │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────────┐
│              Domain Layer                                │
│                    │                                     │
│  ┌────────────────┴─────────────────────────┐          │
│  │  TabRecording (Entity)                   │          │
│  │  - id, automationResultId, status        │          │
│  │  - startedAt, endedAt, blobData          │          │
│  │  - metadata (size, duration, bitrate)    │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │  SystemSettings (Entity) - 拡張          │          │
│  │  + enableTabRecording: boolean           │          │
│  │  + recordingBitrate: number              │          │
│  │  + recordingRetentionDays: number        │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │  Interfaces (Repository & Adapters)      │          │
│  │  - RecordingStorageRepository            │          │
│  │  - TabCaptureAdapter                     │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────────┐
│           Infrastructure Layer                           │
│                    │                                     │
│  ┌────────────────┴─────────────────────────┐          │
│  │  ChromeTabCaptureAdapter                 │          │
│  │  (implements TabCaptureAdapter)          │          │
│  │  - Chrome Tab Capture API使用           │          │
│  │  - MediaRecorder APIで録画制御          │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │  IndexedDBRecordingRepository            │          │
│  │  (implements RecordingStorageRepository) │          │
│  │  - IndexedDB API使用                     │          │
│  │  - 大容量データ対応                      │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 ドメイン層

#### 2.2.1 TabRecording エンティティ

**責務**: 録画データとそのライフサイクルを管理

```typescript
// src/domain/entities/TabRecording.ts
export interface TabRecordingData {
  id: string;                      // 録画ID（UUID）
  automationResultId: string;       // 関連するAutomationResultのID
  tabId: number;                    // 録画したタブID
  status: RecordingStatus;          // 録画状態
  startedAt: string;                // 録画開始時刻 (ISO 8601)
  endedAt: string | null;           // 録画終了時刻 (ISO 8601 or null)
  blobData: Blob | null;            // 録画データ（Blob形式）
  mimeType: string;                 // MIMEタイプ (video/webm)
  sizeBytes: number;                // ファイルサイズ（バイト）
  durationMs: number | null;        // 録画時間（ミリ秒）
  bitrate: number;                  // 録画ビットレート（bps）
}

export enum RecordingStatus {
  IDLE = 'idle',
  RECORDING = 'recording',
  STOPPED = 'stopped',
  SAVED = 'saved',
  ERROR = 'error'
}

export class TabRecording {
  private data: TabRecordingData;

  constructor(data: TabRecordingData);

  // Getters
  getId(): string;
  getAutomationResultId(): string;
  getStatus(): RecordingStatus;
  getBlobData(): Blob | null;
  getSizeBytes(): number;
  getDurationMs(): number | null;
  getBitrate(): number;
  // ... その他のgetter

  // State transitions
  start(): TabRecording;            // 録画開始
  stop(): TabRecording;             // 録画停止
  save(blobData: Blob): TabRecording;  // 録画データ保存
  markError(errorMessage: string): TabRecording;

  // Queries
  isRecording(): boolean;
  isStopped(): boolean;
  getDurationSeconds(): number | null;
  getSizeMB(): number;

  // Static factory
  static create(params: {
    automationResultId: string;
    tabId: number;
    bitrate: number;
  }): TabRecording;
}
```

#### 2.2.2 SystemSettings エンティティの拡張

**追加プロパティ**:

```typescript
// src/domain/entities/SystemSettings.ts に追加
export interface SystemSettingsData {
  // 既存のプロパティ...
  retryWaitSecondsMin: number;
  retryWaitSecondsMax: number;
  retryCount: number;
  waitForOptionsMilliseconds: number;
  showAutoFillProgressDialog: boolean;
  logLevel: LogLevel;

  // 新規追加: タブ録画設定
  enableTabRecording: boolean;         // 録画の有効/無効
  recordingBitrate: number;            // 録画ビットレート（bps）例: 2500000 = 2.5Mbps
  recordingRetentionDays: number;      // 録画データ保持期間（日数）
}

export class SystemSettings {
  // 既存のメソッド...

  // 新規追加
  getEnableTabRecording(): boolean;
  getRecordingBitrate(): number;
  getRecordingRetentionDays(): number;

  setEnableTabRecording(enabled: boolean): SystemSettings;
  setRecordingBitrate(bitrate: number): SystemSettings;
  setRecordingRetentionDays(days: number): SystemSettings;

  // デフォルト値
  static createDefault(): SystemSettings {
    return new SystemSettings({
      // 既存のデフォルト値...
      retryWaitSecondsMin: 5,
      retryWaitSecondsMax: 10,
      retryCount: 3,
      waitForOptionsMilliseconds: 1000,
      showAutoFillProgressDialog: true,
      logLevel: LogLevel.INFO,

      // 新規追加のデフォルト値
      enableTabRecording: true,          // デフォルトで有効
      recordingBitrate: 2500000,         // 2.5Mbps
      recordingRetentionDays: 10,        // 過去10日間を保持
    });
  }
}
```

#### 2.2.3 リポジトリインターフェース

```typescript
// src/domain/repositories/RecordingStorageRepository.d.ts
export interface RecordingStorageRepository {
  save(recording: TabRecording): Promise<void>;
  load(id: string): Promise<TabRecording | null>;
  loadByAutomationResultId(resultId: string): Promise<TabRecording | null>;
  loadLatestByAutomationVariablesId(variablesId: string): Promise<TabRecording | null>;
  loadAll(): Promise<TabRecording[]>;
  delete(id: string): Promise<void>;
  deleteByAutomationResultId(resultId: string): Promise<void>;
  deleteOldRecordings(retentionDays: number): Promise<void>;
  getStorageSize(): Promise<number>;
}
```

#### 2.2.4 アダプターインターフェース

```typescript
// src/domain/services/TabCaptureAdapter.d.ts
export interface TabCaptureConfig {
  audio: boolean;
  video: boolean;
  videoBitsPerSecond?: number;  // 録画ビットレート
  videoConstraints?: {
    mandatory?: {
      minWidth?: number;
      minHeight?: number;
      maxWidth?: number;
      maxHeight?: number;
    };
  };
}

export interface TabCaptureAdapter {
  captureTab(tabId: number, config: TabCaptureConfig): Promise<MediaStream>;
  startRecording(
    stream: MediaStream,
    config: TabCaptureConfig,
    onDataAvailable: (chunk: Blob) => void
  ): Promise<string>; // returns recorderId
  stopRecording(recorderId: string): Promise<Blob>; // returns final blob
  isRecording(recorderId: string): boolean;
}
```

### 2.3 アプリケーション層 (Use Cases)

#### 2.3.1 StartTabRecordingUseCase

```typescript
// src/usecases/StartTabRecordingUseCase.ts
export interface StartTabRecordingRequest {
  tabId: number;
  automationResultId: string;
}

export class StartTabRecordingUseCase {
  constructor(
    private tabCaptureAdapter: TabCaptureAdapter,
    private recordingRepository: RecordingStorageRepository,
    private systemSettingsRepository: SystemSettingsRepository,
    private logger: Logger
  ) {}

  async execute(request: StartTabRecordingRequest): Promise<TabRecording | null> {
    // 1. システム設定を確認（録画が有効か）
    const settings = await this.systemSettingsRepository.load();
    if (!settings.getEnableTabRecording()) {
      this.logger.info('Tab recording is disabled in system settings');
      return null;
    }

    // 2. TabRecordingエンティティを作成
    const recording = TabRecording.create({
      automationResultId: request.automationResultId,
      tabId: request.tabId,
      bitrate: settings.getRecordingBitrate(),
    });

    // 3. Chrome Tab Capture APIで録画開始
    const config: TabCaptureConfig = {
      audio: false,
      video: true,
      videoBitsPerSecond: settings.getRecordingBitrate(),
    };

    try {
      const stream = await this.tabCaptureAdapter.captureTab(request.tabId, config);

      const chunks: Blob[] = [];
      const recorderId = await this.tabCaptureAdapter.startRecording(
        stream,
        config,
        (chunk) => chunks.push(chunk)
      );

      // 4. 録画エンティティを保存（状態: RECORDING）
      const startedRecording = recording.start();
      await this.recordingRepository.save(startedRecording);

      this.logger.info('Tab recording started', {
        recordingId: recording.getId(),
        bitrate: settings.getRecordingBitrate()
      });

      return startedRecording;
    } catch (error) {
      this.logger.error('Failed to start tab recording', error);
      const errorRecording = recording.markError('Failed to start recording');
      await this.recordingRepository.save(errorRecording);
      throw error;
    }
  }
}
```

#### 2.3.2 StopTabRecordingUseCase

```typescript
// src/usecases/StopTabRecordingUseCase.ts
export interface StopTabRecordingRequest {
  automationResultId: string;
}

export class StopTabRecordingUseCase {
  constructor(
    private tabCaptureAdapter: TabCaptureAdapter,
    private recordingRepository: RecordingStorageRepository,
    private logger: Logger
  ) {}

  async execute(request: StopTabRecordingRequest): Promise<TabRecording | null> {
    // 1. automationResultIdから録画エンティティを取得
    const recording = await this.recordingRepository.loadByAutomationResultId(
      request.automationResultId
    );

    if (!recording) {
      this.logger.warn('Recording not found', { automationResultId: request.automationResultId });
      return null;
    }

    if (!recording.isRecording()) {
      this.logger.warn('Recording is not in progress', { recordingId: recording.getId() });
      return recording;
    }

    try {
      // 2. 録画停止
      const blob = await this.tabCaptureAdapter.stopRecording(recording.getId());

      // 3. エンティティを更新して保存
      const stoppedRecording = recording.stop().save(blob);
      await this.recordingRepository.save(stoppedRecording);

      this.logger.info('Tab recording stopped', {
        recordingId: recording.getId(),
        sizeBytes: blob.size,
        durationMs: stoppedRecording.getDurationMs(),
      });

      return stoppedRecording;
    } catch (error) {
      this.logger.error('Failed to stop tab recording', error);
      const errorRecording = recording.markError('Failed to stop recording');
      await this.recordingRepository.save(errorRecording);
      throw error;
    }
  }
}
```

#### 2.3.3 GetRecordingByResultIdUseCase

```typescript
// src/usecases/GetRecordingByResultIdUseCase.ts
export class GetRecordingByResultIdUseCase {
  constructor(
    private recordingRepository: RecordingStorageRepository,
    private logger: Logger
  ) {}

  async execute(automationResultId: string): Promise<TabRecording | null> {
    const recording = await this.recordingRepository.loadByAutomationResultId(
      automationResultId
    );

    if (!recording) {
      this.logger.info('Recording not found', { automationResultId });
      return null;
    }

    return recording;
  }
}
```

#### 2.3.4 GetLatestRecordingByVariablesIdUseCase（新規）

**なぜこのUseCaseが必要か？**

automation-variables-manager.htmlでは、ユーザーが特定のWebサイト（AutomationVariables）の最新録画を視聴したい場合があります。しかし：

1. **UIが持っているID**: `AutomationVariables.id`（websiteId）のみ
2. **録画が保存されているキー**: `AutomationResult.id`

この2つは異なるIDであり、間に`AutomationResult`が存在します。
さらに、1つの`AutomationVariables`に対して複数の`AutomationResult`が存在します（実行履歴）。

そのため、以下の手順が必要です：
```
AutomationVariables.id
  ↓ (1:N関係から最新を取得)
AutomationResult.id
  ↓ (1:1関係で録画を取得)
TabRecording
```

このUseCaseは、この2段階の検索を1つの責務としてカプセル化しています。

```typescript
// src/usecases/GetLatestRecordingByVariablesIdUseCase.ts
export class GetLatestRecordingByVariablesIdUseCase {
  constructor(
    private recordingRepository: RecordingStorageRepository,
    private automationResultRepository: AutomationResultRepository,
    private logger: Logger
  ) {}

  async execute(automationVariablesId: string): Promise<TabRecording | null> {
    // ステップ1: AutomationVariablesIdに紐づく最新のAutomationResultを取得
    const latestResult = await this.automationResultRepository
      .loadLatestByAutomationVariablesId(automationVariablesId);

    if (!latestResult) {
      this.logger.info('No automation result found', { automationVariablesId });
      return null;
    }

    // ステップ2: AutomationResultIdに紐づく録画データを取得
    const recording = await this.recordingRepository.loadByAutomationResultId(
      latestResult.getId()
    );

    if (!recording) {
      this.logger.info('No recording found for latest result', {
        automationResultId: latestResult.getId(),
      });
      return null;
    }

    return recording;
  }
}
```

#### 2.3.5 DeleteOldRecordingsUseCase（新規）

```typescript
// src/usecases/DeleteOldRecordingsUseCase.ts
export class DeleteOldRecordingsUseCase {
  constructor(
    private recordingRepository: RecordingStorageRepository,
    private systemSettingsRepository: SystemSettingsRepository,
    private logger: Logger
  ) {}

  async execute(): Promise<number> {
    const settings = await this.systemSettingsRepository.load();
    const retentionDays = settings.getRecordingRetentionDays();

    const deletedCount = await this.recordingRepository.deleteOldRecordings(retentionDays);

    this.logger.info('Old recordings deleted', {
      deletedCount,
      retentionDays,
    });

    return deletedCount;
  }
}
```

### 2.4 インフラストラクチャ層

#### 2.4.1 ChromeTabCaptureAdapter

```typescript
// src/infrastructure/adapters/ChromeTabCaptureAdapter.ts
export class ChromeTabCaptureAdapter implements TabCaptureAdapter {
  private mediaRecorders: Map<string, {
    recorder: MediaRecorder;
    chunks: Blob[];
    stream: MediaStream;
  }>;

  constructor() {
    this.mediaRecorders = new Map();
  }

  async captureTab(tabId: number, config: TabCaptureConfig): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      chrome.tabCapture.capture(
        {
          audio: config.audio,
          video: config.video,
        },
        (stream) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!stream) {
            reject(new Error('Failed to capture tab'));
            return;
          }

          resolve(stream);
        }
      );
    });
  }

  async startRecording(
    stream: MediaStream,
    config: TabCaptureConfig,
    onDataAvailable: (chunk: Blob) => void
  ): Promise<string> {
    const recorderId = `recorder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const options: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp9',
    };

    // ビットレートが指定されている場合は設定
    if (config.videoBitsPerSecond) {
      options.videoBitsPerSecond = config.videoBitsPerSecond;
    }

    const mediaRecorder = new MediaRecorder(stream, options);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
        onDataAvailable(event.data);
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
    };

    this.mediaRecorders.set(recorderId, {
      recorder: mediaRecorder,
      chunks,
      stream,
    });

    // 1秒ごとにチャンクを生成
    mediaRecorder.start(1000);

    return recorderId;
  }

  async stopRecording(recorderId: string): Promise<Blob> {
    const recorderData = this.mediaRecorders.get(recorderId);

    if (!recorderData) {
      throw new Error('MediaRecorder not found');
    }

    const { recorder, chunks, stream } = recorderData;

    return new Promise((resolve) => {
      recorder.onstop = () => {
        // ストリームを停止
        stream.getTracks().forEach(track => track.stop());

        // チャンクをBlobに結合
        const blob = new Blob(chunks, { type: 'video/webm' });

        // クリーンアップ
        this.mediaRecorders.delete(recorderId);

        resolve(blob);
      };

      if (recorder.state === 'recording') {
        recorder.stop();
      } else {
        // 既に停止している場合
        const blob = new Blob(chunks, { type: 'video/webm' });
        this.mediaRecorders.delete(recorderId);
        resolve(blob);
      }
    });
  }

  isRecording(recorderId: string): boolean {
    const recorderData = this.mediaRecorders.get(recorderId);
    return recorderData?.recorder.state === 'recording';
  }
}
```

#### 2.4.2 IndexedDBRecordingRepository

```typescript
// src/infrastructure/repositories/IndexedDBRecordingRepository.ts
export class IndexedDBRecordingRepository implements RecordingStorageRepository {
  private readonly DB_NAME = 'AutoFillToolDB';
  private readonly STORE_NAME = 'tab_recordings';
  private readonly DB_VERSION = 1;

  constructor(private logger: Logger) {}

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Object Storeが存在しない場合は作成
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });

          // インデックスを作成
          objectStore.createIndex('automationResultId', 'automationResultId', { unique: true });
          objectStore.createIndex('startedAt', 'startedAt', { unique: false });

          this.logger.info('IndexedDB object store created', { storeName: this.STORE_NAME });
        }
      };
    });
  }

  async save(recording: TabRecording): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(recording.toData());

      request.onsuccess = () => {
        this.logger.info('Recording saved to IndexedDB', { id: recording.getId() });
        resolve();
      };

      request.onerror = () => {
        this.logger.error('Failed to save recording to IndexedDB', request.error);
        reject(new Error('Failed to save recording'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  async load(id: string): Promise<TabRecording | null> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          resolve(new TabRecording(data));
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load recording'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  async loadByAutomationResultId(resultId: string): Promise<TabRecording | null> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    const index = store.index('automationResultId');

    return new Promise((resolve, reject) => {
      const request = index.get(resultId);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          resolve(new TabRecording(data));
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load recording by automation result ID'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  async loadAll(): Promise<TabRecording[]> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const recordings = request.result.map((data: TabRecordingData) => new TabRecording(data));
        resolve(recordings);
      };

      request.onerror = () => {
        reject(new Error('Failed to load all recordings'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => {
        this.logger.info('Recording deleted from IndexedDB', { id });
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete recording'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  async deleteByAutomationResultId(resultId: string): Promise<void> {
    const recording = await this.loadByAutomationResultId(resultId);
    if (recording) {
      await this.delete(recording.getId());
    }
  }

  async deleteOldRecordings(retentionDays: number): Promise<number> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    const index = store.index('startedAt');

    // Calculate cutoff date (recordings older than this will be deleted)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = cutoffDate.toISOString();

    return new Promise((resolve, reject) => {
      const request = index.openCursor(); // 昇順（古い順）
      const toDelete: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          const startedAt = cursor.value.startedAt as string;

          // If recording is older than cutoff date, mark for deletion
          if (startedAt < cutoffTimestamp) {
            toDelete.push(cursor.value.id);
            store.delete(cursor.value.id);
          }

          cursor.continue();
        } else {
          // All recordings have been processed
          this.logger.info('Old recordings marked for deletion', {
            deletedCount: toDelete.length,
            retentionDays,
            cutoffDate: cutoffTimestamp,
          });

          resolve(toDelete.length);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to delete old recordings'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  async getStorageSize(): Promise<number> {
    const recordings = await this.loadAll();
    return recordings.reduce((total, rec) => total + rec.getSizeBytes(), 0);
  }
}
```

### 2.5 既存システムとの統合

#### 2.5.1 ExecuteAutoFillUseCaseの修正

```typescript
// src/usecases/ExecuteAutoFillUseCase.ts
export class ExecuteAutoFillUseCase {
  // eslint-disable-next-line max-params
  constructor(
    private xpathRepository: XPathRepository,
    private autoFillService: AutoFillService,
    private automationVariablesRepository: AutomationVariablesRepository,
    private automationResultRepository: AutomationResultRepository,
    // 新規追加
    private startRecordingUseCase: StartTabRecordingUseCase,
    private stopRecordingUseCase: StopTabRecordingUseCase,
    private deleteOldRecordingsUseCase: DeleteOldRecordingsUseCase,
    private logger: Logger = new NoOpLogger()
  ) {}

  async execute(request: ExecuteAutoFillRequest): Promise<AutoFillResult> {
    // ... 既存のコード ...

    // AutomationResultを作成
    automationResult = AutomationResult.create({...});
    await this.automationResultRepository.save(automationResult);

    // 【新規追加】録画開始
    let hasRecording = false;
    try {
      const recording = await this.startRecordingUseCase.execute({
        tabId: request.tabId,
        automationResultId: automationResult.getId(),
      });
      hasRecording = recording !== null;

      if (hasRecording) {
        this.logger.info('Tab recording started for auto-fill execution');
      }
    } catch (error) {
      this.logger.warn('Failed to start recording', error);
      // 録画失敗は自動入力を中断しない
    }

    // 【新規追加】タブが閉じられた場合の録画停止リスナー
    const tabRemovedListener = (tabId: number) => {
      if (tabId === request.tabId && hasRecording) {
        this.stopRecordingUseCase.execute({
          automationResultId: automationResult!.getId(),
        }).catch((error) => {
          this.logger.error('Failed to stop recording on tab close', error);
        });
      }
    };

    chrome.tabs.onRemoved.addListener(tabRemovedListener);

    try {
      // 自動入力実行
      const result = await this.autoFillService.executeAutoFill(...);

      // 【新規追加】録画停止
      if (hasRecording) {
        try {
          await this.stopRecordingUseCase.execute({
            automationResultId: automationResult.getId(),
          });
          this.logger.info('Tab recording stopped after auto-fill execution');
        } catch (error) {
          this.logger.warn('Failed to stop recording', error);
        }
      }

      // 【新規追加】古い録画データを削除
      try {
        await this.deleteOldRecordingsUseCase.execute();
      } catch (error) {
        this.logger.warn('Failed to delete old recordings', error);
      }

      return result;
    } finally {
      // リスナーを削除
      chrome.tabs.onRemoved.removeListener(tabRemovedListener);
    }
  }
}
```

#### 2.5.2 AutomationVariablesManagerへの統合（新規）

**Presenter層**:

```typescript
// src/presentation/automation-variables-manager/AutomationVariablesManagerPresenter.ts
export class AutomationVariablesManagerPresenter {
  constructor(
    // 既存のdependencies...
    private getLatestRecordingUseCase: GetLatestRecordingByVariablesIdUseCase,
    private logger: Logger
  ) {}

  // 既存のメソッド...

  async getLatestRecording(variablesId: string): Promise<TabRecording | null> {
    try {
      const recording = await this.getLatestRecordingUseCase.execute(variablesId);
      return recording;
    } catch (error) {
      this.logger.error('Failed to get latest recording', error);
      return null;
    }
  }
}
```

**View層**:

```typescript
// src/presentation/automation-variables-manager/AutomationVariablesManagerView.ts
export class AutomationVariablesManagerView {
  // 既存のメソッド...

  /**
   * 録画プレビューを表示
   */
  showRecordingPreview(recording: TabRecording): void {
    const modal = document.createElement('div');
    modal.className = 'recording-modal';
    modal.innerHTML = `
      <div class="recording-modal-content">
        <div class="recording-modal-header">
          <h3>録画プレビュー</h3>
          <button class="close-recording-modal">✖</button>
        </div>
        <div class="recording-modal-body">
          <video id="recordingVideo" controls width="100%">
            <source src="" type="${recording.getMimeType()}">
            お使いのブラウザは動画再生に対応していません。
          </video>
          <div class="recording-info">
            <p>録画時間: ${Math.round(recording.getDurationSeconds() || 0)}秒</p>
            <p>ファイルサイズ: ${recording.getSizeMB().toFixed(2)}MB</p>
            <p>ビットレート: ${(recording.getBitrate() / 1000000).toFixed(2)}Mbps</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 録画データをvideoタグに設定
    const videoElement = modal.querySelector('#recordingVideo') as HTMLVideoElement;
    const blobData = recording.getBlobData();
    if (blobData) {
      const url = URL.createObjectURL(blobData);
      videoElement.src = url;

      // モーダルが閉じられたらBlobURLを解放
      const closeBtn = modal.querySelector('.close-recording-modal') as HTMLButtonElement;
      closeBtn.addEventListener('click', () => {
        URL.revokeObjectURL(url);
        modal.remove();
      });

      // モーダル背景クリックで閉じる
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          URL.revokeObjectURL(url);
          modal.remove();
        }
      });
    }
  }

  /**
   * 録画が存在しない場合のメッセージを表示
   */
  showNoRecordingMessage(): void {
    alert('最新の録画データが見つかりません。');
  }
}
```

**Controller層**:

```typescript
// src/presentation/automation-variables-manager/index.ts に追加
class AutomationVariablesManagerController {
  // 既存のコード...

  /**
   * 録画プレビューを開く
   */
  private async openRecordingPreview(variablesId: string): Promise<void> {
    try {
      const recording = await this.presenter.getLatestRecording(variablesId);

      if (recording && recording.getBlobData()) {
        this.presenter.getView().showRecordingPreview(recording);
      } else {
        this.presenter.getView().showNoRecordingMessage();
      }
    } catch (error) {
      this.logger.error('Failed to open recording preview', error);
      alert('録画データの取得に失敗しました。');
    }
  }

  /**
   * 録画プレビューボタンのリスナーをアタッチ
   */
  private attachRecordingPreviewListeners(): void {
    const previewButtons = this.variablesList.querySelectorAll('[data-action="preview-recording"]');

    previewButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) await this.openRecordingPreview(id);
      });
    });
  }
}
```

### 2.6 システム設定UIの更新

**HTML**:

```html
<!-- src/presentation/xpath-manager/index.html に追加 -->
<div class="settings-section">
  <h3>録画設定</h3>

  <div class="form-group">
    <label for="enableTabRecording">自動入力中の録画</label>
    <input type="checkbox" id="enableTabRecording">
    <span>有効</span>
  </div>

  <div class="form-group">
    <label for="recordingBitrate">録画ビットレート (Mbps)</label>
    <input type="number" id="recordingBitrate" min="1" max="10" step="0.5" value="2.5">
  </div>

  <div class="form-group">
    <label for="recordingRetentionDays">録画保持期間（日数）</label>
    <input type="number" id="recordingRetentionDays" min="1" max="365" value="10">
    <span class="help-text">過去N日間の録画を保持します（それより古い録画は自動削除されます）</span>
  </div>
</div>
```

---

## 3. 実装手順と進捗状況

### 進捗概要

**現在のステータス**: フェーズ1〜6完了、タブ録画機能実装完了 🎉🎉

- ✅ フェーズ1: ドメイン層の実装（完了）
- ✅ フェーズ2: インフラストラクチャ層の実装（完了）
- ✅ フェーズ3: アプリケーション層の実装（完了）
- ✅ フェーズ4: 既存システムとの統合（完了）
- ✅ フェーズ5: マニフェストとDIの更新（完了）
- ✅ フェーズ6: テストと調整（完了）

**最終更新**: 2025-10-16

---

### フェーズ1: ドメイン層の実装

#### ✅ ステップ1: TabRecordingエンティティの実装

**ファイル**:
- ✅ `src/domain/entities/TabRecording.ts`
- ✅ `src/domain/entities/__tests__/TabRecording.test.ts`

**実装内容**:
- ✅ `TabRecording` エンティティの実装
- ✅ `RecordingStatus` enumの定義
- ✅ Blob形式でのデータ保持
- ✅ State transitionメソッド (`start()`, `stop()`, `save()`, `markError()`)
- ✅ Queryメソッド (`isRecording()`, `isStopped()`, `getDurationSeconds()`, `getSizeMB()`)

#### ✅ ステップ2: SystemSettingsエンティティの拡張

**ファイル**:
- ✅ `src/domain/entities/SystemSettings.ts` を編集

**実装内容**:
- ✅ 録画関連の3つのプロパティを追加
  - `enableTabRecording: boolean`
  - `recordingBitrate: number`
  - `recordingRetentionDays: number`
- ✅ Getter/Setterの追加
- ✅ デフォルト値の設定（有効化、2.5Mbps、10日保持）

#### ✅ ステップ3: リポジトリ・アダプターインターフェースの定義

**ファイル**:
- ✅ `src/domain/repositories/RecordingStorageRepository.d.ts`
- ✅ `src/domain/adapters/TabCaptureAdapter.d.ts`

**実装内容**:
- ✅ `RecordingStorageRepository`インターフェース定義
  - `save()`, `load()`, `loadByAutomationResultId()`, `loadLatestByAutomationVariablesId()`
  - `delete()`, `deleteByAutomationResultId()`, `deleteOldRecordings()`
- ✅ `TabCaptureAdapter`インターフェース定義
  - `captureTab()`, `startRecording()`, `stopRecording()`, `isRecording()`

---

### フェーズ2: インフラストラクチャ層の実装

#### ✅ ステップ4: ChromeTabCaptureAdapterの実装

**ファイル**:
- ✅ `src/infrastructure/adapters/ChromeTabCaptureAdapter.ts`
- ⬜ `src/infrastructure/adapters/__tests__/ChromeTabCaptureAdapter.test.ts` (未実装)

**実装内容**:
- ✅ Chrome Tab Capture APIのラッパー
- ✅ MediaRecorder APIの統合（ビットレート対応）
- ✅ recorderId管理（Map構造で複数録画対応）
- ✅ ストリーム停止処理
- ⬜ ユニットテスト（未実装）

#### ✅ ステップ5: IndexedDBRecordingRepositoryの実装

**ファイル**:
- ✅ `src/infrastructure/repositories/IndexedDBRecordingRepository.ts`
- ✅ `src/infrastructure/repositories/__tests__/IndexedDBRecordingRepository.test.ts`

**実装内容**:
- ✅ IndexedDB APIを使用した永続化
- ✅ Blobデータの直接保存（Base64変換不要）
- ✅ インデックスを使用した高速検索（automationResultId, startedAt）
- ✅ 古いデータの自動削除機能（`deleteOldRecordings()`）
- ✅ `loadLatestByAutomationVariablesId()`実装（AutomationResult経由で最新録画取得）
- ✅ ストレージサイズ計算（`getStorageSize()`）
- ⬜ 統合テスト（未実装）

---

### フェーズ3: アプリケーション層の実装

#### ✅ ステップ6: UseCaseの実装

**ファイル**:
- ✅ `src/usecases/StartTabRecordingUseCase.ts`
- ✅ `src/usecases/StopTabRecordingUseCase.ts`
- ✅ `src/usecases/GetRecordingByResultIdUseCase.ts`
- ✅ `src/usecases/GetLatestRecordingByVariablesIdUseCase.ts`
- ✅ `src/usecases/DeleteOldRecordingsUseCase.ts`

**実装内容**:
- ✅ StartTabRecordingUseCase
  - システム設定で録画有効確認
  - TabRecordingエンティティ作成
  - Chrome Tab Capture APIで録画開始
  - エンティティをRECORDING状態で保存
- ✅ StopTabRecordingUseCase
  - automationResultIdから録画取得
  - MediaRecorder停止
  - Blobデータ保存、エンティティ更新
- ✅ GetRecordingByResultIdUseCase
  - AutomationResultIdから録画を取得
  - ログ出力とエラーハンドリング
- ✅ GetLatestRecordingByVariablesIdUseCase
  - AutomationVariablesIdから最新AutomationResultを取得
  - AutomationResultIdから録画を取得（2段階検索）
- ✅ DeleteOldRecordingsUseCase
  - システム設定から保持期間を取得
  - 保持期間を超えた録画を削除
- ⬜ ユニットテスト（未実装）

---

### フェーズ4: 既存システムとの統合

#### ✅ ステップ7: ExecuteAutoFillUseCaseの修正

**ファイル**:
- ✅ `src/usecases/ExecuteAutoFillUseCase.ts`

**実装内容**:
- ✅ コンストラクタに3つの録画UseCaseを追加
  - `startRecordingUseCase`, `stopRecordingUseCase`, `deleteOldRecordingsUseCase`
- ✅ 録画開始ロジックの追加（AutomationResult作成後）
- ✅ タブクローズ監視の追加（`chrome.tabs.onRemoved`リスナー）
- ✅ 自動入力完了後の録画停止処理
- ✅ 古い録画データの削除処理
- ✅ エラーハンドリング（録画失敗でも自動入力は継続）
- ✅ リスナークリーンアップ（finally節）

#### ✅ ステップ8: AutomationVariablesManagerの拡張

**ファイル**:
- ✅ `src/presentation/automation-variables-manager/AutomationVariablesManagerPresenter.ts`
- ✅ `src/presentation/automation-variables-manager/AutomationVariablesManagerView.ts`
- ✅ `src/presentation/automation-variables-manager/index.ts`

**実装内容**:
- ✅ Presenterに`GetLatestRecordingByVariablesIdUseCase`を統合
- ✅ Presenterに録画取得メソッド追加（`getLatestRecording()`）
- ✅ Presenterに`getView()`メソッド追加
- ✅ Controllerに`GetLatestRecordingByVariablesIdUseCase`の初期化
- ✅ `IndexedDBRecordingRepository`のインスタンス化
- ✅ Viewに録画プレビュー機能（`showRecordingPreview()`, `showNoRecordingMessage()`）
- ✅ Controllerにイベントハンドラ追加（`openRecordingPreview()`）
- ✅ 録画プレビューボタンのレンダリング
- ✅ I18nAdapter・messages.jsonに録画関連メッセージ追加

#### ✅ ステップ9: SystemSettingsManagerの拡張

**ファイル**:
- ✅ `src/presentation/xpath-manager/SystemSettingsManager.ts`
- ✅ `public/xpath-manager.html`

**実装内容**:
- ✅ コンストラクタに3つの録画設定入力フィールドを追加
  - `enableTabRecordingInput`, `recordingBitrateInput`, `recordingRetentionDaysInput`
- ✅ 設定の読み込み処理（`loadSystemSettings()`）
- ✅ 設定の保存処理（`saveSystemSettings()`）
- ✅ バリデーション処理
  - ビットレート: 0.1-10 Mbps
  - 保持期間: 1-365日
- ✅ HTMLに録画設定UIの追加（タブ録画設定セクション）

---

### フェーズ5: マニフェストとDIの更新

#### ✅ ステップ10: manifest.jsonの更新

**ファイル**:
- ✅ `manifest.json`

**実装内容**:
- ✅ `tabCapture`パーミッションの追加（既に存在）

#### ✅ ステップ11: DIコンテナの更新

**ファイル**:
- ✅ `src/presentation/background/index.ts`
- ✅ `src/presentation/xpath-manager/index.ts`
- ✅ `src/presentation/automation-variables-manager/index.ts`

**実装内容**:
- ✅ background/index.ts
  - `ChromeTabCaptureAdapter`のインスタンス化
  - `IndexedDBRecordingRepository`のインスタンス化
  - 3つの録画UseCaseの初期化
  - `ExecuteAutoFillUseCase`に録画UseCaseを注入
- ✅ xpath-manager/index.ts
  - `SystemSettingsManager`に録画設定入力フィールドを追加
- ✅ automation-variables-manager/index.ts
  - `GetLatestRecordingByVariablesIdUseCase`の初期化
  - `IndexedDBRecordingRepository`のインスタンス化
  - Presenterに録画UseCaseを注入

#### ✅ TypeScriptコンパイルエラーの修正

**実施内容**:
- ✅ `IndexedDBRecordingRepository.ts`: `getStartedAt()` → `getStartFrom()`に修正
- ✅ `I18nAdapter.ts`: `'recordingLoadFailed'` MessageKeyを追加
- ✅ `automation-variables-manager/index.ts`: Logger型エラーを修正
- ✅ `background/index.ts`: 録画UseCaseの引数不足を修正
- ✅ `xpath-manager/index.ts`: SystemSettingsManagerの引数不足を修正（録画設定入力3つ追加）
- ✅ `ExecuteAutoFillUseCase.ts`: LogContext型エラーを修正（`logger.warn()` → `logger.error()`）
- ✅ TypeScriptコンパイル: **エラーなし**

---

### フェーズ6: テストと調整（完了）

#### ✅ ステップ12: 統合テスト

**ファイル**:
- ✅ `src/__tests__/integration/TabRecording.integration.test.ts` (完了)

**実装内容**:
- ✅ 自動入力実行時の録画フロー全体のテスト
  - ✅ 録画開始・停止の正常系テスト
  - ✅ 設定で無効化されている場合のテスト
  - ✅ カスタムビットレートでの録画テスト
- ✅ タブクローズ時の録画停止テスト
  - ✅ タブクローズによる録画停止テスト
  - ✅ 存在しない録画の停止処理テスト
- ✅ 古いデータの自動削除テスト
  - ✅ 保持期間を超えたデータの削除テスト
  - ✅ カスタム保持期間の尊重テスト
- ✅ UIからの録画視聴テスト
  - ✅ AutomationVariablesIdから最新録画取得テスト
  - ✅ 録画が存在しない場合のテスト
- ✅ エラーハンドリングテスト
  - ✅ 録画開始失敗時の処理テスト
  - ✅ 録画停止失敗時の処理テスト
- ✅ ストレージ管理テスト
  - ✅ 総ストレージサイズ計算テスト

**テスト結果**:
```
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Time:        1.577 s
```

#### ⬜ ステップ13: マニュアルテスト（推奨）

**テスト項目**:
- ⬜ 各種シナリオでの動作確認
  - ⬜ 基本的な自動入力+録画
  - ⬜ タブクローズ時の録画停止
  - ⬜ 録画設定の変更（有効/無効、ビットレート、保持期間）
- ⬜ パフォーマンステスト
  - ⬜ 録画による自動入力速度への影響測定
  - ⬜ メモリ使用量の監視
- ⬜ ストレージ容量テスト
  - ⬜ IndexedDBのストレージ使用量確認
  - ⬜ 古いデータ削除の動作確認
- ⬜ 長時間録画テスト（5分以上）
- ⬜ 複数タブでの同時録画テスト

**注**: マニュアルテストは任意項目です。統合テストで主要な機能は検証済みです。

---

### 残タスクと優先順位

**タブ録画機能の実装が完了しました！** 🎉🎉

以下のタスクはすべて完了しています：
- ✅ ドメイン層の実装
- ✅ インフラストラクチャ層の実装
- ✅ アプリケーション層の実装
- ✅ 既存システムとの統合
- ✅ マニフェストとDIの更新
- ✅ 統合テスト（12個のテストすべて合格）
- ✅ 録画プレビュー機能のUI実装

#### 🔹 任意タスク（将来対応）

1. ⬜ **ユニットテストの追加**（任意）
   - ChromeTabCaptureAdapterのテスト
   - 各UseCaseの詳細なテスト
   - 実装難易度: 中
   - 所要時間: 1日

2. ⬜ **マニュアルテスト**（推奨）
   - 実際のブラウザ環境での動作確認
   - パフォーマンス測定
   - 長時間録画のストレステスト
   - 実装難易度: 低
   - 所要時間: 2-3時間

---

## 4. 実装時の注意事項

### 4.1 IndexedDBの使用

- **非同期処理**: すべてのIndexedDB操作は非同期
- **トランザクション**: 読み書きを適切なトランザクションで管理
- **エラーハンドリング**: DB操作のエラーを適切にキャッチ
- **マイグレーション**: DBバージョン管理とスキーママイグレーション

### 4.2 パフォーマンス

- **チャンクサイズ**: 1秒ごとのチャンクで適切なバランス
- **ビットレート**: デフォルト2.5Mbpsで高品質かつ適切なサイズ
- **メモリ管理**: 録画停止後はストリームとBlobURLを適切に解放

### 4.3 タブのライフサイクル管理

- **タブクローズ監視**: `chrome.tabs.onRemoved`でタブクローズを検知
- **リスナー登録**: 自動入力開始時に登録、終了時に削除
- **エラーハンドリング**: タブクローズ時の録画停止失敗を適切に処理

### 4.4 ストレージ管理

- **容量制限**: IndexedDBは実質的に無制限だが、保持期間で制御
- **自動削除**: 各実行後に古いデータを自動削除（保持期間を超えた録画を削除）
- **ユーザー設定**: 保持期間（日数）をユーザーが調整可能（1-365日）

---

## 5. テスト計画

### 5.1 単体テスト

- TabRecordingエンティティ
- SystemSettings拡張部分
- 各UseCase
- ChromeTabCaptureAdapter
- IndexedDBRecordingRepository

### 5.2 統合テスト

- 自動入力実行時の録画フロー全体
- タブクローズ時の録画停止
- 古いデータの自動削除
- UIからの録画視聴

### 5.3 手動テスト

- 複数サイトでの自動入力+録画
- 長時間録画（5分以上）
- 複数タブでの同時録画
- ストレージ容量確認

---

## 6. 参考資料

- [Chrome Tab Capture API](https://developer.chrome.com/docs/extensions/reference/tabCapture/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- 参考実装: `../hotel-booking-checker/chrome-tab-recorder-clean-arch`

---

**作成日**: 2025-10-16
**最終更新日**: 2025-10-16
**バージョン**: 2.1.0

**変更履歴**:
- v2.1.0 (2025-10-16): フェーズ6完了、統合テスト12個実装・合格
- v2.0.0 (2025-10-16): IndexedDB対応、システム設定追加、UI視聴機能追加
- v1.0.0 (2025-10-16): 初版作成
