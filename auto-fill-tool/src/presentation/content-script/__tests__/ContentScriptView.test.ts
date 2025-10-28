/**
 * Unit Tests: ContentScriptView
 */

import { AutoFillToolContentScriptView } from '../ContentScriptView';
import { AutoFillOverlay } from '../AutoFillOverlay';

jest.mock('../AutoFillOverlay');

describe('ContentScriptView', () => {
  let mockOverlay: jest.Mocked<AutoFillOverlay>;
  let view: AutoFillToolContentScriptView;
  let dispatchEventSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock AutoFillOverlay
    mockOverlay = {
      show: jest.fn(),
      hide: jest.fn(),
      updateProgress: jest.fn(),
      updateStepDescription: jest.fn(),
    } as any;

    // Spy on document.dispatchEvent
    dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');

    view = new AutoFillToolContentScriptView(mockOverlay);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should store overlay dependency', () => {
      expect(view).toBeDefined();
      expect(view).toBeInstanceOf(AutoFillToolContentScriptView);
    });
  });

  describe('showOverlay', () => {
    it('should show overlay with cancel button', () => {
      view.showOverlay(true);

      expect(mockOverlay.show).toHaveBeenCalledWith(undefined, true);
      expect(mockOverlay.show).toHaveBeenCalledTimes(1);
    });

    it('should show overlay without cancel button', () => {
      view.showOverlay(false);

      expect(mockOverlay.show).toHaveBeenCalledWith(undefined, false);
      expect(mockOverlay.show).toHaveBeenCalledTimes(1);
    });
  });

  describe('hideOverlay', () => {
    it('should hide overlay', () => {
      view.hideOverlay();

      expect(mockOverlay.hide).toHaveBeenCalledTimes(1);
    });

    it('should hide overlay multiple times', () => {
      view.hideOverlay();
      view.hideOverlay();
      view.hideOverlay();

      expect(mockOverlay.hide).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateProgress', () => {
    it('should update progress with current and total', () => {
      view.updateProgress(5, 10);

      expect(mockOverlay.updateProgress).toHaveBeenCalledWith(5, 10);
      expect(mockOverlay.updateProgress).toHaveBeenCalledTimes(1);
    });

    it('should update progress at start (0/10)', () => {
      view.updateProgress(0, 10);

      expect(mockOverlay.updateProgress).toHaveBeenCalledWith(0, 10);
    });

    it('should update progress at completion (10/10)', () => {
      view.updateProgress(10, 10);

      expect(mockOverlay.updateProgress).toHaveBeenCalledWith(10, 10);
    });

    it('should update progress with large numbers', () => {
      view.updateProgress(50, 100);

      expect(mockOverlay.updateProgress).toHaveBeenCalledWith(50, 100);
    });
  });

  describe('updateStepDescription', () => {
    it('should update step description', () => {
      const description = 'Processing form fields';

      view.updateStepDescription(description);

      expect(mockOverlay.updateStepDescription).toHaveBeenCalledWith(description);
      expect(mockOverlay.updateStepDescription).toHaveBeenCalledTimes(1);
    });

    it('should update step description with empty string', () => {
      view.updateStepDescription('');

      expect(mockOverlay.updateStepDescription).toHaveBeenCalledWith('');
    });

    it('should update step description with long text', () => {
      const longDescription = 'A'.repeat(200);

      view.updateStepDescription(longDescription);

      expect(mockOverlay.updateStepDescription).toHaveBeenCalledWith(longDescription);
    });
  });

  describe('dispatchProgressEvent', () => {
    it('should dispatch custom event with progress details', () => {
      view.dispatchProgressEvent(5, 10, 'Step description');

      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);

      const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe('auto-fill-progress-update');
      expect(event.detail).toEqual({
        current: 5,
        total: 10,
        description: 'Step description',
      });
    });

    it('should dispatch custom event without description', () => {
      view.dispatchProgressEvent(3, 7);

      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);

      const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({
        current: 3,
        total: 7,
        description: undefined,
      });
    });

    it('should dispatch custom event with zero progress', () => {
      view.dispatchProgressEvent(0, 0);

      const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({
        current: 0,
        total: 0,
        description: undefined,
      });
    });

    it('should dispatch custom event with completion progress', () => {
      view.dispatchProgressEvent(10, 10, 'Completed');

      const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({
        current: 10,
        total: 10,
        description: 'Completed',
      });
    });

    it('should dispatch custom event with empty description string', () => {
      view.dispatchProgressEvent(5, 10, '');

      const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({
        current: 5,
        total: 10,
        description: '',
      });
    });
  });

  describe('integration scenarios', () => {
    it('should show overlay, update progress, and dispatch event', () => {
      view.showOverlay(true);
      view.updateProgress(5, 10);
      view.updateStepDescription('Processing');
      view.dispatchProgressEvent(5, 10, 'Processing');

      expect(mockOverlay.show).toHaveBeenCalledWith(undefined, true);
      expect(mockOverlay.updateProgress).toHaveBeenCalledWith(5, 10);
      expect(mockOverlay.updateStepDescription).toHaveBeenCalledWith('Processing');
      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    });

    it('should hide overlay after completion', () => {
      view.showOverlay(false);
      view.updateProgress(10, 10);
      view.hideOverlay();

      expect(mockOverlay.show).toHaveBeenCalledWith(undefined, false);
      expect(mockOverlay.updateProgress).toHaveBeenCalledWith(10, 10);
      expect(mockOverlay.hide).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple progress updates', () => {
      view.showOverlay(true);

      for (let i = 0; i <= 10; i++) {
        view.updateProgress(i, 10);
        view.dispatchProgressEvent(i, 10);
      }

      expect(mockOverlay.updateProgress).toHaveBeenCalledTimes(11);
      expect(dispatchEventSpy).toHaveBeenCalledTimes(11);
    });
  });
});
