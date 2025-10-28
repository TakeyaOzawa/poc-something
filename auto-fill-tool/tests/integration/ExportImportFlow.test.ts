/**
 * Integration Test: Export-Import Flow
 * Tests the complete flow: Create data → Export → Clear → Import → Verify
 */

import { ChromeStorageWebsiteRepository } from '@infrastructure/repositories/ChromeStorageWebsiteRepository';
import { ChromeStorageXPathRepository } from '@infrastructure/repositories/ChromeStorageXPathRepository';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { ExportWebsitesUseCase } from '@usecases/websites/ExportWebsitesUseCase';
import { ImportWebsitesUseCase } from '@usecases/websites/ImportWebsitesUseCase';
import { ExportXPathsUseCase } from '@usecases/xpaths/ExportXPathsUseCase';
import { ImportXPathsUseCase } from '@usecases/xpaths/ImportXPathsUseCase';
import { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ImportAutomationVariablesUseCase } from '@usecases/automation-variables/ImportAutomationVariablesUseCase';
import { WebsiteCollectionMapper } from '@infrastructure/mappers/WebsiteCollectionMapper';
import { XPathCollectionMapper } from '@infrastructure/mappers/XPathCollectionMapper';
import { AutomationVariablesMapper } from '@infrastructure/mappers/AutomationVariablesMapper';
import { Website } from '@domain/entities/Website';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { RETRY_TYPE } from '@domain/constants/RetryType';
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

describe('Export-Import Flow Integration Test', () => {
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

  it('should export and import websites correctly', async () => {
    // Setup repositories
    const websiteRepo = new ChromeStorageWebsiteRepository(logger);
    const websiteMapper = new WebsiteCollectionMapper(logger);

    // 1. Create test data
    const website1 = Website.create({
      name: 'Test Site 1',
      startUrl: 'https://example.com',
      editable: true,
    });
    const website2 = Website.create({
      name: 'Test Site 2',
      editable: false,
    });

    const originalCollection = new WebsiteCollection([website1, website2]);
    await websiteRepo.save(originalCollection);

    // 2. Export
    const exportUseCase = new ExportWebsitesUseCase(websiteRepo, websiteMapper);
    const exportResult = await exportUseCase.execute();
    const csv = exportResult.csvText || '';

    expect(csv).toContain('id,name,start_url,updated_at,editable');

    // 3. Clear storage (simulating reinstall)
    await browser.storage.local.clear();

    // 4. Import
    const importUseCase = new ImportWebsitesUseCase(websiteRepo, websiteMapper);
    await importUseCase.execute({ csvText: csv });

    // 5. Verify - Focus on integration: data integrity through the flow
    const restoredCollectionResult = await websiteRepo.load();
    const restoredCollection = restoredCollectionResult.value!;
    const restoredWebsites = restoredCollection.getAll();

    expect(restoredWebsites).toHaveLength(2);
    // Detailed field checks are covered in unit tests (Mapper, UseCase)
    expect(restoredWebsites[0].getName()).toBe(website1.getName());
    expect(restoredWebsites[1].getName()).toBe(website2.getName());
  });

  it('should export and import XPaths with websiteId references', async () => {
    // Setup repositories
    const xpathRepo = new ChromeStorageXPathRepository(logger);
    const websiteRepo = new ChromeStorageWebsiteRepository(logger);
    const websiteMapper = new WebsiteCollectionMapper(logger);

    // 1. Create test website first
    const website = Website.create({
      name: 'Test Site',
      startUrl: 'https://example.com',
    });
    await websiteRepo.save(new WebsiteCollection([website]));

    // 2. Create XPath referencing the website
    const xpath = {
      websiteId: website.getId(),
      value: '{{username}}',
      actionType: ACTION_TYPE.TYPE,
      url: 'https://example.com/login',
      executionOrder: 1,
      selectedPathPattern: 'smart' as const,
      pathShort: '//*[@id="username"]',
      pathAbsolute: '/html/body/div/input',
      pathSmart: '//input[@name="username"]',
      actionPattern: 0,
      afterWaitSeconds: 0,
      executionTimeoutSeconds: 30,
      retryType: RETRY_TYPE.NO_RETRY,
    };

    const xpathCollection = new XPathCollection();
    const updatedCollection = xpathCollection.add(xpath);
    await xpathRepo.save(updatedCollection);

    // 3. Export both
    const exportWebsitesUseCase = new ExportWebsitesUseCase(websiteRepo, websiteMapper);
    const websiteExportResult = await exportWebsitesUseCase.execute();

    const exportXPathsUseCase = new ExportXPathsUseCase(xpathRepo, new XPathCollectionMapper());
    const xpathExportResult = await exportXPathsUseCase.execute();

    // 4. Clear storage
    await browser.storage.local.clear();

    // 5. Import in correct order: Websites first, then XPaths
    const importWebsitesUseCase = new ImportWebsitesUseCase(websiteRepo, websiteMapper);
    await importWebsitesUseCase.execute({ csvText: websiteExportResult.csvText || '' });

    const importXPathsUseCase = new ImportXPathsUseCase(xpathRepo, new XPathCollectionMapper());
    await importXPathsUseCase.execute({ csvText: xpathExportResult.csv });

    // 6. Verify - Focus on integration: websiteId reference integrity
    const xpathCollectionResult = await xpathRepo.load();
    const restoredXPathCollection = xpathCollectionResult.value!;
    const restoredXPaths = restoredXPathCollection.getAll();

    expect(restoredXPaths).toHaveLength(1);
    expect(restoredXPaths[0].websiteId).toBe(website.getId());
  });

  it('should export and import automation variables with websiteId references', async () => {
    // Setup repositories
    const websiteRepo = new ChromeStorageWebsiteRepository(logger);
    const automationVariablesRepo = new ChromeStorageAutomationVariablesRepository(logger);
    const websiteMapper = new WebsiteCollectionMapper(logger);
    const automationVariablesMapper = new AutomationVariablesMapper(logger);

    // 1. Create test website
    const website = Website.create({
      name: 'Test Site',
      startUrl: 'https://example.com',
    });
    await websiteRepo.save(new WebsiteCollection([website]));

    // 2. Create automation variables
    const automationVariables = AutomationVariables.create({
      websiteId: website.getId(),
      status: 'enabled',
      variables: { username: 'testuser', password: 'testpass' },
    });
    await automationVariablesRepo.save(automationVariables);

    // 3. Export both
    const exportWebsitesUseCase = new ExportWebsitesUseCase(websiteRepo, websiteMapper);
    const websiteExportResult = await exportWebsitesUseCase.execute();

    const exportAutomationVariablesUseCase = new ExportAutomationVariablesUseCase(
      automationVariablesRepo,
      automationVariablesMapper
    );
    const automationVariablesExportResult = await exportAutomationVariablesUseCase.execute();

    // 4. Clear storage
    await browser.storage.local.clear();

    // 5. Import in correct order: Websites first, then AutomationVariables
    const importWebsitesUseCase = new ImportWebsitesUseCase(websiteRepo, websiteMapper);
    await importWebsitesUseCase.execute({ csvText: websiteExportResult.csvText || '' });

    const importAutomationVariablesUseCase = new ImportAutomationVariablesUseCase(
      automationVariablesRepo,
      automationVariablesMapper
    );
    await importAutomationVariablesUseCase.execute({ csvText: automationVariablesExportResult.csvText });

    // 6. Verify - Focus on integration: websiteId reference integrity
    const variablesResult = await automationVariablesRepo.load(website.getId());
    const restoredVariables = variablesResult.value;

    expect(restoredVariables).not.toBeNull();
    expect(restoredVariables?.getWebsiteId()).toBe(website.getId());
  });
});
