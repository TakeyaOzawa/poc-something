/**
 * Unit Tests: SyncResult Entity
 */

import { SyncResult, SyncResultData } from '../SyncResult';
import { IdGenerator } from '@domain/types/id-generator.types';
// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-sync-result-id'),
};

describe(
  'SyncResult Entity',
  () => {
    const validReceiveSuccessData: SyncResultData = {
      id: 'result-123',
      syncConfigId: 'config-456',
      storageKey: 'automationVariables',
      direction: 'receive',
      status: 'success',
      itemsReceived: 10,
      itemsUpdated: 5,
      syncedAt: '2025-10-16T12:00:00.000Z',
    };

    const validSendSuccessData: SyncResultData = {
      id: 'result-789',
      syncConfigId: 'config-456',
      storageKey: 'automationVariables',
      direction: 'send',
      status: 'success',
      itemsSent: 8,
      syncedAt: '2025-10-16T12:05:00.000Z',
    };

    const validFailedData: SyncResultData = {
      id: 'result-000',
      syncConfigId: 'config-456',
      storageKey: 'websiteConfigs',
      direction: 'receive',
      status: 'failed',
      errorMessage: 'Connection timeout',
      syncedAt: '2025-10-16T12:10:00.000Z',
    };

    describe('constructor', () => {
      it('should create SyncResult with valid receive success data', () => {
        const result = new SyncResult(validReceiveSuccessData);

        expect(result.getId()).toBe('result-123');
        expect(result.getSyncConfigId()).toBe('config-456');
        expect(result.getStorageKey()).toBe('automationVariables');
        expect(result.getDirection()).toBe('receive');
        expect(result.getStatus()).toBe('success');
        expect(result.getItemsReceived()).toBe(10);
        expect(result.getItemsUpdated()).toBe(5);
        expect(result.getSyncedAt()).toBe('2025-10-16T12:00:00.000Z');
      });

      it('should create SyncResult with valid send success data', () => {
        const result = new SyncResult(validSendSuccessData);

        expect(result.getId()).toBe('result-789');
        expect(result.getSyncConfigId()).toBe('config-456');
        expect(result.getDirection()).toBe('send');
        expect(result.getStatus()).toBe('success');
        expect(result.getItemsSent()).toBe(8);
      });

      it('should create SyncResult with valid failed data', () => {
        const result = new SyncResult(validFailedData);

        expect(result.getId()).toBe('result-000');
        expect(result.getStatus()).toBe('failed');
        expect(result.getErrorMessage()).toBe('Connection timeout');
      });

      it('should throw error if id is missing', () => {
        const invalidData = { ...validReceiveSuccessData, id: '' };
        expect(() => new SyncResult(invalidData)).toThrow('ID is required');
      });

      it('should throw error if syncConfigId is missing', () => {
        const invalidData = { ...validReceiveSuccessData, syncConfigId: '' };
        expect(() => new SyncResult(invalidData)).toThrow('Sync config ID is required');
      });

      it('should throw error if storageKey is missing', () => {
        const invalidData = { ...validReceiveSuccessData, storageKey: '' };
        expect(() => new SyncResult(invalidData)).toThrow('Storage key is required');
      });

      it('should throw error if direction is missing', () => {
        const invalidData = { ...validReceiveSuccessData, direction: '' as any };
        expect(() => new SyncResult(invalidData)).toThrow('Direction is required');
      });

      it('should throw error if status is missing', () => {
        const invalidData = { ...validReceiveSuccessData, status: '' as any };
        expect(() => new SyncResult(invalidData)).toThrow('Status is required');
      });

      it('should throw error if syncedAt is missing', () => {
        const invalidData = { ...validReceiveSuccessData, syncedAt: '' };
        expect(() => new SyncResult(invalidData)).toThrow('Synced date is required');
      });

      it('should allow optional fields to be undefined', () => {
        const minimalData: SyncResultData = {
          id: 'result-minimal',
          syncConfigId: 'config-minimal',
          storageKey: 'xpathCollectionCSV',
          direction: 'receive',
          status: 'success',
          syncedAt: '2025-10-16T12:15:00.000Z',
        };
        const result = new SyncResult(minimalData);

        expect(result.getItemsReceived()).toBeUndefined();
        expect(result.getItemsSent()).toBeUndefined();
        expect(result.getItemsUpdated()).toBeUndefined();
        expect(result.getItemsDeleted()).toBeUndefined();
        expect(result.getErrorMessage()).toBeUndefined();
      });
    });

    describe('getters', () => {
      it('should return all properties for receive success result', () => {
        const result = new SyncResult(validReceiveSuccessData);

        expect(result.getId()).toBe('result-123');
        expect(result.getSyncConfigId()).toBe('config-456');
        expect(result.getStorageKey()).toBe('automationVariables');
        expect(result.getDirection()).toBe('receive');
        expect(result.getStatus()).toBe('success');
        expect(result.getItemsReceived()).toBe(10);
        expect(result.getItemsUpdated()).toBe(5);
        expect(result.getItemsSent()).toBeUndefined();
        expect(result.getItemsDeleted()).toBeUndefined();
        expect(result.getErrorMessage()).toBeUndefined();
        expect(result.getSyncedAt()).toBe('2025-10-16T12:00:00.000Z');
      });

      it('should return all properties for send success result', () => {
        const result = new SyncResult(validSendSuccessData);

        expect(result.getId()).toBe('result-789');
        expect(result.getSyncConfigId()).toBe('config-456');
        expect(result.getStorageKey()).toBe('automationVariables');
        expect(result.getDirection()).toBe('send');
        expect(result.getStatus()).toBe('success');
        expect(result.getItemsSent()).toBe(8);
        expect(result.getItemsReceived()).toBeUndefined();
        expect(result.getErrorMessage()).toBeUndefined();
      });

      it('should return all properties for failed result', () => {
        const result = new SyncResult(validFailedData);

        expect(result.getId()).toBe('result-000');
        expect(result.getSyncConfigId()).toBe('config-456');
        expect(result.getStorageKey()).toBe('websiteConfigs');
        expect(result.getDirection()).toBe('receive');
        expect(result.getStatus()).toBe('failed');
        expect(result.getErrorMessage()).toBe('Connection timeout');
        expect(result.getSyncedAt()).toBe('2025-10-16T12:10:00.000Z');
      });

      it('should return undefined for optional fields when not set', () => {
        const minimalData: SyncResultData = {
          id: 'result-minimal',
          syncConfigId: 'config-minimal',
          storageKey: 'systemSettings',
          direction: 'send',
          status: 'success',
          syncedAt: '2025-10-16T12:20:00.000Z',
        };
        const result = new SyncResult(minimalData);

        expect(result.getItemsReceived()).toBeUndefined();
        expect(result.getItemsSent()).toBeUndefined();
        expect(result.getItemsUpdated()).toBeUndefined();
        expect(result.getItemsDeleted()).toBeUndefined();
        expect(result.getErrorMessage()).toBeUndefined();
      });
    });

    describe('toData', () => {
      it('should return a copy of data', () => {
        const result = new SyncResult(validReceiveSuccessData);
        const data = result.toData();

        expect(data).toEqual(validReceiveSuccessData);
        expect(data).not.toBe(validReceiveSuccessData); // different reference
      });

      it('should include all fields in returned data', () => {
        const result = new SyncResult(validFailedData);
        const data = result.toData();

        expect(data.id).toBe('result-000');
        expect(data.syncConfigId).toBe('config-456');
        expect(data.storageKey).toBe('websiteConfigs');
        expect(data.direction).toBe('receive');
        expect(data.status).toBe('failed');
        expect(data.errorMessage).toBe('Connection timeout');
        expect(data.syncedAt).toBe('2025-10-16T12:10:00.000Z');
      });
    });

    describe(
      'create static factory',
      () => {
        it(
          'should create receive success result with minimal params',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-789',
                storageKey: 'automationVariables',
                direction: 'receive',
                status: 'success',
                itemsReceived: 15,
              },
              mockIdGenerator
            );

            expect(result.getId()).toBe('mock-sync-result-id');
            expect(result.getSyncConfigId()).toBe('config-789');
            expect(result.getStorageKey()).toBe('automationVariables');
            expect(result.getDirection()).toBe('receive');
            expect(result.getStatus()).toBe('success');
            expect(result.getItemsReceived()).toBe(15);
            expect(result.getSyncedAt()).toBeTruthy();
          },
          mockIdGenerator
        );

        it(
          'should create send success result',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-abc',
                storageKey: 'websiteConfigs',
                direction: 'send',
                status: 'success',
                itemsSent: 20,
              },
              mockIdGenerator
            );

            expect(result.getDirection()).toBe('send');
            expect(result.getStatus()).toBe('success');
            expect(result.getItemsSent()).toBe(20);
          },
          mockIdGenerator
        );

        it(
          'should create failed result with error message',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-def',
                storageKey: 'xpathCollectionCSV',
                direction: 'receive',
                status: 'failed',
                errorMessage: 'Network error',
              },
              mockIdGenerator
            );

            expect(result.getStatus()).toBe('failed');
            expect(result.getErrorMessage()).toBe('Network error');
          },
          mockIdGenerator
        );

        it(
          'should auto-generate UUID for id',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-ghi',
                storageKey: 'systemSettings',
                direction: 'send',
                status: 'success',
              },
              mockIdGenerator
            );

            expect(result.getId()).toBeTruthy();
            expect(result.getId()).toBe('mock-sync-result-id');
          },
          mockIdGenerator
        );

        it(
          'should generate current timestamp for syncedAt',
          () => {
            const before = new Date().toISOString();
            const result = SyncResult.create(
              {
                syncConfigId: 'config-jkl',
                storageKey: 'automationResults',
                direction: 'receive',
                status: 'success',
              },
              mockIdGenerator
            );
            const after = new Date().toISOString();

            const syncedAt = result.getSyncedAt();
            expect(syncedAt >= before && syncedAt <= after).toBe(true);
          },
          mockIdGenerator
        );

        it(
          'should include all optional count fields',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-mno',
                storageKey: 'automationVariables',
                direction: 'receive',
                status: 'success',
                itemsReceived: 10,
                itemsUpdated: 5,
                itemsDeleted: 2,
              },
              mockIdGenerator
            );

            expect(result.getItemsReceived()).toBe(10);
            expect(result.getItemsUpdated()).toBe(5);
            expect(result.getItemsDeleted()).toBe(2);
          },
          mockIdGenerator
        );

        it(
          'should handle itemsSent for send operations',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-pqr',
                storageKey: 'websiteConfigs',
                direction: 'send',
                status: 'success',
                itemsSent: 25,
              },
              mockIdGenerator
            );

            expect(result.getItemsSent()).toBe(25);
            expect(result.getItemsReceived()).toBeUndefined();
          },
          mockIdGenerator
        );

        it(
          'should allow undefined optional fields',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-stu',
                storageKey: 'xpathCollectionCSV',
                direction: 'receive',
                status: 'success',
              },
              mockIdGenerator
            );

            expect(result.getItemsReceived()).toBeUndefined();
            expect(result.getItemsSent()).toBeUndefined();
            expect(result.getItemsUpdated()).toBeUndefined();
            expect(result.getItemsDeleted()).toBeUndefined();
            expect(result.getErrorMessage()).toBeUndefined();
          },
          mockIdGenerator
        );
      },
      mockIdGenerator
    );

    describe('immutability', () => {
      it(
        'should create independent instances',
        () => {
          const result1 = new SyncResult(validReceiveSuccessData);
          const result2 = new SyncResult(validSendSuccessData);

          expect(result1.getId()).toBe('result-123');
          expect(result2.getId()).toBe('result-789');
          expect(result1.getDirection()).toBe('receive');
          expect(result2.getDirection()).toBe('send');
        },
        mockIdGenerator
      );

      it('should not share data between instances', () => {
        const data1 = { ...validReceiveSuccessData };
        const result1 = new SyncResult(data1);

        // Modify original data
        data1.id = 'modified-id';
        data1.status = 'failed';

        // Result should be unchanged
        expect(result1.getId()).toBe('result-123');
        expect(result1.getStatus()).toBe('success');
      });

      it('should return independent data copies via toData', () => {
        const result = new SyncResult(validReceiveSuccessData);
        const data1 = result.toData();
        const data2 = result.toData();

        expect(data1).toEqual(data2);
        expect(data1).not.toBe(data2); // different references
      });
    });

    describe(
      'edge cases',
      () => {
        it(
          'should handle zero counts',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-edge',
                storageKey: 'automationVariables',
                direction: 'receive',
                status: 'success',
                itemsReceived: 0,
                itemsUpdated: 0,
              },
              mockIdGenerator
            );

            expect(result.getItemsReceived()).toBe(0);
            expect(result.getItemsUpdated()).toBe(0);
          },
          mockIdGenerator
        );

        it(
          'should handle empty error message',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-edge',
                storageKey: 'websiteConfigs',
                direction: 'send',
                status: 'failed',
                errorMessage: '',
              },
              mockIdGenerator
            );

            expect(result.getErrorMessage()).toBe('');
          },
          mockIdGenerator
        );

        it(
          'should handle long error messages',
          () => {
            const longError = 'A'.repeat(1000);
            const result = SyncResult.create(
              {
                syncConfigId: 'config-edge',
                storageKey: 'systemSettings',
                direction: 'receive',
                status: 'failed',
                errorMessage: longError,
              },
              mockIdGenerator
            );

            expect(result.getErrorMessage()).toBe(longError);
            expect(result.getErrorMessage()?.length).toBe(1000);
          },
          mockIdGenerator
        );

        it(
          'should handle all count fields set to maximum values',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-max',
                storageKey: 'automationVariables',
                direction: 'receive',
                status: 'success',
                itemsReceived: Number.MAX_SAFE_INTEGER,
                itemsUpdated: Number.MAX_SAFE_INTEGER,
                itemsDeleted: Number.MAX_SAFE_INTEGER,
              },
              mockIdGenerator
            );

            expect(result.getItemsReceived()).toBe(Number.MAX_SAFE_INTEGER);
            expect(result.getItemsUpdated()).toBe(Number.MAX_SAFE_INTEGER);
            expect(result.getItemsDeleted()).toBe(Number.MAX_SAFE_INTEGER);
          },
          mockIdGenerator
        );
      },
      mockIdGenerator
    );

    describe(
      'real-world scenarios',
      () => {
        it(
          'should represent successful bidirectional sync - receive phase',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-bidirectional',
                storageKey: 'automationVariables',
                direction: 'receive',
                status: 'success',
                itemsReceived: 50,
                itemsUpdated: 20,
                itemsDeleted: 5,
              },
              mockIdGenerator
            );

            expect(result.getDirection()).toBe('receive');
            expect(result.getStatus()).toBe('success');
            expect(result.getItemsReceived()).toBe(50);
            expect(result.getItemsUpdated()).toBe(20);
            expect(result.getItemsDeleted()).toBe(5);
          },
          mockIdGenerator
        );

        it(
          'should represent successful bidirectional sync - send phase',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-bidirectional',
                storageKey: 'automationVariables',
                direction: 'send',
                status: 'success',
                itemsSent: 30,
              },
              mockIdGenerator
            );

            expect(result.getDirection()).toBe('send');
            expect(result.getStatus()).toBe('success');
            expect(result.getItemsSent()).toBe(30);
          },
          mockIdGenerator
        );

        it(
          'should represent failed sync with detailed error',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-fail',
                storageKey: 'websiteConfigs',
                direction: 'receive',
                status: 'failed',
                errorMessage: 'HTTP 401: Authentication token expired',
              },
              mockIdGenerator
            );

            expect(result.getStatus()).toBe('failed');
            expect(result.getErrorMessage()).toBe('HTTP 401: Authentication token expired');
          },
          mockIdGenerator
        );

        it(
          'should represent CSV import result',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-csv',
                storageKey: 'xpathCollectionCSV',
                direction: 'receive',
                status: 'success',
                itemsReceived: 100,
              },
              mockIdGenerator
            );

            expect(result.getStorageKey()).toBe('xpathCollectionCSV');
            expect(result.getDirection()).toBe('receive');
            expect(result.getItemsReceived()).toBe(100);
          },
          mockIdGenerator
        );

        it(
          'should represent CSV export result',
          () => {
            const result = SyncResult.create(
              {
                syncConfigId: 'config-csv',
                storageKey: 'automationResults',
                direction: 'send',
                status: 'success',
                itemsSent: 75,
              },
              mockIdGenerator
            );

            expect(result.getStorageKey()).toBe('automationResults');
            expect(result.getDirection()).toBe('send');
            expect(result.getItemsSent()).toBe(75);
          },
          mockIdGenerator
        );
      },
      mockIdGenerator
    );
  },
  mockIdGenerator
);
