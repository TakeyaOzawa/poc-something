/**
 * SystemSettings ViewModel
 * プレゼンテーション層専用のデータ構造
 * DTOから完全に分離されたViewModel
 */

export interface SystemSettingsViewModel {
  // 基本データ
  retryWaitSecondsMin: number;
  retryWaitSecondsMax: number;
  retryCount: number;
  recordingEnabled: boolean;
  recordingBitrate: number;
  recordingRetentionDays: number;
  enabledLogSources: string[];
  securityEventsOnly: boolean;
  maxStoredLogs: number;
  logRetentionDays: number;

  // 追加の設定項目
  waitForOptionsMilliseconds?: number;
  autoFillProgressDialogMode?: 'withCancel' | 'withoutCancel' | 'hidden';
  logLevel?: number;

  // Gradient設定（デフォルト値）
  gradientStartColor?: string;
  gradientEndColor?: string;
  gradientAngle?: number;

  // UI状態
  isLoading?: boolean;
  hasErrors?: boolean;
  isDirty?: boolean;

  // 表示用プロパティ
  retryWaitRangeText: string;
  retryCountText: string;
  recordingStatusText: string;
  logSettingsText: string;

  // UI操作
  canSave: boolean;
  canReset: boolean;
  canExport: boolean;
  canImport: boolean;

  // Gradient用メソッド（後方互換性）
  getGradientStartColor?(): string;
  getGradientEndColor?(): string;
  getGradientAngle?(): number;
}
