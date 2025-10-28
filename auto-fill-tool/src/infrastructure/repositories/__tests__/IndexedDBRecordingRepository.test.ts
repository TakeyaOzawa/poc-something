/**
 * Unit Tests: IndexedDBRecordingRepository
 * Tests IndexedDB operations for tab recording storage
 */

import { IndexedDBRecordingRepository } from '../IndexedDBRecordingRepository';
import { TabRecording, RecordingStatus } from '@domain/entities/TabRecording';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';
import { Result } from '@domain/values/result.value';

describe('IndexedDBRecordingRepository', () => {
  let repository: IndexedDBRecordingRepository;
  let mockLogger: jest.Mocked<Logger>;
  let mockAutomationResultRepository: jest.Mocked<AutomationResultRepository>;
  let mockDB: IDBDatabase;
  let dbRequest: IDBOpenDBRequest;

  // Mock IndexedDB
  const mockIndexedDB = {
    databases: new Map<string, any>(),
    open: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn().mockReturnValue(LogLevel.INFO),
      createChild: jest.fn(),
    } as jest.Mocked<Logger>;

    // Create mock AutomationResultRepository
    mockAutomationResultRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      loadByStatus: jest.fn(),
      loadInProgress: jest.fn(),
      loadLatestByAutomationVariablesId: jest.fn(),
      loadByAutomationVariablesId: jest.fn(),
      delete: jest.fn(),
      deleteByAutomationVariablesId: jest.fn(),
      loadInProgressFromBatch: jest.fn(),
    } as jest.Mocked<AutomationResultRepository>;

    // Mock IndexedDB globally
    global.indexedDB = mockIndexedDB as any;

    repository = new IndexedDBRecordingRepository(mockLogger, mockAutomationResultRepository);
  });

  describe('openDB()', () => {
    it('should open database successfully', async () => {
      const mockDB = {
        objectStoreNames: {
          contains: jest.fn().mockReturnValue(true),
        },
      } as any;

      const openRequest = {
        result: mockDB,
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
      } as IDBOpenDBRequest;

      mockIndexedDB.open.mockReturnValue(openRequest);

      const dbPromise = (repository as any).openDB();

      // Simulate successful open
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);

      const result = await dbPromise;
      expect(result).toBe(mockDB);
      expect(mockIndexedDB.open).toHaveBeenCalledWith('AutoFillToolDB', 1);
    });

    it('should handle database open error', async () => {
      const openRequest = {
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
      } as IDBOpenDBRequest;

      mockIndexedDB.open.mockReturnValue(openRequest);

      const dbPromise = (repository as any).openDB();

      // Simulate error
      setTimeout(() => {
        if (openRequest.onerror) {
          openRequest.onerror({ target: openRequest } as any);
        }
      }, 0);

      await expect(dbPromise).rejects.toThrow('Failed to open IndexedDB');
    });

    it('should create object store on upgrade', async () => {
      const mockObjectStore = {
        createIndex: jest.fn(),
      };

      const mockDB = {
        objectStoreNames: {
          contains: jest.fn().mockReturnValue(false),
        },
        createObjectStore: jest.fn().mockReturnValue(mockObjectStore),
      } as any;

      const openRequest = {
        result: mockDB,
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
      } as IDBOpenDBRequest;

      mockIndexedDB.open.mockReturnValue(openRequest);

      const dbPromise = (repository as any).openDB();

      // Simulate upgrade needed
      setTimeout(() => {
        if (openRequest.onupgradeneeded) {
          openRequest.onupgradeneeded({ target: openRequest } as any);
        }
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);

      const result = await dbPromise;

      expect(mockDB.createObjectStore).toHaveBeenCalledWith('tab_recordings', { keyPath: 'id' });
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith(
        'automationResultId',
        'automationResultId',
        {
          unique: true,
        }
      );
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith('startedAt', 'startedAt', {
        unique: false,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('IndexedDB object store created', {
        dbName: 'AutoFillToolDB',
        dbVersion: 1,
        storeName: 'tab_recordings',
      });
    });
  });

  describe('save()', () => {
    it('should save recording to IndexedDB', async () => {
      const recording = TabRecording.create({
        automationResultId: 'result-123',
        tabId: 1,
        bitrate: 2500000,
      });

      const mockStore = {
        put: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null as any,
      };

      const mockDB = {
        name: 'AutoFillToolDB',
        version: 1,
        objectStoreNames: ['tab_recordings'] as any,
        transaction: jest.fn().mockReturnValue(mockTransaction),
        close: jest.fn(),
      };

      const putRequest = {
        onsuccess: null as any,
        onerror: null as any,
      } as IDBRequest;

      mockStore.put.mockReturnValue(putRequest);

      // Mock openDB
      jest.spyOn(repository as any, 'openDB').mockResolvedValue(mockDB);

      const savePromise = repository.save(recording);

      // Simulate successful put
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({ target: putRequest } as any);
        }
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete({} as any);
        }
      }, 0);

      await savePromise;

      expect(mockDB.transaction).toHaveBeenCalledWith(['tab_recordings'], 'readwrite');
      expect(mockStore.put).toHaveBeenCalledWith(recording.toData());
      expect(mockLogger.info).toHaveBeenCalledWith('Recording saved to IndexedDB', {
        id: recording.getId(),
        automationResultId: recording.getAutomationResultId(),
        tabId: recording.getTabId(),
        status: recording.getStatus(),
        sizeBytes: recording.getSizeBytes(),
        sizeMB: recording.getSizeMB().toFixed(2),
      });
      expect(mockDB.close).toHaveBeenCalled();
    });

    it('should handle save error', async () => {
      const recording = TabRecording.create({
        automationResultId: 'result-123',
        tabId: 1,
        bitrate: 2500000,
      });

      const mockStore = {
        put: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null as any,
      };

      const mockDB = {
        name: 'AutoFillToolDB',
        version: 1,
        objectStoreNames: ['tab_recordings'] as any,
        transaction: jest.fn().mockReturnValue(mockTransaction),
        close: jest.fn(),
      };

      const putRequest = {
        onsuccess: null as any,
        onerror: null as any,
        error: new Error('Put failed'),
      } as any;

      mockStore.put.mockReturnValue(putRequest);

      jest.spyOn(repository as any, 'openDB').mockResolvedValue(mockDB);

      const savePromise = repository.save(recording);

      // Simulate error
      setTimeout(() => {
        if (putRequest.onerror) {
          putRequest.onerror({ target: putRequest } as any);
        }
      }, 0);

      const result = await savePromise;
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('Put failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save recording to IndexedDB', {
        id: recording.getId(),
        automationResultId: recording.getAutomationResultId(),
        tabId: recording.getTabId(),
        status: recording.getStatus(),
        sizeBytes: recording.getSizeBytes(),
        error: putRequest.error,
      });
    });
  });

  describe('load()', () => {
    it('should load recording by ID', async () => {
      const recordingId = 'recording-123';
      const recordingData = {
        id: recordingId,
        automationResultId: 'result-123',
        tabId: 1,
        status: RecordingStatus.SAVED,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        blobData: new Blob(['test'], { type: 'video/webm' }),
        mimeType: 'video/webm',
        sizeBytes: 1000,
        durationMs: 5000,
        bitrate: 2500000,
      };

      const mockStore = {
        get: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null as any,
      };

      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
        close: jest.fn(),
      };

      const getRequest = {
        result: recordingData,
        onsuccess: null as any,
        onerror: null as any,
      } as any;

      mockStore.get.mockReturnValue(getRequest);

      jest.spyOn(repository as any, 'openDB').mockResolvedValue(mockDB);

      const loadPromise = repository.load(recordingId);

      // Simulate successful get
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: getRequest } as any);
        }
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete({} as any);
        }
      }, 0);

      const result = await loadPromise;

      expect(result.isSuccess).toBe(true);
      expect(result.value).not.toBeNull();
      expect(result.value!.getId()).toBe(recordingId);
      expect(mockStore.get).toHaveBeenCalledWith(recordingId);
      expect(mockDB.close).toHaveBeenCalled();
    });

    it('should return null when recording not found', async () => {
      const recordingId = 'non-existent';

      const mockStore = {
        get: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null as any,
      };

      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
        close: jest.fn(),
      };

      const getRequest = {
        result: undefined,
        onsuccess: null as any,
        onerror: null as any,
      } as any;

      mockStore.get.mockReturnValue(getRequest);

      jest.spyOn(repository as any, 'openDB').mockResolvedValue(mockDB);

      const loadPromise = repository.load(recordingId);

      // Simulate successful get with no result
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: getRequest } as any);
        }
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete({} as any);
        }
      }, 0);

      const result = await loadPromise;

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should handle load error', async () => {
      const recordingId = 'recording-123';

      const mockStore = {
        get: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null as any,
      };

      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
        close: jest.fn(),
      };

      const getRequest = {
        onsuccess: null as any,
        onerror: null as any,
      } as any;

      mockStore.get.mockReturnValue(getRequest);

      jest.spyOn(repository as any, 'openDB').mockResolvedValue(mockDB);

      const loadPromise = repository.load(recordingId);

      // Simulate error
      setTimeout(() => {
        if (getRequest.onerror) {
          getRequest.onerror({ target: getRequest } as any);
        }
      }, 0);

      const result = await loadPromise;
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to load recording');
    });
  });

  describe('loadByAutomationResultId()', () => {
    it('should load recording by automation result ID', async () => {
      const automationResultId = 'result-123';
      const recordingData = {
        id: 'recording-123',
        automationResultId,
        tabId: 1,
        status: RecordingStatus.SAVED,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        blobData: new Blob(['test'], { type: 'video/webm' }),
        mimeType: 'video/webm',
        sizeBytes: 1000,
        durationMs: 5000,
        bitrate: 2500000,
      };

      const mockIndex = {
        get: jest.fn(),
      };

      const mockStore = {
        index: jest.fn().mockReturnValue(mockIndex),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null as any,
      };

      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
        close: jest.fn(),
      };

      const getRequest = {
        result: recordingData,
        onsuccess: null as any,
        onerror: null as any,
      } as any;

      mockIndex.get.mockReturnValue(getRequest);

      jest.spyOn(repository as any, 'openDB').mockResolvedValue(mockDB);

      const loadPromise = repository.loadByAutomationResultId(automationResultId);

      // Simulate successful get
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: getRequest } as any);
        }
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete({} as any);
        }
      }, 0);

      const result = await loadPromise;

      expect(result.isSuccess).toBe(true);
      expect(result.value).not.toBeNull();
      expect(result.value!.getAutomationResultId()).toBe(automationResultId);
      expect(mockStore.index).toHaveBeenCalledWith('automationResultId');
      expect(mockIndex.get).toHaveBeenCalledWith(automationResultId);
    });

    it('should return null when recording not found by automation result ID', async () => {
      const automationResultId = 'non-existent';

      const mockIndex = {
        get: jest.fn(),
      };

      const mockStore = {
        index: jest.fn().mockReturnValue(mockIndex),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null as any,
      };

      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
        close: jest.fn(),
      };

      const getRequest = {
        result: undefined,
        onsuccess: null as any,
        onerror: null as any,
      } as any;

      mockIndex.get.mockReturnValue(getRequest);

      jest.spyOn(repository as any, 'openDB').mockResolvedValue(mockDB);

      const loadPromise = repository.loadByAutomationResultId(automationResultId);

      // Simulate successful get with no result
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: getRequest } as any);
        }
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete({} as any);
        }
      }, 0);

      const result = await loadPromise;

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });
  });

  describe('loadAll()', () => {
    it('should load all recordings', async () => {
      const recordingData1 = {
        id: 'recording-1',
        automationResultId: 'result-1',
        tabId: 1,
        status: RecordingStatus.SAVED,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        blobData: new Blob(['test1'], { type: 'video/webm' }),
        mimeType: 'video/webm',
        sizeBytes: 1000,
        durationMs: 5000,
        bitrate: 2500000,
      };

      const recordingData2 = {
        id: 'recording-2',
        automationResultId: 'result-2',
        tabId: 2,
        status: RecordingStatus.SAVED,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        blobData: new Blob(['test2'], { type: 'video/webm' }),
        mimeType: 'video/webm',
        sizeBytes: 2000,
        durationMs: 10000,
        bitrate: 2500000,
      };

      const mockStore = {
        getAll: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null as any,
      };

      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
        close: jest.fn(),
      };

      const getAllRequest = {
        result: [recordingData1, recordingData2],
        onsuccess: null as any,
        onerror: null as any,
      } as any;

      mockStore.getAll.mockReturnValue(getAllRequest);

      jest.spyOn(repository as any, 'openDB').mockResolvedValue(mockDB);

      const loadPromise = repository.loadAll();

      // Simulate successful getAll
      setTimeout(() => {
        if (getAllRequest.onsuccess) {
          getAllRequest.onsuccess({ target: getAllRequest } as any);
        }
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete({} as any);
        }
      }, 0);

      const result = await loadPromise;

      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value![0].getId()).toBe('recording-1');
      expect(result.value![1].getId()).toBe('recording-2');
    });
  });

  describe('delete()', () => {
    it('should delete recording by ID', async () => {
      const recordingId = 'recording-123';

      const mockStore = {
        delete: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null as any,
      };

      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
        close: jest.fn(),
      };

      const deleteRequest = {
        onsuccess: null as any,
        onerror: null as any,
      } as IDBRequest;

      mockStore.delete.mockReturnValue(deleteRequest);

      jest.spyOn(repository as any, 'openDB').mockResolvedValue(mockDB);

      const deletePromise = repository.delete(recordingId);

      // Simulate successful delete
      setTimeout(() => {
        if (deleteRequest.onsuccess) {
          deleteRequest.onsuccess({ target: deleteRequest } as any);
        }
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete({} as any);
        }
      }, 0);

      await deletePromise;

      expect(mockStore.delete).toHaveBeenCalledWith(recordingId);
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting recording from IndexedDB', {
        id: recordingId,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Recording deleted successfully from IndexedDB',
        {
          id: recordingId,
        }
      );
    });
  });

  describe('deleteByAutomationResultId()', () => {
    it('should delete recording by automation result ID', async () => {
      const automationResultId = 'result-123';
      const recording = TabRecording.create({
        automationResultId,
        tabId: 1,
        bitrate: 2500000,
      });

      jest
        .spyOn(repository, 'loadByAutomationResultId')
        .mockResolvedValue(Result.success(recording));
      jest.spyOn(repository, 'delete').mockResolvedValue(Result.success(undefined));

      await repository.deleteByAutomationResultId(automationResultId);

      expect(repository.loadByAutomationResultId).toHaveBeenCalledWith(automationResultId);
      expect(repository.delete).toHaveBeenCalledWith(recording.getId());
    });

    it('should handle case when recording not found', async () => {
      const automationResultId = 'non-existent';

      jest.spyOn(repository, 'loadByAutomationResultId').mockResolvedValue(Result.success(null));
      jest.spyOn(repository, 'delete').mockResolvedValue(Result.success(undefined));

      await repository.deleteByAutomationResultId(automationResultId);

      expect(repository.loadByAutomationResultId).toHaveBeenCalledWith(automationResultId);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteOldRecordings()', () => {
    it('should delete recordings older than retention period', async () => {
      const retentionDays = 10;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldRecordingData = {
        id: 'old-recording',
        automationResultId: 'result-old',
        tabId: 1,
        status: RecordingStatus.SAVED,
        startedAt: new Date(cutoffDate.getTime() - 86400000).toISOString(), // 1 day before cutoff
        endedAt: new Date(cutoffDate.getTime() - 86400000).toISOString(),
        blobData: new Blob(['old'], { type: 'video/webm' }),
        mimeType: 'video/webm',
        sizeBytes: 1000,
        durationMs: 5000,
        bitrate: 2500000,
      };

      const recentRecordingData = {
        id: 'recent-recording',
        automationResultId: 'result-recent',
        tabId: 2,
        status: RecordingStatus.SAVED,
        startedAt: new Date().toISOString(), // Today
        endedAt: new Date().toISOString(),
        blobData: new Blob(['recent'], { type: 'video/webm' }),
        mimeType: 'video/webm',
        sizeBytes: 2000,
        durationMs: 10000,
        bitrate: 2500000,
      };

      const mockIndex = {
        openCursor: jest.fn(),
      };

      const mockStore = {
        index: jest.fn().mockReturnValue(mockIndex),
        delete: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null as any,
      };

      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
        close: jest.fn(),
      };

      const cursorRequest = {
        result: null as any,
        onsuccess: null as any,
        onerror: null as any,
      } as any;

      mockIndex.openCursor.mockReturnValue(cursorRequest);

      jest.spyOn(repository as any, 'openDB').mockResolvedValue(mockDB);

      const deletePromise = repository.deleteOldRecordings(retentionDays);

      // Simulate cursor iteration
      setTimeout(() => {
        if (cursorRequest.onsuccess) {
          // First cursor: old recording
          cursorRequest.result = {
            value: oldRecordingData,
            continue: jest.fn(),
          };
          cursorRequest.onsuccess({ target: cursorRequest } as any);

          // Second cursor: recent recording
          cursorRequest.result = {
            value: recentRecordingData,
            continue: jest.fn(),
          };
          cursorRequest.onsuccess({ target: cursorRequest } as any);

          // End of cursor
          cursorRequest.result = null;
          cursorRequest.onsuccess({ target: cursorRequest } as any);
        }

        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete({} as any);
        }
      }, 0);

      const result = await deletePromise;

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(1); // Only old recording should be deleted
      expect(mockStore.delete).toHaveBeenCalledWith('old-recording');
      expect(mockLogger.info).toHaveBeenCalledWith('Starting deletion of old recordings', {
        retentionDays,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Calculated cutoff date for old recordings', {
        retentionDays,
        cutoffDate: expect.any(String),
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Old recordings deleted successfully', {
        deletedCount: 1,
        retentionDays,
        cutoffDate: expect.any(String),
        deletedIds: ['old-recording'],
      });
    });
  });

  describe('getStorageSize()', () => {
    it('should calculate total storage size', async () => {
      const recording1 = TabRecording.create({
        automationResultId: 'result-1',
        tabId: 1,
        bitrate: 2500000,
      })
        .start('recorder-1')
        .stop()
        .save(new Blob(['a'.repeat(1000)], { type: 'video/webm' }));

      const recording2 = TabRecording.create({
        automationResultId: 'result-2',
        tabId: 2,
        bitrate: 2500000,
      })
        .start('recorder-2')
        .stop()
        .save(new Blob(['b'.repeat(2000)], { type: 'video/webm' }));

      jest.spyOn(repository, 'loadAll').mockResolvedValue(Result.success([recording1, recording2]));

      const result = await repository.getStorageSize();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(recording1.getSizeBytes() + recording2.getSizeBytes());
    });
  });

  describe('loadLatestByAutomationVariablesId()', () => {
    it('should load latest recording by automation variables ID', async () => {
      const automationVariablesId = 'variables-123';

      // Create mock AutomationResults with different timestamps using constructor
      const olderResult = new AutomationResult({
        id: 'result-1',
        automationVariablesId,
        startFrom: new Date('2024-01-01T10:00:00Z').toISOString(),
        endTo: null,
        executionStatus: EXECUTION_STATUS.SUCCESS,
        resultDetail: 'Older execution',
        currentStepIndex: 0,
        totalSteps: 1,
        lastExecutedUrl: 'https://example.com',
      });

      const newerResult = new AutomationResult({
        id: 'result-2',
        automationVariablesId,
        startFrom: new Date('2024-01-02T10:00:00Z').toISOString(),
        endTo: null,
        executionStatus: EXECUTION_STATUS.SUCCESS,
        resultDetail: 'Newer execution',
        currentStepIndex: 0,
        totalSteps: 1,
        lastExecutedUrl: 'https://example.com',
      });

      const recordingData = {
        id: 'recording-latest',
        automationResultId: newerResult.getId(),
        tabId: 1,
        recorderId: null,
        status: RecordingStatus.SAVED,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        blobData: new Blob(['test'], { type: 'video/webm' }),
        mimeType: 'video/webm',
        sizeBytes: 1000,
        durationMs: 5000,
        bitrate: 2500000,
      };

      // Mock loadAll to return results in mixed order
      mockAutomationResultRepository.loadAll.mockResolvedValue(
        Result.success([olderResult, newerResult])
      );

      // Mock loadByAutomationResultId to return recording only for the newer result
      jest
        .spyOn(repository, 'loadByAutomationResultId')
        .mockImplementation(async (resultId: string) => {
          if (resultId === newerResult.getId()) {
            return Result.success(new TabRecording(recordingData));
          }
          return Result.success(null);
        });

      const result = await repository.loadLatestByAutomationVariablesId(automationVariablesId);

      expect(result.isSuccess).toBe(true);
      expect(result.value).not.toBeNull();
      expect(result.value!.getAutomationResultId()).toBe(newerResult.getId());
      expect(mockAutomationResultRepository.loadAll).toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled(); // No error messages
    });

    it('should return null when no automation results found', async () => {
      const automationVariablesId = 'non-existent';

      mockAutomationResultRepository.loadAll.mockResolvedValue(Result.success([]));

      const result = await repository.loadLatestByAutomationVariablesId(automationVariablesId);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith('No automation results found for variables', {
        variablesId: automationVariablesId,
      });
    });

    it('should return null when no recording found for any result', async () => {
      const automationVariablesId = 'variables-123';

      const result1 = new AutomationResult({
        id: 'result-1',
        automationVariablesId,
        startFrom: new Date().toISOString(),
        endTo: null,
        executionStatus: EXECUTION_STATUS.SUCCESS,
        resultDetail: 'Test execution',
        currentStepIndex: 0,
        totalSteps: 1,
        lastExecutedUrl: 'https://example.com',
      });

      mockAutomationResultRepository.loadAll.mockResolvedValue(Result.success([result1]));

      // Mock loadByAutomationResultId to return null (no recording)
      jest.spyOn(repository, 'loadByAutomationResultId').mockResolvedValue(Result.success(null));

      const result = await repository.loadLatestByAutomationVariablesId(automationVariablesId);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'No recording found for any result of variables',
        {
          variablesId: automationVariablesId,
        }
      );
    });

    it('should handle errors gracefully', async () => {
      const automationVariablesId = 'variables-123';
      const error = new Error('Repository error');

      mockAutomationResultRepository.loadAll.mockRejectedValue(error);

      const result = await repository.loadLatestByAutomationVariablesId(automationVariablesId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toEqual(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error loading latest recording by variables ID',
        error
      );
    });
  });
});
