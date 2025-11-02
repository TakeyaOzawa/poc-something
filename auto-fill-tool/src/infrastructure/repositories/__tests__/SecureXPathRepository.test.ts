/**
 * Unit Tests: SecureXPathRepository
 * Tests the secure XPath repository implementation with encryption
 */

import { SecureXPathRepository } from '../SecureXPathRepository';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { PATH_PATTERN } from '@domain/constants/PathPattern';
import { RETRY_TYPE } from '@domain/constants/RetryType';
import { EVENT_PATTERN } from '@domain/constants/EventPattern';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock SecureStorage
const createMockSecureStorage = (): jest.Mocked<SecureStorage> => ({
  isInitialized: jest.fn(),
  initialize: jest.fn(),
  unlock: jest.fn(),
  lock: jest.fn(),
  isUnlocked: jest.fn(),
  getSessionExpiresAt: jest.fn(),
  extendSession: jest.fn(),
  saveEncrypted: jest.fn(),
  loadEncrypted: jest.fn(),
  removeEncrypted: jest.fn(),
  clearAllEncrypted: jest.fn(),
  changeMasterPassword: jest.fn(),
  reset: jest.fn(),
});

// Helper: Create test XPathData
const createTestXPathData = (overrides: Partial<XPathData> = {}): XPathData => ({
  id: `xpath-${Date.now()}-${Math.random()}`,
  websiteId: 'test-website',
  value: 'test-value',
  actionType: ACTION_TYPE.TYPE,
  afterWaitSeconds: 0,
  actionPattern: EVENT_PATTERN.BASIC,
  pathAbsolute: '/html/body/div[1]/input',
  pathShort: '//input[@id="test"]',
  pathSmart: 'input#test',
  selectedPathPattern: PATH_PATTERN.SMART,
  retryType: RETRY_TYPE.NO_RETRY,
  executionOrder: 100,
  executionTimeoutSeconds: 30,
  url: 'https://example.com',
  ...overrides,
});

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SecureXPathRepository', () => {
  let mockSecureStorage: jest.Mocked<SecureStorage>;
  let repository: SecureXPathRepository;

  beforeEach(() => {
    mockSecureStorage = createMockSecureStorage();
    repository = new SecureXPathRepository(mockSecureStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create repository with SecureStorage dependency', () => {
      expect(repository).toBeInstanceOf(SecureXPathRepository);
    });
  });

  describe('save()', () => {
    it('should save collection encrypted when storage is unlocked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpath1 = createTestXPathData({ id: 'xpath-1', executionOrder: 100 });
      const xpath2 = createTestXPathData({ id: 'xpath-2', executionOrder: 200 });

      const collection = new XPathCollection([xpath1, xpath2]);

      await repository.save(collection);

      expect(mockSecureStorage.isUnlocked).toHaveBeenCalled();
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith('xpaths', expect.any(Array));
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();

      // Verify saved data is an array
      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(Array.isArray(savedData)).toBe(true);
      expect(savedData).toHaveLength(2);
    });

    it('should save empty collection', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = XPathCollection.empty();

      await repository.save(collection);

      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith('xpaths', expect.any(Array));

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData).toEqual([]);
    });

    it('should save collection with single XPath', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpath = createTestXPathData({
        id: 'single-xpath',
        value: 'username',
        actionType: ACTION_TYPE.TYPE,
      });

      const collection = new XPathCollection([xpath]);

      await repository.save(collection);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('single-xpath');
      expect(savedData[0].value).toBe('username');
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const collection = XPathCollection.empty();

      const result = await repository.save(collection);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );

      expect(mockSecureStorage.saveEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should preserve XPath data structure during save', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpath = createTestXPathData({
        id: 'detailed-xpath',
        websiteId: 'website-123',
        value: 'test@example.com',
        actionType: ACTION_TYPE.TYPE,
        afterWaitSeconds: 2,
        actionPattern: EVENT_PATTERN.FRAMEWORK_AGNOSTIC,
        pathAbsolute: '/html/body/div[1]/form/input[@name="email"]',
        pathShort: '//input[@name="email"]',
        pathSmart: 'input[name="email"]',
        selectedPathPattern: PATH_PATTERN.SHORT,
        retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
        executionOrder: 150,
        executionTimeoutSeconds: 45,
        url: 'https://example.com/login',
      });

      const collection = new XPathCollection([xpath]);

      await repository.save(collection);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData[0]).toMatchObject({
        id: 'detailed-xpath',
        websiteId: 'website-123',
        value: 'test@example.com',
        actionType: ACTION_TYPE.TYPE,
        afterWaitSeconds: 2,
        actionPattern: EVENT_PATTERN.FRAMEWORK_AGNOSTIC,
        selectedPathPattern: PATH_PATTERN.SHORT,
        retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
        executionOrder: 150,
        executionTimeoutSeconds: 45,
      });
    });

    it('should save collection with multiple XPaths for different websites', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpath1 = createTestXPathData({
        id: 'xpath-1',
        websiteId: 'website-1',
        executionOrder: 100,
      });

      const xpath2 = createTestXPathData({
        id: 'xpath-2',
        websiteId: 'website-2',
        executionOrder: 100,
      });

      const collection = new XPathCollection([xpath1, xpath2]);

      await repository.save(collection);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData).toHaveLength(2);

      const websites = savedData.map((x: XPathData) => x.websiteId);
      expect(websites).toContain('website-1');
      expect(websites).toContain('website-2');
    });

    it('should save XPaths in execution order', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpath1 = createTestXPathData({ id: 'xpath-1', executionOrder: 300 });
      const xpath2 = createTestXPathData({ id: 'xpath-2', executionOrder: 100 });
      const xpath3 = createTestXPathData({ id: 'xpath-3', executionOrder: 200 });

      const collection = new XPathCollection([xpath1, xpath2, xpath3]);

      await repository.save(collection);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData[0].executionOrder).toBe(100);
      expect(savedData[1].executionOrder).toBe(200);
      expect(savedData[2].executionOrder).toBe(300);
    });
  });

  describe('load()', () => {
    it('should load and decrypt collection when it exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpathData: XPathData[] = [
        createTestXPathData({ id: 'xpath-1', value: 'value1', executionOrder: 100 }),
        createTestXPathData({ id: 'xpath-2', value: 'value2', executionOrder: 200 }),
      ];

      mockSecureStorage.loadEncrypted.mockResolvedValue(xpathData);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      expect(loaded).toBeInstanceOf(XPathCollection);
      expect(loaded.getAll()).toHaveLength(2);

      const xpaths = loaded.getAll();
      expect(xpaths[0].value).toBe('value1');
      expect(xpaths[1].value).toBe('value2');

      expect(mockSecureStorage.isUnlocked).toHaveBeenCalled();
      expect(mockSecureStorage.loadEncrypted).toHaveBeenCalledWith('xpaths');
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return empty collection when no data exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(null);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      expect(loaded).toBeInstanceOf(XPathCollection);
      expect(loaded.getAll()).toHaveLength(0);
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return empty collection when storage returns undefined', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(undefined);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      expect(loaded).toBeInstanceOf(XPathCollection);
      expect(loaded.getAll()).toHaveLength(0);
    });

    it('should return empty collection when storage returns non-array', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({} as any);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      expect(loaded).toBeInstanceOf(XPathCollection);
      expect(loaded.getAll()).toHaveLength(0);
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.load();
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );

      expect(mockSecureStorage.loadEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should correctly reconstruct XPath with all properties', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpathData: XPathData = createTestXPathData({
        id: 'full-xpath',
        websiteId: 'website-full',
        value: 'complete-value',
        actionType: ACTION_TYPE.CLICK,
        afterWaitSeconds: 3,
        actionPattern: EVENT_PATTERN.BASIC,
        pathAbsolute: '/html/body/button',
        pathShort: '//button[@id="submit"]',
        pathSmart: 'button#submit',
        selectedPathPattern: PATH_PATTERN.ABSOLUTE,
        retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
        executionOrder: 250,
        executionTimeoutSeconds: 60,
        url: 'https://example.com/form',
      });

      mockSecureStorage.loadEncrypted.mockResolvedValue([xpathData]);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      const xpath = loaded.get('full-xpath');
      expect(xpath).toBeDefined();
      expect(xpath!.websiteId).toBe('website-full');
      expect(xpath!.value).toBe('complete-value');
      expect(xpath!.actionType).toBe(ACTION_TYPE.CLICK);
      expect(xpath!.afterWaitSeconds).toBe(3);
      expect(xpath!.executionOrder).toBe(250);
      expect(xpath!.executionTimeoutSeconds).toBe(60);
    });

    it('should load collection and maintain execution order', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpathData: XPathData[] = [
        createTestXPathData({ id: 'xpath-3', executionOrder: 300 }),
        createTestXPathData({ id: 'xpath-1', executionOrder: 100 }),
        createTestXPathData({ id: 'xpath-2', executionOrder: 200 }),
      ];

      mockSecureStorage.loadEncrypted.mockResolvedValue(xpathData);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      const xpaths = loaded.getAll();
      expect(xpaths[0].executionOrder).toBe(100);
      expect(xpaths[1].executionOrder).toBe(200);
      expect(xpaths[2].executionOrder).toBe(300);
    });

    it('should load empty array correctly', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue([]);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      expect(loaded.getAll()).toHaveLength(0);
    });

    it('should load collection with many XPaths', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpathData: XPathData[] = Array.from({ length: 50 }, (_, i) =>
        createTestXPathData({
          id: `xpath-${i}`,
          value: `value-${i}`,
          executionOrder: (i + 1) * 100,
        })
      );

      mockSecureStorage.loadEncrypted.mockResolvedValue(xpathData);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      expect(loaded.getAll()).toHaveLength(50);
    });
  });

  describe('Session Management', () => {
    it('should extend session after successful save', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = XPathCollection.empty();

      await repository.save(collection);

      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session after successful load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue([]);

      await repository.load();

      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session even when no data exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(null);

      await repository.load();

      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should not extend session when operation fails due to lock', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const collection = XPathCollection.empty();

      const result = await repository.save(collection);
      expect(result.isFailure).toBe(true);

      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should provide descriptive error message when locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const collection = XPathCollection.empty();

      const result = await repository.save(collection);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );
    });

    it('should propagate SecureStorage errors during save', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.saveEncrypted.mockRejectedValue(new Error('Storage write error'));

      const collection = XPathCollection.empty();

      const result = await repository.save(collection);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe('Storage write error');
    });

    it('should propagate SecureStorage errors during load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockRejectedValue(new Error('Decryption failed'));

      const result = await repository.load();
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe('Decryption failed');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow: save and load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      // Create and save collection
      const xpath1 = createTestXPathData({
        id: 'workflow-1',
        value: 'workflow-value-1',
        executionOrder: 100,
      });

      const xpath2 = createTestXPathData({
        id: 'workflow-2',
        value: 'workflow-value-2',
        executionOrder: 200,
      });

      const originalCollection = new XPathCollection([xpath1, xpath2]);
      await repository.save(originalCollection);

      // Load collection
      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);

      const loadedCollectionResult = await repository.load();
      expect(loadedCollectionResult.isSuccess).toBe(true);
      const loadedCollection = loadedCollectionResult.value!;

      expect(loadedCollection.getAll()).toHaveLength(2);
      const xpaths = loadedCollection.getAll();
      expect(xpaths.map((x) => x.value)).toContain('workflow-value-1');
      expect(xpaths.map((x) => x.value)).toContain('workflow-value-2');
    });

    it('should handle save-load-modify-save cycle', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      // Initial save
      const xpath = createTestXPathData({ id: 'initial', value: 'initial-value' });
      const collection1 = new XPathCollection([xpath]);
      await repository.save(collection1);

      // Load
      const savedData1 = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData1);
      const loadedCollectionResult = await repository.load();
      expect(loadedCollectionResult.isSuccess).toBe(true);
      const loadedCollection = loadedCollectionResult.value!;

      // Modify (add new xpath)
      const newXPath = createTestXPathData({ id: 'added', value: 'added-value' });
      const collection2 = loadedCollection.addWithId(newXPath);
      await repository.save(collection2);

      // Load again
      const savedData2 = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[1][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData2);
      const finalCollectionResult = await repository.load();
      expect(finalCollectionResult.isSuccess).toBe(true);
      const finalCollection = finalCollectionResult.value!;

      expect(finalCollection.getAll()).toHaveLength(2);
    });

    it('should preserve data integrity through save-load cycle', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const originalXPath = createTestXPathData({
        id: 'integrity-test',
        websiteId: 'website-integrity',
        value: 'integrity-value',
        actionType: ACTION_TYPE.JUDGE,
        afterWaitSeconds: 5,
        pathAbsolute: '/html/body/div[1]/span',
        selectedPathPattern: PATH_PATTERN.SMART,
        executionOrder: 175,
      });

      const originalCollection = new XPathCollection([originalXPath]);
      await repository.save(originalCollection);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);

      const loadedCollectionResult = await repository.load();
      expect(loadedCollectionResult.isSuccess).toBe(true);
      const loadedCollection = loadedCollectionResult.value!;
      const loadedXPath = loadedCollection.get('integrity-test');

      expect(loadedXPath).toBeDefined();
      expect(loadedXPath!.websiteId).toBe('website-integrity');
      expect(loadedXPath!.value).toBe('integrity-value');
      expect(loadedXPath!.actionType).toBe(ACTION_TYPE.JUDGE);
      expect(loadedXPath!.afterWaitSeconds).toBe(5);
      expect(loadedXPath!.executionOrder).toBe(175);
    });

    it('should handle collection filtering by websiteId after load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpathData: XPathData[] = [
        createTestXPathData({ id: 'xpath-1', websiteId: 'website-A', executionOrder: 100 }),
        createTestXPathData({ id: 'xpath-2', websiteId: 'website-B', executionOrder: 100 }),
        createTestXPathData({ id: 'xpath-3', websiteId: 'website-A', executionOrder: 200 }),
      ];

      mockSecureStorage.loadEncrypted.mockResolvedValue(xpathData);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      const websiteAXPaths = loaded.getByWebsiteId('website-A');
      expect(websiteAXPaths).toHaveLength(2);
      expect(websiteAXPaths.map((x) => x.id)).toContain('xpath-1');
      expect(websiteAXPaths.map((x) => x.id)).toContain('xpath-3');
    });
  });

  describe('XPath Collection Features', () => {
    it('should save and load XPaths with different action types', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpaths = [
        createTestXPathData({ id: 'type', actionType: ACTION_TYPE.TYPE }),
        createTestXPathData({ id: 'click', actionType: ACTION_TYPE.CLICK }),
        createTestXPathData({ id: 'check', actionType: ACTION_TYPE.CHECK }),
        createTestXPathData({ id: 'judge', actionType: ACTION_TYPE.JUDGE }),
        createTestXPathData({ id: 'change-url', actionType: ACTION_TYPE.CHANGE_URL }),
      ];

      const collection = new XPathCollection(xpaths);
      await repository.save(collection);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData).toHaveLength(5);

      const actionTypes = savedData.map((x: XPathData) => x.actionType);
      expect(actionTypes).toContain(ACTION_TYPE.TYPE);
      expect(actionTypes).toContain(ACTION_TYPE.CLICK);
      expect(actionTypes).toContain(ACTION_TYPE.JUDGE);
    });

    it('should save and load XPaths with different path patterns', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpaths = [
        createTestXPathData({ id: 'absolute', selectedPathPattern: PATH_PATTERN.ABSOLUTE }),
        createTestXPathData({ id: 'short', selectedPathPattern: PATH_PATTERN.SHORT }),
        createTestXPathData({ id: 'smart', selectedPathPattern: PATH_PATTERN.SMART }),
      ];

      const collection = new XPathCollection(xpaths);
      await repository.save(collection);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      expect(loaded.get('absolute')!.selectedPathPattern).toBe(PATH_PATTERN.ABSOLUTE);
      expect(loaded.get('short')!.selectedPathPattern).toBe(PATH_PATTERN.SHORT);
      expect(loaded.get('smart')!.selectedPathPattern).toBe(PATH_PATTERN.SMART);
    });

    it('should preserve execution order after save-load cycle', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const xpaths = [
        createTestXPathData({ id: 'xpath-1', executionOrder: 500 }),
        createTestXPathData({ id: 'xpath-2', executionOrder: 100 }),
        createTestXPathData({ id: 'xpath-3', executionOrder: 300 }),
      ];

      const collection = new XPathCollection(xpaths);
      await repository.save(collection);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;
      const loadedXPaths = loaded.getAll();

      // getAll() returns sorted by executionOrder
      expect(loadedXPaths[0].executionOrder).toBe(100);
      expect(loadedXPaths[1].executionOrder).toBe(300);
      expect(loadedXPaths[2].executionOrder).toBe(500);
    });
  });
});
