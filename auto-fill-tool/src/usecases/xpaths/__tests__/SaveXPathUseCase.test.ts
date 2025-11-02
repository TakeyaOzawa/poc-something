/**
 * Unit Tests: SaveXPathUseCase
 */

import { SaveXPathUseCase } from '../SaveXPathUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SaveXPathUseCase', () => {
  let useCase: SaveXPathUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    };

    useCase = new SaveXPathUseCase(mockRepository);
  });

  it('should save a new XPath to collection', async () => {
    const collection = new XPathCollection();
    mockRepository.load.mockResolvedValue(Result.success(collection));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const request = {
      value: 'Test Value',
      actionType: ACTION_TYPE.TYPE,
      afterWaitSeconds: 0,
      pathAbsolute: '/html/body/div[1]',
      pathShort: '//*[@id="test"]',
      pathSmart: '//div[@id="test"]',
      selectedPathPattern: 'smart' as const,
      retryType: 0 as const,
      executionOrder: 1,
      executionTimeoutSeconds: 30,
      url: 'https://example.com',
    };

    const result = await useCase.execute(request);

    expect(result.xpath.value).toBe('Test Value');
    expect(result.xpath.id).toBeDefined();
    expect(mockRepository.load).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should auto-assign execution_order scoped to websiteId', async () => {
    let collection = new XPathCollection();

    // Add existing XPaths for different websites
    collection = collection.add({
      websiteId: 'website_A',
      value: 'XPath A1',
      actionType: ACTION_TYPE.TYPE,
      afterWaitSeconds: 0,
      actionPattern: 0,
      pathAbsolute: '/html/body/div[1]',
      pathShort: '//*[@id="test1"]',
      pathSmart: '//div[@id="test1"]',
      selectedPathPattern: 'smart',
      retryType: 0,
      executionOrder: 100,
      executionTimeoutSeconds: 30,
      url: 'https://example.com',
    });

    collection = collection.add({
      websiteId: 'website_A',
      value: 'XPath A2',
      actionType: ACTION_TYPE.TYPE,
      afterWaitSeconds: 0,
      actionPattern: 0,
      pathAbsolute: '/html/body/div[2]',
      pathShort: '//*[@id="test2"]',
      pathSmart: '//div[@id="test2"]',
      selectedPathPattern: 'smart',
      retryType: 0,
      executionOrder: 200,
      executionTimeoutSeconds: 30,
      url: 'https://example.com',
    });

    collection = collection.add({
      websiteId: 'website_B',
      value: 'XPath B1',
      actionType: ACTION_TYPE.TYPE,
      afterWaitSeconds: 0,
      actionPattern: 0,
      pathAbsolute: '/html/body/div[3]',
      pathShort: '//*[@id="test3"]',
      pathSmart: '//div[@id="test3"]',
      selectedPathPattern: 'smart',
      retryType: 0,
      executionOrder: 100,
      executionTimeoutSeconds: 30,
      url: 'https://example.com',
    });

    mockRepository.load.mockResolvedValue(Result.success(collection));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    // Add new XPath to website_A without specifying executionOrder
    const result = await useCase.execute({
      websiteId: 'website_A',
      value: 'New XPath for A',
      pathAbsolute: '/html/body/div[4]',
      pathShort: '//*[@id="test4"]',
      pathSmart: '//div[@id="test4"]',
      url: 'https://example.com',
    });

    // Should be 300 (max of website_A's executionOrder: 200, plus 100)
    expect(result.xpath.executionOrder).toBe(300);
    expect(result.xpath.websiteId).toBe('website_A');
  });
});
