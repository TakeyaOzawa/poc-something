/**
 * CSVConverterService Tests
 */

import { CSVConverterService } from '../CSVConverterService';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

describe('CSVConverterService', () => {
  let service: CSVConverterService;

  beforeEach(() => {
    service = new CSVConverterService();
  });

  describe('parseXPaths', () => {
    test('正常なCSVが解析されること', async () => {
      // Arrange
      const csvContent = `id,websiteId,url,actionType,value,executionOrder
xpath-1,website-1,https://example.com,input,test value,1
xpath-2,website-1,https://example.com,click,,2`;

      // Act
      const result = await service.parseXPaths(csvContent);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'xpath-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test value',
        executionOrder: 1
      });
      expect(result[1]).toEqual({
        id: 'xpath-2',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'click',
        value: '',
        executionOrder: 2
      });
    });

    test('空のCSVの場合、空配列が返されること', async () => {
      // Act
      const result = await service.parseXPaths('');

      // Assert
      expect(result).toEqual([]);
    });

    test('ヘッダーのみのCSVの場合、空配列が返されること', async () => {
      // Arrange
      const csvContent = 'id,websiteId,url,actionType,value';

      // Act
      const result = await service.parseXPaths(csvContent);

      // Assert
      expect(result).toEqual([]);
    });

    test('空行がスキップされること', async () => {
      // Arrange
      const csvContent = `id,websiteId,url,actionType,value,executionOrder
xpath-1,website-1,https://example.com,input,test,1

xpath-2,website-1,https://example.com,click,,2`;

      // Act
      const result = await service.parseXPaths(csvContent);

      // Assert
      expect(result).toHaveLength(2);
    });

    test('必須フィールドが不足している行がスキップされること', async () => {
      // Arrange
      const csvContent = `id,websiteId,url,actionType,value
xpath-1,website-1,https://example.com,input,test
xpath-2,,https://example.com,click,
xpath-3,website-1,,input,test`;

      // Act
      const result = await service.parseXPaths(csvContent);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('xpath-1');
    });

    test('異なるヘッダー形式が認識されること', async () => {
      // Arrange
      const csvContent = `id,website_id,url,action_type,value,execution_order
xpath-1,website-1,https://example.com,input,test,1`;

      // Act
      const result = await service.parseXPaths(csvContent);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].websiteId).toBe('website-1');
      expect(result[0].actionType).toBe('input');
    });
  });

  describe('convertXPathsToCSV', () => {
    test('XPathコレクションが正常にCSVに変換されること', async () => {
      // Arrange
      const xpaths: XPathData[] = [
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
      const collection = XPathCollection.fromData(xpaths);

      // Act
      const result = await service.convertXPathsToCSV(collection);

      // Assert
      expect(result).toContain('"id","websiteId","url","actionType","value"');
      expect(result).toContain('"xpath-1","website-1","https://example.com","input","test value"');
      expect(result).toContain('"xpath-2","website-1","https://example.com","click",""');
    });

    test('空のコレクションの場合、ヘッダーのみのCSVが返されること', async () => {
      // Arrange
      const collection = XPathCollection.create();

      // Act
      const result = await service.convertXPathsToCSV(collection);

      // Assert
      expect(result).toBe('"id","websiteId","url","actionType","value","executionOrder","shortXPath","absoluteXPath","smartXPath","selectedPathPattern","retryType","actionPattern"');
    });

    test('特殊文字がエスケープされること', async () => {
      // Arrange
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          actionType: 'input',
          value: 'test "quoted" value',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          retryType: 0
        }
      ];
      const collection = XPathCollection.fromData(xpaths);

      // Act
      const result = await service.convertXPathsToCSV(collection);

      // Assert
      expect(result).toContain('"test ""quoted"" value"');
    });
  });

  describe('other methods', () => {
    test('未実装メソッドはエラーを投げること', async () => {
      await expect(service.parseAutomationVariables('')).rejects.toThrow('AutomationVariables CSV parsing not implemented');
      await expect(service.convertAutomationVariablesToCSV([])).rejects.toThrow('AutomationVariables CSV conversion not implemented');
      await expect(service.parseWebsites('')).rejects.toThrow('Website CSV parsing not implemented');
      await expect(service.convertWebsitesToCSV([])).rejects.toThrow('Website CSV conversion not implemented');
    });
  });
});
