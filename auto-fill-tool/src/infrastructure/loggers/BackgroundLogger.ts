/**
 * Infrastructure: Background Logger Implementation
 * Forwards all logs to background script for popup/content scripts
 */

import browser from 'webextension-polyfill';
import { Logger, LogLevel, LogContext } from '@domain/types/logger.types';
import { ForwardLogMessage } from '@domain/types/messaging';
import { MessageTypes } from '@domain/types/messaging';

/**
 * Logger that forwards all log messages to the background script
 * Useful for popup scripts where DevTools close when popup closes
 */
export class BackgroundLogger implements Logger {
  private level: LogLevel;
  private context: string;

  constructor(context: string = 'AutoFillTool', level: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.level = level;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.forwardLog('DEBUG', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.forwardLog('INFO', message, context);
    }
  }

  warn(message: string | Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const messageStr = message instanceof Error ? message.message : message;
      this.forwardLog('WARN', messageStr, context);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      // Serialize error for transmission
      let errorData: { message: string; stack?: string } | undefined;
      if (error) {
        errorData = {
          message: error instanceof Error ? error.message : String(error),
        };

        if (error instanceof Error && error.stack !== undefined) {
          errorData.stack = error.stack;
        }
      }

      this.forwardLog('ERROR', message, context, errorData);
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
    return new BackgroundLogger(fullContext, this.level);
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    return messageLevel >= this.level;
  }

  /**
   * Forward log message to background script
   */
  private forwardLog(
    level: string,
    message: string,
    context?: LogContext,
    error?: { message: string; stack?: string }
  ): void {
    const logMessage: ForwardLogMessage = {
      action: MessageTypes.FORWARD_LOG,
      level,
      context: this.context,
      message,
      timestamp: Date.now(),
    };

    if (context !== undefined) {
      logMessage.logContext = context;
    }

    if (error !== undefined) {
      logMessage.error = error;
    }

    // Send log message to background script
    // Use fire-and-forget pattern (don't await response)
    browser.runtime.sendMessage(logMessage).catch((err) => {
      // Silently fail if background script is not available
      // (e.g., during extension reload or popup closed after idle)

      // Only log unexpected errors (not channel closed errors which are expected)
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isChannelClosedError =
        errorMessage.includes('message channel closed') ||
        errorMessage.includes('Extension context invalidated') ||
        errorMessage.includes('message port closed');

      if (!isChannelClosedError) {
        console.error('[BackgroundLogger] Failed to forward log:', err);
      }
    });
  }
}
