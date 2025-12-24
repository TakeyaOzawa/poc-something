/**
 * Property-Based Tests: SystemSettingsPresenter
 * Tests ViewModel-DTO conversion consistency in the presenter
 *
 * Feature: presentation-layer-viewmodel-completion, Property 1: ViewModel-DTO変換の一貫性
 * Validates: Requirements 1.1, 1.2
 */

import * as fc from 'fast-check';
import { SystemSettingsPresenter, SystemSettingsView } from '../SystemSettingsPresenter';
import { GetSystemSettingsUseCase } from '@application/usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@application/usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@application/usecases/system-settings/ResetSystemSettingsUseCase';
import { ExportSystemSettingsUseCase } from '@application/usecases/system-settings/ExportSystemSettingsUseCase';
import { ImportSystemSettingsUseCase } from '@application/usecases/system-settings/ImportSystemSettingsUseCase';
import { ExecuteStorageSyncUseCase } from '@application/usecases/storage/ExecuteStorageSyncUseCase';
import { ListSyncConfigsUseCase } from '@application/usecases/sync/ListSyncConfigsUseCase';
import { Logger } from '@domain/types/logger.types';
import { SystemSettingsViewModel } from '../../types/SystemSettingsViewModel';
import { SystemSettingsOutputDto } from '@application/dtos/SystemSettingsOutputDto';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => key),
    format: jest.fn((key: string, ...args: any[]) => `${key}: ${args.join(', ')}`),
  },
}));

describe('SystemSettingsPresenter - Property-Based Tests', () => {
  let presenter: SystemSettingsPresenter;
  let mockView: jest.Mocked<SystemSettingsView>;
  let mockGetSystemSettingsUseCase: jest.Mocked<GetSystemSettingsUseCase>;
  let mockUpdateSystemSettingsUseCase: jest.Mocked<UpdateSystemSettingsUseCase>;
  let mockResetSystemSettingsUseCase: jest.Mocked<ResetSystemSettingsUseCase>;
  let mockExportSystemSettingsUseCase: jest.Mocked<ExportSystemSettingsUseCase>;
  let mockImportSystemSettingsUseCase: jest.Mocked<ImportSystemSettingsUseCase>;
  let mockExecuteStorageSyncUseCase: jest.Mocked<ExecuteStorageSyncUseCase>;
  let mockListSyncConfigsUseCase: jest.Mocked<ListSyncConfigsUseCase>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockView = {
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      updateGeneralSettings: jest.fn(),
      updateRecordingSettings: jest.fn(),
      updateAppearanceSettings: jest.fn(),
      applyGradientBackground: jest.fn(),
    };

    mockGetSystemSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateSystemSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockResetSystemSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockExportSystemSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockImportSystemSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockExecuteStorageSyncUseCase = {
      execute: jest.fn(),
    } as any;

    mockListSyncConfigsUseCase = {
      execute: jest.fn(),
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    presenter = new SystemSettingsPresenter(
      mockView,
      mockGetSystemSettingsUseCase,
      mockUpdateSystemSettingsUseCase,
      mockResetSystemSettingsUseCase,
      mockExportSystemSettingsUseCase,
      mockImportSystemSettingsUseCase,
      mockExecuteStorageSyncUseCase,
      mockListSyncConfigsUseCase,
      mockLogger
    );

    jest.clearAllMocks();
  });

  /**
   * Property 1: ViewModel-DTO変換の一貫性
   * For any valid SystemSettingsOutputDto from UseCase, the presenter should
   * successfully convert it to ViewModel and maintain data consistency
   */
  describe('Property 1: ViewModel-DTO変換の一貫性', () => {
    it('should consistently convert DTO to ViewModel preserving all data fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generator for valid SystemSettingsOutputDto
          fc.record({
            retryWaitSecondsMin: fc.integer({ min: 1, max: 300 }),
            retryWaitSecondsMax: fc.integer({ min: 1, max: 600 }),
            retryCount: fc.integer({ min: -1, max: 10 }),
            recordingEnabled: fc.boolean(),
            recordingBitrate: fc.integer({ min: 1000, max: 25000000 }),
            recordingRetentionDays: fc.integer({ min: 1, max: 365 }),
            enabledLogSources: fc.array(
              fc.constantFrom('background', 'popup', 'content-script', 'xpath-manager'),
              { minLength: 0, maxLength: 4 }
            ),
            securityEventsOnly: fc.boolean(),
            maxStoredLogs: fc.integer({ min: 10, max: 10000 }),
            logRetentionDays: fc.integer({ min: 1, max: 365 }),
          }).filter((dto: SystemSettingsOutputDto) => {
            // Ensure min <= max for retry wait seconds
            return dto.retryWaitSecondsMin <= dto.retryWaitSecondsMax;
          }),
          async (dto: SystemSettingsOutputDto) => {
            // Arrange: Setup mock to return the generated DTO
            mockGetSystemSettingsUseCase.execute.mockResolvedValue({
              isFailure: false,
              value: dto,
            });

            // Act: Load settings through presenter
            await presenter.loadSettings();

            // Assert: Verify DTO to ViewModel conversion consistency
            const settings = presenter.getSettings();
            expect(settings).not.toBeNull();

            // Verify all critical data fields are preserved
            expect(settings!.retryWaitSecondsMin).toBe(dto.retryWaitSecondsMin);
            expect(settings!.retryWaitSecondsMax).toBe(dto.retryWaitSecondsMax);
            expect(settings!.retryCount).toBe(dto.retryCount);
            expect(settings!.recordingEnabled).toBe(dto.recordingEnabled);
            expect(settings!.recordingBitrate).toBe(dto.recordingBitrate);
            expect(settings!.recordingRetentionDays).toBe(dto.recordingRetentionDays);
            expect(settings!.enabledLogSources).toEqual(dto.enabledLogSources);
            expect(settings!.securityEventsOnly).toBe(dto.securityEventsOnly);
            expect(settings!.maxStoredLogs).toBe(dto.maxStoredLogs);
            expect(settings!.logRetentionDays).toBe(dto.logRetentionDays);

            // Verify view methods were called with the converted ViewModel
            expect(mockView.updateGeneralSettings).toHaveBeenCalledWith(settings);
            expect(mockView.updateRecordingSettings).toHaveBeenCalledWith(settings);
            expect(mockView.updateAppearanceSettings).toHaveBeenCalledWith(settings);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in the design
      );
    });
  });

  /**
   * Property 2: ViewModel to DTO conversion in save operations
   * For any valid ViewModel updates, the presenter should correctly convert
   * them to DTO format for UseCase consumption
   */
  describe('Property 2: ViewModel to DTO conversion in save operations', () => {
    it('should consistently convert ViewModel updates to DTO format', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generator for valid ViewModel updates
          fc.record({
            retryWaitSecondsMin: fc.option(fc.integer({ min: 1, max: 300 }), { nil: undefined }),
            retryWaitSecondsMax: fc.option(fc.integer({ min: 1, max: 600 }), { nil: undefined }),
            retryCount: fc.option(fc.integer({ min: -1, max: 10 }), { nil: undefined }),
            recordingEnabled: fc.option(fc.boolean(), { nil: undefined }),
            recordingBitrate: fc.option(fc.integer({ min: 1000, max: 25000000 }), { nil: undefined }),
            recordingRetentionDays: fc.option(fc.integer({ min: 1, max: 365 }), { nil: undefined }),
            enabledLogSources: fc.option(
              fc.array(
                fc.constantFrom('background', 'popup', 'content-script', 'xpath-manager'),
                { minLength: 0, maxLength: 4 }
              ),
              { nil: undefined }
            ),
            securityEventsOnly: fc.option(fc.boolean(), { nil: undefined }),
            maxStoredLogs: fc.option(fc.integer({ min: 10, max: 10000 }), { nil: undefined }),
            logRetentionDays: fc.option(fc.integer({ min: 1, max: 365 }), { nil: undefined }),
          }).filter((updates: Partial<SystemSettingsViewModel>) => {
            // Ensure min <= max for retry wait seconds if both are defined
            if (updates.retryWaitSecondsMin !== undefined && updates.retryWaitSecondsMax !== undefined) {
              return updates.retryWaitSecondsMin <= updates.retryWaitSecondsMax;
            }
            return true;
          }),
          async (updates: Partial<SystemSettingsViewModel>) => {
            // Arrange: Setup initial settings and successful save
            const initialDto: SystemSettingsOutputDto = {
              retryWaitSecondsMin: 30,
              retryWaitSecondsMax: 60,
              retryCount: 3,
              recordingEnabled: true,
              recordingBitrate: 2500000,
              recordingRetentionDays: 10,
              enabledLogSources: ['background', 'popup'],
              securityEventsOnly: false,
              maxStoredLogs: 100,
              logRetentionDays: 7,
            };

            mockGetSystemSettingsUseCase.execute.mockResolvedValue({
              isFailure: false,
              value: initialDto,
            });

            mockUpdateSystemSettingsUseCase.execute.mockResolvedValue({
              isFailure: false,
              value: undefined,
            });

            // Load initial settings
            await presenter.loadSettings();
            jest.clearAllMocks();

            // Act: Save general settings with updates
            await presenter.saveGeneralSettings(updates);

            // Assert: Verify ViewModel to DTO conversion
            expect(mockUpdateSystemSettingsUseCase.execute).toHaveBeenCalledTimes(1);
            const calledWith = mockUpdateSystemSettingsUseCase.execute.mock.calls[0][0];
            const dto = calledWith.settings;

            // Verify only defined fields are included in DTO
            if (updates.retryWaitSecondsMin !== undefined) {
              expect(dto.retryWaitSecondsMin).toBe(updates.retryWaitSecondsMin);
            } else {
              expect(dto.retryWaitSecondsMin).toBeUndefined();
            }

            if (updates.retryWaitSecondsMax !== undefined) {
              expect(dto.retryWaitSecondsMax).toBe(updates.retryWaitSecondsMax);
            } else {
              expect(dto.retryWaitSecondsMax).toBeUndefined();
            }

            if (updates.retryCount !== undefined) {
              expect(dto.retryCount).toBe(updates.retryCount);
            } else {
              expect(dto.retryCount).toBeUndefined();
            }

            if (updates.recordingEnabled !== undefined) {
              expect(dto.enableTabRecording).toBe(updates.recordingEnabled);
            } else {
              expect(dto.enableTabRecording).toBeUndefined();
            }

            if (updates.recordingBitrate !== undefined) {
              expect(dto.recordingBitrate).toBe(updates.recordingBitrate);
            } else {
              expect(dto.recordingBitrate).toBeUndefined();
            }

            if (updates.recordingRetentionDays !== undefined) {
              expect(dto.recordingRetentionDays).toBe(updates.recordingRetentionDays);
            } else {
              expect(dto.recordingRetentionDays).toBeUndefined();
            }

            if (updates.enabledLogSources !== undefined) {
              expect(dto.enabledLogSources).toEqual(updates.enabledLogSources);
            } else {
              expect(dto.enabledLogSources).toBeUndefined();
            }

            if (updates.securityEventsOnly !== undefined) {
              expect(dto.securityEventsOnly).toBe(updates.securityEventsOnly);
            } else {
              expect(dto.securityEventsOnly).toBeUndefined();
            }

            if (updates.maxStoredLogs !== undefined) {
              expect(dto.maxStoredLogs).toBe(updates.maxStoredLogs);
            } else {
              expect(dto.maxStoredLogs).toBeUndefined();
            }

            if (updates.logRetentionDays !== undefined) {
              expect(dto.logRetentionDays).toBe(updates.logRetentionDays);
            } else {
              expect(dto.logRetentionDays).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in the design
      );
    });
  });
});
