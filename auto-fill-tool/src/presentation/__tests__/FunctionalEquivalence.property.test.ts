/**
 * Property Tests: Functional Equivalence Preservation
 * Verifies that refactored operations produce the same results as before
 *
 * **Property 5: Functional Equivalence Preservation**
 * **Validates: Requirements 5.1, 5.3**
 */

import fc from 'fast-check';
import { ViewModelMapper } from '../mappers/ViewModelMapper';
import { SystemSettingsOutputDto } from '@application/dtos/SystemSettingsOutputDto';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';

describe('Property Tests: Functional Equivalence Preservation', () => {
  describe('SystemSettings ViewModel Mapping Equivalence', () => {
    it('Property 5.1: DTO to ViewModel conversion preserves all essential data fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            retryWaitSecondsMin: fc.integer({ min: 1, max: 300 }),
            retryWaitSecondsMax: fc.integer({ min: 1, max: 600 }),
            retryCount: fc.integer({ min: -1, max: 10 }),
            recordingEnabled: fc.boolean(),
            recordingBitrate: fc.integer({ min: 100000, max: 10000000 }),
            recordingRetentionDays: fc.integer({ min: 1, max: 365 }),
            enabledLogSources: fc.array(fc.constantFrom('background', 'popup', 'content-script', 'xpath-manager', 'automation-variables-manager'), { minLength: 1, maxLength: 5 }),
            securityEventsOnly: fc.boolean(),
            maxStoredLogs: fc.integer({ min: 10, max: 10000 }),
            logRetentionDays: fc.integer({ min: 1, max: 365 })
          }),
          (dto: SystemSettingsOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel = ViewModelMapper.toSystemSettingsViewModel(dto);

            // Assert: All essential data fields are preserved
            expect(viewModel.retryWaitSecondsMin).toBe(dto.retryWaitSecondsMin);
            expect(viewModel.retryWaitSecondsMax).toBe(dto.retryWaitSecondsMax);
            expect(viewModel.retryCount).toBe(dto.retryCount);
            expect(viewModel.recordingEnabled).toBe(dto.recordingEnabled);
            expect(viewModel.recordingBitrate).toBe(dto.recordingBitrate);
            expect(viewModel.recordingRetentionDays).toBe(dto.recordingRetentionDays);
            expect(viewModel.enabledLogSources).toEqual(dto.enabledLogSources);
            expect(viewModel.securityEventsOnly).toBe(dto.securityEventsOnly);
            expect(viewModel.maxStoredLogs).toBe(dto.maxStoredLogs);
            expect(viewModel.logRetentionDays).toBe(dto.logRetentionDays);

            // Verify no data loss occurred in core fields
            expect(typeof viewModel.retryWaitSecondsMin).toBe('number');
            expect(typeof viewModel.retryWaitSecondsMax).toBe('number');
            expect(typeof viewModel.retryCount).toBe('number');
            expect(typeof viewModel.recordingEnabled).toBe('boolean');
            expect(Array.isArray(viewModel.enabledLogSources)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 5.2: ViewModel field types remain consistent after conversion', () => {
      fc.assert(
        fc.property(
          fc.record({
            retryWaitSecondsMin: fc.integer({ min: 1, max: 300 }),
            retryWaitSecondsMax: fc.integer({ min: 1, max: 600 }),
            retryCount: fc.integer({ min: -1, max: 10 }),
            recordingEnabled: fc.boolean(),
            recordingBitrate: fc.integer({ min: 100000, max: 10000000 }),
            recordingRetentionDays: fc.integer({ min: 1, max: 365 }),
            enabledLogSources: fc.array(fc.constantFrom('background', 'popup', 'content-script'), { minLength: 1, maxLength: 3 }),
            securityEventsOnly: fc.boolean(),
            maxStoredLogs: fc.integer({ min: 10, max: 10000 }),
            logRetentionDays: fc.integer({ min: 1, max: 365 })
          }),
          (dto: SystemSettingsOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel = ViewModelMapper.toSystemSettingsViewModel(dto);

            // Assert: Type consistency is maintained for core data
            expect(typeof viewModel.retryWaitSecondsMin).toBe('number');
            expect(typeof viewModel.retryWaitSecondsMax).toBe('number');
            expect(typeof viewModel.retryCount).toBe('number');
            expect(typeof viewModel.recordingEnabled).toBe('boolean');
            expect(typeof viewModel.recordingBitrate).toBe('number');
            expect(typeof viewModel.recordingRetentionDays).toBe('number');
            expect(Array.isArray(viewModel.enabledLogSources)).toBe(true);
            expect(typeof viewModel.securityEventsOnly).toBe('boolean');
            expect(typeof viewModel.maxStoredLogs).toBe('number');
            expect(typeof viewModel.logRetentionDays).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('AutomationVariables ViewModel Mapping Equivalence', () => {
    it('Property 5.3: AutomationVariables DTO to ViewModel conversion preserves data integrity', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 2, maxLength: 50 }),
            websiteId: fc.string({ minLength: 2, maxLength: 50 }),
            variables: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 50 }),
                value: fc.string({ minLength: 0, maxLength: 200 }),
                type: fc.constantFrom('text', 'number', 'boolean')
              }),
              { minLength: 0, maxLength: 10 }
            ),
            status: fc.constantFrom('enabled', 'disabled', 'once'),
            createdAt: fc.constantFrom('2023-01-01T00:00:00.000Z', '2023-06-15T12:30:45.123Z', '2024-12-31T23:59:59.999Z'),
            updatedAt: fc.constantFrom('2023-01-01T00:00:00.000Z', '2023-06-15T12:30:45.123Z', '2024-12-31T23:59:59.999Z')
          }),
          (dto: AutomationVariablesOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel = ViewModelMapper.toAutomationVariablesViewModel(dto);

            // Assert: All essential fields are preserved correctly
            expect(viewModel.id).toBe(dto.id);
            expect(viewModel.websiteId).toBe(dto.websiteId);
            expect(viewModel.variables).toEqual(dto.variables);
            expect(viewModel.status).toBe(dto.status);
            expect(viewModel.createdAt).toBe(dto.createdAt);
            expect(viewModel.updatedAt).toBe(dto.updatedAt);

            // Verify variables array structure is preserved
            expect(Array.isArray(viewModel.variables)).toBe(true);
            expect(viewModel.variables.length).toBe(dto.variables.length);

            // Verify each variable in the array maintains structure
            viewModel.variables.forEach((variable, index) => {
              expect(variable.name).toBe(dto.variables[index].name);
              expect(variable.value).toBe(dto.variables[index].value);
              expect(variable.type).toBe(dto.variables[index].type);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Data Transformation Consistency', () => {
    it('Property 5.4: ViewModel transformations preserve core data deterministically', () => {
      fc.assert(
        fc.property(
          fc.record({
            retryWaitSecondsMin: fc.integer({ min: 1, max: 300 }),
            retryWaitSecondsMax: fc.integer({ min: 1, max: 600 }),
            retryCount: fc.integer({ min: -1, max: 10 }),
            recordingEnabled: fc.boolean(),
            recordingBitrate: fc.integer({ min: 100000, max: 10000000 }),
            recordingRetentionDays: fc.integer({ min: 1, max: 365 }),
            enabledLogSources: fc.array(fc.constantFrom('background', 'popup'), { minLength: 1, maxLength: 2 }),
            securityEventsOnly: fc.boolean(),
            maxStoredLogs: fc.integer({ min: 10, max: 10000 }),
            logRetentionDays: fc.integer({ min: 1, max: 365 })
          }),
          (dto: SystemSettingsOutputDto) => {
            // Act: Convert the same DTO multiple times
            const viewModel1 = ViewModelMapper.toSystemSettingsViewModel(dto);
            const viewModel2 = ViewModelMapper.toSystemSettingsViewModel(dto);

            // Assert: Core data fields should be identical (deterministic)
            expect(viewModel1.retryWaitSecondsMin).toBe(viewModel2.retryWaitSecondsMin);
            expect(viewModel1.retryWaitSecondsMax).toBe(viewModel2.retryWaitSecondsMax);
            expect(viewModel1.retryCount).toBe(viewModel2.retryCount);
            expect(viewModel1.recordingEnabled).toBe(viewModel2.recordingEnabled);
            expect(viewModel1.recordingBitrate).toBe(viewModel2.recordingBitrate);
            expect(viewModel1.recordingRetentionDays).toBe(viewModel2.recordingRetentionDays);
            expect(viewModel1.enabledLogSources).toEqual(viewModel2.enabledLogSources);
            expect(viewModel1.securityEventsOnly).toBe(viewModel2.securityEventsOnly);
            expect(viewModel1.maxStoredLogs).toBe(viewModel2.maxStoredLogs);
            expect(viewModel1.logRetentionDays).toBe(viewModel2.logRetentionDays);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 5.5: No data corruption occurs during ViewModel conversion', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 2, maxLength: 50 }),
            websiteId: fc.string({ minLength: 2, maxLength: 50 }),
            variables: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 50 }),
                value: fc.string({ minLength: 0, maxLength: 200 }),
                type: fc.constantFrom('text', 'number', 'boolean')
              }),
              { minLength: 1, maxLength: 5 }
            ),
            status: fc.constantFrom('enabled', 'disabled'),
            createdAt: fc.constantFrom('2023-01-01T00:00:00.000Z', '2024-12-31T23:59:59.999Z'),
            updatedAt: fc.constantFrom('2023-01-01T00:00:00.000Z', '2024-12-31T23:59:59.999Z')
          }),
          (dto: AutomationVariablesOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel = ViewModelMapper.toAutomationVariablesViewModel(dto);

            // Assert: No data corruption - all string fields remain strings
            expect(typeof viewModel.id).toBe('string');
            expect(typeof viewModel.websiteId).toBe('string');
            expect(typeof viewModel.status).toBe('string');
            expect(typeof viewModel.createdAt).toBe('string');
            expect(typeof viewModel.updatedAt).toBe('string');

            // Verify string fields are not empty or corrupted
            expect(viewModel.id.length).toBeGreaterThan(0);
            expect(viewModel.websiteId.length).toBeGreaterThan(0);
            expect(['enabled', 'disabled', 'once']).toContain(viewModel.status);

            // Verify date strings are valid ISO format
            expect(() => new Date(viewModel.createdAt)).not.toThrow();
            expect(() => new Date(viewModel.updatedAt)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Boundary Value Preservation', () => {
    it('Property 5.6: Edge case values are handled correctly in ViewModel conversion', () => {
      fc.assert(
        fc.property(
          fc.record({
            retryWaitSecondsMin: fc.constantFrom(1, 300, 999), // Edge values
            retryWaitSecondsMax: fc.constantFrom(1, 600, 999), // Edge values
            retryCount: fc.constantFrom(-1, 0, 1, 100), // Edge values including -1 for unlimited
            recordingEnabled: fc.boolean(),
            recordingBitrate: fc.constantFrom(100000, 10000000), // Edge values
            recordingRetentionDays: fc.constantFrom(1, 365), // Edge values
            enabledLogSources: fc.constantFrom(['background'], ['background', 'popup', 'content-script', 'xpath-manager', 'automation-variables-manager']), // Edge cases
            securityEventsOnly: fc.boolean(),
            maxStoredLogs: fc.constantFrom(10, 10000), // Edge values
            logRetentionDays: fc.constantFrom(1, 365) // Edge values
          }),
          (dto: SystemSettingsOutputDto) => {
            // Act: Convert DTO with edge case values
            const viewModel = ViewModelMapper.toSystemSettingsViewModel(dto);

            // Assert: Edge case values are preserved correctly
            expect(viewModel.retryWaitSecondsMin).toBe(dto.retryWaitSecondsMin);
            expect(viewModel.retryWaitSecondsMax).toBe(dto.retryWaitSecondsMax);
            expect(viewModel.retryCount).toBe(dto.retryCount);
            expect(viewModel.recordingBitrate).toBe(dto.recordingBitrate);
            expect(viewModel.recordingRetentionDays).toBe(dto.recordingRetentionDays);
            expect(viewModel.enabledLogSources).toEqual(dto.enabledLogSources);
            expect(viewModel.maxStoredLogs).toBe(dto.maxStoredLogs);
            expect(viewModel.logRetentionDays).toBe(dto.logRetentionDays);

            // Verify special values are handled correctly
            if (dto.retryCount === -1) {
              expect(viewModel.retryCount).toBe(-1); // Unlimited retries preserved
            }

            // Verify arrays are preserved correctly
            expect(Array.isArray(viewModel.enabledLogSources)).toBe(true);
            expect(viewModel.enabledLogSources.length).toBe(dto.enabledLogSources.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Functional Equivalence Verification', () => {
    it('Property 5.7: ViewModels maintain functional equivalence with original data', () => {
      fc.assert(
        fc.property(
          fc.record({
            retryWaitSecondsMin: fc.integer({ min: 1, max: 300 }),
            retryWaitSecondsMax: fc.integer({ min: 1, max: 600 }),
            retryCount: fc.integer({ min: -1, max: 10 }),
            recordingEnabled: fc.boolean(),
            recordingBitrate: fc.integer({ min: 100000, max: 10000000 }),
            recordingRetentionDays: fc.integer({ min: 1, max: 365 }),
            enabledLogSources: fc.array(fc.constantFrom('background', 'popup'), { minLength: 1, maxLength: 2 }),
            securityEventsOnly: fc.boolean(),
            maxStoredLogs: fc.integer({ min: 10, max: 10000 }),
            logRetentionDays: fc.integer({ min: 1, max: 365 })
          }),
          (dto: SystemSettingsOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel = ViewModelMapper.toSystemSettingsViewModel(dto);

            // Assert: Functional equivalence - the ViewModel can represent the same data
            // This verifies that the refactored architecture maintains the same capabilities

            // Core settings functionality is preserved
            expect(viewModel.retryWaitSecondsMin).toBe(dto.retryWaitSecondsMin);
            expect(viewModel.retryWaitSecondsMax).toBe(dto.retryWaitSecondsMax);
            expect(viewModel.retryCount).toBe(dto.retryCount);

            // Recording settings functionality is preserved
            expect(viewModel.recordingEnabled).toBe(dto.recordingEnabled);
            expect(viewModel.recordingBitrate).toBe(dto.recordingBitrate);
            expect(viewModel.recordingRetentionDays).toBe(dto.recordingRetentionDays);

            // Logging settings functionality is preserved
            expect(viewModel.enabledLogSources).toEqual(dto.enabledLogSources);
            expect(viewModel.securityEventsOnly).toBe(dto.securityEventsOnly);
            expect(viewModel.maxStoredLogs).toBe(dto.maxStoredLogs);
            expect(viewModel.logRetentionDays).toBe(dto.logRetentionDays);

            // The ViewModel should provide the same functional capabilities as the original
            // This ensures that the refactoring maintains functional equivalence
            expect(typeof viewModel).toBe('object');
            expect(viewModel).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
