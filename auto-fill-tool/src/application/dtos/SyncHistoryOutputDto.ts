/**
 * SyncHistory Output DTO
 * プレゼンテーション層への出力用データ転送オブジェクト
 */
export interface SyncHistoryOutputDto {
  id: string;
  configId: string;
  storageKey: string;
  syncDirection: 'bidirectional' | 'receive_only' | 'send_only';
  startTime: number;
  endTime: number;
  status: 'success' | 'failed' | 'partial';
  receiveResult?:
    | {
        success: boolean;
        receivedCount?: number;
        error?: string;
      }
    | undefined;
  sendResult?:
    | {
        success: boolean;
        sentCount?: number;
        error?: string;
      }
    | undefined;
  error?: string | undefined;
  retryCount: number;
  createdAt: number;
}
