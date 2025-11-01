/**
 * TabRecording Entity
 * タブ録画を管理するドメインエンティティ
 */

export interface TabRecordingData {
  id: string;
  automationResultId: string;
  recordingBlob: Blob;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  fileSize: number;
  mimeType: string;
}

export class TabRecording {
  private data: TabRecordingData;

  constructor(data: TabRecordingData) {
    this.data = { ...data };
  }

  static create(automationResultId: string, recordingBlob: Blob): TabRecording {
    return new TabRecording({
      id: 'tr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11),
      automationResultId,
      recordingBlob,
      startedAt: new Date().toISOString(),
      fileSize: recordingBlob.size,
      mimeType: recordingBlob.type
    });
  }

  static fromData(data: TabRecordingData): TabRecording {
    return new TabRecording(data);
  }

  getId(): string {
    return this.data.id;
  }

  getAutomationResultId(): string {
    return this.data.automationResultId;
  }

  getRecordingBlob(): Blob {
    return this.data.recordingBlob;
  }

  getStartedAt(): string {
    return this.data.startedAt;
  }

  getCompletedAt(): string | undefined {
    return this.data.completedAt;
  }

  getDuration(): number | undefined {
    return this.data.duration;
  }

  getFileSize(): number {
    return this.data.fileSize;
  }

  getMimeType(): string {
    return this.data.mimeType;
  }

  isCompleted(): boolean {
    return this.data.completedAt !== undefined;
  }

  complete(): void {
    if (this.data.completedAt) {
      throw new Error('録画は既に完了しています');
    }
    
    this.data.completedAt = new Date().toISOString();
    this.data.duration = new Date(this.data.completedAt).getTime() - new Date(this.data.startedAt).getTime();
  }

  toData(): TabRecordingData {
    return { ...this.data };
  }
}
