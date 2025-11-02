/**
 * Application Layer: TabRecording Output DTO
 * Data Transfer Object for TabRecording entity
 */

export interface TabRecordingOutputDto {
  id: string;
  automationResultId: string;
  recordingData: Blob;
  startTime: string;
  endTime?: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}
