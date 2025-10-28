/**
 * Test Suite: BrowserSyncStateNotifier
 * Tests the browser-based sync state notifier implementation
 */

import { BrowserSyncStateNotifier } from '../BrowserSyncStateNotifier';
import { SyncState } from '@domain/entities/SyncState';
import { Logger } from '@domain/types/logger.types';
import browser from 'webextension-polyfill';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
  },
}));

describe('BrowserSyncStateNotifier', () => {
  let notifier: BrowserSyncStateNotifier;
  let mockLogger: jest.Mocked<Logger>;
  let mockState: SyncState;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    // Create notifier instance
    notifier = new BrowserSyncStateNotifier(mockLogger);

    // Create mock sync state
    mockState = SyncState.create({
      configId: 'test-config-id',
      storageKey: 'test-storage-key',
      totalSteps: 10,
    });

    // Setup default mock for sendMessage (success case)
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);
  });

  describe('initialize', () => {
    it('should initialize state and notify change', () => {
      notifier.initialize(mockState);

      expect(notifier.getCurrentState()).toBe(mockState);
      expect(mockLogger.debug).toHaveBeenCalledWith('Sync state initialized', {
        configId: 'test-config-id',
        totalSteps: 10,
      });
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'syncStateChanged',
        state: expect.objectContaining({
          configId: 'test-config-id',
          storageKey: 'test-storage-key',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update state and notify change when state exists', () => {
      notifier.initialize(mockState);
      jest.clearAllMocks();

      notifier.update((state) => {
        state.setStatus('receiving');
      });

      expect(mockState.getStatus()).toBe('receiving');
      expect(browser.runtime.sendMessage).toHaveBeenCalled();
    });

    it('should warn when trying to update without active state', () => {
      notifier.update((state) => {
        state.setStatus('receiving');
      });

      expect(mockLogger.warn).toHaveBeenCalledWith('Cannot update sync state: no active state');
      expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentState', () => {
    it('should return null when no state is initialized', () => {
      expect(notifier.getCurrentState()).toBeNull();
    });

    it('should return current state when initialized', () => {
      notifier.initialize(mockState);

      expect(notifier.getCurrentState()).toBe(mockState);
    });
  });

  describe('clear', () => {
    it('should clear current state', () => {
      notifier.initialize(mockState);
      notifier.clear();

      expect(notifier.getCurrentState()).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalledWith('Sync state cleared');
    });
  });

  describe('notifyStateChange', () => {
    it('should notify success and log debug message', async () => {
      notifier.initialize(mockState);

      // Wait for async sendMessage to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'syncStateChanged',
        state: {
          configId: 'test-config-id',
          storageKey: 'test-storage-key',
          status: 'starting',
          progress: 0,
          currentStep: 'Initializing',
          elapsedTime: expect.any(Number),
          error: undefined,
        },
      });

      // Wait for promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      // initialize() calls debug twice: once for "Sync state initialized" and once for "Sync state change notified"
      expect(mockLogger.debug).toHaveBeenCalledWith('Sync state initialized', {
        configId: 'test-config-id',
        totalSteps: 10,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('Sync state change notified', {
        configId: 'test-config-id',
        status: 'starting',
        progress: 0,
      });
    });

    it('should ignore "Could not establish connection" errors', async () => {
      const connectionError = new Error(
        'Could not establish connection. Receiving end does not exist.'
      );
      (browser.runtime.sendMessage as jest.Mock).mockRejectedValue(connectionError);

      notifier.initialize(mockState);

      // Wait for async sendMessage to reject and be caught
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should not log warning for this specific error
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should log warning for other errors', async () => {
      const otherError = new Error('Some other error');
      (browser.runtime.sendMessage as jest.Mock).mockRejectedValue(otherError);

      notifier.initialize(mockState);

      // Wait for async sendMessage to reject and be caught
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to notify sync state change', {
        error: 'Some other error',
      });
    });

    it('should handle errors without message property', async () => {
      const errorWithoutMessage = { someProperty: 'value' };
      (browser.runtime.sendMessage as jest.Mock).mockRejectedValue(errorWithoutMessage);

      notifier.initialize(mockState);

      // Wait for async sendMessage to reject and be caught
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to notify sync state change', {
        error: undefined,
      });
    });
  });

  describe('updateStatus', () => {
    it('should update status using helper method', () => {
      notifier.initialize(mockState);
      jest.clearAllMocks();

      notifier.updateStatus('receiving');

      expect(mockState.getStatus()).toBe('receiving');
      expect(browser.runtime.sendMessage).toHaveBeenCalled();
    });
  });

  describe('updateCurrentStep', () => {
    it('should update current step and increment completed steps', () => {
      notifier.initialize(mockState);
      jest.clearAllMocks();

      notifier.updateCurrentStep('Processing data');

      expect(mockState.getCurrentStep()).toBe('Processing data');
      expect(mockState.getCompletedSteps()).toBe(1);
      expect(browser.runtime.sendMessage).toHaveBeenCalled();
    });
  });

  describe('updateReceiveProgress', () => {
    it('should update receive progress without error', () => {
      notifier.initialize(mockState);
      jest.clearAllMocks();

      notifier.updateReceiveProgress('in_progress', 5, 10);

      const receiveProgress = mockState.getReceiveProgress();
      expect(receiveProgress?.status).toBe('in_progress');
      expect(receiveProgress?.currentStep).toBe(5);
      expect(receiveProgress?.totalSteps).toBe(10);
      expect(receiveProgress?.error).toBeUndefined();
      expect(browser.runtime.sendMessage).toHaveBeenCalled();
    });

    it('should update receive progress with error', () => {
      notifier.initialize(mockState);
      jest.clearAllMocks();

      notifier.updateReceiveProgress('failed', 3, 10, 'Network error');

      const receiveProgress = mockState.getReceiveProgress();
      expect(receiveProgress?.status).toBe('failed');
      expect(receiveProgress?.error).toBe('Network error');
      expect(browser.runtime.sendMessage).toHaveBeenCalled();
    });
  });

  describe('updateSendProgress', () => {
    it('should update send progress without error', () => {
      notifier.initialize(mockState);
      jest.clearAllMocks();

      notifier.updateSendProgress('in_progress', 7, 10);

      const sendProgress = mockState.getSendProgress();
      expect(sendProgress?.status).toBe('in_progress');
      expect(sendProgress?.currentStep).toBe(7);
      expect(sendProgress?.totalSteps).toBe(10);
      expect(sendProgress?.error).toBeUndefined();
      expect(browser.runtime.sendMessage).toHaveBeenCalled();
    });

    it('should update send progress with error', () => {
      notifier.initialize(mockState);
      jest.clearAllMocks();

      notifier.updateSendProgress('failed', 2, 10, 'Upload failed');

      const sendProgress = mockState.getSendProgress();
      expect(sendProgress?.status).toBe('failed');
      expect(sendProgress?.error).toBe('Upload failed');
      expect(browser.runtime.sendMessage).toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('should complete sync state', () => {
      notifier.initialize(mockState);
      jest.clearAllMocks();

      notifier.complete();

      expect(mockState.getStatus()).toBe('completed');
      expect(browser.runtime.sendMessage).toHaveBeenCalled();
    });
  });

  describe('fail', () => {
    it('should fail sync state with error message', () => {
      notifier.initialize(mockState);
      jest.clearAllMocks();

      notifier.fail('Sync failed due to timeout');

      expect(mockState.getStatus()).toBe('failed');
      expect(mockState.getError()).toBe('Sync failed due to timeout');
      expect(browser.runtime.sendMessage).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle state with error field in notifyStateChange', () => {
      mockState.fail('Test error');
      notifier.initialize(mockState);

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'syncStateChanged',
        state: expect.objectContaining({
          error: 'Test error',
        }),
      });
    });

    it('should handle multiple updates in sequence', () => {
      notifier.initialize(mockState);
      jest.clearAllMocks();

      notifier.updateStatus('receiving');
      notifier.updateCurrentStep('Step 1');
      notifier.updateCurrentStep('Step 2');
      notifier.complete();

      expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(4);
      expect(mockState.getStatus()).toBe('completed');
      expect(mockState.getCompletedSteps()).toBe(2);
    });

    it('should handle re-initialization with new state', () => {
      notifier.initialize(mockState);

      const newState = SyncState.create({
        configId: 'new-config-id',
        storageKey: 'new-storage-key',
        totalSteps: 5,
      });

      notifier.initialize(newState);

      expect(notifier.getCurrentState()).toBe(newState);
      expect(notifier.getCurrentState()?.getConfigId()).toBe('new-config-id');
    });
  });
});
