/**
 * ImportXPathsUseCase Tests
 */

import { ImportXPathsUseCase, XPathRepository, CSVConverter } from '../ImportXPathsUseCase';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

describe('ImportXPathsUseCase', () => {
  let useCase: ImportXPathsUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;
  let mockCSVConverter: jest.Mocked<CSVConverter>;

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn(),
      save: jest.fn()
    };

    mockCSVConverter = {
      parseXPaths: jest.fn()
    } as any;

    useCase = new ImportXPathsUseCase(mockRepository, mockCSVConverter);
  });

  describe('execute', () => {
    test('XPath設定が正常にインポートされること', async () => {
      // Arrange
      const csvContent = 'id,websiteId,url,actionType,value\nxpath-1,website-1,https://example.com,input,test';
      const importedXPaths: XPathData[] = [{
        id: 'xpath-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0
      }];
      const existingCollection = XPathCollection.create();

      mockCSVConverter.parseXPaths.mockResolvedValue(importedXPaths);
      mockRepository.getAll.mockResolvedValue(existingCollection);
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(csvContent);

      // Assert
      expect(mockCSVConverter.parseXPaths).toHaveBeenCalledWith(csvContent);
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    test('全置換でインポートされること', async () => {
      // Arrange
      const csvContent = 'id,websiteId,url,actionType,value\nxpath-1,website-1,https://example.com,input,test';
      const importedXPaths: XPathData[] = [{
        id: 'xpath-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0
      }];

      mockCSVConverter.parseXPaths.mockResolvedValue(importedXPaths);
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(csvContent, true);

      // Assert
      expect(mockRepository.getAll).not.toHaveBeenCalled(); // 全置換の場合は既存データを取得しない
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result.imported).toBe(1);
    });

    test('CSVパースエラーの場合、エラーが投げられること', async () => {
      // Arrange
      const csvContent = 'invalid csv';
      const error = new Error('Parse error');
      mockCSVConverter.parseXPaths.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(csvContent)).rejects.toThrow('インポートに失敗しました: Parse error');
    });

    test('一部のXPathでエラーが発生した場合、エラーリストが返されること', async () => {
      // Arrange
      const csvContent = 'test csv';
      const importedXPaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          actionType: 'input',
          value: 'test',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          retryType: 0
        },
        {
          id: '', // 無効なID
          websiteId: 'website-1',
          url: 'https://example.com',
          actionType: 'input',
          value: 'test2',
          executionOrder: 2,
          selectedPathPattern: 'smart',
          retryType: 0
        }
      ];
      const existingCollection = XPathCollection.create();

      mockCSVConverter.parseXPaths.mockResolvedValue(importedXPaths);
      mockRepository.getAll.mockResolvedValue(existingCollection);
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(csvContent);

      // Assert
      expect(result.imported).toBe(2); // IDが自動生成されるため両方とも成功
      expect(result.errors).toHaveLength(0);
    });
  });
});
