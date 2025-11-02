/**
 * Domain Entity Test: Sync State
 * Tests for sync operation state tracking entity
 */

import { SyncState, SyncStateData, SyncStatus } from '../SyncState';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SyncState Entity', () => {
  const validData: SyncStateData = {
    configId: 'config-123',
    storageKey: 'testData',
    status: 'starting',
    progress: 0,
    currentStep: 'Initializing',
    totalSteps: 4,
    completedSteps: 0,
    startTime: 1737011234567,
  };

  describe('factory method: create', () => {
    beforeEach(() => {
      // Mock Date.now() for consistent timestamps
      jest.spyOn(Date, 'now').mockReturnValue(1737011234567);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create SyncState with valid params', () => {
      const syncState = SyncState.create({
        configId: 'config-123',
        storageKey: 'testData',
        totalSteps: 4,
      });

      expect(syncState.getConfigId()).toBe('config-123');
      expect(syncState.getStorageKey()).toBe('testData');
      expect(syncState.getStatus()).toBe('starting');
      expect(syncState.getProgress()).toBe(0);
      expect(syncState.getCurrentStep()).toBe('Initializing');
      expect(syncState.getTotalSteps()).toBe(4);
      expect(syncState.getCompletedSteps()).toBe(0);
      expect(syncState.getStartTime()).toBe(1737011234567);
      expect(syncState.getEndTime()).toBeUndefined();
      expect(syncState.getError()).toBeUndefined();
    });

    it('should create SyncState with different totalSteps', () => {
      const syncState = SyncState.create({
        configId: 'config-456',
        storageKey: 'otherData',
        totalSteps: 10,
      });

      expect(syncState.getTotalSteps()).toBe(10);
    });

    it('should create SyncState with zero totalSteps', () => {
      const syncState = SyncState.create({
        configId: 'config-789',
        storageKey: 'zeroData',
        totalSteps: 0,
      });

      expect(syncState.getTotalSteps()).toBe(0);
    });
  });

  describe('factory method: fromData', () => {
    it('should restore SyncState from valid data', () => {
      const syncState = SyncState.fromData(validData);

      expect(syncState.getConfigId()).toBe('config-123');
      expect(syncState.getStorageKey()).toBe('testData');
      expect(syncState.getStatus()).toBe('starting');
      expect(syncState.getProgress()).toBe(0);
      expect(syncState.getCurrentStep()).toBe('Initializing');
      expect(syncState.getTotalSteps()).toBe(4);
      expect(syncState.getCompletedSteps()).toBe(0);
      expect(syncState.getStartTime()).toBe(1737011234567);
    });

    it('should restore SyncState with completed status', () => {
      const completedData: SyncStateData = {
        ...validData,
        status: 'completed',
        progress: 100,
        completedSteps: 4,
        endTime: 1737011235890,
      };

      const syncState = SyncState.fromData(completedData);

      expect(syncState.getStatus()).toBe('completed');
      expect(syncState.getProgress()).toBe(100);
      expect(syncState.getEndTime()).toBe(1737011235890);
    });

    it('should restore SyncState with failed status', () => {
      const failedData: SyncStateData = {
        ...validData,
        status: 'failed',
        error: 'Connection timeout',
        endTime: 1737011235890,
      };

      const syncState = SyncState.fromData(failedData);

      expect(syncState.getStatus()).toBe('failed');
      expect(syncState.getError()).toBe('Connection timeout');
      expect(syncState.getEndTime()).toBe(1737011235890);
    });

    it('should restore SyncState with receive progress', () => {
      const dataWithProgress: SyncStateData = {
        ...validData,
        receiveProgress: {
          status: 'in_progress',
          currentStep: 1,
          totalSteps: 3,
        },
      };

      const syncState = SyncState.fromData(dataWithProgress);

      expect(syncState.getReceiveProgress()).toEqual({
        status: 'in_progress',
        currentStep: 1,
        totalSteps: 3,
      });
    });

    it('should restore SyncState with send progress', () => {
      const dataWithProgress: SyncStateData = {
        ...validData,
        sendProgress: {
          status: 'completed',
          currentStep: 2,
          totalSteps: 2,
        },
      };

      const syncState = SyncState.fromData(dataWithProgress);

      expect(syncState.getSendProgress()).toEqual({
        status: 'completed',
        currentStep: 2,
        totalSteps: 2,
      });
    });
  });

  describe('method: setStatus', () => {
    let syncState: SyncState;

    beforeEach(() => {
      syncState = SyncState.fromData({ ...validData });
    });

    it('should update status', () => {
      syncState.setStatus('receiving');

      expect(syncState.getStatus()).toBe('receiving');
    });

    it('should update progress when status changes', () => {
      syncState.setStatus('idle');
      expect(syncState.getProgress()).toBe(0);

      syncState.setStatus('starting');
      expect(syncState.getProgress()).toBe(0);

      syncState.setStatus('completed');
      expect(syncState.getProgress()).toBe(100);
    });

    it('should transition through all statuses', () => {
      const statuses: SyncStatus[] = [
        'idle',
        'starting',
        'receiving',
        'sending',
        'completed',
        'failed',
      ];

      statuses.forEach((status) => {
        syncState.setStatus(status);
        expect(syncState.getStatus()).toBe(status);
      });
    });

    it('should recalculate progress based on completed steps', () => {
      const state = SyncState.create({
        configId: 'config-123',
        storageKey: 'testData',
        totalSteps: 4,
      });

      // Manually set completedSteps for testing
      const data = state.toData();
      data.completedSteps = 2;
      const stateWithSteps = SyncState.fromData(data);

      stateWithSteps.setStatus('receiving');
      expect(stateWithSteps.getProgress()).toBe(50); // 2/4 = 50%
    });
  });

  describe('method: setCurrentStep', () => {
    let syncState: SyncState;

    beforeEach(() => {
      syncState = SyncState.fromData({ ...validData });
    });

    it('should update current step', () => {
      syncState.setCurrentStep('Validating configuration');

      expect(syncState.getCurrentStep()).toBe('Validating configuration');
    });

    it('should allow updating to empty string', () => {
      syncState.setCurrentStep('');

      expect(syncState.getCurrentStep()).toBe('');
    });

    it('should allow multiple step updates', () => {
      syncState.setCurrentStep('Step 1');
      expect(syncState.getCurrentStep()).toBe('Step 1');

      syncState.setCurrentStep('Step 2');
      expect(syncState.getCurrentStep()).toBe('Step 2');

      syncState.setCurrentStep('Step 3');
      expect(syncState.getCurrentStep()).toBe('Step 3');
    });
  });

  describe('method: incrementCompletedSteps', () => {
    let syncState: SyncState;

    beforeEach(() => {
      syncState = SyncState.fromData({ ...validData });
    });

    it('should increment completed steps', () => {
      expect(syncState.getCompletedSteps()).toBe(0);

      syncState.incrementCompletedSteps();
      expect(syncState.getCompletedSteps()).toBe(1);

      syncState.incrementCompletedSteps();
      expect(syncState.getCompletedSteps()).toBe(2);
    });

    it('should update progress when incrementing', () => {
      expect(syncState.getProgress()).toBe(0);

      syncState.incrementCompletedSteps(); // 1/4 = 25%
      expect(syncState.getProgress()).toBe(25);

      syncState.incrementCompletedSteps(); // 2/4 = 50%
      expect(syncState.getProgress()).toBe(50);

      syncState.incrementCompletedSteps(); // 3/4 = 75%
      expect(syncState.getProgress()).toBe(75);
    });

    it('should cap progress at 99% until completed', () => {
      syncState.incrementCompletedSteps(); // 1/4
      syncState.incrementCompletedSteps(); // 2/4
      syncState.incrementCompletedSteps(); // 3/4
      syncState.incrementCompletedSteps(); // 4/4 = 100%

      // Should be capped at 99% because status is not 'completed'
      expect(syncState.getProgress()).toBe(99);
      expect(syncState.getCompletedSteps()).toBe(4);
    });

    it('should allow incrementing beyond total steps', () => {
      syncState.incrementCompletedSteps(); // 1
      syncState.incrementCompletedSteps(); // 2
      syncState.incrementCompletedSteps(); // 3
      syncState.incrementCompletedSteps(); // 4
      syncState.incrementCompletedSteps(); // 5 (exceeds totalSteps of 4)

      expect(syncState.getCompletedSteps()).toBe(5);
      expect(syncState.getProgress()).toBe(99); // Capped at 99%
    });
  });

  describe('method: setReceiveProgress', () => {
    let syncState: SyncState;

    beforeEach(() => {
      syncState = SyncState.fromData({ ...validData });
    });

    it('should set receive progress', () => {
      syncState.setReceiveProgress({
        status: 'in_progress',
        currentStep: 1,
        totalSteps: 3,
      });

      expect(syncState.getReceiveProgress()).toEqual({
        status: 'in_progress',
        currentStep: 1,
        totalSteps: 3,
      });
    });

    it('should set receive progress with error', () => {
      syncState.setReceiveProgress({
        status: 'failed',
        currentStep: 1,
        totalSteps: 3,
        error: 'API connection failed',
      });

      expect(syncState.getReceiveProgress()).toEqual({
        status: 'failed',
        currentStep: 1,
        totalSteps: 3,
        error: 'API connection failed',
      });
    });

    it('should update receive progress multiple times', () => {
      syncState.setReceiveProgress({
        status: 'pending',
        currentStep: 0,
        totalSteps: 3,
      });

      expect(syncState.getReceiveProgress()?.status).toBe('pending');

      syncState.setReceiveProgress({
        status: 'in_progress',
        currentStep: 1,
        totalSteps: 3,
      });

      expect(syncState.getReceiveProgress()?.status).toBe('in_progress');
      expect(syncState.getReceiveProgress()?.currentStep).toBe(1);

      syncState.setReceiveProgress({
        status: 'completed',
        currentStep: 3,
        totalSteps: 3,
      });

      expect(syncState.getReceiveProgress()?.status).toBe('completed');
      expect(syncState.getReceiveProgress()?.currentStep).toBe(3);
    });

    it('should allow clearing receive progress with undefined', () => {
      syncState.setReceiveProgress({
        status: 'completed',
        currentStep: 3,
        totalSteps: 3,
      });

      syncState.setReceiveProgress(undefined);

      expect(syncState.getReceiveProgress()).toBeUndefined();
    });
  });

  describe('method: setSendProgress', () => {
    let syncState: SyncState;

    beforeEach(() => {
      syncState = SyncState.fromData({ ...validData });
    });

    it('should set send progress', () => {
      syncState.setSendProgress({
        status: 'in_progress',
        currentStep: 2,
        totalSteps: 5,
      });

      expect(syncState.getSendProgress()).toEqual({
        status: 'in_progress',
        currentStep: 2,
        totalSteps: 5,
      });
    });

    it('should set send progress with error', () => {
      syncState.setSendProgress({
        status: 'failed',
        currentStep: 1,
        totalSteps: 2,
        error: 'Send failed',
      });

      expect(syncState.getSendProgress()).toEqual({
        status: 'failed',
        currentStep: 1,
        totalSteps: 2,
        error: 'Send failed',
      });
    });

    it('should update send progress multiple times', () => {
      syncState.setSendProgress({
        status: 'pending',
        currentStep: 0,
        totalSteps: 2,
      });

      expect(syncState.getSendProgress()?.status).toBe('pending');

      syncState.setSendProgress({
        status: 'in_progress',
        currentStep: 1,
        totalSteps: 2,
      });

      expect(syncState.getSendProgress()?.status).toBe('in_progress');
      expect(syncState.getSendProgress()?.currentStep).toBe(1);

      syncState.setSendProgress({
        status: 'completed',
        currentStep: 2,
        totalSteps: 2,
      });

      expect(syncState.getSendProgress()?.status).toBe('completed');
      expect(syncState.getSendProgress()?.currentStep).toBe(2);
    });

    it('should allow clearing send progress with undefined', () => {
      syncState.setSendProgress({
        status: 'completed',
        currentStep: 2,
        totalSteps: 2,
      });

      syncState.setSendProgress(undefined);

      expect(syncState.getSendProgress()).toBeUndefined();
    });
  });

  describe('method: complete', () => {
    let syncState: SyncState;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1737011235890);
      syncState = SyncState.fromData({ ...validData });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should mark sync as completed', () => {
      syncState.complete();

      expect(syncState.getStatus()).toBe('completed');
      expect(syncState.getProgress()).toBe(100);
      expect(syncState.getEndTime()).toBe(1737011235890);
    });

    it('should set progress to 100 regardless of completed steps', () => {
      // Even with 0 completed steps
      syncState.complete();

      expect(syncState.getProgress()).toBe(100);
    });

    it('should set endTime to current time', () => {
      const beforeComplete = syncState.getEndTime();
      expect(beforeComplete).toBeUndefined();

      syncState.complete();

      expect(syncState.getEndTime()).toBe(1737011235890);
    });
  });

  describe('method: fail', () => {
    let syncState: SyncState;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1737011235890);
      syncState = SyncState.fromData({ ...validData });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should mark sync as failed', () => {
      syncState.fail('Connection timeout');

      expect(syncState.getStatus()).toBe('failed');
      expect(syncState.getError()).toBe('Connection timeout');
      expect(syncState.getEndTime()).toBe(1737011235890);
    });

    it('should not change progress when failing', () => {
      const initialProgress = syncState.getProgress();

      syncState.fail('API error');

      expect(syncState.getProgress()).toBe(initialProgress);
    });

    it('should set endTime to current time', () => {
      const beforeFail = syncState.getEndTime();
      expect(beforeFail).toBeUndefined();

      syncState.fail('Test error');

      expect(syncState.getEndTime()).toBe(1737011235890);
    });

    it('should handle empty error message', () => {
      syncState.fail('');

      expect(syncState.getStatus()).toBe('failed');
      expect(syncState.getError()).toBe('');
    });
  });

  describe('method: getElapsedTime', () => {
    it('should calculate elapsed time for completed sync', () => {
      const syncState = SyncState.fromData({
        ...validData,
        startTime: 1737011234567,
        endTime: 1737011235890,
      });

      expect(syncState.getElapsedTime()).toBe(1323); // 1737011235890 - 1737011234567
    });

    it('should calculate elapsed time for ongoing sync', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1737011236000);

      const syncState = SyncState.fromData({
        ...validData,
        startTime: 1737011234567,
      });

      expect(syncState.getElapsedTime()).toBe(1433); // 1737011236000 - 1737011234567

      jest.restoreAllMocks();
    });

    it('should return 0 when startTime equals current time', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1737011234567);

      const syncState = SyncState.fromData({
        ...validData,
        startTime: 1737011234567,
      });

      expect(syncState.getElapsedTime()).toBe(0);

      jest.restoreAllMocks();
    });
  });

  describe('method: isInProgress', () => {
    it('should return true for starting status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'starting',
      });

      expect(syncState.isInProgress()).toBe(true);
    });

    it('should return true for receiving status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'receiving',
      });

      expect(syncState.isInProgress()).toBe(true);
    });

    it('should return true for sending status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'sending',
      });

      expect(syncState.isInProgress()).toBe(true);
    });

    it('should return false for idle status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'idle',
      });

      expect(syncState.isInProgress()).toBe(false);
    });

    it('should return false for completed status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'completed',
      });

      expect(syncState.isInProgress()).toBe(false);
    });

    it('should return false for failed status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'failed',
      });

      expect(syncState.isInProgress()).toBe(false);
    });
  });

  describe('method: isCompleted', () => {
    it('should return true for completed status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'completed',
      });

      expect(syncState.isCompleted()).toBe(true);
    });

    it('should return true for failed status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'failed',
      });

      expect(syncState.isCompleted()).toBe(true);
    });

    it('should return false for idle status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'idle',
      });

      expect(syncState.isCompleted()).toBe(false);
    });

    it('should return false for starting status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'starting',
      });

      expect(syncState.isCompleted()).toBe(false);
    });

    it('should return false for receiving status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'receiving',
      });

      expect(syncState.isCompleted()).toBe(false);
    });

    it('should return false for sending status', () => {
      const syncState = SyncState.fromData({
        ...validData,
        status: 'sending',
      });

      expect(syncState.isCompleted()).toBe(false);
    });
  });

  describe('progress calculation', () => {
    it('should calculate progress correctly at 25%', () => {
      const data = { ...validData, completedSteps: 1, totalSteps: 4 };
      const syncState = SyncState.fromData(data);

      syncState.setStatus('receiving'); // Trigger progress calculation

      expect(syncState.getProgress()).toBe(25);
    });

    it('should calculate progress correctly at 50%', () => {
      const data = { ...validData, completedSteps: 2, totalSteps: 4 };
      const syncState = SyncState.fromData(data);

      syncState.setStatus('receiving');

      expect(syncState.getProgress()).toBe(50);
    });

    it('should calculate progress correctly at 75%', () => {
      const data = { ...validData, completedSteps: 3, totalSteps: 4 };
      const syncState = SyncState.fromData(data);

      syncState.setStatus('receiving');

      expect(syncState.getProgress()).toBe(75);
    });

    it('should be 0 for idle status', () => {
      const syncState = SyncState.fromData({ ...validData });

      syncState.setStatus('idle');

      expect(syncState.getProgress()).toBe(0);
    });

    it('should be 100 for completed status', () => {
      const syncState = SyncState.fromData({ ...validData, completedSteps: 2 });

      syncState.setStatus('completed');

      expect(syncState.getProgress()).toBe(100);
    });

    it('should keep current progress on failed status', () => {
      const data = { ...validData, completedSteps: 2, totalSteps: 4, progress: 50 };
      const syncState = SyncState.fromData(data);

      syncState.setStatus('failed');

      expect(syncState.getProgress()).toBe(50); // Keeps 50%
    });

    it('should cap at 99% when all steps completed but not marked as completed', () => {
      const data = { ...validData, completedSteps: 4, totalSteps: 4 };
      const syncState = SyncState.fromData(data);

      syncState.setStatus('sending'); // In progress

      expect(syncState.getProgress()).toBe(99); // Capped at 99%
    });

    it('should handle 0 total steps', () => {
      const data = { ...validData, completedSteps: 0, totalSteps: 0 };
      const syncState = SyncState.fromData(data);

      syncState.setStatus('receiving');

      expect(syncState.getProgress()).toBe(0);
    });

    it('should round progress to nearest integer', () => {
      const data = { ...validData, completedSteps: 1, totalSteps: 3 };
      const syncState = SyncState.fromData(data);

      syncState.setStatus('receiving');

      // 1/3 = 0.333... → should round to 33
      expect(syncState.getProgress()).toBe(33);
    });
  });

  describe('getters', () => {
    let syncState: SyncState;

    beforeEach(() => {
      syncState = SyncState.fromData({
        ...validData,
        status: 'receiving',
        progress: 50,
        currentStep: 'Receiving data',
        completedSteps: 2,
        endTime: 1737011235890,
        error: 'Test error',
        receiveProgress: {
          status: 'in_progress',
          currentStep: 1,
          totalSteps: 3,
        },
        sendProgress: {
          status: 'pending',
          currentStep: 0,
          totalSteps: 2,
        },
      });
    });

    it('should get configId', () => {
      expect(syncState.getConfigId()).toBe('config-123');
    });

    it('should get storageKey', () => {
      expect(syncState.getStorageKey()).toBe('testData');
    });

    it('should get status', () => {
      expect(syncState.getStatus()).toBe('receiving');
    });

    it('should get progress', () => {
      expect(syncState.getProgress()).toBe(50);
    });

    it('should get currentStep', () => {
      expect(syncState.getCurrentStep()).toBe('Receiving data');
    });

    it('should get totalSteps', () => {
      expect(syncState.getTotalSteps()).toBe(4);
    });

    it('should get completedSteps', () => {
      expect(syncState.getCompletedSteps()).toBe(2);
    });

    it('should get startTime', () => {
      expect(syncState.getStartTime()).toBe(1737011234567);
    });

    it('should get endTime', () => {
      expect(syncState.getEndTime()).toBe(1737011235890);
    });

    it('should get error', () => {
      expect(syncState.getError()).toBe('Test error');
    });

    it('should get receiveProgress', () => {
      expect(syncState.getReceiveProgress()).toEqual({
        status: 'in_progress',
        currentStep: 1,
        totalSteps: 3,
      });
    });

    it('should get sendProgress', () => {
      expect(syncState.getSendProgress()).toEqual({
        status: 'pending',
        currentStep: 0,
        totalSteps: 2,
      });
    });
  });

  describe('method: toData', () => {
    it('should convert to plain data object', () => {
      const syncState = SyncState.fromData(validData);
      const data = syncState.toData();

      expect(data).toEqual(validData);
    });

    it('should return a copy (immutability)', () => {
      const syncState = SyncState.fromData(validData);
      const data1 = syncState.toData();
      const data2 = syncState.toData();

      expect(data1).toEqual(data2);
      expect(data1).not.toBe(data2);

      // Mutating returned data should not affect entity
      data1.status = 'completed';
      expect(syncState.getStatus()).toBe('starting');
    });

    it('should include all fields', () => {
      const fullData: SyncStateData = {
        ...validData,
        status: 'completed',
        endTime: 1737011235890,
        error: 'Test error',
        receiveProgress: {
          status: 'completed',
          currentStep: 3,
          totalSteps: 3,
        },
        sendProgress: {
          status: 'completed',
          currentStep: 2,
          totalSteps: 2,
        },
      };

      const syncState = SyncState.fromData(fullData);
      const data = syncState.toData();

      expect(data).toHaveProperty('configId');
      expect(data).toHaveProperty('storageKey');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('progress');
      expect(data).toHaveProperty('currentStep');
      expect(data).toHaveProperty('totalSteps');
      expect(data).toHaveProperty('completedSteps');
      expect(data).toHaveProperty('startTime');
      expect(data).toHaveProperty('endTime');
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('receiveProgress');
      expect(data).toHaveProperty('sendProgress');
    });
  });

  describe('method: clone', () => {
    it('should create a new instance with same data', () => {
      const original = SyncState.fromData(validData);
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.toData()).toEqual(original.toData());
    });

    it('should create independent instances', () => {
      const original = SyncState.fromData(validData);
      const cloned = original.clone();

      // Modify cloned
      cloned.setStatus('completed');
      cloned.setCurrentStep('Done');

      // Original should not be affected
      expect(original.getStatus()).toBe('starting');
      expect(original.getCurrentStep()).toBe('Initializing');

      // Cloned should have new values
      expect(cloned.getStatus()).toBe('completed');
      expect(cloned.getCurrentStep()).toBe('Done');
    });
  });

  describe('edge cases', () => {
    it('should handle very long elapsed time', () => {
      const syncState = SyncState.fromData({
        ...validData,
        startTime: 1737011234567,
        endTime: 1737011234567 + 86400000, // 24 hours later
      });

      expect(syncState.getElapsedTime()).toBe(86400000);
    });

    it('should handle many total steps', () => {
      const syncState = SyncState.create({
        configId: 'config-123',
        storageKey: 'testData',
        totalSteps: 1000,
      });

      expect(syncState.getTotalSteps()).toBe(1000);
    });

    it('should handle multiple status transitions', () => {
      const syncState = SyncState.fromData({ ...validData });

      syncState.setStatus('idle');
      expect(syncState.getStatus()).toBe('idle');

      syncState.setStatus('starting');
      expect(syncState.getStatus()).toBe('starting');

      syncState.setStatus('receiving');
      expect(syncState.getStatus()).toBe('receiving');

      syncState.setStatus('sending');
      expect(syncState.getStatus()).toBe('sending');

      syncState.setStatus('completed');
      expect(syncState.getStatus()).toBe('completed');
    });

    it('should handle receive and send progress independently', () => {
      const syncState = SyncState.fromData({ ...validData });

      syncState.setReceiveProgress({
        status: 'completed',
        currentStep: 3,
        totalSteps: 3,
      });

      syncState.setSendProgress({
        status: 'in_progress',
        currentStep: 1,
        totalSteps: 2,
      });

      expect(syncState.getReceiveProgress()?.status).toBe('completed');
      expect(syncState.getSendProgress()?.status).toBe('in_progress');
    });

    it('should handle progress when completed steps exceed total', () => {
      const data = { ...validData, completedSteps: 10, totalSteps: 4 };
      const syncState = SyncState.fromData(data);

      syncState.setStatus('receiving');

      // Should cap at 99% since not marked as completed
      expect(syncState.getProgress()).toBe(99);
    });

    it('should handle empty current step', () => {
      const syncState = SyncState.fromData({
        ...validData,
        currentStep: '',
      });

      expect(syncState.getCurrentStep()).toBe('');
    });
  });

  describe('validation', () => {
    describe('create() validation', () => {
      it('should throw error for empty configId', () => {
        expect(() =>
          SyncState.create({
            configId: '',
            storageKey: 'testData',
            totalSteps: 4,
          })
        ).toThrow('Config ID must not be empty');
      });

      it('should throw error for whitespace-only configId', () => {
        expect(() =>
          SyncState.create({
            configId: '   ',
            storageKey: 'testData',
            totalSteps: 4,
          })
        ).toThrow('Config ID must not be empty');
      });

      it('should throw error for empty storageKey', () => {
        expect(() =>
          SyncState.create({
            configId: 'config-123',
            storageKey: '',
            totalSteps: 4,
          })
        ).toThrow('Storage key must not be empty');
      });

      it('should throw error for whitespace-only storageKey', () => {
        expect(() =>
          SyncState.create({
            configId: 'config-123',
            storageKey: '   ',
            totalSteps: 4,
          })
        ).toThrow('Storage key must not be empty');
      });

      it('should throw error for negative totalSteps', () => {
        expect(() =>
          SyncState.create({
            configId: 'config-123',
            storageKey: 'testData',
            totalSteps: -1,
          })
        ).toThrow('Total steps must be a non-negative integer');
      });

      it('should throw error for non-integer totalSteps', () => {
        expect(() =>
          SyncState.create({
            configId: 'config-123',
            storageKey: 'testData',
            totalSteps: 3.5,
          })
        ).toThrow('Total steps must be a non-negative integer');
      });

      it('should accept zero totalSteps', () => {
        expect(() =>
          SyncState.create({
            configId: 'config-123',
            storageKey: 'testData',
            totalSteps: 0,
          })
        ).not.toThrow();
      });
    });

    describe('fromData() validation', () => {
      it('should throw error for empty configId', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            configId: '',
          })
        ).toThrow('Config ID must not be empty');
      });

      it('should throw error for whitespace-only configId', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            configId: '   ',
          })
        ).toThrow('Config ID must not be empty');
      });

      it('should throw error for empty storageKey', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            storageKey: '',
          })
        ).toThrow('Storage key must not be empty');
      });

      it('should throw error for whitespace-only storageKey', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            storageKey: '   ',
          })
        ).toThrow('Storage key must not be empty');
      });

      it('should throw error for negative progress', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            progress: -1,
          })
        ).toThrow('Progress must be between 0 and 100');
      });

      it('should throw error for progress greater than 100', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            progress: 101,
          })
        ).toThrow('Progress must be between 0 and 100');
      });

      it('should accept progress 0', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            progress: 0,
          })
        ).not.toThrow();
      });

      it('should accept progress 100', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            progress: 100,
          })
        ).not.toThrow();
      });

      it('should throw error for non-string currentStep', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            currentStep: 123 as any,
          })
        ).toThrow('Current step must be a string');
      });

      it('should throw error for negative totalSteps', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            totalSteps: -1,
          })
        ).toThrow('Total steps must be a non-negative integer');
      });

      it('should throw error for non-integer totalSteps', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            totalSteps: 3.5,
          })
        ).toThrow('Total steps must be a non-negative integer');
      });

      it('should accept zero totalSteps', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            totalSteps: 0,
          })
        ).not.toThrow();
      });

      it('should throw error for negative completedSteps', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            completedSteps: -1,
          })
        ).toThrow('Completed steps must be a non-negative integer');
      });

      it('should throw error for non-integer completedSteps', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            completedSteps: 2.5,
          })
        ).toThrow('Completed steps must be a non-negative integer');
      });

      it('should accept zero completedSteps', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            completedSteps: 0,
          })
        ).not.toThrow();
      });

      it('should throw error for zero startTime', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            startTime: 0,
          })
        ).toThrow('Start time must be positive');
      });

      it('should throw error for negative startTime', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            startTime: -100,
          })
        ).toThrow('Start time must be positive');
      });

      it('should throw error for zero endTime', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            endTime: 0,
          })
        ).toThrow('End time must be positive');
      });

      it('should throw error for negative endTime', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            endTime: -1,
          })
        ).toThrow('End time must be positive');
      });

      it('should throw error when endTime is less than startTime', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            startTime: 1737011235890,
            endTime: 1737011234567,
          })
        ).toThrow('End time must be greater than or equal to start time');
      });

      it('should accept endTime equal to startTime', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            startTime: 1737011234567,
            endTime: 1737011234567,
          })
        ).not.toThrow();
      });

      it('should accept undefined endTime', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            endTime: undefined,
          })
        ).not.toThrow();
      });

      it('should throw error for negative receiveProgress currentStep', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            receiveProgress: {
              status: 'in_progress',
              currentStep: -1,
              totalSteps: 3,
            },
          })
        ).toThrow('Receive progress current step must be non-negative');
      });

      it('should throw error for negative receiveProgress totalSteps', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            receiveProgress: {
              status: 'in_progress',
              currentStep: 1,
              totalSteps: -1,
            },
          })
        ).toThrow('Receive progress total steps must be non-negative');
      });

      it('should accept zero receiveProgress values', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            receiveProgress: {
              status: 'pending',
              currentStep: 0,
              totalSteps: 0,
            },
          })
        ).not.toThrow();
      });

      it('should throw error for negative sendProgress currentStep', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            sendProgress: {
              status: 'in_progress',
              currentStep: -1,
              totalSteps: 3,
            },
          })
        ).toThrow('Send progress current step must be non-negative');
      });

      it('should throw error for negative sendProgress totalSteps', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            sendProgress: {
              status: 'in_progress',
              currentStep: 1,
              totalSteps: -1,
            },
          })
        ).toThrow('Send progress total steps must be non-negative');
      });

      it('should accept zero sendProgress values', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            sendProgress: {
              status: 'pending',
              currentStep: 0,
              totalSteps: 0,
            },
          })
        ).not.toThrow();
      });

      it('should accept undefined receiveProgress', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            receiveProgress: undefined,
          })
        ).not.toThrow();
      });

      it('should accept undefined sendProgress', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            sendProgress: undefined,
          })
        ).not.toThrow();
      });

      it('should accept all valid data with optional fields', () => {
        expect(() =>
          SyncState.fromData({
            ...validData,
            endTime: 1737011235890,
            receiveProgress: {
              status: 'completed',
              currentStep: 3,
              totalSteps: 3,
            },
            sendProgress: {
              status: 'in_progress',
              currentStep: 1,
              totalSteps: 2,
            },
          })
        ).not.toThrow();
      });
    });
  });
});
