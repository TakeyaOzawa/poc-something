/**
 * Application Layer: Update System Settings Input DTO
 * Data Transfer Object for updating system settings
 */

import { LogLevel } from '@domain/types/logger.types';
import { AutoFillProgressDialogMode } from '@domain/entities/SystemSettings';

export interface UpdateSystemSettingsInputDto {
  // General Settings
  retryWaitSecondsMin?: number;
  retryWaitSecondsMax?: number;
  retryCount?: number;
  autoFillProgressDialogMode?: AutoFillProgressDialogMode;
  waitForOptionsMilliseconds?: number;
  logLevel?: LogLevel;

  // Tab Recording Settings
  enableTabRecording?: boolean;
  enableAudioRecording?: boolean;
  recordingBitrate?: number;
  recordingRetentionDays?: number;

  // Gradient Background Settings
  gradientStartColor?: string;
  gradientEndColor?: string;
  gradientAngle?: number;

  // Centralized Logging Settings
  enabledLogSources?: string[];
  securityEventsOnly?: boolean;
  maxStoredLogs?: number;
  logRetentionDays?: number;
}
