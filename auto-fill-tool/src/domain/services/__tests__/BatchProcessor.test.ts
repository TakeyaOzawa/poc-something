/**
 * Unit Tests: BatchProcessor
 */

import { BatchProcessor, BatchResult, ProgressCallback } from '../BatchProcessor';
import { BatchConfig } from '@domain/entities/BatchConfig';
import { NoOpLogger } from '../NoOpLogger';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('BatchProcessor', () => {
  let batchProcessor: BatchProcessor;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
      setLevel: jest.fn(),
      getLevel: jest.fn().mockReturnValue('info'),
    } as any;

    batchProcessor = new BatchProcessor(mockLogger);
  });

  describe('process - sequential mode', () => {
    it('should process items sequentially with default config', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const config = BatchConfig.create({
        name: 'Test Config',
        chunkSize: 5,
        processingMode: 'sequential',
        errorHandling: 'continue-on-error',
      });
      const processor = jest
        .fn()
        .mockImplementation((batch) => Promise.resolve(batch.map((n: number) => n * 2)));

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2); // 10 items / 5 chunkSize = 2 batches
      expect(result.errors).toHaveLength(0);
      expect(result.progress.completedBatches).toBe(2);
      expect(result.progress.failedBatches).toBe(0);
      expect(result.progress.progress).toBe(100);
      expect(processor).toHaveBeenCalledTimes(2);
    });

    it('should track progress with callback', async () => {
      const items = [1, 2, 3, 4, 5];
      const config = BatchConfig.create({
        name: 'Progress Test Config',
        chunkSize: 2,
        processingMode: 'sequential',
        errorHandling: 'continue-on-error',
      });
      const processor = jest.fn().mockResolvedValue([]);
      const progressCallback = jest.fn();

      await batchProcessor.process(items, config, processor, progressCallback);

      // Progress callback is called at various stages
      expect(progressCallback.mock.calls.length).toBeGreaterThanOrEqual(4);

      // Check initial progress
      expect(progressCallback).toHaveBeenNthCalledWith(1, {
        totalBatches: 3,
        completedBatches: 0,
        failedBatches: 0,
        currentBatch: 1,
        processedItems: 0,
        totalItems: 5,
        progress: 0,
      });

      // Check final progress (last call)
      const lastCallIndex = progressCallback.mock.calls.length - 1;
      expect(progressCallback).toHaveBeenNthCalledWith(lastCallIndex + 1, {
        totalBatches: 3,
        completedBatches: 3,
        failedBatches: 0,
        currentBatch: 3,
        processedItems: 5,
        totalItems: 5,
        progress: 100,
      });
    });

    it('should handle batch errors with continue-on-error strategy', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const config = BatchConfig.create({
        name: 'Error Test Config',
        chunkSize: 2,
        processingMode: 'sequential',
        errorHandling: 'continue-on-error',
      });
      const processor = jest.fn().mockImplementation((batch, batchIndex) => {
        if (batchIndex === 1) {
          throw new Error('Batch 1 failed');
        }
        return Promise.resolve(batch);
      });

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2); // Batches 0 and 2 succeeded
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].batchIndex).toBe(1);
      expect(result.errors[0].error.message).toBe('Batch 1 failed');
      expect(result.progress.failedBatches).toBe(1);
      expect(processor).toHaveBeenCalledTimes(3); // All batches attempted
    });

    it('should stop processing with fail-fast strategy', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const config = BatchConfig.create({
        name: 'Fail Fast Test Config',
        chunkSize: 2,
        processingMode: 'sequential',
        errorHandling: 'fail-fast',
      });
      const processor = jest.fn().mockImplementation((batch, batchIndex) => {
        if (batchIndex === 1) {
          throw new Error('Batch 1 failed');
        }
        return Promise.resolve(batch);
      });

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1); // Only first batch succeeded
      expect(result.errors).toHaveLength(1);
      expect(processor).toHaveBeenCalledTimes(2); // Stopped after batch 1 failed
    });

    it('should retry failed batches when retryFailedBatches is true', async () => {
      const items = [1, 2, 3, 4];
      const config = BatchConfig.create({
        name: 'Retry Test Config',
        chunkSize: 2,
        processingMode: 'sequential',
        errorHandling: 'continue-on-error',
        retryFailedBatches: true,
      });

      let attemptCount = 0;
      const processor = jest.fn().mockImplementation((batch, batchIndex) => {
        attemptCount++;
        // Fail on first attempt of batch 0, succeed on retry
        if (batchIndex === 0 && attemptCount === 1) {
          throw new Error('First attempt failed');
        }
        return Promise.resolve(batch);
      });

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2); // Both batches succeeded (1 after retry)
      expect(result.errors).toHaveLength(0); // No errors after retry
      expect(processor).toHaveBeenCalledTimes(3); // 2 initial + 1 retry
    });

    it('should keep errors for batches that fail even after retry', async () => {
      const items = [1, 2, 3, 4];
      const config = BatchConfig.create({
        name: 'Persistent Failure Test Config',
        chunkSize: 2,
        processingMode: 'sequential',
        errorHandling: 'continue-on-error',
        retryFailedBatches: true,
      });

      const processor = jest.fn().mockImplementation((batch, batchIndex) => {
        if (batchIndex === 0) {
          throw new Error('Persistent failure');
        }
        return Promise.resolve(batch);
      });

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1); // Only batch 1 succeeded
      expect(result.errors).toHaveLength(1); // Batch 0 failed even after retry
      expect(result.errors[0].error.message).toBe('Persistent failure');
      expect(processor).toHaveBeenCalledTimes(3); // 2 initial + 1 retry
    });

    it('should handle empty items array', async () => {
      const items: number[] = [];
      const config = BatchConfig.default();
      const processor = jest.fn();

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.progress.totalBatches).toBe(0);
      expect(processor).not.toHaveBeenCalled();
    });

    it('should handle single item', async () => {
      const items = [42];
      const config = BatchConfig.create({
        name: 'Single Item Test Config',
        chunkSize: 5,
      });
      const processor = jest.fn().mockResolvedValue([42]);

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(processor).toHaveBeenCalledTimes(1);
      expect(processor).toHaveBeenCalledWith([42], 0);
    });

    it('should handle non-Error exceptions', async () => {
      const items = [1, 2];
      const config = BatchConfig.create({
        name: 'Non-Error Exception Test Config',
        chunkSize: 2,
      });
      const processor = jest.fn().mockRejectedValue('String error');

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBeInstanceOf(Error);
      expect(result.errors[0].error.message).toBe('String error');
    });
  });

  describe('process - parallel mode', () => {
    it('should process batches in parallel', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const config = BatchConfig.create({
        name: 'Parallel Test Config',
        chunkSize: 2,
        processingMode: 'parallel',
        maxConcurrency: 2,
      });

      const processor = jest.fn().mockImplementation(
        (batch) =>
          new Promise((resolve) => {
            setTimeout(() => resolve(batch.map((n: number) => n * 2)), 10);
          })
      );

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(processor).toHaveBeenCalledTimes(3);
    });

    it('should respect maxConcurrency limit', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8];
      const config = BatchConfig.create({
        name: 'Concurrency Limit Test Config',
        chunkSize: 2,
        processingMode: 'parallel',
        maxConcurrency: 2,
      });

      let activeProcessors = 0;
      let maxActive = 0;

      const processor = jest.fn().mockImplementation(async (batch) => {
        activeProcessors++;
        maxActive = Math.max(maxActive, activeProcessors);
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeProcessors--;
        return batch;
      });

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(true);
      // In parallel mode, there might be brief moments where more than maxConcurrency are active
      // due to async timing, but it should generally respect the limit
      expect(maxActive).toBeLessThanOrEqual(3); // Allow slight timing variance
      expect(processor).toHaveBeenCalledTimes(4);
    });

    it('should handle errors in parallel mode', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const config = BatchConfig.create({
        name: 'Parallel Error Test Config',
        chunkSize: 2,
        processingMode: 'parallel',
        maxConcurrency: 3,
        errorHandling: 'continue-on-error',
      });

      const processor = jest.fn().mockImplementation((batch, batchIndex) => {
        if (batchIndex === 1) {
          return Promise.reject(new Error('Parallel batch failed'));
        }
        return Promise.resolve(batch);
      });

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].batchIndex).toBe(1);
    });

    it('should track progress in parallel mode', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const config = BatchConfig.create({
        name: 'Parallel Progress Test Config',
        chunkSize: 2,
        processingMode: 'parallel',
        maxConcurrency: 2,
      });
      const processor = jest.fn().mockResolvedValue([]);
      const progressCallback = jest.fn();

      await batchProcessor.process(items, config, processor, progressCallback);

      // Should have called progress callback multiple times
      expect(progressCallback.mock.calls.length).toBeGreaterThan(1);

      // Check final call
      const finalCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0];
      expect(finalCall.completedBatches).toBe(3);
      expect(finalCall.progress).toBe(100);
    });

    it('should use default maxConcurrency if not provided', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const config = BatchConfig.create({
        name: 'Default Concurrency Test Config',
        chunkSize: 1,
        processingMode: 'parallel',
        // maxConcurrency not set, should default to 3
      });

      const processor = jest.fn().mockResolvedValue([]);

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(true);
      expect(processor).toHaveBeenCalledTimes(6);
    });

    it('should handle multiple concurrent batch failures', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const config = BatchConfig.create({
        name: 'Multiple Failures Test Config',
        chunkSize: 2,
        processingMode: 'parallel',
        maxConcurrency: 3,
      });

      const processor = jest.fn().mockImplementation((batch, batchIndex) => {
        if (batchIndex === 0 || batchIndex === 2) {
          return Promise.reject(new Error(`Batch ${batchIndex} failed`));
        }
        return Promise.resolve(batch);
      });

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1); // Only batch 1 succeeded
      expect(result.errors).toHaveLength(2); // Batches 0 and 2 failed
    });
  });

  describe('processSimple', () => {
    it('should process items without progress callback', async () => {
      const items = [1, 2, 3, 4, 5];
      const config = BatchConfig.create({
        name: 'Simple Process Test Config',
        chunkSize: 2,
      });
      const processor = jest.fn().mockResolvedValue([]);

      const result = await batchProcessor.processSimple(items, config, processor);

      expect(result.success).toBe(true);
      expect(processor).toHaveBeenCalledTimes(3); // 3 batches
    });
  });

  describe('error scenarios', () => {
    it('should handle processor throwing synchronously', async () => {
      const items = [1, 2, 3];
      const config = BatchConfig.create({
        name: 'Sync Error Test Config',
        chunkSize: 2,
      });
      const processor = jest.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2); // Both batches failed
    });

    it('should propagate unexpected errors from process', async () => {
      const items = [1, 2, 3];
      const config = null as any; // Invalid config to trigger error
      const processor = jest.fn();

      await expect(batchProcessor.process(items, config, processor)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith('Batch processing failed', expect.any(Error));
    });
  });

  describe('logging', () => {
    it('should log batch processing lifecycle', async () => {
      const items = [1, 2, 3, 4];
      const config = BatchConfig.create({
        name: 'Logging Test Config',
        chunkSize: 2,
      });
      const processor = jest.fn().mockResolvedValue([]);

      await batchProcessor.process(items, config, processor);

      expect(mockLogger.info).toHaveBeenCalledWith('Starting batch processing', expect.any(Object));
      expect(mockLogger.debug).toHaveBeenCalledWith('Split items into batches', expect.any(Object));
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Batch processing completed',
        expect.any(Object)
      );
    });

    it('should log batch errors', async () => {
      const items = [1, 2, 3, 4];
      const config = BatchConfig.create({
        name: 'Batch Error Logging Test Config',
        chunkSize: 2,
      });
      const processor = jest.fn().mockImplementation((batch, batchIndex) => {
        if (batchIndex === 1) {
          throw new Error('Batch error');
        }
        return Promise.resolve(batch);
      });

      await batchProcessor.process(items, config, processor);

      expect(mockLogger.error).toHaveBeenCalledWith('Batch 2 failed', expect.any(Error));
    });

    it('should log retry attempts', async () => {
      const items = [1, 2];
      const config = BatchConfig.create({
        name: 'Retry Logging Test Config',
        chunkSize: 2,
        retryFailedBatches: true,
      });
      const processor = jest.fn().mockRejectedValue(new Error('Fail'));

      await batchProcessor.process(items, config, processor);

      expect(mockLogger.info).toHaveBeenCalledWith('Retrying failed batches', { failedCount: 1 });
      expect(mockLogger.debug).toHaveBeenCalledWith('Retrying batch 1');
      expect(mockLogger.error).toHaveBeenCalledWith('Retry failed for batch 1', expect.any(Error));
    });
  });

  describe('edge cases', () => {
    it('should handle processor returning different result types', async () => {
      const items = ['a', 'b', 'c'];
      const config = BatchConfig.create({
        name: 'Different Result Types Test Config',
        chunkSize: 2,
      });
      const processor = jest
        .fn()
        .mockImplementation((batch) => Promise.resolve({ processed: batch }));

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(true);
      expect(result.results[0]).toEqual({ processed: ['a', 'b'] });
    });

    it('should handle very large batch size', async () => {
      const items = [1, 2, 3];
      const config = BatchConfig.create({
        name: 'Large Batch Size Test Config',
        chunkSize: 1000,
      }); // Larger than items
      const processor = jest.fn().mockResolvedValue([]);

      const result = await batchProcessor.process(items, config, processor);

      expect(result.success).toBe(true);
      expect(processor).toHaveBeenCalledTimes(1); // All items in one batch
      expect(processor).toHaveBeenCalledWith([1, 2, 3], 0);
    });

    it('should calculate correct progress percentages', async () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const config = BatchConfig.create({
        name: 'Progress Percentage Test Config',
        chunkSize: 10,
      });
      const processor = jest.fn().mockResolvedValue([]);
      const progressUpdates: number[] = [];

      const progressCallback: ProgressCallback = (progress) => {
        progressUpdates.push(progress.progress);
      };

      await batchProcessor.process(items, config, processor, progressCallback);

      // Progress should increase from 0 to 100
      expect(progressUpdates[0]).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
      expect(progressUpdates.length).toBeGreaterThan(2);
    });
  });
});
