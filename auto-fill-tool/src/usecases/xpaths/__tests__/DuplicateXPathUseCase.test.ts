/**
 * Test: DuplicateXPathUseCase
 *
 * カバレッジ目標: 90%以上
 * テスト対象: XPathの複製処理
 */

import { DuplicateXPathUseCase, DuplicateXPathInput } from '../DuplicateXPathUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { createTestXPathData } from '@tests/helpers/testHelpers';
import { Result } from '@domain/values/result.value';
import { ACTION_TYPE } from '@domain/constants/ActionType';

describe('DuplicateXPathUseCase', () => {
  let mockRepository: jest.Mocked<XPathRepository>;
  let useCase: DuplicateXPathUseCase;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    };
    useCase = new DuplicateXPathUseCase(mockRepository);
  });

  describe('正常系', () => {
    it('存在するXPathが正常に複製されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          websiteId: 'test-website',
          value: 'Original Value',
          executionOrder: 10,
        })
      );

      const allXPaths = collection.getAll();
      const originalXPath = allXPaths[0];
      const input: DuplicateXPathInput = { id: originalXPath.id };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.value).toBe('Original Value_copy');
      expect(result.xpath!.websiteId).toBe('test-website');
      expect(result.xpath!.actionType).toBe(originalXPath.actionType);
      expect(result.xpath!.executionOrder).toBe(110); // maxOrder(10) + 100
      expect(result.xpath!.id).not.toBe(originalXPath.id); // 新しいIDが生成される
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('複数のXPathがある場合、最大executionOrderの次に配置されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          websiteId: 'test-website',
          value: 'First',
          executionOrder: 5,
        })
      );
      collection = collection.add(
        createTestXPathData({
          websiteId: 'test-website',
          value: 'Second',
          executionOrder: 15,
        })
      );
      collection = collection.add(
        createTestXPathData({
          websiteId: 'test-website',
          value: 'Third',
          executionOrder: 10,
        })
      );

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[1]; // executionOrder: 15のXPath
      const input: DuplicateXPathInput = { id: targetXPath.id };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.executionOrder).toBe(115); // maxOrder(15) + 100
    });

    it('異なるwebsiteIdのXPathは影響しないこと', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          websiteId: 'website-1',
          value: 'Website1 XPath',
          executionOrder: 20,
        })
      );
      collection = collection.add(
        createTestXPathData({
          websiteId: 'website-2',
          value: 'Website2 XPath',
          executionOrder: 50,
        })
      );

      const allXPaths = collection.getAll();
      const targetXPath = allXPaths[0]; // website-1のXPath
      const input: DuplicateXPathInput = { id: targetXPath.id };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.executionOrder).toBe(120); // website-1の最大値(20) + 100
      expect(result.xpath!.websiteId).toBe('website-1');
    });

    it('空のwebsiteIdでも正常に複製されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          websiteId: '',
          value: 'No Website XPath',
          executionOrder: 1,
        })
      );

      const allXPaths = collection.getAll();
      const originalXPath = allXPaths[0];
      const input: DuplicateXPathInput = { id: originalXPath.id };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.websiteId).toBe('');
      expect(result.xpath!.value).toBe('No Website XPath_copy');
      expect(result.xpath!.executionOrder).toBe(101); // maxOrder(1) + 100
    });

    it('すべてのプロパティが正しく複製されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          websiteId: 'test-website',
          value: 'Test Value',
          actionType: ACTION_TYPE.CLICK,
          afterWaitSeconds: 5,
          pathAbsolute: '//test/path',
          pathShort: '#test',
          pathSmart: 'test#path',
          selectedPathPattern: 'absolute',
          retryType: 10,
          executionOrder: 25,
          executionTimeoutSeconds: 60,
          url: 'https://example.com/test',
        })
      );

      const allXPaths = collection.getAll();
      const originalXPath = allXPaths[0];
      const input: DuplicateXPathInput = { id: originalXPath.id };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.value).toBe('Test Value_copy');
      expect(result.xpath!.actionType).toBe(ACTION_TYPE.CLICK);
      expect(result.xpath!.afterWaitSeconds).toBe(5);
      expect(result.xpath!.pathAbsolute).toBe('//test/path');
      expect(result.xpath!.pathShort).toBe('#test');
      expect(result.xpath!.pathSmart).toBe('test#path');
      expect(result.xpath!.selectedPathPattern).toBe('absolute');
      expect(result.xpath!.retryType).toBe(10);
      expect(result.xpath!.executionOrder).toBe(125); // 25 + 100
      expect(result.xpath!.executionTimeoutSeconds).toBe(60);
      expect(result.xpath!.url).toBe('https://example.com/test');
    });
  });

  describe('異常系', () => {
    it('存在しないXPathの複製を試行した場合、xpath=nullが返されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData());

      const input: DuplicateXPathInput = { id: 'non-existent-id' };

      mockRepository.load.mockResolvedValue(Result.success(collection));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).toBeNull();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('空のコレクションで複製を試行した場合、xpath=nullが返されること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const input: DuplicateXPathInput = { id: 'any-id' };

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
      const input: DuplicateXPathInput = { id: 'test-id' };

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
      const originalXPath = allXPaths[0];
      const error = new Error('Repository save failed');
      const input: DuplicateXPathInput = { id: originalXPath.id };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Repository save failed');
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('エッジケース', () => {
    it('executionOrderが0の場合でも正常に複製されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          websiteId: 'test-website',
          executionOrder: 0,
        })
      );

      const allXPaths = collection.getAll();
      const originalXPath = allXPaths[0];
      const input: DuplicateXPathInput = { id: originalXPath.id };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.executionOrder).toBe(100); // 0 + 100
    });

    it('同じwebsiteIdのXPathがない場合、executionOrder=100になること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          websiteId: 'test-website',
          executionOrder: 50,
        })
      );

      const allXPaths = collection.getAll();
      const originalXPath = allXPaths[0];
      const input: DuplicateXPathInput = { id: originalXPath.id };

      // モックで空の配列を返すように設定（実際にはありえないが、エッジケースとして）
      const mockCollection = {
        ...collection,
        get: jest.fn().mockReturnValue(originalXPath),
        getByWebsiteId: jest.fn().mockReturnValue([]), // 空配列
        add: jest.fn().mockReturnValue({
          getByWebsiteId: jest.fn().mockReturnValue([{ executionOrder: 100 }]),
        }),
      };

      mockRepository.load.mockResolvedValue(Result.success(mockCollection as any));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.executionOrder).toBe(100); // maxOrder(0) + 100
    });

    it('特殊文字を含む値でも正常に複製されること', async () => {
      // Arrange
      const specialValue = 'テスト値 with 特殊文字 @#$%^&*()';
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          value: specialValue,
        })
      );

      const allXPaths = collection.getAll();
      const originalXPath = allXPaths[0];
      const input: DuplicateXPathInput = { id: originalXPath.id };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).not.toBeNull();
      expect(result.xpath!.value).toBe(`${specialValue}_copy`);
    });
  });
});
