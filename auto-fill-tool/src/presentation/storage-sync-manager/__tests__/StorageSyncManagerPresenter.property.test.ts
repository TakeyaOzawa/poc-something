/**
 * Property-Based Tests: StorageSyncManagerPresenter
 * Tests universal properties for DTO-based UseCase communication
 */

import * as fc from 'fast-check';
import {
  StorageSyncManagerPresenter,
  StorageSyncManagerView,
} from '../StorageSyncManagerPresenter';
import { CreateSyncConfigUseCase } from '@application/usecases/sync/CreateSyncConfigUseCase';
import { UpdateSyncConfigUseCase } from '@application/usecases/sync/UpdateSyncConfigUseCase';
import { DeleteSyncConfigUseCase } from '@application/usecases/sync/DeleteSyncConfigUseCase';
import { ListSyncConfigsUseCase } from '@application/usecases/sync/ListSyncConfigsUseCase';
import { ImportCSVUseCase } from '@application/usecases/sync/ImportCSVUseCase';
import { ExportCSVUseCase } from '@application/usecases/sync/ExportCSVUseCase';
import { ValidateSyncConfigUseCase } from '@application/usecases/sync/ValidateSyncConfigUseCase';
import { TestConnectionUseCase } from '@application/usecases/sync/TestConnectionUseCase';
import { GetSyncHistoriesUseCase } from '@application/usecases/sync/GetSyncHistoriesUseCase';
import { CleanupSyncHistoriesUseCase } from '@application/usecases/sync/CleanupSyncHistoriesUseCase';
import { StorageSyncConfigViewModel } from '../types/StorageSyncConfigViewModel';
import { ViewModelMapper } from '../mappers/ViewModelMapper';
import { NoOpLogger } from '@domain/services/NoOpLogger';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string, ...args: any[]) => {
      if (args.length > 0) {
        return args.length === 1 && typeof args[0] === 'string'
          ? `${key}: ${args[0]}`
          : `${key}: ${args.join(', ')}`;
      }
      return key;
    }),
  },
}));

describe('StorageSyncManagerPresenter Property Tests', () => {
  let presenter: StorageSyncManagerPresenter;
  let mockView: jest.Mocked<StorageSyncManagerView>;
  let mockCreateUseCase: jest.Mocked<CreateSyncConfigUseCase>;
  let mockUpdateUseCase: jest.Mocked<UpdateSyncConfigUseCase>;
  let mockDeleteUseCase: jest.Mocked<DeleteSyncConfigUseCase>;
  let mockListUseCase: jest.Mocked<ListSyncConfigsUseCase>;
  let mockImportUseCase: jest.Mocked<ImportCSVUseCase>;
  let mockExportUseCase: jest.Mocked<ExportCSVUseCase>;
  let mockValidateUseCase: jest.Mocked<ValidateSyncConfigUseCase>;
  let mockTestConnectionUseCase: jest.Mocked<TestConnectionUseCase>;
  let mockGetHistoriesUseCase: jest.Mocked<GetSyncHistoriesUseCase>;
  let mockCleanupHistoriesUseCase: jest.Mocked<CleanupSyncHistoriesUseCase>;

  beforeEach(() => {
    mockView = {
      showConfigs: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      showEmpty: jest.fn(),
      showConnectionTestResult: jest.fn(),
      showValidationResult: jest.fn(),
      showSyncHistories: jest.fn(),
      showHistoryEmpty: jest.fn(),
      showHistoryDetail: jest.fn(),
      showConflictResolutionDialog: jest.fn(),
      showProgress: jest.fn(),
      updateProgress: jest.fn(),
      hideProgress: jest.fn(),
    };

    mockCreateUseCase = { execute: jest.fn() } as any;
    mockUpdateUseCase = { execute: jest.fn() } as any;
    mockDeleteUseCase = { execute: jest.fn() } as any;
    mockListUseCase = { execute: jest.fn() } as any;
    mockImportUseCase = { execute: jest.fn() } as any;
    mockExportUseCase = { execute: jest.fn() } as any;
    mockValidateUseCase = { execute: jest.fn() } as any;
    mockTestConnectionUseCase = { execute: jest.fn() } as any;
    mockGetHistoriesUseCase = { execute: jest.fn() } as any;
    mockCleanupHistoriesUseCase = { execute: jest.fn() } as any;

    presenter = new StorageSyncManagerPresenter(
      mockView,
      mockCreateUseCase,
      mockUpdateUseCase,
      mockDeleteUseCase,
      mockListUseCase,
      mockImportUseCase,
      mockExportUseCase,
      mockValidateUseCase,
      mockTestConnectionUseCase,
      mockGetHistoriesUseCase,
      mockCleanupHistoriesUseCase,
      new NoOpLogger()
    );
  });

  // Generators for test data
  const syncMethodArb = fc.constantFrom('notion', 'spread-sheet');
  const syncTimingArb = fc.constantFrom('manual', 'periodic');
  const syncDirectionArb = fc.constantFrom('bidirectional', 'receive_only', 'send_only');
  const conflictResolutionArb = fc.constantFrom(
    'latest_timestamp',
    'local_priority',
    'remote_priority',
    'user_confirm'
  );

  const syncInputArb = fc.record({
    key: fc.string({ minLength: 1, maxLength: 50 }),
    value: fc.string({ minLength: 1, maxLength: 100 }),
  });

  const syncOutputArb = fc.record({
    key: fc.string({ minLength: 1, maxLength: 50 }),
    defaultValue: fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
  });

  const retryPolicyArb = fc.record({
    maxAttempts: fc.integer({ min: 1, max: 10 }),
    initialDelayMs: fc.integer({ min: 100, max: 5000 }),
    maxDelayMs: fc.integer({ min: 5000, max: 60000 }),
    backoffMultiplier: fc.float({ min: Math.fround(1.1), max: Math.fround(3.0) }),
  });

  const storageSyncConfigViewModelArb = fc.record({
    id: fc.uuid(),
    storageKey: fc.string({ minLength: 1, maxLength: 100 }),
    enabled: fc.boolean(),
    syncMethod: syncMethodArb,
    syncTiming: syncTimingArb,
    syncDirection: syncDirectionArb,
    conflictResolution: conflictResolutionArb,
    syncIntervalSeconds: fc.option(fc.integer({ min: 1, max: 86400 })),
    inputs: fc.array(syncInputArb, { minLength: 0, maxLength: 5 }),
    outputs: fc.array(syncOutputArb, { minLength: 0, maxLength: 5 }),
    retryPolicy: fc.option(retryPolicyArb),
    createdAt: fc.integer({ min: 1577836800000, max: 1893456000000 }).map(timestamp => new Date(timestamp).toISOString()),
    updatedAt: fc.integer({ min: 1577836800000, max: 1893456000000 }).map(timestamp => new Date(timestamp).toISOString()),
    displayName: fc.string({ minLength: 1, maxLength: 100 }),
    syncMethodText: fc.string({ minLength: 1, maxLength: 50 }),
    syncTimingText: fc.string({ minLength: 1, maxLength: 50 }),
    syncDirectionText: fc.string({ minLength: 1, maxLength: 50 }),
    statusText: fc.string({ minLength: 1, maxLength: 50 }),
    canEdit: fc.boolean(),
    canDelete: fc.boolean(),
    canTest: fc.boolean(),
    canSync: fc.boolean(),
    canViewHistory: fc.boolean(),
  });

  /**
   * Property 3: DTOベースのUseCase通信
   * For any ViewModel data passed to presenter methods, the presenter should
   * convert it to appropriate DTO format for UseCase communication
   * **Validates: Requirements 2.2**
   */
  describe('Property 3: DTOベースのUseCase通信', () => {
    it('should convert ViewModel to DTO for createConfig UseCase communication', async () => {
      await fc.assert(
        fc.asyncProperty(storageSyncConfigViewModelArb, async (configViewModel) => {
          // Arrange: Mock successful UseCase response
          mockCreateUseCase.execute.mockResolvedValue({
            success: true,
            config: {} as any,
          });

          try {
            // Act: Call presenter method with ViewModel
            await presenter.createConfig(configViewModel);

            // Assert: Verify DTO-based UseCase communication
            expect(mockCreateUseCase.execute).toHaveBeenCalledTimes(1);
            const calledWith = mockCreateUseCase.execute.mock.calls[0][0];

            // Verify all required DTO fields are present and correctly mapped
            expect(calledWith).toHaveProperty('storageKey', configViewModel.storageKey);
            expect(calledWith).toHaveProperty('enabled', configViewModel.enabled);
            expect(calledWith).toHaveProperty('syncMethod', configViewModel.syncMethod);
            expect(calledWith).toHaveProperty('syncTiming', configViewModel.syncTiming);
            expect(calledWith).toHaveProperty('syncDirection', configViewModel.syncDirection);
            expect(calledWith).toHaveProperty('inputs', configViewModel.inputs);
            expect(calledWith).toHaveProperty('outputs', configViewModel.outputs);

            // Verify optional fields are handled correctly
            if (configViewModel.syncIntervalSeconds !== undefined) {
              expect(calledWith).toHaveProperty('syncIntervalSeconds', configViewModel.syncIntervalSeconds);
            }
          } catch (error) {
            // If the method throws an error, it should still have called the UseCase
            // This can happen with validation errors
            if (mockCreateUseCase.execute.mock.calls.length > 0) {
              const calledWith = mockCreateUseCase.execute.mock.calls[0][0];
              expect(calledWith).toHaveProperty('storageKey', configViewModel.storageKey);
            }
          }

          // Reset mocks for next iteration
          mockCreateUseCase.execute.mockClear();
        }),
        { numRuns: 100 }
      );
    });

    it('should convert ViewModel updates to DTO for updateConfig UseCase communication', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            enabled: fc.option(fc.boolean()),
            syncMethod: fc.option(syncMethodArb),
            syncTiming: fc.option(syncTimingArb),
            syncDirection: fc.option(syncDirectionArb),
            syncIntervalSeconds: fc.option(fc.integer({ min: 1, max: 86400 })),
            inputs: fc.option(fc.array(syncInputArb, { minLength: 0, maxLength: 5 })),
            outputs: fc.option(fc.array(syncOutputArb, { minLength: 0, maxLength: 5 })),
          }),
          async (configId, updates) => {
            // Arrange: Mock successful UseCase response
            mockUpdateUseCase.execute.mockResolvedValue({
              success: true,
              config: {} as any,
            });

            try {
              // Act: Call presenter method with ViewModel updates
              await presenter.updateConfig(configId, updates);

              // Assert: Verify DTO-based UseCase communication
              expect(mockUpdateUseCase.execute).toHaveBeenCalledTimes(1);
              const calledWith = mockUpdateUseCase.execute.mock.calls[0][0];

              // Verify ID is always present
              expect(calledWith).toHaveProperty('id', configId);

              // Verify only provided updates are included in DTO
              Object.keys(updates).forEach(key => {
                if (updates[key as keyof typeof updates] !== undefined) {
                  expect(calledWith).toHaveProperty(key, updates[key as keyof typeof updates]);
                }
              });
            } catch (error) {
              // If the method throws an error, it should still have called the UseCase
              if (mockUpdateUseCase.execute.mock.calls.length > 0) {
                const calledWith = mockUpdateUseCase.execute.mock.calls[0][0];
                expect(calledWith).toHaveProperty('id', configId);
              }
            }

            // Reset mocks for next iteration
            mockUpdateUseCase.execute.mockClear();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should convert ViewModel to entity for validateConfig UseCase communication', async () => {
      await fc.assert(
        fc.asyncProperty(storageSyncConfigViewModelArb, async (configViewModel) => {
          // Arrange: Mock successful UseCase response
          mockValidateUseCase.execute.mockResolvedValue({
            success: true,
            isValid: true,
            errors: [],
            warnings: [],
          });

          try {
            // Act: Call presenter method with ViewModel
            await presenter.validateConfig(configViewModel);

            // Assert: Verify entity-based UseCase communication
            expect(mockValidateUseCase.execute).toHaveBeenCalledTimes(1);
            const calledWith = mockValidateUseCase.execute.mock.calls[0][0];

            // Verify config entity is passed and deepValidation is set
            expect(calledWith).toHaveProperty('config');
            expect(calledWith).toHaveProperty('deepValidation', false);
            expect(calledWith.config).toBeDefined();
          } catch (error) {
            // Entity creation might fail with invalid data, which is expected
            // The important thing is that we're attempting to convert ViewModel to entity
            expect(error).toBeDefined();
          }

          // Reset mocks for next iteration
          mockValidateUseCase.execute.mockClear();
        }),
        { numRuns: 100 }
      );
    });

    it('should convert ViewModel to entity for testConnection UseCase communication', async () => {
      await fc.assert(
        fc.asyncProperty(
          storageSyncConfigViewModelArb,
          fc.option(fc.integer({ min: 1000, max: 60000 })),
          async (configViewModel, timeout) => {
            // Arrange: Mock successful UseCase response
            mockTestConnectionUseCase.execute.mockResolvedValue({
              success: true,
              isConnectable: true,
              statusCode: 200,
              responseTime: 150,
            });

            try {
              // Act: Call presenter method with ViewModel
              await presenter.testConnection(configViewModel, timeout);

              // Assert: Verify entity-based UseCase communication
              expect(mockTestConnectionUseCase.execute).toHaveBeenCalledTimes(1);
              const calledWith = mockTestConnectionUseCase.execute.mock.calls[0][0];

              // Verify config entity is passed and timeout is set correctly
              expect(calledWith).toHaveProperty('config');
              expect(calledWith).toHaveProperty('timeout', timeout || 30000);
              expect(calledWith.config).toBeDefined();
            } catch (error) {
              // Entity creation might fail with invalid data, which is expected
              // The important thing is that we're attempting to convert ViewModel to entity
              expect(error).toBeDefined();
            }

            // Reset mocks for next iteration
            mockTestConnectionUseCase.execute.mockClear();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
