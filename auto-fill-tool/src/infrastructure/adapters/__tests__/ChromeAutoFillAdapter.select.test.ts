/**
 * Unit Tests: ChromeAutoFillPort - Select Functionality
 * Tests for select element auto-fill operations
 */

import browser from 'webextension-polyfill';
import { ChromeAutoFillAdapter } from '../ChromeAutoFillAdapter';
import { XPathData } from '@domain/entities/XPathCollection';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { ACTION_TYPE } from '@domain/constants/ActionType';
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

describe('ChromeAutoFillAdapter - Select Functionality', () => {
  let service: ChromeAutoFillAdapter;
  let mockSystemSettingsRepository: jest.Mocked<SystemSettingsRepository>;
  let mockAutomationResultRepository: jest.Mocked<AutomationResultRepository>;
  let mockSettings: SystemSettingsCollection;

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

    service = new ChromeAutoFillAdapter(
      mockSystemSettingsRepository as any,
      mockAutomationResultRepository as any,
      new NoOpLogger()
    );
  });

  describe('executeSelectStep - select_value', () => {
    it('should execute select_value on native select element (single selection)', async () => {
      const mockResult = [{ result: { success: true, message: 'Select executed' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-1',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test"]',
          pathAbsolute: '/html/body/select[@id="test"]',
          pathSmart: '//select[@id="test"]',
          actionPattern: 10, // Native single selection
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
      expect(browser.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        func: expect.any(Function),
        args: ['//select[@id="test"]', 'option1', ACTION_TYPE.SELECT_VALUE, 10, 1],
      });
    });

    it('should execute select_value on native select element (multiple selection)', async () => {
      const mockResult = [{ result: { success: true, message: 'Select executed' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-2',
          websiteId: 'site-1',
          value: 'option2',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test-multi"]',
          pathAbsolute: '/html/body/select[@id="test-multi"]',
          pathSmart: '//select[@id="test-multi"]',
          actionPattern: 110, // Native multiple selection
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
      expect(browser.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        func: expect.any(Function),
        args: ['//select[@id="test-multi"]', 'option2', ACTION_TYPE.SELECT_VALUE, 110, 1],
      });
    });

    it('should fail when select element not found', async () => {
      const mockResult = [
        { result: { success: false, message: 'Failed to execute select step 1' } },
      ];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-3',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="nonexistent"]',
          pathAbsolute: '/html/body/select[@id="nonexistent"]',
          pathSmart: '//select[@id="nonexistent"]',
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
      expect(result.error).toContain('Failed to execute select step 1');
    });
  });

  describe('executeSelectStep - select_index', () => {
    it('should execute select_index on native select element', async () => {
      const mockResult = [{ result: { success: true, message: 'Select executed' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-4',
          websiteId: 'site-1',
          value: '2', // Select 3rd option (0-indexed)
          actionType: ACTION_TYPE.SELECT_INDEX,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test"]',
          pathAbsolute: '/html/body/select[@id="test"]',
          pathSmart: '//select[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
      expect(browser.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        func: expect.any(Function),
        args: ['//select[@id="test"]', '2', ACTION_TYPE.SELECT_INDEX, 10, 1],
      });
    });
  });

  describe('executeSelectStep - select_text', () => {
    it('should execute select_text with partial match', async () => {
      const mockResult = [{ result: { success: true, message: 'Select executed' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-5',
          websiteId: 'site-1',
          value: 'Option', // Partial match
          actionType: ACTION_TYPE.SELECT_TEXT,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test"]',
          pathAbsolute: '/html/body/select[@id="test"]',
          pathSmart: '//select[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
    });
  });

  describe('executeSelectStep - select_text_exact', () => {
    it('should execute select_text_exact with exact match', async () => {
      const mockResult = [{ result: { success: true, message: 'Select executed' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-6',
          websiteId: 'site-1',
          value: 'Option 1', // Exact match
          actionType: ACTION_TYPE.SELECT_TEXT_EXACT,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test"]',
          pathAbsolute: '/html/body/select[@id="test"]',
          pathSmart: '//select[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
    });
  });

  describe('executeSelectStep - custom select components', () => {
    it('should handle custom select component (not yet implemented)', async () => {
      const mockResult = [
        { result: { success: false, message: 'Failed to execute select step 1' } },
      ];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-7',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//div[@class="custom-select"]',
          pathAbsolute: '/html/body/div[@class="custom-select"]',
          pathSmart: '//div[@class="custom-select"]',
          actionPattern: 20, // Custom component single selection
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      // Should fail as custom components are not yet implemented
      expect(result.success).toBe(false);
      expect(result.processedSteps).toBe(0);
      expect(result.failedStep).toBe(1);
    });

    it('should handle jQuery select component (not yet implemented)', async () => {
      const mockResult = [
        { result: { success: false, message: 'Failed to execute select step 1' } },
      ];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-8',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@class="select2"]',
          pathAbsolute: '/html/body/select[@class="select2"]',
          pathSmart: '//select[@class="select2"]',
          actionPattern: 30, // jQuery single selection
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      // Should fail as jQuery components are not yet implemented
      expect(result.success).toBe(false);
      expect(result.processedSteps).toBe(0);
      expect(result.failedStep).toBe(1);
    });
  });

  describe('executeSelectStep - path pattern selection', () => {
    it('should use short XPath when selectedPathPattern is "short"', async () => {
      const mockResult = [{ result: { success: true, message: 'Select executed' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-9',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'short',
          pathShort: '//select[@id="test-short"]',
          pathAbsolute: '/html/body/form/select[@id="test"]',
          pathSmart: '//select[@id="test-smart"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(browser.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        func: expect.any(Function),
        args: ['//select[@id="test-short"]', 'option1', ACTION_TYPE.SELECT_VALUE, 10, 1],
      });
    });

    it('should use absolute XPath when selectedPathPattern is "absolute"', async () => {
      const mockResult = [{ result: { success: true, message: 'Select executed' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-10',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'absolute',
          pathShort: '//select[@id="test-short"]',
          pathAbsolute: '/html/body/form/select[@id="test-absolute"]',
          pathSmart: '//select[@id="test-smart"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(browser.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        func: expect.any(Function),
        args: [
          '/html/body/form/select[@id="test-absolute"]',
          'option1',
          ACTION_TYPE.SELECT_VALUE,
          10,
          1,
        ],
      });
    });

    it('should use smart XPath by default', async () => {
      const mockResult = [{ result: { success: true, message: 'Select executed' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-11',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test-short"]',
          pathAbsolute: '/html/body/form/select[@id="test"]',
          pathSmart: '//select[@id="test-smart"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(browser.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        func: expect.any(Function),
        args: ['//select[@id="test-smart"]', 'option1', ACTION_TYPE.SELECT_VALUE, 10, 1],
      });
    });
  });

  describe('executeSelectStep - error handling', () => {
    it('should handle script execution errors', async () => {
      (browser.scripting.executeScript as jest.Mock).mockRejectedValue(
        new Error('Script execution failed')
      );

      const xpaths: XPathData[] = [
        {
          id: 'test-12',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test"]',
          pathAbsolute: '/html/body/select[@id="test"]',
          pathSmart: '//select[@id="test"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.processedSteps).toBe(0);
      expect(result.error).toContain('Script execution failed');
    });

    it('should handle empty script result', async () => {
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue([]);

      const xpaths: XPathData[] = [
        {
          id: 'test-13',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test"]',
          pathAbsolute: '/html/body/select[@id="test"]',
          pathSmart: '//select[@id="test"]',
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
    });
  });

  describe('multiple steps with select', () => {
    it('should execute multiple select steps in sequence', async () => {
      const mockResult = [{ result: { success: true, message: 'Select executed' } }];
      (browser.scripting.executeScript as jest.Mock).mockResolvedValue(mockResult);

      const xpaths: XPathData[] = [
        {
          id: 'test-14',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test1"]',
          pathAbsolute: '/html/body/select[@id="test1"]',
          pathSmart: '//select[@id="test1"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-15',
          websiteId: 'site-1',
          value: '2',
          actionType: ACTION_TYPE.SELECT_INDEX,
          url: 'https://example.com',
          executionOrder: 2,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test2"]',
          pathAbsolute: '/html/body/select[@id="test2"]',
          pathSmart: '//select[@id="test2"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-16',
          websiteId: 'site-1',
          value: 'Option Text',
          actionType: ACTION_TYPE.SELECT_TEXT,
          url: 'https://example.com',
          executionOrder: 3,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test3"]',
          pathAbsolute: '/html/body/select[@id="test3"]',
          pathSmart: '//select[@id="test3"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(3);
      expect(browser.scripting.executeScript).toHaveBeenCalledTimes(3);
    });

    it('should stop execution on first failed select step', async () => {
      (browser.scripting.executeScript as jest.Mock)
        .mockResolvedValueOnce([{ result: { success: true, message: 'Select executed' } }]) // First step succeeds
        .mockResolvedValueOnce([
          { result: { success: false, message: 'Failed to execute select step 2' } },
        ]); // Second step fails

      const xpaths: XPathData[] = [
        {
          id: 'test-17',
          websiteId: 'site-1',
          value: 'option1',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test1"]',
          pathAbsolute: '/html/body/select[@id="test1"]',
          pathSmart: '//select[@id="test1"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-18',
          websiteId: 'site-1',
          value: 'option2',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 2,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="nonexistent"]',
          pathAbsolute: '/html/body/select[@id="nonexistent"]',
          pathSmart: '//select[@id="nonexistent"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
        {
          id: 'test-19',
          websiteId: 'site-1',
          value: 'option3',
          actionType: ACTION_TYPE.SELECT_VALUE,
          url: 'https://example.com',
          executionOrder: 3,
          selectedPathPattern: 'smart',
          pathShort: '//select[@id="test3"]',
          pathAbsolute: '/html/body/select[@id="test3"]',
          pathSmart: '//select[@id="test3"]',
          actionPattern: 10,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 30,
          retryType: 0,
        },
      ];

      const result = await service.executeAutoFill(1, xpaths, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.processedSteps).toBe(1);
      expect(result.failedStep).toBe(2);
      expect(browser.scripting.executeScript).toHaveBeenCalledTimes(2);
    });
  });
});
