/**
 * Mock helper for SystemSettings
 */

import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

export function createMockSystemSettings(overrides?: Partial<any>): SystemSettingsCollection {
  const mockSettings = {
    getRetryWaitSecondsMin: jest.fn().mockReturnValue(30),
    getRetryWaitSecondsMax: jest.fn().mockReturnValue(60),
    getRetryCount: jest.fn().mockReturnValue(3),
    getAutoFillProgressDialogMode: jest.fn().mockReturnValue('withCancel'),
    getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(500),
    getLogLevel: jest.fn().mockReturnValue(LogLevel.INFO),
    getEnableTabRecording: jest.fn().mockReturnValue(true),
    getEnableAudioRecording: jest.fn().mockReturnValue(false),
    getRecordingBitrate: jest.fn().mockReturnValue(2500000),
    getRecordingRetentionDays: jest.fn().mockReturnValue(10),
    getGradientStartColor: jest.fn().mockReturnValue('#667eea'),
    getGradientEndColor: jest.fn().mockReturnValue('#764ba2'),
    getGradientAngle: jest.fn().mockReturnValue(135),
    getEnabledLogSources: jest.fn().mockReturnValue(['background', 'popup', 'content-script']),
    getSecurityEventsOnly: jest.fn().mockReturnValue(false),
    getMaxStoredLogs: jest.fn().mockReturnValue(100),
    getLogRetentionDays: jest.fn().mockReturnValue(7),
    getAll: jest.fn().mockReturnValue({}),
    ...overrides,
  };

  return mockSettings as any;
}

export function createMockSystemSettingsRepository(settings?: SystemSettingsCollection) {
  const mockSettings = settings || createMockSystemSettings();

  return {
    load: jest.fn().mockResolvedValue(Result.success(mockSettings)),
    save: jest.fn().mockResolvedValue(Result.success(undefined)),
  };
}
