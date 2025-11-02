/**
 * Domain Layer: SecurityEventLogger Service
 * Helper service for tagging and creating security event logs
 */

import { LogEntry, LogEntryProps, SecurityEventType } from '@domain/entities/LogEntry';
import { LogLevel } from '@domain/types/logger.types';

/**
 * Security event details
 */
export interface SecurityEventDetails {
  type: SecurityEventType;
  message: string;
  context?: Record<string, unknown>;
  error?: { message: string; stack?: string };
}

/**
 * SecurityEventLogger Service
 * Provides utility methods for creating security event log entries
 */
export class SecurityEventLogger {
  /**
   * Create a security event log entry
   */
  static createSecurityEvent(source: string, details: SecurityEventDetails): LogEntry {
    const logEntryData: Omit<LogEntryProps, 'id'> = {
      timestamp: Date.now(),
      level: this.getLogLevelForSecurityEvent(details.type),
      source,
      message: details.message,
      isSecurityEvent: true,
      securityEventType: details.type,
    };

    if (details.context !== undefined) {
      logEntryData.context = details.context;
    }

    if (details.error !== undefined) {
      logEntryData.error = details.error;
    }

    return LogEntry.create(logEntryData);
  }

  /**
   * Create FAILED_AUTH event
   */
  static createFailedAuth(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    const details: SecurityEventDetails = {
      type: SecurityEventType.FAILED_AUTH,
      message,
    };

    if (context !== undefined) {
      details.context = context;
    }

    return this.createSecurityEvent(source, details);
  }

  /**
   * Create LOCKOUT event
   */
  static createLockout(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    const details: SecurityEventDetails = {
      type: SecurityEventType.LOCKOUT,
      message,
    };

    if (context !== undefined) {
      details.context = context;
    }

    return this.createSecurityEvent(source, details);
  }

  /**
   * Create PASSWORD_CHANGE event
   */
  static createPasswordChange(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    const details: SecurityEventDetails = {
      type: SecurityEventType.PASSWORD_CHANGE,
      message,
    };

    if (context !== undefined) {
      details.context = context;
    }

    return this.createSecurityEvent(source, details);
  }

  /**
   * Create STORAGE_UNLOCK event
   */
  static createStorageUnlock(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    const details: SecurityEventDetails = {
      type: SecurityEventType.STORAGE_UNLOCK,
      message,
    };

    if (context !== undefined) {
      details.context = context;
    }

    return this.createSecurityEvent(source, details);
  }

  /**
   * Create STORAGE_LOCK event
   */
  static createStorageLock(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    const details: SecurityEventDetails = {
      type: SecurityEventType.STORAGE_LOCK,
      message,
    };

    if (context !== undefined) {
      details.context = context;
    }

    return this.createSecurityEvent(source, details);
  }

  /**
   * Create PERMISSION_DENIED event
   */
  static createPermissionDenied(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    const details: SecurityEventDetails = {
      type: SecurityEventType.PERMISSION_DENIED,
      message,
    };

    if (context !== undefined) {
      details.context = context;
    }

    return this.createSecurityEvent(source, details);
  }

  /**
   * Create SESSION_EXPIRED event
   */
  static createSessionExpired(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    const details: SecurityEventDetails = {
      type: SecurityEventType.SESSION_EXPIRED,
      message,
    };

    if (context !== undefined) {
      details.context = context;
    }

    return this.createSecurityEvent(source, details);
  }

  /**
   * Get appropriate log level for security event type
   */
  private static getLogLevelForSecurityEvent(type: SecurityEventType): LogLevel {
    switch (type) {
      case SecurityEventType.FAILED_AUTH:
      case SecurityEventType.LOCKOUT:
      case SecurityEventType.PERMISSION_DENIED:
        return LogLevel.WARN;
      case SecurityEventType.PASSWORD_CHANGE:
      case SecurityEventType.STORAGE_UNLOCK:
      case SecurityEventType.STORAGE_LOCK:
        return LogLevel.INFO;
      case SecurityEventType.SESSION_EXPIRED:
        return LogLevel.WARN;
      default:
        return LogLevel.INFO;
    }
  }
}
