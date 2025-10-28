/**
 * Tests for SecurityEventLogger
 */

import { SecurityEventLogger } from '../SecurityEventLogger';
import { SecurityEventType } from '@domain/entities/LogEntry';
import { LogLevel } from '@domain/types/logger.types';

describe('SecurityEventLogger', () => {
  describe('createSecurityEvent', () => {
    it('should create a security event log entry', () => {
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.FAILED_AUTH,
        message: 'Authentication failed',
      });

      expect(entry.getSource()).toBe('TestSource');
      expect(entry.getMessage()).toBe('Authentication failed');
      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.FAILED_AUTH);
      expect(entry.getLevel()).toBe(LogLevel.WARN);
    });

    it('should include context when provided', () => {
      const context = { userId: '123', attempt: 3 };
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.FAILED_AUTH,
        message: 'Authentication failed',
        context,
      });

      expect(entry.getContext()).toEqual(context);
    });

    it('should include error when provided', () => {
      const error = {
        message: 'Invalid credentials',
        stack: 'Error stack trace',
      };

      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.FAILED_AUTH,
        message: 'Authentication failed',
        error,
      });

      expect(entry.getError()).toEqual(error);
    });

    it('should set appropriate log level for FAILED_AUTH', () => {
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.FAILED_AUTH,
        message: 'Test message',
      });

      expect(entry.getLevel()).toBe(LogLevel.WARN);
    });

    it('should set appropriate log level for LOCKOUT', () => {
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.LOCKOUT,
        message: 'Test message',
      });

      expect(entry.getLevel()).toBe(LogLevel.WARN);
    });

    it('should set appropriate log level for PASSWORD_CHANGE', () => {
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.PASSWORD_CHANGE,
        message: 'Test message',
      });

      expect(entry.getLevel()).toBe(LogLevel.INFO);
    });

    it('should set appropriate log level for STORAGE_UNLOCK', () => {
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.STORAGE_UNLOCK,
        message: 'Test message',
      });

      expect(entry.getLevel()).toBe(LogLevel.INFO);
    });

    it('should set appropriate log level for STORAGE_LOCK', () => {
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.STORAGE_LOCK,
        message: 'Test message',
      });

      expect(entry.getLevel()).toBe(LogLevel.INFO);
    });

    it('should set appropriate log level for PERMISSION_DENIED', () => {
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.PERMISSION_DENIED,
        message: 'Test message',
      });

      expect(entry.getLevel()).toBe(LogLevel.WARN);
    });

    it('should set appropriate log level for SESSION_EXPIRED', () => {
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.SESSION_EXPIRED,
        message: 'Test message',
      });

      expect(entry.getLevel()).toBe(LogLevel.WARN);
    });

    it('should generate valid log entry ID', () => {
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.FAILED_AUTH,
        message: 'Test message',
      });

      expect(entry.getId()).toMatch(/^log_\d+_[a-z0-9]{9}$/);
    });

    it('should set timestamp to current time', () => {
      const before = Date.now();
      const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
        type: SecurityEventType.FAILED_AUTH,
        message: 'Test message',
      });
      const after = Date.now();

      expect(entry.getTimestamp()).toBeGreaterThanOrEqual(before);
      expect(entry.getTimestamp()).toBeLessThanOrEqual(after);
    });
  });

  describe('createFailedAuth', () => {
    it('should create a FAILED_AUTH security event', () => {
      const entry = SecurityEventLogger.createFailedAuth('AuthService', 'Login attempt failed');

      expect(entry.getSource()).toBe('AuthService');
      expect(entry.getMessage()).toBe('Login attempt failed');
      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.FAILED_AUTH);
      expect(entry.getLevel()).toBe(LogLevel.WARN);
    });

    it('should include context when provided', () => {
      const context = { username: 'test@example.com', ipAddress: '192.168.1.1' };
      const entry = SecurityEventLogger.createFailedAuth(
        'AuthService',
        'Login attempt failed',
        context
      );

      expect(entry.getContext()).toEqual(context);
    });

    it('should work without context', () => {
      const entry = SecurityEventLogger.createFailedAuth('AuthService', 'Login attempt failed');

      expect(entry.getContext()).toBeUndefined();
    });
  });

  describe('createLockout', () => {
    it('should create a LOCKOUT security event', () => {
      const entry = SecurityEventLogger.createLockout('LockoutManager', 'Account locked');

      expect(entry.getSource()).toBe('LockoutManager');
      expect(entry.getMessage()).toBe('Account locked');
      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.LOCKOUT);
      expect(entry.getLevel()).toBe(LogLevel.WARN);
    });

    it('should include context when provided', () => {
      const context = { attempts: 5, duration: 300000 };
      const entry = SecurityEventLogger.createLockout('LockoutManager', 'Account locked', context);

      expect(entry.getContext()).toEqual(context);
    });
  });

  describe('createPasswordChange', () => {
    it('should create a PASSWORD_CHANGE security event', () => {
      const entry = SecurityEventLogger.createPasswordChange(
        'PasswordService',
        'Password changed successfully'
      );

      expect(entry.getSource()).toBe('PasswordService');
      expect(entry.getMessage()).toBe('Password changed successfully');
      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.PASSWORD_CHANGE);
      expect(entry.getLevel()).toBe(LogLevel.INFO);
    });

    it('should include context when provided', () => {
      const context = { userId: '123', timestamp: Date.now() };
      const entry = SecurityEventLogger.createPasswordChange(
        'PasswordService',
        'Password changed successfully',
        context
      );

      expect(entry.getContext()).toEqual(context);
    });
  });

  describe('createStorageUnlock', () => {
    it('should create a STORAGE_UNLOCK security event', () => {
      const entry = SecurityEventLogger.createStorageUnlock(
        'StorageService',
        'Storage unlocked successfully'
      );

      expect(entry.getSource()).toBe('StorageService');
      expect(entry.getMessage()).toBe('Storage unlocked successfully');
      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.STORAGE_UNLOCK);
      expect(entry.getLevel()).toBe(LogLevel.INFO);
    });

    it('should include context when provided', () => {
      const context = { sessionId: 'abc123', duration: 1800000 };
      const entry = SecurityEventLogger.createStorageUnlock(
        'StorageService',
        'Storage unlocked successfully',
        context
      );

      expect(entry.getContext()).toEqual(context);
    });
  });

  describe('createStorageLock', () => {
    it('should create a STORAGE_LOCK security event', () => {
      const entry = SecurityEventLogger.createStorageLock(
        'StorageService',
        'Storage locked successfully'
      );

      expect(entry.getSource()).toBe('StorageService');
      expect(entry.getMessage()).toBe('Storage locked successfully');
      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.STORAGE_LOCK);
      expect(entry.getLevel()).toBe(LogLevel.INFO);
    });

    it('should include context when provided', () => {
      const context = { reason: 'user_request' };
      const entry = SecurityEventLogger.createStorageLock(
        'StorageService',
        'Storage locked successfully',
        context
      );

      expect(entry.getContext()).toEqual(context);
    });
  });

  describe('createPermissionDenied', () => {
    it('should create a PERMISSION_DENIED security event', () => {
      const entry = SecurityEventLogger.createPermissionDenied(
        'PermissionManager',
        'Access denied'
      );

      expect(entry.getSource()).toBe('PermissionManager');
      expect(entry.getMessage()).toBe('Access denied');
      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.PERMISSION_DENIED);
      expect(entry.getLevel()).toBe(LogLevel.WARN);
    });

    it('should include context when provided', () => {
      const context = { resource: 'admin_panel', userId: '123' };
      const entry = SecurityEventLogger.createPermissionDenied(
        'PermissionManager',
        'Access denied',
        context
      );

      expect(entry.getContext()).toEqual(context);
    });
  });

  describe('createSessionExpired', () => {
    it('should create a SESSION_EXPIRED security event', () => {
      const entry = SecurityEventLogger.createSessionExpired('SessionManager', 'Session expired');

      expect(entry.getSource()).toBe('SessionManager');
      expect(entry.getMessage()).toBe('Session expired');
      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.SESSION_EXPIRED);
      expect(entry.getLevel()).toBe(LogLevel.WARN);
    });

    it('should include context when provided', () => {
      const context = { sessionId: 'xyz789', duration: 3600000 };
      const entry = SecurityEventLogger.createSessionExpired(
        'SessionManager',
        'Session expired',
        context
      );

      expect(entry.getContext()).toEqual(context);
    });
  });

  describe('all security event types', () => {
    it('should handle all 7 security event types', () => {
      const types = [
        SecurityEventType.FAILED_AUTH,
        SecurityEventType.LOCKOUT,
        SecurityEventType.PASSWORD_CHANGE,
        SecurityEventType.STORAGE_UNLOCK,
        SecurityEventType.STORAGE_LOCK,
        SecurityEventType.PERMISSION_DENIED,
        SecurityEventType.SESSION_EXPIRED,
      ];

      types.forEach((type) => {
        const entry = SecurityEventLogger.createSecurityEvent('TestSource', {
          type,
          message: 'Test message',
        });

        expect(entry.isSecurityEvent()).toBe(true);
        expect(entry.getSecurityEventType()).toBe(type);
        expect([LogLevel.INFO, LogLevel.WARN]).toContain(entry.getLevel());
      });
    });
  });

  describe('data integrity', () => {
    it('should create immutable log entries', () => {
      const entry = SecurityEventLogger.createFailedAuth('AuthService', 'Test message', {
        key: 'value',
      });

      // Get context copy and try to modify it
      const contextCopy = entry.getContext();
      if (contextCopy) {
        contextCopy.key = 'modified';
      }

      // Original entry should be unchanged
      expect(entry.getContext()).toEqual({ key: 'value' });
    });

    it('should serialize and deserialize correctly', () => {
      const entry = SecurityEventLogger.createFailedAuth('AuthService', 'Test message', {
        userId: '123',
      });

      const json = entry.toJSON();
      const deserializedEntry = SecurityEventLogger.createSecurityEvent(json.source, {
        type: json.securityEventType!,
        message: json.message,
        context: json.context,
      });

      expect(deserializedEntry.getSource()).toBe(entry.getSource());
      expect(deserializedEntry.getMessage()).toBe(entry.getMessage());
      expect(deserializedEntry.getSecurityEventType()).toBe(entry.getSecurityEventType());
      expect(deserializedEntry.getLevel()).toBe(entry.getLevel());
      expect(deserializedEntry.isSecurityEvent()).toBe(entry.isSecurityEvent());
    });
  });
});
