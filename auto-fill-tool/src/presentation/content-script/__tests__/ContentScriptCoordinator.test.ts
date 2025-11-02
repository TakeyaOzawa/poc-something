/**
 * Unit Tests: ContentScriptCoordinator
 */

import browser from 'webextension-polyfill';
import { ContentScriptCoordinator } from '../ContentScriptCoordinator';
import { AutoFillHandler } from '../AutoFillHandler';
import { MessageRouter } from '@infrastructure/messaging/MessageRouter';
import { MessageTypes } from '@domain/types/messaging';
import { GetXPathHandler } from '../handlers/GetXPathHandler';
import { ShowXPathDialogHandler } from '../handlers/ShowXPathDialogHandler';
import { ContentScriptMediaRecorder } from '../ContentScriptMediaRecorder';
import type { ContentScriptPresenter } from '../../types';
import type { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

jest.mock('../AutoFillHandler');
jest.mock('@infrastructure/messaging/MessageRouter');
jest.mock('../handlers/GetXPathHandler');
jest.mock('../handlers/ShowXPathDialogHandler');
jest.mock('../ContentScriptMediaRecorder');

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ContentScriptCoordinator', () => {
  let mockPresenter: jest.Mocked<ContentScriptPresenter>;
  let mockLogger: jest.Mocked<Logger>;
  let mockOnGetXPath: jest.Mock;
  let mockOnGetClickPosition: jest.Mock;
  let coordinator: ContentScriptCoordinator;
  let contextmenuListeners: Array<(event: Event) => void>;
  let runtimeMessageListeners: Array<(message: unknown) => void>;

  beforeEach(() => {
    // Track runtime.onMessage listeners
    runtimeMessageListeners = [];

    // Mock browser.runtime.onMessage
    if (!browser.runtime.onMessage) {
      (browser.runtime as any).onMessage = {
        addListener: jest.fn((listener: (message: unknown) => void) => {
          runtimeMessageListeners.push(listener);
        }),
      };
    } else {
      jest.spyOn(browser.runtime.onMessage, 'addListener').mockImplementation((listener: any) => {
        runtimeMessageListeners.push(listener);
      });
    }

    // Mock Presenter
    mockPresenter = {
      handleProgressUpdate: jest.fn().mockResolvedValue(undefined),
      resetManualExecution: jest.fn(),
      cleanup: jest.fn(),
    };

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    // Mock callbacks
    mockOnGetXPath = jest.fn().mockReturnValue(document.body);
    mockOnGetClickPosition = jest.fn().mockReturnValue({ x: 100, y: 200 });

    // Track contextmenu event listeners
    contextmenuListeners = [];
    const originalAddEventListener = document.addEventListener;
    jest
      .spyOn(document, 'addEventListener')
      .mockImplementation((event: string, listener: any, options: any) => {
        if (event === 'contextmenu') {
          contextmenuListeners.push(listener);
        } else {
          originalAddEventListener.call(document, event, listener, options);
        }
      });

    // Mock AutoFillHandler
    (AutoFillHandler as jest.Mock).mockImplementation(() => ({
      handlePageLoad: jest.fn(),
    }));

    // Mock MessageRouter
    const mockRouterInstance = {
      registerHandler: jest.fn(),
      startListening: jest.fn(),
    };
    (MessageRouter as jest.Mock).mockImplementation(() => mockRouterInstance);

    coordinator = new ContentScriptCoordinator({
      presenter: mockPresenter,
      logger: mockLogger,
      onGetXPath: mockOnGetXPath,
      onGetClickPosition: mockOnGetClickPosition,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    contextmenuListeners = [];
    runtimeMessageListeners = [];
  });

  describe('constructor', () => {
    it('should store dependencies', () => {
      expect(coordinator).toBeDefined();
      expect(coordinator).toBeInstanceOf(ContentScriptCoordinator);
    });
  });

  describe('initialize', () => {
    it('should initialize all components successfully', () => {
      coordinator.initialize();

      expect(AutoFillHandler).toHaveBeenCalledWith(mockLogger);
      expect(MessageRouter).toHaveBeenCalledWith(mockLogger);
      expect(GetXPathHandler).toHaveBeenCalledWith(mockOnGetXPath, expect.any(Object));
      expect(ShowXPathDialogHandler).toHaveBeenCalledWith(mockOnGetClickPosition);
      expect(ContentScriptMediaRecorder).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Content script coordinator initialized');
    });

    it('should log error and throw when initialization fails', () => {
      const error = new Error('Initialization failed');
      (AutoFillHandler as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => coordinator.initialize()).toThrow('Initialization failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize content script coordinator',
        error
      );
    });
  });

  describe('initializeAutoFillHandler', () => {
    it('should create AutoFillHandler and call handlePageLoad', () => {
      coordinator.initialize();

      const autoFillHandlerInstance = (AutoFillHandler as jest.Mock).mock.results[0].value;
      expect(autoFillHandlerInstance.handlePageLoad).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('AutoFillHandler initialized');
    });
  });

  describe('initializeMessageRouter', () => {
    it('should create MessageRouter and register handlers', () => {
      coordinator.initialize();

      expect(MessageRouter).toHaveBeenCalledWith(mockLogger);

      const messageRouterInstance = (MessageRouter as jest.Mock).mock.results[0].value;
      expect(messageRouterInstance.registerHandler).toHaveBeenCalledWith(
        MessageTypes.GET_XPATH,
        expect.any(Object)
      );
      expect(messageRouterInstance.registerHandler).toHaveBeenCalledWith(
        MessageTypes.SHOW_XPATH_DIALOG,
        expect.any(Object)
      );
      expect(messageRouterInstance.startListening).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'MessageRouter initialized with XPath and dialog handlers'
      );
    });
  });

  describe('registerContextMenuListener', () => {
    it('should register contextmenu event listener', () => {
      coordinator.initialize();

      expect(contextmenuListeners).toHaveLength(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Context menu listener registered');
    });

    it('should log context menu events', () => {
      coordinator.initialize();

      const event = new MouseEvent('contextmenu', {
        clientX: 150,
        clientY: 250,
      });
      Object.defineProperty(event, 'target', {
        value: document.createElement('div'),
        writable: false,
      });

      contextmenuListeners[0](event);

      expect(mockLogger.debug).toHaveBeenCalledWith('Context menu event captured', {
        target: 'DIV',
        x: 150,
        y: 250,
      });
    });
  });

  describe('registerProgressUpdateListener', () => {
    it('should register browser.runtime.onMessage listener', () => {
      coordinator.initialize();

      expect(runtimeMessageListeners).toHaveLength(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Progress update listener registered');
    });

    it('should handle progress update message', () => {
      coordinator.initialize();

      const listener = runtimeMessageListeners[0];

      const message = {
        action: MessageTypes.UPDATE_AUTO_FILL_PROGRESS,
        current: 5,
        total: 10,
        description: 'Processing',
      };

      listener(message);

      expect(mockPresenter.handleProgressUpdate).toHaveBeenCalledWith(5, 10, 'Processing');
    });

    it('should ignore non-progress messages', () => {
      coordinator.initialize();

      const listener = runtimeMessageListeners[0];

      const message = {
        action: 'OTHER_MESSAGE',
        data: 'test',
      };

      listener(message);

      expect(mockPresenter.handleProgressUpdate).not.toHaveBeenCalled();
    });

    it('should handle progress update without description', () => {
      coordinator.initialize();

      const listener = runtimeMessageListeners[0];

      const message = {
        action: MessageTypes.UPDATE_AUTO_FILL_PROGRESS,
        current: 3,
        total: 7,
      };

      listener(message);

      expect(mockPresenter.handleProgressUpdate).toHaveBeenCalledWith(3, 7, undefined);
    });

    it('should log error when handleProgressUpdate fails', async () => {
      const error = new Error('Progress update failed');
      mockPresenter.handleProgressUpdate.mockRejectedValue(error);

      coordinator.initialize();

      const listener = runtimeMessageListeners[0];

      const message = {
        action: MessageTypes.UPDATE_AUTO_FILL_PROGRESS,
        current: 5,
        total: 10,
      };

      listener(message);

      // Wait for async error handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to handle progress update', error);
    });
  });

  describe('initializeMediaRecorder', () => {
    it('should create ContentScriptMediaRecorder', () => {
      coordinator.initialize();

      expect(ContentScriptMediaRecorder).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('ContentScriptMediaRecorder initialized');
    });
  });

  describe('cleanup', () => {
    it('should call presenter cleanup', () => {
      coordinator.cleanup();

      expect(mockPresenter.cleanup).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup before initialization', () => {
      expect(() => coordinator.cleanup()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle null target in contextmenu event', () => {
      coordinator.initialize();

      const event = new MouseEvent('contextmenu', {
        clientX: 150,
        clientY: 250,
      });
      Object.defineProperty(event, 'target', {
        value: null,
        writable: false,
      });

      expect(() => contextmenuListeners[0](event)).not.toThrow();
    });

    it('should handle invalid message object', () => {
      coordinator.initialize();

      const listener = runtimeMessageListeners[0];

      // Invalid message types
      listener(null);
      listener(undefined);
      listener('string');
      listener(123);
      listener([]);

      expect(mockPresenter.handleProgressUpdate).not.toHaveBeenCalled();
    });

    it('should handle message without action property', () => {
      coordinator.initialize();

      const listener = runtimeMessageListeners[0];

      const message = {
        current: 5,
        total: 10,
      };

      listener(message);

      expect(mockPresenter.handleProgressUpdate).not.toHaveBeenCalled();
    });

    it('should return undefined from progress update listener', () => {
      coordinator.initialize();

      const listener = runtimeMessageListeners[0];

      const message = {
        action: MessageTypes.UPDATE_AUTO_FILL_PROGRESS,
        current: 5,
        total: 10,
      };

      const result = listener(message);

      expect(result).toBeUndefined();
    });
  });
});
