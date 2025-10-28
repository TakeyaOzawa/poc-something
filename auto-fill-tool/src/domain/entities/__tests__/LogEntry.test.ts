/**
 * Tests for LogEntry entity
 */

import { LogEntry, SecurityEventType, LogEntryProps } from '../LogEntry';
import { LogLevel } from '@domain/types/logger.types';

describe('LogEntry', () => {
  const validProps: LogEntryProps = {
    id: 'log_123',
    timestamp: Date.now(),
    level: LogLevel.INFO,
    source: 'TestSource',
    message: 'Test message',
    isSecurityEvent: false,
  };

  describe('constructor', () => {
    it('should create LogEntry with valid props', () => {
      const entry = new LogEntry(validProps);

      expect(entry.getId()).toBe(validProps.id);
      expect(entry.getTimestamp()).toBe(validProps.timestamp);
      expect(entry.getLevel()).toBe(validProps.level);
      expect(entry.getSource()).toBe(validProps.source);
      expect(entry.getMessage()).toBe(validProps.message);
      expect(entry.isSecurityEvent()).toBe(false);
    });

    it('should create LogEntry with context', () => {
      const context = { userId: '123', action: 'login' };
      const entry = new LogEntry({ ...validProps, context });

      expect(entry.getContext()).toEqual(context);
    });

    it('should create LogEntry with error', () => {
      const error = { message: 'Test error', stack: 'Error stack' };
      const entry = new LogEntry({ ...validProps, error });

      expect(entry.getError()).toEqual(error);
    });

    it('should create LogEntry with security event', () => {
      const entry = new LogEntry({
        ...validProps,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.FAILED_AUTH,
      });

      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.FAILED_AUTH);
    });

    it('should throw error when id is missing', () => {
      const props = { ...validProps, id: '' };

      expect(() => new LogEntry(props)).toThrow('LogEntry id is required');
    });

    it('should throw error when timestamp is missing', () => {
      const props = { ...validProps, timestamp: 0 };

      expect(() => new LogEntry(props)).toThrow('LogEntry timestamp must be a positive number');
    });

    it('should throw error when timestamp is negative', () => {
      const props = { ...validProps, timestamp: -100 };

      expect(() => new LogEntry(props)).toThrow('LogEntry timestamp must be a positive number');
    });

    it('should throw error when source is missing', () => {
      const props = { ...validProps, source: '' };

      expect(() => new LogEntry(props)).toThrow('LogEntry source is required');
    });

    it('should throw error when message is missing', () => {
      const props = { ...validProps, message: '' };

      expect(() => new LogEntry(props)).toThrow('LogEntry message is required');
    });
  });

  describe('immutability', () => {
    it('should return copy of context to prevent mutation', () => {
      const context = { key: 'value' };
      const entry = new LogEntry({ ...validProps, context });

      const retrievedContext = entry.getContext();
      if (retrievedContext) {
        retrievedContext.key = 'modified';
      }

      expect(entry.getContext()).toEqual({ key: 'value' });
    });

    it('should return copy of error to prevent mutation', () => {
      const error = { message: 'error', stack: 'stack' };
      const entry = new LogEntry({ ...validProps, error });

      const retrievedError = entry.getError();
      if (retrievedError) {
        retrievedError.message = 'modified';
      }

      expect(entry.getError()).toEqual({ message: 'error', stack: 'stack' });
    });

    it('should return undefined when context is not set', () => {
      const entry = new LogEntry(validProps);

      expect(entry.getContext()).toBeUndefined();
    });

    it('should return undefined when error is not set', () => {
      const entry = new LogEntry(validProps);

      expect(entry.getError()).toBeUndefined();
    });

    it('should return undefined when security event type is not set', () => {
      const entry = new LogEntry(validProps);

      expect(entry.getSecurityEventType()).toBeUndefined();
    });
  });

  describe('getAgeInDays', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed time for consistent test results
      jest.spyOn(Date, 'now').mockReturnValue(1609459200000); // 2021-01-01 00:00:00 UTC
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return 0 for logs created today', () => {
      const entry = new LogEntry({ ...validProps, timestamp: 1609459200000 }); // Same as Date.now()

      expect(entry.getAgeInDays()).toBe(0);
    });

    it('should return 1 for logs created yesterday', () => {
      const yesterday = 1609459200000 - 24 * 60 * 60 * 1000;
      const entry = new LogEntry({ ...validProps, timestamp: yesterday });

      expect(entry.getAgeInDays()).toBe(1);
    });

    it('should return 7 for logs created 7 days ago', () => {
      const sevenDaysAgo = 1609459200000 - 7 * 24 * 60 * 60 * 1000;
      const entry = new LogEntry({ ...validProps, timestamp: sevenDaysAgo });

      expect(entry.getAgeInDays()).toBe(7);
    });

    it('should return 30 for logs created 30 days ago', () => {
      const thirtyDaysAgo = 1609459200000 - 30 * 24 * 60 * 60 * 1000;
      const entry = new LogEntry({ ...validProps, timestamp: thirtyDaysAgo });

      expect(entry.getAgeInDays()).toBe(30);
    });
  });

  describe('isOlderThan', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed time for consistent test results
      jest.spyOn(Date, 'now').mockReturnValue(1609459200000); // 2021-01-01 00:00:00 UTC
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return false for recent logs', () => {
      const entry = new LogEntry({ ...validProps, timestamp: 1609459200000 }); // Same as Date.now()

      expect(entry.isOlderThan(1)).toBe(false);
    });

    it('should return true for old logs', () => {
      const oldTimestamp = 1609459200000 - 10 * 24 * 60 * 60 * 1000; // 10 days ago
      const entry = new LogEntry({ ...validProps, timestamp: oldTimestamp });

      expect(entry.isOlderThan(7)).toBe(true);
    });

    it('should return false for logs exactly at threshold', () => {
      const timestamp = 1609459200000 - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      const entry = new LogEntry({ ...validProps, timestamp });

      expect(entry.isOlderThan(7)).toBe(false);
    });

    it('should return true for logs just over threshold', () => {
      const timestamp = 1609459200000 - 7.1 * 24 * 60 * 60 * 1000; // 7.1 days ago
      const entry = new LogEntry({ ...validProps, timestamp });

      expect(entry.isOlderThan(7)).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON with all properties', () => {
      const context = { key: 'value' };
      const error = { message: 'error', stack: 'stack' };
      const entry = new LogEntry({
        ...validProps,
        context,
        error,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.FAILED_AUTH,
      });

      const json = entry.toJSON();

      expect(json).toEqual({
        id: validProps.id,
        timestamp: validProps.timestamp,
        level: validProps.level,
        source: validProps.source,
        message: validProps.message,
        context,
        error,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.FAILED_AUTH,
      });
    });

    it('should serialize to JSON without optional properties', () => {
      const entry = new LogEntry(validProps);

      const json = entry.toJSON();

      expect(json).toEqual({
        id: validProps.id,
        timestamp: validProps.timestamp,
        level: validProps.level,
        source: validProps.source,
        message: validProps.message,
        isSecurityEvent: false,
      });
    });
  });

  describe('fromJSON', () => {
    it('should deserialize from JSON with all properties', () => {
      const context = { key: 'value' };
      const error = { message: 'error', stack: 'stack' };
      const data: LogEntryProps = {
        ...validProps,
        context,
        error,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.STORAGE_LOCK,
      };

      const entry = LogEntry.fromJSON(data);

      expect(entry.getId()).toBe(data.id);
      expect(entry.getTimestamp()).toBe(data.timestamp);
      expect(entry.getLevel()).toBe(data.level);
      expect(entry.getSource()).toBe(data.source);
      expect(entry.getMessage()).toBe(data.message);
      expect(entry.getContext()).toEqual(context);
      expect(entry.getError()).toEqual(error);
      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.STORAGE_LOCK);
    });

    it('should deserialize from JSON without optional properties', () => {
      const entry = LogEntry.fromJSON(validProps);

      expect(entry.getId()).toBe(validProps.id);
      expect(entry.getContext()).toBeUndefined();
      expect(entry.getError()).toBeUndefined();
      expect(entry.getSecurityEventType()).toBeUndefined();
    });

    it('should throw error for invalid JSON', () => {
      const invalid = { ...validProps, id: '' };

      expect(() => LogEntry.fromJSON(invalid)).toThrow('LogEntry id is required');
    });
  });

  describe('create', () => {
    it('should create LogEntry with auto-generated ID', () => {
      const props = {
        timestamp: Date.now(),
        level: LogLevel.INFO,
        source: 'TestSource',
        message: 'Test message',
        isSecurityEvent: false,
      };

      const entry = LogEntry.create(props);

      expect(entry.getId()).toMatch(/^log_\d+_[a-z0-9]{9}$/);
      expect(entry.getTimestamp()).toBe(props.timestamp);
      expect(entry.getLevel()).toBe(props.level);
      expect(entry.getSource()).toBe(props.source);
      expect(entry.getMessage()).toBe(props.message);
      expect(entry.isSecurityEvent()).toBe(false);
    });

    it('should create different IDs for each call', () => {
      const props = {
        timestamp: Date.now(),
        level: LogLevel.INFO,
        source: 'TestSource',
        message: 'Test message',
        isSecurityEvent: false,
      };

      const entry1 = LogEntry.create(props);
      const entry2 = LogEntry.create(props);

      expect(entry1.getId()).not.toBe(entry2.getId());
    });

    it('should create LogEntry with security event type', () => {
      const props = {
        timestamp: Date.now(),
        level: LogLevel.WARN,
        source: 'AuthService',
        message: 'Failed login attempt',
        isSecurityEvent: true,
        securityEventType: SecurityEventType.FAILED_AUTH,
      };

      const entry = LogEntry.create(props);

      expect(entry.isSecurityEvent()).toBe(true);
      expect(entry.getSecurityEventType()).toBe(SecurityEventType.FAILED_AUTH);
    });
  });

  describe('all log levels', () => {
    it('should support DEBUG level', () => {
      const entry = new LogEntry({ ...validProps, level: LogLevel.DEBUG });

      expect(entry.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('should support INFO level', () => {
      const entry = new LogEntry({ ...validProps, level: LogLevel.INFO });

      expect(entry.getLevel()).toBe(LogLevel.INFO);
    });

    it('should support WARN level', () => {
      const entry = new LogEntry({ ...validProps, level: LogLevel.WARN });

      expect(entry.getLevel()).toBe(LogLevel.WARN);
    });

    it('should support ERROR level', () => {
      const entry = new LogEntry({ ...validProps, level: LogLevel.ERROR });

      expect(entry.getLevel()).toBe(LogLevel.ERROR);
    });
  });

  describe('all security event types', () => {
    it('should support FAILED_AUTH event', () => {
      const entry = new LogEntry({
        ...validProps,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.FAILED_AUTH,
      });

      expect(entry.getSecurityEventType()).toBe(SecurityEventType.FAILED_AUTH);
    });

    it('should support LOCKOUT event', () => {
      const entry = new LogEntry({
        ...validProps,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.LOCKOUT,
      });

      expect(entry.getSecurityEventType()).toBe(SecurityEventType.LOCKOUT);
    });

    it('should support PASSWORD_CHANGE event', () => {
      const entry = new LogEntry({
        ...validProps,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.PASSWORD_CHANGE,
      });

      expect(entry.getSecurityEventType()).toBe(SecurityEventType.PASSWORD_CHANGE);
    });

    it('should support STORAGE_UNLOCK event', () => {
      const entry = new LogEntry({
        ...validProps,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.STORAGE_UNLOCK,
      });

      expect(entry.getSecurityEventType()).toBe(SecurityEventType.STORAGE_UNLOCK);
    });

    it('should support STORAGE_LOCK event', () => {
      const entry = new LogEntry({
        ...validProps,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.STORAGE_LOCK,
      });

      expect(entry.getSecurityEventType()).toBe(SecurityEventType.STORAGE_LOCK);
    });

    it('should support PERMISSION_DENIED event', () => {
      const entry = new LogEntry({
        ...validProps,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.PERMISSION_DENIED,
      });

      expect(entry.getSecurityEventType()).toBe(SecurityEventType.PERMISSION_DENIED);
    });

    it('should support SESSION_EXPIRED event', () => {
      const entry = new LogEntry({
        ...validProps,
        isSecurityEvent: true,
        securityEventType: SecurityEventType.SESSION_EXPIRED,
      });

      expect(entry.getSecurityEventType()).toBe(SecurityEventType.SESSION_EXPIRED);
    });
  });
});
