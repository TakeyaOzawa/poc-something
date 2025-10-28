/**
 * Unit Tests: ContentScriptPresenter
 */

import { AutoFillToolContentScriptPresenter } from '../ContentScriptPresenter';
import type { ContentScriptView } from '../../types';
import type { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import type { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import { createMockSystemSettings } from '../../../../tests/helpers/MockSystemSettings';

describe('ContentScriptPresenter', () => {
  let mockView: jest.Mocked<ContentScriptView>;
  let mockSystemSettingsRepository: jest.Mocked<SystemSettingsRepository>;
  let mockLogger: jest.Mocked<Logger>;
  let presenter: AutoFillToolContentScriptPresenter;

  beforeEach(() => {
    // Use fake timers for watchdog timeout testing
    jest.useFakeTimers();

    // Mock View
    mockView = {
      showOverlay: jest.fn(),
      hideOverlay: jest.fn(),
      updateProgress: jest.fn(),
      updateStepDescription: jest.fn(),
      dispatchProgressEvent: jest.fn(),
    };

    // Mock SystemSettingsRepository
    const mockSettings = createMockSystemSettings({
      getAutoFillProgressDialogMode: jest.fn().mockReturnValue('default'),
    });
    mockSystemSettingsRepository = {
      load: jest.fn().mockResolvedValue(Result.success(mockSettings)),
      save: jest.fn().mockResolvedValue(Result.success(undefined)),
    } as any;

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    presenter = new AutoFillToolContentScriptPresenter({
      view: mockView,
      systemSettingsRepository: mockSystemSettingsRepository,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should store dependencies', () => {
      expect(presenter).toBeDefined();
      expect(presenter).toBeInstanceOf(AutoFillToolContentScriptPresenter);
    });
  });

  describe('handleProgressUpdate - first update', () => {
    it('should load settings and show overlay with default mode', async () => {
      await presenter.handleProgressUpdate(1, 10, 'Step 1');

      expect(mockSystemSettingsRepository.load).toHaveBeenCalledTimes(1);
      expect(mockView.showOverlay).toHaveBeenCalledWith(false);
      expect(mockView.updateProgress).toHaveBeenCalledWith(1, 10);
      expect(mockView.updateStepDescription).toHaveBeenCalledWith('Step 1');
      expect(mockView.dispatchProgressEvent).toHaveBeenCalledWith(1, 10, 'Step 1');
    });

    it('should show overlay with cancel button when dialogMode is withCancel', async () => {
      const mockSettings = createMockSystemSettings({
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('withCancel'),
      });
      mockSystemSettingsRepository.load.mockResolvedValue(Result.success(mockSettings));

      await presenter.handleProgressUpdate(1, 5, 'Processing');

      expect(mockView.showOverlay).toHaveBeenCalledWith(true);
      expect(mockView.updateProgress).toHaveBeenCalledWith(1, 5);
      expect(mockView.updateStepDescription).toHaveBeenCalledWith('Processing');
    });

    it('should not show overlay when dialogMode is hidden', async () => {
      const mockSettings = createMockSystemSettings({
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('hidden'),
      });
      mockSystemSettingsRepository.load.mockResolvedValue(Result.success(mockSettings));

      await presenter.handleProgressUpdate(1, 10);

      expect(mockView.showOverlay).not.toHaveBeenCalled();
      expect(mockView.updateProgress).not.toHaveBeenCalled();
      expect(mockView.dispatchProgressEvent).toHaveBeenCalledWith(1, 10, undefined);
    });



    it('should handle settings load failure', async () => {
      const error = new Error('Failed to load settings');
      mockSystemSettingsRepository.load.mockResolvedValue(Result.failure(error));

      await presenter.handleProgressUpdate(1, 10, 'Step 1');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load settings for manual execution overlay',
        error
      );
      expect(mockView.showOverlay).not.toHaveBeenCalled();
      expect(mockView.dispatchProgressEvent).toHaveBeenCalledWith(1, 10, 'Step 1');
    });

    it('should set up watchdog timer after first update', async () => {
      await presenter.handleProgressUpdate(1, 10);

      // Verify timer is set (by advancing time and checking no reset yet)
      jest.advanceTimersByTime(5000);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('handleProgressUpdate - subsequent updates', () => {
    beforeEach(async () => {
      // First update to initialize state
      await presenter.handleProgressUpdate(1, 10, 'Step 1');
      jest.clearAllMocks();
    });

    it('should update progress without reloading settings', async () => {
      await presenter.handleProgressUpdate(2, 10, 'Step 2');

      expect(mockSystemSettingsRepository.load).not.toHaveBeenCalled();
      expect(mockView.updateProgress).toHaveBeenCalledWith(2, 10);
      expect(mockView.updateStepDescription).toHaveBeenCalledWith('Step 2');
      expect(mockView.dispatchProgressEvent).toHaveBeenCalledWith(2, 10, 'Step 2');
    });

    it('should update progress without description', async () => {
      await presenter.handleProgressUpdate(3, 10);

      expect(mockView.updateProgress).toHaveBeenCalledWith(3, 10);
      expect(mockView.updateStepDescription).not.toHaveBeenCalled();
      expect(mockView.dispatchProgressEvent).toHaveBeenCalledWith(3, 10, undefined);
    });

    it('should reset watchdog timer on each update', async () => {
      await presenter.handleProgressUpdate(2, 10);
      jest.advanceTimersByTime(5000);

      await presenter.handleProgressUpdate(3, 10);
      jest.advanceTimersByTime(5000);

      // Should not warn because timer was reset
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('handleProgressUpdate - completion', () => {
    beforeEach(async () => {
      // First update to initialize state
      await presenter.handleProgressUpdate(1, 10, 'Step 1');
      jest.clearAllMocks();
    });

    it('should hide overlay after short delay when current >= total', async () => {
      await presenter.handleProgressUpdate(10, 10, 'Completed');

      expect(mockView.updateProgress).toHaveBeenCalledWith(10, 10);
      expect(mockView.updateStepDescription).toHaveBeenCalledWith('Completed');
      expect(mockView.dispatchProgressEvent).toHaveBeenCalledWith(10, 10, 'Completed');
      expect(mockLogger.info).toHaveBeenCalledWith('Auto-fill execution complete, hiding overlay');

      // Advance timer for delay
      jest.advanceTimersByTime(500);

      expect(mockView.hideOverlay).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Resetting manual execution state');
    });

    it('should reset state immediately when overlay is hidden', async () => {
      const mockSettings = createMockSystemSettings({
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('hidden'),
      });
      mockSystemSettingsRepository.load.mockResolvedValue(Result.success(mockSettings));

      // Re-initialize with hidden mode
      presenter = new AutoFillToolContentScriptPresenter({
        view: mockView,
        systemSettingsRepository: mockSystemSettingsRepository,
        logger: mockLogger,
      });

      await presenter.handleProgressUpdate(1, 10);
      jest.clearAllMocks();

      await presenter.handleProgressUpdate(10, 10, 'Completed');

      // No delay for hidden mode
      expect(mockView.hideOverlay).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Resetting manual execution state');
    });
  });

  describe('resetManualExecution', () => {
    beforeEach(async () => {
      await presenter.handleProgressUpdate(1, 10);
      jest.clearAllMocks();
    });

    it('should hide overlay and reset state', () => {
      presenter.resetManualExecution();

      expect(mockView.hideOverlay).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Resetting manual execution state');
    });

    it('should clear watchdog timer', () => {
      presenter.resetManualExecution();

      // Advance time and verify no warning
      jest.advanceTimersByTime(15000);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should not hide overlay when not shown', async () => {
      const mockSettings = createMockSystemSettings({
        getAutoFillProgressDialogMode: jest.fn().mockReturnValue('hidden'),
      });
      mockSystemSettingsRepository.load.mockResolvedValue(Result.success(mockSettings));

      presenter = new AutoFillToolContentScriptPresenter({
        view: mockView,
        systemSettingsRepository: mockSystemSettingsRepository,
        logger: mockLogger,
      });

      await presenter.handleProgressUpdate(1, 10);
      jest.clearAllMocks();

      presenter.resetManualExecution();

      expect(mockView.hideOverlay).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clear watchdog timer', async () => {
      await presenter.handleProgressUpdate(1, 10);
      presenter.cleanup();

      // Advance time and verify no warning
      jest.advanceTimersByTime(15000);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should handle cleanup when no timer is active', () => {
      expect(() => presenter.cleanup()).not.toThrow();
    });
  });

  describe('watchdog timer', () => {
    beforeEach(async () => {
      await presenter.handleProgressUpdate(1, 10);
      jest.clearAllMocks();
    });

    it('should trigger warning after 10 seconds of no updates', async () => {
      // Advance timer by 10 seconds
      jest.advanceTimersByTime(10000);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No progress updates for 10 seconds, assuming auto-fill finished or failed'
      );
      expect(mockView.hideOverlay).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Resetting manual execution state');
    });

    it('should not trigger warning if progress updates continue', async () => {
      // Update at 5 seconds
      jest.advanceTimersByTime(5000);
      await presenter.handleProgressUpdate(2, 10);

      // Update at 10 seconds (5 seconds after first update)
      jest.advanceTimersByTime(5000);
      await presenter.handleProgressUpdate(3, 10);

      // Advance another 5 seconds (total 10 seconds from last update)
      jest.advanceTimersByTime(5000);

      // Should not warn yet
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should reset timer on each progress update', async () => {
      // Advance 9 seconds
      jest.advanceTimersByTime(9000);

      // Update progress (resets timer)
      await presenter.handleProgressUpdate(2, 10);

      // Advance another 9 seconds (total 18 seconds, but only 9 since last update)
      jest.advanceTimersByTime(9000);

      // Should not warn yet
      expect(mockLogger.warn).not.toHaveBeenCalled();

      // Advance 1 more second (10 seconds since last update)
      jest.advanceTimersByTime(1000);

      // Now should warn
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No progress updates for 10 seconds, assuming auto-fill finished or failed'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle progress update with zero total', async () => {
      await presenter.handleProgressUpdate(0, 0);

      expect(mockView.dispatchProgressEvent).toHaveBeenCalledWith(0, 0, undefined);
    });

    it('should handle progress update with current > total', async () => {
      await presenter.handleProgressUpdate(15, 10, 'Overrun');

      expect(mockView.dispatchProgressEvent).toHaveBeenCalledWith(15, 10, 'Overrun');
      expect(mockLogger.info).toHaveBeenCalledWith('Auto-fill execution complete, hiding overlay');
    });

    it('should handle multiple rapid updates', async () => {
      for (let i = 1; i <= 10; i++) {
        await presenter.handleProgressUpdate(i, 10, `Step ${i}`);
      }

      // First update loads settings, subsequent updates don't
      expect(mockSystemSettingsRepository.load).toHaveBeenCalledTimes(1);
      expect(mockView.dispatchProgressEvent).toHaveBeenCalledTimes(10);
    });

    it('should handle empty description string', async () => {
      await presenter.handleProgressUpdate(1, 10, '');

      expect(mockView.updateStepDescription).toHaveBeenCalledWith('');
      expect(mockView.dispatchProgressEvent).toHaveBeenCalledWith(1, 10, '');
    });

    it('should handle very long description', async () => {
      const longDescription = 'A'.repeat(500);
      await presenter.handleProgressUpdate(1, 10, longDescription);

      expect(mockView.updateStepDescription).toHaveBeenCalledWith(longDescription);
      expect(mockView.dispatchProgressEvent).toHaveBeenCalledWith(1, 10, longDescription);
    });
  });
});
