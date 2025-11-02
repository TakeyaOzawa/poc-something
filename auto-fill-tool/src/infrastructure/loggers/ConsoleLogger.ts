/**
 * Infrastructure: Console Logger Implementation
 * Implements Logger using browser console API
 */

import { Logger, LogLevel, LogContext } from '@domain/types/logger.types';

export class ConsoleLogger implements Logger {
  private level: LogLevel;
  private context: string;

  constructor(context: string = 'AutoFillTool', level: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.level = level;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formatted = this.formatMessage('DEBUG', message, context);
      console.debug(formatted.prefix, formatted.message, ...(formatted.args || []));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatMessage('INFO', message, context);
      console.info(formatted.prefix, formatted.message, ...(formatted.args || []));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formatted = this.formatMessage('WARN', message, context);
      console.warn(formatted.prefix, formatted.message, ...(formatted.args || []));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formatted = this.formatMessage('ERROR', message, context);
      const args = formatted.args || [];

      if (error) {
        args.push(error);
      }

      console.error(formatted.prefix, formatted.message, ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  createChild(childContext: string): Logger {
    const fullContext = `${this.context}:${childContext}`;
    return new ConsoleLogger(fullContext, this.level);
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    return messageLevel >= this.level;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext
  ): { prefix: string; message: string; args?: unknown[] } {
    // Format timestamp using browser's local timezone
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    const timestamp = `${hours}:${minutes}:${seconds}.${milliseconds}`;
    const prefix = `[${timestamp}] [${this.context}] [${level}]`;

    const args: unknown[] = [];
    if (context && Object.keys(context).length > 0) {
      // Serialize context for better readability
      try {
        args.push(JSON.stringify(context, null, 2));
      } catch {
        // Fallback to original object if serialization fails
        args.push(context);
      }
    }

    return { prefix, message, args: args.length > 0 ? args : undefined };
  }
}
