/**
 * StartTabRecordingUseCase Tests
 */

import { StartTabRecordingUseCase, TabCaptureAdapter } from '../StartTabRecordingUseCase';
import { TabRecording } from '@domain/entities/TabRecording';
import { TabRecordingRepository } from '@domain/repositories/TabRecordingRepository';

describe('StartTabRecordingUseCase', () => {
  let useCase: StartTabRecordingUseCase;
  let mockRepository: jest.Mocked<TabRecordingRepository>;
  let mockTabCaptureAdapter: jest.Mocked<TabCaptureAdapter>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      getById: jest.fn(),
      getByAutomationResultId: jest.fn(),
      getLatestByVariablesId: jest.fn(),
      deleteOldRecordings: jest.fn(),
      delete: jest.fn()
    };

    mockTabCaptureAdapter = {
      startRecording: jest.fn()
    };

    useCase = new StartTabRecordingUseCase(mockRepository, mockTabCaptureAdapter);
  });

  describe('execute', () => {
    test('録画が正常に開始されること', async () => {
      // Arrange
      const mockBlob = new Blob(['test recording'], { type: 'video/webm' });
      const automationResultId = 'ar-1';
      const tabId = 123;

      mockTabCaptureAdapter.startRecording.mockResolvedValue(mockBlob);
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(automationResultId, tabId);

      // Assert
      expect(mockTabCaptureAdapter.startRecording).toHaveBeenCalledWith(tabId);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result.getAutomationResultId()).toBe(automationResultId);
      expect(result.getRecordingBlob()).toBe(mockBlob);
      expect(result.isCompleted()).toBe(false);
    });

    test('タブキャプチャエラーの場合、エラーが投げられること', async () => {
      // Arrange
      const error = new Error('Capture error');
      mockTabCaptureAdapter.startRecording.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('ar-1', 123)).rejects.toThrow('録画の開始に失敗しました: Capture error');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    test('リポジトリエラーの場合、エラーが投げられること', async () => {
      // Arrange
      const mockBlob = new Blob(['test recording'], { type: 'video/webm' });
      const error = new Error('Save error');

      mockTabCaptureAdapter.startRecording.mockResolvedValue(mockBlob);
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('ar-1', 123)).rejects.toThrow('録画の開始に失敗しました: Save error');
    });
  });
});
