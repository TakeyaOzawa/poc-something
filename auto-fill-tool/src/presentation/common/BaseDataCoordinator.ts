/**
 * Presentation Layer: Base Data Coordinator
 * Abstract base class for coordinators that handle data operations
 */

import { Logger } from '@domain/types/logger.types';
import { BaseCoordinator } from './BaseCoordinator';
import type { DataCoordinator } from './Coordinator';

/**
 * Abstract base coordinator class for data-heavy operations
 * Extends BaseCoordinator with data loading and saving capabilities
 */
export abstract class BaseDataCoordinator extends BaseCoordinator implements DataCoordinator {
  private dataLoaded = false;

  constructor(logger: Logger) {
    super(logger);
  }

  /**
   * Initialize the coordinator with data loading
   */
  protected async doInitialize(...args: unknown[]): Promise<void> {
    await this.loadData();
    await this.doInitializeAfterData(...args);
  }

  /**
   * Abstract method for initialization after data is loaded
   * Must be implemented by concrete coordinators
   */
  protected abstract doInitializeAfterData(...args: unknown[]): Promise<void>;

  /**
   * Load initial data
   * Template method that calls the abstract doLoadData method
   */
  public async loadData(): Promise<void> {
    if (this.dataLoaded) {
      this.logger.debug('Data already loaded');
      return;
    }

    try {
      this.logger.info('Loading coordinator data');
      await this.doLoadData();
      this.dataLoaded = true;
      this.logger.info('Coordinator data loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load coordinator data', error);
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Abstract method for specific data loading logic
   * Must be implemented by concrete coordinators
   */
  protected abstract doLoadData(): Promise<void>;

  /**
   * Save current state
   * Template method that calls the abstract doSaveData method
   */
  public async saveData(): Promise<void> {
    if (!this.dataLoaded) {
      this.logger.warn('Cannot save data before loading');
      return;
    }

    try {
      this.logger.info('Saving coordinator data');
      await this.doSaveData();
      this.logger.info('Coordinator data saved successfully');
    } catch (error) {
      this.logger.error('Failed to save coordinator data', error);
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Abstract method for specific data saving logic
   * Must be implemented by concrete coordinators
   */
  protected abstract doSaveData(): Promise<void>;

  /**
   * Refresh with data reload
   */
  protected async doRefresh(): Promise<void> {
    this.dataLoaded = false;
    await this.loadData();
    await this.doRefreshAfterData();
  }

  /**
   * Abstract method for refresh after data reload
   * Can be overridden by subclasses
   */
  protected async doRefreshAfterData(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Check if data is loaded
   */
  protected isDataLoaded(): boolean {
    return this.dataLoaded;
  }

  /**
   * Cleanup with data saving
   */
  protected doCleanup(): void {
    if (this.dataLoaded) {
      // Attempt to save data on cleanup (fire and forget)
      this.saveData().catch((error) => {
        this.logger.error('Failed to save data during cleanup', error);
      });
    }
    super.doCleanup();
  }
}
