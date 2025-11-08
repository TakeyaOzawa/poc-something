/**
 * Test: Execute Website From Popup Handler
 */

import browser from 'webextension-polyfill';
import { ExecuteWebsiteFromPopupHandler } from '../ExecuteWebsiteFromPopupHandler';
import {
  ExecuteWebsiteFromPopupRequest,
  ExecuteWebsiteFromPopupResponse,
} from '@domain/types/messaging';
import { GetWebsiteByIdUseCase } from '@application/usecases/websites/GetWebsiteByIdUseCase';
import { ExecuteAutoFillUseCase } from '@application/usecases/auto-fill/ExecuteAutoFillUseCase';
import { Logger } from '@domain/types/logger.types';
import { WebsiteData } from '@domain/entities/Website';
import { MessageTypes } from '@domain/types/messaging';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { IdGenerator } from '@domain/types/id-generator.types';
// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};
import { Result } from '@domain/values/result.value';

// Mock ChromeStorageAutomationVariablesRepository
jest.mock('@infrastructure/repositories/ChromeStorageAutomationVariablesRepository', () => ({
  ChromeStorageAutomationVariablesRepository: jest.fn().mockImplementation(() => ({
    load: jest.fn(),
    save: jest.fn(),
    loadAll: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    loadFromBatch: jest.fn(),
  })),
}));

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  tabs: {
    create: jest.fn(),
  },
  i18n: {
    getMessage: jest.fn((key: string) => {
      // Return the key as default, or specific mock values if needed
      return key;
    }),
  },
}));

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: { [key: string]: string } = {
        startUrlNotSet: 'startUrlが設定されていません',
        tabCreationFailed: '新しいタブの作成に失敗しました',
      };
      return messages[key] || key;
    }),
  },
}));

describe('ExecuteWebsiteFromPopupHandler', () => {
  let handler: ExecuteWebsiteFromPopupHandler;
  let mockGetWebsiteByIdUseCase: jest.Mocked<GetWebsiteByIdUseCase>;
  let mockExecuteAutoFillUseCase: jest.Mocked<ExecuteAutoFillUseCase>;
  let mockLogger: jest.Mocked<Logger>;

  const mockWebsite: WebsiteData = {
    id: 'website_123',
    name: 'Test Website',
    startUrl: 'https://example.com',
    editable: true,
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetWebsiteByIdUseCase = {
      execute: jest.fn(),
    } as any;

    mockExecuteAutoFillUseCase = {
      execute: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnValue({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createChild: jest.fn(),
      } as any),
    } as any;

    handler = new ExecuteWebsiteFromPopupHandler(
      mockGetWebsiteByIdUseCase,
      mockExecuteAutoFillUseCase,
      mockLogger
    );

    // Mock the automationVariablesRepository.load method to return Result
    const mockAv = AutomationVariables.create(
      {
        websiteId: 'website_123',
        status: 'enabled',
        variables: { username: 'test_user' },
      },
      mockIdGenerator
    );
    (handler as any).automationVariablesRepository.load = jest
      .fn()
      .mockResolvedValue(Result.success(mockAv));
    (handler as any).automationVariablesRepository.save = jest
      .fn()
      .mockResolvedValue(Result.success(undefined));
  }, mockIdGenerator);

  describe('handle', () => {
    it('should successfully execute website from popup', async () => {
      const message: ExecuteWebsiteFromPopupRequest = {
        action: MessageTypes.EXECUTE_WEBSITE_FROM_POPUP,
        websiteId: 'website_123',
      };

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue(
        { success: true, website: mockWebsite },
        mockIdGenerator
      );

      const mockTab = {
        id: 456,
        url: 'https://example.com',
      };
      (browser.tabs.create as jest.Mock).mockResolvedValue(mockTab);

      mockExecuteAutoFillUseCase.execute.mockResolvedValue({
        success: true,
        processedSteps: 5,
      });

      const response: ExecuteWebsiteFromPopupResponse = await handler.handle(message);

      expect(response.success).toBe(true);
      expect(response.data?.processedSteps).toBe(5);
      expect(mockGetWebsiteByIdUseCase.execute).toHaveBeenCalledWith({ websiteId: 'website_123' });
      expect(browser.tabs.create).toHaveBeenCalledWith({
        url: 'https://example.com',
        active: true,
      });
      expect(mockExecuteAutoFillUseCase.execute).toHaveBeenCalledWith({
        tabId: 456,
        url: '',
        variables: expect.any(Object),
        websiteId: 'website_123',
      });
    });

    it('should return error when website not found', async () => {
      const message: ExecuteWebsiteFromPopupRequest = {
        action: MessageTypes.EXECUTE_WEBSITE_FROM_POPUP,
        websiteId: 'non_existent',
      };

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: null });

      const response: ExecuteWebsiteFromPopupResponse = await handler.handle(message);

      expect(response.success).toBe(false);
      expect(response.data?.error).toBe('Website not found');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ExecuteWebsiteFromPopupHandler] Website not found',
        expect.any(Object)
      );
    });

    it('should return error when website has no startUrl', async () => {
      const message: ExecuteWebsiteFromPopupRequest = {
        action: MessageTypes.EXECUTE_WEBSITE_FROM_POPUP,
        websiteId: 'website_123',
      };

      const websiteWithoutUrl: WebsiteData = {
        ...mockWebsite,
        startUrl: undefined,
      };

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: websiteWithoutUrl,
      });

      const response: ExecuteWebsiteFromPopupResponse = await handler.handle(message);

      expect(response.success).toBe(false);
      expect(response.data?.error).toContain('startUrlが設定されていません');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ExecuteWebsiteFromPopupHandler] Website has no startUrl',
        expect.any(Object)
      );
    });

    it('should return error when tab creation fails', async () => {
      const message: ExecuteWebsiteFromPopupRequest = {
        action: MessageTypes.EXECUTE_WEBSITE_FROM_POPUP,
        websiteId: 'website_123',
      };

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: mockWebsite });

      (browser.tabs.create as jest.Mock).mockResolvedValue({});

      const response: ExecuteWebsiteFromPopupResponse = await handler.handle(message);

      expect(response.success).toBe(false);
      expect(response.data?.error).toBe('新しいタブの作成に失敗しました');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ExecuteWebsiteFromPopupHandler] Failed to create new tab'
      );
    });

    it('should handle auto-fill execution failure', async () => {
      const message: ExecuteWebsiteFromPopupRequest = {
        action: MessageTypes.EXECUTE_WEBSITE_FROM_POPUP,
        websiteId: 'website_123',
      };

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: mockWebsite });

      const mockTab = {
        id: 456,
        url: 'https://example.com',
      };
      (browser.tabs.create as jest.Mock).mockResolvedValue(mockTab);

      mockExecuteAutoFillUseCase.execute.mockResolvedValue({
        success: false,
        processedSteps: 2,
        error: 'XPath not found',
      });

      const response: ExecuteWebsiteFromPopupResponse = await handler.handle(message);

      expect(response.success).toBe(false);
      expect(response.data?.error).toBe('XPath not found');
      expect(response.data?.processedSteps).toBe(2);
    });

    it('should handle exceptions during execution', async () => {
      const message: ExecuteWebsiteFromPopupRequest = {
        action: MessageTypes.EXECUTE_WEBSITE_FROM_POPUP,
        websiteId: 'website_123',
      };

      mockGetWebsiteByIdUseCase.execute.mockRejectedValue(new Error('Database error'));

      const response: ExecuteWebsiteFromPopupResponse = await handler.handle(message);

      expect(response.success).toBe(false);
      expect(response.data?.error).toBe('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ExecuteWebsiteFromPopupHandler] Error executing website',
        expect.any(Error)
      );
    });

    it('should log all execution steps', async () => {
      const message: ExecuteWebsiteFromPopupRequest = {
        action: MessageTypes.EXECUTE_WEBSITE_FROM_POPUP,
        websiteId: 'website_123',
      };

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: mockWebsite });

      const mockTab = {
        id: 456,
        url: 'https://example.com',
      };
      (browser.tabs.create as jest.Mock).mockResolvedValue(mockTab);

      mockExecuteAutoFillUseCase.execute.mockResolvedValue({
        success: true,
        processedSteps: 5,
      });

      await handler.handle(message);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[ExecuteWebsiteFromPopupHandler] Received request',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[ExecuteWebsiteFromPopupHandler] Website loaded',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[ExecuteWebsiteFromPopupHandler] Creating new tab',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[ExecuteWebsiteFromPopupHandler] New tab created',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[ExecuteWebsiteFromPopupHandler] Executing auto-fill',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[ExecuteWebsiteFromPopupHandler] Auto-fill completed',
        expect.any(Object)
      );
    });
  });
});
