import { OffscreenPresenter } from '../OffscreenPresenter';
import type { OffscreenView, StartRecordingRequest, StopRecordingRequest } from '../../types';
import { OFFSCREEN_MESSAGES } from '../../types';
import browser from 'webextension-polyfill';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('OffscreenPresenter', () => {
  let presenter: OffscreenPresenter;
  let mockView: jest.Mocked<OffscreenView>;
  let mockMediaRecorder: MediaRecorder;
  let mockMediaStream: MediaStream;

  beforeEach(() => {
    // Mock MediaRecorder
    mockMediaRecorder = {
      state: 'recording',
      start: jest.fn(),
      stop: jest.fn(),
      mimeType: 'video/webm;codecs=vp9',
    } as any;

    // Mock MediaStream
    mockMediaStream = {
      getTracks: jest.fn().mockReturnValue([]),
    } as any;

    // Mock View
    mockView = {
      createMediaRecorder: jest.fn().mockResolvedValue({
        recorder: mockMediaRecorder,
        stream: mockMediaStream,
      }),
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      stopStream: jest.fn(),
      createBlob: jest.fn().mockReturnValue({
        size: 1024,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
      }),
      blobToArrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    };

    presenter = new OffscreenPresenter({ view: mockView });

    // Clear mock calls
    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should register message listener', () => {
      presenter.init();

      expect(browser.runtime.onMessage.addListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle START_RECORDING message', async () => {
      presenter.init();

      const listenerCallback = (browser.runtime.onMessage.addListener as jest.Mock).mock
        .calls[0][0];
      const sendResponse = jest.fn();

      const message: StartRecordingRequest = {
        action: OFFSCREEN_MESSAGES.START_RECORDING,
        recorderId: 'rec-1',
        tabId: 123,
        streamId: 'stream-id',
        config: { audio: true, video: true },
      };

      const result = listenerCallback(message, {}, sendResponse);

      expect(result).toBe(true); // Async response
      await new Promise(process.nextTick);
      expect(sendResponse).toHaveBeenCalled();
    });

    it('should handle STOP_RECORDING message', async () => {
      // First, start a recording
      const startRequest: StartRecordingRequest = {
        action: OFFSCREEN_MESSAGES.START_RECORDING,
        recorderId: 'rec-1',
        tabId: 123,
        streamId: 'stream-id',
        config: { audio: true, video: true },
      };
      await presenter.handleStartRecording(startRequest);

      presenter.init();

      const listenerCallback = (browser.runtime.onMessage.addListener as jest.Mock).mock
        .calls[0][0];
      const sendResponse = jest.fn();

      const message: StopRecordingRequest = {
        action: OFFSCREEN_MESSAGES.STOP_RECORDING,
        recorderId: 'rec-1',
      };

      // Mock stopRecording to invoke callback immediately
      mockView.stopRecording.mockImplementation((_recorder, onStopped) => {
        onStopped();
      });

      const result = listenerCallback(message, {}, sendResponse);

      expect(result).toBe(true); // Async response
    });

    it('should ignore invalid messages', () => {
      presenter.init();

      const listenerCallback = (browser.runtime.onMessage.addListener as jest.Mock).mock
        .calls[0][0];
      const sendResponse = jest.fn();

      const result = listenerCallback({ invalid: 'message' }, {}, sendResponse);

      expect(result).toBe(true); // Always returns true for async handling
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });

  describe('handleStartRecording', () => {
    const request: StartRecordingRequest = {
      action: OFFSCREEN_MESSAGES.START_RECORDING,
      recorderId: 'rec-1',
      tabId: 123,
      streamId: 'stream-id',
      config: {
        audio: true,
        video: true,
        videoBitsPerSecond: 2500000,
      },
    };

    it('should create and start MediaRecorder', async () => {
      const result = await presenter.handleStartRecording(request);

      expect(mockView.createMediaRecorder).toHaveBeenCalledWith(
        request.streamId,
        request.config,
        expect.any(Function), // onDataAvailable
        expect.any(Function) // onError
      );
      expect(mockView.startRecording).toHaveBeenCalledWith(mockMediaRecorder);
      expect(result.success).toBe(true);
    });

    it('should send RECORDING_STARTED message to background', async () => {
      await presenter.handleStartRecording(request);

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: OFFSCREEN_MESSAGES.RECORDING_STARTED,
        recorderId: request.recorderId,
        tabId: request.tabId,
      });
    });

    it('should handle onDataAvailable callback', async () => {
      await presenter.handleStartRecording(request);

      const onDataAvailable = (mockView.createMediaRecorder as jest.Mock).mock.calls[0][2];
      const mockChunk = { size: 100 } as Blob;

      // Should not throw
      expect(() => onDataAvailable(mockChunk)).not.toThrow();
    });

    it('should handle onError callback', async () => {
      await presenter.handleStartRecording(request);

      const onError = (mockView.createMediaRecorder as jest.Mock).mock.calls[0][3];

      onError('Test error');

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: OFFSCREEN_MESSAGES.RECORDING_ERROR,
        recorderId: request.recorderId,
        error: 'Test error',
      });
    });

    it('should throw error if recording already exists', async () => {
      await presenter.handleStartRecording(request);

      await expect(presenter.handleStartRecording(request)).rejects.toThrow(
        `Recording ${request.recorderId} already exists`
      );
    });

    it('should send RECORDING_ERROR message on failure', async () => {
      mockView.createMediaRecorder.mockRejectedValue(new Error('Failed to create recorder'));

      await expect(presenter.handleStartRecording(request)).rejects.toThrow(
        'Failed to create recorder'
      );

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: OFFSCREEN_MESSAGES.RECORDING_ERROR,
        recorderId: request.recorderId,
        error: 'Failed to create recorder',
      });
    });

    it('should handle unknown error types', async () => {
      mockView.createMediaRecorder.mockRejectedValue('String error');

      await expect(presenter.handleStartRecording(request)).rejects.toBe('String error');

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: OFFSCREEN_MESSAGES.RECORDING_ERROR,
        recorderId: request.recorderId,
        error: 'Unknown error',
      });
    });
  });

  describe('handleStopRecording', () => {
    const startRequest: StartRecordingRequest = {
      action: OFFSCREEN_MESSAGES.START_RECORDING,
      recorderId: 'rec-1',
      tabId: 123,
      streamId: 'stream-id',
      config: { audio: true, video: true },
    };

    const stopRequest: StopRecordingRequest = {
      action: OFFSCREEN_MESSAGES.STOP_RECORDING,
      recorderId: 'rec-1',
    };

    beforeEach(async () => {
      // Start a recording first
      await presenter.handleStartRecording(startRequest);
      jest.clearAllMocks();
    });

    it('should stop MediaRecorder and stream', async () => {
      // Mock stopRecording to invoke callback immediately
      mockView.stopRecording.mockImplementation((_recorder, onStopped) => {
        onStopped();
      });

      const result = await presenter.handleStopRecording(stopRequest);

      expect(mockView.stopRecording).toHaveBeenCalledWith(mockMediaRecorder, expect.any(Function));
      expect(mockView.stopStream).toHaveBeenCalledWith(mockMediaStream);
      expect(result.success).toBe(true);
    });

    it('should create blob from chunks', async () => {
      mockView.stopRecording.mockImplementation((_recorder, onStopped) => {
        onStopped();
      });

      await presenter.handleStopRecording(stopRequest);

      expect(mockView.createBlob).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should send RECORDING_STOPPED message with blob data', async () => {
      mockView.stopRecording.mockImplementation((_recorder, onStopped) => {
        onStopped();
      });

      const mockArrayBuffer = new ArrayBuffer(1024);
      mockView.blobToArrayBuffer.mockResolvedValue(mockArrayBuffer);

      await presenter.handleStopRecording(stopRequest);

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: OFFSCREEN_MESSAGES.RECORDING_STOPPED,
        recorderId: stopRequest.recorderId,
        blobData: mockArrayBuffer,
        blobSize: 1024,
      });
    });

    it('should clean up recording state', async () => {
      mockView.stopRecording.mockImplementation((_recorder, onStopped) => {
        onStopped();
      });

      await presenter.handleStopRecording(stopRequest);

      // Try to stop again - should throw "not found" error
      await expect(presenter.handleStopRecording(stopRequest)).rejects.toThrow(
        `Recording ${stopRequest.recorderId} not found`
      );
    });

    it('should throw error if recording not found', async () => {
      const invalidRequest: StopRecordingRequest = {
        action: OFFSCREEN_MESSAGES.STOP_RECORDING,
        recorderId: 'non-existent',
      };

      await expect(presenter.handleStopRecording(invalidRequest)).rejects.toThrow(
        'Recording non-existent not found'
      );
    });

    it('should return blob in result', async () => {
      mockView.stopRecording.mockImplementation((_recorder, onStopped) => {
        onStopped();
      });

      const result = await presenter.handleStopRecording(stopRequest);

      expect(result.blob).toBeDefined();
      expect(result.blob?.size).toBe(1024);
    });
  });

  describe('Multiple recordings', () => {
    it('should handle multiple concurrent recordings', async () => {
      const request1: StartRecordingRequest = {
        action: OFFSCREEN_MESSAGES.START_RECORDING,
        recorderId: 'rec-1',
        tabId: 123,
        streamId: 'stream-1',
        config: { audio: true, video: true },
      };

      const request2: StartRecordingRequest = {
        action: OFFSCREEN_MESSAGES.START_RECORDING,
        recorderId: 'rec-2',
        tabId: 456,
        streamId: 'stream-2',
        config: { audio: true, video: false },
      };

      await presenter.handleStartRecording(request1);
      await presenter.handleStartRecording(request2);

      expect(mockView.createMediaRecorder).toHaveBeenCalledTimes(2);
      expect(mockView.startRecording).toHaveBeenCalledTimes(2);
    });

    it('should stop specific recording without affecting others', async () => {
      const request1: StartRecordingRequest = {
        action: OFFSCREEN_MESSAGES.START_RECORDING,
        recorderId: 'rec-1',
        tabId: 123,
        streamId: 'stream-1',
        config: { audio: true, video: true },
      };

      const request2: StartRecordingRequest = {
        action: OFFSCREEN_MESSAGES.START_RECORDING,
        recorderId: 'rec-2',
        tabId: 456,
        streamId: 'stream-2',
        config: { audio: true, video: false },
      };

      await presenter.handleStartRecording(request1);
      await presenter.handleStartRecording(request2);

      jest.clearAllMocks();

      mockView.stopRecording.mockImplementation((_recorder, onStopped) => {
        onStopped();
      });

      await presenter.handleStopRecording({
        action: OFFSCREEN_MESSAGES.STOP_RECORDING,
        recorderId: 'rec-1',
      });

      // rec-2 should still be active - can stop it without error
      await expect(
        presenter.handleStopRecording({
          action: OFFSCREEN_MESSAGES.STOP_RECORDING,
          recorderId: 'rec-2',
        })
      ).resolves.toBeDefined();
    });
  });
});
