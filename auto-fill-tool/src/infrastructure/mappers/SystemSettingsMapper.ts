/**
 * Infrastructure Layer: System Settings Mapper
 * Handles serialization/deserialization of SystemSettingsCollection
 *
 * @coverage 40.65%
 * @reason テストカバレッジが低い理由:
 * - 後方互換性のために3世代の旧フィールド名（showAutoFillProgressDialog、
 *   showXPathInAutoFillProgressDialog、showXPathDialogDuringAutoFill等）を
 *   サポートしており、全ての組み合わせをテストするのは困難
 * - CSV形式の入出力処理において、引用符のエスケープ、カンマや改行を含む値、
 *   不正な形式など多数のエッジケースが存在
 * - 13個のシステム設定項目それぞれに対するJSON/CSV変換、型変換、
 *   バリデーションのパスを全てテストするには膨大な数のテストケースが必要
 * - 現在のテストでは主要な変換パスのみをカバーしており、
 *   全ての後方互換性パスとエラーハンドリングには追加実装が必要
 */

import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';

export class SystemSettingsMapper {
  /**
   * Convert SystemSettingsCollection to JSON string
   */
  static toJSON(collection: SystemSettingsCollection): string {
    const settings = collection.getAll();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Create SystemSettingsCollection from JSON string
   */
  static fromJSON(json: string, logger: Logger = new NoOpLogger()): SystemSettingsCollection {
    try {
      const settings = JSON.parse(json) as unknown;
      const parsedSettings = this.parseSettings(settings);
      return new SystemSettingsCollection(parsedSettings);
    } catch (error) {
      logger.error('Failed to parse system settings JSON', error);
      return new SystemSettingsCollection();
    }
  }

  // eslint-disable-next-line complexity, max-lines-per-function -- Parses multiple system setting fields with backward compatibility handling for legacy field names. The sequential checks are necessary and already well-structured.
  private static parseSettings(settings: any): Partial<Record<string, unknown>> {
    const parsed: any = {};

    // Handle retry wait settings
    if (settings.retryWaitSecondsMin !== undefined) {
      parsed.retryWaitSecondsMin = settings.retryWaitSecondsMin;
    }
    if (settings.retryWaitSecondsMax !== undefined) {
      parsed.retryWaitSecondsMax = settings.retryWaitSecondsMax;
    }
    // Backward compatibility: if old retryWaitSeconds exists, use it for both min and max
    if (settings.retryWaitSeconds !== undefined) {
      parsed.retryWaitSecondsMin = settings.retryWaitSeconds;
      parsed.retryWaitSecondsMax = settings.retryWaitSeconds;
    }

    if (settings.retryCount !== undefined) {
      parsed.retryCount = settings.retryCount;
    }

    // Handle progress dialog settings
    // New field: autoFillProgressDialogMode (enum)
    if (settings.autoFillProgressDialogMode !== undefined) {
      parsed.autoFillProgressDialogMode = settings.autoFillProgressDialogMode;
    }
    // Backward compatibility: migrate from old boolean field
    else if (settings.showAutoFillProgressDialog !== undefined) {
      // Convert boolean to enum
      parsed.autoFillProgressDialogMode = settings.showAutoFillProgressDialog
        ? 'withCancel'
        : 'hidden';
    }
    // Backward compatibility: support even older field names
    else if (settings.showXPathInAutoFillProgressDialog !== undefined) {
      parsed.autoFillProgressDialogMode = settings.showXPathInAutoFillProgressDialog
        ? 'withCancel'
        : 'hidden';
    } else if (settings.showXPathDialogDuringAutoFill !== undefined) {
      parsed.autoFillProgressDialogMode = settings.showXPathDialogDuringAutoFill
        ? 'withCancel'
        : 'hidden';
    }

    // Handle basic settings
    if (settings.waitForOptionsMilliseconds !== undefined) {
      parsed.waitForOptionsMilliseconds = settings.waitForOptionsMilliseconds;
    }

    if (settings.logLevel !== undefined) {
      parsed.logLevel = settings.logLevel as LogLevel;
    }

    // Handle tab recording settings
    if (settings.enableTabRecording !== undefined) {
      parsed.enableTabRecording = settings.enableTabRecording;
    }

    if (settings.enableAudioRecording !== undefined) {
      parsed.enableAudioRecording = settings.enableAudioRecording;
    }

    if (settings.recordingBitrate !== undefined) {
      parsed.recordingBitrate = settings.recordingBitrate;
    }

    if (settings.recordingRetentionDays !== undefined) {
      parsed.recordingRetentionDays = settings.recordingRetentionDays;
    }

    // Handle gradient background settings
    if (settings.gradientStartColor !== undefined) {
      parsed.gradientStartColor = settings.gradientStartColor;
    }

    if (settings.gradientEndColor !== undefined) {
      parsed.gradientEndColor = settings.gradientEndColor;
    }

    if (settings.gradientAngle !== undefined) {
      parsed.gradientAngle = settings.gradientAngle;
    }

    return parsed;
  }

  /**
   * Convert SystemSettingsCollection to CSV string
   * Format: key,value pairs
   */
  static toCSV(collection: SystemSettingsCollection): string {
    const settings = collection.getAll();

    // CSV Header
    const header = 'key,value';

    // CSV Rows - convert settings to key-value pairs
    const rows = [
      ['retryWaitSecondsMin', settings.retryWaitSecondsMin.toString()],
      ['retryWaitSecondsMax', settings.retryWaitSecondsMax.toString()],
      ['retryCount', settings.retryCount.toString()],
      ['autoFillProgressDialogMode', settings.autoFillProgressDialogMode],
      ['waitForOptionsMilliseconds', settings.waitForOptionsMilliseconds.toString()],
      ['logLevel', settings.logLevel.toString()],
      ['enableTabRecording', settings.enableTabRecording.toString()],
      ['enableAudioRecording', settings.enableAudioRecording.toString()],
      ['recordingBitrate', settings.recordingBitrate.toString()],
      ['recordingRetentionDays', settings.recordingRetentionDays.toString()],
      ['gradientStartColor', settings.gradientStartColor || ''],
      ['gradientEndColor', settings.gradientEndColor || ''],
      ['gradientAngle', settings.gradientAngle.toString()],
    ].map(([key, value]) => [this.escapeCSV(key || ''), this.escapeCSV(value || '')].join(','));

    return [header, ...rows].join('\n');
  }

  /**
   * Create SystemSettingsCollection from CSV string
   */
  // eslint-disable-next-line max-lines-per-function -- CSV parser with validation and error handling for 13 different system settings fields. The sequential parsing is necessary for comprehensive CSV import.
  static fromCSV(csv: string, logger: Logger = new NoOpLogger()): SystemSettingsCollection {
    const lines = csv.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error('Invalid CSV format: no data rows');
    }

    // Skip header and parse each data line
    const dataLines = lines.slice(1);
    const settings: any = {};

    // eslint-disable-next-line max-lines-per-function, complexity -- Parses 13 system settings fields from CSV with type conversion and validation. The switch statement is clear and necessary for comprehensive setting parsing.
    dataLines.forEach((line, index) => {
      try {
        const values = this.parseCSVLine(line);

        if (values.length < 2) {
          logger.warn(`Skipping line ${index + 2}: insufficient columns`);
          return;
        }

        const key = values[0]?.trim() || '';
        const value = values[1]?.trim() || '';

        // Parse each setting based on key
        switch (key) {
          case 'retryWaitSecondsMin':
            settings.retryWaitSecondsMin = parseInt(value);
            break;
          case 'retryWaitSecondsMax':
            settings.retryWaitSecondsMax = parseInt(value);
            break;
          case 'retryCount':
            settings.retryCount = parseInt(value);
            break;
          case 'autoFillProgressDialogMode':
            if (value === 'withCancel' || value === 'withoutCancel' || value === 'hidden') {
              settings.autoFillProgressDialogMode = value;
            }
            break;
          case 'waitForOptionsMilliseconds':
            settings.waitForOptionsMilliseconds = parseInt(value);
            break;
          case 'logLevel':
            settings.logLevel = parseInt(value) as LogLevel;
            break;
          case 'enableTabRecording':
            settings.enableTabRecording = value === 'true';
            break;
          case 'enableAudioRecording':
            settings.enableAudioRecording = value === 'true';
            break;
          case 'recordingBitrate':
            settings.recordingBitrate = parseFloat(value);
            break;
          case 'recordingRetentionDays':
            settings.recordingRetentionDays = parseInt(value);
            break;
          case 'gradientStartColor':
            settings.gradientStartColor = value;
            break;
          case 'gradientEndColor':
            settings.gradientEndColor = value;
            break;
          case 'gradientAngle':
            settings.gradientAngle = parseInt(value);
            break;
          default:
            logger.warn(`Unknown setting key: ${key}`);
        }
      } catch (error) {
        logger.error(`Error parsing CSV line ${index + 2}`, error);
      }
    });

    return new SystemSettingsCollection(settings);
  }

  // Private helper methods for CSV

  private static escapeCSV(value: string): string {
    if (!value) return '';

    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
    const escaped = value.replace(/"/g, '""');

    return needsQuotes ? `"${escaped}"` : escaped;
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current);

    return result;
  }
}
