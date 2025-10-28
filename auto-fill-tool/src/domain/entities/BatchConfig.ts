/**
 * Domain Entity: Batch Configuration
 * Configures batch processing behavior for large datasets
 */

export interface BatchConfigData {
  id: string;
  name: string;
  chunkSize: number;
  processingMode: 'sequential' | 'parallel';
  maxConcurrency?: number;
  errorHandling: 'fail-fast' | 'continue-on-error';
  retryFailedBatches: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BatchProgress {
  totalBatches: number;
  completedBatches: number;
  failedBatches: number;
  currentBatch: number;
  processedItems: number;
  totalItems: number;
  progress: number; // 0-100
}

/**
 * Batch Configuration Entity
 *
 * Configures how large datasets should be split and processed in batches:
 * - chunkSize: Number of items per batch
 * - processingMode: Sequential (one at a time) or Parallel (multiple concurrent)
 * - maxConcurrency: Max number of parallel batches (only for parallel mode)
 * - errorHandling: Stop on first error or continue processing remaining batches
 * - retryFailedBatches: Whether to retry failed batches after initial processing
 */
export class BatchConfig {
  private constructor(private data: BatchConfigData) {
    this.validate();
  }

  /**
   * Validate batch configuration
   */
  private validate(): void {
    if (this.data.chunkSize < 1) {
      throw new Error('Chunk size must be at least 1');
    }

    if (
      this.data.processingMode === 'parallel' &&
      this.data.maxConcurrency !== undefined &&
      this.data.maxConcurrency < 1
    ) {
      throw new Error('Max concurrency must be at least 1');
    }
  }

  // Getters
  getId(): string {
    return this.data.id;
  }

  getName(): string {
    return this.data.name;
  }

  getChunkSize(): number {
    return this.data.chunkSize;
  }

  getProcessingMode(): 'sequential' | 'parallel' {
    return this.data.processingMode;
  }

  getMaxConcurrency(): number | undefined {
    return this.data.maxConcurrency;
  }

  getErrorHandling(): 'fail-fast' | 'continue-on-error' {
    return this.data.errorHandling;
  }

  getRetryFailedBatches(): boolean {
    return this.data.retryFailedBatches;
  }

  getCreatedAt(): string {
    return this.data.createdAt;
  }

  getUpdatedAt(): string {
    return this.data.updatedAt;
  }

  // Setters (return new instances)
  setChunkSize(chunkSize: number): BatchConfig {
    return new BatchConfig({
      ...this.data,
      chunkSize,
      updatedAt: new Date().toISOString(),
    });
  }

  setProcessingMode(processingMode: 'sequential' | 'parallel'): BatchConfig {
    return new BatchConfig({
      ...this.data,
      processingMode,
      updatedAt: new Date().toISOString(),
    });
  }

  setMaxConcurrency(maxConcurrency: number | undefined): BatchConfig {
    return new BatchConfig({
      ...this.data,
      maxConcurrency,
      updatedAt: new Date().toISOString(),
    });
  }

  setErrorHandling(errorHandling: 'fail-fast' | 'continue-on-error'): BatchConfig {
    return new BatchConfig({
      ...this.data,
      errorHandling,
      updatedAt: new Date().toISOString(),
    });
  }

  setRetryFailedBatches(retryFailedBatches: boolean): BatchConfig {
    return new BatchConfig({
      ...this.data,
      retryFailedBatches,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Calculate total number of batches for given item count
   */
  calculateTotalBatches(itemCount: number): number {
    return Math.ceil(itemCount / this.data.chunkSize);
  }

  /**
   * Split array into batches
   */
  splitIntoBatches<T>(items: T[]): T[][] {
    const batches: T[][] = [];
    const totalBatches = this.calculateTotalBatches(items.length);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * this.data.chunkSize;
      const end = start + this.data.chunkSize;
      batches.push(items.slice(start, end));
    }

    return batches;
  }

  /**
   * Calculate progress
   */
  calculateProgress(completedBatches: number, totalBatches: number): BatchProgress {
    const progress = totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0;

    return {
      totalBatches,
      completedBatches,
      failedBatches: 0,
      currentBatch: completedBatches + 1,
      processedItems: completedBatches * this.data.chunkSize,
      totalItems: totalBatches * this.data.chunkSize,
      progress,
    };
  }

  // Factory methods
  static create(params: {
    name: string;
    chunkSize: number;
    processingMode?: 'sequential' | 'parallel';
    maxConcurrency?: number;
    errorHandling?: 'fail-fast' | 'continue-on-error';
    retryFailedBatches?: boolean;
  }): BatchConfig {
    const now = new Date().toISOString();
    const id = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return new BatchConfig({
      id,
      name: params.name,
      chunkSize: params.chunkSize,
      processingMode: params.processingMode || 'sequential',
      maxConcurrency: params.maxConcurrency,
      errorHandling: params.errorHandling || 'continue-on-error',
      retryFailedBatches: params.retryFailedBatches ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(data: BatchConfigData): BatchConfig {
    return new BatchConfig(data);
  }

  /**
   * Create default batch configuration
   * Chunk size: 100, Sequential processing, Continue on error
   */
  static default(): BatchConfig {
    return BatchConfig.create({
      name: 'Default Batch Config',
      chunkSize: 100,
      processingMode: 'sequential',
      errorHandling: 'continue-on-error',
      retryFailedBatches: false,
    });
  }

  /**
   * Create batch configuration for large datasets
   * Chunk size: 50, Parallel processing (3 concurrent), Continue on error
   */
  static largeDataset(): BatchConfig {
    return BatchConfig.create({
      name: 'Large Dataset Config',
      chunkSize: 50,
      processingMode: 'parallel',
      maxConcurrency: 3,
      errorHandling: 'continue-on-error',
      retryFailedBatches: true,
    });
  }

  /**
   * Create batch configuration for critical data
   * Chunk size: 10, Sequential processing, Fail fast
   */
  static criticalData(): BatchConfig {
    return BatchConfig.create({
      name: 'Critical Data Config',
      chunkSize: 10,
      processingMode: 'sequential',
      errorHandling: 'fail-fast',
      retryFailedBatches: true,
    });
  }

  toData(): BatchConfigData {
    return { ...this.data };
  }
}
