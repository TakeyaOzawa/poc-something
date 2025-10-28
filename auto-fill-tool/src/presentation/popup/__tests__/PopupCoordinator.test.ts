/**
 * Unit Tests: PopupCoordinator
 */

import { PopupCoordinator } from '../PopupCoordinator';
import Alpine from '@alpinejs/csp';
import { initPopupAlpine } from '../PopupAlpine';
import type { PopupCoordinatorDependencies } from '../../types';

jest.mock('@alpinejs/csp');
jest.mock('../PopupAlpine');

describe('PopupCoordinator', () => {
  let mockDependencies: PopupCoordinatorDependencies;
  let mockWebsiteListPresenter: any;
  let mockLogger: any;
  let mockSettings: any;
  let mockOnDataSyncRequest: jest.Mock;
  let websiteActionListeners: Array<(event: Event) => void>;
  let dataSyncRequestListeners: Array<(event: Event) => void>;

  beforeEach(() => {
    // Reset timers
    jest.useFakeTimers();

    // Mock dependencies
    mockWebsiteListPresenter = {
      handleWebsiteAction: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    };

    mockSettings = {
      getGradientStartColor: jest.fn().mockReturnValue('#667eea'),
      getGradientEndColor: jest.fn().mockReturnValue('#764ba2'),
      getGradientAngle: jest.fn().mockReturnValue(135),
    };

    mockOnDataSyncRequest = jest.fn();

    mockDependencies = {
      websiteListPresenter: mockWebsiteListPresenter,
      logger: mockLogger,
      settings: mockSettings,
      onDataSyncRequest: mockOnDataSyncRequest,
    };

    // Track event listeners
    websiteActionListeners = [];
    dataSyncRequestListeners = [];

    const originalAddEventListener = window.addEventListener;
    jest.spyOn(window, 'addEventListener').mockImplementation((event: string, listener: any) => {
      if (event === 'websiteAction') {
        websiteActionListeners.push(listener);
      } else if (event === 'dataSyncRequest') {
        dataSyncRequestListeners.push(listener);
      } else {
        originalAddEventListener.call(window, event, listener);
      }
    });

    // Mock Alpine.js
    (Alpine as any).start = jest.fn();
    (window as any).Alpine = undefined;

    // Mock document.body
    Object.defineProperty(document.body.style, 'background', {
      writable: true,
      configurable: true,
      value: '',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    websiteActionListeners = [];
    dataSyncRequestListeners = [];
    (window as any).Alpine = undefined;
    document.body.style.background = '';
  });

  describe('constructor', () => {
    it('should store dependencies', () => {
      const coordinator = new PopupCoordinator(mockDependencies);

      expect(coordinator).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);

      // Mock gradient background verification
      document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

      await coordinator.initialize();

      expect(window.Alpine).toBe(Alpine);
      expect(initPopupAlpine).toHaveBeenCalled();
      expect(Alpine.start).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Popup Coordinator initialized');
      expect(mockLogger.debug).toHaveBeenCalledWith('Alpine.js initialized');
      expect(websiteActionListeners).toHaveLength(1);
      expect(dataSyncRequestListeners).toHaveLength(1);
    });

    it('should log error and throw when initialization fails', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);
      const error = new Error('Alpine init failed');
      (Alpine.start as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(coordinator.initialize()).rejects.toThrow('Alpine init failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize Popup Coordinator',
        error
      );
    });
  });

  describe('initializeAlpine', () => {
    it('should set window.Alpine and start Alpine.js', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);
      document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

      await coordinator.initialize();

      expect(window.Alpine).toBe(Alpine);
      expect(initPopupAlpine).toHaveBeenCalled();
      expect(Alpine.start).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Alpine.js initialized');
    });

    it('should log error when Alpine.js initialization fails', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);
      const error = new Error('Alpine start failed');
      (Alpine.start as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(coordinator.initialize()).rejects.toThrow('Alpine start failed');

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize Alpine.js', error);
    });
  });

  describe('applyGradientBackgroundWithRetry', () => {
    it('should apply gradient background on first attempt', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);

      // Mock successful gradient application
      document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

      await coordinator.initialize();

      expect(document.body.style.background).toContain('linear-gradient');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Gradient background applied successfully on attempt 1'
      );
    });

    it('should retry gradient application on failure', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);

      // Simulate failure on first attempt, success on second
      let callCount = 0;
      Object.defineProperty(document.body.style, 'background', {
        get: () => {
          callCount++;
          return callCount > 1 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '';
        },
        set: jest.fn(),
        configurable: true,
      });

      const initPromise = coordinator.initialize();

      // Run all timers to completion
      await jest.runAllTimersAsync();
      await initPromise;

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Gradient background applied successfully on attempt 2'
      );
    });

    it('should log error after all retries fail', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);

      // Simulate failure on all attempts
      Object.defineProperty(document.body.style, 'background', {
        get: () => '',
        set: jest.fn(),
        configurable: true,
      });

      const initPromise = coordinator.initialize();

      // Run all timers to completion
      await jest.runAllTimersAsync();
      await initPromise;

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to apply gradient background after all retries'
      );
    });

    it('should handle errors during gradient application', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);
      const error = new Error('Style application failed');

      mockSettings.getGradientStartColor.mockImplementation(() => {
        throw error;
      });

      const initPromise = coordinator.initialize();

      // Run all timers to completion
      await jest.runAllTimersAsync();
      await initPromise;

      // applyGradientBackground() catches errors internally and logs them as error
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to apply gradient background', error);
      // After all retries fail, logs final error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to apply gradient background after all retries'
      );
    });
  });

  describe('applyGradientBackground', () => {
    it('should apply gradient with correct colors and angle', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);

      // Mock successful gradient application
      document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

      await coordinator.initialize();

      expect(mockSettings.getGradientStartColor).toHaveBeenCalled();
      expect(mockSettings.getGradientEndColor).toHaveBeenCalled();
      expect(mockSettings.getGradientAngle).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Applied gradient background', {
        startColor: '#667eea',
        endColor: '#764ba2',
        angle: 135,
      });
    });

    it('should log error when gradient application fails', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);
      const error = new Error('Failed to get color');

      mockSettings.getGradientStartColor.mockImplementation(() => {
        throw error;
      });

      const initPromise = coordinator.initialize();

      // Run all timers to completion
      await jest.runAllTimersAsync();
      await initPromise;

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to apply gradient background', error);
    });
  });

  describe('attachAlpineEventListeners', () => {
    let coordinator: PopupCoordinator;

    beforeEach(async () => {
      coordinator = new PopupCoordinator(mockDependencies);
      document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      await coordinator.initialize();
    });

    it('should attach websiteAction event listener', () => {
      expect(websiteActionListeners).toHaveLength(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Alpine.js event listeners attached');
    });

    it('should attach dataSyncRequest event listener', () => {
      expect(dataSyncRequestListeners).toHaveLength(1);
    });

    it('should handle execute action', async () => {
      const event = new CustomEvent('websiteAction', {
        detail: { action: 'execute', id: 'website-123' },
      });

      websiteActionListeners[0](event);
      await Promise.resolve(); // Wait for async handler

      expect(mockLogger.info).toHaveBeenCalledWith('Alpine.js website action', {
        action: 'execute',
        id: 'website-123',
      });
      expect(mockWebsiteListPresenter.handleWebsiteAction).toHaveBeenCalledWith(
        'execute',
        'website-123'
      );
    });

    it('should handle edit action', async () => {
      const event = new CustomEvent('websiteAction', {
        detail: { action: 'edit', id: 'website-456' },
      });

      websiteActionListeners[0](event);
      await Promise.resolve();

      expect(mockLogger.info).toHaveBeenCalledWith('Alpine.js website action', {
        action: 'edit',
        id: 'website-456',
      });
      expect(mockWebsiteListPresenter.handleWebsiteAction).toHaveBeenCalledWith(
        'edit',
        'website-456'
      );
    });

    it('should handle delete action', async () => {
      const event = new CustomEvent('websiteAction', {
        detail: { action: 'delete', id: 'website-789' },
      });

      websiteActionListeners[0](event);
      await Promise.resolve();

      expect(mockLogger.info).toHaveBeenCalledWith('Alpine.js website action', {
        action: 'delete',
        id: 'website-789',
      });
      expect(mockWebsiteListPresenter.handleWebsiteAction).toHaveBeenCalledWith(
        'delete',
        'website-789'
      );
    });

    it('should not handle unknown action', async () => {
      const event = new CustomEvent('websiteAction', {
        detail: { action: 'unknown', id: 'website-999' },
      });

      websiteActionListeners[0](event);
      await Promise.resolve();

      expect(mockLogger.info).toHaveBeenCalledWith('Alpine.js website action', {
        action: 'unknown',
        id: 'website-999',
      });
      expect(mockWebsiteListPresenter.handleWebsiteAction).not.toHaveBeenCalled();
    });

    it('should handle dataSyncRequest event', async () => {
      const event = new CustomEvent('dataSyncRequest');

      dataSyncRequestListeners[0](event);
      await Promise.resolve();

      expect(mockLogger.info).toHaveBeenCalledWith('Alpine.js data sync request received');
      expect(mockOnDataSyncRequest).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple retries with increasing delays', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);

      // Simulate failure on first 2 attempts, success on third
      let callCount = 0;
      Object.defineProperty(document.body.style, 'background', {
        get: () => {
          callCount++;
          return callCount > 2 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '';
        },
        set: jest.fn(),
        configurable: true,
      });

      const initPromise = coordinator.initialize();

      // Run all timers to completion
      await jest.runAllTimersAsync();
      await initPromise;

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Gradient background applied successfully on attempt 3'
      );
    });

    it('should handle empty CustomEvent detail', async () => {
      const coordinator = new PopupCoordinator(mockDependencies);
      document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      await coordinator.initialize();

      const event = new CustomEvent('websiteAction', {
        detail: {},
      });

      websiteActionListeners[0](event);
      await Promise.resolve();

      expect(mockLogger.info).toHaveBeenCalledWith('Alpine.js website action', {});
      expect(mockWebsiteListPresenter.handleWebsiteAction).not.toHaveBeenCalled();
    });

    it('should handle gradient background with different settings', async () => {
      mockSettings.getGradientStartColor.mockReturnValue('#FF6B6B');
      mockSettings.getGradientEndColor.mockReturnValue('#4ECDC4');
      mockSettings.getGradientAngle.mockReturnValue(90);

      const coordinator = new PopupCoordinator(mockDependencies);
      document.body.style.background = 'linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 100%)';

      await coordinator.initialize();

      expect(mockLogger.debug).toHaveBeenCalledWith('Applied gradient background', {
        startColor: '#FF6B6B',
        endColor: '#4ECDC4',
        angle: 90,
      });
    });
  });
});
