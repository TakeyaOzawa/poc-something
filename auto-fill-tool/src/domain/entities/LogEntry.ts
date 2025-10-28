/**
 * Domain Layer: LogEntry Entity
 * Represents a log entry in the centralized logging system
 */

import { LogLevel } from '@domain/types/logger.types';

/**
 * Security event types for centralized logging
 */
export enum SecurityEventType {
  FAILED_AUTH = 'FAILED_AUTH', // Authentication failure
  LOCKOUT = 'LOCKOUT', // Account lockout
  PASSWORD_CHANGE = 'PASSWORD_CHANGE', // Password change
  STORAGE_UNLOCK = 'STORAGE_UNLOCK', // Storage unlock
  STORAGE_LOCK = 'STORAGE_LOCK', // Storage lock
  PERMISSION_DENIED = 'PERMISSION_DENIED', // Permission denied
  SESSION_EXPIRED = 'SESSION_EXPIRED', // Session expiration
}

/**
 * Log context information
 */
export interface LogContext {
  [key: string]: unknown;
}

/**
 * Error information in log entry
 */
export interface LogErrorInfo {
  message: string;
  stack?: string;
}

/**
 * LogEntry properties
 */
export interface LogEntryProps {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: string; // background, popup, content-script, xpath-manager, etc.
  message: string;
  context?: LogContext;
  error?: LogErrorInfo;
  isSecurityEvent: boolean;
  securityEventType?: SecurityEventType;
}

/**
 * LogEntry Entity
 * Immutable entity representing a single log entry
 */
export class LogEntry {
  private readonly props: Readonly<LogEntryProps>;

  constructor(props: LogEntryProps) {
    // Validate required fields
    if (!props.id) {
      throw new Error('LogEntry id is required');
    }
    if (!props.timestamp || props.timestamp <= 0) {
      throw new Error('LogEntry timestamp must be a positive number');
    }
    if (!props.source) {
      throw new Error('LogEntry source is required');
    }
    if (!props.message) {
      throw new Error('LogEntry message is required');
    }

    this.props = Object.freeze({ ...props });
  }

  getId(): string {
    return this.props.id;
  }

  getTimestamp(): number {
    return this.props.timestamp;
  }

  getLevel(): LogLevel {
    return this.props.level;
  }

  getSource(): string {
    return this.props.source;
  }

  getMessage(): string {
    return this.props.message;
  }

  getContext(): LogContext | undefined {
    return this.props.context ? { ...this.props.context } : undefined;
  }

  getError(): LogErrorInfo | undefined {
    return this.props.error ? { ...this.props.error } : undefined;
  }

  isSecurityEvent(): boolean {
    return this.props.isSecurityEvent;
  }

  getSecurityEventType(): SecurityEventType | undefined {
    return this.props.securityEventType;
  }

  /**
   * Get age of log entry in days
   */
  getAgeInDays(): number {
    const now = Date.now();
    const ageMs = now - this.props.timestamp;
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if log entry is older than specified days
   * Uses precise age calculation (not floored) for accurate comparison
   */
  isOlderThan(days: number): boolean {
    const now = Date.now();
    const ageMs = now - this.props.timestamp;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays > days;
  }

  /**
   * Get all properties as plain object
   */
  toJSON(): LogEntryProps {
    return {
      id: this.props.id,
      timestamp: this.props.timestamp,
      level: this.props.level,
      source: this.props.source,
      message: this.props.message,
      context: this.props.context,
      error: this.props.error,
      isSecurityEvent: this.props.isSecurityEvent,
      securityEventType: this.props.securityEventType,
    };
  }

  /**
   * Create LogEntry from plain object (for deserialization)
   */
  static fromJSON(data: LogEntryProps): LogEntry {
    return new LogEntry(data);
  }

  /**
   * Create LogEntry with generated ID
   */
  static create(props: Omit<LogEntryProps, 'id'>): LogEntry {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return new LogEntry({ ...props, id });
  }
}
