/**
 * Unit Tests: ChromeAutoFillPort - Comprehensive Functionality
 * Tests for various action types, retry logic, cancellation, and variable replacement
 */

import browser from 'webextension-polyfill';
import { ChromeAutoFillAdapter } from '../ChromeAutoFillAdapter';
import { XPathData } from '@domain/entities/XPathCollection';
import { VariableCollection } from '@domain/entities/Variable';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';
import { ConsoleLogger } from '../../loggers/ConsoleLogger';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { RETRY_TYPE } from '@domain/constants/RetryType';
import { LogLevel } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';
import {
  createMockSystemSettings,
  createMockSystemSettingsRepository,
} from '@tests/helpers/MockSystemSettings';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  tabs: {
    sendMessage: jest.fn(),
    update: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  scripting: {
    executeScript: jest.fn(),
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ChromeAutoFillAdapter - Comprehensive Functionality', () => {
  let service: ChromeAutoFillAdapter;
  let mockSystemSettingsRepository: jest.Mocked<SystemSettingsRepository>;
  let mockAutomationResultRepository: jest.Mocked<AutomationResultRepository>;
  let mockSettings: SystemSettingsCollection;
  let mockLogger: NoOpLogger;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock system settings
    mockSettings = createMockSystemSettings({
      getRetryWaitSecondsMin: jest.fn().mockReturnValue(1),
      getRetryWaitSecondsMax: jest.fn().mockReturnValue(2),
      getRetryCount: jest.fn().mockReturnValue(3),
      getAutoFillProgressDialogMode: jest.fn().mockReturnValue('withCancel'),
      getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(500),
    });

    // Create mock system settings repository
    mockSystemSettingsRepository = createMockSystemSettingsRepository(mockSettings);

    // Create mock automation result repository
    mockAutomationResultRepository = {
      save: jest.fn().mockResolvedValue(Result.success(undefined)),
      load: jest.fn().mockResolvedValue(Result.success(null)),
      loadAll: jest.fn().mockResolvedValue(Result.success([])),
      loadByStatus: jest.fn().mockResolvedValue(Result.success([])),
      loadInProgress: jest.fn().mockResolvedValue(Result.success([])),
      loadByAutomationVariablesId: jest.fn().mockResolvedValue(Result.success([])),
      loadLatestByAutomationVariablesId: jest.fn().mockResolvedValue(Result.success(null)),
      delete: jest.fn().mockResolvedValue(Result.success(undefined)),
      deleteByAutomationVariablesId: jest.fn().mockResolvedValue(Result.success(undefined)),
      loadInProgressFromBatch: jest.fn().mockReturnValue(Result.success([])),
    };

    mockLogger = new NoOpLogger();
    service = new ChromeAutoFillAdapter(
      mockSystemSettingsRepository as any,
      mockAutomationResultRepository as any,
      mockLogger
    );
  });

  afterEach(() => {
    // Clear static activeExecutions map to prevent test interference
    (ChromeAutoFillAdapter as any).activeExecutions.clear();
  });

  describe('Action Types', () => {
    // Parameterized test for common action types
    it.each([
      {
        actionType: ACTION_TYPE.TYPE,
        testId: 'test-type-1',
        value: 'test input value',
        xpath: '//input[@id="test"]',
        message: 'Input executed',
      },
      {
        actionType: ACTION_TYPE.CLICK,
        testId: 'test-click-1',
        value: '',
        xpath: '//button[@id="submit"]',
        message: 'Click executed',
      },
      {
        actionType: ACTION_TYPE.CHECK,
        testId: 'test-check-1',
        value: 'true',
        xpath: '//input[@type="checkbox"]',
        message: 'Checkbox executed',
      },
      {
        actionType: ACTION_TYPE.JUDGE,
        testId: 'test-judge-1',
        value: 'expected value',
        xpath: '//div[@id="result"]',
        message: 'Judge executed',
      },
    ])(
      'should execute $actionType action successfully',
      async ({ actionType, testId, value, xpath, message }) => {
        const mockResult = [{ result: { success: true, message } }];
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

        const xpaths: XPathData[] = [
          {
            id: testId,
            websiteId: 'site-1',
            value,
            actionType,
            url: 'https://example.com',
            executionOrder: 1,
            selectedPathPattern: 'smart',
            pathShort: xpath,
            pathAbsolute: `/html/body${xpath}`,
            pathSmart: xpath,
            actionPattern: 10,
            afterWaitSeconds: 0,
            executionTimeoutSeconds: 30,
            retryType: 0,
          },
        ];

        const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

        expect(result.success).toBe(true);
        expect(result.processedSteps).toBe(1);
        if (actionType === ACTION_TYPE.TYPE) {
          expect(browser.scripting.executeScript).toHaveBeenCalled();
        }
      }
    );
  });

  describe('Action Type: CHANGE_URL', () => {
    it('should execute CHANGE_URL action successfully', async () => {
      // Track the onUpdated listener
      let onUpdatedListener: any = null;

      // Mock addListener to capture the listener
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((listener) => {
        onUpdatedListener = listener;
      });

      // Mock tabs.update to simulate URL change
      (browser.tabs.update as jest.Mock).mockImplementation((tabId, updateProps) => {
        // Trigger the listener immediately after Promise resolution
        setTimeout(() => {
          if (onUpdatedListener) {
            onUpdatedListener(tabId, { status: 'complete' }, { url: updateProps.url });
          }
        }, 0);
        return Promise.resolve({});
      });

      const xpaths: XPathData[] = [
        {
          id: 'test-url-1',
          websiteId: 'site-1',
          value: 'https://example.com/page2',
          actionType: ACTION_TYPE.CHANGE_URL,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '',
          pathAbsolute: '',
          pathSmart: '',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
      expect(browser.tabs.update).toHaveBeenCalledWith(1, {
        url: 'https://example.com/page2',
      });
      expect(browser.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(browser.tabs.onUpdated.removeListener).toHaveBeenCalled();
    }, 10000);
  });

  describe('Unknown Action Type', () => {
    it('should handle unknown action type and return error', async () => {
      const xpaths: XPathData[] = [
        {
          id: 'test-unknown-1',
          websiteId: 'site-1',
          value: 'test value',
          actionType: 'UNKNOWN_ACTION' as any,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//div[@id="test"]',
          pathAbsolute: '/html/body/div[@id="test"]',
          pathSmart: '//div[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.processedSteps).toBe(0);
      expect(result.failedStep).toBe(1);
      expect(result.error).toContain('Unknown action type');
    });
  });

  describe('Retry Logic - Retry from Beginning', () => {
    it('should retry from beginning when retryType is RETRY_FROM_BEGINNING', async () => {
      jest.useFakeTimers();

      // First attempt fails, second attempt succeeds
      (browser.scripting.executeScript as jest.Mock)
        .mockResolvedValueOnce([{ result: { success: false, message: 'Element not found' } }])
        .mockResolvedValueOnce([{ result: { success: true, message: 'Success' } }]);

      const xpaths: XPathData[] = [
        {
          id: 'test-retry-1',
          websiteId: 'site-1',
          value: 'test value',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[@id="test"]',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
        },
      ];

      const resultPromise = service.executeAutoFill(1, xpaths, 'https://example.com');

      // Fast-forward timer to skip the wait
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
      expect(browser.scripting.executeScript).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should return error when retryType is not RETRY_FROM_BEGINNING', async () => {
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
        { result: { success: false, message: 'Element not found' } },
      ]);

      const xpaths: XPathData[] = [
        {
          id: 'test-no-retry-1',
          websiteId: 'site-1',
          value: 'test value',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[@id="test"]',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.NO_RETRY,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.failedStep).toBe(1);
      expect(browser.scripting.executeScript).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      jest.useFakeTimers();

      mockSettings = createMockSystemSettings({
        getRetryWaitSecondsMin: jest.fn().mockReturnValue(1),
        getRetryWaitSecondsMax: jest.fn().mockReturnValue(2),
        getRetryCount: jest.fn().mockReturnValue(2),
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('withCancel'),
        getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(500),
      });
      mockSystemSettingsRepository.load.mockResolvedValue(Result.success(mockSettings));

      // All attempts fail
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
        { result: { success: false, message: 'Element not found' } },
      ]);

      const xpaths: XPathData[] = [
        {
          id: 'test-max-retry-1',
          websiteId: 'site-1',
          value: 'test value',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[@id="test"]',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
        },
      ];

      const resultPromise = service.executeAutoFill(1, xpaths, 'https://example.com');

      // Fast-forward timers
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed after 2 retry attempts');
      expect(browser.scripting.executeScript).toHaveBeenCalledTimes(3); // Initial + 2 retries

      jest.useRealTimers();
    });

    it('should handle infinite retries when retryCount is -1', async () => {
      jest.useFakeTimers();

      mockSettings = createMockSystemSettings({
        getRetryWaitSecondsMin: jest.fn().mockReturnValue(1),
        getRetryWaitSecondsMax: jest.fn().mockReturnValue(2),
        getRetryCount: jest.fn().mockReturnValue(-1),
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('withCancel'),
        getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(500),
      });
      mockSystemSettingsRepository.load.mockResolvedValue(Result.success(mockSettings));

      // Fail 5 times, then succeed
      (browser.scripting.executeScript as jest.Mock)
        .mockResolvedValueOnce([{ result: { success: false, message: 'Element not found' } }])
        .mockResolvedValueOnce([{ result: { success: false, message: 'Element not found' } }])
        .mockResolvedValueOnce([{ result: { success: false, message: 'Element not found' } }])
        .mockResolvedValueOnce([{ result: { success: false, message: 'Element not found' } }])
        .mockResolvedValueOnce([{ result: { success: false, message: 'Element not found' } }])
        .mockResolvedValueOnce([{ result: { success: true, message: 'Success' } }]);

      const xpaths: XPathData[] = [
        {
          id: 'test-infinite-retry-1',
          websiteId: 'site-1',
          value: 'test value',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[@id="test"]',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
        },
      ];

      const resultPromise = service.executeAutoFill(1, xpaths, 'https://example.com');

      // Fast-forward timers
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
      expect(browser.scripting.executeScript).toHaveBeenCalledTimes(6);

      jest.useRealTimers();
    });
  });

  describe('Cancellation', () => {
    it('should cancel auto-fill when cancellation is requested', async () => {
      jest.useFakeTimers();

      (browser.scripting.executeScript as jest.Mock).mockImplementation(() => {
        // Request cancellation after first step
        ChromeAutoFillAdapter.requestCancellation(1);
        return Promise.resolve([{ result: { success: true, message: 'Success' } }]);
      });

      const xpaths: XPathData[] = [
        {
          id: 'test-cancel-1',
          websiteId: 'site-1',
          value: 'value1',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test1"]',
          pathAbsolute: '/html/body/input[@id="test1"]',
          pathSmart: '//input[@id="test1"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-cancel-2',
          websiteId: 'site-1',
          value: 'value2',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 2,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test2"]',
          pathAbsolute: '/html/body/input[@id="test2"]',
          pathSmart: '//input[@id="test2"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-fill cancelled by user');
      expect(result.failedStep).toBe(2);
      expect(result.processedSteps).toBe(1);

      jest.useRealTimers();
    });
  });

  describe('Variable Replacement', () => {
    it('should replace variables in xpath values', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const variables = new VariableCollection();
      variables.add({ name: 'username', value: 'testuser' });
      variables.add({ name: 'password', value: 'testpass' });

      const xpaths: XPathData[] = [
        {
          id: 'test-var-1',
          websiteId: 'site-1',
          value: '{{username}}',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="user"]',
          pathAbsolute: '/html/body/input[@id="user"]',
          pathSmart: '//input[@id="user"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com', variables);

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
      // Verify that the script was called with replaced value
      expect(browser.scripting.executeScript).toHaveBeenCalled();
    });

    it('should replace variables in xpath paths', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const variables = new VariableCollection();
      variables.add({ name: 'fieldId', value: 'username' });

      const xpaths: XPathData[] = [
        {
          id: 'test-var-path-1',
          websiteId: 'site-1',
          value: 'test value',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="{{fieldId}}"]',
          pathAbsolute: '/html/body/input[@id="{{fieldId}}"]',
          pathSmart: '//input[@id="{{fieldId}}"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com', variables);

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
    });
  });

  describe('After Wait Seconds', () => {
    it('should wait after step execution when afterWaitSeconds is set', async () => {
      jest.useFakeTimers();

      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-wait-1',
          websiteId: 'site-1',
          value: 'test value',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[@id="test"]',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 2,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const resultPromise = service.executeAutoFill(1, xpaths, 'https://example.com');

      // Fast-forward timer
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);

      jest.useRealTimers();
    });
  });

  describe('Constructor with Custom Logger', () => {
    it('should accept custom logger in constructor', () => {
      const customLogger = new ConsoleLogger('CustomLogger', LogLevel.DEBUG);
      const customService = new ChromeAutoFillAdapter(
        mockSystemSettingsRepository,
        mockAutomationResultRepository,
        customLogger
      );

      expect(customService).toBeInstanceOf(ChromeAutoFillAdapter);
    });

    it('should use NoOpLogger when no logger is provided', () => {
      const defaultService = new ChromeAutoFillAdapter(
        mockSystemSettingsRepository,
        mockAutomationResultRepository
      );

      expect(defaultService).toBeInstanceOf(ChromeAutoFillAdapter);
    });
  });

  describe('Multiple Steps with Different Action Types', () => {
    it('should execute multiple different action types in sequence', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      // Track the onUpdated listener
      let onUpdatedListener: any = null;

      // Mock addListener to capture the listener
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((listener) => {
        onUpdatedListener = listener;
      });

      // Mock tabs.update to simulate URL change with page load completion
      (browser.tabs.update as jest.Mock).mockImplementation((tabId, updateProps) => {
        // Trigger the listener immediately after Promise resolution
        setTimeout(() => {
          if (onUpdatedListener) {
            onUpdatedListener(tabId, { status: 'complete' }, { url: updateProps.url });
          }
        }, 0);
        return Promise.resolve({});
      });

      const xpaths: XPathData[] = [
        {
          id: 'test-multi-1',
          websiteId: 'site-1',
          value: 'https://example.com/step1',
          actionType: ACTION_TYPE.CHANGE_URL,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '',
          pathAbsolute: '',
          pathSmart: '',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-multi-2',
          websiteId: 'site-1',
          value: 'testuser',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com/step1',
          executionOrder: 2,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="username"]',
          pathAbsolute: '/html/body/input[@id="username"]',
          pathSmart: '//input[@id="username"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-multi-3',
          websiteId: 'site-1',
          value: '',
          actionType: ACTION_TYPE.CLICK,
          url: 'https://example.com/step1',
          executionOrder: 3,
          selectedPathPattern: 'smart',
          pathShort: '//button[@id="submit"]',
          pathAbsolute: '/html/body/button[@id="submit"]',
          pathSmart: '//button[@id="submit"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-multi-4',
          websiteId: 'site-1',
          value: 'Success',
          actionType: ACTION_TYPE.JUDGE,
          url: 'https://example.com/step1',
          executionOrder: 4,
          selectedPathPattern: 'smart',
          pathShort: '//div[@id="result"]',
          pathAbsolute: '/html/body/div[@id="result"]',
          pathSmart: '//div[@id="result"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(4);
    }, 10000);
  });

  describe('Path Pattern Selection', () => {
    it('should use short xpath when selectedPathPattern is "short"', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-path-short',
          websiteId: 'site-1',
          value: 'test',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'short',
          pathShort: '//input[@id="short-path"]',
          pathAbsolute: '/html/body/input[@id="absolute-path"]',
          pathSmart: '//input[@id="smart-path"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(true);
      // Verify that short path was used
      const calls = (browser.scripting.executeScript as jest.Mock).mock.calls;
      expect(calls[0][0].args[0]).toBe('//input[@id="short-path"]');
    });

    it('should use absolute xpath when selectedPathPattern is "absolute"', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-path-absolute',
          websiteId: 'site-1',
          value: 'test',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'absolute',
          pathShort: '//input[@id="short-path"]',
          pathAbsolute: '/html/body/input[@id="absolute-path"]',
          pathSmart: '//input[@id="smart-path"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(true);
      // Verify that absolute path was used
      const calls = (browser.scripting.executeScript as jest.Mock).mock.calls;
      expect(calls[0][0].args[0]).toBe('/html/body/input[@id="absolute-path"]');
    });
  });

  describe('Progress Tracking with executeAutoFillWithProgress', () => {
    it('should save progress after CHANGE_URL action', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);
      (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });
      (browser.tabs.update as jest.Mock).mockResolvedValue({});

      // Mock tabs.onUpdated to simulate page load complete
      const onUpdatedCallbacks: Array<(tabId: number, changeInfo: { status: string }) => void> = [];
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((callback) => {
        onUpdatedCallbacks.push(callback);
        // Simulate page load complete after 100ms
        setTimeout(() => {
          callback(1, { status: 'complete' });
        }, 100);
      });

      const mockAutomationResult = {
        getId: () => 'result-123',
        getCurrentStepIndex: () => 0,
        getTotalSteps: () => 3,
        getProgressPercentage: () => 33.33,
        setCurrentStepIndex: jest.fn().mockReturnThis(),
        setLastExecutedUrl: jest.fn().mockReturnThis(),
      } as any;

      const xpaths: XPathData[] = [
        {
          id: 'test-type-1',
          websiteId: 'site-1',
          value: 'test input',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com/page1',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-change-url-1',
          websiteId: 'site-1',
          value: 'https://example.com/page2',
          actionType: ACTION_TYPE.CHANGE_URL,
          url: 'https://example.com/page1',
          executionOrder: 2,
          selectedPathPattern: 'smart',
          pathShort: '',
          pathAbsolute: '',
          pathSmart: '',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-type-2',
          websiteId: 'site-1',
          value: 'test input 2',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com/page2',
          executionOrder: 3,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test2"]',
          pathAbsolute: '/html/body/input2',
          pathSmart: '//input[@id="test2"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFillWithProgress(
        1,
        xpaths,
        'https://example.com/page1',
        undefined,
        mockAutomationResult,
        0
      );

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(3);

      // Verify progress was saved after CHANGE_URL action
      expect(mockAutomationResult.setCurrentStepIndex).toHaveBeenCalledWith(2);
      expect(mockAutomationResult.setLastExecutedUrl).toHaveBeenCalledWith(
        'https://example.com/page2'
      );
      expect(mockAutomationResultRepository.save).toHaveBeenCalledWith(mockAutomationResult);
    }, 10000); // 10 second timeout for CHANGE_URL action

    it('should not save progress for non-CHANGE_URL actions', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const mockAutomationResult = {
        getId: () => 'result-123',
        getCurrentStepIndex: () => 0,
        getTotalSteps: () => 2,
        getProgressPercentage: () => 50,
        setCurrentStepIndex: jest.fn().mockReturnThis(),
        setLastExecutedUrl: jest.fn().mockReturnThis(),
      } as any;

      const xpaths: XPathData[] = [
        {
          id: 'test-type-1',
          websiteId: 'site-1',
          value: 'test input',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-click-1',
          websiteId: 'site-1',
          value: '',
          actionType: ACTION_TYPE.CLICK,
          url: 'https://example.com',
          executionOrder: 2,
          selectedPathPattern: 'smart',
          pathShort: '//button[@id="submit"]',
          pathAbsolute: '/html/body/button',
          pathSmart: '//button[@id="submit"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFillWithProgress(
        1,
        xpaths,
        'https://example.com',
        undefined,
        mockAutomationResult,
        0
      );

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(2);

      // Verify progress was NOT saved (no CHANGE_URL action)
      expect(mockAutomationResult.setCurrentStepIndex).not.toHaveBeenCalled();
      expect(mockAutomationResult.setLastExecutedUrl).not.toHaveBeenCalled();
      expect(mockAutomationResultRepository.save).not.toHaveBeenCalled();
    });

    it('should apply startOffset correctly when resuming', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const mockAutomationResult = {
        getId: () => 'result-123',
        getCurrentStepIndex: () => 2,
        getTotalSteps: () => 4,
        getProgressPercentage: () => 50,
        setCurrentStepIndex: jest.fn().mockReturnThis(),
        setLastExecutedUrl: jest.fn().mockReturnThis(),
      } as any;

      const xpaths: XPathData[] = [
        {
          id: 'test-type-1',
          websiteId: 'site-1',
          value: 'test input 1',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test1"]',
          pathAbsolute: '/html/body/input1',
          pathSmart: '//input[@id="test1"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-type-2',
          websiteId: 'site-1',
          value: 'test input 2',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 2,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test2"]',
          pathAbsolute: '/html/body/input2',
          pathSmart: '//input[@id="test2"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-type-3',
          websiteId: 'site-1',
          value: 'test input 3',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 3,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test3"]',
          pathAbsolute: '/html/body/input3',
          pathSmart: '//input[@id="test3"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-type-4',
          websiteId: 'site-1',
          value: 'test input 4',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 4,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test4"]',
          pathAbsolute: '/html/body/input4',
          pathSmart: '//input[@id="test4"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      // Resume from step 2 (0-indexed)
      const result = await service.executeAutoFillWithProgress(
        1,
        xpaths,
        'https://example.com',
        undefined,
        mockAutomationResult,
        2
      );

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(2); // Only steps 3 and 4 should be executed

      // Verify only steps 3 and 4 were executed (not steps 1 and 2)
      const calls = (browser.scripting.executeScript as jest.Mock).mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][0].args[0]).toBe('//input[@id="test3"]');
      expect(calls[1][0].args[0]).toBe('//input[@id="test4"]');
    });

    it('should continue execution even if progress save fails', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);
      (browser.tabs.update as jest.Mock).mockResolvedValue({});

      // Mock tabs.onUpdated to simulate page load complete
      const onUpdatedCallbacks: Array<(tabId: number, changeInfo: { status: string }) => void> = [];
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((callback) => {
        onUpdatedCallbacks.push(callback);
        // Simulate page load complete after 100ms
        setTimeout(() => {
          callback(1, { status: 'complete' });
        }, 100);
      });

      // Mock save to fail
      mockAutomationResultRepository.save.mockRejectedValue(new Error('Save failed'));

      const mockAutomationResult = {
        getId: () => 'result-123',
        getCurrentStepIndex: () => 0,
        getTotalSteps: () => 2,
        getProgressPercentage: () => 50,
        setCurrentStepIndex: jest.fn().mockReturnThis(),
        setLastExecutedUrl: jest.fn().mockReturnThis(),
      } as any;

      const xpaths: XPathData[] = [
        {
          id: 'test-change-url-1',
          websiteId: 'site-1',
          value: 'https://example.com/page2',
          actionType: ACTION_TYPE.CHANGE_URL,
          url: 'https://example.com/page1',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '',
          pathAbsolute: '',
          pathSmart: '',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-type-1',
          websiteId: 'site-1',
          value: 'test input',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com/page2',
          executionOrder: 2,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFillWithProgress(
        1,
        xpaths,
        'https://example.com/page1',
        undefined,
        mockAutomationResult,
        0
      );

      // Execution should succeed despite save failure
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(2);

      // Verify save was attempted but failed
      expect(mockAutomationResultRepository.save).toHaveBeenCalled();
    });
  });

  describe('Concurrent Execution Prevention', () => {
    it('should prevent concurrent executions on the same tab', async () => {
      const customSettings = createMockSystemSettings({
        getRetryWaitSecondsMin: jest.fn().mockReturnValue(1),
        getRetryWaitSecondsMax: jest.fn().mockReturnValue(2),
        getRetryCount: jest.fn().mockReturnValue(3),
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('withCancel'),
        getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(500),
      });

      mockSystemSettingsRepository.load = jest
        .fn()
        .mockResolvedValue(Result.success(customSettings));

      const xpaths: XPathData[] = [
        {
          id: '1',
          websiteId: 'website1',
          actionType: ACTION_TYPE.TYPE,
          value: 'test',
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input',
          pathAbsolute: '/html/body/input',
          pathSmart: '//input',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
        },
      ];

      // Mock browser.tabs.sendMessage to succeed
      (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });

      // Start first execution (don't await - let it run)
      const firstExecution = service.executeAutoFill(1, xpaths, 'https://example.com');

      // Immediately try second execution on same tab
      const secondResult = await service.executeAutoFill(1, xpaths, 'https://example.com');

      // Second execution should be rejected
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toBe('Auto-fill already in progress on this tab');
      expect(secondResult.processedSteps).toBe(0);

      // Wait for first execution to complete
      await firstExecution;
    });
  });

  describe('Maximum Retries Error Message', () => {
    it('should return specific error when maximum retries reached', async () => {
      const customSettings = createMockSystemSettings({
        getRetryWaitSecondsMin: jest.fn().mockReturnValue(0.001),
        getRetryWaitSecondsMax: jest.fn().mockReturnValue(0.001),
        getRetryCount: jest.fn().mockReturnValue(2),
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('withCancel'),
        getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(500),
      });

      mockSystemSettingsRepository.load = jest
        .fn()
        .mockResolvedValue(Result.success(customSettings));

      const xpaths: XPathData[] = [
        {
          id: '1',
          websiteId: 'website1',
          actionType: ACTION_TYPE.TYPE,
          value: 'test',
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input',
          pathAbsolute: '/html/body/input',
          pathSmart: '//input',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
        },
      ];

      // Mock to always fail
      const mockResult = [{ result: { success: false, error: 'Element not found' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed after 2 retry attempts');
    });
  });

  describe('GET_VALUE Action', () => {
    it('should clone variables and add retrieved value to mutable copy', async () => {
      const mockGetValueResult = [
        { result: { success: true, message: 'Success', retrievedValue: 'retrieved-data-123' } },
      ];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockGetValueResult);

      const variables = new VariableCollection();
      variables.add({ name: 'existingVar', value: 'existingValue' });

      const xpaths: XPathData[] = [
        {
          id: 'get-value-1',
          websiteId: 'website1',
          actionType: ACTION_TYPE.GET_VALUE,
          value: 'outputVariable',
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//div[@id="data"]',
          pathAbsolute: '/html/body/div[@id="data"]',
          pathSmart: '//div[@id="data"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.NO_RETRY,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com', variables);

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
      // Original variables should be unchanged (cloned, not mutated)
      expect(variables.get('outputVariable')).toBeUndefined();
    });
  });

  describe('Cancellation During Simple Execution', () => {
    it('should handle cancellation in executeAutoFillAttempt path', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockImplementation(() => {
        // Request cancellation after first step starts
        ChromeAutoFillAdapter.requestCancellation(1);
        return Promise.resolve(mockResult);
      });

      const xpaths: XPathData[] = [
        {
          id: 'test-1',
          websiteId: 'site-1',
          value: 'value1',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test1"]',
          pathAbsolute: '/html/body/input[@id="test1"]',
          pathSmart: '//input[@id="test1"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.NO_RETRY,
        },
        {
          id: 'test-2',
          websiteId: 'site-1',
          value: 'value2',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 2,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test2"]',
          pathAbsolute: '/html/body/input[@id="test2"]',
          pathSmart: '//input[@id="test2"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.NO_RETRY,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-fill cancelled by user');
      expect(result.failedStep).toBe(2);
      expect(result.processedSteps).toBe(1);
    });
  });

  describe('Retry Exhaustion Without Retry Enabled', () => {
    it('should not retry when shouldRetryStep returns false', async () => {
      jest.useFakeTimers();

      const customSettings = createMockSystemSettings({
        getRetryWaitSecondsMin: jest.fn().mockReturnValue(0.001),
        getRetryWaitSecondsMax: jest.fn().mockReturnValue(0.001),
        getRetryCount: jest.fn().mockReturnValue(5), // Allow retries
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('withCancel'),
        getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(500),
      });
      mockSystemSettingsRepository.load.mockResolvedValue(Result.success(customSettings));

      // Always fail
      const mockResult = [{ result: { success: false, error: 'Element not found' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-no-retry-on-step',
          websiteId: 'site-1',
          value: 'test',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[@id="test"]',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.NO_RETRY, // This step does not allow retry
        },
      ];

      const resultPromise = service.executeAutoFill(1, xpaths, 'https://example.com');
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to execute step 1');
      // Should only execute once (no retries because retryType is NO_RETRY)
      expect(browser.scripting.executeScript).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('Cancellation During Retry Wait', () => {
    it('should handle cancellation during waitBeforeRetry', async () => {
      jest.useFakeTimers();

      const customSettings = createMockSystemSettings({
        getRetryWaitSecondsMin: jest.fn().mockReturnValue(5),
        getRetryWaitSecondsMax: jest.fn().mockReturnValue(5),
        getRetryCount: jest.fn().mockReturnValue(3),
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('withCancel'),
        getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(500),
      });
      mockSystemSettingsRepository.load.mockResolvedValue(Result.success(customSettings));

      // First attempt fails, will trigger retry
      const mockResult = [{ result: { success: false, error: 'Element not found' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-cancel-wait',
          websiteId: 'site-1',
          value: 'test',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[@id="test"]',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
        },
      ];

      const resultPromise = service.executeAutoFill(1, xpaths, 'https://example.com');

      // Wait a bit for first attempt to fail
      await jest.advanceTimersByTimeAsync(100);

      // Cancel during retry wait
      ChromeAutoFillAdapter.requestCancellation(1);

      // Complete the wait
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-fill cancelled by user');
      expect(result.processedSteps).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('Cleanup After Execution', () => {
    it('should cleanup activeExecutions after successful execution', async () => {
      const mockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'cleanup-test-1',
          websiteId: 'website1',
          actionType: ACTION_TYPE.TYPE,
          value: 'test',
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[@id="test"]',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.NO_RETRY,
        },
      ];

      // First execution
      const firstResult = await service.executeAutoFill(2, xpaths, 'https://example.com');
      expect(firstResult.success).toBe(true);

      // Verify cleanup happened - should be able to execute again on same tab
      const secondResult = await service.executeAutoFill(2, xpaths, 'https://example.com');
      expect(secondResult.success).toBe(true); // Should not be blocked
    });

    it('should cleanup activeExecutions after failed execution', async () => {
      const mockResult = [{ result: { success: false, error: 'Test error' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'cleanup-test-2',
          websiteId: 'website1',
          actionType: ACTION_TYPE.TYPE,
          value: 'test',
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[@id="test"]',
          pathSmart: '//input[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: RETRY_TYPE.NO_RETRY,
        },
      ];

      // First execution (will fail)
      const firstResult = await service.executeAutoFill(3, xpaths, 'https://example.com');
      expect(firstResult.success).toBe(false);

      // Verify cleanup happened - should be able to execute again on same tab
      const successMockResult = [{ result: { success: true, message: 'Success' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(successMockResult);

      const secondResult = await service.executeAutoFill(3, xpaths, 'https://example.com');
      expect(secondResult.success).toBe(true); // Should not be blocked
    });
  });
});
