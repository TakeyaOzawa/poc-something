/**
 * Integration Tests: Secure Repository Layer
 * Tests the complete encryption flow: Repository → SecureStorage → CryptoAdapter
 * Uses real encryption with mocked browser storage
 */

import { SecureAutomationVariablesRepository } from '../SecureAutomationVariablesRepository';
import { SecureWebsiteRepository } from '../SecureWebsiteRepository';
import { SecureXPathRepository } from '../SecureXPathRepository';
import { SecureSystemSettingsRepository } from '../SecureSystemSettingsRepository';
import { SecureStorageAdapter } from '../../adapters/SecureStorageAdapter';
import { WebCryptoAdapter } from '../../adapters/CryptoAdapter';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Website } from '@domain/entities/Website';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { PATH_PATTERN } from '@domain/constants/PathPattern';
import { RETRY_TYPE } from '@domain/constants/RetryType';
import { EVENT_PATTERN } from '@domain/constants/EventPattern';
import { LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import browser from 'webextension-polyfill';

// Mock browser storage and alarms
jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: {
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
      },
    },
    alarms: {
      create: jest.fn(),
      clear: jest.fn(),
    },
  },
}));

describe('Secure Repository Integration Tests', () => {
  let cryptoAdapter: WebCryptoAdapter;
  let secureStorage: SecureStorageAdapter;
  const masterPassword = 'TestMasterPassword123!@#';

  // Helper: Initialize and unlock SecureStorage
  const initializeAndUnlock = async () => {
    (browser.storage.local.get as jest.Mock).mockResolvedValue({});
    await secureStorage.initialize(masterPassword);
    jest.clearAllMocks();
  };

  beforeEach(() => {
    cryptoAdapter = new WebCryptoAdapter();
    secureStorage = new SecureStorageAdapter(cryptoAdapter);
    jest.clearAllMocks();

    // Default mock implementations
    (browser.storage.local.get as jest.Mock).mockResolvedValue({});
    (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);
    (browser.storage.local.remove as jest.Mock).mockResolvedValue(undefined);
    (browser.alarms.clear as jest.Mock).mockResolvedValue(true);
    (browser.alarms.create as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    secureStorage.lock();
  });

  describe('SecureAutomationVariablesRepository Integration', () => {
    let repository: SecureAutomationVariablesRepository;

    beforeEach(async () => {
      await initializeAndUnlock();
      repository = new SecureAutomationVariablesRepository(secureStorage);
    });

    it('should save and load automation variables with real encryption', async () => {
      // Create test data
      const variables = AutomationVariables.create({
        websiteId: 'test-website',
        variables: { username: 'testuser', password: 'secret123', email: 'test@example.com' },
        status: 'enabled',
      });

      // Save
      await repository.save(variables);

      // Capture encrypted data
      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const encryptedData = setCalls[0][0];

      // Verify encryption (data should not be plain text)
      expect(encryptedData).toHaveProperty('secure_automation_variables');
      expect(encryptedData.secure_automation_variables).toHaveProperty('ciphertext');
      expect(encryptedData.secure_automation_variables).toHaveProperty('iv');
      expect(encryptedData.secure_automation_variables).toHaveProperty('salt');

      // Mock browser storage to return encrypted data
      (browser.storage.local.get as jest.Mock).mockResolvedValue(encryptedData);

      // Load and verify
      const loadedResult = await repository.load('test-website');
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      expect(loaded).not.toBeNull();
      expect(loaded!.getWebsiteId()).toBe('test-website');
      expect(loaded!.getVariables()).toEqual({
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com',
      });
      expect(loaded!.getStatus()).toBe('enabled');
    });

    it('should handle multiple automation variables for different websites', async () => {
      // Create variables for 3 websites
      const var1 = AutomationVariables.create({
        websiteId: 'website-1',
        variables: { username: 'user1', password: 'pass1' },
        status: 'enabled',
      });

      const var2 = AutomationVariables.create({
        websiteId: 'website-2',
        variables: { username: 'user2', password: 'pass2' },
        status: 'disabled',
      });

      const var3 = AutomationVariables.create({
        websiteId: 'website-3',
        variables: { username: 'user3', password: 'pass3' },
        status: 'enabled',
      });

      // Save all
      await repository.save(var1);
      const data1 = (browser.storage.local.set as jest.Mock).mock.calls[0][0];

      (browser.storage.local.get as jest.Mock).mockResolvedValue(data1);
      await repository.save(var2);
      const data2 = (browser.storage.local.set as jest.Mock).mock.calls[1][0];

      (browser.storage.local.get as jest.Mock).mockResolvedValue(data2);
      await repository.save(var3);
      const data3 = (browser.storage.local.set as jest.Mock).mock.calls[2][0];

      // Load all
      (browser.storage.local.get as jest.Mock).mockResolvedValue(data3);
      const allLoadedResult = await repository.loadAll();
      expect(allLoadedResult.isSuccess).toBe(true);
      const allLoaded = allLoadedResult.value!;

      expect(allLoaded).toHaveLength(3);
      expect(allLoaded.map((v) => v.getWebsiteId())).toContain('website-1');
      expect(allLoaded.map((v) => v.getWebsiteId())).toContain('website-2');
      expect(allLoaded.map((v) => v.getWebsiteId())).toContain('website-3');
    });

    it('should delete specific website variables', async () => {
      // Save variables for 2 websites
      const var1 = AutomationVariables.create({
        websiteId: 'keep',
        variables: { data: 'keep-this' },
        status: 'enabled',
      });

      const var2 = AutomationVariables.create({
        websiteId: 'delete',
        variables: { data: 'delete-this' },
        status: 'enabled',
      });

      await repository.save(var1);
      const data1 = (browser.storage.local.set as jest.Mock).mock.calls[0][0];

      (browser.storage.local.get as jest.Mock).mockResolvedValue(data1);
      await repository.save(var2);
      const data2 = (browser.storage.local.set as jest.Mock).mock.calls[1][0];

      // Delete one
      (browser.storage.local.get as jest.Mock).mockResolvedValue(data2);
      await repository.delete('delete');
      const dataAfterDelete = (browser.storage.local.set as jest.Mock).mock.calls[2][0];

      // Verify deletion
      (browser.storage.local.get as jest.Mock).mockResolvedValue(dataAfterDelete);
      const remainingResult = await repository.loadAll();
      expect(remainingResult.isSuccess).toBe(true);
      const remaining = remainingResult.value!;

      expect(remaining).toHaveLength(1);
      expect(remaining[0].getWebsiteId()).toBe('keep');
    });

    it('should verify data encryption prevents reading without password', async () => {
      const variables = AutomationVariables.create({
        websiteId: 'sensitive-website',
        variables: { password: 'VerySecretPassword123!' },
        status: 'enabled',
      });

      await repository.save(variables);

      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const encryptedData = setCalls[0][0];

      // Verify the raw encrypted data does not contain plaintext password or sensitive data
      const encryptedString = JSON.stringify(encryptedData);
      expect(encryptedString).not.toContain('VerySecretPassword123!');
      expect(encryptedString).not.toContain('password');
      expect(encryptedString).not.toContain('sensitive-website');
    });
  });

  describe('SecureWebsiteRepository Integration', () => {
    let repository: SecureWebsiteRepository;

    beforeEach(async () => {
      await initializeAndUnlock();
      repository = new SecureWebsiteRepository(secureStorage);
    });

    it('should save and load website collection with real encryption', async () => {
      // Create test websites
      const website1 = Website.create({
        name: 'Test Site 1',
        startUrl: 'https://example1.com',
        editable: true,
      });

      const website2 = Website.create({
        name: 'Test Site 2',
        startUrl: 'https://example2.com',
        editable: false,
      });

      const collection = new WebsiteCollection([website1, website2]);

      // Save
      await repository.save(collection);

      // Capture encrypted data
      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const encryptedData = setCalls[0][0];

      // Verify encryption
      expect(encryptedData).toHaveProperty('secure_websites');
      expect(encryptedData.secure_websites).toHaveProperty('ciphertext');
      expect(encryptedData.secure_websites).toHaveProperty('iv');
      expect(encryptedData.secure_websites).toHaveProperty('salt');

      // Mock browser storage to return encrypted data
      (browser.storage.local.get as jest.Mock).mockResolvedValue(encryptedData);

      // Load and verify
      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loaded = loadResult.value!;

      expect(loaded.getAll()).toHaveLength(2);
      const websites = loaded.getAll();
      expect(websites[0].getName()).toBe('Test Site 1');
      expect(websites[0].getStartUrl()).toBe('https://example1.com');
    });

    it('should handle empty website collection', async () => {
      const emptyCollection = WebsiteCollection.empty();

      await repository.save(emptyCollection);

      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const encryptedData = setCalls[0][0];

      (browser.storage.local.get as jest.Mock).mockResolvedValue(encryptedData);

      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loaded = loadResult.value!;

      expect(loaded.getAll()).toHaveLength(0);
    });

    it('should preserve website collection through save-load-modify-save cycle', async () => {
      const website1 = Website.create({
        name: 'Original',
        startUrl: 'https://original.com',
        editable: true,
      });

      const collection1 = new WebsiteCollection([website1]);
      await repository.save(collection1);

      const data1 = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
      (browser.storage.local.get as jest.Mock).mockResolvedValue(data1);

      const loadResult1 = await repository.load();
      expect(loadResult1.isSuccess).toBe(true);
      const loaded = loadResult1.value!;

      const website2 = Website.create({
        name: 'Added',
        startUrl: 'https://added.com',
        editable: true,
      });

      const collection2 = loaded.add(website2);
      await repository.save(collection2);

      const data2 = (browser.storage.local.set as jest.Mock).mock.calls[1][0];
      (browser.storage.local.get as jest.Mock).mockResolvedValue(data2);

      const loadResult2 = await repository.load();
      expect(loadResult2.isSuccess).toBe(true);
      const finalLoaded = loadResult2.value!;

      expect(finalLoaded.getAll()).toHaveLength(2);
      expect(finalLoaded.getAll().map((w) => w.getName())).toContain('Original');
      expect(finalLoaded.getAll().map((w) => w.getName())).toContain('Added');
    });
  });

  describe('SecureXPathRepository Integration', () => {
    let repository: SecureXPathRepository;

    beforeEach(async () => {
      await initializeAndUnlock();
      repository = new SecureXPathRepository(secureStorage);
    });

    const createTestXPath = (overrides: Partial<XPathData> = {}): XPathData => ({
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

    it('should save and load xpath collection with real encryption', async () => {
      const xpath1 = createTestXPath({
        id: 'xpath-1',
        websiteId: 'site-1',
        value: 'username',
        actionType: ACTION_TYPE.TYPE,
        executionOrder: 100,
      });

      const xpath2 = createTestXPath({
        id: 'xpath-2',
        websiteId: 'site-1',
        value: 'password',
        actionType: ACTION_TYPE.TYPE,
        executionOrder: 200,
      });

      const xpath3 = createTestXPath({
        id: 'xpath-3',
        websiteId: 'site-1',
        actionType: ACTION_TYPE.CLICK,
        executionOrder: 300,
      });

      const collection = new XPathCollection([xpath1, xpath2, xpath3]);

      // Save
      await repository.save(collection);

      // Capture encrypted data
      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const encryptedData = setCalls[0][0];

      // Verify encryption
      expect(encryptedData).toHaveProperty('secure_xpaths');
      expect(encryptedData.secure_xpaths).toHaveProperty('ciphertext');
      expect(encryptedData.secure_xpaths).toHaveProperty('iv');
      expect(encryptedData.secure_xpaths).toHaveProperty('salt');

      // Mock browser storage to return encrypted data
      (browser.storage.local.get as jest.Mock).mockResolvedValue(encryptedData);

      // Load and verify
      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      expect(loaded.getAll()).toHaveLength(3);
      const xpaths = loaded.getAll();

      // Verify execution order is preserved
      expect(xpaths[0].executionOrder).toBe(100);
      expect(xpaths[1].executionOrder).toBe(200);
      expect(xpaths[2].executionOrder).toBe(300);

      // Verify data integrity
      expect(xpaths[0].value).toBe('username');
      expect(xpaths[1].value).toBe('password');
      expect(xpaths[2].actionType).toBe(ACTION_TYPE.CLICK);
    });

    it('should handle different action types and path patterns', async () => {
      const xpaths = [
        createTestXPath({ id: 'type', actionType: ACTION_TYPE.TYPE, executionOrder: 100 }),
        createTestXPath({ id: 'click', actionType: ACTION_TYPE.CLICK, executionOrder: 200 }),
        createTestXPath({ id: 'check', actionType: ACTION_TYPE.CHECK, executionOrder: 300 }),
        createTestXPath({ id: 'judge', actionType: ACTION_TYPE.JUDGE, executionOrder: 400 }),
        createTestXPath({
          id: 'absolute',
          selectedPathPattern: PATH_PATTERN.ABSOLUTE,
          executionOrder: 500,
        }),
        createTestXPath({
          id: 'short',
          selectedPathPattern: PATH_PATTERN.SHORT,
          executionOrder: 600,
        }),
      ];

      const collection = new XPathCollection(xpaths);
      await repository.save(collection);

      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const encryptedData = setCalls[0][0];
      (browser.storage.local.get as jest.Mock).mockResolvedValue(encryptedData);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      expect(loaded.get('type')!.actionType).toBe(ACTION_TYPE.TYPE);
      expect(loaded.get('click')!.actionType).toBe(ACTION_TYPE.CLICK);
      expect(loaded.get('check')!.actionType).toBe(ACTION_TYPE.CHECK);
      expect(loaded.get('judge')!.actionType).toBe(ACTION_TYPE.JUDGE);
      expect(loaded.get('absolute')!.selectedPathPattern).toBe(PATH_PATTERN.ABSOLUTE);
      expect(loaded.get('short')!.selectedPathPattern).toBe(PATH_PATTERN.SHORT);
    });

    it('should filter xpaths by websiteId after load', async () => {
      const xpaths = [
        createTestXPath({ id: 'a1', websiteId: 'site-a', executionOrder: 100 }),
        createTestXPath({ id: 'a2', websiteId: 'site-a', executionOrder: 200 }),
        createTestXPath({ id: 'b1', websiteId: 'site-b', executionOrder: 100 }),
        createTestXPath({ id: 'b2', websiteId: 'site-b', executionOrder: 200 }),
      ];

      const collection = new XPathCollection(xpaths);
      await repository.save(collection);

      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const encryptedData = setCalls[0][0];
      (browser.storage.local.get as jest.Mock).mockResolvedValue(encryptedData);

      const loadedResult = await repository.load();
      expect(loadedResult.isSuccess).toBe(true);
      const loaded = loadedResult.value!;

      const siteAXPaths = loaded.getByWebsiteId('site-a');
      expect(siteAXPaths).toHaveLength(2);
      expect(siteAXPaths.map((x) => x.id)).toEqual(['a1', 'a2']);

      const siteBXPaths = loaded.getByWebsiteId('site-b');
      expect(siteBXPaths).toHaveLength(2);
      expect(siteBXPaths.map((x) => x.id)).toEqual(['b1', 'b2']);
    });
  });

  describe('SecureSystemSettingsRepository Integration', () => {
    let repository: SecureSystemSettingsRepository;

    beforeEach(async () => {
      await initializeAndUnlock();
      repository = new SecureSystemSettingsRepository(secureStorage);
    });

    it('should save and load system settings with real encryption', async () => {
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 30,
        retryCount: 5,
        autoFillProgressDialogMode: 'hidden',
        waitForOptionsMilliseconds: 1000,
        logLevel: LogLevel.DEBUG,
      });

      // Save
      await repository.save(settings);

      // Capture encrypted data
      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const encryptedData = setCalls[0][0];

      // Verify encryption
      expect(encryptedData).toHaveProperty('secure_system_settings');
      expect(encryptedData.secure_system_settings).toHaveProperty('ciphertext');
      expect(encryptedData.secure_system_settings).toHaveProperty('iv');
      expect(encryptedData.secure_system_settings).toHaveProperty('salt');

      // Mock browser storage to return encrypted data
      (browser.storage.local.get as jest.Mock).mockResolvedValue(encryptedData);

      // Load and verify
      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loaded = loadResult.value!;

      expect(loaded.getRetryWaitSecondsMin()).toBe(10);
      expect(loaded.getRetryWaitSecondsMax()).toBe(30);
      expect(loaded.getRetryCount()).toBe(5);
      expect(loaded.getAutoFillProgressDialogMode()).toBe('hidden');
      expect(loaded.getWaitForOptionsMilliseconds()).toBe(1000);
      expect(loaded.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    it('should handle default settings when no data exists', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loaded = loadResult.value!;

      // Should return default values
      expect(loaded.getRetryWaitSecondsMin()).toBe(30);
      expect(loaded.getRetryWaitSecondsMax()).toBe(60);
      expect(loaded.getRetryCount()).toBe(3);
      expect(loaded.getAutoFillProgressDialogMode()).toBe('withCancel');
      expect(loaded.getWaitForOptionsMilliseconds()).toBe(500);
      expect(loaded.getLogLevel()).toBe(LogLevel.INFO);
    });

    it('should use immutable builder pattern correctly', async () => {
      const settings1 = new SystemSettingsCollection();
      await repository.save(settings1);

      const data1 = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
      (browser.storage.local.get as jest.Mock).mockResolvedValue(data1);

      const loadResult1 = await repository.load();
      expect(loadResult1.isSuccess).toBe(true);
      const loaded = loadResult1.value!;

      // Modify using builder pattern
      const settings2 = loaded.withRetryCount(10).withLogLevel(LogLevel.ERROR);

      await repository.save(settings2);

      const data2 = (browser.storage.local.set as jest.Mock).mock.calls[1][0];
      (browser.storage.local.get as jest.Mock).mockResolvedValue(data2);

      const loadResult2 = await repository.load();
      expect(loadResult2.isSuccess).toBe(true);
      const finalLoaded = loadResult2.value!;

      expect(finalLoaded.getRetryCount()).toBe(10);
      expect(finalLoaded.getLogLevel()).toBe(LogLevel.ERROR);
      // Other values should remain defaults
      expect(finalLoaded.getRetryWaitSecondsMin()).toBe(30);
      expect(finalLoaded.getRetryWaitSecondsMax()).toBe(60);
    });

    it('should handle all log levels', async () => {
      const logLevels = [
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.NONE,
      ];

      for (const level of logLevels) {
        const settings = new SystemSettingsCollection({ logLevel: level });
        await repository.save(settings);

        const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
        const encryptedData = setCalls[logLevels.indexOf(level)][0];
        (browser.storage.local.get as jest.Mock).mockResolvedValue(encryptedData);

        const loadResult = await repository.load();
        expect(loadResult.isSuccess).toBe(true);
        const loaded = loadResult.value!;
        expect(loaded.getLogLevel()).toBe(level);
      }
    });
  });

  describe('Cross-Repository Integration', () => {
    let automationRepo: SecureAutomationVariablesRepository;
    let websiteRepo: SecureWebsiteRepository;
    let xpathRepo: SecureXPathRepository;
    let settingsRepo: SecureSystemSettingsRepository;

    beforeEach(async () => {
      await initializeAndUnlock();
      automationRepo = new SecureAutomationVariablesRepository(secureStorage);
      websiteRepo = new SecureWebsiteRepository(secureStorage);
      xpathRepo = new SecureXPathRepository(secureStorage);
      settingsRepo = new SecureSystemSettingsRepository(secureStorage);
    });

    it('should handle multiple repositories with the same SecureStorage', async () => {
      // Save data to all repositories
      const variables = AutomationVariables.create({
        websiteId: 'cross-test',
        variables: { key: 'value' },
        status: 'enabled',
      });

      const website = Website.create({
        name: 'Cross Test',
        startUrl: 'https://cross.test',
        editable: true,
      });

      const xpath: XPathData = {
        id: 'cross-xpath',
        websiteId: 'cross-test',
        value: 'test',
        actionType: ACTION_TYPE.TYPE,
        afterWaitSeconds: 0,
        actionPattern: EVENT_PATTERN.BASIC,
        pathAbsolute: '//input',
        pathShort: '//input',
        pathSmart: 'input',
        selectedPathPattern: PATH_PATTERN.SMART,
        retryType: RETRY_TYPE.NO_RETRY,
        executionOrder: 100,
        executionTimeoutSeconds: 30,
        url: 'https://cross.test',
      };

      const settings = new SystemSettingsCollection({ retryCount: 7 });

      await automationRepo.save(variables);
      const data1 = (browser.storage.local.set as jest.Mock).mock.calls[0][0];

      await websiteRepo.save(new WebsiteCollection([website]));
      const data2 = (browser.storage.local.set as jest.Mock).mock.calls[1][0];

      await xpathRepo.save(new XPathCollection([xpath]));
      const data3 = (browser.storage.local.set as jest.Mock).mock.calls[2][0];

      await settingsRepo.save(settings);
      const data4 = (browser.storage.local.set as jest.Mock).mock.calls[3][0];

      // Load and verify all data
      (browser.storage.local.get as jest.Mock).mockResolvedValue(data1);
      const loadedVar = await automationRepo.load('cross-test');
      expect(loadedVar).not.toBeNull();

      (browser.storage.local.get as jest.Mock).mockResolvedValue(data2);
      const loadedWebsiteResult = await websiteRepo.load();
      expect(loadedWebsiteResult.isSuccess).toBe(true);
      const loadedWebsite = loadedWebsiteResult.value!;
      expect(loadedWebsite.getAll()).toHaveLength(1);

      (browser.storage.local.get as jest.Mock).mockResolvedValue(data3);
      const loadedXPathResult = await xpathRepo.load();
      expect(loadedXPathResult.isSuccess).toBe(true);
      const loadedXPath = loadedXPathResult.value!;
      expect(loadedXPath.getAll()).toHaveLength(1);

      (browser.storage.local.get as jest.Mock).mockResolvedValue(data4);
      const loadedSettingsResult = await settingsRepo.load();
      expect(loadedSettingsResult.isSuccess).toBe(true);
      const loadedSettings = loadedSettingsResult.value!;
      expect(loadedSettings.getRetryCount()).toBe(7);
    });

    it('should return failure when storage is locked', async () => {
      secureStorage.lock();

      const variables = AutomationVariables.create({
        websiteId: 'test',
        variables: {},
        status: 'enabled',
      });

      // AutomationVariables repository returns Result (migrated)
      const saveResult = await automationRepo.save(variables);
      expect(saveResult.isFailure).toBe(true);
      expect(saveResult.error?.message).toContain(
        'Cannot access encrypted data: Storage is locked'
      );

      // Website repository returns Result (already migrated)
      const websiteResult = await websiteRepo.load();
      expect(websiteResult.isFailure).toBe(true);
      expect(websiteResult.error?.message).toContain(
        'Cannot access encrypted data: Storage is locked'
      );

      // XPath repository returns Result (migrated)
      const xpathResult = await xpathRepo.load();
      expect(xpathResult.isFailure).toBe(true);
      expect(xpathResult.error?.message).toContain(
        'Cannot access encrypted data: Storage is locked'
      );

      // SystemSettings repository returns Result (migrated in Phase 1.1)
      const settingsResult = await settingsRepo.load();
      expect(settingsResult.isFailure).toBe(true);
      expect(settingsResult.error?.message).toContain(
        'Cannot access encrypted data: Storage is locked'
      );
    });

    it('should extend session on repository operations', async () => {
      const initialExpires = secureStorage.getSessionExpiresAt();

      // Wait for at least 1ms to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Perform operations
      await settingsRepo.load();

      const newExpires = secureStorage.getSessionExpiresAt();

      // Session should be extended
      expect(newExpires).not.toBeNull();
      expect(newExpires!).toBeGreaterThan(initialExpires!);
    });
  });

  describe('Encryption Security Tests', () => {
    let automationRepo: SecureAutomationVariablesRepository;

    beforeEach(async () => {
      await initializeAndUnlock();
      automationRepo = new SecureAutomationVariablesRepository(secureStorage);
    });

    it('should produce different ciphertexts for same data (due to random IV)', async () => {
      const variables = AutomationVariables.create({
        websiteId: 'same-data',
        variables: { password: 'SamePassword123' },
        status: 'enabled',
      });

      // Save first time
      await automationRepo.save(variables);
      const data1 = (browser.storage.local.set as jest.Mock).mock.calls[0][0];

      // Save second time with same data
      await automationRepo.save(variables);
      const data2 = (browser.storage.local.set as jest.Mock).mock.calls[1][0];

      // Ciphertexts should be different (random IV)
      expect(data1.secure_automation_variables.ciphertext).not.toBe(
        data2.secure_automation_variables.ciphertext
      );

      // But both should decrypt to same data
      (browser.storage.local.get as jest.Mock).mockResolvedValue(data1);
      const loaded1Result = await automationRepo.load('same-data');
      expect(loaded1Result.isSuccess).toBe(true);
      const loaded1 = loaded1Result.value!;

      (browser.storage.local.get as jest.Mock).mockResolvedValue(data2);
      const loaded2Result = await automationRepo.load('same-data');
      expect(loaded2Result.isSuccess).toBe(true);
      const loaded2 = loaded2Result.value!;

      expect(loaded1.getVariables()).toEqual(loaded2.getVariables());
    });

    it('should not leak sensitive data in encrypted form', async () => {
      const sensitiveData = {
        password: 'MySuperSecretPassword123!@#',
        apiKey: 'sk-1234567890abcdef',
        token: 'Bearer xyz123',
      };

      const variables = AutomationVariables.create({
        websiteId: 'sensitive',
        variables: sensitiveData,
        status: 'enabled',
      });

      await automationRepo.save(variables);

      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const encryptedData = setCalls[0][0];
      const encryptedString = JSON.stringify(encryptedData);

      // Verify no sensitive data appears in plaintext
      expect(encryptedString).not.toContain('MySuperSecretPassword123!@#');
      expect(encryptedString).not.toContain('sk-1234567890abcdef');
      expect(encryptedString).not.toContain('Bearer xyz123');
      expect(encryptedString).not.toContain('password');
      expect(encryptedString).not.toContain('apiKey');
      expect(encryptedString).not.toContain('token');
    });
  });
});
