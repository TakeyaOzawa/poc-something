/**
 * Test: SaveXPathUseCase
 *
 * カバレッジ目標: 90%以上
 * テスト対象: XPathの保存処理
 */

import { SaveXPathUseCase, SaveXPathInput } from '../SaveXPathUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { createTestXPathData } from '@tests/helpers/testHelpers';
import { Result } from '@domain/values/result.value';
import { ACTION_TYPE } from '@domain/constants/ActionType';

describe('SaveXPathUseCase', () => {
  let mockRepository: jest.Mocked<XPathRepository>;
  let useCase: SaveXPathUseCase;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    };
    useCase = new SaveXPathUseCase(mockRepository);
  });

  describe('正常系', () => {
    it('必須パラメータのみでXPathが正常に保存されること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const input: SaveXPathInput = {
        value: 'Test Value',
        pathAbsolute: '//input[@id="test"]',
        pathShort: '#test',
        pathSmart: 'input#test',
        url: 'https://example.com',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath).toBeDefined();
      expect(result.xpath.value).toBe('Test Value');
      expect(result.xpath.websiteId).toBe('');
      expect(result.xpath.actionType).toBe(ACTION_TYPE.TYPE);
      expect(result.xpath.afterWaitSeconds).toBe(0);
      expect(result.xpath.actionPattern).toBe(''); // 0は空文字列に変換される
      expect(result.xpath.selectedPathPattern).toBe('smart');
      expect(result.xpath.retryType).toBe(0);
      expect(result.xpath.executionTimeoutSeconds).toBe(30);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('すべてのオプションパラメータを指定してXPathが保存されること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const input: SaveXPathInput = {
        websiteId: 'test-website',
        value: 'Test Value',
        actionType: ACTION_TYPE.CLICK,
        afterWaitSeconds: 5,
        actionPattern: 1,
        pathAbsolute: '//button[@id="submit"]',
        pathShort: '#submit',
        pathSmart: 'button#submit',
        selectedPathPattern: 'short',
        retryType: 10,
        executionOrder: 100,
        executionTimeoutSeconds: 60,
        url: 'https://example.com/form',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath.websiteId).toBe('test-website');
      expect(result.xpath.actionType).toBe(ACTION_TYPE.CLICK);
      expect(result.xpath.afterWaitSeconds).toBe(5);
      expect(result.xpath.actionPattern).toBe('1');
      expect(result.xpath.selectedPathPattern).toBe('short');
      expect(result.xpath.retryType).toBe(10);
      expect(result.xpath.executionOrder).toBe(100);
      expect(result.xpath.executionTimeoutSeconds).toBe(60);
    });

    it('websiteIdが指定されていない場合、空文字列が設定されること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const input: SaveXPathInput = {
        value: 'Test Value',
        pathAbsolute: '//input[@id="test"]',
        pathShort: '#test',
        pathSmart: 'input#test',
        url: 'https://example.com',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath.websiteId).toBe('');
    });

    it('executionOrderが指定されていない場合、自動的に次の順序が設定されること', async () => {
      // Arrange
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          websiteId: 'test-website',
          executionOrder: 5,
        })
      );
      collection = collection.add(
        createTestXPathData({
          websiteId: 'test-website',
          executionOrder: 10,
        })
      );

      const input: SaveXPathInput = {
        websiteId: 'test-website',
        value: 'Test Value',
        pathAbsolute: '//input[@id="test"]',
        pathShort: '#test',
        pathSmart: 'input#test',
        url: 'https://example.com',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath.executionOrder).toBe(110); // 最大値10 + 100
    });

    it('0値のオプションパラメータが正しく設定されること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const input: SaveXPathInput = {
        value: 'Test Value',
        afterWaitSeconds: 0,
        actionPattern: 0,
        retryType: 0,
        executionOrder: 0,
        executionTimeoutSeconds: 0,
        pathAbsolute: '//input[@id="test"]',
        pathShort: '#test',
        pathSmart: 'input#test',
        url: 'https://example.com',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath.afterWaitSeconds).toBe(0);
      expect(result.xpath.actionPattern).toBe(''); // 0は空文字列に変換される
      expect(result.xpath.retryType).toBe(0);
      expect(result.xpath.executionOrder).toBe(0);
      expect(result.xpath.executionTimeoutSeconds).toBe(0);
    });
  });

  describe('異常系', () => {
    it('リポジトリの読み込みが失敗した場合、エラーがthrowされること', async () => {
      // Arrange
      const error = new Error('Repository load failed');
      const input: SaveXPathInput = {
        value: 'Test Value',
        pathAbsolute: '//input[@id="test"]',
        pathShort: '#test',
        pathSmart: 'input#test',
        url: 'https://example.com',
      };

      mockRepository.load.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Repository load failed');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('リポジトリの保存が失敗した場合、エラーがthrowされること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const error = new Error('Repository save failed');
      const input: SaveXPathInput = {
        value: 'Test Value',
        pathAbsolute: '//input[@id="test"]',
        pathShort: '#test',
        pathSmart: 'input#test',
        url: 'https://example.com',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Repository save failed');
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('リポジトリの保存でnullエラーの場合、エラーがthrowされること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const input: SaveXPathInput = {
        value: 'Test Value',
        pathAbsolute: '//input[@id="test"]',
        pathShort: '#test',
        pathSmart: 'input#test',
        url: 'https://example.com',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.failure(null as any));

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow();
    });
  });

  describe('エッジケース', () => {
    it('selectedPathPatternがundefinedの場合、デフォルトで"smart"が設定されること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const input: SaveXPathInput = {
        value: 'Test Value',
        pathAbsolute: '//input[@id="test"]',
        pathShort: '#test',
        pathSmart: 'input#test',
        selectedPathPattern: undefined,
        url: 'https://example.com',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath.selectedPathPattern).toBe('smart');
    });

    it('特殊文字を含む値でも正常に保存されること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const input: SaveXPathInput = {
        value: 'テスト値 with 特殊文字 @#$%^&*()',
        pathAbsolute: '//input[@id="特殊文字-test"]',
        pathShort: '#特殊文字-test',
        pathSmart: 'input#特殊文字-test',
        url: 'https://example.com/特殊文字',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath.value).toBe('テスト値 with 特殊文字 @#$%^&*()');
      expect(result.xpath.pathAbsolute).toBe('//input[@id="特殊文字-test"]');
    });

    it('非常に長い値でも正常に保存されること', async () => {
      // Arrange
      const collection = new XPathCollection();
      const longValue = 'A'.repeat(1000);
      const input: SaveXPathInput = {
        value: longValue,
        pathAbsolute: '//input[@id="test"]',
        pathShort: '#test',
        pathSmart: 'input#test',
        url: 'https://example.com',
      };

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.xpath.value).toBe(longValue);
    });
  });
});
