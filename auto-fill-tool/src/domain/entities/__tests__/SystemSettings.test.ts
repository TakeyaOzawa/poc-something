/**
 * Unit Tests: SystemSettings Entity
 */

import { SystemSettingsCollection } from '../SystemSettings';
import { LogLevel } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';
import { Result } from '@domain/values/result.value';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

// Helper function to unwrap Result for testing
function unwrapResult<T>(result: Result<T, Error>): T {
  if (result.isFailure) {
    throw result.error;
  }
  return result.value!;
}

describe('SystemSettingsCollection', () => {
  describe('constructor', () => {
    it('should create with default retry wait seconds', () => {
      const settings = new SystemSettingsCollection();
      expect(settings.getRetryWaitSecondsMin()).toBe(30);
      expect(settings.getRetryWaitSecondsMax()).toBe(60);
    });

    it('should create with default retry count', () => {
      const settings = new SystemSettingsCollection();
      expect(settings.getRetryCount()).toBe(3);
    });

    it('should create with default log level', () => {
      const settings = new SystemSettingsCollection();
      expect(settings.getLogLevel()).toBe(LogLevel.INFO);
    });

    it('should create with custom settings', () => {
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 20,
        retryCount: 5,
        logLevel: LogLevel.DEBUG,
      });
      expect(settings.getRetryWaitSecondsMin()).toBe(10);
      expect(settings.getRetryWaitSecondsMax()).toBe(20);
      expect(settings.getRetryCount()).toBe(5);
      expect(settings.getLogLevel()).toBe(LogLevel.DEBUG);
    });
  });

  describe('withRetryWaitSecondsMin', () => {
    it('should return new instance with updated retry wait seconds min', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryWaitSecondsMin(15);
      expect(result.isSuccess).toBe(true);
      const updated = unwrapResult(result);
      expect(updated.getRetryWaitSecondsMin()).toBe(15);
      expect(settings.getRetryWaitSecondsMin()).toBe(30); // Original unchanged
    });

    it('should return failure if min is less than 1', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryWaitSecondsMin(0);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Retry wait seconds min must be at least 1');
    });

    it('should return failure if min exceeds max', () => {
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 50,
      });
      const result = settings.withRetryWaitSecondsMin(60);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Retry wait seconds min must not exceed max');
    });
  });

  describe('withRetryWaitSecondsMax', () => {
    it('should return new instance with updated retry wait seconds max', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryWaitSecondsMax(100);
      expect(result.isSuccess).toBe(true);
      const updated = unwrapResult(result);
      expect(updated.getRetryWaitSecondsMax()).toBe(100);
      expect(settings.getRetryWaitSecondsMax()).toBe(60); // Original unchanged
    });

    it('should return failure if max is less than 1', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryWaitSecondsMax(0);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Retry wait seconds max must be at least 1');
    });

    it('should return failure if max is less than min', () => {
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 50,
        retryWaitSecondsMax: 100,
      });
      const result = settings.withRetryWaitSecondsMax(40);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Retry wait seconds max must not be less than min');
    });
  });

  describe('withRetryWaitSecondsRange', () => {
    it('should return new instance with updated retry wait seconds range', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryWaitSecondsRange(10, 20);
      expect(result.isSuccess).toBe(true);
      const updated = unwrapResult(result);
      expect(updated.getRetryWaitSecondsMin()).toBe(10);
      expect(updated.getRetryWaitSecondsMax()).toBe(20);
      expect(settings.getRetryWaitSecondsMin()).toBe(30); // Original unchanged
      expect(settings.getRetryWaitSecondsMax()).toBe(60); // Original unchanged
    });

    it('should allow setting min and max to same value', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryWaitSecondsRange(50, 50);
      expect(result.isSuccess).toBe(true);
      const updated = unwrapResult(result);
      expect(updated.getRetryWaitSecondsMin()).toBe(50);
      expect(updated.getRetryWaitSecondsMax()).toBe(50);
    });

    it('should return failure if min > max', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryWaitSecondsRange(100, 50);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Retry wait seconds min must not exceed max');
    });

    it('should return failure if min is less than 1', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryWaitSecondsRange(0, 50);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Retry wait seconds must be at least 1');
    });

    it('should return failure if max is less than 1', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryWaitSecondsRange(10, 0);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Retry wait seconds must be at least 1');
    });
  });

  describe('withRetryCount', () => {
    it('should return new instance with updated retry count', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryCount(5);
      expect(result.isSuccess).toBe(true);
      const updated = result.value!;
      expect(updated.getRetryCount()).toBe(5);
      expect(settings.getRetryCount()).toBe(3); // Original unchanged
    });

    it('should allow -1 for infinite retries', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryCount(-1);
      expect(result.isSuccess).toBe(true);
      const updated = result.value!;
      expect(updated.getRetryCount()).toBe(-1);
    });

    it('should return failure for values less than -1', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withRetryCount(-2);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Retry count must be -1 (infinite) or non-negative');
    });
  });

  describe('withLogLevel', () => {
    it('should return new instance with updated log level', () => {
      const settings = new SystemSettingsCollection();
      const result = settings.withLogLevel(LogLevel.DEBUG);
      expect(result.isSuccess).toBe(true);
      const updated = unwrapResult(result);
      expect(updated.getLogLevel()).toBe(LogLevel.DEBUG);
      expect(settings.getLogLevel()).toBe(LogLevel.INFO); // Original unchanged
    });

    it('should allow all log levels', () => {
      const settings = new SystemSettingsCollection();

      const debug = unwrapResult(settings.withLogLevel(LogLevel.DEBUG));
      expect(debug.getLogLevel()).toBe(LogLevel.DEBUG);

      const info = unwrapResult(settings.withLogLevel(LogLevel.INFO));
      expect(info.getLogLevel()).toBe(LogLevel.INFO);

      const warn = unwrapResult(settings.withLogLevel(LogLevel.WARN));
      expect(warn.getLogLevel()).toBe(LogLevel.WARN);

      const error = unwrapResult(settings.withLogLevel(LogLevel.ERROR));
      expect(error.getLogLevel()).toBe(LogLevel.ERROR);

      const none = unwrapResult(settings.withLogLevel(LogLevel.NONE));
      expect(none.getLogLevel()).toBe(LogLevel.NONE);
    });
  });

  describe('getAll', () => {
    it('should return all settings', () => {
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 20,
        retryCount: 5,
        logLevel: LogLevel.DEBUG,
      });

      const all = settings.getAll();

      expect(all.retryWaitSecondsMin).toBe(10);
      expect(all.retryWaitSecondsMax).toBe(20);
      expect(all.retryCount).toBe(5);
      expect(all.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should return a copy of settings', () => {
      const settings = new SystemSettingsCollection();
      const all = settings.getAll();
      all.retryWaitSecondsMin = 999;

      expect(settings.getRetryWaitSecondsMin()).toBe(30); // Should not be affected
    });
  });

  describe('Tab Recording Settings', () => {
    describe('constructor defaults', () => {
      it('should create with default tab recording settings', () => {
        const settings = new SystemSettingsCollection();
        expect(settings.getEnableTabRecording()).toBe(true);
        expect(settings.getRecordingBitrate()).toBe(2500000);
        expect(settings.getRecordingRetentionDays()).toBe(10);
      });

      it('should create with custom tab recording settings', () => {
        const settings = new SystemSettingsCollection({
          enableTabRecording: false,
          recordingBitrate: 5000000,
          recordingRetentionDays: 30,
        });
        expect(settings.getEnableTabRecording()).toBe(false);
        expect(settings.getRecordingBitrate()).toBe(5000000);
        expect(settings.getRecordingRetentionDays()).toBe(30);
      });
    });

    describe('withEnableTabRecording', () => {
      it('should return new instance with updated enableTabRecording', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withEnableTabRecording(false);
        expect(result.isSuccess).toBe(true);
        const updated = result.value!;
        expect(updated.getEnableTabRecording()).toBe(false);
        expect(settings.getEnableTabRecording()).toBe(true); // Original unchanged
      });

      it('should allow toggling tab recording', () => {
        const settings = new SystemSettingsCollection({ enableTabRecording: false });
        const result = settings.withEnableTabRecording(true);
        expect(result.isSuccess).toBe(true);
        const enabled = result.value!;
        expect(enabled.getEnableTabRecording()).toBe(true);
      });
    });

    describe('withRecordingBitrate', () => {
      it('should return new instance with updated recording bitrate', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withRecordingBitrate(5000000);
        expect(result.isSuccess).toBe(true);
        const updated = result.value!;
        expect(updated.getRecordingBitrate()).toBe(5000000);
        expect(settings.getRecordingBitrate()).toBe(2500000); // Original unchanged
      });

      it('should allow minimum bitrate (1kbps)', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withRecordingBitrate(1000);
        expect(result.isSuccess).toBe(true);
        const updated = result.value!;
        expect(updated.getRecordingBitrate()).toBe(1000);
      });

      it('should allow maximum bitrate (25Mbps)', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withRecordingBitrate(25000000);
        expect(result.isSuccess).toBe(true);
        const updated = result.value!;
        expect(updated.getRecordingBitrate()).toBe(25000000);
      });

      it('should return failure if bitrate is below minimum', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withRecordingBitrate(999);
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('Recording bitrate must be at least 1kbps (1000)');
      });

      it('should return failure if bitrate exceeds maximum', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withRecordingBitrate(25000001);
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain(
          'Recording bitrate must not exceed 25Mbps (25000000)'
        );
      });
    });

    describe('withRecordingRetentionDays', () => {
      it('should return new instance with updated retention days', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withRecordingRetentionDays(30);
        expect(result.isSuccess).toBe(true);
        const updated = result.value!;
        expect(updated.getRecordingRetentionDays()).toBe(30);
        expect(settings.getRecordingRetentionDays()).toBe(10); // Original unchanged
      });

      it('should allow minimum retention days (1)', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withRecordingRetentionDays(1);
        expect(result.isSuccess).toBe(true);
        const updated = result.value!;
        expect(updated.getRecordingRetentionDays()).toBe(1);
      });

      it('should allow maximum retention days (365)', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withRecordingRetentionDays(365);
        expect(result.isSuccess).toBe(true);
        const updated = result.value!;
        expect(updated.getRecordingRetentionDays()).toBe(365);
      });

      it('should return failure if retention days is less than 1', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withRecordingRetentionDays(0);
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('Recording retention days must be at least 1');
      });

      it('should return failure if retention days exceeds 365', () => {
        const settings = new SystemSettingsCollection();
        const result = settings.withRecordingRetentionDays(366);
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('Recording retention days must not exceed 365');
      });
    });

    describe('getAll with tab recording settings', () => {
      it('should include tab recording settings in getAll()', () => {
        const settings = new SystemSettingsCollection({
          enableTabRecording: false,
          recordingBitrate: 8000000,
          recordingRetentionDays: 15,
        });

        const all = settings.getAll();

        expect(all.enableTabRecording).toBe(false);
        expect(all.recordingBitrate).toBe(8000000);
        expect(all.recordingRetentionDays).toBe(15);
      });
    });
  });

  describe('immutability', () => {
    it('should not allow direct modification of settings', () => {
      const settings = new SystemSettingsCollection({ retryCount: 3 });
      expect(() => {
        (settings as any).settings.retryCount = 999;
      }).toThrow(); // Should throw because settings is frozen
    });

    it('should chain immutable operations', () => {
      const settings = new SystemSettingsCollection();
      const result1 = settings.withRetryWaitSecondsRange(10, 20);
      expect(result1.isSuccess).toBe(true);
      const result2 = result1.value!.withRetryCount(5);
      expect(result2.isSuccess).toBe(true);
      const result3 = result2.value!.withLogLevel(LogLevel.DEBUG);
      expect(result3.isSuccess).toBe(true);
      const updated = result3.value!;

      expect(updated.getRetryWaitSecondsMin()).toBe(10);
      expect(updated.getRetryWaitSecondsMax()).toBe(20);
      expect(updated.getRetryCount()).toBe(5);
      expect(updated.getLogLevel()).toBe(LogLevel.DEBUG);

      // Original should remain unchanged
      expect(settings.getRetryWaitSecondsMin()).toBe(30);
      expect(settings.getRetryWaitSecondsMax()).toBe(60);
      expect(settings.getRetryCount()).toBe(3);
      expect(settings.getLogLevel()).toBe(LogLevel.INFO);
    });

    it('should chain tab recording operations', () => {
      const settings = new SystemSettingsCollection();
      const result1 = settings.withEnableTabRecording(false);
      expect(result1.isSuccess).toBe(true);
      const result2 = result1.value!.withRecordingBitrate(8000000);
      expect(result2.isSuccess).toBe(true);
      const result3 = result2.value!.withRecordingRetentionDays(30);
      expect(result3.isSuccess).toBe(true);
      const updated = result3.value!;

      expect(updated.getEnableTabRecording()).toBe(false);
      expect(updated.getRecordingBitrate()).toBe(8000000);
      expect(updated.getRecordingRetentionDays()).toBe(30);

      // Original should remain unchanged
      expect(settings.getEnableTabRecording()).toBe(true);
      expect(settings.getRecordingBitrate()).toBe(2500000);
      expect(settings.getRecordingRetentionDays()).toBe(10);
    });
  });
});
