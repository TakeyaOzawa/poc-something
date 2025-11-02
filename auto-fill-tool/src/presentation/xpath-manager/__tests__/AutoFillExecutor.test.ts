/**
 * Test for AutoFillExecutor
 */

import { AutoFillExecutor } from '../AutoFillExecutor';
import { WebsiteSelectManager } from '../WebsiteSelectManager';
import { Logger } from '@domain/types/logger.types';
import { MessageDispatcher } from '@infrastructure/messaging/MessageDispatcher';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { IdGenerator } from '@domain/types/id-generator.types';
// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};
import { Website } from '@domain/entities/Website';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import browser from 'webextension-polyfill';
import { Result } from '@domain/values/result.value';

// Mock modules
jest.mock('webextension-polyfill', () => ({
  tabs: {
    create: jest.fn(),
  },
  runtime: {
    sendMessage: jest.fn(),
  },
}));

jest.mock('@infrastructure/messaging/MessageDispatcher');
jest.mock('@infrastructure/repositories/ChromeStorageAutomationVariablesRepository');
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        selectWebsitePrompt: 'Please select a website',
        websiteNotFound: 'Website not found',
        startUrlNotSet: 'Start URL is not set',
        tabCreationFailed: 'Failed to create tab',
        autoFillCompleted: 'Auto-fill completed. Processed %s steps',
        autoFillFailed: 'Auto-fill failed: %s',
        autoFillExecutionFailed: 'Auto-fill execution failed: %s',
        unknownError: 'Unknown error',
      };
      return messages[key] || key;
    }),
    format: jest.fn((key: string, ...args: string[]) => {
      const messages: Record<string, string> = {
        autoFillCompleted: `Auto-fill completed. Processed ${args[0]} steps`,
        autoFillFailed: `Auto-fill failed: ${args[0]}`,
        autoFillExecutionFailed: `Auto-fill execution failed: ${args[0]}`,
      };
      return messages[key] || key;
    }),
  },
}));

describe('AutoFillExecutor', () => {
  let executor: AutoFillExecutor;
  let mockWebsiteSelectManager: jest.Mocked<WebsiteSelectManager>;
  let mockLogger: jest.Mocked<Logger>;
  let mockView: any;
  let mockMessageDispatcher: jest.Mocked<MessageDispatcher>;
  let mockAutomationVariablesRepository: jest.Mocked<ChromeStorageAutomationVariablesRepository>;
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create mocks
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    mockWebsiteSelectManager = {
      getCurrentWebsiteId: jest.fn(),
      getWebsiteById: jest.fn(),
    } as any;

    mockView = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showProgress: jest.fn(),
      updateProgress: jest.fn(),
      hideProgress: jest.fn(),
    };

    mockMessageDispatcher = {
      executeAutoFill: jest.fn(),
    } as any;

    mockAutomationVariablesRepository = {
      load: jest.fn(),
    } as any;

    (MessageDispatcher as jest.Mock).mockImplementation(() => mockMessageDispatcher);
    (ChromeStorageAutomationVariablesRepository as jest.Mock).mockImplementation(
      () => mockAutomationVariablesRepository
    );

    // Mock alert
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Create executor
    executor = new AutoFillExecutor(mockWebsiteSelectManager, mockLogger, mockView);
  });

  afterEach(() => {
    jest.clearAllMocks();
    alertSpy.mockRestore();
  });

  describe('executeAutoFill', () => {
    it('should show error if no website is selected', async () => {
      mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('');

      await executor.executeAutoFill();

      expect(mockWebsiteSelectManager.getCurrentWebsiteId).toHaveBeenCalled();
      expect(mockView.showError).toHaveBeenCalledWith('Please select a website');
      expect(mockWebsiteSelectManager.getWebsiteById).not.toHaveBeenCalled();
    });

    it('should show error if website is not found', async () => {
      mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('website-1');
      mockWebsiteSelectManager.getWebsiteById.mockResolvedValue(null);

      await executor.executeAutoFill();

      expect(mockWebsiteSelectManager.getWebsiteById).toHaveBeenCalledWith('website-1');
      expect(mockView.showError).toHaveBeenCalledWith('Website not found');
    });

    it(
      'should show error if startUrl is not set',
      async () => {
        const website = Website.create(
          {
            name: 'Test Website',
            startUrl: '',
          },
          mockIdGenerator
        );

        mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('website-1');
        mockWebsiteSelectManager.getWebsiteById.mockResolvedValue(website.toData());

        await executor.executeAutoFill();

        expect(mockView.showError).toHaveBeenCalledWith('Start URL is not set');
      },
      mockIdGenerator
    );

    it('should show error if tab creation fails', async () => {
      const website = Website.create(
        {
          name: 'Test Website',
          startUrl: 'https://example.com/start',
        },
        mockIdGenerator
      );

      mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('website-1');
      mockWebsiteSelectManager.getWebsiteById.mockResolvedValue(website.toData());
      (browser.tabs.create as jest.Mock).mockResolvedValue({ id: undefined }, mockIdGenerator);

      await executor.executeAutoFill();

      expect(mockView.showError).toHaveBeenCalledWith('Failed to create tab');
    });

    it('should execute auto-fill successfully', async () => {
      const website = Website.create(
        {
          name: 'Test Website',
          startUrl: 'https://example.com/start',
        },
        mockIdGenerator
      );

      const automationVariables = AutomationVariables.create(
        {
          websiteId: 'website-1',
          variables: { username: 'testuser', password: 'testpass' },
        },
        mockIdGenerator
      );

      mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('website-1');
      mockWebsiteSelectManager.getWebsiteById.mockResolvedValue(website.toData());
      (browser.tabs.create as jest.Mock).mockResolvedValue({ id: 123 }, mockIdGenerator);
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      mockMessageDispatcher.executeAutoFill.mockResolvedValue(
        {
          success: true,
          data: { processedSteps: 5 },
        },
        mockIdGenerator
      );

      await executor.executeAutoFill();

      expect(browser.tabs.create).toHaveBeenCalledWith({
        url: 'https://example.com/start',
        active: true,
      });
      expect(mockAutomationVariablesRepository.load).toHaveBeenCalledWith('website-1');
      expect(mockMessageDispatcher.executeAutoFill).toHaveBeenCalledWith({
        tabId: 123,
        websiteId: 'website-1',
        websiteVariables: { username: 'testuser', password: 'testpass' },
      });
      expect(mockView.showProgress).toHaveBeenCalled();
      expect(mockView.showSuccess).toHaveBeenCalledWith('Auto-fill completed. Processed 5 steps');
      expect(mockView.hideProgress).toHaveBeenCalled();
    });

    it('should execute auto-fill with empty variables if no variables found', async () => {
      const website = Website.create(
        {
          name: 'Test Website',
          startUrl: 'https://example.com/start',
        },
        mockIdGenerator
      );

      mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('website-1');
      mockWebsiteSelectManager.getWebsiteById.mockResolvedValue(website.toData());
      (browser.tabs.create as jest.Mock).mockResolvedValue({ id: 123 }, mockIdGenerator);
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockMessageDispatcher.executeAutoFill.mockResolvedValue({
        success: true,
        data: { processedSteps: 3 },
      });

      await executor.executeAutoFill();

      expect(mockMessageDispatcher.executeAutoFill).toHaveBeenCalledWith({
        tabId: 123,
        websiteId: 'website-1',
        websiteVariables: {},
      });
      expect(mockView.showSuccess).toHaveBeenCalledWith('Auto-fill completed. Processed 3 steps');
    });

    it('should show error if auto-fill fails', async () => {
      const website = Website.create(
        {
          name: 'Test Website',
          startUrl: 'https://example.com/start',
        },
        mockIdGenerator
      );

      mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('website-1');
      mockWebsiteSelectManager.getWebsiteById.mockResolvedValue(website.toData());
      (browser.tabs.create as jest.Mock).mockResolvedValue({ id: 123 }, mockIdGenerator);
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockMessageDispatcher.executeAutoFill.mockResolvedValue({
        success: false,
        data: { error: 'Element not found' },
      });

      await executor.executeAutoFill();

      expect(mockView.showError).toHaveBeenCalledWith('Auto-fill failed: Element not found');
    });

    it('should handle auto-fill failure with unknown error', async () => {
      const website = Website.create(
        {
          name: 'Test Website',
          startUrl: 'https://example.com/start',
        },
        mockIdGenerator
      );

      mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('website-1');
      mockWebsiteSelectManager.getWebsiteById.mockResolvedValue(website.toData());
      (browser.tabs.create as jest.Mock).mockResolvedValue({ id: 123 }, mockIdGenerator);
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockMessageDispatcher.executeAutoFill.mockResolvedValue({
        success: false,
        data: {},
      });

      await executor.executeAutoFill();

      expect(mockView.showError).toHaveBeenCalledWith('Auto-fill failed: Unknown error');
    });

    it('should handle exceptions during execution', async () => {
      const error = new Error('Network error');
      mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('website-1');
      mockWebsiteSelectManager.getWebsiteById.mockRejectedValue(error);

      await executor.executeAutoFill();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to execute auto-fill', error);
      expect(mockView.showError).toHaveBeenCalledWith('Auto-fill execution failed: Network error');
      expect(mockView.hideProgress).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('website-1');
      mockWebsiteSelectManager.getWebsiteById.mockRejectedValue('String error');

      await executor.executeAutoFill();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to execute auto-fill', 'String error');
      expect(mockView.showError).toHaveBeenCalledWith('Auto-fill execution failed: Unknown error');
      expect(mockView.hideProgress).toHaveBeenCalled();
    });

    it('should log debug information during execution', async () => {
      const website = Website.create(
        {
          name: 'Test Website',
          startUrl: 'https://example.com/start',
        },
        mockIdGenerator
      );

      mockWebsiteSelectManager.getCurrentWebsiteId.mockReturnValue('website-1');
      mockWebsiteSelectManager.getWebsiteById.mockResolvedValue(website.toData());
      (browser.tabs.create as jest.Mock).mockResolvedValue({ id: 123 }, mockIdGenerator);
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockMessageDispatcher.executeAutoFill.mockResolvedValue({
        success: true,
        data: { processedSteps: 2 },
      });

      await executor.executeAutoFill();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[XPath Manager handleExecuteAutoFill] Called',
        { currentWebsiteId: 'website-1' }
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[XPath Manager handleExecuteAutoFill] Selected website:',
        { selectedWebsite: website.toData() }
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[XPath Manager handleExecuteAutoFill] startUrl value:',
        { startUrl: 'https://example.com/start' }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[XPath Manager] Executing auto-fill for website: Test Website, Start URL: https://example.com/start'
      );
    });
  });
});
