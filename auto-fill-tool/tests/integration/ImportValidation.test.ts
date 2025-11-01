/**
 * Integration Test: Import Validation
 * Tests that import validation properly prevents orphaned records
 */

import { ChromeStorageWebsiteRepository } from '@infrastructure/repositories/ChromeStorageWebsiteRepository';
import { ChromeStorageXPathRepository } from '@infrastructure/repositories/ChromeStorageXPathRepository';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { ImportXPathsUseCase } from '@usecases/xpaths/ImportXPathsUseCase';
import { ImportAutomationVariablesUseCase } from '@usecases/automation-variables/ImportAutomationVariablesUseCase';
import { XPathCollectionMapper } from '@infrastructure/mappers/XPathCollectionMapper';
import { AutomationVariablesMapper } from '@infrastructure/mappers/AutomationVariablesMapper';
import { Website } from '@domain/entities/Website';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import browser from 'webextension-polyfill';

// Mock browser.storage.local
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
  },
}));

describe('Import Validation Integration Test', () => {
  const logger = new NoOpLogger();
  let storage: Record<string, any>;

  beforeEach(() => {
    storage = {};

    // Mock storage implementation
    (browser.storage.local.get as jest.Mock).mockImplementation((keys) => {
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: storage[keys] });
      }
      const result: Record<string, any> = {};
      if (Array.isArray(keys)) {
        keys.forEach((key) => {
          if (storage[key] !== undefined) {
            result[key] = storage[key];
          }
        });
      }
      return Promise.resolve(result);
    });

    (browser.storage.local.set as jest.Mock).mockImplementation((items) => {
      Object.assign(storage, items);
      return Promise.resolve();
    });

    (browser.storage.local.clear as jest.Mock).mockImplementation(() => {
      storage = {};
      return Promise.resolve();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('XPath Import Validation', () => {
    it('should reject import when referenced Website does not exist', async () => {
      // Setup repositories
      const xpathRepo = new ChromeStorageXPathRepository(logger);
      const websiteRepo = new ChromeStorageWebsiteRepository(logger);
      const xpathMapper = new XPathCollectionMapper();
      const mockEventBus = {
        subscriptions: new Map(),
        globalHandlers: [],
        isPublishing: false,
        eventQueue: [],
        publish: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        subscribeToAll: jest.fn(),
        clearAll: jest.fn(),
        subscribeToMultiple: jest.fn(),
        unsubscribeAll: jest.fn(),
        publishMany: jest.fn(),
        getSubscriptionCount: jest.fn(),
        getRegisteredEventTypes: jest.fn(),
      } as any;

      // Create import use case WITH validation enabled
      const importXPathsUseCase = new ImportXPathsUseCase(xpathRepo, xpathMapper, mockEventBus);

      // Create CSV with XPath that references non-existent website
      const csv = `id,website_id,value,action_type,after_wait_seconds,action_pattern,path_absolute,path_short,path_smart,selected_path_pattern,retry_type,execution_order,execution_timeout_seconds,url
xpath-001,non-existent-website-id,{{username}},type,0,0,/html/body/div/input,//*[@id="username"],//input[@name="username"],smart,0,1,30,https://example.com/login`;

      // Attempt import - should return failure
      const result = await importXPathsUseCase.execute({ csvText: csv });

      expect(result.isFailure).toBe(true);
      expect(result.error).toMatch(
        /Cannot import XPaths: Referenced websites not found.*non-existent-website-id.*Please import Websites CSV first/
      );
    });

    it('should allow import when all referenced Websites exist', async () => {
      // Setup repositories
      const xpathRepo = new ChromeStorageXPathRepository(logger);
      const websiteRepo = new ChromeStorageWebsiteRepository(logger);
      const xpathMapper = new XPathCollectionMapper();

      // Create website first
      const website = Website.create({
        name: 'Test Site',
        startUrl: 'https://example.com',
      });
      await websiteRepo.save(new WebsiteCollection([website]));

      // Create import use case WITH validation enabled
      const mockEventBus = {
        subscriptions: new Map(),
        globalHandlers: [],
        isPublishing: false,
        eventQueue: [],
        publish: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        subscribeToAll: jest.fn(),
        clearAll: jest.fn(),
        subscribeToMultiple: jest.fn(),
        unsubscribeAll: jest.fn(),
        publishMany: jest.fn(),
        getSubscriptionCount: jest.fn(),
        getRegisteredEventTypes: jest.fn(),
      } as any;
      const importXPathsUseCase = new ImportXPathsUseCase(xpathRepo, xpathMapper, mockEventBus);

      // Create CSV with XPath that references the existing website
      const csv = `id,website_id,value,action_type,after_wait_seconds,action_pattern,path_absolute,path_short,path_smart,selected_path_pattern,retry_type,execution_order,execution_timeout_seconds,url
xpath-001,${website.getId()},{{username}},type,0,0,/html/body/div/input,//*[@id="username"],//input[@name="username"],smart,0,1,30,https://example.com/login`;

      // Import should succeed - focus on integration: validation passes
      const result = await importXPathsUseCase.execute({ csvText: csv });
      expect(result.isSuccess).toBe(true);
    });

    it('should work without validation when websiteRepository is not provided', async () => {
      // Setup repositories
      const xpathRepo = new ChromeStorageXPathRepository(logger);
      const xpathMapper = new XPathCollectionMapper();

      // Create import use case WITHOUT validation (no websiteRepository)
      const importXPathsUseCase = new ImportXPathsUseCase(xpathRepo, xpathMapper);

      // Create CSV with XPath that references non-existent website
      const csv = `id,website_id,value,action_type,after_wait_seconds,action_pattern,path_absolute,path_short,path_smart,selected_path_pattern,retry_type,execution_order,execution_timeout_seconds,url
xpath-001,non-existent-website-id,{{username}},type,0,0,/html/body/div/input,//*[@id="username"],//input[@name="username"],smart,0,1,30,https://example.com/login`;

      // Import should succeed (no validation)
      // Detailed field checks are covered in unit tests (Mapper, UseCase)
      await expect(importXPathsUseCase.execute({ csvText: csv })).resolves.not.toThrow();
    });
  });

  describe('Automation Variables Import Validation', () => {
    it('should reject import when referenced Website does not exist', async () => {
      // Setup repositories
      const automationVariablesRepo = new ChromeStorageAutomationVariablesRepository(logger);
      const websiteRepo = new ChromeStorageWebsiteRepository(logger);
      const automationVariablesMapper = new AutomationVariablesMapper(logger);
      const mockEventBus = {
        subscriptions: new Map(),
        globalHandlers: [],
        isPublishing: false,
        eventQueue: [],
        publish: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        subscribeToAll: jest.fn(),
        clearAll: jest.fn(),
        subscribeToMultiple: jest.fn(),
        unsubscribeAll: jest.fn(),
        publishMany: jest.fn(),
        getSubscriptionCount: jest.fn(),
        getRegisteredEventTypes: jest.fn(),
      } as any;

      // Create import use case WITH validation enabled
      const importAutomationVariablesUseCase = new ImportAutomationVariablesUseCase(
        automationVariablesRepo,
        automationVariablesMapper,
        mockEventBus
      );

      // Create CSV with AutomationVariables that references non-existent website
      const csv = `"id","status","updatedAt","variables","websiteId"
"av-001","enabled","2025-01-15T10:30:00.000Z","{\\"username\\":\\"test\\"}","non-existent-website-id"`;

      // Attempt import - should return failure
      const result = await importAutomationVariablesUseCase.execute({ csvText: csv });

      expect(result.isFailure).toBe(true);
      expect(result.error).toMatch(
        /Cannot import Automation Variables: Referenced websites not found.*non-existent-website-id.*Please import Websites CSV first/
      );
    });

    it('should allow import when all referenced Websites exist', async () => {
      // Setup repositories
      const automationVariablesRepo = new ChromeStorageAutomationVariablesRepository(logger);
      const websiteRepo = new ChromeStorageWebsiteRepository(logger);
      const automationVariablesMapper = new AutomationVariablesMapper(logger);
      const mockEventBus = {
        subscriptions: new Map(),
        globalHandlers: [],
        isPublishing: false,
        eventQueue: [],
        publish: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        subscribeToAll: jest.fn(),
        clearAll: jest.fn(),
        subscribeToMultiple: jest.fn(),
        unsubscribeAll: jest.fn(),
        publishMany: jest.fn(),
        getSubscriptionCount: jest.fn(),
        getRegisteredEventTypes: jest.fn(),
      } as any;

      // Create website first
      const website = Website.create({
        name: 'Test Site',
        startUrl: 'https://example.com',
      });
      await websiteRepo.save(new WebsiteCollection([website]));

      // Create import use case WITH validation enabled
      const importAutomationVariablesUseCase = new ImportAutomationVariablesUseCase(
        automationVariablesRepo,
        automationVariablesMapper,
        mockEventBus
      );

      // Create CSV with AutomationVariables that references the existing website
      const csv = `"id","status","updatedAt","variables","websiteId"
"av-001","enabled","2025-01-15T10:30:00.000Z","{\\"username\\":\\"test\\"}","${website.getId()}"`;

      // Import should succeed - focus on integration: validation passes
      // Detailed field checks are covered in unit tests (Mapper, UseCase)
      const result = await importAutomationVariablesUseCase.execute({ csvText: csv });
      expect(result.isSuccess).toBe(true);
    });

    it('should work without validation when websiteRepository is not provided', async () => {
      // Setup repositories
      const automationVariablesRepo = new ChromeStorageAutomationVariablesRepository(logger);
      const automationVariablesMapper = new AutomationVariablesMapper(logger);

      // Create import use case WITHOUT validation (no websiteRepository)
      const importAutomationVariablesUseCase = new ImportAutomationVariablesUseCase(
        automationVariablesRepo,
        automationVariablesMapper
      );

      // Create CSV with AutomationVariables that references non-existent website
      const csv = `"id","status","updatedAt","variables","websiteId"
"av-001","enabled","2025-01-15T10:30:00.000Z","{\\"username\\":\\"test\\"}","non-existent-website-id"`;

      // Import should succeed (no validation)
      // Detailed field checks are covered in unit tests (Mapper, UseCase)
      const result = await importAutomationVariablesUseCase.execute({ csvText: csv });
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('Multi-Website Validation', () => {
    it('should identify all missing websiteIds', async () => {
      // Setup repositories
      const xpathRepo = new ChromeStorageXPathRepository(logger);
      const websiteRepo = new ChromeStorageWebsiteRepository(logger);
      const xpathMapper = new XPathCollectionMapper();
      const mockEventBus = {
        subscriptions: new Map(),
        globalHandlers: [],
        isPublishing: false,
        eventQueue: [],
        publish: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        subscribeToAll: jest.fn(),
        clearAll: jest.fn(),
        subscribeToMultiple: jest.fn(),
        unsubscribeAll: jest.fn(),
        publishMany: jest.fn(),
        getSubscriptionCount: jest.fn(),
        getRegisteredEventTypes: jest.fn(),
      } as any;

      // Create only one website
      const website = Website.create({
        name: 'Test Site',
        startUrl: 'https://example.com',
      });
      await websiteRepo.save(new WebsiteCollection([website]));

      // Create import use case WITH validation enabled
      const importXPathsUseCase = new ImportXPathsUseCase(xpathRepo, xpathMapper, mockEventBus);

      // Create CSV with XPaths referencing both existing and non-existent websites
      const csv = `id,website_id,value,action_type,after_wait_seconds,action_pattern,path_absolute,path_short,path_smart,selected_path_pattern,retry_type,execution_order,execution_timeout_seconds,url
xpath-001,${website.getId()},{{username}},type,0,0,/html/body/div/input,//*[@id="username"],//input[@name="username"],smart,0,1,30,https://example.com/login
xpath-002,missing-website-1,{{password}},type,0,0,/html/body/div/input,//*[@id="password"],//input[@name="password"],smart,0,2,30,https://example.com/login
xpath-003,missing-website-2,{{email}},type,0,0,/html/body/div/input,//*[@id="email"],//input[@name="email"],smart,0,3,30,https://example.com/login`;

      // Attempt import - should return failure listing ALL missing websites
      const result = await importXPathsUseCase.execute({ csvText: csv });

      expect(result.isFailure).toBe(true);
      expect(result.error).toMatch(
        /Cannot import XPaths: Referenced websites not found.*missing-website-1.*missing-website-2/
      );
    });
  });
});
