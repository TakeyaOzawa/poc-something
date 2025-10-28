/**
 * Test: Cancel Auto Fill Handler
 */

import { CancelAutoFillHandler } from '../CancelAutoFillHandler';
import { Logger } from '@domain/types/logger.types';
import { CancelAutoFillRequest } from '@domain/types/messaging';
import { MessageContext } from '@domain/types/messaging';
import { ChromeAutoFillAdapter } from '@infrastructure/adapters/ChromeAutoFillAdapter';

// Mock ChromeAutoFillAdapter
jest.mock('@infrastructure/adapters/ChromeAutoFillAdapter', () => ({
  ChromeAutoFillAdapter: {
    requestCancellation: jest.fn(),
  },
}));

describe('CancelAutoFillHandler', () => {
  let handler: CancelAutoFillHandler;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    handler = new CancelAutoFillHandler(mockLogger);
  });

  describe('handle', () => {
    it('should cancel auto-fill when tabId is provided in request', async () => {
      const request: CancelAutoFillRequest = {
        action: 'cancelAutoFill',
        tabId: 123,
      };

      const context: MessageContext = {
        sender: {},
      };

      const response = await handler.handle(request, context);

      expect(ChromeAutoFillAdapter.requestCancellation).toHaveBeenCalledWith(123);
      expect(mockLogger.info).toHaveBeenCalledWith('Cancellation requested for tab 123');
      expect(response).toEqual({ success: true });
    });

    it('should use sender tab ID when tabId is not provided in request', async () => {
      const request: CancelAutoFillRequest = {
        action: 'cancelAutoFill',
      };

      const context: MessageContext = {
        sender: {
          tab: { id: 456 } as any,
        },
      };

      const response = await handler.handle(request, context);

      expect(ChromeAutoFillAdapter.requestCancellation).toHaveBeenCalledWith(456);
      expect(mockLogger.info).toHaveBeenCalledWith('Cancellation requested for tab 456');
      expect(response).toEqual({ success: true });
    });

    it('should return error when tabId is not available', async () => {
      const request: CancelAutoFillRequest = {
        action: 'cancelAutoFill',
      };

      const context: MessageContext = {
        sender: {},
      };

      const response = await handler.handle(request, context);

      expect(ChromeAutoFillAdapter.requestCancellation).not.toHaveBeenCalled();
      expect(response).toEqual({
        success: false,
        error: 'Missing tabId parameter',
      });
    });

    it('should return error when sender has no tab', async () => {
      const request: CancelAutoFillRequest = {
        action: 'cancelAutoFill',
      };

      const context: MessageContext = {
        sender: {
          tab: undefined,
        },
      };

      const response = await handler.handle(request, context);

      expect(ChromeAutoFillAdapter.requestCancellation).not.toHaveBeenCalled();
      expect(response).toEqual({
        success: false,
        error: 'Missing tabId parameter',
      });
    });

    it('should handle errors from ChromeAutoFillAdapter', async () => {
      const request: CancelAutoFillRequest = {
        action: 'cancelAutoFill',
        tabId: 789,
      };

      const context: MessageContext = {
        sender: {},
      };

      const error = new Error('Cancellation failed');
      (ChromeAutoFillAdapter.requestCancellation as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const response = await handler.handle(request, context);

      expect(mockLogger.error).toHaveBeenCalledWith('Error processing cancellation request', error);
      expect(response).toEqual({
        success: false,
        error: 'Cancellation failed',
      });
    });

    it('should handle non-Error exceptions', async () => {
      const request: CancelAutoFillRequest = {
        action: 'cancelAutoFill',
        tabId: 999,
      };

      const context: MessageContext = {
        sender: {},
      };

      (ChromeAutoFillAdapter.requestCancellation as jest.Mock).mockImplementation(() => {
        throw 'String error';
      });

      const response = await handler.handle(request, context);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error processing cancellation request',
        'String error'
      );
      expect(response).toEqual({
        success: false,
        error: 'Unknown error',
      });
    });

    it('should prefer request tabId over sender tab ID', async () => {
      // Reset the mock implementation from previous test
      (ChromeAutoFillAdapter.requestCancellation as jest.Mock).mockImplementation(() => {});

      const request: CancelAutoFillRequest = {
        action: 'cancelAutoFill',
        tabId: 111,
      };

      const context: MessageContext = {
        sender: {
          tab: { id: 222 } as any,
        },
      };

      const response = await handler.handle(request, context);

      expect(ChromeAutoFillAdapter.requestCancellation).toHaveBeenCalledWith(111);
      expect(response).toEqual({ success: true });
    });
  });
});
