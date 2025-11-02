import { OffscreenView } from '../OffscreenView';
import type { RecordingConfig } from '../../types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('OffscreenView', () => {
  let view: OffscreenView;
  let mockMediaStream: MediaStream;
  let mockMediaRecorder: MediaRecorder;
  let mockGetUserMedia: jest.Mock;
  let mockTrack: MediaStreamTrack;

  beforeEach(() => {
    // Mock MediaStreamTrack
    mockTrack = {
      stop: jest.fn(),
    } as any;

    // Mock MediaStream
    mockMediaStream = {
      getAudioTracks: jest.fn().mockReturnValue([mockTrack]),
      getVideoTracks: jest.fn().mockReturnValue([mockTrack]),
      getTracks: jest.fn().mockReturnValue([mockTrack, mockTrack]),
    } as any;

    // Mock MediaRecorder
    mockMediaRecorder = {
      start: jest.fn(),
      stop: jest.fn(),
      state: 'inactive',
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000,
      ondataavailable: null,
      onerror: null,
      onstop: null,
    } as any;

    // Mock getUserMedia
    mockGetUserMedia = jest.fn().mockResolvedValue(mockMediaStream);
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });

    // Mock MediaRecorder constructor
    global.MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder) as any;

    // Mock Blob
    global.Blob = jest.fn().mockImplementation((chunks, options) => {
      return {
        size: chunks.reduce((sum: number, chunk: any) => sum + (chunk.size || 100), 0),
        type: options.type,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
      };
    }) as any;

    view = new OffscreenView();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMediaRecorder', () => {
    const config: RecordingConfig = {
      audio: true,
      video: true,
      videoBitsPerSecond: 2500000,
    };
    const streamId = 'test-stream-id';
    const onDataAvailable = jest.fn();
    const onError = jest.fn();

    it('should create MediaRecorder with correct constraints', async () => {
      const result = await view.createMediaRecorder(streamId, config, onDataAvailable, onError);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId,
          },
        },
        video: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId,
          },
        },
      });

      expect(result.recorder).toBe(mockMediaRecorder);
      expect(result.stream).toBe(mockMediaStream);
    });

    it('should create MediaRecorder with audio only', async () => {
      const audioOnlyConfig: RecordingConfig = {
        audio: true,
        video: false,
      };

      await view.createMediaRecorder(streamId, audioOnlyConfig, onDataAvailable, onError);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId,
          },
        },
        video: false,
      });
    });

    it('should create MediaRecorder with video only', async () => {
      const videoOnlyConfig: RecordingConfig = {
        audio: false,
        video: true,
      };

      await view.createMediaRecorder(streamId, videoOnlyConfig, onDataAvailable, onError);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId,
          },
        },
      });
    });

    it('should pass videoBitsPerSecond to MediaRecorder options', async () => {
      await view.createMediaRecorder(streamId, config, onDataAvailable, onError);

      expect(MediaRecorder).toHaveBeenCalledWith(mockMediaStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000,
      });
    });

    it('should not include videoBitsPerSecond if not provided', async () => {
      const configWithoutBitrate: RecordingConfig = {
        audio: true,
        video: true,
      };

      await view.createMediaRecorder(streamId, configWithoutBitrate, onDataAvailable, onError);

      expect(MediaRecorder).toHaveBeenCalledWith(mockMediaStream, {
        mimeType: 'video/webm;codecs=vp9',
      });
    });

    it('should set up ondataavailable handler', async () => {
      await view.createMediaRecorder(streamId, config, onDataAvailable, onError);

      expect(mockMediaRecorder.ondataavailable).toBeDefined();

      // Simulate data available event
      const mockEvent = { data: { size: 100 } };
      mockMediaRecorder.ondataavailable!(mockEvent as any);

      expect(onDataAvailable).toHaveBeenCalledWith(mockEvent.data);
    });

    it('should not call onDataAvailable for empty chunks', async () => {
      await view.createMediaRecorder(streamId, config, onDataAvailable, onError);

      // Simulate data available event with zero size
      const mockEvent = { data: { size: 0 } };
      mockMediaRecorder.ondataavailable!(mockEvent as any);

      expect(onDataAvailable).not.toHaveBeenCalled();
    });

    it('should set up onerror handler', async () => {
      await view.createMediaRecorder(streamId, config, onDataAvailable, onError);

      expect(mockMediaRecorder.onerror).toBeDefined();

      // Simulate error event
      const mockEvent = new Event('error');
      mockMediaRecorder.onerror!(mockEvent as any);

      expect(onError).toHaveBeenCalledWith('MediaRecorder error occurred');
    });

    it('should throw error if getUserMedia fails', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      await expect(
        view.createMediaRecorder(streamId, config, onDataAvailable, onError)
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('startRecording', () => {
    it('should start MediaRecorder with default timeslice', () => {
      view.startRecording(mockMediaRecorder);

      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
    });

    it('should start MediaRecorder with custom timeslice', () => {
      view.startRecording(mockMediaRecorder, 500);

      expect(mockMediaRecorder.start).toHaveBeenCalledWith(500);
    });
  });

  describe('stopRecording', () => {
    it('should stop MediaRecorder when recording', () => {
      Object.defineProperty(mockMediaRecorder, 'state', { value: 'recording', writable: true });
      const onStopped = jest.fn();

      view.stopRecording(mockMediaRecorder, onStopped);

      expect(mockMediaRecorder.stop).toHaveBeenCalled();
      expect(mockMediaRecorder.onstop).toBe(onStopped);
    });

    it('should invoke callback immediately if already stopped', () => {
      Object.defineProperty(mockMediaRecorder, 'state', { value: 'inactive', writable: true });
      const onStopped = jest.fn();

      view.stopRecording(mockMediaRecorder, onStopped);

      expect(mockMediaRecorder.stop).not.toHaveBeenCalled();
      expect(onStopped).toHaveBeenCalled();
    });
  });

  describe('stopStream', () => {
    it('should stop all tracks in the stream', () => {
      view.stopStream(mockMediaStream);

      expect(mockMediaStream.getTracks).toHaveBeenCalled();
      expect(mockTrack.stop).toHaveBeenCalledTimes(2);
    });
  });

  describe('createBlob', () => {
    it('should create Blob from chunks', () => {
      const chunks = [{ size: 100 } as Blob, { size: 200 } as Blob, { size: 300 } as Blob];

      const blob = view.createBlob(chunks);

      expect(Blob).toHaveBeenCalledWith(chunks, { type: 'video/webm' });
      expect(blob.size).toBe(600);
    });

    it('should create Blob with zero size for empty chunks', () => {
      const blob = view.createBlob([]);

      expect(blob.size).toBe(0);
    });
  });

  describe('blobToArrayBuffer', () => {
    it('should convert Blob to ArrayBuffer', async () => {
      const mockBlob = {
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
      } as any;

      const result = await view.blobToArrayBuffer(mockBlob);

      expect(mockBlob.arrayBuffer).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(1024);
    });
  });
});
