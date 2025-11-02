/**
 * Domain Entity Test: Sync History
 * Tests for sync execution record entity
 */

import { SyncHistory, SyncHistoryData } from '../SyncHistory';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SyncHistory Entity', () => {
  const validData: SyncHistoryData = {
    id: 'sync-1737011234567-abc123',
    configId: 'config-123',
    storageKey: 'testData',
    syncDirection: 'bidirectional',
    startTime: 1737011234567,
    endTime: 1737011235890,
    status: 'success',
    receiveResult: {
      success: true,
      receivedCount: 10,
    },
    sendResult: {
      success: true,
      sentCount: 5,
    },
    retryCount: 0,
    createdAt: 1737011234567,
  };

  describe('factory method: create', () => {
    beforeEach(() => {
      // Mock Date.now() for consistent ID generation
      jest.spyOn(Date, 'now').mockReturnValue(1737011234567);
      // Mock Math.random() for consistent ID generation
      jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it(
      'should create SyncHistory with valid params',
      () => {
        const history = SyncHistory.create(
          {
            configId: 'config-123',
            storageKey: 'testData',
            syncDirection: 'bidirectional',
            startTime: 1737011234567,
          },
          mockIdGenerator
        );

        expect(history.getId()).toMatch(/^sync-\d+-[a-z0-9]{7}$/);
        expect(history.getConfigId()).toBe('config-123');
        expect(history.getStorageKey()).toBe('testData');
        expect(history.getSyncDirection()).toBe('bidirectional');
        expect(history.getStartTime()).toBe(1737011234567);
        expect(history.getEndTime()).toBe(0);
        expect(history.getStatus()).toBe('success');
        expect(history.getRetryCount()).toBe(0);
        expect(history.getCreatedAt()).toBe(1737011234567);
      },
      mockIdGenerator
    );

    it(
      'should create SyncHistory with custom retryCount',
      () => {
        const history = SyncHistory.create(
          {
            configId: 'config-123',
            storageKey: 'testData',
            syncDirection: 'receive_only',
            startTime: 1737011234567,
            retryCount: 3,
          },
          mockIdGenerator
        );

        expect(history.getRetryCount()).toBe(3);
      },
      mockIdGenerator
    );

    it(
      'should create SyncHistory with receive_only direction',
      () => {
        const history = SyncHistory.create(
          {
            configId: 'config-123',
            storageKey: 'testData',
            syncDirection: 'receive_only',
            startTime: 1737011234567,
          },
          mockIdGenerator
        );

        expect(history.getSyncDirection()).toBe('receive_only');
      },
      mockIdGenerator
    );

    it(
      'should create SyncHistory with send_only direction',
      () => {
        const history = SyncHistory.create(
          {
            configId: 'config-123',
            storageKey: 'testData',
            syncDirection: 'send_only',
            startTime: 1737011234567,
          },
          mockIdGenerator
        );

        expect(history.getSyncDirection()).toBe('send_only');
      },
      mockIdGenerator
    );

    it(
      'should generate unique IDs for different instances',
      () => {
        jest.restoreAllMocks();

        const history1 = SyncHistory.create(
          {
            configId: 'config-123',
            storageKey: 'testData',
            syncDirection: 'bidirectional',
            startTime: Date.now(),
          },
          mockIdGenerator
        );

        const history2 = SyncHistory.create(
          {
            configId: 'config-123',
            storageKey: 'testData',
            syncDirection: 'bidirectional',
            startTime: Date.now(),
          },
          mockIdGenerator
        );

        expect(history1.getId()).not.toBe(history2.getId());
      },
      mockIdGenerator
    );
  });

  describe('factory method: fromData', () => {
    it('should restore SyncHistory from valid data', () => {
      const history = SyncHistory.fromData(validData);

      expect(history.getId()).toBe('sync-1737011234567-abc123');
      expect(history.getConfigId()).toBe('config-123');
      expect(history.getStorageKey()).toBe('testData');
      expect(history.getSyncDirection()).toBe('bidirectional');
      expect(history.getStartTime()).toBe(1737011234567);
      expect(history.getEndTime()).toBe(1737011235890);
      expect(history.getStatus()).toBe('success');
      expect(history.getReceiveResult()).toEqual({
        success: true,
        receivedCount: 10,
      });
      expect(history.getSendResult()).toEqual({
        success: true,
        sentCount: 5,
      });
      expect(history.getRetryCount()).toBe(0);
      expect(history.getCreatedAt()).toBe(1737011234567);
    });

    it('should restore SyncHistory with failed status', () => {
      const failedData: SyncHistoryData = {
        ...validData,
        status: 'failed',
        error: 'Connection timeout',
      };

      const history = SyncHistory.fromData(failedData);

      expect(history.getStatus()).toBe('failed');
      expect(history.getError()).toBe('Connection timeout');
    });

    it('should restore SyncHistory with partial status', () => {
      const partialData: SyncHistoryData = {
        ...validData,
        status: 'partial',
        receiveResult: {
          success: true,
          receivedCount: 10,
        },
        sendResult: {
          success: false,
          error: 'Send failed',
        },
      };

      const history = SyncHistory.fromData(partialData);

      expect(history.getStatus()).toBe('partial');
      expect(history.getSendResult()?.success).toBe(false);
      expect(history.getSendResult()?.error).toBe('Send failed');
    });

    it('should restore SyncHistory without optional fields', () => {
      const minimalData: SyncHistoryData = {
        id: 'sync-123',
        configId: 'config-123',
        storageKey: 'testData',
        syncDirection: 'bidirectional',
        startTime: 1737011234567,
        endTime: 0,
        status: 'success',
        retryCount: 0,
        createdAt: 1737011234567,
      };

      const history = SyncHistory.fromData(minimalData);

      expect(history.getReceiveResult()).toBeUndefined();
      expect(history.getSendResult()).toBeUndefined();
      expect(history.getError()).toBeUndefined();
    });
  });

  describe('method: complete', () => {
    let history: SyncHistory;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1737011235890);
      history = SyncHistory.create(
        {
          configId: 'config-123',
          storageKey: 'testData',
          syncDirection: 'bidirectional',
          startTime: 1737011234567,
        },
        mockIdGenerator
      );
    }, mockIdGenerator);

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should mark sync as completed with success status', () => {
      history.complete({
        status: 'success',
        receiveResult: {
          success: true,
          receivedCount: 10,
        },
        sendResult: {
          success: true,
          sentCount: 5,
        },
      });

      expect(history.getStatus()).toBe('success');
      expect(history.getEndTime()).toBe(1737011235890);
      expect(history.getReceiveResult()).toEqual({
        success: true,
        receivedCount: 10,
      });
      expect(history.getSendResult()).toEqual({
        success: true,
        sentCount: 5,
      });
    });

    it('should mark sync as completed with failed status', () => {
      history.complete({
        status: 'failed',
        error: 'Connection timeout',
      });

      expect(history.getStatus()).toBe('failed');
      expect(history.getEndTime()).toBe(1737011235890);
      expect(history.getError()).toBe('Connection timeout');
    });

    it('should mark sync as completed with partial status', () => {
      history.complete({
        status: 'partial',
        receiveResult: {
          success: true,
          receivedCount: 10,
        },
        sendResult: {
          success: false,
          error: 'Send failed',
        },
      });

      expect(history.getStatus()).toBe('partial');
      expect(history.getReceiveResult()?.success).toBe(true);
      expect(history.getSendResult()?.success).toBe(false);
      expect(history.getSendResult()?.error).toBe('Send failed');
    });

    it('should update endTime when completing', () => {
      const beforeEndTime = history.getEndTime();
      expect(beforeEndTime).toBe(0);

      history.complete({
        status: 'success',
      });

      expect(history.getEndTime()).toBe(1737011235890);
      expect(history.getEndTime()).toBeGreaterThan(history.getStartTime());
    });

    it('should handle completion with only receiveResult', () => {
      history.complete({
        status: 'success',
        receiveResult: {
          success: true,
          receivedCount: 15,
        },
      });

      expect(history.getReceiveResult()).toEqual({
        success: true,
        receivedCount: 15,
      });
      expect(history.getSendResult()).toBeUndefined();
    });

    it('should handle completion with only sendResult', () => {
      history.complete({
        status: 'success',
        sendResult: {
          success: true,
          sentCount: 8,
        },
      });

      expect(history.getSendResult()).toEqual({
        success: true,
        sentCount: 8,
      });
      expect(history.getReceiveResult()).toBeUndefined();
    });

    it('should handle result with error messages', () => {
      history.complete({
        status: 'partial',
        receiveResult: {
          success: false,
          error: 'API rate limit exceeded',
        },
        sendResult: {
          success: true,
          sentCount: 3,
        },
      });

      expect(history.getReceiveResult()?.error).toBe('API rate limit exceeded');
    });
  });

  describe('method: getDuration', () => {
    it('should calculate duration for completed sync', () => {
      const history = SyncHistory.fromData({
        ...validData,
        startTime: 1737011234567,
        endTime: 1737011235890,
      });

      expect(history.getDuration()).toBe(1323);
    });

    it('should calculate duration for ongoing sync', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1737011236000);

      const history = SyncHistory.fromData({
        ...validData,
        startTime: 1737011234567,
        endTime: 0,
      });

      expect(history.getDuration()).toBe(1433);

      jest.restoreAllMocks();
    });

    it('should return 0 duration when startTime equals endTime', () => {
      const history = SyncHistory.fromData({
        ...validData,
        startTime: 1737011234567,
        endTime: 1737011234567,
      });

      expect(history.getDuration()).toBe(0);
    });
  });

  describe('method: isSuccessful', () => {
    it('should return true for success status', () => {
      const history = SyncHistory.fromData({
        ...validData,
        status: 'success',
      });

      expect(history.isSuccessful()).toBe(true);
    });

    it('should return false for failed status', () => {
      const history = SyncHistory.fromData({
        ...validData,
        status: 'failed',
      });

      expect(history.isSuccessful()).toBe(false);
    });

    it('should return false for partial status', () => {
      const history = SyncHistory.fromData({
        ...validData,
        status: 'partial',
      });

      expect(history.isSuccessful()).toBe(false);
    });
  });

  describe('method: getTotalItems', () => {
    it('should sum receivedCount and sentCount', () => {
      const history = SyncHistory.fromData({
        ...validData,
        receiveResult: {
          success: true,
          receivedCount: 10,
        },
        sendResult: {
          success: true,
          sentCount: 5,
        },
      });

      expect(history.getTotalItems()).toBe(15);
    });

    it('should return receivedCount when sendResult is missing', () => {
      const history = SyncHistory.fromData({
        ...validData,
        receiveResult: {
          success: true,
          receivedCount: 10,
        },
        sendResult: undefined,
      });

      expect(history.getTotalItems()).toBe(10);
    });

    it('should return sentCount when receiveResult is missing', () => {
      const history = SyncHistory.fromData({
        ...validData,
        receiveResult: undefined,
        sendResult: {
          success: true,
          sentCount: 5,
        },
      });

      expect(history.getTotalItems()).toBe(5);
    });

    it('should return 0 when both results are missing', () => {
      const history = SyncHistory.fromData({
        ...validData,
        receiveResult: undefined,
        sendResult: undefined,
      });

      expect(history.getTotalItems()).toBe(0);
    });

    it('should return 0 when counts are undefined', () => {
      const history = SyncHistory.fromData({
        ...validData,
        receiveResult: {
          success: true,
        },
        sendResult: {
          success: true,
        },
      });

      expect(history.getTotalItems()).toBe(0);
    });

    it('should handle 0 counts correctly', () => {
      const history = SyncHistory.fromData({
        ...validData,
        receiveResult: {
          success: true,
          receivedCount: 0,
        },
        sendResult: {
          success: true,
          sentCount: 0,
        },
      });

      expect(history.getTotalItems()).toBe(0);
    });
  });

  describe('method: setRetryCount', () => {
    it('should update retry count', () => {
      // Use fresh data copy to avoid mutation affecting other tests
      const history = SyncHistory.fromData({ ...validData, retryCount: 0 });

      expect(history.getRetryCount()).toBe(0);

      history.setRetryCount(3);
      expect(history.getRetryCount()).toBe(3);
    });

    it('should allow setting retry count to 0', () => {
      const history = SyncHistory.fromData({
        ...validData,
        retryCount: 5,
      });

      expect(history.getRetryCount()).toBe(5);

      history.setRetryCount(0);
      expect(history.getRetryCount()).toBe(0);
    });

    it('should allow incrementing retry count', () => {
      // Use fresh data copy to avoid mutation affecting other tests
      const history = SyncHistory.fromData({ ...validData, retryCount: 0 });

      history.setRetryCount(history.getRetryCount() + 1);
      expect(history.getRetryCount()).toBe(1);

      history.setRetryCount(history.getRetryCount() + 1);
      expect(history.getRetryCount()).toBe(2);
    });
  });

  describe('getters', () => {
    let history: SyncHistory;

    beforeEach(() => {
      // Use fresh data copy to avoid mutation from other tests
      history = SyncHistory.fromData({ ...validData });
    });

    it('should get id', () => {
      expect(history.getId()).toBe('sync-1737011234567-abc123');
    });

    it('should get configId', () => {
      expect(history.getConfigId()).toBe('config-123');
    });

    it('should get storageKey', () => {
      expect(history.getStorageKey()).toBe('testData');
    });

    it('should get syncDirection', () => {
      expect(history.getSyncDirection()).toBe('bidirectional');
    });

    it('should get startTime', () => {
      expect(history.getStartTime()).toBe(1737011234567);
    });

    it('should get endTime', () => {
      expect(history.getEndTime()).toBe(1737011235890);
    });

    it('should get status', () => {
      expect(history.getStatus()).toBe('success');
    });

    it('should get receiveResult', () => {
      expect(history.getReceiveResult()).toEqual({
        success: true,
        receivedCount: 10,
      });
    });

    it('should get sendResult', () => {
      expect(history.getSendResult()).toEqual({
        success: true,
        sentCount: 5,
      });
    });

    it('should get error when present', () => {
      const failedHistory = SyncHistory.fromData({
        ...validData,
        error: 'Connection timeout',
      });

      expect(failedHistory.getError()).toBe('Connection timeout');
    });

    it('should get undefined error when not present', () => {
      expect(history.getError()).toBeUndefined();
    });

    it('should get retryCount', () => {
      expect(history.getRetryCount()).toBe(0);
    });

    it('should get createdAt', () => {
      expect(history.getCreatedAt()).toBe(1737011234567);
    });
  });

  describe('method: toData', () => {
    it('should convert to plain data object', () => {
      const history = SyncHistory.fromData(validData);
      const data = history.toData();

      expect(data).toEqual(validData);
    });

    it('should return a copy (immutability)', () => {
      const history = SyncHistory.fromData(validData);
      const data1 = history.toData();
      const data2 = history.toData();

      expect(data1).toEqual(data2);
      expect(data1).not.toBe(data2);

      // Mutating returned data should not affect entity
      data1.status = 'failed';
      expect(history.getStatus()).toBe('success');
    });

    it('should include all fields', () => {
      const history = SyncHistory.fromData(validData);
      const data = history.toData();

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('configId');
      expect(data).toHaveProperty('storageKey');
      expect(data).toHaveProperty('syncDirection');
      expect(data).toHaveProperty('startTime');
      expect(data).toHaveProperty('endTime');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('receiveResult');
      expect(data).toHaveProperty('sendResult');
      expect(data).toHaveProperty('retryCount');
      expect(data).toHaveProperty('createdAt');
    });
  });

  describe('edge cases', () => {
    it('should handle very long sync duration', () => {
      const history = SyncHistory.fromData({
        ...validData,
        startTime: 1737011234567,
        endTime: 1737011234567 + 86400000, // 24 hours later
      });

      expect(history.getDuration()).toBe(86400000);
    });

    it('should handle large item counts', () => {
      const history = SyncHistory.fromData({
        ...validData,
        receiveResult: {
          success: true,
          receivedCount: 999999,
        },
        sendResult: {
          success: true,
          sentCount: 888888,
        },
      });

      expect(history.getTotalItems()).toBe(1888887);
    });

    it('should handle all sync directions', () => {
      const directions: Array<'bidirectional' | 'receive_only' | 'send_only'> = [
        'bidirectional',
        'receive_only',
        'send_only',
      ];

      directions.forEach((direction) => {
        const history = SyncHistory.create(
          {
            configId: 'config-123',
            storageKey: 'testData',
            syncDirection: direction,
            startTime: Date.now(),
          },
          mockIdGenerator
        );

        expect(history.getSyncDirection()).toBe(direction);
      }, mockIdGenerator);
    });

    it('should handle all status types', () => {
      const statuses: Array<'success' | 'failed' | 'partial'> = ['success', 'failed', 'partial'];

      statuses.forEach((status) => {
        const history = SyncHistory.fromData({
          ...validData,
          status,
        });

        expect(history.getStatus()).toBe(status);
      });
    });
  });

  describe('validation', () => {
    describe(
      'create() validation',
      () => {
        it(
          'should throw error for empty configId',
          () => {
            expect(() =>
              SyncHistory.create({
                configId: '',
                storageKey: 'testData',
                syncDirection: 'bidirectional',
                startTime: Date.now(),
              })
            ).toThrow('Config ID must not be empty');
          },
          mockIdGenerator
        );

        it(
          'should throw error for whitespace-only configId',
          () => {
            expect(() =>
              SyncHistory.create({
                configId: '   ',
                storageKey: 'testData',
                syncDirection: 'bidirectional',
                startTime: Date.now(),
              })
            ).toThrow('Config ID must not be empty');
          },
          mockIdGenerator
        );

        it(
          'should throw error for empty storageKey',
          () => {
            expect(() =>
              SyncHistory.create({
                configId: 'config-123',
                storageKey: '',
                syncDirection: 'bidirectional',
                startTime: Date.now(),
              })
            ).toThrow('Storage key must not be empty');
          },
          mockIdGenerator
        );

        it(
          'should throw error for whitespace-only storageKey',
          () => {
            expect(() =>
              SyncHistory.create({
                configId: 'config-123',
                storageKey: '   ',
                syncDirection: 'bidirectional',
                startTime: Date.now(),
              })
            ).toThrow('Storage key must not be empty');
          },
          mockIdGenerator
        );

        it(
          'should throw error for zero startTime',
          () => {
            expect(() =>
              SyncHistory.create({
                configId: 'config-123',
                storageKey: 'testData',
                syncDirection: 'bidirectional',
                startTime: 0,
              })
            ).toThrow('Start time must be positive');
          },
          mockIdGenerator
        );

        it(
          'should throw error for negative startTime',
          () => {
            expect(() =>
              SyncHistory.create({
                configId: 'config-123',
                storageKey: 'testData',
                syncDirection: 'bidirectional',
                startTime: -1,
              })
            ).toThrow('Start time must be positive');
          },
          mockIdGenerator
        );

        it(
          'should throw error for negative retryCount',
          () => {
            expect(() =>
              SyncHistory.create({
                configId: 'config-123',
                storageKey: 'testData',
                syncDirection: 'bidirectional',
                startTime: Date.now(),
                retryCount: -1,
              })
            ).toThrow('Retry count must be non-negative');
          },
          mockIdGenerator
        );
      },
      mockIdGenerator
    );

    describe('fromData() validation', () => {
      it('should throw error for empty configId', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            configId: '',
          })
        ).toThrow('Config ID must not be empty');
      });

      it('should throw error for empty storageKey', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            storageKey: '',
          })
        ).toThrow('Storage key must not be empty');
      });

      it('should throw error for zero startTime', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            startTime: 0,
          })
        ).toThrow('Start time must be positive');
      });

      it('should throw error for negative startTime', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            startTime: -100,
          })
        ).toThrow('Start time must be positive');
      });

      it('should throw error for negative endTime', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            endTime: -1,
          })
        ).toThrow('End time must be non-negative');
      });

      it('should throw error when endTime is less than startTime', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            startTime: 1737011235890,
            endTime: 1737011234567,
          })
        ).toThrow('End time must be greater than or equal to start time');
      });

      it('should throw error for negative retryCount', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            retryCount: -1,
          })
        ).toThrow('Retry count must be non-negative');
      });

      it('should throw error for negative receivedCount', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            receiveResult: {
              success: true,
              receivedCount: -1,
            },
          })
        ).toThrow('Received count must be non-negative');
      });

      it('should throw error for negative sentCount', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            sendResult: {
              success: true,
              sentCount: -1,
            },
          })
        ).toThrow('Sent count must be non-negative');
      });

      it('should accept endTime equal to startTime', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            startTime: 1737011234567,
            endTime: 1737011234567,
          })
        ).not.toThrow();
      });

      it('should accept zero retryCount', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            retryCount: 0,
          })
        ).not.toThrow();
      });

      it('should accept zero receivedCount', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            receiveResult: {
              success: true,
              receivedCount: 0,
            },
          })
        ).not.toThrow();
      });

      it('should accept zero sentCount', () => {
        expect(() =>
          SyncHistory.fromData({
            ...validData,
            sendResult: {
              success: true,
              sentCount: 0,
            },
          })
        ).not.toThrow();
      });
    });

    describe('setRetryCount() validation', () => {
      it('should throw error for negative retryCount', () => {
        const history = SyncHistory.fromData(validData);
        expect(() => history.setRetryCount(-1)).toThrow('Retry count must be non-negative');
      });

      it('should accept zero retryCount', () => {
        const history = SyncHistory.fromData(validData);
        expect(() => history.setRetryCount(0)).not.toThrow();
      });

      it('should accept positive retryCount', () => {
        const history = SyncHistory.fromData(validData);
        expect(() => history.setRetryCount(5)).not.toThrow();
        expect(history.getRetryCount()).toBe(5);
      });
    });
  });
});
