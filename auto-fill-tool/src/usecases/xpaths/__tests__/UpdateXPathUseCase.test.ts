/**
 * Test: UpdateXPathUseCase
 *
 * カバレッジ目標: 90%以上
 * テスト対象: XPathの更新処理
 */

import { UpdateXPathUseCase, UpdateXPathInput } from '../UpdateXPathUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { createTestXPathData } from '@tests/helpers/testHelpers';
import { Result } from '@domain/values/result.value';
import { ACTION_TYPE } from '@domain/constants/ActionType';

describe('UpdateXPathUseCase', () => {
  let mockRepository: jest.Mocked<XPathRepository>;
  let useCase: UpdateXPathUseCase;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    };
    useCase = new UpdateXPathUseCase(mockRepository);
  });

  describe('正常系', () => {
    it('存在するXPathが正常に更新されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'Original Value' }));

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[0];
      const input: UpdateXPathInput = {
        id: targetXPath.id,
        value: 'Updated Value',
        actionType: ACTION_TYPE.CLICK,
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.value).toBe('Updated Value');
      expect(result.xpath!.actionType).toBe(ACTION_TYPE.CLICK);
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('部分的な更新が正常に動作すること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          value: 'Original Value',
          afterWaitSeconds: 5,
        })
      );

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[0];
      const input: UpdateXPathInput = {
        id: targetXPath.id,
        value: 'Updated Value',
        // afterWaitSecondsは更新しない
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.value).toBe('Updated Value');
      expect(result.xpath!.afterWaitSeconds).toBe(5); // 元の値が保持される
    });

    it('空のwebsiteIdが指定された場合、websiteIdが更新されないこと', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ websiteId: 'original-website' }));

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[0];
      const input: UpdateXPathInput = {
        id: targetXPath.id,
        websiteId: '', // 空文字列
        value: 'Updated Value',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.websiteId).toBe('original-website'); // 元の値が保持される
      expect(result.xpath!.value).toBe('Updated Value');
    });

    it('すべてのオプションパラメータを更新できること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData());

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[0];
      const input: UpdateXPathInput = {
        id: targetXPath.id,
        websiteId: 'updated-website',
        value: 'Updated Value',
        actionType: ACTION_TYPE.CLICK,
        afterWaitSeconds: 10,
        dispatchEventPattern: 2,
        pathAbsolute: '//updated/path',
        pathShort: '#updated',
        pathSmart: 'updated#path',
        selectedPathPattern: 'absolute',
        retryType: 10,
        executionOrder: 99,
        executionTimeoutSeconds: 120,
        url: 'https://updated.example.com',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.websiteId).toBe('updated-website');
      expect(result.xpath!.value).toBe('Updated Value');
      expect(result.xpath!.actionType).toBe(ACTION_TYPE.CLICK);
      expect(result.xpath!.afterWaitSeconds).toBe(10);
      expect(result.xpath!.pathAbsolute).toBe('//updated/path');
      expect(result.xpath!.pathShort).toBe('#updated');
      expect(result.xpath!.pathSmart).toBe('updated#path');
      expect(result.xpath!.selectedPathPattern).toBe('absolute');
      expect(result.xpath!.retryType).toBe(10);
      expect(result.xpath!.executionOrder).toBe(99);
      expect(result.xpath!.executionTimeoutSeconds).toBe(120);
      expect(result.xpath!.url).toBe('https://updated.example.com');
    });
  });

  describe('異常系', () => {
    it('存在しないXPathの更新を試行した場合、xpath=nullが返されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData());

      const input: UpdateXPathInput = {
        id: 'non-existent-id',
        value: 'Updated Value',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).toBeNull();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('リポジトリの読み込みが失敗した場合、エラーがthrowされること', async () => {
      // Arrange
      const error = new Error('Repository load failed');
      const input: UpdateXPathInput = {
        id: 'test-id',
        value: 'Updated Value',
      };

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
      const input: UpdateXPathInput = {
        id: targetXPath.id,
        value: 'Updated Value',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Repository save failed');
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('コレクションの更新でエラーが発生した場合、xpath=nullが返されること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const input: UpdateXPathInput = {
        id: 'non-existent-id',
        value: 'Updated Value',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).toBeNull();
    });
  });

  describe('エッジケース', () => {
    it('IDのみ指定して他のフィールドを指定しない場合、元の値が保持されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'Original Value' }));

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[0];
      const input: UpdateXPathInput = {
        id: targetXPath.id,
        // 他のフィールドは指定しない
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.value).toBe('Original Value'); // 元の値が保持される
    });

    it('0値のパラメータでも正常に更新されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          afterWaitSeconds: 10,
          executionOrder: 5,
        })
      );

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[0];
      const input: UpdateXPathInput = {
        id: targetXPath.id,
        afterWaitSeconds: 0,
        executionOrder: 0,
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.afterWaitSeconds).toBe(0);
      expect(result.xpath!.executionOrder).toBe(0);
    });

    it('特殊文字を含む値でも正常に更新されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData());

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[0];
      const specialValue = 'テスト値 with 特殊文字 @#$%^&*()';
      const input: UpdateXPathInput = {
        id: targetXPath.id,
        value: specialValue,
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.value).toBe(specialValue);
    });
  });
});
