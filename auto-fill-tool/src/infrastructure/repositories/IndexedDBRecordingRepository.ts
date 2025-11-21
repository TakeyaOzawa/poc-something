/* eslint-disable max-lines */
/**
 * Infrastructure Layer: IndexedDB Recording Repository
 * Implements RecordingStorageRepository using IndexedDB API
 */

import { RecordingStorageRepository } from '@domain/repositories/RecordingStorageRepository';
import { TabRecording, TabRecordingData } from '@domain/entities/TabRecording';
import { Logger } from '@domain/types/logger.types';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { Result } from '@domain/values/result.value';

export class IndexedDBRecordingRepository implements RecordingStorageRepository {
  private readonly DB_NAME = 'AutoFillToolDB';
  private readonly STORE_NAME = 'tab_recordings';
  private readonly DB_VERSION = 1;

  constructor(
    private logger: Logger,
    private automationResultRepository: AutomationResultRepository
  ) {}

  /**
   * Open IndexedDB database
   */
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        const error = new Error('Failed to open IndexedDB');
        this.logger.error('Failed to open IndexedDB for recording repository', {
          dbName: this.DB_NAME,
          dbVersion: this.DB_VERSION,
          storeName: this.STORE_NAME,
          error: request.error,
        });
        reject(error);
      };

      request.onsuccess = () => {
        this.logger.info('IndexedDB opened successfully for recording repository', {
          dbName: this.DB_NAME,
          dbVersion: this.DB_VERSION,
        });
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });

          // Create indexes
          objectStore.createIndex('automationResultId', 'automationResultId', { unique: true });
          objectStore.createIndex('startedAt', 'startedAt', { unique: false });

          this.logger.info('IndexedDB object store created', {
            storeName: this.STORE_NAME,
            dbName: this.DB_NAME,
            dbVersion: this.DB_VERSION,
          });
        }
      };
    });
  }

  /**
   * Convert Blob to ArrayBuffer for IndexedDB storage
   */
  private async blobToArrayBuffer(blob: Blob | null): Promise<ArrayBuffer | null> {
    if (!blob) {
      return null;
    }
    return await blob.arrayBuffer();
  }

  /**
   * Convert ArrayBuffer back to Blob
   */
  private arrayBufferToBlob(arrayBuffer: ArrayBuffer | null, mimeType: string): Blob | null {
    if (!arrayBuffer) {
      return null;
    }
    return new Blob([arrayBuffer], { type: mimeType });
  }

  /**
   * Save a tab recording
   */
  // eslint-disable-next-line max-lines-per-function -- Handles complete IndexedDB save operation including database opening, transaction management, blob-to-ArrayBuffer conversion, detailed logging at each step, and promise-based error handling. The sequential IndexedDB API calls with comprehensive logging are necessary for debugging storage issues.
  async save(recording: TabRecording): Promise<Result<void, Error>> {
    try {
      this.logger.info('[IndexedDB] Starting save operation', {
        id: recording.getId(),
        automationResultId: recording.getAutomationResultId(),
        tabId: recording.getTabId(),
        status: recording.getStatus(),
        sizeBytes: recording.getSizeBytes(),
      });

      const db = await this.openDB();
      this.logger.info('[IndexedDB] Database opened successfully', {
        dbName: db.name,
        version: db.version,
        objectStoreNames: Array.from(db.objectStoreNames),
      });

      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const data = recording.toData();
      this.logger.info('[IndexedDB] Recording data extracted', {
        id: data.id,
        automationResultId: data.automationResultId,
        hasBlobData: !!data.blobData,
        blobSize: data.blobData?.size || 0,
      });

      // Convert Blob to ArrayBuffer for storage
      const blobArrayBuffer = await this.blobToArrayBuffer(data.blobData);
      this.logger.info('[IndexedDB] Blob converted to ArrayBuffer', {
        id: data.id,
        arrayBufferSize: blobArrayBuffer?.byteLength || 0,
      });

      const storageData = {
        ...data,
        blobData: blobArrayBuffer,
      };

      this.logger.info('[IndexedDB] Storage data prepared, calling put()', {
        id: storageData.id,
        automationResultId: storageData.automationResultId,
        keys: Object.keys(storageData),
      });

      await new Promise<void>((resolve, reject) => {
        const request = store.put(storageData);

        request.onsuccess = () => {
          this.logger.info('Recording saved to IndexedDB', {
            id: recording.getId(),
            automationResultId: recording.getAutomationResultId(),
            tabId: recording.getTabId(),
            status: recording.getStatus(),
            sizeBytes: recording.getSizeBytes(),
            sizeMB: recording.getSizeMB().toFixed(2),
          });
          resolve();
        };

        request.onerror = () => {
          this.logger.error('Failed to save recording to IndexedDB', {
            id: recording.getId(),
            automationResultId: recording.getAutomationResultId(),
            tabId: recording.getTabId(),
            status: recording.getStatus(),
            sizeBytes: recording.getSizeBytes(),
            error: request.error,
          });
          reject(
            request.error instanceof Error ? request.error : new Error('Failed to save recording')
          );
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });

      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Error in save operation', error);
      return Result.failure(error instanceof Error ? error : new Error('Failed to save recording'));
    }
  }

  /**
   * Load a tab recording by ID
   */
  async load(id: string): Promise<Result<TabRecording | null, Error>> {
    try {
      this.logger.info('Loading recording from IndexedDB', { id });

      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);

      const result = await new Promise<TabRecording | null>((resolve, reject) => {
        const request = store.get(id);

        request.onsuccess = () => {
          const data = request.result;
          if (data) {
            // Convert ArrayBuffer back to Blob
            const blobData = this.arrayBufferToBlob(data.blobData, data.mimeType);
            const recordingData: TabRecordingData = {
              ...data,
              blobData,
            };
            this.logger.info('Recording loaded successfully from IndexedDB', {
              id,
              automationResultId: data.automationResultId,
              status: data.status,
              sizeBytes: data.sizeBytes,
            });
            resolve(new TabRecording(recordingData));
          } else {
            this.logger.info('Recording not found in IndexedDB', { id });
            resolve(null);
          }
        };

        request.onerror = () => {
          this.logger.error('Failed to load recording from IndexedDB', {
            id,
            error: request.error,
          });
          reject(
            request.error instanceof Error ? request.error : new Error('Failed to load recording')
          );
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });

      return Result.success(result);
    } catch (error) {
      this.logger.error('Error in load operation', error);
      return Result.failure(error instanceof Error ? error : new Error('Failed to load recording'));
    }
  }

  /**
   * Load a tab recording by automation result ID
   */
  // eslint-disable-next-line max-lines-per-function -- IndexedDB transaction management requires comprehensive logging, Result type extraction with error handling, promise wrapper, and transaction lifecycle management. Splitting would fragment the atomic database operation and reduce code clarity.
  async loadByAutomationResultId(resultId: string): Promise<Result<TabRecording | null, Error>> {
    try {
      this.logger.info('Loading recording by automation result ID from IndexedDB', {
        automationResultId: resultId,
      });

      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('automationResultId');

      const result = await new Promise<TabRecording | null>((resolve, reject) => {
        const request = index.get(resultId);

        request.onsuccess = () => {
          const data = request.result;
          if (data) {
            // Convert ArrayBuffer back to Blob
            const blobData = this.arrayBufferToBlob(data.blobData, data.mimeType);
            const recordingData: TabRecordingData = {
              ...data,
              blobData,
            };
            this.logger.info('Recording loaded successfully by automation result ID', {
              automationResultId: resultId,
              recordingId: data.id,
              status: data.status,
              sizeBytes: data.sizeBytes,
            });
            resolve(new TabRecording(recordingData));
          } else {
            this.logger.info('No recording found for automation result ID', {
              automationResultId: resultId,
            });
            resolve(null);
          }
        };

        request.onerror = () => {
          this.logger.error('Failed to load recording by automation result ID from IndexedDB', {
            automationResultId: resultId,
            error: request.error,
          });
          reject(
            request.error instanceof Error
              ? request.error
              : new Error('Failed to load recording by automation result ID')
          );
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });

      return Result.success(result);
    } catch (error) {
      this.logger.error('Error in loadByAutomationResultId operation', error);
      return Result.failure(
        error instanceof Error
          ? error
          : new Error('Failed to load recording by automation result ID')
      );
    }
  }

  /**
   * Load the latest tab recording for a given automation variables ID
   */
  async loadLatestByAutomationVariablesId(
    variablesId: string
  ): Promise<Result<TabRecording | null, Error>> {
    try {
      // Get all automation results for this variables ID
      const allResultsResult = await this.automationResultRepository.loadAll();
      if (allResultsResult.isFailure) {
        this.logger.error('Failed to load automation results', allResultsResult.error);
        return Result.failure(
          allResultsResult.error ||
            new Error('Failed to load automation results for latest recording lookup')
        );
      }

      const allResults = allResultsResult.value!;
      const resultsForVariables = allResults.filter(
        (result) => result.getAutomationVariablesId() === variablesId
      );

      if (resultsForVariables.length === 0) {
        this.logger.info('No automation results found for variables', { variablesId });
        return Result.success(null);
      }

      // Sort by startFrom descending to get latest
      resultsForVariables.sort((a, b) => {
        const aTime = new Date(a.getStartFrom()).getTime();
        const bTime = new Date(b.getStartFrom()).getTime();
        return bTime - aTime;
      });

      // Try to find a recording for the latest result
      for (const result of resultsForVariables) {
        const recordingResult = await this.loadByAutomationResultId(result.getId());
        if (recordingResult.isFailure) {
          this.logger.error(
            'Failed to load recording by automation result ID',
            recordingResult.error
          );
          continue;
        }
        if (recordingResult.value) {
          return Result.success(recordingResult.value);
        }
      }

      this.logger.info('No recording found for any result of variables', { variablesId });
      return Result.success(null);
    } catch (error) {
      this.logger.error('Error loading latest recording by variables ID', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Error loading latest recording by variables ID')
      );
    }
  }

  /**
   * Load all tab recordings
   */
  async loadAll(): Promise<Result<TabRecording[], Error>> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);

      const recordings = await new Promise<TabRecording[]>((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const recordings = request.result.map((data: unknown) => {
            // Convert ArrayBuffer back to Blob
            const blobData = this.arrayBufferToBlob(data.blobData, data.mimeType);
            const recordingData: TabRecordingData = {
              ...data,
              blobData,
            };
            return new TabRecording(recordingData);
          });
          resolve(recordings);
        };

        request.onerror = () => {
          reject(
            request.error instanceof Error
              ? request.error
              : new Error('Failed to load all recordings')
          );
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });

      return Result.success(recordings);
    } catch (error) {
      this.logger.error('Error in loadAll operation', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load all recordings')
      );
    }
  }

  /**
   * Delete a tab recording by ID
   */
  async delete(id: string): Promise<Result<void, Error>> {
    try {
      this.logger.info('Deleting recording from IndexedDB', { id });

      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);

        request.onsuccess = () => {
          this.logger.info('Recording deleted successfully from IndexedDB', { id });
          resolve();
        };

        request.onerror = () => {
          this.logger.error('Failed to delete recording from IndexedDB', {
            id,
            error: request.error,
          });
          reject(
            request.error instanceof Error ? request.error : new Error('Failed to delete recording')
          );
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });

      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Error in delete operation', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to delete recording')
      );
    }
  }

  /**
   * Delete a tab recording by automation result ID
   */
  async deleteByAutomationResultId(resultId: string): Promise<Result<void, Error>> {
    try {
      const recordingResult = await this.loadByAutomationResultId(resultId);
      if (recordingResult.isFailure) {
        this.logger.error(
          'Failed to load recording for deletion by automation result ID',
          recordingResult.error
        );
        return Result.failure(recordingResult.error!);
      }

      if (recordingResult.value) {
        const deleteResult = await this.delete(recordingResult.value.getId());
        if (deleteResult.isFailure) {
          return Result.failure(deleteResult.error!);
        }
      }

      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Error in deleteByAutomationResultId operation', error);
      return Result.failure(
        error instanceof Error
          ? error
          : new Error('Failed to delete recording by automation result ID')
      );
    }
  }

  /**
   * Delete old recordings older than the retention period
   */
  // eslint-disable-next-line max-lines-per-function -- IndexedDB cursor iteration requires opening database, creating transaction, calculating cutoff date, iterating through all records with cursor.continue(), marking records for deletion, logging results, and proper transaction lifecycle management. The sequential cursor API calls with deletion logic cannot be split without breaking the atomic IndexedDB operation.
  async deleteOldRecordings(retentionDays: number): Promise<Result<number, Error>> {
    try {
      this.logger.info('Starting deletion of old recordings', {
        retentionDays,
      });

      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('startedAt');

      // Calculate cutoff date (recordings older than this will be deleted)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffTimestamp = cutoffDate.toISOString();

      this.logger.info('Calculated cutoff date for old recordings', {
        retentionDays,
        cutoffDate: cutoffTimestamp,
      });

      const deletedCount = await new Promise<number>((resolve, reject) => {
        const request = index.openCursor(); // Ascending order (oldest first)
        const toDelete: string[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;

          if (cursor) {
            const startedAt = cursor.value.startedAt as string;

            // If recording is older than cutoff date, mark for deletion
            if (startedAt < cutoffTimestamp) {
              toDelete.push(cursor.value.id);
              store.delete(cursor.value.id);
            }

            cursor.continue();
          } else {
            // All recordings have been processed
            this.logger.info('Old recordings deleted successfully', {
              deletedCount: toDelete.length,
              retentionDays,
              cutoffDate: cutoffTimestamp,
              deletedIds: toDelete,
            });

            resolve(toDelete.length);
          }
        };

        request.onerror = () => {
          this.logger.error('Failed to delete old recordings from IndexedDB', {
            retentionDays,
            cutoffDate: cutoffTimestamp,
            error: request.error,
          });
          reject(new Error('Failed to delete old recordings'));
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });

      return Result.success(deletedCount);
    } catch (error) {
      this.logger.error('Error in deleteOldRecordings operation', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to delete old recordings')
      );
    }
  }

  /**
   * Get total storage size used by all recordings
   */
  async getStorageSize(): Promise<Result<number, Error>> {
    try {
      const recordingsResult = await this.loadAll();
      if (recordingsResult.isFailure) {
        return Result.failure(recordingsResult.error!);
      }

      const recordings = recordingsResult.value!;
      const totalSize = recordings.reduce((total, rec) => total + rec.getSizeBytes(), 0);
      return Result.success(totalSize);
    } catch (error) {
      this.logger.error('Error in getStorageSize operation', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to get storage size')
      );
    }
  }
}
