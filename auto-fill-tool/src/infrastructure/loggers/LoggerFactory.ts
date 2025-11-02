/**
 * Infrastructure: Logger Factory
 * Creates appropriate logger based on environment
 */

import { Logger, LogLevel } from '@domain/types/logger.types';
import { ConsoleLogger } from './ConsoleLogger';
import { NoOpLogger } from '@domain/services/NoOpLogger';

// Re-export Logger type for convenience
export type { Logger };

export class LoggerFactory {
  /**
   * Creates a logger instance based on environment
   * - In test environment (NODE_ENV === 'test'): Returns NoOpLogger (no console output)
   * - In production/development: Returns ConsoleLogger
   *
   * @param context - Context name for the logger (e.g., 'XPathManager', 'AutoFillExecutor')
   * @param level - Log level (default: INFO in production, NONE in test)
   * @returns Logger instance
   */
  static createLogger(context: string, level?: LogLevel): Logger {
    // Check if process.env is available (Node.js environment)
    // In browser/service worker environment, process is undefined
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
      // In test environment, use NoOpLogger to suppress console output
      return new NoOpLogger();
    }

    // In production/development, use ConsoleLogger with specified or default level
    const logLevel = level !== undefined ? level : LogLevel.INFO;
    return new ConsoleLogger(context, logLevel);
  }

  /**
   * Creates a NoOpLogger (useful for testing or when logging is not needed)
   * @returns NoOpLogger instance
   */
  static createNoOpLogger(): Logger {
    return new NoOpLogger();
  }

  /**
   * Creates a ConsoleLogger with specified context and level
   * @param context - Context name for the logger
   * @param level - Log level (default: INFO)
   * @returns ConsoleLogger instance
   */
  static createConsoleLogger(context: string, level: LogLevel = LogLevel.INFO): Logger {
    return new ConsoleLogger(context, level);
  }
}
