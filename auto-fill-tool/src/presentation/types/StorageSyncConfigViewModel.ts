/**
 * StorageSyncConfig ViewModel
 * プレゼンテーション層専用のデータ構造
 * DTOから完全に分離されたViewModel
 */

export interface StorageSyncConfigViewModel {
  // 基本データ
  id: string;
  storageKey: string;
  syncMethod: string;
  syncTiming: string;
  syncDirection: string;
  conflictResolution: string;
  enabled: boolean;
  syncIntervalSeconds?: number;
  inputs: Array<{ key: string; value: string }>;
  outputs: Array<{ key: string; defaultValue: unknown }>;
  retryPolicy?: {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };
  createdAt: string;
  updatedAt: string;

  // UI状態
  isLoading?: boolean;
  hasErrors?: boolean;
  isEditing?: boolean;
  isTesting?: boolean;

  // 表示用プロパティ
  displayName: string;
  syncMethodText: string;
  syncTimingText: string;
  syncDirectionText: string;
  statusText: string;
  lastSyncFormatted?: string;

  // UI操作
  canEdit: boolean;
  canDelete: boolean;
  canTest: boolean;
  canSync: boolean;
  canViewHistory: boolean;
}

export interface SyncHistoryViewModel {
  // 基本データ
  id: string;
  configId: string;
  syncDirection: string;
  success: boolean;
  errorMessage?: string;
  receivedCount: number;
  sentCount: number;
  executedAt: string;

  // UI状態
  isLoading?: boolean;

  // 表示用プロパティ
  statusText: string;
  directionText: string;
  resultText: string;
  executedAtFormatted: string;

  // UI操作
  canRetry: boolean;
  canViewDetails: boolean;
}
