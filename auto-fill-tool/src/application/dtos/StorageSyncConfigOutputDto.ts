/**
 * StorageSyncConfig Output DTO
 * プレゼンテーション層への出力用データ転送オブジェクト
 */
export interface StorageSyncConfigOutputDto {
  id: string;
  storageKey: string;
  syncMethod: string;
  syncTiming: string;
  syncDirection: string;
  conflictResolution: string;
  syncIntervalSeconds?: number;
  inputs: Array<{ key: string; value: string }>;
  outputs: Array<{ key: string; defaultValue: any }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * SyncHistory Output DTO
 * プレゼンテーション層への出力用データ転送オブジェクト
 */
export interface SyncHistoryOutputDto {
  id: string;
  configId: string;
  syncDirection: string;
  success: boolean;
  errorMessage?: string;
  receivedCount: number;
  sentCount: number;
  executedAt: string;
}
