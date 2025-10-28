import { CheckerState, CheckerStatus } from '../CheckerState';

describe('CheckerState', () => {
  describe('constructor', () => {
    it('should create a CheckerState with default values', () => {
      const state = new CheckerState(CheckerStatus.IDLE);

      expect(state.status).toBe(CheckerStatus.IDLE);
      expect(state.lastCheckTime).toBeNull();
      expect(state.checkCount).toBe(0);
      expect(state.tabId).toBeNull();
    });

    it('should create a CheckerState with all values', () => {
      const lastCheckTime = new Date();
      const state = new CheckerState(CheckerStatus.RUNNING, lastCheckTime, 5, 123);

      expect(state.status).toBe(CheckerStatus.RUNNING);
      expect(state.lastCheckTime).toEqual(lastCheckTime);
      expect(state.checkCount).toBe(5);
      expect(state.tabId).toBe(123);
    });

    // Validation tests
    it('should throw error for negative check count', () => {
      expect(() => new CheckerState(CheckerStatus.IDLE, null, -1, null)).toThrow(
        'Check count must be non-negative'
      );
    });

    it('should throw error for zero tab ID', () => {
      expect(() => new CheckerState(CheckerStatus.RUNNING, null, 0, 0)).toThrow(
        'Tab ID must be a positive integer'
      );
    });

    it('should throw error for negative tab ID', () => {
      expect(() => new CheckerState(CheckerStatus.RUNNING, null, 0, -1)).toThrow(
        'Tab ID must be a positive integer'
      );
    });

    it('should throw error for RUNNING status without tab ID', () => {
      expect(() => new CheckerState(CheckerStatus.RUNNING, null, 0, null)).toThrow(
        'Tab ID is required when status is RUNNING'
      );
    });

    it('should throw error for invalid Date object', () => {
      const invalidDate = new Date('invalid');
      expect(() => new CheckerState(CheckerStatus.IDLE, invalidDate, 0, null)).toThrow(
        'Last check time must be a valid Date'
      );
    });

    it('should accept IDLE status without tab ID', () => {
      expect(() => new CheckerState(CheckerStatus.IDLE, null, 0, null)).not.toThrow();
    });

    it('should accept PAUSED status without tab ID', () => {
      expect(() => new CheckerState(CheckerStatus.PAUSED, null, 0, null)).not.toThrow();
    });

    it('should accept PAUSED status with tab ID', () => {
      expect(() => new CheckerState(CheckerStatus.PAUSED, null, 0, 123)).not.toThrow();
    });

    it('should accept zero check count', () => {
      expect(() => new CheckerState(CheckerStatus.IDLE, null, 0, null)).not.toThrow();
    });

    it('should accept valid Date object', () => {
      const validDate = new Date('2025-01-20');
      expect(() => new CheckerState(CheckerStatus.IDLE, validDate, 0, null)).not.toThrow();
    });
  });

  describe('isRunning', () => {
    it('should return true when status is RUNNING', () => {
      const state = new CheckerState(CheckerStatus.RUNNING, null, 0, 123);
      expect(state.isRunning()).toBe(true);
    });

    it('should return false when status is not RUNNING', () => {
      const state = new CheckerState(CheckerStatus.IDLE);
      expect(state.isRunning()).toBe(false);
    });
  });

  describe('isIdle', () => {
    it('should return true when status is IDLE', () => {
      const state = new CheckerState(CheckerStatus.IDLE);
      expect(state.isIdle()).toBe(true);
    });

    it('should return false when status is not IDLE', () => {
      const state = new CheckerState(CheckerStatus.RUNNING, null, 0, 123);
      expect(state.isIdle()).toBe(false);
    });
  });

  describe('start', () => {
    it('should return new state with RUNNING status and tabId', () => {
      const state = new CheckerState(CheckerStatus.IDLE, null, 5, null);
      const newState = state.start(123);

      expect(newState).not.toBe(state); // Different instance
      expect(newState.status).toBe(CheckerStatus.RUNNING);
      expect(newState.tabId).toBe(123);
      expect(newState.checkCount).toBe(5); // Preserved
    });

    it('should throw error for zero tab ID', () => {
      const state = new CheckerState(CheckerStatus.IDLE, null, 0, null);
      expect(() => state.start(0)).toThrow('Tab ID must be a positive integer');
    });

    it('should throw error for negative tab ID', () => {
      const state = new CheckerState(CheckerStatus.IDLE, null, 0, null);
      expect(() => state.start(-1)).toThrow('Tab ID must be a positive integer');
    });
  });

  describe('stop', () => {
    it('should return new state with IDLE status and null tabId', () => {
      const lastCheckTime = new Date();
      const state = new CheckerState(CheckerStatus.RUNNING, lastCheckTime, 10, 123);
      const newState = state.stop();

      expect(newState).not.toBe(state); // Different instance
      expect(newState.status).toBe(CheckerStatus.IDLE);
      expect(newState.tabId).toBeNull();
      expect(newState.checkCount).toBe(10); // Preserved
      expect(newState.lastCheckTime).toEqual(lastCheckTime); // Preserved
    });
  });

  describe('incrementCheckCount', () => {
    it('should return new state with incremented check count and updated time', () => {
      const oldTime = new Date('2025-01-01');
      const state = new CheckerState(CheckerStatus.RUNNING, oldTime, 5, 123);

      const newState = state.incrementCheckCount();

      expect(newState).not.toBe(state); // Different instance
      expect(newState.checkCount).toBe(6);
      expect(newState.lastCheckTime).not.toEqual(oldTime);
      expect(newState.lastCheckTime).toBeInstanceOf(Date);
      expect(newState.status).toBe(CheckerStatus.RUNNING); // Preserved
      expect(newState.tabId).toBe(123); // Preserved
    });
  });
});
