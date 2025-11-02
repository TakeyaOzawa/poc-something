import { UnlockStatus } from '@domain/values/UnlockStatus';
import { Result } from '@domain/values/result.value';
import type {
  UnlockPresenter as UnlockPresenterInterface,
  UnlockView as UnlockViewInterface,
  UnlockDependencies,
  UnlockResponse,
  StatusCheckResponse,
} from '../types/unlock.types';

// i18n helper
const t = (key: string): string => chrome.i18n.getMessage(key);

/**
 * Presenter for Unlock Screen
 * Orchestrates unlock status, timers, and communication with background script
 * Coordinates View updates based on business logic
 */
export class UnlockPresenter implements UnlockPresenterInterface {
  private view: UnlockViewInterface;
  private currentStatus: UnlockStatus | null = null;
  private sessionTimerInterval: number | null = null;
  private lockoutTimerInterval: number | null = null;

  constructor(deps: UnlockDependencies) {
    this.view = deps.view;
  }

  /**
   * Initialize event listeners and load initial status
   */
  public init(): void {
    // Register event handlers
    this.view.onUnlockClick(() => this.handleUnlockClick());
    this.view.onPasswordInput(() => this.handlePasswordInput());
    this.view.onPasswordEnter(() => this.handleUnlockClick());
    this.view.onForgotPasswordClick(() => this.handleForgotPasswordClick());
    this.view.onStorageMessage((action) => this.handleStorageMessage(action));

    // Load initial unlock status
    this.checkUnlockStatus();
  }

  /**
   * Handle unlock button click
   */
  // eslint-disable-next-line max-lines-per-function -- Orchestrates unlock flow with validation, background communication, error handling, status updates, and attempts tracking. The sequential logic (validate input, send request, handle response, update UI based on result, check status, show attempts) is cohesive and splitting would harm readability.
  public async handleUnlockClick(): Promise<void> {
    const password = this.view.getPassword();

    // Validate password input
    if (!password) {
      this.view.showMessage(t('unlock_enterPassword'), 'error');
      this.view.focusPassword();
      return;
    }

    // Prepare UI for unlock attempt
    this.view.hideMessage();
    this.view.clearPasswordError();
    this.view.disableUnlockButton();
    this.view.showLoading();

    const unlockResult = await this.executeUnlock(password);
    
    this.view.hideLoading();

    unlockResult.match({
      success: (_response) => {
        this.view.showMessage(t('unlock_successMessage'), 'success');
        this.view.clearPassword();
        // Reload status after short delay
        setTimeout(() => {
          this.checkUnlockStatus();
        }, 1000);
      },
      failure: (errorData) => {
        this.view.enableUnlockButton();
        this.view.markPasswordError();
        this.view.showMessage(errorData.message, 'error');

        // Check if locked out
        this.checkUnlockStatus();

        // Show remaining attempts if available
        if (errorData.remainingAttempts !== undefined && errorData.remainingAttempts > 0) {
          const remaining = errorData.remainingAttempts;
          if (remaining <= 3) {
            this.view.showAttemptsRemaining(remaining);
          }
        }

        this.view.focusPassword();
      }
    });
  }

  /**
   * Execute unlock operation with Result pattern
   * @private
   */
  private async executeUnlock(password: string): Promise<Result<UnlockResponse, { message: string; remainingAttempts?: number }>> {
    try {
      const response: UnlockResponse = await chrome.runtime.sendMessage({
        action: 'unlockStorage',
        password: password,
      });

      if (response.success) {
        return Result.success(response);
      } else {
        const error = response.error || t('error_unlockFailed');
        return Result.failure({
          message: error,
          ...(response.remainingAttempts !== undefined && { remainingAttempts: response.remainingAttempts })
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return Result.failure({
        message: `${t('common_error')} ${errorMessage}`
      });
    }
  }

  /**
   * Handle password input changes
   */
  public handlePasswordInput(): void {
    this.view.hideMessage();
    this.view.clearPasswordError();
    this.view.hideAttemptsRemaining();
  }

  /**
   * Handle forgot password link click
   */
  public handleForgotPasswordClick(): void {
    this.view.showMessage(t('unlock_forgotPasswordWarning'), 'warning');
  }

  /**
   * Handle storage-related messages from background script
   */
  public handleStorageMessage(action: string): void {
    if (action === 'sessionExpired') {
      this.view.showMessage(t('unlock_sessionExpiredMessage'), 'warning');
      this.checkUnlockStatus();
    } else if (action === 'storageLocked') {
      this.view.showMessage(t('unlock_storageLockedMessage'), 'warning');
      this.checkUnlockStatus();
    }
  }

  /**
   * Check unlock status from background script
   */
  public async checkUnlockStatus(): Promise<void> {
    const statusResult = await this.fetchUnlockStatus();
    
    statusResult.match({
      success: (status) => {
        this.updateUI(status);
      },
      failure: (error) => {
        this.view.showMessage(error, 'error');
      }
    });
  }

  /**
   * Fetch unlock status with Result pattern
   * @private
   */
  private async fetchUnlockStatus(): Promise<Result<UnlockStatus, string>> {
    try {
      const response: StatusCheckResponse = await chrome.runtime.sendMessage({
        action: 'checkUnlockStatus',
      });

      if (response.success && response.status) {
        // Parse status from response
        const statusData = response.status;
        let status: UnlockStatus;

        if (statusData.isLockedOut && statusData.lockoutExpiresAt) {
          const expiresAt = new Date(statusData.lockoutExpiresAt);
          status = UnlockStatus.lockedOut(expiresAt);
        } else if (statusData.isUnlocked && statusData.sessionExpiresAt) {
          const expiresAt = new Date(statusData.sessionExpiresAt);
          status = UnlockStatus.unlocked(expiresAt);
        } else {
          status = UnlockStatus.locked();
        }

        return Result.success(status);
      } else {
        return Result.failure(response.error || t('error_statusCheckFailed'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return Result.failure(`${t('common_error')} ${errorMessage}`);
    }
  }

  /**
   * Update UI based on unlock status
   */
  private updateUI(status: UnlockStatus): void {
    this.currentStatus = status;

    // Clear any existing timers
    this.clearTimers();

    // Reset UI state
    this.view.hideMessage();
    this.view.hideAttemptsRemaining();

    if (status.isLockedOut) {
      // Locked out - show timer
      this.view.hideUnlockForm();
      this.view.showStatusIndicator('', 'locked-out');
      this.startLockoutTimer();
    } else if (status.isUnlocked) {
      // Already unlocked - show session info
      this.view.hideUnlockForm();
      this.view.showStatusIndicator(t('unlock_alreadyUnlocked'), 'unlocked');
      this.view.showSessionInfo();
      this.startSessionTimer();
    } else {
      // Locked - show unlock form
      this.view.showUnlockForm();
      this.view.hideStatusIndicator();
      this.view.hideSessionInfo();
      this.view.focusPassword();
    }
  }

  /**
   * Start session timer
   */
  private startSessionTimer(): void {
    this.updateSessionTimer();
    this.sessionTimerInterval = window.setInterval(() => this.updateSessionTimer(), 1000);
  }

  /**
   * Update session timer display
   */
  private updateSessionTimer(): void {
    if (!this.currentStatus || !this.currentStatus.sessionExpiresAt) {
      return;
    }

    const remaining = this.currentStatus.getRemainingSessionTime();
    this.view.updateSessionTimer(remaining);

    if (remaining <= 0) {
      // Session expired - clear timer and reload status
      if (this.sessionTimerInterval !== null) {
        clearInterval(this.sessionTimerInterval);
        this.sessionTimerInterval = null;
      }
      this.checkUnlockStatus();
    }
  }

  /**
   * Start lockout timer
   */
  private startLockoutTimer(): void {
    this.updateLockoutTimer();
    this.lockoutTimerInterval = window.setInterval(() => this.updateLockoutTimer(), 1000);
  }

  /**
   * Update lockout timer display
   */
  private updateLockoutTimer(): void {
    if (!this.currentStatus || !this.currentStatus.lockoutExpiresAt) {
      return;
    }

    const remaining = this.currentStatus.getRemainingLockoutTime();
    this.view.updateLockoutTimer(remaining);

    if (remaining <= 0) {
      // Lockout expired - clear timer and reload status
      if (this.lockoutTimerInterval !== null) {
        clearInterval(this.lockoutTimerInterval);
        this.lockoutTimerInterval = null;
      }
      setTimeout(() => this.checkUnlockStatus(), 500);
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.sessionTimerInterval !== null) {
      clearInterval(this.sessionTimerInterval);
      this.sessionTimerInterval = null;
    }
    if (this.lockoutTimerInterval !== null) {
      clearInterval(this.lockoutTimerInterval);
      this.lockoutTimerInterval = null;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.clearTimers();
  }
}
