/**
 * Domain Layer: System Settings Entity
 * Represents system-wide configuration settings
 *
 * @coverage 75.38%
 * @reason テストカバレッジが低い理由:
 * - 13個のシステム設定項目それぞれに対してwithXXXメソッドが存在し、
 *   各メソッドに複数のバリデーションエラーパスが含まれる
 *   （負の値、範囲外、最小値＞最大値など）
 * - 色の検証では3つの異なるHEXフォーマット（#RGB、#RRGGBB、#RRGGBBAA）を
 *   サポートしており、全ての有効・無効パターンをテストするのは困難
 * - 数値のバウンダリーケース（0、-1、360度など）と各種エラーメッセージの
 *   全ての組み合わせをテストするには膨大な数のテストケースが必要
 * - 現在のテストでは主要な正常系とエラー系の代表的なパスをカバーしており、
 *   全てのバリデーションエラーパスの完全なカバレッジには追加実装が必要
 */

import { AggregateRoot } from './AggregateRoot';
import { Result } from '@domain/values/result.value';
import { NUMERIC_ERROR_CODES } from '@domain/constants/ErrorCodes';
import { LogLevel } from '@domain/types/logger.types';

/**
 * Auto-fill progress dialog mode
 * - withCancel: Show dialog with cancel button
 * - withoutCancel: Show dialog without cancel button
 * - hidden: Do not show dialog
 */
export type AutoFillProgressDialogMode = 'withCancel' | 'withoutCancel' | 'hidden';

export interface SystemSettings {
  retryWaitSecondsMin: number; // Minimum wait time between retries
  retryWaitSecondsMax: number; // Maximum wait time between retries
  retryCount: number; // Number of retry attempts. -1 for infinite retries
  autoFillProgressDialogMode: AutoFillProgressDialogMode; // Auto-fill progress dialog display mode
  waitForOptionsMilliseconds: number; // Wait time for custom select options to load (milliseconds)
  logLevel: LogLevel; // System-wide log level
  // Tab Recording Settings
  enableTabRecording: boolean; // Enable/disable tab recording during auto-fill
  enableAudioRecording: boolean; // Enable/disable audio recording during tab recording
  recordingBitrate: number; // Recording bitrate in bps (e.g., 2500000 = 2500kbps)
  recordingRetentionDays: number; // Number of days to retain recordings
  // Gradient Background Settings
  gradientStartColor: string; // Start color for gradient background (hex format, e.g., '#667eea')
  gradientEndColor: string; // End color for gradient background (hex format, e.g., '#764ba2')
  gradientAngle: number; // Gradient angle in degrees (0-360)
  // Centralized Logging Settings
  enabledLogSources: string[]; // Enabled log sources (background, popup, content-script, xpath-manager, automation-variables-manager, etc.)
  securityEventsOnly: boolean; // Display security events only (failed auth, lockouts, password changes, etc.)
  maxStoredLogs: number; // Maximum number of logs to store (applies log rotation when exceeded)
  logRetentionDays: number; // Number of days to retain logs (older logs are automatically deleted)
}

export class SystemSettingsCollection extends AggregateRoot<string> {
  private readonly settings: SystemSettings;
  private static readonly SINGLETON_ID = 'system-settings';

  // eslint-disable-next-line complexity
  constructor(settings?: Partial<SystemSettings>) {
    super();
    this.settings = Object.freeze({
      retryWaitSecondsMin: settings?.retryWaitSecondsMin ?? 30, // Default: 30 seconds minimum
      retryWaitSecondsMax: settings?.retryWaitSecondsMax ?? 60, // Default: 60 seconds maximum
      retryCount: settings?.retryCount ?? 3, // Default: 3 retry attempts, -1 for infinite
      autoFillProgressDialogMode: settings?.autoFillProgressDialogMode ?? 'withCancel', // Default: show dialog with cancel button
      waitForOptionsMilliseconds: settings?.waitForOptionsMilliseconds ?? 500, // Default: 500ms wait for options to load
      logLevel: settings?.logLevel ?? LogLevel.INFO, // Default: INFO level
      enableTabRecording: settings?.enableTabRecording ?? true, // Default: enabled
      enableAudioRecording: settings?.enableAudioRecording ?? false, // Default: disabled
      recordingBitrate: settings?.recordingBitrate ?? 2500000, // Default: 2500kbps
      recordingRetentionDays: settings?.recordingRetentionDays ?? 10, // Default: keep 10 days
      gradientStartColor: settings?.gradientStartColor ?? '#667eea', // Default: purple-blue
      gradientEndColor: settings?.gradientEndColor ?? '#764ba2', // Default: purple
      gradientAngle: settings?.gradientAngle ?? 135, // Default: 135 degrees
      enabledLogSources: settings?.enabledLogSources ?? [
        'background',
        'popup',
        'content-script',
        'xpath-manager',
        'automation-variables-manager',
      ], // Default: all sources enabled
      securityEventsOnly: settings?.securityEventsOnly ?? false, // Default: show all logs
      maxStoredLogs: settings?.maxStoredLogs ?? 100, // Default: store up to 100 logs
      logRetentionDays: settings?.logRetentionDays ?? 7, // Default: keep logs for 7 days
    });
  }

  getId(): string {
    return SystemSettingsCollection.SINGLETON_ID;
  }

  getRetryWaitSecondsMin(): number {
    return this.settings.retryWaitSecondsMin;
  }

  getRetryWaitSecondsMax(): number {
    return this.settings.retryWaitSecondsMax;
  }

  withRetryWaitSecondsMin(seconds: number): Result<SystemSettingsCollection, Error> {
    if (seconds < 1) {
      return Result.failureWithCode(
        'Retry wait seconds min must be at least 1',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'retryWaitSecondsMin', value: seconds, min: 1 }
      );
    }
    if (seconds > this.settings.retryWaitSecondsMax) {
      return Result.failureWithCode(
        'Retry wait seconds min must not exceed max',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'retryWaitSecondsMin', value: seconds, max: this.settings.retryWaitSecondsMax }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        retryWaitSecondsMin: seconds,
      })
    );
  }

  withRetryWaitSecondsMax(seconds: number): Result<SystemSettingsCollection, Error> {
    if (seconds < 1) {
      return Result.failureWithCode(
        'Retry wait seconds max must be at least 1',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'retryWaitSecondsMax', value: seconds, min: 1 }
      );
    }
    if (seconds < this.settings.retryWaitSecondsMin) {
      return Result.failureWithCode(
        'Retry wait seconds max must not be less than min',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'retryWaitSecondsMax', value: seconds, min: this.settings.retryWaitSecondsMin }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        retryWaitSecondsMax: seconds,
      })
    );
  }

  /**
   * Set both min and max retry wait seconds
   * Useful for initialization to avoid validation errors
   */
  withRetryWaitSecondsRange(min: number, max: number): Result<SystemSettingsCollection, Error> {
    if (min < 1 || max < 1) {
      return Result.failureWithCode(
        'Retry wait seconds must be at least 1',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'retryWaitSecondsRange', min, max, minRequired: 1 }
      );
    }
    if (min > max) {
      return Result.failureWithCode(
        'Retry wait seconds min must not exceed max',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'retryWaitSecondsRange', min, max }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        retryWaitSecondsMin: min,
        retryWaitSecondsMax: max,
      })
    );
  }

  getRetryCount(): number {
    return this.settings.retryCount;
  }

  withRetryCount(count: number): Result<SystemSettingsCollection, Error> {
    if (count < -1) {
      return Result.failureWithCode(
        'Retry count must be -1 (infinite) or non-negative',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'retryCount', value: count, min: -1 }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        retryCount: count,
      })
    );
  }

  getAutoFillProgressDialogMode(): AutoFillProgressDialogMode {
    return this.settings.autoFillProgressDialogMode;
  }

  withAutoFillProgressDialogMode(
    mode: AutoFillProgressDialogMode
  ): Result<SystemSettingsCollection, Error> {
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        autoFillProgressDialogMode: mode,
      })
    );
  }

  getWaitForOptionsMilliseconds(): number {
    return this.settings.waitForOptionsMilliseconds;
  }

  withWaitForOptionsMilliseconds(milliseconds: number): Result<SystemSettingsCollection, Error> {
    if (milliseconds < 0) {
      return Result.failureWithCode(
        'Wait for options milliseconds must be non-negative',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'waitForOptionsMilliseconds', value: milliseconds, min: 0 }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        waitForOptionsMilliseconds: milliseconds,
      })
    );
  }

  getLogLevel(): LogLevel {
    return this.settings.logLevel;
  }

  withLogLevel(level: LogLevel): Result<SystemSettingsCollection, Error> {
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        logLevel: level,
      })
    );
  }

  // Tab Recording Settings

  getEnableTabRecording(): boolean {
    return this.settings.enableTabRecording;
  }

  withEnableTabRecording(enabled: boolean): Result<SystemSettingsCollection, Error> {
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        enableTabRecording: enabled,
      })
    );
  }

  getEnableAudioRecording(): boolean {
    return this.settings.enableAudioRecording;
  }

  withEnableAudioRecording(enabled: boolean): Result<SystemSettingsCollection, Error> {
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        enableAudioRecording: enabled,
      })
    );
  }

  getRecordingBitrate(): number {
    return this.settings.recordingBitrate;
  }

  withRecordingBitrate(bitrate: number): Result<SystemSettingsCollection, Error> {
    if (bitrate < 1000) {
      return Result.failureWithCode(
        'Recording bitrate must be at least 1kbps (1000)',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'recordingBitrate', value: bitrate, min: 1000 }
      );
    }
    if (bitrate > 25000000) {
      return Result.failureWithCode(
        'Recording bitrate must not exceed 25Mbps (25000000)',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'recordingBitrate', value: bitrate, max: 25000000 }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        recordingBitrate: bitrate,
      })
    );
  }

  getRecordingRetentionDays(): number {
    return this.settings.recordingRetentionDays;
  }

  withRecordingRetentionDays(days: number): Result<SystemSettingsCollection, Error> {
    if (days < 1) {
      return Result.failureWithCode(
        'Recording retention days must be at least 1',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'recordingRetentionDays', value: days, min: 1 }
      );
    }
    if (days > 365) {
      return Result.failureWithCode(
        'Recording retention days must not exceed 365',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'recordingRetentionDays', value: days, max: 365 }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        recordingRetentionDays: days,
      })
    );
  }

  // Gradient Background Settings

  getGradientStartColor(): string {
    return this.settings.gradientStartColor;
  }

  withGradientStartColor(color: string): Result<SystemSettingsCollection, Error> {
    if (!this.isValidHexColor(color)) {
      return Result.failureWithCode(
        'Gradient start color must be a valid hex color (e.g., #667eea)',
        NUMERIC_ERROR_CODES.VALIDATION_INVALID_FORMAT,
        { field: 'gradientStartColor', value: color }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        gradientStartColor: color,
      })
    );
  }

  getGradientEndColor(): string {
    return this.settings.gradientEndColor;
  }

  withGradientEndColor(color: string): Result<SystemSettingsCollection, Error> {
    if (!this.isValidHexColor(color)) {
      return Result.failureWithCode(
        'Gradient end color must be a valid hex color (e.g., #764ba2)',
        NUMERIC_ERROR_CODES.VALIDATION_INVALID_FORMAT,
        { field: 'gradientEndColor', value: color }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        gradientEndColor: color,
      })
    );
  }

  getGradientAngle(): number {
    return this.settings.gradientAngle;
  }

  withGradientAngle(angle: number): Result<SystemSettingsCollection, Error> {
    if (angle < 0 || angle > 360) {
      return Result.failureWithCode(
        'Gradient angle must be between 0 and 360 degrees',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'gradientAngle', value: angle, min: 0, max: 360 }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        gradientAngle: angle,
      })
    );
  }

  /**
   * Validate hex color format
   * Accepts formats: #RGB, #RRGGBB, #RRGGBBAA
   */
  private isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    return hexColorRegex.test(color);
  }

  // Centralized Logging Settings

  getEnabledLogSources(): string[] {
    return [...this.settings.enabledLogSources];
  }

  withEnabledLogSources(sources: string[]): Result<SystemSettingsCollection, Error> {
    if (!Array.isArray(sources)) {
      return Result.failureWithCode(
        'Enabled log sources must be an array',
        NUMERIC_ERROR_CODES.VALIDATION_INVALID_FORMAT,
        { field: 'enabledLogSources', value: sources }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        enabledLogSources: [...sources],
      })
    );
  }

  getSecurityEventsOnly(): boolean {
    return this.settings.securityEventsOnly;
  }

  withSecurityEventsOnly(enabled: boolean): Result<SystemSettingsCollection, Error> {
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        securityEventsOnly: enabled,
      })
    );
  }

  getMaxStoredLogs(): number {
    return this.settings.maxStoredLogs;
  }

  withMaxStoredLogs(maxLogs: number): Result<SystemSettingsCollection, Error> {
    if (maxLogs < 10) {
      return Result.failureWithCode(
        'Max stored logs must be at least 10',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'maxStoredLogs', value: maxLogs, min: 10 }
      );
    }
    if (maxLogs > 10000) {
      return Result.failureWithCode(
        'Max stored logs must not exceed 10000',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'maxStoredLogs', value: maxLogs, max: 10000 }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        maxStoredLogs: maxLogs,
      })
    );
  }

  getLogRetentionDays(): number {
    return this.settings.logRetentionDays;
  }

  withLogRetentionDays(days: number): Result<SystemSettingsCollection, Error> {
    if (days < 1) {
      return Result.failureWithCode(
        'Log retention days must be at least 1',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'logRetentionDays', value: days, min: 1 }
      );
    }
    if (days > 365) {
      return Result.failureWithCode(
        'Log retention days must not exceed 365',
        NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        { field: 'logRetentionDays', value: days, max: 365 }
      );
    }
    return Result.success(
      new SystemSettingsCollection({
        ...this.settings,
        logRetentionDays: days,
      })
    );
  }

  getAll(): SystemSettings {
    return { ...this.settings };
  }
}
