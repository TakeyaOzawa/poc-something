/**
 * Unit Tests: GetXPathsByWebsiteIdUseCase
 */

import { GetXPathsByWebsiteIdUseCase } from '../GetXPathsByWebsiteIdUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathData } from '@domain/entities/XPathCollection';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { Result } from '@domain/values/result.value';

describe('GetXPathsByWebsiteIdUseCase', () => {
  let mockXPathRepository: jest.Mocked<XPathRepository>;
  let useCase: GetXPathsByWebsiteIdUseCase;

  const sampleXPaths: XPathData[] = [
    {
      id: 'xpath_1',
      websiteId: 'website_1',
      pathAbsolute: '/html/body/input',
      pathShort: '//*[@id="username"]',
      pathSmart: '//input[@id="username"]',
      selectedPathPattern: 'smart',
      actionType: ACTION_TYPE.TYPE,
      value: 'test',
      executionOrder: 1,
      afterWaitSeconds: 0,
      actionPattern: 0,
      retryType: 0,
      executionTimeoutSeconds: 30,
      url: 'https://example.com',
    },
    {
      id: 'xpath_2',
      websiteId: 'website_1',
      pathAbsolute: '/html/body/button',
      pathShort: '//*[@id="submit"]',
      pathSmart: '//button[@id="submit"]',
      selectedPathPattern: 'smart',
      actionType: ACTION_TYPE.CLICK,
      value: '',
      executionOrder: 2,
      afterWaitSeconds: 0,
      actionPattern: 0,
      retryType: 0,
      executionTimeoutSeconds: 30,
      url: 'https://example.com',
    },
    {
      id: 'xpath_3',
      websiteId: 'website_2',
      pathAbsolute: '/html/body/input',
      pathShort: '//*[@id="field"]',
      pathSmart: '//input[@id="field"]',
      selectedPathPattern: 'smart',
      actionType: ACTION_TYPE.TYPE,
      value: 'other',
      executionOrder: 1,
      afterWaitSeconds: 0,
      actionPattern: 0,
      retryType: 0,
      executionTimeoutSeconds: 30,
      url: 'https://example2.com',
    },
  ];

  beforeEach(() => {
    mockXPathRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    } as jest.Mocked<XPathRepository>;

    useCase = new GetXPathsByWebsiteIdUseCase(mockXPathRepository);
  });

  describe('execute', () => {
    it('should return only XPaths matching the websiteId', async () => {
      const mockCollection = new XPathCollection(sampleXPaths);
      mockXPathRepository.load.mockResolvedValue(Result.success(mockCollection));

      const result = await useCase.execute({ websiteId: 'website_1' });

      expect(mockXPathRepository.load).toHaveBeenCalledTimes(1);
      expect(result.xpaths).toHaveLength(2);
      expect(result.xpaths[0].websiteId).toBe('website_1');
      expect(result.xpaths[1].websiteId).toBe('website_1');
      expect(result.xpaths[0].id).toBe('xpath_1');
      expect(result.xpaths[1].id).toBe('xpath_2');
    });

    it('should return empty array when no XPaths match websiteId', async () => {
      const mockCollection = new XPathCollection(sampleXPaths);
      mockXPathRepository.load.mockResolvedValue(Result.success(mockCollection));

      const result = await useCase.execute({ websiteId: 'website_nonexistent' });

      expect(result.xpaths).toEqual([]);
      expect(result.xpaths).toHaveLength(0);
    });

    it('should return empty array when no XPaths exist at all', async () => {
      const mockCollection = new XPathCollection([]);
      mockXPathRepository.load.mockResolvedValue(Result.success(mockCollection));

      const result = await useCase.execute({ websiteId: 'website_1' });

      expect(result.xpaths).toEqual([]);
      expect(result.xpaths).toHaveLength(0);
    });

    it('should propagate errors from repository', async () => {
      mockXPathRepository.load.mockRejectedValue(new Error('Repository error'));

      await expect(useCase.execute({ websiteId: 'website_1' })).rejects.toThrow('Repository error');
    });

    it('should filter correctly with multiple websites', async () => {
      const mockCollection = new XPathCollection(sampleXPaths);
      mockXPathRepository.load.mockResolvedValue(Result.success(mockCollection));

      const result1 = await useCase.execute({ websiteId: 'website_1' });
      const result2 = await useCase.execute({ websiteId: 'website_2' });

      expect(result1.xpaths).toHaveLength(2);
      expect(result2.xpaths).toHaveLength(1);
      expect(result2.xpaths[0].id).toBe('xpath_3');
    });

    it('should return XPathData with correct structure', async () => {
      const mockCollection = new XPathCollection(sampleXPaths);
      mockXPathRepository.load.mockResolvedValue(Result.success(mockCollection));

      const result = await useCase.execute({ websiteId: 'website_1' });

      expect(result.xpaths[0]).toHaveProperty('id');
      expect(result.xpaths[0]).toHaveProperty('websiteId');
      expect(result.xpaths[0]).toHaveProperty('pathAbsolute');
      expect(result.xpaths[0]).toHaveProperty('pathShort');
      expect(result.xpaths[0]).toHaveProperty('pathSmart');
      expect(result.xpaths[0]).toHaveProperty('selectedPathPattern');
      expect(result.xpaths[0]).toHaveProperty('actionType');
      expect(result.xpaths[0]).toHaveProperty('executionOrder');
      expect(result.xpaths[0]).toHaveProperty('value');
      expect(result.xpaths[0]).toHaveProperty('url');
    });
  });
});
