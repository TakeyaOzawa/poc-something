/**
 * Presentation Layer: Base Coordinator
 * Abstract base class providing common functionality for all coordinators
 */

import { Logger } from '@domain/types/logger.types';
import type { UICoordinator } from './Coordinator';

/**
 * Abstract base coordinator class
 * Provides common functionality and enforces the coordinator pattern
 */
export abstract class BaseCoordinator implements UICoordinator {
  protected readonly logger: Logger;
  private isInitialized = false;
  private cleanupTasks: (() => void)[] = [];

  constructor(logger: Logger) {
    this.logger = logger;

    // Register cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  /**
   * Initialize the coordinator
   * Template method that calls the abstract doInitialize method
   */
  public async initialize(...args: unknown[]): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Coordinator already initialized');
      return;
    }

    try {
      this.logger.info('Initializing coordinator');
      await this.doInitialize(...args);
      this.isInitialized = true;
      this.logger.info('Coordinator initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize coordinator', error);
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Abstract method for specific initialization logic
   * Must be implemented by concrete coordinators
   */
  protected abstract doInitialize(...args: unknown[]): Promise<void>;

  /**
   * Refresh the UI state
   * Default implementation - can be overridden by subclasses
   */
  public async refresh(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Cannot refresh uninitialized coordinator');
      return;
    }

    try {
      this.logger.debug('Refreshing coordinator');
      await this.doRefresh();
    } catch (error) {
      this.logger.error('Failed to refresh coordinator', error);
      this.handleError(error as Error);
    }
  }

  /**
   * Abstract method for specific refresh logic
   * Can be overridden by subclasses if needed
   */
  protected async doRefresh(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Check if the coordinator is active
   */
  public isActive(): boolean {
    return this.isInitialized;
  }

  /**
   * Clean up resources and event listeners
   */
  public cleanup(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Cleaning up coordinator');

      // Execute all registered cleanup tasks
      this.cleanupTasks.forEach((task) => {
        try {
          task();
        } catch (error) {
          this.logger.error('Error during cleanup task', error);
        }
      });

      this.doCleanup();
      this.isInitialized = false;
      this.cleanupTasks = [];

      this.logger.info('Coordinator cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup coordinator', error);
    }
  }

  /**
   * Abstract method for specific cleanup logic
   * Can be overridden by subclasses
   */
  protected doCleanup(): void {
    // Default implementation does nothing
  }

  /**
   * Handle errors that occur during coordinator operations
   */
  public handleError(error: Error): void {
    this.logger.error('Coordinator error', error);

    // Show user-friendly error message
    const message = 'An error occurred';
    this.showErrorMessage(message);
  }

  /**
   * Register a cleanup task to be executed during cleanup
   */
  protected registerCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  /**
   * Apply gradient background from system settings
   * Common functionality used by many coordinators
   */
  protected async applyGradientBackground(): Promise<void> {
    try {
      // This is a common pattern in existing coordinators
      const body = document.body;
      if (body) {
        body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        body.style.minHeight = '100vh';
      }
    } catch (error) {
      this.logger.warn('Failed to apply gradient background', error);
    }
  }

  /**
   * Show error message to user
   * Can be overridden by subclasses for custom error display
   */
  protected showErrorMessage(message: string): void {
    // Simple implementation - can be enhanced by subclasses
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message);
    }
  }
}
