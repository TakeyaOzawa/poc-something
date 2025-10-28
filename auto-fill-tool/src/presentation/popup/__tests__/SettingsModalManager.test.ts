/**
 * Unit Tests: SettingsModalManager
 */

import { SettingsModalManager } from '../SettingsModalManager';
import { ChromeStorageSystemSettingsRepository } from '@infrastructure/repositories/ChromeStorageSystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  i18n: {
    getMessage: jest.fn((key: string) => {
      // Return the key as default, or specific mock values if needed
      return key;
    }),
  },
}));

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: { [key: string]: string } = {
        settingsLoadFailed: 'settingsLoadFailed',
        systemSettingsSaved: 'systemSettingsSaved',
        systemSettingsSaveFailed: 'systemSettingsSaveFailed',
      };
      return messages[key] || key;
    }),
  },
}));

// Mock DOM elements
const createMockElement = (value: string = ''): any => ({
  value,
  checked: false,
  textContent: '',
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
  addEventListener: jest.fn(),
});

describe('SettingsModalManager', () => {
  let manager: SettingsModalManager;
  let mockRepository: jest.Mocked<ChromeStorageSystemSettingsRepository>;
  let mockLogger: jest.Mocked<Logger>;
  let mockElements: any;

  beforeEach(() => {
    // Setup mock DOM elements
    mockElements = {
      settingsModal: createMockElement(),
      settingsForm: createMockElement(),
      retryWaitSecondsMin: createMockElement('1'),
      retryWaitSecondsMax: createMockElement('3'),
      retryCount: createMockElement('5'),
      waitForOptionsMilliseconds: createMockElement('100'),
      autoFillProgressDialogMode: createMockElement('withCancel'),
      logLevel: createMockElement('1'),
      enableTabRecording: createMockElement(),
      enableAudioRecording: createMockElement(),
      recordingBitrate: createMockElement('2500'),
      recordingRetentionDays: createMockElement('10'),
      gradientStartColor: createMockElement('#667eea'),
      gradientStartColorText: createMockElement('#667eea'),
      gradientEndColor: createMockElement('#764ba2'),
      gradientEndColorText: createMockElement('#764ba2'),
      gradientAngle: createMockElement('135'),
      gradientAngleDisplay: createMockElement(),
      settingsResetBtn: createMockElement(),
    };
    mockElements.enableTabRecording.checked = true;
    mockElements.enableAudioRecording.checked = false;
    mockElements.gradientAngleDisplay.textContent = '135°';

    // Mock document.getElementById
    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      return mockElements[id] || null;
    });

    // Mock repository
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    manager = new SettingsModalManager(mockRepository, mockLogger);

    // Mock alert
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeAll(() => {
    // Mock document.body.style for gradient background
    Object.defineProperty(document.body, 'style', {
      writable: true,
      value: {
        background: '',
      },
    });
  });

  describe('openSettingsModal', () => {
    it('should load and display settings', async () => {
      const mockSettings = new SystemSettingsCollection({
        retryWaitSecondsMin: 2,
        retryWaitSecondsMax: 5,
        retryCount: 10,
        waitForOptionsMilliseconds: 200,
        autoFillProgressDialogMode: 'hidden',
        logLevel: 2,
        enableTabRecording: false,
        enableAudioRecording: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        gradientStartColor: '#4158d0',
        gradientEndColor: '#c850c0',
        gradientAngle: 90,
      });

      mockRepository.load.mockResolvedValue(Result.success(mockSettings));

      await manager.openSettingsModal();

      expect(mockRepository.load).toHaveBeenCalled();
      expect(mockElements.retryWaitSecondsMin.value).toBe('2');
      expect(mockElements.retryWaitSecondsMax.value).toBe('5');
      expect(mockElements.retryCount.value).toBe('10');
      expect(mockElements.waitForOptionsMilliseconds.value).toBe('200');
      expect(mockElements.autoFillProgressDialogMode.value).toBe('hidden');
      expect(mockElements.logLevel.value).toBe('2');
      expect(mockElements.enableTabRecording.checked).toBe(false);
      expect(mockElements.enableAudioRecording.checked).toBe(true);
      expect(mockElements.recordingBitrate.value).toBe('2500');
      expect(mockElements.recordingRetentionDays.value).toBe('10');
      expect(mockElements.gradientStartColor.value).toBe('#4158d0');
      expect(mockElements.gradientStartColorText.value).toBe('#4158d0');
      expect(mockElements.gradientEndColor.value).toBe('#c850c0');
      expect(mockElements.gradientEndColorText.value).toBe('#c850c0');
      expect(mockElements.gradientAngle.value).toBe('90');
      expect(mockElements.gradientAngleDisplay.textContent).toBe('90°');
      expect(mockElements.settingsModal.classList.add).toHaveBeenCalledWith('show');
    });

    it('should handle load error', async () => {
      mockRepository.load.mockRejectedValue(new Error('Load failed'));

      await manager.openSettingsModal();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load settings', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('settingsLoadFailed');
    });
  });

  describe('closeSettingsModal', () => {
    it('should close the settings modal', () => {
      manager.closeSettingsModal();

      expect(mockElements.settingsModal.classList.remove).toHaveBeenCalledWith('show');
    });
  });

  describe('saveSettings', () => {
    it('should save settings successfully', async () => {
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      await manager.saveSettings();

      expect(mockRepository.save).toHaveBeenCalledWith(expect.any(SystemSettingsCollection));
      expect(mockElements.settingsModal.classList.remove).toHaveBeenCalledWith('show');
      expect(global.alert).toHaveBeenCalledWith('systemSettingsSaved');
    });

    it('should handle save error', async () => {
      mockRepository.save.mockRejectedValue(new Error('Save failed'));

      await manager.saveSettings();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save settings', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('systemSettingsSaveFailed');
    });

    it('should save all settings values', async () => {
      mockElements.retryWaitSecondsMin.value = '3';
      mockElements.retryWaitSecondsMax.value = '7';
      mockElements.retryCount.value = '15';
      mockElements.waitForOptionsMilliseconds.value = '300';
      mockElements.autoFillProgressDialogMode.value = 'withCancel';
      mockElements.logLevel.value = '3';
      mockElements.enableTabRecording.checked = true;
      mockElements.enableAudioRecording.checked = true;
      mockElements.recordingBitrate.value = '3500';
      mockElements.recordingRetentionDays.value = '15';
      mockElements.gradientStartColorText.value = '#ff0000';
      mockElements.gradientEndColorText.value = '#00ff00';
      mockElements.gradientAngle.value = '180';

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      await manager.saveSettings();

      const savedSettings = mockRepository.save.mock.calls[0][0] as SystemSettingsCollection;
      expect(savedSettings.getRetryWaitSecondsMin()).toBe(3);
      expect(savedSettings.getRetryWaitSecondsMax()).toBe(7);
      expect(savedSettings.getRetryCount()).toBe(15);
      expect(savedSettings.getWaitForOptionsMilliseconds()).toBe(300);
      expect(savedSettings.getAutoFillProgressDialogMode()).toBe('withCancel');
      expect(savedSettings.getLogLevel()).toBe(3);
      expect(savedSettings.getEnableTabRecording()).toBe(true);
      expect(savedSettings.getEnableAudioRecording()).toBe(true);
      expect(savedSettings.getRecordingBitrate()).toBe(3500000);
      expect(savedSettings.getRecordingRetentionDays()).toBe(15);
      expect(savedSettings.getGradientStartColor()).toBe('#ff0000');
      expect(savedSettings.getGradientEndColor()).toBe('#00ff00');
      expect(savedSettings.getGradientAngle()).toBe(180);
    });

    it('should apply gradient background when saving', async () => {
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      await manager.saveSettings();

      expect(document.body.style.background).toContain('linear-gradient');
    });
  });

  describe('resetSettings', () => {
    beforeEach(() => {
      // Mock confirm
      global.confirm = jest.fn();
    });

    it('should reset settings when user confirms', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      await manager.resetSettings();

      expect(global.confirm).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(expect.any(SystemSettingsCollection));
      expect(global.alert).toHaveBeenCalledWith('settingsResetCompleted');
    });

    it('should not reset settings when user cancels', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      await manager.resetSettings();

      expect(global.confirm).toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(global.alert).not.toHaveBeenCalled();
    });

    it('should handle reset error', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      mockRepository.save.mockRejectedValue(new Error('Reset failed'));

      await manager.resetSettings();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to reset settings', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('settingsResetFailed');
    });

    it('should apply default gradient when resetting', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      await manager.resetSettings();

      expect(document.body.style.background).toContain('linear-gradient');
    });
  });

  describe('loadSettingsWithRetry', () => {
    it('should retry loading settings on failure', async () => {
      mockRepository.load
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce(
          Result.success(
            new SystemSettingsCollection({
              retryWaitSecondsMin: 1,
              retryWaitSecondsMax: 3,
              retryCount: 5,
              waitForOptionsMilliseconds: 100,
              autoFillProgressDialogMode: 'withCancel',
              logLevel: 1,
              enableTabRecording: true,
              enableAudioRecording: false,
              recordingBitrate: 2500000,
              recordingRetentionDays: 10,
              gradientStartColor: '#667eea',
              gradientEndColor: '#764ba2',
              gradientAngle: 135,
            })
          )
        );

      await manager.openSettingsModal();

      expect(mockRepository.load).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockElements.settingsModal.classList.add).toHaveBeenCalledWith('show');
    });

    it('should fail after all retry attempts', async () => {
      mockRepository.load.mockRejectedValue(new Error('Persistent failure'));

      await manager.openSettingsModal();

      expect(mockRepository.load).toHaveBeenCalledTimes(3);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load settings', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('settingsLoadFailed');
    });
  });

  describe('constructor event listeners', () => {
    it('should sync gradient angle input with display', () => {
      const angleInput = mockElements.gradientAngle;
      const eventListener = angleInput.addEventListener.mock.calls[0][1];

      const event = {
        target: { value: '270' },
      };

      eventListener(event);

      expect(mockElements.gradientAngleDisplay.textContent).toBe('270°');
    });

    it('should sync gradient start color picker with text input', () => {
      const colorInput = mockElements.gradientStartColor;
      const eventListener = colorInput.addEventListener.mock.calls[0][1];

      const event = {
        target: { value: '#ff0000' },
      };

      eventListener(event);

      expect(mockElements.gradientStartColorText.value).toBe('#ff0000');
    });

    it('should sync gradient start text input with color picker for valid hex', () => {
      const textInput = mockElements.gradientStartColorText;
      const eventListener = textInput.addEventListener.mock.calls[0][1];

      const event = {
        target: { value: '#00ff00' },
      };

      eventListener(event);

      expect(mockElements.gradientStartColor.value).toBe('#00ff00');
    });

    it('should not sync gradient start text input with color picker for invalid hex', () => {
      const textInput = mockElements.gradientStartColorText;
      const eventListener = textInput.addEventListener.mock.calls[0][1];
      const originalValue = mockElements.gradientStartColor.value;

      const event = {
        target: { value: '#zzzzzz' },
      };

      eventListener(event);

      expect(mockElements.gradientStartColor.value).toBe(originalValue);
    });

    it('should sync gradient end color picker with text input', () => {
      const colorInput = mockElements.gradientEndColor;
      const eventListener = colorInput.addEventListener.mock.calls[0][1];

      const event = {
        target: { value: '#0000ff' },
      };

      eventListener(event);

      expect(mockElements.gradientEndColorText.value).toBe('#0000ff');
    });

    it('should sync gradient end text input with color picker for valid hex', () => {
      const textInput = mockElements.gradientEndColorText;
      const eventListener = textInput.addEventListener.mock.calls[0][1];

      const event = {
        target: { value: '#ffff00' },
      };

      eventListener(event);

      expect(mockElements.gradientEndColor.value).toBe('#ffff00');
    });

    it('should not sync gradient end text input with color picker for invalid hex', () => {
      const textInput = mockElements.gradientEndColorText;
      const eventListener = textInput.addEventListener.mock.calls[0][1];
      const originalValue = mockElements.gradientEndColor.value;

      const event = {
        target: { value: 'invalid' },
      };

      eventListener(event);

      expect(mockElements.gradientEndColor.value).toBe(originalValue);
    });
  });
});
