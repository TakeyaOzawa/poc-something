/**
 * Domain Layer: SecurityEventLogger Service
 * Helper service for tagging and creating security event logs
 */

import { LogEntry, SecurityEventType } from '@domain/entities/LogEntry';
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
    return LogEntry.create({
      timestamp: Date.now(),
      level: this.getLogLevelForSecurityEvent(details.type),
      source,
      message: details.message,
      context: details.context,
      error: details.error,
      isSecurityEvent: true,
      securityEventType: details.type,
    });
  }

  /**
   * Create FAILED_AUTH event
   */
  static createFailedAuth(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return this.createSecurityEvent(source, {
      type: SecurityEventType.FAILED_AUTH,
      message,
      context,
    });
  }

  /**
   * Create LOCKOUT event
   */
  static createLockout(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return this.createSecurityEvent(source, {
      type: SecurityEventType.LOCKOUT,
      message,
      context,
    });
  }

  /**
   * Create PASSWORD_CHANGE event
   */
  static createPasswordChange(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return this.createSecurityEvent(source, {
      type: SecurityEventType.PASSWORD_CHANGE,
      message,
      context,
    });
  }

  /**
   * Create STORAGE_UNLOCK event
   */
  static createStorageUnlock(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return this.createSecurityEvent(source, {
      type: SecurityEventType.STORAGE_UNLOCK,
      message,
      context,
    });
  }

  /**
   * Create STORAGE_LOCK event
   */
  static createStorageLock(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return this.createSecurityEvent(source, {
      type: SecurityEventType.STORAGE_LOCK,
      message,
      context,
    });
  }

  /**
   * Create PERMISSION_DENIED event
   */
  static createPermissionDenied(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return this.createSecurityEvent(source, {
      type: SecurityEventType.PERMISSION_DENIED,
      message,
      context,
    });
  }

  /**
   * Create SESSION_EXPIRED event
   */
  static createSessionExpired(
    source: string,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return this.createSecurityEvent(source, {
      type: SecurityEventType.SESSION_EXPIRED,
      message,
      context,
    });
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
