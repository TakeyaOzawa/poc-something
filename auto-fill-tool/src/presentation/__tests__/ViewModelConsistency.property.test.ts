/**
 * Property-Based Tests: ViewModel Usage Consistency
 * Tests consistent ViewModel usage patterns across all Presenters
 *
 * Feature: presentation-layer-viewmodel-completion, Property 4: 一貫したViewModelの使用
 * Validates: Requirements 4.1
 */

import * as fc from 'fast-check';
import { ViewModelMapper } from '../mappers/ViewModelMapper';
import { SystemSettingsOutputDto } from '@application/dtos/SystemSettingsOutputDto';
import { StorageSyncConfigOutputDto } from '@application/dtos/StorageSyncConfigOutputDto';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { XPathOutputDto } from '@application/dtos/XPathOutputDto';
import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';
import { TabRecordingOutputDto } from '@application/dtos/TabRecordingOutputDto';

import { SystemSettingsViewModel } from '../types/SystemSettingsViewModel';
import { StorageSyncConfigViewModel } from '../types/StorageSyncConfigViewModel';
import { AutomationVariablesViewModel } from '../types/AutomationVariablesViewModel';
import { XPathViewModel } from '../types/XPathViewModel';
import { WebsiteViewModel } from '../types/WebsiteViewModel';
import { TabRecordingViewModel } from '../types/TabRecordingViewModel';

describe('ViewModel Usage Consistency - Property-Based Tests', () => {
  /**
   * Property 4: 一貫したViewModelの使用
   * For any DTO from any UseCase, ViewModelMapper should consistently convert it to
   * a ViewModel that follows the standard ViewModel pattern with:
   * - Basic data fields preserved
   * - UI state properties (isLoading, hasErrors, etc.)
   * - Display properties for UI rendering
   * - UI operation flags (canEdit, canDelete, etc.)
   */
  describe('Property 4: 一貫したViewModelの使用', () => {
    it('should consistently convert SystemSettingsOutputDto to ViewModel with standard pattern', () => {
      fc.assert(
        fc.property(
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
            return dto.retryWaitSecondsMin <= dto.retryWaitSecondsMax;
          }),
          (dto: SystemSettingsOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel: SystemSettingsViewModel = ViewModelMapper.toSystemSettingsViewModel(dto);

            // Assert: Verify standard ViewModel pattern
            // 1. Basic data fields preserved
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

            // 2. Display properties for UI rendering
            expect(viewModel.retryWaitRangeText).toBeDefined();
            expect(typeof viewModel.retryWaitRangeText).toBe('string');
            expect(viewModel.retryCountText).toBeDefined();
            expect(typeof viewModel.retryCountText).toBe('string');
            expect(viewModel.recordingStatusText).toBeDefined();
            expect(typeof viewModel.recordingStatusText).toBe('string');
            expect(viewModel.logSettingsText).toBeDefined();
            expect(typeof viewModel.logSettingsText).toBe('string');

            // 3. UI operation flags
            expect(viewModel.canSave).toBeDefined();
            expect(typeof viewModel.canSave).toBe('boolean');
            expect(viewModel.canReset).toBeDefined();
            expect(typeof viewModel.canReset).toBe('boolean');
            expect(viewModel.canExport).toBeDefined();
            expect(typeof viewModel.canExport).toBe('boolean');
            expect(viewModel.canImport).toBeDefined();
            expect(typeof viewModel.canImport).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently convert StorageSyncConfigOutputDto to ViewModel with standard pattern', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            storageKey: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            syncMethod: fc.constantFrom('notion', 'spread-sheet'),
            syncTiming: fc.constantFrom('manual', 'periodic'),
            syncDirection: fc.constantFrom('bidirectional', 'receive_only', 'send_only'),
            conflictResolution: fc.constantFrom('latest_timestamp', 'local_priority', 'remote_priority', 'user_confirm'),
            enabled: fc.boolean(),
            syncIntervalSeconds: fc.option(fc.integer({ min: 60, max: 86400 }), { nil: undefined }),
            inputs: fc.array(
              fc.record({
                key: fc.string({ minLength: 1, maxLength: 20 }),
                value: fc.string({ minLength: 0, maxLength: 100 }),
              }),
              { minLength: 0, maxLength: 5 }
            ),
            outputs: fc.array(
              fc.record({
                key: fc.string({ minLength: 1, maxLength: 20 }),
                defaultValue: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
              }),
              { minLength: 0, maxLength: 5 }
            ),
            createdAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
            updatedAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
          }),
          (dto: StorageSyncConfigOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel: StorageSyncConfigViewModel = ViewModelMapper.toStorageSyncConfigViewModel(dto);

            // Assert: Verify standard ViewModel pattern
            // 1. Basic data fields preserved
            expect(viewModel.id).toBe(dto.id);
            expect(viewModel.storageKey).toBe(dto.storageKey);
            expect(viewModel.syncMethod).toBe(dto.syncMethod);
            expect(viewModel.syncTiming).toBe(dto.syncTiming);
            expect(viewModel.syncDirection).toBe(dto.syncDirection);
            expect(viewModel.conflictResolution).toBe(dto.conflictResolution);
            expect(viewModel.enabled).toBe(dto.enabled);
            expect(viewModel.syncIntervalSeconds).toBe(dto.syncIntervalSeconds || 0);
            expect(viewModel.inputs).toEqual(dto.inputs);
            expect(viewModel.outputs).toEqual(dto.outputs);
            expect(viewModel.createdAt).toBe(dto.createdAt);
            expect(viewModel.updatedAt).toBe(dto.updatedAt);

            // 2. Display properties for UI rendering
            expect(viewModel.displayName).toBeDefined();
            expect(typeof viewModel.displayName).toBe('string');
            expect(viewModel.syncMethodText).toBeDefined();
            expect(typeof viewModel.syncMethodText).toBe('string');
            expect(viewModel.syncTimingText).toBeDefined();
            expect(typeof viewModel.syncTimingText).toBe('string');
            expect(viewModel.syncDirectionText).toBeDefined();
            expect(typeof viewModel.syncDirectionText).toBe('string');
            expect(viewModel.statusText).toBeDefined();
            expect(typeof viewModel.statusText).toBe('string');

            // 3. UI operation flags
            expect(viewModel.canEdit).toBeDefined();
            expect(typeof viewModel.canEdit).toBe('boolean');
            expect(viewModel.canDelete).toBeDefined();
            expect(typeof viewModel.canDelete).toBe('boolean');
            expect(viewModel.canTest).toBeDefined();
            expect(typeof viewModel.canTest).toBe('boolean');
            expect(viewModel.canSync).toBeDefined();
            expect(typeof viewModel.canSync).toBe('boolean');
            expect(viewModel.canViewHistory).toBeDefined();
            expect(typeof viewModel.canViewHistory).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently convert AutomationVariablesOutputDto to ViewModel with standard pattern', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            websiteId: fc.uuid(),
            status: fc.constantFrom('enabled', 'disabled', 'once'),
            variables: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.string({ minLength: 0, maxLength: 100 })
            ),
            createdAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
            updatedAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
          }),
          (dto: AutomationVariablesOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel: AutomationVariablesViewModel = ViewModelMapper.toAutomationVariablesViewModel(dto);

            // Assert: Verify standard ViewModel pattern
            // 1. Basic data fields preserved
            expect(viewModel.id).toBe(dto.id);
            expect(viewModel.websiteId).toBe(dto.websiteId);
            expect(viewModel.status).toBe(dto.status);
            expect(viewModel.variables).toEqual(dto.variables);
            expect(viewModel.createdAt).toBe(dto.createdAt);
            expect(viewModel.updatedAt).toBe(dto.updatedAt);

            // 2. Display properties for UI rendering
            expect(viewModel.name).toBeDefined();
            expect(typeof viewModel.name).toBe('string');
            expect(viewModel.displayName).toBeDefined();
            expect(typeof viewModel.displayName).toBe('string');
            expect(viewModel.variableCount).toBeDefined();
            expect(typeof viewModel.variableCount).toBe('number');
            expect(viewModel.variableCount).toBe(Object.keys(dto.variables).length);
            expect(viewModel.lastUpdatedFormatted).toBeDefined();
            expect(typeof viewModel.lastUpdatedFormatted).toBe('string');

            // 3. UI operation flags
            expect(viewModel.canEdit).toBeDefined();
            expect(typeof viewModel.canEdit).toBe('boolean');
            expect(viewModel.canDelete).toBeDefined();
            expect(typeof viewModel.canDelete).toBe('boolean');
            expect(viewModel.canDuplicate).toBeDefined();
            expect(typeof viewModel.canDuplicate).toBe('boolean');
            expect(viewModel.canExecute).toBeDefined();
            expect(typeof viewModel.canExecute).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently convert XPathOutputDto to ViewModel with standard pattern', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            websiteId: fc.uuid(),
            url: fc.webUrl(),
            actionType: fc.string({ minLength: 1, maxLength: 20 }),
            value: fc.option(fc.string({ minLength: 0, maxLength: 100 })),
            pathAbsolute: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
            pathShort: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            pathSmart: fc.option(fc.string({ minLength: 1, maxLength: 150 })),
            selectedPathPattern: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
            executionOrder: fc.integer({ min: 0, max: 100 }),
            afterWaitSeconds: fc.integer({ min: 0, max: 60 }),
            executionTimeoutSeconds: fc.integer({ min: 1, max: 300 }),
            retryType: fc.integer({ min: 0, max: 5 }),
            actionPattern: fc.option(fc.string({ minLength: 0, maxLength: 50 })),
          }),
          (dto: XPathOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel: XPathViewModel = ViewModelMapper.toXPathViewModel(dto);

            // Assert: Verify standard ViewModel pattern
            // 1. Basic data fields preserved
            expect(viewModel.id).toBe(dto.id);
            expect(viewModel.websiteId).toBe(dto.websiteId);
            expect(viewModel.url).toBe(dto.url);
            expect(viewModel.actionType).toBe(dto.actionType);
            expect(viewModel.value).toBe(dto.value);
            expect(viewModel.pathAbsolute).toBe(dto.pathAbsolute || '');
            expect(viewModel.pathShort).toBe(dto.pathShort || '');
            expect(viewModel.pathSmart).toBe(dto.pathSmart || '');
            expect(viewModel.selectedPathPattern).toBe(dto.selectedPathPattern);
            expect(viewModel.executionOrder).toBe(dto.executionOrder);
            expect(viewModel.afterWaitSeconds).toBe(dto.afterWaitSeconds);
            expect(viewModel.executionTimeoutSeconds).toBe(dto.executionTimeoutSeconds);
            expect(viewModel.retryType).toBe(dto.retryType);
            expect(viewModel.actionPattern).toBe(dto.actionPattern || '');

            // 2. Display properties for UI rendering
            expect(viewModel.displayValue).toBeDefined();
            expect(typeof viewModel.displayValue).toBe('string');
            expect(viewModel.actionTypeText).toBeDefined();
            expect(typeof viewModel.actionTypeText).toBe('string');
            expect(viewModel.executionOrderText).toBeDefined();
            expect(typeof viewModel.executionOrderText).toBe('string');
            expect(viewModel.retryTypeText).toBeDefined();
            expect(typeof viewModel.retryTypeText).toBe('string');

            // 3. UI operation flags
            expect(viewModel.canEdit).toBeDefined();
            expect(typeof viewModel.canEdit).toBe('boolean');
            expect(viewModel.canDelete).toBeDefined();
            expect(typeof viewModel.canDelete).toBe('boolean');
            expect(viewModel.canDuplicate).toBeDefined();
            expect(typeof viewModel.canDuplicate).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently convert WebsiteOutputDto to ViewModel with standard pattern', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            startUrl: fc.webUrl(),
            status: fc.constantFrom('enabled', 'disabled', 'once'),
            editable: fc.boolean(),
            updatedAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
          }),
          (dto: WebsiteOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel: WebsiteViewModel = ViewModelMapper.toWebsiteViewModel(dto);

            // Assert: Verify standard ViewModel pattern
            // 1. Basic data fields preserved
            expect(viewModel.id).toBe(dto.id);
            expect(viewModel.name).toBe(dto.name);
            expect(viewModel.startUrl).toBe(dto.startUrl);
            expect(viewModel.status).toBe(dto.status);
            expect(viewModel.editable).toBe(dto.editable);
            expect(viewModel.updatedAt).toBe(dto.updatedAt);

            // 2. Display properties for UI rendering
            expect(viewModel.displayName).toBeDefined();
            expect(typeof viewModel.displayName).toBe('string');
            expect(viewModel.statusText).toBeDefined();
            expect(typeof viewModel.statusText).toBe('string');
            expect(viewModel.lastUpdatedFormatted).toBeDefined();
            expect(typeof viewModel.lastUpdatedFormatted).toBe('string');

            // 3. UI operation flags
            expect(viewModel.canDelete).toBeDefined();
            expect(typeof viewModel.canDelete).toBe('boolean');
            expect(viewModel.canEdit).toBeDefined();
            expect(typeof viewModel.canEdit).toBe('boolean');
            expect(viewModel.canExecute).toBeDefined();
            expect(typeof viewModel.canExecute).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently convert TabRecordingOutputDto to ViewModel with standard pattern', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            automationResultId: fc.uuid(),
            startedAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
            stoppedAt: fc.option(fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString())),
            duration: fc.option(fc.integer({ min: 0, max: 3600000 })),
            size: fc.integer({ min: 0, max: 1000000000 }),
            mimeType: fc.constantFrom('video/webm', 'video/mp4'),
          }),
          (dto: TabRecordingOutputDto) => {
            // Act: Convert DTO to ViewModel
            const viewModel: TabRecordingViewModel = ViewModelMapper.toTabRecordingViewModel(dto);

            // Assert: Verify standard ViewModel pattern
            // 1. Basic data fields preserved
            expect(viewModel.id).toBe(dto.id);
            expect(viewModel.automationResultId).toBe(dto.automationResultId);
            expect(viewModel.startedAt).toBe(dto.startedAt);
            expect(viewModel.stoppedAt).toBe(dto.stoppedAt || '');
            expect(viewModel.duration).toBe(dto.duration || 0);
            expect(viewModel.size).toBe(dto.size);
            expect(viewModel.mimeType).toBe(dto.mimeType);

            // 2. Display properties for UI rendering
            expect(viewModel.durationText).toBeDefined();
            expect(typeof viewModel.durationText).toBe('string');
            expect(viewModel.sizeText).toBeDefined();
            expect(typeof viewModel.sizeText).toBe('string');
            expect(viewModel.startedAtFormatted).toBeDefined();
            expect(typeof viewModel.startedAtFormatted).toBe('string');
            expect(viewModel.stoppedAtFormatted).toBeDefined();
            expect(typeof viewModel.stoppedAtFormatted).toBe('string');
            expect(viewModel.statusText).toBeDefined();
            expect(typeof viewModel.statusText).toBe('string');

            // 3. UI operation flags
            expect(viewModel.canPlay).toBeDefined();
            expect(typeof viewModel.canPlay).toBe('boolean');
            expect(viewModel.canDownload).toBeDefined();
            expect(typeof viewModel.canDownload).toBe('boolean');
            expect(viewModel.canDelete).toBeDefined();
            expect(typeof viewModel.canDelete).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Array conversion consistency
   * For any array of DTOs, ViewModelMapper should consistently convert them to
   * an array of ViewModels maintaining the same order and count
   */
  describe('Array conversion consistency', () => {
    it('should consistently convert arrays of DTOs to ViewModels', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              startUrl: fc.webUrl(),
              status: fc.constantFrom('enabled', 'disabled', 'once'),
              editable: fc.boolean(),
              updatedAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (dtos: WebsiteOutputDto[]) => {
            // Act: Convert array of DTOs to ViewModels
            const viewModels: WebsiteViewModel[] = ViewModelMapper.toWebsiteViewModels(dtos);

            // Assert: Verify array conversion consistency
            expect(viewModels).toHaveLength(dtos.length);

            // Verify each element follows the same conversion pattern
            dtos.forEach((dto, index) => {
              const viewModel = viewModels[index];
              expect(viewModel.id).toBe(dto.id);
              expect(viewModel.name).toBe(dto.name);
              expect(viewModel.startUrl).toBe(dto.startUrl);
              expect(viewModel.status).toBe(dto.status);
              expect(viewModel.editable).toBe(dto.editable);
              expect(viewModel.updatedAt).toBe(dto.updatedAt);

              // Verify standard ViewModel pattern is maintained
              expect(viewModel.displayName).toBeDefined();
              expect(viewModel.statusText).toBeDefined();
              expect(viewModel.lastUpdatedFormatted).toBeDefined();
              expect(viewModel.canDelete).toBeDefined();
              expect(viewModel.canEdit).toBeDefined();
              expect(viewModel.canExecute).toBeDefined();
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

/**
 * Property-Based Tests: Domain Logic Delegation
 * Tests that Presenters delegate domain logic to UseCases instead of direct entity operations
 *
 * Feature: presentation-layer-viewmodel-completion, Property 8: ドメインロジック委譲
 * Validates: Requirements 4.4
 */
describe('Property 8: ドメインロジック委譲', () => {
  /**
   * Property 8: ドメインロジック委譲
   * For any Presenter domain logic operation, the logic should be delegated to
   * appropriate UseCases rather than direct entity operations
   */

  it('should delegate SystemSettings operations to UseCases instead of direct entity manipulation', () => {
    fc.assert(
      fc.property(
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
        }).filter((settings) => {
          return settings.retryWaitSecondsMin <= settings.retryWaitSecondsMax;
        }),
        (settingsData) => {
          // Act: Convert to ViewModel (simulating Presenter behavior)
          const viewModel = ViewModelMapper.toSystemSettingsViewModel(settingsData);

          // Assert: Verify ViewModel contains no domain logic operations
          // 1. ViewModel should only contain data and UI-specific properties
          expect(typeof viewModel.retryWaitSecondsMin).toBe('number');
          expect(typeof viewModel.retryWaitSecondsMax).toBe('number');
          expect(typeof viewModel.retryCount).toBe('number');
          expect(typeof viewModel.recordingEnabled).toBe('boolean');

          // 2. ViewModel should contain UI-specific display properties (not domain logic)
          expect(typeof viewModel.retryWaitRangeText).toBe('string');
          expect(typeof viewModel.retryCountText).toBe('string');
          expect(typeof viewModel.recordingStatusText).toBe('string');
          expect(typeof viewModel.logSettingsText).toBe('string');

          // 3. ViewModel should contain UI operation flags (not domain operations)
          expect(typeof viewModel.canSave).toBe('boolean');
          expect(typeof viewModel.canReset).toBe('boolean');
          expect(typeof viewModel.canExport).toBe('boolean');
          expect(typeof viewModel.canImport).toBe('boolean');

          // 4. ViewModel should not contain methods that perform domain logic
          // (All domain operations should be delegated to UseCases)
          const viewModelKeys = Object.keys(viewModel);
          const domainLogicMethods = viewModelKeys.filter(key =>
            typeof viewModel[key] === 'function' &&
            !key.startsWith('get') && // Getter methods are allowed
            key !== 'getGradientStartColor' &&
            key !== 'getGradientEndColor' &&
            key !== 'getGradientAngle'
          );
          expect(domainLogicMethods).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should delegate StorageSyncConfig operations to UseCases instead of direct entity manipulation', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          storageKey: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          syncMethod: fc.constantFrom('notion', 'spread-sheet'),
          syncTiming: fc.constantFrom('manual', 'periodic'),
          syncDirection: fc.constantFrom('bidirectional', 'receive_only', 'send_only'),
          conflictResolution: fc.constantFrom('latest_timestamp', 'local_priority', 'remote_priority', 'user_confirm'),
          enabled: fc.boolean(),
          syncIntervalSeconds: fc.option(fc.integer({ min: 60, max: 86400 }), { nil: undefined }),
          inputs: fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 20 }),
              value: fc.string({ minLength: 0, maxLength: 100 }),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          outputs: fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 20 }),
              defaultValue: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          createdAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
          updatedAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
        }),
        (configData) => {
          // Act: Convert to ViewModel (simulating Presenter behavior)
          const viewModel = ViewModelMapper.toStorageSyncConfigViewModel(configData);

          // Assert: Verify ViewModel contains no domain logic operations
          // 1. ViewModel should only contain data and UI-specific properties
          expect(typeof viewModel.id).toBe('string');
          expect(typeof viewModel.storageKey).toBe('string');
          expect(typeof viewModel.syncMethod).toBe('string');
          expect(typeof viewModel.enabled).toBe('boolean');

          // 2. ViewModel should contain UI-specific display properties (not domain logic)
          expect(typeof viewModel.displayName).toBe('string');
          expect(typeof viewModel.syncMethodText).toBe('string');
          expect(typeof viewModel.syncTimingText).toBe('string');
          expect(typeof viewModel.statusText).toBe('string');

          // 3. ViewModel should contain UI operation flags (not domain operations)
          expect(typeof viewModel.canEdit).toBe('boolean');
          expect(typeof viewModel.canDelete).toBe('boolean');
          expect(typeof viewModel.canTest).toBe('boolean');
          expect(typeof viewModel.canSync).toBe('boolean');

          // 4. ViewModel should not contain methods that perform domain logic
          // (All domain operations should be delegated to UseCases)
          const viewModelKeys = Object.keys(viewModel);
          const domainLogicMethods = viewModelKeys.filter(key =>
            typeof viewModel[key] === 'function'
          );
          expect(domainLogicMethods).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should delegate AutomationVariables operations to UseCases instead of direct entity manipulation', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          websiteId: fc.uuid(),
          status: fc.constantFrom('enabled', 'disabled', 'once'),
          variables: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ minLength: 0, maxLength: 100 })
          ),
          createdAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
          updatedAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
        }),
        (variablesData) => {
          // Act: Convert to ViewModel (simulating Presenter behavior)
          const viewModel = ViewModelMapper.toAutomationVariablesViewModel(variablesData);

          // Assert: Verify ViewModel contains no domain logic operations
          // 1. ViewModel should only contain data and UI-specific properties
          expect(typeof viewModel.id).toBe('string');
          expect(typeof viewModel.websiteId).toBe('string');
          expect(typeof viewModel.status).toBe('string');
          expect(typeof viewModel.variables).toBe('object');

          // 2. ViewModel should contain UI-specific display properties (not domain logic)
          expect(typeof viewModel.name).toBe('string');
          expect(typeof viewModel.displayName).toBe('string');
          expect(typeof viewModel.variableCount).toBe('number');
          expect(typeof viewModel.lastUpdatedFormatted).toBe('string');

          // 3. ViewModel should contain UI operation flags (not domain operations)
          expect(typeof viewModel.canEdit).toBe('boolean');
          expect(typeof viewModel.canDelete).toBe('boolean');
          expect(typeof viewModel.canDuplicate).toBe('boolean');
          expect(typeof viewModel.canExecute).toBe('boolean');

          // 4. ViewModel should not contain methods that perform domain logic
          // (All domain operations should be delegated to UseCases)
          const viewModelKeys = Object.keys(viewModel);
          const domainLogicMethods = viewModelKeys.filter(key =>
            typeof viewModel[key] === 'function'
          );
          expect(domainLogicMethods).toHaveLength(0);

          // 5. Verify that variable count is calculated correctly (simple UI logic, not domain logic)
          expect(viewModel.variableCount).toBe(Object.keys(variablesData.variables).length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure ViewModelMapper methods only perform data transformation, not domain logic', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          startUrl: fc.webUrl(),
          status: fc.constantFrom('enabled', 'disabled', 'once'),
          editable: fc.boolean(),
          updatedAt: fc.integer({ min: 1577836800000, max: 1704067200000 }).map(ts => new Date(ts).toISOString()),
        }),
        (websiteData) => {
          // Act: Convert to ViewModel using ViewModelMapper
          const viewModel = ViewModelMapper.toWebsiteViewModel(websiteData);

          // Assert: Verify ViewModelMapper only performs data transformation
          // 1. All input data should be preserved
          expect(viewModel.id).toBe(websiteData.id);
          expect(viewModel.name).toBe(websiteData.name);
          expect(viewModel.startUrl).toBe(websiteData.startUrl);
          expect(viewModel.status).toBe(websiteData.status);
          expect(viewModel.editable).toBe(websiteData.editable);
          expect(viewModel.updatedAt).toBe(websiteData.updatedAt);

          // 2. UI-specific transformations should be simple formatting, not domain logic
          expect(viewModel.displayName).toBe(websiteData.name || '未設定');
          expect(viewModel.lastUpdatedFormatted).toBe(new Date(websiteData.updatedAt).toLocaleString());

          // 3. Status text should be simple mapping, not domain logic
          const expectedStatusText = websiteData.status === 'enabled' ? '有効' :
                                   websiteData.status === 'disabled' ? '無効' : '1回のみ';
          expect(viewModel.statusText).toBe(expectedStatusText);

          // 4. UI operation flags should be based on data state, not complex domain rules
          expect(viewModel.canDelete).toBe(websiteData.editable);
          expect(viewModel.canEdit).toBe(websiteData.editable);
          expect(viewModel.canExecute).toBe(websiteData.status === 'enabled' || websiteData.status === 'once');

          // 5. ViewModel should not contain any methods (all logic delegated to UseCases)
          const viewModelKeys = Object.keys(viewModel);
          const methods = viewModelKeys.filter(key => typeof viewModel[key] === 'function');
          expect(methods).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
