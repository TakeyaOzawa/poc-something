/**
 * Unit Tests: ChromeStorageXPathRepository
 */

import { ChromeStorageXPathRepository } from '../ChromeStorageXPathRepository';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import browser from 'webextension-polyfill';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ChromeStorageXPathRepository', () => {
  let repository: ChromeStorageXPathRepository;

  beforeEach(() => {
    repository = new ChromeStorageXPathRepository(new NoOpLogger());
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save XPath collection to Chrome storage as CSV', async () => {
      let collection = new XPathCollection();
      collection = collection.add({
        websiteId: '',
        value: 'Test Value',
        actionType: ACTION_TYPE.TYPE,
        afterWaitSeconds: 0,
        actionPattern: 0,
        pathAbsolute: '/html/body/div[1]',
        pathShort: '//*[@id="test"]',
        pathSmart: '//div[@id="test"]',
        selectedPathPattern: 'smart',
        retryType: 0,
        executionOrder: 1,
        executionTimeoutSeconds: 30,
        url: 'https://example.com',
      });

      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      await repository.save(collection);

      expect(browser.storage.local.set).toHaveBeenCalledTimes(1);
      const setCall = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
      expect(setCall.xpathCollectionCSV).toBeDefined();
      expect(typeof setCall.xpathCollectionCSV).toBe('string');
      expect(setCall.xpathCollectionCSV).toContain('Test Value');
    });
  });

  describe('load', () => {
    it('should load XPath collection from Chrome storage CSV', async () => {
      const mockCSV = `id,website_id,value,action_type,after_wait_seconds,action_pattern,path_absolute,path_short,path_smart,selected_path_pattern,retry_type,execution_order,execution_timeout_seconds,url
xpath_test_123,,Test Value,type,0,0,/html/body/div[1],//*[@id="test"],//div[@id="test"],smart,0,1,30,https://example.com`;

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        xpathCollectionCSV: mockCSV,
      });

      const result = await repository.load();
      expect(result.isSuccess).toBe(true);
      const collection = result.value!;
      const all = collection.getAll();

      expect(all).toHaveLength(1);
      expect(all[0].value).toBe('Test Value');
      expect(all[0].url).toBe('https://example.com');
      expect(all[0].selectedPathPattern).toBe('smart');
      expect(all[0].actionType).toBe(ACTION_TYPE.TYPE);
    });

    it('should return empty collection when no data exists', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await repository.load();
      expect(result.isSuccess).toBe(true);
      const collection = result.value!;
      const all = collection.getAll();

      expect(all).toHaveLength(0);
    });

    it('should handle empty CSV in storage', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        xpathCollectionCSV: '',
      });

      const result = await repository.load();
      expect(result.isSuccess).toBe(true);
      const collection = result.value!;
      const all = collection.getAll();

      expect(all).toHaveLength(0);
    });

    it('should return empty collection when CSV parsing fails', async () => {
      // Invalid CSV that will cause parsing error
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        xpathCollectionCSV: 'invalid,csv\nwithout,proper,headers',
      });

      const result = await repository.load();
      expect(result.isSuccess).toBe(true);
      const collection = result.value!;
      const all = collection.getAll();

      expect(all).toHaveLength(0);
    });
  });
});
