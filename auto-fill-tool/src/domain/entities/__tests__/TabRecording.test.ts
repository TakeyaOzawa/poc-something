/**
 * TabRecording Entity Tests
 */

import { TabRecording, TabRecordingData } from '../TabRecording';

describe('TabRecording', () => {
  let mockBlob: Blob;
  let sampleData: TabRecordingData;

  beforeEach(() => {
    mockBlob = new Blob(['test recording data'], { type: 'video/webm' });
    sampleData = {
      id: 'tr-1',
      automationResultId: 'ar-1',
      recordingBlob: mockBlob,
      startedAt: '2023-01-01T00:00:00.000Z',
      completedAt: '2023-01-01T00:05:00.000Z',
      duration: 300000,
      fileSize: mockBlob.size,
      mimeType: 'video/webm'
    };
  });

  describe('create', () => {
    test('新しいタブ録画が作成されること', () => {
      const recording = TabRecording.create('ar-1', mockBlob);
      
      expect(recording.getAutomationResultId()).toBe('ar-1');
      expect(recording.getRecordingBlob()).toBe(mockBlob);
      expect(recording.getFileSize()).toBe(mockBlob.size);
      expect(recording.getMimeType()).toBe('video/webm');
      expect(recording.getId()).toMatch(/^tr_\d+_[a-z0-9]+$/);
      expect(recording.getStartedAt()).toBeDefined();
      expect(recording.isCompleted()).toBe(false);
    });
  });

  describe('fromData', () => {
    test('データからタブ録画が作成されること', () => {
      const recording = TabRecording.fromData(sampleData);
      
      expect(recording.getId()).toBe('tr-1');
      expect(recording.getAutomationResultId()).toBe('ar-1');
      expect(recording.getRecordingBlob()).toBe(mockBlob);
      expect(recording.getStartedAt()).toBe('2023-01-01T00:00:00.000Z');
      expect(recording.getCompletedAt()).toBe('2023-01-01T00:05:00.000Z');
      expect(recording.getDuration()).toBe(300000);
      expect(recording.getFileSize()).toBe(mockBlob.size);
      expect(recording.getMimeType()).toBe('video/webm');
      expect(recording.isCompleted()).toBe(true);
    });
  });

  describe('complete', () => {
    test('録画が正常に完了されること', async () => {
      const recording = TabRecording.create('ar-1', mockBlob);
      expect(recording.isCompleted()).toBe(false);
      
      // 少し待ってから完了（時間差を作るため）
      await new Promise(resolve => setTimeout(resolve, 1));
      
      recording.complete();
      
      expect(recording.isCompleted()).toBe(true);
      expect(recording.getCompletedAt()).toBeDefined();
      expect(recording.getDuration()).toBeDefined();
      expect(recording.getDuration()).toBeGreaterThanOrEqual(0);
    });

    test('既に完了している録画を再度完了しようとした場合、エラーが発生すること', () => {
      const recording = TabRecording.fromData(sampleData);
      
      expect(() => {
        recording.complete();
      }).toThrow('録画は既に完了しています');
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      const recording = TabRecording.fromData(sampleData);
      const data = recording.toData();
      
      expect(data).toEqual(sampleData);
    });
  });
});
