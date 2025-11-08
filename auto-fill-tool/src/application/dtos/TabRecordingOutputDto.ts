/**
 * TabRecording Output DTO
 * プレゼンテーション層への出力用データ転送オブジェクト
 */
export interface TabRecordingOutputDto {
  id: string;
  automationResultId: string;
  tabId: number;
  bitrate: number;
  state: string;
  recordingData?: Uint8Array | undefined;
  startedAt: string;
  stoppedAt?: string | undefined;
  errorMessage?: string | undefined;
  duration?: number | undefined;
  fileSize: number;
  size: number;
  mimeType: string;
}
