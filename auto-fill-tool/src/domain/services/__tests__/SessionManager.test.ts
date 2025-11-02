/**
 * Unit Tests: SessionManager
 */

import { SessionManager } from '../SessionManager';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  const SESSION_DURATION = 1000; // 1 second for testing

  beforeEach(() => {
    sessionManager = new SessionManager(SESSION_DURATION);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startSession', () => {
    it('should start a session', () => {
      sessionManager.startSession();

      expect(sessionManager.isSessionActive()).toBe(true);
      expect(sessionManager.getExpiresAt()).toBeGreaterThan(Date.now());
    });

    it('should set expiration time correctly', () => {
      const startTime = Date.now();
      sessionManager.startSession();

      const expiresAt = sessionManager.getExpiresAt();
      expect(expiresAt).toBeGreaterThanOrEqual(startTime + SESSION_DURATION);
      expect(expiresAt).toBeLessThanOrEqual(startTime + SESSION_DURATION + 100); // Allow 100ms tolerance
    });

    it('should call timeout callback when session expires', () => {
      const onTimeout = jest.fn();
      sessionManager.startSession(onTimeout);

      expect(sessionManager.isSessionActive()).toBe(true);

      // Fast-forward time
      jest.advanceTimersByTime(SESSION_DURATION);

      expect(sessionManager.isSessionActive()).toBe(false);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('should reset timer if session is already active', () => {
      const onTimeout = jest.fn();
      sessionManager.startSession(onTimeout);

      // Advance time by half the duration
      jest.advanceTimersByTime(SESSION_DURATION / 2);
      expect(sessionManager.isSessionActive()).toBe(true);

      // Start a new session (should reset timer)
      sessionManager.startSession(onTimeout);

      // Advance by half duration again (total time would exceed original duration)
      jest.advanceTimersByTime(SESSION_DURATION / 2);
      expect(sessionManager.isSessionActive()).toBe(true);

      // Complete the new duration
      jest.advanceTimersByTime(SESSION_DURATION / 2);
      expect(sessionManager.isSessionActive()).toBe(false);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe('endSession', () => {
    it('should end an active session', () => {
      sessionManager.startSession();
      expect(sessionManager.isSessionActive()).toBe(true);

      sessionManager.endSession();

      expect(sessionManager.isSessionActive()).toBe(false);
      expect(sessionManager.getExpiresAt()).toBeNull();
    });

    it('should clear the timeout', () => {
      const onTimeout = jest.fn();
      sessionManager.startSession(onTimeout);

      sessionManager.endSession();

      // Advance time past the duration
      jest.advanceTimersByTime(SESSION_DURATION * 2);

      // Callback should not be called
      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should be idempotent', () => {
      sessionManager.startSession();
      sessionManager.endSession();
      sessionManager.endSession(); // Call again

      expect(sessionManager.isSessionActive()).toBe(false);
    });
  });

  describe('isSessionActive', () => {
    it('should return false when no session started', () => {
      expect(sessionManager.isSessionActive()).toBe(false);
    });

    it('should return true when session is active', () => {
      sessionManager.startSession();

      expect(sessionManager.isSessionActive()).toBe(true);
    });

    it('should return false after session expires', () => {
      sessionManager.startSession();

      jest.advanceTimersByTime(SESSION_DURATION);

      expect(sessionManager.isSessionActive()).toBe(false);
    });

    it('should return false after session ends', () => {
      sessionManager.startSession();
      sessionManager.endSession();

      expect(sessionManager.isSessionActive()).toBe(false);
    });
  });

  describe('getExpiresAt', () => {
    it('should return null when no session started', () => {
      expect(sessionManager.getExpiresAt()).toBeNull();
    });

    it('should return expiration time when session is active', () => {
      sessionManager.startSession();

      const expiresAt = sessionManager.getExpiresAt();
      expect(expiresAt).not.toBeNull();
      expect(expiresAt).toBeGreaterThan(Date.now());
    });

    it('should return null after session ends', () => {
      sessionManager.startSession();
      sessionManager.endSession();

      expect(sessionManager.getExpiresAt()).toBeNull();
    });
  });

  describe('extendSession', () => {
    it('should extend active session', () => {
      sessionManager.startSession();

      const initialExpiresAt = sessionManager.getExpiresAt();

      // Advance time by half the duration
      jest.advanceTimersByTime(SESSION_DURATION / 2);

      // Extend session
      sessionManager.extendSession();

      const newExpiresAt = sessionManager.getExpiresAt();

      // New expiration should be later than initial
      expect(newExpiresAt).toBeGreaterThan(initialExpiresAt!);
    });

    it('should prevent timeout if extended', () => {
      const onTimeout = jest.fn();
      sessionManager.startSession(onTimeout);

      // Advance time by half the duration
      jest.advanceTimersByTime(SESSION_DURATION / 2);
      sessionManager.extendSession();

      // Advance by another half (would have timed out without extension)
      jest.advanceTimersByTime(SESSION_DURATION / 2);

      expect(sessionManager.isSessionActive()).toBe(true);
      expect(onTimeout).not.toHaveBeenCalled();

      // Complete the new duration
      jest.advanceTimersByTime(SESSION_DURATION / 2);

      expect(sessionManager.isSessionActive()).toBe(false);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if session is not active', () => {
      sessionManager.extendSession();

      expect(sessionManager.isSessionActive()).toBe(false);
      expect(sessionManager.getExpiresAt()).toBeNull();
    });
  });

  describe('getState', () => {
    it('should return inactive state when no session', () => {
      const state = sessionManager.getState();

      expect(state).toEqual({
        isActive: false,
        expiresAt: null,
      });
    });

    it('should return active state when session is running', () => {
      sessionManager.startSession();

      const state = sessionManager.getState();

      expect(state.isActive).toBe(true);
      expect(state.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should return inactive state after session expires', () => {
      sessionManager.startSession();

      jest.advanceTimersByTime(SESSION_DURATION);

      const state = sessionManager.getState();

      expect(state).toEqual({
        isActive: false,
        expiresAt: null,
      });
    });
  });

  describe('getRemainingTime', () => {
    it('should return 0 when no session', () => {
      expect(sessionManager.getRemainingTime()).toBe(0);
    });

    it('should return remaining time for active session', () => {
      sessionManager.startSession();

      const remaining = sessionManager.getRemainingTime();

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(SESSION_DURATION);
    });

    it('should decrease over time', () => {
      sessionManager.startSession();

      const initial = sessionManager.getRemainingTime();

      jest.advanceTimersByTime(SESSION_DURATION / 2);

      const halfway = sessionManager.getRemainingTime();

      expect(halfway).toBeLessThan(initial);
      expect(halfway).toBeGreaterThan(0);
    });

    it('should return 0 after session expires', () => {
      sessionManager.startSession();

      jest.advanceTimersByTime(SESSION_DURATION);

      expect(sessionManager.getRemainingTime()).toBe(0);
    });

    it('should return 0 after session ends', () => {
      sessionManager.startSession();
      sessionManager.endSession();

      expect(sessionManager.getRemainingTime()).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle multiple extend calls', () => {
      const onTimeout = jest.fn();
      sessionManager.startSession(onTimeout);

      // Extend multiple times
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(SESSION_DURATION / 2);
        sessionManager.extendSession();
      }

      // Session should still be active
      expect(sessionManager.isSessionActive()).toBe(true);
      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should handle restart after end', () => {
      sessionManager.startSession();
      sessionManager.endSession();

      expect(sessionManager.isSessionActive()).toBe(false);

      // Start new session
      sessionManager.startSession();

      expect(sessionManager.isSessionActive()).toBe(true);
      expect(sessionManager.getExpiresAt()).toBeGreaterThan(Date.now());
    });

    it('should handle restart after timeout', () => {
      const onTimeout1 = jest.fn();
      sessionManager.startSession(onTimeout1);

      jest.advanceTimersByTime(SESSION_DURATION);

      expect(sessionManager.isSessionActive()).toBe(false);
      expect(onTimeout1).toHaveBeenCalledTimes(1);

      // Start new session with different callback
      const onTimeout2 = jest.fn();
      sessionManager.startSession(onTimeout2);

      expect(sessionManager.isSessionActive()).toBe(true);

      jest.advanceTimersByTime(SESSION_DURATION);

      expect(onTimeout2).toHaveBeenCalledTimes(1);
      expect(onTimeout1).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('edge cases', () => {
    it('should handle very short duration', () => {
      const shortManager = new SessionManager(1); // 1ms
      const onTimeout = jest.fn();

      shortManager.startSession(onTimeout);

      jest.advanceTimersByTime(1);

      expect(shortManager.isSessionActive()).toBe(false);
      expect(onTimeout).toHaveBeenCalled();
    });

    it('should handle starting session without callback', () => {
      sessionManager.startSession();

      jest.advanceTimersByTime(SESSION_DURATION);

      // Should not throw error
      expect(sessionManager.isSessionActive()).toBe(false);
    });

    it('should handle extending just before timeout', () => {
      const onTimeout = jest.fn();
      sessionManager.startSession(onTimeout);

      // Advance to just before timeout
      jest.advanceTimersByTime(SESSION_DURATION - 10);

      sessionManager.extendSession();

      // Advance past original timeout
      jest.advanceTimersByTime(20);

      // Should still be active
      expect(sessionManager.isSessionActive()).toBe(true);
      expect(onTimeout).not.toHaveBeenCalled();
    });
  });
});
