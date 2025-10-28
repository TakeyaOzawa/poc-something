/**
 * Domain Services: No-Operation Logger Implementation
 * Implements Logger but does nothing (useful for testing and default parameters)
 */

import { Logger, LogLevel, LogContext } from '@domain/types/logger.types';

export class NoOpLogger implements Logger {
  private level: LogLevel = LogLevel.NONE;

  debug(_message: string, _context?: LogContext): void {
    // No operation
  }

  info(_message: string, _context?: LogContext): void {
    // No operation
  }

  warn(_message: string, _context?: LogContext): void {
    // No operation
  }

  error(_message: string, _error?: Error | unknown, _context?: LogContext): void {
    // No operation
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  createChild(_childContext: string): Logger {
    return new NoOpLogger();
  }
}
