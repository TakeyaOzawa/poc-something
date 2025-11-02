/**
 * Domain Service: Logger Interface
 * Provides logging functionality with context and level control
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  /**
   * Log debug message (most verbose)
   * @param message - The message to log
   * @param context - Optional context object for structured logging
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Log informational message
   * @param message - The message to log
   * @param context - Optional context object for structured logging
   */
  info(message: string, context?: LogContext): void;

  /**
   * Log warning message
   * @param message - The message to log
   * @param context - Optional context object for structured logging
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Log error message
   * @param message - The message to log
   * @param error - Optional error object
   * @param context - Optional context object for structured logging
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void;

  /**
   * Set the minimum log level for this logger
   * @param level - The minimum level to log
   */
  setLevel(level: LogLevel): void;

  /**
   * Get the current log level
   * @returns The current log level
   */
  getLevel(): LogLevel;

  /**
   * Create a child logger with additional context
   * @param childContext - The context name for the child logger
   * @returns A new logger instance with the child context
   */
  createChild(childContext: string): Logger;
}
