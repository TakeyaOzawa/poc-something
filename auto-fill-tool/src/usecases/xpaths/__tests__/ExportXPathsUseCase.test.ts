/**
 * ExportXPathsUseCase Tests
 */

import { ExportXPathsUseCase, XPathRepository, CSVConverter } from '../ExportXPathsUseCase';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

describe('ExportXPathsUseCase', () => {
  let useCase: ExportXPathsUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;
  let mockCSVConverter: jest.Mocked<CSVConverter>;

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn()
    };

    mockCSVConverter = {
      convertXPathsToCSV: jest.fn()
    } as any;

    useCase = new ExportXPathsUseCase(mockRepository, mockCSVConverter);
  });

  describe('execute', () => {
    test('XPath設定が正常にエクスポートされること', async () => {
      // Arrange
      const sampleXPaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          actionType: 'input',
          value: 'test value',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          retryType: 0
        },
        {
          id: 'xpath-2',
          websiteId: 'website-1',
          url: 'https://example.com',
          actionType: 'click',
          value: '',
          executionOrder: 2,
          selectedPathPattern: 'short',
          retryType: 10
        }
      ];
      const collection = XPathCollection.fromData(sampleXPaths);
      const expectedCSV = 'id,websiteId,url,actionType,value\nxpath-1,website-1,https://example.com,input,test value\nxpath-2,website-1,https://example.com,click,';

      mockRepository.getAll.mockResolvedValue(collection);
      mockCSVConverter.convertXPathsToCSV.mockResolvedValue(expectedCSV);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(mockCSVConverter.convertXPathsToCSV).toHaveBeenCalledWith(collection);
      expect(result).toBe(expectedCSV);
    });

    test('空のコレクションでもエクスポートできること', async () => {
      // Arrange
      const emptyCollection = XPathCollection.create();
      const expectedCSV = 'id,websiteId,url,actionType,value\n';

      mockRepository.getAll.mockResolvedValue(emptyCollection);
      mockCSVConverter.convertXPathsToCSV.mockResolvedValue(expectedCSV);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(expectedCSV);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.getAll.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Repository error');
    });

    test('CSV変換エラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const collection = XPathCollection.create();
      const error = new Error('CSV conversion error');

      mockRepository.getAll.mockResolvedValue(collection);
      mockCSVConverter.convertXPathsToCSV.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('CSV conversion error');
    });
  });
});
