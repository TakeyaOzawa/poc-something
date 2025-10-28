/**
 * Unit Tests: SystemSettingsMapper
 */

import { SystemSettingsMapper } from '../SystemSettingsMapper';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { LogLevel } from '@domain/types/logger.types';

describe('SystemSettingsMapper', () => {
  describe('toJSON', () => {
    it('should convert SystemSettingsCollection to JSON string', () => {
      const collection = new SystemSettingsCollection({
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 20,
        retryCount: 5,
      });
      const json = SystemSettingsMapper.toJSON(collection);
      expect(json).toContain('"retryWaitSecondsMin": 10');
      expect(json).toContain('"retryWaitSecondsMax": 20');
      expect(json).toContain('"retryCount": 5');
    });

    it('should handle default settings', () => {
      const collection = new SystemSettingsCollection();
      const json = SystemSettingsMapper.toJSON(collection);
      expect(json).toContain('"retryWaitSecondsMin": 30');
      expect(json).toContain('"retryWaitSecondsMax": 60');
      expect(json).toContain('"retryCount": 3');
    });
  });

  describe('fromJSON', () => {
    it('should create SystemSettingsCollection from JSON string with min/max', () => {
      const json = '{"retryWaitSecondsMin":10,"retryWaitSecondsMax":20,"retryCount":5}';
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getRetryWaitSecondsMin()).toBe(10);
      expect(collection.getRetryWaitSecondsMax()).toBe(20);
      expect(collection.getRetryCount()).toBe(5);
    });

    it('should handle backward compatibility with old retryWaitSeconds field', () => {
      const json = '{"retryWaitSeconds":180}';
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getRetryWaitSecondsMin()).toBe(180);
      expect(collection.getRetryWaitSecondsMax()).toBe(180);
    });

    it('should handle missing fields with defaults', () => {
      const json = '{}';
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getRetryWaitSecondsMin()).toBe(30);
      expect(collection.getRetryWaitSecondsMax()).toBe(60);
      expect(collection.getRetryCount()).toBe(3);
    });

    it('should return default settings for invalid JSON', () => {
      const collection = SystemSettingsMapper.fromJSON('invalid json', new NoOpLogger());
      expect(collection.getRetryWaitSecondsMin()).toBe(30);
      expect(collection.getRetryWaitSecondsMax()).toBe(60);
      expect(collection.getRetryCount()).toBe(3);
    });

    it('should handle only retryWaitSecondsMin', () => {
      const json = '{"retryWaitSecondsMin":15}';
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getRetryWaitSecondsMin()).toBe(15);
      // Max should remain at default
      expect(collection.getRetryWaitSecondsMax()).toBe(60);
    });

    it('should handle only retryWaitSecondsMax', () => {
      const json = '{"retryWaitSecondsMax":90}';
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      // Min should remain at default
      expect(collection.getRetryWaitSecondsMin()).toBe(30);
      expect(collection.getRetryWaitSecondsMax()).toBe(90);
    });

    it('should handle showAutoFillProgressDialog', () => {
      const json = '{"showAutoFillProgressDialog":true}';
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getAutoFillProgressDialogMode()).toBe('withCancel');
    });

    it('should handle backward compatible showXPathInAutoFillProgressDialog', () => {
      const json = '{"showXPathInAutoFillProgressDialog":false}';
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getAutoFillProgressDialogMode()).toBe('hidden');
    });

    it('should handle backward compatible showXPathDialogDuringAutoFill', () => {
      const json = '{"showXPathDialogDuringAutoFill":true}';
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getAutoFillProgressDialogMode()).toBe('withCancel');
    });

    it('should handle waitForOptionsMilliseconds', () => {
      const json = '{"waitForOptionsMilliseconds":5000}';
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getWaitForOptionsMilliseconds()).toBe(5000);
    });

    it('should handle logLevel', () => {
      const json = `{"logLevel":${LogLevel.DEBUG}}`;
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    it('should handle all log levels', () => {
      Object.values(LogLevel)
        .filter((v) => typeof v === 'number')
        .forEach((level) => {
          const json = `{"logLevel":${level}}`;
          const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
          expect(collection.getLogLevel()).toBe(level);
        });
    });

    it('should handle all settings together', () => {
      const json = JSON.stringify({
        retryWaitSecondsMin: 15,
        retryWaitSecondsMax: 45,
        retryCount: 7,
        showAutoFillProgressDialog: false,
        waitForOptionsMilliseconds: 8000,
        logLevel: LogLevel.WARN,
      });
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getRetryWaitSecondsMin()).toBe(15);
      expect(collection.getRetryWaitSecondsMax()).toBe(45);
      expect(collection.getRetryCount()).toBe(7);
      expect(collection.getAutoFillProgressDialogMode()).toBe('hidden');
      expect(collection.getWaitForOptionsMilliseconds()).toBe(8000);
      expect(collection.getLogLevel()).toBe(LogLevel.WARN);
    });

    it('should log error for invalid JSON', () => {
      const mockLogger = {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      } as any;

      SystemSettingsMapper.fromJSON('invalid json', mockLogger);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to parse system settings JSON',
        expect.any(Error)
      );
    });

    it('should handle gradient background settings', () => {
      const json = JSON.stringify({
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
      });
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getGradientStartColor()).toBe('#667eea');
      expect(collection.getGradientEndColor()).toBe('#764ba2');
      expect(collection.getGradientAngle()).toBe(135);
    });

    it('should handle all settings including gradient', () => {
      const json = JSON.stringify({
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 20,
        retryCount: 5,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 500,
        logLevel: LogLevel.INFO,
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        gradientStartColor: '#123456',
        gradientEndColor: '#abcdef',
        gradientAngle: 90,
      });
      const collection = SystemSettingsMapper.fromJSON(json, new NoOpLogger());
      expect(collection.getRetryWaitSecondsMin()).toBe(10);
      expect(collection.getRetryWaitSecondsMax()).toBe(20);
      expect(collection.getRetryCount()).toBe(5);
      expect(collection.getAutoFillProgressDialogMode()).toBe('withCancel');
      expect(collection.getWaitForOptionsMilliseconds()).toBe(500);
      expect(collection.getLogLevel()).toBe(LogLevel.INFO);
      expect(collection.getEnableTabRecording()).toBe(true);
      expect(collection.getEnableAudioRecording()).toBe(false);
      expect(collection.getRecordingBitrate()).toBe(2500000);
      expect(collection.getRecordingRetentionDays()).toBe(10);
      expect(collection.getGradientStartColor()).toBe('#123456');
      expect(collection.getGradientEndColor()).toBe('#abcdef');
      expect(collection.getGradientAngle()).toBe(90);
    });
  });

  describe('toJSON with gradient settings', () => {
    it('should include gradient settings in JSON output', () => {
      const collection = new SystemSettingsCollection({
        gradientStartColor: '#ff0000',
        gradientEndColor: '#00ff00',
        gradientAngle: 180,
      });
      const json = SystemSettingsMapper.toJSON(collection);
      expect(json).toContain('"gradientStartColor": "#ff0000"');
      expect(json).toContain('"gradientEndColor": "#00ff00"');
      expect(json).toContain('"gradientAngle": 180');
    });
  });
});
