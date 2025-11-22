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

  withRetryWaitSecondsMin(seconds: number): SystemSettingsCollection {
    if (seconds < 1) {
      throw new Error('Retry wait seconds min must be at least 1');
    }
    if (seconds > this.settings.retryWaitSecondsMax) {
      throw new Error('Retry wait seconds min must not exceed max');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      retryWaitSecondsMin: seconds,
    });
  }

  withRetryWaitSecondsMax(seconds: number): SystemSettingsCollection {
    if (seconds < 1) {
      throw new Error('Retry wait seconds max must be at least 1');
    }
    if (seconds < this.settings.retryWaitSecondsMin) {
      throw new Error('Retry wait seconds max must not be less than min');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      retryWaitSecondsMax: seconds,
    });
  }

  /**
   * Set both min and max retry wait seconds
   * Useful for initialization to avoid validation errors
   */
  withRetryWaitSecondsRange(min: number, max: number): SystemSettingsCollection {
    if (min < 1 || max < 1) {
      throw new Error('Retry wait seconds must be at least 1');
    }
    if (min > max) {
      throw new Error('Retry wait seconds min must not exceed max');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      retryWaitSecondsMin: min,
      retryWaitSecondsMax: max,
    });
  }

  getRetryCount(): number {
    return this.settings.retryCount;
  }

  withRetryCount(count: number): SystemSettingsCollection {
    if (count < -1) {
      throw new Error('Retry count must be -1 (infinite) or non-negative');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      retryCount: count,
    });
  }

  getAutoFillProgressDialogMode(): AutoFillProgressDialogMode {
    return this.settings.autoFillProgressDialogMode;
  }

  withAutoFillProgressDialogMode(mode: AutoFillProgressDialogMode): SystemSettingsCollection {
    return new SystemSettingsCollection({
      ...this.settings,
      autoFillProgressDialogMode: mode,
    });
  }

  getWaitForOptionsMilliseconds(): number {
    return this.settings.waitForOptionsMilliseconds;
  }

  withWaitForOptionsMilliseconds(milliseconds: number): SystemSettingsCollection {
    if (milliseconds < 0) {
      throw new Error('Wait for options milliseconds must be non-negative');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      waitForOptionsMilliseconds: milliseconds,
    });
  }

  getLogLevel(): LogLevel {
    return this.settings.logLevel;
  }

  withLogLevel(level: LogLevel): SystemSettingsCollection {
    return new SystemSettingsCollection({
      ...this.settings,
      logLevel: level,
    });
  }

  // Tab Recording Settings

  getEnableTabRecording(): boolean {
    return this.settings.enableTabRecording;
  }

  withEnableTabRecording(enabled: boolean): SystemSettingsCollection {
    return new SystemSettingsCollection({
      ...this.settings,
      enableTabRecording: enabled,
    });
  }

  getEnableAudioRecording(): boolean {
    return this.settings.enableAudioRecording;
  }

  withEnableAudioRecording(enabled: boolean): SystemSettingsCollection {
    return new SystemSettingsCollection({
      ...this.settings,
      enableAudioRecording: enabled,
    });
  }

  getRecordingBitrate(): number {
    return this.settings.recordingBitrate;
  }

  withRecordingBitrate(bitrate: number): SystemSettingsCollection {
    if (bitrate < 1000) {
      throw new Error('Recording bitrate must be at least 1kbps (1000)');
    }
    if (bitrate > 25000000) {
      throw new Error('Recording bitrate must not exceed 25Mbps (25000000)');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      recordingBitrate: bitrate,
    });
  }

  getRecordingRetentionDays(): number {
    return this.settings.recordingRetentionDays;
  }

  withRecordingRetentionDays(days: number): SystemSettingsCollection {
    if (days < 1) {
      throw new Error('Recording retention days must be at least 1');
    }
    if (days > 365) {
      throw new Error('Recording retention days must not exceed 365');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      recordingRetentionDays: days,
    });
  }

  // Gradient Background Settings

  getGradientStartColor(): string {
    return this.settings.gradientStartColor;
  }

  withGradientStartColor(color: string): SystemSettingsCollection {
    if (!this.isValidHexColor(color)) {
      throw new Error('Gradient start color must be a valid hex color (e.g., #667eea)');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      gradientStartColor: color,
    });
  }

  getGradientEndColor(): string {
    return this.settings.gradientEndColor;
  }

  withGradientEndColor(color: string): SystemSettingsCollection {
    if (!this.isValidHexColor(color)) {
      throw new Error('Gradient end color must be a valid hex color (e.g., #764ba2)');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      gradientEndColor: color,
    });
  }

  getGradientAngle(): number {
    return this.settings.gradientAngle;
  }

  withGradientAngle(angle: number): SystemSettingsCollection {
    if (angle < 0 || angle > 360) {
      throw new Error('Gradient angle must be between 0 and 360 degrees');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      gradientAngle: angle,
    });
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

  withEnabledLogSources(sources: string[]): SystemSettingsCollection {
    if (!Array.isArray(sources)) {
      throw new Error('Enabled log sources must be an array');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      enabledLogSources: [...sources],
    });
  }

  getSecurityEventsOnly(): boolean {
    return this.settings.securityEventsOnly;
  }

  withSecurityEventsOnly(enabled: boolean): SystemSettingsCollection {
    return new SystemSettingsCollection({
      ...this.settings,
      securityEventsOnly: enabled,
    });
  }

  getMaxStoredLogs(): number {
    return this.settings.maxStoredLogs;
  }

  withMaxStoredLogs(maxLogs: number): SystemSettingsCollection {
    if (maxLogs < 10) {
      throw new Error('Max stored logs must be at least 10');
    }
    if (maxLogs > 10000) {
      throw new Error('Max stored logs must not exceed 10000');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      maxStoredLogs: maxLogs,
    });
  }

  getLogRetentionDays(): number {
    return this.settings.logRetentionDays;
  }

  withLogRetentionDays(days: number): SystemSettingsCollection {
    if (days < 1) {
      throw new Error('Log retention days must be at least 1');
    }
    if (days > 365) {
      throw new Error('Log retention days must not exceed 365');
    }
    return new SystemSettingsCollection({
      ...this.settings,
      logRetentionDays: days,
    });
  }

  getAll(): SystemSettings {
    return { ...this.settings };
  }
}
