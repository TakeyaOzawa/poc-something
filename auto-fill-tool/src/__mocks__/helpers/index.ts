export * from './MockSecureStorage';
export { createTestXPathData } from './testHelpers';

export class MockLockoutManager {
  public recordSuccessfulAttemptCalled = false;
  public recordFailedAttemptCalled = false;
  public isLockedState = false;
  public isLockedOutState = false;
  public remainingAttempts = 3;

  reset(): void {
    this.recordSuccessfulAttemptCalled = false;
    this.recordFailedAttemptCalled = false;
    this.isLockedState = false;
    this.isLockedOutState = false;
    this.remainingAttempts = 3;
  }

  async isLocked(): Promise<boolean> {
    return this.isLockedState;
  }

  async isLockedOut(): Promise<boolean> {
    return this.isLockedOutState;
  }

  async lock(): Promise<void> {
    this.isLockedState = true;
  }

  async unlock(): Promise<boolean> {
    this.isLockedState = false;
    return true;
  }

  async recordSuccessfulAttempt(): Promise<void> {
    this.recordSuccessfulAttemptCalled = true;
  }

  async recordFailedAttempt(): Promise<void> {
    this.recordFailedAttemptCalled = true;
  }

  async getRemainingLockoutTime(): Promise<number> {
    return 0;
  }

  async getFailedAttempts(): Promise<number> {
    return 0;
  }

  async getRemainingAttempts(): Promise<number> {
    return this.remainingAttempts;
  }

  async getLockoutDuration(): Promise<number> {
    return 300000;
  }

  setLockedOut(state: boolean): void {
    this.isLockedOutState = state;
  }

  setLocked(state: boolean): void {
    this.isLockedState = state;
  }

  setRemainingAttempts(attempts: number): void {
    this.remainingAttempts = attempts;
  }

  async getStatus(): Promise<{ isLockedOut: boolean; lockoutEndsAt: number | null; remainingAttempts?: number }> {
    return {
      isLockedOut: this.isLockedOutState,
      lockoutEndsAt: this.isLockedOutState ? Date.now() + 300000 : null,
      ...(this.remainingAttempts !== undefined && { remainingAttempts: this.remainingAttempts })
    };
  }
}
