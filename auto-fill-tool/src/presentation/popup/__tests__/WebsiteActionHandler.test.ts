/**
 * Test: Website Action Handler
 */

import { WebsiteActionHandler } from '../WebsiteActionHandler';
import { WebsiteData } from '@domain/entities/Website';
import { Logger } from '@domain/types/logger.types';
import { MessageDispatcher } from '@infrastructure/messaging/MessageDispatcher';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
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
        unknownError: '不明なエラー',
      };
      return messages[key] || key;
    }),
    format: jest.fn((key: string, ...substitutions: string[]) => {
      const templates: { [key: string]: string } = {
        autoFillCompleted: `自動入力が完了しました\n処理ステップ数: ${substitutions[0]}`,
        autoFillFailed: `自動入力に失敗しました\n${substitutions[0]}`,
        autoFillExecutionFailed: `自動入力の実行に失敗しました: ${substitutions[0]}`,
      };
      return templates[key] || key;
    }),
  },
}));

// Mock MessageDispatcher
jest.mock('@infrastructure/messaging/MessageDispatcher');

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('WebsiteActionHandler', () => {
  let handler: WebsiteActionHandler;
  let mockLogger: jest.Mocked<Logger>;
  let mockMessageDispatcher: jest.Mocked<MessageDispatcher>;

  const mockWebsite: WebsiteData = {
    id: 'website_123',
    name: 'Test Website',
    updatedAt: '2025-01-01T00:00:00Z',
    editable: true,
    startUrl: 'https://example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    mockMessageDispatcher = {
      executeWebsiteFromPopup: jest.fn(),
    } as any;

    (MessageDispatcher as jest.MockedClass<typeof MessageDispatcher>).mockImplementation(() => {
      return mockMessageDispatcher;
    });

    handler = new WebsiteActionHandler(mockLogger);
  });

  describe('executeWebsite', () => {
    it('should send executeWebsiteFromPopup message to background script', async () => {
      mockMessageDispatcher.executeWebsiteFromPopup.mockResolvedValue({
        success: true,
        data: {
          processedSteps: 5,
        },
      });

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const result = await handler.executeWebsite(mockWebsite);

      expect(mockMessageDispatcher.executeWebsiteFromPopup).toHaveBeenCalledWith('website_123');
      expect(alertSpy).toHaveBeenCalledWith('自動入力が完了しました\n処理ステップ数: 5');
      expect(result).toBe(true);

      alertSpy.mockRestore();
    });

    it('should log execution attempt', async () => {
      mockMessageDispatcher.executeWebsiteFromPopup.mockResolvedValue({
        success: true,
      });

      jest.spyOn(window, 'alert').mockImplementation(() => {});

      await handler.executeWebsite(mockWebsite);

      expect(mockLogger.info).toHaveBeenCalledWith('Executing website', {
        websiteId: 'website_123',
        websiteName: 'Test Website',
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Sending executeWebsiteFromPopup message to background',
        {
          websiteId: 'website_123',
        }
      );
    });

    it('should show error alert when execution fails', async () => {
      mockMessageDispatcher.executeWebsiteFromPopup.mockResolvedValue({
        success: false,
        data: {
          error: 'Test error message',
        },
      });

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const result = await handler.executeWebsite(mockWebsite);

      expect(alertSpy).toHaveBeenCalledWith('自動入力に失敗しました\nTest error message');
      expect(result).toBe(false);

      alertSpy.mockRestore();
    });

    it('should handle exception during message sending', async () => {
      mockMessageDispatcher.executeWebsiteFromPopup.mockRejectedValue(
        new Error('Message sending failed')
      );

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const result = await handler.executeWebsite(mockWebsite);

      expect(alertSpy).toHaveBeenCalledWith('自動入力の実行に失敗しました: Message sending failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to execute website',
        expect.any(Error),
        expect.objectContaining({
          errorType: 'Error',
          errorMessage: 'Message sending failed',
        })
      );
      expect(result).toBe(false);

      alertSpy.mockRestore();
    });

    it('should show default error message when error detail is missing', async () => {
      mockMessageDispatcher.executeWebsiteFromPopup.mockResolvedValue({
        success: false,
      });

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const result = await handler.executeWebsite(mockWebsite);

      expect(alertSpy).toHaveBeenCalledWith('自動入力に失敗しました\n不明なエラー');
      expect(result).toBe(false);

      alertSpy.mockRestore();
    });

    it('should log received response from background', async () => {
      const mockResponse = {
        success: true,
        data: {
          processedSteps: 3,
        },
      };

      mockMessageDispatcher.executeWebsiteFromPopup.mockResolvedValue(mockResponse);

      jest.spyOn(window, 'alert').mockImplementation(() => {});

      await handler.executeWebsite(mockWebsite);

      expect(mockLogger.info).toHaveBeenCalledWith('Received response from background', {
        response: mockResponse,
      });
    });
  });
});
