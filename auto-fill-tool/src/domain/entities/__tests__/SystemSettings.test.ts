/**
 * Unit Tests: SystemSettings Entity
 */

import { SystemSettingsCollection } from '../SystemSettings';
import { LogLevel } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

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
      const updated = settings.withRetryWaitSecondsMin(15);
      expect(updated.getRetryWaitSecondsMin()).toBe(15);
      expect(settings.getRetryWaitSecondsMin()).toBe(30); // Original unchanged
    });

    it('should throw error if min is less than 1', () => {
      const settings = new SystemSettingsCollection();
      expect(() => settings.withRetryWaitSecondsMin(0)).toThrow(
        'Retry wait seconds min must be at least 1'
      );
    });

    it('should throw error if min exceeds max', () => {
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 50,
      });
      expect(() => settings.withRetryWaitSecondsMin(60)).toThrow(
        'Retry wait seconds min must not exceed max'
      );
    });
  });

  describe('withRetryWaitSecondsMax', () => {
    it('should return new instance with updated retry wait seconds max', () => {
      const settings = new SystemSettingsCollection();
      const updated = settings.withRetryWaitSecondsMax(100);
      expect(updated.getRetryWaitSecondsMax()).toBe(100);
      expect(settings.getRetryWaitSecondsMax()).toBe(60); // Original unchanged
    });

    it('should throw error if max is less than 1', () => {
      const settings = new SystemSettingsCollection();
      expect(() => settings.withRetryWaitSecondsMax(0)).toThrow(
        'Retry wait seconds max must be at least 1'
      );
    });

    it('should throw error if max is less than min', () => {
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 50,
        retryWaitSecondsMax: 100,
      });
      expect(() => settings.withRetryWaitSecondsMax(40)).toThrow(
        'Retry wait seconds max must not be less than min'
      );
    });
  });

  describe('withRetryWaitSecondsRange', () => {
    it('should return new instance with updated retry wait seconds range', () => {
      const settings = new SystemSettingsCollection();
      const updated = settings.withRetryWaitSecondsRange(10, 20);
      expect(updated.getRetryWaitSecondsMin()).toBe(10);
      expect(updated.getRetryWaitSecondsMax()).toBe(20);
      expect(settings.getRetryWaitSecondsMin()).toBe(30); // Original unchanged
      expect(settings.getRetryWaitSecondsMax()).toBe(60); // Original unchanged
    });

    it('should allow setting min and max to same value', () => {
      const settings = new SystemSettingsCollection();
      const updated = settings.withRetryWaitSecondsRange(50, 50);
      expect(updated.getRetryWaitSecondsMin()).toBe(50);
      expect(updated.getRetryWaitSecondsMax()).toBe(50);
    });

    it('should throw error if min > max', () => {
      const settings = new SystemSettingsCollection();
      expect(() => settings.withRetryWaitSecondsRange(100, 50)).toThrow(
        'Retry wait seconds min must not exceed max'
      );
    });

    it('should throw error if min is less than 1', () => {
      const settings = new SystemSettingsCollection();
      expect(() => settings.withRetryWaitSecondsRange(0, 50)).toThrow(
        'Retry wait seconds must be at least 1'
      );
    });

    it('should throw error if max is less than 1', () => {
      const settings = new SystemSettingsCollection();
      expect(() => settings.withRetryWaitSecondsRange(10, 0)).toThrow(
        'Retry wait seconds must be at least 1'
      );
    });
  });

  describe('withRetryCount', () => {
    it('should return new instance with updated retry count', () => {
      const settings = new SystemSettingsCollection();
      const updated = settings.withRetryCount(5);
      expect(updated.getRetryCount()).toBe(5);
      expect(settings.getRetryCount()).toBe(3); // Original unchanged
    });

    it('should allow -1 for infinite retries', () => {
      const settings = new SystemSettingsCollection();
      const updated = settings.withRetryCount(-1);
      expect(updated.getRetryCount()).toBe(-1);
    });

    it('should throw error for values less than -1', () => {
      const settings = new SystemSettingsCollection();
      expect(() => settings.withRetryCount(-2)).toThrow(
        'Retry count must be -1 (infinite) or non-negative'
      );
    });
  });

  describe('withLogLevel', () => {
    it('should return new instance with updated log level', () => {
      const settings = new SystemSettingsCollection();
      const updated = settings.withLogLevel(LogLevel.DEBUG);
      expect(updated.getLogLevel()).toBe(LogLevel.DEBUG);
      expect(settings.getLogLevel()).toBe(LogLevel.INFO); // Original unchanged
    });

    it('should allow all log levels', () => {
      const settings = new SystemSettingsCollection();

      const debug = settings.withLogLevel(LogLevel.DEBUG);
      expect(debug.getLogLevel()).toBe(LogLevel.DEBUG);

      const info = settings.withLogLevel(LogLevel.INFO);
      expect(info.getLogLevel()).toBe(LogLevel.INFO);

      const warn = settings.withLogLevel(LogLevel.WARN);
      expect(warn.getLogLevel()).toBe(LogLevel.WARN);

      const error = settings.withLogLevel(LogLevel.ERROR);
      expect(error.getLogLevel()).toBe(LogLevel.ERROR);

      const none = settings.withLogLevel(LogLevel.NONE);
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
        const updated = settings.withEnableTabRecording(false);
        expect(updated.getEnableTabRecording()).toBe(false);
        expect(settings.getEnableTabRecording()).toBe(true); // Original unchanged
      });

      it('should allow toggling tab recording', () => {
        const settings = new SystemSettingsCollection({ enableTabRecording: false });
        const enabled = settings.withEnableTabRecording(true);
        expect(enabled.getEnableTabRecording()).toBe(true);
      });
    });

    describe('withRecordingBitrate', () => {
      it('should return new instance with updated recording bitrate', () => {
        const settings = new SystemSettingsCollection();
        const updated = settings.withRecordingBitrate(5000000);
        expect(updated.getRecordingBitrate()).toBe(5000000);
        expect(settings.getRecordingBitrate()).toBe(2500000); // Original unchanged
      });

      it('should allow minimum bitrate (1kbps)', () => {
        const settings = new SystemSettingsCollection();
        const updated = settings.withRecordingBitrate(1000);
        expect(updated.getRecordingBitrate()).toBe(1000);
      });

      it('should allow maximum bitrate (25Mbps)', () => {
        const settings = new SystemSettingsCollection();
        const updated = settings.withRecordingBitrate(25000000);
        expect(updated.getRecordingBitrate()).toBe(25000000);
      });

      it('should throw error if bitrate is below minimum', () => {
        const settings = new SystemSettingsCollection();
        expect(() => settings.withRecordingBitrate(999)).toThrow(
          'Recording bitrate must be at least 1kbps (1000)'
        );
      });

      it('should throw error if bitrate exceeds maximum', () => {
        const settings = new SystemSettingsCollection();
        expect(() => settings.withRecordingBitrate(25000001)).toThrow(
          'Recording bitrate must not exceed 25Mbps (25000000)'
        );
      });
    });

    describe('withRecordingRetentionDays', () => {
      it('should return new instance with updated retention days', () => {
        const settings = new SystemSettingsCollection();
        const updated = settings.withRecordingRetentionDays(30);
        expect(updated.getRecordingRetentionDays()).toBe(30);
        expect(settings.getRecordingRetentionDays()).toBe(10); // Original unchanged
      });

      it('should allow minimum retention days (1)', () => {
        const settings = new SystemSettingsCollection();
        const updated = settings.withRecordingRetentionDays(1);
        expect(updated.getRecordingRetentionDays()).toBe(1);
      });

      it('should allow maximum retention days (365)', () => {
        const settings = new SystemSettingsCollection();
        const updated = settings.withRecordingRetentionDays(365);
        expect(updated.getRecordingRetentionDays()).toBe(365);
      });

      it('should throw error if retention days is less than 1', () => {
        const settings = new SystemSettingsCollection();
        expect(() => settings.withRecordingRetentionDays(0)).toThrow(
          'Recording retention days must be at least 1'
        );
      });

      it('should throw error if retention days exceeds 365', () => {
        const settings = new SystemSettingsCollection();
        expect(() => settings.withRecordingRetentionDays(366)).toThrow(
          'Recording retention days must not exceed 365'
        );
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
      const updated = settings
        .withRetryWaitSecondsRange(10, 20)
        .withRetryCount(5)
        .withLogLevel(LogLevel.DEBUG);

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
      const updated = settings
        .withEnableTabRecording(false)
        .withRecordingBitrate(8000000)
        .withRecordingRetentionDays(30);

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
