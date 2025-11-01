/**
 * GetRecordingByResultIdUseCase Tests
 */

import { GetRecordingByResultIdUseCase } from '../GetRecordingByResultIdUseCase';
import { TabRecording } from '@domain/entities/TabRecording';
import { TabRecordingRepository } from '@domain/repositories/TabRecordingRepository';

describe('GetRecordingByResultIdUseCase', () => {
  let useCase: GetRecordingByResultIdUseCase;
  let mockRepository: jest.Mocked<TabRecordingRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      getById: jest.fn(),
      getByAutomationResultId: jest.fn(),
      getLatestByVariablesId: jest.fn(),
      deleteOldRecordings: jest.fn(),
      delete: jest.fn()
    };
    useCase = new GetRecordingByResultIdUseCase(mockRepository);
  });

  describe('execute', () => {
    test('自動化実行結果IDで録画が取得されること', async () => {
      // Arrange
      const mockBlob = new Blob(['test recording'], { type: 'video/webm' });
      const recording = TabRecording.create('ar-1', mockBlob);
      mockRepository.getByAutomationResultId.mockResolvedValue(recording);

      // Act
      const result = await useCase.execute('ar-1');

      // Assert
      expect(mockRepository.getByAutomationResultId).toHaveBeenCalledWith('ar-1');
      expect(result).toBe(recording);
    });

    test('録画が見つからない場合、undefinedが返されること', async () => {
      // Arrange
      mockRepository.getByAutomationResultId.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute('non-existent');

      // Assert
      expect(mockRepository.getByAutomationResultId).toHaveBeenCalledWith('non-existent');
      expect(result).toBeUndefined();
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.getByAutomationResultId.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('ar-1')).rejects.toThrow('Repository error');
    });
  });
});
