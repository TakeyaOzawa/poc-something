/**
 * Unit tests for UnlockPresenter
 * Tests business logic orchestration, timers, and background communication
 */

import { UnlockPresenter } from '../UnlockPresenter';
import { UnlockStatus } from '@domain/values/UnlockStatus';
import type { UnlockView } from '../../types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
  },
  i18n: {
    getMessage: jest.fn((key: string) => `mock_${key}`),
  },
} as any;

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('UnlockPresenter', () => {
  let presenter: UnlockPresenter;
  let mockView: jest.Mocked<UnlockView>;

  beforeEach(() => {
    jest.useFakeTimers();

    // Create mock view with all required methods
    mockView = {
      getPassword: jest.fn(),
      clearPassword: jest.fn(),
      showMessage: jest.fn(),
      hideMessage: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      enableUnlockButton: jest.fn(),
      disableUnlockButton: jest.fn(),
      showUnlockForm: jest.fn(),
      hideUnlockForm: jest.fn(),
      showStatusIndicator: jest.fn(),
      hideStatusIndicator: jest.fn(),
      showSessionInfo: jest.fn(),
      hideSessionInfo: jest.fn(),
      updateSessionTimer: jest.fn(),
      updateLockoutTimer: jest.fn(),
      showAttemptsRemaining: jest.fn(),
      hideAttemptsRemaining: jest.fn(),
      markPasswordError: jest.fn(),
      clearPasswordError: jest.fn(),
      focusPassword: jest.fn(),
      onUnlockClick: jest.fn(),
      onPasswordInput: jest.fn(),
      onPasswordEnter: jest.fn(),
      onForgotPasswordClick: jest.fn(),
      onStorageMessage: jest.fn(),
    };

    // Reset chrome API mocks
    (chrome.runtime.sendMessage as jest.Mock).mockClear();
    (chrome.i18n.getMessage as jest.Mock).mockClear();

    presenter = new UnlockPresenter({ view: mockView });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with view dependency', () => {
      expect(presenter).toBeDefined();
    });
  });

  describe('init', () => {
    it('should register all event handlers', () => {
      presenter.init();

      expect(mockView.onUnlockClick).toHaveBeenCalledWith(expect.any(Function));
      expect(mockView.onPasswordInput).toHaveBeenCalledWith(expect.any(Function));
      expect(mockView.onPasswordEnter).toHaveBeenCalledWith(expect.any(Function));
      expect(mockView.onForgotPasswordClick).toHaveBeenCalledWith(expect.any(Function));
      expect(mockView.onStorageMessage).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should check initial unlock status', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        status: {
          isLockedOut: false,
          isUnlocked: false,
          lockoutExpiresAt: null,
          sessionExpiresAt: null,
        },
      });

      presenter.init();

      // Wait for async checkUnlockStatus to complete
      await Promise.resolve();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'checkUnlockStatus',
      });
    });
  });

  describe('handlePasswordInput', () => {
    it('should hide message, clear error, and hide attempts', () => {
      presenter.handlePasswordInput();

      expect(mockView.hideMessage).toHaveBeenCalled();
      expect(mockView.clearPasswordError).toHaveBeenCalled();
      expect(mockView.hideAttemptsRemaining).toHaveBeenCalled();
    });
  });

  describe('handleForgotPasswordClick', () => {
    it('should show forgot password warning', () => {
      presenter.handleForgotPasswordClick();

      expect(mockView.showMessage).toHaveBeenCalledWith(
        'mock_unlock_forgotPasswordWarning',
        'warning'
      );
    });
  });

  describe('handleStorageMessage', () => {
    it('should handle sessionExpired message', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        status: { isLockedOut: false, isUnlocked: false },
      });

      presenter.handleStorageMessage('sessionExpired');

      expect(mockView.showMessage).toHaveBeenCalledWith(
        'mock_unlock_sessionExpiredMessage',
        'warning'
      );

      await Promise.resolve();
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'checkUnlockStatus',
      });
    });

    it('should handle storageLocked message', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        status: { isLockedOut: false, isUnlocked: false },
      });

      presenter.handleStorageMessage('storageLocked');

      expect(mockView.showMessage).toHaveBeenCalledWith(
        'mock_unlock_storageLockedMessage',
        'warning'
      );

      await Promise.resolve();
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'checkUnlockStatus',
      });
    });
  });

  describe('handleUnlockClick', () => {
    it('should show error if password is empty', async () => {
      mockView.getPassword.mockReturnValue('');

      await presenter.handleUnlockClick();

      expect(mockView.showMessage).toHaveBeenCalledWith('mock_unlock_enterPassword', 'error');
      expect(mockView.focusPassword).toHaveBeenCalled();
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle successful unlock', async () => {
      mockView.getPassword.mockReturnValue('correct-password');
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({
          success: true,
          status: {
            isLockedOut: false,
            isUnlocked: true,
            sessionExpiresAt: '2025-01-01T12:00:00Z',
          },
        });

      await presenter.handleUnlockClick();

      // Verify UI preparation
      expect(mockView.hideMessage).toHaveBeenCalled();
      expect(mockView.clearPasswordError).toHaveBeenCalled();
      expect(mockView.disableUnlockButton).toHaveBeenCalled();
      expect(mockView.showLoading).toHaveBeenCalled();

      // Verify unlock request
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'unlockStorage',
        password: 'correct-password',
      });

      // Verify success UI
      expect(mockView.hideLoading).toHaveBeenCalled();
      expect(mockView.showMessage).toHaveBeenCalledWith('mock_unlock_successMessage', 'success');
      expect(mockView.clearPassword).toHaveBeenCalled();

      // Wait for setTimeout callback
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Verify status check after success
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'checkUnlockStatus',
      });
    });

    it('should handle failed unlock with remaining attempts', async () => {
      mockView.getPassword.mockReturnValue('wrong-password');
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({
          success: false,
          error: 'Invalid password',
          remainingAttempts: 3,
        })
        .mockResolvedValueOnce({
          success: true,
          status: { isLockedOut: false, isUnlocked: false },
        });

      await presenter.handleUnlockClick();

      expect(mockView.hideLoading).toHaveBeenCalled();
      expect(mockView.enableUnlockButton).toHaveBeenCalled();
      expect(mockView.markPasswordError).toHaveBeenCalled();
      expect(mockView.showMessage).toHaveBeenCalledWith('Invalid password', 'error');
      expect(mockView.showAttemptsRemaining).toHaveBeenCalledWith(3);
      expect(mockView.focusPassword).toHaveBeenCalled();

      await Promise.resolve();
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'checkUnlockStatus',
      });
    });

    it('should not show attempts if remaining attempts is 0', async () => {
      mockView.getPassword.mockReturnValue('wrong-password');
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({
          success: false,
          error: 'Too many attempts',
          remainingAttempts: 0,
        })
        .mockResolvedValueOnce({
          success: true,
          status: { isLockedOut: true, lockoutExpiresAt: '2025-01-01T12:05:00Z' },
        });

      await presenter.handleUnlockClick();

      expect(mockView.showAttemptsRemaining).not.toHaveBeenCalled();
    });

    it('should not show attempts if remaining attempts is undefined', async () => {
      mockView.getPassword.mockReturnValue('wrong-password');
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({
          success: false,
          error: 'Invalid password',
        })
        .mockResolvedValueOnce({
          success: true,
          status: { isLockedOut: false, isUnlocked: false },
        });

      await presenter.handleUnlockClick();

      expect(mockView.showAttemptsRemaining).not.toHaveBeenCalled();
    });

    it('should handle unlock error exception', async () => {
      mockView.getPassword.mockReturnValue('password');
      const error = new Error('Network error');
      (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue(error);

      await presenter.handleUnlockClick();

      expect(mockView.hideLoading).toHaveBeenCalled();
      expect(mockView.enableUnlockButton).toHaveBeenCalled();
      expect(mockView.showMessage).toHaveBeenCalledWith('mock_common_error Network error', 'error');
    });
  });

  describe('checkUnlockStatus', () => {
    it('should handle locked status', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        status: {
          isLockedOut: false,
          isUnlocked: false,
          lockoutExpiresAt: null,
          sessionExpiresAt: null,
        },
      });

      await presenter.checkUnlockStatus();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'checkUnlockStatus',
      });

      // Verify locked UI state
      expect(mockView.showUnlockForm).toHaveBeenCalled();
      expect(mockView.hideStatusIndicator).toHaveBeenCalled();
      expect(mockView.hideSessionInfo).toHaveBeenCalled();
      expect(mockView.focusPassword).toHaveBeenCalled();
    });

    it('should handle unlocked status with session timer', async () => {
      const expiresAt = new Date(Date.now() + 300000).toISOString(); // 5 minutes from now
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        status: {
          isLockedOut: false,
          isUnlocked: true,
          lockoutExpiresAt: null,
          sessionExpiresAt: expiresAt,
        },
      });

      await presenter.checkUnlockStatus();

      // Verify unlocked UI state
      expect(mockView.hideUnlockForm).toHaveBeenCalled();
      expect(mockView.showStatusIndicator).toHaveBeenCalledWith(
        'mock_unlock_alreadyUnlocked',
        'unlocked'
      );
      expect(mockView.showSessionInfo).toHaveBeenCalled();

      // Verify session timer started
      expect(mockView.updateSessionTimer).toHaveBeenCalled();
    });

    it('should handle locked out status with lockout timer', async () => {
      const expiresAt = new Date(Date.now() + 300000).toISOString(); // 5 minutes from now
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        status: {
          isLockedOut: true,
          isUnlocked: false,
          lockoutExpiresAt: expiresAt,
          sessionExpiresAt: null,
        },
      });

      await presenter.checkUnlockStatus();

      // Verify locked out UI state
      expect(mockView.hideUnlockForm).toHaveBeenCalled();
      expect(mockView.showStatusIndicator).toHaveBeenCalledWith('', 'locked-out');

      // Verify lockout timer started
      expect(mockView.updateLockoutTimer).toHaveBeenCalled();
    });

    it('should handle status check error', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Status check failed',
      });

      await presenter.checkUnlockStatus();

      expect(mockView.showMessage).toHaveBeenCalledWith('Status check failed', 'error');
    });

    it('should handle status check exception', async () => {
      const error = new Error('Network timeout');
      (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue(error);

      await presenter.checkUnlockStatus();

      expect(mockView.showMessage).toHaveBeenCalledWith(
        'mock_common_error Network timeout',
        'error'
      );
    });
  });

  describe('Timer management', () => {
    describe('Session timer', () => {
      it('should update session timer at 1-second intervals', async () => {
        const expiresAt = new Date(Date.now() + 300000).toISOString();
        (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
          success: true,
          status: { isLockedOut: false, isUnlocked: true, sessionExpiresAt: expiresAt },
        });

        await presenter.checkUnlockStatus();

        // Initial call
        expect(mockView.updateSessionTimer).toHaveBeenCalledTimes(1);

        // Advance 3 seconds
        jest.advanceTimersByTime(3000);
        expect(mockView.updateSessionTimer).toHaveBeenCalledTimes(4); // 1 initial + 3 intervals
      });

      it('should reload status when session expires', async () => {
        const expiresAt = new Date(Date.now() + 2000).toISOString(); // 2 seconds
        (chrome.runtime.sendMessage as jest.Mock)
          .mockResolvedValueOnce({
            success: true,
            status: { isLockedOut: false, isUnlocked: true, sessionExpiresAt: expiresAt },
          })
          .mockResolvedValueOnce({
            success: true,
            status: { isLockedOut: false, isUnlocked: false },
          });

        await presenter.checkUnlockStatus();

        // Advance past expiration
        jest.advanceTimersByTime(3000);
        await Promise.resolve();

        // Should reload status
        expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
        expect(chrome.runtime.sendMessage).toHaveBeenLastCalledWith({
          action: 'checkUnlockStatus',
        });
      });

      it('should clear session timer when switching status', async () => {
        const expiresAt = new Date(Date.now() + 300000).toISOString();
        (chrome.runtime.sendMessage as jest.Mock)
          .mockResolvedValueOnce({
            success: true,
            status: { isLockedOut: false, isUnlocked: true, sessionExpiresAt: expiresAt },
          })
          .mockResolvedValueOnce({
            success: true,
            status: { isLockedOut: false, isUnlocked: false },
          });

        await presenter.checkUnlockStatus();
        mockView.updateSessionTimer.mockClear();

        // Change to locked status
        await presenter.checkUnlockStatus();

        // Advance time - timer should not fire anymore
        jest.advanceTimersByTime(5000);
        expect(mockView.updateSessionTimer).not.toHaveBeenCalled();
      });
    });

    describe('Lockout timer', () => {
      it('should update lockout timer at 1-second intervals', async () => {
        const expiresAt = new Date(Date.now() + 300000).toISOString();
        (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
          success: true,
          status: { isLockedOut: true, lockoutExpiresAt: expiresAt },
        });

        await presenter.checkUnlockStatus();

        // Initial call
        expect(mockView.updateLockoutTimer).toHaveBeenCalledTimes(1);

        // Advance 3 seconds
        jest.advanceTimersByTime(3000);
        expect(mockView.updateLockoutTimer).toHaveBeenCalledTimes(4); // 1 initial + 3 intervals
      });

      it('should reload status when lockout expires', async () => {
        const expiresAt = new Date(Date.now() + 2000).toISOString(); // 2 seconds
        (chrome.runtime.sendMessage as jest.Mock)
          .mockResolvedValueOnce({
            success: true,
            status: { isLockedOut: true, lockoutExpiresAt: expiresAt },
          })
          .mockResolvedValueOnce({
            success: true,
            status: { isLockedOut: false, isUnlocked: false },
          });

        await presenter.checkUnlockStatus();

        // Advance past expiration + setTimeout delay
        jest.advanceTimersByTime(3000);
        await Promise.resolve();

        // Should reload status after 500ms delay
        expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
      });

      it('should clear lockout timer when switching status', async () => {
        const expiresAt = new Date(Date.now() + 300000).toISOString();
        (chrome.runtime.sendMessage as jest.Mock)
          .mockResolvedValueOnce({
            success: true,
            status: { isLockedOut: true, lockoutExpiresAt: expiresAt },
          })
          .mockResolvedValueOnce({
            success: true,
            status: { isLockedOut: false, isUnlocked: false },
          });

        await presenter.checkUnlockStatus();
        mockView.updateLockoutTimer.mockClear();

        // Change to locked status
        await presenter.checkUnlockStatus();

        // Advance time - timer should not fire anymore
        jest.advanceTimersByTime(5000);
        expect(mockView.updateLockoutTimer).not.toHaveBeenCalled();
      });
    });
  });

  describe('cleanup', () => {
    it('should clear all timers', async () => {
      const expiresAt = new Date(Date.now() + 300000).toISOString();
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        status: { isLockedOut: false, isUnlocked: true, sessionExpiresAt: expiresAt },
      });

      await presenter.checkUnlockStatus();

      // Verify timer is running
      expect(mockView.updateSessionTimer).toHaveBeenCalledTimes(1);
      mockView.updateSessionTimer.mockClear();

      // Cleanup
      presenter.cleanup();

      // Advance time - timer should not fire
      jest.advanceTimersByTime(5000);
      expect(mockView.updateSessionTimer).not.toHaveBeenCalled();
    });
  });
});
