/**
 * Property-Based Tests: UpdateSystemSettingsUseCase
 * Tests that the UseCase accepts DTO input and correctly creates entities
 *
 * Feature: presentation-viewmodel-implementation, Property 1: UseCase accepts DTO input
 * Validates: Requirements 2.1
 */

import * as fc from 'fast-check';
import { UpdateSystemSettingsUseCase } from '../UpdateSystemSettingsUseCase';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';
import { UpdateSystemSettingsInputDto } from '@application/dtos/UpdateSystemSettingsInputDto';
import { LogLevel } from '@domain/types/logger.types';
import { AutoFillProgressDialogMode } from '@domain/entities/SystemSettings';

describe('UpdateSystemSettingsUseCase - Property-Based Tests', () => {
  let mockRepository: jest.Mocked<SystemSettingsRepository>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  /**
   * Property 1: UseCase accepts DTO input
   * For any valid UpdateSystemSettingsInputDto, the UseCase should successfully
   * create a SystemSettingsCollection entity internally and save it
   */
  describe('Property 1: UseCase accepts DTO input', () => {
    it('should accept any valid DTO and successfully process it', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generator for valid UpdateSystemSettingsInputDto
          fc
            .record(
              {
                retryWaitSecondsMin: fc.option(fc.integer({ min: 1, max: 300 }), {
                  nil: undefined,
                }),
                retryWaitSecondsMax: fc.option(fc.integer({ min: 1, max: 600 }), {
                  nil: undefined,
                }),
                retryCount: fc.option(fc.integer({ min: -1, max: 10 }), { nil: undefined }),
                autoFillProgressDialogMode: fc.option(
                  fc.constantFrom<AutoFillProgressDialogMode>(
                    'withCancel',
                    'withoutCancel',
                    'hidden'
                  ),
                  { nil: undefined }
                ),
                waitForOptionsMilliseconds: fc.option(fc.integer({ min: 0, max: 5000 }), {
                  nil: undefined,
                }),
                logLevel: fc.option(
                  fc.constantFrom(
                    LogLevel.NONE,
                    LogLevel.ERROR,
                    LogLevel.WARN,
                    LogLevel.INFO,
                    LogLevel.DEBUG
                  ),
                  { nil: undefined }
                ),
                enableTabRecording: fc.option(fc.boolean(), { nil: undefined }),
                enableAudioRecording: fc.option(fc.boolean(), { nil: undefined }),
                recordingBitrate: fc.option(fc.integer({ min: 1000, max: 25000000 }), {
                  nil: undefined,
                }),
                recordingRetentionDays: fc.option(fc.integer({ min: 1, max: 365 }), {
                  nil: undefined,
                }),
                gradientStartColor: fc.option(
                  fc
                    .tuple(
                      fc.integer({ min: 0, max: 255 }),
                      fc.integer({ min: 0, max: 255 }),
                      fc.integer({ min: 0, max: 255 })
                    )
                    .map(
                      ([r, g, b]) =>
                        `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
                    ),
                  { nil: undefined }
                ),
                gradientEndColor: fc.option(
                  fc
                    .tuple(
                      fc.integer({ min: 0, max: 255 }),
                      fc.integer({ min: 0, max: 255 }),
                      fc.integer({ min: 0, max: 255 })
                    )
                    .map(
                      ([r, g, b]) =>
                        `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
                    ),
                  { nil: undefined }
                ),
                gradientAngle: fc.option(fc.integer({ min: 0, max: 360 }), { nil: undefined }),
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
              },
              { requiredKeys: [] }
            )
            .filter((dto: UpdateSystemSettingsInputDto) => {
              // Ensure min <= max for retry wait seconds if both are defined
              if (dto.retryWaitSecondsMin !== undefined && dto.retryWaitSecondsMax !== undefined) {
                return dto.retryWaitSecondsMin <= dto.retryWaitSecondsMax;
              }
              return true;
            }),
          async (dto: UpdateSystemSettingsInputDto) => {
            // Arrange: Reset mocks for each iteration
            jest.clearAllMocks();

            // Setup mock repository to return default settings and accept save
            const defaultSettings = new SystemSettingsCollection();
            mockRepository.load.mockResolvedValue(Result.success(defaultSettings));
            mockRepository.save.mockResolvedValue(Result.success(undefined));

            const useCase = new UpdateSystemSettingsUseCase(mockRepository);

            // Act: Execute the use case with the generated DTO
            const result = await useCase.execute({ settings: dto });

            // Assert: The use case should succeed
            expect(result.isSuccess).toBe(true);
            expect(mockRepository.load).toHaveBeenCalledTimes(1);
            expect(mockRepository.save).toHaveBeenCalledTimes(1);

            // Verify that save was called with a SystemSettingsCollection
            const savedSettings = mockRepository.save.mock.calls[0][0];
            expect(savedSettings).toBeInstanceOf(SystemSettingsCollection);

            // Verify that the saved settings contain the DTO values (where defined)
            if (dto.retryWaitSecondsMin !== undefined) {
              expect(savedSettings.getRetryWaitSecondsMin()).toBe(dto.retryWaitSecondsMin);
            }
            if (dto.retryWaitSecondsMax !== undefined) {
              expect(savedSettings.getRetryWaitSecondsMax()).toBe(dto.retryWaitSecondsMax);
            }
            if (dto.retryCount !== undefined) {
              expect(savedSettings.getRetryCount()).toBe(dto.retryCount);
            }
            if (dto.enableTabRecording !== undefined) {
              expect(savedSettings.getEnableTabRecording()).toBe(dto.enableTabRecording);
            }
            if (dto.recordingBitrate !== undefined) {
              expect(savedSettings.getRecordingBitrate()).toBe(dto.recordingBitrate);
            }
            if (dto.recordingRetentionDays !== undefined) {
              expect(savedSettings.getRecordingRetentionDays()).toBe(dto.recordingRetentionDays);
            }
            if (dto.gradientAngle !== undefined) {
              expect(savedSettings.getGradientAngle()).toBe(dto.gradientAngle);
            }
            if (dto.maxStoredLogs !== undefined) {
              expect(savedSettings.getMaxStoredLogs()).toBe(dto.maxStoredLogs);
            }
            if (dto.logRetentionDays !== undefined) {
              expect(savedSettings.getLogRetentionDays()).toBe(dto.logRetentionDays);
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in the design
      );
    });
  });
});
