/**
 * Domain Entity: CheckerState
 * Represents the state of the booking checker
 */

export enum CheckerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
}

export class CheckerState {
  constructor(
    public readonly status: CheckerStatus,
    public readonly lastCheckTime: Date | null = null,
    public readonly checkCount: number = 0,
    public readonly tabId: number | null = null
  ) {
    this.validate();
  }

  /**
   * Validate the CheckerState
   * @throws Error if state is invalid
   */
  private validate(): void {
    // Validate checkCount
    if (this.checkCount < 0) {
      throw new Error('Check count must be non-negative');
    }

    // Validate tabId
    if (this.tabId !== null && this.tabId <= 0) {
      throw new Error('Tab ID must be a positive integer');
    }

    // Validate status-specific rules
    if (this.status === CheckerStatus.RUNNING && this.tabId === null) {
      throw new Error('Tab ID is required when status is RUNNING');
    }

    // Validate lastCheckTime (if provided)
    if (this.lastCheckTime !== null && !(this.lastCheckTime instanceof Date)) {
      throw new Error('Last check time must be a Date object');
    }

    // Validate lastCheckTime is not invalid Date
    if (this.lastCheckTime !== null && isNaN(this.lastCheckTime.getTime())) {
      throw new Error('Last check time must be a valid Date');
    }
  }

  isRunning(): boolean {
    return this.status === CheckerStatus.RUNNING;
  }

  isIdle(): boolean {
    return this.status === CheckerStatus.IDLE;
  }

  start(tabId: number): CheckerState {
    return new CheckerState(CheckerStatus.RUNNING, this.lastCheckTime, this.checkCount, tabId);
  }

  stop(): CheckerState {
    return new CheckerState(CheckerStatus.IDLE, this.lastCheckTime, this.checkCount, null);
  }

  incrementCheckCount(): CheckerState {
    return new CheckerState(this.status, new Date(), this.checkCount + 1, this.tabId);
  }
}
