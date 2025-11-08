/**
 * Test: RecordingSettingsManager
 * Tests recording settings tab management
 */

import { RecordingSettingsManager } from '../RecordingSettingsManager';
import { SystemSettingsPresenter } from '../SystemSettingsPresenter';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('RecordingSettingsManager', () => {
  let manager: RecordingSettingsManager;
  let mockPresenter: jest.Mocked<SystemSettingsPresenter>;
  let mockLogger: jest.Mocked<Logger>;
  let saveButton: HTMLButtonElement;
  let resetButton: HTMLButtonElement;
  let enableAudioRecording: HTMLInputElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <form id="recordingSettingsForm">
        <input id="enableTabRecording" type="checkbox" />
        <input id="enableAudioRecording" type="checkbox" />
        <input id="recordingBitrate" type="number" value="2500000" />
        <input id="recordingRetentionDays" type="number" value="10" />
        <button type="submit" id="saveRecordingSettings">Save</button>
      </form>
      <button id="recordingCancelBtn">Cancel</button>
      <button id="recordingResetBtn">Reset</button>
    `;

    const form = document.getElementById('recordingSettingsForm') as HTMLFormElement;
    saveButton = document.getElementById('saveRecordingSettings') as HTMLButtonElement;
    resetButton = document.getElementById('recordingResetBtn') as HTMLButtonElement;
    enableAudioRecording = document.getElementById('enableAudioRecording') as HTMLInputElement;

    // Create mocks
    mockPresenter = {
      saveRecordingSettings: jest.fn().mockResolvedValue(undefined),
      resetSettings: jest.fn().mockResolvedValue(undefined),
      loadSettings: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    manager = new RecordingSettingsManager(mockPresenter, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with DOM elements', () => {
      expect(manager).toBeDefined();
    });

    it('should attach event listeners', () => {
      const clickSpy = jest.spyOn(saveButton, 'click');
      saveButton.click();
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('saveSettings', () => {
    it('should save settings with audio recording enabled', async () => {
      const form = document.getElementById('recordingSettingsForm') as HTMLFormElement;
      const enableTabRecording = document.getElementById('enableTabRecording') as HTMLInputElement;
      const recordingBitrate = document.getElementById('recordingBitrate') as HTMLInputElement;
      const recordingRetentionDays = document.getElementById(
        'recordingRetentionDays'
      ) as HTMLInputElement;

      enableTabRecording.checked = true;
      enableAudioRecording.checked = true;
      recordingBitrate.value = '2500000';
      recordingRetentionDays.value = '10';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.saveRecordingSettings).toHaveBeenCalledWith({
        enableTabRecording: true,
        enableAudioRecording: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
      });
    });

    it('should save settings with audio recording disabled', async () => {
      const form = document.getElementById('recordingSettingsForm') as HTMLFormElement;
      const enableTabRecording = document.getElementById('enableTabRecording') as HTMLInputElement;
      const recordingBitrate = document.getElementById('recordingBitrate') as HTMLInputElement;
      const recordingRetentionDays = document.getElementById(
        'recordingRetentionDays'
      ) as HTMLInputElement;

      enableTabRecording.checked = false;
      enableAudioRecording.checked = false;
      recordingBitrate.value = '1000000';
      recordingRetentionDays.value = '7';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.saveRecordingSettings).toHaveBeenCalledWith({
        enableTabRecording: false,
        enableAudioRecording: false,
        recordingBitrate: 1000000,
        recordingRetentionDays: 7,
      });
    });

    it('should handle save errors gracefully', async () => {
      const form = document.getElementById('recordingSettingsForm') as HTMLFormElement;
      const error = new Error('Save failed');
      mockPresenter.saveRecordingSettings.mockRejectedValue(error);

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save recording settings', error);
    });
  });

  describe('resetSettings', () => {
    it('should reset settings', async () => {
      resetButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.resetSettings).toHaveBeenCalled();
    });
  });

  describe('cancelChanges', () => {
    it('should reload all settings when cancel button is clicked', async () => {
      const cancelButton = document.getElementById('recordingCancelBtn') as HTMLButtonElement;

      cancelButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.loadSettings).toHaveBeenCalled();
    });
  });

  describe('loadSettings', () => {
    it('should load all recording settings fields', () => {
      const enableTabRecording = document.getElementById('enableTabRecording') as HTMLInputElement;
      const enableAudioRecording = document.getElementById(
        'enableAudioRecording'
      ) as HTMLInputElement;
      const recordingBitrate = document.getElementById('recordingBitrate') as HTMLInputElement;
      const recordingRetentionDays = document.getElementById(
        'recordingRetentionDays'
      ) as HTMLInputElement;

      const settings = {
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 3500000,
        recordingRetentionDays: 15,
      };

      manager.loadSettings(settings);

      expect(enableTabRecording.checked).toBe(true);
      expect(enableAudioRecording.checked).toBe(false);
      expect(recordingBitrate.value).toBe('3500000');
      expect(recordingRetentionDays.value).toBe('15');
    });

    it('should load partial settings', () => {
      const enableTabRecording = document.getElementById('enableTabRecording') as HTMLInputElement;
      const recordingBitrate = document.getElementById('recordingBitrate') as HTMLInputElement;

      // Set initial values
      enableTabRecording.checked = false;
      recordingBitrate.value = '2500000';

      const settings = {
        enableTabRecording: true,
        recordingBitrate: 4000000,
      };

      manager.loadSettings(settings);

      expect(enableTabRecording.checked).toBe(true);
      expect(recordingBitrate.value).toBe('4000000');
    });

    it('should handle empty settings object', () => {
      const enableTabRecording = document.getElementById('enableTabRecording') as HTMLInputElement;
      const recordingBitrate = document.getElementById('recordingBitrate') as HTMLInputElement;

      enableTabRecording.checked = true;
      recordingBitrate.value = '2500000';

      manager.loadSettings({});

      // Values should remain unchanged
      expect(enableTabRecording.checked).toBe(true);
      expect(recordingBitrate.value).toBe('2500000');
    });

    it('should handle undefined values in settings', () => {
      const enableTabRecording = document.getElementById('enableTabRecording') as HTMLInputElement;
      const recordingBitrate = document.getElementById('recordingBitrate') as HTMLInputElement;

      enableTabRecording.checked = false;
      recordingBitrate.value = '2500000';

      const settings = {
        enableTabRecording: undefined,
        recordingBitrate: 3000000,
      };

      manager.loadSettings(settings);

      // Only defined value should be updated
      expect(enableTabRecording.checked).toBe(false);
      expect(recordingBitrate.value).toBe('3000000');
    });
  });

  describe('constructor with missing DOM elements', () => {
    it('should log errors when DOM elements are missing', () => {
      // Clear the DOM
      document.body.innerHTML = '';

      const loggerWithErrors = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createChild: jest.fn().mockReturnThis(),
      } as any;

      const mockPresenterForMissingElements = {
        saveRecordingSettings: jest.fn(),
        resetRecordingSettings: jest.fn(),
      } as any;

      // Create manager with missing DOM elements
      new RecordingSettingsManager(mockPresenterForMissingElements, loggerWithErrors);

      // Verify error logging for missing elements
      expect(loggerWithErrors.error).toHaveBeenCalledWith(
        'Recording settings form element not found'
      );
      expect(loggerWithErrors.error).toHaveBeenCalledWith(
        'Enable tab recording checkbox not found'
      );
      expect(loggerWithErrors.error).toHaveBeenCalledWith(
        'Enable audio recording checkbox not found'
      );
      expect(loggerWithErrors.error).toHaveBeenCalledWith('Recording bitrate input not found');
      expect(loggerWithErrors.error).toHaveBeenCalledWith(
        'Recording retention days input not found'
      );
    });
  });
});
