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
}
