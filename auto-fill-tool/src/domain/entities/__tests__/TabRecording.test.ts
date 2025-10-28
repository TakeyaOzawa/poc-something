/**
 * Unit Tests: TabRecording Entity
 * Tests all state transitions, queries, and data access methods
 */

import { TabRecording, RecordingStatus, TabRecordingData } from '../TabRecording';

describe('TabRecording Entity', () => {
  describe('create()', () => {
    it('should create a new TabRecording with IDLE status', () => {
      const recording = TabRecording.create({
        automationResultId: 'result-123',
        tabId: 1,
        bitrate: 2500000,
      });

      expect(recording.getStatus()).toBe(RecordingStatus.IDLE);
      expect(recording.getAutomationResultId()).toBe('result-123');
      expect(recording.getTabId()).toBe(1);
      expect(recording.getBitrate()).toBe(2500000);
      expect(recording.getMimeType()).toBe('video/webm');
      expect(recording.getSizeBytes()).toBe(0);
      expect(recording.getDurationMs()).toBeNull();
      expect(recording.getBlobData()).toBeNull();
      expect(recording.getEndedAt()).toBeNull();
    });

    it('should generate unique IDs', () => {
      const recording1 = TabRecording.create({
        automationResultId: 'result-123',
        tabId: 1,
        bitrate: 2500000,
      });
      const recording2 = TabRecording.create({
        automationResultId: 'result-123',
        tabId: 1,
        bitrate: 2500000,
      });

      expect(recording1.getId()).not.toBe(recording2.getId());
    });

    it('should generate valid UUID v4 format', () => {
      const recording = TabRecording.create({
        automationResultId: 'result-123',
        tabId: 1,
        bitrate: 2500000,
      });

      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(recording.getId()).toMatch(uuidPattern);
    });
  });

  describe('State Transitions', () => {
    describe('start()', () => {
      it('should transition from IDLE to RECORDING', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        });

        const startedRecording = recording.start('test-recorder-id');

        expect(startedRecording.getStatus()).toBe(RecordingStatus.RECORDING);
        expect(startedRecording.getRecorderId()).toBe('test-recorder-id');
        expect(startedRecording.getStartedAt()).toBeTruthy();
        expect(startedRecording.getId()).toBe(recording.getId());
      });

      it('should throw error when starting from non-IDLE status', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        }).start('test-recorder-id');

        expect(() => recording.start('another-id')).toThrow(
          'Cannot start recording from status: recording'
        );
      });

      it('should throw error when starting from STOPPED status', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        })
          .start('test-recorder-id')
          .stop();

        expect(() => recording.start('another-id')).toThrow(
          'Cannot start recording from status: stopped'
        );
      });

      it('should throw error when starting from ERROR status', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        }).markError('Test error');

        expect(() => recording.start('test-recorder-id')).toThrow(
          'Cannot start recording from status: error'
        );
      });
    });

    describe('stop()', () => {
      it('should transition from RECORDING to STOPPED', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        }).start('test-recorder-id');

        const stoppedRecording = recording.stop();

        expect(stoppedRecording.getStatus()).toBe(RecordingStatus.STOPPED);
        expect(stoppedRecording.getEndedAt()).toBeTruthy();
      });

      it('should throw error when stopping from non-RECORDING status', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        });

        expect(() => recording.stop()).toThrow('Cannot stop recording from status: idle');
      });

      it('should throw error when stopping from STOPPED status', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        })
          .start('test-recorder-id')
          .stop();

        expect(() => recording.stop()).toThrow('Cannot stop recording from status: stopped');
      });
    });

    describe('save()', () => {
      it('should transition from STOPPED to SAVED with blob data', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        })
          .start('test-recorder-id')
          .stop();

        const blob = new Blob(['test video data'], { type: 'video/webm' });
        const savedRecording = recording.save(blob);

        expect(savedRecording.getStatus()).toBe(RecordingStatus.SAVED);
        expect(savedRecording.getBlobData()).toBe(blob);
        expect(savedRecording.getSizeBytes()).toBe(blob.size);
        expect(savedRecording.getDurationMs()).toBeGreaterThanOrEqual(0);
      });

      it('should calculate duration correctly', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        }).start('test-recorder-id');

        // Wait a bit
        const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        return wait(10).then(() => {
          const stoppedRecording = recording.stop();
          const blob = new Blob(['test'], { type: 'video/webm' });
          const savedRecording = stoppedRecording.save(blob);

          expect(savedRecording.getDurationMs()).toBeGreaterThanOrEqual(10);
        });
      });

      it('should throw error when saving from non-STOPPED status', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        });

        const blob = new Blob(['test'], { type: 'video/webm' });
        expect(() => recording.save(blob)).toThrow('Cannot save recording from status: idle');
      });

      it('should throw error when saving from RECORDING status', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        }).start('test-recorder-id');

        const blob = new Blob(['test'], { type: 'video/webm' });
        expect(() => recording.save(blob)).toThrow('Cannot save recording from status: recording');
      });

      it('should use existing endedAt when saving', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        })
          .start('test-recorder-id')
          .stop();

        const originalEndedAt = recording.getEndedAt();
        const blob = new Blob(['test'], { type: 'video/webm' });
        const savedRecording = recording.save(blob);

        expect(savedRecording.getEndedAt()).toBe(originalEndedAt);
      });

      it('should handle very short duration when saving', () => {
        const now = new Date().toISOString();
        const data: TabRecordingData = {
          id: 'test-id',
          automationResultId: 'result-123',
          tabId: 1,
          recorderId: null,
          status: RecordingStatus.STOPPED,
          startedAt: now,
          endedAt: now,
          blobData: null,
          mimeType: 'video/webm',
          sizeBytes: 0,
          durationMs: null,
          bitrate: 2500000,
        };
        const recording = new TabRecording(data);
        const blob = new Blob(['test'], { type: 'video/webm' });
        const savedRecording = recording.save(blob);

        // Duration should be 0 or very small when start and end are same
        expect(savedRecording.getDurationMs()).toBeLessThanOrEqual(1);
      });
    });

    describe('markError()', () => {
      it('should transition to ERROR from any status', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        });

        const errorRecording = recording.markError('Test error message');

        expect(errorRecording.getStatus()).toBe(RecordingStatus.ERROR);
        expect(errorRecording.getErrorMessage()).toBe('Test error message');
        expect(errorRecording.getEndedAt()).toBeTruthy();
      });

      it('should preserve endedAt if already set', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        })
          .start('test-recorder-id')
          .stop();

        const originalEndedAt = recording.getEndedAt();
        const errorRecording = recording.markError('Error after stop');

        expect(errorRecording.getEndedAt()).toBe(originalEndedAt);
      });

      it('should work from RECORDING status', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        }).start('test-recorder-id');

        const errorRecording = recording.markError('Recording failed');

        expect(errorRecording.getStatus()).toBe(RecordingStatus.ERROR);
      });
    });
  });

  describe('Query Methods', () => {
    describe('isRecording()', () => {
      it('should return true when status is RECORDING', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        }).start('test-recorder-id');

        expect(recording.isRecording()).toBe(true);
      });

      it('should return false when status is not RECORDING', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        });

        expect(recording.isRecording()).toBe(false);
      });
    });

    describe('isStopped()', () => {
      it('should return true when status is STOPPED', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        })
          .start('test-recorder-id')
          .stop();

        expect(recording.isStopped()).toBe(true);
      });

      it('should return false when status is not STOPPED', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        }).start('test-recorder-id');

        expect(recording.isStopped()).toBe(false);
      });
    });

    describe('isSaved()', () => {
      it('should return true when status is SAVED', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        })
          .start('test-recorder-id')
          .stop()
          .save(new Blob(['test'], { type: 'video/webm' }));

        expect(recording.isSaved()).toBe(true);
      });

      it('should return false when status is not SAVED', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        })
          .start('test-recorder-id')
          .stop();

        expect(recording.isSaved()).toBe(false);
      });
    });

    describe('hasError()', () => {
      it('should return true when status is ERROR', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        }).markError('Test error');

        expect(recording.hasError()).toBe(true);
      });

      it('should return false when status is not ERROR', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        });

        expect(recording.hasError()).toBe(false);
      });
    });

    describe('getDurationSeconds()', () => {
      it('should return null when durationMs is null', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        });

        expect(recording.getDurationSeconds()).toBeNull();
      });

      it('should return duration in seconds', () => {
        const data: TabRecordingData = {
          id: 'test-id',
          automationResultId: 'result-123',
          tabId: 1,
          recorderId: null,
          status: RecordingStatus.SAVED,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          blobData: new Blob(['test'], { type: 'video/webm' }),
          mimeType: 'video/webm',
          sizeBytes: 1000,
          durationMs: 5500,
          bitrate: 2500000,
        };
        const recording = new TabRecording(data);

        expect(recording.getDurationSeconds()).toBe(6); // Rounded from 5.5
      });
    });

    describe('getSizeMB()', () => {
      it('should return size in MB', () => {
        const data: TabRecordingData = {
          id: 'test-id',
          automationResultId: 'result-123',
          tabId: 1,
          recorderId: null,
          status: RecordingStatus.SAVED,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          blobData: new Blob(['test'], { type: 'video/webm' }),
          mimeType: 'video/webm',
          sizeBytes: 1024 * 1024 * 2.5, // 2.5 MB
          durationMs: 5000,
          bitrate: 2500000,
        };
        const recording = new TabRecording(data);

        expect(recording.getSizeMB()).toBe(2.5);
      });

      it('should return 0 for empty recording', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        });

        expect(recording.getSizeMB()).toBe(0);
      });
    });
  });

  describe('Getters', () => {
    it('should get all properties correctly', () => {
      const blob = new Blob(['test'], { type: 'video/webm' });
      const data: TabRecordingData = {
        id: 'test-id-123',
        automationResultId: 'result-456',
        tabId: 5,
        recorderId: 'recorder-789',
        status: RecordingStatus.SAVED,
        startedAt: '2025-01-01T00:00:00Z',
        endedAt: '2025-01-01T00:01:00Z',
        blobData: blob,
        mimeType: 'video/webm',
        sizeBytes: 12345,
        durationMs: 60000,
        bitrate: 3000000,
        errorMessage: 'Test error',
      };
      const recording = new TabRecording(data);

      expect(recording.getId()).toBe('test-id-123');
      expect(recording.getAutomationResultId()).toBe('result-456');
      expect(recording.getTabId()).toBe(5);
      expect(recording.getRecorderId()).toBe('recorder-789');
      expect(recording.getStatus()).toBe(RecordingStatus.SAVED);
      expect(recording.getStartedAt()).toBe('2025-01-01T00:00:00Z');
      expect(recording.getEndedAt()).toBe('2025-01-01T00:01:00Z');
      expect(recording.getBlobData()).toBe(blob);
      expect(recording.getMimeType()).toBe('video/webm');
      expect(recording.getSizeBytes()).toBe(12345);
      expect(recording.getDurationMs()).toBe(60000);
      expect(recording.getBitrate()).toBe(3000000);
      expect(recording.getErrorMessage()).toBe('Test error');
    });
  });

  describe('toData()', () => {
    it('should return a copy of data', () => {
      const recording = TabRecording.create({
        automationResultId: 'result-123',
        tabId: 1,
        bitrate: 2500000,
      });

      const data = recording.toData();

      expect(data.automationResultId).toBe('result-123');
      expect(data.tabId).toBe(1);
      expect(data.bitrate).toBe(2500000);
    });

    it('should return independent copy', () => {
      const recording = TabRecording.create({
        automationResultId: 'result-123',
        tabId: 1,
        bitrate: 2500000,
      });

      const data1 = recording.toData();
      const data2 = recording.toData();

      expect(data1).not.toBe(data2);
      expect(data1).toEqual(data2);
    });
  });

  describe('Validation', () => {
    const validData: TabRecordingData = {
      id: 'test-id-123',
      automationResultId: 'result-456',
      tabId: 5,
      recorderId: null,
      status: RecordingStatus.IDLE,
      startedAt: '2025-01-01T00:00:00Z',
      endedAt: null,
      blobData: null,
      mimeType: 'video/webm',
      sizeBytes: 0,
      durationMs: null,
      bitrate: 2500000,
    };

    describe('constructor validation', () => {
      it('should throw error for empty id', () => {
        expect(() => new TabRecording({ ...validData, id: '' })).toThrow(
          'Recording ID must not be empty'
        );
      });

      it('should throw error for whitespace-only id', () => {
        expect(() => new TabRecording({ ...validData, id: '   ' })).toThrow(
          'Recording ID must not be empty'
        );
      });

      it('should throw error for empty automationResultId', () => {
        expect(() => new TabRecording({ ...validData, automationResultId: '' })).toThrow(
          'Automation result ID must not be empty'
        );
      });

      it('should throw error for whitespace-only automationResultId', () => {
        expect(() => new TabRecording({ ...validData, automationResultId: '   ' })).toThrow(
          'Automation result ID must not be empty'
        );
      });

      it('should throw error for zero tabId', () => {
        expect(() => new TabRecording({ ...validData, tabId: 0 })).toThrow(
          'Tab ID must be a positive integer'
        );
      });

      it('should throw error for negative tabId', () => {
        expect(() => new TabRecording({ ...validData, tabId: -1 })).toThrow(
          'Tab ID must be a positive integer'
        );
      });

      it('should throw error for non-integer tabId', () => {
        expect(() => new TabRecording({ ...validData, tabId: 1.5 })).toThrow(
          'Tab ID must be a positive integer'
        );
      });

      it('should throw error for empty recorderId when provided', () => {
        expect(() => new TabRecording({ ...validData, recorderId: '' })).toThrow(
          'Recorder ID must not be empty when provided'
        );
      });

      it('should throw error for whitespace-only recorderId when provided', () => {
        expect(() => new TabRecording({ ...validData, recorderId: '   ' })).toThrow(
          'Recorder ID must not be empty when provided'
        );
      });

      it('should accept null recorderId', () => {
        expect(() => new TabRecording({ ...validData, recorderId: null })).not.toThrow();
      });

      it('should throw error for empty startedAt', () => {
        expect(() => new TabRecording({ ...validData, startedAt: '' })).toThrow(
          'Started at must not be empty'
        );
      });

      it('should throw error for whitespace-only startedAt', () => {
        expect(() => new TabRecording({ ...validData, startedAt: '   ' })).toThrow(
          'Started at must not be empty'
        );
      });

      it('should throw error for empty endedAt when provided', () => {
        expect(() => new TabRecording({ ...validData, endedAt: '' })).toThrow(
          'Ended at must not be empty when provided'
        );
      });

      it('should throw error for whitespace-only endedAt when provided', () => {
        expect(() => new TabRecording({ ...validData, endedAt: '   ' })).toThrow(
          'Ended at must not be empty when provided'
        );
      });

      it('should accept null endedAt', () => {
        expect(() => new TabRecording({ ...validData, endedAt: null })).not.toThrow();
      });

      it('should throw error for empty mimeType', () => {
        expect(() => new TabRecording({ ...validData, mimeType: '' })).toThrow(
          'MIME type must not be empty'
        );
      });

      it('should throw error for whitespace-only mimeType', () => {
        expect(() => new TabRecording({ ...validData, mimeType: '   ' })).toThrow(
          'MIME type must not be empty'
        );
      });

      it('should throw error for negative sizeBytes', () => {
        expect(() => new TabRecording({ ...validData, sizeBytes: -1 })).toThrow(
          'Size bytes must be non-negative'
        );
      });

      it('should accept zero sizeBytes', () => {
        expect(() => new TabRecording({ ...validData, sizeBytes: 0 })).not.toThrow();
      });

      it('should throw error for negative durationMs when provided', () => {
        expect(() => new TabRecording({ ...validData, durationMs: -1 })).toThrow(
          'Duration must be non-negative'
        );
      });

      it('should accept zero durationMs', () => {
        expect(() => new TabRecording({ ...validData, durationMs: 0 })).not.toThrow();
      });

      it('should accept null durationMs', () => {
        expect(() => new TabRecording({ ...validData, durationMs: null })).not.toThrow();
      });

      it('should throw error for zero bitrate', () => {
        expect(() => new TabRecording({ ...validData, bitrate: 0 })).toThrow(
          'Bitrate must be positive'
        );
      });

      it('should throw error for negative bitrate', () => {
        expect(() => new TabRecording({ ...validData, bitrate: -1 })).toThrow(
          'Bitrate must be positive'
        );
      });

      it('should throw error for ERROR status without errorMessage', () => {
        expect(
          () =>
            new TabRecording({
              ...validData,
              status: RecordingStatus.ERROR,
              errorMessage: undefined,
            })
        ).toThrow('Error message is required when status is ERROR');
      });

      it('should throw error for ERROR status with empty errorMessage', () => {
        expect(
          () =>
            new TabRecording({
              ...validData,
              status: RecordingStatus.ERROR,
              errorMessage: '',
            })
        ).toThrow('Error message is required when status is ERROR');
      });

      it('should throw error for ERROR status with whitespace-only errorMessage', () => {
        expect(
          () =>
            new TabRecording({
              ...validData,
              status: RecordingStatus.ERROR,
              errorMessage: '   ',
            })
        ).toThrow('Error message is required when status is ERROR');
      });

      it('should accept ERROR status with valid errorMessage', () => {
        expect(
          () =>
            new TabRecording({
              ...validData,
              status: RecordingStatus.ERROR,
              errorMessage: 'Test error',
            })
        ).not.toThrow();
      });

      it('should accept all valid data', () => {
        expect(() => new TabRecording(validData)).not.toThrow();
      });

      it('should accept valid data with all optional fields', () => {
        const fullData: TabRecordingData = {
          ...validData,
          recorderId: 'recorder-123',
          endedAt: '2025-01-01T00:01:00Z',
          blobData: new Blob(['test'], { type: 'video/webm' }),
          sizeBytes: 1000,
          durationMs: 60000,
        };
        expect(() => new TabRecording(fullData)).not.toThrow();
      });
    });

    describe('create() validation', () => {
      it('should throw error for empty automationResultId', () => {
        expect(() =>
          TabRecording.create({
            automationResultId: '',
            tabId: 1,
            bitrate: 2500000,
          })
        ).toThrow('Automation result ID must not be empty');
      });

      it('should throw error for zero tabId', () => {
        expect(() =>
          TabRecording.create({
            automationResultId: 'result-123',
            tabId: 0,
            bitrate: 2500000,
          })
        ).toThrow('Tab ID must be a positive integer');
      });

      it('should throw error for negative tabId', () => {
        expect(() =>
          TabRecording.create({
            automationResultId: 'result-123',
            tabId: -1,
            bitrate: 2500000,
          })
        ).toThrow('Tab ID must be a positive integer');
      });

      it('should throw error for zero bitrate', () => {
        expect(() =>
          TabRecording.create({
            automationResultId: 'result-123',
            tabId: 1,
            bitrate: 0,
          })
        ).toThrow('Bitrate must be positive');
      });

      it('should throw error for negative bitrate', () => {
        expect(() =>
          TabRecording.create({
            automationResultId: 'result-123',
            tabId: 1,
            bitrate: -1,
          })
        ).toThrow('Bitrate must be positive');
      });
    });

    describe('start() validation', () => {
      it('should throw error for empty recorderId', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        });

        expect(() => recording.start('')).toThrow('Recorder ID must not be empty when provided');
      });

      it('should throw error for whitespace-only recorderId', () => {
        const recording = TabRecording.create({
          automationResultId: 'result-123',
          tabId: 1,
          bitrate: 2500000,
        });

        expect(() => recording.start('   ')).toThrow('Recorder ID must not be empty when provided');
      });
    });
  });
});
