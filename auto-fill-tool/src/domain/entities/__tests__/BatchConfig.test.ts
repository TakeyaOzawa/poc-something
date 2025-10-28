/**
 * Domain Entity Test: Batch Configuration
 * Tests for batch processing configuration entity
 */

import { BatchConfig, BatchConfigData } from '../BatchConfig';

describe('BatchConfig Entity', () => {
  const validData: BatchConfigData = {
    id: 'batch-1737011234567-abc123',
    name: 'Test Batch Config',
    chunkSize: 50,
    processingMode: 'parallel',
    maxConcurrency: 3,
    errorHandling: 'continue-on-error',
    retryFailedBatches: true,
    createdAt: '2025-01-16T00:00:00.000Z',
    updatedAt: '2025-01-16T00:00:00.000Z',
  };

  describe('factory method: create', () => {
    beforeEach(() => {
      // Mock Date.now() for consistent ID generation
      jest.spyOn(Date, 'now').mockReturnValue(1737011234567);
      // Mock Math.random() for consistent ID generation
      jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create BatchConfig with required params', () => {
      const config = BatchConfig.create({
        name: 'Test Config',
        chunkSize: 100,
      });

      expect(config.getName()).toBe('Test Config');
      expect(config.getChunkSize()).toBe(100);
      expect(config.getProcessingMode()).toBe('sequential'); // default
      expect(config.getErrorHandling()).toBe('continue-on-error'); // default
      expect(config.getRetryFailedBatches()).toBe(false); // default
      expect(config.getId()).toMatch(/^batch-\d+-[a-z0-9]{7}$/);
      expect(config.getCreatedAt()).toBeTruthy();
      expect(config.getUpdatedAt()).toBeTruthy();
    });

    it('should create BatchConfig with all params', () => {
      const config = BatchConfig.create({
        name: 'Test Config',
        chunkSize: 50,
        processingMode: 'parallel',
        maxConcurrency: 5,
        errorHandling: 'fail-fast',
        retryFailedBatches: true,
      });

      expect(config.getName()).toBe('Test Config');
      expect(config.getChunkSize()).toBe(50);
      expect(config.getProcessingMode()).toBe('parallel');
      expect(config.getMaxConcurrency()).toBe(5);
      expect(config.getErrorHandling()).toBe('fail-fast');
      expect(config.getRetryFailedBatches()).toBe(true);
    });

    it('should throw error for invalid chunkSize', () => {
      expect(() =>
        BatchConfig.create({
          name: 'Invalid',
          chunkSize: 0,
        })
      ).toThrow('Chunk size must be at least 1');

      expect(() =>
        BatchConfig.create({
          name: 'Invalid',
          chunkSize: -1,
        })
      ).toThrow('Chunk size must be at least 1');
    });

    it('should throw error for invalid maxConcurrency in parallel mode', () => {
      expect(() =>
        BatchConfig.create({
          name: 'Invalid',
          chunkSize: 10,
          processingMode: 'parallel',
          maxConcurrency: 0,
        })
      ).toThrow('Max concurrency must be at least 1');

      expect(() =>
        BatchConfig.create({
          name: 'Invalid',
          chunkSize: 10,
          processingMode: 'parallel',
          maxConcurrency: -1,
        })
      ).toThrow('Max concurrency must be at least 1');
    });

    it('should allow undefined maxConcurrency', () => {
      const config = BatchConfig.create({
        name: 'Test',
        chunkSize: 10,
        processingMode: 'parallel',
      });

      expect(config.getMaxConcurrency()).toBeUndefined();
    });

    it('should generate unique IDs for different instances', () => {
      jest.restoreAllMocks();

      const config1 = BatchConfig.create({ name: 'Config 1', chunkSize: 10 });
      const config2 = BatchConfig.create({ name: 'Config 2', chunkSize: 20 });

      expect(config1.getId()).not.toBe(config2.getId());
    });
  });

  describe('factory method: fromData', () => {
    it('should restore BatchConfig from valid data', () => {
      const config = BatchConfig.fromData(validData);

      expect(config.getId()).toBe('batch-1737011234567-abc123');
      expect(config.getName()).toBe('Test Batch Config');
      expect(config.getChunkSize()).toBe(50);
      expect(config.getProcessingMode()).toBe('parallel');
      expect(config.getMaxConcurrency()).toBe(3);
      expect(config.getErrorHandling()).toBe('continue-on-error');
      expect(config.getRetryFailedBatches()).toBe(true);
      expect(config.getCreatedAt()).toBe('2025-01-16T00:00:00.000Z');
      expect(config.getUpdatedAt()).toBe('2025-01-16T00:00:00.000Z');
    });

    it('should throw error for invalid data', () => {
      const invalidData: BatchConfigData = {
        ...validData,
        chunkSize: 0,
      };

      expect(() => BatchConfig.fromData(invalidData)).toThrow('Chunk size must be at least 1');
    });
  });

  describe('factory method: default', () => {
    it('should create default configuration', () => {
      const config = BatchConfig.default();

      expect(config.getName()).toBe('Default Batch Config');
      expect(config.getChunkSize()).toBe(100);
      expect(config.getProcessingMode()).toBe('sequential');
      expect(config.getErrorHandling()).toBe('continue-on-error');
      expect(config.getRetryFailedBatches()).toBe(false);
    });
  });

  describe('factory method: largeDataset', () => {
    it('should create large dataset configuration', () => {
      const config = BatchConfig.largeDataset();

      expect(config.getName()).toBe('Large Dataset Config');
      expect(config.getChunkSize()).toBe(50);
      expect(config.getProcessingMode()).toBe('parallel');
      expect(config.getMaxConcurrency()).toBe(3);
      expect(config.getErrorHandling()).toBe('continue-on-error');
      expect(config.getRetryFailedBatches()).toBe(true);
    });
  });

  describe('factory method: criticalData', () => {
    it('should create critical data configuration', () => {
      const config = BatchConfig.criticalData();

      expect(config.getName()).toBe('Critical Data Config');
      expect(config.getChunkSize()).toBe(10);
      expect(config.getProcessingMode()).toBe('sequential');
      expect(config.getErrorHandling()).toBe('fail-fast');
      expect(config.getRetryFailedBatches()).toBe(true);
    });
  });

  describe('getters', () => {
    let config: BatchConfig;

    beforeEach(() => {
      config = BatchConfig.fromData(validData);
    });

    it('should get id', () => {
      expect(config.getId()).toBe('batch-1737011234567-abc123');
    });

    it('should get name', () => {
      expect(config.getName()).toBe('Test Batch Config');
    });

    it('should get chunkSize', () => {
      expect(config.getChunkSize()).toBe(50);
    });

    it('should get processingMode', () => {
      expect(config.getProcessingMode()).toBe('parallel');
    });

    it('should get maxConcurrency', () => {
      expect(config.getMaxConcurrency()).toBe(3);
    });

    it('should get errorHandling', () => {
      expect(config.getErrorHandling()).toBe('continue-on-error');
    });

    it('should get retryFailedBatches', () => {
      expect(config.getRetryFailedBatches()).toBe(true);
    });

    it('should get createdAt', () => {
      expect(config.getCreatedAt()).toBe('2025-01-16T00:00:00.000Z');
    });

    it('should get updatedAt', () => {
      expect(config.getUpdatedAt()).toBe('2025-01-16T00:00:00.000Z');
    });
  });

  describe('setters (immutability)', () => {
    let config: BatchConfig;

    beforeEach(() => {
      config = BatchConfig.fromData(validData);
    });

    it('should set chunkSize and return new instance', () => {
      const updated = config.setChunkSize(100);

      expect(updated).not.toBe(config);
      expect(updated.getChunkSize()).toBe(100);
      expect(config.getChunkSize()).toBe(50); // Original unchanged
    });

    it('should throw error for invalid chunkSize', () => {
      expect(() => config.setChunkSize(0)).toThrow('Chunk size must be at least 1');
      expect(() => config.setChunkSize(-1)).toThrow('Chunk size must be at least 1');
    });

    it('should set processingMode and return new instance', () => {
      const updated = config.setProcessingMode('sequential');

      expect(updated).not.toBe(config);
      expect(updated.getProcessingMode()).toBe('sequential');
      expect(config.getProcessingMode()).toBe('parallel'); // Original unchanged
    });

    it('should set maxConcurrency and return new instance', () => {
      const updated = config.setMaxConcurrency(5);

      expect(updated).not.toBe(config);
      expect(updated.getMaxConcurrency()).toBe(5);
      expect(config.getMaxConcurrency()).toBe(3); // Original unchanged
    });

    it('should throw error for invalid maxConcurrency in parallel mode', () => {
      expect(() => config.setMaxConcurrency(0)).toThrow('Max concurrency must be at least 1');
      expect(() => config.setMaxConcurrency(-1)).toThrow('Max concurrency must be at least 1');
    });

    it('should allow setting maxConcurrency to undefined', () => {
      const updated = config.setMaxConcurrency(undefined);

      expect(updated.getMaxConcurrency()).toBeUndefined();
    });

    it('should set errorHandling and return new instance', () => {
      const updated = config.setErrorHandling('fail-fast');

      expect(updated).not.toBe(config);
      expect(updated.getErrorHandling()).toBe('fail-fast');
      expect(config.getErrorHandling()).toBe('continue-on-error'); // Original unchanged
    });

    it('should set retryFailedBatches and return new instance', () => {
      const updated = config.setRetryFailedBatches(false);

      expect(updated).not.toBe(config);
      expect(updated.getRetryFailedBatches()).toBe(false);
      expect(config.getRetryFailedBatches()).toBe(true); // Original unchanged
    });

    it('should update updatedAt when setting properties', () => {
      const originalUpdatedAt = config.getUpdatedAt();

      // Mock a later time
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-17T00:00:00.000Z');

      const updated = config.setChunkSize(100);

      expect(updated.getUpdatedAt()).not.toBe(originalUpdatedAt);
      expect(updated.getUpdatedAt()).toBe('2025-01-17T00:00:00.000Z');

      jest.restoreAllMocks();
    });
  });

  describe('method: calculateTotalBatches', () => {
    it('should calculate correct number of batches', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 10 });

      expect(config.calculateTotalBatches(0)).toBe(0);
      expect(config.calculateTotalBatches(1)).toBe(1);
      expect(config.calculateTotalBatches(5)).toBe(1);
      expect(config.calculateTotalBatches(10)).toBe(1);
      expect(config.calculateTotalBatches(11)).toBe(2);
      expect(config.calculateTotalBatches(20)).toBe(2);
      expect(config.calculateTotalBatches(21)).toBe(3);
      expect(config.calculateTotalBatches(100)).toBe(10);
    });

    it('should handle different chunk sizes', () => {
      const config1 = BatchConfig.create({ name: 'Test', chunkSize: 1 });
      expect(config1.calculateTotalBatches(100)).toBe(100);

      const config2 = BatchConfig.create({ name: 'Test', chunkSize: 50 });
      expect(config2.calculateTotalBatches(100)).toBe(2);

      const config3 = BatchConfig.create({ name: 'Test', chunkSize: 100 });
      expect(config3.calculateTotalBatches(100)).toBe(1);

      const config4 = BatchConfig.create({ name: 'Test', chunkSize: 200 });
      expect(config4.calculateTotalBatches(100)).toBe(1);
    });
  });

  describe('method: splitIntoBatches', () => {
    it('should split array into batches of correct size', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 3 });
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const batches = config.splitIntoBatches(items);

      expect(batches).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
      expect(batches.length).toBe(4);
    });

    it('should handle exact division', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 5 });
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const batches = config.splitIntoBatches(items);

      expect(batches).toEqual([
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
      ]);
      expect(batches.length).toBe(2);
    });

    it('should handle single batch', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 100 });
      const items = [1, 2, 3, 4, 5];

      const batches = config.splitIntoBatches(items);

      expect(batches).toEqual([[1, 2, 3, 4, 5]]);
      expect(batches.length).toBe(1);
    });

    it('should handle empty array', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 10 });
      const items: number[] = [];

      const batches = config.splitIntoBatches(items);

      expect(batches).toEqual([]);
      expect(batches.length).toBe(0);
    });

    it('should handle generic types', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 2 });

      // Test with strings
      const strings = ['a', 'b', 'c', 'd', 'e'];
      const stringBatches = config.splitIntoBatches(strings);
      expect(stringBatches).toEqual([['a', 'b'], ['c', 'd'], ['e']]);

      // Test with objects
      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const objectBatches = config.splitIntoBatches(objects);
      expect(objectBatches).toEqual([[{ id: 1 }, { id: 2 }], [{ id: 3 }]]);
    });

    it('should not mutate original array', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 2 });
      const items = [1, 2, 3, 4, 5];
      const originalLength = items.length;

      config.splitIntoBatches(items);

      expect(items.length).toBe(originalLength);
      expect(items).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('method: calculateProgress', () => {
    it('should calculate progress correctly', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 10 });

      const progress = config.calculateProgress(5, 10);

      expect(progress).toEqual({
        totalBatches: 10,
        completedBatches: 5,
        failedBatches: 0,
        currentBatch: 6,
        processedItems: 50,
        totalItems: 100,
        progress: 50,
      });
    });

    it('should handle 0% progress', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 20 });

      const progress = config.calculateProgress(0, 10);

      expect(progress).toEqual({
        totalBatches: 10,
        completedBatches: 0,
        failedBatches: 0,
        currentBatch: 1,
        processedItems: 0,
        totalItems: 200,
        progress: 0,
      });
    });

    it('should handle 100% progress', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 10 });

      const progress = config.calculateProgress(10, 10);

      expect(progress).toEqual({
        totalBatches: 10,
        completedBatches: 10,
        failedBatches: 0,
        currentBatch: 11,
        processedItems: 100,
        totalItems: 100,
        progress: 100,
      });
    });

    it('should handle 0 total batches', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 10 });

      const progress = config.calculateProgress(0, 0);

      expect(progress).toEqual({
        totalBatches: 0,
        completedBatches: 0,
        failedBatches: 0,
        currentBatch: 1,
        processedItems: 0,
        totalItems: 0,
        progress: 0,
      });
    });

    it('should round progress to nearest integer', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 10 });

      const progress1 = config.calculateProgress(1, 3);
      expect(progress1.progress).toBe(33); // 1/3 = 0.333... → 33

      const progress2 = config.calculateProgress(2, 3);
      expect(progress2.progress).toBe(67); // 2/3 = 0.666... → 67
    });

    it('should calculate items correctly with different chunk sizes', () => {
      const config1 = BatchConfig.create({ name: 'Test', chunkSize: 5 });
      const progress1 = config1.calculateProgress(3, 10);
      expect(progress1.processedItems).toBe(15); // 3 * 5
      expect(progress1.totalItems).toBe(50); // 10 * 5

      const config2 = BatchConfig.create({ name: 'Test', chunkSize: 100 });
      const progress2 = config2.calculateProgress(2, 5);
      expect(progress2.processedItems).toBe(200); // 2 * 100
      expect(progress2.totalItems).toBe(500); // 5 * 100
    });
  });

  describe('method: toData', () => {
    it('should convert to plain data object', () => {
      const config = BatchConfig.fromData(validData);
      const data = config.toData();

      expect(data).toEqual(validData);
    });

    it('should return a copy (immutability)', () => {
      const config = BatchConfig.fromData(validData);
      const data1 = config.toData();
      const data2 = config.toData();

      expect(data1).toEqual(data2);
      expect(data1).not.toBe(data2);

      // Mutating returned data should not affect entity
      data1.chunkSize = 999;
      expect(config.getChunkSize()).toBe(50);
    });

    it('should include all fields', () => {
      const config = BatchConfig.fromData(validData);
      const data = config.toData();

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('chunkSize');
      expect(data).toHaveProperty('processingMode');
      expect(data).toHaveProperty('maxConcurrency');
      expect(data).toHaveProperty('errorHandling');
      expect(data).toHaveProperty('retryFailedBatches');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });
  });

  describe('edge cases', () => {
    it('should handle very large chunk sizes', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 1000000 });

      expect(config.calculateTotalBatches(100)).toBe(1);
      expect(config.calculateTotalBatches(1000000)).toBe(1);
      expect(config.calculateTotalBatches(1000001)).toBe(2);
    });

    it('should handle chunk size of 1', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 1 });
      const items = [1, 2, 3];

      const batches = config.splitIntoBatches(items);

      expect(batches).toEqual([[1], [2], [3]]);
      expect(batches.length).toBe(3);
    });

    it('should handle very large arrays', () => {
      const config = BatchConfig.create({ name: 'Test', chunkSize: 100 });
      const items = Array.from({ length: 10000 }, (_, i) => i);

      const batches = config.splitIntoBatches(items);

      expect(batches.length).toBe(100);
      expect(batches[0].length).toBe(100);
      expect(batches[99].length).toBe(100);
    });

    it('should handle all processing modes', () => {
      const sequential = BatchConfig.create({
        name: 'Sequential',
        chunkSize: 10,
        processingMode: 'sequential',
      });
      expect(sequential.getProcessingMode()).toBe('sequential');

      const parallel = BatchConfig.create({
        name: 'Parallel',
        chunkSize: 10,
        processingMode: 'parallel',
      });
      expect(parallel.getProcessingMode()).toBe('parallel');
    });

    it('should handle all error handling modes', () => {
      const failFast = BatchConfig.create({
        name: 'Fail Fast',
        chunkSize: 10,
        errorHandling: 'fail-fast',
      });
      expect(failFast.getErrorHandling()).toBe('fail-fast');

      const continueOnError = BatchConfig.create({
        name: 'Continue on Error',
        chunkSize: 10,
        errorHandling: 'continue-on-error',
      });
      expect(continueOnError.getErrorHandling()).toBe('continue-on-error');
    });

    it('should handle both retryFailedBatches values', () => {
      const withRetry = BatchConfig.create({
        name: 'With Retry',
        chunkSize: 10,
        retryFailedBatches: true,
      });
      expect(withRetry.getRetryFailedBatches()).toBe(true);

      const noRetry = BatchConfig.create({
        name: 'No Retry',
        chunkSize: 10,
        retryFailedBatches: false,
      });
      expect(noRetry.getRetryFailedBatches()).toBe(false);
    });
  });
});
