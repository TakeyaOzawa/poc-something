/**
 * Test: Auto-Fill Handler
 */

import browser from 'webextension-polyfill';
import { AutoFillHandler } from '../AutoFillHandler';
import { Logger } from '@domain/types/logger.types';
import { MessageDispatcher } from '@infrastructure/messaging/MessageDispatcher';
import { WebsiteData } from '@domain/entities/Website';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { IdGenerator } from '@domain/types/id-generator.types';
// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};
import { URLMatchingService } from '@domain/services/URLMatchingService';
import { Result } from '@domain/values/result.value';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
  },
}));

// Mock MessageDispatcher
jest.mock('@infrastructure/messaging/MessageDispatcher');

// Mock URLMatchingService
jest.mock('@domain/services/URLMatchingService');

// Mock AutoFillOverlay
jest.mock('../AutoFillOverlay', () => ({
  AutoFillOverlay: jest.fn().mockImplementation(() => ({
    show: jest.fn(),
    hide: jest.fn(),
    updateProgress: jest.fn(),
  })),
}));

// Mock ChromeStorageSystemSettingsRepository
jest.mock('@infrastructure/repositories/ChromeStorageSystemSettingsRepository', () => ({
  ChromeStorageSystemSettingsRepository: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: {
        getRetryWaitSecondsMin: jest.fn().mockReturnValue(30),
        getRetryWaitSecondsMax: jest.fn().mockReturnValue(60),
        getRetryCount: jest.fn().mockReturnValue(3),
        getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(500),
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('withCancel'),
        getLogLevel: jest.fn().mockReturnValue(1),
        getEnableTabRecording: jest.fn().mockReturnValue(true),
        getRecordingBitrate: jest.fn().mockReturnValue(2500000),
        getRecordingRetentionDays: jest.fn().mockReturnValue(10),
      },
      error: null,
    }),
  })),
}));

// Mock ChromeStorageAutomationVariablesRepository
jest.mock('@infrastructure/repositories/ChromeStorageAutomationVariablesRepository', () => {
  const { Result } = jest.requireActual('@domain/values/result.value');
  return {
    ChromeStorageAutomationVariablesRepository: jest.fn().mockImplementation(() => ({
      loadAll: jest.fn().mockResolvedValue(Result.success([])),
      load: jest.fn().mockResolvedValue(Result.success(null)),
      save: jest.fn().mockResolvedValue(Result.success(undefined)),
      loadFromBatch: jest.fn().mockReturnValue(Result.success(null)),
      delete: jest.fn().mockResolvedValue(Result.success(undefined)),
      exists: jest.fn().mockResolvedValue(Result.success(false)),
    })),
  };
});

// Mock ChromeStorageAutomationResultRepository
jest.mock('@infrastructure/repositories/ChromeStorageAutomationResultRepository', () => {
  const { Result } = jest.requireActual('@domain/values/result.value');
  return {
    ChromeStorageAutomationResultRepository: jest.fn().mockImplementation(() => ({
      loadAll: jest.fn().mockResolvedValue(Result.success([])),
      load: jest.fn().mockResolvedValue(Result.success(null)),
      save: jest.fn().mockResolvedValue(Result.success(undefined)),
      loadByAutomationVariablesId: jest.fn().mockResolvedValue(Result.success([])),
      loadLatestByAutomationVariablesId: jest.fn().mockResolvedValue(Result.success(null)),
      delete: jest.fn().mockResolvedValue(Result.success(undefined)),
      deleteByAutomationVariablesId: jest.fn().mockResolvedValue(Result.success(undefined)),
      loadInProgressFromBatch: jest.fn().mockReturnValue(Result.success([])),
      loadByStatus: jest.fn().mockResolvedValue(Result.success([])),
      loadInProgress: jest.fn().mockResolvedValue(Result.success([])),
    })),
  };
});

describe('AutoFillHandler', () => {
  let handler: AutoFillHandler;
  let mockLogger: jest.Mocked<Logger>;
  let mockMessageDispatcher: jest.Mocked<MessageDispatcher>;
  let mockURLMatchingService: jest.Mocked<URLMatchingService>;

  const mockWebsites: WebsiteData[] = [
    {
      id: 'website_1',
      name: 'Test Website 1',
      updatedAt: '2025-01-02T00:00:00Z',
      editable: true,
      startUrl: 'https://example.com/login',
    },
    {
      id: 'website_2',
      name: 'Test Website 2',
      updatedAt: '2025-01-01T00:00:00Z',
      editable: true,
      startUrl: 'https://test.com',
    },
    {
      id: 'website_3',
      name: 'Disabled Website',
      updatedAt: '2025-01-03T00:00:00Z',
      editable: true,
      startUrl: 'https://disabled.com',
    },
  ];

  const mockXPathCSV = `id,websiteId,value,actionType,afterWaitSeconds,dispatchEventPattern,pathAbsolute,pathShort,pathSmart,selectedPathPattern,retryType,executionOrder,executionTimeoutSeconds,url
xpath_1,website_1,{{username}},input,0,1,/html/body/input[1],//input[1],#username,smart,0,1,5,https://example.com/login
xpath_2,website_1,,click,1,0,/html/body/button[1],//button[1],#submit,smart,0,2,5,https://example.com/login
xpath_3,website_2,{{username}},input,0,1,/html/body/input[1],//input[1],#username,smart,0,1,5,https://test.com`;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset window.location
    delete (window as any).location;
    (window as any).location = { href: 'https://example.com/login' };

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    mockMessageDispatcher = {
      executeAutoFill: jest.fn(),
    } as any;

    mockURLMatchingService = {
      matches: jest.fn(),
      validatePattern: jest.fn(),
    } as any;

    (MessageDispatcher as jest.MockedClass<typeof MessageDispatcher>).mockImplementation(() => {
      return mockMessageDispatcher;
    });

    (URLMatchingService as jest.MockedClass<typeof URLMatchingService>).mockImplementation(() => {
      return mockURLMatchingService;
    });

    handler = new AutoFillHandler(mockLogger);
  });

  describe('handlePageLoad', () => {
    it('should execute auto-fill when URL matches enabled website', async () => {
      // Mock AutomationVariables for website_1 with enabled status
      const mockAv1 = AutomationVariables.create(
        {
          websiteId: 'website_1',
          status: 'enabled',
          variables: { username: 'user1' },
        },
        mockIdGenerator
      );

      const mockRepo = (handler as any).automationVariablesRepository;
      mockRepo.loadAll = jest.fn().mockResolvedValue(Result.success([mockAv1]));

      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          websiteConfigs: JSON.stringify(mockWebsites),
        },
        mockIdGenerator
      );
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          xpathCollectionCSV: mockXPathCSV,
        },
        mockIdGenerator
      );
      mockURLMatchingService.matches.mockReturnValue(true);

      mockMessageDispatcher.executeAutoFill.mockResolvedValue({
        success: true,
        data: { processedSteps: 2 },
      });

      await handler.handlePageLoad();

      expect(mockURLMatchingService.matches).toHaveBeenCalledWith(
        'https://example.com/login',
        'https://example.com/login'
      );
      expect(mockMessageDispatcher.executeAutoFill).toHaveBeenCalledWith({
        tabId: null,
        websiteId: 'website_1',
        websiteVariables: { username: 'user1' },
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Auto-fill completed successfully', {
        processedSteps: 2,
      });
    });

    it('should change status from once to disabled before execution', async () => {
      (window as any).location.href = 'https://test.com';

      // Mock AutomationVariables for website_2 with once status
      const mockAv2 = AutomationVariables.create(
        {
          websiteId: 'website_2',
          status: 'once',
          variables: { username: 'user2' },
        },
        mockIdGenerator
      );

      const mockRepo = (handler as any).automationVariablesRepository;
      mockRepo.loadAll = jest.fn().mockResolvedValue(Result.success([mockAv2]));
      mockRepo.save = jest.fn().mockResolvedValue(Result.success(undefined));

      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          websiteConfigs: JSON.stringify(mockWebsites),
        },
        mockIdGenerator
      );
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          xpathCollectionCSV: mockXPathCSV,
        },
        mockIdGenerator
      );
      mockURLMatchingService.matches.mockImplementation((currentUrl: string, startUrl: string) => {
        return currentUrl === startUrl;
      });

      mockMessageDispatcher.executeAutoFill.mockResolvedValue({
        success: true,
      });

      await handler.handlePageLoad();

      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Status is "once", changing to "disabled" before execution'
      );
    });

    it('should not execute when no URL matches', async () => {
      // Mock enabled website
      const mockAv1 = AutomationVariables.create(
        {
          websiteId: 'website_1',
          status: 'enabled',
          variables: { username: 'user1' },
        },
        mockIdGenerator
      );

      const mockRepo = (handler as any).automationVariablesRepository;
      mockRepo.loadAll = jest.fn().mockResolvedValue(Result.success([mockAv1]));

      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          websiteConfigs: JSON.stringify(mockWebsites),
        },
        mockIdGenerator
      );
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          xpathCollectionCSV: mockXPathCSV,
        },
        mockIdGenerator
      );
      mockURLMatchingService.matches.mockReturnValue(false);

      await handler.handlePageLoad();

      expect(mockMessageDispatcher.executeAutoFill).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('No matching website found', {
        currentURL: 'https://example.com/login',
      });
    });

    it('should return early when websiteConfigs not found', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      await handler.handlePageLoad();

      expect(mockLogger.debug).toHaveBeenCalledWith('No website configs found');
      expect(mockMessageDispatcher.executeAutoFill).not.toHaveBeenCalled();
    });

    it('should return early when no enabled websites found', async () => {
      const disabledWebsites = [mockWebsites[0]];

      // Mock disabled AutomationVariables
      const mockRepo = (handler as any).automationVariablesRepository;
      mockRepo.loadAll = jest.fn().mockResolvedValue(Result.success([]));

      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({
        websiteConfigs: JSON.stringify(disabledWebsites),
      });

      await handler.handlePageLoad();

      expect(mockLogger.debug).toHaveBeenCalledWith('All automation variables', {
        allAutomationVariables: [],
      });
      expect(mockMessageDispatcher.executeAutoFill).not.toHaveBeenCalled();
    });

    it('should skip websites without XPaths', async () => {
      const websitesWithoutXPaths = [mockWebsites[0]];

      // Mock enabled website
      const mockAv1 = AutomationVariables.create(
        {
          websiteId: 'website_1',
          status: 'enabled',
          variables: {},
        },
        mockIdGenerator
      );

      const mockRepo = (handler as any).automationVariablesRepository;
      mockRepo.loadAll = jest.fn().mockResolvedValue(Result.success([mockAv1]));

      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          websiteConfigs: JSON.stringify(websitesWithoutXPaths),
        },
        mockIdGenerator
      );
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          xpathCollectionCSV:
            'id,websiteId,value,actionType,afterWaitSeconds,dispatchEventPattern,pathAbsolute,pathShort,pathSmart,selectedPathPattern,retryType,executionOrder,executionTimeoutSeconds,url\n',
        },
        mockIdGenerator
      );

      await handler.handlePageLoad();

      expect(mockLogger.debug).toHaveBeenCalledWith('Skipping website (no XPaths configured)', {
        name: 'Test Website 1',
      });
      expect(mockMessageDispatcher.executeAutoFill).not.toHaveBeenCalled();
    });

    it('should skip websites when first step has no URL', async () => {
      const websitesWithNoUrl = [mockWebsites[0]];

      // Mock enabled website
      const mockAv1 = AutomationVariables.create(
        {
          websiteId: 'website_1',
          status: 'enabled',
          variables: {},
        },
        mockIdGenerator
      );

      const mockRepo = (handler as any).automationVariablesRepository;
      mockRepo.loadAll = jest.fn().mockResolvedValue(Result.success([mockAv1]));

      const csvWithNoUrl = `id,websiteId,value,actionType,afterWaitSeconds,dispatchEventPattern,pathAbsolute,pathShort,pathSmart,selectedPathPattern,retryType,executionOrder,executionTimeoutSeconds,url
xpath_1,website_1,{{username}},input,0,1,/html/body/input[1],//input[1],#username,smart,0,1,5,`;

      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          websiteConfigs: JSON.stringify(websitesWithNoUrl),
        },
        mockIdGenerator
      );
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          xpathCollectionCSV: csvWithNoUrl,
        },
        mockIdGenerator
      );

      await handler.handlePageLoad();

      expect(mockLogger.debug).toHaveBeenCalledWith('Skipping website (first step has no URL)', {
        name: 'Test Website 1',
      });
      expect(mockMessageDispatcher.executeAutoFill).not.toHaveBeenCalled();
    });

    it('should return early when XPath collection not found', async () => {
      // Mock enabled website
      const mockAv1 = AutomationVariables.create(
        {
          websiteId: 'website_1',
          status: 'enabled',
          variables: {},
        },
        mockIdGenerator
      );

      const mockRepo = (handler as any).automationVariablesRepository;
      mockRepo.loadAll = jest.fn().mockResolvedValue(Result.success([mockAv1]));

      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          websiteConfigs: JSON.stringify(mockWebsites),
        },
        mockIdGenerator
      );
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({}, mockIdGenerator);

      await handler.handlePageLoad();

      expect(mockLogger.debug).toHaveBeenCalledWith('No XPath collection found');
      expect(mockMessageDispatcher.executeAutoFill).not.toHaveBeenCalled();
    });

    it('should return early when XPath collection is empty', async () => {
      // Mock enabled website
      const mockAv1 = AutomationVariables.create(
        {
          websiteId: 'website_1',
          status: 'enabled',
          variables: {},
        },
        mockIdGenerator
      );

      const mockRepo = (handler as any).automationVariablesRepository;
      mockRepo.loadAll = jest.fn().mockResolvedValue(Result.success([mockAv1]));

      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          websiteConfigs: JSON.stringify(mockWebsites),
        },
        mockIdGenerator
      );
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          xpathCollectionCSV: 'header',
        },
        mockIdGenerator
      );

      await handler.handlePageLoad();

      expect(mockLogger.debug).toHaveBeenCalledWith('XPath collection is empty');
      expect(mockMessageDispatcher.executeAutoFill).not.toHaveBeenCalled();
    });

    it('should log error when auto-fill fails', async () => {
      // Mock enabled website
      const mockAv1 = AutomationVariables.create(
        {
          websiteId: 'website_1',
          status: 'enabled',
          variables: { username: 'user1' },
        },
        mockIdGenerator
      );

      const mockRepo = (handler as any).automationVariablesRepository;
      mockRepo.loadAll = jest.fn().mockResolvedValue(Result.success([mockAv1]));

      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          websiteConfigs: JSON.stringify(mockWebsites),
        },
        mockIdGenerator
      );
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce(
        {
          xpathCollectionCSV: mockXPathCSV,
        },
        mockIdGenerator
      );
      mockURLMatchingService.matches.mockReturnValue(true);

      mockMessageDispatcher.executeAutoFill.mockResolvedValue({
        success: false,
        data: { error: 'Execution failed' },
      });

      await handler.handlePageLoad();

      expect(mockLogger.error).toHaveBeenCalledWith('Auto-fill failed', 'Execution failed');
    });

    it('should handle errors during page load', async () => {
      const error = new Error('Storage error');
      (browser.storage.local.get as jest.Mock).mockRejectedValue(error);

      await handler.handlePageLoad();

      expect(mockLogger.error).toHaveBeenCalledWith('Error during auto-fill on load', error);
    });

    it('should sort enabled websites by automationVariables.updatedAt (newest first)', async () => {
      (window as any).location.href = 'https://example.com/login';

      const websites = [
        {
          ...mockWebsites[1],
          id: 'website_2',
          startUrl: 'https://example.com/login',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          ...mockWebsites[0],
          id: 'website_1',
          startUrl: 'https://example.com/login',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Mock enabled websites with different automationVariables.updatedAt
      // Note: website_2 has newer automationVariables.updatedAt even though website_1 has newer website.updatedAt
      const mockAv1 = new AutomationVariables({
        id: 'av1',
        websiteId: 'website_1',
        status: 'enabled',
        variables: { username: 'user1' },
        updatedAt: '2025-01-01T00:00:00Z', // older automationVariables
      });
      const mockAv2 = new AutomationVariables({
        id: 'av2',
        websiteId: 'website_2',
        status: 'enabled',
        variables: { username: 'user2' },
        updatedAt: '2025-01-02T00:00:00Z', // newer automationVariables
      });

      const mockRepo = (handler as any).automationVariablesRepository;
      mockRepo.loadAll = jest.fn().mockResolvedValue(Result.success([mockAv1, mockAv2]));

      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({
        websiteConfigs: JSON.stringify(websites),
      });
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({
        xpathCollectionCSV: mockXPathCSV,
      });
      mockURLMatchingService.matches.mockReturnValue(true);

      mockMessageDispatcher.executeAutoFill.mockResolvedValue({
        success: true,
      });

      await handler.handlePageLoad();

      // Should match website_2 (has newer automationVariables.updatedAt) first
      expect(mockMessageDispatcher.executeAutoFill).toHaveBeenCalledWith({
        tabId: null,
        websiteId: 'website_2',
        websiteVariables: { username: 'user2' },
      });
    });
  });
});
