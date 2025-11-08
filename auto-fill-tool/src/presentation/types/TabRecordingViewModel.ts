/**
 * TabRecording ViewModel
 * プレゼンテーション層専用のデータ構造
 * DTOから完全に分離されたViewModel
 */

export interface TabRecordingViewModel {
  // 基本データ
  id: string;
  automationResultId: string;
  startedAt: string;
  stoppedAt?: string;
  duration?: number;
  size?: number;
  mimeType: string;

  // UI状態
  isLoading?: boolean;
  hasErrors?: boolean;
  isPlaying?: boolean;

  // 表示用プロパティ
  durationText: string;
  sizeText: string;
  startedAtFormatted: string;
  stoppedAtFormatted?: string;
  statusText: string;

  // UI操作
  canPlay: boolean;
  canDownload: boolean;
  canDelete: boolean;
}
