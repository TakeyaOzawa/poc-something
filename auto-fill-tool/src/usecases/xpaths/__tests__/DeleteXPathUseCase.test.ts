/**
 * Test: DeleteXPathUseCase
 *
 * カバレッジ目標: 90%以上
 * テスト対象: XPathの削除処理
 */

import { DeleteXPathUseCase, DeleteXPathInput } from '../DeleteXPathUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { createTestXPathData } from '@tests/helpers/testHelpers';
import { Result } from '@domain/values/result.value';

describe('DeleteXPathUseCase', () => {
  let mockRepository: jest.Mocked<XPathRepository>;
  let useCase: DeleteXPathUseCase;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    };
    useCase = new DeleteXPathUseCase(mockRepository);
  });

  describe('正常系', () => {
    it('存在するXPathが正常に削除されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData());

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[0];
      const input: DeleteXPathInput = { id: targetXPath.id };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.deleted).toBe(true);
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('存在しないXPathの削除を試行した場合、deleted=falseが返されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData());

      const input: DeleteXPathInput = { id: 'non-existent-id' };

      mockRepository.load.mockResolvedValue(Result.success(collection));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.deleted).toBe(false);
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('空のコレクションから削除を試行した場合、deleted=falseが返されること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const input: DeleteXPathInput = { id: 'any-id' };

      mockRepository.load.mockResolvedValue(Result.success(collection));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.deleted).toBe(false);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('異常系', () => {
    it('リポジトリの読み込みが失敗した場合、エラーがthrowされること', async () => {
      // Arrange
      const error = new Error('Repository load failed');
      const input: DeleteXPathInput = { id: 'test-id' };

      mockRepository.load.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Repository load failed');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('リポジトリの保存が失敗した場合、エラーがthrowされること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData());

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[0];
      const error = new Error('Repository save failed');
      const input: DeleteXPathInput = { id: targetXPath.id };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Repository save failed');
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
