/**
 * Type definitions for Unlock Screen
 * MVP pattern interfaces
 */

/**
 * View interface for Unlock Screen
 * Handles all DOM manipulation and UI updates
 */
export interface UnlockView {
  // Element getters
  getPassword(): string;
  clearPassword(): void;

  // Message display
  showMessage(text: string, type: 'error' | 'success' | 'warning'): void;
  hideMessage(): void;

  // Loading state
  showLoading(): void;
  hideLoading(): void;

  // Button state
  enableUnlockButton(): void;
  disableUnlockButton(): void;

  // UI visibility
  showUnlockForm(): void;
  hideUnlockForm(): void;
  showStatusIndicator(text: string, className: string): void;
  hideStatusIndicator(): void;
  showSessionInfo(): void;
  hideSessionInfo(): void;

  // Timer display
  updateSessionTimer(remainingMs: number): void;
  updateLockoutTimer(remainingMs: number): void;

  // Attempts remaining
  showAttemptsRemaining(remaining: number): void;
  hideAttemptsRemaining(): void;

  // Input state
  markPasswordError(): void;
  clearPasswordError(): void;
  focusPassword(): void;

  // Event listener registration
  onUnlockClick(handler: () => void): void;
  onPasswordInput(handler: () => void): void;
  onPasswordEnter(handler: () => void): void;
  onForgotPasswordClick(handler: () => void): void;
  onStorageMessage(handler: (action: string) => void): void;
}

/**
 * Presenter interface for Unlock Screen
 * Orchestrates business logic and coordinates View updates
 */
export interface UnlockPresenter {
  // Initialization
  init(): void;

  // Event handlers
  handleUnlockClick(): Promise<void>;
  handlePasswordInput(): void;
  handleForgotPasswordClick(): void;
  handleStorageMessage(action: string): void;

  // Status management
  checkUnlockStatus(): Promise<void>;

  // Cleanup
  cleanup(): void;
}

/**
 * Dependencies for UnlockPresenter
 */
export interface UnlockDependencies {
  view: UnlockView;
}

/**
 * Unlock response from background script
 */
export interface UnlockResponse {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
}

/**
 * Status check response from background script
 */
export interface StatusCheckResponse {
  success: boolean;
  error?: string;
  status?: {
    isLockedOut: boolean;
    isUnlocked: boolean;
    lockoutExpiresAt?: string;
    sessionExpiresAt?: string;
  };
}
