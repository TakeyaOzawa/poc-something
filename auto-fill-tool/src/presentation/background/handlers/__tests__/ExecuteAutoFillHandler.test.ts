import { ExecuteAutoFillHandler } from '../ExecuteAutoFillHandler';
import { ExecuteAutoFillUseCase } from '@usecases/auto-fill/ExecuteAutoFillUseCase';
import { MessageTypes } from '@domain/types/messaging';
import { ExecuteAutoFillRequest } from '@domain/types/messaging';
import { MessageContext } from '@domain/types/messaging';
import { NoOpLogger } from '@domain/services/NoOpLogger';

describe('ExecuteAutoFillHandler', () => {
  let handler: ExecuteAutoFillHandler;
  let mockUseCase: jest.Mocked<ExecuteAutoFillUseCase>;
  let mockLogger: NoOpLogger;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn(),
    } as any;

    mockLogger = new NoOpLogger();
    handler = new ExecuteAutoFillHandler(mockUseCase, mockLogger);
  });

  it('should execute auto-fill successfully with tabId', async () => {
    mockUseCase.execute.mockResolvedValue({
      success: true,
      processedSteps: 5,
      failedStep: undefined,
      error: undefined,
    });

    const message: ExecuteAutoFillRequest = {
      action: MessageTypes.EXECUTE_AUTO_FILL,
      tabId: 123,
      websiteId: 'website-1',
      websiteVariables: { key: 'value' },
    };

    const context: MessageContext = {
      sender: { tab: { id: 456 } } as any,
    };

    const response = await handler.handle(message, context);

    expect(response.success).toBe(true);
    expect(response.data?.processedSteps).toBe(5);
    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tabId: 123,
        websiteId: 'website-1',
      })
    );
  });

  it('should use sender tab ID when tabId is not provided', async () => {
    mockUseCase.execute.mockResolvedValue({
      success: true,
      processedSteps: 3,
      failedStep: undefined,
      error: undefined,
    });

    const message: ExecuteAutoFillRequest = {
      action: MessageTypes.EXECUTE_AUTO_FILL,
      tabId: null,
      websiteId: 'website-1',
      websiteVariables: {},
    };

    const context: MessageContext = {
      sender: { tab: { id: 456 } } as any,
    };

    const response = await handler.handle(message, context);

    expect(response.success).toBe(true);
    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tabId: 456,
      })
    );
  });

  it('should return error when tabId is missing', async () => {
    const message: ExecuteAutoFillRequest = {
      action: MessageTypes.EXECUTE_AUTO_FILL,
      tabId: null,
      websiteId: 'website-1',
      websiteVariables: {},
    };

    const context: MessageContext = {
      sender: {} as any,
    };

    const response = await handler.handle(message, context);

    expect(response.success).toBe(false);
    expect(response.data?.error).toBe('Missing tabId parameter');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle use case errors', async () => {
    mockUseCase.execute.mockRejectedValue(new Error('Use case error'));

    const message: ExecuteAutoFillRequest = {
      action: MessageTypes.EXECUTE_AUTO_FILL,
      tabId: 123,
      websiteId: 'website-1',
      websiteVariables: {},
    };

    const context: MessageContext = {
      sender: { tab: { id: 123 } } as any,
    };

    const response = await handler.handle(message, context);

    expect(response.success).toBe(false);
    expect(response.data?.error).toBe('Use case error');
  });
});
