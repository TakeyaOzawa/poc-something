/**
 * Presentation Layer: Coordinator Interface
 * Common interface for all coordinators in the presentation layer
 */

/**
 * Base interface for all coordinators
 * Defines the common lifecycle methods that all coordinators should implement
 */
export interface Coordinator {
  /**
   * Initialize the coordinator
   * Called when the coordinator needs to set up its dependencies and start operations
   */
  initialize(...args: unknown[]): Promise<void>;

  /**
   * Clean up resources and event listeners
   * Called when the coordinator is being destroyed or the page is unloading
   */
  cleanup(): void;

  /**
   * Handle errors that occur during coordinator operations
   * Provides a centralized error handling mechanism
   */
  handleError(error: Error): void;
}

/**
 * Extended interface for coordinators that manage UI components
 */
export interface UICoordinator extends Coordinator {
  /**
   * Refresh the UI state
   * Called when the coordinator needs to update its display
   */
  refresh(): Promise<void>;

  /**
   * Check if the coordinator is currently active/initialized
   */
  isActive(): boolean;
}

/**
 * Extended interface for coordinators that handle data operations
 */
export interface DataCoordinator extends Coordinator {
  /**
   * Load initial data
   * Called during initialization to load required data
   */
  loadData(): Promise<void>;

  /**
   * Save current state
   * Called when data needs to be persisted
   */
  saveData(): Promise<void>;
}
