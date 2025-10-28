/**
 * Domain Layer: Session Manager
 * Manages session state and timeout logic without storage dependencies
 */

/**
 * Session state
 */
export interface SessionState {
  isActive: boolean;
  expiresAt: number | null;
}

/**
 * Session timeout callback
 */
export type SessionTimeoutCallback = () => void;

/**
 * Session Manager
 * Pure domain logic for session management
 */
export class SessionManager {
  private isActive: boolean = false;
  private expiresAt: number | null = null;
  private timeout: number | null = null;
  private readonly sessionDuration: number;
  private onTimeoutCallback: SessionTimeoutCallback | null = null;

  /**
   * Create a session manager
   * @param sessionDurationMs Session duration in milliseconds
   */
  constructor(sessionDurationMs: number) {
    this.sessionDuration = sessionDurationMs;
  }

  /**
   * Start a new session
   * @param onTimeout Callback to invoke when session expires
   */
  startSession(onTimeout?: SessionTimeoutCallback): void {
    this.isActive = true;
    this.onTimeoutCallback = onTimeout || null;
    this.resetTimer();
  }

  /**
   * End the current session
   */
  endSession(): void {
    this.isActive = false;
    this.expiresAt = null;
    this.clearTimer();
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.isActive;
  }

  /**
   * Get session expiration time
   * @returns Expiration timestamp or null if no active session
   */
  getExpiresAt(): number | null {
    return this.expiresAt;
  }

  /**
   * Extend the session (reset timer)
   */
  extendSession(): void {
    if (this.isActive) {
      this.resetTimer();
    }
  }

  /**
   * Get session state
   */
  getState(): SessionState {
    return {
      isActive: this.isActive,
      expiresAt: this.expiresAt,
    };
  }

  /**
   * Reset the session timer
   */
  private resetTimer(): void {
    this.clearTimer();
    this.expiresAt = Date.now() + this.sessionDuration;

    this.timeout = setTimeout(() => {
      this.handleTimeout();
    }, this.sessionDuration) as any;
  }

  /**
   * Clear the session timer
   */
  private clearTimer(): void {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  /**
   * Handle session timeout
   */
  private handleTimeout(): void {
    this.isActive = false;
    this.expiresAt = null;

    if (this.onTimeoutCallback) {
      this.onTimeoutCallback();
    }
  }

  /**
   * Get remaining time in milliseconds
   * @returns Remaining time or 0 if session is not active
   */
  getRemainingTime(): number {
    if (!this.isActive || this.expiresAt === null) {
      return 0;
    }

    const remaining = this.expiresAt - Date.now();
    return Math.max(0, remaining);
  }
}
