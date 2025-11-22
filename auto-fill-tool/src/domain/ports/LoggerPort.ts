/**
 * Domain Port: Logger
 * Provides logging functionality with context and level control
 */

// Re-export from types for now to avoid breaking changes
export { Logger, LogLevel, LogContext } from '@domain/types/logger.types';

// Alias for Port naming convention
export type LoggerPort = Logger;
