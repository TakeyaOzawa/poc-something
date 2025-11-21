import type {
  OffscreenView as OffscreenViewInterface,
  RecordingConfig,
} from '../types/offscreen.types';

/**
 * View implementation for Offscreen Document
 * Handles MediaRecorder API and MediaStream operations
 * No business logic - only MediaRecorder/MediaStream concerns
 */
export class OffscreenView implements OffscreenViewInterface {
  /**
   * Create and start a MediaRecorder for tab capture
   */
  // eslint-disable-next-line max-lines-per-function -- MediaRecorder setup requires sequential API calls (getUserMedia, MediaRecorder constructor, event handler setup, options configuration) with extensive constraint building and error handling. The setup logic is cohesive and splitting would require complex state management.
  public async createMediaRecorder(
    streamId: string,
    config: RecordingConfig,
    onDataAvailable: (chunk: Blob) => void,
    onError: (error: string) => void
  ): Promise<{
    recorder: MediaRecorder;
    stream: MediaStream;
  }> {
    // Build constraints for getUserMedia
    const constraints: MediaStreamConstraints = {
      audio: config.audio
        ? ({
            mandatory: {
              chromeMediaSource: 'tab',
              chromeMediaSourceId: streamId,
            },
          } as unknown)
        : false,
      video: config.video
        ? ({
            mandatory: {
              chromeMediaSource: 'tab',
              chromeMediaSourceId: streamId,
            },
          } as unknown)
        : false,
    };

    // Get media stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    console.log('[OffscreenView] Tab stream captured', {
      streamId,
      audioTracks: stream.getAudioTracks().length,
      videoTracks: stream.getVideoTracks().length,
    });

    // Create MediaRecorder options
    const options: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp9',
    };

    if (config.videoBitsPerSecond) {
      options.videoBitsPerSecond = config.videoBitsPerSecond;
    }

    // Create MediaRecorder instance
    const recorder = new MediaRecorder(stream, options);

    // Set up event handlers
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        onDataAvailable(event.data);
      }
    };

    recorder.onerror = (event) => {
      console.error('[OffscreenView] MediaRecorder error', event);
      onError('MediaRecorder error occurred');
    };

    console.log('[OffscreenView] MediaRecorder created', {
      mimeType: recorder.mimeType,
      videoBitsPerSecond: recorder.videoBitsPerSecond,
    });

    return { recorder, stream };
  }

  /**
   * Start the MediaRecorder
   */
  public startRecording(recorder: MediaRecorder, timeslice = 1000): void {
    recorder.start(timeslice);
    console.log('[OffscreenView] MediaRecorder started', {
      state: recorder.state,
    });
  }

  /**
   * Stop the MediaRecorder
   */
  public stopRecording(recorder: MediaRecorder, onStopped: () => void): void {
    if (recorder.state === 'recording') {
      recorder.onstop = onStopped;
      recorder.stop();
    } else {
      // Already stopped - invoke callback immediately
      onStopped();
    }
  }

  /**
   * Stop all tracks in a MediaStream
   */
  public stopStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => track.stop());
    console.log('[OffscreenView] MediaStream tracks stopped');
  }

  /**
   * Create a Blob from recording chunks
   */
  public createBlob(chunks: Blob[]): Blob {
    const blob = new Blob(chunks, { type: 'video/webm' });
    console.log('[OffscreenView] Blob created', {
      size: blob.size,
      chunksCount: chunks.length,
    });
    return blob;
  }

  /**
   * Convert Blob to ArrayBuffer for message passing
   */
  public async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return await blob.arrayBuffer();
  }
}
