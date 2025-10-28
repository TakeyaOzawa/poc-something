import { MessageRouter } from '../MessageRouter';
import { MessageHandler } from '@domain/types/messaging';
import { MessageTypes } from '@domain/types/messaging';
import { ExecuteAutoFillRequest, ExecuteAutoFillResponse } from '@domain/types/messaging';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { ConsoleLogger } from '@infrastructure/loggers/ConsoleLogger';
import { LogLevel } from '@domain/types/logger.types';
import browser from 'webextension-polyfill';

// Mock browser runtime
jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
  },
}));

describe('MessageRouter', () => {
  let messageRouter: MessageRouter;
  let mockHandler: jest.Mocked<MessageHandler>;
  let onMessageListener:
    | ((message: any, sender: any, sendResponse: (response: any) => void) => boolean)
    | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    const logger = new NoOpLogger();
    messageRouter = new MessageRouter(logger);
    mockHandler = {
      handle: jest.fn(),
    };

    // Capture the listener function
    (browser.runtime.onMessage.addListener as jest.Mock).mockImplementation((listener) => {
      onMessageListener = listener;
    });
  });

  describe('registerHandler', () => {
    it('should register a handler for an action type', () => {
      messageRouter.registerHandler(MessageTypes.EXECUTE_AUTO_FILL, mockHandler);
      // Handler is registered (no error thrown)
      expect(true).toBe(true);
    });
  });

  describe('unregisterHandler', () => {
    it('should unregister a handler', () => {
      messageRouter.registerHandler(MessageTypes.EXECUTE_AUTO_FILL, mockHandler);
      messageRouter.unregisterHandler(MessageTypes.EXECUTE_AUTO_FILL);
      // Handler is unregistered (no error thrown)
      expect(true).toBe(true);
    });
  });

  describe('startListening', () => {
    it('should start listening for messages', () => {
      messageRouter.startListening();
      expect(browser.runtime.onMessage.addListener).toHaveBeenCalled();
    });
  });

  describe('message handling via listener', () => {
    beforeEach(() => {
      messageRouter.registerHandler(MessageTypes.EXECUTE_AUTO_FILL, mockHandler);
      messageRouter.startListening();
    });

    it('should handle valid message with registered handler', async () => {
      const mockResponse: ExecuteAutoFillResponse = {
        success: true,
        data: { processedSteps: 5 },
      };
      mockHandler.handle.mockResolvedValue(mockResponse);

      const message: ExecuteAutoFillRequest = {
        action: MessageTypes.EXECUTE_AUTO_FILL,
        tabId: 123,
        websiteId: 'website-1',
        websiteVariables: { key: 'value' },
      };

      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      // Call the listener
      if (onMessageListener) {
        onMessageListener(message, sender, sendResponse);
      }

      // Wait for async handling
      await Promise.resolve();

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle invalid message format', async () => {
      const sendResponse = jest.fn();
      const sender = { tab: { id: 123 } };

      // Call with invalid message
      if (onMessageListener) {
        onMessageListener(null, sender, sendResponse);
      }
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid message format',
      });
    });

    it('should handle unknown action type', async () => {
      const sendResponse = jest.fn();
      const sender = { tab: { id: 123 } };
      const message = { action: 'unknownAction' };

      if (onMessageListener) {
        onMessageListener(message, sender, sendResponse);
      }
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown action type',
      });
    });

    it('should ignore internal messages without warning', async () => {
      const sendResponse = jest.fn();
      const sender = { tab: { id: 123 } };
      const message = { action: 'updateAutoFillProgress', current: 1, total: 10 };

      if (onMessageListener) {
        onMessageListener(message, sender, sendResponse);
      }
      await Promise.resolve();

      // Should not call sendResponse for ignored messages
      expect(sendResponse).not.toHaveBeenCalled();
      // Should not call any handler
      expect(mockHandler.handle).not.toHaveBeenCalled();
    });

    it('should handle missing handler for action', async () => {
      const sendResponse = jest.fn();
      const sender = { tab: { id: 123 } };
      const message = { action: MessageTypes.GET_XPATH };

      if (onMessageListener) {
        onMessageListener(message, sender, sendResponse);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'No handler for this action',
      });
    });

    it('should handle errors from handler', async () => {
      mockHandler.handle.mockRejectedValue(new Error('Handler error'));

      const message: ExecuteAutoFillRequest = {
        action: MessageTypes.EXECUTE_AUTO_FILL,
        tabId: 123,
        websiteId: 'website-1',
        websiteVariables: {},
      };

      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      if (onMessageListener) {
        onMessageListener(message, sender, sendResponse);
      }
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Handler error',
      });
    });
  });

  describe('with ConsoleLogger', () => {
    it('should work with ConsoleLogger', () => {
      const logger = new ConsoleLogger('TestRouter', LogLevel.DEBUG);
      const router = new MessageRouter(logger);
      router.registerHandler(MessageTypes.EXECUTE_AUTO_FILL, mockHandler);
      router.startListening();
      expect(true).toBe(true);
    });
  });
});
